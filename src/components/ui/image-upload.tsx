import { useState, useRef } from "react";
import { Upload, X, Loader2, Crop } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ImageCropperDialog } from "@/components/ui/image-cropper-dialog";

export type AspectRatioPreset = "square" | "classified" | "widescreen" | "banner" | "header" | "free";

const PRESET_ASPECT_RATIOS: Record<AspectRatioPreset, number | undefined> = {
  square: 1, // 1:1 (Produtos, Logos, Avatars)
  classified: 4 / 3, // 4:3 (Classificados, Carros, Imóveis)
  widescreen: 16 / 10, // 16:10 ou 16:9 (Turismo, Notícias, Capas)
  banner: 21 / 9, // 21:9 (Top Banners Hero)
  header: 4 / 1, // 4:1 (Banners Panorâmicos de Topo)
  free: undefined, // Livre
};

interface ImageUploadProps {
  value?: string | null;
  onChange: (url: string) => void;
  onRemove?: () => void;
  bucket?: "product-media" | "cms-media";
  className?: string;
  variant?: "default" | "minimal";
  aspect?: number;
  aspectPreset?: AspectRatioPreset;
  helperText?: string;
}

export function ImageUpload({
  value,
  onChange,
  onRemove,
  bucket = "cms-media",
  className,
  variant = "default",
  aspect,
  aspectPreset = "square",
  helperText,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Resolved aspect ratio
  const effectiveAspect = aspect !== undefined ? aspect : PRESET_ASPECT_RATIOS[aspectPreset];

  // Crop state
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [currentImageFile, setCurrentImageFile] = useState<File | null>(null);
  const [currentImageSrc, setCurrentImageSrc] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCurrentImageFile(file);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setCurrentImageSrc(reader.result as string);
      setCropModalOpen(true);
    };
    reader.onerror = () => toast.error("Erro ao processar arquivo local");

    // Reset input
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleCropComplete = async (croppedBase64: string) => {
    if (!currentImageFile) return;
    setIsUploading(true);
    try {
      try {
        const { getSignedUploadUrl } = await import("@/services/storage.functions");
        const res = await getSignedUploadUrl({
          data: {
            fileName: currentImageFile.name,
            bucket,
            contentType: currentImageFile.type,
          },
        });

        if (res.signedUrl) {
          // Convert base64 to Blob for PUT request
          const base64Data = croppedBase64.split(",")[1];
          const byteCharacters = atob(base64Data);
          const byteArrays = [];
          for (let offset = 0; offset < byteCharacters.length; offset += 512) {
            const slice = byteCharacters.slice(offset, offset + 512);
            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
              byteNumbers[i] = slice.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
          }
          const mimeType = croppedBase64.startsWith("data:image/png") ? "image/png" : "image/webp";
          const blob = new Blob(byteArrays, { type: mimeType });

          // Upload directly to Supabase Storage via Signed URL
          const uploadRes = await fetch(res.signedUrl, {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${res.token}`,
              "Content-Type": mimeType,
            },
            body: blob,
          });

          if (uploadRes.ok && res.publicUrl) {
            onChange(res.publicUrl);
            toast.success("Imagem recortada e salva com sucesso!");
            return;
          }
        }
      } catch (signedErr) {
        console.warn("[ImageUpload] Signed URL falhou, usando fallback direto base64:", signedErr);
      }

      // Fallback resiliente via Server Function (service_role)
      const { uploadMediaUniversal } = await import("@/services/storage.functions");
      const fallbackRes = await uploadMediaUniversal({
        data: {
          fileName: currentImageFile.name,
          fileType: currentImageFile.type || "image/jpeg",
          base64Data: croppedBase64,
          bucket,
          folder: "uploads",
        },
      });

      if (fallbackRes?.url) {
        onChange(fallbackRes.url);
        toast.success("Imagem recortada e salva com sucesso!");
      } else {
        throw new Error("Falha ao processar upload da imagem no servidor");
      }
    } catch (error: unknown) {
      toast.error(
        (error instanceof Error ? error.message : String(error)) ||
          "Erro ao fazer upload da imagem",
      );
    } finally {
      setIsUploading(false);
    }
  };

  const getPresetLabel = () => {
    switch (aspectPreset) {
      case "square":
        return "1:1 (Quadrado Padronizado)";
      case "classified":
        return "4:3 (Classificados & Imóveis)";
      case "widescreen":
        return "16:10 (Panorâmico Turismo/Notícias)";
      case "banner":
        return "21:9 (Top Banner Hero)";
      case "header":
        return "4:1 (Cabeçalho da Vitrine)";
      default:
        return "Recorte Ajustável";
    }
  };

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {value ? (
        <div className="relative min-h-[120px] max-h-[220px] w-full max-w-sm overflow-hidden  rounded-2xl p-3 bg-[linear-gradient(45deg,#e2e8f0_25%,transparent_25%),linear-gradient(-45deg,#e2e8f0_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e2e8f0_75%),linear-gradient(-45deg,transparent_75%,#e2e8f0_75%)] bg-[length:16px_16px] bg-[position:0_0,0_8px,8px_-8px,-8px_0px] bg-muted/30 flex items-center justify-center  group">
          <img src={value} alt="Upload" className="max-h-40 w-auto max-w-full object-contain rounded-xl" />
          <div className="absolute right-2 top-2 flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 rounded-full  bg-background/90 hover:bg-background"
              onClick={() => {
                setCurrentImageSrc(value);
                setCropModalOpen(true);
              }}
              type="button"
              title="Ajustar recorte da imagem"
            >
              <Crop className="h-4 w-4 text-foreground" />
            </Button>
            {onRemove && (
              <Button
                variant="destructive"
                size="icon"
                className="h-8 w-8 rounded-full "
                onClick={onRemove}
                type="button"
                title="Remover imagem"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      ) : variant === "minimal" ? (
        <div
          onClick={() => inputRef.current?.click()}
          className="flex h-full w-full items-center justify-center rounded-2xl border-0/80 bg-muted/40 hover:bg-muted/70 cursor-pointer transition-colors p-4"
          title="Clique para selecionar e recortar imagem"
        >
          {isUploading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <div className="flex flex-col items-center gap-1 text-muted-foreground">
              <Upload className="h-5 w-5" />
              <span className="text-[11px] font-semibold">{getPresetLabel()}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="flex aspect-video w-full max-w-sm flex-col items-center justify-center gap-2 border-0/80 rounded-2xl bg-muted/40 p-6 hover:bg-muted/60 transition-colors ">
          <div className="rounded-2xl bg-background p-3  ">
            <Upload className="h-5 w-5 text-primary" />
          </div>
          <div className="text-center">
            <p className="text-xs font-bold text-foreground">Clique para enviar e recortar</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {helperText || `Máscara recomendada: ${getPresetLabel()}`}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-1 rounded-xl text-xs font-bold h-8"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : "Selecionar e Recortar"}
          </Button>
        </div>
      )}
      <input
        type="file"
        ref={inputRef}
        className="hidden"
        accept="image/png, image/jpeg, image/webp, image/gif, image/svg+xml"
        onChange={handleFileChange}
      />
      <ImageCropperDialog
        open={cropModalOpen}
        onOpenChange={setCropModalOpen}
        imageSrc={currentImageSrc}
        aspect={effectiveAspect}
        onCropCompleteAction={handleCropComplete}
      />
    </div>
  );
}
