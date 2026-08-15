import { type ReactNode } from "react";
import { useLocation } from "@tanstack/react-router";
import { resolveContextNavigation } from "@/lib/navigation-registry";
import { TopBar } from "./top-bar";
import { ContextSidebar } from "./context-sidebar";
import { UtilityCluster } from "./utility-cluster";
import { MobileNav } from "./mobile-nav";
import { CartSheet } from "@/components/commerce/cart-sheet";
import { InterestPickerModal } from "@/components/onboarding/interest-picker-modal";

export interface AppShellProps {
  children: ReactNode;
  session?: any;
}

export function AppShell({ children, session }: AppShellProps) {
  const location = useLocation();

  // Check if current page is full-screen standalone auth page
  const isAuthPage =
    location.pathname.startsWith("/entrar") ||
    location.pathname.startsWith("/cadastro") ||
    location.pathname.startsWith("/recuperar-senha");

  if (isAuthPage) {
    return (
      <div className="min-h-screen w-full bg-background text-foreground flex flex-col">
        {children}
      </div>
    );
  }

  const contextConfig = resolveContextNavigation(location.pathname, session);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground font-sans antialiased relative flex flex-col">
      {/* ── Barra de Topo Horizontal (Jah | Localização | Categorias | Utility) ── */}
      <TopBar />

      {/* ── Utility Cluster (Busca, Carrinho, Perfil) ── */}
      <UtilityCluster session={session} />

      {/* ── Corpo Principal: Coluna Contextual à Esquerda + Conteúdo Centralizado ── */}
      <div className="flex-1 flex min-w-0 w-full relative">
        {/* Coluna Contextual Fixa à Esquerda */}
        <ContextSidebar config={contextConfig} />

        {/* Viewport Central com Largura Ampliada no Desktop */}
        <main className="flex-1 flex flex-col min-w-0 px-3 sm:px-6 md:px-8 py-4 sm:py-6 w-full pb-24 md:pb-12 overflow-x-hidden">
          <div className="w-full max-w-7xl 2xl:max-w-[1440px] mx-auto flex-1 flex flex-col items-stretch">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav session={session} />

      {/* Global Cart Slide-over */}
      <CartSheet />

      {/* Onboarding de Interesses da Comunidade */}
      <InterestPickerModal />
    </div>
  );
}
