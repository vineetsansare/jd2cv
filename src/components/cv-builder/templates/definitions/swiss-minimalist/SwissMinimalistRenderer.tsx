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

export const SwissMinimalistRenderer: React.FC<TemplateProps> = ({ cv }) => {
  const { basics, summary, experience, education, skills, projects, certifications, theme } = cv;
  const accent = theme.accentColor || '#0f172a';

  return (
    <PrintContainer theme={theme} className="swiss-minimalist-template">
      {/* Header */}
      <TemplateHeader 
        basics={basics} 
        theme={theme} 
        align={theme.headerAlignment || 'left'} 
        photoPosition={theme.showPhoto ? 'left' : 'none'}
        showBorders={false}
      />

      {/* Summary */}
      {summary && summary.visible !== false && summary.content && (
        <section style={{ marginBottom: '1.25rem' }}>
          <TemplateSectionHeading 
            title={summary.title || 'Profile'} 
            theme={theme} 
            styleOverride={theme.sectionHeadingStyle || 'minimal'}
          />
          <div style={{ color: '#334155', lineHeight: 1.65, borderLeft: `2px solid ${accent}22`, paddingLeft: '0.85rem' }}>
            {renderFormattedText(summary.content)}
          </div>
        </section>
      )}

      {/* Experience */}
      {experience && experience.filter(e => e.visible !== false).length > 0 && (
        <section style={{ marginBottom: '1.25rem' }}>
          <TemplateSectionHeading 
            title={cv.experienceMeta?.title || 'Experience'} 
            theme={theme} 
            styleOverride={theme.sectionHeadingStyle || 'minimal'}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {experience.filter(e => e.visible !== false).map((item) => (
              <ExperienceEntry key={item.id} item={item} theme={theme} layout="standard" />
            ))}
          </div>
        </section>
      )}

      {/* Skills */}
      {skills && skills.filter(s => s.visible !== false).length > 0 && (
        <section style={{ marginBottom: '1.25rem' }}>
          <TemplateSectionHeading 
            title={cv.skillsMeta?.title || 'Expertise'} 
            theme={theme} 
            styleOverride={theme.sectionHeadingStyle || 'minimal'}
          />
          <SkillsList 
            skills={skills.filter(s => s.visible !== false)} 
            theme={theme} 
            styleOverride={theme.skillStyle || 'pills'}
          />
        </section>
      )}

      {/* Projects */}
      {projects && projects.filter(p => p.visible !== false).length > 0 && (
        <section style={{ marginBottom: '1.25rem' }}>
          <TemplateSectionHeading 
            title={cv.projectsMeta?.title || 'Selected Projects'} 
            theme={theme} 
            styleOverride={theme.sectionHeadingStyle || 'minimal'}
          />
          <ProjectsList projects={projects} theme={theme} />
        </section>
      )}

      {/* Education */}
      {education && education.filter(e => e.visible !== false).length > 0 && (
        <section style={{ marginBottom: '1.25rem' }}>
          <TemplateSectionHeading 
            title={cv.educationMeta?.title || 'Education'} 
            theme={theme} 
            styleOverride={theme.sectionHeadingStyle || 'minimal'}
          />
          {education.filter(e => e.visible !== false).map((item) => (
            <EducationEntry key={item.id} item={item} theme={theme} />
          ))}
        </section>
      )}

      {/* Certifications */}
      {certifications && certifications.filter(c => c.visible !== false).length > 0 && (
        <section style={{ marginBottom: '1.25rem' }}>
          <TemplateSectionHeading 
            title="Certifications" 
            theme={theme} 
            styleOverride={theme.sectionHeadingStyle || 'minimal'}
          />
          <CertificationsList certifications={certifications} theme={theme} />
        </section>
      )}
    </PrintContainer>
  );
};
