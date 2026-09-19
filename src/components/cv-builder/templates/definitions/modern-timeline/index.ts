import type { CVTemplateDefinition } from '../../registry/types';
import { ModernTimelineRenderer } from './ModernTimelineRenderer';

export const ModernTimelineTemplate: CVTemplateDefinition = {
  id: 'modern-timeline',
  name: 'Tech Architect',
  subtitle: 'Left-Rail Timeline',
  description: 'Asymmetric layout with left-hand date rail, bold accent headings, and pill-shaped tech skill badges. Perfect for software engineers, tech leads, DevOps, and product managers.',
  category: 'Modern',
  thumbnailIcon: 'Cpu',
  isAtsOptimized: true,
  atsScoreRating: 95,
  bestFor: 'Software Engineers, Engineering Managers, DevOps, Product Managers',
  Renderer: ModernTimelineRenderer,
  defaultThemeSettings: {
    defaultAccent: '#2563eb',
    defaultFont: 'Plus Jakarta Sans',
    defaultSpacing: 'standard',
    defaultLineHeight: 'normal'
  },
  features: {
    photo: true,
    sidebarPosition: 'left',
    columnCount: 2,
    skillStyles: ['pills', 'boxed', 'comma'],
    customizableHeadingStyles: true
  }
};
