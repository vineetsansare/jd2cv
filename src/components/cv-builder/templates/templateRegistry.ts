// ═══════════════════════════════════════════════════════════════════════════════
// Template Registry — Maps template IDs to their components and metadata
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import type { TemplateId, StructuredCV } from '../../../types/cvBuilder';

/** Props every template component receives */
export interface TemplateProps {
  cv: StructuredCV;
}

/** Metadata describing a template for the Design tab */
export interface TemplateDefinition {
  id: TemplateId;
  name: string;
  description: string;
  category: 'professional' | 'creative' | 'technical' | 'academic';
  columns: 1 | 2;
  atsScore: string;
  /** Lazy-loaded component — each template is its own file */
  Component: React.ComponentType<TemplateProps>;
}

// ── Lazy-load template components ────────────────────────────────────────────
const ModernTemplate = React.lazy(() => import('./ModernTemplate'));
const ClassicTemplate = React.lazy(() => import('./ClassicTemplate'));
const MinimalTemplate = React.lazy(() => import('./MinimalTemplate'));
const ExecutiveTemplate = React.lazy(() => import('./ExecutiveTemplate'));
const TechTemplate = React.lazy(() => import('./TechTemplate'));
const TwoColumnTemplate = React.lazy(() => import('./TwoColumnTemplate'));

/** All registered templates */
export const TEMPLATE_REGISTRY: TemplateDefinition[] = [
  {
    id: 'modern',
    name: 'Modern',
    description: 'Clean modern layout with timeline accent and photo support',
    category: 'professional',
    columns: 1,
    atsScore: '98%',
    Component: ModernTemplate,
  },
  {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional single-column ATS-optimized format',
    category: 'professional',
    columns: 1,
    atsScore: '100%',
    Component: ClassicTemplate,
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Ultra-clean with generous whitespace and subtle accents',
    category: 'creative',
    columns: 1,
    atsScore: '99%',
    Component: MinimalTemplate,
  },
  {
    id: 'executive',
    name: 'Executive',
    description: 'Serif typography with refined spacing for senior roles',
    category: 'professional',
    columns: 1,
    atsScore: '100%',
    Component: ExecutiveTemplate,
  },
  {
    id: 'tech',
    name: 'Tech',
    description: 'Monospace accents and tabular alignment for engineering',
    category: 'technical',
    columns: 1,
    atsScore: '99%',
    Component: TechTemplate,
  },
  {
    id: 'two-column',
    name: 'Two Column',
    description: 'Split layout with colored sidebar for skills and details',
    category: 'creative',
    columns: 2,
    atsScore: '95%',
    Component: TwoColumnTemplate,
  },
];

/** Lookup a template by ID */
export function getTemplate(id: TemplateId): TemplateDefinition {
  return TEMPLATE_REGISTRY.find(t => t.id === id) ?? TEMPLATE_REGISTRY[0];
}

/** Get all template definitions */
export function getAllTemplates(): TemplateDefinition[] {
  return TEMPLATE_REGISTRY;
}
