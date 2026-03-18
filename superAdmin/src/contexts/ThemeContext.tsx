import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { darkTheme, lightTheme, ThemeColors } from '../constants/theme';

interface ThemeContextValue {
  isDark: boolean;
  toggleTheme: () => void;
  colors: ThemeColors;
  spacing: typeof darkTheme.spacing;
  borderRadius: typeof darkTheme.borderRadius;
  typography: typeof darkTheme.typography;
}

const ThemeContext = createContext<ThemeContextValue>({
  isDark: true,
  toggleTheme: () => {},
  colors: darkTheme.colors,
  spacing: darkTheme.spacing,
  borderRadius: darkTheme.borderRadius,
  typography: darkTheme.typography,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(true);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => !prev);
  }, []);

  const value = useMemo(() => {
    const currentTheme = isDark ? darkTheme : lightTheme;
    return {
      isDark,
      toggleTheme,
      colors: currentTheme.colors,
      spacing: currentTheme.spacing,
      borderRadius: currentTheme.borderRadius,
      typography: currentTheme.typography,
    };
  }, [isDark, toggleTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
