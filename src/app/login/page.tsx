'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Loader2, Eye, EyeOff, Globe } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';

export default function LoginPage() {
  const { lang, t, setLanguage } = useLanguage();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginId, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t({ ar: 'بيانات الدخول غير صحيحة', en: 'Invalid credentials' }));
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message || t({ ar: 'بيانات الدخول غير صحيحة', en: 'Invalid credentials' }));
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 dark:bg-neutral-900 p-4 font-sans relative" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Language Switcher */}
      <div className="absolute top-6 left-6 md:top-8 md:left-8">
        <button
          onClick={() => setLanguage(lang === 'ar' ? 'en' : 'ar')}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors shadow-sm"
        >
          <Globe className="w-4 h-4" />
          {lang === 'ar' ? 'English' : 'العربية'}
        </button>
      </div>

      <div className="w-full max-w-md bg-white dark:bg-neutral-950 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
            <ShieldCheck className="w-8 h-8 text-blue-600 dark:text-blue-500" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
            {t({ ar: 'تسجيل الدخول', en: 'Login' })}
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-center">
            {t({ ar: 'يرجى إدخال بيانات الاعتماد للوصول إلى لوحة التحكم', en: 'Please enter your credentials to access the dashboard' })}
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {t({ ar: 'البريد الإلكتروني أو رقم الجوال', en: 'Email or Phone Number' })}
            </label>
            <input
              type="text"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all outline-none"
              dir="ltr"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {t({ ar: 'كلمة المرور', en: 'Password' })}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium pl-12"
                required
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            
            <div className="mt-2 text-right">
              <a href="/forgot-password" className="text-sm font-medium text-blue-600 dark:text-blue-500 hover:underline">
                {t({ ar: 'نسيت كلمة المرور؟', en: 'Forgot password?' })}
              </a>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm text-center font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-70 flex items-center justify-center gap-2 mt-4"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            {t({ ar: 'دخول', en: 'Login' })}
          </button>
        </form>
      </div>
    </div>
  );
}
