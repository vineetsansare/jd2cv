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

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

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
    console.warn('Backend proxy unreachable or failed, attempting direct client fallback:', err);
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
    console.warn('Backend proxy unreachable or failed, attempting direct client fallback:', err);
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
  const apiKey = config.apiKey || import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_OPENAI_API_KEY || '';
  if (!apiKey) {
    throw new Error('Server proxy unreachable (Failed to fetch). Please enter your API key in Settings (or run the backend server).');
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
The output MUST look, read, and feel like a $200+ executive resume rewrite that candidates will instantly love and be eager to pay for.

CRITICAL DIRECTIVES & QUALITY STANDARDS:
1. DUAL-LAYER ORGANIC ATS KEYWORD WEAVING (>95% MATCH TARGET):
   - PRIMARY LAYER (Work Experience Bullets): Identify all critical technical, domain, and methodology keywords from the target JD. FIRST, naturally weave these keywords directly into accomplishment bullet points under the candidate's actual work experience using Google's XYZ Metric Formula ("Accomplished [X], as measured by [Y], by implementing [Z]").
   - OVERFLOW LAYER (Technical Skills Section): Technical keywords, tools, or frameworks that cannot naturally fit into experience bullet points without bloating the physical page count MUST be organized neatly under "## TECHNICAL SKILLS & COMPETENCIES".
   - SLEEK SKILLS SECTION: Keep the TECHNICAL SKILLS section sleek and non-bulky. Group into a maximum of 4 tight category bullet lines. Limit each line to the top 6-8 most relevant keywords.
2. UNBROKEN CAREER TIMELINE (ZERO CAREER GAPS):
   - Maintain 100% complete chronological integrity from the candidate's earliest position to their current role. NEVER drop past companies. Compress older roles into 1-line notes in 1-page/2-page modes.
3. ANTI-REPETITION & RECRUITER VOICE:
   - NEVER use robotic AI tropes (synergy, spearheaded, testament to, proven track record of).
   - VARY ACTION VERBS: Never start two consecutive bullet points with the same verb. Use strong action verbs (Architected, Orchestrated, Modernized, Refactored, Accelerated, Engineered).
   - SELECTIVE METRIC BOLDING: Use bolding (**30% surge**, **$100M+ volume**) strategically to draw eye-tracking in 6 seconds.
4. ${lengthConstraint}
5. SECTION STRUCTURE:
   # [Candidate Name]
   *[Target Job Title from JD]*
   email | phone | location | linkedin
   ## EXECUTIVE PROFILE
   ## PROFESSIONAL EXPERIENCE
   ## TECHNICAL SKILLS & COMPETENCIES
   ## CORE IMPACT & CAREER HIGHLIGHTS
   ## EDUCATION
   ## AWARDS & RECOGNITION (Include if awards, honors, patents, or certifications exist)
6. CUSTOM COVER LETTER: Write a short, punchy 3-paragraph executive cover letter (under 150 words total) targeted to the hiring team in the JD.

Return valid JSON matching schema: {"cvMarkdown": string, "atsScore": number, "atsAnalysis": {"matchedKeywords":[], "missingKeywords":[], "strengths":[], "weaknesses":[], "actionItems":[]}, "humanFriendlyChanges":[], "coverLetter": string}`;

  const userPrompt = `TARGET JOB DESCRIPTION:\n${jobDescription}\n\nCANDIDATE CAREER HISTORY:\n${contextCVs.map((cv, idx) => `[Profile #${idx + 1}: ${cv.name}]\n${cv.text}`).join('\n\n')}\n\n${aspirations ? `USER ASPIRATIONS: ${aspirations}\n` : ''}`;

  if (config.provider === 'openai') {
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
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

  // Default to Gemini API
  const modelName = config.model || 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        { role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}\n\nReturn JSON matching schema.` }] }
      ],
      generationConfig: {
        responseMimeType: 'application/json'
      }
    })
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gemini API Error: ${resp.statusText}`);
  }

  const data = await resp.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return JSON.parse(rawText);
}

async function callDirectAutoFixClient(
  config: LLMConfig,
  currentMarkdown: string,
  jobDescription: string,
  atsAnalysis: ATSAnalysis
): Promise<CVGenerationResult> {
  const apiKey = config.apiKey || import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_OPENAI_API_KEY || '';
  if (!apiKey) {
    throw new Error('Server proxy unreachable (Failed to fetch). Please enter your API key in Settings.');
  }

  const systemPrompt = `You are an expert resume writer specializing in ATS optimization. Rewrite the CV to organically weave in missing keywords. Return valid JSON matching schema.`;
  const userPrompt = `CURRENT CV:\n${currentMarkdown}\n\nTARGET JD:\n${jobDescription}\n\nMISSING KEYWORDS:\n${atsAnalysis.missingKeywords.join(', ')}`;

  if (config.provider === 'openai') {
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
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

  const modelName = config.model || 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        { role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}\n\nReturn JSON matching schema.` }] }
      ],
      generationConfig: {
        responseMimeType: 'application/json'
      }
    })
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gemini API Error: ${resp.statusText}`);
  }

  const data = await resp.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return JSON.parse(rawText);
}

// Client-side helper for managing user-configured keys in the database (BYOK)
export async function saveUserAPIKey(provider: 'gemini' | 'openai' | 'anthropic', apiKey: string): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('User not authenticated');

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

  const response = await fetch(`${BACKEND_URL}/api/keys`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${session.access_token}`
    }
  });

  if (!response.ok) {
    return { gemini: false, openai: false, anthropic: false };
  }

  return response.json();
}
