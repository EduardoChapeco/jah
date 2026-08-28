import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/assinatura/$token")({
  loader: async ({ params }) => {
    throw redirect({
      to: "/assinar/$token",
      params: { token: params.token },
    });
  },
  component: () => null,
});
