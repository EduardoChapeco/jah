import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Kanban, Users, Plus, Search, DollarSign, Phone, Mail, UserCheck, CheckCircle2, Clock, MoreVertical, Plane, Edit3, Calendar, MapPin, Tag, CheckSquare, Square, AlertTriangle, ChevronRight, ChevronLeft, X, Trash2, Layers } from 'lucide-react';
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  listLeads,
  updateLeadStatus,
  updateLeadDetails,
  promoteLeadToCustomer,
  createLead,
  toggleLeadChecklist,
  deleteLead,
} from "@/services/crm.functions";
import { listTeamMembers } from "@/services/admin-team.functions";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/workspace/comercial")({
  head: () => ({ meta: [{ title: "Pipeline Comercial & Funil de Oportunidades | Workspace" }] }),
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
  dotColor: string;
  badgeClass: string;
  description: string;
}

const STAGES: StageColConfig[] = [
  {
    id: "new",
    title: "Novos Leads",
    dotColor: "bg-blue-500",
    badgeClass: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    description: "Contatos recém-chegados aguardando abordagem",
  },
  {
    id: "contacted",
    title: "Primeiro Contato",
    dotColor: "bg-amber-500",
    badgeClass: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    description: "Abordagem iniciada por WhatsApp, e-mail ou telefone",
  },
  {
    id: "qualified",
    title: "Qualificação",
    dotColor: "bg-purple-500",
    badgeClass: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    description: "Perfil, destino e orçamento validados",
  },
  {
    id: "proposal",
    title: "Proposta Enviada",
    dotColor: "bg-indigo-500",
    badgeClass: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
    description: "Cotação / lâmina visual apresentada ao cliente",
  },
  {
    id: "negotiation",
    title: "Negociação",
    dotColor: "bg-orange-500",
    badgeClass: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    description: "Ajuste de condições de pagamento e quartos",
  },
  {
    id: "won",
    title: "Fechado / Ganho",
    dotColor: "bg-emerald-500",
    badgeClass: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    description: "Venda confirmada pronta para emissão e voucher",
  },
  {
    id: "lost",
    title: "Perdido",
    dotColor: "bg-rose-500",
    badgeClass: "bg-rose-500/10 text-rose-600 border-rose-500/20",
    description: "Negociação declinada ou sem retorno",
  },
];

export const INTEREST_TYPES = [
  { value: "package_flight", label: "Pacote Aéreo Completo" },
  { value: "hotel", label: "Somente Hospedagem / Resort" },
  { value: "package_ground", label: "Excursão Rodoviária / Terrestre" },
  { value: "flights", label: "Passagens Aéreas" },
  { value: "cruise", label: "Cruzeiro Marítimo" },
  { value: "visa", label: "Visto & Passaporte" },
  { value: "corporate", label: "Corporativo / Negócios" },
  { value: "other", label: "Outros Serviços" },
] as const;

export const LEAD_SOURCES = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "balcao", label: "Balcão / Loja Física" },
  { value: "instagram", label: "Instagram" },
  { value: "google_ads", label: "Google Ads" },
  { value: "indicacao", label: "Indicação" },
  { value: "site", label: "Site / Biolink" },
  { value: "outros", label: "Outros" },
] as const;

export const POPULAR_TAGS = [
  { name: "Família", color: "#3b82f6" },
  { name: "Lua de Mel", color: "#ec4899" },
  { name: "Alta Renda", color: "#10b981" },
  { name: "Resort All-Inclusive", color: "#f59e0b" },
  { name: "Internacional", color: "#8b5cf6" },
  { name: "Urgente", color: "#ef4444" },
  { name: "Grupo", color: "#06b6d4" },
];

export const DEFAULT_CHECKLIST_TEMPLATE = [
  { id: "item-1", text: "Primeiro contato via WhatsApp realizado", done: false },
  { id: "item-2", text: "Orçamento e preferências alinhadas", done: false },
  { id: "item-3", text: "Cotação / Proposta montada e enviada", done: false },
  { id: "item-4", text: "Follow-up de negociação realizado", done: false },
  { id: "item-5", text: "Documentos coletados para emissão do contrato", done: false },
];

function formatPaxBreakdown(lead: any) {
  const adults = lead.pax_adults || 0;
  const children = lead.pax_children || 0;
  const infants = lead.pax_infants || 0;
  if (adults > 0 || children > 0 || infants > 0) {
    const parts = [];
    if (adults > 0) parts.push(`${adults} ADT`);
    if (children > 0) parts.push(`${children} CHD`);
    if (infants > 0) parts.push(`${infants} INF`);
    return parts.join(", ");
  }
  return `${lead.pax_count || 1} Pax`;
}

function getTravelPeriodDisplay(lead: any) {
  if (lead.interest_period) return lead.interest_period;
  if (lead.travel_start) {
    const start = new Date(lead.travel_start).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
    if (lead.travel_end) {
      const end = new Date(lead.travel_end).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
      return `${start} a ${end}`;
    }
    return start;
  }
  return null;
}

function getStalenessInfo(lead: any) {
  if (lead.status === "won" || lead.status === "lost" || lead.status === "converted") {
    return { isStale: false, isCold: false, diffDays: 0 };
  }
  const lastContact = lead.last_contacted_at ? new Date(lead.last_contacted_at) : new Date(lead.created_at);
  const diffDays = Math.ceil(Math.abs(Date.now() - lastContact.getTime()) / (1000 * 60 * 60 * 24));
  return {
    isStale: diffDays >= 5,
    isCold: diffDays >= 10,
    diffDays,
  };
}

