import { createFileRoute, redirect } from "@tanstack/react-router";

// Módulo Stories desativado no MVP — redireciona para Notícias
export const Route = createFileRoute("/_store/stories")({
  loader: async () => {
    throw redirect({ to: "/noticias" });
  },
  component: () => null,
});
