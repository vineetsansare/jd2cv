import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { requireAdmin, supabaseAdmin } from '../utils/auth.js';

export default async function adminRoutes(fastify: FastifyInstance) {

  // POST /api/admin/login - Authenticate with Username and Password
  fastify.post('/login', async (request: FastifyRequest<{
    Body: { username?: string; password?: string }
  }>, reply: FastifyReply) => {
    const { username, password } = request.body || {};
    const validUser = (process.env.ADMIN_USERNAME || 'admin').trim();
    const validPass = (process.env.ADMIN_PASSWORD || '@dmin190488').trim();

    if (username === validUser && password === validPass) {
      const token = 'jd2cv_adm_' + Buffer.from(`${username}_${Date.now()}`).toString('base64');
      return {
        success: true,
        token,
        username,
        email: 'admin@vineetsansare.com'
      };
    }

    return reply.status(401).send({ error: 'Invalid admin username or password' });
  });

  // GET /api/admin/verify - Verify admin status
  fastify.get('/verify', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const adminUser = await requireAdmin(request, reply);
      return { isAdmin: true, email: adminUser.email, userId: adminUser.id };
    } catch (err: any) {
      // requireAdmin already handles reply status
      return;
    }
  });

  // GET /api/admin/stats - Aggregated metrics & distributions
  fastify.get('/stats', async (request: FastifyRequest, reply: FastifyReply) => {
    await requireAdmin(request, reply);

    try {
      // 1. Fetch profiles summary
      const { data: profiles, error: profilesErr } = await supabaseAdmin
        .from('profiles')
        .select('id, email, plan, generation_count, is_admin, created_at');

      if (profilesErr) throw profilesErr;

      const totalUsers = profiles?.length || 0;
      const planBreakdown = { free: 0, byok: 0, pro: 0 };
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      let signupsToday = 0;
      let signupsThisWeek = 0;
      let signupsThisMonth = 0;

      (profiles || []).forEach(p => {
        const plan = (p.plan as 'free' | 'byok' | 'pro') || 'free';
        if (planBreakdown[plan] !== undefined) {
          planBreakdown[plan]++;
        } else {
          planBreakdown.free++;
        }

        const createdAt = new Date(p.created_at);
        if (createdAt >= oneDayAgo) signupsToday++;
        if (createdAt >= sevenDaysAgo) signupsThisWeek++;
        if (createdAt >= thirtyDaysAgo) signupsThisMonth++;
      });

      // 2. Fetch generations summary
      const { data: generations, error: genErr } = await supabaseAdmin
        .from('generations')
        .select('id, user_id, ats_score, provider_used, model_used, target_length, created_at, ats_analysis, job_description')
        .order('created_at', { ascending: false });

      if (genErr) throw genErr;

      const totalGenerations = generations?.length || 0;
      let generationsToday = 0;
      let generationsThisWeek = 0;
      let generationsThisMonth = 0;
      let totalAtsScore = 0;
      let scoredGenerationsCount = 0;

      const atsScoreBuckets = {
        under50: 0,
        from50to69: 0,
        from70to84: 0,
        from85to100: 0
      };

      const providerBreakdown: Record<string, number> = {};
      const modelBreakdown: Record<string, number> = {};
      const targetLengthBreakdown: Record<string, number> = {
        '1-page': 0,
        '2-page': 0,
        'comprehensive': 0,
        'executive': 0
      };

      const missingKeywordsCount: Record<string, number> = {};
      const matchedKeywordsCount: Record<string, number> = {};

      (generations || []).forEach(g => {
        const createdAt = new Date(g.created_at);
        if (createdAt >= oneDayAgo) generationsToday++;
        if (createdAt >= sevenDaysAgo) generationsThisWeek++;
        if (createdAt >= thirtyDaysAgo) generationsThisMonth++;

        // ATS Scores
        if (typeof g.ats_score === 'number' && g.ats_score > 0) {
          totalAtsScore += g.ats_score;
          scoredGenerationsCount++;

          if (g.ats_score < 50) atsScoreBuckets.under50++;
          else if (g.ats_score < 70) atsScoreBuckets.from50to69++;
          else if (g.ats_score < 85) atsScoreBuckets.from70to84++;
          else atsScoreBuckets.from85to100++;
        }

        // Provider & Model
        const prov = g.provider_used || 'gemini';
        providerBreakdown[prov] = (providerBreakdown[prov] || 0) + 1;

        const mdl = g.model_used || 'default';
        modelBreakdown[mdl] = (modelBreakdown[mdl] || 0) + 1;

        // Target Length
        const len = g.target_length || '2-page';
        targetLengthBreakdown[len] = (targetLengthBreakdown[len] || 0) + 1;

        // Keyword analysis from ats_analysis
        if (g.ats_analysis && typeof g.ats_analysis === 'object') {
          const analysis = g.ats_analysis as any;
          if (Array.isArray(analysis.missingKeywords)) {
            analysis.missingKeywords.forEach((kw: string) => {
              if (typeof kw === 'string' && kw.trim().length > 1) {
                const clean = kw.trim().toLowerCase();
                missingKeywordsCount[clean] = (missingKeywordsCount[clean] || 0) + 1;
              }
            });
          }
          if (Array.isArray(analysis.matchedKeywords)) {
            analysis.matchedKeywords.forEach((kw: string) => {
              if (typeof kw === 'string' && kw.trim().length > 1) {
                const clean = kw.trim().toLowerCase();
                matchedKeywordsCount[clean] = (matchedKeywordsCount[clean] || 0) + 1;
              }
            });
          }
        }
      });

      const avgAtsScore = scoredGenerationsCount > 0 ? Math.round(totalAtsScore / scoredGenerationsCount) : 0;

      // Top 10 missing and matched keywords
      const topMissingKeywords = Object.entries(missingKeywordsCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12)
        .map(([keyword, count]) => ({ keyword, count }));

      const topMatchedKeywords = Object.entries(matchedKeywordsCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12)
        .map(([keyword, count]) => ({ keyword, count }));

      // 3. Fetch uploaded CV documents count
      const { count: totalCVCount, error: cvErr } = await supabaseAdmin
        .from('cv_documents')
        .select('*', { count: 'exact', head: true });

      if (cvErr) console.warn('cv_documents count warning:', cvErr);

      // 4. Fetch support tickets count
      let ticketStats = { total: 0, recent: 0 };
      try {
        const { data: tickets } = await supabaseAdmin
          .from('support_tickets')
          .select('id, created_at');
        if (tickets) {
          ticketStats.total = tickets.length;
          ticketStats.recent = tickets.filter(t => new Date(t.created_at) >= sevenDaysAgo).length;
        }
      } catch (_e) {
        // support_tickets might be empty or optional
      }

      return {
        users: {
          total: totalUsers,
          signupsToday,
          signupsThisWeek,
          signupsThisMonth,
          planBreakdown
        },
        generations: {
          total: totalGenerations,
          generationsToday,
          generationsThisWeek,
          generationsThisMonth,
          avgAtsScore,
          atsScoreBuckets,
          providerBreakdown,
          modelBreakdown,
          targetLengthBreakdown,
          topMissingKeywords,
          topMatchedKeywords
        },
        documents: {
          total: totalCVCount || 0
        },
        tickets: ticketStats,
        lastUpdated: new Date().toISOString()
      };
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: err.message || 'Failed to fetch admin stats' });
    }
  });

  // GET /api/admin/generations - Paginated & filtered generation feed
  fastify.get('/generations', async (request: FastifyRequest<{
    Querystring: {
      page?: string;
      limit?: string;
      search?: string;
      provider?: string;
      model?: string;
      minScore?: string;
      maxScore?: string;
      userId?: string;
    }
  }>, reply: FastifyReply) => {
    await requireAdmin(request, reply);

    const page = Math.max(1, parseInt(request.query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(request.query.limit || '20', 10)));
    const offset = (page - 1) * limit;

    const { search, provider, model, minScore, maxScore, userId } = request.query;

    try {
      let query = supabaseAdmin
        .from('generations')
        .select(`
          id,
          user_id,
          job_description,
          aspirations,
          target_length,
          ats_score,
          provider_used,
          model_used,
          created_at,
          cover_letter,
          human_changes
        `, { count: 'exact' });

      if (userId) {
        query = query.eq('user_id', userId);
      }
      if (provider && provider !== 'all') {
        query = query.eq('provider_used', provider);
      }
      if (model && model !== 'all') {
        query = query.eq('model_used', model);
      }
      if (minScore) {
        query = query.gte('ats_score', parseInt(minScore, 10));
      }
      if (maxScore) {
        query = query.lte('ats_score', parseInt(maxScore, 10));
      }
      if (search && search.trim()) {
        query = query.ilike('job_description', `%${search.trim()}%`);
      }

      query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

      const { data: records, count, error } = await query;
      if (error) throw error;

      // Also grab profiles for user emails/names
      const userIds = Array.from(new Set((records || []).map(r => r.user_id).filter(Boolean)));
      let userMap: Record<string, { email: string; full_name?: string; plan?: string }> = {};

      if (userIds.length > 0) {
        const { data: userProfiles } = await supabaseAdmin
          .from('profiles')
          .select('id, email, full_name, plan')
          .in('id', userIds);

        (userProfiles || []).forEach(up => {
          userMap[up.id] = {
            email: up.email,
            full_name: up.full_name,
            plan: up.plan
          };
        });
      }

      const enhancedRecords = (records || []).map(r => ({
        ...r,
        user: userMap[r.user_id] || { email: 'Unknown User' },
        // preview snippet of job description
        jobDescriptionSnippet: (r.job_description || '').slice(0, 160)
      }));

      return {
        data: enhancedRecords,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: err.message || 'Failed to fetch generations feed' });
    }
  });

  // GET /api/admin/generations/:id - Full inspection of a single generation record
  fastify.get('/generations/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    await requireAdmin(request, reply);
    const { id } = request.params;

    try {
      const { data: generation, error } = await supabaseAdmin
        .from('generations')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !generation) {
        return reply.status(404).send({ error: 'Generation record not found' });
      }

      // Fetch user profile
      const { data: userProfile } = await supabaseAdmin
        .from('profiles')
        .select('id, email, full_name, plan, avatar_url')
        .eq('id', generation.user_id)
        .single();

      return {
        ...generation,
        user: userProfile || { email: 'Unknown User' }
      };
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: err.message || 'Failed to load generation detail' });
    }
  });

  // GET /api/admin/users - Searchable user registry
  fastify.get('/users', async (request: FastifyRequest<{
    Querystring: {
      page?: string;
      limit?: string;
      search?: string;
      plan?: string;
      sort?: string;
    }
  }>, reply: FastifyReply) => {
    await requireAdmin(request, reply);

    const page = Math.max(1, parseInt(request.query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(request.query.limit || '25', 10)));
    const offset = (page - 1) * limit;
    const { search, plan, sort } = request.query;

    try {
      let query = supabaseAdmin
        .from('profiles')
        .select('id, email, full_name, avatar_url, plan, generation_count, is_admin, created_at, updated_at', { count: 'exact' });

      if (plan && plan !== 'all') {
        query = query.eq('plan', plan);
      }
      if (search && search.trim()) {
        const term = search.trim();
        query = query.or(`email.ilike.%${term}%,full_name.ilike.%${term}%`);
      }

      if (sort === 'generations_desc') {
        query = query.order('generation_count', { ascending: false });
      } else if (sort === 'oldest') {
        query = query.order('created_at', { ascending: true });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      query = query.range(offset, offset + limit - 1);

      const { data: users, count, error } = await query;
      if (error) throw error;

      // Count uploaded CVs for each user in page
      const userIds = (users || []).map(u => u.id);
      let cvCounts: Record<string, number> = {};

      if (userIds.length > 0) {
        const { data: docs } = await supabaseAdmin
          .from('cv_documents')
          .select('user_id');

        (docs || []).forEach(d => {
          cvCounts[d.user_id] = (cvCounts[d.user_id] || 0) + 1;
        });
      }

      const enhancedUsers = (users || []).map(u => ({
        ...u,
        cv_count: cvCounts[u.id] || 0
      }));

      return {
        data: enhancedUsers,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: err.message || 'Failed to fetch users list' });
    }
  });

  // GET /api/admin/users/:id - User drilldown (profile + uploaded CVs + generations timeline)
  fastify.get('/users/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    await requireAdmin(request, reply);
    const { id } = request.params;

    try {
      const { data: profile, error: pErr } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (pErr || !profile) {
        return reply.status(404).send({ error: 'User profile not found' });
      }

      // Fetch uploaded CVs
      const { data: cvs } = await supabaseAdmin
        .from('cv_documents')
        .select('id, filename, uploaded_at')
        .eq('user_id', id)
        .order('uploaded_at', { ascending: false });

      // Fetch recent generations
      const { data: gens } = await supabaseAdmin
        .from('generations')
        .select('id, job_description, target_length, ats_score, provider_used, model_used, created_at')
        .eq('user_id', id)
        .order('created_at', { ascending: false })
        .limit(20);

      return {
        profile,
        cvDocuments: cvs || [],
        generations: gens || []
      };
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: err.message || 'Failed to fetch user details' });
    }
  });

  // POST /api/admin/users/:id/update-plan - Set user plan
  fastify.post('/users/:id/update-plan', async (request: FastifyRequest<{
    Params: { id: string };
    Body: { plan: 'free' | 'byok' | 'pro' }
  }>, reply: FastifyReply) => {
    await requireAdmin(request, reply);
    const { id } = request.params;
    const { plan } = request.body;

    if (!['free', 'byok', 'pro'].includes(plan)) {
      return reply.status(400).send({ error: 'Invalid plan specified' });
    }

    try {
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ plan })
        .eq('id', id);

      if (error) throw error;
      return { success: true, message: `User plan updated to ${plan}` };
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: err.message || 'Failed to update user plan' });
    }
  });

  // POST /api/admin/users/:id/toggle-admin - Set or revoke admin privileges
  fastify.post('/users/:id/toggle-admin', async (request: FastifyRequest<{
    Params: { id: string };
    Body: { isAdmin: boolean }
  }>, reply: FastifyReply) => {
    const caller = await requireAdmin(request, reply);
    const { id } = request.params;
    const { isAdmin } = request.body;

    // Prevent revoking self if sole admin
    if (caller.id === id && !isAdmin) {
      return reply.status(400).send({ error: 'Cannot revoke your own admin access directly.' });
    }

    try {
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ is_admin: isAdmin })
        .eq('id', id);

      if (error) throw error;
      return { success: true, message: `Admin status set to ${isAdmin}` };
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: err.message || 'Failed to update admin status' });
    }
  });

  // GET /api/admin/tickets - Support inquiries
  fastify.get('/tickets', async (request: FastifyRequest<{
    Querystring: { category?: string }
  }>, reply: FastifyReply) => {
    await requireAdmin(request, reply);
    const { category } = request.query;

    try {
      let query = supabaseAdmin
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      const { data: tickets, error } = await query;
      if (error) throw error;

      return { tickets: tickets || [] };
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: err.message || 'Failed to fetch tickets' });
    }
  });
}
