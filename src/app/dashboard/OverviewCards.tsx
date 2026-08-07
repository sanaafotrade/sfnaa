"use client";

import { useLanguage } from "@/lib/i18n";
import { Layout, Users, Mail, SendHorizontal } from "lucide-react";
import Link from "next/link";

interface Stats {
  totalServices: number;
  totalPartners: number;
  newMessages: number;
  sentMessages: number;
}

export default function OverviewCards({ stats }: { stats: Stats }) {
  const { t } = useLanguage();

  const cards = [
    {
      title: t({ ar: "إجمالي الخدمات", en: "Total Services" }),
      value: stats.totalServices,
      icon: <Layout className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />,
      link: "/dashboard/services",
      color: "bg-indigo-50 dark:bg-indigo-900/20",
    },
    {
      title: t({ ar: "إجمالي الشركاء", en: "Total Partners" }),
      value: stats.totalPartners,
      icon: <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />,
      link: "/dashboard/partners",
      color: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      title: t({ ar: "الرسائل الجديدة", en: "New Messages" }),
      value: stats.newMessages,
      icon: <Mail className="w-6 h-6 text-rose-600 dark:text-rose-400" />,
      link: "/dashboard/inbox",
      color: "bg-rose-50 dark:bg-rose-900/20",
    },
    {
      title: t({ ar: "الرسائل المرسلة", en: "Sent Messages" }),
      value: stats.sentMessages,
      icon: <SendHorizontal className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />,
      link: "/dashboard/sent",
      color: "bg-emerald-50 dark:bg-emerald-900/20",
    },
  ];

  return (
    <div className="flex flex-col h-full bg-neutral-50 dark:bg-neutral-900 p-6 overflow-y-auto">
      <header className="mb-8">
        <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">
          {t({ ar: "نظرة عامة", en: "Overview" })}
        </h2>
        <p className="text-neutral-500 dark:text-neutral-400 mt-1">
          {t({ ar: "ملخص الإحصائيات لنظام سفانة نجد", en: "Summary statistics for Safana Najd system" })}
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => (
          <Link href={card.link} key={idx} className="block group">
            <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${card.color}`}>
                  {card.icon}
                </div>
              </div>
              <div>
                <h3 className="text-3xl font-bold text-neutral-800 dark:text-neutral-100 mb-1">
                  {card.value}
                </h3>
                <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-neutral-300 transition-colors">
                  {card.title}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
