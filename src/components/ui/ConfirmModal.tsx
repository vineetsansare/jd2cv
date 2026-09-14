import React from 'react';
import { AlertTriangle, AlertCircle, Sparkles, X } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  icon?: React.ReactNode;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'warning',
  icon
}) => {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          iconBg: 'rgba(239, 68, 68, 0.12)',
          iconBorder: 'rgba(239, 68, 68, 0.3)',
          iconColor: 'var(--danger, #ef4444)',
          defaultIcon: <AlertTriangle size={26} />,
          buttonBg: 'var(--danger, #ef4444)',
          buttonShadow: '0 4px 14px rgba(239, 68, 68, 0.35)',
        };
      case 'primary':
        return {
          iconBg: 'rgba(99, 102, 241, 0.12)',
          iconBorder: 'rgba(99, 102, 241, 0.3)',
          iconColor: 'var(--accent-secondary, #7c3aed)',
          defaultIcon: <Sparkles size={26} />,
          buttonBg: 'linear-gradient(135deg, var(--accent-primary, #2563eb), var(--accent-secondary, #7c3aed))',
          buttonShadow: '0 4px 14px rgba(124, 58, 237, 0.35)',
        };
      case 'warning':
      default:
        return {
          iconBg: 'rgba(245, 158, 11, 0.12)',
          iconBorder: 'rgba(245, 158, 11, 0.3)',
          iconColor: '#f59e0b',
          defaultIcon: <AlertCircle size={26} />,
          buttonBg: 'linear-gradient(135deg, #f59e0b, #d97706)',
          buttonShadow: '0 4px 14px rgba(245, 158, 11, 0.35)',
        };
    }
  };

  const vStyles = getVariantStyles();

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1150,
        backgroundColor: 'rgba(5, 8, 15, 0.75)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: 'var(--card-bg, #ffffff)',
          color: 'var(--text-primary, #131b2e)',
          borderRadius: 'var(--border-radius-xl, 24px)',
          boxShadow: 'var(--card-shadow), 0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          border: '1px solid var(--card-border, rgba(195, 198, 215, 0.3))',
          padding: '1.75rem',
          position: 'relative',
          textAlign: 'center'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'var(--bg-secondary, rgba(255, 255, 255, 0.08))',
            border: '1px solid var(--card-border, transparent)',
            cursor: 'pointer',
            color: 'var(--text-muted, #737686)',
            padding: '0.4rem',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Close"
        >
          <X size={16} />
        </button>

        <div 
          style={{
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            backgroundColor: vStyles.iconBg,
            border: `1px solid ${vStyles.iconBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem',
            color: vStyles.iconColor
          }}
        >
          {icon || vStyles.defaultIcon}
        </div>

        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
          {title}
        </h3>

        <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '1.75rem' }}>
          {message}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              borderRadius: 'var(--border-radius-md, 10px)',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer'
            }}
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              borderRadius: 'var(--border-radius-md, 10px)',
              background: vStyles.buttonBg,
              color: '#ffffff',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              boxShadow: vStyles.buttonShadow
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
