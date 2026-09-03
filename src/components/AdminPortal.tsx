import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Users,
  Sparkles,
  FileText,
  ShieldCheck,
  TrendingUp,
  Search,
  Eye,
  EyeOff,
  RefreshCw,
  Download,
  AlertTriangle,
  Cpu,
  Layers,
  Tag,
  HelpCircle,
  X,
  Target,
  Lock,
  ArrowRight,
  LogOut,
  CheckCircle2,
  Award,
  Zap
} from 'lucide-react';
import { supabase } from '../utils/supabase';

interface AdminPortalProps {
  userProfile?: {
    email: string;
    full_name?: string;
    plan: 'free' | 'byok' | 'pro';
    generation_count: number;
    is_admin?: boolean;
  } | null;
  session?: any;
  onReturnToApp?: () => void;
}

interface AdminStats {
  users: {
    total: number;
    signupsToday: number;
    signupsThisWeek: number;
    signupsThisMonth: number;
    planBreakdown: { free: number; byok: number; pro: number };
  };
  generations: {
    total: number;
    generationsToday: number;
    generationsThisWeek: number;
    generationsThisMonth: number;
    avgAtsScore: number;
    atsScoreBuckets: { under50: number; from50to69: number; from70to84: number; from85to100: number };
    providerBreakdown: Record<string, number>;
    modelBreakdown: Record<string, number>;
    targetLengthBreakdown: Record<string, number>;
    topMissingKeywords: { keyword: string; count: number }[];
    topMatchedKeywords: { keyword: string; count: number }[];
  };
  documents: {
    total: number;
  };
  tickets: {
    total: number;
    recent: number;
  };
  lastUpdated: string;
}

interface GenerationItem {
  id: string;
  user_id: string;
  job_description: string;
  jobDescriptionSnippet?: string;
  aspirations?: string;
  target_length?: string;
  ats_score?: number;
  provider_used?: string;
  model_used?: string;
  created_at: string;
  cover_letter?: string;
  cv_markdown?: string;
  ats_analysis?: any;
  human_changes?: string[];
  user?: {
    email: string;
    full_name?: string;
    plan?: string;
  };
}

interface UserItem {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  plan: 'free' | 'byok' | 'pro';
  generation_count: number;
  is_admin: boolean;
  created_at: string;
  cv_count: number;
  avg_ats_score?: number;
}

const ADMIN_SESSION_KEY = 'jd2cv_admin_session_auth';

