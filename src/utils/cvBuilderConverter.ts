import type { StructuredCV } from '../types/cvBuilder';
import { DEFAULT_CV_DATA } from './defaultCvData';

/**
 * Converts a StructuredCV object to clean, ATS-optimized Markdown format.
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

  // Executive Profile / Summary
  if (cv.summary && cv.summary.visible && cv.summary.content.trim()) {
    parts.push(`## ${cv.summary.title || 'Executive Profile'}\n`);
    parts.push(cv.summary.content.trim() + '\n');
  }

  // Professional Experience
  const visibleExp = cv.experience.filter(e => e.visible);
  if (visibleExp.length > 0) {
    parts.push('## Professional Experience\n');
    visibleExp.forEach(item => {
      const dates = `${item.startDate || ''} – ${item.isCurrent ? 'Present' : (item.endDate || '')}`.trim();
      parts.push(`### ${item.role} | **${item.company}**`);
      const meta = [dates, item.location].filter(Boolean).join(' • ');
      if (meta) {
        parts.push(`*${meta}*`);
      }
      if (item.bullets && item.bullets.length > 0) {
        item.bullets.forEach(b => {
          if (b.trim()) parts.push(`* ${b.trim()}`);
        });
      }
      parts.push(''); // blank line
    });
  }

  // Education
  const visibleEdu = cv.education.filter(e => e.visible);
  if (visibleEdu.length > 0) {
    parts.push('## Education\n');
    visibleEdu.forEach(item => {
      const dates = item.endDate ? (item.startDate ? `${item.startDate} – ${item.endDate}` : item.endDate) : '';
      parts.push(`### ${item.degree} | **${item.institution}**`);
      const meta = [dates, item.location, item.score].filter(Boolean).join(' • ');
      if (meta) {
        parts.push(`*${meta}*`);
      }
      parts.push('');
    });
  }

  // Technical Skills & Competencies
  const visibleSkills = cv.skills.filter(s => s.visible && s.skills.length > 0);
  if (visibleSkills.length > 0) {
    parts.push('## Skills & Competencies\n');
    visibleSkills.forEach(cat => {
      parts.push(`* **${cat.categoryName}:** ${cat.skills.join(', ')}`);
    });
    parts.push('');
  }

  // Projects
  const visibleProjects = cv.projects ? cv.projects.filter(p => p.visible) : [];
  if (visibleProjects.length > 0) {
    parts.push('## Projects & Technical Initiatives\n');
    visibleProjects.forEach(item => {
      const titleLink = item.url ? `[${item.title}](${item.url})` : item.title;
      parts.push(`### ${titleLink}${item.subtitle ? ` — *${item.subtitle}*` : ''}`);
      if (item.technologies && item.technologies.length > 0) {
        parts.push(`*Technologies: ${item.technologies.join(', ')}*`);
      }
      if (item.bullets && item.bullets.length > 0) {
        item.bullets.forEach(b => {
          if (b.trim()) parts.push(`* ${b.trim()}`);
        });
      }
      parts.push('');
    });
  }

  // Certifications & Awards
  const visibleCerts = cv.certifications ? cv.certifications.filter(c => c.visible) : [];
  if (visibleCerts.length > 0) {
    parts.push('## Certifications & Honors\n');
    visibleCerts.forEach(item => {
      const link = item.url ? `[${item.name}](${item.url})` : item.name;
      parts.push(`* **${link}** — ${item.issuer} (${item.date})`);
    });
    parts.push('');
  }

  // Custom Sections
  if (cv.customSections && cv.customSections.length > 0) {
    cv.customSections.forEach(sec => {
      if (sec.visible && sec.items.length > 0) {
        parts.push(`## ${sec.sectionTitle}\n`);
        sec.items.forEach(item => {
          if (item.visible) {
            parts.push(`### ${item.title}${item.subtitle ? ` — *${item.subtitle}*` : ''}`);
            if (item.date || item.location) {
              parts.push(`*${[item.date, item.location].filter(Boolean).join(' • ')}*`);
            }
            if (item.bullets && item.bullets.length > 0) {
              item.bullets.forEach(b => {
                if (b.trim()) parts.push(`* ${b.trim()}`);
              });
            }
            parts.push('');
          }
        });
      }
    });
  }

  return parts.join('\n').trim();
}

/**
 * Parses markdown into structured CV data.
 */
export function markdownToStructuredCV(markdown: string, base: StructuredCV = DEFAULT_CV_DATA): StructuredCV {
  if (!markdown || !markdown.trim()) return base;

  const lines = markdown.split('\n');
  const result: StructuredCV = JSON.parse(JSON.stringify(base));
  result.updatedAt = new Date().toISOString();

  let currentSection = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Header 1: Name
    if (line.startsWith('# ')) {
      result.basics.fullName = line.replace(/^#\s+/, '').trim();
      continue;
    }

    // Header 2: Sections
    if (line.startsWith('## ')) {
      currentSection = line.replace(/^##\s+/, '').toLowerCase();
      continue;
    }

    // Parsing inside sections
    if (currentSection.includes('profile') || currentSection.includes('summary')) {
      if (!line.startsWith('#')) {
        result.summary.content = (result.summary.content ? result.summary.content + ' ' : '') + line;
      }
    }
  }

  return result;
}
