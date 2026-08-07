import prisma from "@/lib/prisma";
import { Search, Star, Trash2, Mail, MailOpen, RefreshCw, Send, ArchiveX } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { arSA } from "date-fns/locale";

export const dynamic = "force-dynamic";

export default async function InboxPage({ searchParams }: { searchParams: { tab?: string } }) {
  const tab = searchParams.tab || 'inbox';
  
  let whereClause = {};
  if (tab === 'inbox') whereClause = { status: "inbox" };
  else if (tab === 'sent') whereClause = { status: "sent" };
  else if (tab === 'starred') whereClause = { isStarred: true };
  else if (tab === 'trash') whereClause = { status: "trash" };

  const emails = await prisma.emailRecord.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
  });

  const tabs = [
    { id: 'inbox', label: 'الوارد', icon: Mail },
    { id: 'sent', label: 'الصادر', icon: Send },
    { id: 'starred', label: 'المميزة', icon: Star },
    { id: 'trash', label: 'المحذوفة', icon: Trash2 },
  ];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-neutral-950">
      {/* Header Area */}
      <header className="border-b border-neutral-200 dark:border-neutral-800 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2 border-b border-transparent">
            {tabs.map((t) => {
              const Icon = t.icon;
              const isActive = tab === t.id;
              return (
                <Link
                  key={t.id}
                  href={`/dashboard/inbox?tab=${t.id}`}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                    isActive 
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' 
                      : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {t.label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-64 md:w-80">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input 
                type="text" 
                placeholder="البحث في الرسائل..." 
                className="w-full bg-neutral-100 dark:bg-neutral-900 border-none rounded-full py-2 pr-10 pl-4 text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none"
              />
            </div>
            <button className="p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors" title="تحديث">
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Email List */}
      <div className="flex-1 overflow-y-auto">
        {emails.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center h-full">
            <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-900 rounded-full flex items-center justify-center mb-4">
              <ArchiveX className="w-8 h-8 text-neutral-400" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200">لا توجد رسائل</h3>
            <p className="text-neutral-500 mt-1 max-w-sm">لا يوجد شيء لعرضه في هذا المجلد حالياً.</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {emails.map((email) => {
              const firstLetter = email.from ? email.from.charAt(0).toUpperCase() : '?';
              return (
                <Link 
                  key={email.id} 
                  href={`/dashboard/email/${email.id}`}
                  className={`flex items-center gap-4 p-4 hover:shadow-md hover:z-10 relative transition-all bg-white dark:bg-neutral-950 border-l-4 ${!email.isRead ? 'border-blue-500 bg-blue-50/30' : 'border-transparent'}`}
                >
                  <div className="flex items-center gap-3 opacity-0 hover:opacity-100 transition-opacity absolute right-4 bg-white/90 dark:bg-neutral-950/90 py-2 px-3 rounded-lg shadow-sm">
                    <button className="text-neutral-400 hover:text-yellow-500 transition-colors">
                      <Star className={`w-5 h-5 ${email.isStarred ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                    </button>
                    <button className="text-neutral-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0 shadow-sm">
                    {firstLetter}
                  </div>

                  <div className="flex-1 min-w-0 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0 grid grid-cols-12 gap-4 items-center">
                      <div className="col-span-3">
                        <p className={`text-sm truncate ${!email.isRead ? 'font-bold text-neutral-900 dark:text-white' : 'font-medium text-neutral-700 dark:text-neutral-300'}`}>
                          {email.from}
                        </p>
                      </div>
                      <div className="col-span-7">
                        <p className={`text-sm truncate ${!email.isRead ? 'font-semibold text-neutral-800 dark:text-neutral-200' : 'text-neutral-600 dark:text-neutral-400'}`}>
                          {email.subject || '(بدون عنوان)'}
                        </p>
                      </div>
                      <div className="col-span-2 text-left">
                        <span className={`text-xs whitespace-nowrap ${!email.isRead ? 'font-bold text-blue-600 dark:text-blue-400' : 'text-neutral-500'}`}>
                          {formatDistanceToNow(new Date(email.createdAt), { addSuffix: true, locale: arSA })}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
