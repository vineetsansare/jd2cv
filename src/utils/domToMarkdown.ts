/**
 * Converts the rendered HTML preview DOM back into canonical CV Markdown.
 * Supports all three formats: 'modern-timeline', 'classic-ats', and 'split-sidebar-right'.
 * Preserves user edits made directly on the preview sheet across templates and exports.
 */

function cleanText(text: string | null | undefined): string {
  if (!text) return '';
  return text.replace(/\s+/g, ' ').trim();
}

function getInlineMarkdown(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent || '';
  }
  if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as HTMLElement;
    const tag = el.tagName.toUpperCase();

    // Ignore SVGs, divider lines, and action buttons
    if (
      tag === 'SVG' ||
      tag === 'BUTTON' ||
      el.classList.contains('zigzag-divider') ||
      el.classList.contains('split-section-rule') ||
      el.classList.contains('sidebar-section-rule') ||
      el.classList.contains('split-contact-sep')
    ) {
      return '';
    }

    const inner = Array.from(el.childNodes).map(getInlineMarkdown).join('');

    if (tag === 'STRONG' || tag === 'B') {
      const trimmed = inner.trim();
      return trimmed ? `**${trimmed}**` : '';
    }
    if (tag === 'EM' || tag === 'I') {
      const trimmed = inner.trim();
      return trimmed ? `*${trimmed}*` : '';
    }
    if (tag === 'A') {
      const href = el.getAttribute('href');
      const text = inner.trim();
      if (!href) return text;
      return text ? `[${text}](${href})` : '';
    }
    return inner;
  }
  return '';
}

