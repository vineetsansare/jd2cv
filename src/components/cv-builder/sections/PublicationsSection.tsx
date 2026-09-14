import React, { useState } from 'react';
import type { PublicationItem, SectionMeta } from '../../../types/cvBuilder';
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

interface PublicationsSectionProps {
  meta?: SectionMeta;
  publications: PublicationItem[];
  onChange: (updated: PublicationItem[], updatedMeta?: SectionMeta) => void;
}

export const PublicationsSection: React.FC<PublicationsSectionProps> = ({ 
  meta = { title: 'Publications', icon: 'book', showIcon: true },
  publications, 
  onChange 
}) => {
  const [isEditingHeading, setIsEditingHeading] = useState(false);
  const [editingEntryIndex, setEditingEntryIndex] = useState<number | null>(null);

  const addPublication = () => {
    const newItem: PublicationItem = {
      id: `pub-${Date.now()}`,
      title: '',
      publisher: '',
      date: '',
      summary: '',
      url: '',
      visible: true
    };
    const updated = [newItem, ...publications];
    onChange(updated, meta);
    setEditingEntryIndex(0);
  };

  const updateItem = (index: number, field: keyof PublicationItem, value: any) => {
    const updated = [...publications];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated, meta);
  };

  const removeItem = (index: number) => {
    const updated = [...publications];
    updated.splice(index, 1);
    onChange(updated, meta);
    if (editingEntryIndex === index) {
      setEditingEntryIndex(null);
    }
  };

  if (editingEntryIndex !== null && publications[editingEntryIndex]) {
    const currentPub = publications[editingEntryIndex];

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
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Edit Publication</h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => updateItem(editingEntryIndex, 'visible', !currentPub.visible)}
              style={{ background: 'none', border: 'none', color: currentPub.visible ? '#10b981' : 'var(--text-muted)', cursor: 'pointer', padding: '0.3rem' }}
              title={currentPub.visible ? 'Visible on CV' : 'Hidden from CV'}
            >
              {currentPub.visible ? <Eye size={16} /> : <EyeOff size={16} />}
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
            <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>Title *</label>
            <input 
              type="text" 
              value={currentPub.title} 
              onChange={(e) => updateItem(editingEntryIndex, 'title', e.target.value)} 
              placeholder="e.g. A novel approach to AI" 
            />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>Publisher / Journal *</label>
            <input 
              type="text" 
              value={currentPub.publisher} 
              onChange={(e) => updateItem(editingEntryIndex, 'publisher', e.target.value)} 
              placeholder="e.g. Nature" 
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }} className="responsive-fields">
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>Date</label>
            <input 
              type="text" 
              value={currentPub.date} 
              onChange={(e) => updateItem(editingEntryIndex, 'date', e.target.value)} 
              placeholder="e.g. 2023" 
            />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>URL</label>
            <input 
              type="text" 
              value={currentPub.url || ''} 
              onChange={(e) => updateItem(editingEntryIndex, 'url', e.target.value)} 
              placeholder="e.g. https://doi.org/10.1000/xyz123" 
            />
          </div>
        </div>

        <div className="form-group" style={{ margin: 0 }}>
          <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>Summary</label>
          <textarea 
            rows={3}
            value={currentPub.summary || ''} 
            onChange={(e) => updateItem(editingEntryIndex, 'summary', e.target.value)} 
            placeholder="Brief description or abstract..." 
            style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', resize: 'vertical' }}
          />
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
            title={meta.title || 'Publications'}
            iconName={meta.icon || 'book'}
            showIcon={meta.showIcon !== false}
            onSave={(newTitle, newIcon, newShowIcon) => {
              onChange(publications, {
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
            {publications.length} {publications.length === 1 ? 'Publication' : 'Publications'}
          </span>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {publications.map((item, idx) => (
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
                  {item.title || 'Untitled Publication'}
                </span>
                {item.publisher && (
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    , {item.publisher}
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
        onClick={addPublication}
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
        <span>Add Publication</span>
      </button>
    </div>
  );
};
