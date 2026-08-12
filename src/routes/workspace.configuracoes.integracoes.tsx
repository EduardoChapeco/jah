import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Plug, Save, CheckCircle, Trash2, Key, BarChart, Facebook } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/commerce/page-header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

import { listIntegrationSettings, saveIntegrationCredential, deleteIntegrationCredential } from "@/services/integrations.functions";

export const Route = createFileRoute("/workspace/configuracoes/integracoes")({
  head: () => ({ meta: [{ title: "Integrações & APIs" }] }),
  loader: async () => {
    return await listIntegrationSettings();
  },
  component: IntegrationsPage,
});

function IntegrationCard({ 
  provider, 
  title, 
  description, 
  icon: Icon, 
  fields, 
  existingSetting, 
  onSave, 
  onDelete 
}: any) {
  const [isActive, setIsActive] = useState(existingSetting?.is_active ?? false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(provider, formData, isActive);
      toast.success(`${title} configurado com sucesso!`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="border border-border shadow-xs bg-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-muted rounded-md text-muted-foreground">
              <Icon className="size-5" />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {title}
                {existingSetting?.is_active && <Badge variant="success" className="text-[10px]">Ativo</Badge>}
              </CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
          <Switch 
            checked={isActive} 
            onCheckedChange={(checked) => setIsActive(checked)} 
          />
        </div>
      </CardHeader>
      
      {isActive && (
        <form onSubmit={handleSave}>
          <CardContent className="space-y-4 pt-4 border-t border-border/10">
            {existingSetting?.is_active && (
              <div className="bg-success/10 text-success-foreground p-3 rounded-md text-sm mb-4 flex items-center gap-2">
                <CheckCircle className="size-4" />
                Esta integração está configurada e protegida. Você pode reescrever as chaves abaixo.
              </div>
            )}
            {fields.map((field: any) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={`${provider}-${field.key}`}>{field.label}</Label>
                <Input
                  id={`${provider}-${field.key}`}
                  type={field.type || "text"}
                  placeholder={field.placeholder}
                  required={!existingSetting?.is_active} // Required only if not already saved
                  value={formData[field.key] || ""}
                  onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                />
              </div>
            ))}
          </CardContent>
          <CardFooter className="flex justify-between border-t border-border/10 pt-4 pb-4">
            {existingSetting ? (
              <Button type="button" variant="destructive" size="sm" onClick={() => onDelete(provider)}>
                <Trash2 className="size-4 mr-2" />
                Remover
              </Button>
            ) : (
              <div />
            )}
            <Button type="submit" size="sm" disabled={isSaving}>
              <Save className="size-4 mr-2" />
              {isSaving ? "Salvando..." : "Salvar Configuração"}
            </Button>
          </CardFooter>
        </form>
      )}
    </Card>
  );
}

function IntegrationsPage() {
  const settings = Route.useLoaderData();
  const router = useRouter();

  const handleSave = async (provider: string, tokenPayload: Record<string, string>, isActive: boolean) => {
    // Only send non-empty fields to avoid overriding with blanks
    const cleanPayload = Object.fromEntries(Object.entries(tokenPayload).filter(([_, v]) => v.trim() !== ""));
    await saveIntegrationCredential({ data: { provider, tokenPayload: cleanPayload, isActive } });
    router.invalidate();
  };

  const handleDelete = async (provider: string) => {
    try {
      await deleteIntegrationCredential({ data: { provider } });
      toast.success("Integração removida.");
      router.invalidate();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro ao remover");
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title="Integrações & APIs"
        description="Conecte sua loja com serviços de logística e ferramentas de growth."
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <IntegrationCard
          provider="melhor_envio"
          title="Melhor Envio"
          description="Cálculo de fretes, geração de etiquetas e rastreamento automático."
          icon={Key}
          existingSetting={settings.find((s: any) => s.provider === "melhor_envio")}
          onSave={handleSave}
          onDelete={handleDelete}
          fields={[
            { key: "api_token", label: "Token de Acesso (API Token)", type: "password", placeholder: "Bearer eyJhbGciOiJIUzI1Ni..." },
          ]}
        />

        <IntegrationCard
          provider="google_merchant_center"
          title="Google Merchant Center"
          description="Ative esta integração para habilitar o feed XML de produtos (api/feed/xml)."
          icon={BarChart}
          existingSetting={settings.find((s: any) => s.provider === "google_merchant_center")}
          onSave={handleSave}
          onDelete={handleDelete}
          fields={[
            { key: "merchant_id", label: "Merchant ID (Apenas Referência)", placeholder: "123456789" },
          ]}
        />

        <IntegrationCard
          provider="meta_pixel"
          title="Meta Pixel"
          description="Rastreamento de conversões para Facebook e Instagram Ads."
          icon={Facebook}
          existingSetting={settings.find((s: any) => s.provider === "meta_pixel")}
          onSave={handleSave}
          onDelete={handleDelete}
          fields={[
            { key: "pixel_id", label: "ID do Pixel", placeholder: "123456789012345" },
            { key: "access_token", label: "API de Conversões (Access Token)", type: "password", placeholder: "EAAB..." },
          ]}
        />
        
        <IntegrationCard
          provider="google_analytics"
          title="Google Analytics (GA4)"
          description="Métricas de tráfego, sessões e conversões no Google Analytics."
          icon={BarChart}
          existingSetting={settings.find((s: any) => s.provider === "google_analytics")}
          onSave={handleSave}
          onDelete={handleDelete}
          fields={[
            { key: "measurement_id", label: "ID de Métrica (Measurement ID)", placeholder: "G-XXXXXXXXXX" },
          ]}
        />
      </div>
    </div>
  );
}
