import React, { useState, useRef } from 'react';
import { Settings, ShieldCheck, Zap, LogOut, Camera, Sparkles, Coins, HelpCircle } from 'lucide-react';
import type { LLMConfig } from '../utils/llm';
import { AvatarCropperModal } from './AvatarCropperModal';

interface SettingsPanelProps {
  config: LLMConfig;
  onChangeConfig: (config: LLMConfig) => void;
  userProfile: { 
    email: string; 
    full_name?: string; 
    plan: 'free' | 'pro'; 
    credits_balance?: number;
    generation_count: number; 
    avatar_url?: string;
  } | null;
  onLogout: () => void;
  onUpdateAvatar?: (avatarUrl: string) => Promise<void>;
  onOpenPricingModal?: () => void;
  onOpenLegal?: (doc: 'privacy' | 'terms') => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  userProfile,
  onLogout,
  onUpdateAvatar,
  onOpenPricingModal,
  onOpenLegal
}) => {
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Avatar Upload States
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleAvatarFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input
    e.target.value = '';

    // Enforce 2MB size limit ceiling
    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('Image size exceeds 2MB limit. Please select a smaller photo.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (PNG, JPEG, WEBP).');
      return;
    }

    setErrorMsg('');
    const reader = new FileReader();
    reader.onload = () => {
      setCropImageSrc(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCropSave = async (croppedDataUrl: string) => {
    setCropImageSrc(null);
    if (!onUpdateAvatar) return;

    setUploadingAvatar(true);
    setErrorMsg('');
    try {
      await onUpdateAvatar(croppedDataUrl);
      setSuccessMsg('Profile avatar updated successfully!');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to update avatar.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const currentCredits = userProfile?.credits_balance ?? 10;
  const isPro = userProfile?.plan === 'pro';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }} className="entrance-fade">
      
      {/* Column 1: Profile & Billing */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: 'fit-content' }}>
        <div className="glass-card-header" style={{ borderBottom: '1px solid var(--card-border)', paddingBottom: '0.75rem', marginBottom: 0 }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Profile & Credits</h3>
        </div>

        {userProfile && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Profile Avatar Card */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ position: 'relative', width: '56px', height: '56px', flexShrink: 0 }}>
                {userProfile.avatar_url ? (
                  <img
                    src={userProfile.avatar_url}
                    alt={userProfile.full_name || 'Profile Avatar'}
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid var(--accent-primary)',
                      boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)'
                    }}
                  />
                ) : (
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.3rem',
                    fontWeight: 700,
                    color: '#fff'
                  }}>
                    {(userProfile.full_name || userProfile.email)[0].toUpperCase()}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  style={{
                    position: 'absolute',
                    bottom: '-2px',
                    right: '-2px',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'var(--accent-primary)',
                    border: '2px solid var(--card-bg)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                  title="Upload profile picture"
                >
                  <Camera size={12} />
                </button>
              </div>

              <div style={{ flexGrow: 1, overflow: 'hidden' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  {userProfile.full_name || 'User'}
                </h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0 0 0.35rem 0' }}>
                  {userProfile.email}
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="file"
                    ref={avatarInputRef}
                    onChange={handleAvatarFileSelect}
                    accept="image/png,image/jpeg,image/webp"
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent-primary)',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      padding: 0,
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    {uploadingAvatar ? 'Uploading...' : userProfile.avatar_url ? 'Change Avatar' : 'Upload Avatar'}
                  </button>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>• Max 2MB</span>
                </div>
              </div>
            </div>

            {/* Plan & Credits Box */}
            <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--card-border)', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Subscription Plan:</span>
                <span style={{ 
                  fontSize: '0.85rem', 
                  fontWeight: 800, 
                  color: isPro ? '#c084fc' : 'var(--text-primary)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  background: isPro ? 'rgba(192, 132, 252, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                  padding: '3px 10px',
                  borderRadius: '999px',
                  border: isPro ? '1px solid rgba(192, 132, 252, 0.3)' : '1px solid var(--card-border)'
                }}>
                  {isPro ? <Zap size={12} fill="#c084fc" /> : <ShieldCheck size={12} />}
                  {isPro ? 'PRO TIER' : 'FREE TIER'}
                </span>
              </div>

              {/* Credits Balance Display */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Coins size={18} style={{ color: currentCredits > 0 ? '#10b981' : '#f87171' }} />
                  <div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Credit Balance</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: currentCredits > 0 ? '#ffffff' : '#f87171' }}>
                      {currentCredits} Credits
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  ~{Math.floor(currentCredits / 10)} CV tailorings
                </div>
              </div>

              {onOpenPricingModal && (
                <button
                  type="button"
                  onClick={onOpenPricingModal}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    padding: '0.65rem 1rem',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    justifyContent: 'center',
                    marginTop: '0.25rem',
                    background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
                    color: '#ffffff',
                    boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)'
                  }}
                >
                  <Coins size={14} />
                  <span>Buy Credits / View Packs</span>
                </button>
              )}
            </div>

            <button 
              type="button" 
              onClick={onLogout}
              className="btn btn-secondary" 
              style={{ display: 'flex', width: '100%', padding: '0.75rem', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)', border: '1px solid rgba(186, 26, 26, 0.2)' }}
            >
              <LogOut size={16} />
              <span>Log Out of Workspace</span>
            </button>
          </div>
        )}
      </div>

      {/* Column 2: AI Engine Architecture */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="glass-card-header" style={{ borderBottom: '1px solid var(--card-border)', paddingBottom: '0.75rem', marginBottom: 0 }}>
          <div className="flex-row-gap">
            <Settings size={20} className="text-accent-primary" />
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>AI Engine & Security</h3>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Managed SaaS Badge */}
          <div style={{ 
            fontSize: '0.85rem', 
            background: 'linear-gradient(180deg, rgba(124, 58, 237, 0.08) 0%, rgba(99, 102, 241, 0.04) 100%)', 
            border: '1px solid rgba(124, 58, 237, 0.2)', 
            padding: '1rem', 
            borderRadius: 'var(--border-radius-md)', 
            color: 'var(--text-primary)', 
            display: 'flex', 
            flexDirection: 'column',
            gap: '0.5rem' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: '#c084fc' }}>
              <ShieldCheck size={18} />
              <span>Zero-Config Managed AI Engine</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Powered by high-speed Google Gemini models. You do not need to provide or manage API keys — all inference is handled securely by the cloud platform.
            </p>
          </div>

          {/* Feature Burn Breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Sparkles size={14} style={{ color: 'var(--accent-primary)' }} />
              <span>Credit Usage Guide:</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--card-border)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Full CV Tailoring + Cover Letter:</span>
              <strong style={{ color: '#c084fc' }}>10 Credits</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--card-border)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>1-Click ATS Auto-Fix:</span>
              <strong style={{ color: '#c084fc' }}>5 Credits</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--card-border)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>DOCX Layout Optimization:</span>
              <strong style={{ color: '#c084fc' }}>10 Credits</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--card-border)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Resume Upload & PDF/DOCX Exports:</span>
              <strong style={{ color: '#10b981' }}>FREE (0 Credits)</strong>
            </div>
          </div>

          {/* Need Assistance Info */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', background: 'rgba(255, 255, 255, 0.02)', padding: '0.75rem', borderRadius: '6px' }}>
            <HelpCircle size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>Need custom team plans or executive career reviews? Contact support anytime via the Help button.</span>
          </div>

          {errorMsg && (
            <div style={{ color: 'var(--danger)', fontSize: '0.8rem', background: 'rgba(186, 26, 26, 0.08)', padding: '0.75rem', borderRadius: 'var(--border-radius-md)' }}>
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div style={{ color: '#10b981', fontSize: '0.8rem', background: 'rgba(16, 185, 129, 0.08)', padding: '0.75rem', borderRadius: 'var(--border-radius-md)' }}>
              {successMsg}
            </div>
          )}

          {/* Legal & Compliance Quick Links */}
          <div style={{ marginTop: 'auto', paddingTop: '1.25rem', borderTop: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Compliance & Privacy:</span>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => onOpenLegal?.('privacy')}
                style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', textDecoration: 'underline', fontSize: 'inherit', padding: 0 }}
              >
                Privacy Policy
              </button>
              <span style={{ color: 'var(--text-muted)' }}>•</span>
              <button
                type="button"
                onClick={() => onOpenLegal?.('terms')}
                style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', textDecoration: 'underline', fontSize: 'inherit', padding: 0 }}
              >
                Terms of Service
              </button>
            </div>
          </div>
        </div>
      </div>

      {cropImageSrc && (
        <AvatarCropperModal
          imageSrc={cropImageSrc}
          onClose={() => setCropImageSrc(null)}
          onCropComplete={handleCropSave}
        />
      )}

    </div>
  );
};
