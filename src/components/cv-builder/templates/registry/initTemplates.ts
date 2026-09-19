import { TemplateRegistry } from './TemplateRegistry';
import { ClassicAtsTemplate } from '../definitions/classic-ats';
import { ModernTimelineTemplate } from '../definitions/modern-timeline';
import { SplitSidebarTemplate } from '../definitions/split-sidebar';
import { SwissMinimalistTemplate } from '../definitions/swiss-minimalist';

// Register the 4 default core templates
export function initializeTemplateRegistry() {
  TemplateRegistry.register(ClassicAtsTemplate);
  TemplateRegistry.register(ModernTimelineTemplate);
  TemplateRegistry.register(SplitSidebarTemplate);
  TemplateRegistry.register(SwissMinimalistTemplate);
}

// Auto-initialize once on import
initializeTemplateRegistry();
