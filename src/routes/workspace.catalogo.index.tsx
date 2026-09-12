import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/workspace/catalogo/")({
  beforeLoad: () => {
    throw redirect({ to: "/workspace/catalogo/produtos" });
  },
  component: () => null,
});
