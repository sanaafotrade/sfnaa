import prisma from "@/lib/prisma";
import { ArrowRight, Reply, Forward, Trash2, ShieldAlert, Paperclip } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { format } from "date-fns";
import { arSA } from "date-fns/locale";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

async function deleteEmail(id: string) {
  "use strict";
  "use server";
  
  await prisma.emailRecord.delete({ where: { id } });
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export default async function EmailViewPage({ params }: { params: { id: string } }) {
  const email = await prisma.emailRecord.findUnique({
    where: { id: params.id }
  });

  if (!email) {
    notFound();
  }

  // Mark as read if it's unread
  if (!email.isRead) {
    await prisma.emailRecord.update({
      where: { id: email.id },
      data: { isRead: true }
    });
    revalidatePath("/dashboard");
  }

  const isIncoming = email.status !== "sent";

  return (
    <div className="flex flex-col h-full bg-white dark:bg-neutral-950">
      {/* Top Action Bar */}
      <div className="border-b border-neutral-200 dark:border-neutral-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={isIncoming ? "/dashboard" : "/dashboard/sent"} className="text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors bg-neutral-100 dark:bg-neutral-900 p-2 rounded-full">
            <ArrowRight className="w-5 h-5" />
          </Link>
          
          <div className="flex items-center gap-2 border-r border-neutral-200 dark:border-neutral-800 pr-4 mr-2">
            <Link href={`/dashboard/compose?replyTo=${email.id}`} className="text-neutral-500 hover:text-blue-600 transition-colors p-2 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20" title="رد">
              <Reply className="w-5 h-5" />
            </Link>
            <Link href={`/dashboard/compose?forward=${email.id}`} className="text-neutral-500 hover:text-blue-600 transition-colors p-2 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20" title="إعادة توجيه">
              <Forward className="w-5 h-5" />
            </Link>
            <form action={async () => { "use server"; await deleteEmail(email.id); }}>
              <button type="submit" className="text-neutral-500 hover:text-red-600 transition-colors p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20" title="حذف">
                <Trash2 className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-8">
          {/* Header Info */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">
              {email.subject || '(بدون عنوان)'}
            </h1>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/50 dark:to-blue-900/50 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold text-lg">
                  {email.from.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-neutral-900 dark:text-white">{email.from}</span>
                  </div>
                  <div className="text-sm text-neutral-500 flex items-center gap-1 mt-0.5">
                    إلى: <span className="text-neutral-700 dark:text-neutral-300">{email.to}</span>
                  </div>
                </div>
              </div>
              
              <div className="text-sm text-neutral-500">
                {format(new Date(email.createdAt), "d MMMM yyyy, h:mm a", { locale: arSA })}
              </div>
            </div>
          </div>

          {email.status === "spam" && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-xl p-4 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-bold text-red-800 dark:text-red-400">تحذير أمني: رسالة مشبوهة</h4>
                <p className="text-sm text-red-600 dark:text-red-300 mt-1">تم تصنيف هذه الرسالة كرسالة مزعجة (Spam). احذر من الضغط على الروابط أو تحميل المرفقات.</p>
              </div>
            </div>
          )}

          {/* Email Body */}
          <div className="prose dark:prose-invert max-w-none">
            {email.html ? (
              <div dangerouslySetInnerHTML={{ __html: email.html }} />
            ) : (
              <div className="whitespace-pre-wrap">{email.text}</div>
            )}
          </div>

          {/* Attachments */}
          {email.attachments && Array.isArray(email.attachments) && email.attachments.length > 0 && (
            <div className="mt-12 pt-6 border-t border-neutral-200 dark:border-neutral-800">
              <h4 className="text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-4 flex items-center gap-2">
                <Paperclip className="w-4 h-4" />
                المرفقات ({email.attachments.length})
              </h4>
              <div className="flex flex-wrap gap-4">
                {email.attachments.map((att: any, index: number) => (
                  <a 
                    key={index} 
                    href={att.url || att.content} // Handle both blob URLs and potential inline content
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                      <Paperclip className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 max-w-[200px] truncate">{att.filename || 'مرفق'}</p>
                      {att.size && <p className="text-xs text-neutral-500">{(att.size / 1024).toFixed(1)} KB</p>}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
