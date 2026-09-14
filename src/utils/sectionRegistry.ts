// ═══════════════════════════════════════════════════════════════════════════════
// Section Registry — Maps section IDs to metadata, labels, icons
// ═══════════════════════════════════════════════════════════════════════════════

import type { SectionId } from '../types/cvBuilder';
import {
  FileText, Briefcase, GraduationCap, Cpu, Code, Award,
  Globe, Heart, BookOpen, Users, Star, Shield, Sparkles
} from 'lucide-react';
import type { ElementType } from 'react';

export interface SectionDefinition {
  id: SectionId;
  label: string;
  description: string;
  icon: ElementType;
  iconName: string;
  /** Sections that can have multiple entries (experience, education, etc.) */
  isListSection: boolean;
  /** Can be added by the "Add Section" panel */
  isAddable: boolean;
  /** Always present (summary is special — content not list-based) */
  alwaysPresent?: boolean;
  /** Category for the Add Section panel */
  category: 'essential' | 'professional' | 'personal' | 'other';
}

/**
 * Master registry of all built-in section definitions.
 * Custom sections are not included here — they're stored in cv.customSections.
 */
export const SECTION_DEFINITIONS: Record<string, SectionDefinition> = {
  summary: {
    id: 'summary',
    label: 'Summary / Profile',
    description: 'Professional summary or objective statement',
    icon: FileText,
    iconName: 'fileText',
    isListSection: false,
    isAddable: true,
    alwaysPresent: false,
    category: 'essential',
  },
  experience: {
    id: 'experience',
    label: 'Work Experience',
    description: 'Professional work history and achievements',
    icon: Briefcase,
    iconName: 'briefcase',
    isListSection: true,
    isAddable: true,
    category: 'essential',
  },
  education: {
    id: 'education',
    label: 'Education',
    description: 'Academic degrees and qualifications',
    icon: GraduationCap,
    iconName: 'graduation',
    isListSection: true,
    isAddable: true,
    category: 'essential',
  },
  skills: {
    id: 'skills',
    label: 'Skills',
    description: 'Technical and professional skills',
    icon: Cpu,
    iconName: 'cpu',
    isListSection: true,
    isAddable: true,
    category: 'essential',
  },
  projects: {
    id: 'projects',
    label: 'Projects',
    description: 'Personal, open-source, or professional projects',
    icon: Code,
    iconName: 'code',
    isListSection: true,
    isAddable: true,
    category: 'professional',
  },
  certifications: {
    id: 'certifications',
    label: 'Certifications',
    description: 'Professional certifications and licenses',
    icon: Shield,
    iconName: 'shield',
    isListSection: true,
    isAddable: true,
    category: 'professional',
  },
  languages: {
    id: 'languages',
    label: 'Languages',
    description: 'Spoken and written language proficiencies',
    icon: Globe,
    iconName: 'globe',
    isListSection: true,
    isAddable: true,
    category: 'personal',
  },
  awards: {
    id: 'awards',
    label: 'Awards & Achievements',
    description: 'Honors, awards, and notable achievements',
    icon: Award,
    iconName: 'award',
    isListSection: true,
    isAddable: true,
    category: 'professional',
  },
  volunteer: {
    id: 'volunteer',
    label: 'Volunteer Experience',
    description: 'Community service and volunteer work',
    icon: Heart,
    iconName: 'heart',
    isListSection: true,
    isAddable: true,
    category: 'personal',
  },
  publications: {
    id: 'publications',
    label: 'Publications',
    description: 'Published papers, articles, and books',
    icon: BookOpen,
    iconName: 'book',
    isListSection: true,
    isAddable: true,
    category: 'other',
  },
  interests: {
    id: 'interests',
    label: 'Interests',
    description: 'Personal interests and hobbies',
    icon: Star,
    iconName: 'sparkles',
    isListSection: true,
    isAddable: true,
    category: 'personal',
  },
  references: {
    id: 'references',
    label: 'References',
    description: 'Professional references and recommendations',
    icon: Users,
    iconName: 'users',
    isListSection: true,
    isAddable: true,
    category: 'other',
  },
};

/** Get the definition for a section ID (returns a generic one for custom sections) */
export function getSectionDef(sectionId: SectionId): SectionDefinition {
  if (SECTION_DEFINITIONS[sectionId]) {
    return SECTION_DEFINITIONS[sectionId];
  }

  // Custom section fallback
  return {
    id: sectionId,
    label: 'Custom Section',
    description: 'User-created custom section',
    icon: Sparkles,
    iconName: 'sparkles',
    isListSection: true,
    isAddable: false,
    category: 'other',
  };
}

/** Get all addable section definitions grouped by category */
export function getAddableSections(): { category: string; sections: SectionDefinition[] }[] {
  const all = Object.values(SECTION_DEFINITIONS).filter(s => s.isAddable);
  const categories = [
    { category: 'Essential', sections: all.filter(s => s.category === 'essential') },
    { category: 'Professional', sections: all.filter(s => s.category === 'professional') },
    { category: 'Personal', sections: all.filter(s => s.category === 'personal') },
    { category: 'Other', sections: all.filter(s => s.category === 'other') },
  ];
  return categories.filter(c => c.sections.length > 0);
}

/**
 * Check if a section has any content (used to determine if it should show in preview).
 * Returns true if the section has at least one visible item with meaningful content.
 */
export function sectionHasContent(cv: any, sectionId: SectionId): boolean {
  switch (sectionId) {
    case 'summary':
      return cv.summary?.visible && !!cv.summary?.content?.trim();
    case 'experience':
      return Array.isArray(cv.experience) && cv.experience.some((e: any) => e.visible);
    case 'education':
      return Array.isArray(cv.education) && cv.education.some((e: any) => e.visible);
    case 'skills':
      return Array.isArray(cv.skills) && cv.skills.some((s: any) => s.visible && s.skills?.length > 0);
    case 'projects':
      return Array.isArray(cv.projects) && cv.projects.some((p: any) => p.visible);
    case 'certifications':
      return Array.isArray(cv.certifications) && cv.certifications.some((c: any) => c.visible);
    case 'languages':
      return Array.isArray(cv.languages) && cv.languages.some((l: any) => l.visible);
    case 'awards':
      return Array.isArray(cv.awards) && cv.awards.some((a: any) => a.visible);
    case 'volunteer':
      return Array.isArray(cv.volunteer) && cv.volunteer.some((v: any) => v.visible);
    case 'publications':
      return Array.isArray(cv.publications) && cv.publications.some((p: any) => p.visible);
    case 'interests':
      return Array.isArray(cv.interests) && cv.interests.some((i: any) => i.visible);
    case 'references':
      return Array.isArray(cv.references) && cv.references.some((r: any) => r.visible);
    default:
      // Custom section
      if (sectionId.startsWith('custom-')) {
        const cs = cv.customSections?.find((s: any) => s.id === sectionId);
        return cs?.visible && cs?.items?.some((i: any) => i.visible);
      }
      return false;
  }
}
