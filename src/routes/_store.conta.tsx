import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getUserSession } from "@/services/auth.functions";

export const Route = createFileRoute("/_store/conta")({
  beforeLoad: async ({ location }) => {
    let session: any = null;
    try {
      session = await getUserSession();
    } catch {
      session = null;
    }

    if (!session?.user) {
      throw redirect({
        to: "/entrar",
        search: { returnUrl: location.pathname + location.searchStr },
      });
    }

    return { session };
  },
  loader: async ({ location }) => {
    let session: any = null;
    try {
      session = await getUserSession();
    } catch {
      session = null;
    }

    if (!session?.user) {
      throw redirect({
        to: "/entrar",
        search: { returnUrl: location.pathname + location.searchStr },
      });
    }

    return { session };
  },
  component: AccountLayout,
});

function AccountLayout() {
  return <Outlet />;
}