export const AdminPortal: React.FC<AdminPortalProps> = ({ session, onReturnToApp }) => {
  // Standalone Auth State
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return Boolean(sessionStorage.getItem(ADMIN_SESSION_KEY) || localStorage.getItem(ADMIN_SESSION_KEY));
  });

  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  // Tab & Data states
  const [activeSubTab, setActiveSubTab] = useState<'analytics' | 'generations' | 'users' | 'tickets'>('analytics');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Generation feed states
  const [generations, setGenerations] = useState<GenerationItem[]>([]);
  const [genLoading, setGenLoading] = useState(false);
  const [genPage, setGenPage] = useState(1);
  const [genTotalPages, setGenTotalPages] = useState(1);
  const [genSearch, setGenSearch] = useState('');
  const [genProvider, setGenProvider] = useState('all');
  const [selectedGen, setSelectedGen] = useState<GenerationItem | null>(null);
  const [inspectLoading, setInspectLoading] = useState(false);

  // User management states
  const [users, setUsers] = useState<UserItem[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userPage, setUserPage] = useState(1);
  const [userTotalPages, setUserTotalPages] = useState(1);
  const [userSearch, setUserSearch] = useState('');
  const [userPlanFilter, setUserPlanFilter] = useState('all');
  const [selectedUserDetail, setSelectedUserDetail] = useState<any>(null);
  const [userDetailLoading, setUserDetailLoading] = useState(false);

  // Tickets state
  const [tickets, setTickets] = useState<any[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);

  const proxyUrl = import.meta.env.VITE_BACKEND_URL || (typeof window !== 'undefined' && window.location.hostname.includes('localhost') ? 'http://localhost:3002' : '');

  const getAdminToken = () => {
    return sessionStorage.getItem(ADMIN_SESSION_KEY) || localStorage.getItem(ADMIN_SESSION_KEY) || '';
  };

  const getAuthHeaders = async () => {
    const adminToken = getAdminToken();
    if (adminToken) {
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      };
    }
    let token = session?.access_token;
    if (!token) {
      const { data } = await supabase.auth.getSession();
      token = data.session?.access_token;
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token || ''}`
    };
  };

  const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeoutMs = 4000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(id);
      return response;
    } catch (e) {
      clearTimeout(id);
      throw e;
    }
  };

  // Handle Standalone Admin Login
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoggingIn(true);

    const userClean = loginUsername.trim();
    const passClean = loginPassword.trim();

    if (!userClean || !passClean) {
      setLoginError('Please enter both username and password.');
      setLoggingIn(false);
      return;
    }

    try {
      let loggedIn = false;
      let token = '';

      // Try Backend Auth Endpoint
      if (proxyUrl) {
        try {
          const resp = await fetchWithTimeout(`${proxyUrl}/api/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: userClean, password: passClean })
          }, 3000);

          if (resp.ok) {
            const data = await resp.json();
            token = data.token;
            loggedIn = true;
          }
        } catch (_err) {
          // Proxy might be offline, test fallback
        }
      }

      // Standalone Fallback Verification
      if (!loggedIn) {
        if (
          (userClean === 'admin' && (passClean === '@dmin190488' || passClean === 'admin123' || passClean === 'vineet123')) ||
          (userClean === 'vineetsansare@gmail.com' && passClean === '@dmin190488')
        ) {
          token = 'jd2cv_adm_' + btoa(`${userClean}_${Date.now()}`);
          loggedIn = true;
        }
      }

      if (loggedIn && token) {
        sessionStorage.setItem(ADMIN_SESSION_KEY, token);
        localStorage.setItem(ADMIN_SESSION_KEY, token);
        setIsAdminAuthenticated(true);
        setLoginUsername('');
        setLoginPassword('');
        fetchStats();
      } else {
        setLoginError('Invalid administrator credentials. Access denied.');
      }
    } catch (err: any) {
      setLoginError(err.message || 'Authentication failed. Please retry.');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    localStorage.removeItem(ADMIN_SESSION_KEY);
    setIsAdminAuthenticated(false);
  };

  // 1. Fetch Analytics Stats
  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    let loaded = false;

    try {
      if (proxyUrl) {
        const headers = await getAuthHeaders();
        const resp = await fetchWithTimeout(`${proxyUrl}/api/admin/stats`, { headers });
        if (resp.ok) {
          const data = await resp.json();
          setStats(data);
          loaded = true;
        }
      }
    } catch (err: any) {
      console.warn('Backend proxy unreachable, falling back to database query:', err);
    }

    if (!loaded) {
      await fetchStatsDirectSupabase();
    }
    setLoading(false);
  };

  const fetchStatsDirectSupabase = async () => {
    try {
      const { data: profiles } = await supabase.from('profiles').select('*');
      const { data: gens } = await supabase.from('generations').select('*');
      const { count: docCount } = await supabase.from('cv_documents').select('*', { count: 'exact', head: true });

      const totalUsers = profiles?.length || 0;
      const planBreakdown = { free: 0, byok: 0, pro: 0 };
      (profiles || []).forEach(p => {
        const pl = (p.plan as 'free' | 'byok' | 'pro') || 'free';
        if (planBreakdown[pl] !== undefined) planBreakdown[pl]++;
        else planBreakdown.free++;
      });

      const totalGenerations = gens?.length || 0;
      let totalAts = 0;
      let scored = 0;
      const atsBuckets = { under50: 0, from50to69: 0, from70to84: 0, from85to100: 0 };
      const provBreakdown: Record<string, number> = {};
      const targetBreakdown: Record<string, number> = {};
      const missingKws: Record<string, number> = {};

      (gens || []).forEach(g => {
        if (typeof g.ats_score === 'number' && g.ats_score > 0) {
          totalAts += g.ats_score;
          scored++;
          if (g.ats_score < 50) atsBuckets.under50++;
          else if (g.ats_score < 70) atsBuckets.from50to69++;
          else if (g.ats_score < 85) atsBuckets.from70to84++;
          else atsBuckets.from85to100++;
        }
        const prov = g.provider_used || 'gemini';
        provBreakdown[prov] = (provBreakdown[prov] || 0) + 1;

        const tgt = g.target_length || '2-page';
        targetBreakdown[tgt] = (targetBreakdown[tgt] || 0) + 1;

        if (g.ats_analysis && Array.isArray((g.ats_analysis as any).missingKeywords)) {
          (g.ats_analysis as any).missingKeywords.forEach((kw: string) => {
            const clean = (kw || '').trim().toLowerCase();
            if (clean.length > 1) missingKws[clean] = (missingKws[clean] || 0) + 1;
          });
        }
      });

      setStats({
        users: {
          total: totalUsers,
          signupsToday: 0,
          signupsThisWeek: 0,
          signupsThisMonth: 0,
          planBreakdown
        },
        generations: {
          total: totalGenerations,
          generationsToday: 0,
          generationsThisWeek: 0,
          generationsThisMonth: 0,
          avgAtsScore: scored > 0 ? Math.round(totalAts / scored) : 0,
          atsScoreBuckets: atsBuckets,
          providerBreakdown: provBreakdown,
          modelBreakdown: {},
          targetLengthBreakdown: targetBreakdown,
          topMissingKeywords: Object.entries(missingKws).slice(0, 12).map(([keyword, count]) => ({ keyword, count })),
          topMatchedKeywords: []
        },
        documents: { total: docCount || 0 },
        tickets: { total: 0, recent: 0 },
        lastUpdated: new Date().toISOString()
      });
      setError(null);
    } catch (e: any) {
      console.error('Direct Supabase stats fetch failed:', e);
    }
  };

  // 2. Fetch Generation Logs
  const fetchGenerations = async (page = 1) => {
    setGenLoading(true);
    let loaded = false;

    try {
      if (proxyUrl) {
        const queryParams = new URLSearchParams({
          page: page.toString(),
          limit: '20',
          search: genSearch,
          provider: genProvider
        });
        const headers = await getAuthHeaders();
        const resp = await fetchWithTimeout(`${proxyUrl}/api/admin/generations?${queryParams.toString()}`, { headers });
        if (resp.ok) {
          const res = await resp.json();
          setGenerations(res.data || []);
          setGenTotalPages(res.pagination?.totalPages || 1);
          setGenPage(page);
          loaded = true;
        }
      }
    } catch (e) {
      console.warn('Backend proxy unreachable for generations, using direct database query:', e);
    }

    if (!loaded) {
      try {
        let query = supabase
          .from('generations')
          .select('*')
          .order('created_at', { ascending: false })
          .range((page - 1) * 20, page * 20 - 1);

        if (genSearch.trim()) {
          query = query.ilike('job_description', `%${genSearch.trim()}%`);
        }
        if (genProvider && genProvider !== 'all') {
          query = query.eq('provider_used', genProvider);
        }

        const { data, error } = await query;
        if (error) console.warn('Supabase generations query error:', error);

        const mapped = (data || []).map((d: any) => ({
          ...d,
          user: { email: d.user_id ? 'Candidate (ID: ' + d.user_id.slice(0, 8) + ')' : 'Candidate' },
          jobDescriptionSnippet: (d.job_description || '').slice(0, 160)
        }));

        setGenerations(mapped);
        setGenTotalPages(Math.max(1, Math.ceil((data?.length || 0) / 20)));
        setGenPage(page);
      } catch (err) {
        console.error('Direct generations query error:', err);
        setGenerations([]);
      }
    }
    setGenLoading(false);
  };

  // Inspect Single Generation
  const inspectGeneration = async (genId: string) => {
    setInspectLoading(true);
    let loaded = false;

    try {
      if (proxyUrl) {
        const headers = await getAuthHeaders();
        const resp = await fetchWithTimeout(`${proxyUrl}/api/admin/generations/${genId}`, { headers });
        if (resp.ok) {
          const fullGen = await resp.json();
          setSelectedGen(fullGen);
          loaded = true;
        }
      }
    } catch (e) {
      console.warn('Backend proxy inspect error:', e);
    }

    if (!loaded) {
      try {
        const { data } = await supabase.from('generations').select('*').eq('id', genId).single();
        if (data) setSelectedGen(data as GenerationItem);
      } catch (err) {
        console.error('Direct generation inspect error:', err);
      }
    }
    setInspectLoading(false);
  };

  // 3. Fetch User Directory & Effectiveness Metrics
  const fetchUsers = async (page = 1) => {
    setUsersLoading(true);
    let loaded = false;

    try {
      if (proxyUrl) {
        const queryParams = new URLSearchParams({
          page: page.toString(),
          limit: '20',
          search: userSearch,
          plan: userPlanFilter
        });
        const headers = await getAuthHeaders();
        const resp = await fetchWithTimeout(`${proxyUrl}/api/admin/users?${queryParams.toString()}`, { headers });
        if (resp.ok) {
          const res = await resp.json();
          setUsers(res.data || []);
          setUserTotalPages(res.pagination?.totalPages || 1);
          setUserPage(page);
          loaded = true;
        }
      }
    } catch (e) {
      console.warn('Backend proxy unreachable for users, using direct database query:', e);
    }

    if (!loaded) {
      try {
        let query = supabase
          .from('profiles')
          .select('*')
          .order('generation_count', { ascending: false });

        if (userPlanFilter && userPlanFilter !== 'all') {
          query = query.eq('plan', userPlanFilter);
        }
        if (userSearch.trim()) {
          query = query.or(`email.ilike.%${userSearch.trim()}%,full_name.ilike.%${userSearch.trim()}%`);
        }

        const { data, error } = await query;
        if (error) console.warn('Supabase profiles query error:', error);

        // Fetch generation count and docs per user
        const { data: allGens } = await supabase.from('generations').select('user_id, ats_score');
        const userAtsScores: Record<string, number[]> = {};
        (allGens || []).forEach((g: any) => {
          if (!userAtsScores[g.user_id]) userAtsScores[g.user_id] = [];
          if (typeof g.ats_score === 'number' && g.ats_score > 0) userAtsScores[g.user_id].push(g.ats_score);
        });

        setUsers((data || []).map((u: any) => {
          const scores = userAtsScores[u.id] || [];
          const avgAts = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
          return {
            id: u.id,
            email: u.email,
            full_name: u.full_name,
            avatar_url: u.avatar_url,
            plan: u.plan || 'free',
            generation_count: u.generation_count || 0,
            is_admin: u.is_admin || false,
            created_at: u.created_at || new Date().toISOString(),
            cv_count: 0,
            avg_ats_score: avgAts
          };
        }));
        setUserTotalPages(Math.max(1, Math.ceil((data?.length || 0) / 20)));
        setUserPage(page);
      } catch (err) {
        console.error('Direct users query error:', err);
        setUsers([]);
      }
    }
    setUsersLoading(false);
  };

  // User Drilldown Detail
  const fetchUserDetail = async (userId: string) => {
    setUserDetailLoading(true);
    let loaded = false;

    try {
      if (proxyUrl) {
        const headers = await getAuthHeaders();
        const resp = await fetchWithTimeout(`${proxyUrl}/api/admin/users/${userId}`, { headers });
        if (resp.ok) {
          const detail = await resp.json();
          setSelectedUserDetail(detail);
          loaded = true;
        }
      }
    } catch (e) {
      console.warn('Backend proxy user detail error:', e);
    }

    if (!loaded) {
      try {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
        const { data: cvs } = await supabase.from('cv_documents').select('id, filename, uploaded_at').eq('user_id', userId);
        const { data: gens } = await supabase.from('generations').select('id, job_description, ats_score, provider_used, created_at').eq('user_id', userId);
        setSelectedUserDetail({ profile, cvDocuments: cvs || [], generations: gens || [] });
      } catch (err) {
        console.error('Direct user detail error:', err);
      }
    }
    setUserDetailLoading(false);
  };

  // Update Plan for User
  const handleUpdateUserPlan = async (userId: string, newPlan: 'free' | 'byok' | 'pro') => {
    try {
      let updated = false;
      if (proxyUrl) {
        const headers = await getAuthHeaders();
        const resp = await fetch(`${proxyUrl}/api/admin/users/${userId}/update-plan`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ plan: newPlan })
        });
        if (resp.ok) updated = true;
      }
      if (!updated) {
        await supabase.from('profiles').update({ plan: newPlan }).eq('id', userId);
      }
      fetchUsers(userPage);
      if (selectedUserDetail) {
        setSelectedUserDetail((prev: any) => ({
          ...prev,
          profile: { ...prev.profile, plan: newPlan }
        }));
      }
    } catch (e) {
      console.error('Update plan error:', e);
    }
  };

  // Toggle Admin Privileges
  const handleToggleAdmin = async (userId: string, currentAdmin: boolean) => {
    try {
      const nextVal = !currentAdmin;
      let updated = false;
      if (proxyUrl) {
        const headers = await getAuthHeaders();
        const resp = await fetch(`${proxyUrl}/api/admin/users/${userId}/toggle-admin`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ isAdmin: nextVal })
        });
        if (resp.ok) updated = true;
      }
      if (!updated) {
        await supabase.from('profiles').update({ is_admin: nextVal }).eq('id', userId);
      }
      fetchUsers(userPage);
      if (selectedUserDetail) {
        setSelectedUserDetail((prev: any) => ({
          ...prev,
          profile: { ...prev.profile, is_admin: nextVal }
        }));
      }
    } catch (e) {
      console.error('Toggle admin error:', e);
    }
  };

  // 4. Fetch Support Tickets
  const fetchTickets = async () => {
    setTicketsLoading(true);
    let loaded = false;

    try {
      if (proxyUrl) {
        const headers = await getAuthHeaders();
        const resp = await fetchWithTimeout(`${proxyUrl}/api/admin/tickets`, { headers });
        if (resp.ok) {
          const res = await resp.json();
          setTickets(res.tickets || []);
          loaded = true;
        }
      }
    } catch (e) {
      console.warn('Backend proxy tickets fetch error:', e);
    }

    if (!loaded) {
      try {
        const { data } = await supabase.from('support_tickets').select('*').order('created_at', { ascending: false });
        setTickets(data || []);
      } catch (err) {
        setTickets([]);
      }
    }
    setTicketsLoading(false);
  };

  // CSV Export Utility
  const exportData = (type: 'generations' | 'users' | 'analytics') => {
    if (type === 'generations') {
      const headers = ['ID,User Email,ATS Score,Provider,Model,Target Length,Created At,Job Description'];
      const rows = generations.map(g => [
        `"${g.id}"`,
        `"${g.user?.email || g.user_id}"`,
        g.ats_score || 0,
        `"${g.provider_used || ''}"`,
        `"${g.model_used || ''}"`,
        `"${g.target_length || ''}"`,
        `"${g.created_at}"`,
        `"${(g.job_description || '').replace(/"/g, '""').slice(0, 300)}"`
      ].join(','));
      downloadCSV(`jd2cv_generations_${new Date().toISOString().slice(0, 10)}.csv`, [headers, ...rows].join('\n'));
    } else if (type === 'users') {
      const headers = ['ID,Email,Full Name,Plan,Generation Count,Avg ATS Score,Admin,Joined At'];
      const rows = users.map(u => [
        `"${u.id}"`,
        `"${u.email}"`,
        `"${u.full_name || ''}"`,
        `"${u.plan}"`,
        u.generation_count,
        u.avg_ats_score || 0,
        u.is_admin ? 'YES' : 'NO',
        `"${u.created_at}"`
      ].join(','));
      downloadCSV(`jd2cv_user_analytics_${new Date().toISOString().slice(0, 10)}.csv`, [headers, ...rows].join('\n'));
    } else if (type === 'analytics' && stats) {
      const summary = JSON.stringify(stats, null, 2);
      const blob = new Blob([summary], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `jd2cv_analytics_summary_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
    }
  };

  const downloadCSV = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.click();
  };

  useEffect(() => {
    if (isAdminAuthenticated) {
      fetchStats();
    }
  }, [isAdminAuthenticated]);

  useEffect(() => {
    if (!isAdminAuthenticated) return;
    if (activeSubTab === 'generations') {
      fetchGenerations(1);
    } else if (activeSubTab === 'users') {
      fetchUsers(1);
    } else if (activeSubTab === 'tickets') {
      fetchTickets();
    }
  }, [activeSubTab, isAdminAuthenticated]);

  // -------------------------------------------------------------
  // SCREEN 1: Standalone Admin Login Gate (when not authenticated)
  // -------------------------------------------------------------
  if (!isAdminAuthenticated) {
    return (
      <div style={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at 50% 30%, rgba(124, 58, 237, 0.15) 0%, transparent 60%), #0B0F17',
        padding: '1.5rem',
        color: '#FFFFFF'
      }}>
        <div style={{
          maxWidth: '440px',
          width: '100%',
          background: 'rgba(24, 28, 36, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '24px',
          padding: '2.25rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)'
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              marginBottom: '1rem',
              boxShadow: '0 8px 24px rgba(124, 58, 237, 0.4)'
            }}>
              <ShieldCheck size={30} />
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 0.4rem', letterSpacing: '-0.02em' }}>
              JD2CV Admin Portal
            </h1>
            <p style={{ margin: 0, fontSize: '0.88rem', color: 'rgba(255, 255, 255, 0.6)' }}>
              Protected administrator access for platform analytics and user insights.
            </p>
          </div>

          {loginError && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.85rem 1rem',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '12px',
              color: '#fca5a5',
              fontSize: '0.85rem',
              marginBottom: '1.25rem'
            }}>
              <AlertTriangle size={17} style={{ flexShrink: 0 }} />
              <span>{loginError}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.8)', marginBottom: '0.4rem' }}>
                Admin Username
              </label>
              <div style={{ position: 'relative' }}>
                <Users size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255, 255, 255, 0.4)' }} />
                <input
                  type="text"
                  placeholder="admin"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  autoFocus
                  required
                  style={{
                    width: '100%',
                    height: '46px',
                    padding: '0 1rem 0 40px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.8)', marginBottom: '0.4rem' }}>
                Admin Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255, 255, 255, 0.4)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    height: '46px',
                    padding: '0 40px 0 40px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255, 255, 255, 0.4)',
                    cursor: 'pointer',
                    padding: '0.2rem'
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              style={{
                marginTop: '0.5rem',
                width: '100%',
                height: '46px',
                background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                fontSize: '0.95rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 16px rgba(124, 58, 237, 0.35)',
                transition: 'opacity 0.2s'
              }}
            >
              {loggingIn ? (
                <>
                  <RefreshCw size={18} className="spin" />
                  Verifying Credentials...
                </>
              ) : (
                <>
                  Sign In to Admin Portal
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          {/* Footer Back Link */}
          <div style={{ textAlign: 'center', marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <button
              onClick={() => {
                if (onReturnToApp) onReturnToApp();
                else window.location.href = window.location.pathname.replace(/\/admin\/?$/, '') || '/';
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '0.85rem',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              ← Return to JD2CV Workspace
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // SCREEN 2: Authenticated Standalone Admin Portal
  // -------------------------------------------------------------
  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      background: 'var(--bg-primary, #0B0F17)',
      color: 'var(--text-primary, #FFFFFF)',
      padding: '1.5rem',
      boxSizing: 'border-box'
    }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', width: '100%', paddingBottom: '3rem' }}>
        
        {/* Top Navbar */}
        <header style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '2rem',
          padding: '1.25rem 1.75rem',
          background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.12) 0%, rgba(37, 99, 235, 0.08) 100%)',
          border: '1px solid rgba(124, 58, 237, 0.3)',
          borderRadius: '20px',
          backdropFilter: 'blur(16px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 4px 16px rgba(124, 58, 237, 0.4)'
            }}>
              <ShieldCheck size={26} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>
                  JD2CV Admin Analytics & User Insights
                </h1>
                <span style={{
                  background: 'rgba(124, 58, 237, 0.25)',
                  color: '#c084fc',
                  border: '1px solid rgba(124, 58, 237, 0.4)',
                  padding: '0.15rem 0.6rem',
                  borderRadius: '100px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  letterSpacing: '0.05em'
                }}>
                  ROOT ADMIN
                </span>
              </div>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.86rem', color: 'var(--text-muted, rgba(255,255,255,0.6))' }}>
                Analyze how candidates generate CVs, user effectiveness, generation volumes, and prompt trends.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={() => {
                if (activeSubTab === 'analytics') fetchStats();
                else if (activeSubTab === 'generations') fetchGenerations(genPage);
                else if (activeSubTab === 'users') fetchUsers(userPage);
                else if (activeSubTab === 'tickets') fetchTickets();
              }}
              className="btn btn-secondary"
              style={{
                padding: '0.55rem 0.95rem',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                borderRadius: '10px'
              }}
            >
              <RefreshCw size={15} className={loading || genLoading || usersLoading ? 'spin' : ''} />
              Sync Data
            </button>

            <button
              onClick={() => {
                if (onReturnToApp) onReturnToApp();
                else window.location.href = window.location.pathname.replace(/\/admin\/?$/, '') || '/';
              }}
              className="btn btn-secondary"
              style={{
                padding: '0.55rem 0.95rem',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                borderRadius: '10px'
              }}
            >
              ← Workspace
            </button>

            <button
              onClick={handleAdminLogout}
              style={{
                padding: '0.55rem 0.95rem',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#fca5a5',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              <LogOut size={15} />
              Log Out
            </button>
          </div>
        </header>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.85rem 1.25rem',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '14px',
            color: '#fca5a5',
            marginBottom: '1.5rem',
            fontSize: '0.9rem'
          }}>
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '1px solid var(--card-border, rgba(255,255,255,0.12))',
          paddingBottom: '0.85rem',
          marginBottom: '1.75rem',
          overflowX: 'auto'
        }}>
          <button
            onClick={() => setActiveSubTab('analytics')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.2rem',
              borderRadius: '12px',
              border: 'none',
              fontSize: '0.92rem',
              fontWeight: 600,
              cursor: 'pointer',
              background: activeSubTab === 'analytics' ? 'var(--accent-primary, #7c3aed)' : 'rgba(255, 255, 255, 0.05)',
              color: activeSubTab === 'analytics' ? '#fff' : 'var(--text-secondary, rgba(255,255,255,0.7))'
            }}
          >
            <BarChart3 size={17} />
            Platform KPIs & Usage Volume
          </button>

          <button
            onClick={() => setActiveSubTab('users')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.2rem',
              borderRadius: '12px',
              border: 'none',
              fontSize: '0.92rem',
              fontWeight: 600,
              cursor: 'pointer',
              background: activeSubTab === 'users' ? 'var(--accent-primary, #7c3aed)' : 'rgba(255, 255, 255, 0.05)',
              color: activeSubTab === 'users' ? '#fff' : 'var(--text-secondary, rgba(255,255,255,0.7))'
            }}
          >
            <Users size={17} />
            User Effectiveness & Activity Matrix
          </button>

          <button
            onClick={() => setActiveSubTab('generations')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.2rem',
              borderRadius: '12px',
              border: 'none',
              fontSize: '0.92rem',
              fontWeight: 600,
              cursor: 'pointer',
              background: activeSubTab === 'generations' ? 'var(--accent-primary, #7c3aed)' : 'rgba(255, 255, 255, 0.05)',
              color: activeSubTab === 'generations' ? '#fff' : 'var(--text-secondary, rgba(255,255,255,0.7))'
            }}
          >
            <Sparkles size={17} />
            Generation Logs & Prompt Inspector
          </button>

          <button
            onClick={() => setActiveSubTab('tickets')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.2rem',
              borderRadius: '12px',
              border: 'none',
              fontSize: '0.92rem',
              fontWeight: 600,
              cursor: 'pointer',
              background: activeSubTab === 'tickets' ? 'var(--accent-primary, #7c3aed)' : 'rgba(255, 255, 255, 0.05)',
              color: activeSubTab === 'tickets' ? '#fff' : 'var(--text-secondary, rgba(255,255,255,0.7))'
            }}
          >
            <HelpCircle size={17} />
            Support Inquiries
          </button>
        </div>

        {/* -------------------------------------------------- */}
        {/* TAB 1: Platform KPIs & Usage Volume                */}
        {/* -------------------------------------------------- */}
        {activeSubTab === 'analytics' && (
          <div className="entrance-fade">
            {/* Top Stat Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '1.1rem',
              marginBottom: '1.75rem'
            }}>
              {/* Card 1: Total Users */}
              <div className="liquid-card" style={{ padding: '1.35rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Registered Users</span>
                  <div style={{ padding: '0.4rem', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
                    <Users size={20} />
                  </div>
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.4rem' }}>
                  {stats?.users.total || 0}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  <span>Free: <strong style={{ color: '#fff' }}>{stats?.users.planBreakdown.free || 0}</strong></span>
                  <span>•</span>
                  <span>BYOK: <strong style={{ color: '#3b82f6' }}>{stats?.users.planBreakdown.byok || 0}</strong></span>
                  <span>•</span>
                  <span>Pro: <strong style={{ color: '#c084fc' }}>{stats?.users.planBreakdown.pro || 0}</strong></span>
                </div>
              </div>

              {/* Card 2: Total Generations */}
              <div className="liquid-card" style={{ padding: '1.35rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Tailored Resumes</span>
                  <div style={{ padding: '0.4rem', borderRadius: '10px', background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' }}>
                    <Sparkles size={20} />
                  </div>
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.4rem' }}>
                  {stats?.generations.total || 0}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <TrendingUp size={14} />
                  <span>Cumulative platform optimization volume</span>
                </div>
              </div>

              {/* Card 3: Average ATS Score */}
              <div className="liquid-card" style={{ padding: '1.35rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Average ATS Match Score</span>
                  <div style={{ padding: '0.4rem', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                    <Target size={20} />
                  </div>
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.4rem', color: '#10b981' }}>
                  {stats?.generations.avgAtsScore || 0}%
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Measure of candidate match effectiveness
                </div>
              </div>

              {/* Card 4: Base Resumes */}
              <div className="liquid-card" style={{ padding: '1.35rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Base Resumes Uploaded</span>
                  <div style={{ padding: '0.4rem', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                    <FileText size={20} />
                  </div>
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.4rem' }}>
                  {stats?.documents.total || 0}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Stored candidate source documents
                </div>
              </div>
            </div>

            {/* Visual Breakdown Row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
              gap: '1.25rem',
              marginBottom: '1.75rem'
            }}>
              {/* Provider & AI Model Preferences */}
              <div className="liquid-card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Cpu size={18} color="#7c3aed" />
                  AI Engine Usage Share
                </h3>

                {stats?.generations.providerBreakdown && Object.keys(stats.generations.providerBreakdown).length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {Object.entries(stats.generations.providerBreakdown).map(([prov, count]) => {
                      const total = stats.generations.total || 1;
                      const pct = Math.round((count / total) * 100);
                      const color = prov === 'gemini' ? '#3b82f6' : prov === 'openai' ? '#10b981' : '#f59e0b';
                      return (
                        <div key={prov}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                            <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{prov}</span>
                            <span style={{ color: 'var(--text-muted)' }}>{count} ({pct}%)</span>
                          </div>
                          <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '100px', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '100px' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No generation logs recorded yet.</p>
                )}
              </div>

              {/* ATS Score Brackets */}
              <div className="liquid-card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Target size={18} color="#10b981" />
                  ATS Match Score Distribution
                </h3>

                {stats?.generations.atsScoreBuckets ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {[
                      { label: '85 - 100% (High Match)', key: 'from85to100', color: '#10b981' },
                      { label: '70 - 84% (Good Match)', key: 'from70to84', color: '#3b82f6' },
                      { label: '50 - 69% (Moderate Match)', key: 'from50to69', color: '#f59e0b' },
                      { label: '< 50% (Needs Improvement)', key: 'under50', color: '#ef4444' }
                    ].map(bucket => {
                      const count = (stats.generations.atsScoreBuckets as any)[bucket.key] || 0;
                      const total = stats.generations.total || 1;
                      const pct = Math.round((count / total) * 100);
                      return (
                        <div key={bucket.key}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                            <span>{bucket.label}</span>
                            <span style={{ color: 'var(--text-muted)' }}>{count} ({pct}%)</span>
                          </div>
                          <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '100px', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: bucket.color, borderRadius: '100px' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>

              {/* Target Format Lengths */}
              <div className="liquid-card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Layers size={18} color="#f59e0b" />
                  Target CV Length Preferences
                </h3>

                {stats?.generations.targetLengthBreakdown ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {Object.entries(stats.generations.targetLengthBreakdown).map(([len, count]) => {
                      const total = stats.generations.total || 1;
                      const pct = Math.round((count / total) * 100);
                      return (
                        <div key={len}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                            <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{len}</span>
                            <span style={{ color: 'var(--text-muted)' }}>{count} ({pct}%)</span>
                          </div>
                          <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '100px', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: '#8b5cf6', borderRadius: '100px' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            </div>

            {/* Keyword Gaps Cloud */}
            <div className="liquid-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Tag size={18} color="#ec4899" />
                Most Common Missing Skills Across Target Job Descriptions
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Key skills candidates frequently lack in their base resumes when applying for jobs:
              </p>

              {stats?.generations.topMissingKeywords && stats.generations.topMissingKeywords.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {stats.generations.topMissingKeywords.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        background: 'rgba(236, 72, 153, 0.12)',
                        border: '1px solid rgba(236, 72, 153, 0.25)',
                        padding: '0.35rem 0.75rem',
                        borderRadius: '100px',
                        fontSize: '0.85rem'
                      }}
                    >
                      <span>{item.keyword}</span>
                      <span style={{
                        background: 'rgba(236, 72, 153, 0.25)',
                        padding: '0.1rem 0.4rem',
                        borderRadius: '100px',
                        fontSize: '0.72rem',
                        fontWeight: 700
                      }}>
                        {item.count}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No skill gap data recorded yet.</p>
              )}
            </div>
          </div>
        )}

        {/* -------------------------------------------------- */}
        {/* TAB 2: User Effectiveness & Activity Matrix        */}
        {/* -------------------------------------------------- */}
        {activeSubTab === 'users' && (
          <div className="entrance-fade">
            {/* Search & Action Bar */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem', flex: 1, minWidth: '280px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Search candidate by email or name..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchUsers(1)}
                    className="input-field"
                    style={{ paddingLeft: '36px', width: '100%', height: '40px', fontSize: '0.88rem' }}
                  />
                </div>

                <select
                  value={userPlanFilter}
                  onChange={(e) => {
                    setUserPlanFilter(e.target.value);
                    setTimeout(() => fetchUsers(1), 50);
                  }}
                  className="input-field"
                  style={{ width: '130px', height: '40px', fontSize: '0.88rem' }}
                >
                  <option value="all">All Plans</option>
                  <option value="free">Free</option>
                  <option value="byok">BYOK</option>
                  <option value="pro">Pro</option>
                </select>

                <button onClick={() => fetchUsers(1)} className="btn btn-primary" style={{ height: '40px', padding: '0 1.1rem' }}>
                  Filter
                </button>
              </div>

              <button
                onClick={() => exportData('users')}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', height: '40px', fontSize: '0.85rem' }}
              >
                <Download size={15} />
                Export User Metrics CSV
              </button>
            </div>

            {/* Users Activity Table */}
            <div className="liquid-card" style={{ padding: '0', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--card-border)', background: 'rgba(255, 255, 255, 0.02)' }}>
                      <th style={{ padding: '0.85rem 1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Candidate / User</th>
                      <th style={{ padding: '0.85rem 1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Plan</th>
                      <th style={{ padding: '0.85rem 1rem', fontWeight: 600, color: 'var(--text-muted)' }}>CV Generations</th>
                      <th style={{ padding: '0.85rem 1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Avg ATS Score</th>
                      <th style={{ padding: '0.85rem 1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Engagement Status</th>
                      <th style={{ padding: '0.85rem 1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Joined Date</th>
                      <th style={{ padding: '0.85rem 1rem', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersLoading ? (
                      <tr>
                        <td colSpan={7} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                          <RefreshCw size={20} className="spin" style={{ margin: '0 auto 0.5rem' }} />
                          Loading candidate activity matrix...
                        </td>
                      </tr>
                    ) : users.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                          No users found matching filter criteria.
                        </td>
                      </tr>
                    ) : (
                      users.map(u => {
                        const isPowerUser = u.generation_count >= 5;
                        const isAtLimit = u.plan === 'free' && u.generation_count >= 3;
                        return (
                          <tr key={u.id} style={{ borderBottom: '1px solid var(--card-border)' }}>
                            <td style={{ padding: '0.85rem 1rem' }}>
                              <div style={{ fontWeight: 600 }}>{u.full_name || 'User'}</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{u.email}</div>
                            </td>
                            <td style={{ padding: '0.85rem 1rem' }}>
                              <span style={{
                                padding: '0.2rem 0.55rem',
                                borderRadius: '100px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                background: u.plan === 'pro' ? 'rgba(168, 85, 247, 0.15)' : u.plan === 'byok' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                                color: u.plan === 'pro' ? '#c084fc' : u.plan === 'byok' ? '#3b82f6' : 'var(--text-secondary)'
                              }}>
                                {u.plan}
                              </span>
                            </td>
                            <td style={{ padding: '0.85rem 1rem' }}>
                              <strong style={{ fontSize: '1rem', color: u.generation_count > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                                {u.generation_count}
                              </strong>
                              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: '0.3rem' }}>tailored</span>
                            </td>
                            <td style={{ padding: '0.85rem 1rem' }}>
                              {u.avg_ats_score ? (
                                <span style={{
                                  padding: '0.2rem 0.5rem',
                                  borderRadius: '6px',
                                  fontWeight: 700,
                                  fontSize: '0.82rem',
                                  background: u.avg_ats_score >= 80 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                  color: u.avg_ats_score >= 80 ? '#10b981' : '#f59e0b'
                                }}>
                                  {u.avg_ats_score}%
                                </span>
                              ) : (
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>N/A</span>
                              )}
                            </td>
                            <td style={{ padding: '0.85rem 1rem' }}>
                              {isPowerUser ? (
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#c084fc', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <Award size={14} /> Power User
                                </span>
                              ) : isAtLimit ? (
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <Zap size={14} /> Free Limit Reached
                                </span>
                              ) : u.generation_count > 0 ? (
                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <CheckCircle2 size={14} /> Active
                                </span>
                              ) : (
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Registered</span>
                              )}
                            </td>
                            <td style={{ padding: '0.85rem 1rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                              {new Date(u.created_at).toLocaleDateString()}
                            </td>
                            <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                              <button
                                disabled={userDetailLoading}
                                onClick={() => fetchUserDetail(u.id)}
                                className="btn btn-secondary"
                                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                              >
                                Drilldown History
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {userTotalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1.25rem', borderTop: '1px solid var(--card-border)' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    Page {userPage} of {userTotalPages}
                  </span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      disabled={userPage <= 1}
                      onClick={() => fetchUsers(userPage - 1)}
                      className="btn btn-secondary"
                      style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
                    >
                      Previous
                    </button>
                    <button
                      disabled={userPage >= userTotalPages}
                      onClick={() => fetchUsers(userPage + 1)}
                      className="btn btn-secondary"
                      style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* -------------------------------------------------- */}
        {/* TAB 3: Generation Feed & Deep Inspector            */}
        {/* -------------------------------------------------- */}
        {activeSubTab === 'generations' && (
          <div className="entrance-fade">
            {/* Filter Bar */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem', flex: 1, minWidth: '280px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Search candidate prompts or job descriptions..."
                    value={genSearch}
                    onChange={(e) => setGenSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchGenerations(1)}
                    className="input-field"
                    style={{ paddingLeft: '36px', width: '100%', height: '40px', fontSize: '0.88rem' }}
                  />
                </div>

                <select
                  value={genProvider}
                  onChange={(e) => {
                    setGenProvider(e.target.value);
                    setTimeout(() => fetchGenerations(1), 50);
                  }}
                  className="input-field"
                  style={{ width: '140px', height: '40px', fontSize: '0.88rem' }}
                >
                  <option value="all">All Engines</option>
                  <option value="gemini">Gemini</option>
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                </select>

                <button onClick={() => fetchGenerations(1)} className="btn btn-primary" style={{ height: '40px', padding: '0 1.1rem' }}>
                  Search
                </button>
              </div>

              <button
                onClick={() => exportData('generations')}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', height: '40px', fontSize: '0.85rem' }}
              >
                <Download size={15} />
                Export Generation CSV
              </button>
            </div>

            {/* Table */}
            <div className="liquid-card" style={{ padding: '0', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--card-border)', background: 'rgba(255, 255, 255, 0.02)' }}>
                      <th style={{ padding: '0.85rem 1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Date</th>
                      <th style={{ padding: '0.85rem 1rem', fontWeight: 600, color: 'var(--text-muted)' }}>User</th>
                      <th style={{ padding: '0.85rem 1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Target Job Description</th>
                      <th style={{ padding: '0.85rem 1rem', fontWeight: 600, color: 'var(--text-muted)' }}>ATS Score</th>
                      <th style={{ padding: '0.85rem 1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Model</th>
                      <th style={{ padding: '0.85rem 1rem', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'right' }}>Inspect</th>
                    </tr>
                  </thead>
                  <tbody>
                    {genLoading ? (
                      <tr>
                        <td colSpan={6} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                          <RefreshCw size={20} className="spin" style={{ margin: '0 auto 0.5rem' }} />
                          Loading generation logs...
                        </td>
                      </tr>
                    ) : generations.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                          No generation records found.
                        </td>
                      </tr>
                    ) : (
                      generations.map((g) => (
                        <tr key={g.id} style={{ borderBottom: '1px solid var(--card-border)' }}>
                          <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                            {new Date(g.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                          </td>
                          <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>
                            {g.user?.email || 'Candidate'}
                          </td>
                          <td style={{ padding: '0.85rem 1rem', maxWidth: '300px' }}>
                            <p style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
                              {g.job_description}
                            </p>
                          </td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <span style={{
                              padding: '0.2rem 0.5rem',
                              borderRadius: '6px',
                              fontWeight: 700,
                              fontSize: '0.82rem',
                              background: (g.ats_score || 0) >= 80 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                              color: (g.ats_score || 0) >= 80 ? '#10b981' : '#f59e0b'
                            }}>
                              {g.ats_score ? `${g.ats_score}%` : 'N/A'}
                            </span>
                          </td>
                          <td style={{ padding: '0.85rem 1rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                            <strong style={{ color: 'var(--text-primary)' }}>{g.provider_used || 'gemini'}</strong>
                          </td>
                          <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                            <button
                              disabled={inspectLoading}
                              onClick={() => inspectGeneration(g.id)}
                              className="btn btn-secondary"
                              style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                            >
                              <Eye size={14} />
                              Deep Inspect
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {genTotalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1.25rem', borderTop: '1px solid var(--card-border)' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    Page {genPage} of {genTotalPages}
                  </span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      disabled={genPage <= 1}
                      onClick={() => fetchGenerations(genPage - 1)}
                      className="btn btn-secondary"
                      style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
                    >
                      Previous
                    </button>
                    <button
                      disabled={genPage >= genTotalPages}
                      onClick={() => fetchGenerations(genPage + 1)}
                      className="btn btn-secondary"
                      style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* -------------------------------------------------- */}
        {/* TAB 4: Support Inquiries                           */}
        {/* -------------------------------------------------- */}
        {activeSubTab === 'tickets' && (
          <div className="entrance-fade">
            <div className="liquid-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <HelpCircle size={20} color="#7c3aed" />
                Support Inquiries & User Remarks
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                Direct feedback and assistance requests submitted by platform candidates:
              </p>

              {ticketsLoading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  <RefreshCw size={20} className="spin" style={{ margin: '0 auto 0.5rem' }} />
                  Loading inquiries...
                </div>
              ) : tickets.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                  No support inquiries in database.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {tickets.map((t) => (
                    <div
                      key={t.id}
                      style={{
                        padding: '1.1rem',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid var(--card-border)',
                        borderRadius: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>{t.name || 'Candidate'}</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>({t.email})</span>
                          <span style={{
                            padding: '0.15rem 0.5rem',
                            borderRadius: '100px',
                            fontSize: '0.72rem',
                            background: 'rgba(124, 58, 237, 0.15)',
                            color: '#c084fc',
                            fontWeight: 600
                          }}>
                            {t.category || 'General'}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {new Date(t.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p style={{ margin: '0 0 0.5rem', fontSize: '0.88rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                        {t.message}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* -------------------------------------------------- */}
        {/* MODAL: Generation Deep Inspector                   */}
        {/* -------------------------------------------------- */}
        {selectedGen && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(10px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem'
          }}>
            <div style={{
              background: 'var(--card-bg, #181C24)',
              border: '1px solid var(--card-border, rgba(255,255,255,0.15))',
              borderRadius: '20px',
              maxWidth: '960px',
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
              overflow: 'hidden'
            }}>
              {/* Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid var(--card-border, rgba(255,255,255,0.1))'
              }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Sparkles size={18} color="#7c3aed" />
                    CV Tailoring & Prompt Inspection Log
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Candidate: <strong>{selectedGen.user?.email || selectedGen.user_id}</strong> • Engine: <strong>{selectedGen.provider_used}</strong> • {new Date(selectedGen.created_at).toLocaleString()}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedGen(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.4rem' }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  flexWrap: 'wrap',
                  background: 'rgba(124, 58, 237, 0.08)',
                  border: '1px solid rgba(124, 58, 237, 0.2)',
                  padding: '1rem',
                  borderRadius: '12px'
                }}>
                  <div style={{ minWidth: '120px' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>ATS Score</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: (selectedGen.ats_score || 0) >= 80 ? '#10b981' : '#f59e0b' }}>
                      {selectedGen.ats_score ? `${selectedGen.ats_score}%` : 'N/A'}
                    </div>
                  </div>

                  <div style={{ minWidth: '120px' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Target Length</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, textTransform: 'capitalize' }}>
                      {selectedGen.target_length || '2-Page'}
                    </div>
                  </div>

                  {selectedGen.aspirations && (
                    <div style={{ flex: 1, minWidth: '220px' }}>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Candidate Instructions / Aspirations</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontStyle: 'italic' }}>
                        "{selectedGen.aspirations}"
                      </div>
                    </div>
                  )}
                </div>

                {/* Job Description Input */}
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
                    Target Job Description Provided by User
                  </h4>
                  <div style={{
                    padding: '1rem',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid var(--card-border)',
                    borderRadius: '10px',
                    fontSize: '0.85rem',
                    whiteSpace: 'pre-wrap',
                    maxHeight: '180px',
                    overflowY: 'auto'
                  }}>
                    {selectedGen.job_description}
                  </div>
                </div>

                {/* Generated CV Markdown */}
                {selectedGen.cv_markdown && (
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
                      Tailored CV Markdown Output
                    </h4>
                    <pre style={{
                      padding: '1rem',
                      background: 'rgba(0, 0, 0, 0.4)',
                      border: '1px solid var(--card-border)',
                      borderRadius: '10px',
                      fontSize: '0.82rem',
                      fontFamily: 'var(--font-mono)',
                      whiteSpace: 'pre-wrap',
                      maxHeight: '240px',
                      overflowY: 'auto'
                    }}>
                      {selectedGen.cv_markdown}
                    </pre>
                  </div>
                )}
              </div>

              <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--card-border)', display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => setSelectedGen(null)} className="btn btn-secondary" style={{ padding: '0.5rem 1.25rem' }}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* -------------------------------------------------- */}
        {/* MODAL: Candidate Detail Drilldown                  */}
        {/* -------------------------------------------------- */}
        {selectedUserDetail && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(10px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem'
          }}>
            <div style={{
              background: 'var(--card-bg, #181C24)',
              border: '1px solid var(--card-border, rgba(255,255,255,0.15))',
              borderRadius: '20px',
              maxWidth: '720px',
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--card-border)' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                    {selectedUserDetail.profile.full_name || 'Candidate Activity'}
                  </h3>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    {selectedUserDetail.profile.email} • Joined {new Date(selectedUserDetail.profile.created_at).toLocaleDateString()}
                  </span>
                </div>
                <button onClick={() => setSelectedUserDetail(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Plan Tier Controls */}
                <div style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--card-border)', borderRadius: '12px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '0.75rem' }}>
                    Quick Plan Tier Adjustment
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {(['free', 'byok', 'pro'] as const).map(p => (
                      <button
                        key={p}
                        onClick={() => handleUpdateUserPlan(selectedUserDetail.profile.id, p)}
                        style={{
                          padding: '0.35rem 0.75rem',
                          borderRadius: '6px',
                          border: 'none',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          textTransform: 'uppercase',
                          background: selectedUserDetail.profile.plan === p ? 'var(--accent-primary, #7c3aed)' : 'rgba(255, 255, 255, 0.1)',
                          color: selectedUserDetail.profile.plan === p ? '#fff' : 'var(--text-secondary)'
                        }}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      onClick={() => handleToggleAdmin(selectedUserDetail.profile.id, Boolean(selectedUserDetail.profile.is_admin))}
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: '6px',
                        border: 'none',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        background: selectedUserDetail.profile.is_admin ? 'rgba(239, 68, 68, 0.2)' : 'rgba(124, 58, 237, 0.2)',
                        color: selectedUserDetail.profile.is_admin ? '#f87171' : '#c084fc',
                        marginLeft: 'auto'
                      }}
                    >
                      {selectedUserDetail.profile.is_admin ? 'Revoke Admin Role' : 'Grant Admin Role'}
                    </button>
                  </div>
                </div>

                {/* Generation Timeline */}
                <div>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
                    Optimization Timeline ({selectedUserDetail.generations?.length || 0} Tailored Resumes)
                  </h4>
                  {selectedUserDetail.generations?.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {selectedUserDetail.generations.map((gen: any) => (
                        <div key={gen.id} style={{ padding: '0.75rem', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--card-border)', borderRadius: '8px', fontSize: '0.85rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                            <span style={{ fontWeight: 600, color: 'var(--accent-primary, #7c3aed)' }}>
                              ATS Score: {gen.ats_score || 0}% • {gen.provider_used || 'gemini'}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {new Date(gen.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                            </span>
                          </div>
                          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {gen.job_description}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>No optimizations recorded for this user yet.</p>
                  )}
                </div>
              </div>

              <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--card-border)', display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => setSelectedUserDetail(null)} className="btn btn-secondary" style={{ padding: '0.5rem 1.25rem' }}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
