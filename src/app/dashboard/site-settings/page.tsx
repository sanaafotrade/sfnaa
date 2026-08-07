'use client';

import { useState, useEffect } from 'react';
import { Save, Globe } from 'lucide-react';

export default function SiteSettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/site-settings')
      .then(res => res.json())
      .then(data => {
        setSettings(data);
        setLoading(false);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const res = await fetch('/api/site-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      
      if (res.ok) {
        setMessage('تم حفظ الإعدادات بنجاح');
      } else {
        setMessage('حدث خطأ أثناء الحفظ');
      }
    } catch (err) {
      setMessage('حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setSettings({ ...settings, [e.target.name]: e.target.value });
  };

  if (loading) return <div className="p-8 text-center">جاري التحميل...</div>;

  return (
    <div className="flex flex-col h-full bg-neutral-50 dark:bg-neutral-900">
      <header className="bg-white dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 p-6">
        <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
          <Globe className="w-6 h-6 text-blue-600" />
          إعدادات الموقع
        </h2>
        <p className="text-neutral-500 mt-1">إدارة نصوص وصور الصفحة الرئيسية</p>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8 pb-12">
          {message && (
            <div className={`p-4 rounded-lg ${message.includes('بنجاح') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {message}
            </div>
          )}

          <section className="bg-white dark:bg-neutral-950 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <h3 className="text-lg font-bold mb-4 border-b border-neutral-100 dark:border-neutral-800 pb-3">القسم الرئيسي (Hero)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">العنوان (عربي)</label>
                <input type="text" name="heroTitleAr" value={settings.heroTitleAr} onChange={handleChange} className="w-full bg-neutral-50 dark:bg-neutral-900 border rounded-lg px-4 py-2" />
              </div>
              <div>
                <label className="block text-sm mb-1">العنوان (إنجليزي)</label>
                <input type="text" name="heroTitleEn" value={settings.heroTitleEn} onChange={handleChange} className="w-full bg-neutral-50 dark:bg-neutral-900 border rounded-lg px-4 py-2 text-left" dir="ltr" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm mb-1">الوصف (عربي)</label>
                <textarea name="heroDescAr" value={settings.heroDescAr} onChange={handleChange} rows={3} className="w-full bg-neutral-50 dark:bg-neutral-900 border rounded-lg px-4 py-2" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm mb-1">الوصف (إنجليزي)</label>
                <textarea name="heroDescEn" value={settings.heroDescEn} onChange={handleChange} rows={3} className="w-full bg-neutral-50 dark:bg-neutral-900 border rounded-lg px-4 py-2 text-left" dir="ltr" />
              </div>
            </div>
          </section>

          <section className="bg-white dark:bg-neutral-950 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <h3 className="text-lg font-bold mb-4 border-b border-neutral-100 dark:border-neutral-800 pb-3">قسم من نحن</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">العنوان (عربي)</label>
                <input type="text" name="aboutTitleAr" value={settings.aboutTitleAr} onChange={handleChange} className="w-full bg-neutral-50 dark:bg-neutral-900 border rounded-lg px-4 py-2" />
              </div>
              <div>
                <label className="block text-sm mb-1">العنوان (إنجليزي)</label>
                <input type="text" name="aboutTitleEn" value={settings.aboutTitleEn} onChange={handleChange} className="w-full bg-neutral-50 dark:bg-neutral-900 border rounded-lg px-4 py-2 text-left" dir="ltr" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm mb-1">الوصف (عربي)</label>
                <textarea name="aboutDescAr" value={settings.aboutDescAr} onChange={handleChange} rows={4} className="w-full bg-neutral-50 dark:bg-neutral-900 border rounded-lg px-4 py-2" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm mb-1">الوصف (إنجليزي)</label>
                <textarea name="aboutDescEn" value={settings.aboutDescEn} onChange={handleChange} rows={4} className="w-full bg-neutral-50 dark:bg-neutral-900 border rounded-lg px-4 py-2 text-left" dir="ltr" />
              </div>
            </div>
          </section>

          <section className="bg-white dark:bg-neutral-950 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <h3 className="text-lg font-bold mb-4 border-b border-neutral-100 dark:border-neutral-800 pb-3">الإحصائيات ومعلومات التواصل</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm mb-1">عدد العملاء</label>
                <input type="text" name="statsClients" value={settings.statsClients} onChange={handleChange} className="w-full bg-neutral-50 dark:bg-neutral-900 border rounded-lg px-4 py-2" />
              </div>
              <div>
                <label className="block text-sm mb-1">سنوات الخبرة</label>
                <input type="text" name="statsYears" value={settings.statsYears} onChange={handleChange} className="w-full bg-neutral-50 dark:bg-neutral-900 border rounded-lg px-4 py-2" />
              </div>
              <div>
                <label className="block text-sm mb-1">الدول</label>
                <input type="text" name="statsCountries" value={settings.statsCountries} onChange={handleChange} className="w-full bg-neutral-50 dark:bg-neutral-900 border rounded-lg px-4 py-2" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">البريد الإلكتروني للتواصل</label>
                <input type="email" name="contactEmail" value={settings.contactEmail} onChange={handleChange} className="w-full bg-neutral-50 dark:bg-neutral-900 border rounded-lg px-4 py-2 text-left" dir="ltr" />
              </div>
              <div>
                <label className="block text-sm mb-1">رقم الهاتف</label>
                <input type="text" name="contactPhone" value={settings.contactPhone} onChange={handleChange} className="w-full bg-neutral-50 dark:bg-neutral-900 border rounded-lg px-4 py-2 text-left" dir="ltr" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm mb-1">العنوان</label>
                <input type="text" name="contactAddress" value={settings.contactAddress} onChange={handleChange} className="w-full bg-neutral-50 dark:bg-neutral-900 border rounded-lg px-4 py-2" />
              </div>
            </div>
          </section>

          <div className="flex justify-end pt-4">
            <button type="submit" disabled={saving} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold transition-all disabled:opacity-50">
              <Save className="w-5 h-5" />
              {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
