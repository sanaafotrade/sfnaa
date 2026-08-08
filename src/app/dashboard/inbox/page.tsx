"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n";
import {
  Mail, Send, Inbox, Loader2, ArrowRight, Clock,
  Plus, X, Paperclip, Image as ImageIcon, FileText, File,
  Trash2, Reply, Forward, MailOpen,
  RefreshCw, Search, Star, ShieldBan, Trash, MailCheck, MailX,
  CheckCircle, AlertTriangle,
  Square, SquareCheck, Minus, Settings2,
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  Heading1, Heading2, Wand2
} from "lucide-react";

// ============ Types ============
interface EmailRecord {
  id: string;
  to: string;
  from: string;
  subject: string | null;
  text: string | null;
  html: string | null;
  attachments: any;
  status: string;
  isRead: boolean;
  isStarred: boolean;
  createdAt: string;
}

type FolderType = "inbox" | "sent" | "starred" | "spam" | "trash";

// ============ Helpers ============
function getInitials(email: string): string {
  return (email.split("@")[0] || "?").charAt(0).toUpperCase();
}

function getAvatarColor(email: string): string {
  const colors = [
    "bg-blue-500", "bg-emerald-500", "bg-violet-500", "bg-amber-500",
    "bg-rose-500", "bg-cyan-500", "bg-indigo-500", "bg-pink-500",
    "bg-teal-500", "bg-orange-500",
  ];
  let h = 0;
  for (let i = 0; i < email.length; i++) h = email.charCodeAt(i) + ((h << 5) - h);
  return colors[Math.abs(h) % colors.length];
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("en-US", { day: "2-digit", month: "short" });
}

function getPreviewText(email: EmailRecord): string {
  return (email.text || "").replace(/\s+/g, " ").trim().substring(0, 100) || "لا يوجد محتوى";
}

// ============ Folder Config ============
const FOLDERS: { key: FolderType; label: string; labelEn: string; icon: any }[] = [
  { key: "inbox", label: "الوارد", labelEn: "Inbox", icon: Inbox },
  { key: "sent", label: "الصادر", labelEn: "Sent", icon: Send },
  { key: "starred", label: "المميزة", labelEn: "Starred", icon: Star },
  { key: "spam", label: "البريد المزعج", labelEn: "Spam", icon: ShieldBan },
  { key: "trash", label: "المحذوفة", labelEn: "Trash", icon: Trash },
];

