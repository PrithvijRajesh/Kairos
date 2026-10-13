// Kairos — quiet athletic UI. Space and type over chrome.
export type ThemeColors = {
  background: string;
  backgroundAlt: string;
  surface: string;
  surfaceRaised: string;
  text: string;
  textMuted: string;
  textSoft: string;
  border: string;
  borderStrong: string;
  primary: string;
  primaryText: string;
  accent: string;
  accentSoft: string;
  accentMuted: string;
  success: string;
  warning: string;
  danger: string;
  overlay: string;
  ink: string;
  paper: string;
};

export const lightColors: ThemeColors = {
  background: '#F3F1EC',
  backgroundAlt: '#E8E5DE',
  surface: '#FAF9F6',
  surfaceRaised: '#FFFFFF',
  text: '#161614',
  textMuted: '#5C5B56',
  textSoft: '#8E8C85',
  border: '#D9D6CE',
  borderStrong: '#B8B5AB',
  primary: '#161614',
  primaryText: '#F3F1EC',
  accent: '#0D7377',
  accentSoft: '#D7EBEB',
  accentMuted: '#0A5A5D',
  success: '#2F6B4F',
  warning: '#9A6B1F',
  danger: '#B42318',
  overlay: 'rgba(22, 22, 20, 0.04)',
  ink: '#161614',
  paper: '#F3F1EC',
};

export const darkColors: ThemeColors = {
  background: '#121211',
  backgroundAlt: '#1A1A18',
  surface: '#1C1C1A',
  surfaceRaised: '#242422',
  text: '#F3F1EC',
  textMuted: '#A8A69E',
  textSoft: '#6F6D66',
  border: '#2E2E2B',
  borderStrong: '#3F3F3A',
  primary: '#F3F1EC',
  primaryText: '#121211',
  accent: '#3DB8BC',
  accentSoft: '#1A3334',
  accentMuted: '#7AD4D7',
  success: '#4ADE80',
  warning: '#FBBF24',
  danger: '#F87171',
  overlay: 'rgba(243, 241, 236, 0.05)',
  ink: '#F3F1EC',
  paper: '#121211',
};

/** @deprecated Use useTheme() */
export const colors = lightColors;

export function getColors(mode: 'light' | 'dark'): ThemeColors {
  return mode === 'dark' ? darkColors : lightColors;
}

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
};

export const type = {
  brand: {
    fontSize: 28,
    fontWeight: '600' as const,
    letterSpacing: -0.6,
    lineHeight: 32,
  },
  display: {
    fontSize: 28,
    fontWeight: '600' as const,
    letterSpacing: -0.6,
    lineHeight: 34,
  },
  title: {
    fontSize: 18,
    fontWeight: '600' as const,
    letterSpacing: -0.2,
    lineHeight: 24,
  },
  section: {
    fontSize: 13,
    fontWeight: '500' as const,
    letterSpacing: 0,
  },
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 22,
  },
  bodyStrong: {
    fontSize: 15,
    fontWeight: '600' as const,
    lineHeight: 22,
  },
  caption: {
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 18,
  },
  micro: {
    fontSize: 12,
    fontWeight: '500' as const,
    letterSpacing: 0.2,
  },
  mono: {
    fontSize: 26,
    fontWeight: '600' as const,
    letterSpacing: -0.4,
    fontVariant: ['tabular-nums'] as ('tabular-nums')[],
  },
};
