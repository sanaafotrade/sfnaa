"use client";

import { ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Inbox, Send, Settings, ShieldCheck, MailPlus, Globe, Layout, Users, LayoutDashboard, Moon, Sun, Languages, Plus, FileText } from "lucide-react";
import LogoutButton from "./LogoutButton";
import { useLanguage } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { lang, setLang, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const [user, setUser] = useState<any>(null);

  const isRtl = lang === "ar";
  
  const toggleLanguage = () => {
    setLang(lang === "ar" ? "en" : "ar");
  };

  useEffect(() => {
    // Fetch User Profile
    fetch("/api/profile")
      .then(res => res.json())
      .then(data => {
        if (!data.error) setUser(data);
      })
      .catch(() => {});

    const checkUnread = async () => {
      try {
        const res = await fetch("/api/emails/unread-count");
        if (res.ok) {
          const data = await res.json();
          if (typeof data.count === "number") {
            setUnreadCount(data.count);
          }
        }
      } catch (e) {
        // Silent catch
      }
    };

    checkUnread();
    const interval = setInterval(checkUnread, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

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
        
        <nav className="flex-1 px-4 space-y-1 mt-6 overflow-y-auto">
          {/* Overview */}
          <Link href="/dashboard" className={navLinkClass("/dashboard")}>
            <LayoutDashboard className="w-5 h-5" />
            <span className="flex-1">{t({ ar: "الرئيسية", en: "Overview" })}</span>
          </Link>
          
          {/* Mail Section */}
          {(user?.role === 'OWNER' || user?.role === 'MANAGER' || user?.permissions.includes('email')) && (
            <>
              <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mt-8 mb-2 px-2">
                {t({ ar: "النظام", en: "System" })}
              </div>
              <Link href="/dashboard/inbox" className={navLinkClass("/dashboard/inbox")}>
                <Inbox className="w-5 h-5" />
                <span className="flex-1">{t({ ar: "البريد الإلكتروني", en: "Email" })}</span>
                {unreadCount > 0 && (
                  <span className="relative flex h-5 w-5 items-center justify-center mr-auto ml-2" dir="ltr">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[10px] font-bold text-white items-center justify-center">
                      {unreadCount > 9 ? "+9" : unreadCount}
                    </span>
                  </span>
                )}
              </Link>
              <Link href="/dashboard/contacts" className={navLinkClass("/dashboard/contacts")}>
                <Users className="w-5 h-5" />
                <span className="flex-1">{t({ ar: "جهات الاتصال", en: "Contacts" })}</span>
              </Link>
            </>
          )}
          
          {/* Website Section */}
          <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mt-8 mb-2 px-2">
            {t({ ar: "الموقع الإلكتروني", en: "Website" })}
          </div>
          {(user?.role === 'OWNER' || user?.role === 'MANAGER' || user?.permissions.includes('settings')) && (
            <>
              <Link href="/dashboard/settings" className={navLinkClass("/dashboard/settings")}>
                <Globe className="w-5 h-5" />
                {t({ ar: "إعدادات الموقع", en: "Site Settings" })}
              </Link>
              <Link href="/dashboard/landing-settings" className={navLinkClass("/dashboard/landing-settings")}>
                <Layout className="w-5 h-5" />
                {t({ ar: "محتوى الواجهة", en: "Landing Content" })}
              </Link>
            </>
          )}
          {(user?.role === 'OWNER' || user?.role === 'MANAGER' || user?.permissions.includes('letters')) && (
            <Link href="/dashboard/hr-letters" className={navLinkClass("/dashboard/hr-letters")}>
              <FileText className="w-5 h-5" />
              {t({ ar: "إدارة الخطابات", en: "Letters" })}
            </Link>
          )}
          {(user?.role === 'OWNER' || user?.role === 'MANAGER' || user?.permissions.includes('services')) && (
            <Link href="/dashboard/services" className={navLinkClass("/dashboard/services")}>
              <Layout className="w-5 h-5" />
              {t({ ar: "إدارة الخدمات", en: "Services" })}
            </Link>
          )}
          {(user?.role === 'OWNER' || user?.role === 'MANAGER' || user?.permissions.includes('partners')) && (
            <Link href="/dashboard/partners" className={navLinkClass("/dashboard/partners")}>
              <Users className="w-5 h-5" />
              {t({ ar: "إدارة الشركاء", en: "Partners" })}
            </Link>
          )}
          
          {/* Admin Section */}
          {(user?.role === 'OWNER' || user?.role === 'MANAGER') && (
            <>
              <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mt-8 mb-2 px-2">
                {t({ ar: "الإدارة", en: "Administration" })}
              </div>
              <Link href="/dashboard/users" className={navLinkClass("/dashboard/users")}>
                <ShieldCheck className="w-5 h-5" />
                {t({ ar: "فريق العمل", en: "Team" })}
              </Link>
            </>
          )}

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

          <Link href="/dashboard/profile" className="flex items-center gap-3 hover:bg-neutral-100 dark:hover:bg-neutral-800 p-2 rounded-xl transition-colors cursor-pointer group">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold group-hover:shadow-md transition-all">
              {user?.name ? user.name.charAt(0) : "S"}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                {user?.name || t({ ar: "جاري التحميل...", en: "Loading..." })}
              </p>
              <p className="text-xs text-neutral-500 truncate">{user?.email || "..."}</p>
            </div>
            <Settings className="w-4 h-4 text-neutral-400 group-hover:text-blue-500 transition-colors" />
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex flex-col relative">
        {children}
      </main>
    </div>
  );
}
