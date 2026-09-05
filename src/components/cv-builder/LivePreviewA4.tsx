import React, { useState } from 'react';
import type { StructuredCV } from '../../types/cvBuilder';
import { TemplateRenderer } from './templates/TemplateRenderer';
import { ZoomIn, ZoomOut, Maximize2, Download } from 'lucide-react';

interface LivePreviewA4Props {
  cv: StructuredCV;
  onDownloadPdf?: () => void;
}

export const LivePreviewA4: React.FC<LivePreviewA4Props> = ({ cv, onDownloadPdf }) => {
  const [zoom, setZoom] = useState<number>(0.85);

  const zoomIn = () => setZoom(prev => Math.min(prev + 0.15, 1.4));
  const zoomOut = () => setZoom(prev => Math.max(prev - 0.15, 0.5));
  const resetZoom = () => setZoom(0.85);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '600px', background: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--card-border)', overflow: 'hidden' }}>
      {/* Top Canvas Bar */}
      <div style={{
        padding: '0.65rem 1rem',
        borderBottom: '1px solid var(--card-border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'var(--card-bg)'
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
            {Math.round(zoom * 100)}%
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
            style={{ padding: '0.25rem 0.45rem', fontSize: '0.75rem' }}
            title="Fit to Screen"
          >
            <Maximize2 size={13} />
          </button>

          {onDownloadPdf && (
            <button
              type="button"
              onClick={onDownloadPdf}
              className="btn btn-primary"
              style={{ padding: '0.3rem 0.75rem', fontSize: '0.78rem', marginLeft: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Download size={13} />
              <span>Export PDF</span>
            </button>
          )}
        </div>
      </div>

      {/* Scaled A4 Sheet Scroll Area */}
      <div style={{
        flexGrow: 1,
        overflowY: 'auto',
        overflowX: 'auto',
        padding: '2rem 1rem',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start'
      }}>
        <div 
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease-out',
            boxShadow: '0 12px 36px rgba(0,0,0,0.25)',
            borderRadius: '4px',
            width: '794px', // Standard 96 DPI A4 width
            minHeight: '1123px', // Standard 96 DPI A4 height
            background: '#ffffff',
            boxSizing: 'border-box'
          }}
        >
          <TemplateRenderer cv={cv} />
        </div>
      </div>
    </div>
  );
};