// ============ Main Component ============
export default function EmailPage() {
  const { t } = useLanguage();
  const [activeFolder, setActiveFolder] = useState<FolderType>("inbox");
  const [emails, setEmails] = useState<EmailRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState<EmailRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showSettings, setShowSettings] = useState(false);

  // Compose state
  const [showCompose, setShowCompose] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [composeAttachments, setComposeAttachments] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  // ============ Data Loading ============
  const loadEmails = async (showLoader = true) => {
    if (showLoader) setIsLoading(true);
    try {
      const res = await fetch(`/api/emails?tab=${activeFolder}&t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      setEmails(Array.isArray(data) ? data : []);
    } catch {
      if (showLoader) toast.error("حدث خطأ أثناء تحميل الرسائل");
      else setEmails([]);
    } finally {
      if (showLoader) setIsLoading(false);
    }
  };

  useEffect(() => {
    setSelectedEmail(null);
    setSelectedIds(new Set());
    loadEmails(true);

    const interval = setInterval(() => {
      loadEmails(false);
    }, 10000);
    
    return () => clearInterval(interval);
  }, [activeFolder]);

  // ============ Email Actions ============
  const handleOpenEmail = async (email: EmailRecord) => {
    setSelectedEmail(email);
    if (!email.isRead) {
      try {
        await fetch(`/api/emails/${email.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isRead: true })
        });
        setEmails(prev => prev.map(em => em.id === email.id ? { ...em, isRead: true } : em));
      } catch (e) {
        console.error("Failed to mark as read", e);
      }
    }
  };

  const handleToggleStar = async (e: React.MouseEvent, email: EmailRecord) => {
    e.stopPropagation();
    // TODO: Implement star toggle API
    setEmails(prev => prev.map(em => em.id === email.id ? { ...em, isStarred: !em.isStarred } : em));
  };

  // ============ Selection ============
  const filteredEmails = emails.filter(e => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      e.subject?.toLowerCase().includes(q) ||
      e.from?.toLowerCase().includes(q) ||
      e.to?.toLowerCase().includes(q) ||
      e.text?.toLowerCase().includes(q)
    );
  });

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredEmails.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredEmails.map(e => e.id)));
  };

  // ============ Compose ============
  const resetCompose = () => {
    setComposeTo("");
    setComposeSubject("");
    setComposeBody("");
    setComposeAttachments([]);
    if (editorRef.current) {
      editorRef.current.innerHTML = "";
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeTo || !composeSubject || !composeBody) {
      toast.error("جميع الحقول مطلوبة");
      return;
    }
    setIsSending(true);
    try {
      const uploadedFiles = [];
      for (const file of composeAttachments) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const { url } = await res.json();
        uploadedFiles.push({ filename: file.name, url });
      }

      const response = await fetch("/api/emails/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: composeTo,
          subject: composeSubject,
          text: composeBody,
          attachments: uploadedFiles,
        }),
      });

      if (response.ok) {
        toast.success("تم إرسال الرسالة بنجاح! ✉️");
        setTimeout(() => {
          setShowCompose(false);
          resetCompose();
          setActiveFolder("sent");
          loadEmails();
        }, 1500);
      } else {
        toast.error("فشل إرسال الرسالة. يرجى المحاولة مرة أخرى.");
      }
    } catch {
      toast.error("حدث خطأ أثناء الإرسال.");
    } finally {
      setIsSending(false);
    }
  };

  const handleAddFiles = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files);
    setComposeAttachments(prev => [...prev, ...newFiles]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachment = (i: number) => {
    setComposeAttachments(prev => prev.filter((_, j) => j !== i));
  };

  const handleReply = (email: EmailRecord) => {
    resetCompose();
    setComposeTo(email.status === "inbox" ? email.from : email.to);
    setComposeSubject(email.subject?.startsWith("Re:") ? email.subject : `Re: ${email.subject}`);
    setShowCompose(true);
  };

  const handleForward = (email: EmailRecord) => {
    resetCompose();
    setComposeSubject(email.subject?.startsWith("Fwd:") ? email.subject : `Fwd: ${email.subject}`);
    setComposeBody(email.text || "");
    setShowCompose(true);
  };

  const getFileIcon = (name: string) => {
    if (/\.(jpg|jpeg|png|gif|webp)$/i.test(name)) return <ImageIcon className="w-4 h-4 text-emerald-600" />;
    if (/\.pdf$/i.test(name)) return <FileText className="w-4 h-4 text-red-600" />;
    return <File className="w-4 h-4 text-blue-600" />;
  };

  // ============ RENDER ============
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <Mail className="w-7 h-7 text-blue-600" />
            {t({ ar: "البريد الإلكتروني", en: "Email" })}
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1 text-sm">
            {t({ ar: "صادر ووارد رسائل النظام والعقود", en: "Incoming and outgoing system messages" })}
          </p>
        </div>
        <button
          onClick={() => { setShowCompose(true); resetCompose(); }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-xl transition-all flex items-center gap-2 shadow-sm hover:shadow-md"
        >
          <Plus className="w-5 h-5" />
          {t({ ar: "إنشاء رسالة جديدة", en: "Compose New" })}
        </button>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden shadow-2xl border border-neutral-200 dark:border-neutral-800">
            <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-900/50">
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-blue-600" /> 
                {t({ ar: "إعدادات البريد", en: "Email Settings" })}
              </h2>
              <button onClick={() => setShowSettings(false)} className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 p-2 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-900/50">
                <p className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-1">قريباً (Coming Soon)</p>
                <p className="text-xs text-blue-600/80 dark:text-blue-300">
                  إعدادات التوقيع، الرد التلقائي، والبريد المحظور ستتوفر قريباً حسب نظام الصلاحيات الجديد.
                </p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
              <button onClick={() => setShowSettings(false)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition-all">
                {t({ ar: "إغلاق", en: "Close" })}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border border-neutral-200 dark:border-neutral-800 p-6 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">
              يعرض موقع sfnaa.com
            </h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
              هل أنت متأكد من حذف هذه الرسائل؟
            </p>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="px-6 py-2 rounded-xl text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 font-medium transition-colors"
                disabled={isDeleting}
              >
                إلغاء
              </button>
              <button 
                onClick={async () => {
                  setIsDeleting(true);
                  try {
                    const ids = Array.from(selectedIds);
                    await fetch("/api/emails/bulk", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ action: "delete", ids })
                    });
                    setEmails(prev => prev.filter(e => !ids.includes(e.id)));
                    setSelectedIds(new Set());
                    setShowDeleteConfirm(false);
                  } catch { 
                    toast.error("حدث خطأ في الحذف"); 
                  } finally {
                    setIsDeleting(false);
                  }
                }}
                className="px-6 py-2 rounded-xl text-white bg-blue-600 hover:bg-blue-700 font-medium transition-colors flex items-center justify-center min-w-[100px]"
                disabled={isDeleting}
              >
                {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : "حسناً"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm">
        {/* Folder Tabs + Toolbar */}
        <div className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-900/50">
          <div className="flex items-center justify-between px-4 py-2">
            <div className="flex gap-1 overflow-x-auto">
              {FOLDERS.map(f => (
                <button
                  key={f.key}
                  onClick={() => setActiveFolder(f.key)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                    activeFolder === f.key
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  }`}
                >
                  <f.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{t({ ar: f.label, en: f.labelEn })}</span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <div className="relative hidden sm:block">
                <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={t({ ar: "بحث...", en: "Search..." })}
                  className="border border-neutral-200 dark:border-neutral-700 rounded-lg pr-9 pl-3 py-2 text-sm w-44 focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
                />
              </div>
              <button
                onClick={() => setShowSettings(true)}
                title={t({ ar: "إعدادات البريد", en: "Email Settings" })}
                className="p-2 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              >
                <Settings2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => loadEmails(true)}
                title={t({ ar: "تحديث", en: "Refresh" })}
                className="p-2 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Bulk Actions Bar */}
          {!selectedEmail && !showCompose && filteredEmails.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 border-t border-neutral-100 dark:border-neutral-800">
              <button
                onClick={toggleSelectAll}
                className="p-1 text-neutral-400 hover:text-blue-600 transition-colors"
              >
                {selectedIds.size === 0 ? (
                  <Square className="w-5 h-5" />
                ) : selectedIds.size === filteredEmails.length ? (
                  <SquareCheck className="w-5 h-5 text-blue-600" />
                ) : (
                  <Minus className="w-5 h-5 text-blue-600" />
                )}
              </button>
              {selectedIds.size > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-neutral-500 ml-2">{selectedIds.size} {t({ ar: "محدد", en: "selected" })}</span>
                  <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-700 mx-1" />
                  <button 
                    onClick={async () => {
                      try {
                        const ids = Array.from(selectedIds);
                        const isAllRead = ids.every(id => emails.find(e => e.id === id)?.isRead);
                        const action = isAllRead ? "markUnread" : "markRead";
                        await fetch("/api/emails/bulk", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ action, ids })
                        });
                        setEmails(prev => prev.map(e => ids.includes(e.id) ? { ...e, isRead: action === "markRead" } : e));
                        setSelectedIds(new Set());
                      } catch { toast.error("حدث خطأ"); }
                    }} 
                    title={t({ ar: "تعليم مقروء / غير مقروء", en: "Toggle Read/Unread" })} 
                    className="p-1.5 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                  >
                    <MailOpen className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setShowDeleteConfirm(true)} 
                    title={t({ ar: "حذف", en: "Delete" })} 
                    className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ===== Content ===== */}
        {showCompose ? (
          /* ========== COMPOSE VIEW ========== */
          <div className="flex flex-col flex-1 overflow-y-auto">
            <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-3 bg-neutral-50/80 dark:bg-neutral-900/50">
              <button
                onClick={() => { setShowCompose(false); resetCompose(); }}
                className="p-2 text-neutral-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <Send className="w-5 h-5 text-blue-600" />
                {t({ ar: "إنشاء رسالة جديدة", en: "Compose New Message" })}
              </h2>
            </div>
            <form onSubmit={handleSendEmail} className="p-6 md:p-10 space-y-6 flex-1 max-w-4xl mx-auto w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">{t({ ar: "إلى", en: "To" })}</label>
                  <input
                    type="email"
                    value={composeTo}
                    onChange={e => setComposeTo(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm transition-colors"
                    dir="ltr"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">{t({ ar: "الموضوع", en: "Subject" })}</label>
                <input
                  type="text"
                  value={composeSubject}
                  onChange={e => setComposeSubject(e.target.value)}
                  placeholder={t({ ar: "عنوان الرسالة...", en: "Message subject..." })}
                  className="w-full border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm transition-colors"
                  required
                />
              </div>
              {/* Editor / Body */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300">
                    {t({ ar: "محتوى الرسالة", en: "Message Body" })}
                  </label>
                  <button type="button" className="text-xs font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 flex items-center gap-1 bg-violet-50 dark:bg-violet-900/20 hover:bg-violet-100 dark:hover:bg-violet-900/40 px-3 py-1.5 rounded-lg transition-colors">
                    <Wand2 className="w-3.5 h-3.5" /> 
                    {t({ ar: "مساعد الذكاء الاصطناعي", en: "AI Assistant" })}
                  </button>
                </div>
                
                {/* Rich Text Toolbar */}
                <div className="flex flex-wrap items-center gap-1 p-2 bg-neutral-50 dark:bg-neutral-900/80 border border-neutral-300 dark:border-neutral-600 border-b-0 rounded-t-xl text-neutral-600 dark:text-neutral-300 shadow-sm transition-colors">
                  <button type="button" onClick={() => document.execCommand("bold")} className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded transition-colors" title="عريض"><Bold className="w-4 h-4" /></button>
                  <button type="button" onClick={() => document.execCommand("italic")} className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded transition-colors" title="مائل"><Italic className="w-4 h-4" /></button>
                  <button type="button" onClick={() => document.execCommand("underline")} className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded transition-colors" title="تحته خط"><Underline className="w-4 h-4" /></button>
                  <div className="h-4 w-px bg-neutral-300 dark:bg-neutral-700 mx-1" />
                  <button type="button" onClick={() => document.execCommand("justifyLeft")} className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded transition-colors" title="محاذاة يسار"><AlignLeft className="w-4 h-4" /></button>
                  <button type="button" onClick={() => document.execCommand("justifyCenter")} className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded transition-colors" title="محاذاة وسط"><AlignCenter className="w-4 h-4" /></button>
                  <button type="button" onClick={() => document.execCommand("justifyRight")} className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded transition-colors" title="محاذاة يمين"><AlignRight className="w-4 h-4" /></button>
                  <div className="h-4 w-px bg-neutral-300 dark:bg-neutral-700 mx-1" />
                  <button type="button" onClick={() => document.execCommand("formatBlock", false, "H1")} className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded transition-colors" title="عنوان كبير"><Heading1 className="w-4 h-4" /></button>
                  <button type="button" onClick={() => document.execCommand("formatBlock", false, "H2")} className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded transition-colors" title="عنوان متوسط"><Heading2 className="w-4 h-4" /></button>
                </div>
                
                <div 
                  ref={editorRef}
                  contentEditable
                  onInput={(e) => setComposeBody(e.currentTarget.innerHTML)}
                  className="w-full min-h-[300px] border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white rounded-b-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none overflow-y-auto prose dark:prose-invert max-w-none shadow-sm transition-colors"
                  dir="auto"
                />
              </div>

              {/* Attachments */}
              {composeAttachments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {composeAttachments.map((file, i) => (
                    <div key={i} className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full px-4 py-1.5 text-sm">
                      {getFileIcon(file.name)}
                      <span className="truncate max-w-[200px] text-neutral-700 dark:text-neutral-200 font-medium">{file.name}</span>
                      <span className="text-xs text-neutral-400">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                      <button type="button" onClick={() => removeAttachment(i)} className="text-neutral-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-neutral-100 dark:border-neutral-800">
                <label className="cursor-pointer flex items-center gap-2 px-4 py-2.5 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors font-medium">
                  <Paperclip className="w-5 h-5" />
                  <span>{t({ ar: "إرفاق ملف", en: "Attach File" })}</span>
                  <input type="file" multiple className="hidden" ref={fileInputRef} onChange={e => handleAddFiles(e.target.files)} />
                </label>
                <button
                  type="submit"
                  disabled={isSending}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-70 text-white px-8 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20"
                >
                  <Send className="w-5 h-5" />
                  {isSending ? t({ ar: "جاري الإرسال...", en: "Sending..." }) : t({ ar: "إرسال الرسالة", en: "Send Message" })}
                </button>
              </div>
            </form>
          </div>
        ) : selectedEmail ? (
          /* ========== EMAIL VIEW ========== */
          <div className="flex flex-col flex-1 overflow-y-auto">
            <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/80 dark:bg-neutral-900/50">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedEmail(null)}
                  className="p-2 text-neutral-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white truncate max-w-lg">
                  {selectedEmail.subject || "(بدون عنوان)"}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleReply(selectedEmail)} className="p-2 text-neutral-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title={t({ ar: "رد", en: "Reply" })}>
                  <Reply className="w-5 h-5" />
                </button>
                <button onClick={() => handleForward(selectedEmail)} className="p-2 text-neutral-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title={t({ ar: "تحويل", en: "Forward" })}>
                  <Forward className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 md:p-10 flex-1 max-w-4xl mx-auto w-full">
              <div className="flex items-start gap-4 mb-8">
                <div className={`w-12 h-12 rounded-full ${getAvatarColor(selectedEmail.from)} flex items-center justify-center text-white font-bold text-lg shrink-0`}>
                  {getInitials(selectedEmail.from)}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-neutral-900 dark:text-white">{selectedEmail.from}</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">{t({ ar: "إلى", en: "To" })}: {selectedEmail.to}</p>
                  <p className="text-xs text-neutral-400 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(selectedEmail.createdAt).toLocaleString("ar-SA")}
                  </p>
                </div>
              </div>
              <div className="prose dark:prose-invert max-w-none text-neutral-800 dark:text-neutral-200 leading-relaxed whitespace-pre-wrap">
                {selectedEmail.html ? (
                  <div dangerouslySetInnerHTML={{ __html: selectedEmail.html }} />
                ) : (
                  <p>{selectedEmail.text}</p>
                )}
              </div>

              {/* Attachments */}
              {selectedEmail.attachments && Array.isArray(selectedEmail.attachments) && selectedEmail.attachments.length > 0 && (
                <div className="mt-8 pt-6 border-t border-neutral-100 dark:border-neutral-800">
                  <h3 className="text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-3 flex items-center gap-2">
                    <Paperclip className="w-4 h-4" />
                    {t({ ar: "المرفقات", en: "Attachments" })} ({selectedEmail.attachments.length})
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {selectedEmail.attachments.map((att: any, i: number) => {
                      const href = att.url || (att.id && att.email_id ? `/api/emails/attachments/${att.email_id}/${att.id}` : (att.id ? `/api/emails/attachments/${selectedEmail.id}/${att.id}` : "#"));
                      return (
                        <a
                          key={i}
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                        >
                          {getFileIcon(att.filename)}
                          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-200">{att.filename}</span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ========== EMAIL LIST ========== */
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : filteredEmails.length === 0 ? (
              <div className="p-16 flex flex-col items-center justify-center text-center h-full">
                <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-900 rounded-full flex items-center justify-center mb-4">
                  <Mail className="w-8 h-8 text-neutral-400" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200">
                  {t({ ar: "لا توجد رسائل", en: "No messages" })}
                </h3>
                <p className="text-neutral-500 mt-1 max-w-sm">
                  {t({ ar: "لا يوجد شيء لعرضه في هذا المجلد حالياً.", en: "Nothing to show in this folder." })}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {filteredEmails.map(email => {
                  const senderEmail = email.status === "sent" ? email.to : email.from;
                  return (
                    <div
                      key={email.id}
                      onClick={() => handleOpenEmail(email)}
                      className={`relative flex items-center gap-4 px-4 py-3 cursor-pointer transition-all hover:bg-blue-50/50 dark:hover:bg-blue-900/10 border-r-4 ${
                        !email.isRead && email.status === "inbox"
                          ? "bg-white dark:bg-neutral-900 font-bold border-blue-600 shadow-[0_1px_3px_rgba(0,0,0,0.05)] z-10"
                          : "bg-neutral-50/30 dark:bg-neutral-950/50 border-transparent"
                      }`}
                    >
                      {/* Unread indicator dot */}
                      {!email.isRead && email.status === "inbox" && (
                        <div className="absolute top-1/2 -translate-y-1/2 right-1.5 w-2 h-2 bg-blue-600 rounded-full shadow-[0_0_8px_rgba(37,99,235,0.6)] animate-pulse" />
                      )}

                      {/* Checkbox */}
                      <button
                        onClick={e => { e.stopPropagation(); toggleSelect(email.id); }}
                        className="text-neutral-400 hover:text-blue-600 transition-colors shrink-0 mr-2"
                      >
                        {selectedIds.has(email.id) ? (
                          <SquareCheck className="w-5 h-5 text-blue-600" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </button>

                      {/* Star */}
                      <button
                        onClick={e => handleToggleStar(e, email)}
                        className="shrink-0 transition-colors"
                      >
                        <Star className={`w-5 h-5 ${email.isStarred ? "fill-amber-400 text-amber-400" : "text-neutral-300 dark:text-neutral-600 hover:text-amber-400"}`} />
                      </button>

                      {/* Avatar */}
                      <div className={`w-10 h-10 rounded-full ${getAvatarColor(senderEmail)} flex items-center justify-center text-white font-bold shrink-0 text-sm`}>
                        {getInitials(senderEmail)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-3">
                          <p className={`text-sm truncate ${!email.isRead && email.status === "inbox" ? "font-bold text-neutral-900 dark:text-white" : "text-neutral-700 dark:text-neutral-300"}`}>
                            {senderEmail}
                          </p>
                        </div>
                        <div className="col-span-7">
                          <p className={`text-sm truncate ${!email.isRead && email.status === "inbox" ? "font-bold text-neutral-900 dark:text-white" : "text-neutral-600 dark:text-neutral-400"}`}>
                            {email.subject || "(بدون عنوان)"}
                          </p>
                          <p className={`text-xs truncate mt-0.5 ${!email.isRead && email.status === "inbox" ? "text-neutral-500 dark:text-neutral-400" : "text-neutral-400 dark:text-neutral-500"}`}>
                            {getPreviewText(email)}
                          </p>
                        </div>
                        <div className="col-span-2 text-left">
                          <span className={`text-xs whitespace-nowrap ${!email.isRead && email.status === "inbox" ? "font-bold text-blue-600 dark:text-blue-400" : "text-neutral-500"}`}>
                            {formatShortDate(email.createdAt)}
                          </span>
                          {email.attachments && Array.isArray(email.attachments) && email.attachments.length > 0 && (
                            <Paperclip className="w-3 h-3 text-neutral-400 inline-block ml-1" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
