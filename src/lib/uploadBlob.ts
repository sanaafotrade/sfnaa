// رفع آمن عبر Vercel Blob بدل Cloudinary
// يتضمن: فحص MIME بالبايتات، ضغط الصور، شريط تقدم

const ALLOWED_MIME_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "application/pdf": "pdf",
};

const MAGIC_NUMBERS: { bytes: number[]; type: string }[] = [
  { bytes: [0xff, 0xd8, 0xff], type: "image/jpeg" },
  { bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], type: "image/png" },
  { bytes: [0x52, 0x49, 0x46, 0x46], type: "image/webp" },
  { bytes: [0x47, 0x49, 0x46, 0x38], type: "image/gif" },
  { bytes: [0x25, 0x50, 0x44, 0x46], type: "application/pdf" },
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const COMPRESS_TARGET = 2 * 1024 * 1024; // 2MB هدف الضغط

async function detectMimeType(file: File): Promise<string | null> {
  const buffer = await file.slice(0, 16).arrayBuffer();
  const bytes = new Uint8Array(buffer);

  for (const magic of MAGIC_NUMBERS) {
    if (magic.bytes.every((b, i) => bytes[i] === b)) {
      if (magic.type === "image/webp") {
        if (bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
          return "image/webp";
        }
        return null;
      }
      return magic.type;
    }
  }
  return null;
}

async function compressImage(file: File, mimeType: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("استغرق ضغط الصورة وقتاً طويلاً."));
    }, 15000);

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX_DIM = 2048;
      let { width, height } = img;

      if (width > MAX_DIM || height > MAX_DIM) {
        const ratio = Math.min(MAX_DIM / width, MAX_DIM / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { clearTimeout(timeout); reject(new Error("فشل")); return; }

      ctx.drawImage(img, 0, 0, width, height);
      const outputType = mimeType === "image/gif" ? "image/png" : mimeType;
      let quality = 0.85;

      const tryCompress = () => {
        canvas.toBlob((blob) => {
          if (!blob) { clearTimeout(timeout); reject(new Error("فشل الضغط")); return; }
          if (blob.size > COMPRESS_TARGET && quality > 0.3) { quality -= 0.1; tryCompress(); return; }
          clearTimeout(timeout);
          resolve(blob);
        }, outputType, quality);
      };
      tryCompress();
    };

    img.onerror = () => { clearTimeout(timeout); URL.revokeObjectURL(url); reject(new Error("فشل قراءة الصورة")); };
    img.src = url;
  });
}

/**
 * رفع ملف آمن عبر Vercel Blob
 * يتضمن فحص MIME + ضغط + شريط تقدم
 */
export async function uploadToBlob(
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  // 0. فحص الحجم
  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / 1024 / 1024).toFixed(1);
    throw new Error(`حجم الملف كبير جداً (${sizeMB}MB). الحد الأقصى 10MB.`);
  }

  // 1. فحص MIME
  onProgress?.(5);
  const detectedType = await detectMimeType(file);
  if (!detectedType || !ALLOWED_MIME_TYPES[detectedType]) {
    throw new Error("نوع الملف غير مدعوم. الأنواع المسموح بها: JPEG، PNG، WebP، GIF، PDF فقط.");
  }

  // 2. ضغط الصورة إذا كانت كبيرة
  onProgress?.(15);
  let payload: Blob | File = file;
  if (detectedType !== "application/pdf" && file.size > COMPRESS_TARGET) {
    payload = await compressImage(file, detectedType);
  }
  onProgress?.(30);

  // 3. رفع عبر API Route → Vercel Blob
  const formData = new FormData();
  const ext = ALLOWED_MIME_TYPES[detectedType];
  formData.append("file", payload, `upload.${ext}`);

  onProgress?.(35);

    // 3. رفع عبر API Route باستخدام XMLHttpRequest لتعقب شريط التقدم الحقيقي
  const data = await new Promise<any>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload-blob", true);
    
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        // حساب التقدم من 35% إلى 95% لأن الـ 5% الأخيرة للرد من السيرفر
        const percentComplete = 35 + Math.round((event.loaded / event.total) * 60);
        onProgress?.(percentComplete);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const resData = JSON.parse(xhr.responseText);
          resolve(resData);
        } catch (e) {
          reject(new Error("رد السيرفر غير مفهوم"));
        }
      } else {
        try {
          const resData = JSON.parse(xhr.responseText);
          reject(new Error(resData.error || `خطأ في الرفع (${xhr.status})`));
        } catch (e) {
          reject(new Error(`خطأ في الرفع (${xhr.status})`));
        }
      }
    };

    xhr.onerror = () => reject(new Error("حدث خطأ في الاتصال بالخادم أثناء الرفع"));
    xhr.send(formData);
  });

  if (!data.success || !data.url) {
    throw new Error(data.error || "فشل الرفع");
  }

  onProgress?.(100);
  return data.url;
}
