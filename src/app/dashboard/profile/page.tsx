'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck, User, Mail, Lock, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetch('/api/profile')
      .then(res => res.json())
      .then(data => {
        if (!data.error) setUser(data);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('كلمة المرور الجديدة غير متطابقة');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/profile/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword, newPassword })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'حدث خطأ أثناء تغيير كلمة المرور');
      
      toast.success('تم تغيير كلمة المرور بنجاح');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-neutral-50 dark:bg-neutral-900 p-8" dir="rtl">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2 mb-2">
            <User className="w-6 h-6 text-blue-600" />
            الملف الشخصي
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">
            إدارة بياناتك الشخصية وتغيير كلمة المرور الخاصة بك.
          </p>
        </div>

        {/* User Info Card */}
        <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-6 border-b border-neutral-100 dark:border-neutral-800 pb-4">
            البيانات الأساسية
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-2">
                <User className="w-4 h-4" />
                الاسم
              </label>
              <div className="px-4 py-3 bg-neutral-50 dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white">
                {user?.name}
              </div>
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-2">
                <Mail className="w-4 h-4" />
                البريد الإلكتروني
              </label>
              <div className="px-4 py-3 bg-neutral-50 dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white">
                {user?.email}
              </div>
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-2">
                <ShieldCheck className="w-4 h-4" />
                الصلاحية
              </label>
              <div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-xl border border-blue-200 dark:border-blue-800 inline-block font-medium">
                {user?.role === 'OWNER' ? 'المدير العام' : user?.role === 'MANAGER' ? 'مدير' : 'موظف'}
              </div>
            </div>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-6 border-b border-neutral-100 dark:border-neutral-800 pb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-neutral-400" />
            تغيير كلمة المرور
          </h2>
          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                كلمة المرور الحالية
              </label>
              <input
                type="password"
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                كلمة المرور الجديدة
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                تأكيد كلمة المرور الجديدة
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                placeholder="••••••••"
              />
            </div>
            
            <button
              type="submit"
              disabled={isSaving}
              className="mt-6 w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors focus:ring-4 focus:ring-blue-600/20 disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              حفظ كلمة المرور
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
