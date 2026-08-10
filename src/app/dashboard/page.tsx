import prisma from "@/lib/prisma";
import OverviewCards from "./OverviewCards";

export const dynamic = 'force-dynamic';

export default async function DashboardOverview() {
  try {
    const [totalServices, totalPartners, newMessages, sentMessages] = await Promise.all([
      prisma.service.count(),
      prisma.partner.count(),
      prisma.emailRecord.count({ where: { status: "inbox", isRead: false } }),
      prisma.emailRecord.count({ where: { status: "sent" } })
    ]);

    return (
      <OverviewCards 
        stats={{ totalServices, totalPartners, newMessages, sentMessages }} 
      />
    );
  } catch (error: any) {
    return (
      <div className="p-8 text-red-500">
        <h1>Dashboard Error</h1>
        <pre>{error?.message || String(error)}</pre>
        <pre>{error?.stack}</pre>
      </div>
    );
  }
}
