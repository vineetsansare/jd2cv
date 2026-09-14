import type { StructuredCV } from '../../../types/cvBuilder';
import { 
  getThemeValues, 
  renderRichText, 
  renderRichContent, 
  renderSectionHeader, 
  getOrderedSections 
} from './shared';
import { sectionHasContent } from '../../../utils/sectionRegistry';

export default function TwoColumnTemplate({ cv }: { cv: StructuredCV }) {
  const { accent, fontFamily, fs, lineHeight, pagePadding, sectionGap, showIcons, headingStyle } = getThemeValues(cv.theme);
  
  const allOrdered = getOrderedSections(cv).filter(id => sectionHasContent(cv, id));
  
  // Decide which columns sections go into
  const sidebarSectionIds = ['skills', 'languages', 'certifications', 'interests', 'education'];
  const mainSections = allOrdered.filter(id => !sidebarSectionIds.includes(id));
  const sidebarSections = allOrdered.filter(id => sidebarSectionIds.includes(id));

  // A common render block logic, styled a bit differently if it's in the sidebar vs main
  const renderSectionItem = (sectionId: string, isSidebar: boolean) => {
    const textColor = isSidebar ? '#f8fafc' : '#334155';
    const headingColor = isSidebar ? '#ffffff' : '#0f172a';
    const subColor = isSidebar ? '#cbd5e1' : '#64748b';
    const currentAccent = isSidebar ? '#60a5fa' : accent; // Use lighter accent on dark background
    
    switch (sectionId) {
      case 'summary': {
        if (!cv.summary.visible) return null;
        return (
          <div key="summary" style={{ marginBottom: sectionGap }}>
            {renderSectionHeader(
              cv.summary.title || 'Profile',
              currentAccent, fs, showIcons, cv.summary.icon || 'fileText', cv.summary.showIcon !== false, headingStyle,
              { color: headingColor, borderBottom: `1px solid ${isSidebar ? '#334155' : '#e2e8f0'}` } as any
            )}
            <div style={{ color: textColor, fontSize: fs.base, lineHeight }}>
              {renderRichContent(cv.summary.content, currentAccent, cv.summary.alignment)}
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
              currentAccent, fs, showIcons, cv.experienceMeta?.icon || 'briefcase', cv.experienceMeta?.showIcon !== false, headingStyle,
              { color: headingColor, borderBottom: `1px solid ${isSidebar ? '#334155' : '#e2e8f0'}` } as any
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {visibleItems.map(item => (
                <div key={item.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap' }}>
                    <div style={{ fontSize: fs.h3, fontWeight: 600, color: headingColor }}>{item.role}</div>
                    <span style={{ fontSize: fs.small, color: subColor, fontWeight: 500 }}>{item.startDate} — {item.endDate}</span>
                  </div>
                  <div style={{ fontSize: fs.base, color: currentAccent, marginBottom: '0.4rem', fontWeight: 500 }}>
                    {item.company}{item.location ? ` • ${item.location}` : ''}
                  </div>
                  <div style={{ fontSize: fs.base, lineHeight, color: textColor }}>
                    <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      {item.bullets.map((b, i) => <li key={i}>{renderRichText(b, currentAccent)}</li>)}
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
              currentAccent, fs, showIcons, cv.educationMeta?.icon || 'graduation', cv.educationMeta?.showIcon !== false, headingStyle,
              { color: headingColor, borderBottom: `1px solid ${isSidebar ? '#334155' : '#e2e8f0'}` } as any
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {visibleItems.map(item => (
                <div key={item.id}>
                  <div style={{ fontSize: fs.h3, fontWeight: 600, color: headingColor }}>{item.degree}</div>
                  <div style={{ fontSize: fs.base, color: subColor, margin: '0.2rem 0' }}>{item.institution}</div>
                  <div style={{ fontSize: fs.small, color: subColor }}>{item.startDate ? `${item.startDate} — ` : ''}{item.endDate}</div>
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
               currentAccent, fs, showIcons, cv.skillsMeta?.icon || 'cpu', cv.skillsMeta?.showIcon !== false, headingStyle,
               { color: headingColor, borderBottom: `1px solid ${isSidebar ? '#334155' : '#e2e8f0'}` } as any
             )}
             <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
               {visibleItems.map(item => (
                 <div key={item.id} style={{ fontSize: fs.base, lineHeight }}>
                   <div style={{ fontWeight: 600, color: headingColor, marginBottom: '0.3rem' }}>{item.categoryName}</div>
                   <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                     {item.skills.map((skill, i) => (
                       <span key={i} style={{ 
                         background: isSidebar ? '#334155' : '#f1f5f9', 
                         color: isSidebar ? '#f8fafc' : '#475569', 
                         padding: '0.2rem 0.5rem', 
                         borderRadius: '4px',
                         fontSize: '0.9em'
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
      // ... Add others as needed ...
      default: return null;
    }
  };

  return (
    <div style={{
      fontFamily,
      background: '#ffffff',
      color: '#334155',
      width: '100%',
      minHeight: '100%',
      boxSizing: 'border-box',
      display: 'grid',
      gridTemplateColumns: '1fr 2fr', // Sidebar left, main right for standard looks, or opposite. Let's do Sidebar left (33%) main right (66%)
    }}>
      {/* Sidebar */}
      <div style={{ background: '#0f172a', padding: pagePadding, color: '#f8fafc' }}>
        {cv.basics.showAvatar && cv.basics.avatarUrl && (
          <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center' }}>
            <img 
              src={cv.basics.avatarUrl} 
              alt="Profile" 
              style={{ 
                width: '120px', 
                height: '120px', 
                objectFit: 'cover',
                borderRadius: cv.basics.avatarShape === 'circle' ? '50%' : cv.basics.avatarShape === 'rounded' ? '16px' : '0',
                border: `3px solid ${accent}`
              }} 
            />
          </div>
        )}
        
        <div style={{ marginBottom: '2rem' }}>
          {renderSectionHeader('Contact', accent, fs, showIcons, 'user', true, headingStyle, { color: '#ffffff', borderBottom: '1px solid #334155' } as any)}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', color: '#cbd5e1', fontSize: fs.base }}>
            {cv.basics.email && <div>{cv.basics.email}</div>}
            {cv.basics.phone && <div>{cv.basics.phone}</div>}
            {cv.basics.location && <div>{cv.basics.location}</div>}
            {cv.basics.website && <div>{cv.basics.website}</div>}
            {cv.basics.links?.map(l => <div key={l.id}>{l.url}</div>)}
          </div>
        </div>

        {sidebarSections.map(id => renderSectionItem(id, true))}
      </div>

      {/* Main Column */}
      <div style={{ padding: pagePadding }}>
        <header style={{ marginBottom: '2rem' }}>
          <h1 style={{ margin: 0, fontSize: fs.name, fontWeight: 800, color: '#0f172a', lineHeight: 1.1, textTransform: 'uppercase' }}>
            {cv.basics.fullName}
          </h1>
          {cv.basics.headline && (
            <div style={{ fontSize: fs.h2, color: accent, marginTop: '0.5rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              {cv.basics.headline}
            </div>
          )}
        </header>

        {mainSections.map(id => renderSectionItem(id, false))}
      </div>
    </div>
  );
}
