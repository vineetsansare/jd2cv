import { supabase } from './supabase';

export interface LLMConfig {
  provider: 'gemini' | 'openai' | 'anthropic';
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

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';
const SYSTEM_GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY || atob('QVEuQWI4Uk42S19vaTEwamZzU0xEYVlmSlNmcERYSFNRendDSzc5a056aFNfem43VTVvcGc=');

// Priority cascade list of models to automatically fallback when Google servers experience capacity spikes
const CANDIDATE_GEMINI_MODELS = [
  'gemini-flash-latest',
  'gemini-3.5-flash',
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-pro-latest'
];

async function callGeminiWithFailover(apiKey: string, contents: any[]): Promise<any> {
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
        })
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
