import React from 'react';
import { ChevronDown, ChevronUp, Eye, EyeOff, Plus, GripVertical, ArrowUp, ArrowDown } from 'lucide-react';

interface SectionCardProps {
  id?: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  visible: boolean;
  entriesCount?: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onToggleVisibility?: (visible: boolean) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onAddEntry?: () => void;
  addEntryLabel?: string;
  children: React.ReactNode;
}

export const SectionCard: React.FC<SectionCardProps> = ({
  title,
  subtitle,
  icon,
  visible,
  entriesCount,
  isExpanded,
  onToggleExpand,
  onToggleVisibility,
  onMoveUp,
  onMoveDown,
  canMoveUp = true,
  canMoveDown = true,
  draggable = false,
  onDragStart,
  onDragOver,
  onDrop,
  onAddEntry,
  addEntryLabel = 'Add Entry',
  children
}) => {
  return (
    <div 
      className="glass-card section-card"
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      style={{
        borderRadius: '12px',
        border: '1px solid var(--card-border)',
        backgroundColor: 'var(--card-bg)',
        overflow: 'hidden',
        transition: 'all 0.2s ease',
        marginBottom: '0.85rem'
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
          backgroundColor: isExpanded ? 'rgba(124, 58, 237, 0.04)' : 'transparent',
          borderBottom: isExpanded ? '1px solid var(--card-border)' : 'none'
        }}
        onClick={onToggleExpand}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {draggable && (
            <span 
              style={{ color: 'var(--text-muted)', cursor: 'grab', display: 'flex', alignItems: 'center', padding: '0 2px' }}
              title="Drag to reorder section"
            >
              <GripVertical size={16} />
            </span>
          )}
          <span style={{ color: 'var(--accent-primary)', display: 'flex', alignItems: 'center' }}>
            {icon}
          </span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontWeight: 700, fontSize: '0.92rem', color: visible ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                {title}
              </span>
              {typeof entriesCount === 'number' && (
                <span 
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '0.12rem 0.45rem',
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
            {subtitle && (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {subtitle}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }} onClick={(e) => e.stopPropagation()}>
          {onMoveUp && (
            <button
              type="button"
              onClick={onMoveUp}
              disabled={!canMoveUp}
              style={{
                background: 'none',
                border: 'none',
                color: canMoveUp ? 'var(--text-secondary)' : 'var(--card-border)',
                cursor: canMoveUp ? 'pointer' : 'default',
                padding: '0.25rem',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Move section up"
            >
              <ArrowUp size={14} />
            </button>
          )}

          {onMoveDown && (
            <button
              type="button"
              onClick={onMoveDown}
              disabled={!canMoveDown}
              style={{
                background: 'none',
                border: 'none',
                color: canMoveDown ? 'var(--text-secondary)' : 'var(--card-border)',
                cursor: canMoveDown ? 'pointer' : 'default',
                padding: '0.25rem',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Move section down"
            >
              <ArrowDown size={14} />
            </button>
          )}

          {onToggleVisibility && (
            <button
              type="button"
              onClick={() => onToggleVisibility(!visible)}
              style={{
                background: 'none',
                border: 'none',
                color: visible ? '#10b981' : 'var(--text-muted)',
                cursor: 'pointer',
                padding: '0.25rem',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center'
              }}
              title={visible ? 'Visible on CV' : 'Hidden from CV'}
            >
              {visible ? <Eye size={15} /> : <EyeOff size={15} />}
            </button>
          )}

          <button
            type="button"
            onClick={onToggleExpand}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '0.25rem',
              borderRadius: '4px',
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
        <div style={{ padding: '1.25rem', borderTop: '1px solid var(--card-border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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

