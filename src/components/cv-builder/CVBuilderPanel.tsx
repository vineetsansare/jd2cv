import React, { useState, useEffect } from 'react';
import type { StructuredCV, ResumeBasics, WorkExperienceItem, EducationItem, SkillCategoryItem, CVThemeSettings } from '../../types/cvBuilder';
import { DEFAULT_CV_DATA } from '../../utils/defaultCvData';
import { structuredCVToMarkdown, markdownToStructuredCV } from '../../utils/cvBuilderConverter';
import { printCvDocument } from '../../utils/printHelper';
import { HeaderSection } from './sections/HeaderSection';
import { SummarySection } from './sections/SummarySection';
import { ExperienceSection } from './sections/ExperienceSection';
import { EducationSection } from './sections/EducationSection';
import { SkillsSection } from './sections/SkillsSection';
import { ThemeCustomizer } from './ThemeCustomizer';
import { LivePreviewA4 } from './LivePreviewA4';
import { TemplateRenderer } from './templates/TemplateRenderer';
import { 
  User, 
  FileText, 
  Briefcase, 
  GraduationCap, 
  Cpu, 
  Palette, 
  ChevronDown, 
  ChevronUp, 
  Eye, 
  EyeOff, 
  Download, 
  Check, 
  Sparkles, 
  Upload, 
  ArrowLeft
} from 'lucide-react';

