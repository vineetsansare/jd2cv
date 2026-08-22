import React, { useState, useEffect } from 'react';
import { Check, Zap, Key, Sparkles, X, ShieldCheck, ArrowRight, Star, Globe } from 'lucide-react';

export interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: 'free' | 'byok' | 'pro';
  onSelectPlan: (plan: 'free' | 'byok' | 'pro') => Promise<void>;
  generationCount?: number;
  triggerReason?: 'limit_reached' | 'model_upgrade' | 'manual' | null;
}

type CurrencyCode = 'AED' | 'USD' | 'INR' | 'EUR' | 'GBP';

interface CurrencyPricing {
  symbol: string;
  monthlyPrice: string;
  weeklyPrice: string;
  monthlyDisplay: string;
  weeklyDisplay: string;
  label: string;
  tagline: string;
}

const CURRENCIES: Record<CurrencyCode, CurrencyPricing> = {
  AED: {
    symbol: 'AED',
    monthlyPrice: '29',
    weeklyPrice: '15',
    monthlyDisplay: '29 AED',
    weeklyDisplay: '15 AED',
    label: '🇦🇪 AED (د.إ)',
    tagline: 'Less than the price of a single coffee / meal'
  },
  USD: {
    symbol: '$',
    monthlyPrice: '7.99',
    weeklyPrice: '3.99',
    monthlyDisplay: '$7.99',
    weeklyDisplay: '$3.99',
    label: '🇺🇸 USD ($)',
    tagline: 'Less than the price of a single coffee / meal'
  },
  INR: {
    symbol: '₹',
    monthlyPrice: '599',
    weeklyPrice: '299',
    monthlyDisplay: '₹599',
    weeklyDisplay: '₹299',
    label: '🇮🇳 INR (₹)',
    tagline: 'High-speed AI tailoring for top career opportunities'
  },
  EUR: {
    symbol: '€',
    monthlyPrice: '7.99',
    weeklyPrice: '3.99',
    monthlyDisplay: '€7.99',
    weeklyDisplay: '€3.99',
    label: '🇪🇺 EUR (€)',
    tagline: 'Less than the price of a single coffee / meal'
  },
  GBP: {
    symbol: '£',
    monthlyPrice: '6.99',
    weeklyPrice: '3.49',
    monthlyDisplay: '£6.99',
    weeklyDisplay: '£3.49',
    label: '🇬🇧 GBP (£)',
    tagline: 'Less than the price of a single coffee / meal'
  }
};

const detectDefaultCurrency = (): CurrencyCode => {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (tz.includes('Dubai') || tz.includes('Muscat') || tz.includes('Riyadh') || tz.includes('Qatar')) {
      return 'AED';
    }
    if (tz.includes('Calcutta') || tz.includes('Kolkata') || tz.includes('India')) {
      return 'INR';
    }
    if (tz.includes('London')) {
      return 'GBP';
    }
    if (tz.includes('Berlin') || tz.includes('Paris') || tz.includes('Madrid') || tz.includes('Rome') || tz.includes('Amsterdam')) {
      return 'EUR';
    }
  } catch (e) {
    // fallback
  }
  return 'AED'; // Default to UAE / AED as primary target market!
};

