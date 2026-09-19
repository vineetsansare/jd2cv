import React from 'react';
import type { SkillCategoryItem, CVThemeSettings, SkillStyle } from '../../../../types/cvBuilder';

interface SkillsListProps {
  skills: SkillCategoryItem[];
  theme: CVThemeSettings;
  styleOverride?: SkillStyle;
}

export const SkillsList: React.FC<SkillsListProps> = ({
  skills,
  theme,
  styleOverride
}) => {
  const accent = theme.accentColor || '#2563eb';
  const skillStyle: SkillStyle = styleOverride || theme.skillStyle || 'pills';

  if (!skills || skills.length === 0) return null;

  if (skillStyle === 'pills') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '0.75rem' }}>
        {skills.map((category) => (
          <div key={category.id} style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: '0.4rem 0.6rem' }}>
            <span style={{ fontWeight: 700, color: '#0f172a', minWidth: '130px', fontSize: '0.95em' }}>
              {category.categoryName}:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem 0.45rem', flexGrow: 1 }}>
              {category.skills.map((skill, sIdx) => (
                <span
                  key={sIdx}
                  style={{
                    display: 'inline-block',
                    padding: '0.15rem 0.55rem',
                    borderRadius: '999px',
                    fontSize: '0.82em',
                    fontWeight: 600,
                    backgroundColor: `${accent}12`,
                    color: accent,
                    border: `1px solid ${accent}33`,
                    lineHeight: 1.3
                  }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (skillStyle === 'boxed') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.65rem', marginBottom: '0.75rem' }}>
        {skills.map((category) => (
          <div 
            key={category.id}
            style={{
              padding: '0.5rem 0.75rem',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc'
            }}
          >
            <div style={{ fontWeight: 700, color: accent, fontSize: '0.85em', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.25rem' }}>
              {category.categoryName}
            </div>
            <div style={{ fontSize: '0.88em', color: '#334155' }}>
              {category.skills.join(', ')}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Comma-separated (Classic ATS format)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.75rem' }}>
      {skills.map((category) => (
        <div key={category.id} style={{ fontSize: '0.92em', lineHeight: 1.5 }}>
          <strong style={{ color: '#0f172a' }}>{category.categoryName}: </strong>
          <span style={{ color: '#334155' }}>{category.skills.join(', ')}</span>
        </div>
      ))}
    </div>
  );
};
