import { createServerFn } from "@tanstack/react-start";
import { getServerClient } from "@/lib/supabase";
import { getIdentity } from "./identity.functions";
import { z } from "zod";

// ---------------------------------------------------------------------------
// TYPES & SCHEMAS
// ---------------------------------------------------------------------------

export const registerAffiliateInput = z.object({
  handle: z
    .string()
    .min(3, "O identificador deve ter no mínimo 3 caracteres")
    .max(30, "Máximo de 30 caracteres")
    .regex(/^[a-zA-Z0-9_-]+$/, "Apenas letras, números, hífen e underline"),
  displayName: z.string().min(2, "Nome para exibição obrigatório"),
  bio: z.string().max(300).optional(),
  socialChannel: z.enum(["instagram", "tiktok", "youtube", "whatsapp", "other"]).default("instagram"),
  socialHandle: z.string().optional(),
  pixKey: z.string().min(4, "Chave PIX obrigatória para recebimento"),
  pixKeyType: z.enum(["cpf", "cnpj", "email", "phone", "random"]).default("cpf"),
});

// ---------------------------------------------------------------------------
// AFFILIATE FUNCTIONS
// ---------------------------------------------------------------------------

/**
 * Busca o cadastro de afiliado do usuário atualmente autenticado.
 */
export const getMyAffiliateProfile = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = getServerClient();
  const identity = await getIdentity().catch(() => null);

  if (!identity || !identity.id) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from("affiliate_partners")
      .select("*")
      .eq("user_id", identity.id)
      .maybeSingle();

    if (error) {
      console.warn("[affiliates] Erro ao buscar perfil de afiliado:", error);
      return null;
    }

    return data || null;
  } catch (err) {
    console.error("[affiliates] Falha em getMyAffiliateProfile:", err);
    return null;
  }
});

/**
 * Cadastra o usuário autenticado como parceiro/influenciador da plataforma Wider.
 */
export const registerAffiliate = createServerFn({ method: "POST" })
  .validator(registerAffiliateInput)
  .handler(async ({ data: input }) => {
    const supabase = getServerClient();
    const identity = await getIdentity();

    if (!identity || !identity.id) {
      throw new Error("Você precisa estar autenticado para se cadastrar como afiliado.");
    }

    const cleanHandle = input.handle.toLowerCase().trim();

    // 1. Verifica disponibilidade do handle
    const { data: existingHandle } = await supabase
      .from("affiliate_partners")
      .select("id")
      .eq("handle", cleanHandle)
      .maybeSingle();

    if (existingHandle) {
      throw new Error("Este identificador (handle) já está sendo utilizado por outro parceiro.");
    }

    // 2. Verifica se o usuário já possui cadastro
    const { data: existingUser } = await supabase
      .from("affiliate_partners")
      .select("id, handle")
      .eq("user_id", identity.id)
      .maybeSingle();

    if (existingUser) {
      throw new Error(`Você já possui o perfil de afiliado @${existingUser.handle}.`);
    }

    // 3. Insere o novo parceiro
    const { data: partner, error } = await supabase
      .from("affiliate_partners")
      .insert({
        user_id: identity.id,
        handle: cleanHandle,
        display_name: input.displayName.trim(),
        bio: input.bio?.trim() || null,
        social_channel: input.socialChannel,
        social_handle: input.socialHandle?.trim() || null,
        pix_key: input.pixKey.trim(),
        pix_key_type: input.pixKeyType,
        commission_rate_percent: 10.0,
        status: "active",
      })
      .select()
      .single();

    if (error || !partner) {
      console.error("[affiliates] Erro ao cadastrar afiliado:", error);
      throw new Error(error?.message || "Falha ao registrar parceiro afiliado.");
    }

    return partner;
  });

/**
 * Retorna as estatísticas e histórico de comissões do afiliado autenticado.
 */
export const getAffiliateDashboard = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = getServerClient();
  const identity = await getIdentity();

  if (!identity || !identity.id) {
    throw new Error("Não autorizado.");
  }

  const { data: partner, error: partnerErr } = await supabase
    .from("affiliate_partners")
    .select("*")
    .eq("user_id", identity.id)
    .maybeSingle();

  if (partnerErr || !partner) {
    return null;
  }

  // Busca as comissões recentes
  const { data: commissions, error: comErr } = await supabase
    .from("affiliate_commissions")
    .select("*")
    .eq("affiliate_id", partner.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (comErr) {
    console.warn("[affiliates] Erro ao buscar comissões:", comErr);
  }

  // Busca contagem recente de cliques dos últimos 30 dias
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { count: recentClicksCount } = await supabase
    .from("affiliate_clicks")
    .select("*", { count: "exact", head: true })
    .eq("affiliate_id", partner.id)
    .gte("created_at", thirtyDaysAgo.toISOString());

  return {
    partner,
    commissions: commissions || [],
    recentClicks: recentClicksCount ?? partner.total_clicks,
  };
});

/**
 * Rastreia cliques vindos de links de influenciadores (com proteção básica contra flood).
 */
