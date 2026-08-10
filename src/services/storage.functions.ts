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