function WorkspaceComercialPage() {
  const { leads, team } = Route.useLoaderData();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);
  const [newLeadTargetStage, setNewLeadTargetStage] = useState<LeadStage>("new");
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);
  const [isUpdatingLead, setIsUpdatingLead] = useState(false);

  // Formulário Avançado de Novo Lead (Padrão TravelAgências Enterprise)
  const initialNewLeadState = {
    name: "",
    email: "",
    phone: "",
    destination: "",
    interestType: "package_flight",
    interestPeriod: "",
    travelStart: "",
    travelEnd: "",
    paxAdults: 2,
    paxChildren: 0,
    paxInfants: 0,
    paxAgesStr: "",
    estimatedValueCents: 0,
    source: "whatsapp",
    leadSourceDetail: "",
    assignedTo: "",
    notes: "",
    tags: [] as string[],
    customChecklist: DEFAULT_CHECKLIST_TEMPLATE,
  };

  const [newLeadForm, setNewLeadForm] = useState(initialNewLeadState);

  // Formulário de Edição do Lead Selecionado (Ficha 360°)
  const [editLeadForm, setEditLeadForm] = useState<{
    destination: string;
    interest_type: string;
    interest_period: string;
    travel_start: string;
    travel_end: string;
    pax_adults: number;
    pax_children: number;
    pax_infants: number;
    pax_ages_str: string;
    estimated_value_cents: number;
    notes: string;
    status: string;
    source: string;
    lead_source_detail: string;
    assigned_to: string;
    tags: string[];
    checklist: Array<{ id: string; text: string; done: boolean }>;
    lost_reason: string;
  }>({
    destination: "",
    interest_type: "",
    interest_period: "",
    travel_start: "",
    travel_end: "",
    pax_adults: 1,
    pax_children: 0,
    pax_infants: 0,
    pax_ages_str: "",
    estimated_value_cents: 0,
    notes: "",
    status: "new",
    source: "whatsapp",
    lead_source_detail: "",
    assigned_to: "",
    tags: [],
    checklist: [],
    lost_reason: "",
  });

  const [newChecklistItemText, setNewChecklistItemText] = useState("");
  const [activeTabDetail, setActiveTabDetail] = useState<"viagem" | "checklist" | "comercial" | "notas">("viagem");

  const openLeadDetails = (lead: any) => {
    setSelectedLead(lead);
    const paxAgesStr = Array.isArray(lead.pax_ages) ? lead.pax_ages.join(", ") : "";
    setEditLeadForm({
      destination: lead.destination || "",
      interest_type: lead.interest_type || "",
      interest_period: lead.interest_period || "",
      travel_start: lead.travel_start || "",
      travel_end: lead.travel_end || "",
      pax_adults: lead.pax_adults || 1,
      pax_children: lead.pax_children || 0,
      pax_infants: lead.pax_infants || 0,
      pax_ages_str: paxAgesStr,
      estimated_value_cents: lead.estimated_value_cents || 0,
      notes: lead.notes || lead.message || "",
      status: lead.status || "new",
      source: lead.source || "whatsapp",
      lead_source_detail: lead.lead_source_detail || "",
      assigned_to: lead.assigned_to || "",
      tags: Array.isArray(lead.tags) ? lead.tags : [],
      checklist: Array.isArray(lead.checklist) ? lead.checklist : DEFAULT_CHECKLIST_TEMPLATE,
      lost_reason: lead.lost_reason || "",
    });
    setActiveTabDetail("viagem");
  };

  const filteredLeads = useMemo(() => {
    return leads.filter((l: any) => {
      const q = searchTerm.toLowerCase();
      const matchName = l.full_name?.toLowerCase().includes(q);
      const matchEmail = l.email?.toLowerCase().includes(q);
      const matchPhone = l.phone?.toLowerCase().includes(q);
      const matchMsg = l.message?.toLowerCase().includes(q);
      const matchDest = l.destination?.toLowerCase().includes(q);
      const matchPeriod = l.interest_period?.toLowerCase().includes(q);
      return matchName || matchEmail || matchPhone || matchMsg || matchDest || matchPeriod;
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
      toast.success("Oportunidade movida no funil com sucesso!");
      if (selectedLead?.id === leadId) {
        setSelectedLead((prev: any) => (prev ? { ...prev, status: newStage } : null));
      }
      router.invalidate();
    } catch (err: any) {
      toast.error(err.message || "Erro ao mover lead.");
    }
  };

  const handlePromoteToCustomer = async (leadId: string) => {
    try {
      await promoteLeadToCustomer({ data: { leadId } });
      toast.success("Lead promovido com sucesso para a Carteira de Clientes 360°!");
      setSelectedLead(null);
      router.invalidate();
    } catch (err: any) {
      toast.error(err.message || "Erro ao converter lead.");
    }
  };

  const handleCreateNewLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadForm.name.trim()) {
      toast.error("Informe o nome do passageiro / titular.");
      return;
    }
    setIsSubmittingNew(true);
    try {
      const paxAges = (newLeadForm.paxAgesStr || "")
        .split(",")
        .map((s) => parseInt(s.trim()))
        .filter((n) => !isNaN(n));

      await createLead({
        data: {
          fullName: newLeadForm.name.trim(),
          email: newLeadForm.email.trim() || null,
          phone: newLeadForm.phone.trim() || null,
          destination: newLeadForm.destination.trim() || null,
          interestType: newLeadForm.interestType || null,
          interestPeriod: newLeadForm.interestPeriod.trim() || null,
          travelStart: newLeadForm.travelStart || null,
          travelEnd: newLeadForm.travelEnd || null,
          paxAdults: Number(newLeadForm.paxAdults) || 1,
          paxChildren: Number(newLeadForm.paxChildren) || 0,
          paxInfants: Number(newLeadForm.paxInfants) || 0,
          paxAges,
          estimatedValueCents: newLeadForm.estimatedValueCents || 0,
          source: newLeadForm.source,
          leadSourceDetail: newLeadForm.leadSourceDetail.trim() || null,
          status: newLeadTargetStage,
          assignedTo: newLeadForm.assignedTo || null,
          tags: newLeadForm.tags,
          checklist: newLeadForm.customChecklist,
          notes: newLeadForm.notes.trim() || null,
        },
      });

      toast.success("Oportunidade adicionada com sucesso ao funil comercial!");
      setIsNewLeadOpen(false);
      setNewLeadForm(initialNewLeadState);
      router.invalidate();
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar oportunidade.");
    } finally {
      setIsSubmittingNew(false);
    }
  };

  const handleSaveLeadDetails = async () => {
    if (!selectedLead) return;
    setIsUpdatingLead(true);
    try {
      const paxAges = (editLeadForm.pax_ages_str || "")
        .split(",")
        .map((s) => parseInt(s.trim()))
        .filter((n) => !isNaN(n));

      await updateLeadDetails({
        data: {
          leadId: selectedLead.id,
          destination: editLeadForm.destination || null,
          interestType: editLeadForm.interest_type || null,
          interestPeriod: editLeadForm.interest_period || null,
          travelStart: editLeadForm.travel_start || null,
          travelEnd: editLeadForm.travel_end || null,
          paxAdults: Number(editLeadForm.pax_adults) || 1,
          paxChildren: Number(editLeadForm.pax_children) || 0,
          paxInfants: Number(editLeadForm.pax_infants) || 0,
          paxAges,
          estimated_value_cents: editLeadForm.estimated_value_cents,
          notes: editLeadForm.notes,
          status: editLeadForm.status as any,
          source: editLeadForm.source,
          lead_source_detail: editLeadForm.lead_source_detail || null,
          assigned_to: editLeadForm.assigned_to || null,
          tags: editLeadForm.tags,
          checklist: editLeadForm.checklist,
          lost_reason: editLeadForm.lost_reason || null,
        },
      });
      toast.success("Detalhes do lead atualizados com sucesso!");
      setSelectedLead(null);
      router.invalidate();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar alterações.");
    } finally {
      setIsUpdatingLead(false);
    }
  };

  const handleToggleChecklist = async (itemId: string) => {
    if (!selectedLead) return;
    try {
      const res = await toggleLeadChecklist({
        data: {
          leadId: selectedLead.id,
          itemId,
        },
      });
      if (res.checklist) {
        setEditLeadForm((prev) => ({ ...prev, checklist: res.checklist }));
        setSelectedLead((prev: any) => (prev ? { ...prev, checklist: res.checklist } : null));
      }
      router.invalidate();
    } catch (err: any) {
      toast.error(err.message || "Erro ao atualizar checklist.");
    }
  };

  const handleAddChecklistItem = () => {
    if (!newChecklistItemText.trim()) return;
    const newItem = {
      id: `custom-${Date.now()}`,
      text: newChecklistItemText.trim(),
      done: false,
    };
    setEditLeadForm((prev) => ({
      ...prev,
      checklist: [...prev.checklist, newItem],
    }));
    setNewChecklistItemText("");
  };

  const handleRemoveChecklistItem = (id: string) => {
    setEditLeadForm((prev) => ({
      ...prev,
      checklist: prev.checklist.filter((i) => i.id !== id),
    }));
  };

  const handleToggleTag = (tagStr: string) => {
    setEditLeadForm((prev) => {
      const exists = prev.tags.includes(tagStr);
      return {
        ...prev,
        tags: exists ? prev.tags.filter((t) => t !== tagStr) : [...prev.tags, tagStr],
      };
    });
  };

  const handleToggleNewLeadTag = (tagStr: string) => {
    setNewLeadForm((prev) => {
      const exists = prev.tags.includes(tagStr);
      return {
        ...prev,
        tags: exists ? prev.tags.filter((t) => t !== tagStr) : [...prev.tags, tagStr],
      };
    });
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!confirm("Tem certeza que deseja remover este lead do funil comercial?")) return;
    try {
      await deleteLead({ data: { leadId } });
      toast.success("Lead removido com sucesso!");
      setSelectedLead(null);
      router.invalidate();
    } catch (err: any) {
      toast.error(err.message || "Erro ao remover lead.");
    }
  };

  return (
    <div className="flex flex-col gap-5 w-full min-h-[calc(100vh-120px)] pb-12">
      {/* ── HEADER PRINCIPAL & AÇÕES ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/50 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
              Comercial & Vendas
            </span>
            <span className="text-muted-foreground/40">/</span>
            <span className="text-xs font-bold text-primary">Funil de Oportunidades (TravelAgências Standard)</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
            Pipeline Comercial & Negociações
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="rounded-xl text-xs font-semibold gap-1.5 border-border/80 hover:bg-muted"
          >
            <Link to="/workspace/clientes">
              <Users className="size-3.5 text-primary" />
              <span>Carteira de Clientes 360°</span>
            </Link>
          </Button>

          <Button
            onClick={() => {
              setNewLeadTargetStage("new");
              setIsNewLeadOpen(true);
            }}
            size="sm"
            className="rounded-xl text-xs font-semibold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-xs"
          >
            <Plus className="size-3.5" />
            <span>Nova Oportunidade</span>
          </Button>
        </div>
      </div>

      {/* ── MÉTRICAS COMPACTAS DO FUNIL (APPLE HIG) ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl border border-border/70 bg-card/70 backdrop-blur-xs flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-wider block">
              Valor no Pipeline
            </span>
            <p className="text-base sm:text-lg font-bold text-foreground font-mono mt-0.5">
              {formatMoney(totalPipelineCents)}
            </p>
          </div>
          <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shrink-0">
            <DollarSign className="size-4.5" />
          </div>
        </div>

        <div className="p-3.5 rounded-2xl border border-border/70 bg-card/70 backdrop-blur-xs flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-wider block">
              Leads em Atendimento
            </span>
            <p className="text-base sm:text-lg font-bold text-foreground font-mono mt-0.5">
              {filteredLeads.filter((l: any) => l.status !== "lost" && l.status !== "won" && l.status !== "converted").length}
            </p>
          </div>
          <div className="size-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20 shrink-0">
            <Kanban className="size-4.5" />
          </div>
        </div>

        <div className="p-3.5 rounded-2xl border border-border/70 bg-card/70 backdrop-blur-xs flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-wider block">
              Ganhos / Convertidos
            </span>
            <p className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
              {filteredLeads.filter((l: any) => l.status === "won" || l.status === "converted").length}
            </p>
          </div>
          <div className="size-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 shrink-0">
            <CheckCircle2 className="size-4.5" />
          </div>
        </div>

        <div className="p-3.5 rounded-2xl border border-border/70 bg-card/70 backdrop-blur-xs flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-wider block">
              Leads Perdidos
            </span>
            <p className="text-base sm:text-lg font-bold text-rose-600 dark:text-rose-400 font-mono mt-0.5">
              {filteredLeads.filter((l: any) => l.status === "lost").length}
            </p>
          </div>
          <div className="size-9 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20 shrink-0">
            <Clock className="size-4.5" />
          </div>
        </div>
      </div>

      {/* ── BARRA DE PESQUISA & FILTROS ── */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, destino, período ou fone..."
            className="h-9 pl-9 text-xs rounded-xl bg-background border-border/80 shadow-2xs"
          />
        </div>
        <div className="text-[11px] font-mono text-muted-foreground hidden sm:block">
          Mostrando <strong>{filteredLeads.length}</strong> de <strong>{leads.length}</strong> oportunidades
        </div>
      </div>

      {/* ── KANBAN BOARD FULL VERTICAL & HORIZONTAL (ENTERPRISE STANDARD) ── */}
      <div className="flex-1 flex gap-4 overflow-x-auto no-scrollbar pb-6 pt-1 items-stretch [scrollbar-width:thin] scrollbar-thumb-border/60 scrollbar-track-transparent">
        {STAGES.map((stage, stageIndex) => {
          const stageLeads = filteredLeads.filter((l: any) => {
            if (stage.id === "won") return l.status === "won" || l.status === "converted";
            return l.status === stage.id || (!l.status && stage.id === "new");
          });

          const stageTotalCents = stageLeads.reduce(
            (sum: number, l: any) => sum + (l.estimated_value_cents || 0),
            0
          );

          const prevStage = stageIndex > 0 ? STAGES[stageIndex - 1] : null;
          const nextStage = stageIndex < STAGES.length - 1 ? STAGES[stageIndex + 1] : null;

          return (
            <div
              key={stage.id}
              className="flex flex-col rounded-2xl border border-border/70 bg-card/50 backdrop-blur-xs w-[330px] min-w-[330px] shrink-0 min-h-[580px] lg:min-h-[calc(100vh-320px)] shadow-2xs transition-all"
            >
              {/* Header da Coluna com Somatório e Ação Rápida */}
              <div className="p-3.5 pb-2.5 border-b border-border/60 bg-muted/25 rounded-t-2xl space-y-1.5 sticky top-0 z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={cn("size-2.5 rounded-full ring-2 ring-background", stage.dotColor)} />
                    <h3 className="text-xs font-bold text-foreground truncate">{stage.title}</h3>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Badge variant="secondary" className="text-[10px] font-mono px-1.5 py-0 h-5">
                      {stageLeads.length}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setNewLeadTargetStage(stage.id);
                        setIsNewLeadOpen(true);
                      }}
                      className="size-6 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                      title={`Novo lead em ${stage.title}`}
                    >
                      <Plus className="size-3" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                  <span className="truncate">{stage.description}</span>
                  {stageTotalCents > 0 && (
                    <span className="font-bold text-foreground shrink-0">{formatMoney(stageTotalCents)}</span>
                  )}
                </div>
              </div>

              {/* Lista de Cards da Coluna */}
              <div className="p-3 space-y-3 flex-1 overflow-y-auto no-scrollbar max-h-[calc(100vh-380px)] [scrollbar-width:thin]">
                {stageLeads.length === 0 ? (
                  <div className="h-36 rounded-xl border border-dashed border-border/70 flex flex-col items-center justify-center p-4 text-center text-muted-foreground gap-1.5">
                    <span className="text-xs font-medium">Nenhum lead nesta etapa</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setNewLeadTargetStage(stage.id);
                        setIsNewLeadOpen(true);
                      }}
                      className="h-7 px-3 rounded-xl text-[11px] font-bold gap-1.5 border-border/60 hover:bg-muted cursor-pointer mt-1"
                    >
                      <Plus className="size-3" />
                      <span>Adicionar Lead</span>
                    </Button>
                  </div>
                ) : (
                  stageLeads.map((lead: any) => {
                    const initials = lead.full_name
                      ? lead.full_name
                          .split(" ")
                          .map((n: string) => n[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()
                      : "L";

                    const cleanPhone = lead.phone ? lead.phone.replace(/\D/g, "") : "";
                    const whatsappUrl = cleanPhone
                      ? `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(
                          `Olá ${lead.full_name}, tudo bem? Sou da equipe comercial da agência de viagens. Gostaria de dar andamento à sua viagem ${lead.destination ? `para ${lead.destination}` : ""}.`
                        )}`
                      : null;

                    const staleness = getStalenessInfo(lead);
                    const travelPeriod = getTravelPeriodDisplay(lead);
                    const paxBreakdown = formatPaxBreakdown(lead);

                    // Checklist stats
                    const checklistItems: Array<{ id: string; text: string; done: boolean }> = Array.isArray(lead.checklist)
                      ? lead.checklist
                      : [];
                    const totalTasks = checklistItems.length;
                    const doneTasks = checklistItems.filter((t) => t.done).length;

                    // Assigned team member
                    const assignedMember = team.find((m: any) => (m.profile_id || m.id) === lead.assigned_to);

                    return (
                      <div
                        key={lead.id}
                        onClick={() => openLeadDetails(lead)}
                        className={cn(
                          "p-3.5 rounded-2xl border bg-card hover:border-primary/50 transition-all shadow-xs hover:shadow-md space-y-2.5 text-xs group/card cursor-pointer relative",
                          staleness.isCold
                            ? "border-rose-500/40 bg-rose-500/[0.02]"
                            : staleness.isStale
                              ? "border-amber-500/40 bg-amber-500/[0.02]"
                              : "border-border/70"
                        )}
                      >
                        {/* Topo do Card: Avatar, Nome, Origem e Menu */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <Avatar className="size-7 rounded-xl shrink-0 border border-border/60">
                              <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-bold text-foreground text-xs truncate group-hover/card:text-primary transition-colors">
                                {lead.full_name}
                              </h4>
                              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground truncate">
                                {lead.phone && <span>{lead.phone}</span>}
                                {lead.lead_source_detail && (
                                  <>
                                    <span>•</span>
                                    <span className="font-mono uppercase font-semibold text-primary/80">
                                      {lead.lead_source_detail}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-6 rounded-lg text-muted-foreground hover:text-foreground shrink-0"
                              >
                                <MoreVertical className="size-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="text-xs w-52 p-1.5 rounded-2xl">
                              <DropdownMenuItem onClick={() => openLeadDetails(lead)} className="cursor-pointer font-medium">
                                <Edit3 className="size-3.5 mr-2" />
                                Abrir Ficha 360°
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase font-mono">
                                Mover para Estágio:
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
                                className="text-emerald-600 font-bold cursor-pointer"
                              >
                                <UserCheck className="size-3.5 mr-2" />
                                Converter em Cliente
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteLead(lead.id)}
                                className="text-rose-600 font-medium cursor-pointer"
                              >
                                <Trash2 className="size-3.5 mr-2" />
                                Excluir Lead
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Alerta de Inatividade / Staleness */}
                        {staleness.isStale && (
                          <div
                            className={cn(
                              "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md inline-flex items-center gap-1 border",
                              staleness.isCold
                                ? "bg-rose-500/10 text-rose-600 border-rose-500/30"
                                : "bg-amber-500/10 text-amber-600 border-amber-500/30"
                            )}
                          >
                            <AlertTriangle className="size-2.5 shrink-0" />
                            <span>
                              {staleness.isCold ? "Inativo há" : "Sem Resposta há"} {staleness.diffDays} dias
                            </span>
                          </div>
                        )}

                        {/* Bloco de Destino, Período & Passageiros */}
                        {(lead.destination || travelPeriod || lead.pax_count > 1) && (
                          <div className="p-2 rounded-xl bg-muted/40 border border-border/40 space-y-1 text-[11px]">
                            {lead.destination && (
                              <div className="font-bold text-foreground flex items-center gap-1.5 truncate">
                                <MapPin className="size-3 text-primary shrink-0" />
                                <span className="truncate">{lead.destination}</span>
                              </div>
                            )}
                            <div className="flex flex-wrap items-center gap-x-1.5 text-[10px] text-muted-foreground pl-4">
                              {travelPeriod && <span>{travelPeriod}</span>}
                              {travelPeriod && <span>•</span>}
                              <span className="font-medium text-foreground/80">{paxBreakdown}</span>
                            </div>
                          </div>
                        )}

                        {/* Tags com Cores */}
                        {lead.tags && Array.isArray(lead.tags) && lead.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {lead.tags.map((tag: string) => {
                              const [name, color] = tag.split(":");
                              return (
                                <span
                                  key={tag}
                                  className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md text-white shadow-2xs"
                                  style={{ backgroundColor: color || "#3b82f6" }}
                                >
                                  {name}
                                </span>
                              );
                            })}
                          </div>
                        )}

                        {/* Valor Estimado & Checklist / Equipe */}
                        <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-border/40">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-xs text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-lg">
                              {lead.estimated_value_cents > 0
                                ? formatMoney(lead.estimated_value_cents)
                                : "A orçar"}
                            </span>

                            {totalTasks > 0 && (
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-md border font-medium",
                                  doneTasks === totalTasks
                                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 font-bold"
                                    : "bg-muted text-muted-foreground border-border/60"
                                )}
                                title={`Checklist: ${doneTasks} de ${totalTasks} concluídos`}
                              >
                                <CheckCircle2 className="size-2.5 shrink-0" />
                                <span>{doneTasks}/{totalTasks}</span>
                              </span>
                            )}
                          </div>

                          {assignedMember && (
                            <span className="text-[9px] font-medium text-muted-foreground truncate max-w-[80px]">
                              {assignedMember.name?.split(" ")[0] || "Agente"}
                            </span>
                          )}
                        </div>

                        {/* Rodapé do Card: Ações Rápidas (WhatsApp, Cotação & Navegação) */}
                        <div className="pt-1.5 border-t border-border/40 flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1">
                            {prevStage && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveStage(lead.id, prevStage.id);
                                }}
                                className="size-6 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                                title={`Voltar para ${prevStage.title}`}
                              >
                                <ChevronLeft className="size-3.5" />
                              </Button>
                            )}

                            {nextStage && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveStage(lead.id, nextStage.id);
                                }}
                                className="size-6 rounded-lg text-primary hover:bg-primary/10 cursor-pointer"
                                title={`Avançar para ${nextStage.title}`}
                              >
                                <ChevronRight className="size-3.5" />
                              </Button>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            {whatsappUrl && (
                              <a
                                href={whatsappUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="h-6 px-2 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors font-bold text-[10px] inline-flex items-center gap-1"
                                title="Conversar no WhatsApp"
                              >
                                <Phone className="size-2.5" />
                                <span>Whats</span>
                              </a>
                            )}

                            <Button
                              asChild
                              variant="outline"
                              size="sm"
                              onClick={(e) => e.stopPropagation()}
                              className="h-6 px-2 rounded-lg text-[10px] font-bold text-primary border-primary/25 hover:bg-primary/10 gap-1 cursor-pointer"
                            >
                              <Link
                                to="/workspace/turismo/cotacoes"
                                search={{
                                  leadName: lead.full_name,
                                  leadPhone: lead.phone || undefined,
                                  leadEmail: lead.email || undefined,
                                  destination: lead.destination || undefined,
                                } as any}
                              >
                                <Plane className="size-2.5" />
                                <span>Cotação</span>
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── MODAL / SHEET LATERAL DE NOVA OPORTUNIDADE (TRAVELAGÊNCIAS STANDARD) ── */}
      <Sheet open={isNewLeadOpen} onOpenChange={setIsNewLeadOpen}>
        <SheetContent side="right" className="sm:max-w-2xl p-6 flex flex-col justify-between overflow-y-auto no-scrollbar">
          <div className="space-y-6">
            <SheetHeader className="p-0 text-left space-y-1 border-b border-border/50 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md">
                  TravelAgências Standard
                </span>
                <span className="text-xs text-muted-foreground">Etapa: {STAGES.find((s) => s.id === newLeadTargetStage)?.title}</span>
              </div>
              <SheetTitle className="text-lg font-bold text-foreground">Nova Oportunidade Comercial</SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground">
                Cadastre viajantes e viagens com todas as especificações de voo, hotel e passageiros.
              </SheetDescription>
            </SheetHeader>

            <form id="new-lead-form" onSubmit={handleCreateNewLead} className="space-y-5">
              {/* Bloco 1: Contato & Titular */}
              <div className="space-y-3 p-3.5 rounded-2xl border border-border/60 bg-muted/20">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Users className="size-3.5 text-primary" />
                  <span>Titular / Contato Principal</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold">Nome Completo *</Label>
                    <Input
                      value={newLeadForm.name}
                      onChange={(e) => setNewLeadForm((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: Roberto Carlos Silva"
                      className="h-8 text-xs rounded-xl"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold">Telefone / WhatsApp *</Label>
                    <Input
                      value={newLeadForm.phone}
                      onChange={(e) => setNewLeadForm((prev) => ({ ...prev, phone: e.target.value }))}
                      placeholder="(49) 99999-9999"
                      className="h-8 text-xs rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold">E-mail</Label>
                    <Input
                      type="email"
                      value={newLeadForm.email}
                      onChange={(e) => setNewLeadForm((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="roberto@email.com"
                      className="h-8 text-xs rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold">Canal / Origem</Label>
                    <Select
                      value={newLeadForm.source}
                      onValueChange={(val) => setNewLeadForm((prev) => ({ ...prev, source: val }))}
                    >
                      <SelectTrigger className="h-8 text-xs rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {LEAD_SOURCES.map((s) => (
                          <SelectItem key={s.value} value={s.value} className="text-xs">
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Bloco 2: Viagem, Destino & Período */}
              <div className="space-y-3 p-3.5 rounded-2xl border border-border/60 bg-muted/20">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-primary" />
                  <span>Viagem, Destino & Período</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-[11px] font-semibold">Destino de Interesse</Label>
                    <Input
                      value={newLeadForm.destination}
                      onChange={(e) => setNewLeadForm((prev) => ({ ...prev, destination: e.target.value }))}
                      placeholder="Ex: Maceió, AL ou Paris, França"
                      className="h-8 text-xs rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold">Tipo de Interesse</Label>
                    <Select
                      value={newLeadForm.interestType}
                      onValueChange={(val) => setNewLeadForm((prev) => ({ ...prev, interestType: val }))}
                    >
                      <SelectTrigger className="h-8 text-xs rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {INTEREST_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value} className="text-xs">
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold">Período Flexível / Mês</Label>
                    <Input
                      value={newLeadForm.interestPeriod}
                      onChange={(e) => setNewLeadForm((prev) => ({ ...prev, interestPeriod: e.target.value }))}
                      placeholder="Ex: Julho/2026, Réveillon"
                      className="h-8 text-xs rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold">Data Prevista de Ida</Label>
                    <Input
                      type="date"
                      value={newLeadForm.travelStart}
                      onChange={(e) => setNewLeadForm((prev) => ({ ...prev, travelStart: e.target.value }))}
                      className="h-8 text-xs rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold">Data Prevista de Volta</Label>
                    <Input
                      type="date"
                      value={newLeadForm.travelEnd}
                      onChange={(e) => setNewLeadForm((prev) => ({ ...prev, travelEnd: e.target.value }))}
                      className="h-8 text-xs rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* Bloco 3: Passageiros / Pax & Regras IATA */}
              <div className="space-y-3 p-3.5 rounded-2xl border border-border/60 bg-muted/20">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Plane className="size-3.5 text-primary" />
                  <span>Passageiros (Pax)</span>
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold">Adultos (ADT)</Label>
                    <Input
                      type="number"
                      min={1}
                      value={newLeadForm.paxAdults}
                      onChange={(e) => setNewLeadForm((prev) => ({ ...prev, paxAdults: Number(e.target.value) || 1 }))}
                      className="h-8 text-xs rounded-xl font-mono"
                    />
                    <span className="text-[9px] text-muted-foreground block">≥ 12 anos</span>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold">Crianças (CHD)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={newLeadForm.paxChildren}
                      onChange={(e) => setNewLeadForm((prev) => ({ ...prev, paxChildren: Number(e.target.value) || 0 }))}
                      className="h-8 text-xs rounded-xl font-mono"
                    />
                    <span className="text-[9px] text-muted-foreground block">2 a 11 anos</span>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold">Bebês (INF)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={newLeadForm.paxInfants}
                      onChange={(e) => setNewLeadForm((prev) => ({ ...prev, paxInfants: Number(e.target.value) || 0 }))}
                      className="h-8 text-xs rounded-xl font-mono"
                    />
                    <span className="text-[9px] text-muted-foreground block">0 a 23 meses</span>
                  </div>
                </div>
                {newLeadForm.paxChildren > 0 && (
                  <div className="space-y-1 pt-1">
                    <Label className="text-[11px] font-semibold">Idades das Crianças</Label>
                    <Input
                      value={newLeadForm.paxAgesStr}
                      onChange={(e) => setNewLeadForm((prev) => ({ ...prev, paxAgesStr: e.target.value }))}
                      placeholder="Ex: 4, 8 (separadas por vírgula)"
                      className="h-8 text-xs rounded-xl"
                    />
                  </div>
                )}
              </div>

              {/* Bloco 4: Comercial, Tags & Observações */}
              <div className="space-y-3 p-3.5 rounded-2xl border border-border/60 bg-muted/20">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <DollarSign className="size-3.5 text-primary" />
                  <span>Comercial, Tags & Checklist</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold">Orçamento Estimado (R$)</Label>
                    <CurrencyField
                      value={newLeadForm.estimatedValueCents}
                      onChange={(cents) => setNewLeadForm((prev) => ({ ...prev, estimatedValueCents: cents }))}
                      className="h-8 text-xs rounded-xl font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold">Vendedor Responsável</Label>
                    <Select
                      value={newLeadForm.assignedTo || "none"}
                      onValueChange={(val) => setNewLeadForm((prev) => ({ ...prev, assignedTo: val === "none" ? "" : val }))}
                    >
                      <SelectTrigger className="h-8 text-xs rounded-xl">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="none" className="text-xs text-muted-foreground">
                          Sem responsável atribuído
                        </SelectItem>
                        {team.map((m: any) => (
                          <SelectItem key={m.id || m.profile_id} value={m.profile_id || m.id} className="text-xs">
                            {m.name || m.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Seleção de Tags Populares */}
                <div className="space-y-1.5 pt-1">
                  <Label className="text-[11px] font-semibold">Tags de Segmentação</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {POPULAR_TAGS.map((t) => {
                      const tagStr = `${t.name}:${t.color}`;
                      const isSelected = newLeadForm.tags.includes(tagStr);
                      return (
                        <button
                          key={tagStr}
                          type="button"
                          onClick={() => handleToggleNewLeadTag(tagStr)}
                          className={cn(
                            "text-[10px] font-bold uppercase px-2 py-0.5 rounded-md transition-all cursor-pointer border",
                            isSelected
                              ? "text-white border-transparent shadow-xs"
                              : "text-muted-foreground border-border bg-background hover:border-primary/40"
                          )}
                          style={{ backgroundColor: isSelected ? t.color : undefined }}
                        >
                          {t.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <Label className="text-[11px] font-semibold">Observações / Notas Iniciais</Label>
                  <Textarea
                    value={newLeadForm.notes}
                    onChange={(e) => setNewLeadForm((prev) => ({ ...prev, notes: e.target.value }))}
                    placeholder="Preferências de resort, restrições alimentares, comemoração especial..."
                    className="text-xs rounded-xl resize-none"
                    rows={2}
                  />
                </div>
              </div>
            </form>
          </div>

          <SheetFooter className="p-0 pt-4 border-t border-border/60 flex items-center justify-between gap-2 mt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsNewLeadOpen(false)}
              className="rounded-xl text-xs font-semibold"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="new-lead-form"
              size="sm"
              disabled={isSubmittingNew}
              className="rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSubmittingNew ? "Salvando no Funil..." : "Salvar no Funil"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ── FICHA 360° DO LEAD (TRAVELAGÊNCIAS ENTERPRISE STANDARD) ── */}
      <Sheet open={!!selectedLead} onOpenChange={(open) => !open && setSelectedLead(null)}>
        <SheetContent side="right" className="sm:max-w-xl p-6 flex flex-col justify-between overflow-y-auto no-scrollbar">
          {selectedLead && (
            <>
              <div className="space-y-5">
                <SheetHeader className="p-0 text-left space-y-1 border-b border-border/50 pb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
                      Ficha 360° do Lead
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      ID: {selectedLead.id.slice(0, 8)}
                    </Badge>
                  </div>
                  <SheetTitle className="text-lg font-bold text-foreground">
                    {selectedLead.full_name}
                  </SheetTitle>
                  <SheetDescription className="text-xs text-muted-foreground">
                    Criado em {new Date(selectedLead.created_at).toLocaleDateString("pt-BR")} às {new Date(selectedLead.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </SheetDescription>
                </SheetHeader>

                {/* Ações Rápidas no Topo — Conexão Sistêmica com Cotações e Studio de Propostas */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {selectedLead.phone && (
                    <a
                      href={`https://wa.me/55${selectedLead.phone.replace(/\D/g, "")}?text=${encodeURIComponent(
                        `Olá ${selectedLead.full_name}! Sou da agência de viagens. Gostaria de falar sobre sua viagem ${selectedLead.destination ? `para ${selectedLead.destination}` : ""}.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 border border-emerald-500/20 flex items-center justify-center gap-1.5 font-bold text-xs transition-colors"
                    >
                      <Phone className="size-3.5 shrink-0" />
                      <span className="truncate">WhatsApp</span>
                    </a>
                  )}

                  <Button
                    asChild
                    variant="outline"
                    className="h-auto p-2.5 rounded-xl border-border/80 text-foreground hover:bg-muted font-bold text-xs"
                  >
                    <Link
                      to="/workspace/turismo/cotacoes"
                      search={{
                        leadName: selectedLead.full_name,
                        leadPhone: selectedLead.phone || undefined,
                        leadEmail: selectedLead.email || undefined,
                        destination: selectedLead.destination || undefined,
                      } as any}
                    >
                      <Plane className="size-3.5 mr-1 text-primary shrink-0" />
                      <span className="truncate">Cotação</span>
                    </Link>
                  </Button>

                  <Button
                    asChild
                    variant="outline"
                    className="h-auto p-2.5 rounded-xl border-primary/40 bg-primary/5 text-primary hover:bg-primary/10 font-bold text-xs"
                  >
                    <Link
                      to="/workspace/turismo/propostas"
                      search={{
                        leadId: selectedLead.id,
                        clientName: selectedLead.full_name,
                        clientPhone: selectedLead.phone || undefined,
                        clientEmail: selectedLead.email || undefined,
                        destination: selectedLead.destination || undefined,
                        new: true,
                      } as any}
                    >
                      <Layers className="size-3.5 mr-1 text-primary shrink-0" />
                      <span className="truncate">Lâmina Studio</span>
                    </Link>
                  </Button>
                </div>

                {/* Abas da Ficha 360° */}
                <div className="flex border-b border-border/50 gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTabDetail("viagem")}
                    className={cn(
                      "pb-2 text-xs font-bold border-b-2 transition-colors cursor-pointer",
                      activeTabDetail === "viagem"
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Viagem & Destino
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTabDetail("checklist")}
                    className={cn(
                      "pb-2 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1",
                      activeTabDetail === "checklist"
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span>Checklist</span>
                    <Badge variant="secondary" className="text-[9px] h-4 px-1">
                      {editLeadForm.checklist.filter((i) => i.done).length}/{editLeadForm.checklist.length}
                    </Badge>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTabDetail("comercial")}
                    className={cn(
                      "pb-2 text-xs font-bold border-b-2 transition-colors cursor-pointer",
                      activeTabDetail === "comercial"
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Comercial & Funil
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTabDetail("notas")}
                    className={cn(
                      "pb-2 text-xs font-bold border-b-2 transition-colors cursor-pointer",
                      activeTabDetail === "notas"
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Notas & Histórico
                  </button>
                </div>

                {/* Aba 1: Viagem & Destino */}
                {activeTabDetail === "viagem" && (
                  <div className="space-y-4 pt-1">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Destino de Interesse</Label>
                      <Input
                        value={editLeadForm.destination}
                        onChange={(e) => setEditLeadForm((prev) => ({ ...prev, destination: e.target.value }))}
                        placeholder="Ex: Maceió, AL"
                        className="h-8 text-xs rounded-xl"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Tipo de Interesse</Label>
                        <Select
                          value={editLeadForm.interest_type || "none"}
                          onValueChange={(val) => setEditLeadForm((prev) => ({ ...prev, interest_type: val === "none" ? "" : val }))}
                        >
                          <SelectTrigger className="h-8 text-xs rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="none" className="text-xs text-muted-foreground">Não informado</SelectItem>
                            {INTEREST_TYPES.map((t) => (
                              <SelectItem key={t.value} value={t.value} className="text-xs">
                                {t.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Período Flexível</Label>
                        <Input
                          value={editLeadForm.interest_period}
                          onChange={(e) => setEditLeadForm((prev) => ({ ...prev, interest_period: e.target.value }))}
                          placeholder="Ex: Julho/2026"
                          className="h-8 text-xs rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Data de Ida</Label>
                        <Input
                          type="date"
                          value={editLeadForm.travel_start}
                          onChange={(e) => setEditLeadForm((prev) => ({ ...prev, travel_start: e.target.value }))}
                          className="h-8 text-xs rounded-xl"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Data de Volta</Label>
                        <Input
                          type="date"
                          value={editLeadForm.travel_end}
                          onChange={(e) => setEditLeadForm((prev) => ({ ...prev, travel_end: e.target.value }))}
                          className="h-8 text-xs rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-muted/20 border border-border/60">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold">Adultos</Label>
                        <Input
                          type="number"
                          min={1}
                          value={editLeadForm.pax_adults}
                          onChange={(e) => setEditLeadForm((prev) => ({ ...prev, pax_adults: Number(e.target.value) || 1 }))}
                          className="h-8 text-xs rounded-xl font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold">Crianças</Label>
                        <Input
                          type="number"
                          min={0}
                          value={editLeadForm.pax_children}
                          onChange={(e) => setEditLeadForm((prev) => ({ ...prev, pax_children: Number(e.target.value) || 0 }))}
                          className="h-8 text-xs rounded-xl font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold">Bebês</Label>
                        <Input
                          type="number"
                          min={0}
                          value={editLeadForm.pax_infants}
                          onChange={(e) => setEditLeadForm((prev) => ({ ...prev, pax_infants: Number(e.target.value) || 0 }))}
                          className="h-8 text-xs rounded-xl font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Idades das Crianças (separadas por vírgula)</Label>
                      <Input
                        value={editLeadForm.pax_ages_str}
                        onChange={(e) => setEditLeadForm((prev) => ({ ...prev, pax_ages_str: e.target.value }))}
                        placeholder="Ex: 5, 8"
                        className="h-8 text-xs rounded-xl"
                      />
                    </div>
                  </div>
                )}

                {/* Aba 2: Checklist Interativo */}
                {activeTabDetail === "checklist" && (
                  <div className="space-y-4 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">Tarefas de Atendimento</span>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {editLeadForm.checklist.filter((i) => i.done).length} de {editLeadForm.checklist.length} concluídas
                      </span>
                    </div>

                    <div className="space-y-2">
                      {editLeadForm.checklist.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-2.5 rounded-xl border border-border/60 bg-card hover:bg-muted/30 transition-colors gap-2"
                        >
                          <button
                            type="button"
                            onClick={() => handleToggleChecklist(item.id)}
                            className="flex items-center gap-2.5 text-left flex-1 cursor-pointer"
                          >
                            {item.done ? (
                              <CheckSquare className="size-4 text-emerald-500 shrink-0" />
                            ) : (
                              <Square className="size-4 text-muted-foreground shrink-0" />
                            )}
                            <span className={cn("text-xs", item.done && "line-through text-muted-foreground")}>
                              {item.text}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRemoveChecklistItem(item.id)}
                            className="text-muted-foreground/40 hover:text-rose-500 transition-colors p-1"
                          >
                            <X className="size-3" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Adicionar Nova Tarefa */}
                    <div className="flex items-center gap-2 pt-2">
                      <Input
                        value={newChecklistItemText}
                        onChange={(e) => setNewChecklistItemText(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddChecklistItem())}
                        placeholder="Adicionar tarefa ao atendimento..."
                        className="h-8 text-xs rounded-xl"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleAddChecklistItem}
                        className="h-8 px-3 rounded-xl text-xs font-bold"
                      >
                        <Plus className="size-3 mr-1" />
                        <span>Adicionar</span>
                      </Button>
                    </div>
                  </div>
                )}

                {/* Aba 3: Comercial & Funil */}
                {activeTabDetail === "comercial" && (
                  <div className="space-y-4 pt-1">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Etapa Atual no Funil</Label>
                      <Select
                        value={editLeadForm.status}
                        onValueChange={(val) => setEditLeadForm((prev) => ({ ...prev, status: val }))}
                      >
                        <SelectTrigger className="h-8 text-xs rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {STAGES.map((s) => (
                            <SelectItem key={s.id} value={s.id} className="text-xs">
                              {s.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Valor Estimado da Venda (R$)</Label>
                      <CurrencyField
                        value={editLeadForm.estimated_value_cents}
                        onChange={(cents) => setEditLeadForm((prev) => ({ ...prev, estimated_value_cents: cents }))}
                        className="h-8 text-xs rounded-xl font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Responsável da Equipe</Label>
                      <Select
                        value={editLeadForm.assigned_to || "none"}
                        onValueChange={(val) =>
                          setEditLeadForm((prev) => ({
                            ...prev,
                            assigned_to: val === "none" ? "" : val,
                          }))
                        }
                      >
                        <SelectTrigger className="h-8 text-xs rounded-xl">
                          <SelectValue placeholder="Selecione um vendedor..." />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="none" className="text-xs text-muted-foreground">
                            Sem responsável atribuído
                          </SelectItem>
                          {team.map((m: any) => (
                            <SelectItem key={m.id || m.profile_id} value={m.profile_id || m.id} className="text-xs">
                              {m.name || m.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {editLeadForm.status === "lost" && (
                      <div className="space-y-1.5 p-3 rounded-xl border border-rose-500/30 bg-rose-500/5">
                        <Label className="text-xs font-semibold text-rose-600">Motivo da Perda</Label>
                        <Input
                          value={editLeadForm.lost_reason}
                          onChange={(e) => setEditLeadForm((prev) => ({ ...prev, lost_reason: e.target.value }))}
                          placeholder="Ex: Preço elevado, fechou com concorrente, adiou planos..."
                          className="h-8 text-xs rounded-xl"
                        />
                      </div>
                    )}

                    {/* Gestão de Tags */}
                    <div className="space-y-2 pt-1">
                      <Label className="text-xs font-semibold">Tags da Oportunidade</Label>
                      <div className="flex flex-wrap gap-1.5">
                        {POPULAR_TAGS.map((t) => {
                          const tagStr = `${t.name}:${t.color}`;
                          const isSelected = editLeadForm.tags.includes(tagStr);
                          return (
                            <button
                              key={tagStr}
                              type="button"
                              onClick={() => handleToggleTag(tagStr)}
                              className={cn(
                                "text-[10px] font-bold uppercase px-2 py-0.5 rounded-md transition-all cursor-pointer border",
                                isSelected
                                  ? "text-white border-transparent shadow-xs"
                                  : "text-muted-foreground border-border bg-background hover:border-primary/40"
                              )}
                              style={{ backgroundColor: isSelected ? t.color : undefined }}
                            >
                              {t.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Aba 4: Notas & Histórico */}
                {activeTabDetail === "notas" && (
                  <div className="space-y-3 pt-1">
                    <Label className="text-xs font-semibold">Histórico & Anotações de Atendimento</Label>
                    <Textarea
                      value={editLeadForm.notes}
                      onChange={(e) => setEditLeadForm((prev) => ({ ...prev, notes: e.target.value }))}
                      placeholder="Registre o que foi conversado com o cliente, orçamentos cotados, datas preferidas..."
                      className="text-xs rounded-xl resize-none"
                      rows={8}
                    />
                  </div>
                )}
              </div>

              <SheetFooter className="p-0 pt-4 border-t border-border/60 flex items-center justify-between gap-2 mt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handlePromoteToCustomer(selectedLead.id)}
                  className="rounded-xl text-xs font-bold text-emerald-600 hover:bg-emerald-500/10 border-emerald-500/30 gap-1.5"
                >
                  <UserCheck className="size-3.5" />
                  <span>Converter em Cliente</span>
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedLead(null)}
                    className="rounded-xl text-xs font-semibold"
                  >
                    Fechar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={isUpdatingLead}
                    onClick={handleSaveLeadDetails}
                    className="rounded-xl text-xs font-semibold bg-primary text-primary-foreground"
                  >
                    {isUpdatingLead ? "Salvando..." : "Salvar Alterações"}
                  </Button>
                </div>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
