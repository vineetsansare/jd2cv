import React, { useState, useEffect, useCallback } from 'react';
import type { 
  StructuredCV, ResumeBasics, ProjectItem, CertificationItem, LanguageItem,
  AwardItem, VolunteerItem, PublicationItem, InterestItem, ReferenceItem,
  CustomSection, CVThemeSettings, SectionMeta
} from '../../types/cvBuilder';
import { ensureResumeDefaults } from '../../types/cvBuilder';
import { DEFAULT_CV_DATA, createBlankResume } from '../../utils/defaultCvData';
import { structuredCVToMarkdown } from '../../utils/cvBuilderConverter';
import { printCvDocument, printResumeElement } from '../../utils/printHelper';
import { getSectionDef, SECTION_DEFINITIONS } from '../../utils/sectionRegistry';

// Section editors
import { HeaderSection } from './sections/HeaderSection';
import { SummarySection } from './sections/SummarySection';
import { ExperienceSection } from './sections/ExperienceSection';
import { EducationSection } from './sections/EducationSection';
import { SkillsSection } from './sections/SkillsSection';
import { DesignTab } from './DesignTab';

// Lazy-load new section editors
const ProjectsSection = React.lazy(() => import('./sections/ProjectsSection').then(m => ({ default: m.ProjectsSection })).catch(() => ({ default: () => <div style={{ padding: '1rem', color: 'var(--text-muted)' }}>Projects editor loading...</div> })));
const CertificationsSection = React.lazy(() => import('./sections/CertificationsSection').then(m => ({ default: m.CertificationsSection })).catch(() => ({ default: () => <div style={{ padding: '1rem', color: 'var(--text-muted)' }}>Certifications editor loading...</div> })));
const LanguagesSection = React.lazy(() => import('./sections/LanguagesSection').then(m => ({ default: m.LanguagesSection })).catch(() => ({ default: () => <div style={{ padding: '1rem', color: 'var(--text-muted)' }}>Languages editor loading...</div> })));
const AwardsSection = React.lazy(() => import('./sections/AwardsSection').then(m => ({ default: m.AwardsSection })).catch(() => ({ default: () => <div style={{ padding: '1rem', color: 'var(--text-muted)' }}>Awards editor loading...</div> })));
const VolunteerSection = React.lazy(() => import('./sections/VolunteerSection').then(m => ({ default: m.VolunteerSection })).catch(() => ({ default: () => <div style={{ padding: '1rem', color: 'var(--text-muted)' }}>Volunteer editor loading...</div> })));
const PublicationsSection = React.lazy(() => import('./sections/PublicationsSection').then(m => ({ default: m.PublicationsSection })).catch(() => ({ default: () => <div style={{ padding: '1rem', color: 'var(--text-muted)' }}>Publications editor loading...</div> })));
const InterestsSection = React.lazy(() => import('./sections/InterestsSection').then(m => ({ default: m.InterestsSection })).catch(() => ({ default: () => <div style={{ padding: '1rem', color: 'var(--text-muted)' }}>Interests editor loading...</div> })));
const ReferencesSection = React.lazy(() => import('./sections/ReferencesSection').then(m => ({ default: m.ReferencesSection })).catch(() => ({ default: () => <div style={{ padding: '1rem', color: 'var(--text-muted)' }}>References editor loading...</div> })));
const CustomSectionEditor = React.lazy(() => import('./sections/CustomSection').then(m => ({ default: m.CustomSectionEditor })).catch(() => ({ default: () => <div style={{ padding: '1rem', color: 'var(--text-muted)' }}>Custom section editor loading...</div> })));

import { AddSectionPanel } from './AddSectionPanel';
import { ImportResumeModal } from './ImportResumeModal';
import { ConfirmModal } from '../ui/ConfirmModal';

import { LivePreviewA4 } from './LivePreviewA4';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { 
  User, FileText, Palette, 
  ChevronDown, ChevronUp, Eye, Download, Check, 
  Sparkles, ArrowLeft, Plus, GripVertical, X
} from 'lucide-react';

