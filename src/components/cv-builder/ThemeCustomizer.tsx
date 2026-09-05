import React from 'react';
import type { CVThemeSettings, TemplateId } from '../../types/cvBuilder';
import { Palette, Type, Layout, Check } from 'lucide-react';

interface ThemeCustomizerProps {
  theme: CVThemeSettings;
  onChange: (updated: CVThemeSettings) => void;
}

const COLOR_PALETTE = [
  { name: 'Royal Navy', hex: '#1e3a8a' },
  { name: 'Executive Slate', hex: '#334155' },
  { name: 'Forest Emerald', hex: '#065f46' },
  { name: 'Burgundy Wine', hex: '#881337' },
  { name: 'Tech Violet', hex: '#7c3aed' },
  { name: 'Amber Bronze', hex: '#d97706' },
  { name: 'Minimal Charcoal', hex: '#111827' }
];

const TEMPLATES: { id: TemplateId; name: string; desc: string; ats: string }[] = [
  { id: 'modern-timeline', name: 'Modern Timeline', desc: 'FlowCV signature style with date rail & photo header', ats: '98%' },
  { id: 'classic-ats', name: 'Classic ATS Clean', desc: 'Single column centered standard with 100% ATS score', ats: '100%' },
  { id: 'tech-linear', name: 'Tech Linear', desc: 'Monospace headers & tabular engineering alignment', ats: '99%' },
  { id: 'classic-serif', name: 'Classic Serif', desc: 'Executive Merriweather typography for leadership', ats: '100%' },
  { id: 'split-sidebar', name: 'Split Sidebar', desc: 'Two-column layout with colored sidebar details', ats: '95%' },
  { id: 'compact-grid', name: 'Compact 1-Pager', desc: 'High-density format designed to fit into 1 page', ats: '99%' }
];

const FONTS: ('Plus Jakarta Sans' | 'Inter' | 'Merriweather' | 'Roboto' | 'JetBrains Mono')[] = [
  'Plus Jakarta Sans',
  'Inter',
  'Merriweather',
  'Roboto',
  'JetBrains Mono'
];

export const ThemeCustomizer: React.FC<ThemeCustomizerProps> = ({ theme, onChange }) => {
  const update = (field: keyof CVThemeSettings, value: any) => {
    onChange({ ...theme, [field]: value });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 1. Template Picker */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
          <Layout size={16} style={{ color: 'var(--accent-primary)' }} />
          <span>Resume Template</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
          {TEMPLATES.map((tmpl) => {
            const isSelected = (theme.templateId || 'modern-timeline') === tmpl.id;

            return (
              <div
                key={tmpl.id}
                onClick={() => update('templateId', tmpl.id)}
                style={{
                  padding: '0.85rem',
                  borderRadius: '12px',
                  border: isSelected ? '2px solid var(--accent-primary)' : '1px solid var(--card-border)',
                  background: isSelected ? 'rgba(124, 58, 237, 0.08)' : 'var(--bg-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.85rem', color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                    {tmpl.name}
                  </span>
                  {isSelected && <Check size={14} style={{ color: 'var(--accent-primary)' }} />}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.3, marginBottom: '0.35rem' }}>
                  {tmpl.desc}
                </div>
                <span style={{ fontSize: '10px', background: 'rgba(16,185,129,0.12)', color: '#10b981', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                  ATS: {tmpl.ats}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Accent Color Palette */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
          <Palette size={16} style={{ color: 'var(--accent-primary)' }} />
          <span>Accent Color</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {COLOR_PALETTE.map((c) => {
            const isSelected = theme.accentColor === c.hex;

            return (
              <button
                key={c.hex}
                type="button"
                onClick={() => update('accentColor', c.hex)}
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: c.hex,
                  border: isSelected ? '3px solid #ffffff' : '2px solid transparent',
                  boxShadow: isSelected ? '0 0 0 2px var(--accent-primary)' : '0 2px 4px rgba(0,0,0,0.15)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff'
                }}
                title={c.name}
              >
                {isSelected && <Check size={16} />}
              </button>
            );
          })}

          {/* Custom Hex */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginLeft: '0.5rem' }}>
            <input 
              type="color" 
              value={theme.accentColor || '#1e3a8a'} 
              onChange={(e) => update('accentColor', e.target.value)}
              style={{ width: '32px', height: '32px', padding: 0, border: 'none', borderRadius: '6px', cursor: 'pointer', background: 'none' }}
              title="Custom Hex Picker"
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
              {theme.accentColor}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Typography & Font Family */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
          <Type size={16} style={{ color: 'var(--accent-primary)' }} />
          <span>Typography</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem' }}>
          {FONTS.map((font) => {
            const isSelected = (theme.fontFamily || 'Plus Jakarta Sans') === font;

            return (
              <button
                key={font}
                type="button"
                onClick={() => update('fontFamily', font)}
                style={{
                  padding: '0.5rem',
                  borderRadius: '8px',
                  border: isSelected ? '1.5px solid var(--accent-primary)' : '1px solid var(--card-border)',
                  background: isSelected ? 'rgba(124, 58, 237, 0.08)' : 'var(--bg-secondary)',
                  color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)',
                  fontSize: '0.8rem',
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  fontFamily: `'${font}', sans-serif`
                }}
              >
                {font}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Layout Density & Margins */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="responsive-fields">
        <div className="form-group" style={{ margin: 0 }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Font Size Scaling</label>
          <select 
            value={theme.fontSize || 'standard'} 
            onChange={(e) => update('fontSize', e.target.value)}
            style={{ fontSize: '0.82rem' }}
          >
            <option value="compact">Compact (9pt - 1 Page fit)</option>
            <option value="standard">Standard (10.5pt - Balanced)</option>
            <option value="spacious">Spacious (12pt - Executive)</option>
          </select>
        </div>

        <div className="form-group" style={{ margin: 0 }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Page Margins</label>
          <select 
            value={theme.pageMargin || 'standard'} 
            onChange={(e) => update('pageMargin', e.target.value)}
            style={{ fontSize: '0.82rem' }}
          >
            <option value="compact">Compact Margins (12mm)</option>
            <option value="standard">Standard Margins (18mm)</option>
            <option value="spacious">Spacious Margins (24mm)</option>
          </select>
        </div>
      </div>
    </div>
  );
};
