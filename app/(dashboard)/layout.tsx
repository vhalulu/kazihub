
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard - KaziHub",
  description: "Manage your tasks and profile on KaziHub",
};

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="dashboard-layout">
      {children}
    </div>
  );
}
