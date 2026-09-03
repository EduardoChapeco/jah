import { DocumentsPanel } from "@/components/crm/DocumentsPanel";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  User,
  ChevronLeft,
  Save,
  MapPin,
  Trash2,
  Plus,
  Check,
  ShieldCheck,
  FileText,
  Mail,
  Phone,
  Settings,
  Sparkles,
  Search,
  AlertTriangle,
  Gift,
  DollarSign,
  HeartPulse,
  Calendar,
  Clock,
  Building,
  CreditCard,
  History,
  Tag,
} from "lucide-react";
import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { EmptyState } from "@/components/state/states";
import {
  getCustomer360,
  updateCustomerCrm,
  upsertCustomerAddress,
  deleteCustomerAddress,
  addCustomerClinicalRecord,
  grantCustomerStoreCredit,
} from "@/services/crm.functions";
import { formatMoney } from "@/lib/money";

export const Route = createFileRoute("/workspace/clientes/$id")({
  head: () => ({ meta: [{ title: "Ficha 360° do Cliente | Workspace" }] }),
  loader: async ({ params }) => {
    return await getCustomer360({ data: { customerId: params.id } });
  },
  component: CustomerDetailPage,
});

function CustomerDetailPage() {
  const data = Route.useLoaderData() as any;
  const { id } = Route.useParams();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("timeline");

  // CRM State
  const [notes, setNotes] = useState(data.crm.notes || "");
  const [tags, setTags] = useState(data.crm.tags ? data.crm.tags.join(", ") : "");
  const [isSavingCrm, setIsSavingCrm] = useState(false);

  // Modal de Concessão de Crédito
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [creditAmount, setCreditAmount] = useState("");
  const [creditDescription, setCreditDescription] = useState("");
  const [isSavingCredit, setIsSavingCredit] = useState(false);

  // Modal de Prontuário / Anamnese
  const [isClinicalModalOpen, setIsClinicalModalOpen] = useState(false);
  const [serviceTitle, setServiceTitle] = useState("");
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [allergies, setAllergies] = useState("");
  const [isSavingClinical, setIsSavingClinical] = useState(false);

  // Modal de Endereço
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [addressForm, setAddressForm] = useState({
    zipcode: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    is_default: false,
  });
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  const handleSaveCrm = async () => {
    setIsSavingCrm(true);
    try {
      const tagsArray = tags
        .split(",")
        .map((t: string) => t.trim())
        .filter((t: string) => t.length > 0);

      await updateCustomerCrm({
        data: {
          customerId: id,
          notes: notes || null,
          tags: tagsArray,
        },
      });
      toast.success("Ficha do cliente atualizada com sucesso!");
      router.invalidate();
    } catch {
      toast.error("Erro ao atualizar ficha do cliente.");
    } finally {
      setIsSavingCrm(false);
    }
  };

  const handleGrantCredit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(creditAmount.replace(",", "."));
    if (isNaN(amountVal) || amountVal <= 0) {
      toast.error("Informe um valor de crédito válido.");
      return;
    }

    setIsSavingCredit(true);
    try {
      await grantCustomerStoreCredit({
        data: {
          customerId: id,
          amountCents: Math.round(amountVal * 100),
          description: creditDescription.trim() || "Crédito / Troca / Bonificação",
        },
      });
      toast.success("Crédito concedido com sucesso!");
      setIsCreditModalOpen(false);
      setCreditAmount("");
      setCreditDescription("");
      router.invalidate();
    } catch {
      toast.error("Erro ao conceder crédito.");
    } finally {
      setIsSavingCredit(false);
    }
  };

  const handleSaveClinical = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceTitle.trim() || !clinicalNotes.trim()) {
      toast.error("Informe o procedimento e as anotações do atendimento.");
      return;
    }

    setIsSavingClinical(true);
    try {
      await addCustomerClinicalRecord({
        data: {
          customerId: id,
          serviceTitle: serviceTitle.trim(),
          notes: clinicalNotes.trim(),
          allergies: allergies.trim() || null,
        },
      });
      toast.success("Prontuário/Anamnese registrado com sucesso!");
      setIsClinicalModalOpen(false);
      setServiceTitle("");
      setClinicalNotes("");
      setAllergies("");
      router.invalidate();
    } catch {
      toast.error("Erro ao salvar prontuário.");
    } finally {
      setIsSavingClinical(false);
    }
  };

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Header */}
      <PageHeader
        title={data.profile.name}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCreditModalOpen(true)}
              className="gap-1.5 font-bold text-xs"
            >
              <Gift className="size-3.5" />
              Conceder Crédito
            </Button>

            <Button
              size="sm"
              onClick={() => setIsClinicalModalOpen(true)}
              className="gap-1.5 font-bold text-xs"
            >
              <HeartPulse className="size-3.5" />
              Novo Atendimento / Anamnese
            </Button>
          </div>
        }
      />

      {/* ── 1. Topo da Ficha: Perfil & KPIs 360° ── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Card de Identificação (4 cols) */}
        <div className="md:col-span-4 bg-card rounded-2xl border border-border/60 p-5 space-y-4">
          <div className="flex items-center gap-3.5">
            <div className="size-14 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground overflow-hidden font-bold text-lg shrink-0">
              {data.profile.avatarUrl ? (
                <img
                  src={data.profile.avatarUrl}
                  alt={data.profile.name}
                  className="size-full object-cover"
                />
              ) : (
                <User className="size-7" />
              )}
            </div>

            <div className="min-w-0 space-y-0.5">
              <h2 className="text-base font-bold text-foreground truncate">
                {data.profile.name}
              </h2>
              {data.profile.taxId ? (
                <span className="text-xs font-mono text-muted-foreground block">
                  CPF/CNPJ: {data.profile.taxId}
                </span>
              ) : (
                <span className="text-[11px] text-muted-foreground">Documento não informado</span>
              )}
              {data.profile.isConsentLgpd && (
                <Badge variant="outline" className="text-[10px] text-emerald-600 gap-1 border-emerald-500/30">
                  <ShieldCheck className="size-3" />
                  LGPD Consentido
                </Badge>
              )}
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-border/40 text-xs">
            {data.profile.email && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="size-3.5 shrink-0" />
                <span className="truncate">{data.profile.email}</span>
              </div>
            )}
            {data.profile.phone && (
              <div className="flex items-center gap-2 text-muted-foreground font-mono">
                <Phone className="size-3.5 shrink-0" />
                <span>{data.profile.phone}</span>
              </div>
            )}
            {data.profile.birthDate && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="size-3.5 shrink-0" />
                <span>Aniversário: {new Date(data.profile.birthDate).toLocaleDateString("pt-BR")}</span>
              </div>
            )}
            {data.profile.emergencyContactName && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <HeartPulse className="size-3.5 shrink-0" />
                <span>
                  Emergência: {data.profile.emergencyContactName} ({data.profile.emergencyContactPhone})
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Grid de KPIs 360° (8 cols) */}
        <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-card rounded-2xl border border-border/60 p-4 space-y-1">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              LTV Total (Gastos)
            </span>
            <div className="text-lg sm:text-xl font-black text-foreground">
              {formatMoney(data.totalLtvCents)}
            </div>
            <span className="text-[10px] text-muted-foreground font-mono">
              {data.totalOrdersCount} compras realizadas
            </span>
          </div>

          <div className="bg-card rounded-2xl border border-border/60 p-4 space-y-1">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Ticket Médio
            </span>
            <div className="text-lg sm:text-xl font-black text-foreground">
              {formatMoney(data.averageTicketCents)}
            </div>
            <span className="text-[10px] text-muted-foreground">Por compra</span>
          </div>

          <div className="bg-card rounded-2xl border border-border/60 p-4 space-y-1">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Créditos / Troca
            </span>
            <div className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400">
              {formatMoney(data.totalCreditCents)}
            </div>
            <span className="text-[10px] text-muted-foreground">Disponível em loja</span>
          </div>

          <div className="bg-card rounded-2xl border border-border/60 p-4 space-y-1">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Recência
            </span>
            <div className="text-lg sm:text-xl font-black text-foreground">
              {data.daysSinceLastOrder} dias
            </div>
            <span className="text-[10px] text-muted-foreground">
              {data.daysSinceLastOrder > 60 ? "⚠️ Risco de Churn" : "Cliente Ativo"}
            </span>
          </div>
        </div>
      </div>

      {/* ── 2. Abas de Detalhamento 360° ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex flex-wrap sm:flex-nowrap h-auto sm:h-10 w-full gap-1 mb-6 p-1 bg-muted/50 rounded-2xl">
          <TabsTrigger value="timeline" className="text-xs font-semibold gap-1.5 flex-1 rounded-xl">
            <History className="size-3.5" />
            <span>Timeline</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="text-xs font-semibold gap-1.5 flex-1 rounded-xl">
            <FileText className="size-3.5 text-primary" />
            <span>Documentos ({data.documents?.length || 0})</span>
            {data.documents?.some((d: any) => d.expiryStatus === 'expired') && (
              <span className="size-2 rounded-full bg-rose-500 animate-pulse" />
            )}
          </TabsTrigger>
          <TabsTrigger value="commercial" className="text-xs font-semibold gap-1.5 flex-1 rounded-xl">
            <TrendingUp className="size-3.5 text-emerald-500" />
            <span>Oportunidades ({data.commercialLeads?.length || 0})</span>
          </TabsTrigger>
          <TabsTrigger value="addresses" className="text-xs font-semibold gap-1.5 flex-1 rounded-xl">
            <MapPin className="size-3.5" />
            <span>Endereços ({data.addresses?.length || 0})</span>
          </TabsTrigger>
          <TabsTrigger value="credits" className="text-xs font-semibold gap-1.5 flex-1 rounded-xl">
            <Gift className="size-3.5" />
            <span>Créditos ({formatMoney(data.totalCreditCents || 0)})</span>
          </TabsTrigger>
          <TabsTrigger value="crm" className="text-xs font-semibold gap-1.5 flex-1 rounded-xl">
            <Tag className="size-3.5" />
            <span>Notas & Tags</span>
          </TabsTrigger>
        </TabsList>

        {/* ── Aba 1: Timeline de Pedidos & Interações ── */}
        <TabsContent value="timeline" className="space-y-4">
          {data.timeline.length === 0 ? (
            <EmptyState
              title="Nenhuma interação registrada ainda"
              description="Quando o cliente realizar pedidos, solicitar orçamentos ou emitir ingressos, a timeline será preenchida automaticamente."
            />
          ) : (
            <div className="space-y-3">
              {data.timeline.map((event: any) => (
                <div
                  key={event.id}
                  className="p-4 rounded-2xl bg-card border border-border/60 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                      {event.type === "order" ? (
                        <CreditCard className="size-5 text-primary" />
                      ) : event.type === "quote" ? (
                        <FileText className="size-5 text-amber-500" />
                      ) : (
                        <Calendar className="size-5 text-emerald-500" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-foreground">{event.title}</h4>
                      <p className="text-xs text-muted-foreground">{event.description}</p>
                    </div>
                  </div>

                  <span className="text-[11px] text-muted-foreground font-mono shrink-0">
                    {new Date(event.timestamp).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Aba 2: Endereços Múltiplos ── */}
        <TabsContent value="addresses" className="space-y-4">
          {data.addresses.length === 0 ? (
            <EmptyState
              title="Nenhum endereço cadastrado"
              description="Os endereços salvos pelo cliente no checkout ou no perfil aparecerão aqui para entrega rápida."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data.addresses.map((addr: any) => (
                <div
                  key={addr.id}
                  className="p-4 rounded-2xl bg-card border border-border/60 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
                      <MapPin className="size-4 text-primary" />
                      {addr.street}, {addr.number}
                    </span>
                    {addr.is_default && (
                      <Badge variant="secondary" className="text-[10px]">
                        Principal
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {addr.neighborhood} • {addr.city} - {addr.state}
                  </p>
                  <span className="text-[11px] font-mono text-muted-foreground block">
                    CEP: {addr.zipcode}
                  </span>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Aba 3: Créditos & Gift Cards ── */}
        <TabsContent value="credits" className="space-y-4">
          {data.credits.length === 0 ? (
            <EmptyState
              title="Nenhum saldo ou crédito concedido"
              description="Conceda créditos em loja para devoluções, trocas, cashback ou premiações de fidelidade."
            />
          ) : (
            <div className="space-y-3">
              {data.credits.map((cr: any, idx: number) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-card border border-border/60 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Gift className="size-5 text-emerald-500 shrink-0" />
                    <div>
                      <h4 className="font-bold text-sm text-foreground">
                        {cr.description || "Crédito em Loja"}
                      </h4>
                      <span className="text-[11px] text-muted-foreground">
                        Concedido em {new Date(cr.created_at).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </div>
                  <span className="font-black text-sm text-emerald-600 dark:text-emerald-400">
                    {formatMoney(cr.amount_cents)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Aba 4: Anamnese & Prontuários Clínicos/Estética ── */}
        <TabsContent value="clinical" className="space-y-4">
          {data.clinicalRecords.length === 0 ? (
            <EmptyState
              title="Nenhum atendimento ou anamnese registrado"
              description="Para salões, clínicas e terapeutas: registre procedimentos realizados, alergias, laudos e histórico clínico."
            />
          ) : (
            <div className="space-y-3">
              {data.clinicalRecords.map((rec: any) => (
                <div
                  key={rec.id}
                  className="p-5 rounded-2xl bg-card border border-border/60 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HeartPulse className="size-4 text-rose-500" />
                      <h4 className="font-bold text-sm text-foreground">{rec.service_title}</h4>
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(rec.created_at).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <p className="text-xs text-foreground whitespace-pre-line leading-relaxed">
                    {rec.notes}
                  </p>

                  {rec.allergies && (
                    <div className="p-2.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2">
                      <AlertTriangle className="size-3.5" />
                      <span>Alergias / Contraindicações: {rec.allergies}</span>
                    </div>
                  )}

                  {rec.professional_name && (
                    <span className="text-[11px] text-muted-foreground block">
                      Atendido por: {rec.professional_name}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Aba 5: Notas & Tags de Segmentação ── */}
        <TabsContent value="crm" className="space-y-4">
          <div className="bg-card rounded-2xl border border-border/60 p-5 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Tags de Segmentação (separadas por vírgula)</Label>
              <Input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Ex: VIP, Atacado, Pontual, Prefere WhatsApp"
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Observações Internas Confidenciais</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anotações privadas sobre preferências, restrições e histórico do cliente..."
                rows={5}
                className="text-xs"
              />
            </div>

            <Button
              onClick={handleSaveCrm}
              disabled={isSavingCrm}
              className="gap-1.5 font-bold text-xs"
            >
              <Save className="size-3.5" />
              {isSavingCrm ? "Salvando..." : "Salvar Ficha"}
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Drawer Lateral no Desktop / Fullscreen no Mobile: Conceder Crédito */}
      <Sheet open={isCreditModalOpen} onOpenChange={setIsCreditModalOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md flex flex-col justify-between overflow-y-auto">
          <div>
            <SheetHeader className="pb-4">
              <SheetTitle>Conceder Crédito em Loja</SheetTitle>
              <SheetDescription>
                Adicione saldo na carteira do cliente para compras futuras, trocas ou bonificação.
              </SheetDescription>
            </SheetHeader>

            <form id="grant-credit-form" onSubmit={handleGrantCredit} className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Valor do Crédito (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  placeholder="Ex: 50,00"
                  className="text-xs font-mono font-bold"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Motivo / Descrição</Label>
                <Input
                  value={creditDescription}
                  onChange={(e) => setCreditDescription(e.target.value)}
                  placeholder="Ex: Devolução Pedido #1234 / Bônus Aniversário"
                  className="text-xs"
                />
              </div>
            </form>
          </div>

          <SheetFooter className="pt-4 border-t border-border/40">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreditModalOpen(false)}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="grant-credit-form"
              disabled={isSavingCredit}
              className="text-xs font-bold"
            >
              {isSavingCredit ? "Concedendo..." : "Conceder Crédito"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Drawer Lateral no Desktop / Fullscreen no Mobile: Novo Atendimento / Anamnese */}
      <Sheet open={isClinicalModalOpen} onOpenChange={setIsClinicalModalOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col justify-between overflow-y-auto">
          <div>
            <SheetHeader className="pb-4">
              <SheetTitle>Registro de Atendimento & Anamnese</SheetTitle>
              <SheetDescription>
                Histórico clínico para profissionais de saúde, estética, beleza e bem-estar.
              </SheetDescription>
            </SheetHeader>

            <form id="clinical-form" onSubmit={handleSaveClinical} className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Procedimento / Serviço Realizado</Label>
                <Input
                  value={serviceTitle}
                  onChange={(e) => setServiceTitle(e.target.value)}
                  placeholder="Ex: Limpeza de Pele Profunda, Corte com Química, Massoterapia"
                  className="text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Alergias / Restrições (se houver)</Label>
                <Input
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  placeholder="Ex: Alergia a iodo, pele sensível, pressão alta"
                  className="text-xs text-destructive"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Observações do Atendimento & Evolução</Label>
                <Textarea
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  placeholder="Descreva o procedimento realizado, produtos aplicados e recomendações..."
                  rows={4}
                  className="text-xs"
                  required
                />
              </div>
            </form>
          </div>

          <SheetFooter className="pt-4 border-t border-border/40">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsClinicalModalOpen(false)}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="clinical-form"
              disabled={isSavingClinical}
              className="text-xs font-bold"
            >
              {isSavingClinical ? "Salvando..." : "Salvar Prontuário"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
