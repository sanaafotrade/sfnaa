import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
});

import prisma from '@/lib/prisma';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await prisma.letterTemplateSettings.findUnique({
    where: { id: 'default' }
  }).catch(() => null);

  return {
    title: "سفانة نجد للتجارة | Safana Najd Trading",
    description: "شركة محلية ودولية متخصصة في استيراد وتصدير المواد الخام وتوريد البلاستيك للمصانع. | Local and international trade company specializing in importing and exporting raw materials.",
    icons: {
      icon: settings?.companyLogoUrl || '/favicon.ico',
    }
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} antialiased scroll-smooth`}>
      <body className="min-h-screen flex flex-col font-sans">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
