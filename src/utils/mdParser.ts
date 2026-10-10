// A customized, robust client-side Markdown to HTML parser tailored specifically for CVs.
// Supports both 'modern-timeline' (Vineet / Executive Style with left-rail dates, boxed skills cards, zigzag dividers, and left photo)
// and 'classic-ats' (Apple/MAANG style with centered double-line headers and 2-column grid).

export interface CVParseOptions {
  accentColor?: string;
  showPhoto?: boolean;
  photoUrl?: string;
  photoShape?: 'circle' | 'rounded' | 'square' | 'squircle';
  photoBorder?: 'accent' | 'subtle' | 'none';
  photoBorderWidth?: number; // 0 to 5 (0 means no border ring)
  classicSectionStyle?: 'double-line' | 'single-line' | 'filled-pill';
  layoutDensity?: 'compact' | 'standard';
  template?: 'modern-timeline' | 'classic-ats' | 'split-sidebar-right' | 'split-sidebar' | 'compact-executive' | 'swiss-minimalist' | string;
  fontFamily?: string;
}

export function getPhotoRadius(shape?: string): string {
  switch (shape) {
    case 'square': return '4px';
    case 'rounded': return '12px';
    case 'squircle': return '24%';
    case 'circle':
    default: return '50%';
  }
}

