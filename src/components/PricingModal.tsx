import React, { useState, useEffect } from 'react';
import { Check, Zap, Sparkles, X, ShieldCheck, ArrowRight, Star, Globe, Coins, FileText, CheckCircle2 } from 'lucide-react';

export interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan?: 'free' | 'pro';
  creditsBalance?: number;
  onPurchasePack?: (packId: 'starter' | 'job_hunter' | 'power') => Promise<void>;
  onSelectPlan?: (plan: 'free' | 'pro') => Promise<void>;
  generationCount?: number;
  triggerReason?: 'insufficient_credits' | 'limit_reached' | 'model_upgrade' | 'manual' | null;
}

type CurrencyCode = 'AED' | 'USD' | 'INR' | 'EUR' | 'GBP';

interface PackPricing {
  display: string;
  priceNum: number;
}

interface CurrencyPackDetails {
  symbol: string;
  starter: PackPricing;
  job_hunter: PackPricing;
  power: PackPricing;
  label: string;
}

const CURRENCY_PACKS: Record<CurrencyCode, CurrencyPackDetails> = {
  AED: {
    symbol: 'AED',
    label: '🇦🇪 AED (د.إ)',
    starter: { display: '18 AED', priceNum: 18 },
    job_hunter: { display: '36 AED', priceNum: 36 },
    power: { display: '72 AED', priceNum: 72 }
  },
  USD: {
    symbol: '$',
    label: '🇺🇸 USD ($)',
    starter: { display: '$4.99', priceNum: 4.99 },
    job_hunter: { display: '$9.99', priceNum: 9.99 },
    power: { display: '$19.99', priceNum: 19.99 }
  },
  INR: {
    symbol: '₹',
    label: '🇮🇳 INR (₹)',
    starter: { display: '₹399', priceNum: 399 },
    job_hunter: { display: '₹799', priceNum: 799 },
    power: { display: '₹1,599', priceNum: 1599 }
  },
  EUR: {
    symbol: '€',
    label: '🇪🇺 EUR (€)',
    starter: { display: '€4.99', priceNum: 4.99 },
    job_hunter: { display: '€9.99', priceNum: 9.99 },
    power: { display: '€19.99', priceNum: 19.99 }
  },
  GBP: {
    symbol: '£',
    label: '🇬🇧 GBP (£)',
    starter: { display: '£3.99', priceNum: 3.99 },
    job_hunter: { display: '£7.99', priceNum: 7.99 },
    power: { display: '£15.99', priceNum: 15.99 }
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
  return 'AED'; // Default to UAE / AED
};

export const PricingModal: React.FC<PricingModalProps> = ({
  isOpen,
  onClose,
  currentPlan: _currentPlan,
  creditsBalance = 0,
  onPurchasePack,
  triggerReason = 'manual'
}) => {
  const [currency, setCurrency] = useState<CurrencyCode>('AED');
  const [loadingPack, setLoadingPack] = useState<'starter' | 'job_hunter' | 'power' | null>(null);

  useEffect(() => {
    setCurrency(detectDefaultCurrency());
  }, []);

  if (!isOpen) return null;

  const currentPrices = CURRENCY_PACKS[currency];

  const handleBuy = async (packId: 'starter' | 'job_hunter' | 'power') => {
    setLoadingPack(packId);
    try {
      if (onPurchasePack) {
        await onPurchasePack(packId);
      }
      onClose();
    } catch (err) {
      console.error('Purchase failed:', err);
    } finally {
      setLoadingPack(null);
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
        backgroundColor: 'rgba(5, 8, 15, 0.88)',
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
          maxWidth: '1060px',
          width: '100%',
          maxHeight: '94vh',
          overflowY: 'auto',
          padding: '2.5rem 2rem',
          borderRadius: '24px',
          border: '1px solid rgba(124, 58, 237, 0.25)',
          background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.96) 0%, rgba(10, 15, 29, 0.98) 100%)',
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
          {triggerReason === 'insufficient_credits' || triggerReason === 'limit_reached' ? (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.4rem 1rem',
                borderRadius: '999px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#f87171',
                fontSize: '0.85rem',
                fontWeight: 700,
                marginBottom: '0.75rem'
              }}
            >
              <Coins size={15} />
              <span>You have {creditsBalance} credits left. Add credits to tailor your next CV!</span>
            </div>
          ) : (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.35rem 0.9rem',
                borderRadius: '999px',
                background: 'rgba(124, 58, 237, 0.15)',
                border: '1px solid rgba(124, 58, 237, 0.3)',
                color: '#c084fc',
                fontSize: '0.82rem',
                fontWeight: 700,
                marginBottom: '0.75rem'
              }}
            >
              <Sparkles size={14} />
              <span>Pay As You Go • No Subscriptions • Zero API Keys</span>
            </div>
          )}

          <h2
            style={{
              fontSize: '2.1rem',
              fontWeight: 800,
              color: '#ffffff',
              margin: '0 0 0.5rem 0',
              letterSpacing: '-0.02em'
            }}
          >
            Job Hunter Credit Shop
          </h2>
          <p
            style={{
              fontSize: '0.95rem',
              color: 'var(--text-secondary)',
              margin: 0,
              maxWidth: '600px',
              marginInline: 'auto'
            }}
          >
            Credits never expire. 10 credits tailor a bespoke CV, calculate live ATS scores, and generate an executive cover letter.
          </p>

          {/* Controls Bar: Currency Selector */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              marginTop: '1.5rem'
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '6px 12px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                gap: '8px'
              }}
            >
              <Globe size={15} style={{ color: 'var(--accent-primary)' }} />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Currency:</span>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  padding: '2px 4px',
                  outline: 'none'
                }}
              >
                {Object.entries(CURRENCY_PACKS).map(([code, details]) => (
                  <option key={code} value={code} style={{ background: '#0f172a', color: '#fff' }}>
                    {details.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 3-Pack Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem',
            alignItems: 'stretch',
            marginBottom: '2rem'
          }}
        >
          {/* PACK 1: STARTER PACK */}
          <div
            style={{
              borderRadius: '20px',
              padding: '1.75rem',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Starter Pack
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', padding: '3px 8px', borderRadius: '6px' }}>
                  30 CREDITS
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '2.25rem', fontWeight: 800, color: '#ffffff' }}>
                  {currentPrices.starter.display}
                </span>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>one-time</span>
              </div>

              <p style={{ fontSize: '0.82rem', color: '#a78bfa', marginBottom: '1.25rem', lineHeight: 1.4, fontWeight: 600 }}>
                ~3 Bespoke Tailored CVs + Cover Letters
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  <Check size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                  <span><strong>30 Total Generation Credits</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  <Check size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                  <span>Instant Pro Tier status unlock</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  <Check size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                  <span>Live ATS Score Diagnostic & Keyword Gaps</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  <Check size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                  <span>Clean PDF & Word DOCX exports</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleBuy('starter')}
              disabled={loadingPack !== null}
              className="btn btn-secondary"
              style={{
                width: '100%',
                padding: '0.8rem',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.9rem'
              }}
            >
              {loadingPack === 'starter' ? 'Processing...' : `Get Starter (${currentPrices.starter.display})`}
            </button>
          </div>

          {/* PACK 2: JOB HUNTER PACK (RECOMMENDED / POPULAR) */}
          <div
            style={{
              borderRadius: '20px',
              padding: '1.75rem',
              background: 'linear-gradient(180deg, rgba(124, 58, 237, 0.18) 0%, rgba(99, 102, 241, 0.10) 100%)',
              border: '2px solid var(--accent-primary)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              boxShadow: '0 10px 35px -10px rgba(124, 58, 237, 0.45)'
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
                fontSize: '0.72rem',
                fontWeight: 800,
                padding: '3px 10px',
                borderRadius: '999px',
                boxShadow: '0 4px 12px rgba(236, 72, 153, 0.35)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              <Star size={11} fill="#fff" />
              <span>MOST POPULAR</span>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#c084fc', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Zap size={14} fill="#c084fc" /> Job Hunter Pack
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, background: 'rgba(124, 58, 237, 0.3)', color: '#e9d5ff', padding: '3px 8px', borderRadius: '6px' }}>
                  80 CREDITS
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '2.25rem', fontWeight: 800, color: '#ffffff' }}>
                  {currentPrices.job_hunter.display}
                </span>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>one-time</span>
              </div>

              <p style={{ fontSize: '0.82rem', color: '#e9d5ff', marginBottom: '1.25rem', lineHeight: 1.4, fontWeight: 600 }}>
                ~8 Bespoke Tailored CVs + Auto-Fixes & Covers
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  <Check size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                  <span><strong>80 Total Generation Credits</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  <Check size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                  <span><strong>1-Click ATS Auto-Fix</strong> (5 credits per fix)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  <Check size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                  <span>DOCX In-Place Exact Layout Preservation</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  <Check size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                  <span>Full Executive 3-Paragraph Cover Letters</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  <Check size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                  <span>Credits never expire</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleBuy('job_hunter')}
              disabled={loadingPack !== null}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.85rem',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '0.95rem',
                background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
                boxShadow: '0 4px 15px rgba(124, 58, 237, 0.4)',
                gap: '0.5rem'
              }}
            >
              {loadingPack === 'job_hunter' ? 'Processing...' : (
                <>
                  <span>Get 80 Credits ({currentPrices.job_hunter.display})</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>

          {/* PACK 3: POWER APPLICANT PACK */}
          <div
            style={{
              borderRadius: '20px',
              padding: '1.75rem',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Power Applicant
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '3px 8px', borderRadius: '6px' }}>
                  200 CREDITS
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '2.25rem', fontWeight: 800, color: '#ffffff' }}>
                  {currentPrices.power.display}
                </span>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>one-time</span>
              </div>

              <p style={{ fontSize: '0.82rem', color: '#34d399', marginBottom: '1.25rem', lineHeight: 1.4, fontWeight: 600 }}>
                ~20 Bespoke Tailored CVs • Best Value
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  <Check size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                  <span><strong>200 Total Generation Credits</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  <Check size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                  <span>Deep Multi-Role Career Campaigns</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  <Check size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                  <span>Priority Processing on dedicated Gemini</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  <Check size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                  <span>Unlimited DOCX & PDF clean downloads</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleBuy('power')}
              disabled={loadingPack !== null}
              className="btn btn-secondary"
              style={{
                width: '100%',
                padding: '0.8rem',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.9rem'
              }}
            >
              {loadingPack === 'power' ? 'Processing...' : `Get Power Pack (${currentPrices.power.display})`}
            </button>
          </div>
        </div>

        {/* Credit Burn Transparency Table */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '1.25rem 1.5rem',
            marginBottom: '1.5rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <FileText size={16} style={{ color: 'var(--accent-primary)' }} />
            <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#ffffff' }}>
              How Credits Work (Clear & Transparent)
            </h4>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.82rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Tailor CV + Cover Letter + ATS Score:</span>
              <strong style={{ color: '#c084fc' }}>10 Credits</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>1-Click ATS Auto-Fix:</span>
              <strong style={{ color: '#c084fc' }}>5 Credits</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>DOCX Layout Optimization:</span>
              <strong style={{ color: '#c084fc' }}>10 Credits</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>PDF & DOCX Clean Exports:</span>
              <strong style={{ color: '#10b981' }}>FREE (0 Credits)</strong>
            </div>
          </div>
        </div>

        {/* Security & Guarantee Footer */}
        <div
          style={{
            paddingTop: '1rem',
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
            <Coins size={14} style={{ color: '#818cf8' }} />
            <span>Credits Never Expire</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <CheckCircle2 size={14} style={{ color: '#34d399' }} />
            <span>Instant Credit Activation</span>
          </div>
        </div>
      </div>
    </div>
  );
};
