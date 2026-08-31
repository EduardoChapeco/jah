import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  FileText,
  Plus,
  ArrowUpRight,
  Sparkle,
  Calendar,
  Users,
  Search,
  CheckCircle,
  Clock,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  listAgencyTravelProposals,
  createTravelProposal,
  type TravelProposalDTO,
} from "@/services/travel-proposal.functions";
import { formatMoney } from "@/lib/money";

export const Route = createFileRoute("/workspace/turismo/propostas/")({
  head: () => ({ meta: [{ title: "Lâminas & Propostas de Viagem | Workspace Wider" }] }),
  loader: async () => {
    const proposals = await listAgencyTravelProposals().catch(() => []);
    return { proposals };
  },
  component: WorkspaceProposalsIndexPage,
});

function WorkspaceProposalsIndexPage() {
  const { proposals: initialProposals } = Route.useLoaderData();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("todos");
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // Form states para nova proposta
  const [newTitle, setNewTitle] = useState("");
  const [newClientName, setNewClientName] = useState("");
  const [newClientWhatsapp, setNewClientWhatsapp] = useState("");
  const [newDestination, setNewDestination] = useState("");
  const [newStartDate, setNewStartDate] = useState("");
  const [newEndDate, setNewEndDate] = useState("");

  const { data: proposals, refetch } = useQuery({
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

  const createMutation = useMutation({
    mutationFn: () =>
      createTravelProposal({
        data: {
          title: newTitle || `Proposta para ${newDestination}`,
          clientName: newClientName,
          clientWhatsapp: newClientWhatsapp,
          destinationCity: newDestination,
          travelStartDate: newStartDate || undefined,
          travelEndDate: newEndDate || undefined,
        },
      }),
    onSuccess: (res) => {
      toast.success("Proposta criada! Redirecionando para o Studio...");
      setIsNewModalOpen(false);
      navigate({ to: "/workspace/turismo/propostas/$id" as any, params: { id: res.id } as any });
    },
    onError: (err: any) => toast.error(err?.message || "Erro ao criar proposta."),
  });

  const proposalsList = proposals || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ── 1. HEADER DO WORKSPACE ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-card border border-border/80">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
              Studio Comercial de Turismo
            </span>
            <Badge variant="outline" className="text-[10px] font-mono font-bold">
              {proposalsList.length} Propostas
            </Badge>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Lâminas & Propostas de Viagem
          </h1>
          <p className="text-xs text-muted-foreground">
            Crie cotações visuais em alta resolução (A4, PDF, Story) para encantar seus clientes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="outline" className="rounded-xl text-xs font-semibold">
            <Link to="/workspace/turismo/cotacoes">Ver Cotações Recebidas</Link>
          </Button>

          <Dialog open={isNewModalOpen} onOpenChange={setIsNewModalOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="rounded-xl text-xs font-bold bg-foreground text-background hover:bg-foreground/90 gap-1.5">
                <Plus className="size-4" />
                <span>Nova Proposta</span>
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md sm:rounded-3xl p-6 bg-card border-border">
              <DialogHeader className="space-y-1">
                <DialogTitle className="text-base font-bold text-foreground">
                  Criar Nova Proposta de Viagem
                </DialogTitle>
              </DialogHeader>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newClientName || !newClientWhatsapp || !newDestination) {
                    toast.error("Preencha cliente, WhatsApp e destino.");
                    return;
                  }
                  createMutation.mutate();
                }}
                className="space-y-3.5 pt-2"
              >
                <div className="space-y-1">
                  <Label className="text-xs font-bold">Título da Proposta (Opcional)</Label>
                  <Input
                    placeholder="Ex: Férias em Família em Gramado"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="h-10 text-xs rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold">Destino Principal *</Label>
                  <Input
                    placeholder="Ex: Gramado, RS"
                    value={newDestination}
                    onChange={(e) => setNewDestination(e.target.value)}
                    className="h-10 text-xs rounded-xl"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold">Nome do Cliente *</Label>
                    <Input
                      placeholder="Nome completo"
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                      className="h-10 text-xs rounded-xl"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold">WhatsApp *</Label>
                    <Input
                      placeholder="(49) 99999-9999"
                      value={newClientWhatsapp}
                      onChange={(e) => setNewClientWhatsapp(e.target.value)}
                      className="h-10 text-xs rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold">Data Ida</Label>
                    <Input
                      type="date"
                      value={newStartDate}
                      onChange={(e) => setNewStartDate(e.target.value)}
                      className="h-10 text-xs rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold">Data Volta</Label>
                    <Input
                      type="date"
                      value={newEndDate}
                      onChange={(e) => setNewEndDate(e.target.value)}
                      className="h-10 text-xs rounded-xl"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="w-full h-11 rounded-xl text-xs font-bold bg-foreground text-background mt-2"
                >
                  {createMutation.isPending ? "Criando e abrindo Studio..." : "Criar e Abrir no Studio"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* ── 2. FILTROS & BUSCA ── */}
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
          placeholder="Buscar proposta por título, cliente ou destino..."
          className="h-10 max-w-xs rounded-xl text-xs bg-card border-border/60"
        />
      </div>

      {/* ── 3. GRID DE PROPOSTAS ── */}
      {proposalsList.length === 0 ? (
        <div className="py-20 text-center space-y-3 bg-card rounded-2xl border border-border/60 p-8">
          <FileText className="size-10 mx-auto text-muted-foreground" />
          <h3 className="text-sm font-bold text-foreground">Nenhuma proposta encontrada</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Crie sua primeira lâmina visual ou gere propostas a partir das cotações recebidas.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {proposalsList.map((p: TravelProposalDTO) => {
            const totalCents = p.pricing?.total_price_cents || 0;
            return (
              <Card
                key={p.id}
                className="p-5 rounded-2xl border border-border/60 bg-card space-y-4 hover:border-primary/40 transition-all flex flex-col justify-between"
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
                      {p.status === "approved" ? "✓ Aprovada" : p.status === "sent" ? "Enviada" : "Rascunho"}
                    </Badge>
                  </div>

                  <h3 className="text-sm font-bold text-foreground line-clamp-1">{p.title}</h3>

                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p>
                      Cliente: <span className="font-bold text-foreground">{p.client_name}</span>
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

                <div className="flex items-center gap-2 pt-2 border-t border-border/40">
                  <Button asChild size="sm" variant="outline" className="flex-1 rounded-xl text-xs font-bold h-9">
                    <Link to={`/proposta/${p.public_token}` as any} target="_blank">
                      Ver Online
                    </Link>
                  </Button>
                  <Button asChild size="sm" className="flex-1 rounded-xl text-xs font-bold h-9 bg-foreground text-background">
                    <Link to="/workspace/turismo/propostas/$id" params={{ id: p.id } as any}>
                      Editar no Studio
                    </Link>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
