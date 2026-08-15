import { useState, useRef } from "react";
import { toast } from "sonner";
import { ImagePlus, X, Loader2, Video, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createPost } from "@/services/social.functions";
import { getPostMediaSignedUrl } from "@/services/storage.functions";
import { useQueryClient } from "@tanstack/react-query";

interface MediaPreviewItem {
  url: string;
  type: "image" | "video";
}

export function InlinePostComposer() {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<MediaPreviewItem[]>([]);
  const [layoutStyle, setLayoutStyle] = useState<"grid" | "carousel">("grid");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      toast.error("Formato não suportado. Por favor, envie uma foto, gif ou vídeo.");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Limite de 50MB.");
      return;
    }

    if (mediaUrls.length >= 4) {
      toast.error("Máximo de 4 mídias por post.");
      return;
    }

    const localUrl = URL.createObjectURL(file);
    const mediaType = isVideo ? "video" : "image";
    setMediaPreviews((prev) => [...prev, { url: localUrl, type: mediaType }]);
    setIsUploadingMedia(true);

    try {
      const { signedUrl, publicUrl } = await getPostMediaSignedUrl({
        data: {
          fileName: file.name,
          contentType: file.type || (isVideo ? "video/mp4" : "image/jpeg"),
        },
      });

      const uploadRes = await fetch(signedUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type || (isVideo ? "video/mp4" : "image/jpeg") },
      });

      if (!uploadRes.ok) throw new Error("Falha no upload para o Storage.");
      setMediaUrls((prev) => [...prev, publicUrl]);
    } catch (err: unknown) {
      toast.error((err instanceof Error ? err.message : String(err)) || "Erro no upload da mídia.");
      setMediaPreviews((prev) => prev.filter((item) => item.url !== localUrl));
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const removeMedia = (index: number) => {
    setMediaPreviews((prev) => prev.filter((_, i) => i !== index));
    setMediaUrls((prev) => prev.filter((_, i) => i !== index));
    if (fileInputRef.current && mediaUrls.length <= 1) fileInputRef.current.value = "";
  };

  const onSubmit = async () => {
    const trimmedContent = content.trim();
    if (!trimmedContent && mediaUrls.length === 0) {
      toast.error("O post precisa ter texto, foto ou vídeo.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createPost({
        data: {
          content_text: trimmedContent || undefined,
          media_urls: mediaUrls,
          layout_style: layoutStyle,
          as_store: false,
          reference_type: "none",
        },
      });

      toast.success("Publicação enviada com sucesso!");
      setContent("");
      setMediaUrls([]);
      setMediaPreviews([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      queryClient.invalidateQueries({ queryKey: ["mural-feed"] });
    } catch (err: unknown) {
      toast.error((err instanceof Error ? err.message : String(err)) || "Erro ao publicar.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-4 mb-4 shadow-sm flex flex-col gap-3 relative">
      <Textarea
        placeholder="O que você vai colar no mural hoje?"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="min-h-16 text-sm sm:text-base border-none bg-transparent resize-none focus-visible:ring-0 p-0 text-foreground"
      />

      {mediaPreviews.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {mediaPreviews.map((preview, index) => (
            <div
              key={index}
              className="relative border border-border overflow-hidden rounded-xl bg-black inline-block w-[120px] aspect-square shrink-0"
            >
              {isUploadingMedia && index === mediaPreviews.length - 1 && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-20 gap-1 text-white">
                  <Loader2 className="size-5 animate-spin text-primary" />
                  <span className="text-[10px] font-medium">Enviando...</span>
                </div>
              )}

              {preview.type === "video" ? (
                <video
                  src={preview.url}
                  className="size-full object-cover"
                  muted
                  playsInline
                  autoPlay
                  loop
                />
              ) : (
                <img
                  src={preview.url}
                  alt={`Preview ${index}`}
                  className="size-full object-cover"
                />
              )}

              {preview.type === "video" && (
                <div className="absolute bottom-1 left-1 bg-black/70 text-white p-1 rounded-md text-[10px] flex items-center gap-1">
                  <Film className="size-3" />
                  <span>Vídeo</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => removeMedia(index)}
                className="absolute top-1.5 right-1.5 bg-black/70 text-white rounded-full p-1 hover:bg-black z-30 transition-colors"
                aria-label="Remover mídia"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between items-center border-t border-border pt-3 mt-1">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl h-8 text-xs font-semibold"
          >
            <ImagePlus className="size-4 mr-1.5 text-primary" />
            Foto / Vídeo
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={handleFileSelect}
          />

          {mediaUrls.length > 1 && (
            <select
              value={layoutStyle}
              onChange={(e) => setLayoutStyle(e.target.value as "grid" | "carousel")}
              className="text-xs border border-border bg-background rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-primary text-foreground font-medium"
            >
              <option value="grid">Layout em Grid</option>
              <option value="carousel">Layout em Carrossel</option>
            </select>
          )}
        </div>

        <Button
          onClick={onSubmit}
          disabled={isSubmitting || isUploadingMedia || (!content.trim() && mediaUrls.length === 0)}
          size="sm"
          className="bg-primary text-primary-foreground font-bold rounded-xl h-8 px-4 text-xs shadow-sm"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-3.5 animate-spin mr-1.5" />
              Publicando...
            </>
          ) : (
            "Publicar"
          )}
        </Button>
      </div>
    </div>
  );
}
