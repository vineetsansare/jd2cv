import type { 
  StructuredCV, 
  ResumeProfileLink,
  WorkExperienceItem, 
  EducationItem, 
  SkillCategoryItem, 
  ProjectItem, 
  CertificationItem, 
  LanguageItem, 
  AwardItem, 
  VolunteerItem, 
  PublicationItem, 
  InterestItem, 
  ReferenceItem, 
  CustomSectionItem 
} from '../types/cvBuilder';
import { DEFAULT_CV_DATA } from './defaultCvData';

/**
 * Converts a StructuredCV object to clean, ATS-optimized Markdown format.
 * Respects sectionOrder for output ordering.
 */
export function structuredCVToMarkdown(cv: StructuredCV): string {
  const parts: string[] = [];

  // Header
  parts.push(`# ${cv.basics.fullName || 'Candidate Name'}`);
  if (cv.basics.headline) {
    parts.push(`**${cv.basics.headline}**\n`);
  }

  // Contact Info Line
  const contactItems: string[] = [];
  if (cv.basics.email) contactItems.push(cv.basics.email);
  if (cv.basics.phone) contactItems.push(cv.basics.phone);
  if (cv.basics.location) contactItems.push(cv.basics.location);
  if (cv.basics.website) contactItems.push(cv.basics.website);
  
  if (cv.basics.links && cv.basics.links.length > 0) {
    cv.basics.links.forEach(l => {
      if (l.url) contactItems.push(`[${l.network || 'Link'}](${l.url})`);
    });
  }

  if (contactItems.length > 0) {
    parts.push(contactItems.join(' | ') + '\n');
  }

  // Render sections in sectionOrder
  const order = cv.sectionOrder || ['summary', 'experience', 'education', 'skills', 'projects', 'certifications'];

  for (const sectionId of order) {
    switch (sectionId) {
      case 'summary':
        if (cv.summary?.visible && cv.summary.content?.trim()) {
          parts.push(`## ${cv.summary.title || 'Executive Profile'}\n`);
          parts.push(cv.summary.content.trim() + '\n');
        }
        break;

      case 'experience': {
        const visibleExp = (cv.experience || []).filter(e => e.visible);
        if (visibleExp.length > 0) {
          parts.push(`## ${cv.experienceMeta?.title || 'Professional Experience'}\n`);
          visibleExp.forEach(item => {
            const dates = `${item.startDate || ''} – ${item.isCurrent ? 'Present' : (item.endDate || '')}`.trim();
            parts.push(`### ${item.role} | **${item.company}**`);
            const meta = [dates, item.location].filter(Boolean).join(' • ');
            if (meta) parts.push(`*${meta}*`);
            if (item.bullets?.length > 0) {
              item.bullets.forEach(b => { if (b.trim()) parts.push(`* ${b.trim()}`); });
            }
            parts.push('');
          });
        }
        break;
      }

      case 'education': {
        const visibleEdu = (cv.education || []).filter(e => e.visible);
        if (visibleEdu.length > 0) {
          parts.push(`## ${cv.educationMeta?.title || 'Education'}\n`);
          visibleEdu.forEach(item => {
            const dates = item.endDate ? (item.startDate ? `${item.startDate} – ${item.endDate}` : item.endDate) : '';
            parts.push(`### ${item.degree} | **${item.institution}**`);
            const meta = [dates, item.location, item.score].filter(Boolean).join(' • ');
            if (meta) parts.push(`*${meta}*`);
            parts.push('');
          });
        }
        break;
      }

      case 'skills': {
        const visibleSkills = (cv.skills || []).filter(s => s.visible && s.skills.length > 0);
        if (visibleSkills.length > 0) {
          parts.push(`## ${cv.skillsMeta?.title || 'Skills & Competencies'}\n`);
          visibleSkills.forEach(cat => {
            parts.push(`* **${cat.categoryName}:** ${cat.skills.join(', ')}`);
          });
          parts.push('');
        }
        break;
      }

      case 'projects': {
        const visibleProjects = (cv.projects || []).filter(p => p.visible);
        if (visibleProjects.length > 0) {
          parts.push(`## ${cv.projectsMeta?.title || 'Projects & Technical Initiatives'}\n`);
          visibleProjects.forEach(item => {
            const titleLink = item.url ? `[${item.title}](${item.url})` : item.title;
            parts.push(`### ${titleLink}${item.subtitle ? ` — *${item.subtitle}*` : ''}`);
            if (item.technologies?.length > 0) {
              parts.push(`*Technologies: ${item.technologies.join(', ')}*`);
            }
            if (item.bullets?.length > 0) {
              item.bullets.forEach(b => { if (b.trim()) parts.push(`* ${b.trim()}`); });
            }
            parts.push('');
          });
        }
        break;
      }

      case 'certifications': {
        const visibleCerts = (cv.certifications || []).filter(c => c.visible);
        if (visibleCerts.length > 0) {
          parts.push(`## ${cv.certificationsMeta?.title || 'Certifications & Honors'}\n`);
          visibleCerts.forEach(item => {
            const link = item.url ? `[${item.name}](${item.url})` : item.name;
            parts.push(`* **${link}** — ${item.issuer} (${item.date})`);
          });
          parts.push('');
        }
        break;
      }

      case 'languages': {
        const visibleLangs = (cv.languages || []).filter(l => l.visible);
        if (visibleLangs.length > 0) {
          parts.push(`## ${cv.languagesMeta?.title || 'Languages'}\n`);
          visibleLangs.forEach(item => {
            parts.push(`* **${item.language}** — ${item.fluency}`);
          });
          parts.push('');
        }
        break;
      }

      case 'awards': {
        const visibleAwards = (cv.awards || []).filter(a => a.visible);
        if (visibleAwards.length > 0) {
          parts.push(`## ${cv.awardsMeta?.title || 'Awards & Achievements'}\n`);
          visibleAwards.forEach(item => {
            const link = item.url ? `[${item.title}](${item.url})` : item.title;
            parts.push(`* **${link}** — ${item.awarder} (${item.date})`);
            if (item.summary) parts.push(`  ${item.summary}`);
          });
          parts.push('');
        }
        break;
      }

      case 'volunteer': {
        const visibleVol = (cv.volunteer || []).filter(v => v.visible);
        if (visibleVol.length > 0) {
          parts.push(`## ${cv.volunteerMeta?.title || 'Volunteer Experience'}\n`);
          visibleVol.forEach(item => {
            const dates = `${item.startDate || ''} – ${item.isCurrent ? 'Present' : (item.endDate || '')}`.trim();
            parts.push(`### ${item.role} | **${item.organization}**`);
            const meta = [dates, item.location].filter(Boolean).join(' • ');
            if (meta) parts.push(`*${meta}*`);
            if (item.bullets?.length > 0) {
              item.bullets.forEach(b => { if (b.trim()) parts.push(`* ${b.trim()}`); });
            }
            parts.push('');
          });
        }
        break;
      }

      case 'publications': {
        const visiblePubs = (cv.publications || []).filter(p => p.visible);
        if (visiblePubs.length > 0) {
          parts.push(`## ${cv.publicationsMeta?.title || 'Publications'}\n`);
          visiblePubs.forEach(item => {
            const link = item.url ? `[${item.title}](${item.url})` : item.title;
            parts.push(`* **${link}** — ${item.publisher} (${item.date})`);
            if (item.summary) parts.push(`  ${item.summary}`);
          });
          parts.push('');
        }
        break;
      }

      case 'interests': {
        const visibleInts = (cv.interests || []).filter(i => i.visible);
        if (visibleInts.length > 0) {
          parts.push(`## ${cv.interestsMeta?.title || 'Interests'}\n`);
          visibleInts.forEach(item => {
            const keywords = item.keywords?.length > 0 ? ` — ${item.keywords.join(', ')}` : '';
            parts.push(`* **${item.name}**${keywords}`);
          });
          parts.push('');
        }
        break;
      }

      case 'references': {
        const visibleRefs = (cv.references || []).filter(r => r.visible);
        if (visibleRefs.length > 0) {
          parts.push(`## ${cv.referencesMeta?.title || 'References'}\n`);
          visibleRefs.forEach(item => {
            parts.push(`### ${item.name}`);
            const meta = [item.title, item.company].filter(Boolean).join(', ');
            if (meta) parts.push(`*${meta}*`);
            const contact = [item.email, item.phone].filter(Boolean).join(' | ');
            if (contact) parts.push(contact);
            parts.push('');
          });
        }
        break;
      }

      default: {
        // Custom sections
        if (sectionId.startsWith('custom-')) {
          const cs = cv.customSections?.find(s => s.id === sectionId);
          if (cs?.visible && cs.items?.length > 0) {
            parts.push(`## ${cs.sectionTitle}\n`);
            cs.items.forEach((item: any) => {
              if (item.visible) {
                parts.push(`### ${item.title}${item.subtitle ? ` — *${item.subtitle}*` : ''}`);
                if (item.date || item.location) {
                  parts.push(`*${[item.date, item.location].filter(Boolean).join(' • ')}*`);
                }
                if (item.bullets?.length > 0) {
                  item.bullets.forEach((b: string) => { if (b.trim()) parts.push(`* ${b.trim()}`); });
                }
                parts.push('');
              }
            });
          }
        }
        break;
      }
    }
  }

  return parts.join('\n').trim();
}

