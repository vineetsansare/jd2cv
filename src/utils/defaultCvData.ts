import type { StructuredCV } from '../types/cvBuilder';

export const DEFAULT_CV_DATA: StructuredCV = {
  id: 'master-base-cv',
  title: 'Executive Base Resume',
  updatedAt: new Date().toISOString(),
  basics: {
    fullName: 'Vineet Makarand Sansare',
    headline: 'Engineering Manager & Solutions Architect',
    email: 'vineetsansare@gmail.com',
    phone: '+971-5868-0-3131',
    location: 'Dubai, UAE',
    website: 'https://toolsby.vineetsansare.com',
    avatarUrl: '',
    showAvatar: true,
    avatarShape: 'circle',
    links: [
      { id: '1', network: 'LinkedIn', username: 'vineetsansare', url: 'https://linkedin.com/in/vineetsansare' },
      { id: '2', network: 'Portfolio', username: 'toolsby.vineetsansare.com', url: 'https://toolsby.vineetsansare.com' }
    ]
  },
  summary: {
    title: 'Executive Profile',
    content: 'Results-driven **Lead Engineering** professional with **15+ years of experience** delivering large-scale digital platforms across **mobile, web, and cloud APIs** within demanding fintech and enterprise banking environments. Proven track record of leading **high-performing engineering teams**, driving end-to-end greenfield delivery, and modernizing complex systems for **UAE & GCC financial markets**.',
    visible: true
  },
  experience: [
    {
      id: 'exp-1',
      role: 'Engineering Tech Lead',
      company: 'Emirates NBD',
      location: 'Dubai, UAE',
      startDate: 'Oct 2022',
      endDate: 'Present',
      isCurrent: true,
      visible: true,
      bullets: [
        'Provided **technical leadership and direct management for high-performing engineering teams of 8-10 engineers** across mobile, web, and microservices.',
        'Partnered with Solution Architects to define and design modular, API-driven architectures for flagship **Digital Wealth platforms**, spearheading greenfield delivery of trading systems for equities and mutual funds.',
        'Generated a **30% engagement surge across 25,000+ active accounts** and **AED 200M+ in trading turnover** directly within the digital banking app.',
        'Drove engineering excellence by establishing automated testing paradigms, cutting post-release regression defects by **40%** and achieving **90%+ code coverage**.',
        'Pioneered tribe-wide adoption of **Generative AI developer tooling**, accelerating time-to-market by **40-50%** and executing internal upskilling for **200+ engineers**.'
      ]
    },
    {
      id: 'exp-2',
      role: 'Lead Architect & Engineering Manager',
      company: 'Digital Solutions Group',
      location: 'Dubai, UAE',
      startDate: 'Jan 2018',
      endDate: 'Sep 2022',
      isCurrent: false,
      visible: true,
      bullets: [
        'Architected mission-critical mobile banking and payment gateway SDKs adopted by **1.2M+ active regional users**.',
        'Spearheaded CI/CD automation and test pipelines, reducing cycle release times from **14 days to under 4 hours**.',
        'Mentored and grew engineering squads across iOS, Android, React, and Node.js microservices.'
      ]
    }
  ],
  education: [
    {
      id: 'edu-1',
      degree: 'Bachelor of Engineering (Computer Science)',
      institution: 'University of Mumbai',
      location: 'Mumbai, India',
      startDate: '2004',
      endDate: '2008',
      score: 'First Class with Distinction',
      visible: true
    }
  ],
  skills: [
    {
      id: 'skill-1',
      categoryName: 'Leadership & Architecture',
      skills: ['Engineering Management', 'System Architecture', 'Agile / Scrum', 'Team Mentorship', 'Technical Hiring', 'Fintech & WealthTech'],
      visible: true
    },
    {
      id: 'skill-2',
      categoryName: 'Tech Stack & Cloud',
      skills: ['React', 'TypeScript', 'Node.js', 'Swift (iOS)', 'Kotlin (Android)', 'GraphQL', 'Docker', 'AWS / Cloud', 'Supabase / PostgreSQL'],
      visible: true
    }
  ],
  projects: [
    {
      id: 'proj-1',
      title: 'JD2CV - AI Resume Optimization Workspace',
      subtitle: 'Creator & Architect',
      url: 'https://toolsby.vineetsansare.com/jd2cv/',
      githubUrl: 'https://github.com/vineetsansare/ai-cv-optimizer',
      startDate: '2025',
      endDate: 'Present',
      technologies: ['React', 'TypeScript', 'Gemini AI', 'Supabase', 'Vite'],
      bullets: [
        'Architected an end-to-end ATS resume optimizer with multi-model LLM failover cascade and A4 PDF printing engine.',
        'Adopted by job seekers worldwide with sub-second live rendering and zero model-training data security guarantee.'
      ],
      visible: true
    }
  ],
  certifications: [
    {
      id: 'cert-1',
      name: 'AWS Certified Solutions Architect',
      issuer: 'Amazon Web Services',
      date: '2023',
      url: 'https://aws.amazon.com/verification',
      visible: true
    }
  ],
  customSections: [],
  theme: {
    templateId: 'modern-timeline',
    accentColor: '#1e3a8a',
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 'standard',
    lineHeight: 'normal',
    pageMargin: 'standard',
    showIcons: true
  }
};