export function getPhotoBorder(border?: string, accent?: string, borderWidth?: number): string {
  if (borderWidth === 0 || border === 'none') {
    return 'none';
  }
  const width = borderWidth !== undefined ? borderWidth : 3;
  switch (border) {
    case 'subtle': return `${width}px solid #cbd5e1`;
    case 'none': return 'none';
    case 'accent':
    default: return `${width}px solid ${accent || '#111827'}`;
  }
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

export function cleanHeaderItem(text: string): string {
  if (!text) return '';
  return text
    .replace(/^#+\s*/, '')
    .replace(/^[-*•]\s+/, '')
    .replace(/^[\s*_—–-]+|[\s*_—–-]+$/g, '')
    .replace(/\*\*/g, '')
    .replace(/__/g, '')
    .replace(/^\*+|\*+$/g, '')
    .replace(/^_+|_+$/g, '')
    .replace(/&amp;/gi, '&')
    .trim();
}

function renderSplitSidebarRight(markdown: string, options: CVParseOptions = {}): string {
  const sidebarBg = options.accentColor || '#1c2d42';
  const showPhoto = options.showPhoto && options.photoUrl;
  const fontFamily = options.fontFamily || 'Plus Jakarta Sans';

  const mailIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; flex-shrink:0;"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`;
  const phoneIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; flex-shrink:0;"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`;
  const pinIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; flex-shrink:0;"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`;
  const linkedinIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; flex-shrink:0;"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>`;
  const globeIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; flex-shrink:0;"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>`;

  const getSectionIconSvg = (title: string, isSidebar: boolean): string => {
    const strokeColor = isSidebar ? '#ffffff' : '#1e293b';
    const upper = title.toUpperCase();
    if (upper.includes('PROFILE') || upper.includes('SUMMARY') || upper.includes('ABOUT')) {
      return `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="${strokeColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; flex-shrink:0;"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
    }
    if (upper.includes('EXPERIENCE') || upper.includes('EMPLOYMENT') || upper.includes('CAREER') || upper.includes('WORK')) {
      return `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="${strokeColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; flex-shrink:0;"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`;
    }
    if (upper.includes('EDUCATION') || upper.includes('DEGREE') || upper.includes('ACADEMIC')) {
      return `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="${strokeColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; flex-shrink:0;"><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/></svg>`;
    }
    if (upper.includes('SKILL') || upper.includes('COMPETENC') || upper.includes('EXPERTISE')) {
      return `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="${strokeColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; flex-shrink:0;"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>`;
    }
    if (upper.includes('LANG')) {
      return `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="${strokeColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; flex-shrink:0;"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>`;
    }
    if (upper.includes('AWARD') || upper.includes('HONOR') || upper.includes('RECOGNITION')) {
      return `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="${strokeColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; flex-shrink:0;"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>`;
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="${strokeColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; flex-shrink:0;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
  };

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
  let website = '';
  let websiteDisplay = '';

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

    // 1. Candidate Name (H1 or first line)
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
    if (!currentSection && (line.includes('@') || line.includes('+') || line.includes('linkedin.com') || line.includes('.com') || line.includes('.me') || line.includes('.io'))) {
      const parts = line.split(/[|•·]/).map(p => p.trim()).filter(Boolean);
      for (const part of parts) {
        let clean = part.replace(/^[*_[\]]+|[*_[\]]+$/g, '').trim();
        const linkMatch = clean.match(/\[(.*?)\]\((.*?)\)/);
        if (linkMatch) clean = linkMatch[1];

        if (clean.includes('@')) {
          email = clean.replace(/\s+/g, '');
        } else if (clean.includes('linkedin.com')) {
          linkedin = clean.startsWith('http') ? clean : 'https://' + clean;
          linkedinDisplay = clean.includes('/in/') ? clean.split('/in/')[1] : clean.replace(/^(https?:\/\/)?(www\.)?linkedin\.com\/?/, '');
        } else if (/\+?\d[\d-\s()]{6,}\d/.test(clean)) {
          phone = clean;
        } else if (clean.includes('.com') || clean.includes('.io') || clean.includes('.me') || clean.includes('http')) {
          website = clean.startsWith('http') ? clean : 'https://' + clean;
          websiteDisplay = clean.replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/$/, '');
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

  // Sidebar sections: Profile, Languages, Awards, Certifications, Volunteer, Interests
  const isSidebarSection = (title: string): boolean => {
    return /(?:PROFILE|SUMMARY|ABOUT|LANGUAGE|AWARD|RECOGNITION|HONOR|CERTIF|LICENSE|VOLUNTEER|INTEREST|HOBB)/i.test(title);
  };

  const sidebarSections = sections.filter(s => isSidebarSection(s.title));
  const mainSections = sections.filter(s => !isSidebarSection(s.title));

  // ── Build Left Sidebar HTML ─────────────────────────────────────────
  let sidebarHtml = '';

  // 1. Candidate Header (Name & Subtitle)
  sidebarHtml += '<div class="sidebar-header">';
  sidebarHtml += `<h1 class="split-name">${name}</h1>`;
  if (subtitle) {
    sidebarHtml += `<div class="split-subtitle">${subtitle}</div>`;
  }
  sidebarHtml += '</div>';

  // 2. Avatar Photo
  const photoShape = options.photoShape || 'circle';
  const photoBorder = options.photoBorder || 'subtle';
  const photoRadius = getPhotoRadius(photoShape);
  const photoBorderStyle = getPhotoBorder(photoBorder, '#ffffff', options.photoBorderWidth);

  if (showPhoto) {
    sidebarHtml += `<div class="sidebar-avatar-wrapper"><img src="${options.photoUrl}" alt="${name}" class="sidebar-avatar-img" data-shape="${photoShape}" data-border="${photoBorder}" style="border-radius:${photoRadius} !important; border:${photoBorderStyle} !important; object-fit:cover;" /></div>`;
  }

  // 3. Contact Info List
  const contactItems: string[] = [];
  if (email) contactItems.push(`<div class="split-contact-item">${mailIcon}<a href="mailto:${email}">${email}</a></div>`);
  if (phone) contactItems.push(`<div class="split-contact-item">${phoneIcon}<span>${phone}</span></div>`);
  if (location) contactItems.push(`<div class="split-contact-item">${pinIcon}<span>${location}</span></div>`);
  if (linkedin) contactItems.push(`<div class="split-contact-item">${linkedinIcon}<a href="${linkedin}" target="_blank" rel="noopener noreferrer">${linkedinDisplay || 'linkedin'}</a></div>`);
  if (website) contactItems.push(`<div class="split-contact-item">${globeIcon}<a href="${website}" target="_blank" rel="noopener noreferrer">${websiteDisplay || website}</a></div>`);

  if (contactItems.length > 0) {
    sidebarHtml += `<div class="sidebar-contact-list">${contactItems.join('')}</div>`;
  }

  // 4. Sidebar Sections (Profile, Languages, Awards, etc.)
  for (const sec of sidebarSections) {
    sidebarHtml += '<div class="sidebar-section">';
    sidebarHtml += `<div class="sidebar-section-pill">${getSectionIconSvg(sec.title, true)}<span class="sidebar-section-title">${sec.title}</span></div>`;

    const isProfile = /PROFILE|SUMMARY|ABOUT/i.test(sec.title);
    const isLanguages = /LANG/i.test(sec.title);
    const isAwards = /AWARD|HONOR|RECOGNITION/i.test(sec.title);

    if (isProfile) {
      for (const line of sec.lines) {
        if (!line.trim()) continue;
        const formattedP = autoHighlightKeywords(
          line
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
        );
        sidebarHtml += `<p class="sidebar-profile-text">${formattedP}</p>`;
      }
    } else if (isLanguages) {
      for (const line of sec.lines) {
        if (!line.trim()) continue;
        const clean = line.replace(/^[-*•]\s+/, '').trim();
        let langName = clean;
        let level = 5;

        // Check for rating dots or proficiency
        const parenMatch = clean.match(/^(.*?)\s*\((.*?)\)$/) || clean.match(/^(.*?)\s*[:—–-]\s*(.*)$/);
        if (parenMatch) {
          langName = parenMatch[1].replace(/\*\*/g, '').trim();
          const levelStr = parenMatch[2].toLowerCase();
          if (levelStr.includes('native') || levelStr.includes('bilingual') || levelStr.includes('c2') || levelStr.includes('5')) {
            level = 5;
          } else if (levelStr.includes('fluent') || levelStr.includes('advanced') || levelStr.includes('c1') || levelStr.includes('4')) {
            level = 4;
          } else if (levelStr.includes('intermediate') || levelStr.includes('conversational') || levelStr.includes('b2') || levelStr.includes('b1') || levelStr.includes('3')) {
            level = 3;
          } else if (levelStr.includes('basic') || levelStr.includes('elementary') || levelStr.includes('a2') || levelStr.includes('2')) {
            level = 2;
          } else if (levelStr.includes('beginner') || levelStr.includes('a1') || levelStr.includes('1')) {
            level = 1;
          }
        }

        sidebarHtml += `<div class="sidebar-language-item">` +
          `<span class="sidebar-language-name">${langName}</span>` +
          `<span class="sidebar-language-dots">` +
            `<span class="sidebar-dot ${level >= 1 ? 'filled' : 'empty'}"></span>` +
            `<span class="sidebar-dot ${level >= 2 ? 'filled' : 'empty'}"></span>` +
            `<span class="sidebar-dot ${level >= 3 ? 'filled' : 'empty'}"></span>` +
            `<span class="sidebar-dot ${level >= 4 ? 'filled' : 'empty'}"></span>` +
            `<span class="sidebar-dot ${level >= 5 ? 'filled' : 'empty'}"></span>` +
          `</span>` +
        `</div>`;
      }
    } else if (isAwards) {
      for (let k = 0; k < sec.lines.length; k++) {
        const line = sec.lines[k];
        if (!line.trim()) continue;
        const cleanLine = line.replace(/^###\s*/, '').replace(/^[-*•]\s+/, '').trim();
        
        // Parse Title — Org, Year or Title | Year
        let awardTitle = cleanLine;
        let awardOrg = '';

        if (cleanLine.includes('|')) {
          const parts = cleanLine.split('|');
          awardTitle = cleanHeaderItem(parts[0]);
          awardOrg = cleanHeaderItem(parts[1]);
        } else if (cleanLine.includes('—') || cleanLine.includes('–')) {
          const parts = cleanLine.split(/[—–]/);
          awardTitle = cleanHeaderItem(parts[0]);
          awardOrg = cleanHeaderItem(parts[1]);
        } else if (cleanLine.startsWith('**') && cleanLine.includes('**')) {
          const boldMatch = cleanLine.match(/^\*\*(.*?)\*\*(.*)$/);
          if (boldMatch) {
            awardTitle = boldMatch[1].trim();
            awardOrg = cleanHeaderItem(boldMatch[2].replace(/^[\s:—–-]+/, ''));
          }
        } else if (k + 1 < sec.lines.length && (sec.lines[k + 1].startsWith('*') || sec.lines[k + 1].startsWith('_'))) {
          awardOrg = cleanHeaderItem(sec.lines[k + 1]);
          k++;
        }

        sidebarHtml += `<div class="sidebar-award-item">` +
          `<div class="sidebar-award-title">${awardTitle}</div>` +
          (awardOrg ? `<div class="sidebar-award-org">${awardOrg}</div>` : '') +
        `</div>`;
      }
    } else {
      // General sidebar items (bullets or paragraphs)
      for (const line of sec.lines) {
        if (!line.trim()) continue;
        if (line.startsWith('-') || line.startsWith('•') || line.startsWith('*')) {
          const content = cleanHeaderItem(line.replace(/^[-*•]\s*/, ''));
          sidebarHtml += `<div class="sidebar-bullet-item">• ${content}</div>`;
        } else {
          sidebarHtml += `<p class="sidebar-profile-text">${line}</p>`;
        }
      }
    }

    sidebarHtml += '</div>'; // close sidebar-section
  }

  // ── Build Right Main Column HTML ────────────────────────────────────
  let mainHtml = '';

  for (const sec of mainSections) {
    mainHtml += '<div class="split-section">';
    mainHtml += `<div class="main-section-pill">${getSectionIconSvg(sec.title, false)}<h2 class="split-section-title">${sec.title}</h2></div>`;

    const isEducation = /EDUCATION|DEGREE|ACADEMIC/i.test(sec.title);
    const isSkills = /SKILL|COMPETENC/i.test(sec.title);

    if (isEducation) {
      for (let k = 0; k < sec.lines.length; k++) {
        const line = sec.lines[k];
        if (!line.trim()) continue;

        if (line.startsWith('### ') || line.includes('|') || line.includes('Present') || /\b(?:19|20)\d{2}\b/.test(line)) {
          const cleanLine = line.replace(/^###\s*/, '').replace(/^[-*•]\s+/, '').trim();
          const parts = cleanLine.split('|');
          let degree = cleanHeaderItem(parts[0] || '');
          let dates = cleanHeaderItem(parts[1] || '');
          let school = cleanHeaderItem(parts[2] || '');
          let loc = cleanHeaderItem(parts[3] || '');

          if (k + 1 < sec.lines.length) {
            const nextLine = sec.lines[k + 1].trim();
            if (nextLine.startsWith('*') || (nextLine.includes('|') && !nextLine.startsWith('###') && !nextLine.startsWith('-'))) {
              const nextParts = nextLine.split('|');
              if (!school) school = cleanHeaderItem(nextParts[0] || '');
              if (!loc) loc = cleanHeaderItem(nextParts[1] || '');
              k++;
            }
          }

          mainHtml += '<div class="split-edu-entry">';
          mainHtml += `<div class="split-degree-name">${degree}</div>`;
          if (school) mainHtml += `<div class="split-school-name">${school}</div>`;
          if (dates || loc) mainHtml += `<div class="split-edu-dates">${dates}${loc ? ` | ${loc}` : ''}</div>`;
          mainHtml += '</div>';
        } else if (line.startsWith('-') || line.startsWith('•')) {
          const content = cleanHeaderItem(line.replace(/^[-*•]\s*/, ''));
          mainHtml += `<div class="split-bullets li">${content}</div>`;
        }
      }
    } else if (isSkills) {
      mainHtml += '<ul class="split-bullets split-skills-list">';
      for (const line of sec.lines) {
        if (!line.trim()) continue;
        const cleanBullet = line.replace(/^[-*•]\s+/, '').trim();
        const formatted = autoHighlightKeywords(
          cleanBullet
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
        );
        mainHtml += `<li>${formatted}</li>`;
      }
      mainHtml += '</ul>';
    } else {
      // Work Experience or General Sections
      let inBullets = false;
      for (let j = 0; j < sec.lines.length; j++) {
        const line = sec.lines[j];
        if (!line.trim()) continue;

        // Role header: ### Title | Dates or Company header
        const isDateRow = line.includes('Present') || /\b(?:19|20)\d{2}\b/.test(line);
        const isH3 = line.startsWith('### ');
        if (isH3 || (line.includes('|') && isDateRow)) {
          if (inBullets) {
            mainHtml += '</ul></div>';
            inBullets = false;
          }
          const cleanLine = line.replace(/^###\s*/, '').replace(/^[-*•]\s+/, '').trim();
          const parts = cleanLine.split('|');
          const roleTitle = cleanHeaderItem(parts[0]);
          const roleDates = cleanHeaderItem(parts[1] || '');

          let company = cleanHeaderItem(parts[2] || '');
          let roleLoc = cleanHeaderItem(parts[3] || '');
          if (j + 1 < sec.lines.length) {
            const nextLine = sec.lines[j + 1].trim();
            const isNextRole = nextLine.startsWith('### ') || (nextLine.includes('|') && (nextLine.includes('Present') || /\b(?:19|20)\d{2}\b/.test(nextLine)));
            const isNextHeader = nextLine.startsWith('#');
            if (!isNextRole && !isNextHeader && (nextLine.startsWith('*') || (nextLine.includes('|') && !nextLine.startsWith('-') && !nextLine.startsWith('•')))) {
              const nextParts = nextLine.split('|');
              if (!company) company = cleanHeaderItem(nextParts[0] || '');
              if (!roleLoc) roleLoc = cleanHeaderItem(nextParts[1] || '');
              j++;
            }
          }

          mainHtml += '<div class="split-role-entry">';
          if (company) {
            mainHtml += `<div class="split-company-name">${company}</div>`;
          }
          mainHtml += `<div class="split-role-title">${roleTitle}</div>`;
          if (roleDates || roleLoc) {
            mainHtml += `<div class="split-role-dates">${roleDates}${roleLoc ? ` | ${roleLoc}` : ''}</div>`;
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
    }

    mainHtml += '</div>'; // close split-section
  }

  return `<div class="cv-styled-document split-sidebar-wrapper" style="--cv-sidebar-bg: ${sidebarBg}; --cv-text-color: #111827; font-family: var(--cv-font-family, '${fontFamily}', sans-serif);">` +
    `<div class="split-sidebar-col">${sidebarHtml}</div>` +
    `<div class="split-main-col">${mainHtml}</div>` +
  `</div>`;
}

export function parseMarkdownToHtml(markdown: string, options: CVParseOptions = {}): string {
  if (!markdown) return '';

  if (options.template === 'split-sidebar-right') {
    return renderSplitSidebarRight(markdown, options);
  }

  const isModern = options.template !== 'classic-ats';
  const accentColor = options.accentColor || (isModern ? '#2563eb' : '#475569');
  const showPhoto = options.showPhoto && options.photoUrl;
  const photoShape = options.photoShape || 'circle';
  const photoBorder = options.photoBorder || 'accent';
  const photoRadius = getPhotoRadius(photoShape);
  const photoBorderStyle = getPhotoBorder(photoBorder, accentColor, options.photoBorderWidth);
  const fontFamily = options.fontFamily || 'Plus Jakarta Sans';

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
  let inEducation = false;
  let inAwards = false;
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
  let headerEmitted = false;

  const emitCandidateHeader = () => {
    if (headerEmitted) return;
    headerEmitted = true;

    if (isModern) {
      processedLines.push(
        `<div class="modern-header">` +
          (showPhoto ? `<div class="modern-avatar-col"><img src="${options.photoUrl}" alt="${pendingHeaderName}" class="modern-avatar-headshot" data-shape="${photoShape}" data-border="${photoBorder}" data-border-width="${options.photoBorderWidth !== undefined ? options.photoBorderWidth : 3}" style="border-radius:${photoRadius} !important; border:${photoBorderStyle} !important; object-fit:cover;" /></div>` : '') +
          `<div class="modern-header-col">` +
            `<h1 class="modern-name">${pendingHeaderName}</h1>` +
            (pendingSubtitle ? `<div class="modern-subtitle">${pendingSubtitle}</div>` : '') +
            (pendingContactHtml ? `<div class="modern-contact-grid">${pendingContactHtml}</div>` : '') +
          `</div>` +
        `</div>`
      );
    } else {
      if (showPhoto) {
        processedLines.push(
          `<div class="cv-header-photo-wrapper">` +
            `<img src="${options.photoUrl}" alt="${pendingHeaderName}" class="cv-avatar-headshot" data-shape="${photoShape}" data-border="${photoBorder}" data-border-width="${options.photoBorderWidth !== undefined ? options.photoBorderWidth : 3}" style="border-radius:${photoRadius} !important; border:${photoBorderStyle} !important; object-fit:cover;" />` +
            `<div class="cv-header-photo-info">` +
              `<h1>${pendingHeaderName}</h1>` +
              (pendingSubtitle ? `<div class="subtitle">${pendingSubtitle}</div>` : '') +
              (pendingContactHtml ? `<div class="contact-row">${pendingContactHtml}</div>` : '') +
            `</div>` +
          `</div>`
        );
      } else {
        processedLines.push(`<h1>${pendingHeaderName}</h1>`);
        if (pendingSubtitle) processedLines.push(`<div class="subtitle">${pendingSubtitle}</div>`);
        if (pendingContactHtml) processedLines.push(`<div class="contact-row">${pendingContactHtml}</div>`);
      }
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();
    if (!line) continue;

    // 1. Check for H1 (Name at top of document)
    if (!sawH1 && !headerEmitted && (line.startsWith('# ') || (!line.startsWith('##') && !line.includes('@') && i < 3 && line.length < 50 && !isSectionHeading(line)))) {
      closeOpenElements();
      inSkills = false;

      const name = line.replace(/^#+\s*/, '').replace(/\*+/g, '').trim();
      pendingHeaderName = name;
      sawH1 = true;
      continue;
    }

    // 2. Subtitle check (Target Role right below H1, strictly before sections)
    if (sawH1 && !sawSubtitle && !headerEmitted && !line.includes('@') && !line.startsWith('##') && !isSectionHeading(line) && !/\+?\d[\d\s\-\(\)\.]{7,}\d/.test(line)) {
      const subtitle = line.replace(/^[\*\_#\s]+|[\*\_#\s]+$/g, '').trim();
      pendingSubtitle = subtitle;
      sawSubtitle = true;
      continue;
    }

    // 3. Contact info row check (STRICTLY at top of document, only before sections, never in skills/experience)
    const isContactCandidate = !headerEmitted && i < 8 && !line.startsWith('##') && !isSectionHeading(line) && (
      line.includes('@') || 
      line.includes('linkedin.com') || 
      /\+?\d[\d\s\-\(\)\.]{7,}\d/.test(line) ||
      ((line.includes('.com') || line.includes('.io') || line.includes('.me') || line.includes('http')) && line.includes('|'))
    );

    if (isContactCandidate) {
      const rawParts = line.split(/[|•·]/).map(p => p.trim()).filter(Boolean);
      const formattedParts = rawParts.map((part) => {
        let item = part.replace(/^[\*\_\[\]]+|[\*\_\[\]]+$/g, '').trim();
        const linkMatch = item.match(/\[(.*?)\]\((.*?)\)/);
        if (linkMatch) {
          item = linkMatch[1];
        }

        if (item.includes('@')) {
          const cleanEmail = item.replace(/\s+/g, '');
          return `<span class="contact-item">${mailIcon}<a href="mailto:${cleanEmail}">${cleanEmail}</a></span>`;
        } else if (item.includes('linkedin.com')) {
          const displayLink = item.replace(/^(https?:\/\/)?(www\.)?/, '');
          const hrefLink = item.startsWith('http') ? item : `https://${item}`;
          return `<span class="contact-item">${linkedinIcon}<a href="${hrefLink}" target="_blank" rel="noopener noreferrer">${displayLink}</a></span>`;
        } else if (/\+?\d[\d\s\-\(\)\.]{7,}\d/.test(item)) {
          return `<span class="contact-item">${phoneIcon}<span>${item}</span></span>`;
        } else if (item.includes('.com') || item.includes('.io') || item.includes('.me') || item.includes('http')) {
          const displayLink = item.replace(/^(https?:\/\/)?(www\.)?/, '');
          const hrefLink = item.startsWith('http') ? item : `https://${item}`;
          return `<span class="contact-item">${globeIcon}<a href="${hrefLink}" target="_blank" rel="noopener noreferrer">${displayLink}</a></span>`;
        } else {
          return `<span class="contact-item">${pinIcon}<span>${item}</span></span>`;
        }
      });

      pendingContactHtml = formattedParts.join(' ');
      emitCandidateHeader();
      continue;
    }

    // 4. Check for Section Heading (e.g. ## Executive Profile or **Professional Experience**)
    if (line.startsWith('## ') || isSectionHeading(line)) {
      closeOpenElements();

      // Ensure candidate header is emitted before any section heading begins
      if (!headerEmitted && pendingHeaderName) {
        emitCandidateHeader();
      }

      const title = toTitleCase(line);
      const cleanUpper = line
        .replace(/^#+\s*/, '')
        .replace(/\*+/g, '')
        .replace(/_+/g, '')
        .replace(/&amp;/gi, '&')
        .trim()
        .toUpperCase();

      if (isModern) {
        processedLines.push(`<h2 class="modern-section-title" style="color: ${accentColor} !important;">${title}</h2>`);
        processedLines.push(`<div class="zigzag-divider"></div>`);
      } else {
        const headingStyleClass = `classic-heading-${options.classicSectionStyle || 'double-line'}`;
        processedLines.push(`<h2 class="${headingStyleClass}">${cleanUpper}</h2>`);
      }

      if (cleanUpper.includes('SKILL') || cleanUpper.includes('COMPETENC')) {
        inSkills = true;
      } else {
        inSkills = false;
      }
      inEducation = cleanUpper.includes('EDUCATION') || cleanUpper.includes('DEGREE');
      inAwards = cleanUpper.includes('AWARD') || cleanUpper.includes('RECOGNITION') || cleanUpper.includes('HONOR');
      continue;
    }

    // 5. Check for H3 / Role Title & Dates Row
    // Matches: '### Title | Dates', '**Title** | Dates', '- **Title** | Dates', or 'Title | Dates'
    const isDateRow = line.includes('Present') || /\b(?:19|20)\d{2}\b/.test(line);
    const isH3 = line.startsWith('### ');
    const isRoleHeader = isH3 || (line.includes('|') && (isDateRow || inAwards || inEducation));

    if (isRoleHeader) {
      closeOpenElements();

      const lineCleaned = line.replace(/^###\s*/, '').replace(/^[-*•]\s+/, '').trim();
      const parts = lineCleaned.split('|');
      const roleTitle = cleanHeaderItem(parts[0]);
      const roleDates = cleanHeaderItem(parts[1] || '');
      let company = cleanHeaderItem(parts[2] || '');
      let location = cleanHeaderItem(parts[3] || '');

      // Look ahead for company/location row on next line
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim();
        const isNextRole = nextLine.startsWith('### ') || (nextLine.includes('|') && (nextLine.includes('Present') || /\b(?:19|20)\d{2}\b/.test(nextLine)));
        const isSectionHeader = nextLine.startsWith('## ') || isSectionHeading(nextLine);

        if (!isNextRole && !isSectionHeader && (nextLine.startsWith('*') || (nextLine.includes('|') && !nextLine.startsWith('#') && !nextLine.startsWith('-') && !nextLine.startsWith('•')))) {
          const nextParts = nextLine.split('|');
          if (!company) company = cleanHeaderItem(nextParts[0] || '');
          if (!location) location = cleanHeaderItem(nextParts[1] || '');
          i++; // Consume next line
        }
      }

      if (isModern) {
        // Modern Left-Rail Timeline
        processedLines.push(
          `<div class="modern-timeline-entry">` +
            `<div class="modern-timeline-left">` +
              (roleDates ? `<div class="timeline-date">${roleDates}</div>` : '') +
              (location ? `<div class="timeline-location">${location}</div>` : '') +
            `</div>` +
            `<div class="modern-timeline-right">` +
              (company ? `<div class="timeline-company-row"><span class="timeline-company">${company}</span></div>` : '') +
              `<div class="timeline-role">${roleTitle}</div>`
        );
        timelineOpen = true;
      } else {
        // Classic ATS
        processedLines.push(
          `<div class="role-row">` +
            `<span class="role-title">${roleTitle}</span> ` +
            (roleDates ? `<span class="role-dates">${roleDates}</span>` : '') +
          `</div>`
        );
        if (company || location) {
          processedLines.push(
            `<div class="company-row">` +
              `<span class="company-name">${company}</span> ` +
              (location ? `<span class="company-location">${location}</span>` : '') +
            `</div>`
          );
        }
      }
      continue;
    }

    // 6. Check for standalone Company & Location Row (if not consumed above)
    if ((line.startsWith('*') && line.includes('|')) || (line.includes('|') && (line.includes('Dubai') || line.includes('UAE') || line.includes('India') || line.includes('USA') || line.includes('London')))) {
      const parts = line.split('|');
      const company = cleanHeaderItem(parts[0] || '');
      const location = cleanHeaderItem(parts[1] || '');

      if (isModern && timelineOpen) {
        processedLines.push(
          `<div class="timeline-company-row"><span class="timeline-company">${company}</span></div>`
        );
      } else {
        processedLines.push(
          `<div class="company-row">` +
            `<span class="company-name">${company}</span> ` +
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
  return `<div class="${rootClass}" style="--cv-accent-color: ${accentColor}; --cv-text-color: ${bodyTextColor}; font-family: var(--cv-font-family, '${fontFamily}', sans-serif);">${rawHtml}</div>`;
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
