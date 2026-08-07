"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Inbox, Send, Settings, ShieldCheck, MailPlus, Globe, Layout, Users, LayoutDashboard, Moon, Sun, Languages, Plus } from "lucide-react";
import LogoutButton from "./LogoutButton";
import { useLanguage } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { lang, setLang, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();

  const isRtl = lang === "ar";
  
  const toggleLanguage = () => {
    setLang(lang === "ar" ? "en" : "ar");
  };

  const navLinkClass = (path: string) => {
    const isActive = pathname === path;
    return `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
      isActive 
        ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold" 
        : "text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
    }`;
  };

  return (
    <div className="flex h-screen bg-neutral-50 dark:bg-neutral-900 font-sans" dir={isRtl ? "rtl" : "ltr"}>
      
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-neutral-950 border-l border-neutral-200 dark:border-neutral-800 flex flex-col border-r">
        <div className="p-6">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-blue-600" />
            {t({ ar: "سفانة نجد", en: "Safana Najd" })}
          </h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-1 mt-2 overflow-y-auto">
          <Link 
            href="/dashboard/compose" 
            className="flex items-center justify-center gap-2 px-4 py-3 mb-6 rounded-lg transition-colors bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm w-full"
          >
            <Plus className="w-5 h-5" />
            <span>{t({ ar: "رسالة جديدة", en: "Compose" })}</span>
          </Link>

          {/* Overview */}
          <Link href="/dashboard" className={navLinkClass("/dashboard")}>
            <LayoutDashboard className="w-5 h-5" />
            {t({ ar: "الرئيسية", en: "Overview" })}
          </Link>
          
          {/* Mail Section */}
          <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mt-8 mb-2 px-2">
            {t({ ar: "البريد", en: "Mail" })}
          </div>
          
          <Link href="/dashboard/inbox" className={navLinkClass("/dashboard/inbox")}>
            <Inbox className="w-5 h-5" />
            {t({ ar: "صندوق الوارد", en: "Inbox" })}
          </Link>
          <Link href="/dashboard/sent" className={navLinkClass("/dashboard/sent")}>
            <Send className="w-5 h-5" />
            {t({ ar: "المرسلة", en: "Sent" })}
          </Link>
          
          {/* Website Section */}
          <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mt-8 mb-2 px-2">
            {t({ ar: "الموقع الإلكتروني", en: "Website" })}
          </div>
          <Link href="/dashboard/site-settings" className={navLinkClass("/dashboard/site-settings")}>
            <Globe className="w-5 h-5" />
            {t({ ar: "إعدادات الموقع", en: "Site Settings" })}
          </Link>
          <Link href="/dashboard/services" className={navLinkClass("/dashboard/services")}>
            <Layout className="w-5 h-5" />
            {t({ ar: "إدارة الخدمات", en: "Services" })}
          </Link>
          <Link href="/dashboard/partners" className={navLinkClass("/dashboard/partners")}>
            <Users className="w-5 h-5" />
            {t({ ar: "إدارة الشركاء", en: "Partners" })}
          </Link>
          
          {/* Admin Section */}
          <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mt-8 mb-2 px-2">
            {t({ ar: "الإدارة", en: "Admin" })}
          </div>
          <Link href="/dashboard/settings" className={navLinkClass("/dashboard/settings")}>
            <Settings className="w-5 h-5" />
            {t({ ar: "إعدادات البريد", en: "Mail Settings" })}
          </Link>
          
          <div className="mt-4 border-t border-neutral-100 dark:border-neutral-800/50 pt-4">
            <LogoutButton />
          </div>
        </nav>
        
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 flex flex-col gap-4">
          <div className="flex items-center justify-center gap-4 border-b border-neutral-100 dark:border-neutral-800/50 pb-4">
            <button 
              onClick={toggleTheme}
              className="p-2 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
              title={t({ ar: "تبديل المظهر", en: "Toggle Theme" })}
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button 
              onClick={toggleLanguage}
              className="p-2 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors flex items-center gap-2"
              title={t({ ar: "تغيير اللغة", en: "Change Language" })}
            >
              <Languages className="w-5 h-5" />
              <span className="text-sm font-medium">{lang === "ar" ? "EN" : "AR"}</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold">
              SN
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                {t({ ar: "سفانة نجد", en: "Safana Najd" })}
              </p>
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
