import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  Plus,
  ArrowUpRight,
  Calendar,
  Users,
  Search,
  CheckCircle2,
  Clock,
  Send,
  Copy,
  Trash2,
  ExternalLink,
  DollarSign,
  TrendingUp,
  MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/commerce/page-header";
import { toast } from "sonner";
import {
  listAgencyTravelProposals,
  duplicateTravelProposal,
  deleteTravelProposal,
  type TravelProposalDTO,
} from "@/services/travel-proposal.functions";
import { getStoreSettings } from "@/services/store.functions";
import { NicheOperationalGuard } from "@/components/workspace/niche-operational-guard";
import { NewTravelProposalSheet } from "@/components/tourism/new-travel-proposal-sheet";
import { formatMoney } from "@/lib/money";

export const Route = createFileRoute("/workspace/turismo/propostas/")({
  head: () => ({ meta: [{ title: "Lâminas & Propostas de Viagem | Workspace JAH Master OS" }] }),
  validateSearch: (search: Record<string, unknown>) => ({
    leadId: (search.leadId as string) || undefined,
    clientName: (search.clientName as string) || undefined,
    clientPhone: (search.clientPhone as string) || undefined,
    clientEmail: (search.clientEmail as string) || undefined,
    destination: (search.destination as string) || undefined,
    new: search.new === true || search.new === "true" || undefined,
  }),
  loader: async () => {
    const [proposals, store] = await Promise.all([
      listAgencyTravelProposals().catch(() => []),
      getStoreSettings().catch(() => null),
    ]);
    return { proposals: proposals || [], store };
  },
  component: WorkspaceProposalsIndexPage,
});

