import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
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

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeName, setThemeNameState] = useState<ThemeName>('light');
  const [scriptureFontSize, setScriptureFontSizeState] = useState<number>(FONT_SIZE_DEFAULT);
  const [scriptureFontStyle, setScriptureFontStyleState] = useState<FontStyleId>(DEFAULT_FONT_STYLE);

  // Load persisted preferences on mount
  useEffect(() => {
    (async () => {
      try {
        const [savedTheme, savedSize, savedStyle] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY_THEME),
          AsyncStorage.getItem(STORAGE_KEY_FONT_SIZE),
          AsyncStorage.getItem(STORAGE_KEY_FONT_STYLE),
        ]);
        if (savedTheme && savedTheme in THEMES) {
          setThemeNameState(savedTheme as ThemeName);
        }
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
      }
    })();
  }, []);

  const setThemeName = (name: ThemeName) => {
    setThemeNameState(name);
    AsyncStorage.setItem(STORAGE_KEY_THEME, name).catch(() => {});
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
