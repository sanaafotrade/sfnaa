// ─── Hijri Conversion ───────────────────────────────────────────────────────

export function gregorianToHijri(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    const formatter = new Intl.DateTimeFormat('en-u-ca-islamic-nu-latn', {
      year: 'numeric', month: '2-digit', day: '2-digit',
    });
    const parts = formatter.formatToParts(d);
    const year = parts.find(p => p.type === 'year')?.value || '';
    const month = parts.find(p => p.type === 'month')?.value || '';
    const day = parts.find(p => p.type === 'day')?.value || '';
    return `${day}/${month}/${year.replace(' AH', '')}`;
  } catch {
    return '';
  }
}

export function formatGregorianDisplay(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

export function getTodayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ─── Types ──────────────────────────────────────────────────────────────────

export type LetterLanguage = 'ar' | 'en';
export type TextAlign = 'right' | 'center' | 'left';

export const FONT_FAMILIES = [
  { id: 'noto-ar', label: 'Noto Sans Arabic', css: "'Noto Sans Arabic', sans-serif" },
  { id: 'inter', label: 'Inter', css: "'Inter', sans-serif" },
  { id: 'cairo', label: 'Cairo', css: "'Cairo', sans-serif" },
  { id: 'tajawal', label: 'Tajawal', css: "'Tajawal', sans-serif" },
  { id: 'amiri', label: 'Amiri', css: "'Amiri', serif" },
  { id: 'arial', label: 'Arial', css: "Arial, sans-serif" },
  { id: 'times', label: 'Times New Roman', css: "'Times New Roman', serif" },
];

export interface LetterBlock {
  id: string;
  type: 'text' | 'image';
  content: string;          // text content or image URL
  // Text formatting
  fontSize?: number;        // px, default 14
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline';
  color?: string;           // hex, default '#1e293b'
  fontFamily?: string;      // css font-family string
  align?: TextAlign;
  // Image-specific
  width?: number;           // px
  height?: number;          // px
  // Absolute positions
  x?: number;
  y?: number;
}

export interface LetterDocument {
  id: string;
  language: LetterLanguage;
  letterNumber: string;
  dateGregorian: string;    // YYYY-MM-DD
  dateHijri: string;        // DD/MM/YYYY hijri
  
  // Header fields (toggleable)
  showRecipient: boolean;
  recipientText: string;    // "السادة / ..." or "To / ..."
  showSubject: boolean;
  subjectText: string;
  showGreeting: boolean;    // "تحية طيبة وبعد" or "Dear Sir/Madam,"
  
  // Body
  blocks: LetterBlock[];
  
  // Closing
  showClosing: boolean;     // "وتفضلوا..." or "Yours faithfully,"
  closingText?: string;
  
  // Signature
  signerName: string;
  signerTitle: string;
  signerX?: number;
  signerY?: number;
  signatureUrl?: string;    // uploaded signature image
  signatureX?: number;
  signatureY?: number;
  signatureWidth?: number;
  signatureHeight?: number;
  signaturePage?: number;    // which page index the signature is on (undefined = last)
  stampUrl?: string;        // uploaded stamp image
  stampX?: number;
  stampY?: number;
  stampWidth?: number;
  stampHeight?: number;
  stampPage?: number;        // which page index the stamp is on (undefined = last)
  
  // Overlays (stamps, signatures, images placed on the document)
  overlays?: {
    id: string;
    type: 'stamp' | 'signature' | 'image';
    page: number;
    xPct: number;
    yPct: number;
    widthPct: number;
    imageUrl: string;
    opacity: number;
    naturalAspect: number;
  }[];
  
  // Meta
  status: 'draft' | 'sent';
  createdBy: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt?: string;
}

export interface LetterTemplateSettings {
  id: string;               // always 'default'
  companyNameAr: string;
  companyNameEn: string;
  companyLogoUrl: string;
  crNumber: string;         // سجل تجاري
  vatNumber?: string;
  phone?: string;
  email?: string;
  website?: string;
  footerAddressAr: string;
  footerAddressEn: string;
  defaultSignatureUrl?: string;
  defaultStampUrl?: string;
  updatedAt?: string;
}

// ─── Default Settings ───────────────────────────────────────────────────────

export const DEFAULT_SETTINGS: LetterTemplateSettings = {
  id: 'default',
  companyNameAr: 'مؤسسة سفانة نجد للتجارة',
  companyNameEn: 'Safana Najd Trading Est.',
  companyLogoUrl: '/logo.png',
  crNumber: '',
  footerAddressAr: 'الرياض، المملكة العربية السعودية',
  footerAddressEn: 'Riyadh, Saudi Arabia',
};

// ─── CRUD: Template Settings ────────────────────────────────────────────────

export async function getTemplateSettings(): Promise<LetterTemplateSettings> {
  try {
    const res = await fetch("/api/settings/letter-template");
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (e) { console.error(e); }
  return DEFAULT_SETTINGS;
}

export async function saveTemplateSettings(settings: Partial<LetterTemplateSettings>): Promise<void> {
  await fetch("/api/settings/letter-template", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
}

// ─── CRUD: Letter Documents ─────────────────────────────────────────────────

export async function getLetterDocuments(): Promise<LetterDocument[]> {
  const res = await fetch("/api/hr-letters/documents");
  if (!res.ok) throw new Error("Failed to fetch letter documents");
  return res.json();
}

// Smart compress: only resize if image exceeds size threshold, preserve quality
async function smartCompress(dataUrl: string, type: 'stamp' | 'signature' | 'image'): Promise<string> {
  if (typeof window === 'undefined') return dataUrl;
  // Skip if already small enough (< 150KB)
  if (dataUrl.length < 150_000) return dataUrl;
  
  const maxDim = type === 'image' ? 800 : 500; // larger for photos
  const quality = type === 'image' ? 0.85 : 0.92; // higher quality for stamps
  const format = (type === 'stamp' || type === 'signature') ? 'image/png' : 'image/webp';
  
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      let w = img.naturalWidth, h = img.naturalHeight;
      if (w <= maxDim && h <= maxDim && dataUrl.length < 300_000) { resolve(dataUrl); return; }
      if (w > maxDim || h > maxDim) {
        const scale = Math.min(maxDim / w, maxDim / h);
        w = Math.round(w * scale); h = Math.round(h * scale);
      }
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (ctx) { ctx.drawImage(img, 0, 0, w, h); }
      const result = format === 'image/png' ? canvas.toDataURL('image/png') : canvas.toDataURL('image/webp', quality);
      resolve(result.length < dataUrl.length ? result : dataUrl); // only use if actually smaller
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export async function saveLetterDocument(letter: LetterDocument): Promise<string> {
  let processedOverlays = letter.overlays;
  if (letter.overlays?.length) {
    processedOverlays = await Promise.all(
      letter.overlays.map(async (ov) => {
        if (ov.imageUrl && ov.imageUrl.startsWith('data:')) {
          const compressed = await smartCompress(ov.imageUrl, ov.type);
          return { ...ov, imageUrl: compressed };
        }
        return ov;
      })
    );
  }
  
  const finalLetter = { ...letter, overlays: processedOverlays || [] };
  
  const res = await fetch("/api/hr-letters/documents", {
    method: letter.id && !letter.id.startsWith("ldoc_") ? "PUT" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(finalLetter),
  });
  
  if (!res.ok) throw new Error("Failed to save document");
  const data = await res.json();
  return data.id;
}

export async function deleteLetterDocument(id: string): Promise<void> {
  const res = await fetch(`/api/hr-letters/documents/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete document");
}

// ─── Letter Number Generator ────────────────────────────────────────────────

export async function generateNextLetterNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const all = await getLetterDocuments();
  
  // Only consider 'sent' (finalized) letters that have a real SN number for this year
  const thisYearSent = all.filter(l => l.status === 'sent' && l.letterNumber?.startsWith(`SN-${year}-`));
  
  let maxSeq = 0;
  for (const l of thisYearSent) {
    const parts = l.letterNumber.split('-');
    if (parts.length === 3) {
      const seq = parseInt(parts[2], 10);
      if (!isNaN(seq) && seq > maxSeq) {
        maxSeq = seq;
      }
    }
  }
  
  const seqStr = String(maxSeq + 1).padStart(4, '0');
  return `SN-${year}-${seqStr}`;
}

// ─── Create Empty Letter ────────────────────────────────────────────────────

export function createEmptyLetter(lang: LetterLanguage, letterNumber: string, createdBy: string): LetterDocument {
  const today = getTodayISO();
  return {
    id: `ldoc_${Date.now()}`,
    language: lang,
    letterNumber,
    dateGregorian: today,
    dateHijri: gregorianToHijri(today),
    showRecipient: true,
    recipientText: '',
    showSubject: true,
    subjectText: '',
    showGreeting: true,
    blocks: [{ id: `blk_${Date.now()}`, type: 'text', content: '' }],
    showClosing: true,
    signerName: '',
    signerTitle: '',
    signerX: 60,
    signerY: 100,
    signatureX: 300,
    signatureY: 850,
    signatureWidth: 120,
    signatureHeight: 60,
    stampX: 450,
    stampY: 850,
    stampWidth: 120,
    stampHeight: 120,
    status: 'draft',
    createdBy,
    createdAt: new Date().toISOString(),
  };
}
