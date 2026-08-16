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
      "- EXECUTIVE PROFILE: Exactly 2 concise sentences (max 40 words).\n" +
      "- PROFESSIONAL EXPERIENCE: Include ONLY the top 2-3 most recent/relevant roles. Provide EXACTLY 2 high-impact bullet points per role.\n" +
      "- CONSOLIDATE OLDER ROLES: For roles older than 6 years, combine them into a single 1-line career note (e.g. '*Prior Experience: Senior iOS Engineer at Hexaware (2010-2016)*'). DO NOT write full bullet lists for more than 3 roles.\n" +
      "- TECHNICAL SKILLS: Maximum 4 category bullet lines.\n" +
      "- DO NOT EXCEED 320 WORDS TOTAL OR IT WILL SPILL ONTO PAGE 2!";
  } else if (targetLength === '2-page') {
    lengthConstraint = "STRICT 2-PAGE PHYSICAL PRINT CEILING (MAX 600-720 WORDS TOTAL):\n" +
      "- The generated resume MUST fit onto EXACTLY 2 A4 PAGES without spilling onto Page 3.\n" +
      "- Include roles from the last 10-12 years, providing 3 bullets per major role. Do not exceed 720 words total!";
  } else {
    lengthConstraint = "Comprehensive CV Format: Provide a detailed multi-page CV.";
  }

  const systemPrompt = `You are a World-Class Senior Executive Technical Recruiter with 20+ years of experience shortlisting top 1% candidates.
Rewrite the candidate's resume/career history to perfectly align with a target Job Description (JD) and write a customized cover letter.

CRITICAL DIRECTIVES:
1. Senior Recruiter Voice: Write in an authentic, confident, human voice. NEVER use robotic AI tropes or empty fluff (synergy, spearheaded).
2. Fact-Based Truthfulness: Rely ONLY on facts, roles, and achievements present in the provided career history. Do NOT invent jobs.
3. ATS Precision (>95% Match Score): Seamlessly embed high-value technical keywords into accomplishments and skills.
${lengthConstraint}
4. Return valid JSON matching schema: {"cvMarkdown": string, "atsScore": number, "atsAnalysis": {"matchedKeywords":[], "missingKeywords":[], "strengths":[], "weaknesses":[], "actionItems":[]}, "humanFriendlyChanges":[], "coverLetter": string}`;

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
