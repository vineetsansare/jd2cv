import React from 'react';
import { Bold, Italic, Underline, List, Link as LinkIcon, AlignLeft, AlignCenter, AlignRight, AlignJustify } from 'lucide-react';

export type TextAlignment = 'left' | 'center' | 'right' | 'justify';

interface RichTextToolbarProps {
  textareaId: string;
  value: string;
  onChange: (newValue: string) => void;
  alignment?: TextAlignment;
  onAlignmentChange?: (align: TextAlignment) => void;
}

export const RichTextToolbar: React.FC<RichTextToolbarProps> = ({
  textareaId,
  value,
  onChange,
  alignment = 'left',
  onAlignmentChange
}) => {
  const wrapSelection = (prefix: string, suffix: string = prefix) => {
    const textarea = document.getElementById(textareaId) as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const selected = value.substring(start, end);

    if (selected.length > 0) {
      // Wrap the active selection cleanly
      const replacement = `${prefix}${selected}${suffix}`;
      const newValue = value.substring(0, start) + replacement + value.substring(end);
      onChange(newValue);

      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
      }, 0);
    } else {
      // No text selected: insert tokens and put cursor right in between without dummy text
      const replacement = `${prefix}${suffix}`;
      const newValue = value.substring(0, start) + replacement + value.substring(end);
      onChange(newValue);

      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + prefix.length, start + prefix.length);
      }, 0);
    }
  };

  const handleBold = () => wrapSelection('**', '**');
  const handleItalic = () => wrapSelection('*', '*');
  const handleUnderline = () => wrapSelection('<u>', '</u>');
  
  const handleLink = () => {
    const textarea = document.getElementById(textareaId) as HTMLTextAreaElement;
    const start = textarea?.selectionStart ?? 0;
    const end = textarea?.selectionEnd ?? 0;
    const selected = value.substring(start, end);

    const url = prompt('Enter URL (e.g. https://github.com):', 'https://');
    if (!url) return;

    const label = selected || 'link';
    const replacement = `[${label}](${url})`;
    const newValue = value.substring(0, start) + replacement + value.substring(end);
    onChange(newValue);

    setTimeout(() => {
      textarea?.focus();
      textarea?.setSelectionRange(start + 1, start + 1 + label.length);
    }, 0);
  };

  const handleBullet = () => {
    const textarea = document.getElementById(textareaId) as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;

    if (!value || value.trim().length === 0) {
      onChange('* ');
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(2, 2);
      }, 0);
      return;
    }

    const lines = value.split('\n');
    let charCount = 0;
    let modified = false;

    const updatedLines = lines.map((line) => {
      const lineStart = charCount;
      const lineEnd = charCount + line.length;
      charCount += line.length + 1; // +1 for \n

      // Check if line intersects with selection/cursor
      if ((start >= lineStart && start <= lineEnd) || (end >= lineStart && end <= lineEnd) || (lineStart >= start && lineEnd <= end)) {
        modified = true;
        if (line.trim().startsWith('* ')) {
          return line.replace(/^(\s*)\*\s?/, '$1');
        } else if (line.trim().startsWith('- ')) {
          return line.replace(/^(\s*)-\s?/, '$1');
        } else {
          return `* ${line}`;
        }
      }
      return line;
    });

    if (modified) {
      onChange(updatedLines.join('\n'));
      setTimeout(() => {
        textarea.focus();
      }, 0);
    } else {
      // If cursor is at very end
      const newValue = `${value}\n* `;
      onChange(newValue);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(newValue.length, newValue.length);
      }, 0);
    }
  };

  return (
    <div 
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.5rem',
        padding: '0.45rem 0.65rem',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--card-border)',
        borderRadius: '10px 10px 0 0',
        borderBottom: 'none'
      }}
    >
      {/* Inline Formatting Tools */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleBold}
          className="toolbar-btn"
          title="Bold (**text**)"
          style={{
            padding: '0.35rem 0.5rem',
            background: 'none',
            border: 'none',
            borderRadius: '6px',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Bold size={15} />
        </button>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleItalic}
          className="toolbar-btn"
          title="Italic (*text*)"
          style={{
            padding: '0.35rem 0.5rem',
            background: 'none',
            border: 'none',
            borderRadius: '6px',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Italic size={15} />
        </button>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleUnderline}
          className="toolbar-btn"
          title="Underline (<u>text</u>)"
          style={{
            padding: '0.35rem 0.5rem',
            background: 'none',
            border: 'none',
            borderRadius: '6px',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Underline size={15} />
        </button>

        <div style={{ width: '1px', height: '18px', background: 'var(--card-border)', margin: '0 0.25rem' }} />

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleBullet}
          className="toolbar-btn"
          title="Bullet List (* item)"
          style={{
            padding: '0.35rem 0.5rem',
            background: 'none',
            border: 'none',
            borderRadius: '6px',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <List size={15} />
        </button>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleLink}
          className="toolbar-btn"
          title="Insert Link ([text](url))"
          style={{
            padding: '0.35rem 0.5rem',
            background: 'none',
            border: 'none',
            borderRadius: '6px',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <LinkIcon size={15} />
        </button>
      </div>

      {/* Text Alignment Tools */}
      {onAlignmentChange && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', background: 'var(--card-bg)', padding: '2px', borderRadius: '6px', border: '1px solid var(--card-border)' }}>
          {(['left', 'center', 'right', 'justify'] as const).map((align) => {
            const isSelected = alignment === align;
            const Icon = align === 'left' ? AlignLeft : align === 'center' ? AlignCenter : align === 'right' ? AlignRight : AlignJustify;

            return (
              <button
                key={align}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onAlignmentChange(align)}
                title={`Align ${align.charAt(0).toUpperCase() + align.slice(1)}`}
                style={{
                  padding: '0.25rem 0.4rem',
                  background: isSelected ? 'var(--accent-primary)' : 'transparent',
                  color: isSelected ? '#ffffff' : 'var(--text-muted)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s'
                }}
              >
                <Icon size={13} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
