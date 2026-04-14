'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ChartColorTheme } from '@/types';
import { getChartTheme, ChartTheme, CHART_THEMES } from '@/config/chartThemes';

interface ChartThemeContextType {
  theme: ChartTheme;
  themeId: ChartColorTheme;
  setThemeId: (id: ChartColorTheme) => void;
}

const ChartThemeContext = createContext<ChartThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'asset-tracker-chart-theme';

interface ChartThemeProviderProps {
  children: ReactNode;
  initialTheme?: ChartColorTheme;
}

export function ChartThemeProvider({ children, initialTheme }: ChartThemeProviderProps) {
  const [themeId, setThemeIdState] = useState<ChartColorTheme>(initialTheme || 'default');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load theme from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && stored in CHART_THEMES) {
        setThemeIdState(stored as ChartColorTheme);
      }
      setIsLoaded(true);
    }
  }, []);

  const setThemeId = (id: ChartColorTheme) => {
    setThemeIdState(id);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, id);
    }
  };

  const theme = getChartTheme(themeId);

  // Don't render until loaded to prevent hydration mismatch
  if (!isLoaded) {
    return <>{children}</>;
  }

  return (
    <ChartThemeContext.Provider value={{ theme, themeId, setThemeId }}>
      {children}
    </ChartThemeContext.Provider>
  );
}

export function useChartTheme(): ChartThemeContextType {
  const context = useContext(ChartThemeContext);
  if (context === undefined) {
    // Return default theme if not in provider
    return {
      theme: CHART_THEMES.default,
      themeId: 'default',
      setThemeId: () => {},
    };
  }
  return context;
}
