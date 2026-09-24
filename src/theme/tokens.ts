import { Platform } from 'react-native';

// ─── Spacing Scale ────────────────────────────────────────────
// Consistent 4-based scale used everywhere: margins, padding, gaps.
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

// ─── Typography ───────────────────────────────────────────────
// Serif for scripture body text (comfort over personality).
// System sans-serif for UI chrome (clean, native-feeling).
export const FONTS = {
  serif: Platform.select({
    ios: 'Georgia',
    android: 'serif',
    default: 'Georgia',
  }),
  sans: Platform.select({
    ios: undefined, // System (San Francisco)
    android: undefined, // System (Roboto)
    default: undefined,
  }),
} as const;

export type FontStyleId = 'georgia' | 'palatino' | 'baskerville' | 'times' | 'system';

export interface FontStyleOption {
  id: FontStyleId;
  label: string;
  category: 'Serif' | 'Sans';
  fontFamily: string | undefined;
}

export const FONT_STYLES: Record<FontStyleId, FontStyleOption> = {
  georgia: {
    id: 'georgia',
    label: 'Georgia',
    category: 'Serif',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' }),
  },
  palatino: {
    id: 'palatino',
    label: 'Palatino',
    category: 'Serif',
    fontFamily: Platform.select({ ios: 'Palatino', android: 'serif', default: 'Palatino, Georgia, serif' }),
  },
  baskerville: {
    id: 'baskerville',
    label: 'Baskerville',
    category: 'Serif',
    fontFamily: Platform.select({ ios: 'Baskerville', android: 'serif', default: 'Baskerville, Georgia, serif' }),
  },
  times: {
    id: 'times',
    label: 'Times New Roman',
    category: 'Serif',
    fontFamily: Platform.select({ ios: 'Times New Roman', android: 'serif', default: 'Times New Roman, Times, serif' }),
  },
  system: {
    id: 'system',
    label: 'Modern Sans',
    category: 'Sans',
    fontFamily: Platform.select({ ios: undefined, android: 'sans-serif', default: undefined }),
  },
};

export const DEFAULT_FONT_STYLE: FontStyleId = 'georgia';

// Font weight names → React Native numeric weights
export const FONT_WEIGHTS = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

// ─── Font Size Scale ──────────────────────────────────────────
// Scripture body minimum is 17px. Slider adjusts from 15–28.
export const FONT_SIZES = {
  caption: 11,
  small: 12,
  body: 14,
  bodyLarge: 16,
  scripture: 17, // baseline; user-adjustable via slider
  h3: 18,
  h2: 22,
  h1: 26,
  display: 32,
  // Aliases (spacing-style shorthand used across screens)
  xs: 11,   // = caption
  sm: 12,   // = small
  md: 14,   // = body
  lg: 16,   // = bodyLarge
  xl: 22,   // = h2
  xxl: 26,  // = h1
} as const;

export const FONT_SIZE_MIN = 15;
export const FONT_SIZE_MAX = 28;
export const FONT_SIZE_DEFAULT = 17;

// ─── Line Heights ─────────────────────────────────────────────
// Scripture text gets 1.5–1.7 (generous reading comfort).
export const LINE_HEIGHTS = {
  tight: 1.3,
  normal: 1.5,
  scripture: 1.65,
  loose: 1.8,
} as const;

// ─── Border Radii ─────────────────────────────────────────────
export const RADII = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  pill: 20,
  full: 9999,
} as const;

// ─── Reading Column ───────────────────────────────────────────
// Constrain body text to ~50–70 characters on phone width.
// On a 375pt phone at 17px, ~22 chars/line at full width.
// Horizontal padding of 24–32px per side achieves the target.
export const READING_COLUMN = {
  paddingHorizontal: SPACING.xl, // 24px each side
  maxWidth: 600, // for tablets/web
} as const;

// ─── Tab Bar ──────────────────────────────────────────────────
export const TAB_BAR = {
  height: 56,
  iconSize: 22,
  labelSize: 10,
  paddingBottom: 4,
  paddingTop: 6,
} as const;
