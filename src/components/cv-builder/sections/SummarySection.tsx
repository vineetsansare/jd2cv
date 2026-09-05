import React, { useState } from 'react';
import { SectionHeadingControl } from '../SectionHeadingControl';
import { RichTextToolbar, type TextAlignment } from '../RichTextToolbar';
import { 
  Edit3, 
  Eye, 
  EyeOff, 
  Trash2, 
  Check, 
  GripVertical, 
  Lightbulb, 
  Plus 
} from 'lucide-react';

interface SummarySectionProps {
  summary: {
    title: string;
    content: string;
    visible: boolean;
    icon?: string;
    showIcon?: boolean;
    alignment?: TextAlignment;
  };
  onChange: (updated: {
    title: string;
    content: string;
    visible: boolean;
    icon?: string;
    showIcon?: boolean;
    alignment?: TextAlignment;
  }) => void;
}

export const SummarySection: React.FC<SummarySectionProps> = ({ summary, onChange }) => {
  const [isEditingHeading, setIsEditingHeading] = useState(false);
  const [isEditingEntry, setIsEditingEntry] = useState(false);
  const [showTips, setShowTips] = useState(false);

  // When in full "Edit Entry" mode (FlowCV Screenshot 4)
  if (isEditingEntry) {
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
        {/* Edit Entry Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Edit Entry</h3>
            <button
              type="button"
              onClick={() => setShowTips(!showTips)}
              style={{
                background: 'rgba(124, 58, 237, 0.1)',
                border: '1px solid rgba(124, 58, 237, 0.25)',
                color: 'var(--accent-primary)',
                borderRadius: '20px',
                padding: '3px 10px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <Lightbulb size={13} />
              <span>Get Tips</span>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => onChange({ ...summary, visible: !summary.visible })}
              style={{ background: 'none', border: 'none', color: summary.visible ? '#10b981' : 'var(--text-muted)', cursor: 'pointer', padding: '0.3rem' }}
              title={summary.visible ? 'Visible on CV' : 'Hidden from CV'}
            >
              {summary.visible ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
            <button
              type="button"
              onClick={() => onChange({ ...summary, content: '' })}
              style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.3rem' }}
              title="Clear text"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Tips Box */}
        {showTips && (
          <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.2)', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
            💡 <strong>FlowCV Pro Tip:</strong> Keep your executive summary to 3-5 punchy sentences. Bold your years of experience, leadership scope, and signature domains (e.g. <strong>15+ years delivering fintech platforms</strong>).
          </div>
        )}

        {/* Rich Text Editor */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
            Professional Summary
          </label>

          <RichTextToolbar
            textareaId="summary-rich-editor"
            value={summary.content}
            onChange={(newVal) => onChange({ ...summary, content: newVal })}
            alignment={summary.alignment || 'justify'}
            onAlignmentChange={(align) => onChange({ ...summary, alignment: align })}
          />

          <textarea
            id="summary-rich-editor"
            rows={7}
            value={summary.content}
            onChange={(e) => onChange({ ...summary, content: e.target.value })}
            placeholder="Highlight your high-level career timeline, key industry domains, leadership scope..."
            style={{
              width: '100%',
              fontSize: '0.85rem',
              lineHeight: 1.6,
              borderRadius: '0 0 10px 10px',
              borderTop: 'none',
              textAlign: summary.alignment || 'justify',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Done Button (FlowCV Pink Accent) */}
        <button
          type="button"
          onClick={() => setIsEditingEntry(false)}
          style={{
            background: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
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
            boxShadow: '0 4px 14px rgba(244, 63, 94, 0.4)',
            marginTop: '0.5rem'
          }}
        >
          <Check size={18} />
          <span>Done</span>
        </button>
      </div>
    );
  }

  // Normal / Overview State (FlowCV Screenshot 1 & 2)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      {/* Header Row: Title or Heading Editor */}
      {isEditingHeading ? (
        <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '10px', border: '1px solid var(--card-border)' }}>
          <SectionHeadingControl
            title={summary.title || 'Executive Profile'}
            iconName={summary.icon || 'fileText'}
            showIcon={summary.showIcon !== false}
            onSave={(newTitle, newIcon, newShowIcon) => {
              onChange({
                ...summary,
                title: newTitle,
                icon: newIcon,
                showIcon: newShowIcon
              });
              setIsEditingHeading(false);
            }}
            onCancel={() => setIsEditingHeading(false)}
          />
        </div>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setIsEditingHeading(true)}
            style={{
              background: 'none',
              border: '1px solid var(--card-border)',
              borderRadius: '6px',
              padding: '0.3rem 0.65rem',
              fontSize: '0.78rem',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <Edit3 size={13} />
            <span>Edit Heading</span>
          </button>

          <button
            type="button"
            onClick={() => onChange({ ...summary, visible: !summary.visible })}
            style={{ background: 'none', border: 'none', color: summary.visible ? '#10b981' : 'var(--text-muted)', cursor: 'pointer', padding: '0.2rem' }}
          >
            {summary.visible ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
        </div>
      )}

      {/* Entry Row Card (FlowCV Item Card with drag dots) */}
      {summary.content ? (
        <div
          onClick={() => setIsEditingEntry(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.85rem 1rem',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--card-border)',
            borderRadius: '10px',
            cursor: 'pointer',
            transition: 'border-color 0.2s',
            gap: '0.75rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0, flexGrow: 1 }}>
            <GripVertical size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <div style={{
              fontSize: '0.82rem',
              color: 'var(--text-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              lineHeight: 1.4
            }}>
              {summary.content.replace(/\*\*/g, '').slice(0, 110)}...
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange({ ...summary, visible: !summary.visible });
              }}
              style={{ background: 'none', border: 'none', color: summary.visible ? '#10b981' : 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}
            >
              {summary.visible ? <Eye size={15} /> : <EyeOff size={15} />}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange({ ...summary, content: '' });
              }}
              style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.25rem' }}
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsEditingEntry(true)}
          style={{
            padding: '1.25rem',
            border: '2px dashed var(--card-border)',
            borderRadius: '10px',
            background: 'var(--bg-secondary)',
            color: 'var(--accent-primary)',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem'
          }}
        >
          <Plus size={16} />
          <span>Add Profile Summary Entry</span>
        </button>
      )}
    </div>
  );
};
