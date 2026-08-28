import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import getCroppedImg from "@/lib/crop-image";
import { Crop, ZoomIn, Check, Lock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ImageCropperDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string | null;
  aspect?: number;
  aspectRatio?: number;
  cropShape?: "rect" | "round";
  lockAspect?: boolean;
  title?: string;
  description?: string;
  onCropCompleteAction?: (croppedBase64: string) => void;
  onCropComplete?: (croppedBlob: Blob) => void | Promise<void>;
}

export const CROP_PRESETS = [
  { id: "21:9", label: "21:9 Banner Panorâmico", value: 21 / 9 },
  { id: "16:9", label: "16:9 Card / Destaque", value: 16 / 9 },
  { id: "4:3", label: "4:3 Anúncio / Imóvel", value: 4 / 3 },
  { id: "1:1", label: "1:1 Quadrado / Ícone", value: 1 },
  { id: "3:1", label: "3:1 Header Estreito", value: 3 },
  { id: "free", label: "Livre", value: undefined },
] as const;

export function ImageCropperDialog({
  open,
  onOpenChange,
  imageSrc,
  aspect: initialAspect,
  aspectRatio,
  cropShape = "rect",
  lockAspect = true, // Por padrão, trava no aspect ratio exato do container visual
  title,
  description,
  onCropCompleteAction,
  onCropComplete: onCropCompleteProp,
}: ImageCropperDialogProps) {
  const effectiveAspect = initialAspect ?? aspectRatio ?? (cropShape === "round" ? 1 : 21 / 9);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [selectedAspect, setSelectedAspect] = useState<number | undefined>(effectiveAspect);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Sincroniza o aspect ratio com o container visual exato ao abrir o modal
  React.useEffect(() => {
    if (open) {
      setSelectedAspect(effectiveAspect);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    }
  }, [open, effectiveAspect]);

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    setIsProcessing(true);
    try {
      const croppedImage = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        0,
        { horizontal: false, vertical: false },
        "image/png",
      );

      if (onCropCompleteProp) {
        const res = await fetch(croppedImage);
        const blob = await res.blob();
        await onCropCompleteProp(blob);
      }
      if (onCropCompleteAction) {
        onCropCompleteAction(croppedImage);
      }
      onOpenChange(false);
    } catch (e) {
      console.error("Erro ao recortar imagem:", e);
    } finally {
      setIsProcessing(false);
    }
  };

  const getAspectLabel = () => {
    if (cropShape === "round") return "1:1 (Avatar Circular)";
    if (selectedAspect === undefined) return "Livre (Sem restrição)";
    if (Math.abs(selectedAspect - 21 / 9) < 0.08) return "21:9 (Banner Panorâmico)";
    if (Math.abs(selectedAspect - 16 / 9) < 0.08) return "16:9 (Card Grande / Destaque)";
    if (Math.abs(selectedAspect - 4 / 3) < 0.08) return "4:3 (Card Anúncio / Imóvel)";
    if (Math.abs(selectedAspect - 1) < 0.08) return "1:1 (Ícone Transparente / Produto)";
    if (Math.abs(selectedAspect - 3) < 0.1) return "3:1 (Header Estreito)";
    return `${selectedAspect.toFixed(2)}:1 (Frame do Componente)`;
  };

  const dynamicTitle =
    title ||
    (Math.abs((selectedAspect || 0) - 21 / 9) < 0.08
      ? "Enquadrar Banner Panorâmico (21:9)"
      : Math.abs((selectedAspect || 0) - 16 / 9) < 0.08
      ? "Enquadrar Card Grande Hero (16:9)"
      : Math.abs((selectedAspect || 0) - 1) < 0.08
      ? "Enquadrar Ícone / Imagem (1:1)"
      : "Ajustar e Recortar Imagem");

  const dynamicDescription =
    description ||
    `A máscara de recorte está travada nas medidas exatas do frame onde a imagem será exibida (${getAspectLabel()}).`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden bg-card border-border sm:rounded-3xl">
        <DialogHeader className="p-5 pb-3 bg-muted/20 border-b border-border/40">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <Crop className="size-4.5 text-primary" />
              <span>{dynamicTitle}</span>
            </DialogTitle>

            <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold bg-primary/10 text-primary px-2.5 py-0.5 rounded-full border border-primary/20">
              <Lock className="size-3" />
              {getAspectLabel()}
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed mt-1">
            {dynamicDescription}
          </p>
        </DialogHeader>

        {imageSrc ? (
          <div className="p-5 space-y-4">
            {/* Viewport do Cropper */}
            <div className="relative w-full h-[340px] sm:h-[400px] overflow-hidden rounded-2xl bg-black/95 select-none border border-border/40">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={selectedAspect}
                cropShape={cropShape}
                showGrid={true}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
                style={{
                  containerStyle: { background: "rgba(0,0,0,0.92)" },
                  cropAreaStyle: {
                    border: "2px solid var(--color-primary)",
                    borderRadius: cropShape === "round" ? "50%" : "12px",
                    boxShadow: "0 0 0 9999px rgba(0,0,0,0.72)",
                  },
                }}
              />
            </div>

            {/* Presets de Proporção (Apenas se lockAspect for explicitamente false) */}
            {!lockAspect && cropShape !== "round" && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs px-1">
                  <span className="font-semibold text-muted-foreground text-[11px]">Proporção Alternativa:</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  {CROP_PRESETS.map((preset) => {
                    const isSelected =
                      preset.value === undefined
                        ? selectedAspect === undefined
                        : selectedAspect !== undefined &&
                          Math.abs(selectedAspect - preset.value) < 0.05;

                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setSelectedAspect(preset.value)}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border cursor-pointer",
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary shadow-xs"
                            : "bg-surface-paper border-border/80 text-muted-foreground hover:text-foreground hover:border-primary/40",
                        )}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Controle de Zoom */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                <span className="flex items-center gap-1">
                  <ZoomIn className="size-3.5" />
                  <span>Ajuste de Zoom / Enquadramento</span>
                </span>
                <span className="font-mono text-foreground font-bold">{Math.round(zoom * 100)}%</span>
              </div>
              <Slider
                value={[zoom]}
                min={1}
                max={3}
                step={0.05}
                onValueChange={(vals) => setZoom(vals[0])}
                className="cursor-pointer"
              />
            </div>
          </div>
        ) : (
          <div className="py-16 text-center text-xs text-muted-foreground">
            Nenhuma imagem selecionada para recorte.
          </div>
        )}

        <DialogFooter className="p-4 pt-3 flex items-center justify-between gap-2 bg-muted/20 border-t border-border/40">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-9 px-4 rounded-xl text-xs font-bold"
          >
            Cancelar
          </Button>

          <Button
            type="button"
            size="sm"
            disabled={isProcessing || !imageSrc}
            onClick={handleConfirm}
            className="h-9 px-5 rounded-xl text-xs font-bold bg-primary text-primary-foreground gap-1.5"
          >
            <Check className="size-4" />
            <span>{isProcessing ? "Recortando..." : "Aplicar Recorte Exato"}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
