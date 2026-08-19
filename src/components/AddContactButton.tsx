"use client";

import { useState } from "react";
import { UserPlus, Loader2 } from "lucide-react";

export default function AddContactButton({ email, defaultName = "" }: { email: string, defaultName?: string }) {
  const rawEmailMatch = email.match(/<([^>]+)>/);
  const rawEmail = rawEmailMatch ? rawEmailMatch[1] : email;
  const rawName = email.split("<")[0].trim().replace(/^"|"$/g, '');

  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(defaultName || rawName || rawEmail.split("@")[0]);
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Hide the button if the email belongs to our domain or if it's already saved
  if (isSaved || rawEmail.includes("@sfnaa.com")) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: rawEmail, name, phone })
      });
      if (res.ok) {
        setIsSaved(true);
        setIsOpen(false);
      } else {
        alert("فشل حفظ جهة الاتصال");
      }
    } catch (error) {
      alert("حدث خطأ أثناء الحفظ");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 px-2 py-1 rounded-md transition-colors"
        title="إضافة لجهات الاتصال"
      >
        <UserPlus className="w-3 h-3" />
        إضافة لجهات الاتصال
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden" dir="rtl">
            <div className="p-6">
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-1">إضافة جهة اتصال</h3>
              <p className="text-sm text-neutral-500 mb-6">حفظ البريد لسهولة الوصول إليه لاحقاً.</p>
              
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">البريد الإلكتروني</label>
                  <input 
                    type="email" 
                    value={rawEmail} 
                    disabled
                    className="w-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 border border-neutral-200 dark:border-neutral-700 rounded-lg p-2.5 text-left dir-ltr" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">الاسم</label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={e => setName(e.target.value)}
                    required
                    autoFocus
                    className="w-full border border-neutral-300 dark:border-neutral-700 rounded-lg p-2.5 dark:bg-neutral-800 dark:text-white" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">رقم التواصل (اختياري)</label>
                  <input 
                    type="tel" 
                    value={phone} 
                    onChange={e => setPhone(e.target.value)}
                    placeholder="مثال: 0500000000"
                    className="w-full border border-neutral-300 dark:border-neutral-700 rounded-lg p-2.5 dark:bg-neutral-800 dark:text-white text-left dir-ltr" 
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'حفظ'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setIsOpen(false)}
                    className="flex-1 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold py-2.5 rounded-lg transition-colors"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
