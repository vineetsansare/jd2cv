import { useState, useEffect, useRef } from 'react';
import { SettingsPanel } from './components/SettingsPanel';
import { CVDisplay } from './components/CVDisplay';
import { AuthForm } from './components/AuthForm';
import { PricingModal } from './components/PricingModal';
import { ContactUsPanel } from './components/ContactUsPanel';
import { AdminPortal } from './components/AdminPortal';
import { LegalModal } from './components/LegalModal';
import type { LegalDocType } from './components/LegalModal';
import { generateCustomizedCV, autoFixCV, getSavedAPIKeysStatus } from './utils/llm';
import type { LLMConfig, CVGenerationResult, TargetLength } from './utils/llm';
import { parsePdf } from './utils/pdfParser';
import { 
  Sparkles, Sun, Moon, AlertCircle,
  FileText, Settings, LogOut, ChevronLeft, ChevronRight,
  Upload, Plus, Download, Trash2,
  Copy, ArrowRight, Zap, ArrowLeft, History, Menu, X, MessageSquare
} from 'lucide-react';
import { supabase } from './utils/supabase';
import { AuroraBackground } from './components/ui/AuroraBackground';
import { LiquidCard } from './components/ui/LiquidCard';
import { UploadIllustration, AICoachIllustration } from './components/ui/Illustrations';
import { CVHistoryPanel } from './components/CVHistoryPanel';
import type { GenerationRecord } from './components/CVHistoryPanel';
import { DEFAULT_PROVIDER, DEFAULT_MODEL } from './utils/models';

const LOCAL_STORAGE_KEY_CONFIG = 'cv_builder_llm_config';
const LOCAL_STORAGE_KEY_THEME = 'cv_builder_theme';
const LOCAL_STORAGE_KEY_SIDEBAR = 'cv_builder_sidebar_collapsed';

const DEFAULT_CONFIG: LLMConfig = {
  provider: DEFAULT_PROVIDER,
  apiKey: '',
  model: DEFAULT_MODEL,
};

interface CloudCV {
  id?: string;
  name: string;
  text: string;
}

interface UserProfile {
  id?: string;
  email: string;
  full_name?: string;
  plan: 'free' | 'byok' | 'pro';
  generation_count: number;
  avatar_url?: string;
  is_admin?: boolean;
}

const DEFAULT_ADMIN_EMAILS = [
  'vineetsansare@gmail.com',
  'admin@vineetsansare.com',
  'vineet@jd2cv.com'
];

export function checkIsAdmin(email?: string, isDbAdmin?: boolean): boolean {
  if (isDbAdmin === true) return true;
  if (!email) return false;
  const envAdmins = (import.meta.env.VITE_ADMIN_EMAILS || '')
    .split(',')
    .map((e: string) => e.trim().toLowerCase())
    .filter(Boolean);
  const allowed = [...DEFAULT_ADMIN_EMAILS, ...envAdmins];
  return allowed.includes(email.toLowerCase());
}

const checkIsAdminRoute = () => {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  const search = window.location.search.toLowerCase();
  return (
    path.endsWith('/admin') ||
    path.endsWith('/admin/') ||
    path.includes('/jd2cv/admin') ||
    hash.startsWith('#/admin') ||
    hash.startsWith('#admin') ||
    search.includes('view=admin') ||
    search.includes('route=admin')
  );
};

const checkLegalRoute = (): LegalDocType | null => {
  if (typeof window === 'undefined') return null;
  const hash = window.location.hash.toLowerCase();
  const search = window.location.search.toLowerCase();
  const path = window.location.pathname.toLowerCase();
  if (hash.includes('privacy') || search.includes('privacy') || path.includes('privacy')) {
    return 'privacy';
  }
  if (hash.includes('terms') || search.includes('terms') || path.includes('terms')) {
    return 'terms';
  }
  return null;
};