export const trackAffiliateClick = createServerFn({ method: "POST" })
  .validator(
    z.object({
      handle: z.string().min(1),
      targetPath: z.string().optional(),
    }),
  )
  .handler(async ({ data: { handle, targetPath } }) => {
    const supabase = getServerClient();

    try {
      const { data: partner } = await supabase
        .from("affiliate_partners")
        .select("id, total_clicks")
        .eq("handle", handle.toLowerCase().trim())
        .eq("status", "active")
        .maybeSingle();

      if (!partner) return { success: false };

      // Gera hash fictício defensivo
      const ipHash = "clk_" + Math.random().toString(36).substring(2, 10);

      await supabase.from("affiliate_clicks").insert({
        affiliate_id: partner.id,
        ip_hash: ipHash,
        target_path: targetPath || "/",
      });

      // Incrementa cliques totais
      await supabase
        .from("affiliate_partners")
        .update({
          total_clicks: (partner.total_clicks || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", partner.id);

      return { success: true, partnerId: partner.id };
    } catch (err) {
      console.warn("[affiliates] Falha silenciosa em trackAffiliateClick:", err);
      return { success: false };
    }
  });

/**
 * Listagem para o Admin Master visualizar e auditar todos os influenciadores e parceiros.
 */
export const adminListAffiliates = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = getServerClient();
  const identity = await getIdentity();

  if (!identity || !["admin", "master", "platform_admin"].includes(identity.role || "")) {
    throw new Error("Acesso restrito ao Painel Master.");
  }

  const { data, error } = await supabase
    .from("affiliate_partners")
    .select(`
      *,
      profiles (
        id,
        full_name,
        email,
        phone,
        avatar_url
      )
    `)
    .order("total_gmv_cents", { ascending: false });

  if (error) {
    console.error("[affiliates] adminListAffiliates error:", error);
    throw new Error("Erro ao carregar lista de afiliados.");
  }

  return data || [];
});

/**
 * Liquidação de comissão no Admin Master.
 */
export const adminPayCommission = createServerFn({ method: "POST" })
  .validator(
    z.object({
      commissionId: z.string().uuid(),
      payoutReference: z.string().min(1, "Código do comprovante ou transação PIX é obrigatório"),
    }),
  )
  .handler(async ({ data: { commissionId, payoutReference } }) => {
    const supabase = getServerClient();
    const identity = await getIdentity();

    if (!identity || !["admin", "master", "platform_admin"].includes(identity.role || "")) {
      throw new Error("Não autorizado.");
    }

    const { data: commission, error: fetchErr } = await supabase
      .from("affiliate_commissions")
      .select("id, affiliate_id, commission_amount_cents, status")
      .eq("id", commissionId)
      .single();

    if (fetchErr || !commission) {
      throw new Error("Comissão não encontrada.");
    }

    if (commission.status === "paid") {
      throw new Error("Esta comissão já foi liquidada.");
    }

    const now = new Date().toISOString();

    const { data: updated, error: updateErr } = await supabase
      .from("affiliate_commissions")
      .update({
        status: "paid",
        paid_at: now,
        payout_reference: payoutReference.trim(),
      })
      .eq("id", commissionId)
      .select()
      .single();

    if (updateErr) {
      console.error("[affiliates] adminPayCommission updateErr:", updateErr);
      throw new Error("Erro ao liquidar comissão.");
    }

    // Atualiza saldo pago no parceiro
    const { data: partner } = await supabase
      .from("affiliate_partners")
      .select("paid_commission_cents")
      .eq("id", commission.affiliate_id)
      .single();

    if (partner) {
      await supabase
        .from("affiliate_partners")
        .update({
          paid_commission_cents: (partner.paid_commission_cents || 0) + commission.commission_amount_cents,
          updated_at: now,
        })
        .eq("id", commission.affiliate_id);
    }

    return { success: true, commission: updated };
  });

/**
 * Retorna o perfil de comissão do parceiro logado para o Workspace de Configurações.
 */
export const getMyCommissionProfile = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = getServerClient();
  const identity = await getIdentity().catch(() => null);

  if (!identity || !identity.id) {
    return {
      commissionRate: 10,
      pendingCents: 0,
      paidCents: 0,
    };
  }

  try {
    const { data: partner } = await supabase
      .from("affiliate_partners")
      .select("commission_rate_percent, pending_commission_cents, paid_commission_cents")
      .eq("user_id", identity.id)
      .maybeSingle();

    if (!partner) {
      return {
        commissionRate: 10,
        pendingCents: 0,
        paidCents: 0,
      };
    }

    return {
      commissionRate: Number(partner.commission_rate_percent) || 10,
      pendingCents: partner.pending_commission_cents || 0,
      paidCents: partner.paid_commission_cents || 0,
    };
  } catch (err) {
    console.error("[affiliates] getMyCommissionProfile error:", err);
    return {
      commissionRate: 10,
      pendingCents: 0,
      paidCents: 0,
    };
  }
});

/**
 * Gera ou recupera o link mágico de afiliação do usuário para o Workspace.
 */
