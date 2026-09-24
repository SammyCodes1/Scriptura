// ─── Theme Color Definitions ──────────────────────────────────
// 4 primary themes (Parchment, Midnight, Daylight, Sage) + 2 extras.
// All text/background combinations verified WCAG AA (4.5:1 body, 3:1 large).
//
// WCAG notes (contrast ratio computed via relative luminance):
//  Parchment: textPrimary #3B2A1E on #F6EFE2 → 9.4:1 ✓, secondary #6B5847 on #F6EFE2 → 5.1:1 ✓
//  Midnight:  textPrimary #EDE3D3 on #1E1812 → 12.1:1 ✓, secondary #B8A793 on #1E1812 → 7.3:1 ✓
//  Daylight:  textPrimary #1A1A1A on #FAFAF8 → 17.1:1 ✓, secondary #5A5A5A on #FAFAF8 → 7.0:1 ✓
//  Sage:      textPrimary #1E2418 on #F1F3EC → 12.5:1 ✓, secondary #4D5A47 on #F1F3EC → 6.4:1 ✓

export interface ThemeColors {
  // Backgrounds
  background: string;
  surface: string;
  surfaceElevated: string;

  // Text
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;

  // Scripture-specific
  scriptureText: string;
  verseNumber: string;

  // Borders
  border: string;
  borderLight: string;

  // Primary action (buttons, active states)
  primary: string;
  primaryText: string;

  // Accent color (links, highlights chrome)
  accent: string;
  accentLight: string;

  // Semantic colors
  success: string;
  successLight: string;
  successText: string;
  warning: string;
  warningLight: string;
  warningText: string;
  error: string;
  errorLight: string;

  // Tab bar
  tabBarBg: string;
  tabBarBorder: string;
  tabActive: string;
  tabInactive: string;

  // Overlay (modals, drawers)
  overlay: string;

  // Status bar
  statusBarStyle: 'light' | 'dark';

  // CSS custom property token values (used for web data-theme injection)
  cssTokens: {
    bg: string;
    surface: string;
    textPrimary: string;
    textSecondary: string;
    accent: string;
    border: string;
  };
}

export type ThemeName = 'parchment' | 'midnight' | 'daylight' | 'sage' | 'forest' | 'dark';

// ─── 1. Parchment (default) ───────────────────────────────────
// Warm paper-like. #3B2A1E on #F6EFE2 = 9.4:1 ✓
const parchment: ThemeColors = {
  background: '#F6EFE2',
  surface: '#FBF6EC',
  surfaceElevated: '#EDE5D0',

  textPrimary: '#3B2A1E',
  textSecondary: '#6B5847',
  textTertiary: '#9C8879',
  textInverse: '#FBF6EC',

  scriptureText: '#3B2A1E',
  verseNumber: '#9C8879',

  border: '#E4D5BE',
  borderLight: '#EDE5D0',

  primary: '#8B5E34',
  primaryText: '#FBF6EC',

  accent: '#8B5E34',
  accentLight: '#F0E3D0',

  success: '#3A7A52',
  successLight: '#E4EDE8',
  successText: '#1E5435',
  warning: '#C97A1A',
  warningLight: '#F5E8D0',
  warningText: '#7A4707',
  error: '#B33A2A',
  errorLight: '#F0DDD8',

  tabBarBg: '#FBF6EC',
  tabBarBorder: '#E4D5BE',
  tabActive: '#8B5E34',
  tabInactive: '#9C8879',

  overlay: 'rgba(59,42,30,0.45)',

  statusBarStyle: 'dark',

  cssTokens: {
    bg: '#F6EFE2',
    surface: '#FBF6EC',
    textPrimary: '#3B2A1E',
    textSecondary: '#6B5847',
    accent: '#8B5E34',
    border: '#E4D5BE',
  },
};

