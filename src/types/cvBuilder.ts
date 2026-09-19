export type LayoutDensity = 'compact' | 'standard' | 'spacious';
export type PageFormat = 'a4' | 'letter';
export type AvatarShape = 'circle' | 'rounded' | 'square';
export type TextAlignment = 'left' | 'center' | 'right' | 'justify';
export type SectionHeadingStyle = 'underline' | 'border-left' | 'banner' | 'centered' | 'minimal';
export type HeaderAlignment = 'left' | 'center';
export type DatePlacement = 'right' | 'left-rail' | 'split';
export type SkillStyle = 'pills' | 'boxed' | 'comma' | 'list';

export type TemplateId = 
  | 'classic-ats'
  | 'modern-timeline' 
  | 'split-sidebar' 
  | 'swiss-minimalist'
  // Backward-compatibility aliases
  | 'tech-linear' 
  | 'classic-serif' 
  | 'compact-grid';

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

export interface SkillCategoryItem {
  id: string;
  categoryName: string;
  skills: string[];
  visible: boolean;
}

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

export interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  date: string;
  url?: string;
  visible: boolean;
}

export interface SectionMeta {
  title?: string;
  icon?: string;
  showIcon?: boolean;
  alignment?: TextAlignment;
}

export interface AccentTargets {
  name?: boolean;
  jobTitle?: boolean;
  headings?: boolean;
  lines?: boolean;
  icons?: boolean;
  badges?: boolean;
}

export interface CVThemeSettings {
  templateId: TemplateId;
  accentColor: string;
  fontFamily: 'Plus Jakarta Sans' | 'Inter' | 'Merriweather' | 'Roboto' | 'JetBrains Mono' | string;
  fontSize: LayoutDensity;
  baseFontSizePt?: number;
  nameSizeOffset?: number;
  headingSizeOffset?: number;
  lineHeight: 'tight' | 'normal' | 'relaxed';
  pageMargin: 'compact' | 'standard' | 'spacious';
  elementSpacing?: 'compact' | 'standard' | 'spacious';
  sectionHeadingStyle?: SectionHeadingStyle;
  headerAlignment?: HeaderAlignment;
  skillStyle?: SkillStyle;
  showIcons: boolean;
  showPhoto?: boolean;
  photoShape?: AvatarShape;
  applyAccentTo?: AccentTargets;
}

export interface StructuredCV {
  id: string;
  title: string;
  updatedAt: string;
  basics: ResumeBasics;
  summary: {
    title: string;
    content: string;
    visible: boolean;
    icon?: string;
    showIcon?: boolean;
    alignment?: TextAlignment;
  };
  experienceMeta?: SectionMeta;
  experience: WorkExperienceItem[];
  educationMeta?: SectionMeta;
  education: EducationItem[];
  skillsMeta?: SectionMeta;
  skills: SkillCategoryItem[];
  projectsMeta?: SectionMeta;
  projects: ProjectItem[];
  certifications: CertificationItem[];
  customSections: any[];
  theme: CVThemeSettings;
}
