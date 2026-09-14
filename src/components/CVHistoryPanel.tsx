import React, { useState } from 'react';
import { History, Download, Eye, Sparkles, Calendar, ShieldCheck, LayoutGrid, List } from 'lucide-react';
import { LiquidCard } from './ui/LiquidCard';
import { printCvDocument } from '../utils/printHelper';

export interface GenerationRecord {
  id: string;
  created_at: string;
  job_description: string;
  cv_markdown: string;
  cover_letter?: string;
  ats_score?: number;
  ats_analysis?: any;
  human_changes?: string[];
  provider_used?: string;
  model_used?: string;
}

interface CVHistoryPanelProps {
  generations: GenerationRecord[];
  loading: boolean;
  onSelectGeneration: (gen: GenerationRecord) => void;
}

export const CVHistoryPanel: React.FC<CVHistoryPanelProps> = ({
  generations,
  loading,
  onSelectGeneration
}) => {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    try {
      const saved = localStorage.getItem('jd2cv_history_view_mode');
      if (saved === 'grid' || saved === 'list') return saved;
    } catch {
      // localStorage may not be accessible
    }
    return 'grid';
  });

  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    try {
      localStorage.setItem('jd2cv_history_view_mode', mode);
    } catch {
      // ignore
    }
  };

  const handleDownloadPDF = (gen: GenerationRecord) => {
    setDownloadingId(gen.id);
    const timestampStr = new Date(gen.created_at).toISOString().split('T')[0];
    const filename = `CV_Optimized_${timestampStr}`;
    
    // Execute isolated iframe print engine
    printCvDocument(gen.cv_markdown, undefined, filename);

    setTimeout(() => {
      setDownloadingId(null);
    }, 500);
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  const getJDSnippet = (jdText: string) => {
    if (!jdText) return 'No job description preview available.';
    const cleanText = jdText.replace(/\s+/g, ' ').trim();
    return cleanText.length > 140 ? `${cleanText.substring(0, 140)}...` : cleanText;
  };

  return (
    <div className="history-panel-container">
      
      {/* Header Banner */}
      <div className="history-header-banner">
        <div className="history-header-left">
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)',
            flexShrink: 0
          }}>
            <History size={20} />
          </div>
          <div>
            <h2 className="history-header-title" style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Recent Generation History
            </h2>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Revisit, edit, inspect, or export PDFs of your recent AI-customized resume profiles (showing up to 25).
            </p>
          </div>
        </div>

        {/* View Mode Selection (Grid / List) */}
        {!loading && generations.length > 0 && (
          <div className="history-view-toggle">
            <button
              type="button"
              className="history-view-toggle-btn"
              onClick={() => handleViewModeChange('grid')}
              style={{
                fontWeight: viewMode === 'grid' ? 600 : 500,
                border: viewMode === 'grid' ? '1px solid var(--card-border)' : '1px solid transparent',
                backgroundColor: viewMode === 'grid' ? 'var(--card-bg)' : 'transparent',
                color: viewMode === 'grid' ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: viewMode === 'grid' ? '0 2px 6px rgba(0, 0, 0, 0.1)' : 'none',
              }}
              title="Grid View"
              aria-label="Grid View"
            >
              <LayoutGrid size={15} />
              <span>Grid</span>
            </button>
            <button
              type="button"
              className="history-view-toggle-btn"
              onClick={() => handleViewModeChange('list')}
              style={{
                fontWeight: viewMode === 'list' ? 600 : 500,
                border: viewMode === 'list' ? '1px solid var(--card-border)' : '1px solid transparent',
                backgroundColor: viewMode === 'list' ? 'var(--card-bg)' : 'transparent',
                color: viewMode === 'list' ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: viewMode === 'list' ? '0 2px 6px rgba(0, 0, 0, 0.1)' : 'none',
              }}
              title="List View"
              aria-label="List View"
            >
              <List size={15} />
              <span>List</span>
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-secondary)' }}>
          <Sparkles className="animate-spin" size={32} style={{ marginBottom: '1rem', color: 'var(--accent-primary)' }} />
          <p style={{ fontSize: '0.95rem' }}>Loading recent CV generations from Supabase...</p>
        </div>
      ) : generations.length === 0 ? (
        <LiquidCard variant="glass" padding="lg" style={{ textAlign: 'center', padding: '3.5rem 2rem' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'var(--bg-secondary)',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem auto'
          }}>
            <History size={28} />
          </div>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', color: 'var(--text-primary)', fontWeight: 700 }}>
            No Generations Found
          </h3>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto' }}>
            When you optimize a CV using target job descriptions, your top 5 customized versions will automatically appear here for instant preview and PDF export.
          </p>
        </LiquidCard>
      ) : viewMode === 'grid' ? (
        <div className="history-grid-container">
          {generations.map((gen, idx) => {
            const ats = gen.ats_score || 88;
            const scoreColor = ats >= 85 ? '#10b981' : ats >= 70 ? '#f59e0b' : '#ef4444';

            return (
              <LiquidCard
                key={gen.id || idx}
                variant="glass"
                padding="md"
                className="entrance-fade"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderRadius: '20px',
                  border: '1px solid var(--card-border)',
                  background: 'var(--card-bg)',
                  transition: 'transform 0.25s ease, box-shadow 0.25s ease'
                }}
              >
                <div>
                  {/* Top Bar: Index & ATS Score */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
                      Generation #{generations.length - idx}
                    </span>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.25rem 0.65rem',
                      borderRadius: '20px',
                      background: `${scoreColor}15`,
                      border: `1px solid ${scoreColor}40`,
                      color: scoreColor,
                      fontSize: '0.78rem',
                      fontWeight: 700
                    }}>
                      <ShieldCheck size={14} />
                      <span>{ats}% ATS Match</span>
                    </div>
                  </div>

                  {/* 2-Line JD Snippet */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <h4 style={{ margin: '0 0 0.35rem 0', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Target Job Profile
                    </h4>
                    <p style={{
                      margin: 0,
                      fontSize: '0.88rem',
                      color: 'var(--text-primary)',
                      lineHeight: 1.5,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      fontWeight: 500
                    }}>
                      "{getJDSnippet(gen.job_description)}"
                    </p>
                  </div>

                  {/* Metadata Row: Date & Model */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
                      <span>{formatDate(gen.created_at)}</span>
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.65rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid var(--card-border)'
                }}>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => onSelectGeneration(gen)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--card-border)',
                      color: 'var(--text-primary)',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '10px'
                    }}
                  >
                    <Eye size={15} />
                    <span>Edit / Preview</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-glowing"
                    disabled={downloadingId === gen.id}
                    onClick={() => handleDownloadPDF(gen)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                      color: '#ffffff',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '10px',
                      border: 'none'
                    }}
                  >
                    <Download size={15} />
                    <span>{downloadingId === gen.id ? 'Exporting...' : 'PDF'}</span>
                  </button>
                </div>
              </LiquidCard>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="history-list-container">
          {generations.map((gen, idx) => {
            const ats = gen.ats_score || 88;
            const scoreColor = ats >= 85 ? '#10b981' : ats >= 70 ? '#f59e0b' : '#ef4444';

            return (
              <LiquidCard
                key={gen.id || idx}
                variant="glass"
                padding="sm"
                className="entrance-fade history-list-row"
                style={{
                  borderRadius: '16px',
                  border: '1px solid var(--card-border)',
                  background: 'var(--card-bg)'
                }}
              >
                <div className="history-list-row-inner">
                  {/* Left: Metadata & Job Profile */}
                  <div className="history-list-main-info">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
                        Generation #{generations.length - idx}
                      </span>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '20px',
                        background: `${scoreColor}15`,
                        border: `1px solid ${scoreColor}40`,
                        color: scoreColor,
                        fontSize: '0.75rem',
                        fontWeight: 700
                      }}>
                        <ShieldCheck size={13} />
                        <span>{ats}% ATS Match</span>
                      </div>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
                        <span>{formatDate(gen.created_at)}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.45rem', minWidth: 0, width: '100%' }}>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        flexShrink: 0
                      }}>
                        Target:
                      </span>
                      <p className="history-list-target-text">
                        "{getJDSnippet(gen.job_description)}"
                      </p>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="history-list-actions">
                    <button
                      type="button"
                      className="btn"
                      onClick={() => onSelectGeneration(gen)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--card-border)',
                        color: 'var(--text-primary)',
                        padding: '0.55rem 0.95rem',
                        borderRadius: '10px'
                      }}
                    >
                      <Eye size={15} />
                      <span>Edit / Preview</span>
                    </button>

                    <button
                      type="button"
                      className="btn btn-glowing"
                      disabled={downloadingId === gen.id}
                      onClick={() => handleDownloadPDF(gen)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                        color: '#ffffff',
                        padding: '0.55rem 0.95rem',
                        borderRadius: '10px',
                        border: 'none'
                      }}
                    >
                      <Download size={15} />
                      <span>{downloadingId === gen.id ? 'Exporting...' : 'PDF'}</span>
                    </button>
                  </div>
                </div>
              </LiquidCard>
            );
          })}
        </div>
      )}
    </div>
  );
};
