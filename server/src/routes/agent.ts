import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import crypto from 'crypto';
import { authenticate, supabaseAdmin } from '../utils/auth.js';
import { generateCustomizedCVServer } from '../services/llm.js';
import { getPlatformApiKey } from './llm.js';
import { scrapeUrl } from '../utils/scraper.js';
import type { TargetLength } from '../types.js';

interface AgentGenerateBody {
  jobDescription?: string;
  url?: string;
  aspirations?: string;
  targetLength?: TargetLength;
  contextCVs?: { name: string; text: string }[];
  provider?: 'gemini' | 'openai' | 'anthropic';
  model?: string;
  redactPii?: boolean;
}

interface ScrapeBody {
  url: string;
}

interface TokenCreateBody {
  name?: string;
}

/**
 * GDPR Article 5(1)(c) Data Minimization Helper
 * Sanitizes high-sensitivity candidate PII before processing
 */
function maskPii(text: string): string {
  return text
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]')
    .replace(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, '[REDACTED_PHONE]')
    .replace(/\b\d{1,5}\s+[A-Za-z0-9\s.,]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way)\b/gi, '[REDACTED_ADDRESS]');
}

export default async function agentRoutes(fastify: FastifyInstance) {

  // GET /api/agent/profile - Check user status, tier, and generation quota / credits
  fastify.get('/profile', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = await authenticate(request, reply);
    return {
      id: user.id,
      email: user.email,
      plan: user.plan,
      generationCount: user.generationCount,
      credits: user.credits,
      quotaRemaining: user.plan === 'pro' ? 'unlimited' : `${user.credits} credits`
    };
  });

  // GET /api/agent/base-cv - Get active master CV text from database
  fastify.get('/base-cv', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = await authenticate(request, reply);

    const { data: cv, error } = await supabaseAdmin
      .from('cv_documents')
      .select('id, filename, extracted_text, uploaded_at')
      .eq('user_id', user.id)
      .order('uploaded_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return reply.status(500).send({ error: 'Failed to query base CV from database.' });
    }

    if (!cv) {
      return reply.status(404).send({
        error: 'No master CV found. Please upload your resume on the JD2CV dashboard first.',
        hasBaseCV: false
      });
    }

    return {
      hasBaseCV: true,
      cv: {
        id: cv.id,
        filename: cv.filename,
        extractedText: cv.extracted_text,
        uploadedAt: cv.uploaded_at,
        wordCount: cv.extracted_text ? cv.extracted_text.split(/\s+/).length : 0
      }
    };
  });

  // POST /api/agent/scrape - Clean text extractor for Job Posting or Company About Us URL (with SSRF protection)
  fastify.post('/scrape', async (request: FastifyRequest<{ Body: ScrapeBody }>, reply: FastifyReply) => {
    await authenticate(request, reply);
    const { url } = request.body || {};

    if (!url) {
      return reply.status(400).send({ error: 'Field "url" is required.' });
    }

    try {
      const result = await scrapeUrl(url);
      return result;
    } catch (err: any) {
      return reply.status(422).send({
        error: err.message || 'Failed to extract content from the provided URL.',
        advice: 'If this job board uses anti-bot protection (e.g. LinkedIn, Workday), please copy and paste the job description text directly.'
      });
    }
  });

  // POST /api/agent/generate - Primary generation endpoint for ChatGPT & Claude
  fastify.post('/generate', async (request: FastifyRequest<{ Body: AgentGenerateBody }>, reply: FastifyReply) => {
    const user = await authenticate(request, reply);
    const body = request.body || {};
    let jobDescription = body.jobDescription;
    const url = body.url;
    const aspirations = body.aspirations;
    const targetLength: TargetLength = body.targetLength || '2-page';
    let contextCVs = body.contextCVs;
    const redactPii = body.redactPii === true;

    // 1. Resolve Job Description (from raw text or URL)
    if (!jobDescription && url) {
      try {
        const scraped = await scrapeUrl(url);
        jobDescription = scraped.text;
      } catch (err: any) {
        return reply.status(422).send({
          error: `Could not fetch job description from URL: ${err.message}`,
          advice: 'Please pass the job description as raw text.'
        });
      }
    }

    if (!jobDescription || jobDescription.trim().length < 20) {
      return reply.status(400).send({
        error: 'Job description text or a valid accessible URL is required (minimum 20 characters).'
      });
    }

    // 2. Resolve Base CVs (from request contextCVs or user's master CV in database)
    if (!contextCVs || contextCVs.length === 0) {
      const { data: cv, error: cvError } = await supabaseAdmin
        .from('cv_documents')
        .select('filename, extracted_text')
        .eq('user_id', user.id)
        .order('uploaded_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cvError || !cv || !cv.extracted_text) {
        return reply.status(400).send({
          error: 'No base CV found on your JD2CV account. Please upload your master CV in JD2CV or provide contextCVs in the request.',
          needsBaseCV: true
        });
      }

      contextCVs = [{ name: cv.filename, text: cv.extracted_text }];
    }

    // Optional GDPR PII Redaction
    if (redactPii) {
      contextCVs = contextCVs.map(c => ({
        name: c.name,
        text: maskPii(c.text)
      }));
    }

    // 3. Resolve Dedicated LLM Defaults
    const selectedProvider: 'gemini' | 'openai' | 'anthropic' = body.provider || 'gemini';
    const selectedModel = body.model || (selectedProvider === 'gemini' ? 'gemini-2.5-flash' : selectedProvider === 'openai' ? 'gpt-4o' : 'claude-3-5-sonnet-20241022');
    const apiKey = getPlatformApiKey(selectedProvider);

    if (!apiKey) {
      return reply.status(500).send({
        error: `Server platform API key for '${selectedProvider}' is not configured.`
      });
    }

    // 4. Enforce Credit Balance (10 credits required)
    const REQUIRED_CREDITS = 10;
    if (user.credits < REQUIRED_CREDITS && user.plan !== 'pro') {
      return reply.status(402).send({
        error: `Insufficient credits (${user.credits} available). You need at least ${REQUIRED_CREDITS} credits to tailor a bespoke CV.`,
        limitReached: true,
        requiredCredits: REQUIRED_CREDITS,
        currentCredits: user.credits
      });
    }

    // 5. Execute LLM Engine Pass
    try {
      const result = await generateCustomizedCVServer(
        { provider: selectedProvider, model: selectedModel, apiKey },
        contextCVs,
        jobDescription,
        aspirations || '',
        targetLength
      );

      // Deduct 10 credits if on credit model
      let remainingCredits = user.credits;
      if (user.plan !== 'pro') {
        try {
          const { data: deductResult, error: deductError } = await supabaseAdmin.rpc('deduct_credits', {
            p_user_id: user.id,
            p_amount: REQUIRED_CREDITS,
            p_action: 'agent_cv_generation'
          });
          if (!deductError && deductResult?.success) {
            remainingCredits = deductResult.new_balance;
          } else {
            throw new Error('RPC fallback');
          }
        } catch {
          remainingCredits = Math.max(0, user.credits - REQUIRED_CREDITS);
          await supabaseAdmin
            .from('profiles')
            .update({ credits_balance: remainingCredits })
            .eq('id', user.id);
          try {
            await supabaseAdmin
              .from('credit_transactions')
              .insert({
                user_id: user.id,
                amount: -REQUIRED_CREDITS,
                balance_after: remainingCredits,
                action: 'agent_cv_generation'
              });
          } catch {
            // Ignore transaction insert error
          }
        }
      }

      // Update generation count
      await supabaseAdmin
        .from('profiles')
        .update({ generation_count: user.generationCount + 1 })
        .eq('id', user.id);

      // Log generation to database
      const { data: genRecord, error: insertError } = await supabaseAdmin
        .from('generations')
        .insert({
          user_id: user.id,
          job_description: jobDescription,
          aspirations: aspirations || '',
          target_length: targetLength,
          cv_markdown: result.cvMarkdown,
          cover_letter: result.coverLetter,
          ats_score: result.atsScore,
          ats_analysis: result.atsAnalysis,
          human_changes: result.humanFriendlyChanges,
          provider_used: selectedProvider,
          model_used: selectedModel
        })
        .select('id')
        .single();

      if (insertError) {
        fastify.log.warn(`Failed to save generation log: ${insertError.message}`);
      }

      const generationId = genRecord?.id || null;
      const appBaseUrl = process.env.APP_URL || 'https://toolsby.vineetsansare.com/jd2cv';
      const deepLinkUrl = generationId ? `${appBaseUrl}?genId=${generationId}` : appBaseUrl;

      return {
        ...result,
        generationId,
        deepLinkUrl,
        creditsRemaining: remainingCredits,
        privacyNote: redactPii ? 'PII was redacted prior to AI processing per GDPR minimization guidelines.' : undefined
      };
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: err.message || 'Generation failed' });
    }
  });

  // POST /api/agent/tokens - Generate a new Personal Access Token (for Claude MCP / CLI)
  fastify.post('/tokens', async (request: FastifyRequest<{ Body: TokenCreateBody }>, reply: FastifyReply) => {
    const user = await authenticate(request, reply);
    const { name = 'Agent Token' } = request.body || {};

    const rawToken = 'jd2cv_sk_' + crypto.randomBytes(24).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const { data, error } = await supabaseAdmin
      .from('personal_access_tokens')
      .insert({
        user_id: user.id,
        token_hash: tokenHash,
        name
      })
      .select('id, name, created_at')
      .single();

    if (error) {
      return reply.status(500).send({ error: 'Failed to create personal access token in database.' });
    }

    return {
      token: rawToken,
      id: data.id,
      name: data.name,
      createdAt: data.created_at,
      warning: 'Please copy this token now. For your security, this key is never stored in plain text and cannot be retrieved again.'
    };
  });

  // GET /api/agent/tokens - List user's active personal access tokens
  fastify.get('/tokens', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = await authenticate(request, reply);

    const { data, error } = await supabaseAdmin
      .from('personal_access_tokens')
      .select('id, name, last_used_at, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return reply.status(500).send({ error: 'Failed to fetch personal access tokens.' });
    }

    return { tokens: data || [] };
  });

  // DELETE /api/agent/tokens/:id - Revoke a personal access token (GDPR Right to Revocation)
  fastify.delete('/tokens/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const user = await authenticate(request, reply);
    const { id } = request.params;

    const { error } = await supabaseAdmin
      .from('personal_access_tokens')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      return reply.status(500).send({ error: 'Failed to revoke token.' });
    }

    return { success: true, message: 'Token successfully revoked and deleted.' };
  });
}
