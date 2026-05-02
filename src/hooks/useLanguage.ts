// ============================================================
// useLanguage.ts — Language Context & Hook
// ফাইলটি src/hooks/ ফোল্ডারে রাখুন
// ============================================================
// ব্যবহার:
//   const { lang, setLang, t } = useLanguage();
//   <p>{t('common', 'save')}</p>
// ============================================================

import { useState, useCallback } from 'react';
import { type Language, type TranslationKey, translations } from '@/lib/i18n';

const STORAGE_KEY = 'app_language';

function getInitialLang(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'bn' || stored === 'en') return stored;
  } catch { /* ignore */ }
  return 'bn'; // Default: Bangla
}

// Singleton state so all components share the same language
let _lang: Language = getInitialLang();
const _listeners = new Set<() => void>();

function setGlobalLang(lang: Language) {
  _lang = lang;
  try { localStorage.setItem(STORAGE_KEY, lang); } catch { /* ignore */ }
  _listeners.forEach(fn => fn());
}

export function useLanguage() {
  const [, forceUpdate] = useState(0);

  const subscribe = useCallback(() => {
    const fn = () => forceUpdate(n => n + 1);
    _listeners.add(fn);
    return () => _listeners.delete(fn);
  }, []);

  // Subscribe on first render
  useState(() => {
    const cleanup = subscribe();
    return cleanup;
  });

  const translate = useCallback(
    (section: TranslationKey, key: string): string => {
      const sec = translations[section] as Record<string, { bn: string; en: string }>;
      return sec?.[key]?.[_lang] ?? key;
    },
    []
  );

  return {
    lang: _lang as Language,
    setLang: setGlobalLang,
    t: translate,
    isBn: _lang === 'bn',
    isEn: _lang === 'en',
  };
}

// ── Language Toggle Button Component (TSX safe) ────────────
// এটা যেকোনো জায়গায় import করে ব্যবহার করা যাবে
export function LanguageToggleButton() {
  const { lang, setLang } = useLanguage();
  return `${lang === 'bn' ? 'EN' : 'বাং'}`;
}
