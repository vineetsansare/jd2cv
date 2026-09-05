import React from 'react';
import type { StructuredCV } from '../../../types/cvBuilder';
import { Mail, Phone, MapPin, Globe, ExternalLink } from 'lucide-react';

interface TemplateProps {
  cv: StructuredCV;
}

export const TemplateRenderer: React.FC<TemplateProps> = ({ cv }) => {
  const { theme, basics, summary, experience, education, skills, projects } = cv;
  const accent = theme.accentColor || '#1e3a8a';
  const fontFamily = theme.fontFamily || 'Plus Jakarta Sans';
  
  const fontSizeMap = {
    compact: { base: '11px', name: '20px', h2: '13px', h3: '12px' },
    standard: { base: '12.5px', name: '24px', h2: '15px', h3: '13.5px' },
    spacious: { base: '14px', name: '28px', h2: '17px', h3: '15px' }
  };
  const fs = fontSizeMap[theme.fontSize || 'standard'];

  const marginMap = {
    compact: '24px 30px',
    standard: '36px 42px',
    spacious: '48px 54px'
  };
  const pagePadding = marginMap[theme.pageMargin || 'standard'];

  // Helper to render markdown bolding in bullet text
  const renderRichText = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={idx} style={{ color: '#0f172a', fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  // --------------------------------------------------------------------------
  // 1. MODERN TIMELINE TEMPLATE (FlowCV Signature Style)
  // --------------------------------------------------------------------------
  if (theme.templateId === 'modern-timeline' || !theme.templateId) {
    return (
      <div 
        className="cv-a4-document modern-timeline"
        style={{
          padding: pagePadding,
          fontFamily: `'${fontFamily}', sans-serif`,
          fontSize: fs.base,
          lineHeight: theme.lineHeight === 'tight' ? 1.4 : theme.lineHeight === 'relaxed' ? 1.7 : 1.55,
          color: '#334155',
          background: '#ffffff',
          boxSizing: 'border-box'
        }}
      >
        {/* Header with Photo & 2-Col Contact Details */}
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginBottom: '1.75rem', borderBottom: `2px solid ${accent}18`, paddingBottom: '1.5rem' }}>
          {basics.showAvatar && basics.avatarUrl && (
            <img 
              src={basics.avatarUrl} 
              alt={basics.fullName}
              style={{
                width: '88px',
                height: '88px',
                borderRadius: basics.avatarShape === 'circle' ? '50%' : basics.avatarShape === 'rounded' ? '16px' : '4px',
                objectFit: 'cover',
                border: `3px solid ${accent}`,
                boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
                flexShrink: 0
              }}
            />
          )}

          <div style={{ flexGrow: 1 }}>
            <h1 style={{ margin: '0 0 0.25rem 0', fontSize: fs.name, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
              {basics.fullName || 'Your Full Name'}
            </h1>
            {basics.headline && (
              <div style={{ fontSize: fs.h3, fontWeight: 600, color: accent, marginBottom: '0.65rem' }}>
                {basics.headline}
              </div>
            )}

            {/* Contact Grid */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem 1.25rem', fontSize: '0.85em', color: '#64748b' }}>
              {basics.email && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Mail size={13} style={{ color: accent }} />
                  <span>{basics.email}</span>
                </div>
              )}
              {basics.phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Phone size={13} style={{ color: accent }} />
                  <span>{basics.phone}</span>
                </div>
              )}
              {basics.location && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <MapPin size={13} style={{ color: accent }} />
                  <span>{basics.location}</span>
                </div>
              )}
              {basics.website && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Globe size={13} style={{ color: accent }} />
                  <span>{basics.website.replace(/^https?:\/\//, '')}</span>
                </div>
              )}
              {basics.links && basics.links.map((link) => (
                <div key={link.id} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <ExternalLink size={13} style={{ color: accent }} />
                  <a href={link.url} target="_blank" rel="noreferrer" style={{ color: '#475569', textDecoration: 'none' }}>
                    {link.username || link.network}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Executive Profile */}
        {summary.visible && summary.content && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: fs.h2, fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: `1.5px solid ${accent}`, paddingBottom: '0.35rem', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: accent }}></span>
              {summary.title || 'Executive Profile'}
            </h2>
            <div style={{ color: '#334155', textAlign: 'justify', lineHeight: 1.6 }}>
              {renderRichText(summary.content)}
            </div>
          </div>
        )}

        {/* Professional Experience */}
        {experience.some(e => e.visible) && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: fs.h2, fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: `1.5px solid ${accent}`, paddingBottom: '0.35rem', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: accent }}></span>
              Professional Experience
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              {experience.filter(e => e.visible).map((exp) => (
                <div key={exp.id} style={{ position: 'relative', paddingLeft: '1.25rem', borderLeft: `2px solid ${accent}30` }}>
                  {/* Timeline dot */}
                  <div style={{ position: 'absolute', left: '-5px', top: '4px', width: '8px', height: '8px', borderRadius: '50%', background: accent, border: '2px solid #ffffff' }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', marginBottom: '0.2rem' }}>
                    <h3 style={{ margin: 0, fontSize: fs.h3, fontWeight: 700, color: '#0f172a' }}>
                      {exp.role}
                    </h3>
                    <span style={{ fontSize: '0.85em', fontWeight: 600, color: accent }}>
                      {exp.startDate} – {exp.isCurrent ? 'Present' : exp.endDate}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.9em', fontWeight: 600, color: '#475569', marginBottom: '0.45rem' }}>
                    {exp.company} {exp.location && `• ${exp.location}`}
                  </div>

                  {exp.bullets && exp.bullets.length > 0 && (
                    <ul style={{ margin: 0, paddingLeft: '1.15rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      {exp.bullets.map((bullet, bIdx) => (
                        <li key={bIdx} style={{ color: '#334155' }}>
                          {renderRichText(bullet)}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {education.some(e => e.visible) && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: fs.h2, fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: `1.5px solid ${accent}`, paddingBottom: '0.35rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: accent }}></span>
              Education
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {education.filter(e => e.visible).map((edu) => (
                <div key={edu.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: fs.h3, fontWeight: 700, color: '#0f172a' }}>
                      {edu.degree}
                    </h3>
                    <div style={{ fontSize: '0.9em', color: '#475569' }}>
                      {edu.institution} {edu.location && `• ${edu.location}`} {edu.score && `(${edu.score})`}
                    </div>
                  </div>
                  <span style={{ fontSize: '0.85em', fontWeight: 600, color: accent }}>
                    {edu.startDate ? `${edu.startDate} – ${edu.endDate}` : edu.endDate}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Technical Skills & Competencies */}
        {skills.some(s => s.visible && s.skills.length > 0) && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: fs.h2, fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: `1.5px solid ${accent}`, paddingBottom: '0.35rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: accent }}></span>
              Technical Skills & Competencies
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {skills.filter(s => s.visible).map((cat) => (
                <div key={cat.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <span style={{ fontWeight: 700, color: '#0f172a', minWidth: '160px', flexShrink: 0 }}>
                    {cat.categoryName}:
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {cat.skills.map((skill, sIdx) => (
                      <span 
                        key={sIdx}
                        style={{
                          background: `${accent}10`,
                          color: accent,
                          border: `1px solid ${accent}25`,
                          padding: '1px 7px',
                          borderRadius: '6px',
                          fontSize: '0.88em',
                          fontWeight: 600
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects & Certifications */}
        {projects && projects.some(p => p.visible) && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: fs.h2, fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: `1.5px solid ${accent}`, paddingBottom: '0.35rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: accent }}></span>
              Featured Projects
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {projects.filter(p => p.visible).map((proj) => (
                <div key={proj.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <h3 style={{ margin: 0, fontSize: fs.h3, fontWeight: 700, color: '#0f172a' }}>
                      {proj.url ? <a href={proj.url} target="_blank" rel="noreferrer" style={{ color: accent, textDecoration: 'underline' }}>{proj.title}</a> : proj.title}
                      {proj.subtitle && <span style={{ fontWeight: 400, color: '#64748b', fontSize: '0.9em' }}> — {proj.subtitle}</span>}
                    </h3>
                  </div>
                  {proj.technologies && proj.technologies.length > 0 && (
                    <div style={{ fontSize: '0.85em', color: '#64748b', fontStyle: 'italic', marginBottom: '0.25rem' }}>
                      Technologies: {proj.technologies.join(', ')}
                    </div>
                  )}
                  {proj.bullets && proj.bullets.length > 0 && (
                    <ul style={{ margin: 0, paddingLeft: '1.15rem' }}>
                      {proj.bullets.map((b, bIdx) => (
                        <li key={bIdx}>{renderRichText(b)}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // 2. CLASSIC ATS TEMPLATE (Single Column Standard)
  // --------------------------------------------------------------------------
  return (
    <div 
      className="cv-a4-document classic-ats"
      style={{
        padding: pagePadding,
        fontFamily: `'${fontFamily}', sans-serif`,
        fontSize: fs.base,
        lineHeight: 1.5,
        color: '#111827',
        background: '#ffffff'
      }}
    >
      {/* Centered Header */}
      <div style={{ textAlign: 'center', borderBottom: '1px solid #d1d5db', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
        <h1 style={{ margin: '0 0 0.25rem 0', fontSize: fs.name, fontWeight: 800, color: '#111827' }}>
          {basics.fullName}
        </h1>
        {basics.headline && (
          <div style={{ fontSize: fs.h3, fontWeight: 600, color: accent, marginBottom: '0.5rem' }}>
            {basics.headline}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.9em', color: '#4b5563' }}>
          {basics.email && <span>{basics.email}</span>}
          {basics.phone && <span>• {basics.phone}</span>}
          {basics.location && <span>• {basics.location}</span>}
          {basics.website && <span>• {basics.website}</span>}
        </div>
      </div>

      {/* Summary */}
      {summary.visible && summary.content && (
        <div style={{ marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: fs.h2, fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: `1px solid ${accent}`, paddingBottom: '0.2rem', marginBottom: '0.5rem' }}>
            {summary.title || 'Summary'}
          </h2>
          <div style={{ color: '#374151', textAlign: 'justify' }}>{renderRichText(summary.content)}</div>
        </div>
      )}

      {/* Experience */}
      {experience.some(e => e.visible) && (
        <div style={{ marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: fs.h2, fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: `1px solid ${accent}`, paddingBottom: '0.2rem', marginBottom: '0.65rem' }}>
            Experience
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            {experience.filter(e => e.visible).map((exp) => (
              <div key={exp.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <strong style={{ fontSize: fs.h3, color: '#111827' }}>{exp.role}</strong>
                  <span style={{ fontSize: '0.9em', color: '#4b5563' }}>{exp.startDate} – {exp.isCurrent ? 'Present' : exp.endDate}</span>
                </div>
                <div style={{ fontStyle: 'italic', fontSize: '0.9em', color: '#4b5563', marginBottom: '0.35rem' }}>
                  {exp.company} {exp.location && `, ${exp.location}`}
                </div>
                {exp.bullets && (
                  <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {exp.bullets.map((b, bIdx) => (
                      <li key={bIdx} style={{ color: '#374151' }}>{renderRichText(b)}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education & Skills */}
      {education.some(e => e.visible) && (
        <div style={{ marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: fs.h2, fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: `1px solid ${accent}`, paddingBottom: '0.2rem', marginBottom: '0.5rem' }}>
            Education
          </h2>
          {education.filter(e => e.visible).map((edu) => (
            <div key={edu.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.35rem' }}>
              <div>
                <strong>{edu.degree}</strong>, {edu.institution}
              </div>
              <span style={{ fontSize: '0.9em', color: '#4b5563' }}>{edu.endDate}</span>
            </div>
          ))}
        </div>
      )}

      {skills.some(s => s.visible) && (
        <div>
          <h2 style={{ fontSize: fs.h2, fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: `1px solid ${accent}`, paddingBottom: '0.2rem', marginBottom: '0.5rem' }}>
            Skills
          </h2>
          {skills.filter(s => s.visible).map((cat) => (
            <div key={cat.id} style={{ marginBottom: '0.3rem' }}>
              <strong>{cat.categoryName}:</strong> {cat.skills.join(', ')}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
