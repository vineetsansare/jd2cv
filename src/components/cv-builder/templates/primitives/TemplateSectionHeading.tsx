import React from 'react';
import type { CVThemeSettings, SectionHeadingStyle } from '../../../../types/cvBuilder';

interface TemplateSectionHeadingProps {
  title: string;
  theme: CVThemeSettings;
  styleOverride?: SectionHeadingStyle;
  icon?: React.ReactNode;
  uppercase?: boolean;
}

export const TemplateSectionHeading: React.FC<TemplateSectionHeadingProps> = ({
  title,
  theme,
  styleOverride,
  icon,
  uppercase = true
}) => {
  const accent = theme.accentColor || '#2563eb';
  const headingStyle: SectionHeadingStyle = styleOverride || theme.sectionHeadingStyle || 'underline';

  const headingText = uppercase ? title.toUpperCase() : title;

  switch (headingStyle) {
    case 'border-left':
      return (
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            borderLeft: `3.5px solid ${accent}`,
            paddingLeft: '0.65rem',
            margin: '1.25rem 0 0.75rem 0',
            fontSize: 'var(--cv-font-size-h2, 12pt)',
            fontWeight: 700,
            color: '#0f172a',
            letterSpacing: '0.04em'
          }}
        >
          {icon && <span style={{ color: accent, display: 'inline-flex' }}>{icon}</span>}
          <span>{headingText}</span>
        </div>
      );

    case 'banner':
      return (
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            background: `${accent}14`,
            borderLeft: `3px solid ${accent}`,
            padding: '0.35rem 0.65rem',
            borderRadius: '0 4px 4px 0',
            margin: '1.25rem 0 0.75rem 0',
            fontSize: 'var(--cv-font-size-h2, 12pt)',
            fontWeight: 700,
            color: accent,
            letterSpacing: '0.04em'
          }}
        >
          {icon && <span style={{ display: 'inline-flex' }}>{icon}</span>}
          <span>{headingText}</span>
        </div>
      );

    case 'centered':
      return (
        <div 
          style={{
            textAlign: 'center',
            margin: '1.25rem 0 0.75rem 0',
            position: 'relative'
          }}
        >
          <div 
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              fontSize: 'var(--cv-font-size-h2, 12pt)',
              fontWeight: 700,
              color: '#0f172a',
              letterSpacing: '0.06em',
              padding: '0 0.85rem',
              background: '#ffffff',
              position: 'relative',
              zIndex: 1
            }}
          >
            {icon && <span style={{ color: accent, display: 'inline-flex' }}>{icon}</span>}
            <span>{headingText}</span>
          </div>
          <div 
            style={{
              position: 'absolute',
              top: '50%',
              left: 0,
              right: 0,
              height: '1px',
              backgroundColor: '#e2e8f0',
              zIndex: 0
            }} 
          />
        </div>
      );

    case 'minimal':
      return (
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            margin: '1.25rem 0 0.65rem 0',
            fontSize: 'var(--cv-font-size-h2, 12pt)',
            fontWeight: 800,
            color: '#0f172a',
            letterSpacing: '0.05em'
          }}
        >
          {icon && <span style={{ color: accent, display: 'inline-flex' }}>{icon}</span>}
          <span>{headingText}</span>
        </div>
      );

    case 'underline':
    default:
      return (
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1.5px solid ${accent}`,
            paddingBottom: '0.25rem',
            margin: '1.25rem 0 0.75rem 0',
            fontSize: 'var(--cv-font-size-h2, 12pt)',
            fontWeight: 700,
            color: '#0f172a',
            letterSpacing: '0.03em'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            {icon && <span style={{ color: accent, display: 'inline-flex' }}>{icon}</span>}
            <span>{headingText}</span>
          </div>
        </div>
      );
  }
};
