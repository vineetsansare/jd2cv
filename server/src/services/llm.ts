import type { TargetLength, ATSAnalysis, CVGenerationResult } from '../types.js';

export interface LLMCallConfig {
  provider: 'gemini' | 'openai' | 'anthropic';
  model: string;
  apiKey: string;
}

export async function generateCustomizedCVServer(
  config: LLMCallConfig,
  contextCVs: { name: string; text: string }[],
  jobDescription: string,
  aspirations: string,
  targetLength: TargetLength
): Promise<CVGenerationResult> {
  let lengthConstraint = "";
  if (targetLength === '1-page') {
    lengthConstraint = "3. **STRICT 1-PAGE PHYSICAL PRINT CEILING (MAX 280-320 WORDS TOTAL)**:\n" +
      "   - The generated resume MUST physically fit onto EXACTLY 1 SINGLE A4 PAGE without spilling onto Page 2.\n" +
      "   - EXECUTIVE PROFILE: Exactly 2 concise sentences (max 35-40 words).\n" +
      "   - PROFESSIONAL EXPERIENCE: Provide 2-3 high-impact bullet points for the top 2-3 recent/relevant roles.\n" +
      "   - UNBROKEN CAREER TIMELINE CONSOLIDATION: For roles older than 6 years, NEVER omit them. Consolidate each older role into a single 1-line career note (e.g. '### Senior Software Engineer | 06/2016 – 03/2017\\n*Mobond Consultancy | Mumbai, India*\\n- Engineered m-Indicator transit app using Swift & push notifications, achieving 20k+ downloads.').\n" +
      "   - TECHNICAL SKILLS: Maximum 4 tight category bullet lines.\n" +
      "   - DO NOT EXCEED 320 WORDS TOTAL OR IT WILL SPILL ONTO PAGE 2!";
  } else if (targetLength === '2-page') {
    lengthConstraint = "3. **STRICT 2-PAGE PHYSICAL PRINT CEILING (MAX 600-720 WORDS TOTAL)**:\n" +
      "   - The generated resume MUST fit onto EXACTLY 2 A4 PAGES without spilling onto Page 3.\n" +
      "   - Provide 3 bullets per major role over the last 10-12 years. For older roles, provide 1-2 tight bullet points to maintain a 100% unbroken career timeline without exceeding 720 words total.";
  } else {
    lengthConstraint = "3. **Comprehensive CV Format**: Provide a detailed, multi-page Curriculum Vitae. Include all relevant past roles with comprehensive bullet points, maintaining a 100% unbroken chronological timeline.";
  }

  const systemPrompt = `You are a World-Class Executive Resume Architect & Former VP of Talent at Fortune 500 tech enterprises.
Your job is to rewrite a candidate's resume/career history to perfectly align with a target Job Description (JD) and write a customized cover letter.
The output MUST look, read, and feel like a $200+ executive resume rewrite that candidates will instantly love and be eager to pay for.

CRITICAL DIRECTIVES & QUALITY STANDARDS:

1. **DUAL-LAYER ORGANIC ATS KEYWORD WEAVING (>95% MATCH TARGET)**:
   - **PRIMARY LAYER (Work Experience Bullets)**: Identify all critical technical, domain, and methodology keywords from the target JD. FIRST, naturally weave these keywords directly into accomplishment bullet points under the candidate's actual work experience using Google's XYZ Metric Formula ("Accomplished [X], as measured by [Y], by implementing [Z]").
     * *Example*: Instead of just listing 'GraphQL' in skills, write: "* Architected **GraphQL subscriptions** and microservices to streamline mobile data fetching, reducing API latency by **38%** across 1.2M users."
   - **OVERFLOW LAYER (Technical Skills Section)**: Technical keywords, tools, or frameworks that cannot naturally fit into experience bullet points without bloating the physical page count MUST be organized neatly under "## TECHNICAL SKILLS & COMPETENCIES".
   - **SLEEK SKILLS SECTION**: Keep the TECHNICAL SKILLS section sleek, elegant, and non-bulky. Group into a maximum of 4 tight, high-impact category bullet lines (e.g. Mobile & Architecture, Languages & Frameworks, Cloud & DevOps, Leadership & Process). Limit each bullet line to the top 6-8 most relevant keywords matching the JD.

2. **UNBROKEN CAREER TIMELINE (ZERO CAREER GAPS)**:
   - Maintain 100% complete chronological integrity from the candidate's earliest position to their current role.
   - NEVER drop or omit past companies or roles present in the candidate's history.
   - For space-constrained modes (1-page or 2-page), include detailed bullets for primary/recent roles, and for older roles, compress them into 1-line career summaries so the recruiter sees a 100% continuous, gap-free career timeline.

3. **ANTI-REPETITION & SENIOR RECRUITER VOICE**:
   - Write in an authentic, confident, human voice. NEVER use robotic AI tropes, empty fluff, or generic buzzwords (e.g., 'synergy', 'spearheaded', 'testament to', 'proven track record of', 'results-driven leader').
   - **VARY ACTION VERBS**: NEVER start two consecutive bullet points with the same verb. Use strong, varied action verbs (e.g., Architected, Orchestrated, Modernized, Refactored, Accelerated, Engineered, Spearheaded).
   - **SELECTIVE METRIC BOLDING**: Use bolding (**30% surge**, **$100M+ volume**, **90%+ test coverage**) strategically on key technical terms and metrics to draw recruiter eye-tracking in 6 seconds.

4. ${lengthConstraint}

5. **REQUIRED SECTION STRUCTURE & FORMATTING**:
   - The top of the CV MUST start with:
     # [Candidate Name]
     *[Target Job Title from JD]*
     email | phone | location | linkedin
   - Job Experience headers MUST be formatted as:
     ### Job Title | Dates
     *Company Name | Location*
   - Standard section headings MUST be formatted as H2 headings:
     ## EXECUTIVE PROFILE
     ## PROFESSIONAL EXPERIENCE
     ## TECHNICAL SKILLS & COMPETENCIES
     ## CORE IMPACT & CAREER HIGHLIGHTS
     ## EDUCATION
     ## AWARDS & RECOGNITION (Include if awards, honors, patents, GEM awards, or certifications exist in candidate history)

6. **CUSTOM COVER LETTER (3-PARAGRAPH EMAIL NOTE)**:
   - Write a short, punchy, 3-paragraph executive cover letter (under 150 words total) tailored to the hiring team in the JD. Highlight top matches, explain interest, and make it effortless for a recruiter to shortlist the candidate.`;

  const userPrompt = `
=== TARGET JOB DESCRIPTION ===
${jobDescription}

=== CANDIDATE CAREER HISTORY ===
${contextCVs.map((cv, idx) => `[Profile #${idx + 1}: ${cv.name}]\n${cv.text}`).join('\n\n')}

${aspirations ? `=== USER ASPIRATIONS / CUSTOM FOCUS ===\n${aspirations}\n` : ''}

=== YOUR TASK ===
Carefully read the career history and the target Job Description. Generate a top 1% customized CV and 3-paragraph Cover Letter that adheres to all the strict guidelines above.
Return the output as a valid JSON object matching the requested schema.`;

  return callProvider(config, systemPrompt, userPrompt);
}

export async function autoFixCVServer(
  config: LLMCallConfig,
  currentMarkdown: string,
  jobDescription: string,
  atsAnalysis: ATSAnalysis
): Promise<CVGenerationResult> {
  const systemPrompt = `You are an expert resume writer specializing in ATS optimization.
Your job is to read an existing CV, analyze the target Job Description, and review the identified ATS gaps (missing keywords, weaknesses, action items).
You must rewrite the CV to organically integrate the missing keywords and resolve the weaknesses.

Strict rules:
1. Preserve all existing formatting, structure, headers, and details.
2. Integrate the missing keywords organically into bullet points of your professional experience or technical skills. Do NOT just dump them at the bottom.
3. Keep the content sounding human-written, not robotic.
4. Ensure the output is returned strictly as the requested JSON object.`;

  const userPrompt = `
=== CURRENT CV MARKDOWN ===
${currentMarkdown}

=== TARGET JOB DESCRIPTION ===
${jobDescription}

=== IDENTIFIED ATS GAPS ===
- Missing Keywords: ${atsAnalysis.missingKeywords.join(', ')}
- Weaknesses: ${atsAnalysis.weaknesses.join('; ')}
- Action Items: ${atsAnalysis.actionItems.join('; ')}

=== YOUR TASK ===
Modify the CV to organically weave in the missing keywords, resolve the weaknesses, and address the action items.
Return the output as a valid JSON object matching the requested schema.`;

  return callProvider(config, systemPrompt, userPrompt);
}

async function callProvider(config: LLMCallConfig, systemPrompt: string, userPrompt: string): Promise<CVGenerationResult> {
  if (config.provider === 'gemini') {
    return callGemini(config, systemPrompt, userPrompt);
  } else if (config.provider === 'openai') {
    return callOpenAI(config, systemPrompt, userPrompt);
  } else if (config.provider === 'anthropic') {
    return callAnthropic(config, systemPrompt, userPrompt);
  }
  throw new Error(`Unsupported provider: ${config.provider}`);
}

async function callGemini(config: LLMCallConfig, systemPrompt: string, userPrompt: string): Promise<CVGenerationResult> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`;

  const payload = {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents: [{ parts: [{ text: userPrompt }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          cvMarkdown: { type: 'STRING' },
          atsScore: { type: 'INTEGER' },
          atsAnalysis: {
            type: 'OBJECT',
            properties: {
              matchedKeywords: { type: 'ARRAY', items: { type: 'STRING' } },
              missingKeywords: { type: 'ARRAY', items: { type: 'STRING' } },
              strengths: { type: 'ARRAY', items: { type: 'STRING' } },
              weaknesses: { type: 'ARRAY', items: { type: 'STRING' } },
              actionItems: { type: 'ARRAY', items: { type: 'STRING' } }
            },
            required: ['matchedKeywords', 'missingKeywords', 'strengths', 'weaknesses', 'actionItems']
          },
          humanFriendlyChanges: { type: 'ARRAY', items: { type: 'STRING' } },
          coverLetter: { type: 'STRING' }
        },
        required: ['cvMarkdown', 'atsScore', 'atsAnalysis', 'humanFriendlyChanges', 'coverLetter']
      }
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error?.message || `Gemini API call failed with status ${response.status}`;

    // Automatic fallback to gemini-flash-latest if model error or 429 rate limit
    if (
      config.model !== 'gemini-flash-latest' &&
      (response.status === 429 ||
       response.status === 404 ||
       errorMessage.includes('not found') ||
       errorMessage.includes('Quota exceeded') ||
       errorMessage.includes('RESOURCE_EXHAUSTED') ||
       errorMessage.includes('limit: 0'))
    ) {
      console.warn(`[Gemini Fallback Triggered] Model '${config.model}' failed (${errorMessage}). Falling back to 'gemini-flash-latest'...`);
      return callGemini({ ...config, model: 'gemini-flash-latest' }, systemPrompt, userPrompt);
    }

    throw new Error(errorMessage);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Empty response from Gemini API.');
  }

  return JSON.parse(text) as CVGenerationResult;
}

async function callOpenAI(config: LLMCallConfig, systemPrompt: string, userPrompt: string): Promise<CVGenerationResult> {
  const url = 'https://api.openai.com/v1/chat/completions';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: config.model,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt + '\nIMPORTANT: You must return the output as a valid JSON object matching this TypeScript structure: { cvMarkdown: string, atsScore: number, atsAnalysis: { matchedKeywords: string[], missingKeywords: string[], strengths: string[], weaknesses: string[], actionItems: string[] }, humanFriendlyChanges: string[], coverLetter: string }' }
      ]
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `OpenAI API call failed with status ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('Empty response from OpenAI API.');
  }

  return JSON.parse(content) as CVGenerationResult;
}

async function callAnthropic(config: LLMCallConfig, systemPrompt: string, userPrompt: string): Promise<CVGenerationResult> {
  const url = 'https://api.anthropic.com/v1/messages';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 4000,
      system: systemPrompt,
      tools: [
        {
          name: 'submit_customized_cv',
          description: 'Submit the completed ATS-optimized CV, cover letter, and ATS keyword metrics.',
          input_schema: {
            type: 'object',
            properties: {
              cvMarkdown: {
                type: 'string',
                description: 'The complete customized CV in markdown format.'
              },
              atsScore: {
                type: 'integer',
                description: 'The calculated ATS score out of 100.'
              },
              atsAnalysis: {
                type: 'object',
                properties: {
                  matchedKeywords: { type: 'array', items: { type: 'string' } },
                  missingKeywords: { type: 'array', items: { type: 'string' } },
                  strengths: { type: 'array', items: { type: 'string' } },
                  weaknesses: { type: 'array', items: { type: 'string' } },
                  actionItems: { type: 'array', items: { type: 'string' } }
                },
                required: ['matchedKeywords', 'missingKeywords', 'strengths', 'weaknesses', 'actionItems']
              },
              humanFriendlyChanges: {
                type: 'array',
                items: { type: 'string' }
              },
              coverLetter: {
                type: 'string',
                description: 'The customized cover letter targeted to the JD.'
              }
            },
            required: ['cvMarkdown', 'atsScore', 'atsAnalysis', 'humanFriendlyChanges', 'coverLetter']
          }
        }
      ],
      tool_choice: {
        type: 'tool',
        name: 'submit_customized_cv'
      },
      messages: [
        { role: 'user', content: userPrompt }
      ]
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Anthropic API call failed with status ${response.status}`);
  }

  const data = await response.json();

  // Try extracting output from tool_use block first (guarantees valid JSON structure from Anthropic)
  const toolUseBlock = data.content?.find((block: any) => block.type === 'tool_use');
  if (toolUseBlock && toolUseBlock.input) {
    return toolUseBlock.input as CVGenerationResult;
  }

  // Fallback to text block parsing if tool_use was somehow bypassed
  const textBlock = data.content?.find((block: any) => block.type === 'text');
  const content = textBlock?.text;
  if (!content) {
    throw new Error('Empty response from Anthropic API.');
  }

  return resilientParseJSON<CVGenerationResult>(content);
}

function resilientParseJSON<T>(text: string): T {
  let cleaned = text.trim();
  
  // Strip markdown code block wrappers if present
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '');
    cleaned = cleaned.replace(/\s*```$/, '');
    cleaned = cleaned.trim();
  }

  try {
    return JSON.parse(cleaned) as T;
  } catch (firstErr) {
    // Attempt parsing by isolating the outermost JSON brackets
    const startIdx = cleaned.indexOf('{');
    const endIdx = cleaned.lastIndexOf('}');
    
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      const rawJson = cleaned.substring(startIdx, endIdx + 1);
      try {
        return JSON.parse(rawJson) as T;
      } catch (secondErr) {
        console.error('Failed to parse extracted JSON substring. Raw response:', cleaned);
        throw new Error(`JSON parsing failed: ${(secondErr as Error).message}.`);
      }
    }
    
    throw firstErr;
  }
}
