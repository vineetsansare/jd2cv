import React, { useState, useEffect, useRef } from 'react';
import { Settings, ShieldCheck, Zap, LogOut, Camera, Sparkles, Coins, HelpCircle, Key, Copy, Trash2, Plus, Bot, Check, RefreshCw } from 'lucide-react';
import type { LLMConfig, AgentTokenRecord } from '../utils/llm';
import { getAgentTokens, createAgentToken, revokeAgentToken } from '../utils/llm';
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

  // Agent Personal Access Tokens State (Claude MCP & ChatGPT)
  const [tokens, setTokens] = useState<AgentTokenRecord[]>([]);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [newTokenName, setNewTokenName] = useState('');
  const [creatingToken, setCreatingToken] = useState(false);
  const [newlyCreatedToken, setNewlyCreatedToken] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedConfig, setCopiedConfig] = useState(false);
  const [tokenError, setTokenError] = useState('');

  useEffect(() => {
    fetchTokens();
  }, []);

  const fetchTokens = async () => {
    setLoadingTokens(true);
    try {
      const list = await getAgentTokens();
      setTokens(list);
    } catch (e: any) {
      console.error('Failed to load agent tokens:', e);
    } finally {
      setLoadingTokens(false);
    }
  };

  const handleCreateToken = async () => {
    if (!newTokenName.trim()) {
      setTokenError('Please enter a name for the key (e.g., Claude Desktop)');
      return;
    }
    setCreatingToken(true);
    setTokenError('');
    try {
      const result = await createAgentToken(newTokenName.trim());
      setNewlyCreatedToken(result.token);
      setNewTokenName('');
      await fetchTokens();
    } catch (e: any) {
      setTokenError(e.message || 'Failed to create token');
    } finally {
      setCreatingToken(false);
    }
  };

  const handleRevokeToken = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this agent key? Any connected AI agent (Claude Desktop, ChatGPT) will immediately lose access.')) {
      return;
    }
    try {
      await revokeAgentToken(id);
      await fetchTokens();
    } catch (e: any) {
      alert(e.message || 'Failed to revoke token');
    }
  };

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

      {/* Column 3: AI Connectors & Agent Keys (Full Width Card) */}
      <div className="glass-card" style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="glass-card-header" style={{ borderBottom: '1px solid var(--card-border)', paddingBottom: '0.75rem', marginBottom: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="flex-row-gap">
            <Bot size={20} className="text-accent-primary" />
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>AI Connectors & Agent Keys (Claude & ChatGPT)</h3>
          </div>
          <button 
            type="button" 
            onClick={fetchTokens} 
            disabled={loadingTokens}
            title="Refresh keys"
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}
          >
            <RefreshCw size={14} className={loadingTokens ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          Personal Access Tokens allow external AI assistants like <strong>Claude Desktop (MCP)</strong> and <strong>ChatGPT Custom GPTs</strong> to securely inspect your base resume and generate ATS-tailored CVs directly on your behalf.
        </p>

        {/* Generate Token Section */}
        <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--card-border)' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Key size={15} className="text-accent-primary" />
            <span>Create New Personal Access Token</span>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="e.g. Claude Desktop, Work Laptop"
              value={newTokenName}
              onChange={(e) => setNewTokenName(e.target.value)}
              style={{
                flex: '1 1 240px',
                padding: '0.65rem 0.9rem',
                borderRadius: '6px',
                border: '1px solid var(--card-border)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem'
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateToken()}
            />
            <button
              type="button"
              onClick={handleCreateToken}
              disabled={creatingToken}
              className="btn btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.65rem 1.25rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: creatingToken ? 'not-allowed' : 'pointer'
              }}
            >
              <Plus size={16} />
              <span>{creatingToken ? 'Generating...' : 'Generate Key'}</span>
            </button>
          </div>

          {tokenError && (
            <div style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
              {tokenError}
            </div>
          )}
        </div>

        {/* Newly Created Token Banner (One-Time Reveal) */}
        {newlyCreatedToken && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(124, 58, 237, 0.1) 100%)',
            border: '1px solid #10b981',
            borderRadius: 'var(--border-radius-md)',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, color: '#10b981', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Check size={16} /> Key Generated Successfully!
              </span>
              <button
                type="button"
                onClick={() => setNewlyCreatedToken(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem' }}
              >
                Dismiss
              </button>
            </div>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Make sure to copy this key now. For your security (GDPR Article 32), we only store a cryptographic SHA-256 hash at rest, so you will never be able to view this plaintext token again.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#0a0a0f', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <code style={{ flex: 1, fontFamily: 'monospace', fontSize: '0.85rem', color: '#38bdf8', overflowX: 'auto' }}>
                {newlyCreatedToken}
              </code>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(newlyCreatedToken);
                  setCopiedToken(true);
                  setTimeout(() => setCopiedToken(false), 2000);
                }}
                className="btn btn-secondary"
                style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                {copiedToken ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                <span>{copiedToken ? 'Copied!' : 'Copy Key'}</span>
              </button>
            </div>

            {/* Quick Claude Desktop JSON helper */}
            <div style={{ marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Claude Desktop Config (~/Library/Application Support/Claude/claude_desktop_config.json):
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const snippet = JSON.stringify({
                      mcpServers: {
                        jd2cv: {
                          command: "node",
                          args: [
                            "/Volumes/Mac HD2/Personal/Projects/Antigravity-Projects/CV-builder/mcp-server/dist/index.js"
                          ],
                          env: {
                            JD2CV_API_KEY: newlyCreatedToken,
                            JD2CV_API_URL: "http://localhost:3001"
                          }
                        }
                      }
                    }, null, 2);
                    navigator.clipboard.writeText(snippet);
                    setCopiedConfig(true);
                    setTimeout(() => setCopiedConfig(false), 2000);
                  }}
                  style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  {copiedConfig ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedConfig ? 'Snippet Copied!' : 'Copy Claude Config JSON'}</span>
                </button>
              </div>
              <pre style={{
                background: 'rgba(0, 0, 0, 0.4)',
                padding: '0.75rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                margin: 0,
                color: '#e2e8f0',
                overflowX: 'auto'
              }}>
                {`{
  "mcpServers": {
    "jd2cv": {
      "command": "node",
      "args": [
        "/Volumes/Mac HD2/Personal/Projects/Antigravity-Projects/CV-builder/mcp-server/dist/index.js"
      ],
      "env": {
        "JD2CV_API_KEY": "${newlyCreatedToken}",
        "JD2CV_API_URL": "http://localhost:3001"
      }
    }
  }
}`}
              </pre>
            </div>
          </div>
        )}

        {/* Existing Active Keys List */}
        <div>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.75rem 0' }}>
            Active Agent Keys ({tokens.length})
          </h4>

          {loadingTokens && tokens.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading active keys...</div>
          ) : tokens.length === 0 ? (
            <div style={{
              padding: '1.5rem',
              textAlign: 'center',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '8px',
              border: '1px dashed var(--card-border)',
              color: 'var(--text-muted)',
              fontSize: '0.85rem'
            }}>
              No active agent keys found. Generate a key above to connect Claude Desktop or ChatGPT!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {tokens.map((token) => (
                <div
                  key={token.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    background: 'var(--bg-secondary)',
                    borderRadius: '8px',
                    border: '1px solid var(--card-border)'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                      {token.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Created: {new Date(token.created_at).toLocaleDateString()} •{' '}
                      {token.last_used_at ? `Last used: ${new Date(token.last_used_at).toLocaleDateString()}` : 'Never used'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRevokeToken(token.id)}
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#f87171',
                      padding: '0.4rem 0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    <Trash2 size={13} />
                    <span>Revoke</span>
                  </button>
                </div>
              ))}
            </div>
          )}
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
