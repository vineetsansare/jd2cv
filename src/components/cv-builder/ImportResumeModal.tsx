import React, { useState, useRef, useEffect } from 'react';
import { 
  X, FileText, Upload, Sparkles, Loader2, 
  FileUp, AlertCircle, ArrowRight, Zap, CheckCircle2,
  Briefcase, GraduationCap, Wrench, User
} from 'lucide-react';
import type { StructuredCV } from '../../types/cvBuilder';
import { ensureResumeDefaults } from '../../types/cvBuilder';
import { parsePdf } from '../../utils/pdfParser';
import { extractDocxText } from '../../utils/docxParser';
import { parseResumeTextToStructuredCV } from '../../utils/cvBuilderConverter';
import { digitizeResumeWithAI } from '../../utils/llm';

interface ImportResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (importedCv: StructuredCV, rawText: string, filename: string) => Promise<void> | void;
  baseCVs?: Array<{ id?: string; name: string; text: string }>;
  currentCv?: StructuredCV;
}

interface ImportedStats {
  filename: string;
  name: string;
  expCount: number;
  eduCount: number;
  skillsCount: number;
  customCount: number;
}

export function ImportResumeModal({
  isOpen,
  onClose,
  onImport,
  baseCVs = [],
  currentCv,
}: ImportResumeModalProps) {
  const [activeTab, setActiveTab] = useState<'file' | 'text'>('file');
  const [parsingMode, setParsingMode] = useState<'ai' | 'fast'>('ai');
  const [stage, setStage] = useState<'idle' | 'processing' | 'success'>('idle');
  const [progress, setProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState('Extracting document text & layout...');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [importedStats, setImportedStats] = useState<ImportedStats | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Smooth simulated progress bar while LLM or parser runs
  useEffect(() => {
    let timer: any;
    if (stage === 'processing') {
      setProgress(12);
      setProcessingStatus(
        parsingMode === 'fast' 
          ? 'Parsing document text with local parser...' 
          : 'Extracting document text & layout...'
      );
      
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev < 30) {
            setProcessingStatus('Extracting document text & layout...');
            return prev + 6;
          } else if (prev < 65) {
            setProcessingStatus('AI parsing: Identifying experience, roles & dates...');
            return prev + 3;
          } else if (prev < 88) {
            setProcessingStatus('AI parsing: Mapping skills, education & achievements...');
            return prev + 1;
          } else if (prev < 95) {
            setProcessingStatus('Finalizing structured resume layout...');
            return prev + 0.4;
          }
          return prev;
        });
      }, 400);

      timer = interval;
    }
    return () => clearInterval(timer);
  }, [stage, parsingMode]);

  if (!isOpen) return null;

  const handleClose = () => {
    if (stage === 'processing' && abortControllerRef.current) {
      if (confirm('Import is currently in progress. Do you want to cancel?')) {
        abortControllerRef.current.abort();
        setStage('idle');
        onClose();
      }
    } else {
      setErrorMessage(null);
      setStage('idle');
      setImportedStats(null);
      onClose();
    }
  };

  const finalizeImport = async (finalCv: StructuredCV, rawText: string, filename: string) => {
    setProgress(100);
    setProcessingStatus('Done! Loading your resume into the editor...');

    const stats: ImportedStats = {
      filename,
      name: finalCv.basics?.fullName || 'Candidate',
      expCount: finalCv.experience?.length || 0,
      eduCount: finalCv.education?.length || 0,
      skillsCount: finalCv.skills?.length || 0,
      customCount: finalCv.customSections?.length || 0,
    };

    setImportedStats(stats);

    // Call onImport to update CVBuilderPanel state and sync Base CV
    try {
      await onImport(finalCv, rawText, filename);
    } catch (importErr) {
      console.warn('onImport completed with warning:', importErr);
    }

    // Switch to success confirmation screen inside the themed modal
    setTimeout(() => {
      setStage('success');
    }, 400);
  };

  const processAndImportText = async (rawText: string, filename: string, photoUrl?: string) => {
    if (!rawText.trim()) {
      setErrorMessage('The resume text appears to be empty. Please choose a valid document.');
      setStage('idle');
      return;
    }

    setStage('processing');
    setErrorMessage(null);
    abortControllerRef.current = new AbortController();

    // Fast local parsing mode
    if (parsingMode === 'fast') {
      try {
        const fallbackCv = parseResumeTextToStructuredCV(rawText, currentCv);
        if (photoUrl && (!fallbackCv.basics.avatarUrl || !fallbackCv.basics.showAvatar)) {
          fallbackCv.basics.avatarUrl = photoUrl;
          fallbackCv.basics.showAvatar = true;
        }
        const finalCv = ensureResumeDefaults(fallbackCv);
        await finalizeImport(finalCv, rawText, filename);
        return;
      } catch (fallbackErr: any) {
        console.error('Fast parsing failed:', fallbackErr);
        setErrorMessage(fallbackErr.message || 'Fast parsing failed. Try switching to AI Smart Parse.');
        setStage('idle');
        return;
      }
    }

    // AI Smart Parse mode (Gemini / OpenAI structured output)
    try {
      const structured = await digitizeResumeWithAI(
        rawText, 
        undefined, 
        abortControllerRef.current.signal
      );

      // Preserve existing theme / styling settings from currentCv
      if (currentCv?.theme) {
        structured.theme = { ...currentCv.theme };
      }
      if (photoUrl && (!structured.basics.avatarUrl || !structured.basics.showAvatar)) {
        structured.basics.avatarUrl = photoUrl;
        structured.basics.showAvatar = true;
      }

      const finalCv = ensureResumeDefaults(structured);
      await finalizeImport(finalCv, rawText, filename);

    } catch (err: any) {
      console.error('Error during AI resume digitization:', err);
      // Fallback to client-side rule-based parser immediately
      try {
        const fallbackCv = parseResumeTextToStructuredCV(rawText, currentCv);
        if (photoUrl && (!fallbackCv.basics.avatarUrl || !fallbackCv.basics.showAvatar)) {
          fallbackCv.basics.avatarUrl = photoUrl;
          fallbackCv.basics.showAvatar = true;
        }
        const finalCv = ensureResumeDefaults(fallbackCv);
        await finalizeImport(finalCv, rawText, filename);
      } catch (fallbackErr: any) {
        setErrorMessage(fallbackErr.message || 'Failed to parse resume. Please try pasting the text manually.');
        setStage('idle');
      }
    }
  };

  const handleFileSelected = async (file: File) => {
    const MAX_SIZE_BYTES = 3 * 1024 * 1024; // 3MB Limit
    if (file.size > MAX_SIZE_BYTES) {
      setErrorMessage(`File "${file.name}" (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds the maximum allowed size of 3MB.`);
      return;
    }

    const nameLower = file.name.toLowerCase();
    const isPdf = file.type === 'application/pdf' || nameLower.endsWith('.pdf');
    const isDocx = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || nameLower.endsWith('.docx');
    const isDoc = nameLower.endsWith('.doc');
    const isText = file.type === 'text/plain' || nameLower.endsWith('.txt') || nameLower.endsWith('.md');
    const isImage = file.type.startsWith('image/') || nameLower.endsWith('.png') || nameLower.endsWith('.jpg') || nameLower.endsWith('.jpeg');

    if (isDoc) {
      setErrorMessage('Legacy .doc format is not supported directly in the browser. Please open it in Word or Google Docs, save or export as .pdf or .docx, and upload again.');
      return;
    }

    if (isImage) {
      setErrorMessage('Image resume scanning requires searchable text. Please upload a .pdf or .docx version for 100% accurate text and layout extraction.');
      return;
    }

    if (!isPdf && !isDocx && !isText) {
      setErrorMessage('Unsupported file format. Please upload a .pdf, .docx, or .txt file.');
      return;
    }

    setErrorMessage(null);

    try {
      let extractedText = '';
      let extractedPhotoUrl: string | undefined;

      if (isPdf) {
        const buffer = await file.arrayBuffer();
        const parsed = await parsePdf(buffer);
        extractedText = parsed.text;
        extractedPhotoUrl = parsed.photoUrl;
      } else if (isDocx) {
        const buffer = await file.arrayBuffer();
        extractedText = await extractDocxText(buffer);
      } else if (isText) {
        extractedText = await file.text();
      }

      await processAndImportText(extractedText, file.name, extractedPhotoUrl);
    } catch (err: any) {
      console.error('File reading failed:', err);
      setErrorMessage(`Could not read file: ${err.message || 'Unknown error'}`);
      setStage('idle');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleImportBaseCV = () => {
    if (baseCVs && baseCVs.length > 0 && baseCVs[0]?.text?.trim()) {
      processAndImportText(baseCVs[0].text, baseCVs[0].name || 'Base CV Profile');
    }
  };

  const handlePasteSubmit = () => {
    if (!pastedText.trim()) {
      setErrorMessage('Please paste your resume text before clicking import.');
      return;
    }
    processAndImportText(pastedText, 'Pasted Resume');
  };

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        backgroundColor: 'rgba(5, 8, 15, 0.75)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && stage !== 'processing') handleClose();
      }}
    >
      <div 
        style={{
          width: '100%',
          maxWidth: '560px',
          backgroundColor: 'var(--card-bg, #ffffff)',
          color: 'var(--text-primary, #131b2e)',
          borderRadius: 'var(--border-radius-xl, 24px)',
          boxShadow: 'var(--card-shadow), 0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          border: '1px solid var(--card-border, rgba(195, 198, 215, 0.3))',
          padding: '2rem',
          position: 'relative',
          transition: 'all 0.3s ease',
        }}
      >
        {/* Close Button */}
        {stage !== 'processing' && (
          <button
            type="button"
            onClick={handleClose}
            style={{
              position: 'absolute',
              top: '1.25rem',
              right: '1.25rem',
              background: 'var(--bg-secondary, rgba(255, 255, 255, 0.08))',
              border: '1px solid var(--card-border, rgba(255, 255, 255, 0.1))',
              cursor: 'pointer',
              color: 'var(--text-muted, #737686)',
              padding: '0.45rem',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
            title="Close"
          >
            <X size={18} />
          </button>
        )}

        {/* ── STAGE 1: PROCESSING SCREEN ────────────────────────────────────────── */}
        {stage === 'processing' && (
          <div style={{ textAlign: 'center', padding: '1.5rem 0.5rem' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
              Importing your resume
            </h2>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
              <Loader2 size={24} className="animate-spin" style={{ color: 'var(--accent-secondary, #7c3aed)' }} />
              <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>
                {processingStatus}
              </span>
            </div>

            {/* Progress bar */}
            <div 
              style={{
                width: '100%',
                height: '8px',
                backgroundColor: 'var(--bg-secondary, rgba(255, 255, 255, 0.1))',
                borderRadius: '999px',
                overflow: 'hidden',
                position: 'relative',
                marginBottom: '1.25rem',
                border: '1px solid var(--card-border, transparent)',
              }}
            >
              <div 
                style={{
                  height: '100%',
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, var(--accent-primary, #2563eb), var(--accent-secondary, #7c3aed))',
                  borderRadius: '999px',
                  transition: 'width 0.4s ease-out',
                }}
              />
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {parsingMode === 'ai' 
                ? 'Parsing with Gemini structured AI to extract contact info, work history, bullets, and skills...'
                : 'Extracting content using fast in-browser document layout parser...'}
            </p>
          </div>
        )}

        {/* ── STAGE 2: THEMED SUCCESS MODAL SCREEN ──────────────────────────────── */}
        {stage === 'success' && importedStats && (
          <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
            <div 
              style={{ 
                width: 64, 
                height: 64, 
                borderRadius: '50%', 
                background: 'rgba(16, 185, 129, 0.15)', 
                border: '1px solid rgba(16, 185, 129, 0.35)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 1.25rem' 
              }}
            >
              <CheckCircle2 size={36} style={{ color: '#10b981' }} />
            </div>

            <h2 style={{ fontSize: '1.45rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              Resume Imported Successfully!
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem', wordBreak: 'break-word' }}>
              Imported from <strong style={{ color: 'var(--text-primary)' }}>"{importedStats.filename}"</strong>
            </p>

            {/* Stats Breakdown Grid */}
            <div 
              style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, 1fr)', 
                gap: '0.75rem', 
                marginBottom: '1.75rem',
                textAlign: 'left'
              }}
            >
              <div 
                style={{ 
                  padding: '0.85rem 1rem', 
                  borderRadius: 'var(--border-radius-md, 10px)', 
                  background: 'var(--bg-secondary)', 
                  border: '1px solid var(--card-border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}
              >
                <User size={20} style={{ color: 'var(--accent-secondary)', flexShrink: 0 }} />
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Candidate</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {importedStats.name}
                  </div>
                </div>
              </div>

              <div 
                style={{ 
                  padding: '0.85rem 1rem', 
                  borderRadius: 'var(--border-radius-md, 10px)', 
                  background: 'var(--bg-secondary)', 
                  border: '1px solid var(--card-border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}
              >
                <Briefcase size={20} style={{ color: '#10b981', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Experience</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {importedStats.expCount} positions
                  </div>
                </div>
              </div>

              <div 
                style={{ 
                  padding: '0.85rem 1rem', 
                  borderRadius: 'var(--border-radius-md, 10px)', 
                  background: 'var(--bg-secondary)', 
                  border: '1px solid var(--card-border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}
              >
                <GraduationCap size={20} style={{ color: '#06b6d4', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Education</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {importedStats.eduCount} degrees
                  </div>
                </div>
              </div>

              <div 
                style={{ 
                  padding: '0.85rem 1rem', 
                  borderRadius: 'var(--border-radius-md, 10px)', 
                  background: 'var(--bg-secondary)', 
                  border: '1px solid var(--card-border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}
              >
                <Wrench size={20} style={{ color: '#f59e0b', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Skills</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {importedStats.skillsCount} categories
                  </div>
                </div>
              </div>

              {importedStats.customCount > 0 && (
                <div 
                  style={{ 
                    gridColumn: '1 / -1',
                    padding: '0.75rem 1rem', 
                    borderRadius: 'var(--border-radius-md, 10px)', 
                    background: 'var(--bg-secondary)', 
                    border: '1px solid var(--card-border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}
                >
                  <Sparkles size={18} style={{ color: 'var(--accent-secondary)', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Custom Sections</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {importedStats.customCount} additional sections
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleClose}
              style={{
                width: '100%',
                padding: '0.85rem 1.5rem',
                borderRadius: 'var(--border-radius-md, 10px)',
                background: 'linear-gradient(135deg, var(--accent-primary, #2563eb), var(--accent-secondary, #7c3aed))',
                color: '#ffffff',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.95rem',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'opacity 0.2s ease',
              }}
            >
              <span>Continue to Resume Editor</span>
              <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* ── STAGE 3: INPUT / UPLOAD FORM ───────────────────────────────────────── */}
        {stage === 'idle' && (
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>
              Import Resume
            </h2>

            {/* Source Segmented Tabs (Resume File vs Paste Text) */}
            <div 
              style={{ 
                display: 'flex', 
                gap: '0.35rem', 
                marginBottom: '1rem',
                background: 'var(--bg-secondary, #f2f3ff)',
                padding: '4px',
                borderRadius: '12px',
                border: '1px solid var(--card-border, rgba(195, 198, 215, 0.3))',
              }}
            >
              <button
                type="button"
                onClick={() => { setActiveTab('file'); setErrorMessage(null); }}
                style={{
                  flex: 1,
                  padding: '0.6rem 1rem',
                  borderRadius: '9px',
                  fontWeight: activeTab === 'file' ? 600 : 500,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  border: activeTab === 'file' ? '1px solid var(--card-border, transparent)' : '1px solid transparent',
                  backgroundColor: activeTab === 'file' ? 'var(--card-bg, #ffffff)' : 'transparent',
                  color: activeTab === 'file' ? 'var(--text-primary, #131b2e)' : 'var(--text-muted, #737686)',
                  boxShadow: activeTab === 'file' ? '0 2px 6px rgba(0, 0, 0, 0.1)' : 'none',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
              >
                <FileText size={16} />
                <span>Resume File</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('text'); setErrorMessage(null); }}
                style={{
                  flex: 1,
                  padding: '0.6rem 1rem',
                  borderRadius: '9px',
                  fontWeight: activeTab === 'text' ? 600 : 500,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  border: activeTab === 'text' ? '1px solid var(--card-border, transparent)' : '1px solid transparent',
                  backgroundColor: activeTab === 'text' ? 'var(--card-bg, #ffffff)' : 'transparent',
                  color: activeTab === 'text' ? 'var(--text-primary, #131b2e)' : 'var(--text-muted, #737686)',
                  boxShadow: activeTab === 'text' ? '0 2px 6px rgba(0, 0, 0, 0.1)' : 'none',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
              >
                <FileUp size={16} />
                <span>Paste Text</span>
              </button>
            </div>

            {/* Engine Segmented Selector (AI Smart Parse vs Fast Local Parse) */}
            <div 
              style={{ 
                display: 'flex', 
                gap: '0.35rem', 
                marginBottom: '1rem', 
                background: 'var(--bg-secondary, #f2f3ff)', 
                padding: '3px', 
                borderRadius: '10px',
                border: '1px solid var(--card-border, rgba(195, 198, 215, 0.3))',
              }}
            >
              <button
                type="button"
                onClick={() => setParsingMode('ai')}
                style={{
                  flex: 1,
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: parsingMode === 'ai' ? 600 : 500,
                  border: parsingMode === 'ai' ? '1px solid var(--card-border, transparent)' : '1px solid transparent',
                  cursor: 'pointer',
                  backgroundColor: parsingMode === 'ai' ? 'var(--card-bg, #ffffff)' : 'transparent',
                  color: parsingMode === 'ai' ? 'var(--text-primary, #131b2e)' : 'var(--text-muted, #737686)',
                  boxShadow: parsingMode === 'ai' ? '0 2px 6px rgba(0, 0, 0, 0.1)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.15s ease'
                }}
              >
                <Sparkles size={14} style={{ color: 'var(--accent-secondary, #7c3aed)' }} />
                <span>AI Smart Parse (Recommended)</span>
              </button>

              <button
                type="button"
                onClick={() => setParsingMode('fast')}
                style={{
                  flex: 1,
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: parsingMode === 'fast' ? 600 : 500,
                  border: parsingMode === 'fast' ? '1px solid var(--card-border, transparent)' : '1px solid transparent',
                  cursor: 'pointer',
                  backgroundColor: parsingMode === 'fast' ? 'var(--card-bg, #ffffff)' : 'transparent',
                  color: parsingMode === 'fast' ? 'var(--text-primary, #131b2e)' : 'var(--text-muted, #737686)',
                  boxShadow: parsingMode === 'fast' ? '0 2px 6px rgba(0, 0, 0, 0.1)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.15s ease'
                }}
              >
                <Zap size={14} style={{ color: '#f59e0b' }} />
                <span>Fast Local Parse (&lt; 1s)</span>
              </button>
            </div>

            {/* Dynamic Informational Callout Banner */}
            <div 
              style={{
                backgroundColor: parsingMode === 'ai' ? 'rgba(124, 58, 237, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                border: `1px solid ${parsingMode === 'ai' ? 'rgba(124, 58, 237, 0.25)' : 'rgba(16, 185, 129, 0.25)'}`,
                borderRadius: 'var(--border-radius-md, 10px)',
                padding: '0.75rem 1rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                lineHeight: 1.4,
              }}
            >
              {parsingMode === 'ai' ? (
                <>
                  <Sparkles size={18} style={{ color: 'var(--accent-secondary, #7c3aed)', flexShrink: 0 }} />
                  <span>
                    <strong>AI Smart Parse:</strong> Uses Gemini structured schema to accurately recognize work history, nested bullets, date ranges, and custom sections across complex and multi-column CVs.
                  </span>
                </>
              ) : (
                <>
                  <Zap size={18} style={{ color: '#10b981', flexShrink: 0 }} />
                  <span>
                    <strong>Fast Local Parse:</strong> Instantly extracts standard single-column text inside your browser without any network API calls. Best for simple, clean resumes.
                  </span>
                </>
              )}
            </div>

            {/* Error banner */}
            {errorMessage && (
              <div 
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: 'var(--border-radius-md, 10px)',
                  padding: '0.75rem 1rem',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  color: 'var(--danger, #ef4444)',
                  fontSize: '0.85rem',
                }}
              >
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* TAB 1: RESUME FILE */}
            {activeTab === 'file' && (
              <div>
                {/* Optional Quick-Import from existing Base CV */}
                {baseCVs && baseCVs.length > 0 && baseCVs[0]?.text?.trim() && (
                  <div 
                    style={{
                      marginBottom: '1rem',
                      padding: '0.85rem 1rem',
                      borderRadius: 'var(--border-radius-md, 10px)',
                      border: '1px solid var(--card-border)',
                      backgroundColor: 'var(--bg-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.5rem',
                    }}
                  >
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>
                        Saved in Base CV Profile
                      </div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {baseCVs[0].name || 'Active Base CV'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleImportBaseCV}
                      style={{
                        padding: '0.5rem 0.85rem',
                        borderRadius: 'var(--border-radius-sm, 6px)',
                        backgroundColor: 'var(--accent-primary, #2563eb)',
                        color: '#ffffff',
                        border: 'none',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        flexShrink: 0,
                      }}
                    >
                      <span>Import Now</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                )}

                {/* Drag and Drop Zone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  style={{
                    border: `2px dashed ${isDragging ? 'var(--accent-primary, #2563eb)' : 'var(--card-border)'}`,
                    borderRadius: 'var(--border-radius-lg, 16px)',
                    padding: '2.5rem 1.5rem',
                    textAlign: 'center',
                    backgroundColor: isDragging ? 'rgba(124, 58, 237, 0.08)' : 'var(--bg-secondary)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <p style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>
                    Choose a file or drag and drop it here
                  </p>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem 1.75rem',
                      background: 'linear-gradient(135deg, var(--accent-primary, #2563eb), var(--accent-secondary, #7c3aed))',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 'var(--border-radius-md, 10px)',
                      fontWeight: 600,
                      fontSize: '0.95rem',
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)',
                      marginBottom: '1rem',
                      transition: 'transform 0.15s ease',
                    }}
                  >
                    <Upload size={18} />
                    <span>Select Resume</span>
                  </button>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    .pdf, .docx, .txt, .md (Max 3MB)
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelected(file);
                      e.target.value = '';
                    }}
                  />
                </div>
              </div>
            )}

            {/* TAB 2: PASTE TEXT */}
            {activeTab === 'text' && (
              <div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  Paste your resume text below. {parsingMode === 'ai' ? 'Our AI will extract headings, bullet points, and skills:' : 'Our local parser will extract sections and bullets:'}
                </p>

                <textarea
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Paste resume content here..."
                  rows={8}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: 'var(--border-radius-md, 10px)',
                    border: '1px solid var(--card-border)',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    fontFamily: 'var(--font-mono, monospace)',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    marginBottom: '1rem',
                    outline: 'none',
                  }}
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={handlePasteSubmit}
                    disabled={!pastedText.trim()}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem 1.5rem',
                      background: 'linear-gradient(135deg, var(--accent-primary, #2563eb), var(--accent-secondary, #7c3aed))',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 'var(--border-radius-md, 10px)',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      cursor: pastedText.trim() ? 'pointer' : 'not-allowed',
                      opacity: pastedText.trim() ? 1 : 0.5,
                      boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)',
                    }}
                  >
                    <Sparkles size={16} />
                    <span>{parsingMode === 'ai' ? 'Digitize with AI' : 'Parse Content'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