function App() {
  const [session, setSession] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAdminRoute, setIsAdminRoute] = useState<boolean>(checkIsAdminRoute);
  const [legalModalOpen, setLegalModalOpen] = useState<boolean>(() => checkLegalRoute() !== null);
  const [legalModalDoc, setLegalModalDoc] = useState<LegalDocType>(() => checkLegalRoute() || 'privacy');

  const openLegalModal = (doc: LegalDocType = 'privacy') => {
    setLegalModalDoc(doc);
    setLegalModalOpen(true);
  };

  // Sync route changes
  useEffect(() => {
    const handleRouteChange = () => {
      setIsAdminRoute(checkIsAdminRoute());
      const legal = checkLegalRoute();
      if (legal) {
        setLegalModalDoc(legal);
        setLegalModalOpen(true);
      }
    };
    window.addEventListener('popstate', handleRouteChange);
    window.addEventListener('hashchange', handleRouteChange);
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      window.removeEventListener('hashchange', handleRouteChange);
    };
  }, []);

  // Clean double-hash if present in browser address bar (e.g. ##access_token=)
  if (typeof window !== 'undefined' && window.location.hash.startsWith('##')) {
    window.location.hash = window.location.hash.replace(/^##/, '#');
  }

  const isOAuthCallback = window.location.hash.includes('access_token=') || 
                          window.location.search.includes('code=') ||
                          window.location.hash.includes('type=recovery');
  const [authLoading, setAuthLoading] = useState<boolean>(isOAuthCallback || true);
  const isLoadingUserDataRef = useRef(false);

  // 1. Auth Subscription & Session Setup
  useEffect(() => {
    // 5-second safety timer: Ensures the UI never freezes on loading screen
    const safetyTimer = setTimeout(() => {
      setAuthLoading(false);
    }, 5000);

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession(session);
        loadUserData(session);
      } else if (!isOAuthCallback) {
        setSession(null);
        setAuthLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setSession(session);
        if (session) {
          loadUserData(session);
          if (window.location.hash || window.location.search) {
            window.history.replaceState(null, '', window.location.pathname);
          }
        }
      } else if (event === 'PASSWORD_RECOVERY') {
        setSession(session);
        setIsResettingPassword(true);
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setUserProfile(null);
        setContextCVs([]);
        setActiveCVIndices([]);
        setAuthLoading(false);
      } else if (session) {
        setSession(session);
        loadUserData(session);
      }
    });

    return () => {
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []);

  const checkAndSendWelcomeEmail = async (email: string, fullName?: string) => {
    if (!email) return;
    const storageKey = `welcome_email_sent_${email}`;
    if (localStorage.getItem(storageKey)) return;

    try {
      const proxyUrl = import.meta.env.VITE_PROXY_URL || import.meta.env.VITE_BACKEND_URL || 'http://localhost:3002';
      await fetch(`${proxyUrl}/api/email/welcome`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name: fullName })
      });
      localStorage.setItem(storageKey, 'true');
    } catch (e) {
      console.error('Welcome email trigger error:', e);
    }
  };

  // 2. Fetch user profile and CVs from Supabase
  const loadUserData = async (currentSession: any) => {
    if (!currentSession?.user) return;
    if (isLoadingUserDataRef.current) return;
    isLoadingUserDataRef.current = true;
    setAuthLoading(true);

    try {
      let profile = null;
      let retryCount = 0;

      while (retryCount < 2) {
        const { data } = await supabase
          .from('profiles')
          .select('id, email, full_name, plan, generation_count, avatar_url, is_admin')
          .eq('id', currentSession.user.id)
          .maybeSingle();

        if (data) {
          profile = data;
          break;
        }

        await new Promise(res => setTimeout(res, 400));
        retryCount++;
      }

      if (!profile) {
        const meta = currentSession.user.user_metadata || {};
        const defaultName = meta.full_name || meta.name || currentSession.user.email?.split('@')[0] || 'User';
        const defaultAvatar = meta.avatar_url || meta.picture || '';

        const newProfile = {
          id: currentSession.user.id,
          email: currentSession.user.email,
          full_name: defaultName,
          plan: 'free' as const,
          generation_count: 0,
          avatar_url: defaultAvatar,
          is_admin: false
        };

        const { data: upserted } = await supabase
          .from('profiles')
          .upsert(newProfile, { onConflict: 'id' })
          .select('id, email, full_name, plan, generation_count, avatar_url, is_admin')
          .single();

        profile = upserted || newProfile;
      }

      const plan = (profile.plan as 'free' | 'byok' | 'pro') || 'free';
      const userEmail = profile.email || currentSession.user.email || '';
      const isAdmin = checkIsAdmin(userEmail, profile.is_admin);

      setUserProfile({
        id: profile.id || currentSession.user.id,
        email: userEmail,
        full_name: profile.full_name || currentSession.user.user_metadata?.full_name || 'User',
        plan,
        generation_count: profile.generation_count || 0,
        avatar_url: profile.avatar_url || currentSession.user.user_metadata?.avatar_url || '',
        is_admin: isAdmin
      });

      // If user is designated admin but not yet marked in DB, update DB profile
      if (isAdmin && !profile.is_admin && currentSession.user?.id) {
        supabase
          .from('profiles')
          .update({ is_admin: true })
          .eq('id', currentSession.user.id)
          .then(() => {}, () => {});
      }

      if (plan === 'free') {
        setConfig(prev => ({
          ...prev,
          provider: 'gemini',
          model: 'gemini-2.5-flash'
        }));
      } else if (plan === 'byok') {
        getSavedAPIKeysStatus().then(setSavedKeys);
      }

      // Trigger welcome email for first-time signups
      checkAndSendWelcomeEmail(profile.email || currentSession.user.email, profile.full_name);

      // Fetch user's saved CVs
      const { data: cvs, error: _cvError } = await supabase
        .from('cv_documents')
        .select('id, filename, extracted_text')
        .eq('user_id', currentSession.user.id);

      if (cvs && !_cvError) {
        const mappedCVs = cvs.map(c => ({
          id: c.id,
          name: c.filename,
          text: c.extracted_text
        }));
        setContextCVs(mappedCVs);
        setActiveCVIndices(mappedCVs.map((_, idx) => idx));
      }

      // Fetch user's recent CV generation history
      fetchRecentGenerations();
    } catch (err) {
      console.error('Error loading session data:', err);
    } finally {
      isLoadingUserDataRef.current = false;
      setAuthLoading(false);
    }
  };

  // Password reset flow states
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  const [config, setConfig] = useState<LLMConfig>(DEFAULT_CONFIG);
  const [contextCVs, setContextCVs] = useState<CloudCV[]>([]);
  const [activeCVIndices, setActiveCVIndices] = useState<number[]>([]);
  const [jobDescription, setJobDescription] = useState('');
  const [aspirations, setAspirations] = useState('');
  const [targetLength, setTargetLength] = useState<TargetLength>('2-page');
  
  // Theme & Layout States
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'workspace' | 'quick-optimize' | 'resumes' | 'history' | 'applications' | 'reports' | 'settings' | 'contact'>('quick-optimize');
  const [generations, setGenerations] = useState<GenerationRecord[]>([]);
  const [generationsLoading, setGenerationsLoading] = useState(false);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [customizerStep, setCustomizerStep] = useState(1);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [pricingModalReason, setPricingModalReason] = useState<'limit_reached' | 'model_upgrade' | 'manual' | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleSelectPlan = async (newPlan: 'free' | 'byok' | 'pro') => {
    if (!session?.user?.id) return;
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ plan: newPlan })
        .eq('id', session.user.id);

      if (updateError) throw updateError;

      setUserProfile(prev => prev ? { ...prev, plan: newPlan } : null);

      if (newPlan === 'free') {
        setConfig(prev => ({
          ...prev,
          provider: 'gemini',
          model: 'gemini-2.5-flash'
        }));
      } else if (newPlan === 'byok') {
        getSavedAPIKeysStatus().then(status => {
          setSavedKeys(status);
          const hasAnyKey = status.gemini || status.openai || status.anthropic;
          if (!hasAnyKey) {
            setActiveTab('settings');
          }
        });
      }
    } catch (err: any) {
      console.error('Failed to update plan in database:', err);
      setError(err.message || 'Failed to update subscription plan.');
    }
  };

  const fetchRecentGenerations = async () => {
    setGenerationsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('generations')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(25);

      if (data && !error) {
        setGenerations(data as GenerationRecord[]);
      }
    } catch (err) {
      console.error('Failed to fetch generations history:', err);
    } finally {
      setGenerationsLoading(false);
    }
  };

  const [generating, setGenerating] = useState(false);
  const [isAutoFixing, setIsAutoFixing] = useState(false);
  const [genStep, setGenStep] = useState(0); 
  const [result, setResult] = useState<CVGenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [parsingFile, setParsingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // BYOK Saved Keys Status
  const [savedKeys, setSavedKeys] = useState<{ gemini: boolean; openai: boolean; anthropic: boolean }>({
    gemini: false,
    openai: false,
    anthropic: false
  });



  const handleUpdateAvatar = async (croppedDataUrl: string) => {
    if (!session?.user?.id) return;

    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: croppedDataUrl })
      .eq('id', session.user.id);

    if (error) {
      console.error('Failed to update avatar in database:', error);
      throw error;
    }

    setUserProfile((prev) => prev ? { ...prev, avatar_url: croppedDataUrl } : prev);
  };

  // 3. Load configurations & theme from localStorage
  useEffect(() => {
    const savedConfig = localStorage.getItem(LOCAL_STORAGE_KEY_CONFIG);
    if (savedConfig) {
      try {
        setConfig(JSON.parse(savedConfig));
      } catch (e) {
        console.error('Error loading config from localStorage', e);
      }
    }

    const savedTheme = localStorage.getItem(LOCAL_STORAGE_KEY_THEME) as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    } else {
      setTheme('dark');
      applyTheme('dark');
    }

    const savedSidebar = localStorage.getItem(LOCAL_STORAGE_KEY_SIDEBAR);
    if (savedSidebar) {
      setSidebarCollapsed(JSON.parse(savedSidebar));
    }
  }, []);

  const applyTheme = (t: 'light' | 'dark') => {
    const body = document.body;
    const root = document.documentElement;
    if (t === 'dark') {
      body.classList.add('dark-theme');
      root.classList.add('dark-theme');
    } else {
      body.classList.remove('dark-theme');
      root.classList.remove('dark-theme');
    }
  };

  const handleThemeToggle = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    applyTheme(newTheme);
    localStorage.setItem(LOCAL_STORAGE_KEY_THEME, newTheme);
  };

  const handleSidebarToggle = () => {
    const nextState = !sidebarCollapsed;
    setSidebarCollapsed(nextState);
    localStorage.setItem(LOCAL_STORAGE_KEY_SIDEBAR, JSON.stringify(nextState));
  };

  const handleConfigChange = (newConfig: LLMConfig) => {
    setConfig(newConfig);
    localStorage.setItem(LOCAL_STORAGE_KEY_CONFIG, JSON.stringify(newConfig));
  };

  // Add or Replace Base CV in Supabase Database (Strictly 1 Master Base CV)
  const handleAddCV = async (name: string, text: string) => {
    if (!session) return;
    
    try {
      // If any existing Base CV exists in Supabase, remove it so only 1 master record is retained
      await supabase
        .from('cv_documents')
        .delete()
        .eq('user_id', session.user.id);

      const { data, error } = await supabase
        .from('cv_documents')
        .insert({
          user_id: session.user.id,
          filename: name,
          extracted_text: text
        })
        .select()
        .single();

      if (error) throw error;

      const newCV = { id: data.id, name, text };
      setContextCVs([newCV]);
      setActiveCVIndices([0]);
      setError(null);
    } catch (err: any) {
      console.error('Failed to save Base CV to cloud:', err);
      setError('Failed to upload Base CV to database.');
    }
  };

  // Remove Base CV from Supabase Database
  const handleRemoveCV = async (_indexToRemove?: number) => {
    if (!session) return;

    try {
      const { error } = await supabase
        .from('cv_documents')
        .delete()
        .eq('user_id', session.user.id);
      if (error) throw error;

      setContextCVs([]);
      setActiveCVIndices([]);
      setError(null);
    } catch (err) {
      console.error('Failed to delete Base CV from cloud:', err);
      setError('Failed to delete Base CV from database.');
    }
  };

  const handleDownloadCV = (cvName: string, text: string) => {
    const element = document.createElement("a");
    const file = new Blob([text], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `${cvName.replace(/\.[^/.]+$/, "")}_optimized.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleToggleCVIndex = (index: number) => {
    if (activeCVIndices.includes(index)) {
      setActiveCVIndices(activeCVIndices.filter((idx) => idx !== index));
    } else {
      setActiveCVIndices([...activeCVIndices, index]);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setError(null);
    setParsingFile(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        let text = '';
        if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
          const arrayBuffer = await file.arrayBuffer();
          text = await parsePdf(arrayBuffer);
        } else if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
          text = await file.text();
        } else {
          throw new Error('Unsupported file type. Please upload PDF, TXT, or Markdown files.');
        }

        if (!text.trim()) {
          throw new Error('Extracted text is empty. Ensure the file contains readable text.');
        }

        await handleAddCV(file.name, text);
      } catch (err: any) {
        console.error(err);
        setError(err.message || `Failed to parse ${file.name}`);
      }
    }

    setParsingFile(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  useEffect(() => {
    let interval: any;
    if (generating) {
      interval = setInterval(() => {
        setGenStep((prev) => (prev + 1) % 4);
      }, 3500);
    } else {
      setGenStep(0);
    }
    return () => clearInterval(interval);
  }, [generating]);

  const saveGenerationToHistory = async (
    cvResult: CVGenerationResult,
    targetJD: string,
    provider: string,
    model: string
  ) => {
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession?.user?.id) return;

      // 1. Save record into Supabase 'generations' table
      const { data: insertedGen, error: genError } = await supabase
        .from('generations')
        .insert({
          user_id: currentSession.user.id,
          job_description: targetJD,
          cv_markdown: cvResult.cvMarkdown,
          cover_letter: cvResult.coverLetter || '',
          ats_score: cvResult.atsScore || 0,
          ats_analysis: cvResult.atsAnalysis || {},
          human_changes: cvResult.humanFriendlyChanges || [],
          provider_used: provider,
          model_used: model
        })
        .select()
        .single();

      if (genError) {
        console.error('Failed to save to generations table in Supabase:', genError);
      } else if (insertedGen) {
        setGenerations(prev => [insertedGen as GenerationRecord, ...prev.filter(g => g.id !== insertedGen.id)].slice(0, 5));
      }

      // 2. Increment generation_count in Supabase 'profiles' table
      const { data: profileData } = await supabase
        .from('profiles')
        .select('generation_count')
        .eq('id', currentSession.user.id)
        .single();

      const newCount = ((profileData?.generation_count ?? userProfile?.generation_count) || 0) + 1;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ generation_count: newCount })
        .eq('id', currentSession.user.id);

      if (profileError) {
        console.error('Failed to update generation_count in profiles:', profileError);
      } else {
        setUserProfile(prev => prev ? { ...prev, generation_count: newCount } : null);
      }
    } catch (err) {
      console.error('Error in saveGenerationToHistory:', err);
    }
  };

  const handleGenerate = async () => {
    if (userProfile?.plan === 'free' && userProfile.generation_count >= 5) {
      setPricingModalReason('limit_reached');
      setIsPricingModalOpen(true);
      return;
    }

    if (activeCVIndices.length === 0) {
      setError('Please select at least one CV from the context checkboxes to use as career history.');
      return;
    }

    setGenerating(true);
    setError(null);
    abortControllerRef.current = new AbortController();
    
    const activeCVs = activeCVIndices.map((idx) => contextCVs[idx]);

    const activeConfig = userProfile?.plan === 'free'
      ? { ...config, provider: 'gemini' as const, model: 'gemini-flash-latest' }
      : config;

    try {
      const cvResult = await generateCustomizedCV(activeConfig, activeCVs, jobDescription, aspirations, targetLength, abortControllerRef.current.signal);
      setResult(cvResult);
      
      // Save generation to history & increment generation_count in Supabase
      saveGenerationToHistory(cvResult, jobDescription, activeConfig.provider, activeConfig.model);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('CV generation cancelled by user.');
        return;
      }
      console.error(err);
      setError(err.message || 'An unexpected error occurred while communicating with the LLM API.');
    } finally {
      setGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleAutoFix = async () => {
    if (userProfile?.plan === 'free' && userProfile.generation_count >= 5) {
      setPricingModalReason('limit_reached');
      setIsPricingModalOpen(true);
      return;
    }

    if (!result) return;
    
    setGenerating(true);
    setIsAutoFixing(true);
    setError(null);
    abortControllerRef.current = new AbortController();

    const activeConfig = userProfile?.plan === 'free'
      ? { ...config, provider: 'gemini' as const, model: 'gemini-flash-latest' }
      : config;

    try {
      const fixedResult = await autoFixCV(activeConfig, result.cvMarkdown, jobDescription, result.atsAnalysis, abortControllerRef.current.signal);
      setResult(fixedResult);

      // Save updated generation to history & increment count
      saveGenerationToHistory(fixedResult, jobDescription, activeConfig.provider, activeConfig.model);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Auto-fix cancelled by user.');
        return;
      }
      console.error(err);
      setError(err.message || 'An unexpected error occurred while auto-fixing with the LLM API.');
    } finally {
      setGenerating(false);
      setIsAutoFixing(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleUpdateMarkdown = (newMarkdown: string) => {
    if (result) {
      setResult({
        ...result,
        cvMarkdown: newMarkdown
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetError(null);
    setResetSuccess(null);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setResetSuccess('Password updated successfully! Redirecting...');
      setTimeout(() => {
        setIsResettingPassword(false);
        setNewPassword('');
      }, 2000);
    } catch (err: any) {
      setResetError(err.message || 'Failed to reset password');
    } finally {
      setResetLoading(false);
    }
  };

  const getLoaderText = () => {
    if (isAutoFixing) {
      switch (genStep) {
        case 0: return { title: 'Analyzing Gaps', desc: 'Identifying the missing keywords and weaknesses from the ATS scan...' };
        case 1: return { title: 'Weaving Keywords', desc: 'Organically injecting keywords into your bullet points without sounding robotic...' };
        case 2: return { title: 'Refining Tone', desc: 'Applying a human-friendly polish to the newly generated achievements...' };
        case 3: return { title: 'Updating Cover Letter', desc: 'Aligning the cover letter with the newly strengthened CV...' };
        default: return { title: 'Processing Auto-Fix', desc: 'Optimizing your resume...' };
      }
    }
    
    switch (genStep) {
      case 0: return { title: 'Scanning Job Description', desc: 'Analyzing the JD to extract core technical stack, keywords, and soft skills requirements...' };
      case 1: return { title: 'Mapping Career Experience', desc: 'Searching your uploaded profiles to find matching achievements, roles, and project evidence...' };
      case 2: return { title: 'Optimizing ATS Compatibility', desc: 'Crafting the CV outline, embedding keywords naturally, and structuring bullet points for scanner scoring...' };
      case 3: return { title: 'Applying Human-Friendly Polish', desc: 'Refining grammar, using strong action verbs, and formatting the markdown layout for the preview...' };
      default: return { title: 'Processing API Request', desc: 'Generating your customized resume...' };
    }
  };

  const isKeyConfigured = 
    userProfile?.plan === 'pro' || 
    userProfile?.plan === 'free' || 
    (userProfile?.plan === 'byok' && savedKeys[config.provider]);

  // Standalone Admin Route (e.g. /admin, /jd2cv/admin, or #/admin)
  if (isAdminRoute) {
    return (
      <AdminPortal
        userProfile={userProfile}
        session={session}
        onReturnToApp={() => {
          if (window.location.hash.includes('admin')) {
            window.location.hash = '';
          }
          if (window.location.pathname.endsWith('/admin') || window.location.pathname.endsWith('/admin/')) {
            const base = window.location.pathname.replace(/\/admin\/?$/, '') || '/';
            window.history.pushState(null, '', base);
          }
          setIsAdminRoute(false);
        }}
      />
    );
  }

  // Password reset UI Overlay
  if (isResettingPassword) {
    return (
      <div style={{ 
        display: 'flex', 
        height: '100vh', 
        width: '100vw', 
        justifyContent: 'center', 
        alignItems: 'center', 
        background: 'radial-gradient(circle at center, var(--bg-secondary) 0%, var(--bg-primary) 100%)',
        position: 'relative'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          maxWidth: '400px',
          padding: '2.5rem',
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          borderRadius: 'var(--border-radius-lg)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(20px)'
        }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Set New Password</h2>
          
          {resetError && (
            <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.85rem' }}>
              {resetError}
            </div>
          )}
          {resetSuccess && (
            <div style={{ padding: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-mint)', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.85rem' }}>
              {resetSuccess}
            </div>
          )}
          
          <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label htmlFor="new-password">New Password</label>
              <input
                id="new-password"
                type="password"
                required
                placeholder="Minimum 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={resetLoading} style={{ marginTop: '0.5rem' }}>
              {resetLoading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Loading States
  if (authLoading && !session) {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100vw', justifyContent: 'center', alignItems: 'center', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          <div className="radar-spinner" style={{ width: '48px', height: '48px', border: '3px solid var(--card-border)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Initializing secure environment...</span>
        </div>
      </div>
    );
  }

  // Auth Wall
  if (!session) {
    return (
      <div style={{ 
        display: 'flex', 
        minHeight: '100vh', 
        width: '100vw', 
        justifyContent: 'center', 
        alignItems: 'flex-start', 
        background: 'radial-gradient(circle at center, var(--bg-secondary) 0%, var(--bg-primary) 100%)',
        position: 'relative',
        overflowY: 'auto',
        overflowX: 'hidden'
      }}>
        <AuthForm 
          onSuccess={() => {}} 
          theme={theme} 
          onThemeToggle={handleThemeToggle} 
          onOpenLegal={(doc) => openLegalModal(doc)}
        />
        <LegalModal 
          isOpen={legalModalOpen} 
          onClose={() => setLegalModalOpen(false)} 
          initialDoc={legalModalDoc} 
        />
      </div>
    );
  }

  const loaderText = getLoaderText();

  // Render view functions
  const renderSidebar = () => {
    return (
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`} style={{ width: sidebarCollapsed ? '72px' : '260px' }}>
        <button
          type="button"
          className="sidebar-toggle-btn"
          onClick={handleSidebarToggle}
          title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        <div className="sidebar-scroll-area" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '1.5rem 1rem' }}>
          <div className="flex-row-gap" style={{ marginBottom: '2.5rem', paddingLeft: '0.5rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <Sparkles size={18} />
            </div>
            {!sidebarCollapsed && (
              <div>
                <h1 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>JD2CV</h1>
                <p style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.15em', margin: 0, color: 'var(--text-muted)', fontWeight: 600 }}>Career Workspace</p>
              </div>
            )}
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flexGrow: 1 }}>
            <button 
              className={`tab ${activeTab === 'quick-optimize' && !isCustomizing ? 'active nav-item-active' : ''}`} 
              onClick={() => { setActiveTab('quick-optimize'); setIsCustomizing(false); }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', width: '100%', border: 'none', background: 'none', color: 'inherit', textAlign: 'left', borderRadius: '8px', cursor: 'pointer' }}
            >
              <Sparkles size={18} style={{ color: 'var(--accent-secondary)' }} />
              {!sidebarCollapsed && <span className="font-label-sm">AI Optimize CV</span>}
            </button>

            <button 
              className={`tab ${activeTab === 'resumes' && !isCustomizing ? 'active nav-item-active' : ''}`} 
              onClick={() => { setActiveTab('resumes'); setIsCustomizing(false); }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', width: '100%', border: 'none', background: 'none', color: 'inherit', textAlign: 'left', borderRadius: '8px', cursor: 'pointer' }}
            >
              <FileText size={18} />
              {!sidebarCollapsed && <span className="font-label-sm">Base CV</span>}
            </button>

            <button 
              className={`tab ${activeTab === 'history' && !isCustomizing ? 'active nav-item-active' : ''}`} 
              onClick={() => { 
                setActiveTab('history'); 
                setIsCustomizing(false);
                fetchRecentGenerations();
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', width: '100%', border: 'none', background: 'none', color: 'inherit', textAlign: 'left', borderRadius: '8px', cursor: 'pointer' }}
            >
              <History size={18} />
              {!sidebarCollapsed && <span className="font-label-sm">CV History</span>}
            </button>

            <div style={{ margin: '1rem 0 0.5rem 0.5rem', fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
              {!sidebarCollapsed && "System"}
            </div>

            <button 
              className={`tab ${activeTab === 'settings' && !isCustomizing ? 'active nav-item-active' : ''}`} 
              onClick={() => { setActiveTab('settings'); setIsCustomizing(false); }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', width: '100%', border: 'none', background: 'none', color: 'inherit', textAlign: 'left', borderRadius: '8px', cursor: 'pointer' }}
            >
              <Settings size={18} />
              {!sidebarCollapsed && <span className="font-label-sm">Settings</span>}
            </button>

            <button 
              className={`tab ${activeTab === 'contact' && !isCustomizing ? 'active nav-item-active' : ''}`} 
              onClick={() => { setActiveTab('contact'); setIsCustomizing(false); }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', width: '100%', border: 'none', background: 'none', color: 'inherit', textAlign: 'left', borderRadius: '8px', cursor: 'pointer' }}
            >
              <MessageSquare size={18} />
              {!sidebarCollapsed && <span className="font-label-sm">Contact Us</span>}
            </button>
          </nav>

          <div style={{ marginTop: 'auto' }}>
            {!sidebarCollapsed && (
              <div 
                className="glass-card" 
                onClick={() => { setPricingModalReason('manual'); setIsPricingModalOpen(true); }}
                style={{ 
                  padding: '0.85rem 1rem', 
                  borderRadius: '12px', 
                  background: 'var(--bg-secondary)', 
                  border: userProfile?.plan === 'pro' ? '1px solid rgba(192, 132, 252, 0.3)' : '1px solid var(--card-border)', 
                  marginBottom: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <span className="font-label-sm" style={{ fontWeight: 800, color: userProfile?.plan === 'pro' ? '#c084fc' : userProfile?.plan === 'byok' ? '#a78bfa' : 'var(--text-primary)' }}>
                    {userProfile?.plan === 'pro' ? '⭐ Pro Plan' : userProfile?.plan === 'byok' ? '🔑 BYOK Plan' : 'Free Tier'}
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--accent-primary)', fontWeight: 700, textDecoration: 'underline' }}>
                    {userProfile?.plan === 'pro' ? 'Manage' : 'Upgrade'}
                  </span>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  {userProfile?.plan === 'free' ? `${userProfile.generation_count} of 5 free used` : 'Unlimited generations'}
                </span>
              </div>
            )}
            
            <button 
              type="button" 
              onClick={handleLogout}
              className="tab" 
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', width: '100%', border: 'none', background: 'none', color: 'var(--danger)', textAlign: 'left', borderRadius: '8px', cursor: 'pointer' }}
            >
              <LogOut size={18} />
              {!sidebarCollapsed && <span className="font-label-sm">Log Out</span>}
            </button>

            {!sidebarCollapsed && (
              <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', alignItems: 'center', fontSize: '11px', color: 'var(--text-muted)', marginTop: '0.75rem', paddingBottom: '0.25rem' }}>
                <button 
                  type="button" 
                  onClick={() => openLegalModal('privacy')} 
                  style={{ background: 'none', border: 'none', color: 'inherit', padding: 0, cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Privacy
                </button>
                <span>•</span>
                <button 
                  type="button" 
                  onClick={() => openLegalModal('terms')} 
                  style={{ background: 'none', border: 'none', color: 'inherit', padding: 0, cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Terms
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
    );
  };

  const renderTopNav = () => {
    return (
      <header className="glass-header top-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem' }}>
        {/* Mobile Hamburger Button & Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            className="mobile-hamburger-btn"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              padding: '0.25rem',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Mobile Brand Logo */}
          <div className="mobile-brand-title" style={{ alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg, #7c3aed 0%, #4f378a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '12px' }}>✦</div>
            <span style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>JD2CV</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Plan Upgrade Pill */}
          <button
            type="button"
            onClick={() => { setPricingModalReason('manual'); setIsPricingModalOpen(true); }}
            style={{
              background: userProfile?.plan === 'pro' 
                ? 'rgba(192, 132, 252, 0.12)' 
                : 'linear-gradient(135deg, rgba(124, 58, 237, 0.15) 0%, rgba(236, 72, 153, 0.15) 100%)',
              border: userProfile?.plan === 'pro' 
                ? '1px solid rgba(192, 132, 252, 0.3)' 
                : '1px solid rgba(236, 72, 153, 0.35)',
              color: userProfile?.plan === 'pro' ? '#c084fc' : '#f472b6',
              padding: '0.35rem 0.85rem',
              borderRadius: '999px',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              transition: 'all 0.2s ease'
            }}
          >
            {userProfile?.plan === 'pro' ? (
              <>
                <Zap size={13} fill="#c084fc" />
                <span>PRO ACTIVE</span>
              </>
            ) : (
              <>
                <Zap size={13} fill="#f472b6" />
                <span>UPGRADE TO PRO</span>
              </>
            )}
          </button>

          <button 
            type="button" 
            className="theme-toggle-header-btn" 
            onClick={handleThemeToggle}
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg-secondary)', border: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>

          <button 
            type="button"
            className="btn btn-primary header-create-btn"
            onClick={() => { setIsCustomizing(true); setCustomizerStep(1); }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'auto', padding: '0.5rem 1rem', borderRadius: '20px', background: 'var(--accent-primary)', fontSize: '0.82rem' }}
          >
            <Plus size={16} />
            <span className="create-resume-btn-text">Create Resume</span>
          </button>
        </div>
      </header>
    );
  };

  const renderWorkspaceTab = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Welcome Section */}
        <section className="entrance-fade" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '2.1rem', margin: 0, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              Welcome, {userProfile?.full_name?.split(' ')[0] || 'Vineet'} 👋😎
            </h2>
            <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0 0', fontSize: '0.95rem' }}>
              You have 2 pending ATS optimizations and 3 new job matches today.
            </p>
          </div>
          <div className="glass-card" style={{ display: 'flex', gap: '1.5rem', padding: '0.75rem 1.5rem', borderRadius: '16px', border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)', background: 'var(--card-bg)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em' }}>Avg ATS Score</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-secondary)' }}>85%</span>
            </div>
            <div style={{ width: '1px', background: 'var(--card-border)' }}></div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em' }}>Applications</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>3</span>
            </div>
          </div>
        </section>

        {/* Quick Actions Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md entrance-fade" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <div className="onboarding-card-redesign" onClick={() => { setIsCustomizing(true); setCustomizerStep(1); }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(37, 99, 235, 0.1)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <Plus size={20} />
            </div>
            <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: 600 }}>Create New</h4>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Build from a smart template</p>
          </div>

          <div className="onboarding-card-redesign" onClick={() => { setActiveTab('resumes'); setTimeout(() => fileInputRef.current?.click(), 100); }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(124, 58, 237, 0.1)', color: 'var(--accent-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <Upload size={20} />
            </div>
            <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: 600 }}>Upload Resume</h4>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Scan and optimize existing PDF</p>
          </div>

          <div className="onboarding-card-redesign" onClick={() => { setIsCustomizing(true); setCustomizerStep(2); }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(186, 72, 0, 0.1)', color: 'var(--accent-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <FileText size={20} />
            </div>
            <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: 600 }}>Paste JD</h4>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Match against a specific role</p>
          </div>

          <div className="onboarding-card-redesign" style={{ opacity: 0.6, cursor: 'not-allowed' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--bg-secondary)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <Zap size={20} />
            </div>
            <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>LinkedIn Import</span>
              <span style={{ fontSize: '8px', padding: '2px 6px', background: 'var(--bg-tertiary)', borderRadius: '99px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Coming Soon</span>
            </h4>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Sync profile details automatically</p>
          </div>
        </section>

        {/* 2-Column Canvas Layout */}
        <div className="workspace-grid">
          
          {/* Main Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Active Unfinished project indicator if CV results are present */}
            {result && (
              <section className="entrance-fade" style={{ background: 'var(--accent-primary)', borderRadius: '16px', padding: '1.75rem', color: '#ffffff', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'relative', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
                  <div style={{ flexGrow: 1 }}>
                    <span style={{ fontSize: '9px', padding: '2px 8px', background: 'rgba(255,255,255,0.2)', borderRadius: '99px', textTransform: 'uppercase', fontWeight: 600 }}>Current Work</span>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0.5rem 0 0.25rem 0', color: '#fff' }}>Optimized Resume Completed</h3>
                    <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)', margin: 0, maxWidth: '400px' }}>Your customized document score reached {result.atsScore}%. Open the workspace to review details and export PDF.</p>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem' }}>
                      <button className="btn" onClick={() => { setIsCustomizing(true); setCustomizerStep(5); }} style={{ width: 'auto', background: '#ffffff', color: 'var(--accent-primary)', padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                        Open Workspace
                      </button>
                    </div>
                  </div>
                  <div style={{ position: 'relative', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg style={{ width: '80px', height: '80px' }}>
                      <circle cx="40" cy="40" r="34" fill="transparent" stroke="rgba(255,255,255,0.15)" strokeWidth="6" />
                      <circle cx="40" cy="40" r="34" fill="transparent" stroke="#ffffff" strokeWidth="6" strokeDasharray="213.6" strokeDashoffset={213.6 - (result.atsScore / 100) * 213.6} strokeLinecap="round" className="progress-ring-circle" />
                    </svg>
                    <span style={{ position: 'absolute', fontSize: '1.1rem', fontWeight: 700 }}>{result.atsScore}%</span>
                  </div>
                </div>
              </section>
            )}

            {/* Master Base CV Section */}
            <section style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 600, margin: 0 }}>Master Base CV</h3>
                <button className="tab" onClick={() => setActiveTab('resumes')} style={{ border: 'none', background: 'none', color: 'var(--accent-primary)', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600 }}>Manage Base CV →</button>
              </div>

              <div>
                {contextCVs.length === 0 ? (
                  <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', borderStyle: 'dashed' }}>
                    <FileText size={32} style={{ margin: '0 auto 0.75rem', color: 'var(--text-muted)' }} />
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>No master base CV uploaded. Upload your base resume to get started.</p>
                  </div>
                ) : (
                  <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FileText size={18} style={{ color: 'var(--accent-primary)' }} />
                      </div>
                      <span style={{ fontSize: '10px', background: 'rgba(16,185,129,0.12)', color: '#10b981', padding: '2px 8px', borderRadius: '99px', fontWeight: 700 }}>Active Master Base CV ✓</span>
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.95rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{contextCVs[0]?.name}</h4>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Primary Career Timeline Document</p>
                    </div>
                    <hr style={{ borderColor: 'var(--card-border)', margin: 0 }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Size: {Math.round((contextCVs[0]?.text?.length || 0) / 100) / 10} KB • ~{Math.round((contextCVs[0]?.text?.length || 0) / 5)} words</span>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button className="tab" onClick={() => handleDownloadCV(contextCVs[0]?.name, contextCVs[0]?.text)} style={{ padding: '0.25rem', border: 'none', background: 'none', cursor: 'pointer' }} title="Download markdown">
                          <Download size={14} />
                        </button>
                        <button className="tab" onClick={() => handleRemoveCV()} style={{ padding: '0.25rem', border: 'none', background: 'none', color: 'var(--danger)', cursor: 'pointer' }} title="Delete Base CV">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Applications Table Section */}
            <section className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>Active Job Applications</h3>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="saas-table">
                  <thead>
                    <tr>
                      <th>Company</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>ATS Match</th>
                      <th>Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ fontWeight: 600 }}>Apple Inc.</td>
                      <td>Systems Engineer</td>
                      <td>
                        <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '99px', background: 'rgba(124, 58, 237, 0.1)', color: 'var(--accent-secondary)', fontWeight: 600 }}>Interviewing</span>
                      </td>
                      <td style={{ fontWeight: 700 }}>88%</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Oct 12, 2023</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600 }}>Amazon</td>
                      <td>Senior Frontend Developer</td>
                      <td>
                        <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '99px', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', fontWeight: 600 }}>Applied</span>
                      </td>
                      <td style={{ fontWeight: 700 }}>74%</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Oct 09, 2023</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600 }}>Netflix</td>
                      <td>Cloud Infrastructure Lead</td>
                      <td>
                        <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '99px', background: 'rgba(186, 26, 26, 0.1)', color: 'var(--danger)', fontWeight: 600 }}>Rejected</span>
                      </td>
                      <td style={{ fontWeight: 700 }}>62%</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Oct 05, 2023</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

          </div>

          {/* Right Column widgets */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Widget 1: Plan Quota */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>Usage & Billing</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Customized CV count</span>
                  <span style={{ fontWeight: 600 }}>
                    {userProfile?.plan === 'free' ? `${userProfile.generation_count} / 5` : 'Unlimited'}
                  </span>
                </div>
                {userProfile?.plan === 'free' && (
                  <div style={{ width: '100%', height: '5px', background: 'var(--bg-secondary)', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{ width: `${(userProfile.generation_count / 5) * 100}%`, height: '100%', background: 'var(--accent-primary)' }}></div>
                  </div>
                )}
              </div>
              <button className="btn btn-primary" onClick={() => setActiveTab('settings')} style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}>
                Manage Subscriptions
              </button>
            </div>

            {/* Widget 2: AI Coach Suggestions */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(124, 58, 237, 0.03)', border: '1px solid rgba(124, 58, 237, 0.15)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--accent-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sparkles size={18} />
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>AI Workspace Coach</h4>
                </div>
                <AICoachIllustration size={32} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '8px', padding: '0.75rem' }}>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    Your Meta CV target is missing: <strong>distributed architectures</strong> and <strong>quantitative scale</strong> evidence.
                  </p>
                  <button onClick={() => { setIsCustomizing(true); setCustomizerStep(2); }} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.75rem', fontWeight: 600, padding: '0.4rem 0 0 0', display: 'flex', alignItems: 'center', gap: '0.2rem', cursor: 'pointer' }}>
                    Optimize Experience <ArrowRight size={10} />
                  </button>
                </div>

                <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '8px', padding: '0.75rem' }}>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    Stripe applications benefit heavily from <strong>performance metrics ($ / %)</strong>. Ensure project gains are numeric.
                  </p>
                  <button onClick={() => { setIsCustomizing(true); setCustomizerStep(3); }} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.75rem', fontWeight: 600, padding: '0.4rem 0 0 0', display: 'flex', alignItems: 'center', gap: '0.2rem', cursor: 'pointer' }}>
                    Fix Metrics <ArrowRight size={10} />
                  </button>
                </div>
              </div>
            </div>

            {/* Widget 3: Upcoming Events */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>Upcoming Events</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <div style={{ width: '40px', height: '40px', background: 'var(--bg-secondary)', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '8px', fontWeight: 600, color: 'var(--text-muted)' }}>OCT</span>
                    <span style={{ fontSize: '1rem', fontWeight: 800, lineHeight: 1, color: 'var(--text-primary)' }}>15</span>
                  </div>
                  <div>
                    <h5 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600 }}>Apple Inc. - Round 1</h5>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>10:00 AM • Virtual Interview</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <div style={{ width: '40px', height: '40px', background: 'var(--bg-secondary)', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '8px', fontWeight: 600, color: 'var(--text-muted)' }}>OCT</span>
                    <span style={{ fontSize: '1rem', fontWeight: 800, lineHeight: 1, color: 'var(--text-primary)' }}>18</span>
                  </div>
                  <div>
                    <h5 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600 }}>Google - Tech Onsite</h5>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>02:30 PM • Google Meet</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    );
  };

  const renderResumesTab = () => {
    const hasBaseCV = contextCVs.length > 0;
    const baseCV = contextCVs[0];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} className="entrance-fade">
        <div>
          <h2 style={{ fontSize: '1.6rem', margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <FileText size={24} style={{ color: 'var(--accent-primary)' }} />
            <span>Master Base CV</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>
            Upload and manage your single Master Base Resume. The AI uses this timeline to understand your experience and tailor it for any target job description.
          </p>
        </div>

        {error && (
          <div className="flex-row-gap" style={{ color: 'var(--danger)', fontSize: '0.85rem', background: 'rgba(255, 59, 48, 0.08)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid rgba(255, 59, 48, 0.15)' }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Hidden File Input for Base CV Upload / Replace */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".pdf,.txt,.md"
          style={{ display: 'none' }}
        />

        {!hasBaseCV ? (
          /* Empty State: Master Base CV Upload Box */
          <div className="glass-card" style={{ padding: '3rem 2rem', textAlign: 'center', maxWidth: '650px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
            <div 
              className="file-upload-zone" 
              onClick={triggerFileInput} 
              style={{ borderStyle: 'dashed', padding: '2.5rem 1.5rem', cursor: 'pointer', borderRadius: '16px', background: 'var(--bg-secondary)', transition: 'all 0.2s' }}
            >
              <Upload size={36} style={{ margin: '0 auto 0.75rem', color: 'var(--accent-primary)' }} />
              <h4 style={{ margin: '0 0 0.35rem 0', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {parsingFile ? 'Extracting text...' : 'Upload Your Master Base CV'}
              </h4>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Drag & Drop or Click to browse (Supports PDF, TXT, and Markdown up to 10MB)
              </p>
            </div>

            <div style={{ marginTop: '1.5rem', padding: '1rem', borderRadius: '12px', background: 'rgba(124, 58, 237, 0.06)', border: '1px solid rgba(124, 58, 237, 0.2)', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.85rem', color: 'var(--accent-secondary)', marginBottom: '0.25rem' }}>
                <Sparkles size={16} />
                <span>Why a Single Master Base CV?</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Maintaining one primary base CV keeps your career timeline factual and consistent, avoids conflicting dates, and prevents AI prompt latency.
              </p>
            </div>
          </div>
        ) : (
          /* Active Base CV Dashboard */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Master Base CV Overview Card */}
            <div className="glass-card" style={{ padding: '1.75rem 2rem', background: 'var(--card-bg)', border: '1.5px solid rgba(16, 185, 129, 0.4)', borderRadius: '18px', boxShadow: '0 0 24px rgba(16, 185, 129, 0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', minWidth: 0 }}>
                  <div style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    flexShrink: 0,
                    boxShadow: '0 6px 16px rgba(124, 58, 237, 0.35)'
                  }}>
                    <FileText size={26} />
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                      <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={baseCV.name}>
                        {baseCV.name}
                      </h3>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '2px 8px', borderRadius: '12px' }}>
                        Active Master CV ✓
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      <span><strong>Size:</strong> {Math.round(baseCV.text.length / 100) / 10} KB</span>
                      <span>•</span>
                      <span><strong>Words:</strong> ~{Math.round(baseCV.text.length / 5)}</span>
                      <span>•</span>
                      <span><strong>Lines:</strong> {baseCV.text.split('\n').length}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button 
                    type="button" 
                    className="btn btn-primary"
                    onClick={triggerFileInput} 
                    disabled={parsingFile}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem', fontSize: '0.85rem' }}
                  >
                    <Upload size={16} />
                    <span>{parsingFile ? 'Replacing...' : 'Replace with New CV'}</span>
                  </button>
                  
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => handleDownloadCV(baseCV.name, baseCV.text)} 
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1rem', fontSize: '0.85rem' }}
                    title="Download extracted markdown text"
                  >
                    <Download size={16} />
                    <span>Download</span>
                  </button>

                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => {
                      if (window.confirm("Are you sure you want to delete your Master Base CV? You will need to upload a new one to generate resumes.")) {
                        handleRemoveCV();
                      }
                    }} 
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1rem', fontSize: '0.85rem', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                    title="Delete Base CV"
                  >
                    <Trash2 size={16} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Extracted Text Inspector */}
            <div className="glass-card" style={{ padding: '1.75rem', background: 'var(--card-bg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sparkles size={16} style={{ color: 'var(--accent-primary)' }} />
                  <span>Extracted Career Timeline (Inspector)</span>
                </h4>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    navigator.clipboard.writeText(baseCV.text);
                    alert("Base CV extracted text copied to clipboard!");
                  }}
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <Copy size={13} />
                  <span>Copy Text</span>
                </button>
              </div>

              <div style={{
                maxHeight: '380px',
                overflowY: 'auto',
                padding: '1.25rem',
                borderRadius: '12px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--card-border)',
                fontSize: '0.85rem',
                lineHeight: 1.6,
                color: 'var(--text-secondary)',
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace'
              }}>
                {baseCV.text}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderQuickOptimizeTab = () => {
    const isCVMissing = contextCVs.length === 0;
    const isJDMissing = !jobDescription.trim();
    const isCVSelectedMissing = activeCVIndices.length === 0;
    const canSubmit = !isCVMissing && !isJDMissing && !isCVSelectedMissing && !generating && isKeyConfigured;

    if (generating) {
      return (
        <LiquidCard variant="glass" padding="lg" style={{ maxWidth: '900px', margin: '2rem auto' }} className="entrance-fade">
          <div className="scanner-container">
            <div className="radar-sweep">
              <div className="radar-scan-line"></div>
              <div className="radar-grid"></div>
            </div>
            <div className="scanner-text">{loaderText.title}</div>
            <div className="scanner-subtext">{loaderText.desc}</div>
            <button type="button" className="btn btn-secondary" onClick={handleCancel} style={{ width: 'auto', marginTop: '1.5rem', color: 'var(--danger)' }}>
              Cancel Customization
            </button>
          </div>
        </LiquidCard>
      );
    }

    if (result) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="entrance-fade">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="no-print">
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Optimized Resume Result</h2>
              <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0 0', fontSize: '0.85rem' }}>Review matching keywords, edit markdown, or export PDF.</p>
            </div>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => setResult(null)}
              style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <ArrowLeft size={16} />
              <span>Customize Another</span>
            </button>
          </div>
          <CVDisplay
            result={result}
            onUpdateMarkdown={handleUpdateMarkdown}
            onAutoFix={handleAutoFix}
            userProfile={userProfile}
            jobDescription={jobDescription}
          />
        </div>
      );
    }

    const isStep1Done = contextCVs.length > 0 && activeCVIndices.length > 0;
    const isStep2Done = jobDescription.trim().length >= 30;
    const isStep3Ready = isStep1Done && isStep2Done && !generating;

    return (
      <div className="entrance-fade" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Header Section */}
        <div>
          <h2 style={{ fontSize: '2.1rem', margin: 0, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Welcome, {userProfile?.full_name?.split(' ')[0] || 'Vineet'} 👋😎
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0 0', fontSize: '0.95rem' }}>
            Ready to land your next role? Optimize your resume for any job description in seconds.
          </p>
        </div>

        {/* 1-2-3 Instruction Steps with Live Status Glowing Running Border */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.25rem' }}>
          {/* Step 1 */}
          <div 
            className={`step-card-status ${isStep1Done ? 'is-done' : 'is-pending'}`} 
            style={{ padding: '1.1rem 1.25rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}
          >
            <div style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '50%', 
              background: isStep1Done ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)', 
              color: isStep1Done ? '#10b981' : '#f59e0b', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontWeight: 800, 
              fontSize: '0.85rem', 
              flexShrink: 0 
            }}>
              {isStep1Done ? '✓' : '1'}
            </div>
            <div style={{ flexGrow: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>Step 1: Upload Base Resume</h4>
                <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', background: isStep1Done ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)', color: isStep1Done ? '#10b981' : '#f59e0b' }}>
                  {isStep1Done ? 'Ready ✓' : 'Pending'}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                Upload a base resume for the AI to understand your career timeline better.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div 
            className={`step-card-status ${isStep2Done ? 'is-done' : 'is-pending'}`} 
            style={{ padding: '1.1rem 1.25rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}
          >
            <div style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '50%', 
              background: isStep2Done ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)', 
              color: isStep2Done ? '#10b981' : '#f59e0b', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontWeight: 800, 
              fontSize: '0.85rem', 
              flexShrink: 0 
            }}>
              {isStep2Done ? '✓' : '2'}
            </div>
            <div style={{ flexGrow: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>Step 2: Paste Target JD</h4>
                <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', background: isStep2Done ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)', color: isStep2Done ? '#10b981' : '#f59e0b' }}>
                  {isStep2Done ? 'Ready ✓' : 'Pending'}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                Paste the full text of the job description you are applying for.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div 
            className={`step-card-status ${isStep3Ready ? 'is-ready' : 'is-pending'}`} 
            style={{ padding: '1.1rem 1.25rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}
          >
            <div style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '50%', 
              background: isStep3Ready ? 'rgba(124, 58, 237, 0.25)' : 'rgba(245, 158, 11, 0.2)', 
              color: isStep3Ready ? '#c084fc' : '#f59e0b', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontWeight: 800, 
              fontSize: '0.85rem', 
              flexShrink: 0 
            }}>
              {isStep3Ready ? '⚡' : '3'}
            </div>
            <div style={{ flexGrow: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>Step 3: Run AI Customizer</h4>
                <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', background: isStep3Ready ? 'rgba(124, 58, 237, 0.2)' : 'rgba(245, 158, 11, 0.15)', color: isStep3Ready ? '#c084fc' : '#f59e0b' }}>
                  {isStep3Ready ? 'Ready to Generate 🚀' : 'Waiting'}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                Set the desired length of your CV and the Focus/ Future aspiration and hit Generate.
              </p>
            </div>
          </div>
        </div>

        {/* 2-Column Balanced Equal Grid */}
        <div className="workspace-equal-grid">
          
          {/* Left Column: 1. Base Resume */}
          <div className="glass-card" style={{ padding: '1.75rem', background: 'var(--card-bg)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', boxSizing: 'border-box' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={18} style={{ color: 'var(--accent-primary)' }} />
                  <span>1. Base Resume Profile</span>
                </h3>
                {contextCVs.length > 0 && (
                  <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700, background: 'rgba(16, 185, 129, 0.12)', padding: '2px 8px', borderRadius: '12px' }}>
                    Active Base Loaded ✓
                  </span>
                )}
              </div>

              {/* Base Resume Presentation */}
              {contextCVs.length === 0 ? (
                <div>
                  <label className="saas-upload-dropzone" style={{ padding: '2.5rem 1.5rem', minHeight: '200px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed var(--card-border)', borderRadius: '16px', background: 'var(--bg-secondary)', transition: 'all 0.2s' }}>
                    <input 
                      type="file" 
                      accept=".pdf,.txt,.md" 
                      onChange={handleFileUpload} 
                      style={{ display: 'none' }} 
                    />
                    <UploadIllustration size={56} className="mb-2" />
                    <span style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginTop: '0.75rem', color: 'var(--text-primary)' }}>Upload Master Base Resume</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '0.25rem' }}>PDF, TXT or MD up to 10MB</span>
                  </label>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '1rem', lineHeight: 1.5 }}>
                    Upload your primary resume. The AI will use your factual career history and tailor it specifically for each job.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{
                    padding: '1.25rem',
                    borderRadius: '14px',
                    border: '1.5px solid rgba(16, 185, 129, 0.35)',
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.06) 0%, rgba(17, 23, 38, 0.65) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                  }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      flexShrink: 0,
                      boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)'
                    }}>
                      <FileText size={22} />
                    </div>
                    <div style={{ flexGrow: 1, minWidth: 0 }}>
                      <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={contextCVs[0]?.name}>
                        {contextCVs[0]?.name}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Primary Master Career History • {contextCVs[0]?.text?.length ? `${Math.round(contextCVs[0].text.length / 5)} words` : 'Ready'}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
                    <label className="btn btn-secondary" style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.65rem 1rem', fontSize: '0.82rem' }}>
                      <input 
                        type="file" 
                        accept=".pdf,.txt,.md" 
                        onChange={handleFileUpload} 
                        style={{ display: 'none' }} 
                      />
                      <Upload size={14} />
                      <span>Replace with New PDF</span>
                    </label>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setActiveTab('resumes')}
                      style={{ width: 'auto', padding: '0.65rem 1rem', fontSize: '0.82rem' }}
                      title="Manage stored resumes"
                    >
                      All Resumes ({contextCVs.length})
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Explanatory Pro-Tip */}
            <div style={{
              marginTop: '1.75rem',
              padding: '0.85rem 1rem',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--card-border)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)'
            }}>
              <Sparkles size={16} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
              <span>Your base resume provides the timeline anchor; the AI highlights target skills for the JD.</span>
            </div>
          </div>

          {/* Right Column: 2. Target Role & Focus */}
          <div className="glass-card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', background: 'var(--card-bg)', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sparkles size={18} style={{ color: 'var(--accent-secondary)' }} />
                  <span>2. Target Role & Focus</span>
                </h3>
                {isStep2Done && (
                  <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700, background: 'rgba(16, 185, 129, 0.12)', padding: '2px 8px', borderRadius: '12px' }}>
                    JD Loaded ✓
                  </span>
                )}
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Paste Job Description (JD) *</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Cmd+Enter to generate</span>
                </label>
                <textarea
                  placeholder="Paste the complete job description of the role you are applying to. This helps the AI extract key skills, keywords, and responsibilities to optimize your resume."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  style={{ minHeight: '180px', fontSize: '0.85rem', lineHeight: '1.5' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="responsive-fields">
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Future Aspirations / Focus (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Focus on Tech Lead; React stack."
                    value={aspirations}
                    onChange={(e) => setAspirations(e.target.value)}
                    style={{ fontSize: '0.85rem' }}
                  />
                </div>
                
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Output Format & Length</label>
                  <select
                    value={targetLength}
                    onChange={(e) => setTargetLength(e.target.value as TargetLength)}
                    style={{ fontSize: '0.85rem' }}
                  >
                    <option value="1-page">1-Page ATS optimized sheet</option>
                    <option value="2-page">2-Page standard document</option>
                    <option value="3-page">3-Page comprehensive CV profile</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* API Key missing notification */}
              {!isKeyConfigured && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  color: '#fbbf24',
                  fontSize: '0.85rem',
                  background: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  padding: '0.75rem 1rem',
                  borderRadius: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                    <span>API Key required for active provider.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('settings')}
                    className="btn btn-secondary"
                    style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', fontWeight: 600 }}
                  >
                    Go to Settings →
                  </button>
                </div>
              )}

              {error && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.6rem',
                  color: '#f87171',
                  fontSize: '0.85rem',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  padding: '0.85rem 1rem',
                  borderRadius: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                    <span>
                      {error === 'API_KEY_REQUIRED'
                        ? 'An API Key is required on the BYOK plan. Please add your Gemini, OpenAI, or Anthropic API key in Settings.'
                        : error}
                    </span>
                  </div>
                  {(error === 'API_KEY_REQUIRED' || error.toLowerCase().includes('api key') || error.toLowerCase().includes('settings') || error.toLowerCase().includes('load failed')) && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('settings')}
                      className="btn btn-secondary"
                      style={{
                        alignSelf: 'flex-start',
                        padding: '0.35rem 0.85rem',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        background: 'rgba(255, 255, 255, 0.08)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      <span>Go to Settings →</span>
                    </button>
                  )}
                </div>
              )}

              <button
                className="btn btn-primary btn-mobile-full"
                onClick={handleGenerate}
                style={{ 
                  background: isStep3Ready ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' : 'var(--accent-secondary)', 
                  padding: '0.85rem 2rem', 
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  width: '100%',
                  boxShadow: isStep3Ready ? '0 4px 20px rgba(124, 58, 237, 0.35)' : 'none',
                  transition: 'all 0.2s ease'
                }}
                disabled={!canSubmit}
              >
                <Sparkles size={18} />
                <span>Generate Optimized CV</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderStepper = () => {
    const isCVMissing = contextCVs.length === 0;
    const isJDMissing = !jobDescription.trim();
    const isCVSelectedMissing = activeCVIndices.length === 0;
    const canSubmit = !isCVMissing && !isJDMissing && !isCVSelectedMissing && !generating && isKeyConfigured;

    return (
      <div className="glass-card font-body-md entrance-fade" style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--card-border)', paddingBottom: '1rem', marginBottom: '2rem' }} className="no-print">
          <div className={`stepper-step ${customizerStep >= 1 ? 'completed' : ''} ${customizerStep === 1 ? 'active' : ''}`}>
            <span className="stepper-step-number">1</span>
            <span className="font-label-sm">Select Profiles</span>
          </div>
          <div className={`stepper-step ${customizerStep >= 2 ? 'completed' : ''} ${customizerStep === 2 ? 'active' : ''}`}>
            <span className="stepper-step-number">2</span>
            <span className="font-label-sm">Target Role</span>
          </div>
          <div className={`stepper-step ${customizerStep >= 3 ? 'completed' : ''} ${customizerStep === 3 ? 'active' : ''}`}>
            <span className="stepper-step-number">3</span>
            <span className="font-label-sm">Advanced Details</span>
          </div>
          <div className={`stepper-step ${customizerStep >= 4 ? 'completed' : ''} ${customizerStep === 4 ? 'active' : ''}`}>
            <span className="stepper-step-number">4</span>
            <span className="font-label-sm">Verify</span>
          </div>
        </div>

        {/* Step 1: CV Selection */}
        {customizerStep === 1 && (
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 0.5rem 0' }}>Select Career Context</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Select which resume baseline profiles the LLM will merge to extract relevant experience.
            </p>
            
            {contextCVs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', border: '1.5px dashed var(--card-border)', borderRadius: '12px' }}>
                <FileText size={32} style={{ margin: '0 auto 0.75rem', color: 'var(--text-muted)' }} />
                <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>You don't have any resume profiles uploaded yet.</p>
                <button className="btn btn-primary" onClick={() => { setIsCustomizing(false); setActiveTab('resumes'); }} style={{ width: 'auto' }}>
                  Upload Profile Resumes
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {contextCVs.map((cv, index) => (
                  <label key={index} className="cv-badge" style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', padding: '1rem', borderRadius: '8px' }}>
                    <input
                      type="checkbox"
                      checked={activeCVIndices.includes(index)}
                      onChange={() => handleToggleCVIndex(index)}
                      style={{ width: '18px', height: '18px', accentColor: 'var(--accent-primary)' }}
                    />
                    <div style={{ flexGrow: 1 }}>
                      <span className="font-semibold" style={{ fontSize: '0.95rem' }}>{cv.name}</span>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Baseline profile</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: JD details */}
        {customizerStep === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 0.5rem 0' }}>Paste Job Description</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                The LLM maps keywords and experience bullets to match requirements in this text.
              </p>
            </div>
            <textarea
              placeholder="Paste the target JD here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              style={{ minHeight: '260px', fontFamily: 'var(--font-sans)', fontSize: '0.9rem' }}
            />
          </div>
        )}

        {/* Step 3: Secondary focus parameters */}
        {customizerStep === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 0.5rem 0' }}>Advanced Goals</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                Specify aspirations or output page count constraints to guide CV generation.
              </p>
            </div>

            <div className="form-group">
              <label>Future Aspirations (Optional)</label>
              <textarea
                placeholder="e.g. Focus on cloud scale optimizations and database security bullet points."
                value={aspirations}
                onChange={(e) => setAspirations(e.target.value)}
                style={{ minHeight: '100px' }}
              />
            </div>

            <div className="form-group">
              <label>Target Page Length</label>
              <select
                value={targetLength}
                onChange={(e) => setTargetLength(e.target.value as TargetLength)}
              >
                <option value="1-page">1-Page ATS optimized sheet</option>
                <option value="2-page">2-Page standard document</option>
                <option value="3-page">3-Page comprehensive CV profile</option>
              </select>
            </div>
          </div>
        )}

        {/* Step 4: Run Generation */}
        {customizerStep === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 0.5rem 0' }}>Run Customizer Engine</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                Double check key settings below before running the generation block.
              </p>
            </div>

            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--card-border)', padding: '1.25rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Selected context CV count:</span>
                <span style={{ fontWeight: 600 }}>{activeCVIndices.length} profiles</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Output Length:</span>
                <span style={{ fontWeight: 600 }}>{targetLength}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Model engine provider:</span>
                <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{config.provider.toUpperCase()} ({config.model})</span>
              </div>
            </div>

            {!isKeyConfigured && (
              <div className="flex-row-gap" style={{ color: 'var(--danger)', fontSize: '0.85rem', background: 'rgba(186, 26, 26, 0.08)', padding: '0.75rem 1rem', borderRadius: '8px' }}>
                <AlertCircle size={16} />
                <span>API Key missing for active provider. Update keys in Settings tab.</span>
              </div>
            )}
          </div>
        )}

        {/* Step 5: Review & Editor */}
        {customizerStep === 5 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {generating && (
              <div className="scanner-container">
                <div className="radar-sweep">
                  <div className="radar-scan-line"></div>
                  <div className="radar-grid"></div>
                </div>
                <div className="scanner-text">{loaderText.title}</div>
                <div className="scanner-subtext">{loaderText.desc}</div>
                <button type="button" className="btn btn-secondary" onClick={handleCancel} style={{ width: 'auto', marginTop: '1rem', color: 'var(--danger)' }}>
                  Cancel Customization
                </button>
              </div>
            )}

            {error && !generating && (
              <div className="flex-row-gap" style={{ color: 'var(--danger)', fontSize: '0.85rem', background: 'rgba(255, 59, 48, 0.08)', padding: '0.75rem 1rem', borderRadius: '8px' }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {result && !generating && (
              <CVDisplay
                result={result}
                onUpdateMarkdown={handleUpdateMarkdown}
                onAutoFix={handleAutoFix}
                userProfile={userProfile}
                jobDescription={jobDescription}
                targetLength={targetLength}
              />
            )}
          </div>
        )}

        {/* Footer Navigation bar */}
        {customizerStep < 5 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--card-border)', paddingTop: '1.25rem', marginTop: '2rem' }}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => {
                if (customizerStep > 1) {
                  setCustomizerStep(customizerStep - 1);
                } else {
                  setIsCustomizing(false);
                }
              }}
              style={{ width: 'auto' }}
            >
              {customizerStep === 1 ? 'Exit Customizer' : 'Back'}
            </button>

            {customizerStep < 4 ? (
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={() => setCustomizerStep(customizerStep + 1)}
                style={{ width: 'auto' }}
                disabled={customizerStep === 1 && activeCVIndices.length === 0}
              >
                Next Step
              </button>
            ) : (
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={async () => {
                  setCustomizerStep(5);
                  await handleGenerate();
                }}
                style={{ width: 'auto', background: 'var(--accent-secondary)' }}
                disabled={!canSubmit}
              >
                Generate ATS Resume
              </button>
            )}
          </div>
        )}

        {customizerStep === 5 && !generating && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--card-border)', paddingTop: '1.25rem', marginTop: '2.5rem' }} className="no-print">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => {
                setIsCustomizing(false);
                setResult(null);
                setCustomizerStep(1);
              }}
              style={{ width: 'auto' }}
            >
              Back to Dashboard
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <AuroraBackground>
      <div className={`app-container ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {renderSidebar()}

        <main className="main-layout">
          {renderTopNav()}

          <div className="main-content">
            {isCustomizing ? renderStepper() : (
              <>
                {activeTab === 'workspace' && renderWorkspaceTab()}
                {activeTab === 'quick-optimize' && renderQuickOptimizeTab()}
                {activeTab === 'resumes' && renderResumesTab()}
                
                {activeTab === 'history' && (
                  <CVHistoryPanel
                    generations={generations}
                    loading={generationsLoading}
                    onSelectGeneration={(gen) => {
                      setResult({
                        cvMarkdown: gen.cv_markdown,
                        atsScore: gen.ats_score || 85,
                        atsAnalysis: gen.ats_analysis || { matchedKeywords: [], missingKeywords: [], strengths: [], weaknesses: [], actionItems: [] },
                        humanFriendlyChanges: gen.human_changes || [],
                        coverLetter: gen.cover_letter || ''
                      });
                      if (gen.job_description) {
                        setJobDescription(gen.job_description);
                      }
                      setActiveTab('quick-optimize');
                    }}
                  />
                )}
                
                {activeTab === 'applications' && (
                  <div className="glass-card entrance-fade" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--card-border)' }}>
                      <h2 style={{ fontSize: '1.4rem', margin: 0, fontWeight: 700 }}>Job Applications Tracker</h2>
                      <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0 0', fontSize: '0.85rem' }}>View active applications pipeline and interview statuses.</p>
                    </div>
                    <table className="saas-table">
                      <thead>
                        <tr>
                          <th>Company</th>
                          <th>Role</th>
                          <th>Status</th>
                          <th>ATS Match</th>
                          <th>Updated</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ fontWeight: 600 }}>Apple Inc.</td>
                          <td>Systems Engineer</td>
                          <td>
                            <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '99px', background: 'rgba(124, 58, 237, 0.1)', color: 'var(--accent-secondary)', fontWeight: 600 }}>Interviewing</span>
                          </td>
                          <td style={{ fontWeight: 700 }}>88%</td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Oct 12, 2023</td>
                        </tr>
                        <tr>
                          <td style={{ fontWeight: 600 }}>Amazon</td>
                          <td>Senior Frontend Developer</td>
                          <td>
                            <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '99px', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', fontWeight: 600 }}>Applied</span>
                          </td>
                          <td style={{ fontWeight: 700 }}>74%</td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Oct 09, 2023</td>
                        </tr>
                        <tr>
                          <td style={{ fontWeight: 600 }}>Netflix</td>
                          <td>Cloud Infrastructure Lead</td>
                          <td>
                            <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '99px', background: 'rgba(186, 26, 26, 0.1)', color: 'var(--danger)', fontWeight: 600 }}>Rejected</span>
                          </td>
                          <td style={{ fontWeight: 700 }}>62%</td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Oct 05, 2023</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {activeTab === 'reports' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="entrance-fade">
                    <div>
                      <h2 style={{ fontSize: '1.4rem', margin: 0, fontWeight: 700 }}>ATS Reports Center</h2>
                      <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0 0', fontSize: '0.85rem' }}>Review aggregate dashboard scoring trends and keywords gap recommendations.</p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                      <div className="glass-card" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(37,99,235,0.1)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>85%</div>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>Avg Keyword Match</h4>
                          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Based on last 3 optimizations</p>
                        </div>
                      </div>
                      <div className="glass-card" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(124,58,237,0.1)', color: 'var(--accent-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>2/3</div>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>Interviews Scheduled</h4>
                          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>66% reply-back rate</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'settings' && (
                  <SettingsPanel
                    config={config}
                    onChangeConfig={handleConfigChange}
                    userProfile={userProfile}
                    onLogout={handleLogout}
                    onUpdateAvatar={handleUpdateAvatar}
                    onOpenPricingModal={() => { setPricingModalReason('manual'); setIsPricingModalOpen(true); }}
                    onOpenLegal={(doc) => openLegalModal(doc)}
                  />
                )}

                {activeTab === 'contact' && (
                  <ContactUsPanel
                    userProfile={userProfile}
                    session={session}
                  />
                )}
              </>
            )}
          </div>
        </main>

        {/* Pricing & Tier Upgrade Modal */}
        <PricingModal
          isOpen={isPricingModalOpen}
          onClose={() => setIsPricingModalOpen(false)}
          currentPlan={userProfile?.plan || 'free'}
          onSelectPlan={handleSelectPlan}
          generationCount={userProfile?.generation_count || 0}
          triggerReason={pricingModalReason}
        />

        {/* Slide-Over Mobile Glass Drawer */}
        {isMobileMenuOpen && (
          <div className="mobile-drawer-overlay no-print" onClick={() => setIsMobileMenuOpen(false)}>
            <div className="mobile-drawer-panel" onClick={(e) => e.stopPropagation()}>
              <div className="mobile-drawer-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {userProfile?.avatar_url ? (
                    <img src={userProfile.avatar_url} alt="Profile" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed 0%, #4f378a 100%)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                      {userProfile?.full_name?.charAt(0) || 'V'}
                    </div>
                  )}
                  <div style={{ minWidth: 0, flexGrow: 1 }}>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {userProfile?.full_name || 'Vineet'}
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {userProfile?.email}
                    </span>
                  </div>
                </div>
                <button type="button" onClick={() => setIsMobileMenuOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}>
                  <X size={22} />
                </button>
              </div>

              <div className="mobile-drawer-nav">
                <button
                  type="button"
                  className={`mobile-drawer-item ${activeTab === 'quick-optimize' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('quick-optimize'); setIsCustomizing(false); setIsMobileMenuOpen(false); }}
                >
                  <Sparkles size={18} />
                  <span>AI Workspace</span>
                </button>
                <button
                  type="button"
                  className={`mobile-drawer-item ${activeTab === 'resumes' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('resumes'); setIsCustomizing(false); setIsMobileMenuOpen(false); }}
                >
                  <FileText size={18} />
                  <span>Base CV</span>
                </button>
                <button
                  type="button"
                  className={`mobile-drawer-item ${activeTab === 'history' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('history'); setIsCustomizing(false); setIsMobileMenuOpen(false); }}
                >
                  <History size={18} />
                  <span>CV History</span>
                </button>
                <button
                  type="button"
                  className={`mobile-drawer-item ${activeTab === 'settings' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('settings'); setIsCustomizing(false); setIsMobileMenuOpen(false); }}
                >
                  <Settings size={18} />
                  <span>Settings</span>
                </button>
                <button
                  type="button"
                  className={`mobile-drawer-item ${activeTab === 'contact' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('contact'); setIsCustomizing(false); setIsMobileMenuOpen(false); }}
                >
                  <MessageSquare size={18} />
                  <span>Contact Us</span>
                </button>
              </div>

              <div className="mobile-drawer-footer">
                <button
                  type="button"
                  onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                  className="mobile-drawer-logout-btn"
                >
                  <LogOut size={18} />
                  <span>Log Out</span>
                </button>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', fontSize: '11px', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
                  <button 
                    type="button" 
                    onClick={() => { openLegalModal('privacy'); setIsMobileMenuOpen(false); }} 
                    style={{ background: 'none', border: 'none', color: 'inherit', padding: 0, cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Privacy Policy
                  </button>
                  <span>•</span>
                  <button 
                    type="button" 
                    onClick={() => { openLegalModal('terms'); setIsMobileMenuOpen(false); }} 
                    style={{ background: 'none', border: 'none', color: 'inherit', padding: 0, cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Terms of Service
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Global Legal & Compliance Modal (Privacy Policy & Terms of Service) */}
        <LegalModal 
          isOpen={legalModalOpen} 
          onClose={() => {
            setLegalModalOpen(false);
            if (window.location.hash.includes('privacy') || window.location.hash.includes('terms')) {
              window.location.hash = '';
            }
          }} 
          initialDoc={legalModalDoc} 
        />
      </div>
    </AuroraBackground>
  );
};

export default App;
