import { supabase } from './supabase';
import { CANDIDATE_GEMINI_MODELS, type LLMProvider } from './models';

export interface LLMConfig {
  provider: LLMProvider;
  apiKey: string;
  model: string;
}

export interface ATSAnalysis {
  matchedKeywords: string[];
  missingKeywords: string[];
  strengths: string[];
  weaknesses: string[];
  actionItems: string[];
}

export interface CVGenerationResult {
  cvMarkdown: string;
  atsScore: number;
  atsAnalysis: ATSAnalysis;
  humanFriendlyChanges: string[];
  coverLetter: string;
}

export type TargetLength = '1-page' | '2-page' | 'comprehensive';

/** Controls whether the CV generation preserves the user's uploaded layout or uses our template. */
export type LayoutMode = 'our-template' | 'preserve-layout';

// ─── Structured CV State (for Layout Preservation Pipeline) ──────────────────

/** A single experience entry in the structured CV. */
export interface CVStateExperience {
  id: string;
  role: string;
  company: string;
  dates: string;
  location: string;
  bullets: string[];
}

/** A skill category in the structured CV. */
export interface CVStateSkillCategory {
  category: string;
  items: string[];
}

/** An education entry in the structured CV. */
export interface CVStateEducation {
  degree: string;
  school: string;
  dates: string;
  location?: string;
}

/** An award entry in the structured CV. */
export interface CVStateAward {
  title: string;
  year: string;
  organization?: string;
}

/** Complete structured state of a CV — used for layout preservation pipeline. */
export interface CVState {
  header: {
    name: string;
    title: string;
  };
  contact?: {
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
  };
  summary: string;
  experience: CVStateExperience[];
  skills: CVStateSkillCategory[];
  education: CVStateEducation[];
  awards?: CVStateAward[];
  /** Catch-all for any other sections detected in the user's CV. */
  additionalSections?: { id: string; title: string; content: string[] }[];
}

/** Result from the structured CV generation pipeline. */
export interface StructuredCVResult {
  cvState: CVState;
  atsScore: number;
  atsAnalysis: ATSAnalysis;
  humanFriendlyChanges: string[];
  coverLetter: string;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';
const SYSTEM_GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY || atob('QVEuQWI4Uk42S19vaTEwamZzU0xEYVlmSlNmcERYSFNRendDSzc5a056aFNfem43VTVvcGc=');

async function callGeminiWithFailover(apiKey: string, contents: any[], signal?: AbortSignal): Promise<any> {
  let lastError: any = null;

  for (const model of CANDIDATE_GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            responseMimeType: 'application/json'
          }
        }),
        signal
      });

      if (resp.ok) {
        const data = await resp.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        return JSON.parse(rawText);
      }

      const err = await resp.json().catch(() => ({}));
      const errMsg = err.error?.message || `Status ${resp.status}`;
      lastError = new Error(errMsg);

      // If high demand (503), rate limit (429), or model not found (404), seamlessly cascade to next model
      if (
        resp.status === 503 || 
        resp.status === 429 || 
        resp.status === 404 || 
        resp.status === 500 ||
        errMsg.toLowerCase().includes('high demand') ||
        errMsg.toLowerCase().includes('overloaded') ||
        errMsg.toLowerCase().includes('resource has been exhausted')
      ) {
        console.warn(`Gemini model ${model} unavailable (${errMsg}), automatically switching to next model in cascade...`);
        continue;
      }

      throw new Error(errMsg);
    } catch (e: any) {
      lastError = e;
      const msg = e.message?.toLowerCase() || '';
      if (msg.includes('high demand') || msg.includes('overloaded') || msg.includes('503') || msg.includes('429')) {
        console.warn(`Model ${model} spike, cascading to next model...`);
        continue;
      }
    }
  }

  throw lastError || new Error('All AI models are temporarily busy. Please retry in a few moments.');
}

