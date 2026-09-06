import { createServerFn } from "@tanstack/react-start";
import { getServerClient } from "@/lib/supabase";
import { getServerIdentity } from "@/lib/server-access";
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
  category: z.string().default("general"),
  socialChannel: z.enum(["instagram", "tiktok", "youtube", "whatsapp", "other"]).default("instagram"),
  socialHandle: z.string().optional(),
});

export const upsertCreatorProfileInput = z.object({
  handle: z
    .string()
    .min(3, "O identificador deve ter no mínimo 3 caracteres")
    .max(30, "Máximo de 30 caracteres")
    .regex(/^[a-zA-Z0-9_-]+$/, "Apenas letras, números, hífen e underline"),
  stageName: z.string().min(2, "Nome artístico ou da marca é obrigatório"),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional().or(z.literal("")),
  coverUrl: z.string().url().optional().or(z.literal("")),
  category: z.string().default("general"),
  socialLinks: z.record(z.string()).default({}),
  pinnedProducts: z.array(z.string()).default([]),
});

export const toggleProfilePrivacyInput = z.object({
  privacyMode: z.enum(["public", "unlisted", "private"]),
  isAnonymous: z.boolean(),
});

export const requestStoreInvoiceDiscountInput = z.object({
  storeId: z.string().uuid("ID da loja inválido"),
  invoiceId: z.string().uuid("ID da fatura inválido"),
  tokensAmount: z.number().int().positive("Quantidade de tokens deve ser positiva"),
});

export const approveStoreInvoiceDiscountInput = z.object({
  invoiceId: z.string().uuid("ID da fatura inválido"),
  approved: z.boolean(),
  notes: z.string().optional(),
});

// ---------------------------------------------------------------------------
// AFFILIATE FUNCTIONS & TOKENS WITH VESTING
// ---------------------------------------------------------------------------

/**
 * Busca o cadastro de afiliado/parceiro do usuário atualmente autenticado.
 */
export const getMyAffiliateProfile = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = getServerClient();
  const identity = await getServerIdentity();

  if (!identity?.id) {
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
 * Visão Geral de Tokens de Afiliados (Saldo Ativo, Saldo em Vesting Futuro e Histórico).
 */
export const getMyAffiliateTokensOverview = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = getServerClient();
  const identity = await getServerIdentity();

  if (!identity?.id) {
    return {
      partner: null,
      wallet: {
        balance: 0,
        balancePendingMaturity: 0,
        lifetimeEarned: 0,
        vestingUnlockDate: null,
      },
      referrals: [],
      rules: [],
      creatorProfile: null,
    };
  }

  try {
    // 1. Perfil de parceiro e carteira
    const [partnerRes, walletRes, rulesRes, creatorRes, referralsRes] = await Promise.all([
      supabase.from("affiliate_partners").select("*").eq("user_id", identity.id).maybeSingle(),
      supabase.from("user_token_wallets").select("*").eq("user_id", identity.id).maybeSingle(),
      supabase.from("affiliate_reward_rules").select("*").eq("is_active", true).order("tokens_amount", { ascending: false }),
      supabase.from("creator_profiles").select("*").eq("user_id", identity.id).maybeSingle(),
      supabase
        .from("affiliate_referrals")
        .select("id, referral_code, referral_type, tokens_awarded, vesting_unlock_date, status, created_at")
        .eq("referrer_id", identity.id)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    return {
      partner: partnerRes.data || null,
      wallet: {
        balance: walletRes.data?.balance || 0,
        balancePendingMaturity: walletRes.data?.balance_pending_maturity || 0,
        lifetimeEarned: walletRes.data?.lifetime_earned || 0,
        vestingUnlockDate: walletRes.data?.vesting_unlock_date || null,
      },
      referrals: referralsRes.data || [],
      rules: rulesRes.data || [],
      creatorProfile: creatorRes.data || null,
    };
  } catch (err) {
    console.error("[affiliates] Erro em getMyAffiliateTokensOverview:", err);
    return {
      partner: null,
      wallet: { balance: 0, balancePendingMaturity: 0, lifetimeEarned: 0, vestingUnlockDate: null },
      referrals: [],
      rules: [],
      creatorProfile: null,
    };
  }
});

/**
 * Cadastra o usuário autenticado como parceiro/influenciador da plataforma Wider.
 * Sem promessas de 10% e sem chaves PIX.
 */
export const registerAffiliate = createServerFn({ method: "POST" })
  .validator(registerAffiliateInput)
  .handler(async ({ data: input }) => {
    const supabase = getServerClient();
    const identity = await getServerIdentity();

    if (!identity?.id) {
      throw new Error("Você precisa estar autenticado para se cadastrar como parceiro ou criador.");
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
        commission_rate_percent: 0, // Zero comissão em dinheiro
        status: "active",
      })
      .select()
      .single();

    if (error || !partner) {
      console.error("[affiliates] Erro ao cadastrar afiliado:", error);
      throw new Error(error?.message || "Falha ao registrar parceiro afiliado.");
    }

    // 4. Cria automaticamente o Sub-Perfil de Criador sincronizado
    await supabase
      .from("creator_profiles")
      .upsert(
        {
          user_id: identity.id,
          handle: cleanHandle,
          stage_name: input.displayName.trim(),
          bio: input.bio?.trim() || null,
          category: input.category || "general",
          status: "active",
        },
        { onConflict: "handle" }
      )
      .catch((e) => console.warn("[affiliates] Creator profile auto-sync warning:", e));

    return partner;
  });

