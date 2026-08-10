// ======================== Types ========================

export interface Letter {
  id: string;
  title: string;
  letterNumber?: string;
  type: "outgoing" | "incoming" | "internal";
  fileUrl: string;
  fileType: "pdf" | "image";
  stampApplied: boolean;
  signatureApplied: boolean;
  finalFileUrl?: string;
  relatedEmployeeId?: string;
  notes?: string;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
  updatedBy?: string;
  updatedByName?: string;
}

export interface OrgStamp {
  id: string;
  name: string;
  imageDataUrl: string; // base64 PNG
  isDefault: boolean;
  createdAt: string;
}

export interface SavedSignature {
  id: string;
  name: string;
  signatureDataUrl: string; // base64 PNG
  isDefault: boolean;
  createdAt: string;
}

// ======================== Letters CRUD ========================

export async function getLetters(): Promise<Letter[]> {
  const res = await fetch("/api/hr-letters");
  if (!res.ok) throw new Error("Failed to fetch letters");
  return res.json();
}

export async function saveLetter(
  letter: Omit<Letter, "id" | "createdAt" | "updatedAt"> & { id?: string },
  id?: string
): Promise<string> {
  const res = await fetch("/api/hr-letters", {
    method: id || letter.id ? "PUT" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(letter),
  });
  if (!res.ok) throw new Error("Failed to save letter");
  const data = await res.json();
  return data.id;
}

export async function deleteLetter(id: string): Promise<void> {
  const res = await fetch(`/api/hr-letters/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete letter");
}

// ======================== Stamps CRUD ========================

export async function getOrgStamps(): Promise<OrgStamp[]> {
  const res = await fetch("/api/settings/stamps");
  if (!res.ok) throw new Error("Failed to fetch stamps");
  return res.json();
}

export async function saveOrgStamp(
  stamp: Omit<OrgStamp, "id" | "createdAt"> & { id?: string },
  id?: string
): Promise<string> {
  const res = await fetch("/api/settings/stamps", {
    method: id || stamp.id ? "PUT" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(stamp),
  });
  if (!res.ok) throw new Error("Failed to save stamp");
  const data = await res.json();
  return data.id;
}

export async function deleteOrgStamp(id: string): Promise<void> {
  const res = await fetch(`/api/settings/stamps/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete stamp");
}

// ======================== Signatures CRUD ========================

export async function getSavedSignatures(): Promise<SavedSignature[]> {
  const res = await fetch("/api/settings/signatures");
  if (!res.ok) throw new Error("Failed to fetch signatures");
  return res.json();
}

export async function saveSignature(
  sig: Omit<SavedSignature, "id" | "createdAt"> & { id?: string },
  id?: string
): Promise<string> {
  const res = await fetch("/api/settings/signatures", {
    method: id || sig.id ? "PUT" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sig),
  });
  if (!res.ok) throw new Error("Failed to save signature");
  const data = await res.json();
  return data.id;
}

export async function deleteSignature(id: string): Promise<void> {
  const res = await fetch(`/api/settings/signatures/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete signature");
}

// ======================== Letter Numbering ========================

export function generateLetterNumber(type: Letter["type"]): string {
  const year = new Date().getFullYear();
  const seq = Date.now().toString().slice(-4);
  const prefix = type === "outgoing" ? "ص" : type === "incoming" ? "و" : "د";
  return `${prefix}-${year}-${seq}`;
}
