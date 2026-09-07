import { Camera } from "lucide-react";
import { useState } from "react";

export interface CompanyData {
  name: string;
  cnpj: string;
  city: string;
  state: string;
  whatsapp: string;
  logoFile: File | null;
}

interface CompanyDataStepProps {
  data: CompanyData;
  onChange: (data: CompanyData) => void;
}

export function CompanyDataStep({ data, onChange }: CompanyDataStepProps) {
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const update = (field: keyof CompanyData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return;
    update("logoFile", file);
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      <h2 style={{ fontSize: 16, fontWeight: 800, color: "hsl(var(--text-primary))", marginBottom: 4 }}>
        Dados do negócio
      </h2>
      <p style={{ fontSize: 12, color: "hsl(var(--text-tertiary))", marginBottom: 8 }}>
        Máximo 5 campos. Você pode completar depois.
      </p>

      {/* Logo */}
      <div className="flex items-center gap-4">
        <label
          className="cursor-pointer"
          style={{
            width: 64, height: 64, borderRadius: 12,
            border: "2px dashed hsl(var(--b3, var(--b2)))",
            display: "flex", alignItems: "center", justifyContent: "center",
            overflow: "hidden", flexShrink: 0,
            background: "hsl(var(--b2))",
          }}
        >
          {logoPreview ? (
            <img src={logoPreview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <Camera size={20} style={{ color: "hsl(var(--text-quaternary))" }} />
          )}
          <input type="file" accept="image/*" onChange={handleLogoSelect} className="hidden" />
        </label>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "hsl(var(--text-primary))" }}>Logo</div>
          <div style={{ fontSize: 10, color: "hsl(var(--text-quaternary))" }}>Opcional · Máx. 5MB</div>
        </div>
      </div>

      {/* Name */}
      <div className="input-wrap">
        <label className="input-label">Nome do negócio <span className="input-required">*</span></label>
        <input
          className="input"
          value={data.name}
          onChange={(e) => update("name", e.target.value)}
          placeholder="Ex: Pizzaria do João"
          maxLength={100}
        />
      </div>

      {/* Location */}
      <div className="grid grid-cols-2 gap-3">
        <div className="input-wrap">
          <label className="input-label">Cidade</label>
          <input
            className="input"
            value={data.city}
            onChange={(e) => update("city", e.target.value)}
            placeholder="São Paulo"
            maxLength={100}
          />
        </div>
        <div className="input-wrap">
          <label className="input-label">Estado</label>
          <input
            className="input"
            value={data.state}
            onChange={(e) => update("state", e.target.value)}
            placeholder="SP"
            maxLength={2}
          />
        </div>
      </div>

      {/* WhatsApp */}
      <div className="input-wrap">
        <label className="input-label">WhatsApp</label>
        <input
          className="input"
          value={data.whatsapp}
          onChange={(e) => update("whatsapp", e.target.value)}
          placeholder="(11) 99999-9999"
          maxLength={15}
        />
      </div>

      {/* CNPJ */}
      <div className="input-wrap">
        <label className="input-label">CNPJ</label>
        <input
          className="input"
          value={data.cnpj}
          onChange={(e) => update("cnpj", e.target.value)}
          placeholder="Opcional para MEI e informais"
          maxLength={18}
        />
        <p style={{ fontSize: 10, color: "hsl(var(--text-quaternary))", marginTop: 4 }}>
          Opcional. Necessário para emitir nota fiscal.
        </p>
      </div>
    </div>
  );
}
