import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { listIntegrationSettings, saveIntegrationCredential, deleteIntegrationCredential } from "@/services/integrations.functions";
import { Truck, Facebook, BarChart, Settings, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/configuracoes/integracoes")({
  head: () => ({ meta: [{ title: "Integrações" }] }),
  loader: async () => {
    return await listIntegrationSettings();
  },
  component: IntegrationsSettingsPage,
});

const INTEGRATION_CATALOG = [
  {
    id: "melhorenvio",
    name: "Melhor Envio",
    description: "Cotação de fretes automáticos e geração de etiquetas.",
    icon: Truck,
    color: "text-amber-500",
    bg: "bg-amber-100 dark:bg-amber-900/30",
    fields: [
       { key: "api_token", label: "Token de Acesso (Bearer)", type: "password" }
    ]
  },
  {
    id: "frenet",
    name: "Frenet",
    description: "Cálculo logístico e tabelas de frete via Frenet.",
    icon: Truck,
    color: "text-blue-500",
    bg: "bg-blue-100 dark:bg-blue-900/30",
    fields: [
       { key: "api_token", label: "Chave de Acesso (API Key)", type: "password" }
    ]
  },
  {
    id: "meta_pixel",
    name: "Meta Pixel & Conversions API",
    description: "Rastreio de visitas, PageView e compras para tráfego pago.",
    icon: Facebook,
    color: "text-blue-600",
    bg: "bg-blue-100 dark:bg-blue-900/30",
    fields: [
       { key: "pixel_id", label: "Pixel ID", type: "text" },
       { key: "access_token", label: "Token de Acesso (CAPI)", type: "password" }
    ]
  },
  {
    id: "google_analytics",
    name: "Google Analytics 4",
    description: "Análise avançada do comportamento dos visitantes da loja.",
    icon: BarChart,
    color: "text-orange-500",
    bg: "bg-orange-100 dark:bg-orange-900/30",
    fields: [
       { key: "measurement_id", label: "ID da Métrica (G-XXXXXXXXXX)", type: "text" }
    ]
  }
];

function IntegrationsSettingsPage() {
  const activeIntegrations = Route.useLoaderData();
  const router = useRouter();

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<any>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isActiveToggle, setIsActiveToggle] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleOpenConfig = (catalogItem: any) => {
    setSelectedCatalogItem(catalogItem);
    
    // Check if it already exists to prepopulate toggle, but DO NOT prepopulate tokens 
    // because we don't send them to the client for security.
    const existing = activeIntegrations.find((a: any) => a.provider === catalogItem.id);
    setIsActiveToggle(existing ? existing.is_active : true);
    
    // Clear tokens
    const emptyForm: Record<string, string> = {};
    catalogItem.fields.forEach((f: any) => emptyForm[f.key] = "");
    setFormData(emptyForm);
    
    setModalOpen(true);
  };

  const isFormValid = selectedCatalogItem?.fields.every((f: any) => formData[f.key] && formData[f.key].trim() !== "");

  const handleSave = async () => {
    if (!isFormValid) {
       toast.error("Preencha todos os campos obrigatórios antes de salvar.");
       return;
    }
    setLoading(true);
    try {
      await saveIntegrationCredential({
        data: {
          provider: selectedCatalogItem.id,
          tokenPayload: formData,
          isActive: isActiveToggle
        }
      });
      toast.success(`${selectedCatalogItem.name} configurado com sucesso!`);
      setModalOpen(false);
      router.invalidate();
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar integração");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (provider: string) => {
    if (!confirm("Tem certeza que deseja remover esta integração? A loja perderá a comunicação imediata.")) return;
    
    try {
       await deleteIntegrationCredential({ data: { provider }});
       toast.success("Integração removida.");
       setModalOpen(false);
       router.invalidate();
    } catch (e: any) {
       toast.error("Erro ao remover: " + e.message);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Integrações Externas"
        description="Conecte sua loja às melhores ferramentas de logística e marketing do mercado."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {INTEGRATION_CATALOG.map((item) => {
          const activeStatus = activeIntegrations.find((a: any) => a.provider === item.id);
          const isConfigured = !!activeStatus;

          return (
            <div key={item.id} className="bg-card border rounded-lg p-5 flex flex-col justify-between relative overflow-hidden group hover:border-primary/50 transition-colors">
               <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-lg ${item.bg}`}>
                     <item.icon className={`w-6 h-6 ${item.color}`} />
                  </div>
                  {isConfigured && (
                     <Badge variant={activeStatus.is_active ? "default" : "secondary"}>
                       {activeStatus.is_active ? "Ativo" : "Pausado"}
                     </Badge>
                  )}
               </div>

               <div>
                 <h3 className="font-semibold text-lg">{item.name}</h3>
                 <p className="text-sm text-muted-foreground mt-1 min-h-[40px]">{item.description}</p>
               </div>

               <div className="mt-6">
                 <Button 
                   variant={isConfigured ? "outline" : "default"} 
                   className="w-full"
                   onClick={() => handleOpenConfig(item)}
                 >
                   <Settings className="w-4 h-4 mr-2" />
                   {isConfigured ? "Gerenciar" : "Conectar"}
                 </Button>
               </div>
            </div>
          );
        })}
      </div>

      <Sheet open={modalOpen} onOpenChange={setModalOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Configurar {selectedCatalogItem?.name}</SheetTitle>
            <SheetDescription>
              Insira as chaves de acesso fornecidas pela plataforma. Elas serão salvas em nosso cofre de segurança criptografado.
            </SheetDescription>
          </SheetHeader>

          {selectedCatalogItem && (
             <div className="space-y-4 py-4">
               {selectedCatalogItem.fields.map((f: any) => (
                 <div key={f.key} className="space-y-2">
                   <Label>{f.label}</Label>
                   <Input 
                     type={f.type} 
                     placeholder={f.type === 'password' ? '••••••••••••••••' : ''}
                     value={formData[f.key] || ""}
                     onChange={e => setFormData(prev => ({...prev, [f.key]: e.target.value}))}
                   />
                 </div>
               ))}

               <div className="flex items-center justify-between pt-4 border-t mt-4">
                  <div className="space-y-0.5">
                    <Label>Ativar Integração</Label>
                    <p className="text-xs text-muted-foreground">O sistema consumirá os dados desta API.</p>
                  </div>
                  <Switch 
                    checked={isActiveToggle} 
                    onCheckedChange={setIsActiveToggle} 
                    disabled={!isFormValid}
                  />
               </div>
             </div>
          )}

          <SheetFooter className="flex justify-between items-center sm:justify-between mt-8">
            {activeIntegrations.find((a: any) => a.provider === selectedCatalogItem?.id) ? (
               <Button variant="destructive" size="icon" onClick={() => handleDelete(selectedCatalogItem.id)}>
                 <Trash2 className="w-4 h-4" />
               </Button>
            ) : (
               <div></div>
            )}
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setModalOpen(false)} disabled={loading}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                {loading ? "Salvando..." : "Salvar Configuração"}
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
