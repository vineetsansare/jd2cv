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

export default function TechTemplate({ cv }: { cv: StructuredCV }) {
  const { accent, fontFamily, fs, lineHeight, pagePadding, sectionGap, headingStyle } = getThemeValues(cv.theme);
  const orderedSections = getOrderedSections(cv).filter(id => sectionHasContent(cv, id));

  const monoFont = '"JetBrains Mono", "Fira Code", monospace';

  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case 'summary': {
        if (!cv.summary.visible) return null;
        return (
          <div key="summary" style={{ marginBottom: sectionGap }}>
            {renderSectionHeader(
              cv.summary.title || 'Summary',
              accent, fs, false, undefined, false, headingStyle,
              { fontFamily: monoFont, borderBottom: `2px dashed #cbd5e1`, paddingBottom: '0.4rem', marginBottom: '0.8rem', showDot: false } as any
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
              cv.experienceMeta?.title || 'Experience',
              accent, fs, false, undefined, false, headingStyle,
              { fontFamily: monoFont, borderBottom: `2px dashed #cbd5e1`, paddingBottom: '0.4rem', marginBottom: '0.8rem', showDot: false } as any
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              {visibleItems.map(item => (
                <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '1rem' }}>
                  <div style={{ fontSize: fs.small, fontFamily: monoFont, color: '#64748b' }}>
                    {item.startDate} <br/> {item.endDate ? `to ${item.endDate}` : 'to present'}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <span style={{ fontSize: fs.h3, fontWeight: 700, color: '#0f172a' }}>{item.role}</span>
                      <span style={{ fontSize: fs.base, color: accent, fontFamily: monoFont }}>@ {item.company}</span>
                    </div>
                    <div style={{ fontSize: fs.base, lineHeight, color: '#334155', marginTop: '0.5rem' }}>
                      <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        {item.bullets.map((b, i) => <li key={i}>{renderRichText(b, accent)}</li>)}
                      </ul>
                    </div>
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
              { fontFamily: monoFont, borderBottom: `2px dashed #cbd5e1`, paddingBottom: '0.4rem', marginBottom: '0.8rem', showDot: false } as any
            )}
             <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              {visibleItems.map(item => (
                <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '1rem' }}>
                  <div style={{ fontSize: fs.small, fontFamily: monoFont, color: '#64748b' }}>
                    {item.startDate ? `${item.startDate} to ` : ''}{item.endDate}
                  </div>
                  <div>
                    <div style={{ fontSize: fs.base, fontWeight: 700, color: '#0f172a' }}>{item.degree}</div>
                    <div style={{ fontSize: fs.base, color: '#475569', fontFamily: monoFont, marginTop: '0.2rem' }}>
                      {item.institution}
                    </div>
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
              cv.skillsMeta?.title || 'Skills',
              accent, fs, false, undefined, false, headingStyle,
              { fontFamily: monoFont, borderBottom: `2px dashed #cbd5e1`, paddingBottom: '0.4rem', marginBottom: '0.8rem', showDot: false } as any
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {visibleItems.map(item => (
                <div key={item.id} style={{ fontSize: fs.base, lineHeight, display: 'flex', gap: '1rem' }}>
                  <strong style={{ color: '#0f172a', width: '120px', flexShrink: 0, fontFamily: monoFont }}>{item.categoryName}:</strong>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {item.skills.map((skill, i) => (
                      <span key={i} style={{ 
                        fontFamily: monoFont,
                        background: '#f1f5f9', 
                        border: `1px solid #cbd5e1`,
                        color: '#334155', 
                        padding: '0.1rem 0.4rem', 
                        borderRadius: '2px',
                        fontSize: '0.85em'
                      }}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }
      default: {
        return null; // Fallback
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
      <header style={{ marginBottom: sectionGap }}>
        <h1 style={{ margin: 0, fontSize: fs.name, fontWeight: 700, color: '#0f172a', lineHeight: 1.2, fontFamily: monoFont }}>
          <span style={{ color: accent }}>&gt;</span> {cv.basics.fullName}_
        </h1>
        {cv.basics.headline && (
          <div style={{ fontSize: fs.h3, color: '#475569', marginTop: '0.5rem', marginBottom: '1rem', fontFamily: monoFont }}>
            {cv.basics.headline}
          </div>
        )}
        {renderContactInfo(cv.basics, accent)}
      </header>

      {orderedSections.map(renderSection)}
    </div>
  );
}
