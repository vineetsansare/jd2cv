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

      {/* Summary */}
      {summary && summary.visible !== false && summary.content && (
        <section style={{ marginBottom: '1rem' }}>
          <TemplateSectionHeading 
            title={summary.title || 'Executive Profile'} 
            theme={theme} 
            styleOverride={theme.sectionHeadingStyle || 'underline'}
          />
          <div style={{ color: '#334155', lineHeight: 'inherit' }}>
            {renderFormattedText(summary.content)}
          </div>
        </section>
      )}

      {/* Experience */}
      {experience && experience.filter(e => e.visible !== false).length > 0 && (
        <section style={{ marginBottom: '1rem' }}>
          <TemplateSectionHeading 
            title={cv.experienceMeta?.title || 'Professional Experience'} 
            theme={theme} 
            styleOverride={theme.sectionHeadingStyle || 'underline'}
          />
          {experience.filter(e => e.visible !== false).map((item) => (
            <ExperienceEntry key={item.id} item={item} theme={theme} layout="standard" />
          ))}
        </section>
      )}

      {/* Education */}
      {education && education.filter(e => e.visible !== false).length > 0 && (
        <section style={{ marginBottom: '1rem' }}>
          <TemplateSectionHeading 
            title={cv.educationMeta?.title || 'Education'} 
            theme={theme} 
            styleOverride={theme.sectionHeadingStyle || 'underline'}
          />
          {education.filter(e => e.visible !== false).map((item) => (
            <EducationEntry key={item.id} item={item} theme={theme} />
          ))}
        </section>
      )}

      {/* Skills */}
      {skills && skills.filter(s => s.visible !== false).length > 0 && (
        <section style={{ marginBottom: '1rem' }}>
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
      )}

      {/* Projects */}
      {projects && projects.filter(p => p.visible !== false).length > 0 && (
        <section style={{ marginBottom: '1rem' }}>
          <TemplateSectionHeading 
            title={cv.projectsMeta?.title || 'Key Projects & Highlights'} 
            theme={theme} 
            styleOverride={theme.sectionHeadingStyle || 'underline'}
          />
          <ProjectsList projects={projects} theme={theme} />
        </section>
      )}

      {/* Certifications */}
      {certifications && certifications.filter(c => c.visible !== false).length > 0 && (
        <section style={{ marginBottom: '1rem' }}>
          <TemplateSectionHeading 
            title="Certifications & Training" 
            theme={theme} 
            styleOverride={theme.sectionHeadingStyle || 'underline'}
          />
          <CertificationsList certifications={certifications} theme={theme} />
        </section>
      )}
    </PrintContainer>
  );
};
