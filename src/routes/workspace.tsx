import { createFileRoute, Outlet, isRedirect, redirect, Link } from "@tanstack/react-router";
import { getUserSession } from "@/services/auth.functions";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { Button } from "@/components/ui/button";
import { Store, AlertTriangle, ArrowLeft, RefreshCw, LogIn } from "lucide-react";

export const Route = createFileRoute("/workspace")({
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
  const hasStore = session?.memberships && session.memberships.length > 0;

  return (
    <WorkspaceShell session={session}>
      {hasStore ? (
        <Outlet />
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center max-w-sm mx-auto">
          <div className="size-12 rounded-2xl bg-muted/60 text-foreground flex items-center justify-center mb-3 border border-border/60">
            <Store size={22} className="text-primary" />
          </div>
          <h2 className="text-base font-bold text-foreground mb-1">
            Nenhum negócio ativo
          </h2>
          <p className="text-xs text-muted-foreground mb-5 leading-relaxed">
            Cadastre seu ponto de venda ou loja para gerenciar cardápios, pedidos e estoque.
          </p>
          <Button asChild className="rounded-xl font-bold text-xs h-10 px-6">
            <Link to="/criar-negocio">Cadastrar Ponto Comercial</Link>
          </Button>
        </div>
      )}
    </WorkspaceShell>
  );
}
