import React, { useState } from 'react';
import type { CertificationItem, SectionMeta } from '../../../types/cvBuilder';
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

interface CertificationsSectionProps {
  meta?: SectionMeta;
  certifications: CertificationItem[];
  onChange: (updated: CertificationItem[], updatedMeta?: SectionMeta) => void;
}

export const CertificationsSection: React.FC<CertificationsSectionProps> = ({ 
  meta = { title: 'Certifications', icon: 'award', showIcon: true },
  certifications, 
  onChange 
}) => {
  const [isEditingHeading, setIsEditingHeading] = useState(false);
  const [editingEntryIndex, setEditingEntryIndex] = useState<number | null>(null);

  const addCertification = () => {
    const newItem: CertificationItem = {
      id: `cert-${Date.now()}`,
      name: '',
      issuer: '',
      date: '',
      url: '',
      visible: true
    };
    const updated = [newItem, ...certifications];
    onChange(updated, meta);
    setEditingEntryIndex(0);
  };

  const updateItem = (index: number, field: keyof CertificationItem, value: any) => {
    const updated = [...certifications];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated, meta);
  };

  const removeItem = (index: number) => {
    const updated = [...certifications];
    updated.splice(index, 1);
    onChange(updated, meta);
    if (editingEntryIndex === index) {
      setEditingEntryIndex(null);
    }
  };

  if (editingEntryIndex !== null && certifications[editingEntryIndex]) {
    const currentCert = certifications[editingEntryIndex];

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
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Edit Certification</h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => updateItem(editingEntryIndex, 'visible', !currentCert.visible)}
              style={{ background: 'none', border: 'none', color: currentCert.visible ? '#10b981' : 'var(--text-muted)', cursor: 'pointer', padding: '0.3rem' }}
              title={currentCert.visible ? 'Visible on CV' : 'Hidden from CV'}
            >
              {currentCert.visible ? <Eye size={16} /> : <EyeOff size={16} />}
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
            <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>Certification Name *</label>
            <input 
              type="text" 
              value={currentCert.name} 
              onChange={(e) => updateItem(editingEntryIndex, 'name', e.target.value)} 
              placeholder="e.g. AWS Certified Solutions Architect" 
            />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>Issuer Organization *</label>
            <input 
              type="text" 
              value={currentCert.issuer} 
              onChange={(e) => updateItem(editingEntryIndex, 'issuer', e.target.value)} 
              placeholder="e.g. Amazon Web Services" 
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }} className="responsive-fields">
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>Date</label>
            <input 
              type="text" 
              value={currentCert.date} 
              onChange={(e) => updateItem(editingEntryIndex, 'date', e.target.value)} 
              placeholder="e.g. 2023" 
            />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>URL / Credential Link</label>
            <input 
              type="text" 
              value={currentCert.url || ''} 
              onChange={(e) => updateItem(editingEntryIndex, 'url', e.target.value)} 
              placeholder="e.g. https://credly.com/badge" 
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
            title={meta.title || 'Certifications'}
            iconName={meta.icon || 'award'}
            showIcon={meta.showIcon !== false}
            onSave={(newTitle, newIcon, newShowIcon) => {
              onChange(certifications, {
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
            {certifications.length} {certifications.length === 1 ? 'Certification' : 'Certifications'}
          </span>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {certifications.map((item, idx) => (
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
                  {item.name || 'Untitled Certification'}
                </span>
                {item.issuer && (
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    , {item.issuer}
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
        onClick={addCertification}
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
        <span>Add Certification</span>
      </button>
    </div>
  );
};
