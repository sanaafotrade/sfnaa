"use client";

import { useState, useEffect } from "react";
import { Users, Search, Loader2, X } from "lucide-react";

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string | null;
}

export default function ContactSelector({ onSelect }: { onSelect: (email: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");

  const loadContacts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/contacts");
      const data = await res.json();
      setContacts(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadContacts();
    }
  }, [isOpen]);

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <button 
        type="button"
        onClick={() => setIsOpen(true)}
        className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-700 font-bold"
      >
        <Users className="w-4 h-4" />
        جهات الاتصال
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-neutral-50 dark:bg-neutral-900/50">
              <h3 className="font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                اختيار من جهات الاتصال
              </h3>
              <button type="button" onClick={() => setIsOpen(false)} className="p-2 text-neutral-400 hover:text-neutral-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 border-b border-neutral-100 dark:border-neutral-800">
              <div className="relative">
                <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input 
                  type="text"
                  placeholder="بحث بالاسم أو الإيميل..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full bg-neutral-100 dark:bg-neutral-800 border-none rounded-xl pr-9 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {isLoading ? (
                <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
              ) : filteredContacts.length === 0 ? (
                <div className="p-8 text-center text-neutral-500 text-sm">لا توجد جهات اتصال مطابقة.</div>
              ) : (
                <div className="space-y-1">
                  {filteredContacts.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => { onSelect(c.email); setIsOpen(false); }}
                      className="w-full text-start p-3 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-xl transition-colors flex flex-col gap-1"
                    >
                      <div className="font-bold text-neutral-900 dark:text-white text-sm">{c.name}</div>
                      <div className="text-xs text-neutral-500 flex justify-between w-full">
                        <span dir="ltr">{c.email}</span>
                        {c.phone && <span>{c.phone}</span>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
