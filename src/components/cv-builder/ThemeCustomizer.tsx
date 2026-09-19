import React from 'react';
import type { CVThemeSettings, SectionHeadingStyle } from '../../types/cvBuilder';
import { TemplateRegistry } from './templates/registry/TemplateRegistry';
import './templates/registry/initTemplates';
import { Palette, Type, Layout, Check, AlignLeft, AlignCenter, User, Sparkles, Layers } from 'lucide-react';

interface ThemeCustomizerProps {
  theme: CVThemeSettings;
  onChange: (updated: CVThemeSettings) => void;
}

const COLOR_PALETTES = [
  { name: 'Sapphire Blue', hex: '#2563eb' },
  { name: 'Executive Slate', hex: '#334155' },
  { name: 'Minimal Charcoal', hex: '#0f172a' },
  { name: 'Emerald Teal', hex: '#059669' },
  { name: 'Executive Violet', hex: '#7c3aed' },
  { name: 'Burgundy Wine', hex: '#991b1b' },
  { name: 'Warm Amber', hex: '#d97706' }
];

const FONTS: { id: string; name: string; type: string }[] = [
  { id: 'Plus Jakarta Sans', name: 'Plus Jakarta Sans', type: 'Modern Sans' },
  { id: 'Inter', name: 'Inter', type: 'Clean Geometric' },
  { id: 'Merriweather', name: 'Merriweather', type: 'Executive Serif' },
  { id: 'Roboto', name: 'Roboto', type: 'Neutral Corporate' },
  { id: 'JetBrains Mono', name: 'JetBrains Mono', type: 'Technical Monospace' }
];

const HEADING_STYLES: { id: SectionHeadingStyle; label: string; desc: string }[] = [
  { id: 'underline', label: 'Underline', desc: 'Bottom accent divider' },
  { id: 'border-left', label: 'Left Bar', desc: 'Left vertical stripe' },
  { id: 'banner', label: 'Banner', desc: 'Tinted background block' },
  { id: 'centered', label: 'Centered', desc: 'Centered with side lines' },
  { id: 'minimal', label: 'Minimal', desc: 'Pure typography weight' }
];