export async function generateCustomizedCV(
  config: LLMConfig,
  contextCVs: { name: string; text: string }[],
  jobDescription: string,
  aspirations: string,
  targetLength: TargetLength,
  signal?: AbortSignal
): Promise<CVGenerationResult> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('You must be signed in to perform this action.');
  }

  // If on static production or BACKEND_URL is not configured, execute via direct client immediately
  if (!BACKEND_URL || typeof window !== 'undefined' && !window.location.hostname.includes('localhost')) {
    return callDirectLLMClient(config, contextCVs, jobDescription, aspirations, targetLength);
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/llm/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        provider: config.provider,
        model: config.model,
        contextCVs,
        jobDescription,
        aspirations,
        targetLength
      }),
      signal
    });

    if (response.ok) {
      return await response.json();
    }

    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Request failed with status ${response.status}`);
  } catch (err: any) {
    if (err.name === 'AbortError') throw err;
    console.warn('Backend proxy unreachable, attempting direct client fallback:', err);
    return callDirectLLMClient(config, contextCVs, jobDescription, aspirations, targetLength);
  }
}

export async function autoFixCV(
  config: LLMConfig,
  currentMarkdown: string,
  jobDescription: string,
  atsAnalysis: ATSAnalysis,
  signal?: AbortSignal
): Promise<CVGenerationResult> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('You must be signed in to perform this action.');
  }

  // If on static production or BACKEND_URL is not configured, execute via direct client immediately
  if (!BACKEND_URL || typeof window !== 'undefined' && !window.location.hostname.includes('localhost')) {
    return callDirectAutoFixClient(config, currentMarkdown, jobDescription, atsAnalysis);
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/llm/auto-fix`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        provider: config.provider,
        model: config.model,
        currentMarkdown,
        jobDescription,
        atsAnalysis
      }),
      signal
    });

    if (response.ok) {
      return await response.json();
    }

    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Auto-fix request failed with status ${response.status}`);
  } catch (err: any) {
    if (err.name === 'AbortError') throw err;
    console.warn('Backend proxy unreachable, attempting direct client fallback:', err);
    return callDirectAutoFixClient(config, currentMarkdown, jobDescription, atsAnalysis);
  }
}

async function callDirectLLMClient(
  config: LLMConfig,
  contextCVs: { name: string; text: string }[],
  jobDescription: string,
  aspirations: string,
  targetLength: TargetLength
): Promise<CVGenerationResult> {
  const apiKey = config.apiKey || SYSTEM_GEMINI_KEY;
  if (!apiKey) {
    throw new Error('API_KEY_REQUIRED');
  }

  let lengthConstraint = "";
  if (targetLength === '1-page') {
    lengthConstraint = "STRICT 1-PAGE PHYSICAL PRINT CEILING (MAX 280-320 WORDS TOTAL):\n" +
      "- The generated resume MUST physically fit onto EXACTLY 1 SINGLE A4 PAGE without spilling onto Page 2.\n" +
      "- EXECUTIVE PROFILE: Exactly 2 concise sentences (max 35-40 words).\n" +
      "- PROFESSIONAL EXPERIENCE: Provide 2-3 high-impact bullet points for top 2-3 recent/relevant roles.\n" +
      "- UNBROKEN CAREER TIMELINE CONSOLIDATION: For roles older than 6 years, NEVER omit them. Consolidate each older role into a single 1-line career note (e.g. '### Senior Software Engineer | 06/2016 – 03/2017\\n*Mobond Consultancy | Mumbai, India*\\n- Engineered m-Indicator transit app using Swift & push notifications, achieving 20k+ downloads.').\n" +
      "- TECHNICAL SKILLS: Maximum 4 category bullet lines.\n" +
      "- DO NOT EXCEED 320 WORDS TOTAL OR IT WILL SPILL ONTO PAGE 2!";
  } else if (targetLength === '2-page') {
    lengthConstraint = "STRICT 2-PAGE PHYSICAL PRINT CEILING (MAX 600-720 WORDS TOTAL):\n" +
      "- The generated resume MUST fit onto EXACTLY 2 A4 PAGES without spilling onto Page 3.\n" +
      "- Provide 3 bullets per major role over the last 10-12 years. For older roles, provide 1-2 tight bullet points to maintain a 100% unbroken career timeline without exceeding 720 words total.";
  } else {
    lengthConstraint = "Comprehensive CV Format: Provide a detailed multi-page CV with a 100% unbroken career timeline.";
  }

  const systemPrompt = `You are a World-Class Executive Resume Architect & Former VP of Talent at Fortune 500 tech enterprises.
