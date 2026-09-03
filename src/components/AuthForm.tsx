import React, { useState } from 'react';
import { supabase } from '../utils/supabase';
import { Mail, Lock, User, Sparkles, AlertCircle, ArrowRight, CheckCircle2, ShieldCheck, Zap, Sun, Moon } from 'lucide-react';
import { AuroraBackground } from './ui/AuroraBackground';
import { LiquidCard } from './ui/LiquidCard';
import { CursorTrailProvider } from './ui/CursorTrailProvider';

interface AuthFormProps {
  onSuccess: () => void;
  theme?: 'light' | 'dark';
  onThemeToggle?: () => void;
  onOpenLegal?: (doc: 'privacy' | 'terms') => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ onSuccess, theme = 'dark', onThemeToggle, onOpenLegal }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 3D Notebook Page Flip state
  const [flipState, setFlipState] = useState<'idle' | 'out' | 'in'>('idle');

  const triggerModeSwitch = (switchAction: () => void) => {
    setFlipState('out');
    setTimeout(() => {
      switchAction();
      setError(null);
      setSuccess(null);
      setFlipState('in');
      setTimeout(() => setFlipState('idle'), 350);
    }, 180);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isForgotPassword) {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.href
        });
        if (resetError) throw resetError;
        setSuccess('Password recovery email sent! Please check your inbox.');
      } else if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });
        if (signUpError) throw signUpError;
        if (data.user && data.session === null) {
          setSuccess('Verification email sent! Please check your inbox to confirm your account.');
        } else if (data.session) {
          onSuccess();
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        onSuccess();
      }
    } catch (err: any) {
      console.error('Auth error detail:', err);
      let errMsg = 'Authentication failed';
      if (err && typeof err === 'object') {
        errMsg = err.message || JSON.stringify(err);
      } else if (typeof err === 'string') {
        errMsg = err;
      }
      
      if (errMsg === '{}') {
        errMsg = 'Failed to connect to Supabase. Please ensure your Supabase URL and Anon Key are correct.';
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'github' | 'linkedin_oidc') => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const cleanRedirectUrl = `${window.location.origin}${window.location.pathname}`.replace(/\/+$/, '');
      const { error: socialError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: cleanRedirectUrl
        }
      });
      if (socialError) throw socialError;
    } catch (err: any) {
      setError(err.message || 'Social login failed');
      setLoading(false);
    }
  };

  const flipClass = flipState === 'out' ? 'flip-out' : flipState === 'in' ? 'flip-in' : '';

  return (
    <CursorTrailProvider>
      <AuroraBackground intensity="vibrant">
        {/* Top Right Dark/Light Theme Toggle */}
        {onThemeToggle && (
          <button 
            type="button" 
            onClick={onThemeToggle}
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            style={{ 
              position: 'fixed',
              top: '1.25rem',
              right: '1.25rem',
              zIndex: 9999,
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)'
            }}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        )}

        <div className="auth-wrapper" style={{
          display: 'flex',
          minHeight: '100vh',
          width: '100vw',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '3.5rem 1.25rem 4.5rem 1.25rem',
          boxSizing: 'border-box',
          overflowY: 'auto'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            maxWidth: '1040px',
            width: '100%',
            gap: '2rem',
            alignItems: 'flex-start'
          }} className="auth-hero-split">
            {/* Left Showcase Panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '1rem' }} className="entrance-fade auth-showcase-panel">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }} className="stagger-1">
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  boxShadow: '0 8px 20px -4px rgba(124, 58, 237, 0.5)'
                }}>
                  <Sparkles size={22} />
                </div>
                <div>
                  <h1 style={{ fontSize: '1.4rem', fontWeight: 900, margin: 0, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>JD2CV</h1>
                  <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', margin: 0, color: 'var(--text-muted)', fontWeight: 700 }}>Career Workspace</p>
                </div>
              </div>

              <div className="stagger-2">
                <h2 style={{ fontSize: '2.4rem', fontWeight: 800, margin: '0 0 0.75rem 0', lineHeight: 1.15, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
                  Elevate your career with AI-powered ATS precision.
                </h2>
                <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
                  Transform your experience bullet points to match target job descriptions seamlessly.
                </p>
              </div>

              {/* Feature Highlights Card Deck with Slow Vertical Float Drift */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} className="stagger-3">
                <div className="glass-card float-drift-card" style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '1rem 1.25rem', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '16px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(124, 58, 237, 0.15)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Zap size={18} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>Instant Context Matching</h4>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Extract relevant evidence across multiple uploaded baseline resumes.</p>
                  </div>
                </div>

                <div className="glass-card float-drift-card-delayed" style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '1rem 1.25rem', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '16px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(16,185,129,0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>ATS Score Diagnostics</h4>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Live keyword gap analytics and automated one-click fix recommendations.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Liquid Glass Form Card with 3D Notebook Flip */}
            <div className="perspective-container auth-form-column">
              <LiquidCard
                variant="glass"
                padding="lg"
                hoverEffect={false}
                className={`notebook-card-flip ${flipClass} ${error ? 'error-shake' : ''}`}
                style={{ maxWidth: '440px', width: '100%', margin: '0 auto' }}
              >
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                  <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>
                    {isForgotPassword ? 'Reset Password' : isSignUp ? 'Create Your Account' : 'Welcome Back'}
                  </h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                    {isForgotPassword 
                      ? 'Enter your email to receive a recovery link' 
                      : isSignUp ? 'Join the future of ATS customization' : 'Sign in to access your Career Workspace'}
                  </p>
                </div>

            {error && (
              <div style={{
                display: 'flex',
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: 'var(--border-radius-md)',
                color: '#f87171',
                fontSize: '0.85rem',
                marginBottom: '1.25rem',
                lineHeight: '1.4'
              }}>
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div style={{
                display: 'flex',
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: 'var(--border-radius-md)',
                color: '#10b981',
                fontSize: '0.85rem',
                marginBottom: '1.25rem',
                lineHeight: '1.4'
              }}>
                <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {!isForgotPassword && isSignUp && (
                <div className="form-group">
                  <label htmlFor="fullName">Full Name</label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      id="fullName"
                      type="text"
                      required
                      placeholder="Vineet Sansare"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      style={{ paddingLeft: '2.5rem' }}
                    />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    id="email"
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ paddingLeft: '2.5rem' }}
                  />
                </div>
              </div>

              {!isForgotPassword && (
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <label htmlFor="password" style={{ margin: 0 }}>Password</label>
                    {!isSignUp && (
                      <button
                        type="button"
                        onClick={() => triggerModeSwitch(() => setIsForgotPassword(true))}
                        style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.8rem', padding: 0, cursor: 'pointer' }}
                      >
                        Forgot Password?
                      </button>
                    )}
                  </div>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      id="password"
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{ paddingLeft: '2.5rem' }}
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-glowing"
                disabled={loading}
                style={{ width: '100%', padding: '0.85rem', fontSize: '0.95rem', fontWeight: 700, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}
              >
                <span>{loading ? 'Processing...' : isForgotPassword ? 'Send Reset Link' : isSignUp ? 'Sign Up' : 'Sign In'}</span>
                {!loading && <ArrowRight size={16} />}
              </button>
            </form>

            {isForgotPassword ? (
              <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem' }}>
                <button
                  type="button"
                  onClick={() => triggerModeSwitch(() => setIsForgotPassword(false))}
                  style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontWeight: 600, padding: 0, cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0', width: '100%' }}>
                  <div style={{ flexGrow: 1, height: '1px', background: 'var(--card-border)' }} />
                  <span style={{ padding: '0 0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>or continue with</span>
                  <div style={{ flexGrow: 1, height: '1px', background: 'var(--card-border)' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <button
                    type="button"
                    className="btn"
                    disabled={loading}
                    onClick={() => handleSocialLogin('google')}
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center', 
                      gap: '0.65rem', 
                      background: 'var(--bg-secondary)', 
                      border: '1px solid var(--card-border)', 
                      color: 'var(--text-primary)',
                      width: '100%',
                      padding: '0.8rem 1rem',
                      fontWeight: 600
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.572 0-6.47-2.898-6.47-6.47s2.898-6.47 6.47-6.47c1.558 0 2.977.56 4.1 1.488l3.09-3.09C19.33 2.14 16.02 1 12.24 1 5.67 1 .35 6.32.35 12.89s5.32 11.89 11.89 11.89c7.22 0 11.89-5.08 11.89-12.09 0-.82-.08-1.61-.21-2.4H12.24z"/>
                    </svg>
                    <span>Continue with Google</span>
                  </button>
                </div>

                <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                  </span>
                  <button
                    type="button"
                    onClick={() => triggerModeSwitch(() => setIsSignUp(!isSignUp))}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontWeight: 600, padding: 0, cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    {isSignUp ? 'Sign In' : 'Sign Up'}
                  </button>
                </div>

                <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  By continuing, you agree to JD2CV's{' '}
                  <button
                    type="button"
                    onClick={() => onOpenLegal?.('terms')}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', padding: 0, cursor: 'pointer', textDecoration: 'underline', fontSize: 'inherit' }}
                  >
                    Terms of Service
                  </button>
                  {' and '}
                  <button
                    type="button"
                    onClick={() => onOpenLegal?.('privacy')}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', padding: 0, cursor: 'pointer', textDecoration: 'underline', fontSize: 'inherit' }}
                  >
                    Privacy Policy
                  </button>
                </div>
              </>
            )}
          </LiquidCard>
        </div>
      </div>
    </div>
    </AuroraBackground>
    </CursorTrailProvider>
  );
};
