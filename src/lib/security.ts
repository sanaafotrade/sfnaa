export function isSpam(subject: string, text: string, from: string): boolean {
  const content = `${subject} ${text}`.toLowerCase();
  
  // الكلمات التي تستخدم عادة في سبام تطوير المواقع والـ SEO
  const spamKeywords = [
    "seo", "search engine optimization", "page rank",
    "web design", "website redesign", "rebuild your website",
    "generate leads", "first page of google", "web development services",
    "mobile app development", "offshore development"
  ];

  // إذا كان البريد يحتوي على هذه الكلمات، نعتبره سبام
  for (const keyword of spamKeywords) {
    if (content.includes(keyword)) {
      return true;
    }
  }

  return false;
}

export function validateAttachment(filename: string, mimeType: string): boolean {
  // منع الملفات التنفيذية والسكريبتات
  const blockedExtensions = [".exe", ".bat", ".cmd", ".sh", ".js", ".vbs", ".msi", ".jar"];
  const blockedMimes = [
    "application/x-msdownload",
    "application/x-sh",
    "application/javascript",
    "text/javascript",
    "application/java-archive"
  ];

  const ext = filename.substring(filename.lastIndexOf(".")).toLowerCase();
  
  if (blockedExtensions.includes(ext) || blockedMimes.includes(mimeType)) {
    return false;
  }

  return true;
}