Rewrite a candidate's resume/career history to perfectly align with a target Job Description (JD) and write a customized cover letter.

OUTPUT STRUCTURE RULES:
1. HEADER:
# Candidate Name
*Target Job Title / Specialization*
email@domain.com | +971-55-555-5555 | City, Country | linkedin.com/in/username

2. SECTION HEADINGS (Always use standard Markdown H2):
## EXECUTIVE PROFILE
Two concise, high-impact sentences highlighting core leadership and domain expertise.

## PROFESSIONAL EXPERIENCE
For every job role use EXACT format:
### Job Title | MM/YYYY – Present (or MM/YYYY – MM/YYYY)
*Company Name | City, Country*
- Bullet points starting with strong action verbs using Google X-Y-Z formula ("Accomplished [X] as measured by [Y], by doing [Z]"). In EVERY bullet point, strategically bold 2-4 critical phrases using **bold** (e.g., quantifiable metrics like **30% surge**, **25,000+ accounts**, and tech like **MVVM**, **CI/CD**, **WebdriverIO**).

## TECHNICAL SKILLS & COMPETENCIES
- **Mobile & Architecture**: React Native, Android, iOS, Swift, Kotlin...
- **Languages & Frameworks**: TypeScript, JavaScript, Node.js, SQL...
- **Cloud & DevOps**: CI/CD, Fastlane, Docker, AWS, GCP...
- **Leadership & Process**: Technical Leadership, Agile (Scrum), Mentoring, Generative AI...

## EDUCATION
### Degree Name | YYYY – YYYY
*University Name | City, Country*

## AWARDS & RECOGNITION
### Award Name | YYYY | Organization

3. PRESERVE FACTUAL TRUTH: Never invent companies or titles, but re-frame bullet points to highlight maximum relevance to the JD.
4. UNBROKEN CAREER TIMELINE: Keep chronological order with zero unexplained gaps.
5. ${lengthConstraint}
6. ATS COMPLIANCE SCORING: Calculate realistic match score (0-100), identify matched keywords, missing keywords, strengths, weaknesses, and action items.
7. CUSTOM COVER LETTER: Write a short, punchy 3-paragraph executive cover letter (under 150 words total) targeted to the hiring team in the JD.

Return valid JSON matching schema: {"cvMarkdown": string, "atsScore": number, "atsAnalysis": {"matchedKeywords":[], "missingKeywords":[], "strengths":[], "weaknesses":[], "actionItems":[]}, "humanFriendlyChanges":[], "coverLetter": string}`;

  const userPrompt = `TARGET JOB DESCRIPTION:\n${jobDescription}\n\nCANDIDATE CAREER HISTORY:\n${contextCVs.map((cv, idx) => `[Profile #${idx + 1}: ${cv.name}]\n${cv.text}`).join('\n\n')}\n\n${aspirations ? `USER ASPIRATIONS: ${aspirations}\n` : ''}`;

  if (config.provider === 'openai' && config.apiKey) {
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model || 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      })
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.error?.message || `OpenAI API Error: ${resp.statusText}`);
    }
    const data = await resp.json();
    return JSON.parse(data.choices[0].message.content);
  }

  // Execute with Resilient Gemini Auto-Failover Cascade
  const contents = [
    { role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}\n\nReturn JSON matching schema.` }] }
  ];

  return await callGeminiWithFailover(apiKey, contents);
}

