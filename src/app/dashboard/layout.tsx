import { ReactNode } from "react";
import Link from "next/link";
import { Inbox, Send, Settings, ShieldCheck, MailPlus, Globe, Layout, Users } from "lucide-react";
import LogoutButton from "./LogoutButton";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-neutral-50 dark:bg-neutral-900 font-sans" dir="rtl">
      
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-neutral-950 border-l border-neutral-200 dark:border-neutral-800 flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-blue-600" />
            Safana Mail
          </h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
          <Link href="/dashboard/compose" className="flex items-center gap-3 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all shadow-sm shadow-blue-200 dark:shadow-none mb-6">
            <MailPlus className="w-5 h-5" />
            رسالة جديدة
          </Link>
          
          <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 px-2">
            البريد
          </div>
          
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-2.5 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors">
            <Inbox className="w-5 h-5" />
            صندوق الوارد
          </Link>
          <Link href="/dashboard/sent" className="flex items-center gap-3 px-4 py-2.5 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors">
            <Send className="w-5 h-5" />
            المرسلة
          </Link>
          
          <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mt-8 mb-2 px-2">
            الموقع الإلكتروني
          </div>
          <Link href="/dashboard/site-settings" className="flex items-center gap-3 px-4 py-2.5 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors">
            <Globe className="w-5 h-5" />
            إعدادات الموقع
          </Link>
          <Link href="/dashboard/services" className="flex items-center gap-3 px-4 py-2.5 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors">
            <Layout className="w-5 h-5" />
            إدارة الخدمات
          </Link>
          <Link href="/dashboard/partners" className="flex items-center gap-3 px-4 py-2.5 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors">
            <Users className="w-5 h-5" />
            إدارة الشركاء
          </Link>
          
          <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mt-8 mb-2 px-2">
            الإدارة
          </div>
          <Link href="/dashboard/settings" className="flex items-center gap-3 px-4 py-2.5 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors">
            <Settings className="w-5 h-5" />
            إعدادات البريد
          </Link>
          
          <div className="mt-4 border-t border-neutral-100 dark:border-neutral-800/50 pt-4">
            <LogoutButton />
          </div>
        </nav>
        
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold">
              SN
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">سفانة نجد</p>
              <p className="text-xs text-neutral-500">info@sfnaa.com</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex flex-col relative">
        {children}
      </main>
    </div>
  );
}
