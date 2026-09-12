/**
 * proposal-storage.ts — Contratos Canônicos de Upload e Storage de Propostas (BFF BigTech)
 * Re-exporta Server Functions de storage.functions.ts com zero dependência de client Supabase.
 */

import { uploadStoreMedia } from "./storage.functions";

export * from "./storage.functions";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Upload de mídias de proposta (mapa estático, imagens customizadas)
 */
export async function uploadProposalMedia(
  agencyId: string,
  proposalId: string,
  file: File,
  slot: string = "media"
): Promise<string> {
  try {
    const base64 = await fileToBase64(file);
    const result = await uploadStoreMedia({
      data: {
        fileName: file.name || `proposal_${slot}_${Date.now()}.png`,
        fileType: file.type || "image/png",
        base64Data: base64,
        bucket: "cms-media",
      },
    });
    return result.url;
  } catch (err: any) {
    console.warn("[uploadProposalMedia] Erro no upload direto, utilizando ObjectURL fallback:", err?.message);
    if (typeof window !== "undefined" && window.URL) {
      return URL.createObjectURL(file);
    }
    return "";
  }
}

/**
 * Salva uma imagem do Unsplash no storage da agência ou retorna a URL direta
 */
export async function saveUnsplashImageToStorage(
  _agencyId: string,
  _proposalId: string,
  imageUrl: string,
  _slot?: string
): Promise<string> {
  if (imageUrl.includes("unsplash.com")) {
    try {
      const urlObj = new URL(imageUrl);
      urlObj.searchParams.set("auto", "format");
      urlObj.searchParams.set("fit", "crop");
      urlObj.searchParams.set("w", "1600");
      urlObj.searchParams.set("q", "80");
      return urlObj.toString();
    } catch {
      return imageUrl;
    }
  }
  return imageUrl;
}
