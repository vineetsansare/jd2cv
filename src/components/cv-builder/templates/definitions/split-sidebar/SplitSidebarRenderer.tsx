import React from 'react';
import type { TemplateProps } from '../../registry/types';
import { PrintContainer } from '../../primitives/PrintContainer';
import { TemplateSectionHeading } from '../../primitives/TemplateSectionHeading';
import { ExperienceEntry, renderFormattedText } from '../../primitives/ExperienceEntry';
import { ProjectsList } from '../../primitives/ProjectsList';
import { Mail, Phone, MapPin, Globe, Linkedin, Github, ExternalLink } from 'lucide-react';

export const SplitSidebarRenderer: React.FC<TemplateProps> = ({ cv }) => {
  const { basics, summary, experience, education, skills, projects, certifications, theme } = cv;
  const accent = theme.accentColor || '#1e293b';
  const showPhoto = (theme.showPhoto !== false && basics.showAvatar) && !!basics.avatarUrl;
  const avatarShape = theme.photoShape || basics.avatarShape || 'circle';
  const avatarRadius = avatarShape === 'circle' ? '50%' : avatarShape === 'rounded' ? '14px' : '4px';

  const getNetworkIcon = (network: string) => {
    const net = network.toLowerCase();
    if (net.includes('linkedin')) return <Linkedin size={12} />;
    if (net.includes('github')) return <Github size={12} />;
    if (net.includes('portfolio') || net.includes('website')) return <Globe size={12} />;
    return <ExternalLink size={12} />;
  };

  return (
    <PrintContainer theme={theme} className="split-sidebar-template" style={{ padding: 0 }}>
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: '240px 1fr',
          minHeight: '1123px'
        }}
      >
        {/* Left Sidebar */}
        <aside 
          style={{
            backgroundColor: '#f8fafc',
            borderRight: '1px solid #e2e8f0',
            padding: '30px 22px',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}
        >
          {/* Avatar Photo */}
          {showPhoto && (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
              <img
                src={basics.avatarUrl}
                alt={basics.fullName}
                style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: avatarRadius,
                  objectFit: 'cover',
                  border: `3px solid ${accent}`,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                }}
              />
            </div>
          )}

          {/* Contact Details */}
          <div>
            <div 
              style={{
                fontSize: '0.85em',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: accent,
                borderBottom: `1.5px solid ${accent}44`,
                paddingBottom: '0.25rem',
                marginBottom: '0.65rem'
              }}
            >
              Contact
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.88em', color: '#334155' }}>
              {basics.email && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', wordBreak: 'break-all' }}>
                  <Mail size={12} style={{ color: accent, flexShrink: 0 }} />
                  <span>{basics.email}</span>
                </div>
              )}
              {basics.phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Phone size={12} style={{ color: accent, flexShrink: 0 }} />
                  <span>{basics.phone}</span>
                </div>
              )}
              {basics.location && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <MapPin size={12} style={{ color: accent, flexShrink: 0 }} />
                  <span>{basics.location}</span>
                </div>
              )}
              {basics.website && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', wordBreak: 'break-all' }}>
                  <Globe size={12} style={{ color: accent, flexShrink: 0 }} />
                  <span>{basics.website.replace(/^https?:\/\//, '')}</span>
                </div>
              )}
              {basics.links && basics.links.map(link => (
                <div key={link.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  {getNetworkIcon(link.network)}
                  <span>{link.username || link.network}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar Skills */}
          {skills && skills.filter(s => s.visible !== false).length > 0 && (
            <div>
              <div 
                style={{
                  fontSize: '0.85em',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: accent,
                  borderBottom: `1.5px solid ${accent}44`,
                  paddingBottom: '0.25rem',
                  marginBottom: '0.65rem'
                }}
              >
                {cv.skillsMeta?.title || 'Key Skills'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {skills.filter(s => s.visible !== false).map(cat => (
                  <div key={cat.id}>
                    <div style={{ fontSize: '0.82em', fontWeight: 700, color: '#0f172a', marginBottom: '0.2rem' }}>
                      {cat.categoryName}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                      {cat.skills.map((sk, idx) => (
                        <span 
                          key={idx}
                          style={{
                            display: 'inline-block',
                            padding: '0.12rem 0.45rem',
                            borderRadius: '4px',
                            fontSize: '0.78em',
                            fontWeight: 600,
                            backgroundColor: '#ffffff',
                            color: '#1e293b',
                            border: '1px solid #cbd5e1'
                          }}
                        >
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sidebar Education */}
          {education && education.filter(e => e.visible !== false).length > 0 && (
            <div>
              <div 
                style={{
                  fontSize: '0.85em',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: accent,
                  borderBottom: `1.5px solid ${accent}44`,
                  paddingBottom: '0.25rem',
                  marginBottom: '0.65rem'
                }}
              >
                {cv.educationMeta?.title || 'Education'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.88em' }}>
                {education.filter(e => e.visible !== false).map(item => (
                  <div key={item.id}>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{item.degree}</div>
                    <div style={{ color: '#475569', fontSize: '0.9em' }}>{item.institution}</div>
                    <div style={{ color: '#64748b', fontSize: '0.85em' }}>{item.endDate}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sidebar Certifications */}
          {certifications && certifications.filter(c => c.visible !== false).length > 0 && (
            <div>
              <div 
                style={{
                  fontSize: '0.85em',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: accent,
                  borderBottom: `1.5px solid ${accent}44`,
                  paddingBottom: '0.25rem',
                  marginBottom: '0.65rem'
                }}
              >
                Certifications
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.85em' }}>
                {certifications.filter(c => c.visible !== false).map(item => (
                  <div key={item.id}>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{item.name}</div>
                    <div style={{ color: '#64748b', fontSize: '0.85em' }}>{item.issuer} {item.date && `(${item.date})`}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Main Content Area */}
        <main style={{ padding: '32px 30px', display: 'flex', flexDirection: 'column' }}>
          {/* Header Title in Main Area */}
          <div style={{ marginBottom: '1.25rem', borderBottom: `2px solid ${accent}22`, paddingBottom: '0.75rem' }}>
            <h1 
              style={{
                margin: 0,
                fontSize: 'var(--cv-font-size-h1, 20pt)',
                fontWeight: 800,
                color: '#0f172a',
                letterSpacing: '-0.02em',
                lineHeight: 1.15
              }}
            >
              {basics.fullName || 'Your Full Name'}
            </h1>
            {basics.headline && (
              <div 
                style={{
                  fontSize: 'var(--cv-font-size-h3, 11pt)',
                  fontWeight: 600,
                  color: accent,
                  marginTop: '0.25rem'
                }}
              >
                {basics.headline}
              </div>
            )}
          </div>

          {/* Main Area Sections according to sectionOrder */}
          {(() => {
            const sectionOrder = cv.sectionOrder || ['summary', 'experience', 'projects'];
            return sectionOrder.map(sectionId => {
              if (sectionId === 'summary' && summary && summary.visible !== false && summary.content) {
                return (
                  <section key="summary" style={{ marginBottom: '1.15rem' }}>
                    <TemplateSectionHeading 
                      title={summary.title || 'Executive Profile'} 
                      theme={theme} 
                      styleOverride={theme.sectionHeadingStyle || 'underline'}
                    />
                    <div style={{ color: '#334155', lineHeight: 'inherit', textAlign: summary.alignment || 'left' }}>
                      {renderFormattedText(summary.content)}
                    </div>
                  </section>
                );
              }

              if (sectionId === 'experience' && experience && experience.filter(e => e.visible !== false).length > 0) {
                return (
                  <section key="experience" style={{ marginBottom: '1.15rem' }}>
                    <TemplateSectionHeading 
                      title={cv.experienceMeta?.title || 'Professional Experience'} 
                      theme={theme} 
                      styleOverride={theme.sectionHeadingStyle || 'underline'}
                    />
                    {experience.filter(e => e.visible !== false).map(item => (
                      <ExperienceEntry key={item.id} item={item} theme={theme} layout="standard" />
                    ))}
                  </section>
                );
              }

              if (sectionId === 'projects' && projects && projects.filter(p => p.visible !== false).length > 0) {
                return (
                  <section key="projects" style={{ marginBottom: '1.15rem' }}>
                    <TemplateSectionHeading 
                      title={cv.projectsMeta?.title || 'Key Projects & Highlights'} 
                      theme={theme} 
                      styleOverride={theme.sectionHeadingStyle || 'underline'}
                    />
                    <ProjectsList projects={projects} theme={theme} />
                  </section>
                );
              }

              return null;
            });
          })()}
        </main>
      </div>
    </PrintContainer>
  );
};

