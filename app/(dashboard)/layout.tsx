import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Sidebar from "@/components/layout/sidebar";
import { MobileHeader } from "@/components/layout/mobile-header";
import { SidebarProvider } from "@/components/layout/sidebar-context";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/auth/signin");

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-[#0f0f11]">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <MobileHeader />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
