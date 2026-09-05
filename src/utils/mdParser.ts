// A customized, robust client-side Markdown to HTML parser tailored specifically for CVs.
// Supports both 'modern-timeline' (Vineet / Executive Style with left-rail dates, boxed skills cards, zigzag dividers, and left photo)
// and 'classic-ats' (Apple/MAANG style with centered double-line headers and 2-column grid).

export interface CVParseOptions {
  accentColor?: string;
  showPhoto?: boolean;
  photoUrl?: string;
  layoutDensity?: 'compact' | 'standard';
  template?: 'modern-timeline' | 'classic-ats' | 'split-sidebar-right';
  showLinkIcons?: boolean;
}

const KNOWN_SECTIONS = [
  'EXECUTIVE PROFILE',
  'PROFESSIONAL SUMMARY',
  'SUMMARY',
  'PROFESSIONAL EXPERIENCE',
  'WORK EXPERIENCE',
  'EXPERIENCE',
  'TECHNICAL SKILLS & COMPETENCIES',
  'TECHNICAL SKILLS AND COMPETENCIES',
  'TECHNICAL SKILLS',
  'CORE COMPETENCIES',
  'CORE IMPACT & CAREER HIGHLIGHTS',
  'CORE IMPACT AND CAREER HIGHLIGHTS',
  'KEY ACHIEVEMENTS',
  'EDUCATION',
  'AWARDS & RECOGNITION',
  'AWARDS AND RECOGNITION',
  'AWARDS',
  'CERTIFICATIONS',
  'PROJECTS'
];

