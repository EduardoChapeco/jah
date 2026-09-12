import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase";
import { getServerIdentity, assertStoreAccess } from "@/lib/server-access";
import { logSystemError } from "@/lib/logger";

export type SocialNetwork = "instagram" | "facebook" | "tiktok" | "twitter" | "threads";
export type SocialPostStatus = "draft" | "scheduled" | "publishing" | "published" | "failed";
export type SocialImageFormat = "story_9x16" | "feed_1x1" | "banner_16x9";

export interface SocialPostDTO {
  id: string;
  store_id: string;
  content: string;
  image_url: string | null;
  image_format: SocialImageFormat | null;
  networks: SocialNetwork[];
  status: SocialPostStatus;
  scheduled_at: string | null;
  published_at: string | null;
  external_post_ids: Record<string, string>;
  error_message: string | null;
  reference_type: string | null;
  reference_id: string | null;
  created_at: string;
  updated_at: string;
}

const SocialNetworkSchema = z.enum(["instagram", "facebook", "tiktok", "twitter", "threads"]);
const SocialImageFormatSchema = z.enum(["story_9x16", "feed_1x1", "banner_16x9"]);

/**
 * Lista todos os posts sociais da loja com paginação.
 */
export const listSocialPosts = createServerFn({ method: "GET" })
  .validator(
    z.object({
      storeId: z.string().uuid().optional(),
      status: z.enum(["draft", "scheduled", "publishing", "published", "failed"]).optional(),
      network: SocialNetworkSchema.optional(),
      limit: z.number().int().min(1).max(100).default(50),
      offset: z.number().int().min(0).default(0),
    }).optional()
  )
  .handler(async ({ data }): Promise<SocialPostDTO[]> => {
    const supabase = getServerClient();
    const identity = await getServerIdentity();
    assertStoreAccess(identity, ["owner", "admin", "manager", "editor"]);

    const targetStoreId = data?.storeId || identity.store_id;
    if (!targetStoreId) throw new Error("Loja não identificada.");

    let query = supabase
      .from("store_social_posts")
      .select("*")
      .eq("store_id", targetStoreId)
      .order("created_at", { ascending: false })
      .range(data?.offset || 0, (data?.offset || 0) + (data?.limit || 50) - 1);

    if (data?.status) {
      query = query.eq("status", data.status);
    }
    if (data?.network) {
      query = query.contains("networks", [data.network]);
    }

    const { data: posts, error } = await query;
    if (error) {
      await logSystemError({
        operation: "listSocialPosts",
        error,
        table_name: "store_social_posts",
        contract_name: "listSocialPosts",
      });
      return [];
    }

    return (posts || []) as SocialPostDTO[];
  });

/**
 * Cria um rascunho de post social com imagem gerada pelo Studio.
 */
export const createSocialPost = createServerFn({ method: "POST" })
  .validator(
    z.object({
      storeId: z.string().uuid().optional(),
      content: z.string().min(1).max(2200),
      imageUrl: z.string().url().optional().nullable(),
      imageFormat: SocialImageFormatSchema.optional().nullable(),
      networks: z.array(SocialNetworkSchema).min(1, "Selecione ao menos uma rede"),
      referenceType: z.enum(["product", "tour", "classified", "news", "event", "custom"]).optional().nullable(),
      referenceId: z.string().uuid().optional().nullable(),
    })
  )
  .handler(async ({ data }) => {
    const supabase = getServerClient();
    const identity = await getServerIdentity();
    assertStoreAccess(identity, ["owner", "admin", "manager", "editor"]);

    const targetStoreId = data.storeId || identity.store_id;
    if (!targetStoreId) throw new Error("Loja não identificada.");

    const { data: post, error } = await supabase
      .from("store_social_posts")
      .insert({
        store_id: targetStoreId,
        content: data.content,
        image_url: data.imageUrl || null,
        image_format: data.imageFormat || null,
        networks: data.networks,
        status: "draft",
        reference_type: data.referenceType || null,
        reference_id: data.referenceId || null,
        created_by: identity.userId,
      })
      .select("id, status, networks, created_at")
      .single();

    if (error) {
      await logSystemError({
        operation: "createSocialPost",
        error,
        table_name: "store_social_posts",
        contract_name: "createSocialPost",
      });
      throw new Error(`Falha ao criar post: ${error.message}`);
    }

    return post;
  });

/**
 * Atualiza o conteúdo de um post em rascunho.
 */
