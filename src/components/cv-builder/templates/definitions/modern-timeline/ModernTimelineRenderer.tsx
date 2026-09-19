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

      {/* Summary */}
      {summary && summary.visible !== false && summary.content && (
        <section style={{ marginBottom: '1.25rem' }}>
          <TemplateSectionHeading 
            title={summary.title || 'Profile Summary'} 
            theme={theme} 
            styleOverride={theme.sectionHeadingStyle || 'border-left'}
          />
          <div style={{ color: '#334155', lineHeight: 'inherit', paddingLeft: '0.5rem' }}>
            {renderFormattedText(summary.content)}
          </div>
        </section>
      )}

      {/* Skills (High prominence for Tech/Engineers) */}
      {skills && skills.filter(s => s.visible !== false).length > 0 && (
        <section style={{ marginBottom: '1.25rem' }}>
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
      )}

      {/* Experience (Left-Rail Timeline) */}
      {experience && experience.filter(e => e.visible !== false).length > 0 && (
        <section style={{ marginBottom: '1.25rem' }}>
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
      )}

      {/* Projects */}
      {projects && projects.filter(p => p.visible !== false).length > 0 && (
        <section style={{ marginBottom: '1.25rem' }}>
          <TemplateSectionHeading 
            title={cv.projectsMeta?.title || 'Key Projects & Architecture'} 
            theme={theme} 
            styleOverride={theme.sectionHeadingStyle || 'border-left'}
          />
          <div style={{ paddingLeft: '0.5rem' }}>
            <ProjectsList projects={projects} theme={theme} />
          </div>
        </section>
      )}

      {/* Education */}
      {education && education.filter(e => e.visible !== false).length > 0 && (
        <section style={{ marginBottom: '1.25rem' }}>
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
      )}

      {/* Certifications */}
      {certifications && certifications.filter(c => c.visible !== false).length > 0 && (
        <section style={{ marginBottom: '1.25rem' }}>
          <TemplateSectionHeading 
            title="Certifications & Badges" 
            theme={theme} 
            styleOverride={theme.sectionHeadingStyle || 'border-left'}
          />
          <div style={{ paddingLeft: '0.5rem' }}>
            <CertificationsList certifications={certifications} theme={theme} />
          </div>
        </section>
      )}
    </PrintContainer>
  );
};
