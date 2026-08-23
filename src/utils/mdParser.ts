// A customized, robust client-side Markdown to HTML parser tailored specifically for CVs.
// Replicates the Apple/Vineet styling (centered headers, double lines, justified text, space-between flex rows for dates, 2-column skills grids, inline contact SVG icons).

export interface CVParseOptions {
  accentColor?: string;
  showPhoto?: boolean;
  photoUrl?: string;
}

const KNOWN_SECTIONS = [
  'EXECUTIVE PROFILE',
  'PROFESSIONAL SUMMARY',
  'SUMMARY',
  'PROFESSIONAL EXPERIENCE',
  'WORK EXPERIENCE',
  'EXPERIENCE',
  'TECHNICAL SKILLS & COMPETENCIES',
  'TECHNICAL SKILLS',
  'CORE COMPETENCIES',
  'CORE IMPACT & CAREER HIGHLIGHTS',
  'KEY ACHIEVEMENTS',
  'EDUCATION',
  'AWARDS & RECOGNITION',
  'AWARDS',
  'CERTIFICATIONS',
  'PROJECTS'
];

function isSectionHeading(text: string): boolean {
  const clean = text.replace(/^#+\s*/, '').replace(/\*+/g, '').replace(/_+/g, '').trim().toUpperCase();
  return KNOWN_SECTIONS.some(s => clean === s || clean.startsWith(s));
}

function cleanSectionTitle(text: string): string {
  return text.replace(/^#+\s*/, '').replace(/\*+/g, '').replace(/_+/g, '').trim().toUpperCase();
}

export function parseMarkdownToHtml(markdown: string, options: CVParseOptions = {}): string {
  if (!markdown) return '';

  const accentColor = options.accentColor || '#475569';
  const showPhoto = options.showPhoto && options.photoUrl;

  const textColorMap: Record<string, string> = {
    '#475569': '#1e293b',
    '#7c3aed': '#1e1b2e',
    '#2563eb': '#0f172a',
    '#059669': '#062e24',
    '#e11d48': '#271016'
  };
  const bodyTextColor = textColorMap[accentColor] || '#1f2937';

  const lines = markdown
    .replace(/&/g, '&amp;')
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

  const mailIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:4px;"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`;
  const phoneIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:4px;"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`;
  const pinIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:4px;"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`;
  const linkedinIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:4px;"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>`;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();
    if (!line) continue;

    // 1. Check for H1 (Name at top)
    if (!sawH1 && (line.startsWith('# ') || (!line.startsWith('##') && !line.includes('@') && i < 3 && line.length < 50 && !isSectionHeading(line)))) {
      if (skillsListOpen) { processedLines.push('</ul>'); skillsListOpen = false; }
      if (inList) { processedLines.push('</ul>'); inList = false; }
      inSkills = false;

      const name = line.replace(/^#+\s*/, '').replace(/\*+/g, '').trim();
      if (showPhoto) {
        processedLines.push(
          `<div class="cv-header-photo-wrapper">` +
            `<img src="${options.photoUrl}" alt="${name}" class="cv-avatar-headshot" />` +
            `<div class="cv-header-photo-info">` +
              `<h1>${name}</h1>`
        );
      } else {
        processedLines.push(`<h1>${name}</h1>`);
      }
      sawH1 = true;
      continue;
    }

    // 2. Check for Section Heading (e.g. ## EXECUTIVE PROFILE or **Executive Profile**)
    if (line.startsWith('## ') || isSectionHeading(line)) {
      if (skillsListOpen) { processedLines.push('</ul>'); skillsListOpen = false; }
      if (inList) { processedLines.push('</ul>'); inList = false; }

      const title = cleanSectionTitle(line);
      processedLines.push(`<h2>${title}</h2>`);

      if (title.includes('SKILL') || title.includes('COMPETENC')) {
        inSkills = true;
      } else {
        inSkills = false;
      }
      continue;
    }

    // 3. Subtitle check (Target Role right below H1)
    if (sawH1 && !sawSubtitle && !line.includes('@') && !line.includes('+') && !line.startsWith('##') && !isSectionHeading(line)) {
      const subtitle = line.replace(/^[\*\_#\s]+|[\*\_#\s]+$/g, '').trim();
      processedLines.push(`<div class="subtitle">${subtitle}</div>`);
      sawSubtitle = true;
      continue;
    }

    // 4. Contact info row check
    if (line.includes('@') || line.includes('linkedin.com') || (line.includes('+') && line.length < 150)) {
      // Split by |, •, or bullet delimiters
      const rawParts = line.split(/[|•·]/).map(p => p.trim()).filter(Boolean);
      const formattedParts = rawParts.map((part) => {
        let item = part.replace(/^[\*\_\[\]]+|[\*\_\[\]]+$/g, '').trim();
        // Clean markdown links [text](url)
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
        } else {
          return `<span class="contact-item">${pinIcon}<span>${item}</span></span>`;
        }
      });

      if (showPhoto) {
        processedLines.push(`<div class="contact-row">${formattedParts.join('')}</div></div></div>`);
      } else {
        processedLines.push(`<div class="contact-row">${formattedParts.join('')}</div>`);
      }
      continue;
    }

    // 5. Check for H3 / Role Title & Dates Row
    // Matches: '### Title | Dates', '**Title** | Dates', or 'Title | Dates'
    if (line.startsWith('### ') || (line.includes('|') && !line.startsWith('*') && (line.includes('Present') || /\d{4}/.test(line)))) {
      if (skillsListOpen) { processedLines.push('</ul>'); skillsListOpen = false; }
      if (inList) { processedLines.push('</ul>'); inList = false; }

      const cleanLine = line.replace(/^###\s*/, '').replace(/^\*\*|\*\*$/g, '').trim();
      const parts = cleanLine.split('|');
      const roleTitle = parts[0].trim();
      const roleDates = parts[1] ? parts[1].trim() : '';

      processedLines.push(
        `<div class="role-row">` +
          `<span class="role-title">${roleTitle}</span>` +
          (roleDates ? `<span class="role-dates">${roleDates}</span>` : '') +
        `</div>`
      );
      continue;
    }

    // 6. Check for Company & Location Row
    // Matches: '*Company | Location*', '*Company, Location*', or 'Company | Location'
    if ((line.startsWith('*') && line.includes('|')) || (line.includes('|') && (line.includes('Dubai') || line.includes('UAE') || line.includes('India') || line.includes('USA') || line.includes('London')))) {
      const cleanContent = line.replace(/^\*|\*$/g, '').replace(/^_|_$/g, '').trim();
      const parts = cleanContent.split('|');
      const company = parts[0].trim();
      const location = parts[1] ? parts[1].trim() : '';

      processedLines.push(
        `<div class="company-row">` +
          `<span class="company-name">${company}</span>` +
          (location ? `<span class="company-location">${location}</span>` : '') +
        `</div>`
      );
      continue;
    }

    // Skip horizontal rules
    if (line === '---' || line === '***') {
      continue;
    }

    // 7. Bullet Points Parsing (Lists)
    const bulletMatch = line.match(/^[-*•]\s+(.*)$/);
    if (bulletMatch) {
      const content = bulletMatch[1].trim();

      if (inSkills) {
        if (!skillsListOpen) {
          processedLines.push('<ul class="skills-list">');
          skillsListOpen = true;
        }

        let formattedContent = content
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>')
          .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

        const categoryMatch = content.match(/^\*\*(.*?)\*\*:\s*(.*)$/) || content.match(/^(.*?):\s*(.*)$/);
        if (categoryMatch && categoryMatch[1].length < 40) {
          let remainder = categoryMatch[2]
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
            
          processedLines.push(`<li><strong class="skill-category">${categoryMatch[1]}: </strong>${remainder}</li>`);
        } else {
          processedLines.push(`<li>${formattedContent}</li>`);
        }
      } else {
        if (!inList) {
          processedLines.push('<ul>');
          inList = true;
        }
        
        let formattedContent = content
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>')
          .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

        processedLines.push(`<li>${formattedContent}</li>`);
      }
      continue;
    }

    // Close open lists if on non-bullet line
    if (!bulletMatch && line) {
      if (skillsListOpen) { processedLines.push('</ul>'); skillsListOpen = false; }
      if (inList) { processedLines.push('</ul>'); inList = false; }
    }

    // 8. Standard Paragraph Text
    if (line) {
      let formattedParagraph = line
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

      processedLines.push(`<p>${formattedParagraph}</p>`);
    }
  }

  if (skillsListOpen) processedLines.push('</ul>');
  if (inList) processedLines.push('</ul>');

  const rawHtml = processedLines.join('\n').replace(/\n{2,}/g, '\n');
  return `<div class="cv-styled-document" style="--cv-accent-color: ${accentColor}; --cv-text-color: ${bodyTextColor};">${rawHtml}</div>`;
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
