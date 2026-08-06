import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "سفانة نجد للتجارة | Safana Najd Trading",
  description: "شركة محلية ودولية متخصصة في استيراد وتصدير المواد الخام وتوريد البلاستيك للمصانع. | Local and international trade company specializing in importing and exporting raw materials.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${inter.variable} antialiased scroll-smooth`}>
      <body className="min-h-screen flex flex-col font-sans bg-primary text-slate-100">{children}</body>
    </html>
  );
}
