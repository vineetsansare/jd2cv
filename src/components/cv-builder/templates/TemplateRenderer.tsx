import React, { Suspense } from 'react';
import type { StructuredCV } from '../../../types/cvBuilder';
import { getTemplate } from './templateRegistry';

interface TemplateProps {
  cv: StructuredCV;
}

/**
 * TemplateRenderer — Resolves the active template from the registry
 * and renders it with Suspense for lazy-loaded template components.
 * 
 * This is the ONLY bridge between the data model and presentation.
 * Templates are swapped instantly without losing any resume content.
 */
export const TemplateRenderer: React.FC<TemplateProps> = ({ cv }) => {
  const templateDef = getTemplate(cv.theme.templateId || 'modern');
  const TemplateComponent = templateDef.Component;

  return (
    <Suspense fallback={
      <div style={{
        width: '100%',
        minHeight: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter, sans-serif',
        color: '#94a3b8',
        fontSize: '0.85rem',
      }}>
        Loading template…
      </div>
    }>
      <TemplateComponent cv={cv} />
    </Suspense>
  );
};
