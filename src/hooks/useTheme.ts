import { useEffect } from 'react';

// Light theme সম্পূর্ণ বাদ — সর্বদা dark theme
export type AppTheme = 'default';

export interface ThemeCustomization {
  accentColor: string;
  borderRadius: number;
  shadowIntensity: number;
}

const CUSTOM_KEY = 'app-theme-custom';

export const ACCENT_PRESETS = [
  { hex: '#d4af37', label: 'সোনালি' },
  { hex: '#10B981', label: 'সবুজ' },
  { hex: '#3b82f6', label: 'নীল' },
  { hex: '#a855f7', label: 'বেগুনি' },
  { hex: '#f97316', label: 'কমলা' },
  { hex: '#ec4899', label: 'গোলাপি' },
  { hex: '#14b8a6', label: 'টিল' },
  { hex: '#ef4444', label: 'লাল' },
] as const;

const DEFAULT_CUSTOMIZATION: ThemeCustomization = {
  accentColor: '#d4af37',
  borderRadius: 12,
  shadowIntensity: 1,
};

function getStoredCustomization(): ThemeCustomization {
  try {
    const raw = localStorage.getItem(CUSTOM_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      return {
        accentColor: p.accentColor || DEFAULT_CUSTOMIZATION.accentColor,
        borderRadius: typeof p.borderRadius === 'number' ? p.borderRadius : DEFAULT_CUSTOMIZATION.borderRadius,
        shadowIntensity: typeof p.shadowIntensity === 'number' ? p.shadowIntensity : DEFAULT_CUSTOMIZATION.shadowIntensity,
      };
    }
  } catch { /* */ }
  return { ...DEFAULT_CUSTOMIZATION };
}

export function useTheme() {
  // Always dark — ensure theme-madrasa class is never applied
  useEffect(() => {
    document.documentElement.classList.remove('theme-madrasa');
    localStorage.setItem('app-theme', 'default');
  }, []);

  // No-op setTheme — theme is always dark
  const setTheme = (_: AppTheme) => {};

  const customization = getStoredCustomization();
  const setCustomization = (_: Partial<ThemeCustomization>) => {};
  const resetCustomization = () => {};

  return {
    theme: 'default' as AppTheme,
    setTheme,
    customization,
    setCustomization,
    resetCustomization,
  };
}
