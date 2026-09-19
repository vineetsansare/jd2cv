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
  const [pageCount, setPageCount] = useState<number>(1);
  const sheetRef = useRef<HTMLDivElement>(null);

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

  // Measure content height and calculate exact A4 page count
  useEffect(() => {
    const measurePages = () => {
      if (sheetRef.current) {
        const docEl = sheetRef.current.querySelector('.cv-a4-document') as HTMLElement;
        if (docEl) {
          let maxBottom = 0;
          const children = Array.from(docEl.children) as HTMLElement[];
          for (const child of children) {
            const bottom = child.offsetTop + child.offsetHeight;
            if (bottom > maxBottom) maxBottom = bottom;
          }
          const computedPaddingBottom = parseFloat(window.getComputedStyle(docEl).paddingBottom) || 0;
          const totalHeight = Math.max(maxBottom + computedPaddingBottom, docEl.scrollHeight);
          const pages = Math.max(1, Math.ceil(totalHeight / A4_HEIGHT));
          setPageCount(pages);
        }
      }
    };

    measurePages();
    const timer = setTimeout(measurePages, 120);

    const ro = new ResizeObserver(() => {
      measurePages();
    });

    if (sheetRef.current) {
      ro.observe(sheetRef.current);
    }

    return () => {
      clearTimeout(timer);
      ro.disconnect();
    };
  }, [cv]);

  // Compute auto-scale to fit 100% of the container width cleanly
  const autoScale = containerWidth > 0 
    ? Math.min(Math.max((containerWidth - 32) / A4_WIDTH, 0.35), 1.05) 
    : 0.65;

  const currentScale = manualZoom !== null ? manualZoom : autoScale;

  const zoomIn = () => setManualZoom(Math.min(currentScale + 0.1, 1.4));
  const zoomOut = () => setManualZoom(Math.max(currentScale - 0.1, 0.35));
  const resetZoom = () => setManualZoom(null); // Snaps back to Auto-Fit

  const currentSheetHeight = pageCount * A4_HEIGHT;

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
          <span style={{ fontSize: '10px', background: 'rgba(99,102,241,0.12)', color: '#6366f1', padding: '1px 7px', borderRadius: '4px', fontWeight: 700 }}>
            {pageCount} {pageCount === 1 ? 'Page' : 'Pages'}
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
          padding: '1.25rem 0.75rem 2rem 0.75rem',
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
            height: `${Math.round(currentSheetHeight * currentScale)}px`,
            minHeight: `${Math.round(currentSheetHeight * currentScale)}px`,
            position: 'relative',
            flexShrink: 0,
            margin: '0 auto 1.5rem auto'
          }}
        >
          {/* Inner 794px A4 Sheet transformed from top-left */}
          <div 
            id="cv-live-a4-sheet"
            ref={sheetRef}
            className="cv-a4-sheet-container"
            style={{
              width: `${A4_WIDTH}px`,
              minHeight: `${currentSheetHeight}px`,
              height: `${currentSheetHeight}px`,
              transform: `scale(${currentScale})`,
              transformOrigin: 'top left',
              boxShadow: '0 12px 36px rgba(0,0,0,0.25)',
              borderRadius: '4px',
              background: '#ffffff',
              boxSizing: 'border-box',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Visual Page Break Guides */}
            {pageCount > 1 && Array.from({ length: pageCount - 1 }).map((_, idx) => (
              <div
                key={idx}
                className="page-break-guide no-print"
                style={{
                  position: 'absolute',
                  top: `${(idx + 1) * A4_HEIGHT}px`,
                  left: 0,
                  right: 0,
                  height: '1px',
                  borderTop: '2px dashed rgba(100, 116, 139, 0.5)',
                  zIndex: 40,
                  pointerEvents: 'none',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center'
                }}
              >
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    background: '#334155',
                    color: '#ffffff',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    marginTop: '-10px',
                    marginRight: '12px',
                    letterSpacing: '0.05em',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.18)'
                  }}
                >
                  Page {idx + 1} / Page {idx + 2} Break
                </span>
              </div>
            ))}

            <TemplateRenderer cv={cv} />
          </div>
        </div>
      </div>
    </div>
  );
};
