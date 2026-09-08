import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Search, Target, TrendingUp, Users,
  Mail, MessageCircle, ArrowUpRight, MoreHorizontal,
  Play, Pause, Trash2, Edit, Copy, Eye, Zap, BarChart3
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useParams, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  updateCampaignStatus,
  deleteCampaign,
  duplicateCampaign,
} from "@/services/marketing.functions";
import { supabase } from "@/integrations/supabase/client";

// ── types ─────────────────────────────────────────────────────────────────────

interface Campaign {
  id: string;
  title: string;
  description?: string;
  status: string;
  type: string;
  budget?: number;
  target_audience?: string;
  start_date?: string;
  end_date?: string;
  config: Record<string, any>;
  leads_count: number;
  revenue: number;
  created_at: string;
}

// ── helpers ───────────────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  active:    { label: 'Ativa',     cls: 'bg-green-500/10 text-green-600 border-green-200' },
  draft:     { label: 'Rascunho', cls: 'bg-muted text-muted-foreground border-border' },
  paused:    { label: 'Pausada',   cls: 'bg-yellow-500/10 text-yellow-600 border-yellow-200' },
  completed: { label: 'Concluída',cls: 'bg-primary/10 text-primary border-primary/20' },
  archived:  { label: 'Arquivada',cls: 'bg-muted text-muted-foreground/50 border-border' },
};

const TYPE_MAP: Record<string, { label: string; icon: typeof Mail }> = {
  email:        { label: 'E-mail',    icon: Mail },
  whatsapp:     { label: 'WhatsApp',  icon: MessageCircle },
  standard:     { label: 'Padrão',    icon: Target },
  lead_capture: { label: 'Captura',   icon: Users },
  affiliate:    { label: 'Afiliados', icon: ArrowUpRight },
};

