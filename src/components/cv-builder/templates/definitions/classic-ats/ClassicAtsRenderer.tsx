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

export const ClassicAtsRenderer: React.FC<TemplateProps> = ({ cv }) => {
  const { basics, summary, experience, education, skills, projects, certifications, theme } = cv;
  const sectionOrder = cv.sectionOrder || ['summary', 'experience', 'education', 'skills', 'projects', 'certifications'];

  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case 'summary':
        if (!summary || summary.visible === false || !summary.content) return null;
        return (
          <section key="summary" style={{ marginBottom: '1rem' }}>
            <TemplateSectionHeading 
              title={summary.title || 'Executive Profile'} 
              theme={theme} 
              styleOverride={theme.sectionHeadingStyle || 'underline'}
            />
            <div style={{ color: '#334155', lineHeight: 'inherit', textAlign: summary.alignment || 'left' }}>
              {renderFormattedText(summary.content)}
            </div>
          </section>
        );

      case 'experience':
        if (!experience || experience.filter(e => e.visible !== false).length === 0) return null;
        return (
          <section key="experience" style={{ marginBottom: '1rem' }}>
            <TemplateSectionHeading 
              title={cv.experienceMeta?.title || 'Professional Experience'} 
              theme={theme} 
              styleOverride={theme.sectionHeadingStyle || 'underline'}
            />
            {experience.filter(e => e.visible !== false).map((item) => (
              <ExperienceEntry key={item.id} item={item} theme={theme} layout="standard" />
            ))}
          </section>
        );

      case 'education':
        if (!education || education.filter(e => e.visible !== false).length === 0) return null;
        return (
          <section key="education" style={{ marginBottom: '1rem' }}>
            <TemplateSectionHeading 
              title={cv.educationMeta?.title || 'Education'} 
              theme={theme} 
              styleOverride={theme.sectionHeadingStyle || 'underline'}
            />
            {education.filter(e => e.visible !== false).map((item) => (
              <EducationEntry key={item.id} item={item} theme={theme} />
            ))}
          </section>
        );

      case 'skills':
        if (!skills || skills.filter(s => s.visible !== false).length === 0) return null;
        return (
          <section key="skills" style={{ marginBottom: '1rem' }}>
            <TemplateSectionHeading 
              title={cv.skillsMeta?.title || 'Technical & Core Skills'} 
              theme={theme} 
              styleOverride={theme.sectionHeadingStyle || 'underline'}
            />
            <SkillsList 
              skills={skills.filter(s => s.visible !== false)} 
              theme={theme} 
              styleOverride={theme.skillStyle || 'comma'}
            />
          </section>
        );

      case 'projects':
        if (!projects || projects.filter(p => p.visible !== false).length === 0) return null;
        return (
          <section key="projects" style={{ marginBottom: '1rem' }}>
            <TemplateSectionHeading 
              title={cv.projectsMeta?.title || 'Key Projects & Highlights'} 
              theme={theme} 
              styleOverride={theme.sectionHeadingStyle || 'underline'}
            />
            <ProjectsList projects={projects} theme={theme} />
          </section>
        );

      case 'certifications':
        if (!certifications || certifications.filter(c => c.visible !== false).length === 0) return null;
        return (
          <section key="certifications" style={{ marginBottom: '1rem' }}>
            <TemplateSectionHeading 
              title="Certifications & Training" 
              theme={theme} 
              styleOverride={theme.sectionHeadingStyle || 'underline'}
            />
            <CertificationsList certifications={certifications} theme={theme} />
          </section>
        );

      default:
        return null;
    }
  };

  return (
    <PrintContainer theme={theme} className="classic-ats-template">
      {/* Header */}
      <TemplateHeader 
        basics={basics} 
        theme={theme} 
        align={theme.headerAlignment || 'center'} 
        photoPosition={theme.showPhoto ? 'left' : 'none'}
        showBorders={false}
      />

      {/* Dynamic Sections in User Order */}
      {sectionOrder.map(sectionId => renderSection(sectionId))}
    </PrintContainer>
  );
};

