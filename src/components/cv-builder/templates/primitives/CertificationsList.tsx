import React from 'react';
import type { CertificationItem, CVThemeSettings } from '../../../../types/cvBuilder';
import { ExternalLink } from 'lucide-react';

interface CertificationsListProps {
  certifications: CertificationItem[];
  theme: CVThemeSettings;
}

export const CertificationsList: React.FC<CertificationsListProps> = ({ certifications, theme }) => {
  const accent = theme.accentColor || '#2563eb';
  if (!certifications || certifications.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
      {certifications.filter(c => c.visible !== false).map(item => (
        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', pageBreakInside: 'avoid' }}>
          <div>
            <span style={{ fontWeight: 600, color: '#0f172a' }}>{item.name}</span>
            <span style={{ color: '#94a3b8', margin: '0 0.35rem' }}>|</span>
            <span style={{ color: '#64748b' }}>{item.issuer}</span>
            {item.url && (
              <a href={item.url} target="_blank" rel="noreferrer" style={{ color: accent, marginLeft: '0.4rem', display: 'inline-flex' }}>
                <ExternalLink size={11} />
              </a>
            )}
          </div>
          {item.date && (
            <span style={{ fontSize: '0.85em', color: '#64748b' }}>{item.date}</span>
          )}
        </div>
      ))}
    </div>
  );
};
