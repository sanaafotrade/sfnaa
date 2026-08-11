'use client';

import { useState, useEffect, useRef } from 'react';
import { Save, UploadCloud, Loader2, ShieldCheck, CheckCircle2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

export default function GeneralSettingsPage() {
  const [settings, setSettings] = useState<any>({
    companyNameAr: '',
    companyNameEn: '',
    companyLogoUrl: '',
    crNumber: '',
    vatNumber: '',
    footerAddressAr: '',
    footerAddressEn: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [isVatEnabled, setIsVatEnabled] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/settings/letter-template')
      .then(res => res.json())
      .then(data => {
        setSettings({
          companyNameAr: data.companyNameAr || '',
          companyNameEn: data.companyNameEn || '',
          companyLogoUrl: data.companyLogoUrl || '',
          crNumber: data.crNumber || '',
          vatNumber: data.vatNumber?.replace('DISABLED_', '') || '',
          footerAddressAr: data.footerAddressAr || '',
          footerAddressEn: data.footerAddressEn || '',
        });
        setIsVatEnabled(!data.vatNumber?.startsWith('DISABLED_') && !!data.vatNumber);
        setLoading(false);
      });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setSettings({ ...settings, [e.target.name]: e.target.value });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload-blob', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      
      if (res.ok && data.url) {
        setSettings({ ...settings, companyLogoUrl: data.url });
        toast.success('تم رفع الشعار بنجاح');
      } else {
        toast.error(data.error || 'فشل رفع الشعار');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء الاتصال بالخادم');
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    
    // Process VAT number based on toggle
    const payload = {
      ...settings,
      vatNumber: isVatEnabled ? settings.vatNumber : (settings.vatNumber ? `DISABLED_${settings.vatNumber}` : ''),
    };

    try {
      const res = await fetch('/api/settings/letter-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (res.ok) {
        toast.success('تم حفظ الإعدادات بنجاح');
      } else {
        toast.error('حدث خطأ أثناء الحفظ');
      }
    } catch (err) {
      toast.error('حدث خطأ أثناء الاتصال بالخادم');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex-1 flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-neutral-50 dark:bg-neutral-900" dir="rtl">
      {/* Top Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800 px-8 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-white mb-1">
            الإعدادات العامة للنظام (General Settings)
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            إدارة إعدادات المؤسسة الأساسية، قوالب العقود، والنظام الضريبي (ZATCA).
          </p>
        </div>
        <button 
          onClick={handleSubmit} 
          disabled={saving}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-medium transition-all disabled:opacity-50 shadow-sm hover:shadow-md"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          حفظ التغييرات
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-5xl space-y-8 pb-12">
          
          {/* Logo Section */}
          <section>
            <h3 className="text-lg font-bold mb-4 text-neutral-900 dark:text-white">الشعار الرسمي (Logo)</h3>
            <div className="bg-white dark:bg-neutral-950 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex-1 space-y-3">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">نظام الحماية: <span className="text-neutral-500 font-normal">يتم فحص صيغة الملف (MIME) تلقائياً.</span></p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">معالجة الحجم: <span className="text-neutral-500 font-normal">يتم تصغير وتجهيز الصورة لطباعة العقود بدون فقدان الدقة.</span></p>
                  </div>
                </div>
              </div>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-48 h-48 rounded-2xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-blue-500 dark:hover:border-blue-500 flex flex-col items-center justify-center cursor-pointer transition-colors relative overflow-hidden bg-neutral-50 dark:bg-neutral-900 shrink-0"
              >
                {settings.companyLogoUrl ? (
                  <img src={settings.companyLogoUrl} alt="Logo" className="w-full h-full object-contain p-4" />
                ) : (
                  <div className="text-center">
                    <ImageIcon className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                    <span className="text-sm text-neutral-500">رفع الشعار</span>
                  </div>
                )}
                {uploadingLogo && (
                  <div className="absolute inset-0 bg-white/80 dark:bg-black/80 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  </div>
                )}
              </div>
              <input type="file" ref={fileInputRef} onChange={handleLogoUpload} accept="image/*" className="hidden" />
            </div>
          </section>

          {/* Header Section */}
          <section>
            <h3 className="text-lg font-bold mb-4 text-neutral-900 dark:text-white">نصوص الترويسة (Header)</h3>
            <div className="bg-white dark:bg-neutral-950 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 space-y-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">اسم المؤسسة (عربي)</label>
                  <input 
                    type="text" 
                    name="companyNameAr" 
                    value={settings.companyNameAr} 
                    onChange={handleChange} 
                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 outline-none focus:border-blue-500" 
                  />
                </div>
              </div>
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">اسم المؤسسة (إنجليزي)</label>
                  <input 
                    type="text" 
                    name="companyNameEn" 
                    value={settings.companyNameEn} 
                    onChange={handleChange} 
                    dir="ltr"
                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 outline-none focus:border-blue-500" 
                  />
                </div>
              </div>
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">رقم السجل التجاري</label>
                  <input 
                    type="text" 
                    name="crNumber" 
                    value={settings.crNumber} 
                    onChange={handleChange} 
                    dir="ltr"
                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 outline-none focus:border-blue-500" 
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Footer Section */}
          <section>
            <h3 className="text-lg font-bold mb-4 text-neutral-900 dark:text-white">نصوص التذييل (Footer)</h3>
            <div className="bg-white dark:bg-neutral-950 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 space-y-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">النص السفلي (عربي)</label>
                  <textarea 
                    name="footerAddressAr" 
                    value={settings.footerAddressAr} 
                    onChange={handleChange} 
                    rows={3}
                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 outline-none focus:border-blue-500" 
                  />
                </div>
              </div>
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">النص السفلي (إنجليزي)</label>
                  <textarea 
                    name="footerAddressEn" 
                    value={settings.footerAddressEn} 
                    onChange={handleChange} 
                    dir="ltr"
                    rows={3}
                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 outline-none focus:border-blue-500" 
                  />
                </div>
              </div>
            </div>
          </section>

          {/* ZATCA Section */}
          <section>
            <h3 className="text-lg font-bold mb-4 text-neutral-900 dark:text-white flex items-center gap-2">
              إعدادات هيئة الزكاة والضريبة والجمارك (ZATCA VAT)
            </h3>
            <div className="bg-white dark:bg-neutral-950 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 space-y-6">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="flex-1 w-full">
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">الرقم المميز (TIN)</label>
                  <input 
                    type="text" 
                    name="vatNumber" 
                    value={settings.vatNumber} 
                    onChange={handleChange} 
                    dir="ltr"
                    className={`w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 outline-none focus:border-blue-500 transition-opacity ${!isVatEnabled ? 'opacity-50' : ''}`}
                  />
                  <p className="text-xs text-neutral-500 mt-2">الرقم الضريبي للمؤسسة، مكون من 15 رقماً.</p>
                </div>
                
                <div className="flex-1 w-full flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
                  <div>
                    <h4 className="font-semibold text-neutral-900 dark:text-white text-sm mb-1">تفعيل ضريبة القيمة المضافة</h4>
                    <p className="text-xs text-neutral-500">تفعيل خيارات الضريبة في الفواتير والتقارير</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setIsVatEnabled(!isVatEnabled)}
                    className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${isVatEnabled ? 'bg-blue-600' : 'bg-neutral-300 dark:bg-neutral-700'}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isVatEnabled ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
