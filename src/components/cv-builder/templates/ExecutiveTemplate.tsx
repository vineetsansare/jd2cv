import type { StructuredCV } from '../../../types/cvBuilder';
import { 
  getThemeValues, 
  renderRichText, 
  renderRichContent, 
  renderSectionHeader, 
  renderContactInfo, 
  getOrderedSections 
} from './shared';
import { sectionHasContent } from '../../../utils/sectionRegistry';

export default function ExecutiveTemplate({ cv }: { cv: StructuredCV }) {
  const { accent, fs, lineHeight, pagePadding, sectionGap, headingStyle } = getThemeValues(cv.theme);
  const orderedSections = getOrderedSections(cv).filter(id => sectionHasContent(cv, id));

  const fontFamily = cv.theme.fontFamily === 'Merriweather' ? 'Merriweather, Georgia, serif' : 'Georgia, serif';

  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case 'summary': {
        if (!cv.summary.visible) return null;
        return (
          <div key="summary" style={{ marginBottom: sectionGap }}>
            {renderSectionHeader(
              cv.summary.title || 'Executive Summary',
              accent, fs, false, undefined, false, headingStyle,
              { borderBottom: 'none', borderTop: `2px solid ${accent}`, paddingTop: '0.4rem', marginBottom: '0.6rem', showDot: false }
            )}
            <div style={{ color: '#334155', fontSize: fs.base, lineHeight }}>
              {renderRichContent(cv.summary.content, accent, cv.summary.alignment)}
            </div>
          </div>
        );
      }
      case 'experience': {
        const visibleItems = cv.experience.filter(e => e.visible);
        if (!visibleItems.length) return null;
        return (
          <div key="experience" style={{ marginBottom: sectionGap }}>
            {renderSectionHeader(
              cv.experienceMeta?.title || 'Professional Experience',
              accent, fs, false, undefined, false, headingStyle,
              { borderBottom: 'none', borderTop: `2px solid ${accent}`, paddingTop: '0.4rem', marginBottom: '0.6rem', showDot: false }
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {visibleItems.map(item => (
                <div key={item.id} style={{ textAlign: (item.alignment as any) || 'inherit' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap' }}>
                    <div style={{ fontSize: fs.h3, fontWeight: 700, color: '#0f172a' }}>{item.role}</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                     <div style={{ fontSize: fs.base, color: '#334155', fontWeight: 600 }}>
                      {item.company}{item.location ? ` • ${item.location}` : ''}
                    </div>
                    <span style={{ fontSize: fs.small, color: '#64748b', fontStyle: 'italic' }}>{item.startDate} {item.startDate && item.endDate ? '—' : ''} {item.endDate}</span>
                  </div>
                  <div style={{ fontSize: fs.base, lineHeight, color: '#334155' }}>
                    <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      {item.bullets.map((b, i) => <li key={i}>{renderRichText(b, accent)}</li>)}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }
      case 'education': {
        const visibleItems = cv.education.filter(e => e.visible);
        if (!visibleItems.length) return null;
        return (
          <div key="education" style={{ marginBottom: sectionGap }}>
            {renderSectionHeader(
              cv.educationMeta?.title || 'Education',
              accent, fs, false, undefined, false, headingStyle,
              { borderBottom: 'none', borderTop: `2px solid ${accent}`, paddingTop: '0.4rem', marginBottom: '0.6rem', showDot: false }
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {visibleItems.map(item => (
                <div key={item.id} style={{ textAlign: (item.alignment as any) || 'inherit' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap' }}>
                    <div style={{ fontSize: fs.base, fontWeight: 700, color: '#0f172a' }}>{item.degree}</div>
                    <span style={{ fontSize: fs.small, color: '#64748b', fontStyle: 'italic' }}>{item.startDate ? `${item.startDate} — ` : ''}{item.endDate}</span>
                  </div>
                  <div style={{ fontSize: fs.base, color: '#334155' }}>
                    {item.institution}{item.location ? ` • ${item.location}` : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }
      case 'skills': {
        const visibleItems = cv.skills.filter(s => s.visible && s.skills.length > 0);
        if (!visibleItems.length) return null;
        return (
          <div key="skills" style={{ marginBottom: sectionGap }}>
            {renderSectionHeader(
              cv.skillsMeta?.title || 'Core Competencies',
              accent, fs, false, undefined, false, headingStyle,
               { borderBottom: 'none', borderTop: `2px solid ${accent}`, paddingTop: '0.4rem', marginBottom: '0.6rem', showDot: false }
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {visibleItems.map(item => (
                <div key={item.id} style={{ fontSize: fs.base, lineHeight }}>
                  <strong style={{ color: '#0f172a' }}>{item.categoryName}: </strong>
                  <span style={{ color: '#334155' }}>{item.skills.join(' • ')}</span>
                </div>
              ))}
            </div>
          </div>
        );
      }
      // Provide basic generic handling for custom/other sections to prevent crash
      default: {
        return null;
      }
    }
  };

  return (
    <div style={{
      fontFamily,
      padding: pagePadding,
      background: '#ffffff',
      color: '#334155',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      <header style={{ marginBottom: sectionGap, textAlign: 'center' }}>
        <h1 style={{ margin: 0, fontSize: fs.name, fontWeight: 400, color: '#0f172a', lineHeight: 1.2, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          {cv.basics.fullName}
        </h1>
        {cv.basics.headline && (
          <div style={{ fontSize: fs.h3, color: '#334155', marginTop: '0.5rem', marginBottom: '1rem', fontStyle: 'italic' }}>
            {cv.basics.headline}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          {renderContactInfo(cv.basics, '#334155', { justifyContent: 'center' })}
        </div>
      </header>

      {orderedSections.map(renderSection)}
    </div>
  );
}
