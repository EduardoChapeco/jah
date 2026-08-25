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
      const errMsg = result.error?.message || "";
      if (
        errMsg.includes("Bucket not found") ||
        errMsg.includes("The related resource does not exist")
      ) {
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
    } catch (e: unknown) {
      console.error("[storage.functions] getSignedUploadUrl error:", e);
      throw new Error((e instanceof Error ? e.message : String(e)) || "Erro ao gerar URL");
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
      contentType: z.string().min(1).max(100),
    }),
  )
  .handler(async ({ data: { fileName, contentType } }) => {
    const supabase = getServerClient();
    const { getServerIdentity } = await import("@/lib/server-access");
    const identity = await getServerIdentity();

    if (!identity.id) throw new Error("Não autorizado — faça login para enviar mídia.");

    const BUCKET = "post-media";
    const ext = fileName.split(".").pop() || contentType.split("/")[1] || "bin";
    const uniqueName = `${identity.id}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;

    let result = await supabase.storage.from(BUCKET).createSignedUploadUrl(uniqueName);

    // Auto-healing: cria o bucket público se não existir
    const errMsg = result.error?.message || "";
    if (
      errMsg.includes("Bucket not found") ||
      errMsg.includes("The related resource does not exist")
    ) {
      const { error: createErr } = await supabase.storage.createBucket(BUCKET, {
        public: true,
        fileSizeLimit: 100 * 1024 * 1024, // 100MB para fotos e vídeos em alta resolução
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
 * Upload direto de mídia de lojas e espaços (logos, capas e banners).
 */
export const uploadStoreMedia = createServerFn({ method: "POST" })
  .validator(
    z.object({
      fileName: z.string().min(1),
      fileType: z.string().min(1),
      base64Data: z.string().min(1),
      bucket: z.string().default("cms-media"),
    }),
  )
  .handler(async ({ data: { fileName, fileType, base64Data, bucket } }) => {
    try {
      const supabase = getServerClient();
      const ext = fileName.split(".").pop() || "png";
      const uniqueName = `stores/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;

      // Extrai os bytes a partir da string base64
      const base64Content = base64Data.includes(",") ? base64Data.split(",")[1] : base64Data;
      const buffer = Buffer.from(base64Content, "base64");

      let { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(uniqueName, buffer, {
          contentType: fileType,
          upsert: true,
        });

      if (uploadError && (uploadError.message.includes("Bucket not found") || uploadError.message.includes("The related resource does not exist"))) {
        await supabase.storage.createBucket(bucket, {
          public: true,
          fileSizeLimit: 20 * 1024 * 1024,
        });
        const retry = await supabase.storage
          .from(bucket)
          .upload(uniqueName, buffer, {
            contentType: fileType,
            upsert: true,
          });
        uploadError = retry.error;
      }

      if (uploadError) {
        throw new Error(`Erro ao fazer upload da mídia: ${uploadError.message}`);
      }

      const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(uniqueName);

      return {
        url: publicUrlData.publicUrl,
        path: uniqueName,
      };
    } catch (e: any) {
      console.error("[storage] uploadStoreMedia error:", e);
      throw new Error(e.message || "Erro no upload");
    }
  });

/**
 * Upload direto de fotos e vídeos do Mural a partir de arquivo local (Base64 / File Reader)
 */
