import { createFileRoute, Outlet } from "@tanstack/react-router";
import { getUserSession } from "@/services/auth.functions";

export const Route = createFileRoute("/_store/conta")({
  loader: async () => {
    try {
      const session = await getUserSession().catch(() => null);
      return { session: session || null };
    } catch {
      return { session: null };
    }
  },
  component: AccountLayout,
});

function AccountLayout() {
  return <Outlet />;
}

export default AccountLayout;
