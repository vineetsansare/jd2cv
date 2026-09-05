import React, { useState } from 'react';
import type { SkillCategoryItem, SectionMeta } from '../../../types/cvBuilder';
import { SectionHeadingControl } from '../SectionHeadingControl';
import { 
  Plus, 
  Trash2, 
  X, 
  Eye, 
  EyeOff, 
  GripVertical, 
  Edit3, 
  Check, 
  ArrowLeft 
} from 'lucide-react';

interface SkillsSectionProps {
  meta?: SectionMeta;
  skills: SkillCategoryItem[];
  onChange: (updatedSkills: SkillCategoryItem[], updatedMeta?: SectionMeta) => void;
}

export const SkillsSection: React.FC<SkillsSectionProps> = ({ 
  meta = { title: 'Technical Skills & Competencies', icon: 'cpu', showIcon: true },
  skills, 
  onChange 
}) => {
  const [isEditingHeading, setIsEditingHeading] = useState(false);
  const [editingCategoryIndex, setEditingCategoryIndex] = useState<number | null>(null);
  const [newSkillInput, setNewSkillInput] = useState('');

  const addCategory = () => {
    const newCat: SkillCategoryItem = {
      id: `skill-${Date.now()}`,
      categoryName: 'Core Competencies',
      skills: [],
      visible: true
    };
    const updated = [...skills, newCat];
    onChange(updated, meta);
    setEditingCategoryIndex(skills.length);
  };

  const updateCategoryName = (index: number, name: string) => {
    const updated = [...skills];
    updated[index].categoryName = name;
    onChange(updated, meta);
  };

  const removeCategory = (index: number) => {
    const updated = [...skills];
    updated.splice(index, 1);
    onChange(updated, meta);
    if (editingCategoryIndex === index) {
      setEditingCategoryIndex(null);
    }
  };

  const toggleVisibility = (index: number) => {
    const updated = [...skills];
    updated[index].visible = !updated[index].visible;
    onChange(updated, meta);
  };

  const addSkillToCategory = (catIndex: number) => {
    const input = newSkillInput.trim();
    if (!input) return;

    const newSkills = input.includes(',') 
      ? input.split(',').map(s => s.trim()).filter(Boolean)
      : [input];

    const updated = [...skills];
    updated[catIndex].skills = [...updated[catIndex].skills, ...newSkills];
    onChange(updated, meta);
    setNewSkillInput('');
  };

  const removeSkillFromCategory = (catIndex: number, skillIndex: number) => {
    const updated = [...skills];
    const catSkills = [...updated[catIndex].skills];
    catSkills.splice(skillIndex, 1);
    updated[catIndex].skills = catSkills;
    onChange(updated, meta);
  };

  // Focused "Edit Entry" mode for a skill category
  if (editingCategoryIndex !== null && skills[editingCategoryIndex]) {
    const currentCat = skills[editingCategoryIndex];

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
              onClick={() => setEditingCategoryIndex(null)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.2rem' }}
            >
              <ArrowLeft size={18} />
            </button>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Edit Skill Group</h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => toggleVisibility(editingCategoryIndex)}
              style={{ background: 'none', border: 'none', color: currentCat.visible ? '#10b981' : 'var(--text-muted)', cursor: 'pointer', padding: '0.3rem' }}
            >
              {currentCat.visible ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
            <button
              type="button"
              onClick={() => removeCategory(editingCategoryIndex)}
              style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.3rem' }}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        <div className="form-group" style={{ margin: 0 }}>
          <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>Category Name *</label>
          <input 
            type="text" 
            value={currentCat.categoryName} 
            onChange={(e) => updateCategoryName(editingCategoryIndex, e.target.value)} 
            placeholder="e.g. Leadership & Architecture or Tech Stack" 
          />
        </div>

        {/* Skill Pills */}
        <div>
          <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
            Skills in this category ({currentCat.skills.length})
          </label>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
            {currentCat.skills.map((skill, sIdx) => (
              <span
                key={sIdx}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--card-border)',
                  padding: '4px 10px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  color: 'var(--text-primary)'
                }}
              >
                <span>{skill}</span>
                <button
                  type="button"
                  onClick={() => removeSkillFromCategory(editingCategoryIndex, sIdx)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, display: 'flex' }}
                >
                  <X size={13} />
                </button>
              </span>
            ))}
          </div>

          {/* Quick Add Input */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              placeholder="Type skill & press Enter or Add (e.g. React, TypeScript, Docker)"
              value={newSkillInput}
              onChange={(e) => setNewSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addSkillToCategory(editingCategoryIndex);
                }
              }}
              style={{ fontSize: '0.85rem', flexGrow: 1 }}
            />
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => addSkillToCategory(editingCategoryIndex)}
              style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
            >
              Add
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setEditingCategoryIndex(null)}
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

  // Section List View
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      {isEditingHeading ? (
        <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '10px', border: '1px solid var(--card-border)' }}>
          <SectionHeadingControl
            title={meta.title || 'Technical Skills & Competencies'}
            iconName={meta.icon || 'cpu'}
            showIcon={meta.showIcon !== false}
            onSave={(newTitle, newIcon, newShowIcon) => {
              onChange(skills, {
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
            {skills.length} Categories
          </span>
        </div>
      )}

      {/* Category Rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {skills.map((cat, idx) => (
          <div
            key={cat.id || idx}
            onClick={() => setEditingCategoryIndex(idx)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.85rem 1rem',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--card-border)',
              borderRadius: '10px',
              cursor: 'pointer',
              gap: '0.75rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0, flexGrow: 1 }}>
              <GripVertical size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                  {cat.categoryName}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                  ({cat.skills.length} skills)
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleVisibility(idx);
                }}
                style={{ background: 'none', border: 'none', color: cat.visible ? '#10b981' : 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}
              >
                {cat.visible ? <Eye size={15} /> : <EyeOff size={15} />}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeCategory(idx);
                }}
                style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.25rem' }}
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addCategory}
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
        <span>Add Category</span>
      </button>
    </div>
  );
};