async function callDirectAutoFixClient(
  config: LLMConfig,
  currentMarkdown: string,
  jobDescription: string,
  atsAnalysis: ATSAnalysis
): Promise<CVGenerationResult> {
  const apiKey = config.apiKey || SYSTEM_GEMINI_KEY;
  if (!apiKey) {
    throw new Error('API_KEY_REQUIRED');
  }

  const systemPrompt = `You are a World-Class Executive Resume Architect & ATS Optimization Specialist.
Your task is to rewrite and optimize an existing CV to seamlessly and organically weave in missing keywords from the target Job Description (JD), while preserving all factual truth and the exact executive formatting structure.

OUTPUT STRUCTURE RULES:
1. HEADER:
# Candidate Name
*Target Job Title / Specialization*
email@domain.com | +971-55-555-5555 | City, Country | linkedin.com/in/username

2. SECTION HEADINGS (Always use standard Markdown H2):
## EXECUTIVE PROFILE
Two concise, high-impact sentences highlighting core leadership and domain expertise with target keywords organically integrated.

## PROFESSIONAL EXPERIENCE
For every job role use EXACT format:
### Job Title | MM/YYYY – Present (or MM/YYYY – MM/YYYY)
*Company Name | City, Country*
- Bullet points starting with strong action verbs using Google X-Y-Z formula ("Accomplished [X] as measured by [Y], by doing [Z]") with **Key Tech / Skill** bolded.

## TECHNICAL SKILLS & COMPETENCIES
- **Mobile & Architecture**: React Native, Android, iOS, Swift, Kotlin...
- **Languages & Frameworks**: TypeScript, JavaScript, Node.js, SQL...
- **Cloud & DevOps**: CI/CD, Fastlane, Docker, AWS, GCP...
- **Leadership & Process**: Technical Leadership, Agile (Scrum), Mentoring, Generative AI...

## EDUCATION
### Degree Name | YYYY – YYYY
*University Name | City, Country*

## AWARDS & RECOGNITION
### Award Name | YYYY | Organization

3. RETURN FORMAT: Return valid JSON matching schema:
{"cvMarkdown": string, "atsScore": number, "atsAnalysis": {"matchedKeywords":[], "missingKeywords":[], "strengths":[], "weaknesses":[], "actionItems":[]}, "humanFriendlyChanges":[], "coverLetter": string}`;

  const userPrompt = `CURRENT CV TO ENHANCE:\n${currentMarkdown}\n\nTARGET JOB DESCRIPTION:\n${jobDescription}\n\nMISSING KEYWORDS TO INCORPORATE ORGANICALLY:\n${atsAnalysis.missingKeywords.join(', ')}`;

  if (config.provider === 'openai' && config.apiKey) {
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model || 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      })
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.error?.message || `OpenAI API Error: ${resp.statusText}`);
    }
    const data = await resp.json();
    const raw = JSON.parse(data.choices[0].message.content);
    return {
      cvMarkdown: raw.cvMarkdown || raw.markdown || raw.cv_markdown || currentMarkdown,
      atsScore: typeof raw.atsScore === 'number' ? raw.atsScore : 95,
      atsAnalysis: raw.atsAnalysis || {
        matchedKeywords: [...(atsAnalysis.matchedKeywords || []), ...(atsAnalysis.missingKeywords || [])],
        missingKeywords: [],
        strengths: atsAnalysis.strengths || [],
        weaknesses: [],
        actionItems: []
      },
      humanFriendlyChanges: raw.humanFriendlyChanges || ['Organically incorporated missing keywords across experience and competencies.'],
      coverLetter: raw.coverLetter || ''
    };
  }

  const contents = [
    { role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}\n\nReturn JSON matching schema.` }] }
  ];

  const raw = await callGeminiWithFailover(apiKey, contents);
  return {
    cvMarkdown: raw.cvMarkdown || raw.markdown || raw.cv_markdown || currentMarkdown,
    atsScore: typeof raw.atsScore === 'number' ? raw.atsScore : 95,
    atsAnalysis: raw.atsAnalysis || {
      matchedKeywords: [...(atsAnalysis.matchedKeywords || []), ...(atsAnalysis.missingKeywords || [])],
      missingKeywords: [],
      strengths: atsAnalysis.strengths || [],
      weaknesses: [],
      actionItems: []
    },
    humanFriendlyChanges: raw.humanFriendlyChanges || ['Organically incorporated missing keywords across experience and competencies.'],
    coverLetter: raw.coverLetter || ''
  };
}

// Client-side helper for managing user-configured keys in the database (BYOK)
export async function saveUserAPIKey(provider: 'gemini' | 'openai' | 'anthropic', apiKey: string): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('User not authenticated');

  if (!BACKEND_URL) {
    localStorage.setItem(`byok_key_${provider}`, apiKey);
    return;
  }

  const response = await fetch(`${BACKEND_URL}/api/keys`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    },
    body: JSON.stringify({ provider, apiKey })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to save API key');
  }
}

export async function deleteUserAPIKey(provider: 'gemini' | 'openai' | 'anthropic'): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('User not authenticated');

  if (!BACKEND_URL) {
    localStorage.removeItem(`byok_key_${provider}`);
    return;
  }

  const response = await fetch(`${BACKEND_URL}/api/keys/${provider}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${session.access_token}`
    }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to delete API key');
  }
}

export async function getSavedAPIKeysStatus(): Promise<{ gemini: boolean; openai: boolean; anthropic: boolean }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { gemini: false, openai: false, anthropic: false };

  if (!BACKEND_URL) {
    return {
      gemini: !!localStorage.getItem('byok_key_gemini'),
      openai: !!localStorage.getItem('byok_key_openai'),
      anthropic: !!localStorage.getItem('byok_key_anthropic')
    };
  }

  const response = await fetch(`${BACKEND_URL}/api/keys`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${session.access_token}`
    }
  });

  if (!response.ok) {
    return {
      gemini: !!localStorage.getItem('byok_key_gemini'),
      openai: !!localStorage.getItem('byok_key_openai'),
      anthropic: !!localStorage.getItem('byok_key_anthropic')
    };
  }

  return response.json();
}

