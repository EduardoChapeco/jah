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
import { Crop, ZoomIn, ZoomOut, Check } from "lucide-react";
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

export function ImageCropperDialog({
  open,
  onOpenChange,
  imageSrc,
  aspect: initialAspect,
  aspectRatio,
  cropShape = "rect",
  lockAspect = true,
  title = "Enquadrar Imagem",
  onCropCompleteAction,
  onCropComplete: onCropCompleteProp,
}: ImageCropperDialogProps) {
  const effectiveAspect = initialAspect ?? aspectRatio ?? (cropShape === "round" ? 1 : 1);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  React.useEffect(() => {
    if (open) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    }
  }, [open]);

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl p-0 overflow-hidden bg-card border-border sm:rounded-3xl shadow-xl select-none">
        <DialogHeader className="p-4 px-5 pb-3 border-b border-border/40">
          <DialogTitle className="flex items-center gap-2 text-sm font-bold text-foreground">
            <Crop className="size-4 text-foreground" />
            <span>{title}</span>
          </DialogTitle>
        </DialogHeader>

        {imageSrc ? (
          <div className="p-4 sm:p-5 space-y-4">
            {/* Viewport do Cropper — o aspect CSS é IDENTICAL ao aspect do corte para prev pixel-perfect */}
            <div
              className="relative w-full overflow-hidden rounded-2xl bg-black select-none border border-border/40"
              style={{
                aspectRatio: effectiveAspect,
                maxHeight: effectiveAspect > 2.5 ? "180px" : effectiveAspect > 1.5 ? "300px" : "380px",
              }}
            >
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={effectiveAspect}
                cropShape={cropShape}
                showGrid={false}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
                style={{
                  containerStyle: { background: "#09090b" },
                  cropAreaStyle: {
                    border: "2px solid #ffffff",
                    borderRadius: cropShape === "round" ? "50%" : "16px",
                    boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.75)",
                  },
                }}
              />
            </div>

            {/* Controle de Zoom Minimalista */}
            <div className="flex items-center gap-3 px-1 pt-1">
              <ZoomOut className="size-4 text-muted-foreground shrink-0" />
              <Slider
                value={[zoom]}
                min={1}
                max={3}
                step={0.02}
                onValueChange={(vals) => setZoom(vals[0])}
                className="cursor-pointer flex-1"
                aria-label="Ajuste de zoom"
              />
              <ZoomIn className="size-4 text-muted-foreground shrink-0" />
            </div>
          </div>
        ) : (
          <div className="py-16 text-center text-xs text-muted-foreground">
            Nenhuma imagem selecionada.
          </div>
        )}

        <DialogFooter className="p-3.5 px-5 flex items-center justify-between gap-2 border-t border-border/40 bg-muted/20">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-9 px-4 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            Cancelar
          </Button>

          <Button
            type="button"
            size="sm"
            disabled={isProcessing || !imageSrc}
            onClick={handleConfirm}
            className="h-9 px-5 rounded-xl text-xs font-bold bg-foreground text-background hover:bg-foreground/90 gap-1.5 cursor-pointer"
          >
            {isProcessing ? (
              <span className="size-3.5 border-2 border-background border-t-transparent rounded-full animate-spin" />
            ) : (
              <Check className="size-3.5" />
            )}
            <span>{isProcessing ? "Salvando..." : "Salvar"}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