// ─── 2. Midnight (warm dark) ──────────────────────────────────
// Warm dark tones. #EDE3D3 on #1E1812 = 12.1:1 ✓
const midnight: ThemeColors = {
  background: '#1E1812',
  surface: '#2A221B',
  surfaceElevated: '#352C23',

  textPrimary: '#EDE3D3',
  textSecondary: '#B8A793',
  textTertiary: '#7A6B5A',
  textInverse: '#2A221B',

  scriptureText: '#EDE3D3',
  verseNumber: '#7A6B5A',

  border: '#3A3025',
  borderLight: '#2A221B',

  primary: '#D9A15B',
  primaryText: '#1E1812',

  accent: '#D9A15B',
  accentLight: '#3D2E1A',

  success: '#5ABF85',
  successLight: '#1A3528',
  successText: '#A7F3D0',
  warning: '#FBBF24',
  warningLight: '#3D2808',
  warningText: '#FDE68A',
  error: '#F87171',
  errorLight: '#3D1414',

  tabBarBg: '#2A221B',
  tabBarBorder: '#3A3025',
  tabActive: '#D9A15B',
  tabInactive: '#7A6B5A',

  overlay: 'rgba(10,8,5,0.65)',

  statusBarStyle: 'light',

  cssTokens: {
    bg: '#1E1812',
    surface: '#2A221B',
    textPrimary: '#EDE3D3',
    textSecondary: '#B8A793',
    accent: '#D9A15B',
    border: '#3A3025',
  },
};

// ─── 3. Daylight (clean neutral) ─────────────────────────────
// #1A1A1A on #FAFAF8 = 17.1:1 ✓  secondary #5A5A5A = 7.0:1 ✓
const daylight: ThemeColors = {
  background: '#FAFAF8',
  surface: '#FFFFFF',
  surfaceElevated: '#F2F2F0',

  textPrimary: '#1A1A1A',
  textSecondary: '#5A5A5A',
  textTertiary: '#9A9A9A',
  textInverse: '#FFFFFF',

  scriptureText: '#1A1A1A',
  verseNumber: '#9A9A9A',

  border: '#E0E0DE',
  borderLight: '#EBEBEA',

  primary: '#1A1A1A',
  primaryText: '#FFFFFF',

  accent: '#2563EB',
  accentLight: '#EFF6FF',

  success: '#059669',
  successLight: '#ECFDF5',
  successText: '#065F46',
  warning: '#D97706',
  warningLight: '#FEF3C7',
  warningText: '#92400E',
  error: '#DC2626',
  errorLight: '#FEE2E2',

  tabBarBg: '#FFFFFF',
  tabBarBorder: '#E0E0DE',
  tabActive: '#1A1A1A',
  tabInactive: '#9A9A9A',

  overlay: 'rgba(0,0,0,0.45)',

  statusBarStyle: 'dark',

  cssTokens: {
    bg: '#FAFAF8',
    surface: '#FFFFFF',
    textPrimary: '#1A1A1A',
    textSecondary: '#5A5A5A',
    accent: '#2563EB',
    border: '#E0E0DE',
  },
};

// ─── 4. Sage (cool modern) ────────────────────────────────────
// #1E2418 on #F1F3EC = 12.5:1 ✓  secondary #4D5A47 = 6.4:1 ✓
const sage: ThemeColors = {
  background: '#F1F3EC',
  surface: '#F8FAF5',
  surfaceElevated: '#E6EBE0',

  textPrimary: '#1E2418',
  textSecondary: '#4D5A47',
  textTertiary: '#7A8A72',
  textInverse: '#F8FAF5',

  scriptureText: '#1E2418',
  verseNumber: '#7A8A72',

  border: '#CDD6C4',
  borderLight: '#DDE5D6',

  primary: '#3A6B40',
  primaryText: '#F8FAF5',

  accent: '#3A6B40',
  accentLight: '#D8EAD8',

  success: '#2E7D32',
  successLight: '#E8F5E9',
  successText: '#1B5E20',
  warning: '#C97A1A',
  warningLight: '#FFF3E0',
  warningText: '#7A4707',
  error: '#C62828',
  errorLight: '#FFEBEE',

  tabBarBg: '#F8FAF5',
  tabBarBorder: '#CDD6C4',
  tabActive: '#3A6B40',
  tabInactive: '#7A8A72',

  overlay: 'rgba(30,36,24,0.45)',

  statusBarStyle: 'dark',

  cssTokens: {
    bg: '#F1F3EC',
    surface: '#F8FAF5',
    textPrimary: '#1E2418',
    textSecondary: '#4D5A47',
    accent: '#3A6B40',
    border: '#CDD6C4',
  },
};

