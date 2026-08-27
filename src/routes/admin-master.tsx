import { createFileRoute, Outlet, redirect, Link, isRedirect } from "@tanstack/react-router";
import { getProfile, getUserSession } from "@/services/auth.functions";
import {
  Shield,
  LayoutDashboard,
  DollarSign,
  Store,
  AlertTriangle,
  Users,
  UserCheck,
  Scale,
  Image as ImageIcon,
  Palette,
  Plug,
  Sparkles,
  ArrowUpRight,
  ExternalLink,
  Menu,
  X,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export const Route = createFileRoute("/admin-master")({
  beforeLoad: async () => {
    try {
      const [profile, session] = await Promise.all([
        getProfile().catch(() => null),
        getUserSession().catch(() => null),
      ]);

      if (!profile && !session) {
        throw redirect({ to: "/entrar" });
      }

      const userEmail = (session?.email || session?.user?.email || profile?.email || "").toLowerCase();
      const MASTER_EMAILS = [
        "excelenciatour.smo@gmail.com",
        "eusoueduoficial@gmail.com",
        "admin@wider.com.br",
      ];

      const isPlatformAdmin =
        profile?.role === "platform_admin" ||
        session?.role === "platform_admin" ||
        (session as any)?.user?.role === "platform_admin" ||
        session?.user?.user_metadata?.role === "platform_admin" ||
        MASTER_EMAILS.includes(userEmail);

      if (!isPlatformAdmin) {
        throw redirect({ to: "/workspace" });
      }
    } catch (e) {
      if (isRedirect(e)) {
        throw e;
      }
      throw redirect({ to: "/entrar" });
    }
  },
  component: AdminMasterLayout,
});

const NAV_ITEMS = [
  { to: "/admin-master", label: "Dashboard Global", icon: LayoutDashboard },
  { to: "/admin-master/banners", label: "Banners & Vitrines", icon: ImageIcon },
  { to: "/admin-master/marca", label: "Identidade & Marca", icon: Palette },
  { to: "/admin-master/logistica", label: "Logística & MotoLink", icon: Truck },
  { to: "/admin-master/botoes", label: "Botões & Hotpages", icon: Sparkles },
  { to: "/admin-master/lojas", label: "Lojas & Empresas", icon: Store },
  { to: "/admin-master/usuarios", label: "Usuários & Perfis", icon: Users },
  { to: "/admin-master/kyc", label: "Verificação KYC", icon: UserCheck },
  { to: "/admin-master/denuncias", label: "Denúncias & Moderação", icon: AlertTriangle },
  { to: "/admin-master/faturas", label: "Faturas & Planos", icon: DollarSign },
  { to: "/admin-master/termos", label: "Termos & LGPD", icon: Scale },
  { to: "/admin-master/integracoes", label: "API & Conectores", icon: Plug },
];

function AdminMasterLayout() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="h-screen w-screen overflow-hidden bg-background text-foreground flex">
      {/* Desktop Fixed Sidebar */}
      <aside className="w-64 border-r border-border/50 bg-card/40 backdrop-blur-sm flex-col hidden md:flex shrink-0 h-full">
        {/* Header */}
        <div className="h-14 px-5 border-b border-border/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Shield className="size-4.5" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight block leading-tight">Wider Master</span>
              <span className="text-[10px] text-muted-foreground font-medium">Administração Global</span>
            </div>
          </div>
          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border/40">
            ROOT
          </span>
        </div>

        {/* Navigation with Independent Internal Scroll */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto min-h-0">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 [&.active]:bg-primary [&.active]:text-primary-foreground transition-colors cursor-pointer"
              >
                <Icon className="size-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer Quick Links */}
        <div className="p-3 border-t border-border/40 space-y-1 shrink-0 bg-background/50">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="w-full justify-between h-8 px-3 text-xs font-medium rounded-xl bg-card border-border/60 cursor-pointer"
          >
            <Link to="/workspace">
              <span className="flex items-center gap-2">
                <Store className="size-3.5 text-primary" />
                <span>Ir ao Workspace</span>
              </span>
              <ArrowUpRight className="size-3 text-muted-foreground" />
            </Link>
          </Button>

          <Button
            asChild
            variant="ghost"
            size="sm"
            className="w-full justify-between h-8 px-3 text-xs font-medium rounded-xl text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <Link to="/" target="_blank" rel="noopener noreferrer">
              <span className="flex items-center gap-2">
                <ExternalLink className="size-3.5" />
                <span>Ver Vitrine Pública</span>
              </span>
            </Link>
          </Button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setIsMobileOpen(false)}
          />
          <aside className="relative w-72 max-w-[80vw] bg-background border-r border-border h-full flex flex-col z-10 shadow-2xl">
            <div className="h-14 px-4 border-b border-border/40 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 text-primary font-bold text-sm">
                <Shield className="size-5" />
                <span>Wider Master</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="size-8 p-0"
                onClick={() => setIsMobileOpen(false)}
              >
                <X className="size-4" />
              </Button>
            </div>
            <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto min-h-0">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setIsMobileOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 [&.active]:bg-primary [&.active]:text-primary-foreground transition-colors cursor-pointer"
                  >
                    <Icon className="size-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header */}
        <header className="h-14 border-b border-border/40 bg-background/80 backdrop-blur-md px-4 md:px-8 flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="size-8 p-0 md:hidden"
              onClick={() => setIsMobileOpen(true)}
            >
              <Menu className="size-4" />
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground hidden sm:inline">Plataforma</span>
              <span className="text-xs text-muted-foreground/60 hidden sm:inline">/</span>
              <span className="text-xs font-bold text-foreground">Gestão Master</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              asChild
              size="sm"
              variant="outline"
              className="h-8 rounded-xl text-xs font-medium gap-1.5 bg-card hover:bg-muted border-border/60 cursor-pointer"
            >
              <Link to="/workspace">
                <Store className="size-3.5 text-primary" />
                <span className="hidden sm:inline">Workspace</span>
              </Link>
            </Button>
            <Button
              asChild
              size="sm"
              variant="ghost"
              className="h-8 rounded-xl text-xs font-medium gap-1 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <Link to="/" target="_blank" rel="noopener noreferrer">
                <span>Vitrine</span>
                <ExternalLink className="size-3 ml-0.5" />
              </Link>
            </Button>
          </div>
        </header>

        {/* Content Container with Independent Internal Scroll */}
        <main className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-6 md:p-8 bg-background">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
