import React, { createContext, useContext } from 'react';
import { colors, ColorScheme } from './colors';
import { spacing, radius } from './spacing';
import { typography } from './typography';
import { useSettingsStore } from '../store/settingsStore';

export type ThemeColors = typeof colors.dark;

export interface Theme {
  colors: ThemeColors & { brand: typeof colors };
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  scheme: ColorScheme;
  isDark: boolean;
}

function buildTheme(scheme: ColorScheme): Theme {
  const schemeColors = scheme === 'dark' ? colors.dark : colors.light;
  return {
    colors: { ...schemeColors, brand: colors },
    spacing,
    radius,
    typography,
    scheme,
    isDark: scheme === 'dark',
  };
}

const ThemeContext = createContext<Theme>(buildTheme('dark'));

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = useSettingsStore(s => s.theme);
  const value = buildTheme(theme as ColorScheme);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): Theme => useContext(ThemeContext);
