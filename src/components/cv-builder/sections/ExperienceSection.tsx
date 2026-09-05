import React, { useState } from 'react';
import type { WorkExperienceItem, SectionMeta } from '../../../types/cvBuilder';
import { SectionHeadingControl } from '../SectionHeadingControl';
import { RichTextToolbar } from '../RichTextToolbar';
import { 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff, 
  GripVertical, 
  Edit3, 
  Check, 
  Lightbulb, 
  ArrowLeft
} from 'lucide-react';

interface ExperienceSectionProps {
  meta?: SectionMeta;
  experience: WorkExperienceItem[];
  onChange: (updatedExperience: WorkExperienceItem[], updatedMeta?: SectionMeta) => void;
}

export const ExperienceSection: React.FC<ExperienceSectionProps> = ({ 
  meta = { title: 'Professional Experience', icon: 'briefcase', showIcon: true },
  experience, 
  onChange 
}) => {
  const [isEditingHeading, setIsEditingHeading] = useState(false);
  const [editingEntryIndex, setEditingEntryIndex] = useState<number | null>(null);
  const [showTips, setShowTips] = useState(false);

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
      visible: true,
      alignment: 'justify'
    };
    const updated = [newItem, ...experience];
    onChange(updated, meta);
    setEditingEntryIndex(0);
  };

  const updateItem = (index: number, field: keyof WorkExperienceItem, value: any) => {
    const updated = [...experience];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated, meta);
  };

  const removeItem = (index: number) => {
    const updated = [...experience];
    updated.splice(index, 1);
    onChange(updated, meta);
    if (editingEntryIndex === index) {
      setEditingEntryIndex(null);
    }
  };

  const addBullet = (expIndex: number) => {
    const updated = [...experience];
    updated[expIndex].bullets = [...(updated[expIndex].bullets || []), ''];
    onChange(updated, meta);
  };

  const updateBullet = (expIndex: number, bulletIndex: number, text: string) => {
    const updated = [...experience];
    const bullets = [...updated[expIndex].bullets];
    bullets[bulletIndex] = text;
    updated[expIndex].bullets = bullets;
    onChange(updated, meta);
  };

  const removeBullet = (expIndex: number, bulletIndex: number) => {
    const updated = [...experience];
    const bullets = [...updated[expIndex].bullets];
    bullets.splice(bulletIndex, 1);
    updated[expIndex].bullets = bullets;
    onChange(updated, meta);
  };

  // Full "Edit Entry" mode
  if (editingEntryIndex !== null && experience[editingEntryIndex]) {
    const currentExp = experience[editingEntryIndex];

    return (
      <div 
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          background: 'var(--card-bg)',
          borderRadius: '12px',
          padding: '1.25rem'
        }}
      >
        {/* Top bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={() => setEditingEntryIndex(null)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.2rem' }}
            >
              <ArrowLeft size={18} />
            </button>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Edit Entry</h3>
            <button
              type="button"
              onClick={() => setShowTips(!showTips)}
              style={{
                background: 'rgba(124, 58, 237, 0.1)',
                border: '1px solid rgba(124, 58, 237, 0.25)',
                color: 'var(--accent-primary)',
                borderRadius: '20px',
                padding: '3px 10px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <Lightbulb size={13} />
              <span>Get Tips</span>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => updateItem(editingEntryIndex, 'visible', !currentExp.visible)}
              style={{ background: 'none', border: 'none', color: currentExp.visible ? '#10b981' : 'var(--text-muted)', cursor: 'pointer', padding: '0.3rem' }}
              title={currentExp.visible ? 'Visible on CV' : 'Hidden from CV'}
            >
              {currentExp.visible ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
            <button
              type="button"
              onClick={() => removeItem(editingEntryIndex)}
              style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.3rem' }}
              title="Delete Entry"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Tips Box */}
        {showTips && (
          <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.2)', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
            💡 <strong>Bullet Point Formula:</strong> Action Verb + Scope + Impact Metrics (e.g. <em>Spearheaded microservice modernization, cutting AWS latency by <strong>35%</strong> across <strong>1.2M active users</strong></em>).
          </div>
        )}

        {/* Role & Company Inputs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }} className="responsive-fields">
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>Job Title / Role *</label>
            <input 
              type="text" 
              value={currentExp.role} 
              onChange={(e) => updateItem(editingEntryIndex, 'role', e.target.value)} 
              placeholder="e.g. Engineering Tech Lead" 
            />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>Company / Employer *</label>
            <input 
              type="text" 
              value={currentExp.company} 
              onChange={(e) => updateItem(editingEntryIndex, 'company', e.target.value)} 
              placeholder="e.g. Emirates NBD" 
            />
          </div>
        </div>

        {/* Dates & Location */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }} className="responsive-fields">
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>Start Date</label>
            <input 
              type="text" 
              value={currentExp.startDate} 
              onChange={(e) => updateItem(editingEntryIndex, 'startDate', e.target.value)} 
              placeholder="e.g. Oct 2022" 
            />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>End Date</label>
            <input 
              type="text" 
              value={currentExp.isCurrent ? 'Present' : currentExp.endDate} 
              disabled={currentExp.isCurrent}
              onChange={(e) => updateItem(editingEntryIndex, 'endDate', e.target.value)} 
              placeholder="e.g. Present" 
            />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>Location</label>
            <input 
              type="text" 
              value={currentExp.location || ''} 
              onChange={(e) => updateItem(editingEntryIndex, 'location', e.target.value)} 
              placeholder="e.g. Dubai, UAE" 
            />
          </div>
        </div>

        {/* Current Job Checkbox */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="checkbox"
            id={`current-${currentExp.id}`}
            checked={currentExp.isCurrent}
            onChange={(e) => {
              updateItem(editingEntryIndex, 'isCurrent', e.target.checked);
              if (e.target.checked) updateItem(editingEntryIndex, 'endDate', 'Present');
            }}
          />
          <label htmlFor={`current-${currentExp.id}`} style={{ fontSize: '0.8rem', cursor: 'pointer' }}>
            I currently work in this role
          </label>
        </div>

        {/* Key Achievements / Bullets with Rich Formatting */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, margin: 0 }}>
              Key Achievements & Responsibilities
            </label>
            <button
              type="button"
              onClick={() => addBullet(editingEntryIndex)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-primary)',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.2rem'
              }}
            >
              <Plus size={13} />
              <span>Add Bullet Point</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {currentExp.bullets.map((bullet, bIdx) => (
              <div key={bIdx} style={{ display: 'flex', flexDirection: 'column', borderRadius: '8px', border: '1px solid var(--card-border)', overflow: 'hidden' }}>
                <RichTextToolbar
                  textareaId={`bullet-${editingEntryIndex}-${bIdx}`}
                  value={bullet}
                  onChange={(newText) => updateBullet(editingEntryIndex, bIdx, newText)}
                  alignment={currentExp.alignment || 'justify'}
                  onAlignmentChange={(align) => updateItem(editingEntryIndex, 'alignment', align)}
                />
                <div style={{ display: 'flex', alignItems: 'flex-start', background: 'var(--card-bg)' }}>
                  <textarea
                    id={`bullet-${editingEntryIndex}-${bIdx}`}
                    rows={3}
                    value={bullet}
                    onChange={(e) => updateBullet(editingEntryIndex, bIdx, e.target.value)}
                    placeholder="e.g. Provided technical leadership for 8-10 engineers, driving 30% engagement surge..."
                    style={{
                      flexGrow: 1,
                      border: 'none',
                      padding: '0.65rem 0.85rem',
                      fontSize: '0.82rem',
                      lineHeight: 1.5,
                      background: 'transparent',
                      textAlign: currentExp.alignment || 'justify',
                      boxSizing: 'border-box'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => removeBullet(editingEntryIndex, bIdx)}
                    style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.65rem' }}
                    title="Remove Bullet"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Done Button */}
        <button
          type="button"
          onClick={() => setEditingEntryIndex(null)}
          style={{
            background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '10px',
            padding: '0.75rem',
            fontWeight: 700,
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
            marginTop: '0.5rem'
          }}
        >
          <Check size={18} />
          <span>Done</span>
        </button>
      </div>
    );
  }

  // Overview / Section Accordion List
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      {/* Header Row / Edit Heading */}
      {isEditingHeading ? (
        <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '10px', border: '1px solid var(--card-border)' }}>
          <SectionHeadingControl
            title={meta.title || 'Professional Experience'}
            iconName={meta.icon || 'briefcase'}
            showIcon={meta.showIcon !== false}
            onSave={(newTitle, newIcon, newShowIcon) => {
              onChange(experience, {
                title: newTitle,
                icon: newIcon,
                showIcon: newShowIcon
              });
              setIsEditingHeading(false);
            }}
            onCancel={() => setIsEditingHeading(false)}
          />
        </div>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setIsEditingHeading(true)}
            style={{
              background: 'none',
              border: '1px solid var(--card-border)',
              borderRadius: '6px',
              padding: '0.3rem 0.65rem',
              fontSize: '0.78rem',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <Edit3 size={13} />
            <span>Edit Heading</span>
          </button>

          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {experience.length} {experience.length === 1 ? 'Position' : 'Positions'}
          </span>
        </div>
      )}

      {/* List of Entries */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {experience.map((item, idx) => (
          <div
            key={item.id || idx}
            onClick={() => setEditingEntryIndex(idx)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.85rem 1rem',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--card-border)',
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'all 0.15s',
              gap: '0.75rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0, flexGrow: 1 }}>
              <GripVertical size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                  {item.company || 'Company'}
                </span>
                {item.role && (
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    , {item.role}
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  updateItem(idx, 'visible', !item.visible);
                }}
                style={{ background: 'none', border: 'none', color: item.visible ? '#10b981' : 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}
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
                style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.25rem' }}
                title="Delete"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Entry Button */}
      <button
        type="button"
        onClick={addExperience}
        style={{
          padding: '0.75rem',
          border: '1.5px dashed var(--card-border)',
          borderRadius: '10px',
          background: 'var(--bg-secondary)',
          color: 'var(--accent-primary)',
          fontSize: '0.85rem',
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.4rem',
          marginTop: '0.25rem'
        }}
      >
        <Plus size={16} />
        <span>Add Entry</span>
      </button>
    </div>
  );
};
