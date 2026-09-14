import dotenv from 'dotenv';
dotenv.config();
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import type { FastifyRequest, FastifyReply } from 'fastify';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Supabase env variables are missing in the backend! Database features will not work.');
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

export interface AuthenticatedUser {
  id: string;
  email: string;
  plan: 'free' | 'pro';
  generationCount: number;
  credits: number;
  isAdmin: boolean;
}

const DEFAULT_ADMIN_EMAILS = ['vineetsansare@gmail.com', 'admin@vineetsansare.com', 'vineet@jd2cv.com'];

export function isUserAdmin(email: string, profileAdmin?: boolean): boolean {
  if (profileAdmin === true) return true;
  const envAdminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);
  
  const allAdmins = [...DEFAULT_ADMIN_EMAILS, ...envAdminEmails];
  if (email && allAdmins.includes(email.toLowerCase())) {
    return true;
  }
  return false;
}

const ADMIN_SECRET_TOKEN = process.env.ADMIN_SESSION_SECRET || 'jd2cv_admin_secret_token_secure_2026';

export async function authenticate(request: FastifyRequest, reply: FastifyReply): Promise<AuthenticatedUser> {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    reply.status(401).send({ error: 'Missing or invalid authorization token' });
    throw new Error('Unauthorized');
  }

  const token = authHeader.split(' ')[1];

  // 1. Direct Admin Token Check
  if (token === ADMIN_SECRET_TOKEN || token.startsWith('jd2cv_adm_')) {
    return {
      id: 'admin-root',
      email: 'admin@vineetsansare.com',
      plan: 'pro',
      generationCount: 9999,
      credits: 99999,
      isAdmin: true
    };
  }

  // 2. Personal Access Token Check (jd2cv_sk_...) for Claude MCP, ChatGPT, or CLI
  if (token.startsWith('jd2cv_sk_')) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const { data: pat, error: patError } = await supabaseAdmin
      .from('personal_access_tokens')
      .select('id, user_id')
      .eq('token_hash', tokenHash)
      .single();

    if (!patError && pat) {
      // Async update of last_used_at
      supabaseAdmin
        .from('personal_access_tokens')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', pat.id)
        .then();

      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('email, plan, credits_balance, generation_count, is_admin')
        .eq('id', pat.user_id)
        .single();

      if (!profileError && profile) {
        const rawPlan: 'free' | 'pro' = profile.plan === 'pro' ? 'pro' : 'free';
        return {
          id: pat.user_id,
          email: profile.email || '',
          plan: rawPlan,
          generationCount: profile.generation_count || 0,
          credits: typeof profile.credits_balance === 'number' ? profile.credits_balance : 10,
          isAdmin: isUserAdmin(profile.email || '', profile.is_admin)
        };
      }
    }

    reply.status(401).send({ error: 'Invalid or revoked Personal Access Token' });
    throw new Error('Unauthorized');
  }

  // 3. Supabase User Token Check (Session JWT or OAuth 2.0 Token)
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    reply.status(401).send({ error: 'Invalid user session or token' });
    throw new Error('Unauthorized');
  }

  // Fetch the user's profile to get their plan, credits, generation count, and admin status
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('plan, credits_balance, generation_count, is_admin')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    reply.status(500).send({ error: 'Failed to retrieve user profile' });
    throw new Error('Database Error');
  }

  const email = user.email || '';
  const isAdmin = isUserAdmin(email, profile.is_admin);
  const rawPlan: 'free' | 'pro' = profile.plan === 'pro' ? 'pro' : 'free';

  return {
    id: user.id,
    email,
    plan: rawPlan,
    generationCount: profile.generation_count || 0,
    credits: typeof profile.credits_balance === 'number' ? profile.credits_balance : 10,
    isAdmin
  };
}

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply): Promise<AuthenticatedUser> {
  const user = await authenticate(request, reply);
  if (!user.isAdmin) {
    reply.status(403).send({ error: 'Forbidden: Admin access required.' });
    throw new Error('Forbidden');
  }
  return user;
}
