import React, { useState } from 'react';
import type { EducationItem } from '../../../types/cvBuilder';
import { Plus, Trash2, ChevronDown, ChevronUp, Eye, EyeOff, GripVertical } from 'lucide-react';

interface EducationSectionProps {
  education: EducationItem[];
  onChange: (updated: EducationItem[]) => void;
}

export const EducationSection: React.FC<EducationSectionProps> = ({ education, onChange }) => {
  const [expandedId, setExpandedId] = useState<string | null>(education[0]?.id || null);

  const addEducation = () => {
    const newItem: EducationItem = {
      id: `edu-${Date.now()}`,
      degree: '',
      institution: '',
      location: '',
      startDate: '',
      endDate: '',
      score: '',
      visible: true
    };
    onChange([newItem, ...education]);
    setExpandedId(newItem.id);
  };

  const updateItem = (index: number, field: keyof EducationItem, value: any) => {
    const updated = [...education];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const removeItem = (index: number) => {
    const updated = [...education];
    updated.splice(index, 1);
    onChange(updated);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {education.length} Academic Qualifications
        </span>
        <button
          type="button"
          onClick={addEducation}
          className="btn btn-primary"
          style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
        >
          <Plus size={14} />
          <span>Add Education</span>
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {education.map((item, idx) => {
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
                      {item.degree || 'Degree / Qualification'}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {item.institution || 'University / College'} • {item.endDate || 'Year'}
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
                    title={item.visible ? 'Visible on CV' : 'Hidden'}
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

              {isExpanded && (
                <div style={{ padding: '1rem', borderTop: '1px solid var(--card-border)', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>Degree / Certification Title *</label>
                    <input 
                      type="text" 
                      value={item.degree} 
                      onChange={(e) => updateItem(idx, 'degree', e.target.value)} 
                      placeholder="e.g. Bachelor of Engineering (Computer Science)" 
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>University / School *</label>
                    <input 
                      type="text" 
                      value={item.institution} 
                      onChange={(e) => updateItem(idx, 'institution', e.target.value)} 
                      placeholder="e.g. University of Mumbai" 
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }} className="responsive-fields">
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>Graduation Year</label>
                      <input 
                        type="text" 
                        value={item.endDate} 
                        onChange={(e) => updateItem(idx, 'endDate', e.target.value)} 
                        placeholder="e.g. 2008" 
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>Location</label>
                      <input 
                        type="text" 
                        value={item.location || ''} 
                        onChange={(e) => updateItem(idx, 'location', e.target.value)} 
                        placeholder="e.g. Mumbai, India" 
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>GPA / Honors</label>
                      <input 
                        type="text" 
                        value={item.score || ''} 
                        onChange={(e) => updateItem(idx, 'score', e.target.value)} 
                        placeholder="e.g. First Class with Distinction" 
                      />
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