function isSectionHeading(text: string): boolean {
  const clean = text
    .replace(/^#+\s*/, '')
    .replace(/\*+/g, '')
    .replace(/_+/g, '')
    .replace(/&amp;/gi, '&')
    .trim()
    .toUpperCase();
  return KNOWN_SECTIONS.some(s => clean === s || clean.startsWith(s));
}

function toTitleCase(text: string): string {
  const clean = text
    .replace(/^#+\s*/, '')
    .replace(/\*+/g, '')
    .replace(/_+/g, '')
    .replace(/&amp;/gi, '&')
    .trim();

  const lowerWords = new Set(['and', 'or', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'of', '&']);

  const words = clean.split(/\s+/);
  return words.map((w, idx) => {
    if (w === '&' || w.toLowerCase() === '&amp;') return '&';
    const upper = w.toUpperCase();
    if (['IT', 'UAE', 'AI', 'ATS', 'MBA', 'ENBD', 'GCC', 'ADIB', 'HGS', 'ACE'].includes(upper)) {
      return upper;
    }
    if (idx > 0 && lowerWords.has(w.toLowerCase())) {
      return w.toLowerCase();
    }
    return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  }).join(' ');
}

function autoHighlightKeywords(html: string): string {
  return html
    // Highlight percentages: 30%, 40%, 40–50%, 90%+
    .replace(/(?<!<strong>[^<]*)\b(\d+(?:[–-]\d+)?%\+?)\b(?![^<]*<\/strong>)/g, '<strong>$1</strong>')
    // Highlight counts with impact nouns: 25,000+ accounts, 200+ engineers, 25+ candidates
    .replace(/(?<!<strong>[^<]*)\b(\d{1,3}(?:,\d{3})+\+?|\d+\+)\s+(accounts|engineers|candidates|technical hires|users|members|squads|apps)\b(?![^<]*<\/strong>)/gi, '<strong>$1 $2</strong>')
    // Highlight currency figures: AED 200M+, $100K+
    .replace(/(?<!<strong>[^<]*)\b(AED\s+\d+[MKmk]?\+?|\$\d+[MKmk]?\+?)\b(?![^<]*<\/strong>)/gi, '<strong>$1</strong>');
}

function renderSplitSidebarRight(markdown: string, options: CVParseOptions = {}): string {
  const showLinkIcons = options.showLinkIcons !== false;
  const sidebarBg = options.accentColor || '#1c202d';
  const showPhoto = options.showPhoto && options.photoUrl;

  const mailIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:4px;"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`;
  const phoneIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:4px;"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`;
  const pinIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:4px;"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`;
  const linkedinIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:5px;"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>`;
  const linkExtIcon = `<span class="timeline-link-icon" title="External link" style="display:inline-block; vertical-align:middle; margin-left:4px;"><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg></span>`;

  const lines = markdown
    .replace(/&amp;/g, '&')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\r\n/g, '\n')
    .split('\n');

  let name = '';
  let subtitle = '';
  let email = '';
  let phone = '';
  let location = '';
  let linkedin = '';
  let linkedinDisplay = '';

  interface CVSectionItem {
    title: string;
    lines: string[];
  }
  const sections: CVSectionItem[] = [];
  let currentSection: CVSectionItem | null = null;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();
    if (!line) continue;

    // 1. Candidate Name (H1 or first non-empty line)
    if (!name && (line.startsWith('# ') || (!line.startsWith('##') && !line.includes('@') && i < 3 && line.length < 50 && !isSectionHeading(line)))) {
      name = line.replace(/^#+\s*/, '').replace(/\*+/g, '').trim();
      continue;
    }

    // 2. Subtitle
    if (name && !subtitle && !currentSection && (line.startsWith('*') || (!line.includes('@') && !line.includes('+') && !line.startsWith('##') && !isSectionHeading(line)))) {
      subtitle = line.replace(/^[*_#\s]+|[*_#\s]+$/g, '').trim();
      continue;
    }

    // 3. Contact Info row
    if (!currentSection && (line.includes('@') || line.includes('+') || line.includes('linkedin.com'))) {
      const parts = line.split(/[|•·]/).map(p => p.trim()).filter(Boolean);
      for (const part of parts) {
        let clean = part.replace(/^[*_[\]]+|[*_[\]]+$/g, '').trim();
        const linkMatch = clean.match(/\[(.*?)\]\((.*?)\)/);
        if (linkMatch) clean = linkMatch[1];

        if (clean.includes('@')) {
          email = clean;
        } else if (clean.includes('linkedin.com')) {
          linkedin = clean.startsWith('http') ? clean : 'https://' + clean;
          linkedinDisplay = clean.includes('/in/') ? '/in/' + clean.split('/in/')[1] : clean.replace(/^(https?:\/\/)?(www\.)?linkedin\.com\/?/, '');
        } else if (/\+?\d[\d-\s()]{6,}\d/.test(clean)) {
          phone = clean;
        } else {
          location = clean;
        }
      }
      continue;
    }

    // 4. Section Heading
    if (line.startsWith('## ') || isSectionHeading(line)) {
      const secTitle = line
        .replace(/^##\s*/, '')
        .replace(/\*+/g, '')
        .replace(/_+/g, '')
        .trim()
        .toUpperCase();
      currentSection = { title: secTitle, lines: [] };
      sections.push(currentSection);
      continue;
    }

    if (currentSection) {
      currentSection.lines.push(line);
    }
  }

  const isSidebarSection = (title: string): boolean => {
    return /(?:EDUCATION|AWARD|RECOGNITION|HONOR|SKILL|COMPETENC|LANGUAGE|FRAMEWORK|ARCHITECTURE|VERSIONING|CICD|CI\s*\/\s*CD|DEVOPS|TOOL|CERTIF|HOBB|EXPERTISE)/i.test(title);
  };

  const mainSections = sections.filter(s => !isSidebarSection(s.title));
  const sidebarSections = sections.filter(s => isSidebarSection(s.title));

  // ── Build Main Column HTML ──────────────────────────────────────────
  let mainHtml = '';
  mainHtml += '<div class="split-header">';
  mainHtml += `<h1 class="split-name">${name}</h1>`;
  if (subtitle) {
    mainHtml += `<div class="split-subtitle">${subtitle}</div>`;
  }

  const contactParts: string[] = [];
  if (location) contactParts.push(`<span class="split-contact-item">${pinIcon}${location}</span>`);
  if (email) contactParts.push(`<span class="split-contact-item">${mailIcon}<a href="mailto:${email}">${email}</a></span>`);
  if (phone) contactParts.push(`<span class="split-contact-item">${phoneIcon}${phone}</span>`);
  if (contactParts.length > 0) {
    mainHtml += `<div class="split-contact-row">${contactParts.join('<span class="split-contact-sep">•</span>')}</div>`;
  }
  mainHtml += '</div>';

  for (const sec of mainSections) {
    mainHtml += '<div class="split-section">';
    mainHtml += `<div class="split-section-header"><h2 class="split-section-title">${sec.title}</h2><div class="split-section-rule"></div></div>`;

    let inBullets = false;
    for (let j = 0; j < sec.lines.length; j++) {
      const line = sec.lines[j];

      // Role header: ### Title | Dates
      if (line.startsWith('### ') || (line.includes('|') && !line.startsWith('*') && !line.startsWith('-') && !line.startsWith('•') && (line.includes('Present') || /\d{4}/.test(line)))) {
        if (inBullets) {
          mainHtml += '</ul></div>';
          inBullets = false;
        }
        const clean = line.replace(/^###\s*/, '').replace(/^\*\*|\*\*$/g, '').trim();
        const parts = clean.split('|');
        const roleTitle = parts[0].trim();
        const roleDates = parts[1] ? parts[1].trim() : '';

        let company = '';
        let roleLoc = '';
        if (j + 1 < sec.lines.length) {
          const nextLine = sec.lines[j + 1].trim();
          if (nextLine.startsWith('*') || (nextLine.includes('|') && !nextLine.startsWith('#') && !nextLine.startsWith('-') && !nextLine.startsWith('•'))) {
            const cleanNext = nextLine.replace(/^\*+|\*+$/g, '').replace(/^_+|_+$/g, '').trim();
            const nextParts = cleanNext.split('|');
            company = nextParts[0].trim();
            roleLoc = nextParts[1] ? nextParts[1].trim() : '';
            j++;
          }
        }

        const linkBadge = showLinkIcons ? linkExtIcon : '';
        mainHtml += '<div class="split-role-entry">';
        mainHtml += `<div class="split-role-header"><span class="split-role-title">${roleTitle}</span><span class="split-role-dates">${roleDates}</span></div>`;
        if (company || roleLoc) {
          mainHtml += `<div class="split-role-company"><span class="split-company-name">${company}</span>${roleLoc ? `<span class="split-company-loc">, ${roleLoc}</span>` : ''}${linkBadge}</div>`;
        }
        mainHtml += '<ul class="split-bullets">';
        inBullets = true;
        continue;
      }

      // Bullet item
      const bulletMatch = line.match(/^[-*•]\s+(.*)$/);
      if (bulletMatch) {
        if (!inBullets) {
          mainHtml += '<ul class="split-bullets">';
          inBullets = true;
        }
        const formatted = autoHighlightKeywords(
          bulletMatch[1]
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
        );
        mainHtml += `<li>${formatted}</li>`;
        continue;
      }

      if (inBullets) {
        mainHtml += '</ul></div>';
        inBullets = false;
      }

      // Standard paragraph
      const formattedP = autoHighlightKeywords(
        line
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>')
          .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      );
      mainHtml += `<p class="split-paragraph">${formattedP}</p>`;
    }

    if (inBullets) {
      mainHtml += '</ul></div>';
      inBullets = false;
    }
    mainHtml += '</div>'; // close split-section
  }

  // ── Build Sidebar Column HTML ───────────────────────────────────────
  let sidebarHtml = '';
  if (showPhoto) {
    sidebarHtml += `<div class="sidebar-avatar-wrapper"><img src="${options.photoUrl}" alt="${name}" class="sidebar-avatar-img" /></div>`;
  }

  if (linkedin) {
    sidebarHtml += `<div class="sidebar-linkedin-wrapper"><a href="${linkedin}" target="_blank" rel="noopener noreferrer" class="sidebar-linkedin-btn">${linkedinIcon}<span>${linkedinDisplay || 'LinkedIn'}</span></a></div>`;
  }

  for (const sec of sidebarSections) {
    sidebarHtml += '<div class="sidebar-section">';
    sidebarHtml += `<div class="sidebar-section-header"><div class="sidebar-section-title">${sec.title}</div><div class="sidebar-section-rule"></div></div>`;

    const isEducation = /EDUCATION|DEGREE/i.test(sec.title);
    const isAwards = /AWARD|RECOGNITION|HONOR/i.test(sec.title);

    if (isEducation || isAwards) {
      for (let k = 0; k < sec.lines.length; k++) {
        const line = sec.lines[k];
        if (line.startsWith('### ') || line.includes('|')) {
          const clean = line.replace(/^###\s*/, '').replace(/^\*\*|\*\*$/g, '').trim();
          const parts = clean.split('|');
          const titleText = parts[0].trim();
          const datesOrOrg = parts[1] ? parts[1].trim() : '';
          const thirdPart = parts[2] ? parts[2].trim() : '';

          let subtitleText = thirdPart;
          if (k + 1 < sec.lines.length && (sec.lines[k + 1].startsWith('*') || sec.lines[k + 1].includes('|'))) {
            subtitleText = sec.lines[k + 1].replace(/^\*+|\*+$/g, '').replace(/^_+|_+$/g, '').trim();
            k++;
          }

          sidebarHtml += '<div class="sidebar-entry">';
          if (datesOrOrg) sidebarHtml += `<div class="sidebar-entry-dates">${datesOrOrg}</div>`;
          sidebarHtml += `<div class="sidebar-entry-title">${titleText}</div>`;
          if (subtitleText) sidebarHtml += `<div class="sidebar-entry-subtitle">${subtitleText}</div>`;
          sidebarHtml += '</div>';
        } else if (line.startsWith('-') || line.startsWith('•')) {
          const content = line.replace(/^[-*•]\s*/, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
          sidebarHtml += `<div class="sidebar-bullet-item">• ${content}</div>`;
        }
      }
    } else {
      // Grouped pill badges (Skills, Languages, Frameworks, Architecture, DevOps)
      for (const line of sec.lines) {
        const bulletMatch = line.match(/^[-*•]\s+(.*)$/);
        const textToParse = bulletMatch ? bulletMatch[1].trim() : line;

        const catMatch = textToParse.match(/^\*\*(.*?)\*\*[\s:—–-]+(.*)$/) || textToParse.match(/^(.*?)[\s:—–-]+(.*)$/);
        if (catMatch && catMatch[1].length < 40) {
          const categoryName = catMatch[1].replace(/\*\*/g, '').trim();
          const itemsRaw = catMatch[2].replace(/\*\*/g, '').trim();
          const badges = itemsRaw.split(/[,•|·]/).map(b => b.trim()).filter(Boolean);

          sidebarHtml += '<div class="sidebar-category-group">';
          sidebarHtml += `<div class="sidebar-category-name">${categoryName}</div>`;
          sidebarHtml += '<div class="sidebar-pill-cluster">';
          for (const b of badges) {
            sidebarHtml += `<span class="sidebar-pill-badge">${b}</span>`;
          }
          sidebarHtml += '</div></div>';
        } else {
          const badges = textToParse.replace(/\*\*/g, '').split(/[,•|·]/).map(b => b.trim()).filter(Boolean);
          sidebarHtml += '<div class="sidebar-pill-cluster">';
          for (const b of badges) {
            sidebarHtml += `<span class="sidebar-pill-badge">${b}</span>`;
          }
          sidebarHtml += '</div>';
        }
      }
    }

    sidebarHtml += '</div>'; // close sidebar-section
  }

  return `<div class="cv-styled-document split-sidebar-wrapper" style="--cv-sidebar-bg: ${sidebarBg}; --cv-text-color: #1c202d;">` +
    `<div class="split-main-col">${mainHtml}</div>` +
    `<div class="split-sidebar-col">${sidebarHtml}</div>` +
  `</div>`;
}

export function parseMarkdownToHtml(markdown: string, options: CVParseOptions = {}): string {
  if (!markdown) return '';

  if (options.template === 'split-sidebar-right') {
    return renderSplitSidebarRight(markdown, options);
  }

  const isModern = options.template !== 'classic-ats';
  const showLinkIcons = options.showLinkIcons !== false;
  const accentColor = options.accentColor || (isModern ? '#2563eb' : '#475569');
  const showPhoto = options.showPhoto && options.photoUrl;

  const textColorMap: Record<string, string> = {
    '#475569': '#1e293b',
    '#7c3aed': '#1e1b2e',
    '#2563eb': '#0f172a',
    '#059669': '#062e24',
    '#e11d48': '#271016'
  };
  const bodyTextColor = textColorMap[accentColor] || '#1f2937';

  // Normalize newlines and basic entity safety without breaking ampersands
  const lines = markdown
    .replace(/&amp;/g, '&')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\r\n/g, '\n')
    .split('\n');

  const processedLines: string[] = [];
  let inSkills = false;
  let skillsListOpen = false;
  let inList = false;
  let sawH1 = false;
  let sawSubtitle = false;
  let timelineOpen = false;

  const mailIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:4px;"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`;
  const phoneIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:4px;"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`;
  const pinIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:4px;"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`;
  const linkedinIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:4px;"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>`;
  const globeIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:4px;"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>`;
  const linkExtIcon = `<span class="timeline-link-icon" title="External link" style="display:inline-block; vertical-align:middle; margin-left:5px; cursor:pointer;"><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg></span>`;

  const closeOpenElements = () => {
    if (skillsListOpen) {
      processedLines.push(isModern ? '</div>' : '</ul>');
      skillsListOpen = false;
    }
    if (inList) {
      processedLines.push('</ul>');
      inList = false;
    }
    if (timelineOpen) {
      processedLines.push('</div></div>'); // close timeline-right and timeline-entry
      timelineOpen = false;
    }
  };

  let pendingHeaderName = '';
  let pendingSubtitle = '';
  let pendingContactHtml = '';

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();
    if (!line) continue;

    // 1. Check for H1 (Name at top)
    if (!sawH1 && (line.startsWith('# ') || (!line.startsWith('##') && !line.includes('@') && i < 3 && line.length < 50 && !isSectionHeading(line)))) {
      closeOpenElements();
      inSkills = false;

      const name = line.replace(/^#+\s*/, '').replace(/\*+/g, '').trim();
      pendingHeaderName = name;
      sawH1 = true;
      continue;
    }

    // 2. Subtitle check (Target Role right below H1)
    if (sawH1 && !sawSubtitle && !line.includes('@') && !line.includes('+') && !line.startsWith('##') && !isSectionHeading(line)) {
      const subtitle = line.replace(/^[\*\_#\s]+|[\*\_#\s]+$/g, '').trim();
      pendingSubtitle = subtitle;
      sawSubtitle = true;
      continue;
    }

    // 3. Contact info row check
    if (line.includes('@') || line.includes('linkedin.com') || (line.includes('+') && line.length < 150)) {
      const rawParts = line.split(/[|•·]/).map(p => p.trim()).filter(Boolean);
      const formattedParts = rawParts.map((part) => {
        let item = part.replace(/^[\*\_\[\]]+|[\*\_\[\]]+$/g, '').trim();
        const linkMatch = item.match(/\[(.*?)\]\((.*?)\)/);
        if (linkMatch) {
          item = linkMatch[1];
        }

        if (item.includes('@')) {
          return `<span class="contact-item">${mailIcon}<a href="mailto:${item}">${item}</a></span>`;
        } else if (item.includes('linkedin.com')) {
          const displayLink = item.replace(/^(https?:\/\/)?(www\.)?/, '');
          const hrefLink = item.startsWith('http') ? item : `https://${item}`;
          return `<span class="contact-item">${linkedinIcon}<a href="${hrefLink}" target="_blank" rel="noopener noreferrer">${displayLink}</a></span>`;
        } else if (/\+?\d[\d-\s()]{6,}\d/.test(item)) {
          return `<span class="contact-item">${phoneIcon}<span>${item}</span></span>`;
        } else if (item.includes('.com') || item.includes('.io') || item.includes('.me') || item.includes('http')) {
          const displayLink = item.replace(/^(https?:\/\/)?(www\.)?/, '');
          const hrefLink = item.startsWith('http') ? item : `https://${item}`;
          return `<span class="contact-item">${globeIcon}<a href="${hrefLink}" target="_blank" rel="noopener noreferrer">${displayLink}</a></span>`;
        } else {
          return `<span class="contact-item">${pinIcon}<span>${item}</span></span>`;
        }
      });

      pendingContactHtml = formattedParts.join('');

      // Emit header block based on template
      if (isModern) {
        processedLines.push(
          `<div class="modern-header">` +
            (showPhoto ? `<div class="modern-avatar-col"><img src="${options.photoUrl}" alt="${pendingHeaderName}" class="modern-avatar-headshot" /></div>` : '') +
            `<div class="modern-header-col">` +
              `<h1 class="modern-name">${pendingHeaderName}</h1>` +
              (pendingSubtitle ? `<div class="modern-subtitle">${pendingSubtitle}</div>` : '') +
              `<div class="modern-contact-grid">${pendingContactHtml}</div>` +
            `</div>` +
          `</div>`
        );
      } else {
        if (showPhoto) {
          processedLines.push(
            `<div class="cv-header-photo-wrapper">` +
              `<img src="${options.photoUrl}" alt="${pendingHeaderName}" class="cv-avatar-headshot" />` +
              `<div class="cv-header-photo-info">` +
                `<h1>${pendingHeaderName}</h1>` +
                (pendingSubtitle ? `<div class="subtitle">${pendingSubtitle}</div>` : '') +
                `<div class="contact-row">${pendingContactHtml}</div>` +
              `</div>` +
            `</div>`
          );
        } else {
          processedLines.push(`<h1>${pendingHeaderName}</h1>`);
          if (pendingSubtitle) processedLines.push(`<div class="subtitle">${pendingSubtitle}</div>`);
          processedLines.push(`<div class="contact-row">${pendingContactHtml}</div>`);
        }
      }
      continue;
    }

    // 4. Check for Section Heading (e.g. ## Executive Profile or **Professional Experience**)
    if (line.startsWith('## ') || isSectionHeading(line)) {
      closeOpenElements();

      const title = toTitleCase(line);
      const cleanUpper = line
        .replace(/^#+\s*/, '')
        .replace(/\*+/g, '')
        .replace(/_+/g, '')
        .replace(/&amp;/gi, '&')
        .trim()
        .toUpperCase();

      if (isModern) {
        processedLines.push(`<h2 class="modern-section-title">${title}</h2>`);
        processedLines.push(`<div class="zigzag-divider"></div>`);
      } else {
        processedLines.push(`<h2>${cleanUpper}</h2>`);
      }

      if (cleanUpper.includes('SKILL') || cleanUpper.includes('COMPETENC')) {
        inSkills = true;
      } else {
        inSkills = false;
      }
      continue;
    }

    // 5. Check for H3 / Role Title & Dates Row
    // Matches: '### Title | Dates', '**Title** | Dates', or 'Title | Dates'
    if (line.startsWith('### ') || (line.includes('|') && !line.startsWith('*') && (line.includes('Present') || /\d{4}/.test(line)))) {
      closeOpenElements();

      const cleanLine = line.replace(/^###\s*/, '').replace(/^\*\*|\*\*$/g, '').trim();
      const parts = cleanLine.split('|');
      const roleTitle = parts[0].trim();
      const roleDates = parts[1] ? parts[1].trim() : '';

      // Look ahead for company/location row on next line
      let company = '';
      let location = '';
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim();
        if (nextLine.startsWith('*') || (nextLine.includes('|') && !nextLine.startsWith('#') && !nextLine.startsWith('-') && !nextLine.startsWith('•'))) {
          const cleanNext = nextLine.replace(/^\*+|\*+$/g, '').replace(/^_+|_+$/g, '').trim();
          const nextParts = cleanNext.split('|');
          company = nextParts[0].trim();
          location = nextParts[1] ? nextParts[1].trim() : '';
          i++; // Consume next line
        }
      }

      if (isModern) {
        // Modern Left-Rail Timeline
        const linkBadge = showLinkIcons ? linkExtIcon : '';
        processedLines.push(
          `<div class="modern-timeline-entry">` +
            `<div class="modern-timeline-left">` +
              `<div class="timeline-date">${roleDates}</div>` +
              (location ? `<div class="timeline-location">${location}</div>` : '') +
            `</div>` +
            `<div class="modern-timeline-right">` +
              (company ? `<div class="timeline-company-row"><span class="timeline-company">${company}</span>${linkBadge}</div>` : '') +
              `<div class="timeline-role">${roleTitle}</div>`
        );
        timelineOpen = true;
      } else {
        // Classic ATS
        processedLines.push(
          `<div class="role-row">` +
            `<span class="role-title">${roleTitle}</span>` +
            (roleDates ? `<span class="role-dates">${roleDates}</span>` : '') +
          `</div>`
        );
        if (company || location) {
          processedLines.push(
            `<div class="company-row">` +
              `<span class="company-name">${company}</span>` +
              (location ? `<span class="company-location">${location}</span>` : '') +
            `</div>`
          );
        }
      }
      continue;
    }

    // 6. Check for standalone Company & Location Row (if not consumed above)
    if ((line.startsWith('*') && line.includes('|')) || (line.includes('|') && (line.includes('Dubai') || line.includes('UAE') || line.includes('India') || line.includes('USA') || line.includes('London')))) {
      const cleanContent = line.replace(/^\*+|\*+$/g, '').replace(/^_+|_+$/g, '').trim();
      const parts = cleanContent.split('|');
      const company = parts[0].trim();
      const location = parts[1] ? parts[1].trim() : '';

      if (isModern && timelineOpen) {
        const linkBadge = showLinkIcons ? linkExtIcon : '';
        processedLines.push(
          `<div class="timeline-company-row"><span class="timeline-company">${company}</span>${linkBadge}</div>`
        );
      } else {
        processedLines.push(
          `<div class="company-row">` +
            `<span class="company-name">${company}</span>` +
            (location ? `<span class="company-location">${location}</span>` : '') +
          `</div>`
        );
      }
      continue;
    }

    // Skip horizontal rules
    if (line === '---' || line === '***') {
      continue;
    }

    // 7. Bullet Points Parsing (Lists & Skills)
    const bulletMatch = line.match(/^[-*•]\s+(.*)$/);
    if (bulletMatch) {
      const content = bulletMatch[1].trim();

      if (inSkills) {
        if (isModern) {
          // Modern Boxed Skill Cards
          if (!skillsListOpen) {
            processedLines.push('<div class="modern-skills-container">');
            skillsListOpen = true;
          }

          let formattedContent = autoHighlightKeywords(
            content
              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              .replace(/\*(.*?)\*/g, '<em>$1</em>')
              .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
          );

          const categoryMatch = content.match(/^\*\*(.*?)\*\*[\s:—–-]+(.*)$/) || content.match(/^(.*?)[\s:—–-]+(.*)$/);
          if (categoryMatch && categoryMatch[1].length < 50) {
            let catName = categoryMatch[1].replace(/\*\*/g, '').trim();
            let remainder = autoHighlightKeywords(
              categoryMatch[2]
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .trim()
            );
            processedLines.push(
              `<div class="modern-skill-card">` +
                `<strong class="skill-category">${catName} — </strong>${remainder}` +
              `</div>`
            );
          } else {
            processedLines.push(`<div class="modern-skill-card">${formattedContent}</div>`);
          }
        } else {
          // Classic 2-column list
          if (!skillsListOpen) {
            processedLines.push('<ul class="skills-list">');
            skillsListOpen = true;
          }

          let formattedContent = autoHighlightKeywords(
            content
              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              .replace(/\*(.*?)\*/g, '<em>$1</em>')
              .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
          );

          const categoryMatch = content.match(/^\*\*(.*?)\*\*:\s*(.*)$/) || content.match(/^(.*?):\s*(.*)$/);
          if (categoryMatch && categoryMatch[1].length < 40) {
            let remainder = autoHighlightKeywords(
              categoryMatch[2]
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .trim()
            );
              
            processedLines.push(`<li><strong class="skill-category">${categoryMatch[1]}: </strong>${remainder}</li>`);
          } else {
            processedLines.push(`<li>${formattedContent}</li>`);
          }
        }
      } else {
        // Standard experience / highlights bullets with rich keyword bolding
        if (!inList) {
          processedLines.push(isModern && timelineOpen ? '<ul class="timeline-bullets">' : '<ul>');
          inList = true;
        }
        
        let formattedContent = autoHighlightKeywords(
          content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
        );

        processedLines.push(`<li>${formattedContent}</li>`);
      }
      continue;
    }

    // Close open lists if on non-bullet line
    if (!bulletMatch && line) {
      if (skillsListOpen) {
        processedLines.push(isModern ? '</div>' : '</ul>');
        skillsListOpen = false;
      }
      if (inList) {
        processedLines.push('</ul>');
        inList = false;
      }
    }

    // 8. Standard Paragraph Text
    if (line) {
      let formattedParagraph = autoHighlightKeywords(
        line
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>')
          .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      );

      processedLines.push(`<p>${formattedParagraph}</p>`);
    }
  }

  closeOpenElements();

  const rawHtml = processedLines.join('\n').replace(/\n{2,}/g, '\n');
  const rootClass = isModern ? 'cv-styled-document modern-timeline-wrapper' : 'cv-styled-document';
  return `<div class="${rootClass}" style="--cv-accent-color: ${accentColor}; --cv-text-color: ${bodyTextColor};">${rawHtml}</div>`;
}

export function stripMarkdown(markdown: string): string {
  if (!markdown) return '';
  return markdown
    .replace(/^#+\s+/gm, '')
    .replace(/^[-*•]\s+/gm, '• ')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/\[(.*?)\]\((.*?)\)/g, '$1 ($2)')
    .replace(/^---$/gm, '──────────────────────────────')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