function WorkspaceProposalsIndexPage() {
  const { proposals: initialProposals, store } = Route.useLoaderData();
  const searchParams = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("todos");
  const [isNewModalOpen, setIsNewModalOpen] = useState(Boolean(searchParams?.new || searchParams?.leadId));

  const { data: proposals = [], refetch } = useQuery({
    queryKey: ["agency-proposals", selectedStatus, search],
    queryFn: () =>
      listAgencyTravelProposals({
        data: {
          status: selectedStatus !== "todos" ? selectedStatus : undefined,
          search: search || undefined,
        },
      }),
    initialData: initialProposals,
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => duplicateTravelProposal({ data: { id } }),
    onSuccess: () => {
      toast.success("Proposta duplicada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["agency-proposals"] });
    },
    onError: (err: any) => toast.error(err?.message || "Erro ao duplicar proposta."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTravelProposal({ data: { id } }),
    onSuccess: () => {
      toast.success("Proposta excluída!");
      queryClient.invalidateQueries({ queryKey: ["agency-proposals"] });
    },
    onError: (err: any) => toast.error(err?.message || "Erro ao excluir proposta."),
  });

  const handleCopyLink = (publicToken: string) => {
    const url = `${window.location.origin}/proposta/${publicToken}`;
    navigator.clipboard.writeText(url);
    toast.success("Link da lâmina copiado para a área de transferência!");
  };

  const proposalsList = proposals || [];

  // Métricas do Painel
  const totalCount = proposalsList.length;
  const approvedCount = proposalsList.filter((p) => p.status === "approved").length;
  const draftCount = proposalsList.filter((p) => p.status === "draft").length;
  const sentCount = proposalsList.filter((p) => p.status === "sent").length;
  const totalOfferedCents = proposalsList.reduce(
    (acc, p) => acc + (p.pricing?.total_price_cents || 0),
    0
  );

  return (
    <NicheOperationalGuard
      targetNiche="tourism"
      toolTitle="Lâminas & Propostas de Viagem"
      toolDescription="O criador de lâminas e propostas interativas foi desenvolvido especificamente para agências de turismo e consultores de viagem apresentarem roteiros visuais aos passageiros."
      store={store}
    >
      <div className="space-y-6 animate-in fade-in duration-200">
        {/* ── 1. HEADER DO WORKSPACE ── */}
        <PageHeader
          eyebrow="Turismo & Lâminas"
          title="Propostas de Viagem"
          actions={
            <div className="flex items-center gap-2">
              <Button asChild size="sm" variant="outline" className="rounded-xl text-xs font-semibold">
                <Link to="/workspace/turismo/cotacoes">Cotações Recebidas</Link>
              </Button>

              <Button
                size="sm"
                onClick={() => setIsNewModalOpen(true)}
                className="rounded-xl text-xs font-bold bg-primary text-primary-foreground gap-1.5 cursor-pointer shadow-xs hover:bg-primary/90"
              >
                <Plus className="size-4" />
                <span>Nova Proposta</span>
              </Button>
            </div>
          }
        />

        {/* ── 2. CARDS DE MÉTRICAS EXECUTIVAS ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="p-4 rounded-2xl border border-border/70 bg-card space-y-1 shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
              <span>Total de Propostas</span>
              <FileText className="size-4 text-primary" />
            </div>
            <p className="text-2xl font-black text-foreground tracking-tight">{totalCount}</p>
            <p className="text-[11px] text-muted-foreground">Lâminas no Studio</p>
          </Card>

          <Card className="p-4 rounded-2xl border border-border/70 bg-card space-y-1 shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
              <span>Aprovadas / Fechadas</span>
              <CheckCircle2 className="size-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-emerald-600 tracking-tight">{approvedCount}</p>
            <p className="text-[11px] text-muted-foreground">Prontas para contrato e emissão</p>
          </Card>

          <Card className="p-4 rounded-2xl border border-border/70 bg-card space-y-1 shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
              <span>Em Negociação</span>
              <Clock className="size-4 text-amber-500" />
            </div>
            <p className="text-2xl font-black text-foreground tracking-tight">{sentCount + draftCount}</p>
            <p className="text-[11px] text-muted-foreground">{sentCount} enviadas • {draftCount} rascunhos</p>
          </Card>

          <Card className="p-4 rounded-2xl border border-border/70 bg-card space-y-1 shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
              <span>Volume Ofertado</span>
              <TrendingUp className="size-4 text-primary" />
            </div>
            <p className="text-xl font-black text-foreground font-mono tracking-tight">
              {formatMoney(totalOfferedCents)}
            </p>
            <p className="text-[11px] text-muted-foreground">Em propostas ativas</p>
          </Card>
        </div>

        {/* ── 3. FILTROS & BUSCA ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: "todos", label: "Todas" },
              { id: "draft", label: "Rascunhos" },
              { id: "sent", label: "Enviadas" },
              { id: "approved", label: "Aprovadas" },
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
            placeholder="🔍 Buscar proposta por título, cliente ou destino..."
            className="h-10 max-w-xs rounded-xl text-xs bg-card border-border/60"
          />
        </div>

        {/* ── 4. GRID DE PROPOSTAS ── */}
        {proposalsList.length === 0 ? (
          <div className="py-20 text-center space-y-3 bg-card rounded-2xl border border-border/60 p-8">
            <FileText className="size-10 mx-auto text-muted-foreground" />
            <h3 className="text-sm font-bold text-foreground">Nenhuma proposta de viagem encontrada</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Crie sua primeira lâmina visual com roteiro completo ou clone um pacote pronto da biblioteca.
            </p>
            <div className="pt-2">
              <Button
                onClick={() => setIsNewModalOpen(true)}
                className="rounded-xl text-xs font-bold bg-primary text-primary-foreground gap-1.5"
              >
                <Plus className="size-4" />
                Criar Nova Proposta
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {proposalsList.map((p: TravelProposalDTO) => {
              const totalCents = p.pricing?.total_price_cents || 0;
              return (
                <Card
                  key={p.id}
                  className="p-5 rounded-2xl border border-border/60 bg-card space-y-4 hover:border-primary/40 transition-all flex flex-col justify-between shadow-xs group"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                        {p.destination_city}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-mono uppercase font-bold ${
                          p.status === "approved"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                            : ""
                        }`}
                      >
                        {p.status === "approved"
                          ? "✓ Aprovada"
                          : p.status === "sent"
                          ? "Enviada"
                          : "Rascunho"}
                      </Badge>
                    </div>

                    <h3 className="text-sm font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                      {p.title}
                    </h3>

                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p>
                        Passageiro: <span className="font-bold text-foreground">{p.client_name}</span>
                      </p>
                      <p className="font-mono text-[11px]">{p.client_whatsapp}</p>
                    </div>

                    <div className="pt-2 border-t border-border/40 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Valor Total:</span>
                      <span className="text-sm font-black font-mono text-foreground">
                        {formatMoney(totalCents)}
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
                        <Link to="/proposta/$token" params={{ token: p.public_token }} target="_blank">
                          <ExternalLink className="mr-1.5 size-3" />
                          Ver Online
                        </Link>
                      </Button>
                      <Button
                        asChild
                        size="sm"
                        className="flex-1 rounded-xl text-xs font-bold h-9 bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        <Link to="/workspace/turismo/propostas/$id" params={{ id: p.id }}>
                          Abrir Studio
                        </Link>
                      </Button>
                    </div>

                    {/* Ações secundárias táteis */}
                    <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground">
                      <button
                        type="button"
                        onClick={() => handleCopyLink(p.public_token)}
                        className="hover:text-foreground flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Copy className="size-3" />
                        Copiar Link
                      </button>

                      <button
                        type="button"
                        onClick={() => duplicateMutation.mutate(p.id)}
                        disabled={duplicateMutation.isPending}
                        className="hover:text-foreground flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        Duplicar
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (confirm("Tem certeza que deseja excluir esta proposta?")) {
                            deleteMutation.mutate(p.id);
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

        {/* ── 5. SHEET DE CRIAÇÃO AVANÇADA (TRAVELOS STUDIO) ── */}
        <NewTravelProposalSheet
          isOpen={isNewModalOpen}
          onOpenChange={setIsNewModalOpen}
          initialLeadId={searchParams?.leadId}
          initialClientName={searchParams?.clientName}
          initialClientPhone={searchParams?.clientPhone}
          initialClientEmail={searchParams?.clientEmail}
          initialDestination={searchParams?.destination}
        />
      </div>
    </NicheOperationalGuard>
  );
}

