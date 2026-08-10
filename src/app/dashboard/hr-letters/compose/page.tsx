'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, ArrowLeft, Save, Printer, Trash2, Image as ImageIcon,
  Type, ChevronUp, ChevronDown, Loader2, Settings, Stamp, PenTool, X,
  AlignLeft, AlignCenter, AlignRight, ToggleLeft, ToggleRight, Calendar,
  Lock, Unlock, Bold, Italic, Underline, Palette, Minus as MinusIcon,
  Plus as PlusIcon, CheckCircle2, Phone, Mail, Globe, Copy,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '@/lib/i18n';
import { getCurrentUserName } from '@/lib/auditHelpers';
import CustomDatePicker from '@/components/CustomDatePicker';
import {
  LetterDocument, LetterBlock, LetterLanguage, LetterTemplateSettings, TextAlign,
  getTemplateSettings, saveTemplateSettings, saveLetterDocument,
  getLetterDocuments, generateNextLetterNumber, createEmptyLetter,
  gregorianToHijri, formatGregorianDisplay, getTodayISO, DEFAULT_SETTINGS,
  FONT_FAMILIES,
} from '@/lib/letterTemplate';
import { getOrgStamps, getSavedSignatures, OrgStamp, SavedSignature } from '@/lib/letters';

/* ═══════════════════════════════════════════════════════════════════════════
   Brand Colors (from Farkon logo)
   ═══════════════════════════════════════════════════════════════════════════ */
const BRAND = {
  red: '#E53935',       // Coral red from logo circle
  redLight: '#EF5350',  // Lighter red
  redDark: '#C62828',   // Darker red
  black: '#1a1a1a',     // Logo text color
  dark: '#212121',      // Dark gray
  white: '#ffffff',
  gray50: '#fafafa',
  gray100: '#f5f5f5',
  gray200: '#eeeeee',
  gray300: '#e0e0e0',
  gray400: '#bdbdbd',
  gray600: '#757575',
};

/* ═══════════════════════════════════════════════════════════════════════════
   A4 Layout Constants
   ═══════════════════════════════════════════════════════════════════════════ */
const PAGE_W = 794;
const PAGE_H = 1123;
const BODY_PAD = 20;

function getMaxBodyLines(fontSize: number, isFirstPage: boolean, opts: { rec: boolean; sub: boolean; greet: boolean }) {
  // Available body height in px
  let headerH = isFirstPage ? 210 : 80;
  let refDateH = 50;
  let footerH = 75;
  let fieldsH = 0;
  if (isFirstPage) {
    if (opts.rec) fieldsH += 44;
    if (opts.sub) fieldsH += 44;
    if (opts.greet) fieldsH += 36;
  }
  const bodyH = PAGE_H - headerH - refDateH - footerH - fieldsH - BODY_PAD * 2 - 100; // -100 for signer/closing
  const lineH = fontSize * 2.2;
  return Math.floor(bodyH / lineH);
}

function bodyHeight(first: boolean, opts: { rec: boolean; sub: boolean; greet: boolean }) {
  let headerH = first ? 210 : 80;
  let used = headerH + 50 + 75 + BODY_PAD * 2;
  if (first) {
    if (opts.rec) used += 44;
    if (opts.sub) used += 44;
    if (opts.greet) used += 36;
  }
  return PAGE_H - used;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Overlay System
   ═══════════════════════════════════════════════════════════════════════════ */
interface ComposeOverlay {
  id: string;
  type: 'stamp' | 'signature' | 'image';
  page: number;
  xPct: number;
  yPct: number;
  widthPct: number;
  imageUrl: string;
  opacity: number;
  naturalAspect: number;
}

import { Suspense } from 'react';

export default function ComposeLetterPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-red-500" /></div>}>
      <ComposeLetterContent />
    </Suspense>
  );
}

