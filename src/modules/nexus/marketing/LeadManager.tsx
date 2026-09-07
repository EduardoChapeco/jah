
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Users,
    Search,
    Mail,
    Phone,
    Calendar,
    MoreHorizontal,
    UserPlus,
    Download,
    Eye,
    Tag,
    Share2,
    CheckCircle2,
    TrendingUp,
    LayoutGrid,
    List,
    PieChart as PieChartIcon,
    Edit,
    Sparkles
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { useEmpresa } from "@/hooks/useEmpresa";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import LeadsKanban from "./LeadsKanban";
import { ImportLeadsDialog } from "./components/ImportLeadsDialog";
import { MarketingAnalytics } from "./components/MarketingAnalytics";
import { LeadFormDialog } from "./components/LeadFormDialog";
import { LeadDetailsDrawer } from "./components/LeadDetailsDrawer";
import { LeadFormValues } from "@/lib/validations/marketing";
import { Lead } from "@/types/crm";

const statusColors: Record<string, string> = {
    novo: "bg-blue-50 text-blue-600 border-blue-100",
    contatado: "bg-amber-50 text-amber-600 border-amber-100",
    qualificado: "bg-purple-50 text-purple-600 border-purple-100",
    convertido: "bg-emerald-50 text-emerald-600 border-emerald-100",
    perdido: "bg-slate-50 text-slate-400 border-slate-200",
};

const statusLabels: Record<string, string> = {
    novo: "Novo",
    contatado: "Em Contato",
    qualificado: "Qualificado",
    convertido: "Convertido",
    perdido: "Perdido",
};

type LeadWithRelations = Lead;

