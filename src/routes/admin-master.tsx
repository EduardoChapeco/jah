import { createFileRoute, Outlet, redirect, Link } from "@tanstack/react-router";
import { getProfile } from "@/services/auth.functions";
import { Shield, Home, DollarSign, Store } from "lucide-react";

export const Route = createFileRoute("/admin-master")({
  beforeLoad: async () => {
    try {
      const profile = await getProfile();
      // Ensure only system level platform_admin can access this
      if (profile.role !== "platform_admin") {
        throw redirect({ to: "/workspace" });
      }
    } catch {
      throw redirect({ to: "/entrar" });
    }
  },
  component: AdminMasterLayout,
});

function AdminMasterLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-muted/20 flex flex-col hidden md:flex">
        <div className="p-6 border-b flex items-center gap-2 text-primary">
          <Shield className="size-6" />
          <span className="font-black text-xl tracking-tighter uppercase">Jah Master</span>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link
            to="/admin-master"
            className="flex items-center gap-3 p-3 rounded-md text-sm font-semibold hover:bg-muted/50 [&.active]:bg-primary [&.active]:text-primary-foreground transition-colors"
          >
            <Home className="size-4" /> Dashboard Global
          </Link>
          <Link
            to="/admin-master/lojas"
            className="flex items-center gap-3 p-3 rounded-md text-sm font-semibold hover:bg-muted/50 [&.active]:bg-primary [&.active]:text-primary-foreground transition-colors"
          >
            <Store className="size-4" /> Todas as Lojas
          </Link>
          <Link
            to="/admin-master/faturas"
            className="flex items-center gap-3 p-3 rounded-md text-sm font-semibold hover:bg-muted/50 [&.active]:bg-primary [&.active]:text-primary-foreground transition-colors"
          >
            <DollarSign className="size-4" /> Faturamentos
          </Link>
        </nav>
        <div className="p-4 border-t"></div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <div className="md:hidden p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary">
            <Shield className="size-5" />
            <span className="font-black">JAH MASTER</span>
          </div>
        </div>
        <div className="p-6 md:p-8 flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
