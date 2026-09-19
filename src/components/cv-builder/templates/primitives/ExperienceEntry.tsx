import React from 'react';
import type { WorkExperienceItem, CVThemeSettings } from '../../../../types/cvBuilder';

interface ExperienceEntryProps {
  item: WorkExperienceItem;
  theme: CVThemeSettings;
  layout?: 'standard' | 'left-rail' | 'compact';
}

// Simple helper to parse bold/italic/links in bullet points
export const renderFormattedText = (text: string) => {
  if (!text) return null;

  // Replace Markdown bold **text** or __text__
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
  const dateStr = `${item.startDate} – ${item.isCurrent ? 'Present' : item.endDate || ''}`;

  if (layout === 'left-rail') {
    return (
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: '145px 1fr',
          gap: '1.25rem',
          marginBottom: '1.15rem',
          pageBreakInside: 'avoid'
        }}
      >
        {/* Left Rail (Dates & Location) */}
        <div style={{ textAlign: 'right', color: '#64748b', fontSize: '0.85em', fontWeight: 600, paddingTop: '0.1rem' }}>
          <div style={{ color: '#334155' }}>{dateStr}</div>
          {item.location && <div style={{ fontSize: '0.9em', color: '#94a3b8' }}>{item.location}</div>}
        </div>

        {/* Right Rail (Role, Company, Bullets) */}
        <div style={{ borderLeft: `2px solid ${accent}33`, paddingLeft: '1.1rem', position: 'relative' }}>
          {/* Timeline Dot */}
          <div 
            style={{
              position: 'absolute',
              left: '-5px',
              top: '5px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: accent
            }} 
          />

          <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: 'var(--cv-font-size-h3, 10.5pt)', fontWeight: 700, color: '#0f172a' }}>
              {item.role}
            </span>
            <span style={{ color: '#64748b', fontSize: '0.9em' }}>•</span>
            <span style={{ fontWeight: 600, color: accent }}>
              {item.company}
            </span>
          </div>

          {item.bullets && item.bullets.length > 0 && (
            <ul style={{ margin: 0, paddingLeft: '1.1rem', color: '#334155' }}>
              {item.bullets.map((bullet, idx) => (
                <li key={idx} style={{ marginBottom: '0.25rem', lineHeight: 'inherit' }}>
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
    <div style={{ marginBottom: '1rem', pageBreakInside: 'avoid' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: '0.4rem' }}>
          <span style={{ fontSize: 'var(--cv-font-size-h3, 10.5pt)', fontWeight: 700, color: '#0f172a' }}>
            {item.role}
          </span>
          <span style={{ color: '#94a3b8' }}>|</span>
          <span style={{ fontWeight: 600, color: '#334155', fontStyle: 'italic' }}>
            {item.company}
          </span>
        </div>

        <div style={{ fontSize: '0.85em', color: '#64748b', fontWeight: 500, textAlign: 'right' }}>
          <span>{dateStr}</span>
          {item.location && <span> • {item.location}</span>}
        </div>
      </div>

      {item.bullets && item.bullets.length > 0 && (
        <ul style={{ margin: '0.35rem 0 0 0', paddingLeft: '1.2rem', color: '#334155' }}>
          {item.bullets.map((bullet, idx) => (
            <li key={idx} style={{ marginBottom: '0.25rem', lineHeight: 'inherit' }}>
              {renderFormattedText(bullet)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
