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
  const wrapSelection = (prefix: string, suffix: string = prefix, defaultPlaceholder: string = 'text') => {
    const textarea = document.getElementById(textareaId) as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.substring(start, end);
    const contentToWrap = selected || defaultPlaceholder;
    const replacement = `${prefix}${contentToWrap}${suffix}`;

    const newValue = value.substring(0, start) + replacement + value.substring(end);
    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + contentToWrap.length);
    }, 10);
  };

  const handleBold = () => wrapSelection('**', '**', 'bold text');
  const handleItalic = () => wrapSelection('*', '*', 'italic text');
  const handleUnderline = () => wrapSelection('<u>', '</u>', 'underlined text');
  const handleLink = () => {
    const url = prompt('Enter URL (e.g. https://github.com):', 'https://');
    if (!url) return;
    wrapSelection('[', `](${url})`, 'link text');
  };

  const handleBullet = () => {
    const textarea = document.getElementById(textareaId) as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const lines = value.split('\n');
    let charCount = 0;
    const updatedLines = lines.map((line) => {
      const lineStart = charCount;
      const lineEnd = charCount + line.length;
      charCount += line.length + 1; // +1 for newline

      if (lineEnd >= start && lineStart <= end) {
        if (line.trim().startsWith('* ')) {
          return line.replace(/^\s*\*\s*/, '');
        }
        return `* ${line}`;
      }
      return line;
    });

    onChange(updatedLines.join('\n'));
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
          onClick={handleUnderline}
          className="toolbar-btn"
          title="Underline"
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

      {/* Text Alignment Tools (Matching FlowCV) */}
      {onAlignmentChange && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', background: 'var(--card-bg)', padding: '2px', borderRadius: '6px', border: '1px solid var(--card-border)' }}>
          {(['left', 'center', 'right', 'justify'] as const).map((align) => {
            const isSelected = alignment === align;
            const Icon = align === 'left' ? AlignLeft : align === 'center' ? AlignCenter : align === 'right' ? AlignRight : AlignJustify;

            return (
              <button
                key={align}
                type="button"
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
