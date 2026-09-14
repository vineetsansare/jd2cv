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

export default function MinimalTemplate({ cv }: { cv: StructuredCV }) {
  const { accent, fontFamily, fs, lineHeight, pagePadding, sectionGap, headingStyle } = getThemeValues(cv.theme);
  const orderedSections = getOrderedSections(cv).filter(id => sectionHasContent(cv, id));

  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case 'summary': {
        if (!cv.summary.visible) return null;
        return (
          <div key="summary" style={{ marginBottom: sectionGap }}>
            {renderSectionHeader(
              cv.summary.title || 'Summary',
              accent, fs, false, undefined, false, headingStyle,
              { borderBottom: `1px solid #e2e8f0`, paddingBottom: '0.4rem', marginBottom: '0.8rem', showDot: false }
            )}
            <div style={{ color: '#475569', fontSize: fs.base, lineHeight }}>
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
              { borderBottom: `1px solid #e2e8f0`, paddingBottom: '0.4rem', marginBottom: '0.8rem', showDot: false }
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              {visibleItems.map(item => (
                <div key={item.id} style={{ textAlign: (item.alignment as any) || 'inherit' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap' }}>
                    <div style={{ fontSize: fs.h3, fontWeight: 600, color: '#0f172a' }}>{item.role}</div>
                    <span style={{ fontSize: fs.small, color: '#94a3b8' }}>{item.startDate} {item.startDate && item.endDate ? '—' : ''} {item.endDate}</span>
                  </div>
                  <div style={{ fontSize: fs.base, color: accent, marginBottom: '0.5rem', fontWeight: 500 }}>
                    {item.company}{item.location ? ` • ${item.location}` : ''}
                  </div>
                  <div style={{ fontSize: fs.base, lineHeight, color: '#475569' }}>
                    <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
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
              { borderBottom: `1px solid #e2e8f0`, paddingBottom: '0.4rem', marginBottom: '0.8rem', showDot: false }
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {visibleItems.map(item => (
                <div key={item.id} style={{ textAlign: (item.alignment as any) || 'inherit' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap' }}>
                    <div style={{ fontSize: fs.h3, fontWeight: 600, color: '#0f172a' }}>{item.degree}</div>
                    <span style={{ fontSize: fs.small, color: '#94a3b8' }}>{item.startDate ? `${item.startDate} — ` : ''}{item.endDate}</span>
                  </div>
                  <div style={{ fontSize: fs.base, color: '#475569' }}>
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
              cv.skillsMeta?.title || 'Skills',
              accent, fs, false, undefined, false, headingStyle,
              { borderBottom: `1px solid #e2e8f0`, paddingBottom: '0.4rem', marginBottom: '0.8rem', showDot: false }
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '0.8rem' }}>
              {visibleItems.map(item => (
                <div key={item.id} style={{ fontSize: fs.base, lineHeight }}>
                  <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.2rem' }}>{item.categoryName}</div>
                  <div style={{ color: '#475569' }}>{item.skills.join(', ')}</div>
                </div>
              ))}
            </div>
          </div>
        );
      }
      case 'projects': {
        const visibleItems = cv.projects.filter(p => p.visible);
        if (!visibleItems.length) return null;
        return (
          <div key="projects" style={{ marginBottom: sectionGap }}>
             {renderSectionHeader(
              cv.projectsMeta?.title || 'Projects',
              accent, fs, false, undefined, false, headingStyle,
              { borderBottom: `1px solid #e2e8f0`, paddingBottom: '0.4rem', marginBottom: '0.8rem', showDot: false }
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              {visibleItems.map(item => (
                <div key={item.id} style={{ textAlign: (item.alignment as any) || 'inherit' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap' }}>
                    <div style={{ fontSize: fs.h3, fontWeight: 600, color: '#0f172a' }}>{item.title}</div>
                    {(item.startDate || item.endDate) && <span style={{ fontSize: fs.small, color: '#94a3b8' }}>{item.startDate} {item.startDate && item.endDate ? '—' : ''} {item.endDate}</span>}
                  </div>
                  {item.subtitle && <div style={{ fontSize: fs.base, color: accent, marginBottom: '0.5rem', fontWeight: 500 }}>{item.subtitle}</div>}
                  <div style={{ fontSize: fs.base, lineHeight, color: '#475569' }}>
                    <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      {item.bullets.map((b, i) => <li key={i}>{renderRichText(b, accent)}</li>)}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }
      // ... Add others similar as needed for real prod code ...
      default: {
        return null; // Minimal fallback for other unhandled
      }
    }
  };

  return (
    <div style={{
      fontFamily,
      padding: pagePadding,
      background: '#ffffff',
      color: '#475569',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      <header style={{ marginBottom: `calc(${sectionGap} + 1rem)` }}>
        <h1 style={{ margin: 0, fontSize: fs.name, fontWeight: 300, color: accent, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
          {cv.basics.fullName}
        </h1>
        {cv.basics.headline && (
          <div style={{ fontSize: fs.h2, color: '#0f172a', marginTop: '0.5rem', marginBottom: '1rem', fontWeight: 500 }}>
            {cv.basics.headline}
          </div>
        )}
        {renderContactInfo(cv.basics, '#94a3b8')}
      </header>

      {orderedSections.map(renderSection)}
    </div>
  );
}
