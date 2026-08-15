import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getUserSession } from "@/services/auth.functions";

export const Route = createFileRoute("/_store/conta")({
  beforeLoad: async ({ location }) => {
    const session = await getUserSession();
    if (!session) {
      throw redirect({
        to: "/entrar",
        search: { returnUrl: location.pathname + (location.searchStr || "") },
      });
    }
    return { session };
  },
  component: AccountLayout,
});

function AccountLayout() {
  return <Outlet />;
}