/**
 * Helper to clean Markdown and HTML formatting from raw text.
 */
function cleanText(text: string): string {
  return text
    .replace(/^[*•–-]\s*/, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
    .trim();
}

/**
 * Intelligent, comprehensive parser that converts raw resume text (from Markdown, PDF, DOCX, or TXT)
 * into a complete, structured Resume JSON (StructuredCV).
 * Fills all known standard sections and automatically creates Custom Sections for any unmatched sections.
 */
export function parseResumeTextToStructuredCV(
  rawText: string,
  base: StructuredCV = DEFAULT_CV_DATA
): StructuredCV {
  if (!rawText || !rawText.trim()) return base;

  const result: StructuredCV = JSON.parse(JSON.stringify(base));
  result.updatedAt = new Date().toISOString();

  // Reset arrays to receive freshly parsed data
  result.experience = [];
  result.education = [];
  result.skills = [];
  result.projects = [];
  result.certifications = [];
  result.languages = [];
  result.awards = [];
  result.volunteer = [];
  result.publications = [];
  result.interests = [];
  result.references = [];
  result.customSections = [];

  // ── Pre-process Text: Normalize & inject line breaks if headings were collapsed ────
  let normalized = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  const sectionKeywordsForSplit = [
    'Executive Summary', 'Professional Summary', 'Personal Summary', 'Summary Profile', 'Summary', 'Profile', 'About Me',
    'Professional Experience', 'Work Experience', 'Employment History', 'Career History', 'Work History', 'Experience',
    'Education & Qualifications', 'Education and Training', 'Academic Background', 'Education', 'Academic Qualifications',
    'Technical Skills', 'Core Competencies', 'Key Skills', 'Skills & Competencies', 'Skills and Competencies', 'Areas of Expertise', 'Skills',
    'Key Projects', 'Selected Projects', 'Technical Projects', 'Projects', 'Portfolio',
    'Licenses & Certifications', 'Certifications and Licenses', 'Certifications', 'Certificates',
    'Languages & Fluency', 'Languages', 'Language Proficiency',
    'Honors & Awards', 'Awards and Honors', 'Awards & Achievements', 'Awards', 'Achievements',
    'Volunteer Experience', 'Volunteering', 'Community Service',
    'Publications & Research', 'Publications',
    'Interests & Activities', 'Interests and Hobbies', 'Interests', 'Hobbies',
    'Professional References', 'References'
  ];

  for (const kw of sectionKeywordsForSplit) {
    const regex = new RegExp(`([^\\n])\\s+(?:#{1,3}\\s+|\\*\\*)?(${kw})(?:\\*\\*|:)?(?:\\s+|$)`, 'gi');
    normalized = normalized.replace(regex, '$1\n\n$2\n');
  }

  // Split bullet points that are joined with spaces (e.g. "something. * Bullet two" or ". • Bullet")
  normalized = normalized.replace(/([.!?])\s+([*•–\-▪▫o]\s+[A-Z])/g, '$1\n$2');

  const lines = normalized.split('\n');

  // ── Step 1: Detect Section Boundaries ─────────────────────────────────────
  interface RawSection {
    heading: string;
    rawTitle: string;
    lines: string[];
  }

  const headerLines: string[] = [];
  const sections: RawSection[] = [];
  let currentSection: RawSection | null = null;

  const KNOWN_SECTION_KEYWORDS = [
    'summary', 'profile', 'objective', 'about', 'overview',
    'experience', 'employment', 'work history', 'career history', 'work experience',
    'education', 'academic', 'qualifications', 'training',
    'skills', 'technical skills', 'competencies', 'technologies', 'core skills', 'expertise',
    'projects', 'personal projects', 'key projects', 'portfolio',
    'certifications', 'certificates', 'licenses', 'credentials',
    'languages',
    'awards', 'honors', 'achievements', 'recognitions',
    'volunteer', 'community service', 'volunteering',
    'publications', 'papers', 'research', 'patents',
    'interests', 'hobbies', 'activities',
    'references'
  ];

  const dateRangeRegex = /(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+)?\d{4}\s*[-–—to]+\s*(?:Present|Current|(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+)?\d{4})/i;

  const isHeadingLine = (line: string, inSection: boolean): { isHeading: boolean; title: string } => {
    const trimmed = line.trim();
    if (!trimmed) return { isHeading: false, title: '' };

    // 1. Markdown Heading Level: "## Heading" or "# Heading"
    if (/^#{1,3}\s+/.test(trimmed)) {
      const title = trimmed.replace(/^#{1,3}\s+/, '').trim();
      // If we are before any section and this is the first line "# Name", it's the candidate name!
      if (!inSection && headerLines.length === 0) {
        return { isHeading: false, title: '' };
      }
      return { isHeading: true, title };
    }

    // 2. Underlined header or divider
    if (/^[-=_]{3,}$/.test(trimmed)) {
      return { isHeading: false, title: '' };
    }

    // Bullet lines are NEVER section headings
    if (/^[*•–\-▪▫o]\s+/i.test(trimmed)) {
      return { isHeading: false, title: '' };
    }

    // Lines with email, url, or date ranges are NEVER section headings
    if (trimmed.includes('@') || trimmed.includes('http') || dateRangeRegex.test(trimmed)) {
      return { isHeading: false, title: '' };
    }

    const cleanWord = trimmed.replace(/[:\-#*]/g, '').trim();
    const lower = cleanWord.toLowerCase();

    // 3. Exact or prefix match with known section keywords
    if (cleanWord.length > 2 && cleanWord.length < 40) {
      if (KNOWN_SECTION_KEYWORDS.some(kw => lower === kw || lower === `${kw}:` || lower.startsWith(`${kw} &`) || lower.startsWith(`${kw} and`))) {
        return { isHeading: true, title: cleanWord.replace(/:$/, '').trim() };
      }
    }

    // 4. Standalone bold line: "**Experience**"
    const boldMatch = trimmed.match(/^\*\*([A-Za-z\s&/,]+)\*\*$/);
    if (boldMatch && boldMatch[1].length < 35) {
      if (inSection) {
        return { isHeading: true, title: boldMatch[1].trim() };
      }
    }

    // 5. Standalone Uppercase Line (ONLY allowed if already inside a section to protect candidate name)
    if (inSection && cleanWord.length > 2 && cleanWord.length < 35 && cleanWord === cleanWord.toUpperCase() && /^[A-Z\s&/,]+$/.test(cleanWord)) {
      // Avoid job titles, degrees, and company names
      const isJobOrDegree = /\b(DEVELOPER|ENGINEER|MANAGER|ARCHITECT|LEAD|SPECIALIST|DIRECTOR|ANALYST|CONSULTANT|BACHELOR|MASTER|DEGREE|SCIENCE|ARTS|UNIVERSITY|COLLEGE|LLC|INC|LTD|CORP)\b/.test(cleanWord);
      if (!isJobOrDegree) {
        return { isHeading: true, title: cleanWord };
      }
    }

    return { isHeading: false, title: '' };
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const inSection = currentSection !== null || sections.length > 0;
    const { isHeading, title } = isHeadingLine(line, inSection);

    if (isHeading) {
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = {
        heading: title.toLowerCase(),
        rawTitle: title,
        lines: []
      };
    } else {
      if (currentSection) {
        currentSection.lines.push(line);
      } else {
        headerLines.push(line);
      }
    }
  }

  if (currentSection) {
    sections.push(currentSection);
  }

  // ── Step 2: Parse Personal Info & Contact Details (Basics) ─────────────────
  const allHeaderText = headerLines.join('\n');
  const fullDocText = rawText;

  // 1. Email extraction (check header first, fallback to entire document)
  const emailMatch = allHeaderText.match(/\b([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})\b/)
    || fullDocText.match(/\b([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})\b/);
  if (emailMatch) {
    result.basics.email = emailMatch[1];
  }

  // 2. Phone extraction (check header first, fallback to top of document)
  const phoneMatch = allHeaderText.match(/(?:\+?\d{1,4}[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{3,4}\b/)
    || fullDocText.slice(0, 1000).match(/(?:\+?\d{1,4}[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{3,4}\b/);
  if (phoneMatch && phoneMatch[0].replace(/\D/g, '').length >= 7) {
    result.basics.phone = phoneMatch[0].trim();
  }

  // 3. Name extraction: inspect headerLines first
  for (const line of headerLines) {
    const clean = cleanText(line);
    if (!clean) continue;
    if (/^(resume|cv|curriculum vitae|curriculum-vitae)$/i.test(clean)) continue;
    if (clean.includes('@') || clean.includes('http') || clean.includes('www.') || /\d{5,}/.test(clean)) continue;
    if (clean.split('|').length > 2) continue;

    let name = clean;
    if (name.includes('|')) name = name.split('|')[0].trim();
    // If name is all uppercase, format to Title Case
    if (name === name.toUpperCase() && name.length > 3) {
      name = name.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
    result.basics.fullName = name;
    break;
  }

  // Fallback name if header was empty: check first 5 non-empty lines of rawText
  if (!result.basics.fullName) {
    for (const line of lines.slice(0, 5)) {
      const clean = cleanText(line);
      if (!clean) continue;
      if (/^(resume|cv|curriculum vitae)$/i.test(clean)) continue;
      if (clean.includes('@') || clean.includes('http') || /\d{5,}/.test(clean)) continue;
      let name = clean.split('|')[0].trim();
      if (name === name.toUpperCase() && name.length > 3) {
        name = name.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      }
      result.basics.fullName = name;
      break;
    }
  }

  // 4. Headline / Professional Title extraction
  for (const line of headerLines) {
    const clean = cleanText(line);
    if (!clean || clean === result.basics.fullName) continue;
    if (/^(resume|cv|curriculum vitae)$/i.test(clean)) continue;
    if (clean.includes('@') || clean.includes('http') || clean.includes('www.') || /\d{5,}/.test(clean)) continue;
    if (clean.split('|').length > 2) continue;
    if (clean.length >= 3 && clean.length <= 75) {
      result.basics.headline = clean.includes('|') ? clean.split('|')[0].trim() : clean;
      break;
    }
  }

  // 5. Location extraction
  const locationRegex = /\b([A-Za-z\s.-]+,\s*[A-Za-z\s.-]+(?:\s*\d{5})?)\b/;
  for (const line of headerLines) {
    const clean = cleanText(line);
    if (clean.includes('@') || clean.includes('http')) {
      const parts = clean.split('|').map(p => p.trim());
      for (const p of parts) {
        if (!p.includes('@') && !p.includes('http') && !/\d{7,}/.test(p) && p.length > 3 && p.length < 50) {
          result.basics.location = p;
          break;
        }
      }
    } else if (locationRegex.test(clean) && clean !== result.basics.fullName && clean !== result.basics.headline) {
      const locMatch = clean.match(locationRegex);
      if (locMatch && !locMatch[1].includes('@') && !locMatch[1].includes('http')) {
        result.basics.location = locMatch[1].trim();
        break;
      }
    }
  }

  // 6. Links extraction (LinkedIn, GitHub, Twitter/X, Portfolio, Website)
  const links: ResumeProfileLink[] = [];
  const linkId = () => `link-${Date.now()}-${links.length}`;

  const allHeaderAndTop = (allHeaderText + '\n' + rawText.slice(0, 1500));
  const urlMatches = allHeaderAndTop.matchAll(/(?:https?:\/\/|www\.)[^\s)<>,]+/gi);
  for (const m of urlMatches) {
    let url = m[0].replace(/[,.]$/, '');
    if (!url.startsWith('http')) url = 'https://' + url;
    const lower = url.toLowerCase();

    if (lower.includes('linkedin.com')) {
      const username = url.split('/in/')[1]?.split(/[\/?#]/)[0] || 'LinkedIn';
      if (!links.some(l => l.network === 'LinkedIn')) {
        links.push({ id: linkId(), network: 'LinkedIn', username, url });
      }
    } else if (lower.includes('github.com')) {
      const username = url.split('github.com/')[1]?.split(/[\/?#]/)[0] || 'GitHub';
      if (!links.some(l => l.network === 'GitHub')) {
        links.push({ id: linkId(), network: 'GitHub', username, url });
      }
    } else if (lower.includes('twitter.com') || lower.includes('x.com')) {
      const username = url.split(/\.com\//)[1]?.split(/[\/?#]/)[0] || 'Twitter';
      if (!links.some(l => l.network === 'Twitter')) {
        links.push({ id: linkId(), network: 'Twitter', username, url });
      }
    } else if (lower.includes('portfolio') || lower.includes('behance') || lower.includes('dribbble')) {
      if (!links.some(l => l.network === 'Portfolio')) {
        links.push({ id: linkId(), network: 'Portfolio', username: 'Portfolio', url });
      }
    } else if (!result.basics.website) {
      result.basics.website = url;
    }
  }
  if (links.length > 0) {
    result.basics.links = links;
  }

  // ── Step 3: Parse Sections into Structured Format ──────────────────────────
  const newSectionOrder: string[] = [];

  for (const sec of sections) {
    const h = sec.heading;
    const bodyLines = sec.lines.map(l => l.trim()).filter(Boolean);

    // 1. SUMMARY / PROFILE
    if (h.includes('summary') || h.includes('profile') || h.includes('objective') || h.includes('about') || h.includes('overview')) {
      result.summary.title = sec.rawTitle;
      result.summary.content = bodyLines.map(l => cleanText(l)).join(' ');
      result.summary.visible = true;
      if (!newSectionOrder.includes('summary')) newSectionOrder.push('summary');
      continue;
    }

    // 2. EXPERIENCE
    if (h.includes('experience') || h.includes('employment') || h.includes('work history') || h.includes('career') || h.includes('work experience')) {
      result.experienceMeta = { title: sec.rawTitle, icon: 'briefcase', showIcon: true };
      const expItems: WorkExperienceItem[] = [];
      let currentExp: WorkExperienceItem | null = null;

      const isBulletLine = (line: string): boolean => {
        const t = line.trim();
        return /^[*•–\-▪▫o]\s+/i.test(t) || /^\d+\.\s+/.test(t);
      };

      const cleanBullet = (line: string): string => {
        return cleanText(line).replace(/^[*•–\-▪▫o]\s+/i, '').replace(/^\d+\.\s+/, '').trim();
      };

      for (let i = 0; i < bodyLines.length; i++) {
        const line = bodyLines[i];
        const trimmed = line.trim();
        if (!trimmed) continue;

        if (isBulletLine(trimmed)) {
          const bullet = cleanBullet(trimmed);
          if (bullet) {
            if (!currentExp) {
              currentExp = {
                id: `exp-${Date.now()}-${expItems.length}`,
                role: 'Professional Experience',
                company: '',
                location: '',
                startDate: '',
                endDate: 'Present',
                isCurrent: true,
                bullets: [],
                visible: true,
                alignment: 'justify'
              };
              expItems.push(currentExp);
            }
            currentExp.bullets.push(bullet);
          }
        } else {
          const hasDate = dateRangeRegex.test(trimmed) || /\b(19\d\d|20\d\d)\s*[-–—to]+\s*(Present|Current|19\d\d|20\d\d)\b/i.test(trimmed);
          const hasSeparator = trimmed.includes('|') || trimmed.includes(' • ') || trimmed.includes(' at ') || trimmed.includes(' @ ');
          const isHeadingPrefix = /^#{1,4}\s+/.test(trimmed) || /^\*\*[^*]+\*\*$/.test(trimmed);

          if (isHeadingPrefix || hasSeparator || hasDate || (currentExp && currentExp.bullets.length > 0)) {
            let role = cleanText(trimmed);
            let company = '';
            let location = '';
            let startDate = '';
            let endDate = 'Present';
            let isCurrent = true;

            const dMatch = trimmed.match(dateRangeRegex) || trimmed.match(/\b(19\d\d|20\d\d)\s*[-–—to]+\s*(Present|Current|19\d\d|20\d\d)\b/i);
            if (dMatch) {
              const [s, e] = dMatch[0].split(/[-–—to]+/).map(d => d.trim());
              startDate = s || '';
              endDate = e || 'Present';
              isCurrent = /present|current/i.test(endDate);
              role = role.replace(dMatch[0], '').replace(/[•|()]/g, '').trim();
            }

            if (role.includes('|')) {
              const parts = role.split('|').map(p => p.trim());
              role = parts[0];
              company = parts[1] || '';
              if (parts[2]) location = parts[2];
            } else if (role.includes(' • ')) {
              const parts = role.split(' • ').map(p => p.trim());
              role = parts[0];
              company = parts[1] || '';
              if (parts[2]) location = parts[2];
            } else if (role.includes(' at ')) {
              const parts = role.split(' at ').map(p => p.trim());
              role = parts[0];
              company = parts[1] || '';
            } else if (role.includes(' - ') || role.includes(' – ')) {
              const parts = role.split(/\s+[-–]\s+/).map(p => p.trim());
              if (parts.length >= 2) {
                role = parts[0];
                company = parts[1];
                if (parts[2]) location = parts[2];
              }
            }

            // Check if next non-bullet line is company or dates
            if (!company && i + 1 < bodyLines.length && !isBulletLine(bodyLines[i + 1])) {
              const nextLine = bodyLines[i + 1].trim();
              const nextHasDate = dateRangeRegex.test(nextLine);
              if (nextHasDate) {
                const nextMatch = nextLine.match(dateRangeRegex);
                if (nextMatch) {
                  const [s, e] = nextMatch[0].split(/[-–—to]+/).map(d => d.trim());
                  startDate = s || '';
                  endDate = e || 'Present';
                  isCurrent = /present|current/i.test(endDate);
                }
                const remaining = cleanText(nextLine).replace(dateRangeRegex, '').replace(/[|•()]/g, '').trim();
                if (remaining) company = remaining;
                i++;
              } else if (nextLine.length < 50 && !nextLine.includes('@')) {
                company = cleanText(nextLine);
                i++;
              }
            }

            currentExp = {
              id: `exp-${Date.now()}-${expItems.length}`,
              role: role || 'Role Title',
              company: company || '',
              location,
              startDate,
              endDate,
              isCurrent,
              bullets: [],
              visible: true,
              alignment: 'justify'
            };
            expItems.push(currentExp);
          } else if (currentExp) {
            if (hasDate && !currentExp.startDate) {
              const dMatch = trimmed.match(dateRangeRegex);
              if (dMatch) {
                const [s, e] = dMatch[0].split(/[-–—to]+/).map(d => d.trim());
                currentExp.startDate = s || '';
                currentExp.endDate = e || 'Present';
                currentExp.isCurrent = /present|current/i.test(currentExp.endDate);
              }
            } else if (!currentExp.company && trimmed.length < 50 && !trimmed.includes('@')) {
              currentExp.company = cleanText(trimmed);
            } else {
              currentExp.bullets.push(cleanText(trimmed));
            }
          }
        }
      }

      result.experience = expItems;
      if (expItems.length > 0 && !newSectionOrder.includes('experience')) {
        newSectionOrder.push('experience');
      }
      continue;
    }

    // 3. EDUCATION
    if (h.includes('education') || h.includes('academic') || h.includes('qualification') || h.includes('training')) {
      result.educationMeta = { title: sec.rawTitle, icon: 'graduationCap', showIcon: true };
      const eduItems: EducationItem[] = [];
      let currentEdu: EducationItem | null = null;

      for (let i = 0; i < bodyLines.length; i++) {
        const line = bodyLines[i].trim();
        if (!line) continue;
        const clean = cleanText(line);

        const hasDate = /\b(19\d\d|20\d\d)\b/.test(line);
        const hasDegreeWord = /\b(bachelor|master|b\.?s|m\.?s|b\.?tech|m\.?tech|ph\.?d|doctorate|b\.?a|m\.?a|bsc|msc|degree|diploma|associate)\b/i.test(line);
        const hasInstWord = /\b(university|college|institute|school|academy|polytechnic)\b/i.test(line);
        const hasSep = line.includes('|') || line.includes(' • ') || line.includes(',');

        if (hasDegreeWord || hasInstWord || hasSep || hasDate || !currentEdu) {
          let degree = clean;
          let institution = '';
          let dateStr = '';
          let score = '';

          const dMatch = line.match(/\b(?:\d{4}\s*[-–—to]+\s*(?:\d{4}|Present)|\d{4})\b/i);
          if (dMatch) {
            dateStr = dMatch[0];
            degree = degree.replace(dateStr, '').replace(/[|•()]/g, '').trim();
          }

          if (degree.includes('|')) {
            const parts = degree.split('|').map(p => p.trim());
            degree = parts[0];
            institution = parts[1] || '';
          } else if (degree.includes(' • ')) {
            const parts = degree.split(' • ').map(p => p.trim());
            degree = parts[0];
            institution = parts[1] || '';
          } else if (hasDegreeWord && hasInstWord) {
            const parts = degree.split(/,\s+|\s+from\s+/i);
            if (parts.length >= 2) {
              degree = parts[0];
              institution = parts.slice(1).join(', ');
            }
          }

          if (!institution && i + 1 < bodyLines.length) {
            const nextLine = cleanText(bodyLines[i + 1]);
            if (/\b(university|college|institute|school|academy)\b/i.test(nextLine)) {
              institution = nextLine;
              i++;
            }
          }

          currentEdu = {
            id: `edu-${Date.now()}-${eduItems.length}`,
            degree: degree || 'Degree',
            institution: institution || 'Institution',
            endDate: dateStr || '',
            score,
            visible: true,
            alignment: 'justify'
          };
          eduItems.push(currentEdu);
        } else if (currentEdu) {
          if (/gpa|grade|score|honors|distinction|cum laude/i.test(clean)) {
            currentEdu.score = clean;
          } else if (!currentEdu.institution || currentEdu.institution === 'Institution') {
            currentEdu.institution = clean;
          }
        }
      }

      result.education = eduItems;
      if (eduItems.length > 0 && !newSectionOrder.includes('education')) {
        newSectionOrder.push('education');
      }
      continue;
    }

    // 4. SKILLS
    if (h.includes('skill') || h.includes('competenc') || h.includes('technolog') || h.includes('stack') || h.includes('expertise')) {
      result.skillsMeta = { title: sec.rawTitle, icon: 'cpu', showIcon: true };
      const skillsCategories: SkillCategoryItem[] = [];

      for (const line of bodyLines) {
        const clean = cleanText(line).replace(/^[*•–\-▪▫o]\s+/i, '').trim();
        if (!clean) continue;

        if (clean.includes(':')) {
          const colonIdx = clean.indexOf(':');
          const cat = clean.substring(0, colonIdx).trim();
          const rest = clean.substring(colonIdx + 1).trim();
          const items = rest.split(/[,•|/]/).map(s => s.trim()).filter(Boolean);
          if (items.length > 0) {
            skillsCategories.push({
              id: `sk-${Date.now()}-${skillsCategories.length}`,
              categoryName: cat || 'Core Skills',
              skills: items,
              visible: true
            });
          }
        } else {
          const items = clean.split(/[,•|/]/).map(s => s.trim()).filter(Boolean);
          if (items.length > 0) {
            const existingGeneral = skillsCategories.find(c => c.categoryName === 'Technical Skills');
            if (existingGeneral) {
              items.forEach(it => {
                if (!existingGeneral.skills.includes(it)) existingGeneral.skills.push(it);
              });
            } else {
              skillsCategories.push({
                id: `sk-${Date.now()}-${skillsCategories.length}`,
                categoryName: 'Technical Skills',
                skills: items,
                visible: true
              });
            }
          }
        }
      }

      result.skills = skillsCategories;
      if (skillsCategories.length > 0 && !newSectionOrder.includes('skills')) {
        newSectionOrder.push('skills');
      }
      continue;
    }

    // 5. PROJECTS
    if (h.includes('project') || h.includes('portfolio')) {
      result.projectsMeta = { title: sec.rawTitle, icon: 'code', showIcon: true };
      const projList: ProjectItem[] = [];
      let currentProj: ProjectItem | null = null;

      for (const line of bodyLines) {
        const clean = cleanText(line);
        const isBullet = line.startsWith('* ') || line.startsWith('- ') || line.startsWith('• ') || line.startsWith('– ');

        if (!isBullet && (line.startsWith('### ') || line.startsWith('**') || !currentProj)) {
          currentProj = {
            id: `proj-${Date.now()}-${projList.length}`,
            title: clean,
            bullets: [],
            technologies: [],
            visible: true,
            alignment: 'justify'
          };
          projList.push(currentProj);
        } else if (currentProj) {
          if (/technologies|tech stack|built with/i.test(clean)) {
            const techs = clean.replace(/^(technologies|tech stack|built with)[:\s]*/i, '').split(/[,|•]/).map(t => t.trim());
            currentProj.technologies = techs;
          } else if (isBullet) {
            currentProj.bullets.push(clean);
          } else {
            currentProj.bullets.push(clean);
          }
        }
      }

      result.projects = projList;
      if (projList.length > 0 && !newSectionOrder.includes('projects')) {
        newSectionOrder.push('projects');
      }
      continue;
    }

    // 6. CERTIFICATIONS
    if (h.includes('certif') || h.includes('license') || h.includes('credential')) {
      result.certificationsMeta = { title: sec.rawTitle, icon: 'award', showIcon: true };
      const certList: CertificationItem[] = [];

      for (const line of bodyLines) {
        const clean = cleanText(line).replace(/^[*•–\-▪▫o]\s+/i, '').trim();
        if (!clean) continue;

        let name = clean;
        let issuer = '';
        let date = '';

        const dMatch = clean.match(/\b(?:\d{4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4})\b/i);
        if (dMatch) {
          date = dMatch[0];
          name = name.replace(date, '').replace(/[|•()]/g, '').trim();
        }

        if (name.includes('|')) {
          const parts = name.split('|').map(p => p.trim());
          name = parts[0];
          issuer = parts[1] || '';
        } else if (name.includes(' - ') || name.includes(' – ')) {
          const parts = name.split(/\s+[-–]\s+/).map(p => p.trim());
          name = parts[0];
          issuer = parts[1] || '';
        } else if (name.includes(' by ')) {
          const parts = name.split(' by ').map(p => p.trim());
          name = parts[0];
          issuer = parts[1] || '';
        }

        certList.push({
          id: `cert-${Date.now()}-${certList.length}`,
          name: name || 'Certification',
          issuer: issuer || '',
          date,
          visible: true
        });
      }

      result.certifications = certList;
      if (certList.length > 0 && !newSectionOrder.includes('certifications')) {
        newSectionOrder.push('certifications');
      }
      continue;
    }

    // 7. LANGUAGES
    if (h.includes('language')) {
      result.languagesMeta = { title: sec.rawTitle, icon: 'globe', showIcon: true };
      const langList: LanguageItem[] = [];

      for (const line of bodyLines) {
        const clean = cleanText(line);
        const langItems = clean.split(/[,;•|]/).map(item => item.trim()).filter(Boolean);

        for (const item of langItems) {
          let language = item;
          let fluency: LanguageItem['fluency'] = 'Fluent';

          const fluencyMatch = item.match(/\((.*?)\)|[-–]\s*(.*)$/);
          if (fluencyMatch) {
            const level = (fluencyMatch[1] || fluencyMatch[2] || '').trim().toLowerCase();
            language = item.replace(/\(.*?\)|[-–].*$/, '').trim();
            if (level.includes('native') || level.includes('mother')) fluency = 'Native';
            else if (level.includes('fluent')) fluency = 'Fluent';
            else if (level.includes('advance')) fluency = 'Advanced';
            else if (level.includes('intermediate') || level.includes('conversational')) fluency = 'Intermediate';
            else if (level.includes('basic') || level.includes('elementary')) fluency = 'Basic';
          }

          langList.push({
            id: `lang-${Date.now()}-${langList.length}`,
            language,
            fluency,
            visible: true
          });
        }
      }

      result.languages = langList;
      if (langList.length > 0 && !newSectionOrder.includes('languages')) {
        newSectionOrder.push('languages');
      }
      continue;
    }

    // 8. AWARDS / HONORS
    if (h.includes('award') || h.includes('honor') || h.includes('achievement') || h.includes('recognition')) {
      result.awardsMeta = { title: sec.rawTitle, icon: 'star', showIcon: true };
      const awardList: AwardItem[] = [];

      for (const line of bodyLines) {
        const clean = cleanText(line);
        awardList.push({
          id: `award-${Date.now()}-${awardList.length}`,
          title: clean,
          awarder: '',
          date: '',
          visible: true
        });
      }

      result.awards = awardList;
      if (awardList.length > 0 && !newSectionOrder.includes('awards')) {
        newSectionOrder.push('awards');
      }
      continue;
    }

    // 9. VOLUNTEER
    if (h.includes('volunteer') || h.includes('community')) {
      result.volunteerMeta = { title: sec.rawTitle, icon: 'heart', showIcon: true };
      const volList: VolunteerItem[] = [];

      for (const line of bodyLines) {
        const clean = cleanText(line);
        volList.push({
          id: `vol-${Date.now()}-${volList.length}`,
          role: clean,
          organization: '',
          startDate: '',
          endDate: '',
          isCurrent: false,
          bullets: [],
          visible: true,
          alignment: 'justify'
        });
      }

      result.volunteer = volList;
      if (volList.length > 0 && !newSectionOrder.includes('volunteer')) {
        newSectionOrder.push('volunteer');
      }
      continue;
    }

    // 10. PUBLICATIONS
    if (h.includes('publication') || h.includes('paper') || h.includes('patent')) {
      result.publicationsMeta = { title: sec.rawTitle, icon: 'bookOpen', showIcon: true };
      const pubList: PublicationItem[] = [];

      for (const line of bodyLines) {
        const clean = cleanText(line);
        pubList.push({
          id: `pub-${Date.now()}-${pubList.length}`,
          title: clean,
          publisher: '',
          date: '',
          visible: true
        });
      }

      result.publications = pubList;
      if (pubList.length > 0 && !newSectionOrder.includes('publications')) {
        newSectionOrder.push('publications');
      }
      continue;
    }

    // 11. INTERESTS
    if (h.includes('interest') || h.includes('hobby') || h.includes('hobbies')) {
      result.interestsMeta = { title: sec.rawTitle, icon: 'heart', showIcon: true };
      const intList: InterestItem[] = [];

      for (const line of bodyLines) {
        const clean = cleanText(line);
        const tags = clean.split(/[,•|]/).map(t => t.trim()).filter(Boolean);
        intList.push({
          id: `int-${Date.now()}-${intList.length}`,
          name: tags[0] || clean,
          keywords: tags.slice(1),
          visible: true
        });
      }

      result.interests = intList;
      if (intList.length > 0 && !newSectionOrder.includes('interests')) {
        newSectionOrder.push('interests');
      }
      continue;
    }

    // 12. REFERENCES
    if (h.includes('reference')) {
      result.referencesMeta = { title: sec.rawTitle, icon: 'users', showIcon: true };
      const refList: ReferenceItem[] = [];

      for (const line of bodyLines) {
        const clean = cleanText(line);
        refList.push({
          id: `ref-${Date.now()}-${refList.length}`,
          name: clean,
          title: '',
          company: '',
          visible: true
        });
      }

      result.references = refList;
      if (refList.length > 0 && !newSectionOrder.includes('references')) {
        newSectionOrder.push('references');
      }
      continue;
    }

    // 13. UNMATCHED SECTION -> CREATE NEW CUSTOM SECTION!
    const customSectionId = `custom-${Date.now()}-${result.customSections.length}`;
    const customItems: CustomSectionItem[] = [];

    let currentItem: CustomSectionItem | null = null;
    for (const line of bodyLines) {
      const clean = cleanText(line);
      const isBullet = line.startsWith('* ') || line.startsWith('- ') || line.startsWith('• ') || line.startsWith('– ');

      if (!isBullet && clean.length < 70) {
        if (currentItem) customItems.push(currentItem);
        currentItem = {
          id: `c-item-${Date.now()}-${customItems.length}`,
          title: clean,
          bullets: [],
          visible: true,
          alignment: 'justify'
        };
      } else if (currentItem) {
        currentItem.bullets.push(clean);
      } else {
        customItems.push({
          id: `c-item-${Date.now()}-${customItems.length}`,
          title: clean,
          bullets: [],
          visible: true,
          alignment: 'justify'
        });
      }
    }
    if (currentItem) customItems.push(currentItem);

    result.customSections.push({
      id: customSectionId,
      sectionTitle: sec.rawTitle,
      icon: 'sparkles',
      showIcon: true,
      items: customItems.length > 0 ? customItems : [
        {
          id: `c-item-${Date.now()}-0`,
          title: sec.rawTitle,
          bullets: bodyLines.map(l => cleanText(l)),
          visible: true,
          alignment: 'justify'
        }
      ],
      visible: true
    });

    if (!newSectionOrder.includes(customSectionId)) {
      newSectionOrder.push(customSectionId);
    }
  }

  // Preserve standard sections in sectionOrder so they can be re-ordered
  if (newSectionOrder.length > 0) {
    result.sectionOrder = newSectionOrder;
  }

  return result;
}

/**
 * Backward compatibility alias for markdownToStructuredCV.
 */
export function markdownToStructuredCV(markdown: string, base: StructuredCV = DEFAULT_CV_DATA): StructuredCV {
  return parseResumeTextToStructuredCV(markdown, base);
}
