"use client";

import { useState } from "react";
import { Send, Paperclip, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function ComposePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setAttachments(prev => [...prev, ...filesArray]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 1. Upload attachments to Blob if any
      const uploadedFiles = [];
      for (const file of attachments) {
        const formData = new FormData();
        formData.append("file", file);
        
        const res = await fetch(`/api/upload`, { method: "POST", body: formData });
        const { url } = await res.json();
        uploadedFiles.push({ filename: file.name, url });
      }

      // 2. Send email via Resend
      const response = await fetch("/api/emails/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to,
          subject,
          text: message,
          attachments: uploadedFiles
        })
      });

      if (response.ok) {
        toast.success("تم إرسال الرسالة بنجاح!");
        router.push("/dashboard/sent");
      } else {
        toast.error("فشل إرسال الرسالة. يرجى المحاولة مرة أخرى.");
      }
    } catch (error) {
      console.error(error);
      toast.error("حدث خطأ أثناء الإرسال.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-neutral-950">
      <header className="border-b border-neutral-200 dark:border-neutral-800 p-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
          رسالة جديدة
        </h2>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center">
        <form onSubmit={handleSubmit} className="w-full max-w-4xl bg-white dark:bg-neutral-900/50 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden flex flex-col">
          
          <div className="border-b border-neutral-100 dark:border-neutral-800 px-4 py-3 flex items-center gap-2 transition-colors focus-within:bg-blue-50/30 dark:focus-within:bg-blue-900/10">
            <span className="text-neutral-500 font-medium whitespace-nowrap min-w-[3rem]">إلى:</span>
            <input 
              type="email" 
              required
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-neutral-900 dark:text-white placeholder:text-neutral-400" 
              placeholder="example@domain.com"
            />
          </div>
          
          <div className="border-b border-neutral-100 dark:border-neutral-800 px-4 py-3 flex items-center gap-2 transition-colors focus-within:bg-blue-50/30 dark:focus-within:bg-blue-900/10">
            <span className="text-neutral-500 font-medium whitespace-nowrap min-w-[3rem]">الموضوع:</span>
            <input 
              type="text" 
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-neutral-900 dark:text-white font-semibold placeholder:text-neutral-400" 
              placeholder="اكتب عنوان الرسالة..."
            />
          </div>

          <div className="flex-1 p-0 flex flex-col min-h-[400px]">
            <textarea 
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1 w-full bg-transparent border-none outline-none resize-none text-neutral-900 dark:text-white p-4 leading-relaxed placeholder:text-neutral-400"
              placeholder="اكتب رسالتك هنا..."
            />
          </div>

          {/* Attachments Preview */}
          {attachments.length > 0 && (
            <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/80 flex flex-wrap gap-2">
              {attachments.map((file, index) => (
                <div key={index} className="flex items-center gap-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full px-4 py-1.5 text-sm shadow-sm">
                  <Paperclip className="w-4 h-4 text-blue-500" />
                  <span className="truncate max-w-[200px] text-neutral-700 dark:text-neutral-200 font-medium">{file.name}</span>
                  <span className="text-xs text-neutral-400">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                  <button type="button" onClick={() => removeAttachment(index)} className="mr-2 text-neutral-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Actions Footer */}
          <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-950 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="cursor-pointer flex items-center gap-2 px-4 py-2.5 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-xl transition-colors font-medium">
                <Paperclip className="w-5 h-5" />
                <span>إرفاق ملف</span>
                <input type="file" multiple className="hidden" onChange={handleFileChange} />
              </label>
            </div>
            
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed text-white px-8 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 dark:shadow-none"
            >
              <Send className="w-5 h-5" />
              {isSubmitting ? 'جاري الإرسال...' : 'إرسال الرسالة'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