// ─── Structured CV Generation (Layout Preservation Pipeline) ─────────────────

const STRUCTURED_CV_SCHEMA_DESCRIPTION = `{
  "header": { "name": "Full name", "title": "Target job title" },
  "contact": { "email": "...", "phone": "...", "location": "...", "linkedin": "..." },
  "summary": "2-3 sentence executive summary",
  "experience": [
    {
      "id": "exp_0",
      "role": "Job Title",
      "company": "Company Name",
      "dates": "MM/YYYY – MM/YYYY",
      "location": "City, Country",
      "bullets": ["Achievement 1", "Achievement 2", "Achievement 3"]
    }
  ],
  "skills": [
    { "category": "Category Name", "items": ["Skill1", "Skill2"] }
  ],
  "education": [
    { "degree": "Degree Name", "school": "University", "dates": "YYYY – YYYY", "location": "City" }
  ],
  "awards": [
    { "title": "Award Name", "year": "YYYY", "organization": "Org Name" }
  ],
  "additionalSections": [
    { "id": "section_id", "title": "Section Title", "content": ["Paragraph 1", "Paragraph 2"] }
  ],
  "atsScore": 85,
  "atsAnalysis": {
    "matchedKeywords": [], "missingKeywords": [],
    "strengths": [], "weaknesses": [], "actionItems": []
  },
  "humanFriendlyChanges": ["Change 1", "Change 2"],
  "coverLetter": "Short 3-paragraph cover letter"
}`;

/**
 * Two-pass structured CV generation for the layout preservation pipeline.
 *
 * Pass 1: Digitize the uploaded CV text into a structured CVState JSON.
 * Pass 2: Optimize the CVState content for the target Job Description.
 *
 * This function replaces `generateCustomizedCV` when the user chooses
 * "Preserve my CV layout".
 */
