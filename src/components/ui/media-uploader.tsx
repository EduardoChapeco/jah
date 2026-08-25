import React, { useState, useRef } from "react";
import { UploadCloud, X, Loader2, Image as ImageIcon, Film, AlertCircle, Crop } from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadMediaUniversal } from "@/services/storage.functions";
import { getBrowserClient } from "@/lib/supabase";
import { toast } from "sonner";
import { ImageCropperDialog } from "@/components/ui/image-cropper-dialog";

export interface MediaData {
  id: string;
  url: string;
  path: string;
  type: "image" | "video";
}

export interface MediaUploaderProps {
  value?: string | string[] | MediaData[];
  onChange?: (urls: string[]) => void;
  onMediaChange?: (media: MediaData[]) => void;
  onUploadComplete?: (media: MediaData[]) => void;
  onUploadingStateChange?: (isUploading: boolean) => void;
  maxFiles?: number;
  bucket?: string;
  folder?: string;
  className?: string;
  acceptedTypes?: string[];
  label?: string;
  accept?: "image" | "video" | "all";
  aspect?: number;
  cropShape?: "rect" | "round";
  lockAspect?: boolean;
  enableCrop?: boolean;
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
  label,
  accept = "all",
  aspect = folder === "classifieds" ? 4 / 3 : 1,
  cropShape = "rect",
  lockAspect = true,
  enableCrop = true,
  acceptedTypes = accept === "image"
    ? ["image/jpeg", "image/png", "image/webp", "image/gif"]
    : accept === "video"
      ? ["video/mp4", "video/webm", "video/quicktime"]
      : ["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/webm"],
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Crop dialog state
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [currentImageSrc, setCurrentImageSrc] = useState<string | null>(null);
  const [currentCropFile, setCurrentCropFile] = useState<File | null>(null);
  const [editingMediaIndex, setEditingMediaIndex] = useState<number | null>(null);

  // Normaliza o valor para MediaData[] de forma segura (suporta string única, array de strings ou MediaData[])
  const normalizedRawValue: (string | MediaData)[] = typeof value === "string"
    ? (value.trim() ? [value] : [])
    : Array.isArray(value)
      ? value
      : [];

