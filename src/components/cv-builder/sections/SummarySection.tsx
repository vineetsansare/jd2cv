import React from 'react';
import { Bold } from 'lucide-react';

interface SummarySectionProps {
  summary: {
    title: string;
    content: string;
    visible: boolean;
  };
  onChange: (updated: { title: string; content: string; visible: boolean }) => void;
}

export const SummarySection: React.FC<SummarySectionProps> = ({ summary, onChange }) => {
  const insertBold = () => {
    const textarea = document.getElementById('summary-textarea') as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = summary.content;
    const selectedText = text.substring(start, end);
    const replacement = selectedText ? `**${selectedText}**` : '**bold text**';
    const newContent = text.substring(0, start) + replacement + text.substring(end);
    onChange({ ...summary, content: newContent });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <input 
          type="text" 
          value={summary.title || 'Executive Profile'} 
          onChange={(e) => onChange({ ...summary, title: e.target.value })}
          style={{ width: '220px', fontWeight: 700, fontSize: '0.9rem' }}
          placeholder="Section Title"
        />

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={insertBold}
            className="btn btn-secondary"
            style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            title="Bold selected text (**text**)"
          >
            <Bold size={13} />
            <span>Bold</span>
          </button>
        </div>
      </div>

      <div className="form-group" style={{ margin: 0 }}>
        <textarea
          id="summary-textarea"
          rows={5}
          value={summary.content}
          onChange={(e) => onChange({ ...summary, content: e.target.value })}
          placeholder="Highlight your high-level career timeline, leadership scope, key industry domains, and flagship achievements..."
          style={{ width: '100%', fontSize: '0.85rem', lineHeight: 1.6 }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.35rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <span>Tip: Use <code>**word**</code> to bold metrics and key skills on your CV</span>
          <span>~{summary.content.split(/\s+/).filter(Boolean).length} words</span>
        </div>
      </div>
    </div>
  );
};
