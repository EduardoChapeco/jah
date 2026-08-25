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
import { Crop, ZoomIn, Check, X } from "lucide-react";

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

export function ImageCropperDialog({
  open,
  onOpenChange,
  imageSrc,
  aspect: initialAspect,
  aspectRatio,
  cropShape = "rect",
  lockAspect = true,
  title = "Ajustar e Recortar Imagem",
  description = "Posicione e ajuste o zoom para enquadrar perfeitamente na proporção recomendada.",
  onCropCompleteAction,
  onCropComplete: onCropCompleteProp,
}: ImageCropperDialogProps) {
  const effectiveAspect = initialAspect ?? aspectRatio ?? 1;
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [selectedAspect, setSelectedAspect] = useState<number | undefined>(effectiveAspect);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Sync aspect when prop changes or modal reopens
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
        // Convert base64 to Blob
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
    if (cropShape === "round" || selectedAspect === 1) return "1:1 (Quadrada / Circular)";
    if (Math.abs((selectedAspect || 0) - 3) < 0.1 || Math.abs((selectedAspect || 0) - 16 / 6) < 0.2) return "3:1 (Capa Panorâmica)";
    if (Math.abs((selectedAspect || 0) - 16 / 9) < 0.1) return "16:9 (Panorâmica)";
    if (Math.abs((selectedAspect || 0) - 4 / 3) < 0.1) return "4:3 (Padrão Anúncio)";
    return "Proporção Fixa do Destino";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 overflow-hidden bg-card border-border  rounded-3xl">
        <DialogHeader className="p-5 pb-3 ">
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
            <Crop className="size-4.5 text-primary" />
            <span>{title}</span>
          </DialogTitle>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {description}
          </p>
        </DialogHeader>

        {imageSrc ? (
          <div className="p-5 space-y-4">
            {/* Viewport do Cropper */}
            <div className="relative w-full h-[320px] sm:h-[360px] overflow-hidden  rounded-2xl bg-muted/40 select-none">
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
                  containerStyle: { background: "rgba(0,0,0,0.85)" },
                  cropAreaStyle: {
                    border: "2px solid var(--color-primary)",
                    borderRadius: cropShape === "round" ? "50%" : "16px",
                    boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
                  },
                }}
              />
            </div>

            {/* Identificação da Faca Única Contextual */}
            <div className="flex items-center justify-between text-xs px-1">
              <div className="flex items-center gap-1.5 font-bold text-muted-foreground">
                <span>Enquadramento:</span>
                <span className="text-foreground font-mono bg-muted/60 px-2 py-0.5 rounded-md text-[11px]">
                  {getAspectLabel()}
                </span>
              </div>

              {!lockAspect && (
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant={selectedAspect === 1 ? "default" : "outline"}
                    size="sm"
                    className="h-7 px-2 text-[10px]"
                    onClick={() => setSelectedAspect(1)}
                  >
                    1:1
                  </Button>
                  <Button
                    type="button"
                    variant={selectedAspect === 4 / 3 ? "default" : "outline"}
                    size="sm"
                    className="h-7 px-2 text-[10px]"
                    onClick={() => setSelectedAspect(4 / 3)}
                  >
                    4:3
                  </Button>
                  <Button
                    type="button"
                    variant={selectedAspect === 16 / 9 ? "default" : "outline"}
                    size="sm"
                    className="h-7 px-2 text-[10px]"
                    onClick={() => setSelectedAspect(16 / 9)}
                  >
                    16:9
                  </Button>
                </div>
              )}
            </div>

            {/* Controle de Zoom */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                <span className="flex items-center gap-1">
                  <ZoomIn className="size-3.5" />
                  <span>Ajuste de Zoom</span>
                </span>
                <span className="font-mono">{Math.round(zoom * 100)}%</span>
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

        <DialogFooter className="p-4 pt-3  flex items-center justify-between gap-2 bg-muted/20">
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
            className="h-9 px-5 rounded-xl text-xs font-bold bg-primary text-primary-foreground gap-1.5 "
          >
            <Check className="size-4" />
            <span>{isProcessing ? "Recortando..." : "Aplicar Recorte"}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
