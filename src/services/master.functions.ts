import { createServerFn } from "@tanstack/react-start";
import { getServerClient } from "@/lib/supabase";
import { getServerIdentity } from "@/lib/server-access";
import { z } from "zod";
import crypto from "node:crypto";

/**
 * Validates that the current user is a Platform Admin (Master).
 * Master functions bypass standard tenant isolation for global oversight.
 */
async function requirePlatformAdmin() {
  const identity = await getServerIdentity();
  if (identity.role !== "platform_admin") {
    throw new Error("Acesso negado. Apenas administradores globais master podem realizar esta ação.");
  }
  return identity;
}

// ============================================================
// 1. MÉTRICAS GLOBAIS DA PLATAFORMA
// ============================================================

export const getPlatformMetrics = createServerFn({ method: "GET" }).handler(async () => {
  await requirePlatformAdmin();
  const db = getServerClient();

  const [invoicesRes, storesRes, usersRes, reportsRes, kycRes] = await Promise.all([
    db.from("platform_invoices").select("amount_cents, status"),
    db.from("stores").select("id, is_active", { count: "exact" }),
    db.from("profiles").select("id, role", { count: "exact" }),
    db.from("moderation_reports").select("id, status").eq("status", "pending"),
    db.from("identity_kyc_verifications").select("id, status").eq("status", "pending"),
  ]);

  const invoices = invoicesRes.data || [];
  const totalRevenueCents = invoices
    .filter((i: any) => i.status === "paid")
    .reduce((sum: number, i: any) => sum + i.amount_cents, 0);

  const pendingRevenueCents = invoices
    .filter((i: any) => i.status === "pending" || i.status === "overdue")
    .reduce((sum: number, i: any) => sum + i.amount_cents, 0);

  return {
    totalRevenueCents,
    pendingRevenueCents,
    totalStores: storesRes.count || 0,
    totalUsers: usersRes.count || 0,
    pendingReports: reportsRes.data?.length || 0,
    pendingKyc: kycRes.data?.length || 0,
  };
});

// ============================================================
// 2. GESTÃO DE FATURAS & LOJAS
// ============================================================

export const getPlatformInvoicesList = createServerFn({ method: "GET" }).handler(async () => {
  await requirePlatformAdmin();
  const db = getServerClient();
  const { data, error } = await db
    .from("platform_invoices")
    .select("*, stores(name, slug)")
    .order("created_at", { ascending: false });

  if (error) throw new Error("Erro ao buscar faturas: " + error.message);
  return data || [];
});

export const getPlatformStoresList = createServerFn({ method: "GET" }).handler(async () => {
  await requirePlatformAdmin();
  const db = getServerClient();
  const { data, error } = await db
    .from("stores")
    .select("id, name, slug, is_active, created_at, settings")
    .order("created_at", { ascending: false });

  if (error) throw new Error("Erro ao buscar lojas: " + error.message);
  return data || [];
});

export const toggleStoreStatus = createServerFn({ method: "POST" })
  .validator(z.object({ storeId: z.string().uuid(), isActive: z.boolean(), reason: z.string().optional() }))
  .handler(async ({ data }) => {
    const admin = await requirePlatformAdmin();
    const db = getServerClient();

    const { error } = await db
      .from("stores")
      .update({ is_active: data.isActive })
      .eq("id", data.storeId);

    if (error) throw new Error("Erro ao alterar status da loja: " + error.message);

    // Registra evento no log forense
    await db.from("forensic_audit_events").insert({
      actor_id: admin.id,
      actor_role: "platform_admin",
      target_entity_type: "store",
      target_entity_id: data.storeId,
      action: data.isActive ? "store_reinstated" : "store_suspended",
      payload_snapshot: { reason: data.reason || "Intervenção administrativa master" },
    });

    return { success: true };
  });

