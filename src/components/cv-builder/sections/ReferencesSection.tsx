import React, { useState } from 'react';
import type { ReferenceItem, SectionMeta } from '../../../types/cvBuilder';
import { SectionHeadingControl } from '../SectionHeadingControl';
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

interface ReferencesSectionProps {
  meta?: SectionMeta;
  references: ReferenceItem[];
  onChange: (updated: ReferenceItem[], updatedMeta?: SectionMeta) => void;
}

export const ReferencesSection: React.FC<ReferencesSectionProps> = ({ 
  meta = { title: 'References', icon: 'user', showIcon: true },
  references, 
  onChange 
}) => {
  const [isEditingHeading, setIsEditingHeading] = useState(false);
  const [editingEntryIndex, setEditingEntryIndex] = useState<number | null>(null);

  const addReference = () => {
    const newItem: ReferenceItem = {
      id: `ref-${Date.now()}`,
      name: '',
      title: '',
      company: '',
      email: '',
      phone: '',
      relationship: '',
      visible: true
    };
    const updated = [newItem, ...references];
    onChange(updated, meta);
    setEditingEntryIndex(0);
  };

  const updateItem = (index: number, field: keyof ReferenceItem, value: any) => {
    const updated = [...references];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated, meta);
  };

  const removeItem = (index: number) => {
    const updated = [...references];
    updated.splice(index, 1);
    onChange(updated, meta);
    if (editingEntryIndex === index) {
      setEditingEntryIndex(null);
    }
  };

  if (editingEntryIndex !== null && references[editingEntryIndex]) {
    const currentRef = references[editingEntryIndex];

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
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Edit Reference</h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => updateItem(editingEntryIndex, 'visible', !currentRef.visible)}
              style={{ background: 'none', border: 'none', color: currentRef.visible ? '#10b981' : 'var(--text-muted)', cursor: 'pointer', padding: '0.3rem' }}
              title={currentRef.visible ? 'Visible on CV' : 'Hidden from CV'}
            >
              {currentRef.visible ? <Eye size={16} /> : <EyeOff size={16} />}
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
            <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>Name *</label>
            <input 
              type="text" 
              value={currentRef.name} 
              onChange={(e) => updateItem(editingEntryIndex, 'name', e.target.value)} 
              placeholder="e.g. Jane Doe" 
            />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>Relationship / Context</label>
            <input 
              type="text" 
              value={currentRef.relationship || ''} 
              onChange={(e) => updateItem(editingEntryIndex, 'relationship', e.target.value)} 
              placeholder="e.g. Former Manager" 
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }} className="responsive-fields">
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>Job Title</label>
            <input 
              type="text" 
              value={currentRef.title} 
              onChange={(e) => updateItem(editingEntryIndex, 'title', e.target.value)} 
              placeholder="e.g. CTO" 
            />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>Company</label>
            <input 
              type="text" 
              value={currentRef.company} 
              onChange={(e) => updateItem(editingEntryIndex, 'company', e.target.value)} 
              placeholder="e.g. Tech Innovations" 
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }} className="responsive-fields">
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>Email Address</label>
            <input 
              type="email" 
              value={currentRef.email || ''} 
              onChange={(e) => updateItem(editingEntryIndex, 'email', e.target.value)} 
              placeholder="e.g. jane@example.com" 
            />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>Phone Number</label>
            <input 
              type="text" 
              value={currentRef.phone || ''} 
              onChange={(e) => updateItem(editingEntryIndex, 'phone', e.target.value)} 
              placeholder="e.g. +1 234 567 8900" 
            />
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
            title={meta.title || 'References'}
            iconName={meta.icon || 'user'}
            showIcon={meta.showIcon !== false}
            onSave={(newTitle, newIcon, newShowIcon) => {
              onChange(references, {
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
            {references.length} {references.length === 1 ? 'Reference' : 'References'}
          </span>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {references.map((item, idx) => (
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
                  {item.name || 'Untitled Reference'}
                </span>
                {item.company && (
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    , {item.company}
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
        onClick={addReference}
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
        <span>Add Reference</span>
      </button>
    </div>
  );
};
