import { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Camera, ScanBarcode, X, Flashlight, SwitchCamera, Loader2 } from "lucide-react";
import { toast } from "sonner";

export type ScanResultType =
  | "product_barcode"
  | "product_qr"
  | "gift_card"
  | "credential"
  | "nfe"
  | "coupon"
  | "ticket"
  | "pix"
  | "unknown";

export interface ScanResult {
  raw: string;
  type: ScanResultType;
  format: string;
}

interface BarcodeScannerProps {
  open: boolean;
  onClose: () => void;
  onScan: (result: ScanResult) => void;
  title?: string;
  acceptTypes?: ScanResultType[];
}

// Classify scanned code
function classifyCode(raw: string): Omit<ScanResult, "format"> {
  const trimmed = raw.trim();

  // Gift card: starts with GC-
  if (/^GC-/i.test(trimmed)) return { raw: trimmed, type: "gift_card" };

  // NF-e QR (contains chNFe or NFe pattern)
  if (/chNFe|nfe\.fazenda|sefaz/i.test(trimmed)) return { raw: trimmed, type: "nfe" };

  // PIX: starts with 00020126 (EMV format) or contains pix.bcb
  if (trimmed.startsWith("00020126") || /pix\.bcb|br\.gov\.bcb/i.test(trimmed))
    return { raw: trimmed, type: "pix" };

  // Coupon: starts with CUPOM- or PROMO-
  if (/^(CUPOM|PROMO|DESC)-/i.test(trimmed)) return { raw: trimmed, type: "coupon" };

  // Credential: starts with CRED- or credential format
  if (/^CRED-/i.test(trimmed)) return { raw: trimmed, type: "credential" };

  // Ticket: starts with TKT- or INGR-
  if (/^(TKT|INGR)-/i.test(trimmed)) return { raw: trimmed, type: "ticket" };

  // HTTP URL that matches product pattern
  if (/^https?:\/\//i.test(trimmed) && /produto|product|item/i.test(trimmed))
    return { raw: trimmed, type: "product_qr" };

  // Pure numeric: barcode
  if (/^\d{8,14}$/.test(trimmed)) return { raw: trimmed, type: "product_barcode" };

  // If it looks like a URL, classify based on content
  if (/^https?:\/\//i.test(trimmed)) return { raw: trimmed, type: "unknown" };

  // Fallback: try as product barcode if alphanumeric
  if (/^[A-Z0-9-]{3,30}$/i.test(trimmed)) return { raw: trimmed, type: "product_barcode" };

  return { raw: trimmed, type: "unknown" };
}

export default function BarcodeScanner({ open, onClose, onScan, title = "Scanner", acceptTypes }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scannerRef = useRef<any>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [lastScanned, setLastScanned] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (scannerRef.current) {
      scannerRef.current = null;
    }
    setScanning(false);
  }, []);

  const startCamera = useCallback(async () => {
    setError(null);
    setScanning(true);
    setLastScanned(null);

    try {
      const { Html5Qrcode } = await import("html5-qrcode");

      // Clean up any previous scanner
      if (scannerRef.current) {
        try { await scannerRef.current.stop(); } catch {}
        scannerRef.current = null;
      }

      const scannerId = "barcode-scanner-reader";
      const el = document.getElementById(scannerId);
      if (!el) {
        setError("Elemento do scanner não encontrado");
        setScanning(false);
        return;
      }

      const scanner = new Html5Qrcode(scannerId);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode },
        {
          fps: 10,
          qrbox: { width: 280, height: 280 },
          aspectRatio: 1,
        },
        (decodedText: string) => {
          // Debounce same scan
          if (decodedText === lastScanned) return;
          setLastScanned(decodedText);

          const classified = classifyCode(decodedText);
          const result: ScanResult = { ...classified, format: "auto" };

          if (acceptTypes && !acceptTypes.includes(result.type)) {
            toast.error(`Tipo "${result.type}" não aceito neste contexto`);
            return;
          }

          // Vibrate if available
          if (navigator.vibrate) navigator.vibrate(100);

          onScan(result);
          handleClose();
        },
        () => {
          // No scan yet — ignore
        }
      );
    } catch (err: any) {
      console.error("Scanner error:", err);
      if (err?.name === "NotAllowedError") {
        setError("Permissão da câmera negada. Habilite nas configurações do navegador.");
      } else if (err?.name === "NotFoundError") {
        setError("Nenhuma câmera encontrada neste dispositivo.");
      } else {
        setError("Erro ao iniciar câmera: " + (err?.message || "desconhecido"));
      }
      setScanning(false);
    }
  }, [facingMode, lastScanned, acceptTypes, onScan]);

  const handleClose = useCallback(async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch {}
      scannerRef.current = null;
    }
    stopCamera();
    onClose();
  }, [stopCamera, onClose]);

  useEffect(() => {
    if (open) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => startCamera(), 300);
      return () => clearTimeout(timer);
    } else {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
      stopCamera();
    }
  }, [open]);

  const toggleCamera = async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch {}
      scannerRef.current = null;
    }
    setFacingMode(prev => prev === "environment" ? "user" : "environment");
    setTimeout(() => startCamera(), 300);
  };

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) handleClose(); }}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="flex items-center gap-2 text-base">
            <ScanBarcode className="w-5 h-5 text-primary" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="relative bg-black">
          {/* Scanner container */}
          <div id="barcode-scanner-reader" className="w-full" style={{ minHeight: 320 }} />

          {/* Overlay controls */}
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2 z-10">
            <Button size="sm" variant="secondary" className="gap-1.5 bg-background/80 backdrop-blur-sm" onClick={toggleCamera}>
              <SwitchCamera className="w-4 h-4" /> Trocar câmera
            </Button>
          </div>

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-20">
              <div className="text-center p-6 space-y-3">
                <Camera className="w-12 h-12 text-muted-foreground mx-auto opacity-50" />
                <p className="text-sm text-destructive font-medium">{error}</p>
                <Button size="sm" variant="secondary" onClick={() => startCamera()}>
                  Tentar novamente
                </Button>
              </div>
            </div>
          )}

          {scanning && !error && (
            <div className="absolute top-3 right-3 z-10">
              <Badge className="bg-destructive/90 text-destructive-foreground text-[10px] gap-1 animate-pulse">
                <div className="w-1.5 h-1.5 rounded-full bg-white" /> LENDO
              </Badge>
            </div>
          )}
        </div>

        <div className="px-4 pb-4 space-y-2">
          <p className="text-xs text-muted-foreground text-center">
            Aponte a câmera para o código de barras ou QR Code
          </p>
          <div className="flex flex-wrap gap-1 justify-center">
            {["EAN-13", "Code 128", "QR Code", "UPC-A"].map(f => (
              <Badge key={f} variant="outline" className="text-[9px]">{f}</Badge>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ═══════════════════════════════════════════
// USB HID Scanner Hook (keyboard-mode readers)
// ═══════════════════════════════════════════
export function useUSBScanner(options: {
  enabled: boolean;
  onScan: (result: ScanResult) => void;
  debounceMs?: number;
}) {
  const { enabled, onScan, debounceMs = 50 } = options;
  const bufferRef = useRef("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const handler = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === "Enter" && bufferRef.current.length >= 4) {
        e.preventDefault();
        const code = bufferRef.current.trim();
        bufferRef.current = "";
        if (timerRef.current) clearTimeout(timerRef.current);

        const classified = classifyCode(code);
        const result: ScanResult = { ...classified, format: "usb_hid" };

        if (navigator.vibrate) navigator.vibrate(50);
        onScan(result);
        return;
      }

      // Only collect printable characters
      if (e.key.length === 1) {
        bufferRef.current += e.key;

        // Reset buffer after debounce (human typing is slower than scanner)
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          bufferRef.current = "";
        }, debounceMs);
      }
    };

    window.addEventListener("keydown", handler, { capture: true });
    return () => window.removeEventListener("keydown", handler, { capture: true });
  }, [enabled, onScan, debounceMs]);
}

export { classifyCode };
