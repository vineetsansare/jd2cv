import React, { useState } from 'react';
import { Shield, X, CheckCircle2, Lock, Scale, AlertCircle } from 'lucide-react';

export type LegalDocType = 'privacy' | 'terms';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDoc?: LegalDocType;
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  onClose,
  initialDoc = 'privacy'
}) => {
  const [activeDoc, setActiveDoc] = useState<LegalDocType>(initialDoc);

  // Sync initialDoc when modal opens
  React.useEffect(() => {
    setActiveDoc(initialDoc);
  }, [initialDoc, isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="pricing-modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(5, 7, 15, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        overflowY: 'auto'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="glass-card entrance-fade"
        style={{
          width: '100%',
          maxWidth: '900px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          borderRadius: '24px',
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          boxShadow: '0 24px 64px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.08)'
        }}
      >
        {/* Modal Header */}
        <div style={{
          padding: '1.5rem 2rem',
          borderBottom: '1px solid var(--card-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)'
            }}>
              {activeDoc === 'privacy' ? <Shield size={20} /> : <Scale size={20} />}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                {activeDoc === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
              </h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                JD2CV • ToolsBy Vineet Sansare (toolsby.vineetsansare.com)
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Tabs Switch */}
            <div style={{
              display: 'flex',
              background: 'var(--bg-secondary)',
              padding: '0.25rem',
              borderRadius: '12px',
              border: '1px solid var(--card-border)'
            }}>
              <button
                type="button"
                onClick={() => setActiveDoc('privacy')}
                style={{
                  padding: '0.45rem 0.9rem',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  borderRadius: '9px',
                  border: 'none',
                  cursor: 'pointer',
                  background: activeDoc === 'privacy' ? 'var(--accent-primary)' : 'transparent',
                  color: activeDoc === 'privacy' ? '#ffffff' : 'var(--text-secondary)',
                  transition: 'all 0.2s'
                }}
              >
                Privacy Policy
              </button>
              <button
                type="button"
                onClick={() => setActiveDoc('terms')}
                style={{
                  padding: '0.45rem 0.9rem',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  borderRadius: '9px',
                  border: 'none',
                  cursor: 'pointer',
                  background: activeDoc === 'terms' ? 'var(--accent-primary)' : 'transparent',
                  color: activeDoc === 'terms' ? '#ffffff' : 'var(--text-secondary)',
                  transition: 'all 0.2s'
                }}
              >
                Terms of Service
              </button>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--card-border)',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content Body */}
        <div 
          style={{
            padding: '2rem 2.5rem',
            overflowY: 'auto',
            flexGrow: 1,
            color: 'var(--text-primary)',
            fontSize: '0.92rem',
            lineHeight: 1.7
          }}
        >
          {activeDoc === 'privacy' ? (
            /* PRIVACY POLICY CONTENT */
            <div className="legal-prose" style={{ maxWidth: '820px', margin: '0 auto' }}>
              <div style={{
                background: 'rgba(124, 58, 237, 0.08)',
                border: '1px solid rgba(124, 58, 237, 0.25)',
                borderRadius: '16px',
                padding: '1.25rem',
                marginBottom: '2rem',
                display: 'flex',
                gap: '1rem',
                alignItems: 'flex-start'
              }}>
                <Shield size={22} style={{ color: 'var(--accent-primary)', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Your Career Data is 100% Confidential & Secure
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    We do not sell your personal data. We do not use your resume content or career history to train public AI models. All database storage is encrypted at rest and in transit via Supabase.
                  </p>
                </div>
              </div>

              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '1.5rem 0 0.5rem 0', color: 'var(--text-primary)' }}>1. Preamble & Controller Identity</h3>
              <p>
                Welcome to <strong>JD2CV</strong> (accessible at <code>toolsby.vineetsansare.com/jd2cv/</code>), operated by <strong>ToolsBy Vineet Sansare</strong> ("we", "us", or "our"). 
                We are committed to protecting your privacy and ensuring transparency in how personal data is collected, processed, and protected in compliance with the <strong>General Data Protection Regulation (GDPR)</strong>, the <strong>California Consumer Privacy Act (CCPA)</strong>, and applicable international data protection standards.
              </p>
              <p>
                <strong>Data Controller Contact:</strong><br />
                ToolsBy Vineet Sansare<br />
                Contact Email: <a href="mailto:vineetsansare@gmail.com" style={{ color: 'var(--accent-primary)', textDecoration: 'underline' }}>vineetsansare@gmail.com</a><br />
                Website: <a href="https://toolsby.vineetsansare.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'underline' }}>toolsby.vineetsansare.com</a>
              </p>

              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '1.5rem 0 0.5rem 0', color: 'var(--text-primary)' }}>2. What Personal Data We Collect</h3>
              <p>We collect and process only the minimum necessary data required to deliver high-quality AI resume tailoring services:</p>
              <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
                <li style={{ marginBottom: '0.5rem' }}>
                  <strong>Account & Authentication Information:</strong> Full name, email address, avatar photo (if uploaded or linked via Google OAuth), and secure authentication identifiers handled through Supabase Auth.
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  <strong>Resume & Career Data:</strong> Uploaded CVs, background text, target job descriptions, career aspirations, skills, work experience, and generated executive CV markdown documents.
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  <strong>BYOK (Bring Your Own Key) Credentials:</strong> When you provide your own LLM API keys (Google Gemini, OpenAI, Anthropic), they are stored locally in your browser’s secure storage and transmitted directly/proxied solely for your own requests. We never inspect, share, or log your personal API keys.
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  <strong>Technical & Usage Metrics:</strong> Device/browser type, generation timestamps, ATS score metrics, and feature interaction counts (e.g. tracking your 5 free trial generations).
                </li>
              </ul>

              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '1.5rem 0 0.5rem 0', color: 'var(--text-primary)' }}>3. AI Processing & Zero Model-Training Guarantee</h3>
              <p>
                To generate customized executive resumes and ATS gap analyses, user inputs (target job description and resume excerpts) are processed via enterprise LLM APIs (including Google Gemini, OpenAI, and Anthropic).
              </p>
              <div style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--card-border)',
                borderRadius: '12px',
                padding: '1rem 1.25rem',
                margin: '1rem 0'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: '#10b981', marginBottom: '0.35rem' }}>
                  <CheckCircle2 size={16} />
                  <span>Zero Data Training Policy</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Under enterprise terms with AI API providers, your resumes, job descriptions, and generated documents are <strong>never used to train, retrain, or improve foundational AI models</strong>.
                </p>
              </div>

              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '1.5rem 0 0.5rem 0', color: 'var(--text-primary)' }}>4. Purpose & Legal Basis for Processing</h3>
              <p>We process your personal data under the following legal bases (GDPR Art. 6):</p>
              <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
                <li style={{ marginBottom: '0.4rem' }}><strong>Contractual Performance (Art. 6(1)(b)):</strong> To operate the JD2CV platform, parse resumes, execute AI optimizations, and maintain your generation history.</li>
                <li style={{ marginBottom: '0.4rem' }}><strong>Legitimate Interest (Art. 6(1)(f)):</strong> To maintain application security, prevent abuse, monitor service health, and deliver customer support.</li>
                <li style={{ marginBottom: '0.4rem' }}><strong>Consent (Art. 6(1)(a)):</strong> For optional notifications, support desk communications, and voluntary profile enrichments.</li>
              </ul>

              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '1.5rem 0 0.5rem 0', color: 'var(--text-primary)' }}>5. Data Storage, Security & Retention</h3>
              <p>
                All account data, resume history, and profile records are housed in secure, encrypted PostgreSQL databases powered by <strong>Supabase</strong> with Row-Level Security (RLS) policies enforcing that only authenticated users can access their own records.
              </p>
              <p>
                <strong>Retention Policy:</strong> Your data is retained for as long as your account remains active. You can delete individual CV history records or request permanent account erasure at any time. Accounts inactive for over 3 years are queued for automated purge.
              </p>

              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '1.5rem 0 0.5rem 0', color: 'var(--text-primary)' }}>6. Your GDPR & Privacy Rights</h3>
              <p>Under applicable international data privacy laws, you possess the following rights:</p>
              <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
                <li style={{ marginBottom: '0.35rem' }}><strong>Right of Access:</strong> Request a complete copy of all personal data held about you.</li>
                <li style={{ marginBottom: '0.35rem' }}><strong>Right to Rectification:</strong> Update or correct any inaccurate profile information.</li>
                <li style={{ marginBottom: '0.35rem' }}><strong>Right to Erasure ("Right to be Forgotten"):</strong> Request immediate permanent deletion of your account and all associated resumes.</li>
                <li style={{ marginBottom: '0.35rem' }}><strong>Right to Data Portability:</strong> Export your CVs and generated Markdown in standard open formats.</li>
                <li style={{ marginBottom: '0.35rem' }}><strong>Right to Object & Restrict Processing:</strong> Restrict or object to specific data processing activities.</li>
              </ul>
              <p>
                To exercise any of these rights, email us at <a href="mailto:vineetsansare@gmail.com" style={{ color: 'var(--accent-primary)', textDecoration: 'underline' }}>vineetsansare@gmail.com</a>. We respond to all verified requests within 30 days.
              </p>

              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '1.5rem 0 0.5rem 0', color: 'var(--text-primary)' }}>7. Cookies & Local Storage</h3>
              <p>
                We use only strictly necessary first-party cookies and <code>localStorage</code> tokens required for user authentication sessions, dark/light theme preferences, and locally saved BYOK API key configurations. We do not use third-party advertising tracking cookies.
              </p>

              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '1.5rem 0 0.5rem 0', color: 'var(--text-primary)' }}>8. Updates to This Policy</h3>
              <p>
                We reserve the right to update this Privacy Policy to reflect evolving product capabilities or regulatory changes. The latest version will always be accessible at <code>#/privacy-policy</code> with the updated effective date.
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2rem', borderTop: '1px solid var(--card-border)', paddingTop: '1rem' }}>
                Effective Date: September 2, 2026 • Version 2.4
              </p>
            </div>
          ) : (
            /* TERMS OF SERVICE CONTENT */
            <div className="legal-prose" style={{ maxWidth: '820px', margin: '0 auto' }}>
              <div style={{
                background: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                borderRadius: '16px',
                padding: '1.25rem',
                marginBottom: '2rem',
                display: 'flex',
                gap: '1rem',
                alignItems: 'flex-start'
              }}>
                <Scale size={22} style={{ color: '#3b82f6', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    General Terms and Conditions of Service
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Please read these terms carefully before utilizing the JD2CV platform. By creating an account or generating CVs, you agree to be bound by these Terms of Service.
                  </p>
                </div>
              </div>

              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '1.5rem 0 0.5rem 0', color: 'var(--text-primary)' }}>1. Service Description & Scope</h3>
              <p>
                <strong>JD2CV</strong> is an advanced AI career optimization platform provided by <strong>ToolsBy Vineet Sansare</strong> (accessible at <code>toolsby.vineetsansare.com/jd2cv/</code>). 
                The platform empowers job seekers and professionals to tailor, format, optimize, and analyze resumes against specific target job descriptions using cutting-edge artificial intelligence, ATS keyword match scoring, and executive PDF generation engines.
              </p>

              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '1.5rem 0 0.5rem 0', color: 'var(--text-primary)' }}>2. Account Registration, Security & Single-Account Policy</h3>
              <p>
                To access platform capabilities, users register an account via email or OAuth (Google, GitHub, LinkedIn). 
              </p>
              <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
                <li style={{ marginBottom: '0.4rem' }}>
                  <strong>Single Account Policy:</strong> Each individual user is permitted exactly one account. Creating automated, temporary, or multiple accounts to circumvent Free tier generation limits is strictly prohibited and results in immediate account suspension.
                </li>
                <li style={{ marginBottom: '0.4rem' }}>
                  <strong>Account Confidentiality:</strong> You are responsible for safeguarding your login credentials and for all activities that occur under your account.
                </li>
              </ul>

              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '1.5rem 0 0.5rem 0', color: 'var(--text-primary)' }}>3. Intellectual Property & Ownership of Generated CVs</h3>
              <p>
                <strong>You own 100% of your career content.</strong> All text, work history, customized bullet points, and PDF resumes generated through your account belong entirely to you. You are free to download, distribute, print, and submit your generated resumes for any personal or professional job application worldwide.
              </p>
              <p>
                The platform design, underlying algorithms, UI themes, logos, and source code are the intellectual property of ToolsBy Vineet Sansare and protected by copyright and intellectual property laws.
              </p>

              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '1.5rem 0 0.5rem 0', color: 'var(--text-primary)' }}>4. AI Content Accuracy & User Responsibility Disclaimer</h3>
              <p>
                AI-assisted outputs are generated on the basis of the job descriptions and resumes provided by the user. While our engine applies sophisticated ATS keyword alignment and executive formatting standards:
              </p>
              <div style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--card-border)',
                borderRadius: '12px',
                padding: '1rem 1.25rem',
                margin: '1rem 0'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: '#f59e0b', marginBottom: '0.35rem' }}>
                  <AlertCircle size={16} />
                  <span>Candidate Review Obligation</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Users must independently review all generated dates, skills, metrics, and experience details prior to submitting resumes to employers or recruiting portals. We do not guarantee employment, interview selection, or specific hiring outcomes.
                </p>
              </div>

              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '1.5rem 0 0.5rem 0', color: 'var(--text-primary)' }}>5. Subscription Tiers & Bring Your Own Key (BYOK)</h3>
              <p>JD2CV operates under transparent pricing tiers:</p>
              <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
                <li style={{ marginBottom: '0.4rem' }}>
                  <strong>Free Tier:</strong> Includes 5 free lifetime AI CV generations powered by system high-speed Gemini models.
                </li>
                <li style={{ marginBottom: '0.4rem' }}>
                  <strong>BYOK (Bring Your Own Key) Tier:</strong> Unlocks unlimited generations and multi-model access (OpenAI GPT-4o, Anthropic Claude 3.5 Sonnet, Gemini Pro) using your own direct API key.
                </li>
                <li style={{ marginBottom: '0.4rem' }}>
                  <strong>Pro Tier:</strong> Unlimited cloud generations, priority auto-failover, candidate photo avatars, executive formatting presets, and dedicated support.
                </li>
              </ul>

              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '1.5rem 0 0.5rem 0', color: 'var(--text-primary)' }}>6. Acceptable Use & Code of Conduct</h3>
              <p>Users agree NOT to:</p>
              <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
                <li style={{ marginBottom: '0.35rem' }}>Use automated scripts, bots, or scrapers to overload or attack the platform infrastructure.</li>
                <li style={{ marginBottom: '0.35rem' }}>Upload unlawful, fraudulent, defamatory, or infringing content.</li>
                <li style={{ marginBottom: '0.35rem' }}>Attempt to reverse engineer, decompile, or breach security perimeters of the service.</li>
              </ul>

              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '1.5rem 0 0.5rem 0', color: 'var(--text-primary)' }}>7. Limitation of Liability & Warranty</h3>
              <p>
                The services are provided on an "as is" and "as available" basis without warranties of any kind, whether express or implied. To the maximum extent permitted by applicable law, ToolsBy Vineet Sansare shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use or inability to use the platform.
              </p>

              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '1.5rem 0 0.5rem 0', color: 'var(--text-primary)' }}>8. Termination & Modification of Terms</h3>
              <p>
                We reserve the right to suspend or terminate accounts that violate these terms. We may modify these terms at any time by publishing updated versions on the website. Continued use of JD2CV constitutes acceptance of any revisions.
              </p>

              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '1.5rem 0 0.5rem 0', color: 'var(--text-primary)' }}>9. Governing Law & Contact</h3>
              <p>
                These Terms of Service are governed by international commercial standards and applicable statutory consumer protection frameworks. 
              </p>
              <p>
                For questions regarding these Terms, please reach out to us at: <a href="mailto:vineetsansare@gmail.com" style={{ color: 'var(--accent-primary)', textDecoration: 'underline' }}>vineetsansare@gmail.com</a>.
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2rem', borderTop: '1px solid var(--card-border)', paddingTop: '1rem' }}>
                Effective Date: September 2, 2026 • Version 2.4
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '1.25rem 2rem',
          borderTop: '1px solid var(--card-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <Lock size={14} style={{ color: 'var(--accent-primary)' }} />
            <span>GDPR & CCPA Compliant • 256-Bit SSL Encryption</span>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={onClose}
            style={{ width: 'auto', padding: '0.5rem 1.5rem', fontSize: '0.85rem' }}
          >
            I Understand & Accept
          </button>
        </div>
      </div>
    </div>
  );
};