  const mediaList: MediaData[] = normalizedRawValue.map((item, idx) => {
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

    // Se for apenas 1 imagem e o recorte estiver habilitado, abre o modal de corte direto
    if (files.length === 1 && files[0].type.startsWith("image/") && enableCrop && !files[0].type.includes("gif")) {
      const file = files[0];
      setCurrentCropFile(file);
      setEditingMediaIndex(null);
      const reader = new FileReader();
      reader.onload = () => {
        setCurrentImageSrc(reader.result as string);
        setCropModalOpen(true);
      };
      reader.onerror = () => toast.error("Erro ao ler arquivo de imagem");
      reader.readAsDataURL(file);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setUploading(true);
    onUploadingStateChange?.(true);
    setUploadProgress(`Enviando ${files.length} arquivo(s)...`);

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

      // Máximo 50MB para vídeo, 20MB para imagem
      const maxSizeBytes = isVideo ? 50 * 1024 * 1024 : 20 * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        toast.error(
          `Arquivo ${file.name} excede o tamanho máximo de ${isVideo ? "50MB" : "20MB"}.`,
        );
        failCount++;
        continue;
      }

      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const cleanName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
      const filePath = `${folder}/${cleanName}`;

      setUploadProgress(`Enviando ${i + 1} de ${files.length}: ${file.name}...`);

      try {
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const res = await uploadMediaUniversal({
          data: {
            fileName: file.name,
            fileType: file.type || (isVideo ? "video/mp4" : "image/jpeg"),
            base64Data,
            bucket,
            folder,
          },
        });

        if (res?.url) {
          updatedMedia.push({
            id: res.id || cleanName,
            url: res.url,
            path: res.path || filePath,
            type: isVideo ? "video" : "image",
          });
          successCount++;
        } else {
          throw new Error("Servidor não retornou a URL pública da mídia.");
        }
      } catch (err: any) {
        console.error(`[MediaUploader] Falha ao enviar ${file.name}:`, err);
        toast.error(`Não foi possível enviar ${file.name}: ${err?.message || "Erro no upload"}`);
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

  const handleCropComplete = async (croppedBase64: string) => {
    setUploading(true);
    onUploadingStateChange?.(true);
    setUploadProgress("Enviando imagem recortada...");

    try {
      const fileName = currentCropFile?.name || `crop_${Date.now()}.png`;
      const res = await uploadMediaUniversal({
        data: {
          fileName: fileName.replace(/\.[^/.]+$/, "") + ".png",
          fileType: "image/png",
          base64Data: croppedBase64,
          bucket,
          folder,
        },
      });

      if (res?.url) {
        let updatedMedia: MediaData[];
        if (editingMediaIndex !== null && mediaList[editingMediaIndex]) {
          // Substitui a imagem editada
          updatedMedia = mediaList.map((m, i) =>
            i === editingMediaIndex
              ? { ...m, url: res.url, path: res.path || m.path }
              : m,
          );
          toast.success("Imagem recortada atualizada com sucesso!");
        } else {
          // Adiciona nova imagem recortada
          updatedMedia = [
            ...mediaList,
            {
              id: res.id || `crop-${Date.now()}`,
              url: res.url,
              path: res.path || `${folder}/crop_${Date.now()}.png`,
              type: "image",
            },
          ];
          toast.success("Imagem enviada com sucesso!");
        }
        notifyChange(updatedMedia);
      } else {
        throw new Error("Não foi possível obter a URL da imagem.");
      }
    } catch (err: any) {
      console.error("[MediaUploader] Erro ao salvar corte:", err);
      toast.error(`Falha no upload da imagem recortada: ${err?.message || "Erro desconhecido"}`);
    } finally {
      setUploading(false);
      onUploadingStateChange?.(false);
      setUploadProgress(null);
      setCurrentCropFile(null);
      setCurrentImageSrc(null);
      setEditingMediaIndex(null);
    }
  };

  const handleOpenRecrop = (idx: number, media: MediaData, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingMediaIndex(idx);
    setCurrentImageSrc(media.url);
    setCurrentCropFile(null);
    setCropModalOpen(true);
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
              className="relative aspect-square rounded-xl overflow-hidden  bg-muted/40 group "
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

              {/* Ações de Hover (Recortar + Remover) */}
              <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
                {media.type === "image" && enableCrop && (
                  <button
                    type="button"
                    onClick={(e) => handleOpenRecrop(idx, media, e)}
                    className="bg-black/60 hover:bg-black/90 text-white p-1 rounded-lg opacity-80 group-hover:opacity-100 transition-all cursor-pointer"
                    title="Recortar / Ajustar proporção"
                  >
                    <Crop className="size-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => handleRemove(idx, e)}
                  className="bg-black/60 hover:bg-destructive text-white p-1 rounded-lg opacity-80 group-hover:opacity-100 transition-all cursor-pointer"
                  title="Remover mídia"
                >
                  <X className="size-3.5" />
                </button>
              </div>
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
                    {label || "Clique ou arraste fotos e vídeos aqui"}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {accept === "image" ? "JPG, PNG, WEBP ou GIF" : "JPG, PNG, WEBP ou MP4"} até {maxFiles} {maxFiles === 1 ? "arquivo" : "arquivos"} ({mediaList.length}/{maxFiles}{" "}
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

      <ImageCropperDialog
        open={cropModalOpen}
        onOpenChange={setCropModalOpen}
        imageSrc={currentImageSrc}
        aspect={aspect}
        cropShape={cropShape}
        lockAspect={lockAspect}
        onCropCompleteAction={handleCropComplete}
      />
    </div>
  );
};