export const PricingModal: React.FC<PricingModalProps> = ({
  isOpen,
  onClose,
  currentPlan,
  onSelectPlan,
  generationCount = 0,
  triggerReason = 'manual'
}) => {
  const [billingCycle, setBillingCycle] = useState<'weekly' | 'monthly'>('monthly');
  const [currency, setCurrency] = useState<CurrencyCode>('AED');
  const [loadingPlan, setLoadingPlan] = useState<'free' | 'byok' | 'pro' | null>(null);

  useEffect(() => {
    setCurrency(detectDefaultCurrency());
  }, []);

  if (!isOpen) return null;

  const currentCur = CURRENCIES[currency];

  const handlePlanClick = async (plan: 'free' | 'byok' | 'pro') => {
    if (plan === currentPlan) {
      onClose();
      return;
    }
    setLoadingPlan(plan);
    try {
      await onSelectPlan(plan);
      onClose();
    } catch (err) {
      console.error('Plan selection failed:', err);
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(5, 8, 15, 0.85)',
        backdropFilter: 'blur(12px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        overflowY: 'auto'
      }}
      onClick={onClose}
    >
      <div
        className="glass-card"
        style={{
          position: 'relative',
          maxWidth: '1040px',
          width: '100%',
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: '2.5rem 2rem',
          borderRadius: '24px',
          border: '1px solid rgba(124, 58, 237, 0.25)',
          background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(10, 15, 29, 0.98) 100%)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 40px rgba(124, 58, 237, 0.15)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          {triggerReason === 'limit_reached' && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.35rem 0.85rem',
                borderRadius: '999px',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                fontSize: '0.85rem',
                fontWeight: 600,
                marginBottom: '0.75rem'
              }}
            >
              <Sparkles size={14} />
              <span>You've used all {generationCount} free generations!</span>
            </div>
          )}

          <h2
            style={{
              fontSize: '2rem',
              fontWeight: 800,
              color: '#ffffff',
              margin: '0 0 0.5rem 0',
              letterSpacing: '-0.02em'
            }}
          >
            Upgrade Your Job Search Power
          </h2>
          <p
            style={{
              fontSize: '1rem',
              color: 'var(--text-secondary)',
              margin: 0,
              maxWidth: '560px',
              marginInline: 'auto'
            }}
          >
            Tailor high-converting, ATS-beating resumes and cover letters in seconds.
          </p>

          {/* Controls Bar: Currency Selector + Billing Cycle Toggle */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              marginTop: '1.5rem'
            }}
          >
            {/* Currency Selector */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '4px 8px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                gap: '6px'
              }}
            >
              <Globe size={14} style={{ color: 'var(--text-secondary)' }} />
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  padding: '2px 4px',
                  outline: 'none'
                }}
              >
                {Object.entries(CURRENCIES).map(([code, details]) => (
                  <option key={code} value={code} style={{ background: '#0f172a', color: '#fff' }}>
                    {details.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Billing Cycle Toggle */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '4px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                gap: '4px'
              }}
            >
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                style={{
                  padding: '0.45rem 1.15rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: billingCycle === 'monthly' ? 'var(--accent-primary)' : 'transparent',
                  color: billingCycle === 'monthly' ? '#ffffff' : 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Monthly Pro ({currentCur.monthlyDisplay}/mo)
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('weekly')}
                style={{
                  padding: '0.45rem 1.15rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: billingCycle === 'weekly' ? 'var(--accent-primary)' : 'transparent',
                  color: billingCycle === 'weekly' ? '#ffffff' : 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <span>Weekly Sprint Pass ({currentCur.weeklyDisplay}/wk)</span>
                <span
                  style={{
                    fontSize: '0.7rem',
                    background: 'rgba(16, 185, 129, 0.2)',
                    color: '#34d399',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontWeight: 700
                  }}
                >
                  Sprint
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* 3-Tier Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem',
            alignItems: 'stretch'
          }}
        >
          {/* TIER 1: FREE */}
          <div
            style={{
              borderRadius: '20px',
              padding: '1.75rem',
              background: 'rgba(255, 255, 255, 0.03)',
              border: currentPlan === 'free' ? '2px solid var(--accent-primary)' : '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Free Trial
                </span>
                {currentPlan === 'free' && (
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', padding: '2px 8px', borderRadius: '6px' }}>
                    CURRENT
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '2.25rem', fontWeight: 800, color: '#ffffff' }}>0 {currentCur.symbol}</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>forever</span>
              </div>

              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                Test drive AI CV tailoring and experience live ATS score optimization.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  <Check size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                  <span><strong>3 Free</strong> CV Tailorings</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  <Check size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                  <span>1 Saved Baseline CV Profile</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  <Check size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                  <span>Live ATS Score Diagnostic</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  <Check size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                  <span>Google Gemini 2.5 Flash Engine</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  <Check size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                  <span>Clean ATS-Friendly PDF Export</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handlePlanClick('free')}
              disabled={loadingPlan !== null}
              className="btn btn-secondary"
              style={{
                width: '100%',
                padding: '0.75rem',
                justifyContent: 'center',
                fontWeight: 600,
                fontSize: '0.9rem',
                opacity: currentPlan === 'free' ? 0.7 : 1
              }}
            >
              {currentPlan === 'free' ? 'Active Plan' : 'Select Free'}
            </button>
          </div>

          {/* TIER 2: BYOK (BRING YOUR OWN KEY) */}
          <div
            style={{
              borderRadius: '20px',
              padding: '1.75rem',
              background: 'rgba(255, 255, 255, 0.04)',
              border: currentPlan === 'byok' ? '2px solid var(--accent-primary)' : '1px solid rgba(255, 255, 255, 0.12)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Key size={14} /> BYOK (Developer)
                </span>
                {currentPlan === 'byok' && (
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, background: 'rgba(167, 139, 250, 0.2)', color: '#c4b5fd', padding: '2px 8px', borderRadius: '6px' }}>
                    CURRENT
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '2.25rem', fontWeight: 800, color: '#ffffff' }}>0 {currentCur.symbol}</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>/ month (Uses your keys)</span>
              </div>

              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                Bring your own OpenAI, Anthropic, or Gemini API keys for unlimited, cost-free generations.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  <Check size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                  <span><strong>Unlimited</strong> Generations (Direct API)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  <Check size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                  <span>Up to 5 Saved CV Profiles</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  <Check size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                  <span>Unlock GPT-4o, Claude 3.5 Sonnet, Gemini Pro</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  <Check size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                  <span>Encrypted Client-Side Key Vault</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  <Check size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                  <span>Full Auto-Fix & Cover Letter support</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handlePlanClick('byok')}
              disabled={loadingPlan !== null}
              className="btn btn-secondary"
              style={{
                width: '100%',
                padding: '0.75rem',
                justifyContent: 'center',
                fontWeight: 600,
                fontSize: '0.9rem',
                borderColor: 'rgba(167, 139, 250, 0.4)',
                color: '#c4b5fd'
              }}
            >
              {loadingPlan === 'byok' ? 'Switching...' : currentPlan === 'byok' ? 'Active Plan' : 'Switch to BYOK'}
            </button>
          </div>

          {/* TIER 3: PRO (POPULAR / EXECUTIVE) */}
          <div
            style={{
              borderRadius: '20px',
              padding: '1.75rem',
              background: 'linear-gradient(180deg, rgba(124, 58, 237, 0.15) 0%, rgba(99, 102, 241, 0.08) 100%)',
              border: '2px solid var(--accent-primary)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              boxShadow: '0 10px 30px -10px rgba(124, 58, 237, 0.4)'
            }}
          >
            {/* Top Badge */}
            <div
              style={{
                position: 'absolute',
                top: '-12px',
                right: '24px',
                background: 'linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)',
                color: '#ffffff',
                fontSize: '0.75rem',
                fontWeight: 800,
                padding: '3px 10px',
                borderRadius: '999px',
                boxShadow: '0 4px 12px rgba(236, 72, 153, 0.35)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              <Star size={12} fill="#fff" />
              <span>POPULAR</span>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#c084fc', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Zap size={14} fill="#c084fc" /> Pro Executive
                </span>
                {currentPlan === 'pro' && (
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '2px 8px', borderRadius: '6px' }}>
                    CURRENT
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', marginBottom: '0.25rem' }}>
                <span style={{ fontSize: '2.25rem', fontWeight: 800, color: '#ffffff' }}>
                  {billingCycle === 'weekly' ? currentCur.weeklyDisplay : currentCur.monthlyDisplay}
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {billingCycle === 'weekly' ? '/ week (Cancel anytime)' : '/ month (Cancel anytime)'}
                </span>
              </div>

              <p style={{ fontSize: '0.78rem', color: '#a78bfa', fontWeight: 600, margin: '0 0 1.25rem 0' }}>
                ✨ {currentCur.tagline}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  <Check size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                  <span><strong>Unlimited</strong> AI CV Generations</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  <Check size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                  <span><strong>Unlimited</strong> Saved CV Profiles</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  <Check size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                  <span><strong>Zero API Keys Required</strong> (Hosted Cloud Proxy)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  <Check size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                  <span>Instant 3-Paragraph Cover Letters</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  <Check size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                  <span>Priority 1-Click ATS Auto-Fix</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  <Check size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                  <span>Multi-Page & 1-Page PDF Scaler</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handlePlanClick('pro')}
              disabled={loadingPlan !== null}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.85rem',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.95rem',
                background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
                boxShadow: '0 4px 15px rgba(124, 58, 237, 0.4)',
                gap: '0.5rem'
              }}
            >
              {loadingPlan === 'pro' ? 'Upgrading...' : currentPlan === 'pro' ? 'Active Plan' : (
                <>
                  <span>Upgrade to Pro</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Security & Guarantee Footer */}
        <div
          style={{
            marginTop: '2rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '1.5rem',
            fontSize: '0.8rem',
            color: 'var(--text-secondary)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <ShieldCheck size={14} style={{ color: '#10b981' }} />
            <span>Encrypted & Privacy-First</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Zap size={14} style={{ color: '#818cf8' }} />
            <span>Instant Plan Activation</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Check size={14} style={{ color: '#34d399' }} />
            <span>Cancel Anytime in 1 Click</span>
          </div>
        </div>
      </div>
    </div>
  );
};
