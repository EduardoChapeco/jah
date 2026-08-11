import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase";

/**
 * Retorna uma URL assinada para que o cliente faça o upload diretamente para o Supabase Storage,
 * aliviando o servidor (BFF) de processar buffers/base64 de grandes arquivos (LGPD/Performance).
 * API_CONTRACTS.md - 8.1 Solicitar URL de upload
 */
export const getSignedUploadUrl = createServerFn({ method: "POST" })
  .validator(
    z.object({
      fileName: z.string().min(1),
      bucket: z.enum(["product-media", "cms-media", "payment-proofs", "rma-proofs"]),
      contentType: z.string(),
    }),
  )
  .handler(async ({ data: { fileName, bucket } }) => {
    try {
      const supabase = getServerClient();
      const ext = fileName.split(".").pop() || "png";

      const { getServerIdentity } = await import("@/lib/server-access");
      const { store_id } = await getServerIdentity();
      if (!store_id) throw new Error("Loja não encontrada");

      const uniqueName = `${store_id}/${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${ext}`;

      // Tenta criar a URL assinada
      let result = await supabase.storage.from(bucket).createSignedUploadUrl(uniqueName);

      // Auto-Healing: Cria o bucket se não existir e tenta novamente
      if (result.error && result.error.message.includes("Bucket not found")) {
        console.log(`[storage] Bucket ${bucket} missing. Auto-healing...`);
        const { error: createError } = await supabase.storage.createBucket(bucket, {
          public: bucket !== "payment-proofs" && bucket !== "rma-proofs",
          fileSizeLimit: 10485760, // 10MB
        });

        if (createError) {
          throw new Error(`Auto-healing failed: ${createError.message}`);
        }

        result = await supabase.storage.from(bucket).createSignedUploadUrl(uniqueName);
      }

      if (result.error || !result.data) {
        throw new Error(`Erro ao gerar URL de upload: ${result.error?.message}`);
      }

      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(uniqueName);

      return {
        status: "success" as const,
        signedUrl: result.data.signedUrl,
        token: result.data.token,
        path: result.data.path,
        publicUrl:
          bucket !== "payment-proofs" && bucket !== "rma-proofs" ? urlData.publicUrl : null,
      };
    } catch (e: any) {
      console.error("[storage.functions] getSignedUploadUrl error:", e);
      throw new Error(e.message || "Erro ao gerar URL");
    }
  });

/**
 * Gera uma URL assinada de upload para o bucket `post-media` (mídia do Mural/Feed).
 *
 * Fluxo:
 *   1. Cliente chama este endpoint com metadata do arquivo.
 *   2. Servidor valida sessão, gera signed URL e retorna {signedUrl, publicUrl}.
 *   3. Cliente faz PUT direto para signedUrl (sem passar dados pelo servidor).
 *   4. Cliente salva publicUrl no post via createPost.
 *
 * AGENTS.md: Upload real — proibido hardcode ou URL de terceiros como placeholder.
 */
export const getPostMediaSignedUrl = createServerFn({ method: "POST" })
  .validator(
    z.object({
      fileName: z.string().min(1).max(256),
      contentType: z.enum([
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
        "video/mp4",
      ]),
    }),
  )
  .handler(async ({ data: { fileName, contentType } }) => {
    const supabase = getServerClient();
    const { getServerIdentity } = await import("@/lib/server-access");
    const identity = await getServerIdentity();

    if (!identity.id) throw new Error("Não autorizado — faça login para enviar mídia.");

    const BUCKET = "post-media";
    const ext = contentType.split("/")[1] ?? "jpg";
    const uniqueName = `${identity.id}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;

    let result = await supabase.storage.from(BUCKET).createSignedUploadUrl(uniqueName);

    // Auto-healing: cria o bucket público se não existir
    if (result.error?.message.includes("Bucket not found")) {
      const { error: createErr } = await supabase.storage.createBucket(BUCKET, {
        public: true,
        fileSizeLimit: 20 * 1024 * 1024, // 20MB
        allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4"],
      });
      if (createErr) throw new Error(`[storage] Bucket auto-heal failed: ${createErr.message}`);
      result = await supabase.storage.from(BUCKET).createSignedUploadUrl(uniqueName);
    }

    if (result.error || !result.data) {
      throw new Error(`Erro ao gerar URL de upload de mídia: ${result.error?.message}`);
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(uniqueName);

    return {
      signedUrl: result.data.signedUrl,
      path: result.data.path,
      publicUrl: urlData.publicUrl,
    };
  });


/**
 * Retorna uma URL assinada para que o cliente faça o upload diretamente para o Supabase Storage,
 * aliviando o servidor (BFF) de processar buffers/base64 de grandes arquivos (LGPD/Performance).
 * API_CONTRACTS.md - 8.1 Solicitar URL de upload
 */
