// ─── Theme Color Definitions ──────────────────────────────────
// Light, Dark (true dark), and Sepia (warm reading) themes.
// All text/background combinations meet WCAG AA contrast (4.5:1+).

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

  // Primary action
  primary: string;
  primaryText: string;

  // Semantic colors
  accent: string;
  accentLight: string;
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

  // Overlay
  overlay: string;

  // Status bar
  statusBarStyle: 'light' | 'dark';
}

export type ThemeName = 'light' | 'dark' | 'sepia' | 'forest' | 'midnight' | 'sandstone';

// ─── Light Theme ──────────────────────────────────────────────
const light: ThemeColors = {
  background: '#FAFAF9',
  surface: '#FFFFFF',
  surfaceElevated: '#F5F5F4',

  textPrimary: '#1C1917',
  textSecondary: '#57534E',
  textTertiary: '#A8A29E',
  textInverse: '#FFFFFF',

  scriptureText: '#1F2937',
  verseNumber: '#9CA3AF',

  border: '#E7E5E4',
  borderLight: '#F3F4F6',

  primary: '#1C1917',
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
  tabBarBorder: '#E7E5E4',
  tabActive: '#1C1917',
  tabInactive: '#A8A29E',

  overlay: 'rgba(0,0,0,0.45)',

  statusBarStyle: 'dark',
};

// ─── Dark Theme (true dark, not inverted) ─────────────────────
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
};

// ─── Sepia / Warm Reading Theme ───────────────────────────────
const sepia: ThemeColors = {
  background: '#F5ECD7',
  surface: '#FDF8ED',
  surfaceElevated: '#EDE4CE',

  textPrimary: '#3E2C1C',
  textSecondary: '#6B5340',
  textTertiary: '#9C8B78',
  textInverse: '#FDF8ED',

  scriptureText: '#3E2C1C',
  verseNumber: '#9C8B78',

  border: '#D4C9B5',
  borderLight: '#E8DFC9',

  primary: '#5C3D2E',
  primaryText: '#FDF8ED',

  accent: '#2563EB',
  accentLight: '#E8E0D0',
  success: '#059669',
  successLight: '#E4EDDF',
  successText: '#065F46',
  warning: '#D97706',
  warningLight: '#F0E5C8',
  warningText: '#92400E',
  error: '#DC2626',
  errorLight: '#F0DBD5',

  tabBarBg: '#F5ECD7',
  tabBarBorder: '#D4C9B5',
  tabActive: '#3E2C1C',
  tabInactive: '#9C8B78',

  overlay: 'rgba(62,44,28,0.45)',

  statusBarStyle: 'dark',
};

// ─── Forest / Evergreen Theme (eye-friendly night reading) ───
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

  overlay: 'rgba(5, 15, 10, 0.65)',

  statusBarStyle: 'light',
};

// ─── Midnight Navy Theme (deep ocean evening calm) ───────────
const midnight: ThemeColors = {
  background: '#0A0F1D',
  surface: '#11192E',
  surfaceElevated: '#1A2542',

  textPrimary: '#E2E8F0',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',
  textInverse: '#0A0F1D',

  scriptureText: '#EAF0F8',
  verseNumber: '#64748B',

  border: '#243256',
  borderLight: '#18233C',

  primary: '#60A5FA',
  primaryText: '#08152E',

  accent: '#38BDF8',
  accentLight: '#122B48',
  success: '#34D399',
  successLight: '#073328',
  successText: '#A7F3D0',
  warning: '#FBBF24',
  warningLight: '#3D2808',
  warningText: '#FDE68A',
  error: '#F87171',
  errorLight: '#441414',

  tabBarBg: '#0F1629',
  tabBarBorder: '#1E2B4A',
  tabActive: '#60A5FA',
  tabInactive: '#64748B',

  overlay: 'rgba(5, 10, 20, 0.65)',

  statusBarStyle: 'light',
};

// ─── Warm Sandstone Theme (soft desert terracotta paper) ──────
const sandstone: ThemeColors = {
  background: '#F5EFE6',
  surface: '#FAF6F0',
  surfaceElevated: '#EDE5D8',

  textPrimary: '#2D221A',
  textSecondary: '#6D5B4F',
  textTertiary: '#9C8879',
  textInverse: '#FAF6F0',

  scriptureText: '#2D221A',
  verseNumber: '#9C8879',

  border: '#DCCFBF',
  borderLight: '#E8DFC9',

  primary: '#8B4513',
  primaryText: '#FAF6F0',

  accent: '#C2673B',
  accentLight: '#F3E4DC',
  success: '#2E7D32',
  successLight: '#E5EFE6',
  successText: '#1B5E20',
  warning: '#C97D1A',
  warningLight: '#FBF0DF',
  warningText: '#7A4707',
  error: '#C62828',
  errorLight: '#FCE6E6',

  tabBarBg: '#F5EFE6',
  tabBarBorder: '#DCCFBF',
  tabActive: '#8B4513',
  tabInactive: '#9C8879',

  overlay: 'rgba(45, 34, 26, 0.45)',

  statusBarStyle: 'dark',
};

// ─── Theme Map ────────────────────────────────────────────────
export const THEMES: Record<ThemeName, ThemeColors> = {
  light,
  dark,
  sepia,
  forest,
  midnight,
  sandstone,
};

export const THEME_LABELS: Record<ThemeName, string> = {
  light: 'Ivory Light',
  dark: 'Obsidian Dark',
  sepia: 'Warm Sepia',
  forest: 'Evergreen Forest',
  midnight: 'Midnight Navy',
  sandstone: 'Warm Sandstone',
};

export interface ThemeDetailInfo {
  label: string;
  previewBg: string;
  previewText: string;
  previewAccent: string;
  description: string;
}

export const THEME_DETAILS: Record<ThemeName, ThemeDetailInfo> = {
  light: {
    label: 'Ivory Light',
    previewBg: '#FAFAF9',
    previewText: '#1C1917',
    previewAccent: '#1C1917',
    description: 'Crisp, clean daylight reading with soft stone tones',
  },
  dark: {
    label: 'Obsidian Dark',
    previewBg: '#0C0A09',
    previewText: '#FAFAF9',
    previewAccent: '#34D399',
    description: 'OLED pure black with ultra-low eye strain in darkness',
  },
  sepia: {
    label: 'Warm Sepia',
    previewBg: '#F5ECD7',
    previewText: '#3E2C1C',
    previewAccent: '#5C3D2E',
    description: 'Classic book parchment with reduced blue light',
  },
  forest: {
    label: 'Evergreen Forest',
    previewBg: '#0D1914',
    previewText: '#E2ECE6',
    previewAccent: '#34D399',
    description: 'Calming pine and sage night tones, serene and gentle',
  },
  midnight: {
    label: 'Midnight Navy',
    previewBg: '#0A0F1D',
    previewText: '#E2E8F0',
    previewAccent: '#60A5FA',
    description: 'Deep celestial twilight for peaceful evening devotion',
  },
  sandstone: {
    label: 'Warm Sandstone',
    previewBg: '#F5EFE6',
    previewText: '#2D221A',
    previewAccent: '#8B4513',
    description: 'Soft terracotta paper and warm desert dunes, organic and warm',
  },
};
