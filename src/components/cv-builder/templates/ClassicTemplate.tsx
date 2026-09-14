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

export default function ClassicTemplate({ cv }: { cv: StructuredCV }) {
  const { accent, fontFamily, fs, lineHeight, pagePadding, sectionGap, headingStyle } = getThemeValues(cv.theme);
  const orderedSections = getOrderedSections(cv).filter(id => sectionHasContent(cv, id));

  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case 'summary': {
        if (!cv.summary.visible) return null;
        return (
          <div key="summary" style={{ marginBottom: sectionGap }}>
            {renderSectionHeader(
              cv.summary.title || 'Professional Summary',
              accent, fs, false, undefined, false, headingStyle,
              { borderTop: `1px solid ${accent}`, borderBottom: `1px solid ${accent}`, paddingBottom: '0.2rem', marginBottom: '0.5rem', textAlign: 'center', showDot: false }
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
              { borderTop: `1px solid ${accent}`, borderBottom: `1px solid ${accent}`, paddingBottom: '0.2rem', marginBottom: '0.5rem', textAlign: 'center', showDot: false }
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {visibleItems.map(item => (
                <div key={item.id} style={{ textAlign: (item.alignment as any) || 'inherit' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontWeight: 700, color: '#0f172a', fontSize: fs.base }}>
                    <span>{item.role}</span>
                    <span>{item.startDate} {item.startDate && item.endDate ? '—' : ''} {item.endDate}</span>
                  </div>
                  <div style={{ fontSize: fs.base, color: '#334155', fontStyle: 'italic', marginBottom: '0.3rem' }}>
                    {item.company}{item.location ? `, ${item.location}` : ''}
                  </div>
                  <div style={{ fontSize: fs.base, lineHeight, color: '#334155' }}>
                    <ul style={{ margin: 0, paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
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
              { borderTop: `1px solid ${accent}`, borderBottom: `1px solid ${accent}`, paddingBottom: '0.2rem', marginBottom: '0.5rem', textAlign: 'center', showDot: false }
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {visibleItems.map(item => (
                <div key={item.id} style={{ textAlign: (item.alignment as any) || 'inherit' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontWeight: 700, color: '#0f172a', fontSize: fs.base }}>
                    <span>{item.degree}</span>
                    <span>{item.startDate ? `${item.startDate} — ` : ''}{item.endDate}</span>
                  </div>
                  <div style={{ fontSize: fs.base, color: '#334155' }}>
                    {item.institution}{item.location ? `, ${item.location}` : ''}
                  </div>
                  {item.score && <div style={{ fontSize: fs.base, color: '#334155', fontStyle: 'italic' }}>{renderRichText(item.score, accent)}</div>}
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
              { borderTop: `1px solid ${accent}`, borderBottom: `1px solid ${accent}`, paddingBottom: '0.2rem', marginBottom: '0.5rem', textAlign: 'center', showDot: false }
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              {visibleItems.map(item => (
                <div key={item.id} style={{ fontSize: fs.base, lineHeight }}>
                  <strong style={{ color: '#0f172a' }}>{item.categoryName}: </strong>
                  <span>{item.skills.join(', ')}</span>
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
              { borderTop: `1px solid ${accent}`, borderBottom: `1px solid ${accent}`, paddingBottom: '0.2rem', marginBottom: '0.5rem', textAlign: 'center', showDot: false }
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {visibleItems.map(item => (
                <div key={item.id} style={{ textAlign: (item.alignment as any) || 'inherit' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontWeight: 700, color: '#0f172a', fontSize: fs.base }}>
                    <span>
                      {item.title}
                      {item.url && <a href={item.url} style={{ marginLeft: '0.5rem', fontSize: fs.small, color: accent, textDecoration: 'none', fontWeight: 'normal' }}>[Link]</a>}
                    </span>
                    {(item.startDate || item.endDate) && <span>{item.startDate} {item.startDate && item.endDate ? '—' : ''} {item.endDate}</span>}
                  </div>
                  {item.subtitle && <div style={{ fontSize: fs.base, color: '#334155', fontStyle: 'italic', marginBottom: '0.2rem' }}>{item.subtitle}</div>}
                  <div style={{ fontSize: fs.base, lineHeight, color: '#334155' }}>
                    <ul style={{ margin: 0, paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                      {item.bullets.map((b, i) => <li key={i}>{renderRichText(b, accent)}</li>)}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }
      // ... Other standard sections follow similar minimal styling
      case 'certifications': {
        const visibleItems = cv.certifications.filter(c => c.visible);
        if (!visibleItems.length) return null;
        return (
          <div key="certifications" style={{ marginBottom: sectionGap }}>
            {renderSectionHeader(
              cv.certificationsMeta?.title || 'Certifications',
              accent, fs, false, undefined, false, headingStyle,
              { borderTop: `1px solid ${accent}`, borderBottom: `1px solid ${accent}`, paddingBottom: '0.2rem', marginBottom: '0.5rem', textAlign: 'center', showDot: false }
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {visibleItems.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: fs.base }}>
                  <span><strong style={{ color: '#0f172a' }}>{item.name}</strong>, {item.issuer}</span>
                  <span>{item.date}</span>
                </div>
              ))}
            </div>
          </div>
        );
      }
      case 'languages': {
         const visibleItems = cv.languages.filter(l => l.visible);
         if (!visibleItems.length) return null;
         return (
           <div key="languages" style={{ marginBottom: sectionGap }}>
             {renderSectionHeader(
               cv.languagesMeta?.title || 'Languages',
               accent, fs, false, undefined, false, headingStyle,
               { borderTop: `1px solid ${accent}`, borderBottom: `1px solid ${accent}`, paddingBottom: '0.2rem', marginBottom: '0.5rem', textAlign: 'center', showDot: false }
             )}
             <div style={{ fontSize: fs.base }}>
               {visibleItems.map(item => `${item.language} (${item.fluency})`).join(', ')}
             </div>
           </div>
         );
      }
      case 'awards':
      case 'volunteer':
      case 'publications':
      case 'interests':
      case 'references':
        return null; // For ATS, usually keep it simple or implement similar to above. 
        // Realistically we need to render them if present.
        
      default: {
        if (sectionId.startsWith('custom-')) {
          const customSec = cv.customSections?.find(s => s.id === sectionId);
          if (!customSec || !customSec.visible) return null;
          const visibleItems = customSec.items.filter(i => i.visible);
          if (!visibleItems.length) return null;

          return (
            <div key={sectionId} style={{ marginBottom: sectionGap }}>
              {renderSectionHeader(
                customSec.sectionTitle,
                accent, fs, false, undefined, false, headingStyle,
                { borderTop: `1px solid ${accent}`, borderBottom: `1px solid ${accent}`, paddingBottom: '0.2rem', marginBottom: '0.5rem', textAlign: 'center', showDot: false }
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {visibleItems.map(item => (
                  <div key={item.id} style={{ textAlign: (item.alignment as any) || 'inherit' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontWeight: 700, color: '#0f172a', fontSize: fs.base }}>
                      <span>{item.title}</span>
                      {item.date && <span>{item.date}</span>}
                    </div>
                    {item.subtitle && <div style={{ fontSize: fs.base, color: '#334155', fontStyle: 'italic', marginBottom: '0.2rem' }}>{item.subtitle}{item.location ? `, ${item.location}` : ''}</div>}
                    <div style={{ fontSize: fs.base, lineHeight, color: '#334155' }}>
                      <ul style={{ margin: 0, paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                        {item.bullets.map((b, i) => <li key={i}>{renderRichText(b, accent)}</li>)}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        }
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
        <h1 style={{ margin: 0, fontSize: fs.name, fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
          {cv.basics.fullName}
        </h1>
        {cv.basics.headline && (
          <div style={{ fontSize: fs.h3, color: '#334155', marginTop: '0.3rem', marginBottom: '0.4rem', fontWeight: 500 }}>
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
