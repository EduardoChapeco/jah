import { createServerFn } from "@tanstack/react-start";
import { setCookie } from "@tanstack/react-start/server";
import { z } from "zod";
import { getServerIdentity } from "@/lib/server-access";

export const setTenantContextHandler = createServerFn({ method: "POST" })
  .validator(z.object({ store_id: z.string().uuid() }))
  .handler(async ({ data: { store_id } }) => {
    const identity = await getServerIdentity();

    if (!identity.id) {
      throw new Error("Não autenticado");
    }

    // Verifica se o usuário tem membership no store_id solicitado
    const hasAccess = identity.memberships.some((m) => m.store_id === store_id);

    if (!hasAccess) {
      throw new Error("Acesso negado: Você não pertence a este workspace.");
    }

    // Set cookie para manter o tenant ativo
    // Path / garante que funciona em toda a aplicação
    // maxAge: 30 dias (em segundos)
    setCookie("jah_active_tenant", store_id, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return { success: true, store_id };
  });
