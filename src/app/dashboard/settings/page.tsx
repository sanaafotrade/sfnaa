import prisma from "@/lib/prisma";
import { Settings as SettingsIcon, Save, ShieldAlert, ShieldCheck } from "lucide-react";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

async function saveSettings(formData: FormData) {
  "use strict";
  "use server";
  
  const senderName = formData.get("senderName") as string;
  const signature = formData.get("signature") as string;
  const autoReplyEnabled = formData.get("autoReplyEnabled") === "on";
  const autoReplySubject = formData.get("autoReplySubject") as string;
  const autoReplyBody = formData.get("autoReplyBody") as string;
  const autoReplyTeamName = formData.get("autoReplyTeamName") as string;
  
  const trustedEmailsStr = formData.get("trustedEmails") as string;
  const blockedEmailsStr = formData.get("blockedEmails") as string;
  
  const trustedEmails = trustedEmailsStr.split("\n").map(e => e.trim()).filter(e => e);
  const blockedEmails = blockedEmailsStr.split("\n").map(e => e.trim()).filter(e => e);

  await prisma.emailSettings.upsert({
    where: { id: "default" },
    update: {
      senderName,
      signature,
      autoReplyEnabled,
      autoReplySubject,
      autoReplyBody,
      autoReplyTeamName,
      trustedEmails,
      blockedEmails
    },
    create: {
      id: "default",
      senderName,
      signature,
      autoReplyEnabled,
      autoReplySubject,
      autoReplyBody,
      autoReplyTeamName,
      trustedEmails,
      blockedEmails
    }
  });

  revalidatePath("/dashboard/settings");
}

export default async function SettingsPage() {
  const settings = await prisma.emailSettings.findUnique({
    where: { id: "default" }
  }) || {
    senderName: "سفانة نجد",
    signature: "",
    autoReplyEnabled: false,
    autoReplySubject: "شكراً لتواصلك - مؤسسة سفانة نجد",
    autoReplyBody: "تم استلام رسالتك بنجاح. سنقوم بالرد عليك في أقرب وقت.",
    autoReplyTeamName: "فريق سفانة نجد",
    trustedEmails: [],
    blockedEmails: [],
  };

  return (
    <div className="flex flex-col h-full bg-neutral-50 dark:bg-neutral-900">
      <header className="bg-white dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 p-6">
        <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-blue-600" />
          إعدادات البريد
        </h2>
        <p className="text-neutral-500 mt-1">تخصيص الرد التلقائي والتواقيع وقوائم الحظر</p>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <form action={saveSettings} className="max-w-4xl mx-auto space-y-8 pb-12">
          
          {/* General Settings */}
          <section className="bg-white dark:bg-neutral-950 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <h3 className="text-lg font-bold mb-4 border-b border-neutral-100 dark:border-neutral-800 pb-3">الإعدادات العامة</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">اسم المرسل (الذي يظهر للمستلم)</label>
                <input 
                  type="text" 
                  name="senderName"
                  defaultValue={settings.senderName}
                  className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">توقيع البريد (يضاف نهاية كل رسالة)</label>
                <textarea 
                  name="signature"
                  rows={3}
                  defaultValue={settings.signature}
                  className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="مثال: مع تحيات، فريق سفانة نجد..."
                />
              </div>
            </div>
          </section>

          {/* Auto Reply */}
          <section className="bg-white dark:bg-neutral-950 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <h3 className="text-lg font-bold">الرد التلقائي</h3>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" name="autoReplyEnabled" defaultChecked={settings.autoReplyEnabled} className="sr-only peer" />
                <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                <span className="ml-3 text-sm font-medium text-neutral-700 dark:text-neutral-300 mr-3">تفعيل الرد التلقائي</span>
              </label>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">عنوان رسالة الرد</label>
                <input 
                  type="text" 
                  name="autoReplySubject"
                  defaultValue={settings.autoReplySubject}
                  className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">نص الرد التلقائي</label>
                <textarea 
                  name="autoReplyBody"
                  rows={4}
                  defaultValue={settings.autoReplyBody}
                  className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </section>

          {/* Security & Spam */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section className="bg-white dark:bg-neutral-950 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
              <h3 className="text-lg font-bold mb-4 border-b border-neutral-100 dark:border-neutral-800 pb-3 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-green-500" />
                القائمة البيضاء (موثوق)
              </h3>
              <p className="text-xs text-neutral-500 mb-3">ضع إيميل واحد في كل سطر. الرسائل من هذه الإيميلات لن تذهب للسبام أبداً.</p>
              <textarea 
                name="trustedEmails"
                rows={5}
                defaultValue={settings.trustedEmails.join("\n")}
                className="w-full bg-green-50/50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-green-500"
                placeholder="example@company.com"
              />
            </section>
            
            <section className="bg-white dark:bg-neutral-950 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
              <h3 className="text-lg font-bold mb-4 border-b border-neutral-100 dark:border-neutral-800 pb-3 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-500" />
                القائمة السوداء (حظر)
              </h3>
              <p className="text-xs text-neutral-500 mb-3">ضع إيميل واحد في كل سطر. الرسائل من هذه الإيميلات ستذهب للسبام فوراً.</p>
              <textarea 
                name="blockedEmails"
                rows={5}
                defaultValue={settings.blockedEmails.join("\n")}
                className="w-full bg-red-50/50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-red-500"
                placeholder="spammer@bad.com"
              />
            </section>
          </div>

          <div className="flex justify-end pt-4">
            <button type="submit" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-200 dark:shadow-none">
              <Save className="w-5 h-5" />
              حفظ الإعدادات
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
