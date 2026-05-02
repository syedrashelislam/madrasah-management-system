/**
 * showToast — Beautiful, globally reusable custom toast notification system.
 *
 * Usage from any file:
 *   import { showToast } from '@/lib/showToast';
 *
 *   showToast.success('ছাত্র সফলভাবে যোগ হয়েছে');
 *   showToast.error('ডাটা সংরক্ষণ ব্যর্থ হয়েছে');
 *   showToast.warning('এই মাসের ফি বাকি আছে');
 *   showToast.info('সিস্টেম আপডেট হচ্ছে...');
 *
 * Supports optional description:
 *   showToast.success('সফল!', { description: 'ছাত্র তালিকায় যোগ হয়েছে' });
 *
 * CRUD helpers:
 *   showToast.added('ছাত্র');       → "ছাত্র সফলভাবে যোগ হয়েছে"
 *   showToast.updated('ফি রেকর্ড'); → "ফি রেকর্ড সফলভাবে আপডেট হয়েছে"
 *   showToast.deleted('ক্লাস');     → "ক্লাস সফলভাবে মুছে ফেলা হয়েছে"
 */

import { toast } from 'sonner';

// ----- Types -----
type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface ToastOptions {
  description?: string;
  duration?: number;
  /** Optional action button */
  action?: { label: string; onClick: () => void };
}

// ----- Config per variant -----
const VARIANT_CONFIG: Record<ToastVariant, {
  icon: string;
  bg: string;
  border: string;
  accent: string;
  glow: string;
  label: string;
}> = {
  success: {
    icon: '✅',
    bg: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(6,78,59,0.25) 100%)',
    border: 'rgba(16,185,129,0.4)',
    accent: '#10b981',
    glow: 'rgba(16,185,129,0.15)',
    label: 'সফল',
  },
  error: {
    icon: '❌',
    bg: 'linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(127,29,29,0.25) 100%)',
    border: 'rgba(239,68,68,0.4)',
    accent: '#ef4444',
    glow: 'rgba(239,68,68,0.15)',
    label: 'ত্রুটি',
  },
  warning: {
    icon: '⚠️',
    bg: 'linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(120,53,15,0.25) 100%)',
    border: 'rgba(245,158,11,0.4)',
    accent: '#f59e0b',
    glow: 'rgba(245,158,11,0.15)',
    label: 'সতর্কতা',
  },
  info: {
    icon: 'ℹ️',
    bg: 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(30,58,138,0.25) 100%)',
    border: 'rgba(59,130,246,0.4)',
    accent: '#3b82f6',
    glow: 'rgba(59,130,246,0.15)',
    label: 'তথ্য',
  },
};

// ----- Core renderer -----
function fireToast(variant: ToastVariant, message: string, opts?: ToastOptions) {
  const cfg = VARIANT_CONFIG[variant];
  const duration = opts?.duration ?? (variant === 'error' ? 5000 : 3500);

  toast.custom(
    (id) => (
      <div
        className="custom-toast-root"
        style={{
          background: cfg.bg,
          borderLeft: `4px solid ${cfg.accent}`,
          border: `1px solid ${cfg.border}`,
          borderLeftWidth: 4,
          borderRadius: 12,
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
          minWidth: 320,
          maxWidth: 420,
          boxShadow: `0 8px 32px ${cfg.glow}, 0 2px 8px rgba(0,0,0,0.3)`,
          backdropFilter: 'blur(12px)',
          position: 'relative',
          overflow: 'hidden',
          cursor: 'default',
        }}
      >
        {/* Accent glow line at top */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg, transparent, ${cfg.accent}, transparent)`,
          opacity: 0.6,
        }} />

        {/* Icon */}
        <div style={{
          fontSize: 22,
          lineHeight: 1,
          flexShrink: 0,
          marginTop: 1,
          filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))',
        }}>
          {cfg.icon}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: 14,
            fontWeight: 700,
            color: 'rgba(255,255,255,0.95)',
            margin: 0,
            lineHeight: 1.4,
            letterSpacing: 0.2,
          }}>
            {message}
          </p>
          {opts?.description && (
            <p style={{
              fontSize: 12,
              color: 'rgba(255,255,255,0.55)',
              margin: '4px 0 0',
              lineHeight: 1.4,
            }}>
              {opts.description}
            </p>
          )}
          {opts?.action && (
            <button
              onClick={() => { opts.action!.onClick(); toast.dismiss(id); }}
              style={{
                marginTop: 8,
                fontSize: 12,
                fontWeight: 700,
                color: cfg.accent,
                background: `${cfg.accent}15`,
                border: `1px solid ${cfg.accent}40`,
                borderRadius: 6,
                padding: '4px 12px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {opts.action.label}
            </button>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={() => toast.dismiss(id)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'rgba(255,255,255,0.35)',
            fontSize: 16,
            cursor: 'pointer',
            padding: '2px 4px',
            lineHeight: 1,
            transition: 'color 0.2s',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; }}
          aria-label="বন্ধ করুন"
        >
          ✕
        </button>

        {/* Progress bar (auto-dismiss indicator) */}
        <div style={{
          position: 'absolute',
          bottom: 0, left: 0,
          height: 2,
          background: cfg.accent,
          opacity: 0.5,
          animation: `toastProgress ${duration}ms linear forwards`,
          borderRadius: '0 0 0 12px',
        }} />
      </div>
    ),
    { duration, position: 'top-right' },
  );
}

// ----- Public API -----
export const showToast = {
  /** Green success toast */
  success: (message: string, opts?: ToastOptions) => fireToast('success', message, opts),

  /** Red error toast */
  error: (message: string, opts?: ToastOptions) => fireToast('error', message, opts),

  /** Orange warning toast */
  warning: (message: string, opts?: ToastOptions) => fireToast('warning', message, opts),

  /** Blue info toast */
  info: (message: string, opts?: ToastOptions) => fireToast('info', message, opts),

  // ----- CRUD shorthand helpers -----

  /** "X সফলভাবে যোগ হয়েছে" */
  added: (entity: string, opts?: ToastOptions) =>
    fireToast('success', `${entity} সফলভাবে যোগ হয়েছে`, opts),

  /** "X সফলভাবে আপডেট হয়েছে" */
  updated: (entity: string, opts?: ToastOptions) =>
    fireToast('success', `${entity} সফলভাবে আপডেট হয়েছে`, opts),

  /** "X সফলভাবে মুছে ফেলা হয়েছে" */
  deleted: (entity: string, opts?: ToastOptions) =>
    fireToast('success', `${entity} সফলভাবে মুছে ফেলা হয়েছে`, opts),
};
