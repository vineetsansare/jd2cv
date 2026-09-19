import React, { useState, useEffect } from 'react';
import type { 
  StructuredCV, 
  ResumeBasics, 
  WorkExperienceItem, 
  EducationItem, 
  SkillCategoryItem, 
  ProjectItem, 
  CertificationItem, 
  CVThemeSettings 
} from '../../types/cvBuilder';
import { DEFAULT_CV_DATA } from '../../utils/defaultCvData';
import { structuredCVToMarkdown, markdownToStructuredCV } from '../../utils/cvBuilderConverter';
import { printCvDocument } from '../../utils/printHelper';
import { HeaderSection } from './sections/HeaderSection';
import { SummarySection } from './sections/SummarySection';
import { ExperienceSection } from './sections/ExperienceSection';
import { EducationSection } from './sections/EducationSection';
import { SkillsSection } from './sections/SkillsSection';
import { ProjectsSection } from './sections/ProjectsSection';
import { CertificationsSection } from './sections/CertificationsSection';
import { SectionCard } from './sections/SectionCard';
import { ThemeCustomizer } from './ThemeCustomizer';
import { LivePreviewA4 } from './LivePreviewA4';
import { 
  User, 
  FileText, 
  Briefcase, 
  GraduationCap, 
  Cpu, 
  Palette, 
  Code,
  Award,
  ChevronDown, 
  ChevronUp, 
  Eye, 
  Download, 
  Check, 
  Sparkles, 
  Upload, 
  ArrowLeft,
  Info
} from 'lucide-react';

const LOCAL_STORAGE_KEY_BUILDER = 'jd2cv_builder_draft_v1';

interface CVBuilderPanelProps {
  userProfile?: any;
  baseCVs: Array<{ id?: string; name: string; text: string }>;
  onSetAsBaseCV: (markdown: string, filename: string) => Promise<void>;
  onUpdateAvatar?: (url: string) => Promise<void> | void;
  theme?: 'light' | 'dark';
}

