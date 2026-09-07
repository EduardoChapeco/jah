import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  ScanBarcode, Camera, Bluetooth, Usb, Wifi, Settings2,
  CheckCircle2, AlertTriangle, QrCode, Tag, CreditCard, Receipt,
} from "lucide-react";
import BarcodeScanner, { type ScanResult } from "./BarcodeScanner";
import { toast } from "sonner";

export type ReaderType = "usb_hid" | "camera" | "bluetooth" | "embedded";

export interface ScannerConfig {
  readerType: ReaderType;
  autoAddProduct: boolean;
  autoIncrementDuplicate: boolean;
  soundEnabled: boolean;
  vibrateEnabled: boolean;
  continuousMode: boolean;
}

const defaultConfig: ScannerConfig = {
  readerType: "usb_hid",
  autoAddProduct: true,
  autoIncrementDuplicate: true,
  soundEnabled: true,
  vibrateEnabled: true,
  continuousMode: false,
};

const READER_TYPES = [
  { value: "usb_hid", label: "Leitor USB (HID)", icon: Usb, desc: "Plug-and-play, funciona como teclado" },
  { value: "camera", label: "Câmera do dispositivo", icon: Camera, desc: "Via WebRTC, sem hardware extra" },
  { value: "bluetooth", label: "Leitor Bluetooth", icon: Bluetooth, desc: "Pareado com tablet/celular" },
  { value: "embedded", label: "Scanner embutido (mobile)", icon: Camera, desc: "Câmera traseira com foco automático" },
];

const SUPPORTED_CODES = [
  { label: "Código de barras de produto", types: "EAN-13, Code 128, UPC-A", icon: ScanBarcode },
  { label: "QR Code de produto", types: "Link ou código interno", icon: QrCode },
  { label: "QR Code de gift card", types: "Padrão GC-XXXX", icon: CreditCard },
  { label: "QR Code de credencial", types: "Módulo de evento", icon: Tag },
  { label: "QR Code de NF-e", types: "Registro de despesa", icon: Receipt },
  { label: "QR Code de cupom", types: "Desconto automático", icon: Tag },
  { label: "QR Code de ingresso", types: "Validação de entrada", icon: Tag },
  { label: "QR Code de PIX", types: "Leitura do QR do cliente", icon: QrCode },
];

interface Props {
  config?: ScannerConfig;
  onChange?: (config: ScannerConfig) => void;
}

export default function ScannerConfigPanel({ config: externalConfig, onChange }: Props) {
  const [config, setConfig] = useState<ScannerConfig>(externalConfig || defaultConfig);
  const [testOpen, setTestOpen] = useState(false);
  const [testResult, setTestResult] = useState<ScanResult | null>(null);

  const patch = (p: Partial<ScannerConfig>) => {
    const next = { ...config, ...p };
    setConfig(next);
    onChange?.(next);
  };

  const handleTestScan = (result: ScanResult) => {
    setTestResult(result);
    toast.success(`Leitura OK: ${result.type} — "${result.raw.substring(0, 40)}..."`);
  };

  return (
    <div className="space-y-6">
      {/* Reader Type */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-foreground">Tipo de Leitor</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {READER_TYPES.map(rt => {
            const Icon = rt.icon;
            const selected = config.readerType === rt.value;
            return (
              <button
                key={rt.value}
                onClick={() => patch({ readerType: rt.value as ReaderType })}
                className={`flex items-start gap-3 p-3 rounded-[var(--r3)] border text-left transition-all ${
                  selected ? "border-primary bg-primary/[0.04]" : "border-border hover:border-muted-foreground/30"
                }`}
              >
                <div className={`w-8 h-8 rounded-[var(--r2)] flex items-center justify-center shrink-0 ${
                  selected ? "bg-primary/10" : "bg-muted"
                }`}>
                  <Icon className={`w-4 h-4 ${selected ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-foreground block">{rt.label}</span>
                  <span className="text-[10px] text-muted-foreground">{rt.desc}</span>
                </div>
                {selected && (
                  <div className="w-4 h-4 rounded-full border-2 border-primary flex items-center justify-center shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* Behavior Settings */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-foreground">Comportamento</h3>
        <div className="space-y-3">
          {[
            { key: "autoAddProduct" as const, label: "Adicionar produto automaticamente", desc: "Ao escanear, produto é adicionado ao carrinho" },
            { key: "autoIncrementDuplicate" as const, label: "Incrementar duplicatas", desc: "Segundo scan do mesmo produto incrementa quantidade" },
            { key: "soundEnabled" as const, label: "Som ao escanear", desc: "Feedback sonoro na leitura" },
            { key: "vibrateEnabled" as const, label: "Vibração ao escanear", desc: "Feedback tátil (mobile)" },
            { key: "continuousMode" as const, label: "Modo contínuo (câmera)", desc: "Câmera fica aberta para múltiplas leituras" },
          ].map(opt => (
            <div key={opt.key} className="flex items-center justify-between p-3 border border-border rounded-[var(--r3)]">
              <div>
                <span className="text-xs font-medium text-foreground block">{opt.label}</span>
                <span className="text-[10px] text-muted-foreground">{opt.desc}</span>
              </div>
              <Switch checked={config[opt.key]} onCheckedChange={v => patch({ [opt.key]: v })} />
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Supported codes */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-foreground">Códigos Suportados</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {SUPPORTED_CODES.map(sc => {
            const Icon = sc.icon;
            return (
              <div key={sc.label} className="flex items-center gap-2 p-2 border border-border rounded-[var(--r2)]">
                <Icon className="w-4 h-4 text-primary shrink-0" />
                <div className="min-w-0">
                  <span className="text-[11px] font-medium text-foreground block truncate">{sc.label}</span>
                  <span className="text-[9px] text-muted-foreground">{sc.types}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* Test */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-foreground">Testar Leitor</h3>
        <Button className="w-full gap-2" onClick={() => setTestOpen(true)}>
          <Camera className="w-4 h-4" /> Abrir câmera de teste
        </Button>

        {testResult && (
          <Card className="border-primary/30">
            <CardContent className="p-3 space-y-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[hsl(var(--badge-green))]" />
                <span className="text-xs font-bold text-foreground">Última leitura</span>
              </div>
              <p className="text-[11px] text-muted-foreground font-mono break-all">{testResult.raw}</p>
              <div className="flex gap-1">
                <Badge variant="outline" className="text-[9px]">{testResult.type}</Badge>
                <Badge variant="outline" className="text-[9px]">{testResult.format}</Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <BarcodeScanner
        open={testOpen}
        onClose={() => setTestOpen(false)}
        onScan={handleTestScan}
        title="Testar Scanner"
      />
    </div>
  );
}
