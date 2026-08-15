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

    // Apenas membros com role de staff podem acessar o workspace B2B.
    // Role de 'customer' — mesmo que haja um workspace_member — não concede acesso.
    // Referência: INCIDENT-IDENTITY-001 — todo signup criava workspace_member
    // com role='customer' na store padrão. Isso foi corrigido no trigger,
    // mas o guard também precisa ser explícito e seguro.

    const STAFF_ROLES = [
      "owner",
      "admin",
      "manager",
      "seller",
      "finance",
      "content",
      "support",
      "stock",
    ];

    if (session.role === "customer" || !session.role || !STAFF_ROLES.includes(session.role)) {
      // Bloqueio rigoroso: se o contexto ativo não é de staff, ele não pode renderizar
      // o WorkspaceShell. O usuário deve trocar o tenant na área "/conta" antes de acessar.
      throw redirect({
        to: "/criar-negocio",
        search: {
          error: "unauthorized",
        },
      });
    }

    return { session: { ...session, hasMemberships: true, hasStaffMembership: true } };
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
