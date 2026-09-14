import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { StructuredCV } from '../../types/cvBuilder';
import { TemplateRenderer } from './templates/TemplateRenderer';
import { printResumeElement } from '../../utils/printHelper';
import { ZoomIn, ZoomOut, Maximize2, Download, Layers } from 'lucide-react';

interface LivePreviewA4Props {
  cv: StructuredCV;
  onDownloadPdf?: () => void;
}

const A4_WIDTH = 794;
const A4_HEIGHT = 1123; // Exact A4 height at 96 DPI

export const LivePreviewA4: React.FC<LivePreviewA4Props> = ({ cv, onDownloadPdf }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [manualZoom, setManualZoom] = useState<number | null>(null);
  const [pageCount, setPageCount] = useState<number>(1);
  const [showPageBreaks, setShowPageBreaks] = useState<boolean>(true);

  // ResizeObserver on the container to adjust auto-zoom
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

  // Monitor sheet content height to determine actual A4 page count
  useEffect(() => {
    const calculatePages = () => {
      if (sheetRef.current) {
        const scrollH = sheetRef.current.scrollHeight;
        const calculated = Math.max(1, Math.ceil(scrollH / A4_HEIGHT));
        setPageCount(calculated);
      }
    };

    calculatePages();
    const timeout = setTimeout(calculatePages, 200);

    const sheetObserver = new ResizeObserver(() => {
      calculatePages();
    });

    if (sheetRef.current) {
      sheetObserver.observe(sheetRef.current);
    }

    return () => {
      clearTimeout(timeout);
      sheetObserver.disconnect();
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

  const handleExport = useCallback(() => {
    if (onDownloadPdf) {
      onDownloadPdf();
      return;
    }
    if (sheetRef.current) {
      const filenameTitle = `${cv.basics.fullName || 'Candidate'}-${cv.basics.headline || 'Resume'}`;
      printResumeElement(sheetRef.current, filenameTitle);
    }
  }, [cv, onDownloadPdf]);

  // Generate page break positions
  const breakPositions: number[] = [];
  for (let i = 1; i < pageCount; i++) {
    breakPositions.push(i * A4_HEIGHT);
  }

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
            Live A4 Preview
          </span>

          {/* Page count pill */}
          <span 
            style={{ 
              fontSize: '11px', 
              background: pageCount === 1 ? 'rgba(16,185,129,0.12)' : 'rgba(37,99,235,0.12)', 
              color: pageCount === 1 ? '#10b981' : 'var(--accent-primary)', 
              padding: '2px 8px', 
              borderRadius: '999px',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title={pageCount === 1 ? 'Perfect 1-page resume fit' : `Spans across ${pageCount} pages`}
          >
            <span>{pageCount} {pageCount === 1 ? 'Page' : 'Pages'}</span>
            {pageCount === 1 && <span>✓</span>}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          {/* Page breaks toggle */}
          {pageCount > 1 && (
            <button
              type="button"
              onClick={() => setShowPageBreaks(!showPageBreaks)}
              className="btn btn-secondary"
              style={{
                padding: '0.25rem 0.55rem',
                fontSize: '0.73rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                color: showPageBreaks ? 'var(--accent-primary)' : 'var(--text-muted)',
                borderColor: showPageBreaks ? 'var(--accent-primary)' : 'var(--card-border)'
              }}
              title="Toggle page break guide lines"
            >
              <Layers size={13} />
              <span>Breaks</span>
            </button>
          )}

          {/* Zoom Controls */}
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

          <button
            type="button"
            onClick={handleExport}
            className="btn btn-primary"
            style={{ padding: '0.3rem 0.75rem', fontSize: '0.78rem', marginLeft: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <Download size={13} />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Scaled A4 Sheet Scroll Area */}
      <div 
        ref={containerRef}
        style={{
          flexGrow: 1,
          overflowY: 'auto',
          overflowX: 'auto',
          padding: '1.5rem 0.75rem',
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
            minHeight: `${Math.round(A4_HEIGHT * pageCount * currentScale)}px`,
            position: 'relative',
            flexShrink: 0,
            margin: '0 auto'
          }}
        >
          {/* Inner 794px A4 Sheet transformed from top-left */}
          <div 
            id="a4-resume-sheet"
            ref={sheetRef}
            style={{
              width: `${A4_WIDTH}px`,
              minHeight: `${A4_HEIGHT}px`,
              transform: `scale(${currentScale})`,
              transformOrigin: 'top left',
              boxShadow: '0 12px 36px rgba(0,0,0,0.25)',
              borderRadius: '4px',
              background: '#ffffff',
              boxSizing: 'border-box',
              position: 'relative'
            }}
          >
            <TemplateRenderer cv={cv} />

            {/* Visual Page Break Indicators */}
            {showPageBreaks && breakPositions.map((pos, idx) => (
              <div
                key={`break-${idx}`}
                style={{
                  position: 'absolute',
                  top: `${pos}px`,
                  left: 0,
                  right: 0,
                  pointerEvents: 'none',
                  zIndex: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {/* Dashed line */}
                <div 
                  style={{ 
                    position: 'absolute', 
                    left: 0, 
                    right: 0, 
                    height: '2px', 
                    borderTop: '2px dashed #94a3b8',
                    opacity: 0.7
                  }} 
                />
                {/* Page indicator pill */}
                <span
                  style={{
                    position: 'relative',
                    background: '#1e293b',
                    color: '#f8fafc',
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 10px',
                    borderRadius: '999px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}
                >
                  Page {idx + 2} Starts Here
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