export function domToCvMarkdown(container: HTMLElement): string {
  const lines: string[] = [];

  // 1. Candidate Name
  const nameEl = container.querySelector('.modern-name, .split-name, h1');
  const name = cleanText(nameEl?.textContent);
  if (name) {
    lines.push(`# ${name}`);
  }

  // 2. Subtitle / Headline
  const subtitleEl = container.querySelector('.modern-subtitle, .split-subtitle, .subtitle');
  const subtitle = cleanText(subtitleEl?.textContent);
  if (subtitle) {
    lines.push(`*${subtitle}*`);
  }

  // 3. Contact Info Row
  const contactEls = container.querySelectorAll(
    '.modern-contact-grid .contact-item, .contact-row .contact-item, .split-contact-row .split-contact-item, .sidebar-contact-list .split-contact-item, .split-contact-item'
  );
  if (contactEls.length > 0) {
    const contactParts: string[] = [];
    contactEls.forEach(el => {
      const a = el.querySelector('a');
      let txt = '';
      if (a) {
        txt = cleanText(a.textContent) || a.getAttribute('href') || '';
      } else {
        const clone = el.cloneNode(true) as HTMLElement;
        clone.querySelectorAll('svg').forEach(s => s.remove());
        txt = cleanText(clone.textContent);
      }
      const cleanTxt = txt.replace(/^[•·|]+|[•·|]+$/g, '').trim();
      if (cleanTxt) {
        contactParts.push(cleanTxt);
      }
    });
    if (contactParts.length > 0) {
      lines.push(contactParts.join(' | '));
    }
  }
  lines.push('');

  // 4. Determine Layout Mode to extract sections accurately
  const isSplitSidebar = Boolean(container.querySelector('.split-sidebar-wrapper'));
  const isModern = Boolean(container.querySelector('.modern-timeline-wrapper, .modern-timeline-entry, .modern-section-title'));

  if (isSplitSidebar) {
    parseSplitSidebar(container, lines);
  } else if (isModern) {
    parseModernTimeline(container, lines);
  } else {
    parseClassicAts(container, lines);
  }

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

function parseModernTimeline(container: HTMLElement, lines: string[]) {
  const sectionTitles = container.querySelectorAll('.modern-section-title');

  sectionTitles.forEach(titleEl => {
    const secTitle = cleanText(titleEl.textContent);
    if (!secTitle) return;

    lines.push(`## ${secTitle}`);

    // Walk siblings after title until next .modern-section-title
    let sibling = titleEl.nextElementSibling;
    while (sibling && !sibling.classList.contains('modern-section-title')) {
      if (sibling.classList.contains('zigzag-divider')) {
        sibling = sibling.nextElementSibling;
        continue;
      }

      // Summary paragraph
      if (sibling.tagName.toUpperCase() === 'P') {
        const pText = cleanText(getInlineMarkdown(sibling));
        if (pText) lines.push(pText);
      }

      // Timeline entry (Experience or Education)
      if (sibling.classList.contains('modern-timeline-entry')) {
        const leftCol = sibling.querySelector('.modern-timeline-left');
        const rightCol = sibling.querySelector('.modern-timeline-right');

        const dates = cleanText(leftCol?.querySelector('.timeline-date')?.textContent);
        const loc = cleanText(leftCol?.querySelector('.timeline-location')?.textContent);

        const company = cleanText(rightCol?.querySelector('.timeline-company')?.textContent);
        const role = cleanText(rightCol?.querySelector('.timeline-role')?.textContent);
        const degree = cleanText(rightCol?.querySelector('.timeline-degree')?.textContent);
        const school = cleanText(rightCol?.querySelector('.timeline-school')?.textContent);

        const roleOrDegree = role || degree || '';
        const companyOrSchool = company || school || '';

        if (roleOrDegree) {
          lines.push(`### ${roleOrDegree}${dates ? ` | ${dates}` : ''}`);
        }
        if (companyOrSchool || loc) {
          lines.push(`*${companyOrSchool}${loc ? ` | ${loc}` : ''}*`);
        }

        const bullets = rightCol?.querySelectorAll('li');
        bullets?.forEach(b => {
          const bulletMd = cleanText(getInlineMarkdown(b));
          if (bulletMd) lines.push(`- ${bulletMd}`);
        });
        lines.push('');
      }

      // Skill cards
      if (sibling.classList.contains('modern-skills-container')) {
        const cards = sibling.querySelectorAll('.modern-skill-card');
        cards.forEach(card => {
          const catEl = card.querySelector('.skill-category');
          let cat = cleanText(catEl?.textContent).replace(/[—–:-]+$/, '').trim();
          let rest = '';
          if (catEl) {
            const clone = card.cloneNode(true) as HTMLElement;
            clone.querySelector('.skill-category')?.remove();
            rest = cleanText(getInlineMarkdown(clone)).replace(/^[—–:-]+/, '').trim();
          } else {
            rest = cleanText(getInlineMarkdown(card));
          }
          if (cat && rest) {
            lines.push(`- **${cat}** — ${rest}`);
          } else if (rest) {
            lines.push(`- ${rest}`);
          }
        });
        lines.push('');
      }

      // Standalone unordered lists
      if (sibling.tagName.toUpperCase() === 'UL' && !sibling.closest('.modern-timeline-entry')) {
        const lis = sibling.querySelectorAll('li');
        lis.forEach(li => {
          const liMd = cleanText(getInlineMarkdown(li));
          if (liMd) lines.push(`- ${liMd}`);
        });
        lines.push('');
      }

      sibling = sibling.nextElementSibling;
    }
    lines.push('');
  });
}

function parseClassicAts(container: HTMLElement, lines: string[]) {
  const h2s = container.querySelectorAll('h2');

  h2s.forEach(h2 => {
    const title = cleanText(h2.textContent);
    if (!title) return;

    lines.push(`## ${title}`);

    let sibling = h2.nextElementSibling;
    while (sibling && sibling.tagName.toUpperCase() !== 'H2') {
      if (sibling.tagName.toUpperCase() === 'P') {
        const pMd = cleanText(getInlineMarkdown(sibling));
        if (pMd) lines.push(pMd);
      }

      if (sibling.classList.contains('role-row') || sibling.classList.contains('school-row')) {
        const roleTitle = cleanText(sibling.querySelector('.role-title, .school-title')?.textContent);
        const dates = cleanText(sibling.querySelector('.role-dates, .school-dates')?.textContent);

        lines.push(`### ${roleTitle}${dates ? ` | ${dates}` : ''}`);

        // Look for companion company row
        const next = sibling.nextElementSibling;
        if (next && next.classList.contains('company-row')) {
          const comp = cleanText(next.querySelector('.company-name')?.textContent);
          const loc = cleanText(next.querySelector('.company-location')?.textContent);
          if (comp || loc) {
            lines.push(`*${comp}${loc ? ` | ${loc}` : ''}*`);
          }
          sibling = next;
        }
      }

      if (sibling.tagName.toUpperCase() === 'UL') {
        const lis = sibling.querySelectorAll('li');
        lis.forEach(li => {
          const liMd = cleanText(getInlineMarkdown(li));
          if (liMd) lines.push(`- ${liMd}`);
        });
        lines.push('');
      }

      sibling = sibling.nextElementSibling;
    }
    lines.push('');
  });
}

function parseSplitSidebar(container: HTMLElement, lines: string[]) {
  // 1. Sidebar column sections (Profile, Languages, Awards, etc.)
  const sideSecs = container.querySelectorAll('.split-sidebar-col .sidebar-section');
  sideSecs.forEach(sec => {
    const titleEl = sec.querySelector('.sidebar-section-title, .sidebar-section-pill span');
    const title = cleanText(titleEl?.textContent);
    if (title) lines.push(`## ${title}`);

    // Profile text
    const paragraphs = sec.querySelectorAll('.sidebar-profile-text, p');
    paragraphs.forEach(p => {
      const pMd = cleanText(getInlineMarkdown(p));
      if (pMd) lines.push(pMd);
    });

    // Languages
    const langItems = sec.querySelectorAll('.sidebar-language-item');
    langItems.forEach(item => {
      const langName = cleanText(item.querySelector('.sidebar-language-name')?.textContent);
      const filledDots = item.querySelectorAll('.sidebar-dot.filled').length;
      let levelText = '';
      if (filledDots === 5) levelText = 'Native';
      else if (filledDots === 4) levelText = 'Fluent';
      else if (filledDots === 3) levelText = 'Intermediate';
      else if (filledDots === 2) levelText = 'Basic';
      else if (filledDots === 1) levelText = 'Beginner';

      if (langName) {
        lines.push(`- ${langName}${levelText ? ` (${levelText})` : ''}`);
      }
    });

    // Awards
    const awards = sec.querySelectorAll('.sidebar-award-item');
    awards.forEach(a => {
      const awardTitle = cleanText(a.querySelector('.sidebar-award-title')?.textContent);
      const awardOrg = cleanText(a.querySelector('.sidebar-award-org')?.textContent);
      if (awardTitle) {
        lines.push(`- **${awardTitle}**${awardOrg ? ` — ${awardOrg}` : ''}`);
      }
    });

    // Generic sidebar entries
    const entries = sec.querySelectorAll('.sidebar-entry');
    entries.forEach(e => {
      const dates = cleanText(e.querySelector('.sidebar-entry-dates')?.textContent);
      const entryTitle = cleanText(e.querySelector('.sidebar-entry-title')?.textContent);
      const sub = cleanText(e.querySelector('.sidebar-entry-subtitle')?.textContent);
      if (entryTitle) {
        lines.push(`### ${entryTitle}${dates ? ` | ${dates}` : ''}`);
      }
      if (sub) {
        lines.push(`*${sub}*`);
      }
    });

    // Skill category groups
    const skillGroups = sec.querySelectorAll('.sidebar-category-group');
    skillGroups.forEach(sg => {
      const cat = cleanText(sg.querySelector('.sidebar-category-name')?.textContent);
      const badges: string[] = [];
      sg.querySelectorAll('.sidebar-pill-badge').forEach(b => {
        const txt = cleanText(b.textContent);
        if (txt) badges.push(txt);
      });
      if (cat && badges.length > 0) {
        lines.push(`- **${cat}** — ${badges.join(', ')}`);
      }
    });

    // Sidebar standalone bullets
    const bullets = sec.querySelectorAll('.sidebar-bullet-item');
    bullets.forEach(b => {
      const txt = cleanText(b.textContent).replace(/^[•·-]\s*/, '');
      if (txt) lines.push(`- ${txt}`);
    });

    lines.push('');
  });

  // 2. Main column sections (Work Experience, Education, Skills)
  const mainSecs = container.querySelectorAll('.split-main-col .split-section');
  mainSecs.forEach(sec => {
    const titleEl = sec.querySelector('.split-section-title, .main-section-pill h2');
    const title = cleanText(titleEl?.textContent);
    if (title) lines.push(`## ${title}`);

    // Paragraphs
    const paragraphs = sec.querySelectorAll('.split-paragraph');
    paragraphs.forEach(p => {
      const pMd = cleanText(getInlineMarkdown(p));
      if (pMd) lines.push(pMd);
    });

    // Work Experience
    const roles = sec.querySelectorAll('.split-role-entry');
    roles.forEach(r => {
      const comp = cleanText(r.querySelector('.split-company-name')?.textContent);
      const roleTitle = cleanText(r.querySelector('.split-role-title')?.textContent);
      const roleDatesAndLoc = cleanText(r.querySelector('.split-role-dates')?.textContent);

      let dates = '';
      let loc = '';
      if (roleDatesAndLoc.includes('|')) {
        const parts = roleDatesAndLoc.split('|');
        dates = cleanText(parts[0]);
        loc = cleanText(parts[1]);
      } else {
        dates = roleDatesAndLoc;
      }

      const topTitle = roleTitle || comp;
      const subTitle = roleTitle && comp ? comp : '';

      if (topTitle) {
        lines.push(`### ${topTitle}${dates ? ` | ${dates}` : ''}`);
      }
      if (subTitle || loc) {
        lines.push(`*${subTitle}${loc ? ` | ${loc}` : ''}*`);
      }

      const bullets = r.querySelectorAll('li');
      bullets.forEach(b => {
        const bulletMd = cleanText(getInlineMarkdown(b));
        if (bulletMd) lines.push(`- ${bulletMd}`);
      });
      lines.push('');
    });

    // Education
    const edus = sec.querySelectorAll('.split-edu-entry');
    edus.forEach(e => {
      const degree = cleanText(e.querySelector('.split-degree-name')?.textContent);
      const school = cleanText(e.querySelector('.split-school-name')?.textContent);
      const eduDatesAndLoc = cleanText(e.querySelector('.split-edu-dates')?.textContent);

      let dates = '';
      let loc = '';
      if (eduDatesAndLoc.includes('|')) {
        const parts = eduDatesAndLoc.split('|');
        dates = cleanText(parts[0]);
        loc = cleanText(parts[1]);
      } else {
        dates = eduDatesAndLoc;
      }

      if (degree) {
        lines.push(`### ${degree}${dates ? ` | ${dates}` : ''}`);
      }
      if (school || loc) {
        lines.push(`*${school}${loc ? ` | ${loc}` : ''}*`);
      }
      lines.push('');
    });

    // Skills lists / Standalone bullets
    const skillsBullets = sec.querySelectorAll('.split-skills-list li, .split-bullets:not(.split-role-entry .split-bullets) li');
    skillsBullets.forEach(b => {
      const bulletMd = cleanText(getInlineMarkdown(b));
      if (bulletMd) lines.push(`- ${bulletMd}`);
    });

    lines.push('');
  });
}
