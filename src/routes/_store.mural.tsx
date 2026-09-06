import { createFileRoute, redirect } from "@tanstack/react-router";

// Módulo Mural desativado no MVP — redireciona para Notícias
export const Route = createFileRoute("/_store/mural")({
  loader: async () => {
    throw redirect({ to: "/noticias" });
  },
  component: () => null,
});
