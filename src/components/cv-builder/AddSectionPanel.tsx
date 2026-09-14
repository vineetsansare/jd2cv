import React, { useState, useEffect } from 'react';
import { getAddableSections } from '../../utils/sectionRegistry';
import { X, Sparkles, Search, Check } from 'lucide-react';

interface AddSectionPanelProps {
  currentSectionOrder: string[];
  onAddSection: (sectionId: string) => void;
  onAddCustomSection: () => void;
  onClose: () => void;
}

export const AddSectionPanel: React.FC<AddSectionPanelProps> = ({
  currentSectionOrder,
  onAddSection,
  onAddCustomSection,
  onClose
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const addableGroups = getAddableSections();

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Prevent scroll on body when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  const filteredGroups = addableGroups.map(group => ({
    ...group,
    sections: group.sections.filter(s => 
      s.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(group => group.sections.length > 0);

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="glass-card"
        style={{
          background: 'var(--card-bg)',
          borderRadius: 'var(--border-radius-xl)',
          width: '100%',
          maxWidth: '500px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          border: '1px solid var(--card-border)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Add Section</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>Enhance your resume with more details</p>
          </div>
          <button 
            onClick={onClose}
            style={{
              background: 'var(--bg-secondary)',
              border: 'none',
              borderRadius: '50%',
              width: '32px', height: '32px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-secondary)'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--card-border)', background: 'var(--bg-primary)' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search sections..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem 1rem 0.6rem 2.2rem',
                borderRadius: '8px',
                border: '1px solid var(--card-border)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            />
          </div>
        </div>

        {/* Scrollable Content */}
        <div style={{ padding: '1.25rem', overflowY: 'auto', flex: 1 }}>
          {filteredGroups.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)' }}>
              No sections found matching "{searchTerm}"
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {filteredGroups.map(group => (
                <div key={group.category}>
                  <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', margin: '0 0 0.75rem 0', fontWeight: 600 }}>
                    {group.category}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {group.sections.map(section => {
                      const Icon = section.icon;
                      const isAdded = currentSectionOrder.includes(section.id);
                      
                      return (
                        <button
                          key={section.id}
                          disabled={isAdded}
                          onClick={() => !isAdded && onAddSection(section.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            padding: '0.75rem',
                            borderRadius: '10px',
                            background: isAdded ? 'var(--bg-secondary)' : 'var(--card-bg)',
                            border: `1px solid ${isAdded ? 'transparent' : 'var(--card-border)'}`,
                            cursor: isAdded ? 'default' : 'pointer',
                            opacity: isAdded ? 0.6 : 1,
                            transition: 'all 0.2s',
                            textAlign: 'left',
                            width: '100%',
                            boxShadow: isAdded ? 'none' : '0 1px 2px rgba(0,0,0,0.02)'
                          }}
                        >
                          <div style={{ 
                            width: '40px', height: '40px', 
                            borderRadius: '8px', 
                            background: isAdded ? 'var(--bg-tertiary)' : 'rgba(37, 99, 235, 0.1)',
                            color: isAdded ? 'var(--text-muted)' : 'var(--accent-primary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            <Icon size={20} />
                          </div>
                          
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.15rem' }}>
                              {section.label}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {section.description}
                            </div>
                          </div>
                          
                          {isAdded && (
                            <div style={{ color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 600 }}>
                              <Check size={16} /> Added
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer: Custom Section */}
        <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--card-border)', background: 'var(--bg-secondary)' }}>
          <button
            onClick={onAddCustomSection}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.75rem',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, var(--accent-secondary), var(--accent-primary))',
              color: 'white',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(124, 58, 237, 0.2)'
            }}
          >
            <Sparkles size={18} />
            Create Custom Section
          </button>
        </div>
      </div>
    </div>
  );
};
