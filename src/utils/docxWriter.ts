/**
 * DOCX Writer — Injects optimized content back into a parsed DOCX while
 * preserving the original document's styling, fonts, colors, and layout.
 *
 * Strategy: We find each paragraph's raw XML in `document.xml` and replace
 * only the text run content (<w:t>) while keeping all formatting runs (<w:rPr>),
 * paragraph properties (<w:pPr>), and structural elements intact.
 */

import type { DocxParseResult, DocxParagraph } from './docxParser';
import type { CVState } from './llm';

// ─── Types ───────────────────────────────────────────────────────────────────

/** Maps paragraph indices to their new text content. */
export interface ContentReplacements {
  [paragraphIndex: number]: string;
}

// ─── XML Helpers ─────────────────────────────────────────────────────────────

/**
 * Replace text content in a <w:p> XML element while preserving all formatting.
 * 
 * Strategy:
 * 1. Normalizes bullets: strips leading bullet markers if the paragraph has native Word bullets (<w:numPr>).
 * 2. Formats bold text: converts **bold** segments into <w:r><w:rPr><w:b/></w:rPr><w:t> runs.
 * 3. Preserves base run formatting (<w:rPr>) such as font family, size, and color.
 * 4. Preserves paragraph properties (<w:pPr>).
 */
function replaceTextInParagraphXml(pXml: string, newText: string): string {
  if (!newText.trim()) return pXml;

  // If paragraph has native Word bullet list (<w:numPr>), strip leading bullet symbols
  let cleanText = newText;
  if (pXml.includes('<w:numPr')) {
    cleanText = cleanText.replace(/^[-*•]\s*/, '');
  }

  // Extract base run properties <w:rPr> from first run if present
  const rPrMatch = pXml.match(/<w:rPr>([\s\S]*?)<\/w:rPr>/);
  const baseRPr = rPrMatch ? rPrMatch[1].replace(/<w:b\s*\/?>|<w:b\s+[^>]*\/>/g, '') : '';

  // Split text into normal and bold chunks: **bold**
  const parts: { text: string; bold: boolean }[] = [];
  const regex = /\*\*(.*?)\*\*/g;
  let lastIdx = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(cleanText)) !== null) {
    if (match.index > lastIdx) {
      parts.push({ text: cleanText.substring(lastIdx, match.index), bold: false });
    }
    parts.push({ text: match[1], bold: true });
    lastIdx = regex.lastIndex;
  }
  if (lastIdx < cleanText.length) {
    parts.push({ text: cleanText.substring(lastIdx), bold: false });
  }

  const runsXml = parts.map(p => {
    const rPrContent = p.bold ? (baseRPr ? baseRPr + '<w:b/>' : '<w:b/>') : baseRPr;
    const rPrTag = rPrContent ? `<w:rPr>${rPrContent}</w:rPr>` : '';
    return `<w:r>${rPrTag}<w:t xml:space="preserve">${escapeXml(p.text)}</w:t></w:r>`;
  }).join('');

  // Extract <w:pPr>...</w:pPr> if present
  const pPrMatch = pXml.match(/<w:pPr>[\s\S]*?<\/w:pPr>/);
  const pPrXml = pPrMatch ? pPrMatch[0] : '';

  // Get paragraph opening tag (with attributes if any)
  const openTagMatch = pXml.match(/^<w:p[^>]*>/);
  const openTag = openTagMatch ? openTagMatch[0] : '<w:p>';

  return `${openTag}${pPrXml}${runsXml}</w:p>`;
}

/**
 * Replace text across multiple paragraphs in the DOCX body.
 * When the LLM returns more content items than original paragraphs in a section,
 * we clone the last paragraph's XML (preserving its style) for each extra item.
 * When it returns fewer, we keep the extra paragraphs but clear their text.
 */
function applyReplacementsToBody(
  bodyXml: string,
  paragraphs: DocxParagraph[],
  replacements: ContentReplacements
): string {
  let result = bodyXml;

  // Process replacements in reverse order to preserve indices
  const sortedIndices = Object.keys(replacements)
    .map(Number)
    .sort((a, b) => b - a);

  for (const idx of sortedIndices) {
    const para = paragraphs[idx];
    if (!para) continue;

    const newText = replacements[idx];
    const newParagraphXml = replaceTextInParagraphXml(para.rawXml, newText);
    result = result.replace(para.rawXml, newParagraphXml);
  }

  return result;
}

/** Escape special XML characters. */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ─── Main Writer ─────────────────────────────────────────────────────────────

/**
 * Build content replacements from the LLM's structured CVState output,
 * mapping optimized text back to the original document's paragraph indices.
 */
