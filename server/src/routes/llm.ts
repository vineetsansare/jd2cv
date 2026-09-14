import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authenticate } from '../utils/auth.js';
import { generateCustomizedCVServer, autoFixCVServer } from '../services/llm.js';
import { supabaseAdmin } from '../utils/auth.js';
import type { TargetLength, ATSAnalysis } from '../types.js';

const CREDITS_COST_GENERATE = 10;
const CREDITS_COST_AUTOFIX = 5;

interface GenerateBody {
  provider?: 'gemini' | 'openai' | 'anthropic';
  model?: string;
  contextCVs: { name: string; text: string }[];
  jobDescription: string;
  aspirations: string;
  targetLength: TargetLength;
}

interface AutoFixBody {
  provider?: 'gemini' | 'openai' | 'anthropic';
  model?: string;
  currentMarkdown: string;
  jobDescription: string;
  atsAnalysis: ATSAnalysis;
}

async function deductUserCredits(userId: string, currentCredits: number, amount: number, action: string): Promise<number> {
  try {
    const { data, error } = await supabaseAdmin.rpc('deduct_credits', {
      p_user_id: userId,
      p_amount: amount,
      p_action: action
    });
    if (!error && data && data.success) {
      return data.new_balance;
    }
  } catch (err) {
    console.warn('[Credits] RPC deduct_credits failed, using direct table update:', err);
  }

  // Resilient direct fallback
  const newBalance = Math.max(0, currentCredits - amount);
  await supabaseAdmin
    .from('profiles')
    .update({ credits_balance: newBalance })
    .eq('id', userId);

  try {
    await supabaseAdmin
      .from('credit_transactions')
      .insert({
        user_id: userId,
        amount: -amount,
        balance_after: newBalance,
        action
      });
  } catch {
    // Ignore logging transaction error
  }

  return newBalance;
}

export default async function llmRoutes(fastify: FastifyInstance) {
  
  // POST /api/llm/generate
  fastify.post('/generate', async (request: FastifyRequest<{ Body: GenerateBody }>, reply: FastifyReply) => {
    const user = await authenticate(request, reply);
    const { contextCVs, jobDescription, aspirations, targetLength } = request.body;

    // Check credit balance (requires 10 credits)
    if (user.credits < CREDITS_COST_GENERATE) {
      return reply.status(402).send({ 
        error: `Insufficient credits (${user.credits} available). You need at least ${CREDITS_COST_GENERATE} credits to tailor a bespoke CV.`,
        limitReached: true,
        requiredCredits: CREDITS_COST_GENERATE,
        currentCredits: user.credits
      });
    }

    // Always use dedicated server Gemini API Key
    const provider = 'gemini';
    const model = request.body.model || 'gemini-2.5-flash';
    const apiKey = getPlatformApiKey('gemini');

    if (!apiKey) {
      return reply.status(500).send({ error: 'Dedicated Gemini API key is not configured on the server.' });
    }

    try {
      const result = await generateCustomizedCVServer(
        { provider, model, apiKey },
        contextCVs,
        jobDescription,
        aspirations,
        targetLength
      );

      // Atomically deduct 10 credits
      const remainingCredits = await deductUserCredits(user.id, user.credits, CREDITS_COST_GENERATE, 'cv_generation');

      // Update generation count
      await supabaseAdmin
        .from('profiles')
        .update({ generation_count: user.generationCount + 1 })
        .eq('id', user.id);

      // Log generation history
      await supabaseAdmin.from('generations').insert({
        user_id: user.id,
        job_description: jobDescription,
        aspirations,
        target_length: targetLength,
        cv_markdown: result.cvMarkdown,
        cover_letter: result.coverLetter,
        ats_score: result.atsScore,
        ats_analysis: result.atsAnalysis,
        human_changes: result.humanFriendlyChanges,
        provider_used: provider,
        model_used: model
      });

      return {
        ...result,
        remainingCredits
      };
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({ error: error.message || 'Generation failed' });
    }
  });

  // POST /api/llm/auto-fix
  fastify.post('/auto-fix', async (request: FastifyRequest<{ Body: AutoFixBody }>, reply: FastifyReply) => {
    const user = await authenticate(request, reply);
    const { currentMarkdown, jobDescription, atsAnalysis } = request.body;

    // Check credit balance (requires 5 credits)
    if (user.credits < CREDITS_COST_AUTOFIX) {
      return reply.status(402).send({ 
        error: `Insufficient credits (${user.credits} available). You need at least ${CREDITS_COST_AUTOFIX} credits to run ATS Auto-Fix.`,
        limitReached: true,
        requiredCredits: CREDITS_COST_AUTOFIX,
        currentCredits: user.credits
      });
    }

    const provider = 'gemini';
    const model = request.body.model || 'gemini-2.5-flash';
    const apiKey = getPlatformApiKey('gemini');

    if (!apiKey) {
      return reply.status(500).send({ error: 'Dedicated Gemini API key is not configured on the server.' });
    }

    try {
      const result = await autoFixCVServer(
        { provider, model, apiKey },
        currentMarkdown,
        jobDescription,
        atsAnalysis
      );

      // Atomically deduct 5 credits
      const remainingCredits = await deductUserCredits(user.id, user.credits, CREDITS_COST_AUTOFIX, 'auto_fix');

      return {
        ...result,
        remainingCredits
      };
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({ error: error.message || 'Auto-fix failed' });
    }
  });
}

export function getPlatformApiKey(provider: string): string {
  if (provider === 'gemini') return process.env.GEMINI_API_KEY || '';
  if (provider === 'openai') return process.env.OPENAI_API_KEY || '';
  if (provider === 'anthropic') return process.env.ANTHROPIC_API_KEY || '';
  return '';
}
