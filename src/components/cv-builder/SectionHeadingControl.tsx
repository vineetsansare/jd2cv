import React, { useState, useRef, useEffect } from 'react';
import { 
  Check, 
  ChevronDown, 
  Briefcase, 
  Award, 
  GraduationCap, 
  FileText, 
  Code, 
  Cpu, 
  Globe, 
  User, 
  Folder, 
  Sparkles, 
  BookOpen, 
  Target, 
  Shield, 
  Compass, 
  Heart, 
  Edit3,
  Eye,
  EyeOff
} from 'lucide-react';

export const SECTION_ICONS: Record<string, React.ElementType> = {
  briefcase: Briefcase,
  award: Award,
  graduation: GraduationCap,
  fileText: FileText,
  code: Code,
  cpu: Cpu,
  globe: Globe,
  user: User,
  folder: Folder,
  sparkles: Sparkles,
  book: BookOpen,
  target: Target,
  shield: Shield,
  compass: Compass,
  heart: Heart,
  edit: Edit3
};

interface SectionHeadingControlProps {
  title: string;
  iconName?: string;
  showIcon?: boolean;
  onSave: (title: string, iconName: string, showIcon: boolean) => void;
  onCancel?: () => void;
}

export const SectionHeadingControl: React.FC<SectionHeadingControlProps> = ({
  title,
  iconName = 'fileText',
  showIcon = true,
  onSave,
  onCancel
}) => {
  const [currentTitle, setCurrentTitle] = useState(title);
  const [currentIcon, setCurrentIcon] = useState(iconName);
  const [currentShowIcon, setCurrentShowIcon] = useState(showIcon);
  const [isIconDropdownOpen, setIsIconDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsIconDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const SelectedIconComponent = SECTION_ICONS[currentIcon] || FileText;

  const handleDone = () => {
    onSave(currentTitle.trim() || title, currentIcon, currentShowIcon);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', flexWrap: 'wrap' }}>
        {/* Icon Dropdown Selector */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Icon</div>
          <button
            type="button"
            onClick={() => setIsIconDropdownOpen(!isIconDropdownOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.55rem 0.75rem',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--card-border)',
              borderRadius: '8px',
              cursor: 'pointer',
              color: 'var(--text-primary)'
            }}
          >
            {currentShowIcon ? <SelectedIconComponent size={16} style={{ color: 'var(--accent-primary)' }} /> : <EyeOff size={16} style={{ color: 'var(--text-muted)' }} />}
            <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
          </button>

          {/* Section Icon Picker Popover */}
          {isIconDropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '6px',
                zIndex: 100,
                width: '260px',
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                borderRadius: '12px',
                boxShadow: '0 12px 30px rgba(0,0,0,0.3)',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}
            >
              {/* Show / Hide Toggle */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>Show/hide icon</span>
                <button
                  type="button"
                  onClick={() => setCurrentShowIcon(!currentShowIcon)}
                  style={{
                    background: currentShowIcon ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                    color: currentShowIcon ? '#ffffff' : 'var(--text-muted)',
                    border: '1px solid var(--card-border)',
                    borderRadius: '20px',
                    padding: '2px 8px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  {currentShowIcon ? <Eye size={12} /> : <EyeOff size={12} />}
                  <span>{currentShowIcon ? 'Visible' : 'Hidden'}</span>
                </button>
              </div>

              {/* Default Icons Grid */}
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
                  Choose Icon
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.4rem' }}>
                  {Object.entries(SECTION_ICONS).map(([key, IconComp]) => {
                    const isSelected = currentIcon === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          setCurrentIcon(key);
                          setCurrentShowIcon(true);
                          setIsIconDropdownOpen(false);
                        }}
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          border: isSelected ? '2px solid var(--accent-primary)' : '1px solid var(--card-border)',
                          background: isSelected ? 'rgba(124, 58, 237, 0.15)' : 'var(--bg-secondary)',
                          color: isSelected ? 'var(--accent-primary)' : 'var(--text-secondary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                      >
                        <IconComp size={16} />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Heading Input */}
        <div style={{ flexGrow: 1, minWidth: '180px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Heading</div>
          <input
            type="text"
            value={currentTitle}
            onChange={(e) => setCurrentTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleDone();
              if (e.key === 'Escape' && onCancel) onCancel();
            }}
            placeholder="e.g. Executive Profile"
            style={{ width: '100%', fontSize: '0.9rem', fontWeight: 600 }}
            autoFocus
          />
        </div>

        {/* Done Button */}
        <div style={{ alignSelf: 'flex-end' }}>
          <button
            type="button"
            onClick={handleDone}
            style={{
              background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '0.6rem 1.15rem',
              fontWeight: 700,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)'
            }}
          >
            <Check size={16} />
            <span>Done</span>
          </button>
        </div>
      </div>
    </div>
  );
};