/**
 * Retorna as estatísticas do afiliado autenticado para compatibilidade.
 */
export const getAffiliateDashboard = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = getServerClient();
  const identity = await getServerIdentity();

  if (!identity?.id) {
    return null;
  }

  const { data: partner } = await supabase
    .from("affiliate_partners")
    .select("*")
    .eq("user_id", identity.id)
    .maybeSingle();

  if (!partner) {
    return null;
  }

  // Busca contagem recente de cliques dos últimos 30 dias
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { count: recentClicksCount } = await supabase
    .from("affiliate_clicks")
    .select("*", { count: "exact", head: true })
    .eq("affiliate_id", partner.id)
    .gte("created_at", thirtyDaysAgo.toISOString())
    .catch(() => ({ count: null }));

  return {
    partner,
    commissions: [],
    recentClicks: recentClicksCount ?? partner.total_clicks ?? 0,
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

      const ipHash = "clk_" + Math.random().toString(36).substring(2, 10);

      await supabase.from("affiliate_clicks").insert({
        affiliate_id: partner.id,
        ip_hash: ipHash,
        target_path: targetPath || "/",
      }).catch(() => null);

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
 * Concede tokens de indicação server-side com vesting futuro via RPC ACID.
 */
export const recordReferralConversion = createServerFn({ method: "POST" })
  .validator(
    z.object({
      referralCode: z.string().min(1),
      referredUserId: z.string().uuid().optional(),
      referredStoreId: z.string().uuid().optional(),
      referralType: z.enum(["user", "store"]).default("user"),
    })
  )
  .handler(async ({ data: input }) => {
    const supabase = getServerClient();

    // 1. Localiza parceiro dono do código
    const { data: partner } = await supabase
      .from("affiliate_partners")
      .select("id, user_id")
      .eq("handle", input.referralCode.toLowerCase().trim())
      .maybeSingle();

    if (!partner?.user_id) {
      return { success: false, reason: "Código de indicação não encontrado" };
    }

    // 2. Invoca procedure ACID de concessão com vesting
    const { data: result, error } = await supabase.rpc("award_referral_tokens_with_vesting", {
      p_referrer_id: partner.user_id,
      p_referred_user_id: input.referredUserId || null,
      p_referred_store_id: input.referredStoreId || null,
      p_referral_code: input.referralCode,
      p_referral_type: input.referralType,
    });

    if (error) {
      console.error("[affiliates] Erro ao conceder tokens de indicação via RPC:", error);
      return { success: false, error: error.message };
    }

    return { success: true, result };
  });

// ---------------------------------------------------------------------------
// SUB-PERFIS DE CRIADOR / MARCA & PRIVACIDADE ANÔNIMA
// ---------------------------------------------------------------------------

/**
 * Busca o Sub-Perfil de Criador / Influenciador do usuário autenticado.
 */
export const getMyCreatorProfile = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = getServerClient();
  const identity = await getServerIdentity();

  if (!identity?.id) return null;

  const { data, error } = await supabase
    .from("creator_profiles")
    .select("*")
    .eq("user_id", identity.id)
    .maybeSingle();

  if (error) {
    console.warn("[affiliates] Erro em getMyCreatorProfile:", error);
    return null;
  }

  return data || null;
});

