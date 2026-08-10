"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  FileText,
  Upload,
  Search,
  Trash2,
  Eye,
  Stamp,
  PenTool,
  Settings,
  Loader2,
  Download,
  X,
  Plus,
  Check,
  Star,
  ChevronRight,
  ChevronLeft,
  Edit,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import {
  Letter,
  OrgStamp,
  SavedSignature,
  getLetters,
  saveLetter,
  deleteLetter,
  getOrgStamps,
  saveOrgStamp,
  deleteOrgStamp,
  getSavedSignatures,
  saveSignature,
  deleteSignature,
  generateLetterNumber,
} from "@/lib/letters";
import { uploadToBlob } from "@/lib/uploadBlob";
import toast from "react-hot-toast";
import ConfirmModal from "@/components/ConfirmModal";
import dynamic from "next/dynamic";
import { useRouter } from 'next/navigation';
import { getLetterDocuments, deleteLetterDocument, LetterDocument } from '@/lib/letterTemplate';

const SignaturePad = dynamic(() => import("@/components/SignaturePad"), {
  ssr: false,
});
const LetterEditor = dynamic(() => import("@/components/LetterEditor"), {
  ssr: false,
});

type ModalView = "none" | "upload" | "settings" | "preview" | "stamp-sign" | "editor";
type LetterFilter = "all" | "outgoing" | "incoming" | "internal";

