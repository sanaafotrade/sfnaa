"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Users, Trash2, Plus, Loader2 } from "lucide-react";

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  createdAt: string;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // New Contact State
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const loadContacts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/contacts");
      const data = await res.json();
      setContacts(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error("فشل تحميل جهات الاتصال");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من الحذف؟")) return;
    setIsDeleting(id);
    try {
      const res = await fetch(`/api/contacts?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setContacts(prev => prev.filter(c => c.id !== id));
        toast.success("تم الحذف بنجاح");
      } else {
        toast.error("فشل الحذف");
      }
    } catch {
      toast.error("خطأ بالاتصال");
    } finally {
      setIsDeleting(null);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone })
      });
      if (res.ok) {
        toast.success("تمت الإضافة بنجاح");
        setIsAdding(false);
        setName("");
        setEmail("");
        setPhone("");
        loadContacts();
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "فشل الإضافة");
      }
    } catch {
      toast.error("خطأ بالاتصال");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-neutral-50 dark:bg-neutral-900" dir="rtl">
      <div className="px-8 py-6 bg-white dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            جهات الاتصال
          </h1>
          <p className="text-sm text-neutral-500 mt-1">إدارة الأسماء والبريد الإلكتروني الخاصة بعملائك وشركائك.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          إضافة جهة اتصال
        </button>
      </div>

      <div className="flex-1 p-8 overflow-y-auto">
        {isAdding && (
          <div className="bg-white dark:bg-neutral-950 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-6 mb-8 shadow-sm">
            <h2 className="text-lg font-bold mb-4 dark:text-white">إضافة جديدة</h2>
            <form onSubmit={handleAdd} className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm mb-1 text-neutral-600 dark:text-neutral-400">الاسم <span className="text-red-500">*</span></label>
                <input required value={name} onChange={e => setName(e.target.value)} type="text" className="w-full border dark:border-neutral-700 rounded-lg p-2 dark:bg-neutral-800 dark:text-white" />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm mb-1 text-neutral-600 dark:text-neutral-400">البريد الإلكتروني <span className="text-red-500">*</span></label>
                <input required value={email} onChange={e => setEmail(e.target.value)} type="email" dir="ltr" className="w-full border dark:border-neutral-700 rounded-lg p-2 dark:bg-neutral-800 dark:text-white text-left" />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm mb-1 text-neutral-600 dark:text-neutral-400">رقم التواصل</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} type="tel" dir="ltr" className="w-full border dark:border-neutral-700 rounded-lg p-2 dark:bg-neutral-800 dark:text-white text-left" />
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={isSaving} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold w-24 flex justify-center">
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : "حفظ"}
                </button>
                <button type="button" onClick={() => setIsAdding(false)} className="bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 px-4 py-2 rounded-lg font-bold">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
        ) : contacts.length === 0 ? (
          <div className="text-center p-12 bg-white dark:bg-neutral-950 rounded-2xl border border-neutral-200 dark:border-neutral-800">
            <Users className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
            <p className="text-neutral-500">لا توجد جهات اتصال مضافة حتى الآن.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-start">
              <thead className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 text-sm">
                <tr>
                  <th className="p-4 text-start font-bold">الاسم</th>
                  <th className="p-4 text-start font-bold">البريد الإلكتروني</th>
                  <th className="p-4 text-start font-bold">رقم التواصل</th>
                  <th className="p-4 text-center font-bold w-20">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {contacts.map(c => (
                  <tr key={c.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                    <td className="p-4 font-medium text-neutral-900 dark:text-white">{c.name}</td>
                    <td className="p-4 text-neutral-600 dark:text-neutral-300" dir="ltr">{c.email}</td>
                    <td className="p-4 text-neutral-600 dark:text-neutral-300" dir="ltr">{c.phone || '-'}</td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => handleDelete(c.id)}
                        disabled={isDeleting === c.id}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        {isDeleting === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
