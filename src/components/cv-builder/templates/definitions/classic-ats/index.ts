import type { CVTemplateDefinition } from '../../registry/types';
import { ClassicAtsRenderer } from './ClassicAtsRenderer';

export const ClassicAtsTemplate: CVTemplateDefinition = {
  id: 'classic-ats',
  name: 'Executive Corporate',
  subtitle: 'Classic Single-Column ATS',
  description: 'Clean single-column layout with right-aligned dates, horizontal section dividers, and pure ATS compatibility. The gold standard for corporate, finance, legal, and executive roles.',
  category: 'ATS-Optimized',
  thumbnailIcon: 'FileText',
  isAtsOptimized: true,
  atsScoreRating: 100,
  bestFor: 'Corporate, Finance, Legal, Executives, Traditional Tech',
  Renderer: ClassicAtsRenderer,
  defaultThemeSettings: {
    defaultAccent: '#334155',
    defaultFont: 'Merriweather',
    defaultSpacing: 'standard',
    defaultLineHeight: 'normal'
  },
  features: {
    photo: false,
    sidebarPosition: 'none',
    columnCount: 1,
    skillStyles: ['comma', 'boxed', 'pills'],
    customizableHeadingStyles: true
  }
};
