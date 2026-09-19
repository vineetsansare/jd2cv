import React, { useState } from 'react';
import type { CertificationItem } from '../../../types/cvBuilder';
import { 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff, 
  Edit3, 
  Check, 
  ArrowLeft
} from 'lucide-react';

interface CertificationsSectionProps {
  certifications: CertificationItem[];
  onChange: (updatedCertifications: CertificationItem[]) => void;
}

export const CertificationsSection: React.FC<CertificationsSectionProps> = ({
  certifications = [],
  onChange
}) => {
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
    onChange(updated);
    setEditingEntryIndex(0);
  };

  const updateItem = (index: number, field: keyof CertificationItem, value: any) => {
    const updated = [...certifications];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const removeItem = (index: number) => {
    const updated = [...certifications];
    updated.splice(index, 1);
    onChange(updated);
    if (editingEntryIndex === index) {
      setEditingEntryIndex(null);
    }
  };

  if (editingEntryIndex !== null && certifications[editingEntryIndex]) {
    const current = certifications[editingEntryIndex];

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
              title="Delete certification"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="responsive-fields">
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Certification Name *</label>
            <input 
              type="text" 
              value={current.name} 
              onChange={(e) => updateItem(editingEntryIndex, 'name', e.target.value)} 
              placeholder="e.g. AWS Certified Solutions Architect" 
            />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Issuing Organization</label>
            <input 
              type="text" 
              value={current.issuer} 
              onChange={(e) => updateItem(editingEntryIndex, 'issuer', e.target.value)} 
              placeholder="e.g. Amazon Web Services" 
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="responsive-fields">
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Date Earned</label>
            <input 
              type="text" 
              value={current.date} 
              onChange={(e) => updateItem(editingEntryIndex, 'date', e.target.value)} 
              placeholder="e.g. 2023" 
            />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Verification URL</label>
            <input 
              type="text" 
              value={current.url || ''} 
              onChange={(e) => updateItem(editingEntryIndex, 'url', e.target.value)} 
              placeholder="e.g. https://aws.amazon.com/verification" 
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
      {/* Entry Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {certifications.map((cert, idx) => (
          <div 
            key={cert.id || idx}
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
              <div style={{ fontWeight: 600, fontSize: '0.88rem', color: cert.visible ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                {cert.name || 'Untitled Certification'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {cert.issuer} {cert.date && `(${cert.date})`}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <button
                type="button"
                onClick={() => updateItem(idx, 'visible', !cert.visible)}
                style={{ background: 'none', border: 'none', color: cert.visible ? '#10b981' : 'var(--text-muted)', cursor: 'pointer', padding: '0.2rem' }}
                title={cert.visible ? 'Visible' : 'Hidden'}
              >
                {cert.visible ? <Eye size={15} /> : <EyeOff size={15} />}
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
        onClick={addCertification}
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
        <span>Add Certification</span>
      </button>
    </div>
  );
};
