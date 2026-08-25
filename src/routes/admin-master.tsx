import { createFileRoute, Outlet, redirect, Link, isRedirect } from "@tanstack/react-router";
import { getProfile, getUserSession } from "@/services/auth.functions";
import {
  Shield,
  Home,
  DollarSign,
  Store,
  AlertTriangle,
  Users,
  UserCheck,
  Scale,
  Layers,
  Palette,
  Plug,
  Sparkles,
  ArrowLeft,
  ExternalLink,
  Crown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

function AdminMasterLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border/60 bg-muted/20 flex flex-col hidden md:flex shrink-0">
        <div className="p-5 border-b border-border/40 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary">
            <Shield className="size-6 text-primary" />
            <div>
              <span className="font-black text-lg tracking-tighter uppercase block leading-none">Wider Master</span>
              <span className="text-[9px] font-mono font-bold text-muted-foreground uppercase">Gestão Global</span>
            </div>
          </div>
          <Badge variant="outline" className="text-[9px] font-mono font-bold bg-amber-500/10 text-amber-600 border-amber-500/30">
            ROOT
          </Badge>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <Link
            to="/admin-master"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold hover:bg-muted/60 [&.active]:bg-primary [&.active]:text-primary-foreground transition-all cursor-pointer"
          >
            <Home className="size-4 shrink-0" /> Dashboard Global
          </Link>
          <Link
            to="/admin-master/banners"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold hover:bg-muted/60 [&.active]:bg-primary [&.active]:text-primary-foreground transition-all cursor-pointer"
          >
            <Layers className="size-4 shrink-0" /> Banners & Vitrines
          </Link>
          <Link
            to="/admin-master/marca"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold hover:bg-muted/60 [&.active]:bg-primary [&.active]:text-primary-foreground transition-all cursor-pointer"
          >
            <Palette className="size-4 shrink-0" /> Identidade da Marca & Logo
          </Link>
          <Link
            to="/admin-master/hubs"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold hover:bg-muted/60 [&.active]:bg-primary [&.active]:text-primary-foreground transition-all cursor-pointer"
          >
            <Layers className="size-4 shrink-0" /> Hubs & Categorias Globais
          </Link>
          <Link
            to="/admin-master/botoes"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold hover:bg-muted/60 [&.active]:bg-primary [&.active]:text-primary-foreground transition-all cursor-pointer"
          >
            <Sparkles className="size-4 shrink-0" /> Botões & Hotpages Globais
          </Link>
          <Link
            to="/admin-master/denuncias"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold hover:bg-muted/60 [&.active]:bg-primary [&.active]:text-primary-foreground transition-all cursor-pointer"
          >
            <AlertTriangle className="size-4 shrink-0" /> Trust & Denúncias
          </Link>
          <Link
            to="/admin-master/usuarios"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold hover:bg-muted/60 [&.active]:bg-primary [&.active]:text-primary-foreground transition-all cursor-pointer"
          >
            <Users className="size-4 shrink-0" /> Usuários & Sanções
          </Link>
          <Link
            to="/admin-master/kyc"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold hover:bg-muted/60 [&.active]:bg-primary [&.active]:text-primary-foreground transition-all cursor-pointer"
          >
            <UserCheck className="size-4 shrink-0" /> Verificação Facial / KYC
          </Link>
          <Link
            to="/admin-master/lojas"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold hover:bg-muted/60 [&.active]:bg-primary [&.active]:text-primary-foreground transition-all cursor-pointer"
          >
            <Store className="size-4 shrink-0" /> Todas as Lojas (Olho de Deus)
          </Link>
          <Link
            to="/admin-master/faturas"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold hover:bg-muted/60 [&.active]:bg-primary [&.active]:text-primary-foreground transition-all cursor-pointer"
          >
            <DollarSign className="size-4 shrink-0" /> Faturamento & Planos
          </Link>
          <Link
            to="/admin-master/termos"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold hover:bg-muted/60 [&.active]:bg-primary [&.active]:text-primary-foreground transition-all cursor-pointer"
          >
            <Scale className="size-4 shrink-0" /> Termos & Compliance LGPD
          </Link>
          <Link
            to="/admin-master/integracoes"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold hover:bg-muted/60 [&.active]:bg-primary [&.active]:text-primary-foreground transition-all cursor-pointer"
          >
            <Plug className="size-4 shrink-0" /> API & Integrações
          </Link>
        </nav>

        <div className="p-3 border-t border-border/40 space-y-1.5">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="w-full justify-between h-9 px-3 text-xs font-bold rounded-xl bg-card cursor-pointer"
          >
            <Link to="/workspace">
              <div className="flex items-center gap-2">
                <Store className="size-3.5 text-primary" />
                <span>Ir para o Workspace</span>
              </div>
              <ArrowLeft className="size-3 text-muted-foreground rotate-180" />
            </Link>
          </Button>

          <Button
            asChild
            variant="ghost"
            size="sm"
            className="w-full justify-between h-9 px-3 text-xs font-semibold rounded-xl text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <Link to="/">
              <div className="flex items-center gap-2">
                <ExternalLink className="size-3.5" />
                <span>Ver Vitrine Pública</span>
              </div>
            </Link>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border/40 bg-background/90 backdrop-blur-md px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 text-primary md:hidden">
              <Shield className="size-5" />
              <span className="font-black text-sm">WIDER MASTER</span>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <Crown className="size-4 text-amber-500" />
              <span className="text-xs font-bold text-foreground">
                Painel Administrativo Supremo da Plataforma
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              asChild
              size="sm"
              variant="outline"
              className="h-8 rounded-xl text-xs font-bold gap-1.5 bg-card hover:bg-muted cursor-pointer"
            >
              <Link to="/workspace">
                <Store className="size-3.5 text-primary" />
                <span>Workspace Matriz</span>
              </Link>
            </Button>
            <Button
              asChild
              size="sm"
              variant="ghost"
              className="h-8 rounded-xl text-xs font-bold gap-1 cursor-pointer hidden sm:inline-flex"
            >
              <Link to="/" target="_blank" rel="noopener noreferrer">
                <span>Super App</span>
                <ExternalLink className="size-3 text-muted-foreground ml-0.5" />
              </Link>
            </Button>
          </div>
        </header>

        <div className="p-6 md:p-8 flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
