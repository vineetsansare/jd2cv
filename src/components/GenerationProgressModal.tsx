import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Cpu, 
  Layers, 
  Target, 
  FileCheck, 
  CheckCircle2, 
  Clock, 
  Lightbulb,
  X,
  Bot
} from 'lucide-react';
import { LiquidCard } from './ui/LiquidCard';

interface GenerationProgressModalProps {
  isAutoFixing?: boolean;
  currentStepIndex: number; // 0 to 3
  onCancel: () => void;
}

const CAREER_TIPS = [
  "Quantified metrics (e.g. 'reduced latency by 45%') boost recruiter callback rates by over 40%.",
  "ATS algorithms score exact keyword matches in your role descriptions and skills sections.",
  "Opening bullet points with strong action verbs (Architected, Spearheaded, Accelerated) commands attention in 6 seconds.",
  "Tailoring your resume to each job description increases ATS pass-through probability from 20% to 88%.",
  "A concise 2-sentence executive summary frames your leadership trajectory before recruiters skim experience."
];

export const GenerationProgressModal: React.FC<GenerationProgressModalProps> = ({
  isAutoFixing = false,
  currentStepIndex = 0,
  onCancel
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);

  // Timer for elapsed seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Carousel for career pro-tips
  useEffect(() => {
    const tipInterval = setInterval(() => {
      setTipIndex(prev => (prev + 1) % CAREER_TIPS.length);
    }, 4500);
    return () => clearInterval(tipInterval);
  }, []);

  const stages = isAutoFixing
    ? [
        {
          id: 0,
          title: 'ATS Gap Diagnostic',
          desc: 'Scanning Job Description & CV to identify missing keywords and scoring penalties...',
          icon: <Target size={18} />,
          badge: 'Keyword Discovery'
        },
        {
          id: 1,
          title: 'Contextual Keyword Weaving',
          desc: 'Organically injecting priority industry terminology into bullet points naturally...',
          icon: <Cpu size={18} />,
          badge: 'Semantic Calibration'
        },
        {
          id: 2,
          title: 'Executive Tone & Impact Polish',
          desc: 'Upgrading action verbs, quantifying results, and eliminating passive phrasing...',
          icon: <Sparkles size={18} />,
          badge: 'Executive Framing'
        },
        {
          id: 3,
          title: 'Cover Letter Narrative Sync',
          desc: 'Harmonizing your cover letter story with the newly optimized CV achievements...',
          icon: <FileCheck size={18} />,
          badge: 'Final Assembly'
        }
      ]
    : [
        {
          id: 0,
          title: 'Job Description Intelligence',
          desc: 'Deconstructing core technical stack, required competencies, and seniority expectations...',
          icon: <Target size={18} />,
          badge: 'Requirement Extraction'
        },
        {
          id: 1,
          title: 'Career Evidence Alignment',
          desc: 'Cross-referencing your uploaded profile history to surface matching accomplishments & metrics...',
          icon: <Layers size={18} />,
          badge: 'Profile Mapping'
        },
        {
          id: 2,
          title: 'ATS Compatibility & Keyword Calibration',
          desc: 'Structuring experience bullets with high-density keywords for maximum scanner scoring...',
          icon: <Cpu size={18} />,
          badge: 'Algorithm Tuning'
        },
        {
          id: 3,
          title: 'Executive Synthesis & Polish',
          desc: 'Applying active executive verbs, formatting clean markdown layout, and generating tailored cover letter...',
          icon: <Sparkles size={18} />,
          badge: 'Executive Synthesis'
        }
      ];

  // Calculate dynamic progress percentage based on current step and elapsed seconds
  const basePercentages = [22, 54, 78, 94];
  const stepBase = basePercentages[Math.min(currentStepIndex, 3)];
  // Add micro-increment based on elapsed time within step
  const calculatedPercent = Math.min(98, Math.max(12, stepBase + Math.min(8, (elapsedSeconds % 4) * 2)));

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ maxWidth: '820px', margin: '1.5rem auto', width: '100%' }} className="entrance-fade">
      <LiquidCard variant="glass" padding="none" style={{ borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.12)', boxShadow: '0 24px 60px rgba(0, 0, 0, 0.5)' }}>
        
        {/* Top Header Strip */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.25rem 1.75rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--accent-primary, #6366f1), var(--accent-secondary, #a855f7))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 0 16px rgba(99, 102, 241, 0.4)'
            }}>
              <Bot size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  {isAutoFixing ? '1-Click ATS Auto-Fixing' : 'Optimizing Executive CV'}
                </h3>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '9999px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: 'var(--accent-mint, #10b981)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 6px #10b981' }} />
                  Gemini 2.5 Flash
                </span>
              </div>
              <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Synthesizing tailored keywords and executive formatting in real-time
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
            <Clock size={14} style={{ color: 'var(--accent-primary)' }} />
            <span>{formatTime(elapsedSeconds)}</span>
          </div>
        </div>

        {/* Center Visual Core: Orbital Pulsar & Live Percentage */}
        <div style={{ padding: '2rem 2rem 1.25rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          
          <div style={{ position: 'relative', width: '130px', height: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
            {/* Outer spinning ring */}
            <div style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: '2px dashed rgba(99, 102, 241, 0.35)',
              animation: 'spin 12s linear infinite'
            }} />
            
            {/* Middle pulsing orbital glow */}
            <div style={{
              position: 'absolute',
              inset: '12px',
              borderRadius: '50%',
              border: '2px solid transparent',
              borderTopColor: 'var(--accent-primary, #6366f1)',
              borderBottomColor: 'var(--accent-secondary, #a855f7)',
              animation: 'spin 3s cubic-bezier(0.4, 0, 0.2, 1) infinite',
              boxShadow: '0 0 20px rgba(99, 102, 241, 0.2)'
            }} />

            {/* Inner Glowing Orb */}
            <div style={{
              width: '82px',
              height: '82px',
              borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 35%, rgba(139, 92, 246, 0.25) 0%, rgba(17, 24, 39, 0.95) 75%)',
              border: '1px solid rgba(139, 92, 246, 0.4)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 30px rgba(99, 102, 241, 0.25)'
            }}>
              <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1 }}>
                {calculatedPercent}%
              </span>
              <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--accent-secondary)', fontWeight: 700, letterSpacing: '0.08em', marginTop: '2px' }}>
                Active
              </span>
            </div>
          </div>

          {/* Smooth Progress Bar */}
          <div style={{ width: '100%', maxWidth: '520px', height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '9999px', overflow: 'hidden', marginBottom: '2rem' }}>
            <div style={{
              width: `${calculatedPercent}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #6366f1, #a855f7, #ec4899)',
              borderRadius: '9999px',
              transition: 'width 0.4s ease-out',
              boxShadow: '0 0 12px rgba(168, 85, 247, 0.6)'
            }} />
          </div>

          {/* Interactive Multi-Stage Pipeline Stepper */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {stages.map((stage) => {
              const isPast = stage.id < currentStepIndex;
              const isCurrent = stage.id === currentStepIndex;

              return (
                <div
                  key={stage.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '0.9rem 1.25rem',
                    borderRadius: '14px',
                    background: isCurrent 
                      ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(168, 85, 247, 0.08))' 
                      : isPast 
                      ? 'rgba(255, 255, 255, 0.02)' 
                      : 'rgba(255, 255, 255, 0.01)',
                    border: isCurrent 
                      ? '1px solid rgba(99, 102, 241, 0.35)' 
                      : isPast 
                      ? '1px solid rgba(16, 185, 129, 0.2)' 
                      : '1px solid rgba(255, 255, 255, 0.05)',
                    transition: 'all 0.3s ease',
                    boxShadow: isCurrent ? '0 4px 20px rgba(99, 102, 241, 0.12)' : 'none'
                  }}
                >
                  {/* Status Indicator Icon */}
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    background: isPast 
                      ? 'rgba(16, 185, 129, 0.15)' 
                      : isCurrent 
                      ? 'var(--accent-primary)' 
                      : 'rgba(255, 255, 255, 0.05)',
                    color: isPast 
                      ? 'var(--accent-mint, #10b981)' 
                      : isCurrent 
                      ? '#fff' 
                      : 'var(--text-muted)',
                    boxShadow: isCurrent ? '0 0 14px rgba(99, 102, 241, 0.5)' : 'none'
                  }}>
                    {isPast ? <CheckCircle2 size={18} /> : stage.icon}
                  </div>

                  {/* Stage Details */}
                  <div style={{ flexGrow: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.15rem' }}>
                      <span style={{
                        fontSize: '0.92rem',
                        fontWeight: 700,
                        color: isCurrent ? 'var(--text-primary)' : isPast ? 'var(--text-secondary)' : 'var(--text-muted)'
                      }}>
                        {stage.title}
                      </span>
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 600,
                        padding: '0.15rem 0.5rem',
                        borderRadius: '6px',
                        background: isCurrent ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                        color: isCurrent ? 'var(--accent-primary)' : 'var(--text-muted)'
                      }}>
                        {stage.badge}
                      </span>
                    </div>
                    <p style={{
                      fontSize: '0.78rem',
                      margin: 0,
                      color: isCurrent ? 'var(--text-secondary)' : 'var(--text-muted)',
                      lineHeight: 1.35
                    }}>
                      {stage.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Real-Time Career & ATS Pro-Tip Rotator */}
          <div style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
            padding: '0.85rem 1.15rem',
            background: 'rgba(234, 179, 8, 0.06)',
            border: '1px solid rgba(234, 179, 8, 0.2)',
            borderRadius: '14px',
            color: '#fbbf24',
            marginBottom: '1.5rem'
          }}>
            <Lightbulb size={20} style={{ flexShrink: 0, color: '#fbbf24' }} />
            <div style={{ flexGrow: 1, fontSize: '0.8rem', lineHeight: 1.4, color: 'var(--text-secondary)' }}>
              <strong style={{ color: '#fbbf24' }}>Pro Tip: </strong>
              <span>{CAREER_TIPS[tipIndex]}</span>
            </div>
          </div>

          {/* Cancel Action */}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            style={{
              padding: '0.55rem 1.4rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              borderRadius: '10px',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              background: 'rgba(239, 68, 68, 0.06)',
              color: '#f87171',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <X size={15} />
            <span>Cancel Customization</span>
          </button>

        </div>
      </LiquidCard>
    </div>
  );
};
