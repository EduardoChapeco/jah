import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  FileText,
  Plus,
  ArrowUpRight,
  ShieldCheck,
  Calendar,
  Users,
  Search,
  CheckCircle,
  Clock,
  Send,
  Copy,
  Download,
  Settings,
  Scale,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from "@/components/ui/sheet";
import { PageHeader } from "@/components/commerce/page-header";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  listAgencyTravelContracts,
  createTravelContract,
  type TravelContractDTO,
} from "@/services/travel-contract.functions";
import { AgencyClausesEditorModal } from "@/components/tourism/contract/agency-clauses-editor-modal";
import { formatMoney } from "@/lib/money";

export const Route = createFileRoute("/workspace/turismo/contratos/")({
  head: () => ({ meta: [{ title: "Contratos Turísticos & Assinatura Digital | Workspace" }] }),
  loader: async () => {
    const contracts = await listAgencyTravelContracts().catch(() => []);
    return { contracts };
  },
  component: WorkspaceContractsIndexPage,
});

function WorkspaceContractsIndexPage() {
  const { contracts: initialContracts } = Route.useLoaderData();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isClausesModalOpen, setIsClausesModalOpen] = useState(false);

  // Form states
  const [contractTitle, setContractTitle] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientDocument, setClientDocument] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [destination, setDestination] = useState("");
  const [travelStartDate, setTravelStartDate] = useState("");
  const [travelEndDate, setTravelEndDate] = useState("");
  const [packageSummary, setPackageSummary] = useState("");
  const [totalValueCents, setTotalValueCents] = useState<number>(0);
  const [paymentConditions, setPaymentConditions] = useState("À vista via PIX ou em até 10x sem juros no cartão.");

  const { data: contracts, refetch } = useQuery({
    queryKey: ["agency-contracts", selectedStatus, search],
    queryFn: () =>
      listAgencyTravelContracts({
        data: {
          status: selectedStatus !== "all" ? selectedStatus : undefined,
          search: search || undefined,
        },
      }),
    initialData: initialContracts,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createTravelContract({
        data: {
          contractTitle: contractTitle || `Contrato de Prestação de Serviços - ${destination}`,
          clientName,
          clientDocument,
          clientPhone,
          destination,
          travelStartDate: travelStartDate || undefined,
          travelEndDate: travelEndDate || undefined,
          packageSummary,
          totalValueCents,
          paymentConditions,
        },
      }),
    onSuccess: (res) => {
      toast.success("Contrato gerado com sucesso!");
      setIsNewModalOpen(false);
      refetch();
    },
    onError: (err: any) => toast.error(err?.message || "Erro ao criar contrato."),
  });

  const contractsList = contracts || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ── 1. HEADER DO WORKSPACE ── */}
      <PageHeader
        eyebrow="Turismo & Jurídico"
        title="Contratos & Assinaturas"
        actions={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsClausesModalOpen(true)}
              className="rounded-xl text-xs font-bold gap-1.5 cursor-pointer"
            >
              <Scale className="size-4 text-primary" />
              <span>Minuta & Cláusulas Padrão</span>
            </Button>

            <Sheet open={isNewModalOpen} onOpenChange={setIsNewModalOpen}>
              <SheetTrigger asChild>
                <Button size="sm" className="rounded-xl text-xs font-bold bg-primary text-primary-foreground gap-1.5">
                  <Plus className="size-4" />
                  <span>Novo Contrato</span>
                </Button>
              </SheetTrigger>

            <SheetContent side="right" className="w-full sm:max-w-xl flex flex-col p-0 gap-0 overflow-hidden bg-card border-l border-border">
              <SheetHeader className="p-6 pb-4 border-b border-border/60 bg-card">
                <SheetTitle className="text-base font-bold text-foreground">
                  Emitir Contrato de Prestação de Serviços Turísticos
                </SheetTitle>
                <SheetDescription className="text-xs text-muted-foreground mt-1">
                  Preencha os dados da viagem e do contratante para gerar a minuta com validade jurídica.
                </SheetDescription>
              </SheetHeader>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!clientName || !clientDocument || !clientPhone || !destination || !packageSummary) {
                    toast.error("Preencha todos os campos obrigatórios.");
                    return;
                  }
                  createMutation.mutate();
                }}
                className="flex-1 overflow-y-auto p-6 space-y-4 text-xs"
              >
                <div className="space-y-1">
                  <Label className="text-xs font-bold">Título do Contrato (Opcional)</Label>
                  <Input
                    placeholder="Ex: Contrato de Viagem - Pacote Maceió"
                    value={contractTitle}
                    onChange={(e) => setContractTitle(e.target.value)}
                    className="h-10 text-xs rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold">Nome do Contratante *</Label>
                    <Input
                      placeholder="Nome completo"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="h-10 text-xs rounded-xl"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold">CPF do Contratante *</Label>
                    <Input
                      placeholder="000.000.000-00"
                      value={clientDocument}
                      onChange={(e) => setClientDocument(e.target.value)}
                      className="h-10 text-xs rounded-xl font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold">WhatsApp / Telefone *</Label>
                    <Input
                      placeholder="(49) 99999-9999"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      className="h-10 text-xs rounded-xl"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold">Destino Principal *</Label>
                    <Input
                      placeholder="Ex: Maceió, AL"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="h-10 text-xs rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold">Data Início</Label>
                    <Input
                      type="date"
                      value={travelStartDate}
                      onChange={(e) => setTravelStartDate(e.target.value)}
                      className="h-10 text-xs rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold">Data Término</Label>
                    <Input
                      type="date"
                      value={travelEndDate}
                      onChange={(e) => setTravelEndDate(e.target.value)}
                      className="h-10 text-xs rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold">Resumo dos Serviços Inclusos *</Label>
                  <Textarea
                    rows={3}
                    placeholder="Descreva: Passagens aéreas ida e volta, 7 diárias no Hotel X com café da manhã, transfers in/out e seguro viagem."
                    value={packageSummary}
                    onChange={(e) => setPackageSummary(e.target.value)}
                    className="text-xs rounded-xl resize-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold">Valor Total (Centavos BRL) *</Label>
                    <Input
                      type="number"
                      placeholder="Ex: 450000 para R$ 4.500,00"
                      value={totalValueCents}
                      onChange={(e) => setTotalValueCents(Number(e.target.value))}
                      className="h-10 text-xs rounded-xl font-mono"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold">Condições de Pagamento</Label>
                    <Input
                      placeholder="Ex: Entrada + 10x sem juros"
                      value={paymentConditions}
                      onChange={(e) => setPaymentConditions(e.target.value)}
                      className="h-10 text-xs rounded-xl"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="w-full h-11 rounded-xl text-xs font-bold bg-foreground text-background"
                  >
                    {createMutation.isPending ? "Gerando contrato..." : "Gerar Contrato & Criar Link de Assinatura"}
                  </Button>
                </div>
              </form>
            </SheetContent>
          </Sheet>
        </div>
      }
    />

      {/* ── 2. FILTROS & BUSCA ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: "all", label: "Todos" },
            { id: "signed", label: "Assinados" },
            { id: "sent", label: "Aguardando Assinatura" },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setSelectedStatus(f.id)}
              className={`h-9 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedStatus === f.id
                  ? "bg-foreground text-background"
                  : "bg-muted/50 text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar contrato por título, cliente ou destino..."
          className="h-10 max-w-xs rounded-xl text-xs bg-card border-border/60"
        />
      </div>

      {/* ── 3. LISTAGEM DE CONTRATOS ── */}
      {contractsList.length === 0 ? (
        <div className="py-20 text-center space-y-3 bg-card rounded-2xl border border-border/60 p-8">
          <FileText className="size-10 mx-auto text-muted-foreground" />
          <h3 className="text-sm font-bold text-foreground">Nenhum contrato encontrado</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Emita seu primeiro contrato turístico para formalizar reservas com assinatura digital.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contractsList.map((c: TravelContractDTO) => {
            const cleanWhatsapp = (c.client_phone || "").replace(/\D/g, "");
            const signatureUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/contrato/${c.public_token}`;
            const waContractMessage = encodeURIComponent(
              `Olá ${c.client_name}! Segue o link para conferência e assinatura eletrônica do seu contrato de viagem para ${c.destination}:\n\n${signatureUrl}`
            );

            return (
              <Card
                key={c.id}
                className="p-5 rounded-2xl border border-border/60 bg-card space-y-4 hover:border-primary/40 transition-all flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                      {c.destination}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-mono uppercase font-bold ${
                        c.status === "signed"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                          : ""
                      }`}
                    >
                      {c.status === "signed" ? "✓ Assinado (SHA-256)" : "Aguardando Assinatura"}
                    </Badge>
                  </div>

                  <h3 className="text-sm font-bold text-foreground line-clamp-1">
                    {c.contract_title}
                  </h3>

                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p>
                      Contratante: <span className="font-bold text-foreground">{c.client_name}</span>
                    </p>
                    <p className="font-mono text-[11px]">CPF: {c.client_document}</p>
                  </div>

                  <div className="pt-2 border-t border-border/40 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Valor do Contrato:</span>
                    <span className="text-sm font-black font-mono text-foreground">
                      {formatMoney(c.total_value_cents)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-border/40">
                  <Button asChild size="sm" variant="outline" className="flex-1 rounded-xl text-xs font-bold h-9">
                    <Link to={`/contrato/${c.public_token}` as any} target="_blank">
                      Ver Contrato
                    </Link>
                  </Button>

                  {cleanWhatsapp && (
                    <Button asChild size="sm" className="rounded-xl text-xs font-bold h-9 bg-emerald-600 hover:bg-emerald-700 text-white px-3">
                      <a
                        href={`https://wa.me/55${cleanWhatsapp}?text=${waContractMessage}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Send className="size-3.5 mr-1" />
                        <span>WhatsApp</span>
                      </a>
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal de Gestão de Minuta & Cláusulas Padrão da Agência */}
      <AgencyClausesEditorModal
        open={isClausesModalOpen}
        onOpenChange={setIsClausesModalOpen}
        onSaved={refetch}
      />
    </div>
  );
}
