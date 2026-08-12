import { type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Package,
  Tags,
  Store,
  LayoutDashboard,
  LogOut,
  Settings,
  Menu,
  Calendar,
  Users,
  Briefcase,
  ShoppingBag,
  UserCircle,
  Truck,
  Boxes,
  MapPin,
  Banknote,
  FileText,
  LayoutTemplate,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/services/auth.functions";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Logo } from "@/components/commerce/logo";

const WORKSPACE_NAV = [
  { path: "/workspace", label: "Dashboard", icon: LayoutDashboard },
  { path: "/workspace/pdv", label: "Frente de Caixa", icon: Store },
  { path: "/workspace/pedidos", label: "Pedidos", icon: ShoppingBag },
  { path: "/workspace/pedidos/trocas", label: "Trocas", icon: ShoppingBag },
  { path: "/workspace/pedidos/frota", label: "Frota", icon: Truck },
  { path: "/workspace/clientes", label: "Clientes", icon: UserCircle },
  { path: "/workspace/agenda", label: "Agenda", icon: Calendar },
  { path: "/workspace/agenda/recursos", label: "Recursos", icon: Users },
  { path: "/workspace/agenda/servicos", label: "Serviços", icon: Briefcase },
  { path: "/workspace/catalogo/produtos", label: "Produtos", icon: Package },
  { path: "/workspace/catalogo/categorias", label: "Categorias", icon: Tags },
  { path: "/workspace/catalogo/colecoes", label: "Coleções", icon: Package },
  { path: "/workspace/estoque", label: "Estoque", icon: Boxes },
  { path: "/workspace/financeiro/caixa", label: "Caixa", icon: Banknote },
  { path: "/workspace/mural/novo", label: "Novo Post", icon: LayoutDashboard },
  { path: "/workspace/cms/paginas", label: "Páginas", icon: FileText },
  { path: "/workspace/cms/navegacao", label: "Navegação", icon: LayoutTemplate },
  { path: "/workspace/configuracoes/fretes", label: "Fretes", icon: MapPin },
  { path: "/workspace/configuracoes/loja", label: "Configurações", icon: Settings },
];

export function WorkspaceShell({ session, children }: { session: any; children: ReactNode }) {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/";
  };

  const NavLinks = () => (
    <div className="space-y-1">
      {WORKSPACE_NAV.map((item) => {
        const isActive = currentPath === item.path || currentPath.startsWith(`${item.path}/`);
        const Icon = item.icon;

        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </div>
  );

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[240px_1fr] bg-muted/20">
      {/* Sidebar Desktop */}
      <div className="hidden md:flex flex-col gap-2 border-r border-border bg-card">
        <div className="flex h-14 items-center border-b border-border px-4 lg:h-[60px] lg:px-6">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <Store className="size-6 text-primary" />
            <span className="tracking-tight">Workspace</span>
          </Link>
        </div>

        <ScrollArea className="flex-1 px-4 py-4">
          <nav className="grid items-start gap-2">
            <NavLinks />
          </nav>
        </ScrollArea>

        <div className="mt-auto p-4 border-t border-border">
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground"
            onClick={handleLogout}
          >
            <LogOut className="size-4 mr-2" />
            Sair
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col">
        {/* Header Mobile */}
        <header className="flex h-14 md:hidden items-center gap-4 border-b border-border bg-card px-4 lg:h-[60px] lg:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                <Menu className="size-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col w-[280px]">
              <div className="flex h-14 items-center border-b px-4 mb-4">
                <Link to="/" className="flex items-center gap-2 font-semibold">
                  <Store className="size-5 text-primary" />
                  <span className="tracking-tight">Workspace</span>
                </Link>
              </div>
              <nav className="grid gap-2">
                <NavLinks />
              </nav>
              <div className="mt-auto">
                <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
                  <LogOut className="size-4 mr-2" />
                  Sair
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          <div className="flex-1 flex justify-end">
            {/* Pode-se colocar avatar do usuário logado aqui */}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