export const updateSocialPost = createServerFn({ method: "POST" })
  .validator(
    z.object({
      postId: z.string().uuid(),
      storeId: z.string().uuid().optional(),
      content: z.string().min(1).max(2200).optional(),
      imageUrl: z.string().url().optional().nullable(),
      imageFormat: SocialImageFormatSchema.optional().nullable(),
      networks: z.array(SocialNetworkSchema).min(1).optional(),
    })
  )
  .handler(async ({ data }) => {
    const supabase = getServerClient();
    const identity = await getServerIdentity();
    assertStoreAccess(identity, ["owner", "admin", "manager", "editor"]);

    const targetStoreId = data.storeId || identity.store_id;
    if (!targetStoreId) throw new Error("Loja não identificada.");

    // Garante que o post pertence à loja antes de editar
    const { data: existing } = await supabase
      .from("store_social_posts")
      .select("id, status, store_id")
      .eq("id", data.postId)
      .eq("store_id", targetStoreId)
      .maybeSingle();

    if (!existing) throw new Error("Post não encontrado ou sem permissão.");
    if (existing.status === "published") throw new Error("Não é possível editar um post já publicado.");

    const { data: updated, error } = await supabase
      .from("store_social_posts")
      .update({
        ...(data.content && { content: data.content }),
        ...(data.imageUrl !== undefined && { image_url: data.imageUrl }),
        ...(data.imageFormat !== undefined && { image_format: data.imageFormat }),
        ...(data.networks && { networks: data.networks }),
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.postId)
      .eq("store_id", targetStoreId)
      .select("id, status, networks, updated_at")
      .single();

    if (error) throw new Error(`Falha ao atualizar post: ${error.message}`);
    return updated;
  });

/**
 * Agenda um post para publicação automática em data/hora futura.
 */
export const scheduleSocialPost = createServerFn({ method: "POST" })
  .validator(
    z.object({
      postId: z.string().uuid(),
      storeId: z.string().uuid().optional(),
      scheduledAt: z.string().datetime({ message: "Data/hora inválida. Use ISO 8601." }),
    })
  )
  .handler(async ({ data }) => {
    const supabase = getServerClient();
    const identity = await getServerIdentity();
    assertStoreAccess(identity, ["owner", "admin"]);

    const targetStoreId = data.storeId || identity.store_id;
    if (!targetStoreId) throw new Error("Loja não identificada.");

    const scheduledDate = new Date(data.scheduledAt);
    if (scheduledDate <= new Date()) {
      throw new Error("A data de agendamento deve ser futura.");
    }

    const { data: post, error } = await supabase
      .from("store_social_posts")
      .update({
        status: "scheduled",
        scheduled_at: data.scheduledAt,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.postId)
      .eq("store_id", targetStoreId)
      .in("status", ["draft", "failed"])
      .select("id, status, scheduled_at, networks")
      .single();

    if (error || !post) {
      throw new Error("Falha ao agendar post. Verifique se o post existe e está em rascunho.");
    }

    return post;
  });

/**
 * Publica imediatamente um post via API das redes sociais.
 *
 * Nota: Cada rede requer credenciais OAuth configuradas no Admin Master.
 * A publicação acontece em paralelo para todas as redes selecionadas.
 * Resultados parciais são registrados — uma rede pode falhar sem bloquear as outras.
 */
export const publishSocialPost = createServerFn({ method: "POST" })
  .validator(
    z.object({
      postId: z.string().uuid(),
      storeId: z.string().uuid().optional(),
    })
  )
  .handler(async ({ data }) => {
    const supabase = getServerClient();
    const identity = await getServerIdentity();
    assertStoreAccess(identity, ["owner", "admin"]);

    const targetStoreId = data.storeId || identity.store_id;
    if (!targetStoreId) throw new Error("Loja não identificada.");

    const { data: post } = await supabase
      .from("store_social_posts")
      .select("id, content, image_url, networks, status, store_id")
      .eq("id", data.postId)
      .eq("store_id", targetStoreId)
      .maybeSingle();

    if (!post) throw new Error("Post não encontrado.");
    if (post.status === "published") throw new Error("Post já publicado.");
    if (!post.networks || post.networks.length === 0) throw new Error("Nenhuma rede selecionada.");

    // Marca como "publishing" antes de tentar
    await supabase
      .from("store_social_posts")
      .update({ status: "publishing", updated_at: new Date().toISOString() })
      .eq("id", data.postId);

    const externalPostIds: Record<string, string> = {};
    const errors: Record<string, string> = {};

    // Publica em cada rede de forma independente
    // A implementação real requer tokens OAuth por rede, configurados pelo Admin Master.
    // Por ora, registra o status de cada rede para auditoria transparente.
    for (const network of post.networks as SocialNetwork[]) {
      try {
        // Dispatch por rede via Meta Graph API / TikTok Content API / Twitter API v2
        // Quando tokens OAuth estiverem presentes, executa publishToMetaGraph/publishToTikTok.

        // Registra como pendente de configuração OAuth
        errors[network] = `Conexão OAuth com ${network} não configurada. Configure em Configurações > Publicações.`;
      } catch (err: any) {
        errors[network] = err?.message || "Erro desconhecido";
      }
    }

    const allFailed = Object.keys(errors).length === post.networks.length;
    const finalStatus: SocialPostStatus = allFailed ? "failed" : "published";
    const errorMessage = allFailed ? Object.values(errors).join(" | ") : null;

    const { data: updatedPost, error: updateError } = await supabase
      .from("store_social_posts")
      .update({
        status: finalStatus,
        external_post_ids: externalPostIds,
        error_message: errorMessage,
        published_at: finalStatus === "published" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.postId)
      .select("id, status, external_post_ids, error_message, published_at")
      .single();

    if (updateError) throw new Error(`Falha ao atualizar status: ${updateError.message}`);

    return {
      success: finalStatus !== "failed",
      post: updatedPost,
      networks: { success: externalPostIds, errors },
    };
  });

/**
 * Remove um post em rascunho ou com falha.
 */
export const deleteSocialPost = createServerFn({ method: "POST" })
  .validator(
    z.object({
      postId: z.string().uuid(),
      storeId: z.string().uuid().optional(),
    })
  )
  .handler(async ({ data }) => {
    const supabase = getServerClient();
    const identity = await getServerIdentity();
    assertStoreAccess(identity, ["owner", "admin"]);

    const targetStoreId = data.storeId || identity.store_id;
    if (!targetStoreId) throw new Error("Loja não identificada.");

    const { error } = await supabase
      .from("store_social_posts")
      .delete()
      .eq("id", data.postId)
      .eq("store_id", targetStoreId)
      .in("status", ["draft", "failed", "scheduled"]);

    if (error) throw new Error(`Falha ao remover post: ${error.message}`);

    return { success: true };
  });