export const CVBuilderPanel: React.FC<CVBuilderPanelProps> = ({
  userProfile,
  baseCVs,
  onSetAsBaseCV,
  onUpdateAvatar
}) => {
  // Load initial draft from localStorage or default
  const [cv, setCv] = useState<StructuredCV>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_BUILDER);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.sectionOrder || parsed.sectionOrder.length === 0) {
          parsed.sectionOrder = ['summary', 'experience', 'education', 'skills', 'projects', 'certifications'];
        }
        return parsed;
      } catch (e) {
        console.error('Failed to parse builder draft from storage', e);
      }
    }
    return DEFAULT_CV_DATA;
  });

  const [activeSectionTab, setActiveSectionTab] = useState<'content' | 'theme'>('content');
  const [expandedSection, setExpandedSection] = useState<string | null>('header');
  const [saveStatus, setSaveStatus] = useState<string>('Saved');
  const [isMobilePreviewOpen, setIsMobilePreviewOpen] = useState<boolean>(false);
  const [isSyncingBaseCV, setIsSyncingBaseCV] = useState<boolean>(false);
  const [draggedSectionIndex, setDraggedSectionIndex] = useState<number | null>(null);

  const sectionOrder = cv.sectionOrder || ['summary', 'experience', 'education', 'skills', 'projects', 'certifications'];

  // Autosave on change
  useEffect(() => {
    setSaveStatus('Saving...');
    const timer = setTimeout(() => {
      localStorage.setItem(LOCAL_STORAGE_KEY_BUILDER, JSON.stringify(cv));
      setSaveStatus('Saved locally ✓');
    }, 600);
    return () => clearTimeout(timer);
  }, [cv]);

  // Sync profile avatar into CV basics if not already customized
  useEffect(() => {
    const activeAvatar = userProfile?.avatar_url || (typeof window !== 'undefined' ? localStorage.getItem('user_avatar_url') : '');
    if (activeAvatar && (!cv.basics.avatarUrl || cv.basics.avatarUrl === DEFAULT_CV_DATA.basics.avatarUrl)) {
      setCv(prev => ({
        ...prev,
        basics: {
          ...prev.basics,
          avatarUrl: activeAvatar,
          showAvatar: true
        }
      }));
    }
  }, [userProfile?.avatar_url]);

  // Section updaters
  const updateBasics = (basics: ResumeBasics) => {
    setCv(prev => ({ ...prev, basics, updatedAt: new Date().toISOString() }));
  };

  const updateSummary = (summary: {
    title: string;
    content: string;
    visible: boolean;
    icon?: string;
    showIcon?: boolean;
    alignment?: 'left' | 'center' | 'right' | 'justify';
  }) => {
    setCv(prev => ({ ...prev, summary, updatedAt: new Date().toISOString() }));
  };

  const updateExperience = (experience: WorkExperienceItem[], meta?: any) => {
    setCv(prev => ({
      ...prev,
      experience,
      experienceMeta: meta || prev.experienceMeta,
      updatedAt: new Date().toISOString()
    }));
  };

  const updateEducation = (education: EducationItem[], meta?: any) => {
    setCv(prev => ({
      ...prev,
      education,
      educationMeta: meta || prev.educationMeta,
      updatedAt: new Date().toISOString()
    }));
  };

  const updateSkills = (skills: SkillCategoryItem[], meta?: any) => {
    setCv(prev => ({
      ...prev,
      skills,
      skillsMeta: meta || prev.skillsMeta,
      updatedAt: new Date().toISOString()
    }));
  };

  const updateProjects = (projects: ProjectItem[], meta?: any) => {
    setCv(prev => ({
      ...prev,
      projects,
      projectsMeta: meta || prev.projectsMeta,
      updatedAt: new Date().toISOString()
    }));
  };

  const updateCertifications = (certifications: CertificationItem[]) => {
    setCv(prev => ({
      ...prev,
      certifications,
      updatedAt: new Date().toISOString()
    }));
  };

  const updateTheme = (theme: CVThemeSettings) => {
    setCv(prev => ({ ...prev, theme, updatedAt: new Date().toISOString() }));
  };

  // Move section in order
  const moveSection = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= sectionOrder.length) return;
    const newOrder = [...sectionOrder];
    const [moved] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, moved);
    setCv(prev => ({
      ...prev,
      sectionOrder: newOrder,
      updatedAt: new Date().toISOString()
    }));
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedSectionIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedSectionIndex !== null && draggedSectionIndex !== targetIndex) {
      moveSection(draggedSectionIndex, targetIndex);
    }
    setDraggedSectionIndex(null);
  };

  // 1-Click "Set as Base CV" (Syncs with AI Optimizer)
  const handlePublishAsBaseCV = async () => {
    setIsSyncingBaseCV(true);
    try {
      const markdown = structuredCVToMarkdown(cv);
      const filename = `${cv.basics.fullName || 'Candidate'}_Master_Base_Resume.md`;
      await onSetAsBaseCV(markdown, filename);
      alert('Success! Your structured CV has been compiled into Markdown and set as your active Master Base CV for the AI Optimizer.');
    } catch (err: any) {
      console.error(err);
      alert('Failed to set as Base CV. Please try again.');
    } finally {
      setIsSyncingBaseCV(false);
    }
  };

  // 1-Click "Import from Base CV"
  const handleImportFromBaseCV = () => {
    if (baseCVs.length === 0) {
      alert('No Base CV found. Upload or generate a resume first.');
      return;
    }
    if (window.confirm('Import content from your active Base CV into this editor? (This will overwrite your current draft)')) {
      const baseText = baseCVs[0].text;
      const imported = markdownToStructuredCV(baseText, cv);
      setCv(imported);
    }
  };

  // Print / Export PDF with 100% template fidelity
  const handleExportPdf = () => {
    const docEl = document.querySelector('.cv-a4-document');
    const liveSheet = document.getElementById('cv-live-a4-sheet');
    const customHtml = docEl ? docEl.outerHTML : (liveSheet ? liveSheet.innerHTML : undefined);
    const filenameTitle = `${cv.basics.fullName || 'Candidate'}-${cv.basics.headline || 'Resume'}`;
    
    printCvDocument('', {
      accentColor: cv.theme.accentColor || '#1e3a8a',
      themeName: cv.theme.templateId || 'classic-ats',
      template: cv.theme.templateId as any,
      showPhoto: cv.basics.showAvatar && !!cv.basics.avatarUrl,
      photoUrl: cv.basics.avatarUrl,
      layoutDensity: cv.theme.fontSize === 'compact' ? 'compact' : 'standard'
    }, filenameTitle, customHtml);
  };


  return (
    <div className="entrance-fade" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Toolbar */}
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
              <span>Make CV (Interactive Builder)</span>
            </h2>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {saveStatus}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {baseCVs.length > 0 && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleImportFromBaseCV}
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.45rem 0.85rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
              title="Import content from your active Base CV"
            >
              <Upload size={14} />
              <span>Import Base CV</span>
            </button>
          )}

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

      {/* Main Builder Grid: Left Editor (Form Cards) / Right Live A4 Preview */}
      <div className="cv-builder-grid">
        {/* LEFT COLUMN: Section Accordion Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: 0 }}>
          {/* Tabs: Content Sections vs Design & Theme */}
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
            /* Design & Theme Customizer */
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <ThemeCustomizer theme={cv.theme} onChange={updateTheme} />
            </div>
          ) : (
            /* Content Sections Accordion */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {/* Sidebar Pro Fixed Layout Disclaimer */}
              {cv.theme.templateId === 'split-sidebar' && (
                <div 
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    background: 'rgba(37, 99, 235, 0.08)',
                    border: '1px solid rgba(37, 99, 235, 0.22)',
                    color: 'var(--text-secondary)',
                    fontSize: '0.8rem',
                    lineHeight: 1.45,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem'
                  }}
                >
                  <Info size={16} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                  <span>
                    <strong>Fixed Multi-Column Layout:</strong> Section movement is locked for the <em>Two-Column Sidebar Pro</em> template to preserve its dedicated sidebar (Skills, Education, Certifications) and main column structure.
                  </span>
                </div>
              )}

              {/* 1. Header & Personal Info (Pinned Top) */}
              <div className="glass-card" style={{ padding: 0, overflow: 'hidden', borderRadius: '12px' }}>
                <div 
                  onClick={() => setExpandedSection(expandedSection === 'header' ? null : 'header')}
                  style={{
                    padding: '0.85rem 1.15rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    userSelect: 'none',
                    background: expandedSection === 'header' ? 'rgba(124, 58, 237, 0.04)' : 'transparent',
                    borderBottom: expandedSection === 'header' ? '1px solid var(--card-border)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(37,99,235,0.1)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <User size={15} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>Personal Info & Links</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{cv.basics.fullName || 'Name'}, {cv.basics.email || 'Email'}</div>
                    </div>
                  </div>
                  {expandedSection === 'header' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>

                {expandedSection === 'header' && (
                  <div style={{ padding: '1.25rem', borderTop: '1px solid var(--card-border)' }}>
                    <HeaderSection 
                      basics={cv.basics} 
                      onChange={updateBasics} 
                      onUpdateAvatar={onUpdateAvatar}
                    />
                  </div>
                )}
              </div>

              {/* Dynamic Reorderable Sections */}
              {sectionOrder.map((sectionKey, index) => {
                const isSidebar = cv.theme.templateId === 'split-sidebar';
                const canMoveUp = !isSidebar && index > 0;
                const canMoveDown = !isSidebar && index < sectionOrder.length - 1;

                if (sectionKey === 'summary') {
                  return (
                    <SectionCard
                      key="summary"
                      title={cv.summary.title || 'Executive Profile'}
                      subtitle={cv.summary.visible ? 'Visible on CV' : 'Hidden'}
                      icon={<FileText size={16} />}
                      visible={cv.summary.visible}
                      isExpanded={expandedSection === 'summary'}
                      onToggleExpand={() => setExpandedSection(expandedSection === 'summary' ? null : 'summary')}
                      onToggleVisibility={(v) => updateSummary({ ...cv.summary, visible: v })}
                      onMoveUp={!isSidebar ? () => moveSection(index, index - 1) : undefined}
                      onMoveDown={!isSidebar ? () => moveSection(index, index + 1) : undefined}
                      canMoveUp={canMoveUp}
                      canMoveDown={canMoveDown}
                      draggable={!isSidebar}
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, index)}
                    >
                      <SummarySection summary={cv.summary} onChange={updateSummary} />
                    </SectionCard>
                  );
                }

                if (sectionKey === 'experience') {
                  return (
                    <SectionCard
                      key="experience"
                      title={cv.experienceMeta?.title || 'Professional Experience'}
                      entriesCount={cv.experience.length}
                      icon={<Briefcase size={16} />}
                      visible={true}
                      isExpanded={expandedSection === 'experience'}
                      onToggleExpand={() => setExpandedSection(expandedSection === 'experience' ? null : 'experience')}
                      onMoveUp={!isSidebar ? () => moveSection(index, index - 1) : undefined}
                      onMoveDown={!isSidebar ? () => moveSection(index, index + 1) : undefined}
                      canMoveUp={canMoveUp}
                      canMoveDown={canMoveDown}
                      draggable={!isSidebar}
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, index)}
                    >
                      <ExperienceSection meta={cv.experienceMeta} experience={cv.experience} onChange={updateExperience} />
                    </SectionCard>
                  );
                }

                if (sectionKey === 'education') {
                  return (
                    <SectionCard
                      key="education"
                      title={cv.educationMeta?.title || 'Education'}
                      entriesCount={cv.education.length}
                      icon={<GraduationCap size={16} />}
                      visible={true}
                      isExpanded={expandedSection === 'education'}
                      onToggleExpand={() => setExpandedSection(expandedSection === 'education' ? null : 'education')}
                      onMoveUp={!isSidebar ? () => moveSection(index, index - 1) : undefined}
                      onMoveDown={!isSidebar ? () => moveSection(index, index + 1) : undefined}
                      canMoveUp={canMoveUp}
                      canMoveDown={canMoveDown}
                      draggable={!isSidebar}
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, index)}
                    >
                      <EducationSection meta={cv.educationMeta} education={cv.education} onChange={updateEducation} />
                    </SectionCard>
                  );
                }

                if (sectionKey === 'skills') {
                  return (
                    <SectionCard
                      key="skills"
                      title={cv.skillsMeta?.title || 'Skills & Competencies'}
                      entriesCount={cv.skills.length}
                      icon={<Cpu size={16} />}
                      visible={true}
                      isExpanded={expandedSection === 'skills'}
                      onToggleExpand={() => setExpandedSection(expandedSection === 'skills' ? null : 'skills')}
                      onMoveUp={!isSidebar ? () => moveSection(index, index - 1) : undefined}
                      onMoveDown={!isSidebar ? () => moveSection(index, index + 1) : undefined}
                      canMoveUp={canMoveUp}
                      canMoveDown={canMoveDown}
                      draggable={!isSidebar}
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, index)}
                    >
                      <SkillsSection meta={cv.skillsMeta} skills={cv.skills} onChange={updateSkills} />
                    </SectionCard>
                  );
                }

                if (sectionKey === 'projects') {
                  return (
                    <SectionCard
                      key="projects"
                      title={cv.projectsMeta?.title || 'Projects & Highlights'}
                      entriesCount={(cv.projects || []).length}
                      icon={<Code size={16} />}
                      visible={true}
                      isExpanded={expandedSection === 'projects'}
                      onToggleExpand={() => setExpandedSection(expandedSection === 'projects' ? null : 'projects')}
                      onMoveUp={!isSidebar ? () => moveSection(index, index - 1) : undefined}
                      onMoveDown={!isSidebar ? () => moveSection(index, index + 1) : undefined}
                      canMoveUp={canMoveUp}
                      canMoveDown={canMoveDown}
                      draggable={!isSidebar}
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, index)}
                    >
                      <ProjectsSection meta={cv.projectsMeta} projects={cv.projects || []} onChange={updateProjects} />
                    </SectionCard>
                  );
                }

                if (sectionKey === 'certifications') {
                  return (
                    <SectionCard
                      key="certifications"
                      title="Certifications & Awards"
                      entriesCount={(cv.certifications || []).length}
                      icon={<Award size={16} />}
                      visible={true}
                      isExpanded={expandedSection === 'certifications'}
                      onToggleExpand={() => setExpandedSection(expandedSection === 'certifications' ? null : 'certifications')}
                      onMoveUp={!isSidebar ? () => moveSection(index, index - 1) : undefined}
                      onMoveDown={!isSidebar ? () => moveSection(index, index + 1) : undefined}
                      canMoveUp={canMoveUp}
                      canMoveDown={canMoveDown}
                      draggable={!isSidebar}
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, index)}
                    >
                      <CertificationsSection certifications={cv.certifications || []} onChange={updateCertifications} />
                    </SectionCard>
                  );
                }

                return null;
              })}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Live A4 Document Preview (Desktop) */}
        <div className="cv-builder-desktop-preview">
          <LivePreviewA4 cv={cv} onDownloadPdf={handleExportPdf} />
        </div>
      </div>

      {/* Floating Bottom Pill Button on Mobile */}
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

      {/* Full-Screen Mobile Preview Modal */}
      {isMobilePreviewOpen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--bg-primary, #0B0F17)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div style={{
            padding: '0.75rem 1rem',
            borderBottom: '1px solid var(--card-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--card-bg)'
          }}>
            <button
              type="button"
              onClick={() => setIsMobilePreviewOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                cursor: 'pointer'
              }}
            >
              <ArrowLeft size={16} />
              <span>Keep editing</span>
            </button>
          </div>

          {/* Document Content */}
          <div style={{ flexGrow: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <LivePreviewA4 cv={cv} onDownloadPdf={handleExportPdf} />
          </div>
        </div>
      )}
    </div>
  );
};