export default function CampaignsDashboard() {
  const { id: empresaId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // ── data ──────────────────────────────────────────────────────────────────
  const { data: campaigns = [], isLoading } = useQuery<Campaign[]>({
    queryKey: ["campaigns", empresaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("eventos_campanhas")
        .select("id, nome, descricao, tipo, status, orcamento, publico_alvo, data_inicio, data_fim, config, created_at, leads:clientes_leads(id, valor_estimado)")
        .eq("empresa_id", empresaId || "")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((c: any) => ({
        id: c.id,
        title: c.nome,
        description: c.descricao,
        status: c.status || 'draft',
        type: c.tipo || 'standard',
        budget: c.orcamento,
        target_audience: c.publico_alvo,
        start_date: c.data_inicio,
        end_date: c.data_fim,
        config: c.config || {},
        leads_count: c.leads?.length || 0,
        revenue: (c.leads || []).reduce((s: number, l: any) => s + (Number(l.valor_estimado) || 0), 0),
        created_at: c.created_at,
      }));
    },
    enabled: !!empresaId,
  });

  // ── mutations (via BFF — tenant-guarded server-side) ──────────────────────
  const updateStatusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateCampaignStatus({ data: { id, status } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["campaigns", empresaId] }); toast.success("Status atualizado"); },
    onError: (e: any) => toast.error(e.message ?? "Erro ao atualizar status"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteCampaign({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["campaigns", empresaId] }); toast.success("Campanha removida"); },
    onError: (e: any) => toast.error(e.message ?? "Erro ao remover campanha"),
  });

  const duplicateMut = useMutation({
    mutationFn: (camp: Campaign) => duplicateCampaign({ data: { id: camp.id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["campaigns", empresaId] }); toast.success("Campanha duplicada"); },
    onError: (e: any) => toast.error(e.message ?? "Erro ao duplicar campanha"),
  });

  // ── derived ───────────────────────────────────────────────────────────────
  const filtered = campaigns.filter(c => {
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    active: campaigns.filter(c => c.status === 'active').length,
    leads: campaigns.reduce((s, c) => s + c.leads_count, 0),
    revenue: campaigns.reduce((s, c) => s + c.revenue, 0),
    total: campaigns.length,
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="shrink-0 px-8 pt-8 pb-6 border-b border-border bg-background">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Marketing</p>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter text-foreground leading-none">Campanhas</h1>
          </div>
          <button
            onClick={() => navigate("nova")}
            className="h-10 px-5 rounded-2xl bg-foreground text-background text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all flex items-center gap-2 shrink-0"
          >
            <Plus className="h-3.5 w-3.5" /> Nova Campanha
          </button>
        </div>

        {/* Stats strip */}
        <div className="mt-6 grid grid-cols-4 gap-4">
          {[
            { label: 'Ativas', val: stats.active, icon: Zap },
            { label: 'Total', val: stats.total, icon: Target },
            { label: 'Leads gerados', val: stats.leads, icon: Users },
            { label: 'Revenue pipeline', val: `R$ ${stats.revenue.toLocaleString('pt-BR')}`, icon: TrendingUp },
          ].map(({ label, val, icon: Icon }) => (
            <div key={label} className="bg-muted/40 border border-border rounded-2xl p-4 flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-background border border-border flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{label}</p>
                <p className="text-lg font-black text-foreground leading-tight">{isLoading ? '—' : val}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      <div className="shrink-0 px-8 py-4 border-b border-border bg-background flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar campanha..."
            className="pl-9 h-9 rounded-xl text-sm"
          />
        </div>

        <div className="flex items-center gap-1.5">
          {[
            { val: 'all', label: 'Todas' },
            { val: 'active', label: 'Ativas' },
            { val: 'draft', label: 'Rascunho' },
            { val: 'paused', label: 'Pausadas' },
            { val: 'completed', label: 'Concluídas' },
          ].map(opt => (
            <button
              key={opt.val}
              onClick={() => setStatusFilter(opt.val)}
              className={cn(
                'h-8 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all',
                statusFilter === opt.val
                  ? 'bg-foreground text-background'
                  : 'bg-muted border border-border text-muted-foreground hover:text-foreground'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── List ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-2xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
              <Target className="h-8 w-8 text-muted-foreground/30" />
            </div>
            <p className="text-sm font-black text-muted-foreground/50 uppercase tracking-widest">
              {search ? 'Nenhuma campanha encontrada' : 'Nenhuma campanha criada'}
            </p>
            {!search && (
              <button
                onClick={() => navigate("nova")}
                className="h-9 px-5 rounded-xl bg-foreground text-background text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all"
              >
                Criar primeira campanha
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(camp => {
              const typeInfo = TYPE_MAP[camp.type] || TYPE_MAP.standard;
              const statusInfo = STATUS_MAP[camp.status] || STATUS_MAP.draft;
              const TypeIcon = typeInfo.icon;

              return (
                <div
                  key={camp.id}
                  className="group bg-background border border-border rounded-2xl px-5 py-4 hover:border-foreground/20 transition-all flex items-center gap-4"
                >
                  {/* Type icon */}
                  <div className="h-10 w-10 rounded-xl bg-muted border border-border flex items-center justify-center shrink-0">
                    <TypeIcon className="h-4 w-4 text-muted-foreground" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-black text-sm text-foreground uppercase tracking-tight italic truncate">{camp.title}</p>
                      <Badge variant="outline" className={cn("rounded-lg px-2 py-0.5 text-[9px] font-black uppercase tracking-widest border shrink-0", statusInfo.cls)}>
                        {statusInfo.label}
                      </Badge>
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest shrink-0">{typeInfo.label}</span>
                    </div>
                    {camp.description && (
                      <p className="text-[11px] text-muted-foreground truncate">{camp.description}</p>
                    )}
                    {camp.target_audience && (
                      <p className="text-[10px] text-muted-foreground/60 font-bold">
                        👥 {camp.target_audience}
                      </p>
                    )}
                  </div>

                  {/* Metrics */}
                  <div className="hidden md:flex items-center gap-6 shrink-0">
                    <div className="text-center">
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Leads</p>
                      <p className="text-lg font-black text-foreground leading-none">{camp.leads_count}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Pipeline</p>
                      <p className="text-lg font-black text-foreground leading-none">
                        {camp.revenue > 0 ? `R$ ${camp.revenue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}` : '—'}
                      </p>
                    </div>
                    {camp.start_date && (
                      <div className="text-center">
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Início</p>
                        <p className="text-xs font-bold text-foreground">
                          {format(new Date(camp.start_date), 'dd/MM/yy', { locale: ptBR })}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    {camp.status === 'active' ? (
                      <button
                        onClick={() => updateStatusMut.mutate({ id: camp.id, status: 'paused' })}
                        className="h-8 w-8 rounded-xl border border-border bg-background flex items-center justify-center hover:bg-muted transition-all text-muted-foreground hover:text-foreground"
                        title="Pausar"
                      >
                        <Pause className="h-3.5 w-3.5" />
                      </button>
                    ) : camp.status === 'draft' || camp.status === 'paused' ? (
                      <button
                        onClick={() => updateStatusMut.mutate({ id: camp.id, status: 'active' })}
                        className="h-8 w-8 rounded-xl border border-border bg-background flex items-center justify-center hover:bg-muted transition-all text-muted-foreground hover:text-foreground"
                        title="Ativar"
                      >
                        <Play className="h-3.5 w-3.5" />
                      </button>
                    ) : null}

                    <button
                      onClick={() => navigate(`nova?edit=${camp.id}`)}
                      className="h-8 w-8 rounded-xl border border-border bg-background flex items-center justify-center hover:bg-muted transition-all text-muted-foreground hover:text-foreground"
                      title="Editar"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="h-8 w-8 rounded-xl border border-border bg-background flex items-center justify-center hover:bg-muted transition-all text-muted-foreground hover:text-foreground">
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl">
                        <DropdownMenuItem onClick={() => duplicateMut.mutate(camp)} className="gap-2 text-xs font-bold">
                          <Copy className="h-3.5 w-3.5" /> Duplicar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          const url = `${window.location.origin}/capture/${camp.config?.form_slug || camp.id}`;
                          navigator.clipboard.writeText(url);
                          toast.success("Link copiado!");
                        }} className="gap-2 text-xs font-bold">
                          <Eye className="h-3.5 w-3.5" /> Copiar link
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`${camp.id}/analytics`)} className="gap-2 text-xs font-bold">
                          <BarChart3 className="h-3.5 w-3.5" /> Analytics
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => { if (confirm('Remover campanha?')) deleteMut.mutate(camp.id); }}
                          className="gap-2 text-xs font-bold text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Remover
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