export const uploadPostMedia = createServerFn({ method: "POST" })
  .validator(
    z.object({
      fileName: z.string().min(1),
      fileType: z.string().min(1),
      base64Data: z.string().min(1),
    }),
  )
  .handler(async ({ data: { fileName, fileType, base64Data } }) => {
    try {
      const { getServerIdentity } = await import("@/lib/server-access");
      const identity = await getServerIdentity();
      if (!identity.id) throw new Error("Faça login para enviar fotos ou vídeos.");

      const supabase = getServerClient();
      const ext = fileName.split(".").pop() || "jpg";
      const uniqueName = `${identity.id}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;
      const bucket = "post-media";

      const base64Content = base64Data.includes(",") ? base64Data.split(",")[1] : base64Data;
      const buffer = Buffer.from(base64Content, "base64");

      let { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(uniqueName, buffer, {
          contentType: fileType,
          upsert: true,
        });

      if (
        uploadError &&
        (uploadError.message.includes("Bucket not found") ||
          uploadError.message.includes("The related resource does not exist"))
      ) {
        await supabase.storage.createBucket(bucket, {
          public: true,
          fileSizeLimit: 100 * 1024 * 1024,
        });
        const retry = await supabase.storage
          .from(bucket)
          .upload(uniqueName, buffer, {
            contentType: fileType,
            upsert: true,
          });
        uploadError = retry.error;
      }

      if (uploadError) {
        throw new Error(`Erro ao salvar mídia: ${uploadError.message}`);
      }

      const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(uniqueName);

      return {
        url: publicUrlData.publicUrl,
        path: uniqueName,
      };
    } catch (e: any) {
      console.error("[storage] uploadPostMedia error:", e);
      throw new Error(e.message || "Erro no upload do arquivo.");
    }
  });

/**
 * Upload de mídia para a administração global (Admin Master)
 * Utilizado para ícones customizados, cards de super nichos e banners do app.
 */
export const uploadAdminMedia = createServerFn({ method: "POST" })
  .validator(
    z.object({
      fileName: z.string().min(1),
      fileType: z.string().min(1),
      base64Data: z.string().min(1),
      folder: z.string().default("platform"),
    }),
  )
  .handler(async ({ data: { fileName, fileType, base64Data, folder } }) => {
    try {
      const { requireAdmin } = await import("@/lib/server-access");
      const identity = await requireAdmin();
      if (identity.role !== "platform_admin") {
        throw new Error("Acesso restrito ao Administrador Master Global.");
      }

      const supabase = getServerClient();
      const ext = fileName.split(".").pop() || "png";
      const uniqueName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;
      const bucket = "cms-media";

      const base64Content = base64Data.includes(",") ? base64Data.split(",")[1] : base64Data;
      const buffer = Buffer.from(base64Content, "base64");

      let { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(uniqueName, buffer, {
          contentType: fileType,
          upsert: true,
        });

      if (
        uploadError &&
        (uploadError.message.includes("Bucket not found") ||
          uploadError.message.includes("The related resource does not exist"))
      ) {
        await supabase.storage.createBucket(bucket, {
          public: true,
          fileSizeLimit: 20 * 1024 * 1024,
        });
        const retry = await supabase.storage
          .from(bucket)
          .upload(uniqueName, buffer, {
            contentType: fileType,
            upsert: true,
          });
        uploadError = retry.error;
      }

      if (uploadError) {
        throw new Error(`Erro ao salvar imagem no servidor: ${uploadError.message}`);
      }

      const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(uniqueName);

      return {
        url: publicUrlData.publicUrl,
        path: uniqueName,
      };
    } catch (e: any) {
      console.error("[storage] uploadAdminMedia error:", e);
      throw new Error(e.message || "Erro no upload do admin.");
    }
  });

/**
 * Upload universal e resiliente de mídia (imagens e vídeos) via Server Function
 * Bypassa RLS client-side através do service_role e auto-cria buckets faltantes.
 */
export const uploadMediaUniversal = createServerFn({ method: "POST" })
  .validator(
    z.object({
      fileName: z.string().min(1),
      fileType: z.string().min(1),
      base64Data: z.string().min(1),
      bucket: z.string().default("post-media"),
      folder: z.string().default("uploads"),
    }),
  )
  .handler(async ({ data: { fileName, fileType, base64Data, bucket, folder } }) => {
    try {
      const supabase = getServerClient();
      const ext = fileName.split(".").pop()?.toLowerCase() || "jpg";
      const cleanName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${ext}`;
      const uniqueName = `${folder}/${cleanName}`;

      const base64Content = base64Data.includes(",") ? base64Data.split(",")[1] : base64Data;
      const buffer = Buffer.from(base64Content, "base64");

      let { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(uniqueName, buffer, {
          contentType: fileType,
          upsert: true,
        });

      if (
        uploadError &&
        (uploadError.message.includes("Bucket not found") ||
          uploadError.message.includes("The related resource does not exist"))
      ) {
        await supabase.storage.createBucket(bucket, {
          public: true,
          fileSizeLimit: 100 * 1024 * 1024,
        });
        const retry = await supabase.storage
          .from(bucket)
          .upload(uniqueName, buffer, {
            contentType: fileType,
            upsert: true,
          });
        uploadError = retry.error;
      }

      if (uploadError) {
        throw new Error(`Erro ao persistir mídia no storage: ${uploadError.message}`);
      }

      const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(uniqueName);

      return {
        id: cleanName,
        url: publicUrlData.publicUrl,
        path: uniqueName,
        name: fileName,
        type: fileType.startsWith("video/") ? ("video" as const) : ("image" as const),
      };
    } catch (e: any) {
      console.error("[storage] uploadMediaUniversal error:", e);
      throw new Error(e.message || "Erro no upload da mídia.");
    }
  });