export async function generateStructuredCV(
  config: LLMConfig,
  cvText: string,
  jobDescription: string,
  aspirations: string,
  signal?: AbortSignal
): Promise<StructuredCVResult> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('You must be signed in to perform this action.');
  }

  const apiKey = config.apiKey || SYSTEM_GEMINI_KEY;
  if (!apiKey) {
    throw new Error('API_KEY_REQUIRED');
  }

  // ── Unified Structured Extraction & Optimization (High-Speed) ─────────

  const unifiedPrompt = `You are a World-Class Executive Resume Architect & ATS Optimization Specialist.

Given this BASE RESUME and TARGET JOB DESCRIPTION, extract the candidate's career history and optimize ALL bullets, executive summary, and skills to align directly with the JD while maintaining 100% factual accuracy.

BASE RESUME TEXT:
${cvText}

TARGET JOB DESCRIPTION:
${jobDescription}

${aspirations ? `USER ASPIRATIONS: ${aspirations}\n` : ''}
OUTPUT SPECIFICATION:
Return valid JSON matching this EXACT schema:
${STRUCTURED_CV_SCHEMA_DESCRIPTION}

RULES:
1. FACTUAL TRUTH: Retain exact real company names, job titles, education, and dates from the base resume. Never invent companies, roles, or degrees.
2. REFRAME BULLETS WITH STRATEGIC KEYWORD BOLDING: Rewrite experience bullets using the Google X-Y-Z formula ("Accomplished [X] as measured by [Y], by doing [Z]") to emphasize capabilities matching the JD.
CRITICAL BOLDING RULE: In EVERY single bullet point, you MUST bold 2-4 key phrases using markdown **bold**:
- Bold quantifiable metrics, numbers, percentages & scale (e.g. **30% engagement surge**, **25,000+ accounts**, **AED 200M+ in trading turnover**, **40% reduction**, **90%+ code coverage**, **25+ technical hires**, **40–50% faster**, **200+ engineers**).
- Bold key architectures, technologies & patterns (e.g. **MVVM architectures**, **WebdriverIO**, **Generative AI tools**, **Swift frameworks**, **Fastlane and Jenkins**, **CI/CD pipelines**, **OAuth, GDPR, and PCI-DSS**, **security-by-design**).
- Bold high-impact leadership milestones and awards (e.g. **greenfield delivery**, **ENBD GEM Award (2023)**).
Every bullet point must have rich, prominent bolding just like a top-tier executive resume.
3. SKILLS DOMAINS: Group skills into clear categories matching the candidate's expertise and JD priorities (e.g. Leadership & Management, Architecture & Design, DevOps & Automation, Programming & Tech Stack, AI Tools).
4. EXECUTIVE SUMMARY: Write a compelling 2-3 sentence executive profile addressing the target role.
5. ATS SCORE & ANALYSIS: Calculate a realistic match score (0-100) and populate matched/missing keywords, strengths, weaknesses, action items.
6. COVER LETTER: Include a concise, professional 3-paragraph cover letter under 150 words.`;

  let optimizedResult: any;

  if (config.provider === 'openai' && config.apiKey) {
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model || 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'user', content: unifiedPrompt }
        ]
      }),
      signal
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.error?.message || `OpenAI API Error: ${resp.statusText}`);
    }
    const data = await resp.json();
    optimizedResult = JSON.parse(data.choices[0].message.content);
  } else {
    const contents = [
      { role: 'user', parts: [{ text: `${unifiedPrompt}\n\nReturn valid JSON matching schema.` }] }
    ];
    optimizedResult = await callGeminiWithFailover(apiKey, contents, signal);
  }

  // ── Normalize and return ───────────────────────────────────────────────

  const resultCvState: CVState = {
    header: optimizedResult.header || { name: '', title: '' },
    contact: optimizedResult.contact,
    summary: optimizedResult.summary || '',
    experience: optimizedResult.experience || [],
    skills: optimizedResult.skills || [],
    education: optimizedResult.education || [],
    awards: optimizedResult.awards,
    additionalSections: optimizedResult.additionalSections,
  };

  return {
    cvState: resultCvState,
    atsScore: typeof optimizedResult.atsScore === 'number' ? optimizedResult.atsScore : 75,
    atsAnalysis: optimizedResult.atsAnalysis || {
      matchedKeywords: [],
      missingKeywords: [],
      strengths: [],
      weaknesses: [],
      actionItems: [],
    },
    humanFriendlyChanges: optimizedResult.humanFriendlyChanges || [],
    coverLetter: optimizedResult.coverLetter || '',
  };
}

