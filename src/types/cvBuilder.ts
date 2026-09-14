// ═══════════════════════════════════════════════════════════════════════════════
// Canonical Resume Data Model — Content is independent from presentation
// ═══════════════════════════════════════════════════════════════════════════════

// ── Shared Enums & Utility Types ─────────────────────────────────────────────

export type LayoutDensity = 'compact' | 'standard' | 'spacious';
export type PageFormat = 'a4' | 'letter';
export type AvatarShape = 'circle' | 'rounded' | 'square';
export type TextAlignment = 'left' | 'center' | 'right' | 'justify';

/**
 * Template identifiers — each maps to an independent template component
 * that consumes the same StructuredCV data model.
 */
export type TemplateId =
  | 'modern'
  | 'classic'
  | 'minimal'
  | 'executive'
  | 'tech'
  | 'two-column';

/** Legacy IDs for backward-compatible data migration */
export type LegacyTemplateId =
  | 'modern-timeline'
  | 'classic-ats'
  | 'tech-linear'
  | 'classic-serif'
  | 'split-sidebar'
  | 'compact-grid';

/** Migrate old template IDs to new canonical IDs */
export function migrateTemplateId(id: string): TemplateId {
  const map: Record<string, TemplateId> = {
    'modern-timeline': 'modern',
    'classic-ats': 'classic',
    'tech-linear': 'tech',
    'classic-serif': 'executive',
    'split-sidebar': 'two-column',
    'compact-grid': 'minimal',
  };
  return map[id] ?? (id as TemplateId) ?? 'modern';
}

/**
 * Section identifiers — used in sectionOrder for drag/drop reordering.
 * 'header' is special and always rendered at top (not reorderable).
 */
export type SectionId =
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'certifications'
  | 'languages'
  | 'awards'
  | 'volunteer'
  | 'publications'
  | 'interests'
  | 'references'
  | string; // custom section IDs like 'custom-abc123'

// ── Section Meta (shared across all sections) ────────────────────────────────

export interface SectionMeta {
  title?: string;
  icon?: string;
  showIcon?: boolean;
  alignment?: TextAlignment;
  visible?: boolean;
}

// ── Header / Basics ──────────────────────────────────────────────────────────

export interface ResumeProfileLink {
  id: string;
  network: string; // 'LinkedIn', 'GitHub', 'Portfolio', 'Twitter', 'Custom'
  username: string;
  url: string;
}

export interface ResumeBasics {
  fullName: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  website?: string;
  avatarUrl?: string;
  showAvatar: boolean;
  avatarShape: AvatarShape;
  links: ResumeProfileLink[];
}

// ── Experience ───────────────────────────────────────────────────────────────

export interface WorkExperienceItem {
  id: string;
  role: string;
  company: string;
  location?: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  bullets: string[];
  visible: boolean;
  alignment?: TextAlignment;
}

// ── Education ────────────────────────────────────────────────────────────────

export interface EducationItem {
  id: string;
  degree: string;
  institution: string;
  location?: string;
  startDate?: string;
  endDate: string;
  score?: string; // GPA or honors
  visible: boolean;
  alignment?: TextAlignment;
}

// ── Skills ───────────────────────────────────────────────────────────────────

export interface SkillCategoryItem {
  id: string;
  categoryName: string;
  skills: string[];
  visible: boolean;
}

// ── Projects ─────────────────────────────────────────────────────────────────

export interface ProjectItem {
  id: string;
  title: string;
  subtitle?: string;
  url?: string;
  githubUrl?: string;
  startDate?: string;
  endDate?: string;
  bullets: string[];
  technologies: string[];
  visible: boolean;
  alignment?: TextAlignment;
}

// ── Certifications ───────────────────────────────────────────────────────────

export interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  date: string;
  url?: string;
  visible: boolean;
}

// ── Languages ────────────────────────────────────────────────────────────────

export interface LanguageItem {
  id: string;
  language: string;
  fluency: 'Native' | 'Fluent' | 'Advanced' | 'Intermediate' | 'Basic' | string;
  visible: boolean;
}

// ── Awards / Achievements ────────────────────────────────────────────────────

export interface AwardItem {
  id: string;
  title: string;
  awarder: string;
  date: string;
  summary?: string;
  url?: string;
  visible: boolean;
}

// ── Volunteer Experience ─────────────────────────────────────────────────────

export interface VolunteerItem {
  id: string;
  role: string;
  organization: string;
  location?: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  bullets: string[];
  visible: boolean;
  alignment?: TextAlignment;
}

// ── Publications ─────────────────────────────────────────────────────────────

export interface PublicationItem {
  id: string;
  title: string;
  publisher: string;
  date: string;
  url?: string;
  summary?: string;
  visible: boolean;
}

// ── Interests ────────────────────────────────────────────────────────────────

export interface InterestItem {
  id: string;
  name: string;
  keywords: string[];
  visible: boolean;
}

// ── References ───────────────────────────────────────────────────────────────

export interface ReferenceItem {
  id: string;
  name: string;
  title: string;
  company: string;
  email?: string;
  phone?: string;
  relationship?: string;
  visible: boolean;
}

// ── Custom Sections ──────────────────────────────────────────────────────────

export interface CustomSectionItem {
  id: string;
  title: string;
  subtitle?: string;
  date?: string;
  location?: string;
  url?: string;
  bullets: string[];
  visible: boolean;
  alignment?: TextAlignment;
}

