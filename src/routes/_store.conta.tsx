import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getUserSession } from "@/services/auth.functions";

export const Route = createFileRoute("/_store/conta")({
  beforeLoad: async () => {
    const session = await getUserSession().catch(() => null);
    return { session };
  },
  component: AccountLayout,
});

function AccountLayout() {
  return <Outlet />;
}
