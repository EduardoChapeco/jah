import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Kanban,
  Users,
  Plus,
  Search,
  Filter,
  ArrowRight,
  TrendingUp,
  DollarSign,
  Phone,
  Mail,
  Calendar,
  UserCheck,
  Flame,
  CheckCircle2,
  XCircle,
  Clock,
  MoreVertical,
  ExternalLink,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CurrencyField } from "@/components/ui/currency-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  listLeads,
  updateLeadStatus,
  updateLeadDetails,
  promoteLeadToCustomer,
  submitContactForm,
} from "@/services/crm.functions";
import { listTeamMembers } from "@/services/admin-team.functions";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/workspace/comercial")({
  head: () => ({ meta: [{ title: "Funil Comercial & Pipeline de Vendas | Workspace" }] }),
  loader: async () => {
    const [leadsRes, teamRes] = await Promise.all([
      listLeads().catch(() => []),
      listTeamMembers().catch(() => []),
    ]);
    return {
      leads: leadsRes || [],
      team: teamRes || [],
    };
  },
  component: WorkspaceComercialPage,
});

type LeadStage = "new" | "contacted" | "qualified" | "proposal" | "negotiation" | "won" | "lost";

interface StageColConfig {
  id: LeadStage;
  title: string;
  color: string;
  badgeClass: string;
}