export function buildReplacementsFromCVState(
  parseResult: DocxParseResult,
  cvState: CVState
): ContentReplacements {
  const replacements: ContentReplacements = {};

  // 1. Replace header (name/title) — typically the first 1-2 paragraphs
  const headerParas = parseResult.allParagraphs.filter(
    p => p.headingLevel === 1 || (p.index < 3 && !p.isHeading && p.text.trim())
  );
  if (headerParas.length >= 1 && cvState.header.name) {
    replacements[headerParas[0].index] = cvState.header.name;
  }
  if (headerParas.length >= 2 && cvState.header.title) {
    replacements[headerParas[1].index] = cvState.header.title;
  }

  // 2. Prepare normalized sections from CVState
  const sectionsToProcess: { id: string; content: string[] }[] = [];

  if (cvState.summary) {
    sectionsToProcess.push({ id: 'summary', content: [cvState.summary] });
  }

  if (cvState.experience && cvState.experience.length > 0) {
    const expLines: string[] = [];
    for (const exp of cvState.experience) {
      expLines.push(`${exp.role} | ${exp.dates}`);
      expLines.push(`${exp.company} | ${exp.location}`);
      for (const bullet of exp.bullets) {
        expLines.push(bullet);
      }
    }
    sectionsToProcess.push({ id: 'experience', content: expLines });
  }

  if (cvState.skills && cvState.skills.length > 0) {
    const skillLines = cvState.skills.map(s => `${s.category}: ${s.items.join(', ')}`);
    sectionsToProcess.push({ id: 'skills', content: skillLines });
  }

  if (cvState.education && cvState.education.length > 0) {
    const eduLines: string[] = [];
    for (const edu of cvState.education) {
      eduLines.push(`${edu.degree} | ${edu.dates}`);
      eduLines.push(`${edu.school}${edu.location ? ` | ${edu.location}` : ''}`);
    }
    sectionsToProcess.push({ id: 'education', content: eduLines });
  }

  if (cvState.awards && cvState.awards.length > 0) {
    const awardLines = cvState.awards.map(a => `${a.title} | ${a.year}${a.organization ? ` | ${a.organization}` : ''}`);
    sectionsToProcess.push({ id: 'awards', content: awardLines });
  }

  if (cvState.additionalSections) {
    for (const sec of cvState.additionalSections) {
      sectionsToProcess.push({ id: sec.id, content: sec.content });
    }
  }

  // 3. Map prepared sections to parsed DOCX sections
  for (const section of sectionsToProcess) {
    const matchingDocSection = parseResult.sections.find(
      s => s.id === section.id || 
           s.title.toLowerCase().includes(section.id.toLowerCase()) ||
           section.id.toLowerCase().includes(s.id.toLowerCase())
    );

    if (!matchingDocSection) continue;

    const bodyParas = matchingDocSection.paragraphs;
    const contentItems = section.content;

    for (let i = 0; i < Math.min(bodyParas.length, contentItems.length); i++) {
      replacements[bodyParas[i].index] = contentItems[i];
    }

    // If fewer items than paragraphs, clear remaining
    for (let i = contentItems.length; i < bodyParas.length; i++) {
      replacements[bodyParas[i].index] = '';
    }
  }

  return replacements;
}

/**
 * Generate a new DOCX file with optimized content injected into the
 * original document's layout.
 *
 * @param parseResult - The parsed DOCX (from docxParser.ts)
 * @param cvState - The LLM's structured output with optimized content
 * @returns ArrayBuffer of the new DOCX file
 */
export async function generateDocxWithPreservedLayout(
  parseResult: DocxParseResult,
  cvState: CVState
): Promise<Blob> {
  const replacements = buildReplacementsFromCVState(parseResult, cvState);

  // Apply replacements to the document body
  const bodyMatch = parseResult.documentXml.match(
    /(<w:body>)([\s\S]*?)(<\/w:body>)/
  );
  if (!bodyMatch) {
    throw new Error('Could not find <w:body> in document XML');
  }

  const newBodyContent = applyReplacementsToBody(
    bodyMatch[2],
    parseResult.allParagraphs,
    replacements
  );

  const newDocumentXml = parseResult.documentXml.replace(
    bodyMatch[0],
    `${bodyMatch[1]}${newBodyContent}${bodyMatch[3]}`
  );

  // Update the ZIP with the modified document.xml
  const newZip = parseResult.zip;
  newZip.file('word/document.xml', newDocumentXml);

  // Generate the new DOCX file
  const blob = await newZip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  return blob;
}

/**
 * Simple direct replacement — takes a map of old text → new text and performs
 * basic string replacements in the document XML. Useful for quick swaps where
 * full structural mapping isn't needed.
 */
export async function simpleDocxTextReplace(
  parseResult: DocxParseResult,
  textMap: Record<string, string>
): Promise<Blob> {
  let modifiedXml = parseResult.documentXml;

  for (const [oldText, newText] of Object.entries(textMap)) {
    // Replace in XML-escaped form since the text in DOCX XML is escaped
    const escapedOld = escapeXml(oldText);
    const escapedNew = escapeXml(newText);
    modifiedXml = modifiedXml.split(escapedOld).join(escapedNew);
  }

  const newZip = parseResult.zip;
  newZip.file('word/document.xml', modifiedXml);

  return await newZip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });
}

/**
 * Trigger a browser download of a Blob as a file.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
