import React, { useState } from 'react';
import type { CVThemeSettings } from '../../types/cvBuilder';
import { TEMPLATE_REGISTRY } from './templates/templateRegistry';
import { ChevronDown, ChevronRight, Check, Palette, Type, Layout, Grid } from 'lucide-react';

interface DesignTabProps {
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
  { name: 'Minimal Charcoal', hex: '#111827' },
  { name: 'Ocean Blue', hex: '#2563eb' },
  { name: 'Rose', hex: '#e11d48' },
  { name: 'Teal', hex: '#0d9488' }
];

const FONTS = [
  'Plus Jakarta Sans',
  'Inter',
  'Merriweather',
  'Roboto',
  'JetBrains Mono',
  'Georgia',
  'Lora'
];

export const DesignTab: React.FC<DesignTabProps> = ({ theme, onChange }) => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    templates: true,
    colors: true,
    typography: true,
    layout: true
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const update = (field: keyof CVThemeSettings, value: any) => {
    onChange({ ...theme, [field]: value });
  };

  const SectionHeader = ({ id, title, icon: Icon }: { id: string, title: string, icon: any }) => (
    <div 
      onClick={() => toggleSection(id)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: 'pointer',
        padding: '0.75rem 0',
        userSelect: 'none'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
        <Icon size={16} style={{ color: 'var(--accent-primary)' }} />
        <span>{title}</span>
      </div>
      {openSections[id] ? <ChevronDown size={16} color="var(--text-muted)" /> : <ChevronRight size={16} color="var(--text-muted)" />}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingBottom: '2rem' }}>
      
      {/* Templates Section */}
      <div className="glass-card" style={{ padding: '1rem', borderRadius: 'var(--border-radius-lg)', background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
        <SectionHeader id="templates" title="Templates" icon={Layout} />
        {openSections.templates && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginTop: '0.5rem' }}>
            {TEMPLATE_REGISTRY.map((tmpl) => {
              const isSelected = (theme.templateId || 'modern') === tmpl.id;
              return (
                <div
                  key={tmpl.id}
                  onClick={() => update('templateId', tmpl.id)}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '10px',
                    border: isSelected ? '2px solid var(--accent-primary)' : '1px solid var(--card-border)',
                    background: isSelected ? 'rgba(37, 99, 235, 0.05)' : 'var(--bg-secondary)',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem', color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                      {tmpl.name}
                    </span>
                    {isSelected && <Check size={14} style={{ color: 'var(--accent-primary)' }} />}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.3, marginBottom: '0.5rem' }}>
                    {tmpl.description}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '9px', background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                      ATS: {tmpl.atsScore}
                    </span>
                    <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                      {tmpl.columns} Col
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Colors Section */}
      <div className="glass-card" style={{ padding: '1rem', borderRadius: 'var(--border-radius-lg)', background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
        <SectionHeader id="colors" title="Accent Color" icon={Palette} />
        {openSections.colors && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
            {COLOR_PALETTE.map((c) => {
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
                    border: isSelected ? '2px solid #ffffff' : '2px solid transparent',
                    boxShadow: isSelected ? `0 0 0 2px ${c.hex}` : '0 1px 3px rgba(0,0,0,0.1)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    padding: 0
                  }}
                  title={c.name}
                >
                  {isSelected && <Check size={14} />}
                </button>
              );
            })}
            
            <div style={{ display: 'flex', alignItems: 'center', marginLeft: '0.5rem', border: '1px solid var(--card-border)', borderRadius: '20px', padding: '2px 8px 2px 2px', background: 'var(--bg-secondary)' }}>
              <input 
                type="color" 
                value={theme.accentColor || '#1e3a8a'} 
                onChange={(e) => update('accentColor', e.target.value)}
                style={{ width: '28px', height: '28px', padding: 0, border: 'none', borderRadius: '50%', cursor: 'pointer', background: 'none' }}
                title="Custom Color"
              />
            </div>
          </div>
        )}
      </div>

      {/* Typography Section */}
      <div className="glass-card" style={{ padding: '1rem', borderRadius: 'var(--border-radius-lg)', background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
        <SectionHeader id="typography" title="Typography" icon={Type} />
        {openSections.typography && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
            
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Font Family</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
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
                        border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--card-border)',
                        background: isSelected ? 'rgba(37, 99, 235, 0.05)' : 'var(--bg-secondary)',
                        color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)',
                        fontSize: '0.8rem',
                        fontWeight: isSelected ? 600 : 400,
                        cursor: 'pointer',
                        fontFamily: `'${font}', sans-serif`,
                        textAlign: 'left',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {font}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Font Size</label>
                <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderRadius: '8px', padding: '2px', border: '1px solid var(--card-border)' }}>
                  {['compact', 'standard', 'spacious'].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => update('fontSize', opt)}
                      style={{
                        flex: 1,
                        padding: '0.4rem 0',
                        fontSize: '0.75rem',
                        background: theme.fontSize === opt ? 'var(--card-bg)' : 'transparent',
                        color: theme.fontSize === opt ? 'var(--text-primary)' : 'var(--text-muted)',
                        border: 'none',
                        borderRadius: '6px',
                        boxShadow: theme.fontSize === opt ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                        cursor: 'pointer',
                        textTransform: 'capitalize',
                        fontWeight: theme.fontSize === opt ? 600 : 400
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Line Height</label>
                <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderRadius: '8px', padding: '2px', border: '1px solid var(--card-border)' }}>
                  {['tight', 'normal', 'relaxed'].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => update('lineHeight', opt)}
                      style={{
                        flex: 1,
                        padding: '0.4rem 0',
                        fontSize: '0.75rem',
                        background: theme.lineHeight === opt ? 'var(--card-bg)' : 'transparent',
                        color: theme.lineHeight === opt ? 'var(--text-primary)' : 'var(--text-muted)',
                        border: 'none',
                        borderRadius: '6px',
                        boxShadow: theme.lineHeight === opt ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                        cursor: 'pointer',
                        textTransform: 'capitalize',
                        fontWeight: theme.lineHeight === opt ? 600 : 400
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Heading Style</label>
                <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderRadius: '8px', padding: '2px', border: '1px solid var(--card-border)' }}>
                  {['uppercase', 'capitalize', 'normal'].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => update('headingStyle', opt)}
                      style={{
                        flex: 1,
                        padding: '0.4rem 0',
                        fontSize: '0.75rem',
                        background: theme.headingStyle === opt ? 'var(--card-bg)' : 'transparent',
                        color: theme.headingStyle === opt ? 'var(--text-primary)' : 'var(--text-muted)',
                        border: 'none',
                        borderRadius: '6px',
                        boxShadow: theme.headingStyle === opt ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                        cursor: 'pointer',
                        fontWeight: theme.headingStyle === opt ? 600 : 400,
                        textTransform: opt as any
                      }}
                    >
                      {opt === 'normal' ? 'Aa' : opt === 'uppercase' ? 'AA' : 'Aa'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Layout Section */}
      <div className="glass-card" style={{ padding: '1rem', borderRadius: 'var(--border-radius-lg)', background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
        <SectionHeader id="layout" title="Layout" icon={Grid} />
        {openSections.layout && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Page Margins</label>
                <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderRadius: '8px', padding: '2px', border: '1px solid var(--card-border)' }}>
                  {['compact', 'standard', 'spacious'].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => update('pageMargin', opt)}
                      style={{
                        flex: 1,
                        padding: '0.4rem 0',
                        fontSize: '0.75rem',
                        background: theme.pageMargin === opt ? 'var(--card-bg)' : 'transparent',
                        color: theme.pageMargin === opt ? 'var(--text-primary)' : 'var(--text-muted)',
                        border: 'none',
                        borderRadius: '6px',
                        boxShadow: theme.pageMargin === opt ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                        cursor: 'pointer',
                        textTransform: 'capitalize',
                        fontWeight: theme.pageMargin === opt ? 600 : 400
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Section Spacing</label>
                <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderRadius: '8px', padding: '2px', border: '1px solid var(--card-border)' }}>
                  {['compact', 'standard', 'spacious'].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => update('sectionSpacing', opt)}
                      style={{
                        flex: 1,
                        padding: '0.4rem 0',
                        fontSize: '0.75rem',
                        background: theme.sectionSpacing === opt ? 'var(--card-bg)' : 'transparent',
                        color: theme.sectionSpacing === opt ? 'var(--text-primary)' : 'var(--text-muted)',
                        border: 'none',
                        borderRadius: '6px',
                        boxShadow: theme.sectionSpacing === opt ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                        cursor: 'pointer',
                        textTransform: 'capitalize',
                        fontWeight: theme.sectionSpacing === opt ? 600 : 400
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0' }}>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>Show Section Icons</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Display icons next to section headings</div>
              </div>
              <button
                onClick={() => update('showIcons', !theme.showIcons)}
                style={{
                  width: '36px',
                  height: '20px',
                  borderRadius: '10px',
                  background: theme.showIcons ? 'var(--accent-primary)' : 'var(--card-border)',
                  border: 'none',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
              >
                <div style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: 'white',
                  position: 'absolute',
                  top: '2px',
                  left: theme.showIcons ? '18px' : '2px',
                  transition: 'left 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                }} />
              </button>
            </div>

          </div>
        )}
      </div>

    </div>
  );
};