const LOCAL_STORAGE_KEY_BUILDER = 'jd2cv_builder_draft_v1';

// ── Sortable Section Card ────────────────────────────────────────────────────

interface SortableSectionProps {
  id: string;
  children: React.ReactNode;
}

function SortableSectionWrapper({ id, children }: SortableSectionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative' as const,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div 
        {...listeners}
        style={{
          position: 'absolute',
          left: '-6px',
          top: '50%',
          transform: 'translateY(-50%)',
          cursor: 'grab',
          color: 'var(--text-muted)',
          zIndex: 2,
          padding: '0.5rem 0.15rem',
          display: 'flex',
          alignItems: 'center',
          opacity: 0.5,
        }}
        title="Drag to reorder"
      >
        <GripVertical size={14} />
      </div>
      {children}
    </div>
  );
}

// ── Main Panel ───────────────────────────────────────────────────────────────

interface CVBuilderPanelProps {
  userProfile?: any;
  baseCVs: Array<{ id?: string; name: string; text: string }>;
  onSetAsBaseCV: (markdown: string, filename: string) => Promise<void>;
  theme?: 'light' | 'dark';
}

export const CVBuilderPanel: React.FC<CVBuilderPanelProps> = ({
  baseCVs,
  onSetAsBaseCV
}) => {
  // Load initial draft from localStorage or default
  const [cv, setCv] = useState<StructuredCV>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_BUILDER);
    if (saved) {
      try {
        return ensureResumeDefaults(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse builder draft from storage', e);
      }
    }
    return baseCVs && baseCVs.length > 0 ? DEFAULT_CV_DATA : createBlankResume();
  });

  const [activeSectionTab, setActiveSectionTab] = useState<'content' | 'theme'>('content');
  const [expandedSection, setExpandedSection] = useState<string | null>('header');
  const [saveStatus, setSaveStatus] = useState<string>('Saved');
  const [isMobilePreviewOpen, setIsMobilePreviewOpen] = useState<boolean>(false);
  const [isSyncingBaseCV, setIsSyncingBaseCV] = useState<boolean>(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [showAddSection, setShowAddSection] = useState<boolean>(false);
  const [showNewBlankConfirm, setShowNewBlankConfirm] = useState<boolean>(false);
  const [sectionToRemove, setSectionToRemove] = useState<{ id: string; title: string } | null>(null);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Autosave on change
  useEffect(() => {
    setSaveStatus('Saving...');
    const timer = setTimeout(() => {
      localStorage.setItem(LOCAL_STORAGE_KEY_BUILDER, JSON.stringify(cv));
      setSaveStatus('Saved locally ✓');
    }, 600);
    return () => clearTimeout(timer);
  }, [cv]);

  // ── Section Updaters ─────────────────────────────────────────────────────

  const updateBasics = useCallback((basics: ResumeBasics) => {
    setCv(prev => ({ ...prev, basics, updatedAt: new Date().toISOString() }));
  }, []);

  const updateSummary = useCallback((summary: StructuredCV['summary']) => {
    setCv(prev => ({ ...prev, summary, updatedAt: new Date().toISOString() }));
  }, []);

  const updateSection = useCallback(<T,>(key: string, items: T[], meta?: SectionMeta) => {
    setCv(prev => ({
      ...prev,
      [key]: items,
      ...(meta ? { [`${key}Meta`]: meta } : {}),
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const updateCustomSection = useCallback((updatedSection: CustomSection) => {
    setCv(prev => ({
      ...prev,
      customSections: prev.customSections.map(s => 
        s.id === updatedSection.id ? updatedSection : s
      ),
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const updateTheme = useCallback((theme: CVThemeSettings) => {
    setCv(prev => ({ ...prev, theme, updatedAt: new Date().toISOString() }));
  }, []);

  // ── Section Order Handlers ───────────────────────────────────────────────

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setCv(prev => {
        const oldIndex = prev.sectionOrder.indexOf(active.id as string);
        const newIndex = prev.sectionOrder.indexOf(over.id as string);
        return {
          ...prev,
          sectionOrder: arrayMove(prev.sectionOrder, oldIndex, newIndex),
          updatedAt: new Date().toISOString(),
        };
      });
    }
  }, []);

  const addSection = useCallback((sectionId: string) => {
    setCv(prev => {
      if (prev.sectionOrder.includes(sectionId)) return prev;
      return {
        ...prev,
        sectionOrder: [...prev.sectionOrder, sectionId],
        updatedAt: new Date().toISOString(),
      };
    });
    setShowAddSection(false);
  }, []);

  const addCustomSection = useCallback(() => {
    const id = `custom-${Date.now()}`;
    const newSection: CustomSection = {
      id,
      sectionTitle: 'Custom Section',
      icon: 'sparkles',
      showIcon: true,
      items: [],
      visible: true,
    };
    setCv(prev => ({
      ...prev,
      customSections: [...prev.customSections, newSection],
      sectionOrder: [...prev.sectionOrder, id],
      updatedAt: new Date().toISOString(),
    }));
    setShowAddSection(false);
    setExpandedSection(id);
  }, []);

  const removeSection = useCallback((sectionId: string) => {
    setCv(prev => ({
      ...prev,
      sectionOrder: prev.sectionOrder.filter(s => s !== sectionId),
      customSections: sectionId.startsWith('custom-') 
        ? prev.customSections.filter(s => s.id !== sectionId)
        : prev.customSections,
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  // ── Actions ──────────────────────────────────────────────────────────────

  const handlePublishAsBaseCV = async () => {
    setIsSyncingBaseCV(true);
    try {
      const markdown = structuredCVToMarkdown(cv);
      const filename = `${cv.basics.fullName || 'Candidate'}_Master_Base_Resume.md`;
      await onSetAsBaseCV(markdown, filename);
      alert('Success! Your structured CV has been set as your active Base CV for the AI Optimizer.');
    } catch (err: any) {
      console.error(err);
      alert('Failed to set as Base CV. Please try again.');
    } finally {
      setIsSyncingBaseCV(false);
    }
  };


  const handleImportComplete = async (importedCv: StructuredCV, rawText: string, filename: string) => {
    const finalCv = ensureResumeDefaults(importedCv);
    setCv(finalCv);
    localStorage.setItem(LOCAL_STORAGE_KEY_BUILDER, JSON.stringify(finalCv));
    setSaveStatus(`Imported from ${filename} ✓`);

    // Sync as active Base CV so it appears on Base CV page as well
    try {
      await onSetAsBaseCV(rawText, filename);
    } catch (baseErr) {
      console.warn('Could not sync as Base CV:', baseErr);
    }
  };

  const handleNewBlankResume = () => {
    setShowNewBlankConfirm(true);
  };

  const handleExportPdf = () => {
    const filenameTitle = `${cv.basics.fullName || 'Candidate'}-${cv.basics.headline || 'Resume'}`;
    const sheetElement = document.getElementById('a4-resume-sheet');
    if (sheetElement) {
      printResumeElement(sheetElement, filenameTitle);
      return;
    }
    const markdown = structuredCVToMarkdown(cv);
    printCvDocument(markdown, {
      accentColor: cv.theme.accentColor || '#1e3a8a',
      themeName: cv.theme.templateId || 'modern',
      showPhoto: cv.basics.showAvatar && !!cv.basics.avatarUrl,
      photoUrl: cv.basics.avatarUrl,
      layoutDensity: cv.theme.fontSize === 'compact' ? 'compact' : 'standard'
    }, filenameTitle);
  };

  // ── Section Count Helper ─────────────────────────────────────────────────

  const getSectionSummary = (sectionId: string): string => {
    switch (sectionId) {
      case 'summary': return cv.summary?.visible ? 'Visible' : 'Hidden';
      case 'experience': return `${(cv.experience || []).length} positions`;
      case 'education': return `${(cv.education || []).length} degrees`;
      case 'skills': return `${(cv.skills || []).length} categories`;
      case 'projects': return `${(cv.projects || []).length} projects`;
      case 'certifications': return `${(cv.certifications || []).length} certifications`;
      case 'languages': return `${(cv.languages || []).length} languages`;
      case 'awards': return `${(cv.awards || []).length} awards`;
      case 'volunteer': return `${(cv.volunteer || []).length} entries`;
      case 'publications': return `${(cv.publications || []).length} publications`;
      case 'interests': return `${(cv.interests || []).length} interests`;
      case 'references': return `${(cv.references || []).length} references`;
      default: {
        if (sectionId.startsWith('custom-')) {
          const cs = cv.customSections.find(s => s.id === sectionId);
          return cs ? `${cs.items?.length || 0} items` : '';
        }
        return '';
      }
    }
  };

  const getSectionTitle = (sectionId: string): string => {
    const metaKey = `${sectionId}Meta` as keyof StructuredCV;
    const meta = cv[metaKey] as SectionMeta | undefined;
    if (meta?.title) return meta.title;

    if (sectionId === 'summary') return cv.summary?.title || 'Summary';
    if (sectionId.startsWith('custom-')) {
      const cs = cv.customSections.find(s => s.id === sectionId);
      return cs?.sectionTitle || 'Custom Section';
    }

    const def = SECTION_DEFINITIONS[sectionId];
    return def?.label || sectionId;
  };

  // ── Section Icon Color Map ───────────────────────────────────────────────

  const sectionColors: Record<string, string> = {
    summary: 'rgba(16,185,129,0.1)',
    experience: 'rgba(234,88,12,0.1)',
    education: 'rgba(139,92,246,0.1)',
    skills: 'rgba(6,182,212,0.1)',
    projects: 'rgba(37,99,235,0.1)',
    certifications: 'rgba(234,179,8,0.1)',
    languages: 'rgba(16,185,129,0.1)',
    awards: 'rgba(234,88,12,0.1)',
    volunteer: 'rgba(236,72,153,0.1)',
    publications: 'rgba(139,92,246,0.1)',
    interests: 'rgba(251,146,60,0.1)',
    references: 'rgba(100,116,139,0.1)',
  };

  const sectionIconColors: Record<string, string> = {
    summary: '#10b981',
    experience: '#ea580c',
    education: 'var(--accent-primary)',
    skills: '#06b6d4',
    projects: '#2563eb',
    certifications: '#eab308',
    languages: '#10b981',
    awards: '#ea580c',
    volunteer: '#ec4899',
    publications: '#8b5cf6',
    interests: '#fb923c',
    references: '#64748b',
  };

  // ── Render Section Editor ────────────────────────────────────────────────

  const renderSectionEditor = (sectionId: string) => {
    switch (sectionId) {
      case 'summary':
        return <SummarySection summary={cv.summary} onChange={updateSummary} />;
      case 'experience':
        return <ExperienceSection meta={cv.experienceMeta} experience={cv.experience} onChange={(items, meta) => updateSection('experience', items, meta)} />;
      case 'education':
        return <EducationSection meta={cv.educationMeta} education={cv.education} onChange={(items, meta) => updateSection('education', items, meta)} />;
      case 'skills':
        return <SkillsSection meta={cv.skillsMeta} skills={cv.skills} onChange={(items, meta) => updateSection('skills', items, meta)} />;
      case 'projects':
        return (
          <React.Suspense fallback={<div style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading projects editor...</div>}>
            <ProjectsSection meta={cv.projectsMeta} projects={cv.projects || []} onChange={(items: ProjectItem[], meta?: SectionMeta) => updateSection('projects', items, meta)} />
          </React.Suspense>
        );
      case 'certifications':
        return (
          <React.Suspense fallback={<div style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading...</div>}>
            <CertificationsSection meta={cv.certificationsMeta} certifications={cv.certifications || []} onChange={(items: CertificationItem[], meta?: SectionMeta) => updateSection('certifications', items, meta)} />
          </React.Suspense>
        );
      case 'languages':
        return (
          <React.Suspense fallback={<div style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading...</div>}>
            <LanguagesSection meta={cv.languagesMeta} languages={cv.languages || []} onChange={(items: LanguageItem[], meta?: SectionMeta) => updateSection('languages', items, meta)} />
          </React.Suspense>
        );
      case 'awards':
        return (
          <React.Suspense fallback={<div style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading...</div>}>
            <AwardsSection meta={cv.awardsMeta} awards={cv.awards || []} onChange={(items: AwardItem[], meta?: SectionMeta) => updateSection('awards', items, meta)} />
          </React.Suspense>
        );
      case 'volunteer':
        return (
          <React.Suspense fallback={<div style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading...</div>}>
            <VolunteerSection meta={cv.volunteerMeta} volunteer={cv.volunteer || []} onChange={(items: VolunteerItem[], meta?: SectionMeta) => updateSection('volunteer', items, meta)} />
          </React.Suspense>
        );
      case 'publications':
        return (
          <React.Suspense fallback={<div style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading...</div>}>
            <PublicationsSection meta={cv.publicationsMeta} publications={cv.publications || []} onChange={(items: PublicationItem[], meta?: SectionMeta) => updateSection('publications', items, meta)} />
          </React.Suspense>
        );
      case 'interests':
        return (
          <React.Suspense fallback={<div style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading...</div>}>
            <InterestsSection meta={cv.interestsMeta} interests={cv.interests || []} onChange={(items: InterestItem[], meta?: SectionMeta) => updateSection('interests', items, meta)} />
          </React.Suspense>
        );
      case 'references':
        return (
          <React.Suspense fallback={<div style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading...</div>}>
            <ReferencesSection meta={cv.referencesMeta} references={cv.references || []} onChange={(items: ReferenceItem[], meta?: SectionMeta) => updateSection('references', items, meta)} />
          </React.Suspense>
        );
      default: {
        // Custom sections
        if (sectionId.startsWith('custom-')) {
          const cs = cv.customSections.find(s => s.id === sectionId);
          if (cs) {
            return (
              <React.Suspense fallback={<div style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading...</div>}>
                <CustomSectionEditor section={cs} onChange={updateCustomSection} />
              </React.Suspense>
            );
          }
        }
        return <div style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Section editor not available.</div>;
      }
    }
  };

  return (
    <div className="entrance-fade" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* ── Top Toolbar ──────────────────────────────────────────────────── */}
      <div 
        className="glass-card" 
        style={{ 
          padding: '1rem 1.5rem', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: '1rem' 
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(37,99,235,0.12)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Sparkles size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.3rem', margin: 0, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>Resume Builder</span>
            </h2>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {saveStatus}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleNewBlankResume}
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.45rem 0.85rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
            title="Start fresh with a blank resume"
          >
            <Plus size={14} />
            <span>New Blank</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setIsImportModalOpen(true)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.4rem', 
              padding: '0.45rem 0.85rem', 
              fontSize: '0.8rem', 
              whiteSpace: 'nowrap',
              borderColor: 'var(--accent-primary, #6366f1)',
              color: 'var(--text-main, inherit)',
            }}
            title="Import existing resume (PDF, DOCX, Text) with AI parsing"
          >
            <Sparkles size={14} style={{ color: '#6366f1' }} />
            <span style={{ fontWeight: 600 }}>Import Resume</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={handlePublishAsBaseCV}
            disabled={isSyncingBaseCV}
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.45rem 0.85rem', fontSize: '0.8rem', color: '#10b981', borderColor: 'rgba(16,185,129,0.3)', whiteSpace: 'nowrap' }}
            title="Compile into Markdown and set as active Base CV for AI Optimizer"
          >
            <Check size={14} />
            <span>{isSyncingBaseCV ? 'Syncing...' : 'Set as Base CV ⚡'}</span>
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleExportPdf}
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.45rem 1.05rem', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
          >
            <Download size={14} />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* ── Main Builder Grid: Left Editor / Right Live Preview ────────── */}
      <div className="cv-builder-grid">
        {/* LEFT COLUMN: Section Editor */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: 0 }}>
          {/* Content / Design Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-secondary)', padding: '0.35rem', borderRadius: '10px', border: '1px solid var(--card-border)' }}>
            <button
              type="button"
              onClick={() => setActiveSectionTab('content')}
              style={{
                flex: 1,
                padding: '0.6rem',
                borderRadius: '8px',
                border: 'none',
                background: activeSectionTab === 'content' ? 'var(--card-bg)' : 'transparent',
                color: activeSectionTab === 'content' ? 'var(--text-primary)' : 'var(--text-muted)',
                fontWeight: activeSectionTab === 'content' ? 700 : 500,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                boxShadow: activeSectionTab === 'content' ? '0 2px 6px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              <FileText size={15} />
              <span>Resume Content</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSectionTab('theme')}
              style={{
                flex: 1,
                padding: '0.6rem',
                borderRadius: '8px',
                border: 'none',
                background: activeSectionTab === 'theme' ? 'var(--card-bg)' : 'transparent',
                color: activeSectionTab === 'theme' ? 'var(--text-primary)' : 'var(--text-muted)',
                fontWeight: activeSectionTab === 'theme' ? 700 : 500,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                boxShadow: activeSectionTab === 'theme' ? '0 2px 6px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              <Palette size={15} />
              <span>Design & Templates</span>
            </button>
          </div>

          {activeSectionTab === 'theme' ? (
            /* ── Design & Theme Tab ──────────────────────────────────────── */
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <DesignTab theme={cv.theme} onChange={updateTheme} />
            </div>
          ) : (
            /* ── Content Sections ────────────────────────────────────────── */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {/* Header (always first, not draggable) */}
              <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div 
                  onClick={() => setExpandedSection(expandedSection === 'header' ? null : 'header')}
                  style={{
                    padding: '1rem 1.25rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    userSelect: 'none',
                    background: expandedSection === 'header' ? 'rgba(124, 58, 237, 0.04)' : 'transparent'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(37,99,235,0.1)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <User size={16} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>Personal Info & Links</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{cv.basics.fullName || 'Name'}, {cv.basics.email || 'Email'}</div>
                    </div>
                  </div>
                  {expandedSection === 'header' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
                {expandedSection === 'header' && (
                  <div style={{ padding: '1.25rem', borderTop: '1px solid var(--card-border)' }}>
                    <HeaderSection basics={cv.basics} onChange={updateBasics} />
                  </div>
                )}
              </div>

              {/* Draggable Sections */}
              <DndContext 
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext 
                  items={cv.sectionOrder} 
                  strategy={verticalListSortingStrategy}
                >
                  {cv.sectionOrder.map((sectionId) => {
                    const def = getSectionDef(sectionId);
                    const IconComp = def.icon;
                    const bgColor = sectionColors[sectionId] || 'rgba(124,58,237,0.1)';
                    const iconColor = sectionIconColors[sectionId] || 'var(--accent-primary)';
                    const title = getSectionTitle(sectionId);
                    const summary = getSectionSummary(sectionId);
                    const isExpanded = expandedSection === sectionId;

                    return (
                      <SortableSectionWrapper key={sectionId} id={sectionId}>
                        <div className="glass-card" style={{ padding: 0, overflow: 'hidden', marginLeft: '10px' }}>
                          <div 
                            onClick={() => setExpandedSection(isExpanded ? null : sectionId)}
                            style={{
                              padding: '0.85rem 1.25rem',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              cursor: 'pointer',
                              userSelect: 'none',
                              background: isExpanded ? 'rgba(124, 58, 237, 0.04)' : 'transparent'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: bgColor, color: iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <IconComp size={15} />
                              </div>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{title}</div>
                                <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>{summary}</div>
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSectionToRemove({ id: sectionId, title });
                                }}
                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.2rem', opacity: 0.6 }}
                                title="Remove section"
                              >
                                <X size={14} />
                              </button>
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </div>
                          </div>

                          {isExpanded && (
                            <div style={{ padding: '1.25rem', borderTop: '1px solid var(--card-border)' }}>
                              {renderSectionEditor(sectionId)}
                            </div>
                          )}
                        </div>
                      </SortableSectionWrapper>
                    );
                  })}
                </SortableContext>
              </DndContext>

              {/* Add Section Button */}
              <button
                type="button"
                onClick={() => setShowAddSection(true)}
                style={{
                  padding: '0.85rem',
                  border: '2px dashed var(--card-border)',
                  borderRadius: '12px',
                  background: 'var(--bg-secondary)',
                  color: 'var(--accent-primary)',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s',
                }}
              >
                <Plus size={18} />
                <span>Add Section</span>
              </button>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Live A4 Preview (Desktop) */}
        <div className="cv-builder-desktop-preview">
          <LivePreviewA4 cv={cv} onDownloadPdf={handleExportPdf} />
        </div>
      </div>

      {/* ── Add Section Modal ─────────────────────────────────────────────── */}
      {showAddSection && (
        <React.Suspense fallback={null}>
          <AddSectionPanel
            currentSectionOrder={cv.sectionOrder}
            onAddSection={addSection}
            onAddCustomSection={addCustomSection}
            onClose={() => setShowAddSection(false)}
          />
        </React.Suspense>
      )}

      {/* ── Mobile Preview ────────────────────────────────────────────────── */}
      <div className="mobile-only-preview-pill" style={{ position: 'fixed', bottom: '1.5rem', left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 90 }}>
        <button
          type="button"
          onClick={() => setIsMobilePreviewOpen(true)}
          style={{
            background: 'linear-gradient(135deg, var(--accent-primary, #2563eb), var(--accent-secondary, #7c3aed))',
            color: '#ffffff',
            border: 'none',
            padding: '0.75rem 1.75rem',
            borderRadius: '99px',
            fontWeight: 700,
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 8px 24px rgba(124, 58, 237, 0.45)',
            cursor: 'pointer'
          }}
        >
          <Eye size={18} />
          <span>Preview CV</span>
        </button>
      </div>

      {isMobilePreviewOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-primary, #0B0F17)', zIndex: 1000, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--card-bg)' }}>
            <button
              type="button"
              onClick={() => setIsMobilePreviewOpen(false)}
              style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}
            >
              <ArrowLeft size={16} />
              <span>Keep editing</span>
            </button>
          </div>
          <div style={{ flexGrow: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <LivePreviewA4 cv={cv} onDownloadPdf={handleExportPdf} />
          </div>
        </div>
      )}

      {/* FlowCV-style AI Import Resume Modal */}
      <ImportResumeModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportComplete}
        baseCVs={baseCVs}
        currentCv={cv}
      />

      {/* New Blank Resume Themed Confirmation Modal */}
      <ConfirmModal
        isOpen={showNewBlankConfirm}
        onClose={() => setShowNewBlankConfirm(false)}
        onConfirm={() => {
          setCv(createBlankResume());
          setExpandedSection('header');
        }}
        title="Create New Blank Resume?"
        message="Are you sure you want to start fresh? Your current resume draft will be replaced with a clean blank document."
        confirmText="Create Blank Resume"
        variant="warning"
      />

      {/* Remove Section Themed Confirmation Modal */}
      <ConfirmModal
        isOpen={!!sectionToRemove}
        onClose={() => setSectionToRemove(null)}
        onConfirm={() => {
          if (sectionToRemove) {
            removeSection(sectionToRemove.id);
          }
        }}
        title="Remove Section?"
        message={`Are you sure you want to remove the "${sectionToRemove?.title}" section from your resume? You can add it back anytime from Add Section.`}
        confirmText="Remove Section"
        variant="danger"
      />
    </div>
  );
};