export default function LettersPage() {
  const { lang: language } = useLanguage();
  const isEn = language === "en";

  const [letters, setLetters] = useState<Letter[]>([]);
  const [composedLetters, setComposedLetters] = useState<LetterDocument[]>([]);
  const [stamps, setStamps] = useState<OrgStamp[]>([]);
  const [signatures, setSignatures] = useState<SavedSignature[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const [modalView, setModalView] = useState<ModalView>("none");
  const [selectedLetter, setSelectedLetter] = useState<Letter | null>(null);
  const [filter, setFilter] = useState<LetterFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Upload form state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formType, setFormType] = useState<Letter["type"]>("outgoing");
  const [formNotes, setFormNotes] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stamp/Signature settings
  const [settingsTab, setSettingsTab] = useState<"stamps" | "signatures">("stamps");
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [sigName, setSigName] = useState("");
  const stampFileRef = useRef<HTMLInputElement>(null);

  // Delete confirmation state
  const [confirmDelete, setConfirmDelete] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ open: false, title: "", message: "", onConfirm: () => {} });

  // ===================== Load Data =====================
  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [l, s, sig, composed] = await Promise.all([
        getLetters(),
        getOrgStamps(),
        getSavedSignatures(),
        getLetterDocuments().catch(() => []),
      ]);
      setLetters(l);
      setStamps(s);
      setSignatures(sig);
      setComposedLetters(composed);
    } catch (e) {
      console.error(e);
      toast.error(isEn ? "Failed to load data" : "فشل تحميل البيانات");
    } finally {
      setLoading(false);
    }
  }

  // ===================== Upload Letter =====================
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFile(file);
  };

  const handleUploadLetter = async () => {
    if (!uploadFile || !formTitle.trim()) {
      toast.error(isEn ? "Fill in the title and attach a file" : "أدخل العنوان وأرفق ملف");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    try {
      const fileUrl = await uploadToBlob(uploadFile, (p: number) => setUploadProgress(p));
      const isPdf = uploadFile.type === "application/pdf";

      const userName = "Admin";
      
      const letter: Omit<Letter, "id" | "createdAt" | "updatedAt"> = {
        title: formTitle.trim(),
        letterNumber: generateLetterNumber(formType),
        type: formType,
        fileUrl,
        fileType: isPdf ? "pdf" : "image",
        stampApplied: false,
        signatureApplied: false,
        notes: formNotes.trim(),
        createdBy: "admin",
        createdByName: userName,
        updatedBy: "admin",
        updatedByName: userName,
      };

      await saveLetter(letter);
      toast.success(isEn ? "Letter uploaded successfully!" : "تم رفع الخطاب بنجاح!");
      setModalView("none");
      resetUploadForm();
      loadAll();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || (isEn ? "Upload failed" : "فشل الرفع"));
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const resetUploadForm = () => {
    setUploadFile(null);
    setFormTitle("");
    setFormType("outgoing");
    setFormNotes("");
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ===================== Delete Letter =====================
  const handleDeleteLetter = async (id: string) => {
    setConfirmDelete({
      open: true,
      title: isEn ? "Delete Letter" : "حذف الخطاب",
      message: isEn ? "Are you sure you want to delete this letter? This action cannot be undone." : "هل أنت متأكد من حذف هذا الخطاب؟ لا يمكن التراجع عن هذا الإجراء.",
      onConfirm: async () => {
        try {
          await deleteLetter(id);
          toast.success(isEn ? "Deleted" : "تم الحذف");
          loadAll();
        } catch (e) {
          toast.error(isEn ? "Failed to delete" : "فشل الحذف");
        }
        setConfirmDelete((prev) => ({ ...prev, open: false }));
      },
    });
  };

  // ===================== Stamp Upload =====================
  const handleStampUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error(isEn ? "Please upload an image file" : "يرجى رفع ملف صورة");
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      try {
        await saveOrgStamp({
          name: file.name.replace(/\.[^.]+$/, ""),
          imageDataUrl: dataUrl,
          isDefault: stamps.length === 0, // أول ختم يكون افتراضي
        });
        toast.success(isEn ? "Stamp saved!" : "تم حفظ الختم!");
        loadAll();
      } catch (err) {
        toast.error(isEn ? "Failed to save stamp" : "فشل حفظ الختم");
      }
    };
    reader.readAsDataURL(file);
    if (stampFileRef.current) stampFileRef.current.value = "";
  };

  // ===================== Save Signature =====================
  const handleSaveSignature = async (dataUrl: string) => {
    if (!sigName.trim()) {
      toast.error(isEn ? "Enter signature name" : "أدخل اسم التوقيع");
      return;
    }
    try {
      await saveSignature({
        name: sigName.trim(),
        signatureDataUrl: dataUrl,
        isDefault: signatures.length === 0,
      });
      toast.success(isEn ? "Signature saved!" : "تم حفظ التوقيع!");
      setShowSignaturePad(false);
      setSigName("");
      loadAll();
    } catch (err) {
      toast.error(isEn ? "Failed to save" : "فشل الحفظ");
    }
  };

  // ===================== Set Default =====================
  const setDefaultStamp = async (id: string) => {
    for (const s of stamps) {
      await saveOrgStamp({ ...s, isDefault: s.id === id }, s.id);
    }
    toast.success(isEn ? "Default stamp set" : "تم تعيين الختم الافتراضي");
    loadAll();
  };

  const setDefaultSignature = async (id: string) => {
    for (const s of signatures) {
      await saveSignature({ ...s, isDefault: s.id === id }, s.id);
    }
    toast.success(isEn ? "Default signature set" : "تم تعيين التوقيع الافتراضي");
    loadAll();
  };

  // ===================== Combined & Filtered Letters =====================
  const combinedLetters = useMemo(() => {
    const legacy = letters.map(l => ({
      ...l,
      isComposed: false,
      status: undefined as 'draft' | 'sent' | undefined,
      rawDoc: undefined as any
    }));

    const comp = composedLetters.map(c => {
      const title = c.subjectText 
        ? c.subjectText
        : c.recipientText 
          ? (isEn ? `Letter to: ${c.recipientText}` : `خطاب إلى: ${c.recipientText}`)
          : (isEn ? `Composed Letter (${c.letterNumber})` : `خطاب منشأ (${c.letterNumber})`);

      return {
        id: c.id,
        title,
        letterNumber: c.letterNumber,
        type: 'outgoing' as const,
        fileUrl: '',
        fileType: 'pdf' as const,
        stampApplied: !!c.stampUrl,
        signatureApplied: !!c.signatureUrl,
        finalFileUrl: undefined as string | undefined,
        notes: c.recipientText ? (isEn ? `Recipient: ${c.recipientText}` : `المستلم: ${c.recipientText}`) : '',
        createdBy: c.createdBy,
        createdByName: c.createdBy,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt || c.createdAt,
        updatedByName: undefined as string | undefined,
        isComposed: true,
        status: c.status as 'draft' | 'sent' | undefined,
        rawDoc: c
      };
    });

    const combined = [...legacy, ...comp];
    return combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [letters, composedLetters, isEn]);

  const filteredCombined = useMemo(() => {
    return combinedLetters.filter((l) => {
      if (filter !== "all" && l.type !== filter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          l.title.toLowerCase().includes(q) ||
          (l.letterNumber || "").toLowerCase().includes(q) ||
          (l.notes || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [combinedLetters, filter, searchQuery]);

  // ===================== Type Badge =====================
  const typeBadge = (type: Letter["type"]) => {
    const config = {
      outgoing: { label: isEn ? "Outgoing" : "صادر", cls: "bg-blue-100 text-blue-700" },
      incoming: { label: isEn ? "Incoming" : "وارد", cls: "bg-emerald-100 text-emerald-700" },
      internal: { label: isEn ? "Internal" : "داخلي", cls: "bg-amber-100 text-amber-700" },
    };
    const c = config[type];
    return (
      <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${c.cls}`}>
        {c.label}
      </span>
    );
  };

  // ===================== RENDER =====================
  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-800">
                  {isEn ? "Letters Management" : "إدارة الخطابات"}
                </h1>
                <p className="text-slate-500 text-sm mt-0.5">
                  {isEn
                    ? "Upload, stamp, and sign official letters"
                    : "رفع الخطابات الرسمية وختمها وتوقيعها إلكترونياً"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setModalView("settings")}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-all"
              >
                <Settings className="w-4 h-4" />
                {isEn ? "Stamp & Signature" : "الختم والتوقيع"}
              </button>
              <a
                href="/dashboard/hr/letters/compose?lang=ar"
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-sm"
              >
                <FileText className="w-4 h-4" />
                {isEn ? "Compose (AR)" : "إنشاء خطاب عربي"}
              </a>
              <a
                href="/dashboard/hr/letters/compose?lang=en"
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-sm"
              >
                <FileText className="w-4 h-4" />
                {isEn ? "Compose (EN)" : "إنشاء خطاب إنجليزي"}
              </a>
              <button
                onClick={() => {
                  resetUploadForm();
                  setModalView("upload");
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-sm"
              >
                <Upload className="w-4 h-4" />
                {isEn ? "Upload Letter" : "رفع خطاب"}
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isEn ? "Search by title or number..." : "بحث بالعنوان أو الرقم..."}
              className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            {(["all", "outgoing", "incoming", "internal"] as LetterFilter[]).map((f) => {
              const labels: Record<LetterFilter, string> = {
                all: isEn ? "All" : "الكل",
                outgoing: isEn ? "Outgoing" : "صادر",
                incoming: isEn ? "Incoming" : "وارد",
                internal: isEn ? "Internal" : "داخلي",
              };
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 text-sm font-bold rounded-xl transition-all ${
                    filter === f
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {labels[f]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Letters Grid */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : filteredCombined.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">
              {isEn ? "No letters found" : "لا يوجد خطابات"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCombined.map((letter) => {
              const createdDate = new Date(letter.createdAt);
              const updatedDate = new Date(letter.updatedAt);
              const gregCreated = createdDate.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
              const gregUpdated = updatedDate.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
              const wasEdited = letter.updatedAt !== letter.createdAt;

              return (
              <div
                key={letter.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group overflow-hidden"
              >
                {/* Preview Thumbnail */}
                <div className="relative h-40 bg-slate-50 flex items-center justify-center border-b border-slate-100">
                  {letter.isComposed ? (
                    /* Composed Letter Thumbnail Guide */
                    <div className="w-full h-full bg-gradient-to-br from-red-50 to-pink-50 flex flex-col items-center justify-center p-4 border-b border-red-100/50">
                      <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm text-red-500 mb-2.5 border border-red-100">
                        <FileText className="w-7 h-7" />
                      </div>
                      <span className="text-[11px] bg-red-100 text-red-700 font-bold px-3 py-1 rounded-full shadow-sm">{isEn ? 'Digital Letter' : 'خطاب إلكتروني'}</span>
                    </div>
                  ) : letter.fileType === "image" || letter.finalFileUrl ? (
                    <img
                      src={letter.finalFileUrl || letter.fileUrl}
                      alt={letter.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.style.display = "none";
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = "flex";
                      }}
                    />
                  ) : null}
                  
                  {!letter.isComposed && (
                    <div className={`text-center flex-col items-center justify-center ${letter.fileType === "image" || letter.finalFileUrl ? "hidden" : "flex"}`}>
                      <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-2 border border-slate-200">
                        <FileText className="w-7 h-7 text-slate-400" />
                      </div>
                      <span className="text-[11px] bg-slate-100 text-slate-600 font-bold px-3 py-1 rounded-full">{letter.fileType === "pdf" ? "PDF Document" : isEn ? "Scanned Image" : "ملف مرفوع"}</span>
                    </div>
                  )}

                  {/* Status badges */}
                  <div className="absolute top-2 left-2 flex gap-1">
                    {letter.isComposed ? (
                      <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full ${letter.status === 'sent' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {letter.status === 'sent' ? (isEn ? 'Finalized' : 'مُقفل') : (isEn ? 'Draft' : 'مسودة')}
                      </span>
                    ) : (
                      <>
                        {letter.stampApplied && (
                          <span className="bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                            <Stamp className="w-3 h-3 inline -mt-0.5" /> {isEn ? "Stamped" : "مختوم"}
                          </span>
                        )}
                        {letter.signatureApplied && (
                          <span className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                            <PenTool className="w-3 h-3 inline -mt-0.5" /> {isEn ? "Signed" : "موقّع"}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  {/* Type badge */}
                  <div className="absolute top-2 right-2">
                    {typeBadge(letter.type)}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                  {/* Title + Number */}
                  <div>
                    <h3 className="font-bold text-slate-800 truncate text-sm">{letter.title}</h3>
                    {letter.letterNumber && (
                      <p className="text-[11px] text-slate-400 mt-0.5 font-mono">{letter.letterNumber}</p>
                    )}
                  </div>

                  {/* Notes */}
                  {letter.notes && (
                    <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-100 px-2.5 py-1.5 rounded-lg leading-relaxed line-clamp-2">
                      ✨ {letter.notes}
                    </p>
                  )}

                  {/* Dates — Gregorian only */}
                  <div className="bg-slate-50 rounded-xl px-3 py-2 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-medium">{isEn ? "Created" : "الإنشاء"}</span>
                      <span className="text-slate-600 font-bold">{gregCreated}</span>
                    </div>
                    {wasEdited && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 font-medium">{isEn ? "Updated" : "آخر تحديث"}</span>
                        <span className="text-slate-600 font-bold">{gregUpdated}</span>
                      </div>
                    )}
                  </div>

                  {/* Uploader / Editor */}
                  <div className="flex items-center gap-3 text-[11px]">
                    {letter.createdByName && (
                      <div className="flex items-center gap-1 text-slate-500">
                        <Upload className="w-3 h-3 text-slate-400" />
                        <span className="font-medium">{letter.createdByName}</span>
                      </div>
                    )}
                    {wasEdited && letter.updatedByName && (
                      <div className="flex items-center gap-1 text-blue-500">
                        <Edit className="w-3 h-3" />
                        <span className="font-medium">{letter.updatedByName}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                    {letter.isComposed ? (
                      <button
                        onClick={() => router.push(`/dashboard/hr/letters/compose?id=${letter.id}`)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-red-50 text-red-700 text-xs font-bold rounded-xl hover:bg-red-100 transition-all border border-red-100"
                      >
                        {letter.status === 'sent' ? <Eye className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                        {letter.status === 'sent' ? (isEn ? 'View Letter' : 'عرض الخطاب') : (isEn ? 'Edit Letter' : 'تعديل الخطاب')}
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedLetter(letter);
                          setModalView("editor");
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200 transition-all"
                      >
                        <Eye className="w-4 h-4" />
                        {isEn ? "Open File" : "فتح الملف"}
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (letter.isComposed) {
                          setConfirmDelete({
                            open: true,
                            title: isEn ? 'Delete Letter' : 'حذف الخطاب',
                            message: isEn ? `Delete letter ${letter.letterNumber}?` : `حذف الخطاب ${letter.letterNumber}؟`,
                            onConfirm: async () => {
                              try {
                                await deleteLetterDocument(letter.id);
                                toast.success(isEn ? 'Deleted' : 'تم الحذف');
                                loadAll();
                              } catch {
                                toast.error(isEn ? 'Error' : 'خطأ');
                              }
                              setConfirmDelete(prev => ({ ...prev, open: false }));
                            },
                          });
                        } else {
                          handleDeleteLetter(letter.id);
                        }
                      }}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>



      {/* ================= MODALS ================= */}

      {/* Upload Modal */}
      {modalView === "upload" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">
                {isEn ? "Upload Letter" : "رفع خطاب جديد"}
              </h2>
              <button onClick={() => setModalView("none")} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              {/* Title */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  {isEn ? "Letter Title *" : "عنوان الخطاب *"}
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                  placeholder={isEn ? "e.g. Employee Certificate" : "مثال: خطاب تعريف موظف"}
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  {isEn ? "Letter Type" : "نوع الخطاب"}
                </label>
                <div className="flex gap-2">
                  {(["outgoing", "incoming", "internal"] as Letter["type"][]).map((t) => {
                    const labels = {
                      outgoing: isEn ? "Outgoing" : "صادر",
                      incoming: isEn ? "Incoming" : "وارد",
                      internal: isEn ? "Internal" : "داخلي",
                    };
                    return (
                      <button
                        key={t}
                        onClick={() => setFormType(t)}
                        className={`flex-1 px-4 py-2.5 text-sm font-bold rounded-xl transition-all ${
                          formType === t
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {labels[t]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  {isEn ? "Attach File *" : "إرفاق الملف *"}
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                    uploadFile
                      ? "border-emerald-300 bg-emerald-50"
                      : "border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/50"
                  }`}
                >
                  {uploadFile ? (
                    <div>
                      <Check className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                      <p className="text-sm font-bold text-emerald-700">{uploadFile.name}</p>
                      <p className="text-xs text-emerald-500 mt-1">
                        {(uploadFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-slate-500">
                        {isEn ? "Click to select a file" : "اضغط لاختيار ملف"}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        PDF, JPEG, PNG — {isEn ? "Max 2MB" : "أقصى حجم 2MB"}
                      </p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* Progress Bar */}
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>{isEn ? "Uploading..." : "جاري الرفع..."}</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2.5">
                    <div
                      className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  {isEn ? "Notes" : "ملاحظات"}
                </label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium resize-none"
                  placeholder={isEn ? "Optional notes..." : "ملاحظات اختيارية..."}
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex gap-3">
              <button
                onClick={handleUploadLetter}
                disabled={isUploading || !uploadFile || !formTitle.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Upload className="w-5 h-5" />
                )}
                {isEn ? "Upload" : "رفع الخطاب"}
              </button>
              <button
                onClick={() => setModalView("none")}
                className="px-5 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all"
              >
                {isEn ? "Cancel" : "إلغاء"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {modalView === "preview" && selectedLetter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white/95 backdrop-blur z-10 rounded-t-3xl">
              <div>
                <h2 className="text-xl font-bold text-slate-800">{selectedLetter.title}</h2>
                {selectedLetter.letterNumber && (
                  <p className="text-xs text-slate-400 font-mono mt-1">{selectedLetter.letterNumber}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={selectedLetter.finalFileUrl || selectedLetter.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                >
                  <Download className="w-5 h-5" />
                </a>
                <button onClick={() => setModalView("none")} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 flex items-center justify-center min-h-[400px]">
              {selectedLetter.fileType === "image" ? (
                <img
                  src={selectedLetter.finalFileUrl || selectedLetter.fileUrl}
                  alt={selectedLetter.title}
                  className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-lg"
                />
              ) : (
                <iframe
                  src={selectedLetter.finalFileUrl || selectedLetter.fileUrl}
                  className="w-full h-[70vh] rounded-xl border border-slate-200"
                  title={selectedLetter.title}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal (Stamps & Signatures) */}
      {modalView === "settings" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white/95 backdrop-blur z-10 rounded-t-3xl">
              <h2 className="text-xl font-bold text-slate-800">
                {isEn ? "Stamp & Signature Settings" : "إعدادات الختم والتوقيع"}
              </h2>
              <button onClick={() => setModalView("none")} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200">
              <button
                onClick={() => setSettingsTab("stamps")}
                className={`flex-1 py-3 text-sm font-bold transition-all ${
                  settingsTab === "stamps"
                    ? "text-indigo-600 border-b-2 border-indigo-600"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Stamp className="w-4 h-4 inline -mt-0.5 mr-1 ml-1" />
                {isEn ? "Stamps" : "الأختام"}
              </button>
              <button
                onClick={() => setSettingsTab("signatures")}
                className={`flex-1 py-3 text-sm font-bold transition-all ${
                  settingsTab === "signatures"
                    ? "text-indigo-600 border-b-2 border-indigo-600"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <PenTool className="w-4 h-4 inline -mt-0.5 mr-1 ml-1" />
                {isEn ? "Signatures" : "التوقيعات"}
              </button>
            </div>

            <div className="p-6 space-y-4">
              {settingsTab === "stamps" ? (
                <>
                  {/* Upload Stamp Button */}
                  <button
                    onClick={() => stampFileRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 font-bold hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all"
                  >
                    <Plus className="w-5 h-5" />
                    {isEn ? "Upload Stamp Image (PNG)" : "رفع صورة الختم (PNG)"}
                  </button>
                  <input
                    ref={stampFileRef}
                    type="file"
                    accept="image/*"
                    onChange={handleStampUpload}
                    className="hidden"
                  />

                  {/* Saved Stamps */}
                  {stamps.length === 0 ? (
                    <p className="text-center text-slate-400 py-8">
                      {isEn ? "No stamps saved yet" : "لم يتم حفظ أي أختام بعد"}
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {stamps.map((s) => (
                        <div
                          key={s.id}
                          className={`relative p-4 rounded-xl border-2 transition-all ${
                            s.isDefault
                              ? "border-indigo-500 bg-indigo-50/50"
                              : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          {s.isDefault && (
                            <span className="absolute top-2 left-2 bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                              <Star className="w-3 h-3" /> {isEn ? "Default" : "افتراضي"}
                            </span>
                          )}
                          <img
                            src={s.imageDataUrl}
                            alt={s.name}
                            className="w-full h-24 object-contain mb-3"
                          />
                          <p className="text-xs font-bold text-slate-700 text-center truncate">{s.name}</p>
                          <div className="flex gap-2 mt-2">
                            {!s.isDefault && (
                              <button
                                onClick={() => setDefaultStamp(s.id)}
                                className="flex-1 text-xs px-2 py-1.5 bg-indigo-50 text-indigo-700 font-bold rounded-lg hover:bg-indigo-100 transition-all"
                              >
                                {isEn ? "Set Default" : "تعيين افتراضي"}
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setConfirmDelete({
                                  open: true,
                                  title: isEn ? "Delete Stamp" : "حذف الختم",
                                  message: isEn ? "Are you sure you want to delete this stamp?" : "هل أنت متأكد من حذف هذا الختم؟",
                                  onConfirm: async () => {
                                    await deleteOrgStamp(s.id);
                                    loadAll();
                                    setConfirmDelete((prev) => ({ ...prev, open: false }));
                                  },
                                });
                              }}
                              className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* New Signature */}
                  {showSignaturePad ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={sigName}
                        onChange={(e) => setSigName(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                        placeholder={isEn ? "Signer's name" : "اسم صاحب التوقيع"}
                      />
                      <SignaturePad
                        onSave={handleSaveSignature}
                        onCancel={() => setShowSignaturePad(false)}
                        isEn={isEn}
                      />
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowSignaturePad(true)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 font-bold hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all"
                    >
                      <PenTool className="w-5 h-5" />
                      {isEn ? "Draw New Signature" : "رسم توقيع جديد"}
                    </button>
                  )}

                  {/* Saved Signatures */}
                  {signatures.length === 0 && !showSignaturePad ? (
                    <p className="text-center text-slate-400 py-8">
                      {isEn ? "No signatures saved yet" : "لم يتم حفظ أي توقيعات بعد"}
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {signatures.map((s) => (
                        <div
                          key={s.id}
                          className={`relative p-4 rounded-xl border-2 transition-all ${
                            s.isDefault
                              ? "border-emerald-500 bg-emerald-50/50"
                              : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          {s.isDefault && (
                            <span className="absolute top-2 left-2 bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                              <Star className="w-3 h-3" /> {isEn ? "Default" : "افتراضي"}
                            </span>
                          )}
                          <div className="bg-white rounded-lg p-2 mb-3 border border-slate-100">
                            <img
                              src={s.signatureDataUrl}
                              alt={s.name}
                              className="w-full h-16 object-contain"
                            />
                          </div>
                          <p className="text-xs font-bold text-slate-700 text-center truncate">{s.name}</p>
                          <div className="flex gap-2 mt-2">
                            {!s.isDefault && (
                              <button
                                onClick={() => setDefaultSignature(s.id)}
                                className="flex-1 text-xs px-2 py-1.5 bg-emerald-50 text-emerald-700 font-bold rounded-lg hover:bg-emerald-100 transition-all"
                              >
                                {isEn ? "Set Default" : "تعيين افتراضي"}
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setConfirmDelete({
                                  open: true,
                                  title: isEn ? "Delete Signature" : "حذف التوقيع",
                                  message: isEn ? "Are you sure you want to delete this signature?" : "هل أنت متأكد من حذف هذا التوقيع؟",
                                  onConfirm: async () => {
                                    await deleteSignature(s.id);
                                    loadAll();
                                    setConfirmDelete((prev) => ({ ...prev, open: false }));
                                  },
                                });
                              }}
                              className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Full-Screen Editor — View + Stamp + Sign + Text */}
      {modalView === "editor" && selectedLetter && (
        <LetterEditor
          letter={selectedLetter}
          stamps={stamps}
          signatures={signatures}
          isEn={isEn}
          onClose={() => setModalView("none")}
          onSaved={() => {
            setModalView("none");
            loadAll();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={confirmDelete.open}
        title={confirmDelete.title}
        message={confirmDelete.message}
        confirmText={isEn ? "Delete" : "حذف"}
        cancelText={isEn ? "Cancel" : "إلغاء"}
        variant="danger"
        onConfirm={confirmDelete.onConfirm}
        onCancel={() => setConfirmDelete((prev) => ({ ...prev, open: false }))}
      />
    </div>
  );
}
