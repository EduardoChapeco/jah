import { createFileRoute, Outlet, isRedirect, redirect, Link } from "@tanstack/react-router";
import { getUserSession } from "@/services/auth.functions";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { Button } from "@/components/ui/button";
import { Store, AlertTriangle, ArrowLeft, RefreshCw, LogIn } from "lucide-react";

export const Route = createFileRoute("/workspace")({
  loader: async ({ location }) => {
    let session: any = null;
    try {
      session = await getUserSession();
    } catch (e) {
      console.warn("[workspace layout] Erro ao carregar sessão:", e);
      session = null;
    }

    if (!session || !session.user) {
      throw redirect({
        to: "/entrar",
        search: { returnUrl: location.pathname + (location.searchStr || "") },
      });
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
      <div className="max-w-md w-full bg-card  p-6 rounded-3xl  space-y-4">
        <div className="size-14 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
          <AlertTriangle className="size-7" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-foreground">Ajustando Workspace</h2>
          <p className="text-xs text-muted-foreground">
            Ocorreu uma instabilidade momentânea ao carregar os dados deste espaço de trabalho.
          </p>
        </div>
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
            <Link to="/">
              <ArrowLeft className="size-3.5" />
              <span>Voltar ao Início</span>
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

  return (
    <WorkspaceShell session={session}>
      <Outlet />
    </WorkspaceShell>
  );
}
