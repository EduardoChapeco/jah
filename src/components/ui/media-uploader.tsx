import React, { useCallback, useState } from "react";
import { UploadCloud, X, Loader2, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { getBrowserClient } from "@/lib/supabase";

export interface MediaData {
  id: string; // ID interno gerado
  url: string; // URL pública final
  path: string; // Caminho no storage
  type: "image" | "video";
}

export interface MediaUploaderProps {
  value?: MediaData[];
  onChange?: (val: MediaData[]) => void;
  maxFiles?: number;
  bucket?: string;
  folder?: string;
  className?: string;
}

export const MediaUploader: React.FC<MediaUploaderProps> = ({
  value = [],
  onChange,
  maxFiles = 5,
  bucket = "public_media",
  folder = "classifieds",
  className,
}) => {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (value.length + files.length > maxFiles) {
      alert(`Você pode enviar no máximo ${maxFiles} arquivos.`);
      return;
    }

    setUploading(true);
    const supabase = getBrowserClient();
    const newMedia: MediaData[] = [...value];

    for (const file of files) {
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");
      
      if (!isImage && !isVideo) continue;

      const ext = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${ext}`;
      const filePath = `${folder}/${fileName}`;

      try {
        const { error } = await supabase.storage.from(bucket).upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

        if (error) throw error;

        const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);

        newMedia.push({
          id: fileName,
          url: data.publicUrl,
          path: filePath,
          type: isImage ? "image" : "video",
        });
      } catch (err) {
        console.error("Erro ao subir mídia:", err);
      }
    }

    onChange?.(newMedia);
    setUploading(false);
    
    // Limpa o input
    if (e.target) {
      e.target.value = "";
    }
  };

  const handleRemove = async (mediaToRemove: MediaData) => {
    // Tenta apagar no storage
    try {
      const supabase = getBrowserClient();
      await supabase.storage.from(bucket).remove([mediaToRemove.path]);
    } catch (e) {
      console.error("Erro ao remover mídia do storage:", e);
    }
    
    // Remove do estado
    const newMedia = value.filter((m) => m.id !== mediaToRemove.id);
    onChange?.(newMedia);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {value.map((media) => (
          <div key={media.id} className="relative aspect-square rounded-xl overflow-hidden border border-border group bg-muted">
            {media.type === "image" ? (
              <img src={media.url} alt="Mídia" className="w-full h-full object-cover" />
            ) : (
              <video src={media.url} className="w-full h-full object-cover" />
            )}
            <button
              type="button"
              onClick={() => handleRemove(media)}
              className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm p-1.5 rounded-full text-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground shadow-sm"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
        
        {value.length < maxFiles && (
          <label className="relative aspect-square rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-colors flex flex-col items-center justify-center cursor-pointer bg-muted/30 hover:bg-muted/50 group">
            <input
              type="file"
              multiple
              accept="image/*,video/mp4,video/quicktime"
              className="sr-only"
              onChange={handleFileChange}
              disabled={uploading}
            />
            {uploading ? (
              <div className="flex flex-col items-center text-muted-foreground gap-2">
                <Loader2 className="size-6 animate-spin" />
                <span className="text-xs font-medium">Enviando...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center text-muted-foreground gap-2">
                <div className="p-3 rounded-full bg-background border border-border shadow-sm group-hover:scale-105 transition-transform">
                  <UploadCloud className="size-5" />
                </div>
                <span className="text-xs font-medium text-center px-2">Adicionar Mídia</span>
              </div>
            )}
          </label>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Adicione até {maxFiles} fotos ou vídeos curtos. Formatos suportados: JPG, PNG, WEBP, MP4.
      </p>
    </div>
  );
};
