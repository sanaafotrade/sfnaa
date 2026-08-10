'use client';

import { useState } from 'react';
import { LogOut, AlertTriangle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/i18n';

export default function LogoutButton() {
  const router = useRouter();
  const { t, lang } = useLanguage();
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout failed:', error);
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex w-full items-center gap-3 px-4 py-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors mt-2"
      >
        <LogOut className="w-5 h-5" />
        {t({ ar: "تسجيل الخروج", en: "Logout" })}
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4 mx-auto">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-center text-neutral-900 dark:text-white mb-2">
                {t({ ar: 'تسجيل الخروج', en: 'Log Out' })}
              </h3>
              <p className="text-center text-neutral-500 dark:text-neutral-400 text-sm">
                {t({ ar: 'هل أنت متأكد أنك تريد تسجيل الخروج من النظام؟', en: 'Are you sure you want to log out from the system?' })}
              </p>
            </div>
            
            <div className="border-t border-neutral-100 dark:border-neutral-800 p-4 flex gap-3 bg-neutral-50 dark:bg-neutral-950/50">
              <button
                onClick={() => setShowModal(false)}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-xl font-medium hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
              >
                {t({ ar: 'إلغاء', en: 'Cancel' })}
              </button>
              <button
                onClick={handleLogout}
                disabled={isLoading}
                className="flex-1 flex justify-center items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors disabled:opacity-70"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {t({ ar: 'نعم، تسجيل الخروج', en: 'Yes, Log out' })}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
