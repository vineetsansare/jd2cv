import React from 'react';
import type { EducationItem, CVThemeSettings } from '../../../../types/cvBuilder';

interface EducationEntryProps {
  item: EducationItem;
  theme: CVThemeSettings;
}

export const EducationEntry: React.FC<EducationEntryProps> = ({ item }) => {
  const dateStr = item.startDate ? `${item.startDate} – ${item.endDate}` : item.endDate;

  return (
    <div style={{ marginBottom: '0.65rem', pageBreakInside: 'avoid' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap' }}>
        <div>
          <span style={{ fontWeight: 700, color: '#0f172a' }}>{item.degree}</span>
          <span style={{ color: '#94a3b8', margin: '0 0.35rem' }}>|</span>
          <span style={{ color: '#475569', fontStyle: 'italic' }}>{item.institution}</span>
          {item.score && <span style={{ color: '#64748b', fontSize: '0.85em', marginLeft: '0.4rem' }}>({item.score})</span>}
        </div>
        <div style={{ fontSize: '0.85em', color: '#64748b', fontWeight: 500 }}>
          {dateStr}
          {item.location && <span> • {item.location}</span>}
        </div>
      </div>
    </div>
  );
};