export const ThemeCustomizer: React.FC<ThemeCustomizerProps> = ({ theme, onChange }) => {
  const templates = TemplateRegistry.getAllTemplates();

  const update = (field: keyof CVThemeSettings, value: any) => {
    onChange({ ...theme, [field]: value });
  };

  const currentTemplateId = theme.templateId || 'classic-ats';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 1. Template Picker */}
      <div className="glass-card" style={{ padding: '1.25rem', borderRadius: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
            <Layout size={17} style={{ color: 'var(--accent-primary)' }} />
            <span>Select Resume Layout</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>4 Optimized Archetypes</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.85rem' }}>
          {templates.map((tmpl) => {
            const isSelected = currentTemplateId === tmpl.id;

            return (
              <div
                key={tmpl.id}
                onClick={() => update('templateId', tmpl.id)}
                style={{
                  padding: '0.95rem',
                  borderRadius: '12px',
                  border: isSelected ? '2px solid var(--accent-primary)' : '1px solid var(--card-border)',
                  background: isSelected ? 'rgba(37, 99, 235, 0.08)' : 'var(--bg-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                    {tmpl.name}
                  </span>
                  {isSelected && <Check size={16} style={{ color: 'var(--accent-primary)' }} />}
                </div>

                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.35, marginBottom: '0.65rem' }}>
                  {tmpl.description}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <span 
                    style={{
                      fontSize: '0.72rem',
                      background: tmpl.atsScoreRating === 100 ? 'rgba(16,185,129,0.15)' : 'rgba(37,99,235,0.12)',
                      color: tmpl.atsScoreRating === 100 ? '#10b981' : 'var(--accent-primary)',
                      padding: '2px 7px',
                      borderRadius: '4px',
                      fontWeight: 700
                    }}
                  >
                    ATS {tmpl.atsScoreRating}%
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {tmpl.category}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Typography & Fonts */}
      <div className="glass-card" style={{ padding: '1.25rem', borderRadius: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
          <Type size={17} style={{ color: 'var(--accent-primary)' }} />
          <span>Typography & Font Family</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem', marginBottom: '1rem' }}>
          {FONTS.map((f) => {
            const isSelected = (theme.fontFamily || 'Plus Jakarta Sans') === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => update('fontFamily', f.id)}
                style={{
                  padding: '0.6rem 0.75rem',
                  borderRadius: '8px',
                  border: isSelected ? '1.5px solid var(--accent-primary)' : '1px solid var(--card-border)',
                  background: isSelected ? 'rgba(37, 99, 235, 0.08)' : 'var(--bg-secondary)',
                  color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '0.82rem', fontFamily: `'${f.id}', sans-serif` }}>{f.name}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{f.type}</div>
              </button>
            );
          })}
        </div>

        {/* Font Scale Stepper (Compact vs Standard vs Spacious) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Content Density (Base Font):</span>
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            {(['compact', 'standard', 'spacious'] as const).map((density) => {
              const isSelected = (theme.fontSize || 'standard') === density;
              return (
                <button
                  key={density}
                  type="button"
                  onClick={() => update('fontSize', density)}
                  style={{
                    padding: '0.35rem 0.65rem',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    textTransform: 'capitalize',
                    borderRadius: '6px',
                    border: 'none',
                    background: isSelected ? 'var(--accent-primary)' : 'transparent',
                    color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  {density}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Section Heading Styles */}
      <div className="glass-card" style={{ padding: '1.25rem', borderRadius: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
          <Sparkles size={17} style={{ color: 'var(--accent-primary)' }} />
          <span>Section Heading Style</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.5rem' }}>
          {HEADING_STYLES.map((st) => {
            const isSelected = (theme.sectionHeadingStyle || 'underline') === st.id;
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => update('sectionHeadingStyle', st.id)}
                style={{
                  padding: '0.55rem 0.65rem',
                  borderRadius: '8px',
                  border: isSelected ? '1.5px solid var(--accent-primary)' : '1px solid var(--card-border)',
                  background: isSelected ? 'rgba(37, 99, 235, 0.08)' : 'var(--bg-secondary)',
                  color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{st.label}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{st.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Spacing, Line Height & Margins */}
      <div className="glass-card" style={{ padding: '1.25rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
          <Layers size={17} style={{ color: 'var(--accent-primary)' }} />
          <span>Spacing & Page Layout</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
          {/* Line Height */}
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 600 }}>
              Line Spacing:
            </div>
            <div style={{ display: 'flex', background: 'var(--bg-secondary)', padding: '0.2rem', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
              {(['tight', 'normal', 'relaxed'] as const).map((lh) => {
                const isSelected = (theme.lineHeight || 'normal') === lh;
                return (
                  <button
                    key={lh}
                    type="button"
                    onClick={() => update('lineHeight', lh)}
                    style={{
                      flex: 1,
                      padding: '0.35rem',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      textTransform: 'capitalize',
                      border: 'none',
                      borderRadius: '6px',
                      background: isSelected ? 'var(--accent-primary)' : 'transparent',
                      color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                      cursor: 'pointer'
                    }}
                  >
                    {lh}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Page Margins */}
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 600 }}>
              Page Margins:
            </div>
            <div style={{ display: 'flex', background: 'var(--bg-secondary)', padding: '0.2rem', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
              {(['compact', 'standard', 'spacious'] as const).map((pm) => {
                const isSelected = (theme.pageMargin || 'standard') === pm;
                return (
                  <button
                    key={pm}
                    type="button"
                    onClick={() => update('pageMargin', pm)}
                    style={{
                      flex: 1,
                      padding: '0.35rem',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      textTransform: 'capitalize',
                      border: 'none',
                      borderRadius: '6px',
                      background: isSelected ? 'var(--accent-primary)' : 'transparent',
                      color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                      cursor: 'pointer'
                    }}
                  >
                    {pm}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Header & Photo Alignment */}
      <div className="glass-card" style={{ padding: '1.25rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
          <User size={17} style={{ color: 'var(--accent-primary)' }} />
          <span>Header & Photo Arrangement</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
          {/* Header Text Alignment */}
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 600 }}>
              Header Alignment:
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => update('headerAlignment', 'left')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem',
                  padding: '0.5rem',
                  borderRadius: '8px',
                  border: (theme.headerAlignment || 'left') === 'left' ? '1.5px solid var(--accent-primary)' : '1px solid var(--card-border)',
                  background: (theme.headerAlignment || 'left') === 'left' ? 'rgba(37, 99, 235, 0.08)' : 'var(--bg-secondary)',
                  color: (theme.headerAlignment || 'left') === 'left' ? 'var(--accent-primary)' : 'var(--text-primary)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <AlignLeft size={14} /> Left
              </button>
              <button
                type="button"
                onClick={() => update('headerAlignment', 'center')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem',
                  padding: '0.5rem',
                  borderRadius: '8px',
                  border: theme.headerAlignment === 'center' ? '1.5px solid var(--accent-primary)' : '1px solid var(--card-border)',
                  background: theme.headerAlignment === 'center' ? 'rgba(37, 99, 235, 0.08)' : 'var(--bg-secondary)',
                  color: theme.headerAlignment === 'center' ? 'var(--accent-primary)' : 'var(--text-primary)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <AlignCenter size={14} /> Center
              </button>
            </div>
          </div>

          {/* Photo Shape */}
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 600 }}>
              Candidate Photo Shape:
            </div>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {(['circle', 'rounded', 'square'] as const).map((shape) => {
                const isSelected = (theme.photoShape || 'circle') === shape;
                return (
                  <button
                    key={shape}
                    type="button"
                    onClick={() => update('photoShape', shape)}
                    style={{
                      flex: 1,
                      padding: '0.5rem 0.2rem',
                      borderRadius: '8px',
                      border: isSelected ? '1.5px solid var(--accent-primary)' : '1px solid var(--card-border)',
                      background: isSelected ? 'rgba(37, 99, 235, 0.08)' : 'var(--bg-secondary)',
                      color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      textTransform: 'capitalize',
                      cursor: 'pointer'
                    }}
                  >
                    {shape}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 6. Accent Color Engine */}
      <div className="glass-card" style={{ padding: '1.25rem', borderRadius: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
            <Palette size={17} style={{ color: 'var(--accent-primary)' }} />
            <span>Accent Theme Color</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Custom:</span>
            <input
              type="color"
              value={theme.accentColor || '#2563eb'}
              onChange={(e) => update('accentColor', e.target.value)}
              style={{
                width: '28px',
                height: '28px',
                padding: 0,
                border: 'none',
                borderRadius: '50%',
                cursor: 'pointer',
                background: 'transparent'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {COLOR_PALETTES.map((c) => {
            const isSelected = theme.accentColor === c.hex;

            return (
              <button
                key={c.hex}
                type="button"
                onClick={() => update('accentColor', c.hex)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: c.hex,
                  border: isSelected ? '3px solid #ffffff' : '2px solid transparent',
                  boxShadow: isSelected ? `0 0 0 2px ${c.hex}` : 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  transition: 'transform 0.15s'
                }}
                title={c.name}
              >
                {isSelected && <Check size={16} />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
