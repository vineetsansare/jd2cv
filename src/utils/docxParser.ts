/**
 * DOCX Parser — Extracts structured text sections from a DOCX file while
 * preserving the complete XML layout shell for later content re-injection.
 *
 * A DOCX file is a ZIP archive containing XML files. The main content lives in
 * `word/document.xml`. This parser:
 *   1. Unzips the DOCX
 *   2. Parses `document.xml` to extract text organized by paragraphs
 *   3. Detects resume sections (Experience, Education, Skills, etc.)
 *   4. Returns both the structured content AND the raw ZIP entries so that
 *      `docxWriter.ts` can inject new content while preserving all styling.
 */

import JSZip from 'jszip';

// ─── Types ───────────────────────────────────────────────────────────────────

/** A single paragraph extracted from the DOCX, with its raw XML preserved. */
export interface DocxParagraph {
  /** The plain text content of this paragraph. */
  text: string;
  /** The raw XML string of the <w:p> element (used for style preservation). */
  rawXml: string;
  /** Index of this paragraph in the document body (0-based). */
  index: number;
  /** Whether this paragraph appears to be a section heading. */
  isHeading: boolean;
  /** Detected heading level (1 = H1, 2 = H2, etc.) or 0 if not a heading. */
  headingLevel: number;
}

/** A detected resume section with its paragraphs. */
export interface DocxSection {
  /** Unique ID for this section (e.g. "experience", "education_0"). */
  id: string;
  /** Display name of the section (e.g. "Professional Experience"). */
  title: string;
  /** The heading paragraph. */
  heading: DocxParagraph;
  /** All body paragraphs under this section. */
  paragraphs: DocxParagraph[];
}

/** Complete parsed result from a DOCX file. */
export interface DocxParseResult {
  /** All paragraphs in document order. */
  allParagraphs: DocxParagraph[];
  /** Detected resume sections. */
  sections: DocxSection[];
  /** The raw JSZip instance — needed by docxWriter to rebuild the file. */
  zip: JSZip;
  /** The raw document.xml string. */
  documentXml: string;
  /** Plain text of the entire document (for LLM consumption). */
  plainText: string;
}

// ─── Section Detection ───────────────────────────────────────────────────────

const SECTION_PATTERNS: { pattern: RegExp; id: string }[] = [
  { pattern: /^(executive\s+)?profile$/i, id: 'profile' },
  { pattern: /^(professional\s+)?summary$/i, id: 'summary' },
  { pattern: /^(professional\s+|work\s+)?experience$/i, id: 'experience' },
  { pattern: /^(employment|career)\s*(history)?$/i, id: 'experience' },
  { pattern: /^(technical\s+)?skills(\s+&\s+competencies)?$/i, id: 'skills' },
  { pattern: /^(core\s+)?competencies$/i, id: 'skills' },
  { pattern: /^education(al\s+background)?$/i, id: 'education' },
  { pattern: /^(awards?\s*(&|and)?\s*)?recognitions?$/i, id: 'awards' },
  { pattern: /^certifications?$/i, id: 'certifications' },
  { pattern: /^projects?$/i, id: 'projects' },
  { pattern: /^(volunteer|community)\s*(work|service)?$/i, id: 'volunteer' },
  { pattern: /^publications?$/i, id: 'publications' },
  { pattern: /^languages?$/i, id: 'languages' },
  { pattern: /^(personal\s+)?interests?(\s*&\s*hobbies)?$/i, id: 'interests' },
  { pattern: /^references?$/i, id: 'references' },
  { pattern: /^(key\s+)?(achievements?|accomplishments?)$/i, id: 'achievements' },
  { pattern: /^objective$/i, id: 'objective' },
];

function detectSectionId(text: string): string | null {
  const clean = text.replace(/[^a-zA-Z\s&]/g, '').trim();
  for (const { pattern, id } of SECTION_PATTERNS) {
    if (pattern.test(clean)) return id;
  }
  return null;
}

// ─── XML Helpers ─────────────────────────────────────────────────────────────

/** Extract all text runs from a <w:p> element XML string. */
function extractTextFromParagraphXml(pXml: string): string {
  const parts: string[] = [];
  // Match <w:t ...>text</w:t> elements
  const textRegex = /<w:t[^>]*>([\s\S]*?)<\/w:t>/g;
  let match: RegExpExecArray | null;
  while ((match = textRegex.exec(pXml)) !== null) {
    parts.push(match[1]);
  }
  return parts.join('');
}

