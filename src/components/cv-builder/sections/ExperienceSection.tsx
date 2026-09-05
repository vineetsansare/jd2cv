import React, { useState } from 'react';
import type { WorkExperienceItem } from '../../../types/cvBuilder';
import { Plus, Trash2, ChevronDown, ChevronUp, Eye, EyeOff, GripVertical } from 'lucide-react';

interface ExperienceSectionProps {
  experience: WorkExperienceItem[];
  onChange: (updated: WorkExperienceItem[]) => void;
}

export const ExperienceSection: React.FC<ExperienceSectionProps> = ({ experience, onChange }) => {
  const [expandedId, setExpandedId] = useState<string | null>(experience[0]?.id || null);

  const addExperience = () => {
    const newItem: WorkExperienceItem = {
      id: `exp-${Date.now()}`,
      role: '',
      company: '',
      location: '',
      startDate: '',
      endDate: '',
      isCurrent: false,
      bullets: [''],
      visible: true
    };
    onChange([newItem, ...experience]);
    setExpandedId(newItem.id);
  };

  const updateItem = (index: number, field: keyof WorkExperienceItem, value: any) => {
    const updated = [...experience];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const removeItem = (index: number) => {
    const updated = [...experience];
    updated.splice(index, 1);
    onChange(updated);
  };

  const addBullet = (expIndex: number) => {
    const updated = [...experience];
    updated[expIndex].bullets = [...(updated[expIndex].bullets || []), ''];
    onChange(updated);
  };

  const updateBullet = (expIndex: number, bulletIndex: number, text: string) => {
    const updated = [...experience];
    const bullets = [...updated[expIndex].bullets];
    bullets[bulletIndex] = text;
    updated[expIndex].bullets = bullets;
    onChange(updated);
  };

  const removeBullet = (expIndex: number, bulletIndex: number) => {
    const updated = [...experience];
    const bullets = [...updated[expIndex].bullets];
    bullets.splice(bulletIndex, 1);
    updated[expIndex].bullets = bullets;
    onChange(updated);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {experience.length} {experience.length === 1 ? 'Role' : 'Roles'} in Career Timeline
        </span>
        <button
          type="button"
          onClick={addExperience}
          className="btn btn-primary"
          style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
        >
          <Plus size={14} />
          <span>Add Position</span>
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {experience.map((item, idx) => {
          const isExpanded = expandedId === item.id;

          return (
            <div 
              key={item.id || idx} 
              style={{
                borderRadius: '12px',
                border: '1px solid var(--card-border)',
                background: 'var(--bg-secondary)',
                overflow: 'hidden'
              }}
            >
              {/* Card Header / Summary Row */}
              <div 
                style={{
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  userSelect: 'none',
                  background: isExpanded ? 'rgba(124, 58, 237, 0.05)' : 'transparent'
                }}
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
                  <GripVertical size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.role || 'Untitled Position'}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {item.company || 'Company Name'} • {item.startDate || 'Date'} – {item.isCurrent ? 'Present' : (item.endDate || '')}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateItem(idx, 'visible', !item.visible);
                    }}
                    style={{ background: 'none', border: 'none', color: item.visible ? '#10b981' : 'var(--text-muted)', cursor: 'pointer', padding: '0.2rem' }}
                    title={item.visible ? 'Visible on CV' : 'Hidden from CV'}
                  >
                    {item.visible ? <Eye size={15} /> : <EyeOff size={15} />}
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeItem(idx);
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.2rem' }}
                    title="Delete Entry"
                  >
                    <Trash2 size={15} />
                  </button>

                  <div style={{ color: 'var(--text-muted)' }}>
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>
              </div>

              {/* Card Body / Edit Form */}
              {isExpanded && (
                <div style={{ padding: '1rem', borderTop: '1px solid var(--card-border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }} className="responsive-fields">
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>Job Title / Role *</label>
                      <input 
                        type="text" 
                        value={item.role} 
                        onChange={(e) => updateItem(idx, 'role', e.target.value)} 
                        placeholder="e.g. Engineering Tech Lead" 
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>Company / Employer *</label>
                      <input 
                        type="text" 
                        value={item.company} 
                        onChange={(e) => updateItem(idx, 'company', e.target.value)} 
                        placeholder="e.g. Emirates NBD" 
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }} className="responsive-fields">
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>Start Date</label>
                      <input 
                        type="text" 
                        value={item.startDate} 
                        onChange={(e) => updateItem(idx, 'startDate', e.target.value)} 
                        placeholder="e.g. Oct 2022" 
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>End Date</label>
                      <input 
                        type="text" 
                        value={item.isCurrent ? 'Present' : item.endDate} 
                        disabled={item.isCurrent}
                        onChange={(e) => updateItem(idx, 'endDate', e.target.value)} 
                        placeholder="e.g. Present" 
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>Location</label>
                      <input 
                        type="text" 
                        value={item.location || ''} 
                        onChange={(e) => updateItem(idx, 'location', e.target.value)} 
                        placeholder="e.g. Dubai, UAE" 
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="checkbox"
                      id={`current-${item.id}`}
                      checked={item.isCurrent}
                      onChange={(e) => {
                        updateItem(idx, 'isCurrent', e.target.checked);
                        if (e.target.checked) updateItem(idx, 'endDate', 'Present');
                      }}
                    />
                    <label htmlFor={`current-${item.id}`} style={{ fontSize: '0.8rem', cursor: 'pointer' }}>
                      I currently work in this role
                    </label>
                  </div>

                  {/* Bullet Points */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, margin: 0 }}>
                        Key Achievements & Responsibilities
                      </label>
                      <button
                        type="button"
                        onClick={() => addBullet(idx)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--accent-primary)',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.2rem'
                        }}
                      >
                        <Plus size={12} />
                        <span>Add Bullet</span>
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {item.bullets.map((bullet, bIdx) => (
                        <div key={bIdx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                          <span style={{ fontSize: '0.9rem', color: 'var(--accent-primary)', marginTop: '0.35rem' }}>•</span>
                          <textarea
                            rows={2}
                            value={bullet}
                            onChange={(e) => updateBullet(idx, bIdx, e.target.value)}
                            placeholder="e.g. Spearheaded delivery of microservices, cutting latency by 35% across 100k+ users..."
                            style={{ flexGrow: 1, fontSize: '0.82rem', lineHeight: 1.5 }}
                          />
                          <button
                            type="button"
                            onClick={() => removeBullet(idx, bIdx)}
                            style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.35rem' }}
                            title="Remove Bullet"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