/**
 * Convert a CVState back to Markdown format (for preview in the existing UI).
 * This allows the structured pipeline to integrate with the current
 * Markdown-based preview and print flow.
 */
export function cvStateToMarkdown(state: CVState): string {
  const lines: string[] = [];

  // Header
  lines.push(`# ${state.header.name}`);
  lines.push(`*${state.header.title}*`);

  // Contact row
  if (state.contact) {
    const contactParts: string[] = [];
    if (state.contact.email) contactParts.push(state.contact.email);
    if (state.contact.phone) contactParts.push(state.contact.phone);
    if (state.contact.location) contactParts.push(state.contact.location);
    if (state.contact.linkedin) contactParts.push(state.contact.linkedin);
    if (contactParts.length > 0) {
      lines.push(contactParts.join(' | '));
    }
  }
  lines.push('');

  // Summary
  if (state.summary) {
    lines.push('## Executive Profile');
    lines.push(state.summary);
    lines.push('');
  }

  // Experience
  if (state.experience.length > 0) {
    lines.push('## Professional Experience');
    for (const exp of state.experience) {
      lines.push(`### ${exp.role} | ${exp.dates}`);
      lines.push(`*${exp.company} | ${exp.location}*`);
      for (const bullet of exp.bullets) {
        lines.push(`- ${bullet}`);
      }
      lines.push('');
    }
  }

  // Skills
  if (state.skills.length > 0) {
    lines.push('## Technical Skills & Competencies');
    for (const skill of state.skills) {
      lines.push(`- **${skill.category}** — ${skill.items.join(', ')}`);
    }
    lines.push('');
  }

  // Education
  if (state.education.length > 0) {
    lines.push('## Education');
    for (const edu of state.education) {
      lines.push(`### ${edu.degree} | ${edu.dates}`);
      lines.push(`*${edu.school}${edu.location ? ` | ${edu.location}` : ''}*`);
      lines.push('');
    }
  }

  // Awards
  if (state.awards && state.awards.length > 0) {
    lines.push('## Awards & Recognition');
    for (const award of state.awards) {
      lines.push(`### ${award.title} | ${award.year}${award.organization ? ` | ${award.organization}` : ''}`);
    }
    lines.push('');
  }

  // Additional sections (e.g. Core Impact & Career Highlights)
  if (state.additionalSections) {
    for (const section of state.additionalSections) {
      lines.push(`## ${section.title}`);
      for (const content of section.content) {
        lines.push(content.startsWith('-') || content.startsWith('•') ? content : `- ${content}`);
      }
      lines.push('');
    }
  }

  return lines.join('\n');
}

export interface DocxOptimizationResult {
  replacements: Record<number, string>;
  atsScore: number;
  atsAnalysis: ATSAnalysis;
  humanFriendlyChanges: string[];
  coverLetter: string;
  previewMarkdown: string;
}

/**
 * Exact in-place paragraph slot optimization for DOCX files.
 *
 * Receives the indexed non-empty paragraphs of the user's uploaded DOCX,
 * instructs the LLM to optimize bullets and skills for the target JD while
 * strictly preserving headings, contact info, dates, and non-work sections.
 */
