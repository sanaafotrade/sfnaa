export async function getCurrentUserName(lang: string = "ar"): Promise<string> {
  try {
    const res = await fetch("/api/profile");
    if (res.ok) {
      const data = await res.json();
      if (data.name) return data.name;
    }
  } catch (e) {}
  return lang === "en" ? "Admin" : "مدير النظام";
}
