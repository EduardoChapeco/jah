import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/workspace/turismo/propostas/novo")({
  loader: () => {
    throw redirect({
      to: "/workspace/turismo/propostas",
      search: { new: true },
    });
  },
  component: () => null,
});
