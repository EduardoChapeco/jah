import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  Plus,
  CheckCircle2,
  Clock,
  Send,
  Copy,
  Scale,
  Trash2,
  ExternalLink,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/commerce/page-header";
import { toast } from "sonner";
import {
  listAgencyTravelContracts,
  deleteTravelContract,
  type TravelContractDTO,
} from "@/services/travel-contract.functions";
import { AgencyClausesEditorModal } from "@/components/tourism/contract/agency-clauses-editor-modal";
import { NewTravelContractSheet } from "@/components/tourism/contract/new-travel-contract-sheet";
import { getStoreSettings } from "@/services/store.functions";
import { NicheOperationalGuard } from "@/components/workspace/niche-operational-guard";
import { formatMoney } from "@/lib/money";

export const Route = createFileRoute("/workspace/turismo/contratos/")({
  head: () => ({ meta: [{ title: "Contratos Turísticos & Assinatura Digital | Workspace" }] }),
  loader: async () => {
    const [contracts, store] = await Promise.all([
      listAgencyTravelContracts().catch(() => []),
      getStoreSettings().catch(() => null),
    ]);
    return { contracts: contracts || [], store };
  },
  component: WorkspaceContractsIndexPage,
});

function WorkspaceContractsIndexPage() {
  const { contracts: initialContracts, store } = Route.useLoaderData();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isClausesModalOpen, setIsClausesModalOpen] = useState(false);

  const { data: contracts = [], refetch } = useQuery({
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

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTravelContract({ data: { id } }),
    onSuccess: () => {
      toast.success("Contrato excluído!");
      queryClient.invalidateQueries({ queryKey: ["agency-contracts"] });
    },
    onError: (err: any) => toast.error(err?.message || "Erro ao excluir contrato."),
  });

  const handleCopyLink = (publicToken: string) => {
    const url = `${window.location.origin}/contrato/${publicToken}`;
    navigator.clipboard.writeText(url);
    toast.success("Link para assinatura eletrônica copiado!");
  };

  const contractsList = contracts || [];

  // Métricas do Painel Jurídico
  const totalCount = contractsList.length;
  const signedCount = contractsList.filter((c) => c.status === "signed").length;
  const pendingCount = contractsList.filter((c) => c.status !== "signed" && c.status !== "cancelled").length;
  const totalValueCents = contractsList.reduce((acc, c) => acc + (c.total_value_cents || 0), 0);

  return (
    <NicheOperationalGuard
      targetNiche="tourism"
      toolTitle="Contratos Turísticos & Assinatura Digital"
      toolDescription="Gestão de minutas, contratos com validade jurídica e link de assinatura digital para passageiros e contratantes de pacotes turísticos."
      store={store}
    >
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

              <Button
                size="sm"
                onClick={() => setIsNewModalOpen(true)}
                className="rounded-xl text-xs font-bold bg-primary text-primary-foreground gap-1.5 cursor-pointer shadow-xs hover:bg-primary/90"
              >
                <Plus className="size-4" />
                <span>Emitir Contrato</span>
              </Button>
            </div>
          }
        />

        {/* ── 2. CARDS DE MÉTRICAS EXECUTIVAS ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="p-4 rounded-2xl border border-border/70 bg-card space-y-1 shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
              <span>Total de Contratos</span>
              <FileText className="size-4 text-primary" />
            </div>
            <p className="text-2xl font-black text-foreground tracking-tight">{totalCount}</p>
            <p className="text-[11px] text-muted-foreground">Minutas emitidas</p>
          </Card>

          <Card className="p-4 rounded-2xl border border-border/70 bg-card space-y-1 shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
              <span>Assinados Digitalmente</span>
              <CheckCircle2 className="size-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-emerald-600 tracking-tight">{signedCount}</p>
            <p className="text-[11px] text-muted-foreground">Comprovante e Hash SHA-256</p>
          </Card>

          <Card className="p-4 rounded-2xl border border-border/70 bg-card space-y-1 shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
              <span>Aguardando Assinatura</span>
              <Clock className="size-4 text-amber-500" />
            </div>
            <p className="text-2xl font-black text-foreground tracking-tight">{pendingCount}</p>
            <p className="text-[11px] text-muted-foreground">Links enviados ao cliente</p>
          </Card>

          <Card className="p-4 rounded-2xl border border-border/70 bg-card space-y-1 shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
              <span>Volume Contratado</span>
              <TrendingUp className="size-4 text-primary" />
            </div>
            <p className="text-xl font-black text-foreground font-mono tracking-tight">
              {formatMoney(totalValueCents)}
            </p>
            <p className="text-[11px] text-muted-foreground">Em reservas formalizadas</p>
          </Card>
        </div>

        {/* ── 3. FILTROS & BUSCA ── */}
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
            placeholder="🔍 Buscar contrato por título, cliente ou destino..."
            className="h-10 max-w-xs rounded-xl text-xs bg-card border-border/60"
          />
        </div>

        {/* ── 4. LISTAGEM DE CONTRATOS ── */}
        {contractsList.length === 0 ? (
          <div className="py-20 text-center space-y-3 bg-card rounded-2xl border border-border/60 p-8">
            <FileText className="size-10 mx-auto text-muted-foreground" />
            <h3 className="text-sm font-bold text-foreground">Nenhum contrato encontrado</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Emita seu primeiro contrato turístico com validade jurídica, conformidade Cadastur e link de assinatura digital.
            </p>
            <div className="pt-2">
              <Button
                onClick={() => setIsNewModalOpen(true)}
                className="rounded-xl text-xs font-bold bg-primary text-primary-foreground gap-1.5"
              >
                <Plus className="size-4" />
                Emitir Contrato Agora
              </Button>
            </div>
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
                  className="p-5 rounded-2xl border border-border/60 bg-card space-y-4 hover:border-primary/40 transition-all flex flex-col justify-between shadow-xs group"
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

                    <h3 className="text-sm font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
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

                  <div className="space-y-2 pt-2 border-t border-border/40">
                    <div className="flex items-center gap-2">
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="flex-1 rounded-xl text-xs font-bold h-9"
                      >
                        <Link to={`/contrato/${c.public_token}` as any} target="_blank">
                          <ExternalLink className="mr-1.5 size-3" />
                          Ver Minuta
                        </Link>
                      </Button>

                      {cleanWhatsapp && (
                        <Button
                          asChild
                          size="sm"
                          className="rounded-xl text-xs font-bold h-9 bg-emerald-600 hover:bg-emerald-700 text-white px-3"
                        >
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

                    {/* Ações táteis secundárias */}
                    <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground">
                      <button
                        type="button"
                        onClick={() => handleCopyLink(c.public_token)}
                        className="hover:text-foreground flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Copy className="size-3" />
                        Copiar Link
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (confirm("Tem certeza que deseja excluir este contrato?")) {
                            deleteMutation.mutate(c.id);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                        className="hover:text-destructive flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Trash2 className="size-3" />
                        Excluir
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* ── 5. NOVO SHEET DE CRIAÇÃO AVANÇADA DE CONTRATO (TRAVELOS) ── */}
        <NewTravelContractSheet
          isOpen={isNewModalOpen}
          onOpenChange={setIsNewModalOpen}
          onCreated={() => refetch()}
        />

        {/* Modal de Gestão de Minuta & Cláusulas Padrão da Agência */}
        <AgencyClausesEditorModal
          open={isClausesModalOpen}
          onOpenChange={setIsClausesModalOpen}
          onSaved={refetch}
        />
      </div>
    </NicheOperationalGuard>
  );
}
