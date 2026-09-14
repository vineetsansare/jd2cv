import React, { useState } from 'react';
import type { CustomSection, CustomSectionItem } from '../../../types/cvBuilder';
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

interface CustomSectionEditorProps {
  section: CustomSection;
  onChange: (updated: CustomSection) => void;
}

export const CustomSectionEditor: React.FC<CustomSectionEditorProps> = ({ 
  section, 
  onChange 
}) => {
  const [isEditingHeading, setIsEditingHeading] = useState(false);
  const [editingEntryIndex, setEditingEntryIndex] = useState<number | null>(null);

  const addItem = () => {
    const newItem: CustomSectionItem = {
      id: `c-item-${Date.now()}`,
      title: '',
      subtitle: '',
      date: '',
      location: '',
      url: '',
      bullets: [''],
      visible: true,
      alignment: 'justify'
    };
    const updated = {
      ...section,
      items: [newItem, ...section.items]
    };
    onChange(updated);
    setEditingEntryIndex(0);
  };

  const updateItem = (index: number, field: keyof CustomSectionItem, value: any) => {
    const newItems = [...section.items];
    newItems[index] = { ...newItems[index], [field]: value };
    onChange({ ...section, items: newItems });
  };

  const removeItem = (index: number) => {
    const newItems = [...section.items];
    newItems.splice(index, 1);
    onChange({ ...section, items: newItems });
    if (editingEntryIndex === index) {
      setEditingEntryIndex(null);
    }
  };

  const addBullet = (index: number) => {
    const newItems = [...section.items];
    newItems[index].bullets = [...(newItems[index].bullets || []), ''];
    onChange({ ...section, items: newItems });
  };

  const updateBullet = (index: number, bulletIndex: number, text: string) => {
    const newItems = [...section.items];
    const bullets = [...newItems[index].bullets];
    bullets[bulletIndex] = text;
    newItems[index].bullets = bullets;
    onChange({ ...section, items: newItems });
  };

  const removeBullet = (index: number, bulletIndex: number) => {
    const newItems = [...section.items];
    const bullets = [...newItems[index].bullets];
    bullets.splice(bulletIndex, 1);
    newItems[index].bullets = bullets;
    onChange({ ...section, items: newItems });
  };

  if (editingEntryIndex !== null && section.items[editingEntryIndex]) {
    const currentItem = section.items[editingEntryIndex];

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
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Edit Item</h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => updateItem(editingEntryIndex, 'visible', !currentItem.visible)}
              style={{ background: 'none', border: 'none', color: currentItem.visible ? '#10b981' : 'var(--text-muted)', cursor: 'pointer', padding: '0.3rem' }}
              title={currentItem.visible ? 'Visible on CV' : 'Hidden from CV'}
            >
              {currentItem.visible ? <Eye size={16} /> : <EyeOff size={16} />}
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
              value={currentItem.title} 
              onChange={(e) => updateItem(editingEntryIndex, 'title', e.target.value)} 
              placeholder="e.g. Project Manager" 
            />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>Subtitle</label>
            <input 
              type="text" 
              value={currentItem.subtitle || ''} 
              onChange={(e) => updateItem(editingEntryIndex, 'subtitle', e.target.value)} 
              placeholder="e.g. Acme Corp" 
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }} className="responsive-fields">
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>Date</label>
            <input 
              type="text" 
              value={currentItem.date || ''} 
              onChange={(e) => updateItem(editingEntryIndex, 'date', e.target.value)} 
              placeholder="e.g. 2023" 
            />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>Location</label>
            <input 
              type="text" 
              value={currentItem.location || ''} 
              onChange={(e) => updateItem(editingEntryIndex, 'location', e.target.value)} 
              placeholder="e.g. New York, NY" 
            />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>URL</label>
            <input 
              type="text" 
              value={currentItem.url || ''} 
              onChange={(e) => updateItem(editingEntryIndex, 'url', e.target.value)} 
              placeholder="e.g. https://example.com" 
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, margin: 0 }}>
              Description & Highlights
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
            {currentItem.bullets.map((bullet, bIdx) => (
              <div key={bIdx} style={{ display: 'flex', flexDirection: 'column', borderRadius: '8px', border: '1px solid var(--card-border)', overflow: 'hidden' }}>
                <RichTextToolbar
                  textareaId={`custom-bullet-${editingEntryIndex}-${bIdx}`}
                  value={bullet}
                  onChange={(newText) => updateBullet(editingEntryIndex, bIdx, newText)}
                  alignment={currentItem.alignment || 'justify'}
                  onAlignmentChange={(align) => updateItem(editingEntryIndex, 'alignment', align)}
                />
                <div style={{ display: 'flex', alignItems: 'flex-start', background: 'var(--card-bg)' }}>
                  <textarea
                    id={`custom-bullet-${editingEntryIndex}-${bIdx}`}
                    rows={3}
                    value={bullet}
                    onChange={(e) => updateBullet(editingEntryIndex, bIdx, e.target.value)}
                    placeholder="e.g. Achieved 20% growth in..."
                    style={{
                      flexGrow: 1,
                      border: 'none',
                      padding: '0.65rem 0.85rem',
                      fontSize: '0.82rem',
                      lineHeight: 1.5,
                      background: 'transparent',
                      textAlign: currentItem.alignment || 'justify',
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
            title={section.sectionTitle || 'Custom Section'}
            iconName={section.icon || 'folder'}
            showIcon={section.showIcon !== false}
            onSave={(newTitle, newIcon, newShowIcon) => {
              onChange({
                ...section,
                sectionTitle: newTitle,
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
            {section.items.length} {section.items.length === 1 ? 'Item' : 'Items'}
          </span>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {section.items.map((item, idx) => (
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
                  {item.title || 'Untitled Item'}
                </span>
                {item.subtitle && (
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    , {item.subtitle}
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
        onClick={addItem}
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
        <span>Add Item</span>
      </button>
    </div>
  );
};
