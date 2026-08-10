'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldCheck, Loader2, Eye, EyeOff, Lock } from 'lucide-react';

function ResetPasswordForm() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('الرابط غير صالح أو مفقود.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('كلمة المرور الجديدة غير متطابقة.');
      return;
    }
    if (newPassword.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل.');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'حدث خطأ غير متوقع');
      }

      setSuccess('تم تغيير كلمة المرور بنجاح. جاري تحويلك لصفحة الدخول...');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء تغيير كلمة المرور');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white dark:bg-neutral-950 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 p-8">
      <div className="flex flex-col items-center mb-8">
        <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
          <Lock className="w-8 h-8 text-blue-600 dark:text-blue-500" />
        </div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2 text-center">تعيين كلمة مرور جديدة</h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-center text-sm leading-relaxed">
          يرجى إدخال كلمة المرور الجديدة وتأكيدها بالأسفل.
        </p>
      </div>

      {success ? (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-600 dark:text-emerald-400 text-sm text-center font-medium">
          {success}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              كلمة المرور الجديدة
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all outline-none text-left"
                dir="ltr"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-3 flex items-center text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              تأكيد كلمة المرور
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all outline-none text-left"
              dir="ltr"
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm text-center font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !token}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors focus:ring-4 focus:ring-blue-600/20 disabled:opacity-70 flex items-center justify-center mt-6"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'حفظ كلمة المرور'}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900 p-4 font-sans" dir="rtl">
      <Suspense fallback={
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      }>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
