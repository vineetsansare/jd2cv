export type LayoutDensity = 'compact' | 'standard' | 'spacious';
export type PageFormat = 'a4' | 'letter';
export type AvatarShape = 'circle' | 'rounded' | 'square';
export type TemplateId = 
  | 'modern-timeline' 
  | 'classic-ats' 
  | 'tech-linear' 
  | 'classic-serif' 
  | 'split-sidebar' 
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
}

export interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  date: string;
  url?: string;
  visible: boolean;
}

export interface CustomSectionItem {
  id: string;
  title: string;
  subtitle?: string;
  date?: string;
  location?: string;
  bullets: string[];
  visible: boolean;
}

export interface CustomSection {
  id: string;
  sectionTitle: string;
  items: CustomSectionItem[];
  visible: boolean;
}

export interface CVThemeSettings {
  templateId: TemplateId;
  accentColor: string;
  fontFamily: 'Plus Jakarta Sans' | 'Inter' | 'Merriweather' | 'Roboto' | 'JetBrains Mono';
  fontSize: LayoutDensity; // 'compact' | 'standard' | 'spacious'
  lineHeight: 'tight' | 'normal' | 'relaxed';
  pageMargin: 'compact' | 'standard' | 'spacious';
  showIcons: boolean;
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
  };
  experience: WorkExperienceItem[];
  education: EducationItem[];
  skills: SkillCategoryItem[];
  projects: ProjectItem[];
  certifications: CertificationItem[];
  customSections: CustomSection[];
  theme: CVThemeSettings;
}
