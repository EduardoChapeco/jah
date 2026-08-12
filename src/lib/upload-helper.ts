import { getSignedUploadUrl } from "@/services/storage.functions";

/**
 * Realiza upload direto para o Supabase Storage via Signed URL,
 * aliviando o servidor (BFF) do processamento de Buffers/Base64.
 */
export async function directUploadMedia({
  file,
  fileName,
  bucket,
}: {
  file: File | Blob;
  fileName: string;
  bucket: "product-media" | "cms-media" | "payment-proofs" | "rma-proofs";
}): Promise<{ url: string }> {
  try {
    // 1. Solicita a URL assinada ao servidor
    const res = await getSignedUploadUrl({
      data: {
        fileName,
        bucket,
        contentType: file.type || "application/octet-stream",
      },
    });

    if (res.status !== "success" || !res.signedUrl) {
      throw new Error("Falha ao obter URL de upload");
    }

    // 2. Faz o upload diretamente do navegador para o Supabase
    const uploadRes = await fetch(res.signedUrl, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type || "application/octet-stream",
      },
    });

    if (!uploadRes.ok) {
      throw new Error(`Upload falhou: ${uploadRes.statusText}`);
    }

    // 3. Retorna a URL pública ou caminho
    return { url: res.publicUrl || res.path };
  } catch (err: unknown) {
    console.error("[directUploadMedia]", err);
    throw new Error((err instanceof Error ? err.message : String(err)) || "Erro no upload direto");
  }
}
