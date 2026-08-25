import { type ReactNode, useRef } from "react";
import { useLocation } from "@tanstack/react-router";
import { resolveContextNavigation } from "@/lib/navigation-registry";
import { TopBar } from "./top-bar";
import { ContextSidebar } from "./context-sidebar";
import { MobileNav } from "./mobile-nav";
import { CartSheet } from "@/components/commerce/cart-sheet";
import { InterestPickerModal } from "@/components/onboarding/interest-picker-modal";

export interface AppShellProps {
  children: ReactNode;
  session?: any;
  brandSettings?: {
    logo_url?: string | null;
    favicon_url?: string | null;
    show_logo?: boolean;
    show_name?: boolean;
    platform_name?: string;
  } | null;
}

export function AppShell({ children, session, brandSettings }: AppShellProps) {
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);

  // Check if current page is full-screen standalone auth page
  const isAuthPage =
    location.pathname.startsWith("/entrar") ||
    location.pathname.startsWith("/cadastro") ||
    location.pathname.startsWith("/recuperar-senha");

  if (isAuthPage) {
    return (
      <div className="min-h-screen w-full bg-background text-foreground flex flex-col overflow-x-hidden">
        {children}
      </div>
    );
  }

  const contextConfig = resolveContextNavigation(location.pathname, session);
  const isFullBleedPage =
    location.pathname.startsWith("/mapa") ||
    location.pathname.startsWith("/mobilidade");

  const isProfilePage =
    location.pathname.startsWith("/membro/") ||
    location.pathname.startsWith("/conta/perfil");

  // Em páginas imersivas de mapa, o mapa ocupa 100dvh sem header/footer interferindo
  if (isFullBleedPage) {
    return (
      <div className="h-[100dvh] w-full max-w-full bg-background text-foreground font-sans antialiased relative overflow-hidden flex flex-col">
        <main ref={mainRef} className="flex-1 size-full relative overflow-hidden p-0 m-0">
          {children}
        </main>
        <CartSheet />
      </div>
    );
  }

  return (
    <div className="h-screen w-full max-w-full bg-background text-foreground selection:bg-primary selection:text-primary-foreground font-sans antialiased relative flex flex-col overflow-hidden">
      {/* ── Barra de Topo Horizontal (Invariável no Desktop, Ocultada no Mobile em Perfil Imersivo) ── */}
      <div className={isProfilePage ? "hidden sm:block" : ""}>
        <TopBar
          session={session}
          brandSettings={brandSettings}
        />
      </div>

      {/* ── Corpo Principal com Scrolls Independentes (Sidebar fixa + Main independente) ── */}
      <div className="flex-1 flex min-w-0 w-full max-w-full relative overflow-hidden">
        {/* Coluna Contextual Fixa com Scroll Próprio (Desktop apenas) */}
        {contextConfig.showContextSidebar !== false && (
          <ContextSidebar config={contextConfig} session={session} />
        )}

        {/* Viewport Central com Container Padrão */}
        <main
          ref={mainRef}
          className="flex-1 flex flex-col min-w-0 h-full w-full max-w-full overflow-y-auto overflow-x-hidden px-4 sm:px-6 lg:px-8 py-4 sm:py-6 pb-20 md:pb-6"
        >
          <div className="w-full max-w-7xl mx-auto flex flex-col items-stretch min-w-0 flex-1">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation com Botão Criar Flutuante & Action Sheet */}
      <MobileNav session={session} />

      {/* Global Cart Slide-over */}
      <CartSheet />

      {/* Onboarding de Interesses da Comunidade */}
      <InterestPickerModal />
    </div>
  );
}
