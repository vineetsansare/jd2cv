import type { CVTemplateDefinition } from '../../registry/types';
import { SwissMinimalistRenderer } from './SwissMinimalistRenderer';

export const SwissMinimalistTemplate: CVTemplateDefinition = {
  id: 'swiss-minimalist',
  name: 'Swiss Minimalist',
  subtitle: 'Design-Forward Grid',
  description: 'Ultra-refined typography, generous whitespace, and subtle border accents. Engineered for designers, creative directors, consultants, and modern tech leaders.',
  category: 'Minimalist',
  thumbnailIcon: 'Sparkles',
  isAtsOptimized: true,
  atsScoreRating: 95,
  bestFor: 'Designers, Creatives, Consultants, Front-End Engineers, Founders',
  Renderer: SwissMinimalistRenderer,
  defaultThemeSettings: {
    defaultAccent: '#0f172a',
    defaultFont: 'Inter',
    defaultSpacing: 'spacious',
    defaultLineHeight: 'relaxed'
  },
  features: {
    photo: true,
    sidebarPosition: 'none',
    columnCount: 1,
    skillStyles: ['pills', 'comma', 'boxed'],
    customizableHeadingStyles: true
  }
};