export const updateInvoiceStatus = createServerFn({ method: "POST" })
  .validator(
    z.object({
      invoiceId: z.string().uuid(),
      status: z.enum(["pending", "paid", "overdue", "cancelled"]),
    }),
  )
  .handler(async ({ data }) => {
    await requirePlatformAdmin();
    const db = getServerClient();

    const updateData: any = { status: data.status };
    if (data.status === "paid") {
      updateData.paid_at = new Date().toISOString();
    } else {
      updateData.paid_at = null;
    }

    const { error } = await db
      .from("platform_invoices")
      .update(updateData)
      .eq("id", data.invoiceId);

    if (error) throw new Error("Erro ao atualizar status da fatura: " + error.message);
    return { success: true };
  });

export const createPlatformInvoice = createServerFn({ method: "POST" })
  .validator(
    z.object({
      storeId: z.string().uuid(),
      description: z.string().min(1, "Descrição obrigatória"),
      amountCents: z.number().positive("Valor deve ser maior que zero"),
      dueDate: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    await requirePlatformAdmin();
    const db = getServerClient();

    const { error } = await db.from("platform_invoices").insert({
      store_id: data.storeId,
      description: data.description,
      amount_cents: data.amountCents,
      due_date: data.dueDate,
      status: "pending",
    });

    if (error) throw new Error("Erro ao emitir fatura: " + error.message);
    return { success: true };
  });

// ============================================================
// 3. TRUST & SAFETY — MODERAÇÃO GLOBAL DE CONTEÚDO & DENÚNCIAS
// ============================================================

export const listModerationReports = createServerFn({ method: "GET" })
  .validator(
    z
      .object({
        status: z.enum(["all", "pending", "in_review", "resolved_removed", "resolved_dismissed", "resolved_warned"]).optional(),
        entityType: z.string().optional(),
      })
      .optional(),
  )
  .handler(async ({ data: params }) => {
    await requirePlatformAdmin();
    const db = getServerClient();

    let query = db
      .from("moderation_reports")
      .select("*, reporter:profiles!moderation_reports_reporter_profile_id_fkey(id, full_name, role)")
      .order("created_at", { ascending: false });

    if (params?.status && params.status !== "all") {
      query = query.eq("status", params.status);
    }
    if (params?.entityType && params.entityType !== "all") {
      query = query.eq("entity_type", params.entityType);
    }

    const { data, error } = await query;
    if (error) throw new Error("Erro ao buscar denúncias: " + error.message);
    return data || [];
  });

export const resolveModerationReport = createServerFn({ method: "POST" })
  .validator(
    z.object({
      reportId: z.string().uuid(),
      actionTaken: z.enum([
        "content_removed",
        "content_hidden",
        "author_warned",
        "author_banned",
        "dismissed",
      ]),
      moderatorNotes: z.string().min(3, "Justificativa obrigatória"),
    }),
  )
  .handler(async ({ data }) => {
    const admin = await requirePlatformAdmin();
    const db = getServerClient();

    // 1. Busca dados da denúncia
    const { data: report, error: repErr } = await db
      .from("moderation_reports")
      .select("*")
      .eq("id", data.reportId)
      .single();

    if (repErr || !report) throw new Error("Denúncia não encontrada.");

    // 2. Executa a ação sobre o conteúdo alvo
    if (data.actionTaken === "content_removed" || data.actionTaken === "content_hidden") {
      if (report.entity_type === "post") {
        await db.from("posts").update({ status: "archived" }).eq("id", report.entity_id);
      } else if (report.entity_type === "classified") {
        await db.from("classifieds").update({ status: "closed" }).eq("id", report.entity_id);
      } else if (report.entity_type === "product") {
        await db.from("products").update({ status: "archived" }).eq("id", report.entity_id);
      }
    }

    // 3. Atualiza o status da denúncia
    const resolvedStatus =
      data.actionTaken === "dismissed"
        ? "resolved_dismissed"
        : data.actionTaken === "author_warned"
        ? "resolved_warned"
        : "resolved_removed";

    await db
      .from("moderation_reports")
      .update({
        status: resolvedStatus,
        action_taken: data.actionTaken,
        moderator_id: admin.id,
        moderator_notes: data.moderatorNotes,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", data.reportId);

    // 4. Log Forense
    await db.from("forensic_audit_events").insert({
      actor_id: admin.id,
      actor_role: "platform_admin",
      target_entity_type: report.entity_type,
      target_entity_id: report.entity_id,
      action: `moderation_${data.actionTaken}`,
      payload_snapshot: { report_id: data.reportId, notes: data.moderatorNotes },
    });

    return { success: true };
  });

// ============================================================
// 4. GESTÃO DE USUÁRIOS & SANÇÕES DISCIPLINARES GRANULARES
// ============================================================

export const listAllUsers = createServerFn({ method: "GET" })
  .validator(
    z
      .object({
        search: z.string().optional(),
        role: z.string().optional(),
      })
      .optional(),
  )
  .handler(async ({ data: params }) => {
    await requirePlatformAdmin();
    const db = getServerClient();

    let query = db
      .from("profiles")
      .select("*, user_moderation_sanctions(*)")
      .order("created_at", { ascending: false })
      .limit(100);

    if (params?.search && params.search.trim()) {
      const q = `%${params.search.trim()}%`;
      query = query.or(`full_name.ilike.${q},tax_id.ilike.${q}`);
    }
    if (params?.role && params.role !== "all") {
      query = query.eq("role", params.role);
    }

    const { data, error } = await query;
    if (error) throw new Error("Erro ao buscar usuários: " + error.message);
    return data || [];
  });

export const applyUserSanction = createServerFn({ method: "POST" })
  .validator(
    z.object({
      userId: z.string().uuid(),
      sanctionType: z.enum([
        "warning",
        "mute_comments",
        "block_posts",
        "block_classifieds",
        "block_commerce",
        "ban_temporary",
        "ban_permanent",
      ]),
      reason: z.string().min(5, "Motivo obrigatório"),
      moderatorNotes: z.string().optional(),
      durationDays: z.number().int().min(1).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const admin = await requirePlatformAdmin();
    const db = getServerClient();

    const expiresAt = data.durationDays
      ? new Date(Date.now() + data.durationDays * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const { error } = await db.from("user_moderation_sanctions").insert({
      user_id: data.userId,
      sanction_type: data.sanctionType,
      reason: data.reason,
      moderator_notes: data.moderatorNotes || null,
      expires_at: expiresAt,
      is_active: true,
      applied_by: admin.id,
    });

    if (error) throw new Error("Erro ao aplicar sanção: " + error.message);

    // Se banimento permanente, suspende o perfil
    if (data.sanctionType === "ban_permanent") {
      await db.from("profiles").update({ role: "suspended" }).eq("id", data.userId);
    }

    // Log Forense
    await db.from("forensic_audit_events").insert({
      actor_id: admin.id,
      actor_role: "platform_admin",
      target_entity_type: "user",
      target_entity_id: data.userId,
      action: `sanction_${data.sanctionType}`,
      payload_snapshot: { reason: data.reason, duration_days: data.durationDays },
    });

    return { success: true };
  });

export const revokeUserSanction = createServerFn({ method: "POST" })
  .validator(z.object({ sanctionId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const admin = await requirePlatformAdmin();
    const db = getServerClient();

    const { error } = await db
      .from("user_moderation_sanctions")
      .update({ is_active: false })
      .eq("id", data.sanctionId);

    if (error) throw new Error("Erro ao revogar sanção: " + error.message);
    return { success: true };
  });

// ============================================================
// 5. KYC & VERIFICAÇÃO FACIAL / SELO DE AUTENTICIDADE
// ============================================================

export const listKycVerifications = createServerFn({ method: "GET" })
  .validator(
    z
      .object({
        status: z.enum(["all", "pending", "under_review", "approved", "rejected"]).optional(),
      })
      .optional(),
  )
  .handler(async ({ data: params }) => {
    await requirePlatformAdmin();
    const db = getServerClient();

    let query = db
      .from("identity_kyc_verifications")
      .select("*, user:profiles(id, full_name, avatar_url, role)")
      .order("created_at", { ascending: false });

    if (params?.status && params.status !== "all") {
      query = query.eq("status", params.status);
    }

    const { data, error } = await query;
    if (error) throw new Error("Erro ao buscar verificações KYC: " + error.message);
    return data || [];
  });

export const reviewKycVerification = createServerFn({ method: "POST" })
  .validator(
    z.object({
      kycId: z.string().uuid(),
      status: z.enum(["approved", "rejected", "requires_resubmission"]),
      rejectionReason: z.string().optional(),
      internalNotes: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const admin = await requirePlatformAdmin();
    const db = getServerClient();

    const { data: kyc, error: getErr } = await db
      .from("identity_kyc_verifications")
      .select("user_id")
      .eq("id", data.kycId)
      .single();

    if (getErr || !kyc) throw new Error("Registro KYC não encontrado.");

    const { error } = await db
      .from("identity_kyc_verifications")
      .update({
        status: data.status,
        reviewed_by: admin.id,
        rejection_reason: data.rejectionReason || null,
        internal_notes: data.internalNotes || null,
        verified_at: data.status === "approved" ? new Date().toISOString() : null,
      })
      .eq("id", data.kycId);

    if (error) throw new Error("Erro ao revisar KYC: " + error.message);

    // Se aprovado, adiciona selo de verificado no perfil
    if (data.status === "approved") {
      await db.from("profiles").update({ is_verified: true }).eq("id", kyc.user_id);
    }

    return { success: true };
  });

// ============================================================
// 6. DOSSIÊ JUDICIAL & PROVAS 360º DO USUÁRIO
// ============================================================

export const getUser360Dossier = createServerFn({ method: "GET" })
  .validator(z.object({ userId: z.string().uuid() }))
  .handler(async ({ data: { userId } }) => {
    await requirePlatformAdmin();
    const db = getServerClient();

    const [profileRes, ordersRes, ridesRes, appointmentsRes, quotesRes, termsRes, auditRes] =
      await Promise.all([
        db.from("profiles").select("*").eq("id", userId).single(),
        db.from("orders").select("id, public_token, status, total_cents, created_at, shipping_address").eq("customer_id", userId),
        db.from("mobility_requests").select("id, service_type, status, origin_address, destination_address, estimated_price_cents, created_at").eq("customer_id", userId),
        db.from("booking_appointments").select("id, scheduled_at, status, created_at").eq("customer_id", userId),
        db.from("quotations").select("id, code, title, total_cents, status, created_at").eq("customer_id", userId),
        db.from("legal_terms_acceptances").select("*").eq("user_id", userId),
        db.from("forensic_audit_events").select("*").eq("target_entity_id", userId).order("created_at", { ascending: false }).limit(50),
      ]);

    if (!profileRes.data) throw new Error("Perfil não encontrado.");

    const dossierSnapshot = {
      profile: profileRes.data,
      orders: ordersRes.data || [],
      mobility_rides: ridesRes.data || [],
      appointments: appointmentsRes.data || [],
      quotations: quotesRes.data || [],
      terms_acceptances: termsRes.data || [],
      audit_events: auditRes.data || [],
      generated_at: new Date().toISOString(),
    };

    // Gera Hash SHA-256 do Dossiê para Imutabilidade e Validade Jurídica
    const sha256 = crypto
      .createHash("sha256")
      .update(JSON.stringify(dossierSnapshot))
      .digest("hex");

    return {
      dossier: dossierSnapshot,
      sha256_certification: sha256,
    };
  });

// ============================================================
// 7. GESTÃO DE ACESSOS, MAGIC LINK & RESET DE SENHA
// ============================================================

export const adminTriggerPasswordReset = createServerFn({ method: "POST" })
  .validator(z.object({ email: z.string().email() }))
  .handler(async ({ data: { email } }) => {
    await requirePlatformAdmin();
    const db = getServerClient();

    // Dispara magic link via Supabase Auth
    const { error } = await db.auth.resetPasswordForEmail(email, {
      redirectTo: "/recuperar-senha",
    });

    if (error) throw new Error("Erro ao disparar e-mail de recuperação: " + error.message);
    return { success: true, message: `Link de redefinição enviado para ${email}.` };
  });