export default function LeadManager() {
    const { empresa } = useEmpresa();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'analytics'>('list');

    // Dialog State
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingLead, setEditingLead] = useState<LeadFormValues & { id: string } | undefined>(undefined);
    
    // Drawer State
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedLead, setSelectedLead] = useState<LeadWithRelations | null>(null);

    const handleSelectLead = (lead: LeadWithRelations) => {
        setSelectedLead(lead);
        setIsDrawerOpen(true);
    };

    const { data: leads, isLoading } = useQuery({
        queryKey: ["leads", empresa?.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("clientes_leads")
                .select(`
                    *,
                    conversions:lead_conversions(
                        id,
                        campaign:eventos_campanhas(nome),
                        created_at
                    ),
                    tasks:lead_tasks(id)
                `)
                .eq("empresa_id", empresa?.id)
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data as LeadWithRelations[];
        },
        enabled: !!empresa?.id,
    });

    const filteredLeads = leads?.filter(lead => {
        const matchesSearch =
            lead.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lead.cpf?.includes(searchTerm);

        if (statusFilter === "all") return matchesSearch;
        if (statusLabels[statusFilter]) return matchesSearch && lead.status === statusFilter;

        if (statusFilter === "needs_attention") {
            const isOldNew = lead.status === 'novo' && new Date(lead.created_at) < new Date(Date.now() - 48 * 60 * 60 * 1000);
            const isHotNoAction = lead.temperatura === 'quente' && (!lead.tasks || lead.tasks.length === 0);
            const isHighVibe = (lead.score || 0) > 80;
            return matchesSearch && (isOldNew || isHotNoAction || isHighVibe);
        }

        if (statusFilter === "is_cliente") return matchesSearch && lead.is_cliente;
        if (statusFilter === "not_cliente") return matchesSearch && !lead.is_cliente;
        return matchesSearch;
    });

    const exportLeads = () => {
        if (!filteredLeads) return;
        const csv = [
            ["Nome", "Email", "Telefone", "CPF", "Status", "Origem", "Cliente", "Data Cadastro"],
            ...filteredLeads.map(l => [
                l.nome,
                l.email,
                l.telefone,
                l.cpf,
                statusLabels[l.status] || l.status,
                l.origem,
                l.is_cliente ? "Sim" : "Não",
                format(new Date(l.created_at), "dd/MM/yyyy")
            ])
        ].map(e => e.join(",")).join("\n");

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `leads_${empresa?.nome || 'empresa'}.csv`;
        link.click();
        toast.success("Leads exportados com sucesso!");
    };

    const handleCreateNew = () => {
        setEditingLead(undefined);
        setIsFormOpen(true);
    };

    const handleEdit = (lead: LeadWithRelations) => {
        setEditingLead(lead as unknown as (LeadFormValues & { id: string }));
        setIsFormOpen(true);
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 bg-white">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-8 border-b border-slate-100">
                <div className="flex items-center gap-6">
                    <div className="h-14 w-14 rounded-2xl bg-slate-900 flex items-center justify-center">
                        <Users className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <p className="luma-subtitle-premium">Capture & Conversion</p>
                        <h1 className="luma-title-premium">Lead Engine</h1>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="luma-action-group h-12">
                        <button
                            onClick={() => setViewMode('list')}
                            className={cn(
                                "px-4 rounded-xl transition-all flex items-center justify-center",
                                viewMode === 'list' ? "bg-white text-slate-900 shadow-sm border border-slate-100" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            <List className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('kanban')}
                            className={cn(
                                "px-4 rounded-xl transition-all flex items-center justify-center",
                                viewMode === 'kanban' ? "bg-white text-slate-900 shadow-sm border border-slate-100" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('analytics')}
                            className={cn(
                                "px-4 rounded-xl transition-all flex items-center justify-center",
                                viewMode === 'analytics' ? "bg-white text-slate-900 shadow-sm border border-slate-100" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            <PieChartIcon className="h-4 w-4" />
                        </button>
                    </div>

                    <ImportLeadsDialog />

                    <Button
                        variant="ghost"
                        onClick={exportLeads}
                        className="h-12 px-6 rounded-2xl border border-slate-100 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95"
                    >
                        <Download className="mr-2 h-4 w-4" /> Exportar
                    </Button>
                    <Button
                        onClick={handleCreateNew}
                        className="h-12 px-8 rounded-2xl bg-slate-900 hover:bg-black text-white font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 shadow-none"
                    >
                        <UserPlus className="mr-2 h-4 w-4" /> Novo Lead
                    </Button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Total Prospecção", val: leads?.length || 0, color: "slate", icon: Users },
                    { label: "Won Deals", val: leads?.filter(l => l.is_cliente || l.status === 'convertido').length || 0, color: "green", icon: CheckCircle2 },
                    { label: "New Leads / 72h", val: leads?.filter(l => new Date(l.created_at) > new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)).length || 0, color: "blue", icon: Calendar },
                    { label: "Conversion Rate", val: leads?.length ? ((leads.filter(l => l.status === 'convertido' || l.is_cliente).length / leads.length) * 100).toFixed(1) + "%" : "0%", color: "purple", icon: TrendingUp }
                ].map((stat, i) => (
                    <div key={i} className="luma-card p-6 flex flex-col justify-between h-36">
                        <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center",
                            stat.color === 'slate' ? "bg-slate-900 text-white" :
                                stat.color === 'green' ? "bg-emerald-50 text-emerald-600" :
                                    stat.color === 'blue' ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"
                        )}>
                            <stat.icon className="h-4 w-4" />
                        </div>
                        <div>
                            <p className="luma-subtitle-premium mb-1">{stat.label}</p>
                            <h3 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900">{isLoading ? "..." : stat.val}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {viewMode === 'analytics' && empresa?.id ? (
                <MarketingAnalytics empresaId={empresa.id} />
            ) : viewMode === 'kanban' ? (
                <LeadsKanban onSelectLead={handleSelectLead} />
            ) : (
                <>
                    {/* Filters & Search */}
                    <div className="space-y-6">
                        <div className="relative group">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 transition-colors group-focus-within:text-slate-900" />
                            <Input
                                placeholder="Busca inteligente por Lead, Email ou Hash..."
                                className="h-14 rounded-[24px] border-slate-100 bg-slate-50 pl-16 pr-8 text-sm font-bold placeholder:text-slate-400 focus-visible:ring-0 focus-visible:bg-white transition-all duration-300"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        
                        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                            {[
                                { label: "Pipeline Completo", value: "all" },
                                { label: "Novos", value: "novo" },
                                { label: "Em Contato", value: "contatado" },
                                { label: "Qualificados", value: "qualificado" },
                                { label: "Won", value: "convertido" },
                                { 
                                    label: (
                                        <span className="flex items-center gap-2">
                                            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                                            Atenção
                                        </span>
                                    ), 
                                    value: "needs_attention" 
                                }
                            ].map((btn, i) => (
                                <button
                                    key={i}
                                    onClick={() => setStatusFilter(btn.value)}
                                    className={cn(
                                        "px-6 h-11 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                                        statusFilter === btn.value ? "bg-slate-900 text-white shadow-none" : "text-slate-400 hover:text-slate-900 hover:bg-slate-50"
                                    )}
                                >
                                    {btn.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Leads Table */}
                    <div className="luma-card overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow className="border-b border-slate-100 hover:bg-transparent">
                                    <TableHead className="h-16 px-8 luma-subtitle-premium">Lead / Identity</TableHead>
                                    <TableHead className="h-16 luma-subtitle-premium">Status Radar</TableHead>
                                    <TableHead className="h-16 luma-subtitle-premium text-center">Gross Value / Prob.</TableHead>
                                    <TableHead className="h-16 luma-subtitle-premium">Origem</TableHead>
                                    <TableHead className="h-16 luma-subtitle-premium">Created</TableHead>
                                    <TableHead className="h-16 px-8 text-right luma-subtitle-premium">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i} className="border-b border-slate-50">
                                            <TableCell className="px-8 py-5"><Skeleton className="h-12 w-48 rounded-xl" /></TableCell>
                                            <TableCell><Skeleton className="h-6 w-24 rounded-lg" /></TableCell>
                                            <TableCell><Skeleton className="h-6 w-32 rounded-lg" /></TableCell>
                                            <TableCell><Skeleton className="h-6 w-32 rounded-lg" /></TableCell>
                                            <TableCell className="px-8"><Skeleton className="h-10 w-10 ml-auto rounded-lg" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : filteredLeads?.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-80 text-center">
                                            <div className="flex flex-col items-center gap-4 opacity-20">
                                                <Users className="h-16 w-16" />
                                                <p className="luma-subtitle-premium">Base de dados vazia para este filtro</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredLeads?.map((lead) => (
                                        <TableRow key={lead.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors group">
                                            <TableCell className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-400 text-xs border border-slate-200 uppercase">
                                                        {lead.nome?.[0] || "?"}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-sm text-slate-900 tracking-tight">{lead.nome}</span>
                                                        <div className="flex items-center gap-3 mt-1">
                                                            <span className="text-[10px] font-medium text-slate-400 inline-flex items-center gap-1.5">
                                                                <Mail className="h-3 w-3" /> {lead.email}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={cn(
                                                    "rounded-xl px-4 py-1.5 text-[9px] font-black uppercase tracking-widest border shadow-none",
                                                    statusColors[lead.status] || "bg-slate-50 text-slate-400 border-slate-200"
                                                )}>
                                                    {statusLabels[lead.status] || lead.status || "Novo"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col items-center gap-2">
                                                    <span className="font-black italic text-slate-900 flex items-center gap-1">
                                                        <span className="text-[10px] font-bold text-slate-300 non-italic">R$</span>
                                                        {new Intl.NumberFormat('pt-BR').format(lead.valor_estimado || 0)}
                                                    </span>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-20 h-1.5 bg-slate-100 rounded-sm overflow-hidden">
                                                            <div 
                                                                className="h-full bg-slate-900 transition-all duration-700" 
                                                                style={{ width: `${lead.probabilidade || 0}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-[9px] font-black text-slate-400">{lead.probabilidade || 0}%</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <Tag className="h-3 w-3 text-slate-300" />
                                                        <span className="text-[10px] font-black italic text-slate-900 uppercase tracking-tight">
                                                            {lead.origem || "Direto"}
                                                        </span>
                                                    </div>
                                                    {lead.conversions?.[0]?.campaign && (
                                                        <span className="text-[9px] font-bold text-slate-300 pl-5 uppercase tracking-widest">
                                                            Ref: {lead.conversions[0].campaign.nome}
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                                                {format(new Date(lead.created_at), "dd MMM, yy", { locale: ptBR })}
                                            </TableCell>
                                            <TableCell className="px-8 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-10 w-10 p-0 rounded-xl hover:bg-slate-100 transition-all">
                                                            <MoreHorizontal className="h-5 w-5 text-slate-300" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="rounded-2xl border-slate-100 shadow-none p-2 min-w-[220px]">
                                                        <DropdownMenuItem
                                                            className="rounded-xl h-11 font-black text-[10px] uppercase tracking-widest p-4"
                                                            onClick={() => handleSelectLead(lead)}
                                                        >
                                                            <Eye className="mr-3 h-4 w-4" /> Detalhes Profile
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="rounded-xl h-11 font-black text-[10px] uppercase tracking-widest p-4"
                                                            onClick={() => handleEdit(lead)}
                                                        >
                                                            <Edit className="mr-3 h-4 w-4" /> Editar Dados
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator className="bg-slate-50" />
                                                        {!lead.is_cliente && (
                                                            <DropdownMenuItem
                                                                className="rounded-xl h-11 font-black text-[10px] uppercase tracking-widest p-4 text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50"
                                                                onClick={() => {
                                                                    supabase.from('clientes_leads').update({ is_cliente: true, status: 'convertido' }).eq('id', lead.id)
                                                                        .then(() => {
                                                                            toast.success("Lead convertido para cliente!");
                                                                            queryClient.invalidateQueries({ queryKey: ["leads"] });
                                                                        });
                                                                }}
                                                            >
                                                                <CheckCircle2 className="mr-3 h-4 w-4" /> Converter em Deal
                                                            </DropdownMenuItem>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </>
            )}

            {empresa?.id && (
                <LeadFormDialog
                    open={isFormOpen}
                    onOpenChange={setIsFormOpen}
                    empresaId={empresa.id}
                    initialData={editingLead}
                    onSuccess={() => queryClient.invalidateQueries({ queryKey: ["leads"] })}
                />
            )}

            {selectedLead && empresa?.id && (
                <LeadDetailsDrawer
                    lead={selectedLead}
                    open={isDrawerOpen}
                    onOpenChange={setIsDrawerOpen}
                    empresaId={empresa.id}
                />
            )}
        </div>
    );
}
