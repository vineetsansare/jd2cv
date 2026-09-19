import React from 'react';
import type { CertificationItem, CVThemeSettings } from '../../../../types/cvBuilder';
import { ExternalLink } from 'lucide-react';
import { cleanText } from './ExperienceEntry';

interface CertificationsListProps {
  certifications: CertificationItem[];
  theme: CVThemeSettings;
}

export const CertificationsList: React.FC<CertificationsListProps> = ({ certifications, theme }) => {
  const accent = theme.accentColor || '#2563eb';
  if (!certifications || certifications.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
      {certifications.filter(c => c.visible !== false).map(item => {
        const nameStr = cleanText(item.name);
        const issuerStr = cleanText(item.issuer);
        const dateStr = cleanText(item.date);
        const rawUrl = item.url || '';
        const cleanUrl = rawUrl.replace(/^\[(.*?)\]\((.*?)\)$/, '$2').trim();

        return (
          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', pageBreakInside: 'avoid' }}>
            <div>
              <span style={{ fontWeight: 600, color: '#0f172a' }}>{nameStr}</span>
              <span style={{ color: '#94a3b8', margin: '0 0.35rem' }}>|</span>
              <span style={{ color: '#64748b' }}>{issuerStr}</span>
              {cleanUrl && (
                <a href={cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`} target="_blank" rel="noreferrer" style={{ color: accent, marginLeft: '0.4rem', display: 'inline-flex' }}>
                  <ExternalLink size={11} />
                </a>
              )}
            </div>
            {dateStr && (
              <span style={{ fontSize: '0.85em', color: '#64748b' }}>{dateStr}</span>
            )}
          </div>
        );
      })}
    </div>
  );
};

