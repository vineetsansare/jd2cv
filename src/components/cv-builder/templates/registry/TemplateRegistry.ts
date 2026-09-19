import type { CVTemplateDefinition, TemplateCategory } from './types';
import type { TemplateId } from '../../../../types/cvBuilder';

class TemplateRegistryClass {
  private templates = new Map<string, CVTemplateDefinition>();

  register(template: CVTemplateDefinition): void {
    if (this.templates.has(template.id)) {
      console.warn(`[TemplateRegistry] Template ${template.id} already registered. Updating.`);
    }
    this.templates.set(template.id, template);
  }

  getTemplate(id: TemplateId | string): CVTemplateDefinition | undefined {
    // Direct lookup
    if (this.templates.has(id)) {
      return this.templates.get(id);
    }
    // Backward-compatibility aliases
    if (id === 'tech-linear' || id === 'classic-serif') {
      return this.templates.get('classic-ats') || this.getDefaultTemplate();
    }
    if (id === 'compact-grid') {
      return this.templates.get('swiss-minimalist') || this.getDefaultTemplate();
    }
    return this.getDefaultTemplate();
  }

  getDefaultTemplate(): CVTemplateDefinition {
    // Default to classic-ats or the first registered template
    return this.templates.get('classic-ats') || Array.from(this.templates.values())[0];
  }

  getAllTemplates(): CVTemplateDefinition[] {
    return Array.from(this.templates.values());
  }

  getTemplatesByCategory(category: TemplateCategory): CVTemplateDefinition[] {
    return this.getAllTemplates().filter(t => t.category === category);
  }
}

export const TemplateRegistry = new TemplateRegistryClass();
