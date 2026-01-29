'use client';

import { I18nProvider } from '@/i18n';
import { ChartThemeProvider } from '@/contexts/ChartThemeContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ReactNode } from 'react';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <I18nProvider>
        <ChartThemeProvider>{children}</ChartThemeProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