const LOCAL_STORAGE_KEY_BUILDER = 'jd2cv_builder_draft_v1';

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
        return JSON.parse(saved);
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

  // Autosave on change
  useEffect(() => {
    setSaveStatus('Saving...');
    const timer = setTimeout(() => {
      localStorage.setItem(LOCAL_STORAGE_KEY_BUILDER, JSON.stringify(cv));
      setSaveStatus('Saved locally ✓');
    }, 600);
    return () => clearTimeout(timer);
  }, [cv]);

  // Section updaters
  const updateBasics = (basics: ResumeBasics) => {
    setCv(prev => ({ ...prev, basics, updatedAt: new Date().toISOString() }));
  };

  const updateSummary = (summary: { title: string; content: string; visible: boolean }) => {
    setCv(prev => ({ ...prev, summary, updatedAt: new Date().toISOString() }));
  };

  const updateExperience = (experience: WorkExperienceItem[]) => {
    setCv(prev => ({ ...prev, experience, updatedAt: new Date().toISOString() }));
  };

  const updateEducation = (education: EducationItem[]) => {
    setCv(prev => ({ ...prev, education, updatedAt: new Date().toISOString() }));
  };

  const updateSkills = (skills: SkillCategoryItem[]) => {
    setCv(prev => ({ ...prev, skills, updatedAt: new Date().toISOString() }));
  };

  const updateTheme = (theme: CVThemeSettings) => {
    setCv(prev => ({ ...prev, theme, updatedAt: new Date().toISOString() }));
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

  // Print / Export PDF
  const handleExportPdf = () => {
    const markdown = structuredCVToMarkdown(cv);
    const filenameTitle = `${cv.basics.fullName || 'Candidate'}-${cv.basics.headline || 'Resume'}`;
    printCvDocument(markdown, {
      accentColor: cv.theme.accentColor || '#1e3a8a',
      themeName: cv.theme.templateId || 'modern-timeline',
      showPhoto: cv.basics.showAvatar && !!cv.basics.avatarUrl,
      photoUrl: cv.basics.avatarUrl,
      layoutDensity: cv.theme.fontSize === 'compact' ? 'compact' : 'standard'
    }, filenameTitle);
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', margin: 0, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={20} style={{ color: 'var(--accent-primary)' }} />
              <span>Make CV (Interactive Builder)</span>
            </h2>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {saveStatus}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          {baseCVs.length > 0 && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleImportFromBaseCV}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.9rem', fontSize: '0.8rem' }}
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
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.9rem', fontSize: '0.8rem', color: '#10b981', borderColor: 'rgba(16,185,129,0.3)' }}
            title="Compile into Markdown and set as active Base CV for AI Optimizer"
          >
            <Check size={14} />
            <span>{isSyncingBaseCV ? 'Syncing...' : 'Set as Base CV ⚡'}</span>
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleExportPdf}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1.15rem', fontSize: '0.82rem' }}
          >
            <Download size={14} />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Main Builder Grid: Left Editor (Form Cards) / Right Live A4 Preview */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '1.5rem', 
          alignItems: 'start' 
        }} 
        className="workspace-equal-grid"
      >
        {/* LEFT COLUMN: Section Accordion Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
            /* Content Sections (FlowCV Accordion) */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {/* 1. Header & Personal Info */}
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

              {/* 2. Executive Profile / Summary */}
              <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div 
                  onClick={() => setExpandedSection(expandedSection === 'summary' ? null : 'summary')}
                  style={{
                    padding: '1rem 1.25rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    userSelect: 'none',
                    background: expandedSection === 'summary' ? 'rgba(124, 58, 237, 0.04)' : 'transparent'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16,185,129,0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FileText size={16} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>Executive Profile</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{cv.summary.visible ? 'Visible' : 'Hidden'}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateSummary({ ...cv.summary, visible: !cv.summary.visible });
                      }}
                      style={{ background: 'none', border: 'none', color: cv.summary.visible ? '#10b981' : 'var(--text-muted)', cursor: 'pointer', padding: '0.2rem' }}
                    >
                      {cv.summary.visible ? <Eye size={15} /> : <EyeOff size={15} />}
                    </button>
                    {expandedSection === 'summary' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </div>

                {expandedSection === 'summary' && (
                  <div style={{ padding: '1.25rem', borderTop: '1px solid var(--card-border)' }}>
                    <SummarySection summary={cv.summary} onChange={updateSummary} />
                  </div>
                )}
              </div>

              {/* 3. Professional Experience */}
              <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div 
                  onClick={() => setExpandedSection(expandedSection === 'experience' ? null : 'experience')}
                  style={{
                    padding: '1rem 1.25rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    userSelect: 'none',
                    background: expandedSection === 'experience' ? 'rgba(124, 58, 237, 0.04)' : 'transparent'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(234,88,12,0.1)', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Briefcase size={16} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>Professional Experience</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{cv.experience.length} career positions</div>
                    </div>
                  </div>
                  {expandedSection === 'experience' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>

                {expandedSection === 'experience' && (
                  <div style={{ padding: '1.25rem', borderTop: '1px solid var(--card-border)' }}>
                    <ExperienceSection experience={cv.experience} onChange={updateExperience} />
                  </div>
                )}
              </div>

              {/* 4. Education */}
              <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div 
                  onClick={() => setExpandedSection(expandedSection === 'education' ? null : 'education')}
                  style={{
                    padding: '1rem 1.25rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    userSelect: 'none',
                    background: expandedSection === 'education' ? 'rgba(124, 58, 237, 0.04)' : 'transparent'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(139,92,246,0.1)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <GraduationCap size={16} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>Education</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{cv.education.length} degrees / qualifications</div>
                    </div>
                  </div>
                  {expandedSection === 'education' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>

                {expandedSection === 'education' && (
                  <div style={{ padding: '1.25rem', borderTop: '1px solid var(--card-border)' }}>
                    <EducationSection education={cv.education} onChange={updateEducation} />
                  </div>
                )}
              </div>

              {/* 5. Skills & Competencies */}
              <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div 
                  onClick={() => setExpandedSection(expandedSection === 'skills' ? null : 'skills')}
                  style={{
                    padding: '1rem 1.25rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    userSelect: 'none',
                    background: expandedSection === 'skills' ? 'rgba(124, 58, 237, 0.04)' : 'transparent'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(6,182,212,0.1)', color: '#06b6d4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Cpu size={16} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>Skills & Competencies</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{cv.skills.length} categories</div>
                    </div>
                  </div>
                  {expandedSection === 'skills' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>

                {expandedSection === 'skills' && (
                  <div style={{ padding: '1.25rem', borderTop: '1px solid var(--card-border)' }}>
                    <SkillsSection skills={cv.skills} onChange={updateSkills} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Live A4 Document Preview (Desktop) */}
        <div style={{ position: 'sticky', top: '2rem' }}>
          <LivePreviewA4 cv={cv} onDownloadPdf={handleExportPdf} />
        </div>
      </div>

      {/* Floating Bottom Pill Button on Mobile (Matching FlowCV Mobile UX) */}
      <div className="mobile-only-preview-pill" style={{ position: 'fixed', bottom: '1.5rem', left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 90 }}>
        <button
          type="button"
          onClick={() => setIsMobilePreviewOpen(true)}
          style={{
            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
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

      {/* Full-Screen Mobile Preview Modal (Matching FlowCV Screenshot 5) */}
      {isMobilePreviewOpen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: '#ffffff',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div style={{
            padding: '0.75rem 1rem',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#f8fafc'
          }}>
            <button
              type="button"
              onClick={() => setIsMobilePreviewOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: '#334155',
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

            <button
              type="button"
              onClick={handleExportPdf}
              style={{
                background: '#1e1b4b',
                color: '#ffffff',
                border: 'none',
                padding: '0.5rem 1.15rem',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                cursor: 'pointer'
              }}
            >
              <Download size={14} />
              <span>Download</span>
            </button>
          </div>

          {/* Document Content */}
          <div style={{ flexGrow: 1, overflowY: 'auto', background: '#e2e8f0', padding: '1rem 0.5rem', display: 'flex', justifyContent: 'center' }}>
            <div style={{ background: '#ffffff', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', maxWidth: '100%', width: '100%', boxSizing: 'border-box' }}>
              <TemplateRenderer cv={cv} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
