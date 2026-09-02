export interface LLMModelInfo {
  id: string;
  name: string;
  tag?: 'Recommended' | 'Flagship' | 'Reasoning' | 'Fast' | 'Latest' | 'Pro';
  description: string;
}

export type LLMProvider = 'gemini' | 'openai' | 'anthropic';

export const PROVIDER_MODELS: Record<LLMProvider, LLMModelInfo[]> = {
  gemini: [
    {
      id: 'gemini-2.5-flash',
      name: 'Gemini 2.5 Flash',
      tag: 'Recommended',
      description: 'Ultra-fast, high-accuracy generation optimized for resumes.'
    },
    {
      id: 'gemini-flash-latest',
      name: 'Gemini Flash (Latest)',
      tag: 'Latest',
      description: 'Automatically points to Google’s newest stable Flash release.'
    },
    {
      id: 'gemini-2.5-pro',
      name: 'Gemini 2.5 Pro',
      tag: 'Pro',
      description: 'Deep reasoning model for executive and complex multi-page CVs.'
    },
    {
      id: 'gemini-2.0-flash',
      name: 'Gemini 2.0 Flash',
      tag: 'Fast',
      description: 'Next-gen multimodal model with sub-second response times.'
    },
    {
      id: 'gemini-pro-latest',
      name: 'Gemini Pro (Latest)',
      tag: 'Latest',
      description: 'Always routes to the newest Pro-tier generation model.'
    }
  ],
  openai: [
    {
      id: 'gpt-4o',
      name: 'GPT-4o',
      tag: 'Flagship',
      description: 'OpenAI flagship model with superior instruction following.'
    },
    {
      id: 'gpt-4o-mini',
      name: 'GPT-4o Mini',
      tag: 'Fast',
      description: 'Cost-efficient, high-speed model with strong writing quality.'
    },
    {
      id: 'o3-mini',
      name: 'o3-mini',
      tag: 'Reasoning',
      description: 'High-speed reasoning model tailored for deep ATS keyword alignment.'
    },
    {
      id: 'o1',
      name: 'o1',
      tag: 'Reasoning',
      description: 'Advanced reasoning model for complex career pivots and executive rewrites.'
    },
    {
      id: 'o1-mini',
      name: 'o1-mini',
      tag: 'Reasoning',
      description: 'Fast reasoning model optimized for technical resumes and skills.'
    }
  ],
  anthropic: [
    {
      id: 'claude-3-7-sonnet-latest',
      name: 'Claude 3.7 Sonnet',
      tag: 'Flagship',
      description: 'Hybrid reasoning and prose model for top-tier executive resumes.'
    },
    {
      id: 'claude-3-5-sonnet-latest',
      name: 'Claude 3.5 Sonnet',
      tag: 'Recommended',
      description: 'Exceptional human-like writing and natural ATS keyword weaving.'
    },
    {
      id: 'claude-3-5-haiku-latest',
      name: 'Claude 3.5 Haiku',
      tag: 'Fast',
      description: 'Ultra-fast, responsive generation for quick iterations.'
    },
    {
      id: 'claude-3-opus-latest',
      name: 'Claude 3 Opus',
      tag: 'Pro',
      description: 'Deep analysis model for comprehensive career histories.'
    }
  ]
};

// Priority cascade list of models to automatically fallback when Google servers experience capacity spikes
export const CANDIDATE_GEMINI_MODELS: string[] = [
  'gemini-2.5-flash',
  'gemini-flash-latest',
  'gemini-2.0-flash',
  'gemini-2.5-pro',
  'gemini-pro-latest',
  'gemini-1.5-flash'
];

export const DEFAULT_PROVIDER: LLMProvider = 'gemini';
export const DEFAULT_MODEL: string = 'gemini-2.5-flash';
