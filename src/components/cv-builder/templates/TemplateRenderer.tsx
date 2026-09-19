import React from 'react';
import type { StructuredCV } from '../../../types/cvBuilder';
import { TemplateRegistry } from './registry/TemplateRegistry';
import './registry/initTemplates';

interface TemplateProps {
  cv: StructuredCV;
}

export const TemplateRenderer: React.FC<TemplateProps> = ({ cv }) => {
  const templateId = cv.theme?.templateId || 'classic-ats';
  const templateDefinition = TemplateRegistry.getTemplate(templateId);

  if (!templateDefinition) {
    const fallback = TemplateRegistry.getDefaultTemplate();
    const FallbackRenderer = fallback.Renderer;
    return <FallbackRenderer cv={cv} />;
  }

  const Renderer = templateDefinition.Renderer;
  return <Renderer cv={cv} />;
};
