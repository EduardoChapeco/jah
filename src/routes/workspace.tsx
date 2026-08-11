import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getUserSession } from "@/services/auth.functions";
import { getIdentity } from "@/services/identity.functions";
import { toast } from "sonner";
import { useEffect } from "react";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";

export const Route = createFileRoute("/workspace")({
  beforeLoad: async ({ location }) => {
    const session = await getUserSession();
    if (!session) {
      throw redirect({
        to: "/entrar",
        search: { returnUrl: location.pathname },
      });
    }

    // Apenas donos, gerentes ou staff podem acessar o workspace B2B.
    // Se o role é "customer", verificamos se o usuário tem memberships (negócios)
    // mas está sem contexto de loja ativo — nesse caso redireciona para criar negócio,
    // não para /conta (que é o destino para clientes sem nenhum negócio).
    if (session.role === "customer" || !session.role) {
      // Verificar se o usuário tem memberships de negócio (é produtor mas sem contexto ativo)
      let hasMemberships = false;
      try {
        const identity = await getIdentity();
        hasMemberships = !!(identity?.memberships && identity.memberships.length > 0);
      } catch {
        /* ignored */
      }

      if (hasMemberships) {
        // Produtor sem contexto de loja ativo: redireciona para página inicial do workspace
        // onde poderá selecionar o contexto correto via menu
        // (O shell irá exibir o seletor de negócio)
        // Permitir acesso mas com role indicando que está sem contexto
        return { session: { ...session, hasMemberships: true } };
      }

      // Cliente puro sem nenhum negócio: redireciona para /conta
      throw redirect({
        to: "/conta",
      });
    }

    return { session: { ...session, hasMemberships: true } };
  },
  component: WorkspaceLayout,
});

function WorkspaceLayout() {
  const { session } = Route.useRouteContext();
  const search: any = Route.useSearch();
  const navigate = Route.useNavigate();

  useEffect(() => {
    if (search.error === "unauthorized") {
      toast.error("Acesso Negado ao Módulo.");
      navigate({ to: "/workspace", replace: true });
    }
  }, [search.error, navigate]);

  return (
    <WorkspaceShell session={session}>
      <Outlet />
    </WorkspaceShell>
  );
}
