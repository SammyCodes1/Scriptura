import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Platform, Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  THEMES,
  SPACING,
  FONTS,
  FONT_WEIGHTS,
  FONT_SIZES,
  FONT_SIZE_DEFAULT,
  FONT_SIZE_MIN,
  FONT_SIZE_MAX,
  LINE_HEIGHTS,
  RADII,
  READING_COLUMN,
  TAB_BAR,
  FONT_STYLES,
  DEFAULT_FONT_STYLE,
  type FontStyleId,
  type ThemeName,
  type ThemeColors,
} from '../theme';

const STORAGE_KEY_THEME = '@scriptura_theme';
const STORAGE_KEY_FONT_SIZE = '@scriptura_font_size';
const STORAGE_KEY_FONT_STYLE = '@scriptura_font_style';
// Flag: has the user ever explicitly chosen a theme?
const STORAGE_KEY_THEME_CHOSEN = '@scriptura_theme_chosen';

interface ThemeContextType {
  // Theme
  themeName: ThemeName;
  setThemeName: (name: ThemeName) => void;
  colors: ThemeColors;

  // Typography
  fonts: typeof FONTS;
  fontWeights: typeof FONT_WEIGHTS;
  fontSizes: typeof FONT_SIZES;
  lineHeights: typeof LINE_HEIGHTS;
  fontStyles: typeof FONT_STYLES;

  // Scripture font size (user-adjustable)
  scriptureFontSize: number;
  setScriptureFontSize: (size: number) => void;
  scriptureLineHeight: number;

  // Scripture font style / family (user-adjustable)
  scriptureFontStyle: FontStyleId;
  setScriptureFontStyle: (fontStyle: FontStyleId) => void;
  activeScriptureFontFamily: string | undefined;

  // Layout
  spacing: typeof SPACING;
  radii: typeof RADII;
  readingColumn: typeof READING_COLUMN;
  tabBar: typeof TAB_BAR;
}

const ThemeContext = createContext<ThemeContextType>({} as ThemeContextType);

/** Inject CSS custom properties onto <html data-theme="…"> for web. No-op on native. */
function applyWebTheme(name: ThemeName) {
  if (Platform.OS !== 'web') return;
  if (typeof document === 'undefined') return;
  const tokens = THEMES[name]?.cssTokens;
  if (!tokens) return;

  document.documentElement.setAttribute('data-theme', name);
  const root = document.documentElement.style;
  root.setProperty('--bg', tokens.bg);
  root.setProperty('--surface', tokens.surface);
  root.setProperty('--text-primary', tokens.textPrimary);
  root.setProperty('--text-secondary', tokens.textSecondary);
  root.setProperty('--accent', tokens.accent);
  root.setProperty('--border', tokens.border);
  // Also set body background immediately so there is no white flash between
  // the inline <style> fallback and React rendering.
  document.body.style.backgroundColor = tokens.bg;
}

/** Determine first-visit default: Midnight if prefers dark, else Parchment. */
function getSystemDefault(): ThemeName {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'midnight'
        : 'parchment';
    }
    // Native
    return Appearance.getColorScheme() === 'dark' ? 'midnight' : 'parchment';
  } catch {
    return 'parchment';
  }
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Start with parchment synchronously; async load will correct it before first paint if
  // we already have a stored choice (the web inline script handles the flash prevention).
  const [themeName, setThemeNameState] = useState<ThemeName>('parchment');
  const [scriptureFontSize, setScriptureFontSizeState] = useState<number>(FONT_SIZE_DEFAULT);
  const [scriptureFontStyle, setScriptureFontStyleState] = useState<FontStyleId>(DEFAULT_FONT_STYLE);

  // Load persisted preferences on mount
  useEffect(() => {
    (async () => {
      try {
        const [savedTheme, savedChosen, savedSize, savedStyle] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY_THEME),
          AsyncStorage.getItem(STORAGE_KEY_THEME_CHOSEN),
          AsyncStorage.getItem(STORAGE_KEY_FONT_SIZE),
          AsyncStorage.getItem(STORAGE_KEY_FONT_STYLE),
        ]);

        let resolvedTheme: ThemeName;
        if (savedTheme && savedTheme in THEMES && savedChosen === 'true') {
          // User previously made an explicit choice — always honour it.
          resolvedTheme = savedTheme as ThemeName;
        } else {
          // First visit: use system preference.
          resolvedTheme = getSystemDefault();
        }

        setThemeNameState(resolvedTheme);
        applyWebTheme(resolvedTheme);

        if (savedSize) {
          const parsed = parseInt(savedSize, 10);
          if (parsed >= FONT_SIZE_MIN && parsed <= FONT_SIZE_MAX) {
            setScriptureFontSizeState(parsed);
          }
        }
        if (savedStyle && savedStyle in FONT_STYLES) {
          setScriptureFontStyleState(savedStyle as FontStyleId);
        }
      } catch {
        // Silently use defaults
        applyWebTheme('parchment');
      }
    })();
  }, []);

  const setThemeName = (name: ThemeName) => {
    setThemeNameState(name);
    applyWebTheme(name);
    // Persist both the choice and the "explicitly chosen" flag.
    AsyncStorage.setItem(STORAGE_KEY_THEME, name).catch(() => {});
    AsyncStorage.setItem(STORAGE_KEY_THEME_CHOSEN, 'true').catch(() => {});
  };

  const setScriptureFontSize = (size: number) => {
    const clamped = Math.max(FONT_SIZE_MIN, Math.min(FONT_SIZE_MAX, Math.round(size)));
    setScriptureFontSizeState(clamped);
    AsyncStorage.setItem(STORAGE_KEY_FONT_SIZE, String(clamped)).catch(() => {});
  };

  const setScriptureFontStyle = (fontStyle: FontStyleId) => {
    setScriptureFontStyleState(fontStyle);
    AsyncStorage.setItem(STORAGE_KEY_FONT_STYLE, fontStyle).catch(() => {});
  };

  const colors = THEMES[themeName];
  const scriptureLineHeight = Math.round(scriptureFontSize * LINE_HEIGHTS.scripture);
  const activeScriptureFontFamily = FONT_STYLES[scriptureFontStyle]?.fontFamily || FONTS.serif;

  const value = useMemo<ThemeContextType>(
    () => ({
      themeName,
      setThemeName,
      colors,
      fonts: FONTS,
      fontWeights: FONT_WEIGHTS,
      fontSizes: FONT_SIZES,
      lineHeights: LINE_HEIGHTS,
      fontStyles: FONT_STYLES,
      scriptureFontSize,
      setScriptureFontSize,
      scriptureLineHeight,
      scriptureFontStyle,
      setScriptureFontStyle,
      activeScriptureFontFamily,
      spacing: SPACING,
      radii: RADII,
      readingColumn: READING_COLUMN,
      tabBar: TAB_BAR,
    }),
    [themeName, scriptureFontSize, scriptureFontStyle, colors, scriptureLineHeight, activeScriptureFontFamily],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextType => useContext(ThemeContext);
