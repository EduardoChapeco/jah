import React, { useState, useRef } from "react";
import { UploadCloud, X, Loader2, Image as ImageIcon, Film, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { getBrowserClient } from "@/lib/supabase";
import { toast } from "sonner";

export interface MediaData {
  id: string;
  url: string;
  path: string;
  type: "image" | "video";
}

export interface MediaUploaderProps {
  value?: string[] | MediaData[];
  onChange?: (urls: string[]) => void;
  onMediaChange?: (media: MediaData[]) => void;
  onUploadComplete?: (media: MediaData[]) => void;
  onUploadingStateChange?: (isUploading: boolean) => void;
  maxFiles?: number;
  bucket?: string;
  folder?: string;
  className?: string;
  acceptedTypes?: string[];
}

export const MediaUploader: React.FC<MediaUploaderProps> = ({
  value = [],
  onChange,
  onMediaChange,
  onUploadComplete,
  onUploadingStateChange,
  maxFiles = 8,
  bucket = "post-media",
  folder = "classifieds",
  className,
  acceptedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/webm"],
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Normaliza o valor para MediaData[]
  const mediaList: MediaData[] = (value || []).map((item, idx) => {
    if (typeof item === "string") {
      const isVid = item.match(/\.(mp4|webm|mov|ogg)(\?.*)?$/i);
      return {
        id: `media-${idx}-${item.slice(-10)}`,
        url: item,
        path: item,
        type: isVid ? "video" : "image",
      };
    }
    return item;
  });

  const notifyChange = (newList: MediaData[]) => {
    const urls = newList.map((m) => m.url);
    onChange?.(urls);
    onMediaChange?.(newList);
    onUploadComplete?.(newList);
  };

  const handleFiles = async (files: File[]) => {
    if (!files.length) return;

    if (mediaList.length + files.length > maxFiles) {
      toast.error(`Você pode enviar no máximo ${maxFiles} fotos ou vídeos.`);
      return;
    }

    setUploading(true);
    onUploadingStateChange?.(true);
    setUploadProgress(`Enviando ${files.length} arquivo(s)...`);

    const supabase = getBrowserClient();
    const updatedMedia: MediaData[] = [...mediaList];
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");

      if (!isImage && !isVideo) {
        toast.error(`Arquivo ${file.name} não é uma imagem ou vídeo válido.`);
        failCount++;
        continue;
      }

      // Máximo 30MB para vídeo, 15MB para imagem
      const maxSizeBytes = isVideo ? 30 * 1024 * 1024 : 15 * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        toast.error(
          `Arquivo ${file.name} excede o tamanho máximo de ${isVideo ? "30MB" : "15MB"}.`,
        );
        failCount++;
        continue;
      }

      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const cleanName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
      const filePath = `${folder}/${cleanName}`;

      setUploadProgress(`Enviando ${i + 1} de ${files.length}: ${file.name}...`);

      try {
        const { error: uploadErr } = await supabase.storage.from(bucket).upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

        if (uploadErr) {
          console.error(`[MediaUploader] Erro no upload de ${file.name}:`, uploadErr);
          // Tenta bucket alternativo public_media se post-media falhar
          if (bucket !== "public_media") {
            const { error: retryErr } = await supabase.storage
              .from("public_media")
              .upload(filePath, file, {
                cacheControl: "3600",
                upsert: false,
              });
            if (retryErr) throw retryErr;
            const { data } = supabase.storage.from("public_media").getPublicUrl(filePath);
            updatedMedia.push({
              id: cleanName,
              url: data.publicUrl,
              path: filePath,
              type: isImage ? "image" : "video",
            });
            successCount++;
            continue;
          }
          throw uploadErr;
        }

        const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);

        updatedMedia.push({
          id: cleanName,
          url: data.publicUrl,
          path: filePath,
          type: isImage ? "image" : "video",
        });
        successCount++;
      } catch (err: any) {
        console.error(`[MediaUploader] Falha ao enviar ${file.name}:`, err);
        toast.error(`Não foi possível enviar ${file.name}: ${err?.message || "Erro de rede"}`);
        failCount++;
      }
    }

    notifyChange(updatedMedia);
    setUploading(false);
    onUploadingStateChange?.(false);
    setUploadProgress(null);

    if (successCount > 0) {
      toast.success(`${successCount} mídia(s) enviada(s) com sucesso!`);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemove = async (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const itemToRemove = mediaList[idx];
    if (!itemToRemove) return;

    const updated = mediaList.filter((_, i) => i !== idx);
    notifyChange(updated);

    // Tenta remover do storage em background
    try {
      const supabase = getBrowserClient();
      if (itemToRemove.path && !itemToRemove.path.startsWith("http")) {
        await supabase.storage.from(bucket).remove([itemToRemove.path]);
      }
    } catch (err) {
      console.warn("[MediaUploader] Aviso ao remover do storage:", err);
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Grid de Mídias Existentes */}
      {mediaList.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
          {mediaList.map((media, idx) => (
            <div
              key={media.id || idx}
              className="relative aspect-square rounded-xl overflow-hidden border border-border bg-muted/40 group shadow-2xs"
            >
              {media.type === "image" ? (
                <img
                  src={media.url}
                  alt={`Mídia ${idx + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full relative bg-black flex items-center justify-center">
                  <video
                    src={media.url}
                    className="w-full h-full object-cover opacity-80"
                    muted
                    playsInline
                  />
                  <Film className="absolute size-6 text-white/90 drop-shadow" />
                </div>
              )}

              {/* Badge de Capa para o primeiro item */}
              {idx === 0 && (
                <div className="absolute bottom-1.5 left-1.5 bg-black/70 backdrop-blur-sm text-[9px] font-bold uppercase tracking-wider text-white px-2 py-0.5 rounded-md">
                  Capa
                </div>
              )}

              {/* Botão Remover */}
              <button
                type="button"
                onClick={(e) => handleRemove(idx, e)}
                className="absolute top-1.5 right-1.5 bg-black/60 hover:bg-destructive text-white p-1 rounded-lg opacity-80 group-hover:opacity-100 transition-all"
                title="Remover mídia"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Dropzone de Upload */}
      {mediaList.length < maxFiles && (
        <div>
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "w-full border-2 border-dashed border-border hover:border-primary/50 bg-card hover:bg-muted/30 rounded-xl p-4 sm:p-6 transition-all flex flex-col items-center justify-center gap-2 text-center group cursor-pointer",
              uploading && "opacity-60 cursor-not-allowed border-primary/30",
            )}
          >
            {uploading ? (
              <>
                <Loader2 className="size-6 text-primary animate-spin" />
                <p className="text-xs font-semibold text-foreground">
                  {uploadProgress || "Processando mídias..."}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Aguarde o envio para salvar o anúncio
                </p>
              </>
            ) : (
              <>
                <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                  <UploadCloud className="size-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">
                    Clique ou arraste fotos e vídeos aqui
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    JPG, PNG, WEBP ou MP4 até {maxFiles} arquivos ({mediaList.length}/{maxFiles}{" "}
                    adicionados)
                  </p>
                </div>
              </>
            )}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={acceptedTypes.join(",")}
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              handleFiles(files);
            }}
          />
        </div>
      )}
    </div>
  );
};
