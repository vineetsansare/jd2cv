import React, { useState, useEffect, useRef } from 'react';
import type { StructuredCV } from '../../types/cvBuilder';
import { TemplateRenderer } from './templates/TemplateRenderer';
import { ZoomIn, ZoomOut, Maximize2, Download } from 'lucide-react';

interface LivePreviewA4Props {
  cv: StructuredCV;
  onDownloadPdf?: () => void;
}

const A4_WIDTH = 794;
const A4_HEIGHT = 1123;

export const LivePreviewA4: React.FC<LivePreviewA4Props> = ({ cv, onDownloadPdf }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [manualZoom, setManualZoom] = useState<number | null>(null);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(entry.contentRect.width);
        }
      }
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateWidth);
      observer.disconnect();
    };
  }, []);

  // Compute auto-scale to fit 100% of the container width cleanly
  const autoScale = containerWidth > 0 
    ? Math.min(Math.max((containerWidth - 32) / A4_WIDTH, 0.35), 1.05) 
    : 0.65;

  const currentScale = manualZoom !== null ? manualZoom : autoScale;

  const zoomIn = () => setManualZoom(Math.min(currentScale + 0.1, 1.4));
  const zoomOut = () => setManualZoom(Math.max(currentScale - 0.1, 0.35));
  const resetZoom = () => setManualZoom(null); // Snaps back to Auto-Fit

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '650px', background: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--card-border)', overflow: 'hidden' }}>
      {/* Top Canvas Bar */}
      <div style={{
        padding: '0.65rem 1rem',
        borderBottom: '1px solid var(--card-border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'var(--card-bg)',
        flexWrap: 'wrap',
        gap: '0.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
          <span>Live A4 Preview</span>
          <span style={{ fontSize: '10px', background: 'rgba(16,185,129,0.12)', color: '#10b981', padding: '1px 6px', borderRadius: '4px' }}>
            Auto-Sync ⚡
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <button
            type="button"
            onClick={zoomOut}
            className="btn btn-secondary"
            style={{ padding: '0.25rem 0.45rem', fontSize: '0.75rem' }}
            title="Zoom Out"
          >
            <ZoomOut size={13} />
          </button>
          
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', minWidth: '42px', textAlign: 'center' }}>
            {Math.round(currentScale * 100)}%
          </span>

          <button
            type="button"
            onClick={zoomIn}
            className="btn btn-secondary"
            style={{ padding: '0.25rem 0.45rem', fontSize: '0.75rem' }}
            title="Zoom In"
          >
            <ZoomIn size={13} />
          </button>

          <button
            type="button"
            onClick={resetZoom}
            className="btn btn-secondary"
            style={{ 
              padding: '0.25rem 0.45rem', 
              fontSize: '0.75rem',
              color: manualZoom === null ? 'var(--accent-primary)' : 'var(--text-muted)',
              borderColor: manualZoom === null ? 'var(--accent-primary)' : 'var(--card-border)'
            }}
            title="Fit to Screen (Auto-Fit)"
          >
            <Maximize2 size={13} />
          </button>

          {onDownloadPdf && (
            <button
              type="button"
              onClick={onDownloadPdf}
              className="btn btn-primary"
              style={{ padding: '0.3rem 0.75rem', fontSize: '0.78rem', marginLeft: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Download size={13} />
              <span>Export PDF</span>
            </button>
          )}
        </div>
      </div>

      {/* Scaled A4 Sheet Scroll Area */}
      <div 
        ref={containerRef}
        style={{
          flexGrow: 1,
          overflowY: 'auto',
          overflowX: 'auto',
          padding: '1.25rem 0.75rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          minHeight: '650px'
        }}
      >
        {/* Outer Scaled Bounding Box matching visual dimensions exactly */}
        <div
          style={{
            width: `${Math.round(A4_WIDTH * currentScale)}px`,
            minHeight: `${Math.round(A4_HEIGHT * currentScale)}px`,
            position: 'relative',
            flexShrink: 0,
            margin: '0 auto'
          }}
        >
          {/* Inner 794px A4 Sheet transformed from top-left */}
          <div 
            style={{
              width: `${A4_WIDTH}px`,
              minHeight: `${A4_HEIGHT}px`,
              transform: `scale(${currentScale})`,
              transformOrigin: 'top left',
              boxShadow: '0 12px 36px rgba(0,0,0,0.25)',
              borderRadius: '4px',
              background: '#ffffff',
              boxSizing: 'border-box'
            }}
          >
            <TemplateRenderer cv={cv} />
          </div>
        </div>
      </div>
    </div>
  );
};
