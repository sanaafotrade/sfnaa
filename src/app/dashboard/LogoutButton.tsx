'use client';

import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/i18n';

export default function LogoutButton() {
  const router = useRouter();
  const { t } = useLanguage();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="flex w-full items-center gap-3 px-4 py-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors mt-2"
    >
      <LogOut className="w-5 h-5" />
      {t({ ar: "تسجيل الخروج", en: "Logout" })}
    </button>
  );
}
