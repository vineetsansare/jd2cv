import dotenv from 'dotenv';
dotenv.config();
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
  plan: 'free' | 'byok' | 'pro';
  generationCount: number;
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
      isAdmin: true
    };
  }

  // 2. Supabase User Token Check
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    reply.status(401).send({ error: 'Invalid user session or token' });
    throw new Error('Unauthorized');
  }

  // Fetch the user's profile to get their plan, generation count, and admin status
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('plan, generation_count, is_admin')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    reply.status(500).send({ error: 'Failed to retrieve user profile' });
    throw new Error('Database Error');
  }

  const email = user.email || '';
  const isAdmin = isUserAdmin(email, profile.is_admin);

  return {
    id: user.id,
    email,
    plan: profile.plan as 'free' | 'byok' | 'pro',
    generationCount: profile.generation_count || 0,
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
