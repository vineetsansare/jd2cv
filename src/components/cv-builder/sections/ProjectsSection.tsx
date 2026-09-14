import React, { useState } from 'react';
import type { ProjectItem, SectionMeta } from '../../../types/cvBuilder';
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

interface ProjectsSectionProps {
  meta?: SectionMeta;
  projects: ProjectItem[];
  onChange: (updatedProjects: ProjectItem[], updatedMeta?: SectionMeta) => void;
}

export const ProjectsSection: React.FC<ProjectsSectionProps> = ({ 
  meta = { title: 'Projects', icon: 'folder', showIcon: true },
  projects, 
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
      visible: true,
      alignment: 'justify'
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

  const addBullet = (index: number) => {
    const updated = [...projects];
    updated[index].bullets = [...(updated[index].bullets || []), ''];
    onChange(updated, meta);
  };

  const updateBullet = (index: number, bulletIndex: number, text: string) => {
    const updated = [...projects];
    const bullets = [...updated[index].bullets];
    bullets[bulletIndex] = text;
    updated[index].bullets = bullets;
    onChange(updated, meta);
  };

  const removeBullet = (index: number, bulletIndex: number) => {
    const updated = [...projects];
    const bullets = [...updated[index].bullets];
    bullets.splice(bulletIndex, 1);
    updated[index].bullets = bullets;
    onChange(updated, meta);
  };

  if (editingEntryIndex !== null && projects[editingEntryIndex]) {
    const currentProj = projects[editingEntryIndex];

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
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Edit Project</h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => updateItem(editingEntryIndex, 'visible', !currentProj.visible)}
              style={{ background: 'none', border: 'none', color: currentProj.visible ? '#10b981' : 'var(--text-muted)', cursor: 'pointer', padding: '0.3rem' }}
              title={currentProj.visible ? 'Visible on CV' : 'Hidden from CV'}
            >
              {currentProj.visible ? <Eye size={16} /> : <EyeOff size={16} />}
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
            <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>Project Title *</label>
            <input 
              type="text" 
              value={currentProj.title} 
              onChange={(e) => updateItem(editingEntryIndex, 'title', e.target.value)} 
              placeholder="e.g. E-Commerce Platform" 
            />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>Subtitle / Role</label>
            <input 
              type="text" 
              value={currentProj.subtitle || ''} 
              onChange={(e) => updateItem(editingEntryIndex, 'subtitle', e.target.value)} 
              placeholder="e.g. Lead Developer / Academic Project" 
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }} className="responsive-fields">
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>Project URL</label>
            <input 
              type="text" 
              value={currentProj.url || ''} 
              onChange={(e) => updateItem(editingEntryIndex, 'url', e.target.value)} 
              placeholder="e.g. https://myproject.com" 
            />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>GitHub / Source URL</label>
            <input 
              type="text" 
              value={currentProj.githubUrl || ''} 
              onChange={(e) => updateItem(editingEntryIndex, 'githubUrl', e.target.value)} 
              placeholder="e.g. https://github.com/user/repo" 
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }} className="responsive-fields">
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>Start Date</label>
            <input 
              type="text" 
              value={currentProj.startDate || ''} 
              onChange={(e) => updateItem(editingEntryIndex, 'startDate', e.target.value)} 
              placeholder="e.g. Jan 2023" 
            />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>End Date</label>
            <input 
              type="text" 
              value={currentProj.endDate || ''} 
              onChange={(e) => updateItem(editingEntryIndex, 'endDate', e.target.value)} 
              placeholder="e.g. Present" 
            />
          </div>
        </div>

        <div className="form-group" style={{ margin: 0 }}>
          <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>Technologies (comma-separated)</label>
          <input 
            type="text" 
            value={(currentProj.technologies || []).join(', ')} 
            onChange={(e) => {
              const tech = e.target.value.split(',').map(t => t.trim()).filter(t => t !== '');
              updateItem(editingEntryIndex, 'technologies', tech);
            }} 
            placeholder="e.g. React, Node.js, MongoDB" 
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, margin: 0 }}>
              Project Details & Achievements
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
            {currentProj.bullets.map((bullet, bIdx) => (
              <div key={bIdx} style={{ display: 'flex', flexDirection: 'column', borderRadius: '8px', border: '1px solid var(--card-border)', overflow: 'hidden' }}>
                <RichTextToolbar
                  textareaId={`proj-bullet-${editingEntryIndex}-${bIdx}`}
                  value={bullet}
                  onChange={(newText) => updateBullet(editingEntryIndex, bIdx, newText)}
                  alignment={currentProj.alignment || 'justify'}
                  onAlignmentChange={(align) => updateItem(editingEntryIndex, 'alignment', align)}
                />
                <div style={{ display: 'flex', alignItems: 'flex-start', background: 'var(--card-bg)' }}>
                  <textarea
                    id={`proj-bullet-${editingEntryIndex}-${bIdx}`}
                    rows={3}
                    value={bullet}
                    onChange={(e) => updateBullet(editingEntryIndex, bIdx, e.target.value)}
                    placeholder="e.g. Architected the backend using Node.js..."
                    style={{
                      flexGrow: 1,
                      border: 'none',
                      padding: '0.65rem 0.85rem',
                      fontSize: '0.82rem',
                      lineHeight: 1.5,
                      background: 'transparent',
                      textAlign: currentProj.alignment || 'justify',
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
            title={meta.title || 'Projects'}
            iconName={meta.icon || 'folder'}
            showIcon={meta.showIcon !== false}
            onSave={(newTitle, newIcon, newShowIcon) => {
              onChange(projects, {
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
            {projects.length} {projects.length === 1 ? 'Project' : 'Projects'}
          </span>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {projects.map((item, idx) => (
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
                  {item.title || 'Untitled Project'}
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
        onClick={addProject}
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
        <span>Add Project</span>
      </button>
    </div>
  );
};
