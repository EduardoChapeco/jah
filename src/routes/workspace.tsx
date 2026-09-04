import { createFileRoute, Outlet, isRedirect, redirect, Link, useRouterState } from "@tanstack/react-router";
import { getUserSession } from "@/services/auth.functions";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { Button } from "@/components/ui/button";
import { Store, AlertTriangle, ArrowLeft, RefreshCw, LogIn } from "lucide-react";

export const Route = createFileRoute("/workspace")({
  beforeLoad: async () => {
    let session: any = null;
    try {
      session = await getUserSession();
    } catch (e) {
      console.warn("[workspace layout] Erro ao carregar sessão:", e);
      session = null;
    }

    if (!session?.user) {
      throw redirect({ to: "/entrar", search: { returnUrl: "/workspace" } });
    }

    const isPlatformAdmin =
      session?.role === "platform_admin" ||
      session?.role === "master" ||
      session?.role === "superadmin" ||
      session?.user?.role === "platform_admin";

    const hasStore = (session?.memberships && session.memberships.length > 0) || isPlatformAdmin;

    // 🚨 REGRA INVIOLÁVEL: O Workspace exige um negócio cadastrado.
    // Quem não possui loja/empresa não pode ver o workspace nem ferramentas operacionais.
    // É redirecionado imediatamente para o cadastro do seu negócio.
    if (!hasStore) {
      throw redirect({ to: "/criar-negocio" });
    }

    return { session };
  },
  loader: async () => {
    let session: any = null;
    try {
      session = await getUserSession();
    } catch (e) {
      console.warn("[workspace layout] Erro ao carregar sessão:", e);
      session = null;
    }

    if (!session?.user) {
      throw redirect({ to: "/entrar", search: { returnUrl: "/workspace" } });
    }

    const isPlatformAdmin =
      session?.role === "platform_admin" ||
      session?.role === "master" ||
      session?.role === "superadmin" ||
      session?.user?.role === "platform_admin";

    const hasStore = (session?.memberships && session.memberships.length > 0) || isPlatformAdmin;

    if (!hasStore) {
      throw redirect({ to: "/criar-negocio" });
    }

    return { session };
  },
  component: WorkspaceLayout,
  errorComponent: WorkspaceErrorComponent,
});

function WorkspaceErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  if (isRedirect(error)) {
    throw error;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 text-center">
      <div className="max-w-md w-full bg-card p-6 sm:p-8 rounded-2xl border border-border/80 space-y-4 shadow-sm">
        <div className="size-14 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
          <AlertTriangle className="size-7" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-foreground">Ajustando Workspace</h2>
          <p className="text-xs text-muted-foreground">
            Ocorreu uma instabilidade momentânea ao carregar os dados deste espaço de trabalho.
          </p>
        </div>

        {error?.message && (
          <div className="p-3 bg-muted/40 rounded-2xl border border-border/60 text-left text-[11px] font-mono text-muted-foreground space-y-1 max-h-32 overflow-y-auto no-scrollbar">
            <span className="font-bold text-destructive block">Diagnóstico de Falha:</span>
            <span className="break-all">{error.message}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
          <Button
            onClick={() => {
              if (typeof window !== "undefined") window.location.reload();
              reset();
            }}
            className="w-full sm:w-auto rounded-xl text-xs font-bold gap-1.5"
          >
            <RefreshCw className="size-3.5" />
            <span>Recarregar Painel</span>
          </Button>
          <Button asChild variant="outline" className="w-full sm:w-auto rounded-xl text-xs font-bold gap-1.5">
            <Link to="/workspace">
              <ArrowLeft className="size-3.5" />
              <span>Painel Geral</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function WorkspaceLayout() {
  const loaderData = Route.useLoaderData() as any;
  const session = loaderData?.session;
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;
  const isBuilder = pathname.startsWith("/workspace/builder/");
  const isStudio = pathname.startsWith("/workspace/estudio");
  const isProposalStudio =
    pathname.startsWith("/workspace/turismo/propostas/") &&
    pathname !== "/workspace/turismo/propostas";

  // Fullscreen Immersion Mode para o Construtor Visual (Wix/Framer), Estúdio e Studio de Propostas (Canva/Figma)
  if (isBuilder || isStudio || isProposalStudio) {
    return <Outlet />;
  }

  const isPlatformAdmin =
    session?.role === "platform_admin" ||
    session?.role === "master" ||
    session?.role === "superadmin" ||
    session?.user?.role === "platform_admin";

  const hasStore = (session?.memberships && session.memberships.length > 0) || isPlatformAdmin;

  if (!hasStore) {
    return null;
  }

  return (
    <WorkspaceShell session={session}>
      <Outlet />
    </WorkspaceShell>
  );
}
