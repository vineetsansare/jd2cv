import type { CVTemplateDefinition } from '../../registry/types';
import { SplitSidebarRenderer } from './SplitSidebarRenderer';

export const SplitSidebarTemplate: CVTemplateDefinition = {
  id: 'split-sidebar',
  name: 'Two-Column Sidebar Pro',
  subtitle: 'Asymmetric 32/68 Split',
  description: 'Two-column design with a tinted left sidebar for contact details, skills, education, and photo, paired with an expansive main column for experience and summary. Space-efficient and highly scannable.',
  category: 'Professional',
  thumbnailIcon: 'Columns',
  isAtsOptimized: true,
  atsScoreRating: 90,
  bestFor: 'Marketing, Sales, HR, Healthcare, Mid-to-Senior Management, International Profiles',
  Renderer: SplitSidebarRenderer,
  defaultThemeSettings: {
    defaultAccent: '#1e293b',
    defaultFont: 'Plus Jakarta Sans',
    defaultSpacing: 'compact',
    defaultLineHeight: 'normal'
  },
  features: {
    photo: true,
    sidebarPosition: 'left',
    columnCount: 2,
    skillStyles: ['boxed', 'pills', 'comma'],
    customizableHeadingStyles: true
  }
};
