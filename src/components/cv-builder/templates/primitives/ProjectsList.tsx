import React from 'react';
import type { ProjectItem, CVThemeSettings } from '../../../../types/cvBuilder';
import { ExternalLink, Github } from 'lucide-react';
import { renderFormattedText, cleanText } from './ExperienceEntry';

interface ProjectsListProps {
  projects: ProjectItem[];
  theme: CVThemeSettings;
}

export const ProjectsList: React.FC<ProjectsListProps> = ({ projects, theme }) => {
  const accent = theme.accentColor || '#2563eb';
  if (!projects || projects.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      {projects.filter(p => p.visible !== false).map(item => {
        const titleStr = cleanText(item.title);
        const subtitleStr = cleanText(item.subtitle);
        const rawUrl = item.url || '';
        const cleanUrl = rawUrl.replace(/^\[(.*?)\]\((.*?)\)$/, '$2').trim();

        return (
          <div key={item.id} style={{ pageBreakInside: 'avoid' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', marginBottom: '0.2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{titleStr}</span>
                {subtitleStr && <span style={{ color: '#64748b', fontSize: '0.9em' }}>• {subtitleStr}</span>}
                {cleanUrl && (
                  <a href={cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`} target="_blank" rel="noreferrer" style={{ color: accent, display: 'inline-flex' }}>
                    <ExternalLink size={12} />
                  </a>
                )}
                {item.githubUrl && (
                  <a href={item.githubUrl.startsWith('http') ? item.githubUrl : `https://${item.githubUrl}`} target="_blank" rel="noreferrer" style={{ color: '#475569', display: 'inline-flex' }}>
                    <Github size={12} />
                  </a>
                )}
              </div>

              {(item.startDate || item.endDate) && (
                <span style={{ fontSize: '0.85em', color: '#64748b' }}>
                  {item.startDate ? `${item.startDate} – ${item.endDate || 'Present'}` : item.endDate}
                </span>
              )}
            </div>

            {item.technologies && item.technologies.length > 0 && (
              <div style={{ fontSize: '0.85em', color: accent, fontWeight: 600, marginBottom: '0.25rem' }}>
                {item.technologies.map(t => cleanText(t)).join(' • ')}
              </div>
            )}

            {item.bullets && item.bullets.length > 0 && (
              <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#334155' }}>
                {item.bullets.map((bullet, idx) => (
                  <li key={idx} style={{ marginBottom: '0.2rem' }}>
                    {renderFormattedText(bullet)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
};

