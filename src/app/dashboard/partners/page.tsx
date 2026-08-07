'use client';

import { useState, useEffect } from 'react';
import { Users, Plus, Edit, Trash2, Check, X, Image as ImageIcon } from 'lucide-react';

export default function PartnersPage() {
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPartner, setCurrentPartner] = useState<any>({});

  const fetchPartners = () => {
    fetch('/api/partners')
      .then(res => res.json())
      .then(data => {
        setPartners(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const isNew = !currentPartner.id;
    const url = isNew ? '/api/partners' : `/api/partners/${currentPartner.id}`;
    const method = isNew ? 'POST' : 'PUT';
    
    const dataToSend = {
      ...currentPartner,
      order: parseInt(currentPartner.order?.toString() || '0')
    };

    try {
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });
      fetchPartners();
      setIsEditing(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الشريك؟')) return;
    try {
      await fetch(`/api/partners/${id}`, { method: 'DELETE' });
      fetchPartners();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-neutral-50 dark:bg-neutral-900">
      <header className="bg-white dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 p-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            إدارة الشركاء
          </h2>
          <p className="text-neutral-500 mt-1">إضافة وتعديل وحذف شركاء النجاح</p>
        </div>
        <button 
          onClick={() => { setCurrentPartner({ name: '', logoUrl: '', websiteUrl: '', order: 0, isActive: true }); setIsEditing(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          إضافة شريك
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="text-center p-8">جاري التحميل...</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {partners.map(partner => (
              <div key={partner.id} className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 shadow-sm flex flex-col items-center text-center">
                <div className="w-full h-24 bg-neutral-50 dark:bg-neutral-900 rounded-xl mb-4 flex items-center justify-center overflow-hidden p-2">
                  {partner.logoUrl ? (
                    <img src={partner.logoUrl} alt={partner.name} className="max-w-full max-h-full object-contain" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-neutral-400" />
                  )}
                </div>
                <h3 className="font-bold mb-2 w-full truncate">{partner.name}</h3>
                <div className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 outline-none px-4 py-2 text-neutral-900 dark:text-white rounded-lg focus:border-blue-500 dark:focus:border-blue-400">
                  <button onClick={() => { setCurrentPartner(partner); setIsEditing(true); }} className="p-2 text-neutral-500 hover:text-blue-600 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(partner.id)} className="p-2 text-neutral-500 hover:text-red-600 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isEditing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-950 rounded-2xl max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b border-neutral-200 dark:border-neutral-800">
              <h3 className="text-xl font-bold">{currentPartner.id ? 'تعديل الشريك' : 'إضافة شريك جديد'}</h3>
              <button onClick={() => setIsEditing(false)} className="text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 p-2 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm mb-1">اسم الشريك</label>
                <input required type="text" value={currentPartner.name || ''} onChange={e => setCurrentPartner({...currentPartner, name: e.target.value})} className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 outline-none px-4 py-2 text-neutral-900 dark:text-white rounded-lg focus:border-blue-500 dark:focus:border-blue-400" />
              </div>
              <div>
                <label className="block text-sm mb-1">رابط الشعار (URL)</label>
                <input type="text" value={currentPartner.logoUrl || ''} onChange={e => setCurrentPartner({...currentPartner, logoUrl: e.target.value})} className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 outline-none px-4 py-2 text-neutral-900 dark:text-white rounded-lg focus:border-blue-500 dark:focus:border-blue-400" dir="ltr" />
              </div>
              <div>
                <label className="block text-sm mb-1">الموقع الإلكتروني</label>
                <input type="text" value={currentPartner.websiteUrl || ''} onChange={e => setCurrentPartner({...currentPartner, websiteUrl: e.target.value})} className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 outline-none px-4 py-2 text-neutral-900 dark:text-white rounded-lg focus:border-blue-500 dark:focus:border-blue-400" dir="ltr" />
              </div>
              <div>
                <label className="block text-sm mb-1">الترتيب</label>
                <input type="number" value={currentPartner.order || 0} onChange={e => setCurrentPartner({...currentPartner, order: e.target.value})} className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 outline-none px-4 py-2 text-neutral-900 dark:text-white rounded-lg focus:border-blue-500 dark:focus:border-blue-400" />
              </div>
              <div className="flex items-center mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={currentPartner.isActive !== false} onChange={e => setCurrentPartner({...currentPartner, isActive: e.target.checked})} className="w-4 h-4" />
                  <span>الشريك نشط</span>
                </label>
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
