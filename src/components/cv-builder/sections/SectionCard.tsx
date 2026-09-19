import React from 'react';
import { ChevronDown, ChevronUp, Eye, EyeOff, Plus, GripVertical } from 'lucide-react';

interface SectionCardProps {
  id?: string;
  title: string;
  icon: React.ReactNode;
  visible: boolean;
  entriesCount?: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onToggleVisibility: (visible: boolean) => void;
  onAddEntry?: () => void;
  addEntryLabel?: string;
  children: React.ReactNode;
}

export const SectionCard: React.FC<SectionCardProps> = ({
  title,
  icon,
  visible,
  entriesCount,
  isExpanded,
  onToggleExpand,
  onToggleVisibility,
  onAddEntry,
  addEntryLabel = 'Add Entry',
  children
}) => {
  return (
    <div 
      className="glass-card section-card"
      style={{
        borderRadius: '12px',
        border: '1px solid var(--card-border)',
        backgroundColor: 'var(--card-bg)',
        overflow: 'hidden',
        transition: 'all 0.2s ease',
        marginBottom: '1rem'
      }}
    >
      {/* Card Header Bar */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.85rem 1.15rem',
          cursor: 'pointer',
          userSelect: 'none',
          backgroundColor: isExpanded ? 'rgba(255, 255, 255, 0.02)' : 'transparent',
          borderBottom: isExpanded ? '1px solid var(--card-border)' : 'none'
        }}
        onClick={onToggleExpand}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <span style={{ color: 'var(--text-muted)', cursor: 'grab', display: 'flex', alignItems: 'center' }}>
            <GripVertical size={15} />
          </span>
          <span style={{ color: 'var(--accent-primary)', display: 'flex', alignItems: 'center' }}>
            {icon}
          </span>
          <span style={{ fontWeight: 600, fontSize: '0.95rem', color: visible ? 'var(--text-primary)' : 'var(--text-muted)' }}>
            {title}
          </span>
          {typeof entriesCount === 'number' && (
            <span 
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '0.15rem 0.45rem',
                borderRadius: '999px',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--card-border)'
              }}
            >
              {entriesCount}
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onToggleVisibility(!visible)}
            style={{
              background: 'none',
              border: 'none',
              color: visible ? 'var(--text-secondary)' : 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0.3rem',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              transition: 'color 0.15s'
            }}
            title={visible ? 'Hide section from CV' : 'Show section on CV'}
          >
            {visible ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>

          <button
            type="button"
            onClick={onToggleExpand}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '0.3rem',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Expanded Content Body */}
      {isExpanded && (
        <div style={{ padding: '1.25rem 1.15rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {children}

          {onAddEntry && (
            <button
              type="button"
              onClick={onAddEntry}
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
                marginTop: '0.5rem',
                transition: 'all 0.15s ease'
              }}
            >
              <Plus size={15} />
              <span>{addEntryLabel}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
