import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { StepProps } from "./types";
import { Plus, Trash2, Loader2, MapPin } from "lucide-react";

interface AddressEntry {
  label: string;
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
}

const emptyAddress: AddressEntry = {
  label: "",
  cep: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
};

export function LocationStep({ data, onChange }: StepProps) {
  const [loadingCep, setLoadingCep] = useState<number | null>(null);

  // Multi-address: store extra addresses in additionalAddresses
  const [additionalAddresses, setAdditionalAddresses] = useState<AddressEntry[]>([]);

  const fetchCep = async (cep: string, applyTo: "primary" | number) => {
    const clean = cep.replace(/\D/g, "");
    if (clean.length !== 8) return;
    setLoadingCep(applyTo === "primary" ? -1 : applyTo);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      const json = await res.json();
      if (!json.erro) {
        if (applyTo === "primary") {
          onChange({
            street: json.logradouro || "",
            neighborhood: json.bairro || "",
            city: json.localidade || "",
            state: json.uf || "",
          });
        } else {
          const updated = [...additionalAddresses];
          updated[applyTo] = {
            ...updated[applyTo],
            street: json.logradouro || "",
            neighborhood: json.bairro || "",
            city: json.localidade || "",
            state: json.uf || "",
          };
          setAdditionalAddresses(updated);
        }
      }
    } catch {
      // silently fail
    } finally {
      setLoadingCep(null);
    }
  };

  const addSocialLink = () => {
    onChange({ socialLinks: [...data.socialLinks, ""] });
  };

  const updateSocialLink = (index: number, value: string) => {
    const links = [...data.socialLinks];
    links[index] = value;
    onChange({ socialLinks: links });
  };

  const removeSocialLink = (index: number) => {
    onChange({ socialLinks: data.socialLinks.filter((_, i) => i !== index) });
  };

  const addAddress = () => {
    setAdditionalAddresses([...additionalAddresses, { ...emptyAddress }]);
  };

  const updateAddress = (index: number, field: keyof AddressEntry, value: string) => {
    const updated = [...additionalAddresses];
    updated[index] = { ...updated[index], [field]: value };
    setAdditionalAddresses(updated);

    if (field === "cep") {
      const clean = value.replace(/\D/g, "").slice(0, 8);
      updated[index].cep = clean;
      setAdditionalAddresses(updated);
      if (clean.length === 8) fetchCep(clean, index);
    }
  };

  const removeAddress = (index: number) => {
    setAdditionalAddresses(additionalAddresses.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-2xl mx-auto px-4 space-y-6">
      <h1 className="text-2xl font-bold text-foreground text-center">
        Localização e contato
      </h1>

      {/* Online only toggle */}
      <div className="flex items-center justify-between p-4 rounded-xl border bg-card">
        <div>
          <p className="font-medium text-foreground">Loja somente online</p>
          <p className="text-sm text-muted-foreground">Oculta endereço público</p>
        </div>
        <Switch
          checked={data.onlineOnly}
          onCheckedChange={(v) => onChange({ onlineOnly: v })}
        />
      </div>

      {/* Primary Address */}
      {!data.onlineOnly && (
        <>
          <div className="space-y-4 p-4 rounded-xl border bg-card">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="h-4 w-4 text-primary" />
              <Label className="text-sm font-semibold">Endereço principal</Label>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1 space-y-1">
                <Label className="text-xs">CEP *</Label>
                <div className="relative">
                  <Input
                    value={data.cep}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "").slice(0, 8);
                      onChange({ cep: v });
                      if (v.length === 8) fetchCep(v, "primary");
                    }}
                    placeholder="00000-000"
                    maxLength={9}
                  />
                  {loadingCep === -1 && (
                    <Loader2 className="h-4 w-4 animate-spin absolute right-3 top-3 text-muted-foreground" />
                  )}
                </div>
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">Rua</Label>
                <Input
                  value={data.street}
                  onChange={(e) => onChange({ street: e.target.value })}
                  maxLength={200}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Número</Label>
                <Input
                  value={data.number}
                  onChange={(e) => onChange({ number: e.target.value })}
                  maxLength={10}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Complemento</Label>
                <Input
                  value={data.complement}
                  onChange={(e) => onChange({ complement: e.target.value })}
                  maxLength={100}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Bairro</Label>
                <Input
                  value={data.neighborhood}
                  onChange={(e) => onChange({ neighborhood: e.target.value })}
                  maxLength={100}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Cidade</Label>
                <Input
                  value={data.city}
                  onChange={(e) => onChange({ city: e.target.value })}
                  maxLength={100}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Estado</Label>
                <Input
                  value={data.state}
                  onChange={(e) => onChange({ state: e.target.value })}
                  maxLength={2}
                />
              </div>
            </div>
          </div>

          {/* Additional Addresses */}
          {additionalAddresses.map((addr, i) => (
            <div key={i} className="space-y-4 p-4 rounded-xl border bg-card relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm font-semibold">Endereço {i + 2}</Label>
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeAddress(i)} className="text-destructive h-7">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Apelido (ex: Filial Centro)</Label>
                <Input
                  value={addr.label}
                  onChange={(e) => updateAddress(i, "label", e.target.value)}
                  placeholder="Nome do local"
                  maxLength={60}
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1 space-y-1">
                  <Label className="text-xs">CEP</Label>
                  <div className="relative">
                    <Input
                      value={addr.cep}
                      onChange={(e) => updateAddress(i, "cep", e.target.value)}
                      placeholder="00000-000"
                      maxLength={9}
                    />
                    {loadingCep === i && (
                      <Loader2 className="h-4 w-4 animate-spin absolute right-3 top-3 text-muted-foreground" />
                    )}
                  </div>
                </div>
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs">Rua</Label>
                  <Input
                    value={addr.street}
                    onChange={(e) => updateAddress(i, "street", e.target.value)}
                    maxLength={200}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Número</Label>
                  <Input value={addr.number} onChange={(e) => updateAddress(i, "number", e.target.value)} maxLength={10} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Complemento</Label>
                  <Input value={addr.complement} onChange={(e) => updateAddress(i, "complement", e.target.value)} maxLength={100} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Bairro</Label>
                  <Input value={addr.neighborhood} onChange={(e) => updateAddress(i, "neighborhood", e.target.value)} maxLength={100} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Cidade</Label>
                  <Input value={addr.city} onChange={(e) => updateAddress(i, "city", e.target.value)} maxLength={100} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Estado</Label>
                  <Input value={addr.state} onChange={(e) => updateAddress(i, "state", e.target.value)} maxLength={2} />
                </div>
              </div>
            </div>
          ))}

          <Button type="button" variant="outline" size="sm" onClick={addAddress} className="w-full">
            <Plus className="h-4 w-4 mr-1" /> Adicionar outro local
          </Button>
        </>
      )}

      {/* Contact */}
      <div className="space-y-4">
        <div className="space-y-1">
          <Label>WhatsApp de atendimento *</Label>
          <Input
            value={data.whatsapp}
            onChange={(e) => onChange({ whatsapp: e.target.value })}
            placeholder="(11) 99999-9999"
            maxLength={20}
          />
        </div>
        <div className="space-y-1">
          <Label>Email de atendimento</Label>
          <Input
            value={data.email}
            onChange={(e) => onChange({ email: e.target.value })}
            placeholder="contato@sualoja.com"
            type="email"
            maxLength={100}
          />
        </div>
        <div className="space-y-1">
          <Label>Site externo</Label>
          <Input
            value={data.website}
            onChange={(e) => onChange({ website: e.target.value })}
            placeholder="https://sualoja.com"
            maxLength={200}
          />
        </div>
      </div>

      {/* Social links */}
      <div className="space-y-3">
        <Label>Redes sociais</Label>
        {data.socialLinks.map((link, i) => (
          <div key={i} className="flex gap-2">
            <Input
              value={link}
              onChange={(e) => updateSocialLink(i, e.target.value)}
              placeholder="https://instagram.com/sualoja"
              maxLength={200}
            />
            {data.socialLinks.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeSocialLink(i)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addSocialLink}>
          <Plus className="h-4 w-4 mr-1" /> Adicionar rede
        </Button>
      </div>
    </div>
  );
}
