import { createServerFn } from "@tanstack/react-start";
import { setCookie } from "@tanstack/react-start/server";
import { z } from "zod";
import { getServerIdentity } from "@/lib/server-access";

export const getIdentityHandler = createServerFn({ method: "GET" }).handler(async () => {
  return await getServerIdentity();
});

export const setTenantContextHandler = createServerFn({ method: "POST" })
  .validator(z.object({ store_id: z.string().uuid().nullable() }))
  .handler(async ({ data: { store_id } }) => {
    const identity = await getServerIdentity();

    if (!identity.id) {
      throw new Error("Não autenticado");
    }

    if (store_id === null) {
      // Retorna para o perfil pessoal (limpa o cookie)
      setCookie("jah_active_tenant", "", {
        path: "/",
        maxAge: 0,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });
      return { success: true, store_id: null };
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

export const createBusinessProfileHandler = createServerFn({ method: "POST" })
  .validator(
    z.object({
      name: z.string().min(2, "O nome deve ter no mínimo 2 caracteres"),
      type: z.enum(["event_producer", "band", "creator", "ecommerce", "physical_store"]),
      document: z.string().optional(),
    })
  )
  .handler(async ({ data: { name, type, document } }) => {
    const identity = await getServerIdentity();

    if (!identity.id) {
      throw new Error("Não autenticado");
    }

    // Dynamic import to avoid client-side bundling of the service_role client
    const { getServerClient } = await import("@/lib/supabase");
    const adminDb = getServerClient();

    // 1. Criar Organização
    const { data: org, error: orgError } = await adminDb
      .from("organizations")
      .insert({
        name,
        cnpj: document || null,
        status: "active",
      })
      .select("id")
      .single();

    if (orgError) {
      console.error("[createBusinessProfile] Erro ao criar organization", orgError);
      throw new Error("Não foi possível criar o coletivo (Organização).");
    }

    // 2. Criar Store (Loja/Coletivo)
    const { data: store, error: storeError } = await adminDb
      .from("stores")
      .insert({
        organization_id: org.id,
        name,
        type,
        settings_snapshot: {},
      })
      .select("id")
      .single();

    if (storeError) {
      console.error("[createBusinessProfile] Erro ao criar store", storeError);
      throw new Error("Não foi possível criar o perfil do coletivo.");
    }

    // 3. Vincular o usuário como dono (owner)
    const { error: memberError } = await adminDb
      .from("store_members")
      .insert({
        store_id: store.id,
        profile_id: identity.id,
        role: "owner",
      });

    if (memberError) {
      console.error("[createBusinessProfile] Erro ao vincular owner", memberError);
      throw new Error("Não foi possível vincular seu perfil de usuário ao novo negócio.");
    }

    // 4. Seta o tenant ativo
    setCookie("jah_active_tenant", store.id, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return { success: true, store_id: store.id };
  });