export interface CustomSection {
  id: string;                  // e.g. 'custom-abc123'
  sectionTitle: string;        // Display name
  icon?: string;
  showIcon?: boolean;
  items: CustomSectionItem[];
  visible: boolean;
}

// ── Theme / Presentation Settings ────────────────────────────────────────────

export interface CVThemeSettings {
  templateId: TemplateId;
  accentColor: string;
  fontFamily: 'Plus Jakarta Sans' | 'Inter' | 'Merriweather' | 'Roboto' | 'JetBrains Mono' | 'Georgia' | 'Lora' | string;
  fontSize: LayoutDensity;
  lineHeight: 'tight' | 'normal' | 'relaxed';
  pageMargin: 'compact' | 'standard' | 'spacious';
  sectionSpacing: 'compact' | 'standard' | 'spacious';
  showIcons: boolean;
  headingStyle: 'uppercase' | 'capitalize' | 'normal';
}

// ── Root Data Model ──────────────────────────────────────────────────────────

/**
 * The canonical Resume data model.
 * 
 * KEY PRINCIPLE: Content is completely independent from presentation.
 * Templates consume this data model — they never store their own content.
 * `sectionOrder` controls the order sections appear in (user can drag/drop).
 * `theme` controls presentation only (template, colors, typography, spacing).
 */
export interface StructuredCV {
  id: string;
  title: string;
  updatedAt: string;

  // ── Always-present sections ───────────────────────────────────────────
  basics: ResumeBasics;
  summary: {
    title: string;
    content: string;
    visible: boolean;
    icon?: string;
    showIcon?: boolean;
    alignment?: TextAlignment;
  };

  // ── Standard sections ─────────────────────────────────────────────────
  experience: WorkExperienceItem[];
  experienceMeta?: SectionMeta;

  education: EducationItem[];
  educationMeta?: SectionMeta;

  skills: SkillCategoryItem[];
  skillsMeta?: SectionMeta;

  projects: ProjectItem[];
  projectsMeta?: SectionMeta;

  certifications: CertificationItem[];
  certificationsMeta?: SectionMeta;

  languages: LanguageItem[];
  languagesMeta?: SectionMeta;

  awards: AwardItem[];
  awardsMeta?: SectionMeta;

  volunteer: VolunteerItem[];
  volunteerMeta?: SectionMeta;

  publications: PublicationItem[];
  publicationsMeta?: SectionMeta;

  interests: InterestItem[];
  interestsMeta?: SectionMeta;

  references: ReferenceItem[];
  referencesMeta?: SectionMeta;

  // ── User-created sections ─────────────────────────────────────────────
  customSections: CustomSection[];

  // ── Ordering ──────────────────────────────────────────────────────────
  /** Ordered list of section IDs controlling display order.
   *  'header' is implicit and always rendered first.
   *  Custom sections use their id (e.g. 'custom-abc123'). */
  sectionOrder: SectionId[];

  // ── Presentation (independent from content) ───────────────────────────
  theme: CVThemeSettings;
}

// ── Data Migration Helper ────────────────────────────────────────────────────

/** Default section order for new resumes or migrated data */
export const DEFAULT_SECTION_ORDER: SectionId[] = [
  'summary',
  'experience',
  'education',
  'skills',
  'projects',
  'certifications',
];

/** All possible built-in section IDs for the "Add Section" feature */
export const ALL_SECTION_IDS: SectionId[] = [
  'summary',
  'experience',
  'education',
  'skills',
  'projects',
  'certifications',
  'languages',
  'awards',
  'volunteer',
  'publications',
  'interests',
  'references',
];

/**
 * Ensures a StructuredCV object has all required fields,
 * filling in defaults for any missing ones (e.g. from localStorage migration).
 */
export function ensureResumeDefaults(cv: Partial<StructuredCV>): StructuredCV {
  const migrated = { ...cv } as StructuredCV;

  // Migrate legacy template IDs
  if (migrated.theme?.templateId) {
    migrated.theme.templateId = migrateTemplateId(migrated.theme.templateId);
  }

  // Ensure sectionOrder exists
  if (!migrated.sectionOrder || !Array.isArray(migrated.sectionOrder)) {
    migrated.sectionOrder = [...DEFAULT_SECTION_ORDER];
  }

  // Ensure new section arrays exist
  if (!migrated.languages) migrated.languages = [];
  if (!migrated.awards) migrated.awards = [];
  if (!migrated.volunteer) migrated.volunteer = [];
  if (!migrated.publications) migrated.publications = [];
  if (!migrated.interests) migrated.interests = [];
  if (!migrated.references) migrated.references = [];
  if (!migrated.customSections || !Array.isArray(migrated.customSections)) {
    migrated.customSections = [];
  }

  // Ensure theme defaults
  if (!migrated.theme) {
    migrated.theme = {
      templateId: 'modern',
      accentColor: '#1e3a8a',
      fontFamily: 'Plus Jakarta Sans',
      fontSize: 'standard',
      lineHeight: 'normal',
      pageMargin: 'standard',
      sectionSpacing: 'standard',
      showIcons: true,
      headingStyle: 'uppercase',
    };
  }
  if (!migrated.theme.sectionSpacing) migrated.theme.sectionSpacing = 'standard';
  if (!migrated.theme.headingStyle) migrated.theme.headingStyle = 'uppercase';

  return migrated;
}