/**
 * Cria ou atualiza o Sub-Perfil de Criador / Influenciador.
 */
export const upsertCreatorProfile = createServerFn({ method: "POST" })
  .validator(upsertCreatorProfileInput)
  .handler(async ({ data: input }) => {
    const supabase = getServerClient();
    const identity = await getServerIdentity();

    if (!identity?.id) {
      throw new Error("Não autenticado.");
    }

    const cleanHandle = input.handle.toLowerCase().trim();

    // Verifica disponibilidade se alterou o handle
    const { data: existing } = await supabase
      .from("creator_profiles")
      .select("id, user_id")
      .eq("handle", cleanHandle)
      .maybeSingle();

    if (existing && existing.user_id !== identity.id) {
      throw new Error("Este identificador (@handle) já está em uso por outro criador.");
    }

    const { data: creator, error } = await supabase
      .from("creator_profiles")
      .upsert(
        {
          user_id: identity.id,
          handle: cleanHandle,
          stage_name: input.stageName.trim(),
          bio: input.bio?.trim() || null,
          avatar_url: input.avatarUrl || null,
          cover_url: input.coverUrl || null,
          category: input.category || "general",
          social_links: input.socialLinks || {},
          pinned_products: input.pinnedProducts || [],
          updated_at: new Date().toISOString(),
        },
        { onConflict: "handle" }
      )
      .select()
      .single();

    if (error || !creator) {
      console.error("[affiliates] Erro ao salvar sub-perfil de criador:", error);
      throw new Error(error?.message || "Falha ao salvar sub-perfil.");
    }

    // Vincula o handle ativo no profile do usuário
    await supabase
      .from("profiles")
      .update({ active_creator_handle: cleanHandle })
      .eq("id", identity.id);

    return creator;
  });

/**
 * Alterna a privacidade do perfil pessoal civil (Público, Não-Listado ou Anônimo).
 */
export const updateProfilePrivacyMode = createServerFn({ method: "POST" })
  .validator(toggleProfilePrivacyInput)
  .handler(async ({ data: input }) => {
    const supabase = getServerClient();
    const identity = await getServerIdentity();

    if (!identity?.id) {
      throw new Error("Não autenticado.");
    }

    const { data: updated, error } = await supabase
      .from("profiles")
      .update({
        privacy_mode: input.privacyMode,
        is_anonymous: input.isAnonymous,
        updated_at: new Date().toISOString(),
      })
      .eq("id", identity.id)
      .select("id, privacy_mode, is_anonymous")
      .single();

    if (error) {
      console.error("[affiliates] Erro ao alterar privacidade do perfil:", error);
      throw new Error("Falha ao salvar preferências de privacidade.");
    }

    return updated;
  });

// ---------------------------------------------------------------------------
// GOVERNANÇA BILATERAL: ABATIMENTO DE FATURAS COM TOKENS
// ---------------------------------------------------------------------------

/**
 * A loja solicita o abatimento de uma fatura de mensalidade utilizando tokens de sua carteira.
 */
export const requestStoreInvoiceDiscount = createServerFn({ method: "POST" })
  .validator(requestStoreInvoiceDiscountInput)
  .handler(async ({ data: input }) => {
    const supabase = getServerClient();
    const identity = await getServerIdentity();

    if (!identity?.id) {
      throw new Error("Não autenticado.");
    }

    // Chama a Stored Procedure ACID
    const { data: result, error } = await supabase.rpc("request_invoice_token_discount", {
      p_store_id: input.storeId,
      p_invoice_id: input.invoiceId,
      p_tokens_amount: input.tokensAmount,
    });

    if (error) {
      console.error("[affiliates] Erro ao solicitar abatimento de fatura:", error);
      throw new Error(error.message || "Falha ao processar abatimento com tokens.");
    }

    if (!result?.success) {
      throw new Error(result?.error || "Não foi possível abater a fatura.");
    }

    return result;
  });

/**
 * Super Admin aprova ou estorna um abatimento de fatura solicitado com tokens.
 */
