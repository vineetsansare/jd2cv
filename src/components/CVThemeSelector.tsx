import React from 'react';
import { Palette, User, Check, Layers, Sparkles, Type } from 'lucide-react';

export type CVLayoutTemplate = 'modern-timeline' | 'classic-ats' | 'split-sidebar-right' | 'split-sidebar' | 'compact-executive' | 'swiss-minimalist';

export type PhotoShape = 'circle' | 'rounded' | 'square' | 'squircle';
export type PhotoBorder = 'accent' | 'subtle' | 'none';
export type ClassicSectionHeadingStyle = 'double-line' | 'single-line' | 'filled-pill';

export interface CVThemeConfig {
  accentColor: string;
  themeName: string;
  showPhoto: boolean;
  photoUrl?: string;
  photoShape?: PhotoShape;
  photoBorder?: PhotoBorder;
  photoBorderWidth?: number; // 0 to 5, default 3 (0 means no ring)
  layoutDensity?: 'compact' | 'standard';
  template?: CVLayoutTemplate;
  fontFamily?: string;
  classicSectionStyle?: ClassicSectionHeadingStyle;
}

export interface CVFontOption {
  id: string;
  name: string;
  category: string;
}

export const CV_FONTS: CVFontOption[] = [
  { id: 'plus-jakarta', name: 'Plus Jakarta Sans', category: 'Modern Sans' },
  { id: 'inter', name: 'Inter', category: 'Clean Geometric' },
  { id: 'merriweather', name: 'Merriweather', category: 'Executive Serif' },
  { id: 'roboto', name: 'Roboto', category: 'Corporate Sans' },
  { id: 'jetbrains-mono', name: 'JetBrains Mono', category: 'Technical Monospace' }
];

export const ACCENT_THEMES = [
  { id: 'charcoal', name: 'Slate Charcoal', color: '#475569', bg: 'rgba(71, 85, 105, 0.15)' },
  { id: 'violet', name: 'Executive Violet', color: '#7c3aed', bg: 'rgba(124, 58, 237, 0.15)' },
  { id: 'blue', name: 'Sapphire Blue', color: '#2563eb', bg: 'rgba(37, 99, 235, 0.15)' },
  { id: 'teal', name: 'Emerald Teal', color: '#059669', bg: 'rgba(5, 150, 105, 0.15)' },
  { id: 'rose', name: 'Creative Rose', color: '#e11d48', bg: 'rgba(225, 29, 72, 0.15)' }
];

interface CVThemeSelectorProps {
  themeConfig: CVThemeConfig;
  onChangeThemeConfig: (config: CVThemeConfig) => void;
  userAvatarUrl?: string;
}

