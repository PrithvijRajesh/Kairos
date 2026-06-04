// Shared colors and spacing for light / dark themes.
export type ThemeColors = {
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  border: string;
  primary: string;
  primaryText: string;
  accent: string;
  accentSoft: string;
};

export const lightColors: ThemeColors = {
  background: '#f4f6f8',
  surface: '#ffffff',
  text: '#111827',
  textMuted: '#6b7280',
  border: '#e5e7eb',
  primary: '#111827',
  primaryText: '#ffffff',
  accent: '#2563eb',
  accentSoft: '#dbeafe',
};

export const darkColors: ThemeColors = {
  background: '#0f172a',
  surface: '#1e293b',
  text: '#f8fafc',
  textMuted: '#94a3b8',
  border: '#334155',
  primary: '#f8fafc',
  primaryText: '#0f172a',
  accent: '#60a5fa',
  accentSoft: '#1e3a5f',
};

/** @deprecated Use useTheme() from ThemeContext for themed screens */
export const colors = lightColors;

export function getColors(mode: 'light' | 'dark'): ThemeColors {
  return mode === 'dark' ? darkColors : lightColors;
}

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
};
