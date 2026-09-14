import React, { useState } from 'react';
import type { LanguageItem, SectionMeta } from '../../../types/cvBuilder';
import { SectionHeadingControl } from '../SectionHeadingControl';
import { 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff, 
  GripVertical,
  Edit3
} from 'lucide-react';

interface LanguagesSectionProps {
  meta?: SectionMeta;
  languages: LanguageItem[];
  onChange: (updated: LanguageItem[], updatedMeta?: SectionMeta) => void;
}

const FLUENCY_LEVELS = ['Native', 'Fluent', 'Advanced', 'Intermediate', 'Basic'];

export const LanguagesSection: React.FC<LanguagesSectionProps> = ({ 
  meta = { title: 'Languages', icon: 'globe', showIcon: true },
  languages, 
  onChange 
}) => {
  const [isEditingHeading, setIsEditingHeading] = useState(false);

  const addLanguage = () => {
    const newItem: LanguageItem = {
      id: `lang-${Date.now()}`,
      language: '',
      fluency: 'Intermediate',
      visible: true
    };
    const updated = [...languages, newItem];
    onChange(updated, meta);
  };

  const updateItem = (index: number, field: keyof LanguageItem, value: any) => {
    const updated = [...languages];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated, meta);
  };

  const removeItem = (index: number) => {
    const updated = [...languages];
    updated.splice(index, 1);
    onChange(updated, meta);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      {isEditingHeading ? (
        <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '10px', border: '1px solid var(--card-border)' }}>
          <SectionHeadingControl
            title={meta.title || 'Languages'}
            iconName={meta.icon || 'globe'}
            showIcon={meta.showIcon !== false}
            onSave={(newTitle, newIcon, newShowIcon) => {
              onChange(languages, {
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
            {languages.length} {languages.length === 1 ? 'Language' : 'Languages'}
          </span>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {languages.map((item, idx) => (
          <div
            key={item.id || idx}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.75rem 1rem',
              background: 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              borderRadius: '10px',
              gap: '0.75rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexGrow: 1 }}>
              <GripVertical size={16} style={{ color: 'var(--text-muted)', flexShrink: 0, cursor: 'grab' }} />
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', flexGrow: 1 }}>
                <input 
                  type="text" 
                  value={item.language} 
                  onChange={(e) => updateItem(idx, 'language', e.target.value)} 
                  placeholder="e.g. English"
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--card-border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                />
                <select
                  value={item.fluency}
                  onChange={(e) => updateItem(idx, 'fluency', e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--card-border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                >
                  {FLUENCY_LEVELS.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                  {!FLUENCY_LEVELS.includes(item.fluency) && item.fluency && (
                    <option value={item.fluency}>{item.fluency}</option>
                  )}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => updateItem(idx, 'visible', !item.visible)}
                style={{ background: 'none', border: 'none', color: item.visible ? '#10b981' : 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}
                title={item.visible ? 'Visible on CV' : 'Hidden'}
              >
                {item.visible ? <Eye size={15} /> : <EyeOff size={15} />}
              </button>

              <button
                type="button"
                onClick={() => removeItem(idx)}
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
        onClick={addLanguage}
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
        <span>Add Language</span>
      </button>
    </div>
  );
};
