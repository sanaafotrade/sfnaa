import prisma from "@/lib/prisma";
import { Search, Star, Trash2, Mail, MailOpen } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { arSA } from "date-fns/locale";

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  const emails = await prisma.emailRecord.findMany({
    where: { status: "inbox" },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="bg-white dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 p-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
          <Mail className="w-6 h-6 text-blue-600" />
          صندوق الوارد
        </h2>
        
        {/* Search Bar */}
        <div className="relative w-96">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input 
            type="text" 
            placeholder="البحث في الرسائل..." 
            className="w-full bg-neutral-100 dark:bg-neutral-900 border-none rounded-xl py-2.5 pr-10 pl-4 text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none"
          />
        </div>
      </header>

      {/* Email List */}
      <div className="flex-1 overflow-y-auto p-4 bg-neutral-50 dark:bg-neutral-900">
        <div className="bg-white dark:bg-neutral-950 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          {emails.length === 0 ? (
            <div className="p-16 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
                <MailOpen className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200">صندوق الوارد فارغ</h3>
              <p className="text-neutral-500 mt-1 max-w-sm">لا توجد رسائل جديدة في الوقت الحالي. سيتم عرض الرسائل الواردة هنا فور وصولها.</p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {emails.map((email) => (
                <Link 
                  key={email.id} 
                  href={`/dashboard/email/${email.id}`}
                  className={`flex items-center gap-4 p-4 hover:bg-blue-50/50 dark:hover:bg-neutral-900 transition-colors group cursor-pointer ${!email.isRead ? 'bg-white dark:bg-neutral-950' : 'bg-neutral-50/50 dark:bg-neutral-900/50 opacity-80'}`}
                >
                  {/* Actions */}
                  <div className="flex items-center gap-2 px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="text-neutral-400 hover:text-yellow-500 transition-colors">
                      <Star className={`w-5 h-5 ${email.isStarred ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                    </button>
                    <button className="text-neutral-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Sender Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/50 dark:to-blue-900/50 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold flex-shrink-0">
                    {email.from.charAt(0).toUpperCase()}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between mb-0.5">
                        <p className={`text-sm truncate ${!email.isRead ? 'font-bold text-neutral-900 dark:text-white' : 'font-medium text-neutral-700 dark:text-neutral-300'}`}>
                          {email.from}
                        </p>
                        <span className="text-xs text-neutral-500 whitespace-nowrap mr-4">
                          {formatDistanceToNow(new Date(email.createdAt), { addSuffix: true, locale: arSA })}
                        </span>
                      </div>
                      <p className={`text-sm truncate ${!email.isRead ? 'font-semibold text-neutral-800 dark:text-neutral-200' : 'text-neutral-600 dark:text-neutral-400'}`}>
                        {email.subject || '(بدون عنوان)'}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
