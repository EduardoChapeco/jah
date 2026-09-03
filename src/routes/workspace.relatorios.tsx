import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/workspace/relatorios")({
  component: () => <Outlet />,
});
