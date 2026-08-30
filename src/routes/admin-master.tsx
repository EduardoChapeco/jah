import { createFileRoute, Outlet, redirect, Link, isRedirect } from "@tanstack/react-router";
import { getProfile, getUserSession } from "@/services/auth.functions";
import {
  Shield,
  ShieldAlert,
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
  Server,
  Eye,
  Coins,
  Sliders,
  Globe,
  Cpu,
  FlaskConical,
  Layout,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export const Route = createFileRoute("/admin-master")({
  beforeLoad: async () => {
    try {
      const session = await getUserSession();
      const role = session?.role || session?.user?.user_metadata?.role;
      if (role !== "platform_admin" && role !== "master") {
        throw redirect({ to: "/entrar", search: { returnUrl: "/admin-master" } });
      }
    } catch (e: any) {
      if (e?.isRedirect || e?.$$typeof) throw e;
      throw redirect({ to: "/entrar", search: { returnUrl: "/admin-master" } });
    }
  },
  component: AdminMasterLayout,
});

const NAV_SECTIONS = [
  {
    title: "Governança & Motor",
    items: [
      { to: "/admin-master", label: "Dashboard Global", icon: LayoutDashboard, exact: true },
      { to: "/admin-master/algoritmo", label: "Motor Algorítmico", icon: Sliders },
      { to: "/admin-master/curadoria", label: "Curadoria & Auditoria", icon: Eye },
      { to: "/admin-master/hubs", label: "Hubs & Cidades", icon: Globe },
    ],
  },
  {
    title: "Vitrines & Marketing",
    items: [
      { to: "/admin-master/vitrines", label: "Vitrines & Seções (CMS)", icon: Layout },
      { to: "/admin-master/banners", label: "Banners & Vitrines", icon: ImageIcon },
      { to: "/admin-master/botoes", label: "Hotpages & Capas 16:9", icon: Sparkles },
      { to: "/admin-master/marca", label: "Identidade & Marca", icon: Palette },
      { to: "/admin-master/tokens", label: "Economia de Tokens", icon: Coins },
    ],
  },
  {
    title: "Operação & Ecossistema",
    items: [
      { to: "/admin-master/lojas", label: "Lojas & Empresas", icon: Store },
      { to: "/admin-master/usuarios", label: "Usuários & Perfis", icon: Users },
      { to: "/admin-master/logistica", label: "Logística & MotoLink", icon: Truck },
      { to: "/admin-master/mining", label: "Mineração & Scrapers", icon: Cpu },
      { to: "/admin-master/simlabs", label: "SimLabs & Cenários", icon: FlaskConical },
    ],
  },
  {
    title: "Segurança & Compliance",
    items: [
      { to: "/admin-master/seguranca", label: "Segurança & Forense", icon: ShieldAlert },
      { to: "/admin-master/kyc", label: "Verificação KYC", icon: UserCheck },
      { to: "/admin-master/denuncias", label: "Denúncias & Moderação", icon: AlertTriangle },
      { to: "/admin-master/logs", label: "Logs de Sistema", icon: Server },
      { to: "/admin-master/faturas", label: "Faturas & Planos", icon: DollarSign },
      { to: "/admin-master/termos", label: "Termos & LGPD", icon: Scale },
      { to: "/admin-master/integracoes", label: "API & Conectores", icon: Plug },
    ],
  },
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
        <nav className="flex-1 p-3 space-y-4 overflow-y-auto min-h-0">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title} className="space-y-1">
              <span className="px-3 text-[10px] font-mono font-bold tracking-wider uppercase text-muted-foreground/70 block">
                {section.title}
              </span>
              <div className="space-y-0.5 pt-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      activeOptions={{ exact: (item as any).exact }}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 [&.active]:bg-primary [&.active]:text-primary-foreground transition-colors cursor-pointer"
                    >
                      <Icon className="size-4 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
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
                <ExternalLink className="size-3.5 text-muted-foreground" />
                <span>Abrir Vitrine Pública</span>
              </span>
            </Link>
          </Button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setIsMobileOpen(false)}
          />
          <aside className="relative w-72 max-w-[80vw] bg-background border-r border-border h-full flex flex-col z-10">
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
            <nav className="flex-1 p-3 space-y-4 overflow-y-auto min-h-0">
              {NAV_SECTIONS.map((section) => (
                <div key={section.title} className="space-y-1">
                  <span className="px-3 text-[10px] font-mono font-bold tracking-wider uppercase text-muted-foreground/70 block">
                    {section.title}
                  </span>
                  <div className="space-y-0.5 pt-0.5">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.to}
                          to={item.to}
                          activeOptions={{ exact: (item as any).exact }}
                          onClick={() => setIsMobileOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 [&.active]:bg-primary [&.active]:text-primary-foreground transition-colors cursor-pointer"
                        >
                          <Icon className="size-4 shrink-0" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
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
