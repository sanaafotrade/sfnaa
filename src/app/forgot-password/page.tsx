'use client';

import { useState } from 'react';
import { ShieldCheck, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'حدث خطأ غير متوقع');
      }

      setSuccess('تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني بنجاح. يرجى مراجعة صندوق الوارد الخاص بك.');
      setEmail('');
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء إرسال الرابط');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900 p-4 font-sans" dir="rtl">
      <div className="w-full max-w-md bg-white dark:bg-neutral-950 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 p-8">
        
        {/* Back Link */}
        <a href="/login" className="inline-flex items-center gap-2 text-sm font-medium text-neutral-500 hover:text-blue-600 transition-colors mb-6">
          <ArrowRight className="w-4 h-4" />
          العودة لتسجيل الدخول
        </a>

        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
            <ShieldCheck className="w-8 h-8 text-blue-600 dark:text-blue-500" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2 text-center">نسيت كلمة المرور؟</h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-center text-sm leading-relaxed">
            أدخل بريدك الإلكتروني المسجل لدينا وسنرسل لك رابطاً لإعادة تعيين كلمة المرور.
          </p>
        </div>

        {success ? (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-6 flex flex-col items-center text-center space-y-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
            <p className="text-emerald-700 dark:text-emerald-400 font-medium">
              {success}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                البريد الإلكتروني
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all outline-none"
                placeholder="example@sfnaa.com"
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
              disabled={isLoading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors focus:ring-4 focus:ring-blue-600/20 disabled:opacity-70 flex items-center justify-center mt-6"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'إرسال رابط الاستعادة'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
