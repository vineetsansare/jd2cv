import React from 'react';
import type { TemplateProps } from '../../registry/types';
import { PrintContainer } from '../../primitives/PrintContainer';
import { TemplateHeader } from '../../primitives/TemplateHeader';
import { TemplateSectionHeading } from '../../primitives/TemplateSectionHeading';
import { ExperienceEntry, renderFormattedText } from '../../primitives/ExperienceEntry';
import { EducationEntry } from '../../primitives/EducationEntry';
import { SkillsList } from '../../primitives/SkillsList';
import { ProjectsList } from '../../primitives/ProjectsList';
import { CertificationsList } from '../../primitives/CertificationsList';

export const ModernTimelineRenderer: React.FC<TemplateProps> = ({ cv }) => {
  const { basics, summary, experience, education, skills, projects, certifications, theme } = cv;
  const sectionOrder = cv.sectionOrder || ['summary', 'skills', 'experience', 'projects', 'education', 'certifications'];

  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case 'summary':
        if (!summary || summary.visible === false || !summary.content) return null;
        return (
          <section key="summary" style={{ marginBottom: '1.25rem' }}>
            <TemplateSectionHeading 
              title={summary.title || 'Profile Summary'} 
              theme={theme} 
              styleOverride={theme.sectionHeadingStyle || 'border-left'}
            />
            <div style={{ color: '#334155', lineHeight: 'inherit', paddingLeft: '0.5rem', textAlign: summary.alignment || 'left' }}>
              {renderFormattedText(summary.content)}
            </div>
          </section>
        );

      case 'skills':
        if (!skills || skills.filter(s => s.visible !== false).length === 0) return null;
        return (
          <section key="skills" style={{ marginBottom: '1.25rem' }}>
            <TemplateSectionHeading 
              title={cv.skillsMeta?.title || 'Technical Expertise & Skills'} 
              theme={theme} 
              styleOverride={theme.sectionHeadingStyle || 'border-left'}
            />
            <div style={{ paddingLeft: '0.5rem' }}>
              <SkillsList 
                skills={skills.filter(s => s.visible !== false)} 
                theme={theme} 
                styleOverride={theme.skillStyle || 'pills'}
              />
            </div>
          </section>
        );

      case 'experience':
        if (!experience || experience.filter(e => e.visible !== false).length === 0) return null;
        return (
          <section key="experience" style={{ marginBottom: '1.25rem' }}>
            <TemplateSectionHeading 
              title={cv.experienceMeta?.title || 'Professional Experience'} 
              theme={theme} 
              styleOverride={theme.sectionHeadingStyle || 'border-left'}
            />
            <div>
              {experience.filter(e => e.visible !== false).map((item) => (
                <ExperienceEntry key={item.id} item={item} theme={theme} layout="left-rail" />
              ))}
            </div>
          </section>
        );

      case 'projects':
        if (!projects || projects.filter(p => p.visible !== false).length === 0) return null;
        return (
          <section key="projects" style={{ marginBottom: '1.25rem' }}>
            <TemplateSectionHeading 
              title={cv.projectsMeta?.title || 'Key Projects & Architecture'} 
              theme={theme} 
              styleOverride={theme.sectionHeadingStyle || 'border-left'}
            />
            <div style={{ paddingLeft: '0.5rem' }}>
              <ProjectsList projects={projects} theme={theme} />
            </div>
          </section>
        );

      case 'education':
        if (!education || education.filter(e => e.visible !== false).length === 0) return null;
        return (
          <section key="education" style={{ marginBottom: '1.25rem' }}>
            <TemplateSectionHeading 
              title={cv.educationMeta?.title || 'Education & Credentials'} 
              theme={theme} 
              styleOverride={theme.sectionHeadingStyle || 'border-left'}
            />
            <div style={{ paddingLeft: '0.5rem' }}>
              {education.filter(e => e.visible !== false).map((item) => (
                <EducationEntry key={item.id} item={item} theme={theme} />
              ))}
            </div>
          </section>
        );

      case 'certifications':
        if (!certifications || certifications.filter(c => c.visible !== false).length === 0) return null;
        return (
          <section key="certifications" style={{ marginBottom: '1.25rem' }}>
            <TemplateSectionHeading 
              title="Certifications & Badges" 
              theme={theme} 
              styleOverride={theme.sectionHeadingStyle || 'border-left'}
            />
            <div style={{ paddingLeft: '0.5rem' }}>
              <CertificationsList certifications={certifications} theme={theme} />
            </div>
          </section>
        );

      default:
        return null;
    }
  };

  return (
    <PrintContainer theme={theme} className="modern-timeline-template">
      {/* Header */}
      <TemplateHeader 
        basics={basics} 
        theme={theme} 
        align={theme.headerAlignment || 'left'} 
        photoPosition={theme.showPhoto ? 'left' : 'none'}
        showBorders={true}
      />

      {/* Dynamic Sections in User Order */}
      {sectionOrder.map(sectionId => renderSection(sectionId))}
    </PrintContainer>
  );
};

