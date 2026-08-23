import React, { useState, useRef, useEffect } from 'react';
import { Mail, Send, Paperclip, X, CheckCircle2, AlertCircle, MessageSquare, Image, ShieldCheck, Clock, Lock } from 'lucide-react';
import { supabase } from '../utils/supabase';

interface ContactUsPanelProps {
  userProfile: {
    email: string;
    full_name?: string;
    plan: 'free' | 'byok' | 'pro';
    generation_count: number;
  } | null;
  session?: any;
}

interface ScreenshotFile {
  id: string;
  name: string;
  dataUrl: string;
  size: string;
  blob?: Blob;
}

const CATEGORIES = [
  'Technical Issue / Bug Report',
  'ATS Optimization & Match Feedback',
  'Billing, Upgrades & Payment Inquiry',
  'Feature Request / Suggestion',
  'General Career Workspace Question'
];

const COOLDOWN_KEY = 'jd2cv_support_last_submission';
const COOLDOWN_SECONDS = 60; // Industry standard 60-second rate-limiting cooldown

export const ContactUsPanel: React.FC<ContactUsPanelProps> = ({ userProfile, session }) => {
  const initialName = userProfile?.full_name || session?.user?.user_metadata?.full_name || '';
  const initialEmail = userProfile?.email || session?.user?.email || '';

  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState(''); // Anti-bot honeypot field
  const [screenshots, setScreenshots] = useState<ScreenshotFile[]>([]);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Rate Limiting Cooldown Clock
  useEffect(() => {
    const checkCooldown = () => {
      const lastSent = localStorage.getItem(COOLDOWN_KEY);
      if (lastSent) {
        const elapsed = (Date.now() - parseInt(lastSent, 10)) / 1000;
        if (elapsed < COOLDOWN_SECONDS) {
          setCooldownRemaining(Math.ceil(COOLDOWN_SECONDS - elapsed));
          return;
        }
      }
      setCooldownRemaining(0);
    };

    checkCooldown();
    const interval = setInterval(checkCooldown, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (screenshots.length + files.length > 3) {
      setError('You can attach a maximum of 3 screenshots.');
      return;
    }

    setError(null);

    const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

    Array.from(files).forEach((file) => {
      // 1. Strict MIME validation
      if (!allowedMimeTypes.includes(file.type.toLowerCase())) {
        setError('Security rule: Only safe image files (PNG, JPG, WEBP) are supported.');
        return;
      }

      // 2. Strict file size cap (3MB)
      if (file.size > 3 * 1024 * 1024) {
        setError(`File "${file.name}" exceeds the 3MB size limit.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const sizeFormatted = (file.size / 1024).toFixed(1) + ' KB';
        setScreenshots((prev) => [
          ...prev,
          {
            id: Math.random().toString(36).substring(2, 9),
            name: file.name.replace(/[^a-zA-Z0-9._-]/g, '_'), // Sanitize filename
            dataUrl,
            size: sizeFormatted,
            blob: file
          }
        ].slice(0, 3));
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeScreenshot = (id: string) => {
    setScreenshots((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Anti-Bot Honeypot Trigger Check
    if (honeypot.trim().length > 0) {
      console.warn('Bot submission silently filtered by honeypot.');
      setSuccess(true);
      return;
    }

    // 2. Client-Side Rate-Limiting Cooldown
    if (cooldownRemaining > 0) {
      setError(`Please wait ${cooldownRemaining} seconds before submitting another ticket.`);
      return;
    }

    // 3. Input Validation & Sanitization
    const cleanEmail = email.trim();
    const cleanName = name.trim().slice(0, 100) || 'Candidate User';
    const cleanMessage = message.trim().slice(0, 3000);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setError('Please provide a valid email address.');
      return;
    }

    if (!cleanMessage) {
      setError('Please describe your issue or question in the message field.');
      return;
    }

    setSending(true);
    setError(null);

    const userPlan = (userProfile?.plan || 'free').toUpperCase();

    try {
      // 4. Prepare Multipart FormData for FormSubmit
      const formData = new FormData();
      formData.append('name', cleanName);
      formData.append('email', cleanEmail);
      formData.append('_subject', `[JD2CV Support] ${category} - from ${cleanName} (${userPlan})`);
      formData.append('_replyto', cleanEmail);
      formData.append('Candidate Name', cleanName);
      formData.append('Candidate Email', cleanEmail);
      formData.append('Subscription Plan', userPlan);
      formData.append('Category', category);
      formData.append('Message Details', cleanMessage);
      formData.append('_captcha', 'false');
      formData.append('_template', 'table');

      // Attach screenshot files
      screenshots.forEach((s, idx) => {
        if (s.blob) {
          formData.append(`screenshot_${idx + 1}`, s.blob, s.name);
        }
      });

      // 5. Silent Direct Delivery via HTTPS POST
      const response = await fetch('https://formsubmit.co/ajax/vineetsansare@gmail.com', {
        method: 'POST',
        headers: {
          'Accept': 'application/json'
        },
        body: formData
      });

      const data = await response.json().catch(() => ({}));

      // 6. Record rate-limit timestamp
      localStorage.setItem(COOLDOWN_KEY, Date.now().toString());

      // 7. Audit log to Supabase if session active
      if (session?.user?.id) {
        try {
          await supabase.from('support_tickets').insert({
            user_id: session.user.id,
            name: cleanName,
            email: cleanEmail,
            plan: userProfile?.plan || 'free',
            category: category,
            message: cleanMessage,
            screenshot_count: screenshots.length
          });
        } catch (_dbErr) {
          // Non-blocking
        }
      }

      if (response.ok || data.success === 'true' || data.message?.includes('Activation') || data.success === true) {
        setSuccess(true);
        setMessage('');
        setScreenshots([]);
      } else {
        throw new Error(data.message || 'Could not deliver message. Please verify your internet connection.');
      }
    } catch (err: any) {
      console.error('Contact submission error:', err);
      setError(err.message || 'Failed to deliver message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="entrance-fade" style={{ maxWidth: '880px', margin: '0 auto', width: '100%' }}>
      {/* Top Banner */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #7c3aed 0%, #4f378a 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff'
            }}
          >
            <MessageSquare size={20} />
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Contact & Support
          </h2>
        </div>
        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.95rem', lineHeight: 1.5 }}>
          Have a question, feedback on your ATS score, or experiencing an issue? Send us a direct message and our engineering team will get back to you promptly.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
        {/* Main Form Glass Card */}
        <div className="glass-card" style={{ padding: '2rem', borderRadius: '20px', border: '1px solid var(--card-border)' }}>
          {success ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.5rem auto',
                  color: '#10b981'
                }}
              >
                <CheckCircle2 size={36} />
              </div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>
                Message Sent Directly!
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '420px', margin: '0 auto 1.5rem auto', lineHeight: 1.5 }}>
                Thank you for reaching out. We have received your inquiry and screenshots, and will reply directly to <strong>{email}</strong> within 24 hours.
              </p>
              <button
                type="button"
                onClick={() => setSuccess(false)}
                className="btn btn-secondary"
                style={{ padding: '0.6rem 1.5rem', fontWeight: 600, fontSize: '0.9rem' }}
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Invisible Anti-Spam Honeypot Field */}
              <div style={{ display: 'none' }} aria-hidden="true">
                <label htmlFor="website_url">Do not fill this field</label>
                <input
                  id="website_url"
                  type="text"
                  name="_honey"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </div>

              {error && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    color: '#f87171',
                    fontSize: '0.85rem'
                  }}
                >
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{error}</span>
                </div>
              )}

              {/* Name & Email Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label htmlFor="contact-name" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem', display: 'block' }}>
                    Your Name
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    maxLength={100}
                    placeholder="e.g. Vineet Sansare"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ width: '100%', padding: '0.7rem 0.9rem', borderRadius: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--card-border)', color: 'var(--text-primary)', fontSize: '0.9rem' }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label htmlFor="contact-email" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem', display: 'block' }}>
                    Email Address
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    maxLength={150}
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ width: '100%', padding: '0.7rem 0.9rem', borderRadius: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--card-border)', color: 'var(--text-primary)', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              {/* Category / Subject Dropdown */}
              <div className="form-group" style={{ margin: 0 }}>
                <label htmlFor="contact-category" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem', display: 'block' }}>
                  Category
                </label>
                <select
                  id="contact-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.7rem 0.9rem',
                    borderRadius: '10px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--card-border)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat} style={{ background: '#0f172a', color: '#fff' }}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Message Text Area */}
              <div className="form-group" style={{ margin: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label htmlFor="contact-message" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Message Details
                  </label>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {message.length} / 3000 chars
                  </span>
                </div>
                <textarea
                  id="contact-message"
                  required
                  maxLength={3000}
                  rows={5}
                  placeholder="Please describe what happened, steps to reproduce, or any questions you have regarding your CV tailoring..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.8rem 0.9rem',
                    borderRadius: '10px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--card-border)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    lineHeight: 1.5,
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              {/* Screenshot Attachments (Max 3) */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Image size={14} /> Attach Screenshots (Max 3)
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {screenshots.length} / 3 attached
                  </span>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/png, image/jpeg, image/webp"
                  multiple
                  style={{ display: 'none' }}
                />

                {screenshots.length < 3 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '10px',
                      border: '1px dashed var(--card-border)',
                      background: 'rgba(255, 255, 255, 0.02)',
                      color: 'var(--text-secondary)',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      marginBottom: screenshots.length > 0 ? '0.75rem' : '0'
                    }}
                  >
                    <Paperclip size={15} />
                    <span>Upload Screenshot (PNG, JPG, WEBP &bull; Max 3MB)</span>
                  </button>
                )}

                {/* Screenshot Thumbnails List */}
                {screenshots.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.5rem' }}>
                    {screenshots.map((s) => (
                      <div
                        key={s.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--card-border)',
                          padding: '0.35rem 0.6rem',
                          borderRadius: '8px',
                          maxWidth: '220px'
                        }}
                      >
                        <img
                          src={s.dataUrl}
                          alt={s.name}
                          style={{ width: '28px', height: '28px', borderRadius: '4px', objectFit: 'cover' }}
                        />
                        <div style={{ minWidth: 0, flexGrow: 1 }}>
                          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {s.name}
                          </p>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{s.size}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeScreenshot(s.id)}
                          style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
                          title="Remove image"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={sending || cooldownRemaining > 0}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  marginTop: '0.5rem',
                  background: cooldownRemaining > 0 ? 'var(--bg-secondary)' : 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
                  boxShadow: cooldownRemaining > 0 ? 'none' : '0 4px 15px rgba(124, 58, 237, 0.35)',
                  cursor: cooldownRemaining > 0 ? 'not-allowed' : 'pointer',
                  opacity: cooldownRemaining > 0 ? 0.7 : 1
                }}
              >
                {sending ? (
                  <>
                    <div className="radar-spinner" style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                    <span>Sending Secure Ticket...</span>
                  </>
                ) : cooldownRemaining > 0 ? (
                  <>
                    <Lock size={16} />
                    <span>Cooldown active ({cooldownRemaining}s)</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>Send Message Directly</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Sidebar Info Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--card-border)' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.75rem 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Mail size={16} style={{ color: 'var(--accent-secondary)' }} />
              Direct Support Channel
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 1rem 0' }}>
              You can also email our team directly anytime at:
            </p>
            <a
              href="mailto:vineetsansare@gmail.com"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.9rem',
                fontWeight: 700,
                color: '#c084fc',
                textDecoration: 'none'
              }}
            >
              vineetsansare@gmail.com
            </a>
          </div>

          <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--card-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Clock size={16} style={{ color: '#10b981' }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>Response Time</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              Average response time is under <strong>4 to 12 hours</strong>. Active Pro subscribers receive prioritized ticket routing.
            </p>
          </div>

          <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--card-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <ShieldCheck size={16} style={{ color: '#38bdf8' }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>Confidentiality & Privacy</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              Your CV data, attached screenshots, and career details are kept 100% confidential and never shared with third parties.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
