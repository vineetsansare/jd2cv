import React from 'react';
import type { WorkExperienceItem, CVThemeSettings } from '../../../../types/cvBuilder';

interface ExperienceEntryProps {
  item: WorkExperienceItem;
  theme: CVThemeSettings;
  layout?: 'standard' | 'left-rail' | 'compact';
}

/**
 * Strips markdown wrappers like **bold**, *italic*, [link](url)
 */
export const cleanText = (text: string = ''): string => {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
    .trim();
};

/**
 * Helper to parse bold/italic/links in bullet points and summaries
 */
export const renderFormattedText = (text: string = '') => {
  if (!text) return null;

  // Replace Markdown bold **text**, italic *text*, and links [text](url)
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|\[.*?\]\(.*?\))/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }
    const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
    if (linkMatch) {
      return (
        <a key={index} href={linkMatch[2]} target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>
          {linkMatch[1]}
        </a>
      );
    }
    return part;
  });
};

export const ExperienceEntry: React.FC<ExperienceEntryProps> = ({
  item,
  theme,
  layout = 'standard'
}) => {
  const accent = theme.accentColor || '#2563eb';
  const roleStr = cleanText(item.role);
  const companyStr = cleanText(item.company);
  const locationStr = cleanText(item.location);
  const dateStr = `${item.startDate} – ${item.isCurrent ? 'Present' : item.endDate || ''}`;
  const align = item.alignment || 'left';

  if (layout === 'left-rail') {
    return (
      <div 
        className="experience-entry"
        style={{
          display: 'grid',
          gridTemplateColumns: '115px 1fr',
          gap: '0.85rem',
          marginBottom: '0.85rem'
        }}
      >
        {/* Left Rail (Dates & Location) */}
        <div style={{ textAlign: 'right', color: '#64748b', fontSize: '0.86em', fontWeight: 600, paddingTop: '0.12rem' }}>
          <div style={{ color: '#1e293b', fontWeight: 700 }}>{dateStr}</div>
          {locationStr && <div style={{ fontSize: '0.88em', color: '#64748b', marginTop: '0.12rem' }}>{locationStr}</div>}
        </div>

        {/* Right Rail (Role, Company, Bullets) with Sleek Timeline Connector */}
        <div style={{ borderLeft: `2px solid ${accent}33`, paddingLeft: '1rem', position: 'relative' }}>
          {/* Timeline Dot */}
          <div 
            style={{
              position: 'absolute',
              left: '-5px',
              top: '5px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: accent,
              boxShadow: `0 0 0 2.5px #ffffff, 0 0 0 3.5px ${accent}40`
            }} 
          />

          <div 
            className="role-header-avoid-break"
            style={{ 
              display: 'flex', 
              alignItems: 'baseline', 
              flexWrap: 'wrap', 
              gap: '0.45rem', 
              marginBottom: '0.25rem',
              breakAfter: 'avoid',
              pageBreakAfter: 'avoid'
            }}
          >
            <span style={{ fontSize: 'var(--cv-font-size-h3, 10.5pt)', fontWeight: 700, color: '#0f172a' }}>
              {roleStr}
            </span>
            <span style={{ color: '#94a3b8', fontSize: '0.85em' }}>•</span>
            <span style={{ fontWeight: 600, color: accent }}>
              {companyStr}
            </span>
          </div>

          {item.bullets && item.bullets.length > 0 && (
            <ul style={{ margin: 0, paddingLeft: '1.15rem', color: '#334155', textAlign: align }}>
              {item.bullets.map((bullet, idx) => (
                <li key={idx} style={{ marginBottom: '0.22rem', lineHeight: 'inherit', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                  {renderFormattedText(bullet)}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }

  // Standard Header Layout (Role & Company left, Date & Location right)
  return (
    <div className="experience-entry" style={{ marginBottom: '0.85rem', textAlign: align }}>
      <div 
        className="role-header-avoid-break"
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'baseline', 
          flexWrap: 'wrap', 
          marginBottom: '0.2rem',
          breakAfter: 'avoid',
          pageBreakAfter: 'avoid'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: '0.4rem' }}>
          <span style={{ fontSize: 'var(--cv-font-size-h3, 10.5pt)', fontWeight: 700, color: '#0f172a' }}>
            {roleStr}
          </span>
          <span style={{ color: '#94a3b8' }}>|</span>
          <span style={{ fontWeight: 600, color: '#334155', fontStyle: 'italic' }}>
            {companyStr}
          </span>
        </div>

        <div style={{ fontSize: '0.85em', color: '#64748b', fontWeight: 500, textAlign: 'right' }}>
          <span>{dateStr}</span>
          {locationStr && <span> • {locationStr}</span>}
        </div>
      </div>

      {item.bullets && item.bullets.length > 0 && (
        <ul style={{ margin: '0.25rem 0 0 0', paddingLeft: '1.2rem', color: '#334155' }}>
          {item.bullets.map((bullet, idx) => (
            <li key={idx} style={{ marginBottom: '0.2rem', lineHeight: 'inherit', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
              {renderFormattedText(bullet)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