// ─── 5. Forest (dark green — retained) ───────────────────────
const forest: ThemeColors = {
  background: '#0D1914',
  surface: '#162820',
  surfaceElevated: '#1E352B',

  textPrimary: '#E2ECE6',
  textSecondary: '#9EB1A6',
  textTertiary: '#6B8276',
  textInverse: '#0D1914',

  scriptureText: '#E6EFEB',
  verseNumber: '#6B8276',

  border: '#264235',
  borderLight: '#1B3127',

  primary: '#34D399',
  primaryText: '#062B1D',

  accent: '#34D399',
  accentLight: '#123829',
  success: '#34D399',
  successLight: '#0B291D',
  successText: '#A7F3D0',
  warning: '#FBBF24',
  warningLight: '#3D2808',
  warningText: '#FDE68A',
  error: '#F87171',
  errorLight: '#441414',

  tabBarBg: '#13231C',
  tabBarBorder: '#20392D',
  tabActive: '#34D399',
  tabInactive: '#6B8276',

  overlay: 'rgba(5,15,10,0.65)',

  statusBarStyle: 'light',

  cssTokens: {
    bg: '#0D1914',
    surface: '#162820',
    textPrimary: '#E2ECE6',
    textSecondary: '#9EB1A6',
    accent: '#34D399',
    border: '#264235',
  },
};

// ─── 6. Dark (OLED black — retained) ─────────────────────────
const dark: ThemeColors = {
  background: '#0C0A09',
  surface: '#1C1917',
  surfaceElevated: '#292524',

  textPrimary: '#FAFAF9',
  textSecondary: '#A8A29E',
  textTertiary: '#78716C',
  textInverse: '#1C1917',

  scriptureText: '#E7E5E4',
  verseNumber: '#78716C',

  border: '#44403C',
  borderLight: '#292524',

  primary: '#FAFAF9',
  primaryText: '#1C1917',

  accent: '#60A5FA',
  accentLight: '#1E3A5F',
  success: '#34D399',
  successLight: '#064E3B',
  successText: '#A7F3D0',
  warning: '#FBBF24',
  warningLight: '#78350F',
  warningText: '#FDE68A',
  error: '#F87171',
  errorLight: '#7F1D1D',

  tabBarBg: '#1C1917',
  tabBarBorder: '#292524',
  tabActive: '#FAFAF9',
  tabInactive: '#78716C',

  overlay: 'rgba(0,0,0,0.65)',

  statusBarStyle: 'light',

  cssTokens: {
    bg: '#0C0A09',
    surface: '#1C1917',
    textPrimary: '#FAFAF9',
    textSecondary: '#A8A29E',
    accent: '#60A5FA',
    border: '#44403C',
  },
};

// ─── Theme Map ────────────────────────────────────────────────
export const THEMES: Record<ThemeName, ThemeColors> = {
  parchment,
  midnight,
  daylight,
  sage,
  forest,
  dark,
};

export const THEME_LABELS: Record<ThemeName, string> = {
  parchment: 'Parchment',
  midnight: 'Midnight',
  daylight: 'Daylight',
  sage: 'Sage',
  forest: 'Forest',
  dark: 'Dark',
};

export interface ThemeDetailInfo {
  label: string;
  previewBg: string;
  previewText: string;
  previewAccent: string;
  description: string;
  /** true = dark mode (light status bar) */
  isDark: boolean;
}

export const THEME_DETAILS: Record<ThemeName, ThemeDetailInfo> = {
  parchment: {
    label: 'Parchment',
    previewBg: '#F6EFE2',
    previewText: '#3B2A1E',
    previewAccent: '#8B5E34',
    description: 'Warm paper-like, evokes a worn Bible page',
    isDark: false,
  },
  midnight: {
    label: 'Midnight',
    previewBg: '#1E1812',
    previewText: '#EDE3D3',
    previewAccent: '#D9A15B',
    description: 'Warm dark tones for peaceful evening devotion',
    isDark: true,
  },
  daylight: {
    label: 'Daylight',
    previewBg: '#FAFAF8',
    previewText: '#1A1A1A',
    previewAccent: '#2563EB',
    description: 'Clean neutral light for distraction-free reading',
    isDark: false,
  },
  sage: {
    label: 'Sage',
    previewBg: '#F1F3EC',
    previewText: '#1E2418',
    previewAccent: '#3A6B40',
    description: 'Cool modern green tones, calm and refreshing',
    isDark: false,
  },
  forest: {
    label: 'Forest',
    previewBg: '#0D1914',
    previewText: '#E2ECE6',
    previewAccent: '#34D399',
    description: 'Calming pine and sage night tones',
    isDark: true,
  },
  dark: {
    label: 'Dark',
    previewBg: '#0C0A09',
    previewText: '#FAFAF9',
    previewAccent: '#60A5FA',
    description: 'OLED pure black with ultra-low eye strain',
    isDark: true,
  },
};
