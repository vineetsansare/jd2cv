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

export default function ModernTemplate({ cv }: { cv: StructuredCV }) {
  const { accent, fontFamily, fs, lineHeight, pagePadding, sectionGap, showIcons, headingStyle } = getThemeValues(cv.theme);
  const orderedSections = getOrderedSections(cv).filter(id => sectionHasContent(cv, id));

  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case 'summary': {
        if (!cv.summary.visible) return null;
        return (
          <div key="summary" style={{ marginBottom: sectionGap }}>
            {renderSectionHeader(
              cv.summary.title || 'Professional Summary',
              accent, fs, showIcons, cv.summary.icon || 'fileText', cv.summary.showIcon !== false, headingStyle
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
              accent, fs, showIcons, cv.experienceMeta?.icon || 'briefcase', cv.experienceMeta?.showIcon !== false, headingStyle
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {visibleItems.map(item => (
                <div key={item.id} style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ width: '2px', background: accent, flexShrink: 0, marginTop: '0.4rem', marginBottom: '0.4rem', borderRadius: '2px', opacity: 0.8 }} />
                  <div style={{ flex: 1, textAlign: (item.alignment as any) || 'inherit' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <h3 style={{ margin: 0, fontSize: fs.h3, fontWeight: 600, color: '#0f172a' }}>{item.role}</h3>
                      <span style={{ fontSize: fs.small, color: accent, fontWeight: 500, whiteSpace: 'nowrap' }}>
                        {item.startDate} {item.startDate && item.endDate ? '—' : ''} {item.endDate}
                      </span>
                    </div>
                    <div style={{ fontSize: fs.base, color: '#475569', marginBottom: '0.4rem', fontWeight: 500 }}>
                      {item.company}{item.location ? ` • ${item.location}` : ''}
                    </div>
                    <div style={{ fontSize: fs.base, lineHeight, color: '#334155' }}>
                      <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        {item.bullets.map((b, i) => (
                          <li key={i}>{renderRichText(b, accent)}</li>
                        ))}
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
              accent, fs, showIcons, cv.educationMeta?.icon || 'graduation', cv.educationMeta?.showIcon !== false, headingStyle
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {visibleItems.map(item => (
                <div key={item.id} style={{ textAlign: (item.alignment as any) || 'inherit' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <h3 style={{ margin: 0, fontSize: fs.h3, fontWeight: 600, color: '#0f172a' }}>{item.degree}</h3>
                    <span style={{ fontSize: fs.small, color: '#64748b', whiteSpace: 'nowrap' }}>
                      {item.startDate ? `${item.startDate} — ` : ''}{item.endDate}
                    </span>
                  </div>
                  <div style={{ fontSize: fs.base, color: '#475569', marginTop: '0.1rem' }}>
                    {item.institution}{item.location ? ` • ${item.location}` : ''}
                  </div>
                  {item.score && (
                    <div style={{ fontSize: fs.base, color: '#475569', marginTop: '0.2rem' }}>
                      {renderRichText(item.score, accent)}
                    </div>
                  )}
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
              accent, fs, showIcons, cv.skillsMeta?.icon || 'cpu', cv.skillsMeta?.showIcon !== false, headingStyle
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {visibleItems.map(item => (
                <div key={item.id} style={{ fontSize: fs.base, lineHeight }}>
                  <strong style={{ color: '#0f172a', marginRight: '0.5rem' }}>{item.categoryName}:</strong>
                  <div style={{ display: 'inline-flex', flexWrap: 'wrap', gap: '0.4rem', verticalAlign: 'middle' }}>
                    {item.skills.map((skill, i) => (
                      <span key={i} style={{ 
                        background: `${accent}15`, 
                        color: accent, 
                        padding: '0.1rem 0.6rem', 
                        borderRadius: '999px',
                        fontSize: '0.9em',
                        fontWeight: 500
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
      case 'projects': {
        const visibleItems = cv.projects.filter(p => p.visible);
        if (!visibleItems.length) return null;
        return (
          <div key="projects" style={{ marginBottom: sectionGap }}>
            {renderSectionHeader(
              cv.projectsMeta?.title || 'Projects',
              accent, fs, showIcons, cv.projectsMeta?.icon || 'code', cv.projectsMeta?.showIcon !== false, headingStyle
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {visibleItems.map(item => (
                <div key={item.id} style={{ textAlign: (item.alignment as any) || 'inherit' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <h3 style={{ margin: 0, fontSize: fs.h3, fontWeight: 600, color: '#0f172a' }}>
                      {item.title}
                      {item.url && <a href={item.url} style={{ marginLeft: '0.5rem', fontSize: fs.small, color: accent, textDecoration: 'none' }}>[Link]</a>}
                      {item.githubUrl && <a href={item.githubUrl} style={{ marginLeft: '0.5rem', fontSize: fs.small, color: accent, textDecoration: 'none' }}>[GitHub]</a>}
                    </h3>
                    {(item.startDate || item.endDate) && (
                      <span style={{ fontSize: fs.small, color: '#64748b', whiteSpace: 'nowrap' }}>
                        {item.startDate} {item.startDate && item.endDate ? '—' : ''} {item.endDate}
                      </span>
                    )}
                  </div>
                  {item.subtitle && <div style={{ fontSize: fs.base, color: '#475569', marginBottom: '0.3rem' }}>{item.subtitle}</div>}
                  <div style={{ fontSize: fs.base, lineHeight, color: '#334155' }}>
                    <ul style={{ margin: '0.3rem 0', paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      {item.bullets.map((b, i) => <li key={i}>{renderRichText(b, accent)}</li>)}
                    </ul>
                  </div>
                  {item.technologies && item.technologies.length > 0 && (
                    <div style={{ fontSize: '0.85em', color: '#64748b', marginTop: '0.3rem' }}>
                      <strong>Technologies:</strong> {item.technologies.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      }
      case 'certifications': {
        const visibleItems = cv.certifications.filter(c => c.visible);
        if (!visibleItems.length) return null;
        return (
          <div key="certifications" style={{ marginBottom: sectionGap }}>
            {renderSectionHeader(
              cv.certificationsMeta?.title || 'Certifications',
              accent, fs, showIcons, cv.certificationsMeta?.icon || 'shield', cv.certificationsMeta?.showIcon !== false, headingStyle
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {visibleItems.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '1rem' }}>
                  <div style={{ fontSize: fs.base, color: '#334155' }}>
                    <strong style={{ color: '#0f172a' }}>{item.name}</strong> — {item.issuer}
                    {item.url && <a href={item.url} style={{ marginLeft: '0.5rem', fontSize: '0.9em', color: accent, textDecoration: 'none' }}>[Link]</a>}
                  </div>
                  <span style={{ fontSize: fs.small, color: '#64748b', whiteSpace: 'nowrap' }}>{item.date}</span>
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
              accent, fs, showIcons, cv.languagesMeta?.icon || 'globe', cv.languagesMeta?.showIcon !== false, headingStyle
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: fs.base }}>
              {visibleItems.map(item => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <strong style={{ color: '#0f172a' }}>{item.language}</strong>
                  <span style={{ color: '#64748b', fontSize: '0.9em' }}>({item.fluency})</span>
                </div>
              ))}
            </div>
          </div>
        );
      }
      case 'awards': {
        const visibleItems = cv.awards.filter(a => a.visible);
        if (!visibleItems.length) return null;
        return (
          <div key="awards" style={{ marginBottom: sectionGap }}>
             {renderSectionHeader(
              cv.awardsMeta?.title || 'Awards',
              accent, fs, showIcons, cv.awardsMeta?.icon || 'award', cv.awardsMeta?.showIcon !== false, headingStyle
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {visibleItems.map(item => (
                <div key={item.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <strong style={{ fontSize: fs.base, color: '#0f172a' }}>{item.title}</strong>
                    <span style={{ fontSize: fs.small, color: '#64748b' }}>{item.date}</span>
                  </div>
                  <div style={{ fontSize: fs.base, color: '#475569' }}>{item.awarder}</div>
                  {item.summary && <div style={{ fontSize: fs.base, color: '#334155', marginTop: '0.2rem', lineHeight }}>{renderRichText(item.summary, accent)}</div>}
                </div>
              ))}
            </div>
          </div>
        );
      }
      case 'volunteer': {
        const visibleItems = cv.volunteer.filter(v => v.visible);
        if (!visibleItems.length) return null;
        return (
          <div key="volunteer" style={{ marginBottom: sectionGap }}>
            {renderSectionHeader(
              cv.volunteerMeta?.title || 'Volunteer',
              accent, fs, showIcons, cv.volunteerMeta?.icon || 'heart', cv.volunteerMeta?.showIcon !== false, headingStyle
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {visibleItems.map(item => (
                <div key={item.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <h3 style={{ margin: 0, fontSize: fs.h3, fontWeight: 600, color: '#0f172a' }}>{item.role}</h3>
                    <span style={{ fontSize: fs.small, color: '#64748b' }}>
                      {item.startDate} — {item.endDate}
                    </span>
                  </div>
                  <div style={{ fontSize: fs.base, color: '#475569', marginBottom: '0.3rem' }}>
                    {item.organization}{item.location ? ` • ${item.location}` : ''}
                  </div>
                  {item.bullets && item.bullets.length > 0 && (
                    <div style={{ fontSize: fs.base, lineHeight, color: '#334155' }}>
                      <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        {item.bullets.map((b, i) => <li key={i}>{renderRichText(b, accent)}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      }
      case 'publications': {
         const visibleItems = cv.publications.filter(p => p.visible);
         if (!visibleItems.length) return null;
         return (
           <div key="publications" style={{ marginBottom: sectionGap }}>
             {renderSectionHeader(
               cv.publicationsMeta?.title || 'Publications',
               accent, fs, showIcons, cv.publicationsMeta?.icon || 'book', cv.publicationsMeta?.showIcon !== false, headingStyle
             )}
             <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
               {visibleItems.map(item => (
                 <div key={item.id}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                     <strong style={{ fontSize: fs.base, color: '#0f172a' }}>
                        {item.title}
                        {item.url && <a href={item.url} style={{ marginLeft: '0.5rem', fontSize: '0.9em', color: accent, textDecoration: 'none' }}>[Link]</a>}
                     </strong>
                     <span style={{ fontSize: fs.small, color: '#64748b' }}>{item.date}</span>
                   </div>
                   <div style={{ fontSize: fs.base, color: '#475569' }}>{item.publisher}</div>
                   {item.summary && <div style={{ fontSize: fs.base, color: '#334155', marginTop: '0.2rem', lineHeight }}>{renderRichText(item.summary, accent)}</div>}
                 </div>
               ))}
             </div>
           </div>
         );
      }
      case 'interests': {
        const visibleItems = cv.interests.filter(i => i.visible);
        if (!visibleItems.length) return null;
        return (
          <div key="interests" style={{ marginBottom: sectionGap }}>
            {renderSectionHeader(
              cv.interestsMeta?.title || 'Interests',
              accent, fs, showIcons, cv.interestsMeta?.icon || 'sparkles', cv.interestsMeta?.showIcon !== false, headingStyle
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: fs.base }}>
              {visibleItems.map(item => (
                <div key={item.id} style={{ display: 'flex', flexDirection: 'column' }}>
                  <strong style={{ color: '#0f172a' }}>{item.name}</strong>
                  {item.keywords && item.keywords.length > 0 && (
                     <span style={{ color: '#64748b', fontSize: '0.9em' }}>{item.keywords.join(', ')}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      }
      case 'references': {
        const visibleItems = cv.references.filter(r => r.visible);
        if (!visibleItems.length) return null;
        return (
          <div key="references" style={{ marginBottom: sectionGap }}>
             {renderSectionHeader(
              cv.referencesMeta?.title || 'References',
              accent, fs, showIcons, cv.referencesMeta?.icon || 'users', cv.referencesMeta?.showIcon !== false, headingStyle
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
              {visibleItems.map(item => (
                <div key={item.id} style={{ fontSize: fs.base, lineHeight }}>
                  <strong style={{ color: '#0f172a', display: 'block' }}>{item.name}</strong>
                  <div style={{ color: '#475569' }}>{item.title}{item.company ? ` at ${item.company}` : ''}</div>
                  {item.email && <div style={{ color: '#64748b' }}>{item.email}</div>}
                  {item.phone && <div style={{ color: '#64748b' }}>{item.phone}</div>}
                </div>
              ))}
            </div>
          </div>
        );
      }
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
                accent, fs, showIcons, customSec.icon || 'sparkles', customSec.showIcon !== false, headingStyle
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {visibleItems.map(item => (
                  <div key={item.id} style={{ textAlign: (item.alignment as any) || 'inherit' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap' }}>
                      <h3 style={{ margin: 0, fontSize: fs.h3, fontWeight: 600, color: '#0f172a' }}>
                        {item.title}
                        {item.url && <a href={item.url} style={{ marginLeft: '0.5rem', fontSize: fs.small, color: accent, textDecoration: 'none' }}>[Link]</a>}
                      </h3>
                      {item.date && <span style={{ fontSize: fs.small, color: '#64748b' }}>{item.date}</span>}
                    </div>
                    {item.subtitle && <div style={{ fontSize: fs.base, color: '#475569', marginBottom: '0.3rem' }}>{item.subtitle}{item.location ? ` • ${item.location}` : ''}</div>}
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
      <header style={{ marginBottom: sectionGap, display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: fs.name, fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
            {cv.basics.fullName}
          </h1>
          {cv.basics.headline && (
            <div style={{ fontSize: fs.h2, color: accent, fontWeight: 500, marginTop: '0.3rem', marginBottom: '0.6rem' }}>
              {cv.basics.headline}
            </div>
          )}
          {renderContactInfo(cv.basics, accent)}
        </div>
        
        {cv.basics.showAvatar && cv.basics.avatarUrl && (
          <img 
            src={cv.basics.avatarUrl} 
            alt="Profile" 
            style={{ 
              width: '80px', 
              height: '80px', 
              objectFit: 'cover',
              borderRadius: cv.basics.avatarShape === 'circle' ? '50%' : cv.basics.avatarShape === 'rounded' ? '12px' : '0'
            }} 
          />
        )}
      </header>

      {orderedSections.map(renderSection)}
    </div>
  );
}
