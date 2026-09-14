import React, { useState } from 'react';
import type { VolunteerItem, SectionMeta } from '../../../types/cvBuilder';
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
  ArrowLeft
} from 'lucide-react';

interface VolunteerSectionProps {
  meta?: SectionMeta;
  volunteer: VolunteerItem[];
  onChange: (updated: VolunteerItem[], updatedMeta?: SectionMeta) => void;
}

export const VolunteerSection: React.FC<VolunteerSectionProps> = ({ 
  meta = { title: 'Volunteer Experience', icon: 'heart', showIcon: true },
  volunteer, 
  onChange 
}) => {
  const [isEditingHeading, setIsEditingHeading] = useState(false);
  const [editingEntryIndex, setEditingEntryIndex] = useState<number | null>(null);

  const addVolunteer = () => {
    const newItem: VolunteerItem = {
      id: `vol-${Date.now()}`,
      role: '',
      organization: '',
      location: '',
      startDate: '',
      endDate: '',
      isCurrent: false,
      bullets: [''],
      visible: true,
      alignment: 'justify'
    };
    const updated = [newItem, ...volunteer];
    onChange(updated, meta);
    setEditingEntryIndex(0);
  };

  const updateItem = (index: number, field: keyof VolunteerItem, value: any) => {
    const updated = [...volunteer];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated, meta);
  };

  const removeItem = (index: number) => {
    const updated = [...volunteer];
    updated.splice(index, 1);
    onChange(updated, meta);
    if (editingEntryIndex === index) {
      setEditingEntryIndex(null);
    }
  };

  const addBullet = (index: number) => {
    const updated = [...volunteer];
    updated[index].bullets = [...(updated[index].bullets || []), ''];
    onChange(updated, meta);
  };

  const updateBullet = (index: number, bulletIndex: number, text: string) => {
    const updated = [...volunteer];
    const bullets = [...updated[index].bullets];
    bullets[bulletIndex] = text;
    updated[index].bullets = bullets;
    onChange(updated, meta);
  };

  const removeBullet = (index: number, bulletIndex: number) => {
    const updated = [...volunteer];
    const bullets = [...updated[index].bullets];
    bullets.splice(bulletIndex, 1);
    updated[index].bullets = bullets;
    onChange(updated, meta);
  };

  if (editingEntryIndex !== null && volunteer[editingEntryIndex]) {
    const currentVol = volunteer[editingEntryIndex];

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={() => setEditingEntryIndex(null)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.2rem' }}
            >
              <ArrowLeft size={18} />
            </button>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Edit Volunteer Experience</h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => updateItem(editingEntryIndex, 'visible', !currentVol.visible)}
              style={{ background: 'none', border: 'none', color: currentVol.visible ? '#10b981' : 'var(--text-muted)', cursor: 'pointer', padding: '0.3rem' }}
              title={currentVol.visible ? 'Visible on CV' : 'Hidden from CV'}
            >
              {currentVol.visible ? <Eye size={16} /> : <EyeOff size={16} />}
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }} className="responsive-fields">
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>Role *</label>
            <input 
              type="text" 
              value={currentVol.role} 
              onChange={(e) => updateItem(editingEntryIndex, 'role', e.target.value)} 
              placeholder="e.g. Mentor" 
            />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>Organization *</label>
            <input 
              type="text" 
              value={currentVol.organization} 
              onChange={(e) => updateItem(editingEntryIndex, 'organization', e.target.value)} 
              placeholder="e.g. Code for Good" 
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }} className="responsive-fields">
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>Start Date</label>
            <input 
              type="text" 
              value={currentVol.startDate} 
              onChange={(e) => updateItem(editingEntryIndex, 'startDate', e.target.value)} 
              placeholder="e.g. Jan 2023" 
            />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>End Date</label>
            <input 
              type="text" 
              value={currentVol.isCurrent ? 'Present' : currentVol.endDate} 
              disabled={currentVol.isCurrent}
              onChange={(e) => updateItem(editingEntryIndex, 'endDate', e.target.value)} 
              placeholder="e.g. Present" 
            />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>Location</label>
            <input 
              type="text" 
              value={currentVol.location || ''} 
              onChange={(e) => updateItem(editingEntryIndex, 'location', e.target.value)} 
              placeholder="e.g. Remote" 
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="checkbox"
            id={`vol-current-${currentVol.id}`}
            checked={currentVol.isCurrent}
            onChange={(e) => {
              updateItem(editingEntryIndex, 'isCurrent', e.target.checked);
              if (e.target.checked) updateItem(editingEntryIndex, 'endDate', 'Present');
            }}
          />
          <label htmlFor={`vol-current-${currentVol.id}`} style={{ fontSize: '0.8rem', cursor: 'pointer' }}>
            I currently volunteer here
          </label>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, margin: 0 }}>
              Responsibilities & Impact
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
            {currentVol.bullets.map((bullet, bIdx) => (
              <div key={bIdx} style={{ display: 'flex', flexDirection: 'column', borderRadius: '8px', border: '1px solid var(--card-border)', overflow: 'hidden' }}>
                <RichTextToolbar
                  textareaId={`vol-bullet-${editingEntryIndex}-${bIdx}`}
                  value={bullet}
                  onChange={(newText) => updateBullet(editingEntryIndex, bIdx, newText)}
                  alignment={currentVol.alignment || 'justify'}
                  onAlignmentChange={(align) => updateItem(editingEntryIndex, 'alignment', align)}
                />
                <div style={{ display: 'flex', alignItems: 'flex-start', background: 'var(--card-bg)' }}>
                  <textarea
                    id={`vol-bullet-${editingEntryIndex}-${bIdx}`}
                    rows={3}
                    value={bullet}
                    onChange={(e) => updateBullet(editingEntryIndex, bIdx, e.target.value)}
                    placeholder="e.g. Mentored 5 students in web development..."
                    style={{
                      flexGrow: 1,
                      border: 'none',
                      padding: '0.65rem 0.85rem',
                      fontSize: '0.82rem',
                      lineHeight: 1.5,
                      background: 'transparent',
                      textAlign: currentVol.alignment || 'justify',
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      {isEditingHeading ? (
        <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '10px', border: '1px solid var(--card-border)' }}>
          <SectionHeadingControl
            title={meta.title || 'Volunteer Experience'}
            iconName={meta.icon || 'heart'}
            showIcon={meta.showIcon !== false}
            onSave={(newTitle, newIcon, newShowIcon) => {
              onChange(volunteer, {
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
            {volunteer.length} {volunteer.length === 1 ? 'Role' : 'Roles'}
          </span>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {volunteer.map((item, idx) => (
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
                  {item.organization || 'Organization'}
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

      <button
        type="button"
        onClick={addVolunteer}
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
        <span>Add Volunteer Experience</span>
      </button>
    </div>
  );
};
