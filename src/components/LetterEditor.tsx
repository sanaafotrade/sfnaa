"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  X, Trash2, Check, Loader2, ChevronRight, ChevronLeft,
  Stamp, PenTool, Type, ZoomIn, ZoomOut,
} from "lucide-react";
import { Letter, OrgStamp, SavedSignature, saveLetter } from "@/lib/letters";
import { uploadToBlob } from "@/lib/uploadBlob";
import toast from "react-hot-toast";

// ======================== Types ========================

interface Overlay {
  id: string;
  type: "stamp" | "signature" | "text";
  page: number;
  // Position as percentage (0-1) of image dimensions
  xPct: number;
  yPct: number;
  widthPct: number;
  imageUrl?: string;
  text?: string;
  fontSize?: number;
  fontColor?: string;
  tintColor?: string; // Color tint for signatures/stamps (CSS filter)
  opacity: number; // 0-1
  naturalAspect: number; // height/width ratio
}

interface PageImage {
  src: string;
  naturalWidth: number;
  naturalHeight: number;
}

interface Props {
  letter: Letter;
  stamps: OrgStamp[];
  signatures: SavedSignature[];
  isEn: boolean;
  onClose: () => void;
  onSaved: () => void;
}

// ======================== Component ========================

export default function LetterEditor({ letter, stamps, signatures, isEn, onClose, onSaved }: Props) {
  // Pages
  const [pages, setPages] = useState<PageImage[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const pdfDocRef = useRef<any>(null);

  // Overlays
  const [overlays, setOverlays] = useState<Overlay[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const clipboardRef = useRef<Overlay | null>(null);

  // Dragging
  const dragRef = useRef<{
    id: string; mode: "move" | "resize";
    startX: number; startY: number;
    startXPct: number; startYPct: number;
    startWPct: number;
  } | null>(null);

  // Container ref for coordinate mapping
  const imgRef = useRef<HTMLImageElement>(null);

  const isPdf = letter.fileType === "pdf";

  // Which version to show
  const [showOriginal, setShowOriginal] = useState(false);
  const hasFinal = !!letter.finalFileUrl;
  const activeFileUrl = (!showOriginal && hasFinal) ? letter.finalFileUrl! : letter.fileUrl;

  // ======================== Load Document ========================

  useEffect(() => {
    setLoading(true);
    setPages([]);

    // Determine if the active URL is a PDF
    // Note: older final files might be .jpg, but new ones are .pdf.
    // Check if the URL explicitly ends with .pdf or contains .pdf?
    const isActivePdf = activeFileUrl.toLowerCase().includes(".pdf");

    if (isActivePdf) {
      loadAllPdfPages(activeFileUrl);
    } else {
      // Image or older JPEG final file
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        setPages([{ src: activeFileUrl, naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight }]);
        setTotalPages(1);
        setCurrentPage(1);
        setLoading(false);
      };
      img.onerror = () => { toast.error(isEn ? "Failed to load" : "فشل التحميل"); setLoading(false); };
      img.src = activeFileUrl;
    }
  }, [activeFileUrl]);

  async function loadAllPdfPages(fileUrl: string) {
    try {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
      const doc = await pdfjs.getDocument({
        url: fileUrl,
        cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/cmaps/`,
        cMapPacked: true,
      }).promise;
      pdfDocRef.current = doc;
      setTotalPages(doc.numPages);

      // Render all pages
      const allPages: PageImage[] = [];
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const scale = 2;
        const vp = page.getViewport({ scale });
        const c = document.createElement("canvas");
        c.width = vp.width;
        c.height = vp.height;
        await page.render({ canvasContext: c.getContext("2d")!, viewport: vp }).promise;
        allPages.push({ src: c.toDataURL("image/png"), naturalWidth: vp.width, naturalHeight: vp.height });
      }
      setPages(allPages);
      setLoading(false);
    } catch (err) {
      console.error("PDF load error:", err);
      toast.error(isEn ? "Failed to load PDF" : "فشل تحميل الملف");
      setLoading(false);
    }
  }

  // ======================== Keyboard Shortcuts ========================

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Check if user is typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      const isTyping = tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable;

      // Escape = blur focused input first, then deselect overlay
      if (e.key === "Escape") {
        if (isTyping) {
          (e.target as HTMLElement)?.blur();
        } else {
          setActiveId(null);
        }
        return;
      }

      // T = add text overlay (only when not typing in input)
      if ((e.key === "t" || e.key === "T") && !isTyping && !e.ctrlKey && !e.metaKey) {
        e.preventDefault(); addTextOverlay(); return;
      }

      // Delete/Backspace = remove active overlay (only when not typing)
      if ((e.key === "Delete" || e.key === "Backspace") && activeId && !isTyping) {
        e.preventDefault(); removeOverlay(activeId); return;
      }

      // Ctrl/Cmd + C = copy active overlay
      if ((e.ctrlKey || e.metaKey) && e.key === "c" && activeId) {
        // Allow normal text copy when typing, only copy overlay when not typing
        if (!isTyping) {
          const overlay = overlays.find(o => o.id === activeId);
          if (overlay) { clipboardRef.current = { ...overlay }; toast.success(isEn ? "Copied" : "تم النسخ", { duration: 1000 }); }
        }
        return;
      }

      // Ctrl/Cmd + V = paste overlay (only when not typing)
      if ((e.ctrlKey || e.metaKey) && e.key === "v" && clipboardRef.current && !isTyping) {
        e.preventDefault();
        const src = clipboardRef.current;
        const newOverlay: Overlay = {
          ...src,
          id: `${src.type}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          page: currentPage,
          xPct: Math.min(src.xPct + 0.03, 0.95),
          yPct: Math.min(src.yPct + 0.03, 0.95),
        };
        setOverlays(prev => [...prev, newOverlay]);
        setActiveId(newOverlay.id);
        toast.success(isEn ? "Pasted" : "تم اللصق", { duration: 1000 });
        return;
      }

      // Arrow keys = move active overlay (works even from textarea — user expects visual movement)
      if (activeId && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key) && !isTyping) {
        e.preventDefault();
        const step = e.shiftKey ? 0.01 : 0.003; // Shift = bigger steps
        const overlay = overlays.find(o => o.id === activeId);
        if (!overlay) return;
        const updates: Partial<Overlay> = {};
        if (e.key === "ArrowUp") updates.yPct = Math.max(0, overlay.yPct - step);
        if (e.key === "ArrowDown") updates.yPct = Math.min(1, overlay.yPct + step);
        if (e.key === "ArrowLeft") updates.xPct = Math.max(0, overlay.xPct - step);
        if (e.key === "ArrowRight") updates.xPct = Math.min(1, overlay.xPct + step);
        updateOverlay(activeId, updates);
        return;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeId, overlays, currentPage, isEn]);

  // ======================== Overlays ========================

  // Trims transparent whitespace from an image and returns a cropped data URL + new aspect ratio
  function trimImage(img: HTMLImageElement): { dataUrl: string; aspect: number } {
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const { data, width, height } = imageData;

    // Find bounding box of non-transparent pixels
    let top = height, left = width, bottom = 0, right = 0;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const alpha = data[(y * width + x) * 4 + 3];
        if (alpha > 10) { // threshold to ignore near-invisible pixels
          if (y < top) top = y;
          if (y > bottom) bottom = y;
          if (x < left) left = x;
          if (x > right) right = x;
        }
      }
    }

    // If no visible pixels found, return original
    if (bottom <= top || right <= left) {
      return { dataUrl: img.src, aspect: img.naturalHeight / img.naturalWidth };
    }

    // Add a small padding (2% of dimensions)
    const padX = Math.round((right - left) * 0.02);
    const padY = Math.round((bottom - top) * 0.02);
    const cropLeft = Math.max(0, left - padX);
    const cropTop = Math.max(0, top - padY);
    const cropWidth = Math.min(width - cropLeft, right - left + padX * 2);
    const cropHeight = Math.min(height - cropTop, bottom - top + padY * 2);

    // Create cropped canvas
    const cropped = document.createElement("canvas");
    cropped.width = cropWidth;
    cropped.height = cropHeight;
    const cCtx = cropped.getContext("2d")!;
    cCtx.drawImage(canvas, cropLeft, cropTop, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

    return {
      dataUrl: cropped.toDataURL("image/png"),
      aspect: cropHeight / cropWidth,
    };
  }

  function addOverlay(type: "stamp" | "signature", imageUrl: string) {
    const img = new Image();
    if (!imageUrl.startsWith("data:")) img.crossOrigin = "anonymous";
    img.onload = () => {
      const { dataUrl: trimmedUrl, aspect } = trimImage(img);
      const newOverlay: Overlay = {
        id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        type,
        page: currentPage,
        xPct: 0.55,
        yPct: 0.7,
        widthPct: type === "stamp" ? 0.18 : 0.14,
        imageUrl: trimmedUrl,
        opacity: 1,
        naturalAspect: aspect,
      };
      setOverlays(prev => [...prev, newOverlay]);
      setActiveId(newOverlay.id);
    };
    img.src = imageUrl;
  }

  function addTextOverlay() {
    const newOverlay: Overlay = {
      id: `text-${Date.now()}`,
      type: "text",
      page: currentPage,
      xPct: 0.5,
      yPct: 0.5,
      widthPct: 0.25,
      text: isEn ? "Type here..." : "اكتب هنا...",
      fontSize: 16,
      fontColor: "#000000",
      opacity: 1,
      naturalAspect: 0.15,
    };
    setOverlays(prev => [...prev, newOverlay]);
    setActiveId(newOverlay.id);
  }

  function updateOverlay(id: string, updates: Partial<Overlay>) {
    setOverlays(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
  }

  function removeOverlay(id: string) {
    setOverlays(prev => prev.filter(o => o.id !== id));
    if (activeId === id) setActiveId(null);
  }

  // ======================== Pointer Events ========================

  function getRelativePos(e: React.PointerEvent | PointerEvent): { xPct: number; yPct: number } | null {
    const img = imgRef.current;
    if (!img) return null;
    const rect = img.getBoundingClientRect();
    return {
      xPct: (e.clientX - rect.left) / rect.width,
      yPct: (e.clientY - rect.top) / rect.height,
    };
  }

  function handlePointerDown(e: React.PointerEvent, id: string, mode: "move" | "resize") {
    e.preventDefault();
    e.stopPropagation();
    const overlay = overlays.find(o => o.id === id);
    if (!overlay) return;
    setActiveId(id);

    dragRef.current = {
      id, mode,
      startX: e.clientX, startY: e.clientY,
      startXPct: overlay.xPct, startYPct: overlay.yPct,
      startWPct: overlay.widthPct,
    };

    const onMove = (ev: PointerEvent) => {
      if (!dragRef.current) return;
      const img = imgRef.current;
      if (!img) return;
      const rect = img.getBoundingClientRect();
      const { mode: m, startX, startY, startXPct, startYPct, startWPct } = dragRef.current;

      if (m === "move") {
        const dx = (ev.clientX - startX) / rect.width;
        const dy = (ev.clientY - startY) / rect.height;
        updateOverlay(id, { xPct: Math.max(0, Math.min(1, startXPct + dx)), yPct: Math.max(0, Math.min(1, startYPct + dy)) });
      } else {
        const dx = (ev.clientX - startX) / rect.width;
        const newW = Math.max(0.04, startWPct + dx);
        updateOverlay(id, { widthPct: newW });
      }
    };

    const onUp = () => {
      dragRef.current = null;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  // ======================== Download & Print ========================

  const handleDownload = async () => {
    try {
      toast.loading(isEn ? "Downloading..." : "جاري التنزيل...", { id: "dl" });
      const res = await fetch(activeFileUrl);
      if (!res.ok) throw new Error("Fetch failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = letter.title ? `${letter.title}${activeFileUrl.includes('.pdf') ? '.pdf' : '.jpg'}` : "document";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      toast.success(isEn ? "Downloaded" : "تم التنزيل", { id: "dl" });
    } catch (error) {
      console.error(error);
      toast.dismiss("dl");
      window.open(activeFileUrl, "_blank");
    }
  };

  const handlePrint = () => {
    // If it's a PDF, we can use an iframe to print
    if (activeFileUrl.toLowerCase().includes(".pdf")) {
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.src = activeFileUrl;
      document.body.appendChild(iframe);
      iframe.onload = () => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          // Cleanup after a delay
          setTimeout(() => document.body.removeChild(iframe), 10000);
        } catch (e) {
          document.body.removeChild(iframe);
          window.open(activeFileUrl, "_blank");
        }
      };
    } else {
      // For images, open in new tab (some browsers block iframe image printing)
      window.open(activeFileUrl, "_blank");
    }
  };

  // ======================== Save ========================

  async function handleSave() {
    if (overlays.length === 0) {
      toast.error(isEn ? "Add stamp, signature or text first" : "أضف ختم أو توقيع أو نص أولاً");
      return;
    }

    setSaving(true);
    try {
      let finalBlob: Blob;
      let finalFileName: string;

      if (isPdf) {
        // ===== Save as Multi-page PDF (using pdf-lib) =====
        const { PDFDocument } = await import("pdf-lib");
        
        // Fetch the currently displayed PDF (could be original or final with previous edits)
        const pdfRes = await fetch(activeFileUrl);
        const pdfBytes = await pdfRes.arrayBuffer();
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const pdfPages = pdfDoc.getPages();

        for (const overlay of overlays) {
          const pageIndex = overlay.page - 1;
          if (pageIndex < 0 || pageIndex >= pdfPages.length) continue;
          
          const pdfPage = pdfPages[pageIndex];
          const { width: pdfW, height: pdfH } = pdfPage.getSize();
          
          // Position relative to actual PDF dimensions
          const ox = overlay.xPct * pdfW;
          const oy = overlay.yPct * pdfH;
          const ow = overlay.widthPct * pdfW;

          if (overlay.type === "text" && overlay.text) {
            // ── Text overlay: match the display exactly ──
            // The display renders at raw fontSize px inside a container
            // that is overlay.widthPct of the displayed image width.
            // We need to compute the same ratio for the PDF.
            const displayedImgWidth = imgRef.current?.clientWidth || 800;
            const scaleFactor = pdfW / displayedImgWidth;
            const scaledFontSize = Math.round((overlay.fontSize || 16) * scaleFactor);

            // Calculate actual text height with word-wrap
            const measureCanvas = document.createElement("canvas");
            const measureCtx = measureCanvas.getContext("2d")!;
            measureCtx.font = `bold ${scaledFontSize}px "Segoe UI", Arial, sans-serif`;
            const textLines: string[] = [];
            const words = overlay.text.split(" ");
            let line = "";
            for (const word of words) {
              const test = line + word + " ";
              if (measureCtx.measureText(test).width > ow && line.length > 0) {
                textLines.push(line.trim());
                line = word + " ";
              } else {
                line = test;
              }
            }
            if (line.trim()) textLines.push(line.trim());
            const lineHeight = scaledFontSize * 1.3;
            const textHeight = Math.max(lineHeight, textLines.length * lineHeight + scaledFontSize * 0.3);

            // Render text canvas
            const canvas = document.createElement("canvas");
            const hiDpi = 4;
            canvas.width = ow * hiDpi;
            canvas.height = textHeight * hiDpi;
            const ctx = canvas.getContext("2d")!;
            ctx.scale(hiDpi, hiDpi);

            ctx.font = `bold ${scaledFontSize}px "Segoe UI", Arial, sans-serif`;
            ctx.fillStyle = overlay.fontColor || "#000000";
            ctx.globalAlpha = overlay.opacity;
            ctx.textBaseline = "top";
            // RTL: draw from right edge
            ctx.direction = "rtl";
            ctx.textAlign = "right";

            let lineY = 0;
            for (const tl of textLines) {
              ctx.fillText(tl, ow, lineY);
              lineY += lineHeight;
            }

            const pngDataUrl = canvas.toDataURL("image/png");
            const pngImage = await pdfDoc.embedPng(pngDataUrl);
            pdfPage.drawImage(pngImage, {
              x: ox,
              y: pdfH - oy - textHeight,
              width: ow,
              height: textHeight,
            });
          } else if (overlay.imageUrl) {
            // ── Image overlay (stamp/signature): unchanged ──
            const oh = ow * overlay.naturalAspect;
            const canvas = document.createElement("canvas");
            const hiDpi = 4;
            canvas.width = ow * hiDpi;
            canvas.height = oh * hiDpi;
            const ctx = canvas.getContext("2d")!;
            ctx.scale(hiDpi, hiDpi);

            const oImg = new Image();
            if (!overlay.imageUrl.startsWith("data:")) oImg.crossOrigin = "anonymous";
            await new Promise<void>((resolve) => {
              oImg.onload = () => {
                ctx.globalAlpha = overlay.opacity;
                ctx.drawImage(oImg, 0, 0, ow, oh);
                // Apply tint color if set
                if (overlay.tintColor) {
                  ctx.globalCompositeOperation = "source-atop";
                  ctx.fillStyle = overlay.tintColor;
                  ctx.fillRect(0, 0, ow, oh);
                  ctx.globalCompositeOperation = "source-over";
                }
                resolve();
              };
              oImg.onerror = () => resolve();
              oImg.src = overlay.imageUrl!;
            });

            const pngDataUrl = canvas.toDataURL("image/png");
            const pngImage = await pdfDoc.embedPng(pngDataUrl);
            pdfPage.drawImage(pngImage, {
              x: ox,
              y: pdfH - oy - oh,
              width: ow,
              height: oh,
            });
          }
        }

        const finalPdfBytes = await pdfDoc.save();
        finalBlob = new Blob([finalPdfBytes as any], { type: "application/pdf" });
        finalFileName = "stamped-document.pdf";

      } else {
        // ===== Save as Single Image =====
        const pageData = pages[0];
        const canvas = document.createElement("canvas");
        canvas.width = pageData.naturalWidth;
        canvas.height = pageData.naturalHeight;
        const ctx = canvas.getContext("2d")!;

        const pageImg = new Image();
        if (!pageData.src.startsWith("data:")) pageImg.crossOrigin = "anonymous";
        await new Promise<void>((resolve, reject) => {
          pageImg.onload = () => { ctx.drawImage(pageImg, 0, 0); resolve(); };
          pageImg.onerror = () => reject(new Error("Page load failed"));
          pageImg.src = pageData.src;
        });

        for (const overlay of overlays) {
          const ox = overlay.xPct * canvas.width;
          const oy = overlay.yPct * canvas.height;
          const ow = overlay.widthPct * canvas.width;
          const oh = ow * overlay.naturalAspect;

          if (overlay.type === "text" && overlay.text) {
            // Scale font proportionally to image size vs displayed size
            const displayedImgWidth = imgRef.current?.clientWidth || 800;
            const fontSize = Math.round((overlay.fontSize || 16) * (canvas.width / displayedImgWidth));
            ctx.font = `bold ${fontSize}px "Segoe UI", Arial, sans-serif`;
            ctx.fillStyle = overlay.fontColor || "#000000";
            ctx.globalAlpha = overlay.opacity;
            ctx.textBaseline = "top";
            // RTL: draw from right edge of the text box
            ctx.direction = "rtl";
            ctx.textAlign = "right";
            const maxW = ow;
            const words = overlay.text.split(" ");
            let line = "";
            let lineY = oy;
            for (const word of words) {
              const test = line + word + " ";
              if (ctx.measureText(test).width > maxW && line.length > 0) {
                ctx.fillText(line.trim(), ox + ow, lineY);
                line = word + " ";
                lineY += fontSize * 1.3;
              } else {
                line = test;
              }
            }
            ctx.fillText(line.trim(), ox + ow, lineY);
            ctx.globalAlpha = 1;
            // Reset direction for next overlay
            ctx.direction = "ltr";
            ctx.textAlign = "start";
          } else if (overlay.imageUrl) {
            const oImg = new Image();
            await new Promise<void>((resolve) => {
              oImg.onload = () => {
                ctx.globalAlpha = overlay.opacity;
                ctx.drawImage(oImg, ox, oy, ow, oh);
                // Apply tint color if set
                if (overlay.tintColor) {
                  ctx.globalCompositeOperation = "source-atop";
                  ctx.fillStyle = overlay.tintColor;
                  ctx.fillRect(ox, oy, ow, oh);
                  ctx.globalCompositeOperation = "source-over";
                }
                ctx.globalAlpha = 1;
                resolve();
              };
              oImg.onerror = () => resolve();
              oImg.src = overlay.imageUrl!;
            });
          }
        }

        finalBlob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(b => b ? resolve(b) : reject(new Error("Canvas export failed")), "image/jpeg", 0.95);
        });
        finalFileName = "stamped-document.jpg";
      }

      const file = new File([finalBlob], finalFileName, { type: finalBlob.type });
      const url = await uploadToBlob(file);

      // Save letter
      await saveLetter({
        ...letter,
        finalFileUrl: url,
        stampApplied: overlays.some(o => o.type === "stamp"),
        signatureApplied: overlays.some(o => o.type === "signature"),
      }, letter.id);

      toast.success(isEn ? "Saved successfully!" : "تم الحفظ بنجاح!");
      onSaved();
    } catch (err: any) {
      console.error("Save error:", err);
      toast.error(err.message || (isEn ? "Failed to save" : "فشل الحفظ"));
    } finally {
      setSaving(false);
    }
  }

  // ======================== Current page overlays ========================
  const pageOverlays = overlays.filter(o => o.page === currentPage);
  const currentPageData = pages[currentPage - 1];
  const activeOverlay = overlays.find(o => o.id === activeId);

  // ======================== Render ========================

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-800">
      {/* ═══════════ Top Bar ═══════════ */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-slate-200 z-20 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-sm font-bold text-slate-800">{letter.title}</h2>
            <p className="text-[10px] text-slate-400">{letter.letterNumber}</p>
          </div>
        </div>

        {/* Version toggle */}
        {hasFinal && (
          <div className="flex items-center bg-slate-100 rounded-xl p-0.5">
            <button
              onClick={() => { setShowOriginal(false); setOverlays([]); }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${!showOriginal ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              {isEn ? "✅ Final" : "✅ النهائية"}
            </button>
            <button
              onClick={() => { setShowOriginal(true); setOverlays([]); }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${showOriginal ? "bg-white text-slate-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              {isEn ? "📄 Original" : "📄 الأصلية"}
            </button>
          </div>
        )}

        {/* Page navigation */}
        {totalPages > 1 && (
          <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-1.5">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1}
              className="p-1 hover:bg-white rounded-lg disabled:opacity-30 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
            <span className="text-sm font-bold text-slate-700 min-w-[60px] text-center">
              {currentPage} / {totalPages}
            </span>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}
              className="p-1 hover:bg-white rounded-lg disabled:opacity-30 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Print & Download (only when viewing final or if original is selected and no edits made) */}
          {hasFinal && overlays.length === 0 && (
            <>
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                title={isEn ? "Print" : "طباعة"}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                title={isEn ? "Download" : "تنزيل"}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
            </>
          )}

          <button
            onClick={handleSave}
            disabled={saving || overlays.length === 0}
            className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-sm ml-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {isEn ? "Save" : "حفظ"}
          </button>
        </div>
      </div>

      {/* Banner — showing current mode */}
      {hasFinal && !showOriginal && overlays.length === 0 && (
        <div className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-50 border-b border-emerald-200 text-xs text-emerald-800 font-medium flex-shrink-0">
          ✅ {isEn ? "Viewing the saved (stamped/signed) version" : "تعرض النسخة المحفوظة (المختومة/الموقعة)"}
          <button onClick={() => { setShowOriginal(true); setOverlays([]); }}
            className="px-2 py-0.5 bg-emerald-200 rounded-lg hover:bg-emerald-300 font-bold transition-colors">
            {isEn ? "Edit Original" : "تعديل الأصلية"}
          </button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* ═══════════ Sidebar ═══════════ */}
        <div className="w-60 bg-white border-l border-slate-200 overflow-y-auto p-3 space-y-4 flex-shrink-0 order-2">
          {/* Tools */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{isEn ? "Add" : "إضافة"}</p>
            <div className="grid grid-cols-3 gap-1.5">
              {stamps.map((s) => (
                <button key={s.id} onClick={() => addOverlay("stamp", s.imageDataUrl)}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl border border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 transition-all" title={s.name}>
                  <img src={s.imageDataUrl} alt={s.name} className="w-8 h-8 object-contain" />
                  <span className="text-[9px] text-slate-500 truncate w-full text-center">
                    <Stamp className="w-2.5 h-2.5 inline" /> {isEn ? "Stamp" : "ختم"}
                  </span>
                </button>
              ))}
              {signatures.map((s) => (
                <button key={s.id} onClick={() => addOverlay("signature", s.signatureDataUrl)}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl border border-dashed border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 transition-all" title={s.name}>
                  <img src={s.signatureDataUrl} alt={s.name} className="w-10 h-6 object-contain" />
                  <span className="text-[9px] text-slate-500 truncate w-full text-center">
                    <PenTool className="w-2.5 h-2.5 inline" /> {isEn ? "Sign" : "توقيع"}
                  </span>
                </button>
              ))}
              <button onClick={addTextOverlay}
                className="flex flex-col items-center gap-1 p-2 rounded-xl border border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all">
                <Type className="w-6 h-6 text-blue-500" />
                <span className="text-[9px] text-slate-500">{isEn ? "Text" : "نص"}</span>
              </button>
            </div>
          </div>

          {/* Placed items */}
          {overlays.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                {isEn ? "Items" : "العناصر"} ({overlays.length})
              </p>
              <div className="space-y-1">
                {overlays.map((o) => (
                  <div
                    key={o.id}
                    onClick={() => { setActiveId(o.id); if (o.page !== currentPage) setCurrentPage(o.page); }}
                    className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-xs cursor-pointer transition-all ${
                      activeId === o.id ? "bg-indigo-100 border border-indigo-300" : "bg-slate-50 hover:bg-slate-100 border border-transparent"
                    }`}
                  >
                    <span className="font-medium text-slate-700 truncate">
                      {o.type === "stamp" ? "🔴" : o.type === "signature" ? "✍️" : "📝"}{" "}
                      {o.type === "text" ? (o.text?.slice(0, 12) || "...") : (o.type === "stamp" ? (isEn ? "Stamp" : "ختم") : (isEn ? "Sign" : "توقيع"))}
                      <span className="text-[9px] text-slate-400 mr-1 ml-1">ص{o.page}</span>
                    </span>
                    <button onClick={(e) => { e.stopPropagation(); removeOverlay(o.id); }}
                      className="p-0.5 text-rose-400 hover:text-rose-600 rounded transition-colors">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active item settings */}
          {activeOverlay && (
            <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {activeOverlay.type === "text" ? (isEn ? "Text Settings" : "إعدادات النص")
                  : activeOverlay.type === "stamp" ? (isEn ? "Stamp Settings" : "إعدادات الختم")
                  : (isEn ? "Signature Settings" : "إعدادات التوقيع")}
              </p>

              {/* Text input — only for text overlays */}
              {activeOverlay.type === "text" && (
                <>
                  <textarea
                    value={activeOverlay.text || ""}
                    onChange={(e) => updateOverlay(activeOverlay.id, { text: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg resize-none focus:ring-2 focus:ring-indigo-500"
                    rows={3}
                    dir="auto"
                  />
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] text-slate-500">{isEn ? "Size" : "الحجم"}</label>
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">{activeOverlay.fontSize || 16}px</span>
                      </div>
                      <input type="range" min="8" max="60" value={activeOverlay.fontSize || 16}
                        onChange={(e) => updateOverlay(activeOverlay.id, { fontSize: Number(e.target.value) })}
                        className="w-full accent-indigo-600" />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500">{isEn ? "Color" : "اللون"}</label>
                      <input type="color" value={activeOverlay.fontColor || "#000000"}
                        onChange={(e) => updateOverlay(activeOverlay.id, { fontColor: e.target.value })}
                        className="w-8 h-8 rounded border cursor-pointer" />
                    </div>
                  </div>
                </>
              )}

              {/* Color tint — for signatures and stamps */}
              {(activeOverlay.type === "signature" || activeOverlay.type === "stamp") && (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] text-slate-500">{isEn ? "Color" : "اللون"}</label>
                    {activeOverlay.tintColor && (
                      <button onClick={() => updateOverlay(activeOverlay.id, { tintColor: undefined })}
                        className="text-[9px] text-rose-500 hover:text-rose-700">{isEn ? "Reset" : "إعادة"}</button>
                    )}
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {["#1a365d","#000000","#1e40af","#dc2626","#059669","#7c3aed","#b45309"].map(color => (
                      <button key={color} onClick={() => updateOverlay(activeOverlay.id, { tintColor: color })}
                        className={`w-6 h-6 rounded-full border-2 transition-all ${
                          activeOverlay.tintColor === color ? "border-indigo-500 scale-110 ring-2 ring-indigo-200" : "border-slate-300 hover:border-slate-400"
                        }`}
                        style={{ backgroundColor: color }} />
                    ))}
                  </div>
                </div>
              )}

              {/* Opacity — for ALL overlay types */}
              <div>
                <div className="flex justify-between items-center">
                  <label className="text-[10px] text-slate-500">{isEn ? "Opacity" : "الشفافية"}</label>
                  <span className="text-[10px] font-bold text-slate-600">{Math.round(activeOverlay.opacity * 100)}%</span>
                </div>
                <input type="range" min="0.1" max="1" step="0.05" value={activeOverlay.opacity}
                  onChange={(e) => updateOverlay(activeOverlay.id, { opacity: Number(e.target.value) })}
                  className="w-full accent-indigo-600" />
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-200">
            <ul className="text-[10px] text-blue-600 space-y-0.5">
              <li>⌨️ <b>T</b> {isEn ? "= Add text" : "= إضافة نص"}</li>
              <li>⌨️ <b>←↑↓→</b> {isEn ? "= Move (Shift = faster)" : "= تحريك (Shift = أسرع)"}</li>
              <li>⌨️ <b>⌘C / ⌘V</b> {isEn ? "= Copy / Paste" : "= نسخ / لصق"}</li>
              <li>⌨️ <b>Del</b> {isEn ? "= Delete selected" : "= حذف المحدد"}</li>
              <li>🖱 {isEn ? "Drag to move" : "اسحب لتحريك العنصر"}</li>
              <li>↔ {isEn ? "Drag corner to resize" : "اسحب الزاوية لتغيير الحجم"}</li>
            </ul>
          </div>

          {/* Page thumbnails */}
          {totalPages > 1 && (
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{isEn ? "Pages" : "الصفحات"}</p>
              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {pages.map((p, idx) => {
                  const pageNum = idx + 1;
                  const hasOverlays = overlays.some(o => o.page === pageNum);
                  return (
                    <button key={idx} onClick={() => setCurrentPage(pageNum)}
                      className={`w-full flex items-center gap-2 p-1.5 rounded-lg transition-all ${
                        currentPage === pageNum ? "bg-indigo-100 border border-indigo-300" : "bg-slate-50 hover:bg-slate-100 border border-transparent"
                      }`}>
                      <img src={p.src} className="w-10 h-14 object-cover rounded border border-slate-200" alt={`Page ${pageNum}`} />
                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-700">{isEn ? `Page ${pageNum}` : `صفحة ${pageNum}`}</p>
                        {hasOverlays && (
                          <span className="text-[9px] text-indigo-600 font-medium">
                            {overlays.filter(o => o.page === pageNum).length} {isEn ? "items" : "عنصر"}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ═══════════ Document Area ═══════════ */}
        <div className="flex-1 overflow-auto bg-slate-600 order-1" onClick={() => { setActiveId(null); (document.activeElement as HTMLElement)?.blur(); }}>
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="w-10 h-10 animate-spin text-white/50 mx-auto mb-3" />
                <p className="text-white/60 text-sm">{isEn ? "Loading document..." : "جاري تحميل المستند..."}</p>
              </div>
            </div>
          ) : currentPageData ? (
            <div className="min-h-full flex items-start justify-center p-6">
              <div className="relative inline-block shadow-2xl bg-white">
                {/* Document */}
                <img
                  ref={imgRef}
                  src={currentPageData.src}
                  crossOrigin="anonymous"
                  className="block max-w-full select-none"
                  style={{ maxHeight: "calc(100vh - 60px)" }}
                  draggable={false}
                  alt="document"
                />

                {/* Overlays for current page */}
                {pageOverlays.map((overlay) => {
                  const isActive = activeId === overlay.id;
                  const style: React.CSSProperties = {
                    position: "absolute",
                    left: `${overlay.xPct * 100}%`,
                    top: `${overlay.yPct * 100}%`,
                    width: `${overlay.widthPct * 100}%`,
                    touchAction: "none",
                    zIndex: isActive ? 20 : 10,
                    cursor: "grab",
                  };

                  return (
                    <div
                      key={overlay.id}
                      style={style}
                      className={isActive ? "ring-2 ring-indigo-500 ring-offset-1 rounded" : ""}
                      onPointerDown={(e) => handlePointerDown(e, overlay.id, "move")}
                      onClick={(e) => { e.stopPropagation(); setActiveId(overlay.id); }}
                    >
                      {overlay.type === "text" ? (
                        <div
                          style={{
                            fontSize: `${overlay.fontSize || 16}px`,
                            color: overlay.fontColor || "#000000",
                            fontWeight: "bold",
                            lineHeight: 1.3,
                            whiteSpace: "pre-wrap",
                            direction: "rtl",
                            pointerEvents: "none",
                            userSelect: "none",
                          }}
                        >
                          {overlay.text}
                        </div>
                      ) : overlay.tintColor ? (
                        /* Tinted: use CSS mask to show color only in signature/stamp shape */
                        <div
                          className="w-full pointer-events-none select-none"
                          style={{
                            opacity: overlay.opacity,
                            backgroundColor: overlay.tintColor,
                            WebkitMaskImage: `url(${overlay.imageUrl})`,
                            maskImage: `url(${overlay.imageUrl})`,
                            WebkitMaskSize: '100% 100%',
                            maskSize: '100% 100%',
                            WebkitMaskRepeat: 'no-repeat',
                            maskRepeat: 'no-repeat',
                            aspectRatio: `1 / ${overlay.naturalAspect}`,
                          }}
                        />
                      ) : (
                        /* No tint: show original image */
                        <img
                          src={overlay.imageUrl}
                          alt={overlay.type}
                          className="w-full pointer-events-none select-none"
                          draggable={false}
                          style={{ opacity: overlay.opacity }}
                        />
                      )}

                      {/* Active controls */}
                      {isActive && (
                        <>
                          <button
                            className="absolute -top-3 -right-3 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-rose-600 z-30"
                            onPointerDown={(e) => { e.stopPropagation(); removeOverlay(overlay.id); }}>
                            <X className="w-3 h-3" />
                          </button>
                          <div
                            className="absolute -bottom-2 -left-2 w-5 h-5 bg-indigo-600 rounded-full cursor-nwse-resize shadow-lg z-30"
                            onPointerDown={(e) => handlePointerDown(e, overlay.id, "resize")}>
                            <svg className="w-full h-full p-1" viewBox="0 0 10 10" fill="none">
                              <path d="M1 9L9 1M5 9L9 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                          </div>
                          <div className="absolute inset-0 border-2 border-indigo-500 border-dashed rounded pointer-events-none" />
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
