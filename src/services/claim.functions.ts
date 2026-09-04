import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase";
import { getServerIdentity, assertStoreAccess } from "@/lib/server-access";
import type { 
  StoreReputationClaim, 
  StoreReputationMessage, 
  StoreReputationScore 
} from "@/types/wms-workflows-reputation";

export const listStoreClaims = createServerFn({ method: "GET" })
  .validator(
    z.object({
      status: z.enum(["pending_store_response", "replied_by_store", "under_moderation", "resolved", "not_resolved", "cancelled"]).optional(),
      category: z.string().optional(),
    }).optional(),
  )
  .handler(async ({ data }): Promise<StoreReputationClaim[]> => {
    const supabase = getServerClient();
    const identity = await getServerIdentity();
    assertStoreAccess(identity, ["owner", "admin", "manager", "support"]);

    let query = supabase
      .from("store_reputation_claims")
      .select("*, messages:store_reputation_messages(*)")
      .eq("store_id", identity.store_id)
      .order("created_at", { ascending: false });

    if (data?.status) query = query.eq("status", data.status);
    if (data?.category) query = query.eq("category", data.category);

    const { data: claims, error } = await query;
    if (error) throw new Error("Erro ao listar reclamações: " + error.message);
    return (claims || []) as StoreReputationClaim[];
  });

export const getPublicClaimByToken = createServerFn({ method: "GET" })
  .validator(z.object({ publicToken: z.string() }))
  .handler(async ({ data }): Promise<StoreReputationClaim> => {
    const supabase = getServerClient();

    const { data: claim, error } = await supabase
      .from("store_reputation_claims")
      .select(`
        *,
        messages:store_reputation_messages(*)
      `)
      .eq("public_token", data.publicToken)
      .single();

    if (error || !claim) throw new Error("Reclamação não encontrada.");
    return claim as StoreReputationClaim;
  });

export const createPublicClaim = createServerFn({ method: "POST" })
  .validator(
    z.object({
      storeId: z.string().uuid(),
      customerName: z.string().min(2),
      customerEmail: z.string().email(),
      customerPhone: z.string().optional(),
      orderId: z.string().uuid().optional(),
      title: z.string().min(3).max(160),
      description: z.string().min(10),
      category: z.enum(["atendimento", "entrega", "produto_defeituoso", "cobranca_indevida", "cancelamento_estorno", "outro"]),
    }),
  )
  .handler(async ({ data }) => {
    const supabase = getServerClient();
    const publicToken = "CLM-" + Math.random().toString(36).substring(2, 9).toUpperCase();

    const { data: claim, error } = await supabase
      .from("store_reputation_claims")
      .insert({
        store_id: data.storeId,
        customer_name: data.customerName,
        customer_email: data.customerEmail,
        customer_phone: data.customerPhone,
        order_id: data.orderId,
        title: data.title,
        description: data.description,
        category: data.category,
        public_token: publicToken,
        status: "pending_store_response",
        is_public: true,
      })
      .select()
      .single();

    if (error) throw new Error("Erro ao abrir reclamação: " + error.message);

    // Mensagem inicial do cliente
    await supabase.from("store_reputation_messages").insert({
      store_id: data.storeId,
      claim_id: claim.id,
      sender_type: "customer",
      sender_name: data.customerName,
      message: data.description,
    });

    return { status: "success", claim: claim as StoreReputationClaim, publicToken };
  });

export const replyClaim = createServerFn({ method: "POST" })
  .validator(
    z.object({
      claimId: z.string().uuid(),
      message: z.string().min(2),
      isInternalNote: z.boolean().default(false),
      attachments: z.array(z.string()).default([]),
    }),
  )
  .handler(async ({ data }) => {
    const supabase = getServerClient();
    const identity = await getServerIdentity();

    // 1. Inserir Mensagem
    const { data: msg, error: msgErr } = await supabase
      .from("store_reputation_messages")
      .insert({
        store_id: identity.store_id,
        claim_id: data.claimId,
        sender_type: "store_staff",
        sender_name: "Equipe de Atendimento",
        sender_id: identity.id,
        message: data.message,
        attachment_urls: data.attachments,
        is_internal_note: data.isInternalNote,
      })
      .select()
      .single();

    if (msgErr) throw new Error("Erro ao enviar resposta: " + msgErr.message);

    // 2. Se não for nota interna, atualizar status da reclamação
    if (!data.isInternalNote) {
      await supabase
        .from("store_reputation_claims")
        .update({
          status: "replied_by_store",
          updated_at: new Date().toISOString(),
        })
        .eq("id", data.claimId);
    }

    return { status: "success", message: msg as StoreReputationMessage };
  });

export const resolveClaim = createServerFn({ method: "POST" })
  .validator(
    z.object({
      publicToken: z.string(),
      satisfactionRating: z.number().int().min(1).max(10),
      wouldBuyAgain: z.boolean(),
      feedbackMessage: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const supabase = getServerClient();

    const { data: claim, error } = await supabase
      .from("store_reputation_claims")
      .update({
        status: "resolved",
        satisfaction_rating: data.satisfactionRating,
        would_buy_again: data.wouldBuyAgain,
        resolved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("public_token", data.publicToken)
      .select()
      .single();

    if (error || !claim) throw new Error("Erro ao finalizar reclamação: " + (error?.message || ""));

    if (data.feedbackMessage) {
      await supabase.from("store_reputation_messages").insert({
        store_id: claim.store_id,
        claim_id: claim.id,
        sender_type: "customer",
        sender_name: claim.customer_name,
        message: data.feedbackMessage,
      });
    }

    return { status: "success", claim: claim as StoreReputationClaim };
  });

export const getStoreReputationScore = createServerFn({ method: "GET" })
  .validator(z.object({ storeId: z.string().uuid() }))
  .handler(async ({ data }): Promise<StoreReputationScore | null> => {
    const supabase = getServerClient();

    const { data: score, error } = await supabase
      .from("store_reputation_scores")
      .select("*")
      .eq("store_id", data.storeId)
      .maybeSingle();

    if (error) throw new Error("Erro ao buscar reputação: " + error.message);
    return (score || null) as StoreReputationScore | null;
  });
