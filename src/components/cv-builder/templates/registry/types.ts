import type { FC } from 'react';
import type { StructuredCV, CVThemeSettings, TemplateId, LayoutDensity } from '../../../../types/cvBuilder';

export type TemplateCategory = 'ATS-Optimized' | 'Modern' | 'Professional' | 'Minimalist' | 'Creative';

export interface TemplateFeatureSupport {
  photo: boolean;
  sidebarPosition: 'left' | 'right' | 'none';
  columnCount: 1 | 2;
  skillStyles: Array<'pills' | 'boxed' | 'comma' | 'list'>;
  customizableHeadingStyles: boolean;
}

export interface DefaultThemeSettings extends Partial<CVThemeSettings> {
  defaultAccent: string;
  defaultFont: string;
  defaultSpacing: LayoutDensity;
  defaultLineHeight: 'tight' | 'normal' | 'relaxed';
}

export interface TemplateProps {
  cv: StructuredCV;
}

export interface CVTemplateDefinition {
  id: TemplateId;
  name: string;
  subtitle: string;
  description: string;
  category: TemplateCategory;
  thumbnailIcon?: string;
  isAtsOptimized: boolean;
  atsScoreRating: number; // e.g. 95, 100
  bestFor: string;
  
  // The React Renderer component
  Renderer: FC<TemplateProps>;
  
  defaultThemeSettings: DefaultThemeSettings;
  features: TemplateFeatureSupport;
}
