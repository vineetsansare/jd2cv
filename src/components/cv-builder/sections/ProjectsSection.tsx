import React, { useState } from 'react';
import type { ProjectItem, SectionMeta } from '../../../types/cvBuilder';
import { SectionHeadingControl } from '../SectionHeadingControl';
import { 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff, 
  Edit3, 
  Check, 
  ArrowLeft
} from 'lucide-react';

interface ProjectsSectionProps {
  meta?: SectionMeta;
  projects: ProjectItem[];
  onChange: (updatedProjects: ProjectItem[], updatedMeta?: SectionMeta) => void;
}

export const ProjectsSection: React.FC<ProjectsSectionProps> = ({
  meta = { title: 'Projects & Highlights', icon: 'code', showIcon: true },
  projects = [],
  onChange
}) => {
  const [isEditingHeading, setIsEditingHeading] = useState(false);
  const [editingEntryIndex, setEditingEntryIndex] = useState<number | null>(null);

  const addProject = () => {
    const newItem: ProjectItem = {
      id: `proj-${Date.now()}`,
      title: '',
      subtitle: '',
      url: '',
      githubUrl: '',
      startDate: '',
      endDate: '',
      bullets: [''],
      technologies: [],
      visible: true
    };
    const updated = [newItem, ...projects];
    onChange(updated, meta);
    setEditingEntryIndex(0);
  };

  const updateItem = (index: number, field: keyof ProjectItem, value: any) => {
    const updated = [...projects];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated, meta);
  };

  const removeItem = (index: number) => {
    const updated = [...projects];
    updated.splice(index, 1);
    onChange(updated, meta);
    if (editingEntryIndex === index) {
      setEditingEntryIndex(null);
    }
  };

  if (editingEntryIndex !== null && projects[editingEntryIndex]) {
    const current = projects[editingEntryIndex];

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
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Edit Project Entry</h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => updateItem(editingEntryIndex, 'visible', !current.visible)}
              style={{ background: 'none', border: 'none', color: current.visible ? '#10b981' : 'var(--text-muted)', cursor: 'pointer', padding: '0.3rem' }}
              title={current.visible ? 'Visible on CV' : 'Hidden'}
            >
              {current.visible ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
            <button
              type="button"
              onClick={() => removeItem(editingEntryIndex)}
              style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.3rem' }}
              title="Delete this project"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="responsive-fields">
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Project Title *</label>
            <input 
              type="text" 
              value={current.title} 
              onChange={(e) => updateItem(editingEntryIndex, 'title', e.target.value)} 
              placeholder="e.g. JD2CV - AI Resume Workspace" 
            />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Role / Subtitle</label>
            <input 
              type="text" 
              value={current.subtitle || ''} 
              onChange={(e) => updateItem(editingEntryIndex, 'subtitle', e.target.value)} 
              placeholder="e.g. Creator & Lead Architect" 
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="responsive-fields">
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Live URL</label>
            <input 
              type="text" 
              value={current.url || ''} 
              onChange={(e) => updateItem(editingEntryIndex, 'url', e.target.value)} 
              placeholder="e.g. https://myproject.com" 
            />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>GitHub / Repo URL</label>
            <input 
              type="text" 
              value={current.githubUrl || ''} 
              onChange={(e) => updateItem(editingEntryIndex, 'githubUrl', e.target.value)} 
              placeholder="e.g. https://github.com/user/project" 
            />
          </div>
        </div>

        <div className="form-group" style={{ margin: 0 }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Technologies (comma separated)</label>
          <input 
            type="text" 
            value={(current.technologies || []).join(', ')} 
            onChange={(e) => updateItem(editingEntryIndex, 'technologies', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} 
            placeholder="e.g. React, TypeScript, Gemini AI, Vite" 
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Bullet Points</label>
          {(current.bullets || []).map((bullet, bIdx) => (
            <div key={bIdx} style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
              <input 
                type="text" 
                value={bullet} 
                onChange={(e) => {
                  const updatedBullets = [...(current.bullets || [])];
                  updatedBullets[bIdx] = e.target.value;
                  updateItem(editingEntryIndex, 'bullets', updatedBullets);
                }}
                placeholder="Key feature or impact..."
                style={{ flexGrow: 1 }}
              />
              <button 
                type="button" 
                onClick={() => {
                  const updatedBullets = [...(current.bullets || [])];
                  updatedBullets.splice(bIdx, 1);
                  updateItem(editingEntryIndex, 'bullets', updatedBullets);
                }}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <button 
            type="button" 
            onClick={() => {
              updateItem(editingEntryIndex, 'bullets', [...(current.bullets || []), '']);
            }}
            style={{
              alignSelf: 'flex-start',
              background: 'none',
              border: '1px dashed var(--card-border)',
              borderRadius: '6px',
              padding: '0.25rem 0.6rem',
              fontSize: '0.78rem',
              color: 'var(--accent-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
          >
            <Plus size={13} />
            <span>Add Bullet Point</span>
          </button>
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
            title={meta?.title || 'Projects & Highlights'}
            iconName={meta?.icon || 'code'}
            showIcon={meta?.showIcon !== false}
            onSave={(newTitle, newIcon, newShowIcon) => {
              onChange(projects, { title: newTitle, icon: newIcon, showIcon: newShowIcon });
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
        </div>
      )}

      {/* Entry Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {projects.map((proj, idx) => (
          <div 
            key={proj.id || idx}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.75rem 1rem',
              background: 'var(--bg-secondary)',
              borderRadius: '8px',
              border: '1px solid var(--card-border)'
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.88rem', color: proj.visible ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                {proj.title || 'Untitled Project'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {proj.subtitle || (proj.technologies ? proj.technologies.slice(0, 3).join(', ') : '')}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <button
                type="button"
                onClick={() => updateItem(idx, 'visible', !proj.visible)}
                style={{ background: 'none', border: 'none', color: proj.visible ? '#10b981' : 'var(--text-muted)', cursor: 'pointer', padding: '0.2rem' }}
                title={proj.visible ? 'Visible' : 'Hidden'}
              >
                {proj.visible ? <Eye size={15} /> : <EyeOff size={15} />}
              </button>
              <button
                type="button"
                onClick={() => setEditingEntryIndex(idx)}
                style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', padding: '0.2rem' }}
                title="Edit entry"
              >
                <Edit3 size={15} />
              </button>
              <button
                type="button"
                onClick={() => removeItem(idx)}
                style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.2rem' }}
                title="Remove entry"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addProject}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.45rem',
          padding: '0.65rem 1rem',
          borderRadius: '8px',
          border: '1px dashed var(--accent-primary)',
          background: 'rgba(37, 99, 235, 0.05)',
          color: 'var(--accent-primary)',
          fontSize: '0.85rem',
          fontWeight: 600,
          cursor: 'pointer',
          marginTop: '0.35rem'
        }}
      >
        <Plus size={15} />
        <span>Add Project Entry</span>
      </button>
    </div>
  );
};