/** Detect if a paragraph has a heading style (e.g. w:pStyle w:val="Heading1"). */
function detectHeadingLevel(pXml: string): number {
  // Look for <w:pStyle w:val="Heading1"/> through Heading9
  const styleMatch = pXml.match(/<w:pStyle\s+w:val="Heading(\d)"\s*\/>/i);
  if (styleMatch) return parseInt(styleMatch[1], 10);

  // Some DOCX files use Title style for the name
  if (/<w:pStyle\s+w:val="Title"\s*\/>/i.test(pXml)) return 1;
  if (/<w:pStyle\s+w:val="Subtitle"\s*\/>/i.test(pXml)) return 2;

  // Heuristic: if entire paragraph is bold and short, it might be a heading
  // Count bold runs vs total runs
  const allRuns = pXml.match(/<w:r\b/g)?.length || 0;
  const boldRuns = pXml.match(/<w:b\s*\/>/g)?.length || 0;
  const text = extractTextFromParagraphXml(pXml).trim();

  if (allRuns > 0 && boldRuns >= allRuns && text.length > 0 && text.length < 60) {
    // Check if it matches a known section name
    if (detectSectionId(text)) return 2;
  }

  return 0;
}

// ─── Main Parser ─────────────────────────────────────────────────────────────

/**
 * Parse a DOCX file (as ArrayBuffer) and extract structured sections.
 * The returned `DocxParseResult` contains everything needed for the
 * layout-preservation pipeline.
 */
export async function parseDocx(fileBuffer: ArrayBuffer): Promise<DocxParseResult> {
  const zip = await JSZip.loadAsync(fileBuffer);

  // Read the main document XML
  const docXmlFile = zip.file('word/document.xml');
  if (!docXmlFile) {
    throw new Error('Invalid DOCX file: missing word/document.xml');
  }
  const documentXml = await docXmlFile.async('string');

  // Extract all <w:p> elements (paragraphs) from the document body
  const bodyMatch = documentXml.match(/<w:body>([\s\S]*?)<\/w:body>/);
  if (!bodyMatch) {
    throw new Error('Invalid DOCX file: missing <w:body> element');
  }
  const bodyContent = bodyMatch[1];

  // Split into individual <w:p>...</w:p> elements
  // Use a non-greedy approach that handles nested elements
  const paragraphXmls: string[] = [];
  const pRegex = /<w:p\b[^>]*>[\s\S]*?<\/w:p>/g;
  let pMatch: RegExpExecArray | null;
  while ((pMatch = pRegex.exec(bodyContent)) !== null) {
    paragraphXmls.push(pMatch[0]);
  }

  // Parse each paragraph
  const allParagraphs: DocxParagraph[] = paragraphXmls.map((rawXml, index) => {
    const text = extractTextFromParagraphXml(rawXml);
    const headingLevel = detectHeadingLevel(rawXml);
    return {
      text,
      rawXml,
      index,
      isHeading: headingLevel > 0,
      headingLevel,
    };
  });

  // Group paragraphs into sections
  const sections: DocxSection[] = [];
  let currentSection: DocxSection | null = null;
  const sectionIdCounts: Record<string, number> = {};

  for (const para of allParagraphs) {
    if (para.isHeading && para.text.trim()) {
      // Start a new section
      const baseId = detectSectionId(para.text) || 'section';
      const count = sectionIdCounts[baseId] || 0;
      sectionIdCounts[baseId] = count + 1;
      const id = count > 0 ? `${baseId}_${count}` : baseId;

      currentSection = {
        id,
        title: para.text.trim(),
        heading: para,
        paragraphs: [],
      };
      sections.push(currentSection);
    } else if (currentSection && para.text.trim()) {
      currentSection.paragraphs.push(para);
    }
  }

  // Build plain text for LLM consumption
  const plainText = allParagraphs
    .map(p => p.text)
    .filter(t => t.trim())
    .join('\n');

  return {
    allParagraphs,
    sections,
    zip,
    documentXml,
    plainText,
  };
}

/**
 * Extract just the plain text from a DOCX file.
 * Simpler alternative to `parseDocx` when you only need text content.
 */
export async function extractDocxText(fileBuffer: ArrayBuffer): Promise<string> {
  const result = await parseDocx(fileBuffer);
  return result.plainText;
}