function ComposeLetterContent() {
  const { lang: language } = useLanguage();
  const isEn = language === 'en';
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [settings, setSettings] = useState<LetterTemplateSettings>(DEFAULT_SETTINGS);
  const [letter, setLetter] = useState<LetterDocument | null>(null);
  const [stamps, setStamps] = useState<OrgStamp[]>([]);
  const [signatures, setSignatures] = useState<SavedSignature[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [editSettings, setEditSettings] = useState<LetterTemplateSettings>(DEFAULT_SETTINGS);

  const [overlays, setOverlays] = useState<ComposeOverlay[]>([]);
  const [activeOverlayId, setActiveOverlayId] = useState<string | null>(null);

  const [blockHeights, setBlockHeights] = useState<Record<string, number>>({});
  const blockRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const bodyRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const [measureTick, setMeasureTick] = useState(0);
  const splitGuardRef = useRef(false);

  const dragRef = useRef<{
    id: string; mode: 'move' | 'resize';
    startX: number; startY: number;
    startXPct: number; startYPct: number; startWPct: number;
    pageIdx: number;
  } | null>(null);

  // Auto-resize textareas so they show all content (no internal scrolling)
  useEffect(() => {
    if (!letter) return;
    
    // Set document title for PDF saving
    const originalTitle = document.title;
    document.title = letter.letterNumber && letter.letterNumber !== 'مسودة' && letter.letterNumber !== 'DRAFT'
      ? letter.letterNumber
      : (isEn ? 'Draft Letter' : 'مسودة خطاب');

    for (const block of letter.blocks) {
      if (block.type === 'image') continue;
      const el = blockRefs.current[block.id];
      if (!el) continue;
      const ta = el.querySelector('textarea');
      if (ta) { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px'; }
    }

    return () => { document.title = originalTitle; };
  }, [letter, isEn]);

  // Measure blocks
  useEffect(() => {
    if (!letter) return;
    const id = requestAnimationFrame(() => {
      const next: Record<string, number> = {};
      let changed = false;
      for (const b of letter.blocks) {
        if (b.type === 'image') continue;
        const el = blockRefs.current[b.id];
        if (el) { const h = el.offsetHeight; next[b.id] = h; if (h !== blockHeights[b.id]) changed = true; }
      }
      if (changed) setBlockHeights(next);
    });
    return () => cancelAnimationFrame(id);
  }, [letter?.blocks, measureTick]);

  // Page assignment
  const pageAssignments = useMemo((): LetterBlock[][] => {
    if (!letter) return [[]];
    const opts = { rec: letter.showRecipient, sub: letter.showSubject, greet: letter.showGreeting };
    const pages: LetterBlock[][] = [[]];
    let pi = 0;
    let rem = bodyHeight(true, opts) - 80;

    for (const block of letter.blocks) {
      if (block.type === 'image') continue;
      const h = blockHeights[block.id] ?? 120;
      if (h > rem && pages[pi].length > 0) { pi++; pages.push([]); rem = bodyHeight(false, opts); }
      pages[pi].push(block);
      rem -= h;
    }
    if (pages.length === 0) pages.push([]);
    return pages;
  }, [letter, blockHeights]);

  const numPages = pageAssignments.length;

  // Auto-split: when any block causes its page to overflow, split it
  useEffect(() => {
    if (!letter || splitGuardRef.current) return;
    const opts = { rec: letter.showRecipient, sub: letter.showSubject, greet: letter.showGreeting };
    for (let pi = 0; pi < pageAssignments.length; pi++) {
      const page = pageAssignments[pi];
      const isFirst = pi === 0;
      const isLast = pi === pageAssignments.length - 1;
      const maxH = bodyHeight(isFirst, opts) - (isLast && letter.showClosing ? 100 : 20);
      let cumH = 0;
      for (const block of page) {
        const h = blockHeights[block.id];
        if (!h || h < 30) continue;
        cumH += h;
        if (cumH > maxH && block.type === 'text' && block.content.trim().length > 5) {
          splitGuardRef.current = true;
          const availH = Math.max(40, maxH - (cumH - h));
          const ratio = Math.min(0.95, Math.max(0.1, availH / h));
          const lines = block.content.split('\n');
          let splitLine = Math.max(1, Math.floor(lines.length * ratio));
          // If no newlines, split by character count
          if (lines.length <= 2 && block.content.length > 50) {
            const charSplit = Math.floor(block.content.length * ratio);
            let splitAt = charSplit;
            for (let i = charSplit; i > charSplit - 30 && i > 0; i--) {
              if (block.content[i] === ' ' || block.content[i] === '\n') { splitAt = i; break; }
            }
            const firstPart = block.content.slice(0, splitAt).trim();
            const secondPart = block.content.slice(splitAt).trim();
            if (firstPart && secondPart) {
              const newId = `blk_${Date.now()}`;
              setLetter(prev => {
                if (!prev) return prev;
                const idx = prev.blocks.findIndex(b => b.id === block.id);
                if (idx < 0) return prev;
                const bs = [...prev.blocks];
                bs[idx] = { ...block, content: firstPart };
                bs.splice(idx + 1, 0, { id: newId, type: 'text', content: secondPart, fontSize: block.fontSize, fontWeight: block.fontWeight, fontStyle: block.fontStyle, textDecoration: block.textDecoration, color: block.color, fontFamily: block.fontFamily, align: block.align });
                return { ...prev, blocks: bs };
              });
              setTimeout(() => { splitGuardRef.current = false; setMeasureTick(t => t + 1); }, 200);
              return;
            }
          } else if (splitLine < lines.length) {
            const firstPart = lines.slice(0, splitLine).join('\n');
            const secondPart = lines.slice(splitLine).join('\n');
            if (firstPart.trim() && secondPart.trim()) {
              const newId = `blk_${Date.now()}`;
              setLetter(prev => {
                if (!prev) return prev;
                const idx = prev.blocks.findIndex(b => b.id === block.id);
                if (idx < 0) return prev;
                const bs = [...prev.blocks];
                bs[idx] = { ...block, content: firstPart };
                bs.splice(idx + 1, 0, { id: newId, type: 'text', content: secondPart, fontSize: block.fontSize, fontWeight: block.fontWeight, fontStyle: block.fontStyle, textDecoration: block.textDecoration, color: block.color, fontFamily: block.fontFamily, align: block.align });
                return { ...prev, blocks: bs };
              });
              setTimeout(() => { splitGuardRef.current = false; setMeasureTick(t => t + 1); }, 200);
              return;
            }
          }
          splitGuardRef.current = false;
        }
      }
    }
  }, [blockHeights, pageAssignments]);

  // Auto-split: when Enter at end of page, create new block on next page
  const handleTextKeyDown = (e: React.KeyboardEvent, blockId: string) => {
    if (e.key !== 'Enter' || !letter || splitGuardRef.current) return;
    const block = letter.blocks.find(b => b.id === blockId);
    if (!block) return;
    const opts = { rec: letter.showRecipient, sub: letter.showSubject, greet: letter.showGreeting };
    // Find which page this block is on
    let isOnFirstPage = false;
    for (const pg of pageAssignments) {
      if (pg.some(b => b.id === blockId)) {
        isOnFirstPage = pageAssignments.indexOf(pg) === 0;
        break;
      }
    }
    const maxLines = getMaxBodyLines(block.fontSize || 14, isOnFirstPage, opts);
    const currentLines = block.content.split('\n').length;

    if (currentLines >= maxLines) {
      e.preventDefault();
      splitGuardRef.current = true;
      const newId = `blk_${Date.now()}`;
      setLetter(prev => {
        if (!prev) return prev;
        const idx = prev.blocks.findIndex(b => b.id === blockId);
        if (idx < 0) return prev;
        const bs = [...prev.blocks];
        bs.splice(idx + 1, 0, { id: newId, type: 'text', content: '', fontSize: block.fontSize, fontWeight: block.fontWeight, fontStyle: block.fontStyle, textDecoration: block.textDecoration, color: block.color, fontFamily: block.fontFamily, align: block.align });
        return { ...prev, blocks: bs };
      });
      setTimeout(() => {
        const el = document.getElementById(`block-${newId}`);
        const ta = el?.querySelector('textarea');
        if (ta) ta.focus();
        setMeasureTick(t => t + 1);
        splitGuardRef.current = false;
      }, 120);
    }
  };

  // Overlays
  function addOverlay(type: 'stamp' | 'signature' | 'image', imageUrl: string) {
    const img = new window.Image();
    if (!imageUrl.startsWith('data:')) img.crossOrigin = 'anonymous';
    img.onload = () => {
      const o: ComposeOverlay = {
        id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        type, page: 1,
        xPct: type === 'stamp' ? 0.55 : type === 'signature' ? 0.3 : 0.15,
        yPct: type === 'stamp' ? 0.6 : type === 'signature' ? 0.7 : 0.25,
        widthPct: type === 'stamp' ? 0.18 : type === 'signature' ? 0.16 : 0.5,
        imageUrl, opacity: type === 'stamp' ? 0.9 : 1,
        naturalAspect: img.naturalHeight / img.naturalWidth,
      };
      setOverlays(prev => [...prev, o]);
      setActiveOverlayId(o.id);
    };
    img.src = imageUrl;
  }
  function duplicateOverlay(id: string) {
    const s = overlays.find(o => o.id === id);
    if (!s) return;
    const c: ComposeOverlay = { ...s, id: `${s.type}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`, xPct: Math.min(s.xPct + 0.05, 0.9), yPct: Math.min(s.yPct + 0.05, 0.9) };
    setOverlays(prev => [...prev, c]);
    setActiveOverlayId(c.id);
  }
  function removeOverlay(id: string) { setOverlays(prev => prev.filter(o => o.id !== id)); if (activeOverlayId === id) setActiveOverlayId(null); }
  function updateOverlay(id: string, p: Partial<ComposeOverlay>) { setOverlays(prev => prev.map(o => o.id === id ? { ...o, ...p } : o)); }

  // Pointer drag/resize
  function handlePointerDown(e: React.PointerEvent, id: string, mode: 'move' | 'resize', pageIdx: number) {
    e.preventDefault(); e.stopPropagation();
    const ov = overlays.find(o => o.id === id);
    if (!ov) return;
    setActiveOverlayId(id);
    dragRef.current = { id, mode, startX: e.clientX, startY: e.clientY, startXPct: ov.xPct, startYPct: ov.yPct, startWPct: ov.widthPct, pageIdx };
    const onMove = (ev: PointerEvent) => {
      if (!dragRef.current) return;
      const bodyEl = bodyRefs.current[dragRef.current.pageIdx];
      if (!bodyEl) return;
      const r = bodyEl.getBoundingClientRect();
      const { mode: m, startX, startY, startXPct, startYPct, startWPct } = dragRef.current;
      if (m === 'move') {
        updateOverlay(id, { xPct: Math.max(-0.1, Math.min(1, startXPct + (ev.clientX - startX) / r.width)), yPct: Math.max(-0.1, Math.min(1.1, startYPct + (ev.clientY - startY) / r.height)) });
      } else {
        updateOverlay(id, { widthPct: Math.max(0.04, startWPct + (ev.clientX - startX) / r.width) });
      }
    };
    const onUp = () => { dragRef.current = null; window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }

  // Init
  useEffect(() => { initPage(); }, []);
  async function initPage() {
    setLoading(true);
    try {
      const [tmpl, stmps, sigs] = await Promise.all([getTemplateSettings(), getOrgStamps().catch(() => []), getSavedSignatures().catch(() => [])]);
      setSettings(tmpl); setEditSettings(tmpl); setStamps(stmps); setSignatures(sigs);
      const editId = searchParams.get('id');
      if (editId) { const all = await getLetterDocuments(); const f = all.find(l => l.id === editId); if (f) { setLetter(f); if (f.overlays?.length) setOverlays(f.overlays); setLoading(false); return; } }
      const lang = (searchParams.get('lang') as LetterLanguage) || 'ar';
      const isEn = lang === 'en';
      const num = isEn ? 'DRAFT' : 'مسودة';
      const userName = await getCurrentUserName(lang);
      setLetter(createEmptyLetter(lang, num, userName));
    } catch (e) { console.error(e); toast.error(isEn ? 'Error loading' : 'خطأ في التحميل'); }
    setLoading(false);
  }

  const updateLetter = (p: Partial<LetterDocument>) => setLetter(prev => prev ? { ...prev, ...p } : prev);
  const updateBlock = (id: string, p: Partial<LetterBlock>) => setLetter(prev => prev ? { ...prev, blocks: prev.blocks.map(b => b.id === id ? { ...b, ...p } : b) } : prev);
  const addTextBlock = () => { setLetter(prev => prev ? { ...prev, blocks: [...prev.blocks, { id: `blk_${Date.now()}`, type: 'text', content: '' }] } : prev); setTimeout(() => setMeasureTick(t => t + 1), 50); };
  const addImageBlock = () => { const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*'; inp.onchange = (e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) { const r = new FileReader(); r.onload = (ev) => addOverlay('image', ev.target?.result as string); r.readAsDataURL(f); } }; inp.click(); };
  const removeBlock = (id: string) => { setLetter(prev => prev ? { ...prev, blocks: prev.blocks.filter(b => b.id !== id) } : prev); setTimeout(() => setMeasureTick(t => t + 1), 50); };
  const moveBlock = (id: string, dir: -1 | 1) => { setLetter(prev => { if (!prev) return prev; const idx = prev.blocks.findIndex(b => b.id === id); const ni = idx + dir; if (idx < 0 || ni < 0 || ni >= prev.blocks.length) return prev; const bs = [...prev.blocks]; [bs[idx], bs[ni]] = [bs[ni], bs[idx]]; return { ...prev, blocks: bs }; }); };
  const handleGregorianChange = (v: string) => updateLetter({ dateGregorian: v, dateHijri: gregorianToHijri(v) });

  const handleSave = async (finalStatus?: 'draft' | 'sent') => {
    if (!letter) return; if (letter.status === 'sent' && !finalStatus) return; setSaving(true);
    try {
      const userName = await getCurrentUserName(language);
      
      let finalNumber = letter.letterNumber;
      if (finalStatus === 'sent' && (letter.letterNumber === 'مسودة' || letter.letterNumber === 'DRAFT' || !letter.letterNumber.startsWith('FK-'))) {
        finalNumber = await generateNextLetterNumber();
      }

      await saveLetterDocument({ ...letter, letterNumber: finalNumber, overlays, status: finalStatus || letter.status || 'draft', updatedBy: userName, updatedAt: new Date().toISOString() });
      if (finalStatus === 'sent') { updateLetter({ status: 'sent', letterNumber: finalNumber }); toast.success(isEn ? 'Finalized' : 'تم الإقفال'); setTimeout(() => router.push('/dashboard/hr/letters'), 1000); }
      else toast.success(isEn ? 'Draft saved' : 'تم الحفظ');
    } catch (e: any) { console.error('Save error:', e); toast.error(isEn ? `Error: ${e?.message || 'Unknown'}` : `خطأ: ${e?.message || 'غير معروف'}`); } setSaving(false);
  };
  const handleFinalize = () => { setShowFinalizeModal(true); };
  const confirmFinalize = () => { setShowFinalizeModal(false); handleSave('sent'); };
  const handleUnlock = () => { setShowUnlockModal(true); };
  const confirmUnlock = () => { setShowUnlockModal(false); updateLetter({ status: 'draft' }); handleSave('draft'); };
  const handleSaveSettings = async () => { try { await saveTemplateSettings(editSettings); setSettings(editSettings); setShowSettings(false); toast.success(isEn ? 'Saved' : 'تم الحفظ'); } catch { toast.error(isEn ? 'Error' : 'خطأ'); } };

  const handleDownloadPDF = async () => {
    // We use the browser's native print engine to generate the PDF
    // Native print is vastly superior for Arabic text, fonts, and vector scaling.
    window.print();
  };

  if (loading || !letter) return <div className="flex items-center justify-center h-[60vh]"><Loader2 className="w-8 h-8 animate-spin" style={{ color: BRAND.red }} /></div>;

  const isAr = letter.language === 'ar';
  const dir = isAr ? 'rtl' : 'ltr';
  const isLocked = letter.status === 'sent';

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* ─── Toolbar ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 mb-4 print:hidden">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 font-bold transition-colors">
          {isEn ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
          {isEn ? 'Back' : 'رجوع'}
        </button>
        <div className="flex items-center gap-2">
          {isLocked && <span className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5" style={{ background: '#fce4ec', color: BRAND.redDark }}><Lock className="w-3.5 h-3.5" />{isEn ? 'Finalized' : 'مُقفل'}</span>}
          <button onClick={() => setShowSettings(true)} className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"><Settings className="w-5 h-5 text-gray-600" /></button>
          <button onClick={handleDownloadPDF} disabled={isDownloading} className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-sm text-gray-700 flex items-center gap-2 disabled:opacity-50">
            {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />} 
            {isEn ? 'Download PDF' : 'تحميل PDF'}
          </button>
          {isLocked ? (
            <button onClick={handleUnlock} className="px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 border-2 transition-colors" style={{ borderColor: BRAND.red, color: BRAND.red }}><Unlock className="w-4 h-4" />{isEn ? 'Unlock' : 'فتح'}</button>
          ) : (
            <>
              <button onClick={() => handleSave()} disabled={saving} className="px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 text-white disabled:opacity-50 transition-colors" style={{ background: BRAND.black }}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}{isEn ? 'Save' : 'حفظ'}
              </button>
              <button onClick={handleFinalize} disabled={saving} className="px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 text-white disabled:opacity-50 shadow-lg transition-all hover:shadow-xl" style={{ background: `linear-gradient(135deg, ${BRAND.red}, ${BRAND.redDark})` }}>
                <CheckCircle2 className="w-4 h-4" />{isEn ? 'Finalize' : 'إقفال نهائي'}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex gap-4 print:block">
        {/* ─── Side Panel ───────────────────────────────────────────── */}
        <div className={`w-60 shrink-0 space-y-3 print:hidden ${isLocked ? 'opacity-50 pointer-events-none' : ''} overflow-y-auto max-h-[85vh]`}>
          <div className="bg-white border border-gray-200 rounded-2xl p-3">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{isEn ? 'Date' : 'التاريخ'}</p>
            <CustomDatePicker value={letter.dateGregorian} onChange={handleGregorianChange} placeholder={isEn ? 'Gregorian' : 'ميلادي'} />
            <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-2"><Calendar className="w-3 h-3" /><span>{isEn ? 'Hijri:' : 'هجري:'} <span className="font-mono font-bold text-gray-700">{letter.dateHijri}</span></span></div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-3 space-y-1.5">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{isEn ? 'Sections' : 'الأقسام'}</p>
            {[{ key: 'showRecipient', label: isAr ? 'السادة' : 'To' }, { key: 'showSubject', label: isAr ? 'الموضوع' : 'Subject' }, { key: 'showGreeting', label: isAr ? 'التحية' : 'Greeting' }, { key: 'showClosing', label: isAr ? 'الخاتمة' : 'Closing' }].map(item => (
              <button key={item.key} onClick={() => updateLetter({ [item.key]: !(letter as any)[item.key] })} className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-gray-50 transition-colors">
                <span className="text-xs font-medium text-gray-700">{item.label}</span>
                {(letter as any)[item.key] ? <ToggleRight className="w-5 h-5" style={{ color: BRAND.red }} /> : <ToggleLeft className="w-5 h-5 text-gray-300" />}
              </button>
            ))}
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-3 space-y-1.5">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{isEn ? 'Add' : 'إضافة'}</p>
            <button onClick={addTextBlock} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-colors" style={{ background: `${BRAND.black}08`, color: BRAND.black }}><Type className="w-4 h-4" /> {isEn ? 'Text' : 'فقرة نصية'}</button>
            <button onClick={addImageBlock} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-colors" style={{ background: `${BRAND.red}10`, color: BRAND.red }}><ImageIcon className="w-4 h-4" /> {isEn ? 'Image' : 'صورة'}</button>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-3">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">{isEn ? 'Stamp & Signature' : 'الختم والتوقيع'}</p>
            <div className="grid grid-cols-3 gap-1.5">
              {stamps.map(s => (
                <button key={s.id} onClick={() => addOverlay('stamp', s.imageDataUrl)} className="flex flex-col items-center gap-1 p-2 rounded-xl border border-dashed border-gray-200 hover:border-red-300 hover:bg-red-50 transition-all">
                  <img src={s.imageDataUrl} alt={s.name} className="w-8 h-8 object-contain" />
                  <span className="text-[8px] text-gray-500"><Stamp className="w-2.5 h-2.5 inline" /></span>
                </button>
              ))}
              {signatures.map(s => (
                <button key={s.id} onClick={() => addOverlay('signature', s.signatureDataUrl)} className="flex flex-col items-center gap-1 p-2 rounded-xl border border-dashed border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition-all">
                  <img src={s.signatureDataUrl} alt={s.name} className="w-10 h-5 object-contain" />
                  <span className="text-[8px] text-gray-500"><PenTool className="w-2.5 h-2.5 inline" /></span>
                </button>
              ))}
            </div>
            {stamps.length === 0 && signatures.length === 0 && <p className="text-[10px] text-gray-400 text-center py-2">{isEn ? 'Add from Letters page' : 'أضف من صفحة الخطابات'}</p>}
          </div>
          {overlays.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-3">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">{isEn ? 'Items' : 'العناصر'} ({overlays.length})</p>
              <div className="space-y-1">
                {overlays.map(o => (
                  <div key={o.id} onClick={() => setActiveOverlayId(o.id)} className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-xs cursor-pointer transition-all ${activeOverlayId === o.id ? 'border-2' : 'bg-gray-50 hover:bg-gray-100 border border-transparent'}`} style={activeOverlayId === o.id ? { borderColor: BRAND.red, background: '#fef2f2' } : {}}>
                    <span className="font-medium text-gray-700 truncate">{o.type === 'stamp' ? '🔴' : o.type === 'signature' ? '✍️' : '🖼️'} {o.type === 'stamp' ? (isEn ? 'Stamp' : 'ختم') : o.type === 'signature' ? (isEn ? 'Sign' : 'توقيع') : (isEn ? 'Image' : 'صورة')} <span className="text-[9px] text-gray-400">ص{o.page}</span></span>
                    <div className="flex items-center gap-0.5">
                      <button onClick={(e) => { e.stopPropagation(); duplicateOverlay(o.id); }} className="p-0.5 text-gray-400 hover:text-gray-600"><Copy className="w-3 h-3" /></button>
                      <button onClick={(e) => { e.stopPropagation(); removeOverlay(o.id); }} className="p-0.5 text-red-400 hover:text-red-600"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ─── A4 Preview ───────────────────────────────────────────── */}
        <div className="flex-1 flex justify-center">
          <div id="letter-preview" dir={dir} className="flex flex-col gap-8 p-6 overflow-y-auto max-h-[85vh] print:p-0 print:max-h-none print:gap-0" style={{ fontFamily: isAr ? "'Noto Sans Arabic', sans-serif" : "'Inter', sans-serif" }} onClick={() => setActiveOverlayId(null)}>
            {pageAssignments.map((pageBlocks, pIdx) => {
              const pageNum = pIdx + 1;
              const isFirstPage = pageNum === 1;
              const isLastPage = pageNum === numPages;
              const pageOverlays = overlays.filter(o => o.page === pageNum);

              return (
                <div key={pIdx} className="relative bg-white shadow-2xl print:shadow-none flex flex-col shrink-0 print-page" style={{ width: `${PAGE_W}px`, height: `${PAGE_H}px`, minHeight: `${PAGE_H}px`, maxHeight: `${PAGE_H}px`, overflow: 'clip', borderRadius: '4px' }}>

                  {/* ═══ TOP ACCENT — Red road circle inspired ════════ */}
                  <div className="absolute top-0 left-0 right-0 z-10 flex" style={{ height: '6px' }}>
                    <div className="flex-1" style={{ background: `linear-gradient(90deg, ${BRAND.red}, ${BRAND.redLight})` }} />
                    <div style={{ width: '30%', background: BRAND.black }} />
                  </div>
                  {/* Decorative red circle accent (top corner) */}
                  <div className="absolute z-0 pointer-events-none print:hidden" style={{ top: '-60px', [isAr ? 'left' : 'right']: '-60px', width: '180px', height: '180px', borderRadius: '50%', border: `4px solid ${BRAND.red}15`, opacity: 0.4 }} />
                  <div className="absolute z-0 pointer-events-none print:hidden" style={{ top: '-30px', [isAr ? 'left' : 'right']: '-30px', width: '120px', height: '120px', borderRadius: '50%', border: `3px dashed ${BRAND.red}20`, opacity: 0.3 }} />

                  {/* ═══ WATERMARK ═════════════════════════════════════ */}
                  {settings.companyLogoUrl && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0" style={{ opacity: 0.03 }}>
                      <img src={settings.companyLogoUrl} alt="" style={{ width: '50%', objectFit: 'contain' }} />
                    </div>
                  )}

                  {/* ═══ HEADER ════════════════════════════════════════ */}
                  {isFirstPage ? (
                    <div className="relative z-[1]" style={{ padding: '24mm 20mm 0 20mm' }}>
                      <div className="flex items-start justify-between gap-4 pb-4">
                        <div className="flex items-center gap-4 flex-1">
                          {settings.companyLogoUrl && (
                            <div className="shrink-0 relative" style={{ width: '85px', height: '85px' }}>
                              <div className="absolute inset-0 rounded-full" style={{ border: `3px solid ${BRAND.red}`, opacity: 0.15 }} />
                              <div className="w-full h-full rounded-full bg-white flex items-center justify-center p-2 shadow-sm" style={{ border: `2px solid ${BRAND.gray200}` }}>
                                <img src={settings.companyLogoUrl} alt="" className="w-full h-full object-contain" />
                              </div>
                            </div>
                          )}
                          <div className="flex-1">
                            <h1 className="text-[24px] font-black leading-tight tracking-tight" style={{ color: BRAND.black, fontFamily: "'Cairo', sans-serif" }}>{isAr ? settings.companyNameAr : settings.companyNameEn}</h1>
                            <p className="text-[11px] font-bold mt-0.5" style={{ color: BRAND.red, fontFamily: "'Tajawal', sans-serif", letterSpacing: isAr ? '0' : '0.06em' }}>{isAr ? settings.companyNameEn : settings.companyNameAr}</p>
                            {settings.crNumber && <span className="inline-flex mt-1.5 px-2.5 py-0.5 rounded text-[10px] font-bold items-center gap-1.5" style={{ background: `${BRAND.red}08`, color: BRAND.dark, border: `1px solid ${BRAND.red}15`, fontFamily: "'Cairo', sans-serif" }}>{isAr ? 'سجل تجاري:' : 'C.R.:'} <strong className="text-[11px] font-black tracking-wider">{settings.crNumber}</strong></span>}
                          </div>
                        </div>
                        {/* Contact pills */}
                        <div className="shrink-0 space-y-1.5" style={{ [isAr ? 'borderRight' : 'borderLeft']: `2px solid ${BRAND.red}20`, [isAr ? 'paddingRight' : 'paddingLeft']: '16px' }}>
                          {settings.phone && <div className="flex items-center gap-1.5 text-[10px] font-medium" style={{ color: BRAND.dark }} dir="ltr"><span className="w-5 h-5 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${BRAND.red}10` }}><Phone className="w-2.5 h-2.5" style={{ color: BRAND.red }} /></span>{settings.phone}</div>}
                          {settings.email && <div className="flex items-center gap-1.5 text-[10px] font-medium" style={{ color: BRAND.dark }} dir="ltr"><span className="w-5 h-5 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${BRAND.red}10` }}><Mail className="w-2.5 h-2.5" style={{ color: BRAND.red }} /></span>{settings.email}</div>}
                          {settings.website && <div className="flex items-center gap-1.5 text-[10px] font-medium" style={{ color: BRAND.dark }} dir="ltr"><span className="w-5 h-5 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${BRAND.red}10` }}><Globe className="w-2.5 h-2.5" style={{ color: BRAND.red }} /></span>{settings.website}</div>}
                        </div>
                      </div>
                      {/* Red divider */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-[2px]" style={{ background: `linear-gradient(90deg, ${BRAND.red}, transparent)` }} />
                        <div className="w-2 h-2 rounded-full" style={{ background: BRAND.red }} />
                        <div className="flex-1 h-[2px]" style={{ background: `linear-gradient(270deg, ${BRAND.red}, transparent)` }} />
                      </div>
                    </div>
                  ) : (
                    <div className="relative z-[1]" style={{ padding: '12mm 20mm 0 20mm' }}>
                      <div className="flex items-center justify-between gap-3 pb-2" style={{ borderBottom: `2px solid ${BRAND.red}20` }}>
                        <div className="flex items-center gap-2">
                          {settings.companyLogoUrl && <img src={settings.companyLogoUrl} alt="" className="h-8 object-contain" />}
                          <span className="text-[11px] font-black" style={{ color: BRAND.black, fontFamily: "'Cairo', sans-serif" }}>{isAr ? settings.companyNameAr : settings.companyNameEn}</span>
                        </div>
                        <span className="text-[9px] font-bold font-mono px-2 py-0.5 rounded-full" style={{ color: BRAND.red, background: `${BRAND.red}08` }}>{pageNum} / {numPages}</span>
                      </div>
                    </div>
                  )}

                  {/* ═══ REF / DATE ═══════════════════════════════════ */}
                  <div className="z-[1]" style={{ padding: '8px 20mm 0 20mm' }}>
                    <div className="flex items-center justify-between gap-4 px-3 py-1.5 rounded-lg" style={{ background: `${BRAND.black}05` }}>
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <span className="font-black" style={{ color: BRAND.black }}>{isAr ? 'الرقم:' : 'Ref:'}</span>
                        <span className="font-mono font-bold px-2 py-0.5 rounded text-[11px] bg-white" style={{ color: BRAND.red }}>{letter.letterNumber}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <span className="font-bold" style={{ color: BRAND.black }}>{isAr ? 'التاريخ:' : 'Date:'}</span>
                        <span className="font-mono font-bold" style={{ color: BRAND.black }} dir="ltr">{formatGregorianDisplay(letter.dateGregorian)}</span>
                        <span className="text-[9px]" style={{ color: BRAND.red }}>|</span>
                        <span className="font-mono font-bold" style={{ color: BRAND.black }} dir="ltr">{letter.dateHijri}</span>
                        <span className="text-[9px]" style={{ color: BRAND.red }}>هـ</span>
                      </div>
                    </div>
                  </div>

                  {/* ═══ FIRST PAGE FIELDS ════════════════════════════ */}
                  {isFirstPage && (
                    <div className={`z-[1] ${isLocked ? 'pointer-events-none' : ''}`} style={{ padding: '0 20mm' }}>
                      {letter.showRecipient && (
                        <div className="mt-3 flex items-center gap-2">
                          <span className="font-black text-[13px] whitespace-nowrap" style={{ color: BRAND.black }}>{isAr ? 'السادة /' : 'To /'}</span>
                          <input value={letter.recipientText} onChange={e => updateLetter({ recipientText: e.target.value })} placeholder="........................................................" className="flex-1 bg-transparent outline-none pb-1 font-bold text-[13px] placeholder:text-gray-200" style={{ color: BRAND.black, borderBottom: `2px dotted ${BRAND.red}40` }} />
                        </div>
                      )}
                      {letter.showSubject && (
                        <div className="mt-3 flex items-center gap-2">
                          <span className="font-black text-[13px] whitespace-nowrap" style={{ color: BRAND.black }}>{isAr ? 'الموضوع /' : 'Subject /'}</span>
                          <input value={letter.subjectText} onChange={e => updateLetter({ subjectText: e.target.value })} placeholder="........................................................" className="flex-1 bg-transparent outline-none pb-1 font-bold text-[13px] placeholder:text-gray-200" style={{ color: BRAND.black, borderBottom: `2px dotted ${BRAND.red}40` }} />
                        </div>
                      )}
                      {letter.showGreeting && <p className="mt-3 font-black text-[13px]" style={{ color: BRAND.black }}>{isAr ? 'تحية طيبة وبعد ..' : 'Dear Sir/Madam,'}</p>}
                    </div>
                  )}

                  {/* ═══ CONTENT BODY ═════════════════════════════════ */}
                  <div ref={(el) => { bodyRefs.current[pIdx] = el; }} className="flex-1 relative z-[2]" style={{ padding: `${BODY_PAD / 2}px 20mm`, overflow: 'visible' }} onClick={(e) => { e.stopPropagation(); setActiveOverlayId(null); }}>
                    {pageBlocks.map((block) => (
                      <div key={block.id} id={`block-${block.id}`} ref={(el) => { blockRefs.current[block.id] = el; }} className="group/block relative mb-1" style={{ zIndex: 5 }}>
                        {!isLocked && (
                          <div className="absolute -top-6 flex items-center gap-0.5 bg-white/95 backdrop-blur border border-gray-200 shadow-lg rounded-full px-1.5 py-0.5 print:hidden opacity-0 group-hover/block:opacity-100 transition-opacity z-40" style={{ [isAr ? 'left' : 'right']: '0' }}>
                            <button onClick={() => updateBlock(block.id, { fontWeight: block.fontWeight === 'bold' ? 'normal' : 'bold' })} className={`p-1 rounded transition-colors ${block.fontWeight === 'bold' ? 'text-white' : 'text-gray-400 hover:bg-gray-100'}`} style={block.fontWeight === 'bold' ? { background: BRAND.red } : {}}><Bold className="w-3 h-3" /></button>
                            <button onClick={() => updateBlock(block.id, { fontStyle: block.fontStyle === 'italic' ? 'normal' : 'italic' })} className={`p-1 rounded transition-colors ${block.fontStyle === 'italic' ? 'text-white' : 'text-gray-400 hover:bg-gray-100'}`} style={block.fontStyle === 'italic' ? { background: BRAND.red } : {}}><Italic className="w-3 h-3" /></button>
                            <button onClick={() => updateBlock(block.id, { textDecoration: block.textDecoration === 'underline' ? 'none' : 'underline' })} className={`p-1 rounded transition-colors ${block.textDecoration === 'underline' ? 'text-white' : 'text-gray-400 hover:bg-gray-100'}`} style={block.textDecoration === 'underline' ? { background: BRAND.red } : {}}><Underline className="w-3 h-3" /></button>
                            <div className="w-px h-3 bg-gray-200 mx-0.5" />
                            <button onClick={() => updateBlock(block.id, { fontSize: Math.max(10, (block.fontSize || 14) - 1) })} className="p-1 text-gray-400 hover:bg-gray-100 rounded"><MinusIcon className="w-3 h-3" /></button>
                            <span className="text-[9px] font-mono font-bold min-w-[16px] text-center" style={{ color: BRAND.red }}>{block.fontSize || 14}</span>
                            <button onClick={() => updateBlock(block.id, { fontSize: Math.min(36, (block.fontSize || 14) + 1) })} className="p-1 text-gray-400 hover:bg-gray-100 rounded"><PlusIcon className="w-3 h-3" /></button>
                            <div className="w-px h-3 bg-gray-200 mx-0.5" />
                            <label className="p-1 text-gray-400 hover:bg-gray-100 rounded cursor-pointer relative"><Palette className="w-3 h-3" /><input type="color" value={block.color || '#1e293b'} onChange={e => updateBlock(block.id, { color: e.target.value })} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" /></label>
                            <div className="w-px h-3 bg-gray-200 mx-0.5" />
                            {(['right', 'center', 'left'] as TextAlign[]).map(a => (
                              <button key={a} onClick={() => updateBlock(block.id, { align: a })} className={`p-1 rounded transition-colors ${(block.align || (isAr ? 'right' : 'left')) === a ? 'text-white' : 'text-gray-400 hover:bg-gray-100'}`} style={(block.align || (isAr ? 'right' : 'left')) === a ? { background: BRAND.black } : {}}>
                                {a === 'right' ? <AlignRight className="w-3 h-3" /> : a === 'center' ? <AlignCenter className="w-3 h-3" /> : <AlignLeft className="w-3 h-3" />}
                              </button>
                            ))}
                            <div className="w-px h-3 bg-gray-200 mx-0.5" />
                            <button onClick={() => moveBlock(block.id, -1)} className="p-1 text-gray-400 hover:bg-gray-100 rounded"><ChevronUp className="w-3 h-3" /></button>
                            <button onClick={() => moveBlock(block.id, 1)} className="p-1 text-gray-400 hover:bg-gray-100 rounded"><ChevronDown className="w-3 h-3" /></button>
                            <div className="w-px h-3 bg-gray-200 mx-0.5" />
                            <button onClick={() => removeBlock(block.id)} className="p-1 text-red-400 hover:bg-red-50 rounded"><Trash2 className="w-3 h-3" /></button>
                          </div>
                        )}
                        <textarea
                          value={block.content}
                          onChange={e => { updateBlock(block.id, { content: e.target.value }); setTimeout(() => setMeasureTick(t => t + 1), 30); }}
                          onKeyDown={e => handleTextKeyDown(e, block.id)}
                          placeholder={isAr ? 'اكتب هنا...' : 'Type here...'}
                          className="w-full bg-transparent border-none outline-none resize-none placeholder:text-gray-200 print:placeholder:text-transparent"
                          rows={1}
                          style={{ fontSize: `${block.fontSize || 14}px`, lineHeight: '2.2', fontWeight: block.fontWeight || 'normal', fontStyle: block.fontStyle || 'normal', textDecoration: block.textDecoration || 'none', color: block.color || '#333', fontFamily: block.fontFamily || FONT_FAMILIES[0].css, textAlign: (block.align || (isAr ? 'right' : 'left')) as any, overflow: 'hidden' }}
                          dir={isAr ? 'rtl' : 'ltr'}
                        />
                      </div>
                    ))}
                    {isLastPage && letter.showClosing && <div className="mt-6 mb-2"><p className="font-black text-[13px]" style={{ color: BRAND.black }}>{isAr ? 'وتفضلوا بقبول فائق الاحترام والتقدير ،،' : 'Yours faithfully,'}</p></div>}
                    {isLastPage && (
                      <div className={`mt-3 ${isLocked ? 'pointer-events-none' : ''}`}>
                        <input value={letter.signerName} onChange={e => updateLetter({ signerName: e.target.value })} placeholder={isAr ? 'الاسم' : 'Name'} className="block w-full bg-transparent border-none outline-none font-black text-[13px] placeholder:text-gray-200" style={{ color: BRAND.black }} />
                        <input value={letter.signerTitle} onChange={e => updateLetter({ signerTitle: e.target.value })} placeholder={isAr ? 'المسمى الوظيفي' : 'Title'} className="block w-full bg-transparent border-none outline-none text-xs font-bold placeholder:text-gray-200 mt-0.5" style={{ color: BRAND.red }} />
                      </div>
                    )}

                    {/* Overlays */}
                    {pageOverlays.map((ov) => {
                      const isActive = activeOverlayId === ov.id;
                      return (
                        <div key={ov.id} style={{ position: 'absolute', left: `${ov.xPct * 100}%`, top: `${ov.yPct * 100}%`, width: `${ov.widthPct * 100}%`, touchAction: 'none', zIndex: isActive ? 50 : 30, cursor: isLocked ? 'default' : 'grab', opacity: ov.opacity, outline: isActive ? `2px solid ${BRAND.red}` : 'none', outlineOffset: '2px', borderRadius: isActive ? '4px' : undefined }} className="print:pointer-events-none print-force-opaque" onPointerDown={(e) => { if (!isLocked) handlePointerDown(e, ov.id, 'move', pIdx); }} onClick={(e) => { e.stopPropagation(); setActiveOverlayId(ov.id); }}>
                          <img src={ov.imageUrl} alt={ov.type} className="w-full pointer-events-none select-none" draggable={false} />
                          {isActive && !isLocked && (
                            <>
                              <button className="absolute -top-3 -right-3 w-5 h-5 text-white rounded-full flex items-center justify-center shadow-lg z-30 print:hidden" style={{ background: BRAND.red }} onPointerDown={(e) => { e.stopPropagation(); removeOverlay(ov.id); }}><X className="w-3 h-3" /></button>
                              <button className="absolute -top-3 -left-3 w-5 h-5 text-white rounded-full flex items-center justify-center shadow-lg z-30 print:hidden" style={{ background: BRAND.black }} onPointerDown={(e) => { e.stopPropagation(); duplicateOverlay(ov.id); }}><Copy className="w-3 h-3" /></button>
                              <div className="absolute -bottom-2 -left-2 w-5 h-5 rounded-full cursor-nwse-resize shadow-lg z-30 print:hidden" style={{ background: BRAND.red }} onPointerDown={(e) => handlePointerDown(e, ov.id, 'resize', pIdx)}>
                                <svg className="w-full h-full p-1" viewBox="0 0 10 10" fill="none"><path d="M1 9L9 1M5 9L9 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" /></svg>
                              </div>
                              <div className="absolute inset-0 border-2 border-dashed rounded pointer-events-none print:hidden" style={{ borderColor: BRAND.red }} />
                              {numPages > 1 && (
                                <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white border border-gray-200 shadow-md rounded-full px-1.5 py-0.5 z-30 print:hidden">
                                  <button onClick={(e) => { e.stopPropagation(); if (ov.page > 1) updateOverlay(ov.id, { page: ov.page - 1 }); }} disabled={ov.page <= 1} className="p-0.5 text-gray-400 disabled:opacity-30"><ChevronUp className="w-3 h-3" /></button>
                                  <span className="text-[8px] font-mono font-bold" style={{ color: BRAND.red }}>{ov.page}/{numPages}</span>
                                  <button onClick={(e) => { e.stopPropagation(); if (ov.page < numPages) updateOverlay(ov.id, { page: ov.page + 1 }); }} disabled={ov.page >= numPages} className="p-0.5 text-gray-400 disabled:opacity-30"><ChevronDown className="w-3 h-3" /></button>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* ═══ FOOTER ═══════════════════════════════════════ */}
                  <div className="absolute bottom-0 left-0 right-0 z-20 bg-white" style={{ padding: '0 20mm 8mm 20mm' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex-1 h-[2px]" style={{ background: `linear-gradient(90deg, ${BRAND.red}, transparent)` }} />
                      <div className="w-2 h-2 rounded-full" style={{ background: BRAND.red }} />
                      <div className="flex-1 h-[2px]" style={{ background: `linear-gradient(270deg, ${BRAND.red}, transparent)` }} />
                    </div>
                    <p className="print-footer-text text-[10px] text-center leading-relaxed font-bold" style={{ color: BRAND.gray600 }} dir={dir}>{isAr ? settings.footerAddressAr : settings.footerAddressEn}</p>
                    <div className="print-footer-text text-center text-[10px] mt-0.5 font-mono font-bold" style={{ color: BRAND.red }}>{pageNum} / {numPages}</div>
                    <div className="absolute bottom-0 left-0 right-0 flex" style={{ height: '6px' }}>
                      <div style={{ width: '30%', background: BRAND.black }} />
                      <div className="flex-1" style={{ background: `linear-gradient(90deg, ${BRAND.redLight}, ${BRAND.red})` }} />
                    </div>
                  </div>
                  {/* Bottom decorative circle */}
                  <div className="absolute z-0 pointer-events-none print:hidden" style={{ bottom: '-50px', [isAr ? 'right' : 'left']: '-50px', width: '150px', height: '150px', borderRadius: '50%', border: `4px solid ${BRAND.red}10`, opacity: 0.3 }} />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── Settings Modal ───────────────────────────────────────────── */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 print:hidden">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowSettings(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl w-full max-w-lg relative z-10 shadow-2xl max-h-[85vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-100"><h3 className="text-lg font-black text-gray-800 flex items-center gap-2"><Settings className="w-5 h-5 text-gray-500" />{isEn ? 'Template Settings' : 'إعدادات القالب'}</h3></div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs font-bold text-gray-600 mb-1">{isEn ? 'Company (AR)' : 'المؤسسة (عربي)'}</label><input value={editSettings.companyNameAr} onChange={e => setEditSettings(p => ({ ...p, companyNameAr: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2" style={{ '--tw-ring-color': BRAND.red } as any} /></div>
                  <div><label className="block text-xs font-bold text-gray-600 mb-1">{isEn ? 'Company (EN)' : 'المؤسسة (إنجليزي)'}</label><input value={editSettings.companyNameEn} onChange={e => setEditSettings(p => ({ ...p, companyNameEn: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none" dir="ltr" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs font-bold text-gray-600 mb-1">{isEn ? 'CR Number' : 'السجل التجاري'}</label><input value={editSettings.crNumber || ''} onChange={e => setEditSettings(p => ({ ...p, crNumber: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none" dir="ltr" /></div>
                  <div><label className="block text-xs font-bold text-gray-600 mb-1">{isEn ? 'Phone' : 'الهاتف'}</label><input value={editSettings.phone || ''} onChange={e => setEditSettings(p => ({ ...p, phone: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none" dir="ltr" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs font-bold text-gray-600 mb-1">{isEn ? 'Email' : 'البريد'}</label><input value={editSettings.email || ''} onChange={e => setEditSettings(p => ({ ...p, email: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none" dir="ltr" /></div>
                  <div><label className="block text-xs font-bold text-gray-600 mb-1">{isEn ? 'Website' : 'الموقع'}</label><input value={editSettings.website || ''} onChange={e => setEditSettings(p => ({ ...p, website: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none" dir="ltr" /></div>
                </div>
                <div><label className="block text-xs font-bold text-gray-600 mb-1">{isEn ? 'Footer (AR)' : 'الفوتر (عربي)'}</label><textarea value={editSettings.footerAddressAr} onChange={e => setEditSettings(p => ({ ...p, footerAddressAr: e.target.value }))} rows={2} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none" /></div>
                <div><label className="block text-xs font-bold text-gray-600 mb-1">{isEn ? 'Footer (EN)' : 'الفوتر (إنجليزي)'}</label><textarea value={editSettings.footerAddressEn} onChange={e => setEditSettings(p => ({ ...p, footerAddressEn: e.target.value }))} rows={2} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none" dir="ltr" /></div>
                <div><label className="block text-xs font-bold text-gray-600 mb-1">{isEn ? 'Logo URL' : 'رابط الشعار'}</label><input value={editSettings.companyLogoUrl} onChange={e => setEditSettings(p => ({ ...p, companyLogoUrl: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none" dir="ltr" /></div>
              </div>
              <div className="p-6 border-t border-gray-100 flex gap-3">
                <button onClick={() => setShowSettings(false)} className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-sm text-gray-600">{isEn ? 'Cancel' : 'إلغاء'}</button>
                <button onClick={handleSaveSettings} className="flex-[2] py-2.5 text-white rounded-xl font-bold text-sm" style={{ background: BRAND.red }}>{isEn ? 'Save' : 'حفظ'}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&family=Tajawal:wght@400;700&family=Noto+Sans+Arabic:wght@400;700&display=swap');
        #letter-preview, #letter-preview * { font-variant-numeric: lining-nums !important; font-feature-settings: "lnum" !important; }
        @page { size: A4 portrait; margin: 0; }
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body, html { margin: 0 !important; padding: 0 !important; background: white !important; display: block !important; }
          body * { visibility: hidden; }
          #letter-preview, #letter-preview * { visibility: visible; }
          #letter-preview {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
          }
          .print-page {
            width: 210mm !important;
            height: 297mm !important;
            min-height: 297mm !important;
            max-height: 297mm !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            page-break-after: always !important;
            break-after: page !important;
            overflow: hidden !important;
            position: relative !important;
          }
          .print\\:hidden { display: none !important; }
          .print-force-opaque { opacity: 1 !important; mix-blend-mode: normal !important; filter: none !important; }
          .print-footer-text { visibility: visible !important; color: #1e293b !important; }
        }
      `}</style>
      {/* Finalize Confirmation Modal */}
      {showFinalizeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-8 text-center">
              <div className="w-20 h-20 mx-auto bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6 shadow-sm border border-red-100">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-black mb-3" style={{ color: BRAND.black }}>
                {isEn ? 'Finalize Letter?' : 'إقفال نهائي للخطاب؟'}
              </h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-8">
                {isEn 
                  ? 'Are you sure you want to finalize this letter? Once finalized, you will not be able to edit the content, stamps, or signatures unless you unlock it again.' 
                  : 'هل أنت متأكد من رغبتك في الإقفال النهائي؟ بعد الإقفال، لن تتمكن من تعديل النص، الأختام، أو التواقيع إلا بعد فك الإقفال.'}
              </p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowFinalizeModal(false)}
                  className="flex-1 py-3.5 px-4 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  {isEn ? 'Cancel' : 'إلغاء'}
                </button>
                <button 
                  onClick={confirmFinalize}
                  className="flex-1 py-3.5 px-4 rounded-xl font-bold text-white shadow-lg shadow-red-500/30 hover:shadow-red-500/40 transition-all active:scale-[0.98]"
                  style={{ background: `linear-gradient(135deg, ${BRAND.red}, ${BRAND.redDark})` }}
                >
                  {isEn ? 'Yes, Finalize' : 'نعم، إقفال نهائي'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unlock Confirmation Modal */}
      {showUnlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-8 text-center">
              <div className="w-20 h-20 mx-auto bg-gray-50 text-gray-500 rounded-full flex items-center justify-center mb-6 shadow-sm border border-gray-100">
                <Unlock className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-black mb-3" style={{ color: BRAND.black }}>
                {isEn ? 'Unlock Letter?' : 'فتح الخطاب للتعديل؟'}
              </h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-8">
                {isEn 
                  ? 'Are you sure you want to unlock this letter? It will revert to draft status and the official letter number might be reassigned if you save it again as a draft.' 
                  : 'هل أنت متأكد من رغبتك في فتح الخطاب للتعديل؟ سيعود الخطاب كـ "مسودة" ويمكنك تعديل جميع محتوياته.'}
              </p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowUnlockModal(false)}
                  className="flex-1 py-3.5 px-4 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  {isEn ? 'Cancel' : 'إلغاء'}
                </button>
                <button 
                  onClick={confirmUnlock}
                  className="flex-1 py-3.5 px-4 rounded-xl font-bold text-gray-800 shadow-lg shadow-gray-200 hover:shadow-gray-300 transition-all active:scale-[0.98] border-2 border-gray-200"
                >
                  {isEn ? 'Yes, Unlock' : 'نعم، فتح للتعديل'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