const STAGES: StageColConfig[] = [
  { id: "new", title: "Novos Leads", color: "bg-blue-500", badgeClass: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  { id: "contacted", title: "Primeiro Contato", color: "bg-amber-500", badgeClass: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  { id: "qualified", title: "Qualificação", color: "bg-purple-500", badgeClass: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
  { id: "proposal", title: "Proposta Enviada", color: "bg-indigo-500", badgeClass: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20" },
  { id: "negotiation", title: "Negociação", color: "bg-orange-500", badgeClass: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
  { id: "won", title: "Fechado / Ganho", color: "bg-emerald-500", badgeClass: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  { id: "lost", title: "Perdido", color: "bg-rose-500", badgeClass: "bg-rose-500/10 text-rose-600 border-rose-500/20" },
];

function WorkspaceComercialPage() {
  const { leads, team } = Route.useLoaderData();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);

  const [newLeadForm, setNewLeadForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
    estimated_value_cents: 0,
  });

  const filteredLeads = useMemo(() => {
    return leads.filter((l: any) => {
      const q = searchTerm.toLowerCase();
      const matchName = l.full_name?.toLowerCase().includes(q);
      const matchEmail = l.email?.toLowerCase().includes(q);
      const matchPhone = l.phone?.toLowerCase().includes(q);
      return matchName || matchEmail || matchPhone;
    });
  }, [leads, searchTerm]);

  // Total Pipeline Value
  const totalPipelineCents = useMemo(() => {
    return filteredLeads
      .filter((l: any) => l.status !== "lost")
      .reduce((sum: number, l: any) => sum + (l.estimated_value_cents || 0), 0);
  }, [filteredLeads]);

  const handleMoveStage = async (leadId: string, newStage: LeadStage) => {
    try {
      await updateLeadStatus({
        data: {
          leadId,
          status: newStage,
        },
      });
      toast.success("Lead movido com sucesso!");
      router.invalidate();
    } catch (err: any) {
      toast.error(err.message || "Erro ao mover lead.");
    }
  };

  const handlePromoteToCustomer = async (leadId: string) => {
    try {
      await promoteLeadToCustomer({ data: { leadId } });
      toast.success("Lead convertido com sucesso em Cliente da Carteira!");
      router.invalidate();
    } catch (err: any) {
      toast.error(err.message || "Erro ao converter lead.");
    }
  };

  const handleCreateNewLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadForm.name.trim()) {
      toast.error("Informe o nome do lead.");
      return;
    }
    setIsSubmittingNew(true);
    try {
      await submitContactForm({
        data: {
          name: newLeadForm.name,
          email: newLeadForm.email || undefined,
          phone: newLeadForm.phone || undefined,
          message: newLeadForm.message || "Lead cadastrado manualmente no Kanban Comercial.",
        },
      });
      toast.success("Novo lead adicionado ao funil!");
      setIsNewLeadOpen(false);
      setNewLeadForm({ name: "", email: "", phone: "", message: "", estimated_value_cents: 0 });
      router.invalidate();
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar lead.");
    } finally {
      setIsSubmittingNew(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full p-4 sm:p-6 pb-28">
      {/* Top Banner de Separação Arquitetural Canônica */}
      <div className="flex items-center justify-between p-3.5 px-4 rounded-2xl bg-muted/30 border border-border/70 text-xs">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Users className="size-4 text-primary" />
          <span>
            Você está no <strong>Funil Comercial (Kanban de Oportunidades)</strong>. Para ver o diretório cadastral completo, acesse a:
          </span>
        </div>
        <Link
          to="/workspace/clientes"
          className="font-semibold text-primary hover:underline flex items-center gap-1 shrink-0"
        >
          <span>Carteira de Clientes 360°</span>
          <ArrowRight className="size-3" />
        </Link>
      </div>

      {/* Header Principal Apple HIG */}
      <PageHeader
        eyebrow="Comercial & Vendas"
        title="Pipeline Comercial (Kanban)"
        actions={
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsNewLeadOpen(true)}
              size="sm"
              className="rounded-xl text-xs font-semibold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-xs"
            >
              <Plus className="size-3.5" />
              <span>Novo Lead</span>
            </Button>
          </div>
        }
      />

      {/* Métricas do Funil */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl border border-border/70 bg-card space-y-1">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Valor no Pipeline</span>
          <p className="text-lg font-bold text-foreground font-mono">{formatMoney(totalPipelineCents)}</p>
        </div>
        <div className="p-4 rounded-2xl border border-border/70 bg-card space-y-1">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Total de Leads Ativos</span>
          <p className="text-lg font-bold text-foreground font-mono">
            {filteredLeads.filter((l: any) => l.status !== "lost" && l.status !== "won" && l.status !== "converted").length}
          </p>
        </div>
        <div className="p-4 rounded-2xl border border-border/70 bg-card space-y-1">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Ganhos / Convertidos</span>
          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono">
            {filteredLeads.filter((l: any) => l.status === "won" || l.status === "converted").length}
          </p>
        </div>
        <div className="p-4 rounded-2xl border border-border/70 bg-card space-y-1">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Perdidos</span>
          <p className="text-lg font-bold text-rose-600 dark:text-rose-400 font-mono">
            {filteredLeads.filter((l: any) => l.status === "lost").length}
          </p>
        </div>
      </div>

      {/* Barra de Filtro */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por lead, e-mail ou telefone..."
            className="h-8 pl-8 text-xs rounded-xl bg-background border-border/80"
          />
        </div>
      </div>

      {/* ── KANBAN BOARD MULTI-COLUNA ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3 overflow-x-auto pb-6">
        {STAGES.map((stage) => {
          const stageLeads = filteredLeads.filter((l: any) => {
            if (stage.id === "won") return l.status === "won" || l.status === "converted";
            return l.status === stage.id || (!l.status && stage.id === "new");
          });

          const stageTotalCents = stageLeads.reduce(
            (sum: number, l: any) => sum + (l.estimated_value_cents || 0),
            0
          );

          return (
            <div
              key={stage.id}
              className="flex flex-col rounded-2xl border border-border/60 bg-muted/15 min-w-[240px] max-h-[75vh]"
            >
              {/* Header da Coluna */}
              <div className="p-3 pb-2 border-b border-border/50 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className={cn("size-2 rounded-full", stage.color)} />
                    <span className="text-xs font-semibold text-foreground truncate">{stage.title}</span>
                  </div>
                  <Badge variant="secondary" className="text-[10px] font-mono h-5 px-1.5">
                    {stageLeads.length}
                  </Badge>
                </div>
                <p className="text-[11px] font-mono text-muted-foreground">
                  {stageTotalCents > 0 ? formatMoney(stageTotalCents) : "R$ 0,00"}
                </p>
              </div>

              {/* Lista de Cards de Leads */}
              <div className="p-2 space-y-2 overflow-y-auto flex-1">
                {stageLeads.length === 0 ? (
                  <div className="p-4 text-center text-xs text-muted-foreground/60">
                    Nenhum lead nesta etapa
                  </div>
                ) : (
                  stageLeads.map((lead: any) => (
                    <div
                      key={lead.id}
                      className="p-3 rounded-xl border border-border/70 bg-card hover:border-primary/40 transition-all shadow-2xs space-y-2.5 text-xs group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5 flex-1 min-w-0">
                          <h4 className="font-semibold text-foreground truncate text-xs">{lead.full_name}</h4>
                          {lead.email && <p className="text-[11px] text-muted-foreground truncate">{lead.email}</p>}
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-6 rounded-lg text-muted-foreground">
                              <MoreVertical className="size-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="text-xs w-48">
                            <DropdownMenuItem onClick={() => setSelectedLead(lead)} className="cursor-pointer">
                              Ver Detalhes do Lead
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase">
                              Mover Para:
                            </div>
                            {STAGES.filter((s) => s.id !== stage.id).map((s) => (
                              <DropdownMenuItem
                                key={s.id}
                                onClick={() => handleMoveStage(lead.id, s.id)}
                                className="cursor-pointer text-[11px]"
                              >
                                → {s.title}
                              </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handlePromoteToCustomer(lead.id)}
                              className="text-emerald-600 font-semibold cursor-pointer"
                            >
                              <UserCheck className="size-3.5 mr-1.5" />
                              Converter em Cliente
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {lead.estimated_value_cents > 0 && (
                        <div className="text-xs font-semibold text-foreground font-mono bg-muted/40 px-2 py-1 rounded-lg inline-block">
                          {formatMoney(lead.estimated_value_cents)}
                        </div>
                      )}

                      {lead.phone && (
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <Phone className="size-3" />
                          <span>{lead.phone}</span>
                        </div>
                      )}

                      {/* Ação Rápida de Conversão */}
                      {lead.status !== "converted" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePromoteToCustomer(lead.id)}
                          className="w-full h-7 rounded-lg text-[11px] font-semibold text-emerald-600 hover:bg-emerald-500/10 gap-1 cursor-pointer"
                        >
                          <UserCheck className="size-3" />
                          <span>Converter em Cliente</span>
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal / Sheet de Novo Lead */}
      <Sheet open={isNewLeadOpen} onOpenChange={setIsNewLeadOpen}>
        <SheetContent side="right" className="sm:max-w-md p-6 flex flex-col justify-between">
          <div className="space-y-6">
            <SheetHeader className="p-0 text-left space-y-1">
              <SheetTitle className="text-base font-semibold">Novo Lead / Oportunidade</SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground">
                Cadastre um novo contato para acompanhar no funil comercial.
              </SheetDescription>
            </SheetHeader>

            <form id="new-lead-form" onSubmit={handleCreateNewLead} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Nome Completo *</Label>
                <Input
                  value={newLeadForm.name}
                  onChange={(e) => setNewLeadForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Carlos Silva"
                  className="h-9 text-xs rounded-xl"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">E-mail</Label>
                <Input
                  type="email"
                  value={newLeadForm.email}
                  onChange={(e) => setNewLeadForm((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="carlos@empresa.com"
                  className="h-9 text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Telefone / WhatsApp</Label>
                <Input
                  value={newLeadForm.phone}
                  onChange={(e) => setNewLeadForm((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="(49) 99999-9999"
                  className="h-9 text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Observações Iniciais / Interesse</Label>
                <Textarea
                  value={newLeadForm.message}
                  onChange={(e) => setNewLeadForm((prev) => ({ ...prev, message: e.target.value }))}
                  placeholder="Interesse em pacotes de viagem para o Nordeste..."
                  className="text-xs rounded-xl resize-none"
                  rows={3}
                />
              </div>
            </form>
          </div>

          <SheetFooter className="p-0 pt-6 border-t border-border/60 flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsNewLeadOpen(false)}
              className="flex-1 h-9 rounded-xl text-xs font-semibold"
            >
              Cancelar
            </Button>
            <Button
              form="new-lead-form"
              type="submit"
              disabled={isSubmittingNew}
              size="sm"
              className="flex-1 h-9 rounded-xl text-xs font-semibold bg-primary text-primary-foreground"
            >
              {isSubmittingNew ? "Salvando..." : "Salvar no Funil"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