export const CVThemeSelector: React.FC<CVThemeSelectorProps> = ({
  themeConfig,
  onChangeThemeConfig,
  userAvatarUrl
}) => {
  const localAvatar = typeof window !== 'undefined' ? (localStorage.getItem('user_avatar_url') || '') : '';
  const activePhoto = themeConfig.photoUrl || userAvatarUrl || localAvatar || '';
  const [photoInput, setPhotoInput] = React.useState(activePhoto);

  React.useEffect(() => {
    const current = themeConfig.photoUrl || userAvatarUrl || (typeof window !== 'undefined' ? (localStorage.getItem('user_avatar_url') || '') : '') || '';
    setPhotoInput(current);
  }, [themeConfig.photoUrl, userAvatarUrl]);

  const handleSelectColor = (color: string, name: string) => {
    onChangeThemeConfig({
      ...themeConfig,
      accentColor: color,
      themeName: name
    });
  };

  const handleTogglePhoto = () => {
    const nextState = !themeConfig.showPhoto;
    const fallbackPhoto = photoInput || userAvatarUrl || localAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
    onChangeThemeConfig({
      ...themeConfig,
      showPhoto: nextState,
      photoUrl: fallbackPhoto,
      photoShape: themeConfig.photoShape || 'circle',
      photoBorder: themeConfig.photoBorder || 'accent',
      photoBorderWidth: themeConfig.photoBorderWidth !== undefined ? themeConfig.photoBorderWidth : 3
    });
  };

  const handleSelectPhotoShape = (shape: PhotoShape) => {
    onChangeThemeConfig({
      ...themeConfig,
      photoShape: shape
    });
  };

  const handleSelectPhotoBorder = (border: PhotoBorder) => {
    onChangeThemeConfig({
      ...themeConfig,
      photoBorder: border,
      photoBorderWidth: border === 'none' ? 0 : (themeConfig.photoBorderWidth || 3)
    });
  };

  const handleSelectBorderWidth = (width: number) => {
    onChangeThemeConfig({
      ...themeConfig,
      photoBorderWidth: width,
      photoBorder: width === 0 ? 'none' : (themeConfig.photoBorder === 'none' ? 'accent' : themeConfig.photoBorder || 'accent')
    });
  };

  const handleSelectClassicHeadingStyle = (style: ClassicSectionHeadingStyle) => {
    onChangeThemeConfig({
      ...themeConfig,
      classicSectionStyle: style
    });
  };

  const handlePhotoUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setPhotoInput(url);
    if (themeConfig.showPhoto) {
      onChangeThemeConfig({
        ...themeConfig,
        photoUrl: url
      });
    }
  };

  const handleToggleDensity = (density: 'compact' | 'standard') => {
    onChangeThemeConfig({
      ...themeConfig,
      layoutDensity: density
    });
  };

  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '1.25rem',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.85rem 1.25rem',
      background: 'var(--card-bg)',
      border: '1px solid var(--card-border)',
      borderRadius: '16px',
      marginBottom: '1.25rem'
    }} className="no-print">
      
      {/* Left: Accent Color Themes */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>
          <Palette size={16} style={{ color: themeConfig.accentColor }} />
          <span>CV Accent Theme:</span>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {ACCENT_THEMES.map((theme) => {
            const isSelected = themeConfig.accentColor === theme.color;
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => handleSelectColor(theme.color, theme.name)}
                title={theme.name}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: theme.color,
                  border: isSelected ? '2px solid #ffffff' : '2px solid transparent',
                  boxShadow: isSelected ? `0 0 0 2px ${theme.color}` : 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  transition: 'transform 0.15s ease'
                }}
              >
                {isSelected && <Check size={14} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Middle: 1-Page Fit vs Standard Layout Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-secondary)', padding: '0.2rem 0.35rem', borderRadius: '10px', border: '1px solid var(--card-border)' }}>
        <Layers size={14} style={{ color: 'var(--text-muted)', marginLeft: '0.35rem' }} />
        <button
          type="button"
          onClick={() => handleToggleDensity('compact')}
          style={{
            fontSize: '0.78rem',
            fontWeight: 600,
            padding: '0.25rem 0.6rem',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            background: themeConfig.layoutDensity === 'compact' ? 'var(--accent-primary)' : 'transparent',
            color: themeConfig.layoutDensity === 'compact' ? '#ffffff' : 'var(--text-secondary)'
          }}
        >
          1-Page Compact Fit
        </button>
        <button
          type="button"
          onClick={() => handleToggleDensity('standard')}
          style={{
            fontSize: '0.78rem',
            fontWeight: 600,
            padding: '0.25rem 0.6rem',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            background: themeConfig.layoutDensity === 'standard' ? 'var(--accent-primary)' : 'transparent',
            color: themeConfig.layoutDensity === 'standard' ? '#ffffff' : 'var(--text-secondary)'
          }}
        >
          Standard Spacing
        </button>
      </div>

      {/* Middle-Right: Template Layout Switcher (Preserved Layout vs Classic ATS) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--bg-secondary)', padding: '0.2rem 0.35rem', borderRadius: '10px', border: '1px solid var(--card-border)' }}>
        <Sparkles size={14} style={{ color: 'var(--accent-primary)', marginLeft: '0.35rem' }} />
        <button
          type="button"
          onClick={() => onChangeThemeConfig({ ...themeConfig, template: 'split-sidebar-right' })}
          style={{
            fontSize: '0.78rem',
            fontWeight: 600,
            padding: '0.25rem 0.6rem',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            background: themeConfig.template === 'split-sidebar-right' ? 'var(--accent-primary)' : 'transparent',
            color: themeConfig.template === 'split-sidebar-right' ? '#ffffff' : 'var(--text-secondary)'
          }}
          title="Split Layout: Dark navy right sidebar, pill-shaped skill badges & wide tracked headers"
        >
          🌟 Dark Sidebar
        </button>
        <button
          type="button"
          onClick={() => onChangeThemeConfig({ ...themeConfig, template: 'modern-timeline' })}
          style={{
            fontSize: '0.78rem',
            fontWeight: 600,
            padding: '0.25rem 0.6rem',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            background: themeConfig.template === 'modern-timeline' ? 'var(--accent-primary)' : 'transparent',
            color: themeConfig.template === 'modern-timeline' ? '#ffffff' : 'var(--text-secondary)'
          }}
          title="Left-Rail Timeline: Boxed skill cards, left dates & zigzag dividers"
        >
          🌟 Modern Timeline
        </button>
        <button
          type="button"
          onClick={() => onChangeThemeConfig({ ...themeConfig, template: 'classic-ats' })}
          style={{
            fontSize: '0.78rem',
            fontWeight: 600,
            padding: '0.25rem 0.6rem',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            background: themeConfig.template === 'classic-ats' ? 'var(--accent-primary)' : 'transparent',
            color: themeConfig.template === 'classic-ats' ? '#ffffff' : 'var(--text-secondary)'
          }}
          title="Classic ATS format with centered double-line section headers"
        >
          📄 Classic ATS
        </button>
      </div>

      {/* Font Family Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.78rem', fontWeight: 600 }}>
          <Type size={14} style={{ color: themeConfig.accentColor }} />
          <span>Font:</span>
        </div>
        <select
          value={themeConfig.fontFamily || 'Plus Jakarta Sans'}
          onChange={(e) => onChangeThemeConfig({ ...themeConfig, fontFamily: e.target.value })}
          style={{
            fontSize: '0.78rem',
            fontWeight: 600,
            padding: '0.3rem 0.6rem',
            borderRadius: '7px',
            border: '1px solid var(--card-border)',
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            outline: 'none',
            fontFamily: themeConfig.fontFamily ? `'${themeConfig.fontFamily}', sans-serif` : 'inherit'
          }}
          title="Choose CV typography font family"
        >
          {CV_FONTS.map(f => (
            <option key={f.name} value={f.name}>
              {f.name} ({f.category})
            </option>
          ))}
        </select>
      </div>

      {/* Classic ATS Section Heading Style Selector */}
      {themeConfig.template === 'classic-ats' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Header Style:</span>
          <div style={{ display: 'inline-flex', alignItems: 'center', background: 'var(--bg-secondary)', padding: '2px', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
            {[
              { id: 'double-line' as ClassicSectionHeadingStyle, label: '═ Double Line ═', title: 'Double parallel lines above & below heading' },
              { id: 'single-line' as ClassicSectionHeadingStyle, label: '⎯ Single Line', title: 'Single solid underline underneath heading' },
              { id: 'filled-pill' as ClassicSectionHeadingStyle, label: '■ Filled Pill', title: 'Filled rounded rectangle with accent color and white text' }
            ].map(s => {
              const isSelected = (themeConfig.classicSectionStyle || 'double-line') === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleSelectClassicHeadingStyle(s.id)}
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: isSelected ? 600 : 500,
                    padding: '0.25rem 0.55rem',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    background: isSelected ? themeConfig.accentColor : 'transparent',
                    color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                    transition: 'all 0.15s'
                  }}
                  title={s.title}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Right: Candidate Photo Toggle & Shape/Border Customizer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>
          <input
            type="checkbox"
            checked={themeConfig.showPhoto}
            onChange={handleTogglePhoto}
            style={{ width: '16px', height: '16px', accentColor: themeConfig.accentColor }}
          />
          <User size={16} style={{ color: themeConfig.accentColor }} />
          <span>Include Candidate Photo</span>
        </label>

        {themeConfig.showPhoto && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {/* Shape Selector Group */}
            <div style={{ display: 'inline-flex', alignItems: 'center', background: 'var(--bg-secondary)', padding: '2px', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
              {[
                { id: 'circle' as PhotoShape, label: 'Circle', radius: '50%' },
                { id: 'rounded' as PhotoShape, label: 'Rounded', radius: '3px' },
                { id: 'square' as PhotoShape, label: 'Square', radius: '0px' },
                { id: 'squircle' as PhotoShape, label: 'Squircle', radius: '30%' }
              ].map(s => {
                const isSelected = (themeConfig.photoShape || 'circle') === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSelectPhotoShape(s.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.25rem 0.55rem',
                      fontSize: '0.75rem',
                      fontWeight: isSelected ? 600 : 500,
                      borderRadius: '6px',
                      border: 'none',
                      background: isSelected ? 'var(--card-bg)' : 'transparent',
                      color: isSelected ? 'var(--text-primary)' : 'var(--text-muted)',
                      boxShadow: isSelected ? '0 1px 4px rgba(0,0,0,0.15)' : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                    title={`Photo shape: ${s.label}`}
                  >
                    <span style={{ width: '8px', height: '8px', borderRadius: s.radius, background: isSelected ? themeConfig.accentColor : 'currentColor', display: 'inline-block' }} />
                    <span>{s.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Border Selector Group */}
            <div style={{ display: 'inline-flex', alignItems: 'center', background: 'var(--bg-secondary)', padding: '2px', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
              {[
                { id: 'accent' as PhotoBorder, label: 'Accent' },
                { id: 'subtle' as PhotoBorder, label: 'Subtle' },
                { id: 'none' as PhotoBorder, label: 'None' }
              ].map(b => {
                const isSelected = (themeConfig.photoBorder || 'accent') === b.id;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => handleSelectPhotoBorder(b.id)}
                    style={{
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.75rem',
                      fontWeight: isSelected ? 600 : 500,
                      borderRadius: '6px',
                      border: 'none',
                      background: isSelected ? 'var(--card-bg)' : 'transparent',
                      color: isSelected ? 'var(--text-primary)' : 'var(--text-muted)',
                      boxShadow: isSelected ? '0 1px 4px rgba(0,0,0,0.15)' : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                    title={`Border style: ${b.label}`}
                  >
                    {b.label}
                  </button>
                );
              })}
            </div>

            {/* Ring Width Selector Group (0px to 5px) */}
            <div style={{ display: 'inline-flex', alignItems: 'center', background: 'var(--bg-secondary)', padding: '2px', borderRadius: '8px', border: '1px solid var(--card-border)', gap: '1px' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', padding: '0 0.35rem', fontWeight: 600 }}>Ring:</span>
              {[0, 1, 2, 3, 4, 5].map(w => {
                const currentWidth = themeConfig.photoBorderWidth !== undefined 
                  ? themeConfig.photoBorderWidth 
                  : (themeConfig.photoBorder === 'none' ? 0 : 3);
                const isSelected = currentWidth === w;
                return (
                  <button
                    key={w}
                    type="button"
                    onClick={() => handleSelectBorderWidth(w)}
                    style={{
                      padding: '0.2rem 0.4rem',
                      fontSize: '0.72rem',
                      fontWeight: isSelected ? 700 : 500,
                      borderRadius: '5px',
                      border: 'none',
                      background: isSelected ? 'var(--card-bg)' : 'transparent',
                      color: isSelected ? (w === 0 ? 'var(--text-primary)' : themeConfig.accentColor) : 'var(--text-muted)',
                      boxShadow: isSelected ? '0 1px 3px rgba(0,0,0,0.15)' : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                    title={w === 0 ? 'No border ring (0px)' : `Border ring width: ${w}px`}
                  >
                    {w === 0 ? '0' : `${w}px`}
                  </button>
                );
              })}
            </div>

            {/* Photo URL Input */}
            <input
              type="text"
              placeholder="Image URL (e.g. https://...)"
              value={photoInput}
              onChange={handlePhotoUrlChange}
              style={{
                fontSize: '0.78rem',
                padding: '0.3rem 0.6rem',
                borderRadius: '8px',
                border: '1px solid var(--card-border)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                width: '180px'
              }}
              title="Candidate headshot image source URL or base64 data"
            />
          </div>
        )}
      </div>

    </div>
  );
};
