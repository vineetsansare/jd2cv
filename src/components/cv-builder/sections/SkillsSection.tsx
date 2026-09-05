import React, { useState } from 'react';
import type { SkillCategoryItem } from '../../../types/cvBuilder';
import { Plus, Trash2, X, Eye, EyeOff } from 'lucide-react';

interface SkillsSectionProps {
  skills: SkillCategoryItem[];
  onChange: (updated: SkillCategoryItem[]) => void;
}

export const SkillsSection: React.FC<SkillsSectionProps> = ({ skills, onChange }) => {
  const [newSkillInputs, setNewSkillInputs] = useState<Record<string, string>>({});

  const addCategory = () => {
    const newCat: SkillCategoryItem = {
      id: `skill-${Date.now()}`,
      categoryName: 'Domain Expertise',
      skills: [],
      visible: true
    };
    onChange([...skills, newCat]);
  };

  const updateCategoryName = (index: number, name: string) => {
    const updated = [...skills];
    updated[index].categoryName = name;
    onChange(updated);
  };

  const removeCategory = (index: number) => {
    const updated = [...skills];
    updated.splice(index, 1);
    onChange(updated);
  };

  const toggleVisibility = (index: number) => {
    const updated = [...skills];
    updated[index].visible = !updated[index].visible;
    onChange(updated);
  };

  const addSkillToCategory = (catIndex: number) => {
    const catId = skills[catIndex].id;
    const input = (newSkillInputs[catId] || '').trim();
    if (!input) return;

    const newSkills = input.includes(',') 
      ? input.split(',').map(s => s.trim()).filter(Boolean)
      : [input];

    const updated = [...skills];
    updated[catIndex].skills = [...updated[catIndex].skills, ...newSkills];
    onChange(updated);

    setNewSkillInputs({ ...newSkillInputs, [catId]: '' });
  };

  const removeSkillFromCategory = (catIndex: number, skillIndex: number) => {
    const updated = [...skills];
    const catSkills = [...updated[catIndex].skills];
    catSkills.splice(skillIndex, 1);
    updated[catIndex].skills = catSkills;
    onChange(updated);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {skills.length} Skill Categories
        </span>
        <button
          type="button"
          onClick={addCategory}
          className="btn btn-primary"
          style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
        >
          <Plus size={14} />
          <span>Add Category</span>
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {skills.map((cat, catIdx) => (
          <div 
            key={cat.id || catIdx}
            style={{
              padding: '1rem',
              borderRadius: '12px',
              border: '1px solid var(--card-border)',
              background: 'var(--bg-secondary)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}
          >
            {/* Category Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
              <input
                type="text"
                value={cat.categoryName}
                onChange={(e) => updateCategoryName(catIdx, e.target.value)}
                placeholder="Category Name (e.g. Frontend Stack)"
                style={{ fontWeight: 700, fontSize: '0.9rem', flexGrow: 1 }}
              />

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <button
                  type="button"
                  onClick={() => toggleVisibility(catIdx)}
                  style={{ background: 'none', border: 'none', color: cat.visible ? '#10b981' : 'var(--text-muted)', cursor: 'pointer', padding: '0.2rem' }}
                >
                  {cat.visible ? <Eye size={15} /> : <EyeOff size={15} />}
                </button>
                <button
                  type="button"
                  onClick={() => removeCategory(catIdx)}
                  style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.2rem' }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>

            {/* Skill Tags */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {cat.skills.map((skill, sIdx) => (
                <span
                  key={sIdx}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    background: 'var(--card-bg)',
                    border: '1px solid var(--card-border)',
                    padding: '3px 8px',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    color: 'var(--text-primary)'
                  }}
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => removeSkillFromCategory(catIdx, sIdx)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, display: 'flex' }}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>

            {/* Add Skill Input */}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
              <input
                type="text"
                placeholder="Type skill & press Enter or Add (e.g. React, Docker)"
                value={newSkillInputs[cat.id] || ''}
                onChange={(e) => setNewSkillInputs({ ...newSkillInputs, [cat.id]: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSkillToCategory(catIdx);
                  }
                }}
                style={{ fontSize: '0.8rem', flexGrow: 1 }}
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => addSkillToCategory(catIdx)}
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
              >
                Add
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
