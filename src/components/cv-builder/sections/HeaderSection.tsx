import React from 'react';
import type { ResumeBasics } from '../../../types/cvBuilder';
import { Camera, Eye, EyeOff, Plus, Trash2, Mail, Phone, MapPin, Globe } from 'lucide-react';

interface HeaderSectionProps {
  basics: ResumeBasics;
  onChange: (updated: ResumeBasics) => void;
}

export const HeaderSection: React.FC<HeaderSectionProps> = ({ basics, onChange }) => {
  const updateField = (field: keyof ResumeBasics, value: any) => {
    onChange({ ...basics, [field]: value });
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        updateField('avatarUrl', reader.result);
        updateField('showAvatar', true);
      }
    };
    reader.readAsDataURL(file);
  };

  const addLink = () => {
    const newLink = { id: `link-${Date.now()}`, network: 'LinkedIn', username: '', url: '' };
    updateField('links', [...(basics.links || []), newLink]);
  };

  const updateLink = (index: number, key: string, value: string) => {
    const updated = [...(basics.links || [])];
    updated[index] = { ...updated[index], [key]: value };
    updateField('links', updated);
  };

  const removeLink = (index: number) => {
    const updated = [...(basics.links || [])];
    updated.splice(index, 1);
    updateField('links', updated);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Avatar Headshot & Basic Details */}
      <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
        <div style={{ position: 'relative' }}>
          {basics.avatarUrl ? (
            <img 
              src={basics.avatarUrl} 
              alt={basics.fullName}
              style={{
                width: '76px',
                height: '76px',
                borderRadius: basics.avatarShape === 'circle' ? '50%' : basics.avatarShape === 'rounded' ? '14px' : '4px',
                objectFit: 'cover',
                border: '2px solid var(--card-border)'
              }}
            />
          ) : (
            <div style={{
              width: '76px',
              height: '76px',
              borderRadius: '50%',
              background: 'var(--bg-secondary)',
              border: '2px dashed var(--card-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)'
            }}>
              <Camera size={26} />
            </div>
          )}

          <label 
            style={{
              position: 'absolute',
              bottom: '-4px',
              right: '-4px',
              background: 'var(--accent-primary)',
              color: '#fff',
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
            }}
            title="Upload photo"
          >
            <Camera size={13} />
            <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
          </label>
        </div>

        <div style={{ flexGrow: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Profile Photo</span>
            <button
              type="button"
              onClick={() => updateField('showAvatar', !basics.showAvatar)}
              style={{
                background: 'none',
                border: 'none',
                color: basics.showAvatar ? '#10b981' : 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.75rem',
                padding: 0
              }}
            >
              {basics.showAvatar ? <Eye size={14} /> : <EyeOff size={14} />}
              <span>{basics.showAvatar ? 'Visible on CV' : 'Hidden'}</span>
            </button>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {(['circle', 'rounded', 'square'] as const).map(shape => (
              <button
                key={shape}
                type="button"
                onClick={() => updateField('avatarShape', shape)}
                style={{
                  padding: '0.2rem 0.6rem',
                  borderRadius: '6px',
                  border: basics.avatarShape === shape ? '1px solid var(--accent-primary)' : '1px solid var(--card-border)',
                  background: basics.avatarShape === shape ? 'rgba(37,99,235,0.1)' : 'var(--bg-secondary)',
                  color: basics.avatarShape === shape ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  textTransform: 'capitalize'
                }}
              >
                {shape}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Name & Headline */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="responsive-fields">
        <div className="form-group" style={{ margin: 0 }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Full Name *</label>
          <input 
            type="text" 
            value={basics.fullName} 
            onChange={(e) => updateField('fullName', e.target.value)} 
            placeholder="e.g. Vineet Sansare" 
          />
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Professional Headline</label>
          <input 
            type="text" 
            value={basics.headline} 
            onChange={(e) => updateField('headline', e.target.value)} 
            placeholder="e.g. Engineering Manager & Solutions Architect" 
          />
        </div>
      </div>

      {/* Contact Details */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="responsive-fields">
        <div className="form-group" style={{ margin: 0 }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Mail size={13} style={{ color: 'var(--accent-primary)' }} />
            <span>Email Address</span>
          </label>
          <input 
            type="email" 
            value={basics.email} 
            onChange={(e) => updateField('email', e.target.value)} 
            placeholder="e.g. vineet@example.com" 
          />
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Phone size={13} style={{ color: 'var(--accent-primary)' }} />
            <span>Phone Number</span>
          </label>
          <input 
            type="text" 
            value={basics.phone} 
            onChange={(e) => updateField('phone', e.target.value)} 
            placeholder="e.g. +971-58-000-0000" 
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="responsive-fields">
        <div className="form-group" style={{ margin: 0 }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <MapPin size={13} style={{ color: 'var(--accent-primary)' }} />
            <span>Location</span>
          </label>
          <input 
            type="text" 
            value={basics.location} 
            onChange={(e) => updateField('location', e.target.value)} 
            placeholder="e.g. Dubai, UAE" 
          />
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Globe size={13} style={{ color: 'var(--accent-primary)' }} />
            <span>Website / Portfolio</span>
          </label>
          <input 
            type="text" 
            value={basics.website || ''} 
            onChange={(e) => updateField('website', e.target.value)} 
            placeholder="e.g. toolsby.vineetsansare.com" 
          />
        </div>
      </div>

      {/* Social / Profile Links */}
      <div style={{ marginTop: '0.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Social & Professional Links</span>
          <button
            type="button"
            onClick={addLink}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent-primary)',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
          >
            <Plus size={13} />
            <span>Add Link</span>
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {basics.links && basics.links.map((link, idx) => (
            <div key={link.id || idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <select
                value={link.network}
                onChange={(e) => updateLink(idx, 'network', e.target.value)}
                style={{ width: '120px', fontSize: '0.8rem' }}
              >
                <option value="LinkedIn">LinkedIn</option>
                <option value="GitHub">GitHub</option>
                <option value="Portfolio">Portfolio</option>
                <option value="Twitter">Twitter / X</option>
                <option value="Custom">Custom</option>
              </select>
              <input
                type="text"
                placeholder="Username or handle"
                value={link.username}
                onChange={(e) => updateLink(idx, 'username', e.target.value)}
                style={{ width: '130px', fontSize: '0.8rem' }}
              />
              <input
                type="text"
                placeholder="https://..."
                value={link.url}
                onChange={(e) => updateLink(idx, 'url', e.target.value)}
                style={{ flexGrow: 1, fontSize: '0.8rem' }}
              />
              <button
                type="button"
                onClick={() => removeLink(idx)}
                style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.25rem' }}
                title="Remove Link"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