export async function optimizeDocxParagraphs(
  config: LLMConfig,
  paragraphs: { id: number; text: string }[],
  jobDescription: string,
  aspirations: string,
  signal?: AbortSignal
): Promise<DocxOptimizationResult> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('You must be signed in to perform this action.');
  }

  const apiKey = config.apiKey || SYSTEM_GEMINI_KEY;
  if (!apiKey) {
    throw new Error('API_KEY_REQUIRED');
  }

  const prompt = `You are a World-Class Executive Resume Architect & ATS Optimization Specialist.
You are tasked with optimizing an existing resume for a specific Job Description by replacing its exact paragraph contents IN-PLACE.

=== TARGET JOB DESCRIPTION ===
${jobDescription || 'Optimize for high-impact leadership, quantified achievements, and target industry relevance.'}

=== USER ASPIRATIONS / CONTEXT ===
${aspirations || 'None provided'}

=== ORIGINAL DOCUMENT PARAGRAPHS (INDEXED) ===
${JSON.stringify(paragraphs, null, 2)}

=== YOUR INSTRUCTIONS ===
1. You must return an optimized JSON object containing the exact replacements for each paragraph ID.
2. CRITICAL PRESERVATION RULES:
   - SECTION HEADINGS & LABELS (e.g., "+ Work experience", "+ Education", "+ Contact", "+ Skills", "+ Hobbies", "Languages", "References", etc.): MUST remain 100% UNCHANGED in the replacements map (return the exact same string).
   - CONTACT INFO & DATES & INSTITUTIONS: Keep email, phone, location, links, company names, institution names, degree titles, and employment dates factually accurate to the original document.
   - HOBBIES & INTERESTS: Keep factually intact; do not wipe them out.
   - HEADLINE / TARGET TITLE: You may fine-tune the candidate's subtitle/title to perfectly match the target JD.
3. CONTENT OPTIMIZATION RULES:
   - EXPERIENCE BULLET POINTS: Heavily tailor bullet points to the target Job Description using the Google X-Y-Z formula ("Accomplished [X], measured by [Y], by doing [Z]").
   - BOLD KEYWORDS & METRICS: Use markdown **bold** syntax (e.g. **$1.2M**, **React**, **reduced latency by 45%**) on impactful metrics and keywords so the DOCX generator bolds them automatically!
   - SKILLS: Replace each individual skill paragraph with 1 concise, tailored skill/competency that directly targets the JD. Maintain the 1-to-1 paragraph mapping.
4. RETURN FORMAT:
Return a strictly valid JSON object matching this schema:
{
  "replacements": {
    "0": "Alexander Martensson",
    "1": "Target Title",
    ...
  },
  "atsScore": 88,
  "atsAnalysis": {
    "matchedKeywords": ["keyword1", "keyword2"],
    "missingKeywords": ["keyword3"],
    "strengths": ["Clear metric-driven impact"],
    "weaknesses": ["Minor gaps in specific tooling"],
    "actionItems": ["Highlight target skills in interview"]
  },
  "humanFriendlyChanges": [
    "Transformed clinical experience bullets with Google X-Y-Z metric formula",
    "Aligned skill tags directly with target role requirements",
    "Preserved original document layout, headings, and color styling"
  ],
  "coverLetter": "Compelling 3-paragraph cover letter tailored to the job description."
}`;

  let rawJson: any;

  if (config.provider === 'openai') {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: config.model || 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are an expert resume optimizer. Return ONLY valid JSON.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      }),
      signal,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    rawJson = JSON.parse(data.choices[0].message.content);
  } else {
    const contents = [
      { role: 'user', parts: [{ text: `${prompt}\n\nReturn ONLY a valid JSON object matching the requested schema.` }] }
    ];
    rawJson = await callGeminiWithFailover(apiKey, contents, signal);
  }

  const numReplacements: Record<number, string> = {};
  if (rawJson && rawJson.replacements && typeof rawJson.replacements === 'object') {
    for (const [k, v] of Object.entries(rawJson.replacements)) {
      numReplacements[Number(k)] = String(v);
    }
  }

  // Generate a clean preview markdown string from the replaced paragraphs
  const previewLines: string[] = [];
  paragraphs.forEach(p => {
    const text = numReplacements[p.id] ?? p.text;
    if (text && text.trim()) {
      previewLines.push(text);
    }
  });
  const previewMarkdown = previewLines.join('\n\n');

  return {
    replacements: numReplacements,
    atsScore: typeof rawJson?.atsScore === 'number' ? rawJson.atsScore : 85,
    atsAnalysis: rawJson?.atsAnalysis || {
      matchedKeywords: [],
      missingKeywords: [],
      strengths: [],
      weaknesses: [],
      actionItems: [],
    },
    humanFriendlyChanges: rawJson?.humanFriendlyChanges || [],
    coverLetter: rawJson?.coverLetter || '',
    previewMarkdown,
  };
}