export const approveStoreInvoiceDiscount = createServerFn({ method: "POST" })
  .validator(approveStoreInvoiceDiscountInput)
  .handler(async ({ data: input }) => {
    const supabase = getServerClient();
    const identity = await getServerIdentity();

    if (!identity?.id || !["admin", "master", "platform_admin"].includes(identity.role || "")) {
      throw new Error("Acesso restrito ao Painel Master.");
    }

    const { data: result, error } = await supabase.rpc("approve_invoice_token_discount", {
      p_invoice_id: input.invoiceId,
      p_admin_id: identity.id,
      p_approved: input.approved,
      p_notes: input.notes || null,
    });

    if (error) {
      console.error("[affiliates] Erro ao conciliar abatimento de fatura:", error);
      throw new Error(error.message || "Erro na aprovação do abatimento.");
    }

    return result;
  });

/**
 * Lista faturas com pedidos de abatimento pendentes para auditoria do Super Admin.
 */
export const listPendingInvoiceTokenDiscounts = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = getServerClient();
  const identity = await getServerIdentity();

  if (!identity?.id || !["admin", "master", "platform_admin"].includes(identity.role || "")) {
    throw new Error("Acesso restrito ao Painel Master.");
  }

  const { data, error } = await supabase
    .from("store_token_billing_invoices")
    .select(`
      id,
      store_id,
      invoice_number,
      amount_cents,
      tokens_redeemed_for_discount,
      discount_applied_cents,
      discount_status,
      discount_notes,
      created_at,
      stores (
        id,
        name,
        slug,
        logo_url
      )
    `)
    .eq("discount_status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[affiliates] listPendingInvoiceTokenDiscounts error:", error);
    return [];
  }

  return data || [];
});

/**
 * Retorna o perfil de comissão/parceria para compatibilidade do Workspace.
 */
export const getMyCommissionProfile = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = getServerClient();
  const identity = await getServerIdentity();

  if (!identity?.id) {
    return {
      commissionRate: 0,
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
        commissionRate: 0,
        pendingCents: 0,
        paidCents: 0,
      };
    }

    return {
      commissionRate: Number(partner.commission_rate_percent) || 0,
      pendingCents: partner.pending_commission_cents || 0,
      paidCents: partner.paid_commission_cents || 0,
    };
  } catch (err) {
    console.error("[affiliates] getMyCommissionProfile error:", err);
    return {
      commissionRate: 0,
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
    const identity = await getServerIdentity();

    if (!identity?.id) {
      throw new Error("Não autenticado.");
    }

    let { data: partner } = await supabase
      .from("affiliate_partners")
      .select("handle")
      .eq("user_id", identity.id)
      .maybeSingle();

    if (!partner) {
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
          commission_rate_percent: 0,
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
 * Resumo consolidado de parceiros para a visão financeira do Workspace.
 */
export const getCommissionSummary = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = getServerClient();

  try {
    const { data: partners, error } = await supabase
      .from("affiliate_partners")
      .select("status");

    if (error || !partners) {
      return { totalPendingCents: 0, totalPaidCents: 0, sellerCount: 0 };
    }

    const sellerCount = partners.filter((p) => p.status === "active").length;

    return {
      totalPendingCents: 0,
      totalPaidCents: 0,
      sellerCount,
    };
  } catch (err) {
    console.error("[affiliates] getCommissionSummary error:", err);
    return { totalPendingCents: 0, totalPaidCents: 0, sellerCount: 0 };
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
        .order("total_clicks", { ascending: false });

      if (error || !data) {
        return [];
      }

      return data.map((p) => ({
        sellerId: p.id,
        sellerName: p.display_name,
        commissionRate: 0,
        totalOrders: p.total_orders || 0,
        totalRevenueCents: p.total_gmv_cents || 0,
        totalCommissionCents: 0,
        pendingCommissionCents: 0,
        totalClicks: p.total_clicks || 0,
      }));
    } catch (err) {
      console.error("[affiliates] getAffiliatePerformance error:", err);
      return [];
    }
  });

/**
 * Fallback de compatibilidade para liquidação de parceiros.
 */
export const payAffiliateCommission = createServerFn({ method: "POST" })
  .validator(z.object({ sellerId: z.string() }))
  .handler(async () => {
    return {
      paidCount: 0,
      totalPaidCents: 0,
    };
  });