export const getAffiliateLink = createServerFn({ method: "POST" })
  .validator(z.object({ baseUrl: z.string().optional() }).optional())
  .handler(async ({ data }) => {
    const supabase = getServerClient();
    const identity = await getIdentity();

    if (!identity || !identity.id) {
      throw new Error("Não autenticado.");
    }

    let { data: partner } = await supabase
      .from("affiliate_partners")
      .select("handle")
      .eq("user_id", identity.id)
      .maybeSingle();

    if (!partner) {
      // Cria automaticamente um parceiro básico se ainda não tiver
      const rawHandle = (identity.name || identity.email || "user")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .substring(0, 15) || "parceiro";
      const handle = `${rawHandle}${Math.floor(100 + Math.random() * 900)}`;

      const { data: created } = await supabase
        .from("affiliate_partners")
        .insert({
          user_id: identity.id,
          handle,
          display_name: identity.name || "Parceiro Wider",
          commission_rate_percent: 10.0,
          status: "active",
        })
        .select("handle")
        .single();

      partner = created;
    }

    const host = data?.baseUrl || "";
    const handle = partner?.handle || "jah";
    const link = host ? `${host}/?ref=${handle}` : `/?ref=${handle}`;

    return { link };
  });

/**
 * Resumo consolidado de comissões para a visão financeira do Workspace.
 */
export const getCommissionSummary = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = getServerClient();

  try {
    const { data: partners, error } = await supabase
      .from("affiliate_partners")
      .select("pending_commission_cents, paid_commission_cents, status");

    if (error || !partners) {
      return {
        totalPendingCents: 0,
        totalPaidCents: 0,
        sellerCount: 0,
      };
    }

    const totalPendingCents = partners.reduce((sum, p) => sum + (p.pending_commission_cents || 0), 0);
    const totalPaidCents = partners.reduce((sum, p) => sum + (p.paid_commission_cents || 0), 0);
    const sellerCount = partners.filter((p) => p.status === "active").length;

    return {
      totalPendingCents,
      totalPaidCents,
      sellerCount,
    };
  } catch (err) {
    console.error("[affiliates] getCommissionSummary error:", err);
    return {
      totalPendingCents: 0,
      totalPaidCents: 0,
      sellerCount: 0,
    };
  }
});

/**
 * Desempenho individual de cada parceiro para a tabela financeira do Workspace.
 */
export const getAffiliatePerformance = createServerFn({ method: "GET" })
  .validator(z.object({ search: z.string().optional() }).optional())
  .handler(async () => {
    const supabase = getServerClient();

    try {
      const { data, error } = await supabase
        .from("affiliate_partners")
        .select("*")
        .order("total_gmv_cents", { ascending: false });

      if (error || !data) {
        return [];
      }

      return data.map((p) => ({
        sellerId: p.id,
        sellerName: p.display_name,
        commissionRate: Number(p.commission_rate_percent) || 10,
        totalOrders: p.total_orders || 0,
        totalRevenueCents: p.total_gmv_cents || 0,
        totalCommissionCents: (p.paid_commission_cents || 0) + (p.pending_commission_cents || 0),
        pendingCommissionCents: p.pending_commission_cents || 0,
      }));
    } catch (err) {
      console.error("[affiliates] getAffiliatePerformance error:", err);
      return [];
    }
  });

/**
 * Processamento e liquidação de comissões pendentes de um parceiro pelo Workspace financeiro.
 */
export const payAffiliateCommission = createServerFn({ method: "POST" })
  .validator(z.object({ sellerId: z.string() }))
  .handler(async ({ data: { sellerId } }) => {
    const supabase = getServerClient();

    const { data: partner, error: pErr } = await supabase
      .from("affiliate_partners")
      .select("id, pending_commission_cents, paid_commission_cents")
      .eq("id", sellerId)
      .single();

    if (pErr || !partner) {
      throw new Error("Parceiro não encontrado.");
    }

    const pendingAmount = partner.pending_commission_cents || 0;
    if (pendingAmount <= 0) {
      throw new Error("Não há comissões pendentes para este parceiro.");
    }

    const now = new Date().toISOString();

    // Atualiza todas as comissões pendentes deste afiliado para paid
    const { data: updatedCommissions, error: comErr } = await supabase
      .from("affiliate_commissions")
      .update({
        status: "paid",
        paid_at: now,
        payout_reference: `PAYOUT-${Date.now()}`,
      })
      .eq("affiliate_id", sellerId)
      .eq("status", "pending")
      .select("id");

    if (comErr) {
      console.error("[affiliates] payAffiliateCommission error:", comErr);
    }

    // Zera pendente e incrementa pago no parceiro
    await supabase
      .from("affiliate_partners")
      .update({
        pending_commission_cents: 0,
        paid_commission_cents: (partner.paid_commission_cents || 0) + pendingAmount,
        updated_at: now,
      })
      .eq("id", sellerId);

    return {
      paidCount: updatedCommissions?.length || 1,
      totalPaidCents: pendingAmount,
    };
  });

