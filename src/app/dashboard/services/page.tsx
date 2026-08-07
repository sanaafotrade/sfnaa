'use client';

import { useState, useEffect } from 'react';
import { Layout, Plus, Edit, Trash2, Check, X } from 'lucide-react';

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentService, setCurrentService] = useState<any>({});

  const fetchServices = () => {
    fetch('/api/services')
      .then(res => res.json())
      .then(data => {
        setServices(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const isNew = !currentService.id;
    const url = isNew ? '/api/services' : `/api/services/${currentService.id}`;
    const method = isNew ? 'POST' : 'PUT';
    
    // Convert string order to int if necessary
    const dataToSend = {
      ...currentService,
      order: parseInt(currentService.order?.toString() || '0')
    };

    try {
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });
      fetchServices();
      setIsEditing(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الخدمة؟')) return;
    try {
      await fetch(`/api/services/${id}`, { method: 'DELETE' });
      fetchServices();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-neutral-50 dark:bg-neutral-900">
      <header className="bg-white dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 p-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
            <Layout className="w-6 h-6 text-blue-600" />
            إدارة الخدمات
          </h2>
          <p className="text-neutral-500 mt-1">إضافة وتعديل وحذف الخدمات في الصفحة الرئيسية</p>
        </div>
        <button 
          onClick={() => { setCurrentService({ titleAr: '', titleEn: '', descAr: '', descEn: '', icon: 'Globe', order: 0, isActive: true }); setIsEditing(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          إضافة خدمة
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="text-center p-8">جاري التحميل...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map(service => (
              <div key={service.id} className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl flex items-center justify-center">
                    <span className="font-bold">{service.icon || 'Globe'}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setCurrentService(service); setIsEditing(true); }} className="p-2 text-neutral-500 hover:text-blue-600 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(service.id)} className="p-2 text-neutral-500 hover:text-red-600 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <h3 className="font-bold text-lg mb-1">{service.titleAr}</h3>
                <h4 className="text-sm text-neutral-500 mb-3" dir="ltr">{service.titleEn}</h4>
                <div className="flex items-center gap-2 text-sm">
                  <span className={`px-2 py-1 rounded-full ${service.isActive ? 'bg-green-100 text-green-700' : 'bg-neutral-200 text-neutral-700'}`}>
                    {service.isActive ? 'نشط' : 'غير نشط'}
                  </span>
                  <span className="text-neutral-500">الترتيب: {service.order}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isEditing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-950 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-neutral-200 dark:border-neutral-800">
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white">{currentService.id ? 'تعديل الخدمة' : 'إضافة خدمة جديدة'}</h3>
              <button onClick={() => setIsEditing(false)} className="text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 p-2 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1 text-neutral-700 dark:text-neutral-300 font-medium">العنوان (عربي)</label>
                  <input required type="text" value={currentService.titleAr || ''} onChange={e => setCurrentService({...currentService, titleAr: e.target.value})} className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 outline-none px-4 py-2 text-neutral-900 dark:text-white rounded-lg focus:border-blue-500 dark:focus:border-blue-400" />
                </div>
                <div>
                  <label className="block text-sm mb-1 text-neutral-700 dark:text-neutral-300 font-medium">العنوان (إنجليزي)</label>
                  <input required type="text" value={currentService.titleEn || ''} onChange={e => setCurrentService({...currentService, titleEn: e.target.value})} className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 outline-none px-4 py-2 text-neutral-900 dark:text-white rounded-lg focus:border-blue-500 dark:focus:border-blue-400" dir="ltr" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm mb-1 text-neutral-700 dark:text-neutral-300 font-medium">الوصف (عربي)</label>
                  <textarea required value={currentService.descAr || ''} onChange={e => setCurrentService({...currentService, descAr: e.target.value})} rows={3} className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 outline-none px-4 py-2 text-neutral-900 dark:text-white rounded-lg focus:border-blue-500 dark:focus:border-blue-400" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm mb-1 text-neutral-700 dark:text-neutral-300 font-medium">الوصف (إنجليزي)</label>
                  <textarea required value={currentService.descEn || ''} onChange={e => setCurrentService({...currentService, descEn: e.target.value})} rows={3} className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 outline-none px-4 py-2 text-neutral-900 dark:text-white rounded-lg focus:border-blue-500 dark:focus:border-blue-400" dir="ltr" />
                </div>
                <div>
                  <label className="block text-sm mb-1 text-neutral-700 dark:text-neutral-300 font-medium">الترتيب</label>
                  <input type="number" value={currentService.order || 0} onChange={e => setCurrentService({...currentService, order: e.target.value})} className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 outline-none px-4 py-2 text-neutral-900 dark:text-white rounded-lg focus:border-blue-500 dark:focus:border-blue-400" />
                </div>
                <div>
                  <label className="block text-sm mb-1 text-neutral-700 dark:text-neutral-300 font-medium">الأيقونة أو رابط الصورة</label>
                  <input type="text" value={currentService.icon || ''} onChange={e => setCurrentService({...currentService, icon: e.target.value})} className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 outline-none px-4 py-2 text-neutral-900 dark:text-white rounded-lg focus:border-blue-500 dark:focus:border-blue-400" dir="ltr" placeholder="Globe" />
                </div>
                <div className="flex items-center mt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={currentService.isActive !== false} onChange={e => setCurrentService({...currentService, isActive: e.target.checked})} className="w-4 h-4" />
                    <span>الخدمة نشطة</span>
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end pt-4 border-t border-neutral-200 dark:border-neutral-800 mt-6 gap-2">
                <button type="button" onClick={() => setIsEditing(false)} className="px-6 py-2 rounded-lg font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200">
                  إلغاء
                </button>
                <button type="submit" className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700">
                  <Check className="w-5 h-5" />
                  حفظ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
