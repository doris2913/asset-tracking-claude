'use client';

import { I18nProvider } from '@/i18n';
import { ChartThemeProvider } from '@/contexts/ChartThemeContext';
import { ReactNode } from 'react';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      <ChartThemeProvider>{children}</ChartThemeProvider>
    </I18nProvider>
  );
}
