'use client';

import { LanguageProvider } from '@/lib/i18n';
import { ThemeProvider } from '@/lib/theme';
import { Toaster } from 'sonner';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <ThemeProvider>
        {children}
        <Toaster 
          richColors 
          position="bottom-center" 
          toastOptions={{
            style: { 
              padding: '16px', 
              fontSize: '16px', 
              borderRadius: '8px' 
            }
          }}
        />
      </ThemeProvider>
    </LanguageProvider>
  );
}
