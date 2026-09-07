import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresa } from "@/hooks/useEmpresa";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChevronLeft, ChevronRight, Mail, MessageCircle, Smartphone,
  Users, Target, Zap, Calendar, DollarSign, Tag, Filter,
  CheckCircle2, Send, Sparkles, Settings2, Clock, Globe,
  FileText, UserCheck, UserX, Star, ShoppingBag, Megaphone
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface AudienceSegment {
  id: string;
  label: string;
  description: string;
  icon: typeof Users;
  filter: string;
}

interface ScheduleOption {
  id: string;
  label: string;
  icon: typeof Send;
  description: string;
}

const CAMPAIGN_TYPES = [
  { id: 'email', label: 'E-mail Marketing', desc: 'Newsletter, promoções e nutrição de leads', icon: Mail, color: 'text-blue-500' },
  { id: 'whatsapp', label: 'WhatsApp Broadcast', desc: 'Mensagens diretas em massa via WhatsApp', icon: MessageCircle, color: 'text-green-500' },
  { id: 'sms', label: 'SMS Campaign', desc: 'SMS marketing de alta abertura', icon: Smartphone, color: 'text-orange-500' },
  { id: 'push', label: 'Push Notification', desc: 'Notificações no app/navegador', icon: Megaphone, color: 'text-purple-500' },
  { id: 'multi_channel', label: 'Multi-canal', desc: 'Combinação de canais para máximo alcance', icon: Zap, color: 'text-primary' },
];

const AUDIENCE_SEGMENTS: AudienceSegment[] = [
  { id: 'all', label: 'Toda a Base', description: 'Todos os contatos cadastrados', icon: Users, filter: 'all' },
  { id: 'leads_only', label: 'Apenas Leads', description: 'Contatos não convertidos em clientes', icon: Target, filter: 'status=novo,contatado,qualificado' },
  { id: 'customers_only', label: 'Apenas Clientes', description: 'Contatos que já converteram', icon: UserCheck, filter: 'is_cliente=true' },
  { id: 'hot_leads', label: 'Leads Quentes', description: 'Leads com alta probabilidade de conversão (>60%)', icon: Star, filter: 'probabilidade>=60' },
  { id: 'inactive', label: 'Contatos Inativos', description: 'Sem interação nos últimos 30 dias', icon: UserX, filter: 'inativo=30d' },
  { id: 'high_value', label: 'Alto Valor', description: 'Leads com valor estimado acima da média', icon: DollarSign, filter: 'valor_alto=true' },
  { id: 'recent', label: 'Novos Contatos', description: 'Cadastrados nos últimos 7 dias', icon: Clock, filter: 'recent=7d' },
  { id: 'buyers', label: 'Compradores', description: 'Clientes com compras registradas', icon: ShoppingBag, filter: 'has_orders=true' },
];

const AUDIENCE_TAGS = [
  'VIP', 'Newsletter', 'Evento', 'Produto A', 'Produto B', 'Parceiro', 'Trial', 'Pago', 'Cancelado', 'Indicação'
];

const SCHEDULE_OPTIONS: ScheduleOption[] = [
  { id: 'immediate', label: 'Agora', icon: Send, description: 'Disparo imediato após salvar' },
  { id: 'scheduled', label: 'Agendar', icon: Calendar, description: 'Definir data e hora específica' },
  { id: 'recurring', label: 'Recorrente', icon: Clock, description: 'Repetir por intervalo (diário, semanal...)' },
  { id: 'draft', label: 'Salvar rascunho', icon: FileText, description: 'Salvar sem disparar' },
];

// ── Step indicator ─────────────────────────────────────────────────────────────

const STEPS = ['Canal', 'Público', 'Conteúdo', 'Configuração', 'Revisar'];

function StepDot({ idx, current, label }: { idx: number; current: number; label: string }) {
  const done = idx < current;
  const active = idx === current;
  return (
    <div className="flex items-center gap-1.5">
      <div className={cn(
        'h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all shrink-0',
        done ? 'bg-foreground text-background' : active ? 'bg-foreground text-background ring-4 ring-foreground/20' : 'bg-muted border border-border text-muted-foreground'
      )}>
        {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : idx + 1}
      </div>
      <span className={cn('text-[10px] font-black uppercase tracking-widest hidden md:block', active ? 'text-foreground' : done ? 'text-muted-foreground' : 'text-muted-foreground/40')}>
        {label}
      </span>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function CampaignBuilder() {
  const navigate = useNavigate();
  const { id: routeEmpresaId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { empresa } = useEmpresa();
  const qc = useQueryClient();
  const empresaId = routeEmpresaId || empresa?.id;

  const [step, setStep] = useState(0);

  // Form state
  const [channelType, setChannelType] = useState('email');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Audience
  const [segmentId, setSegmentId] = useState('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customFilter, setCustomFilter] = useState('');
  const [excludeUnsubscribed, setExcludeUnsubscribed] = useState(true);
  const [excludeDuplicates, setExcludeDuplicates] = useState(true);

  // Content
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [replyTo, setReplyTo] = useState('');
  const [senderName, setSenderName] = useState(empresa?.nome || '');

  // Config
  const [scheduleType, setScheduleType] = useState('draft');
  const [scheduledAt, setScheduledAt] = useState('');
  const [recurringInterval, setRecurringInterval] = useState('weekly');
  const [budget, setBudget] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [trackOpens, setTrackOpens] = useState(true);
  const [trackClicks, setTrackClicks] = useState(true);
  const [utmSource, setUtmSource] = useState('');
  const [utmMedium, setUtmMedium] = useState('email');
  const [utmCampaign, setUtmCampaign] = useState('');

  // Lead forms for linking
  const { data: leadForms = [] } = useQuery({
    queryKey: ['lead-forms', empresaId],
    queryFn: async () => {
      const { data } = await supabase.from('lead_capture_forms').select('id, title, slug').eq('empresa_id', empresaId || '').eq('status', 'active');
      return data || [];
    },
    enabled: !!empresaId,
  });

  // Audience count estimate
  const { data: audienceCount } = useQuery({
    queryKey: ['audience-count', empresaId, segmentId, selectedTags],
    queryFn: async () => {
      let query = supabase.from('clientes_leads').select('id', { count: 'exact', head: true }).eq('empresa_id', empresaId || '');
      if (segmentId === 'leads_only') query = query.eq('is_cliente', false);
      if (segmentId === 'customers_only') query = query.eq('is_cliente', true);
      if (segmentId === 'hot_leads') query = query.gte('probabilidade', 60);
      const { count } = await query;
      return count || 0;
    },
    enabled: !!empresaId,
  });

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!empresaId) throw new Error("Empresa não identificada");

      const status = scheduleType === 'draft' ? 'draft' : scheduleType === 'immediate' ? 'active' : 'draft';

      const { data: camp, error } = await supabase.from('eventos_campanhas').insert({
        empresa_id: empresaId,
        nome: name,
        descricao: description,
        tipo: channelType,
        status,
        publico_alvo: AUDIENCE_SEGMENTS.find(s => s.id === segmentId)?.label || segmentId,
        orcamento: budget ? Number(budget) : null,
        data_inicio: startDate || null,
        data_fim: endDate || null,
        config: {
          channel: channelType,
          segment: segmentId,
          tags: selectedTags,
          customFilter,
          excludeUnsubscribed,
          excludeDuplicates,
          subject,
          content,
          replyTo,
          senderName,
          scheduleType,
          scheduledAt,
          recurringInterval,
          trackOpens,
          trackClicks,
          utm: { source: utmSource, medium: utmMedium, campaign: utmCampaign },
        },
      }).select().single();

      if (error) throw error;

      if (scheduleType === 'immediate') {
        try {
          await supabase.functions.invoke('dispatch-campaign', {
            body: { campaign_id: camp.id, segment: segmentId, type: channelType, subject, content },
          });
          toast.success("Campanha disparada com sucesso!");
        } catch {
          toast.warning("Campanha salva, mas disparo não configurado. Configure as integrações de envio.");
        }
      } else {
        toast.success(scheduleType === 'draft' ? "Rascunho salvo!" : "Campanha agendada!");
      }

      return camp;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaigns', empresaId] });
      navigate(-1);
    },
    onError: (e: any) => toast.error("Erro ao salvar", { description: e.message }),
  });

  const canProceed = () => {
    if (step === 0) return channelType !== '';
    if (step === 1) return segmentId !== '';
    if (step === 2) {
      if (channelType === 'email') return subject.trim().length > 0 && content.trim().length > 0;
      return content.trim().length > 0;
    }
    if (step === 3) return true;
    if (step === 4) return name.trim().length >= 3;
    return true;
  };

  const segmentInfo = AUDIENCE_SEGMENTS.find(s => s.id === segmentId);

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      {/* ── Top bar ──────────────────────────────────────────────────────────── */}
      <header className="shrink-0 h-14 border-b border-border bg-background flex items-center justify-between px-6 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => step === 0 ? navigate(-1) : setStep(s => s - 1)}
            className="h-8 w-8 rounded-xl border border-border flex items-center justify-center hover:bg-muted transition-all">
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          </button>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Nova Campanha</p>
            <p className="text-sm font-black text-foreground italic uppercase tracking-tighter leading-none">{name || 'Sem título'}</p>
          </div>
        </div>

        {/* Step indicators */}
        <div className="hidden md:flex items-center gap-3">
          {STEPS.map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <StepDot idx={i} current={step} label={label} />
              {i < STEPS.length - 1 && <div className={cn('h-px w-8 transition-all', i < step ? 'bg-foreground/30' : 'bg-border')} />}
            </div>
          ))}
        </div>

        <button
          onClick={() => saveMut.mutate()}
          disabled={saveMut.isPending}
          className="h-8 px-4 rounded-xl bg-foreground text-background text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50"
        >
          {saveMut.isPending ? 'Salvando...' : 'Salvar'}
        </button>
      </header>

      {/* ── Content ──────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden flex">
        <ScrollArea className="flex-1">
          <div className="max-w-2xl mx-auto px-6 py-8">

            {/* ── STEP 0: Canal ──────────────────────────────────────────────── */}
            {step === 0 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-black italic uppercase tracking-tighter text-foreground">Canal de envio</h2>
                  <p className="text-sm text-muted-foreground mt-1">Escolha como sua mensagem chegará ao público</p>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {CAMPAIGN_TYPES.map(type => (
                    <button key={type.id} onClick={() => setChannelType(type.id)}
                      className={cn(
                        'w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all',
                        channelType === type.id ? 'border-foreground bg-foreground/5' : 'border-border bg-background hover:border-foreground/20'
                      )}>
                      <div className={cn('h-10 w-10 rounded-xl bg-muted flex items-center justify-center shrink-0', type.color)}>
                        <type.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-black text-sm text-foreground">{type.label}</p>
                        <p className="text-[11px] text-muted-foreground">{type.desc}</p>
                      </div>
                      <div className={cn('h-4 w-4 rounded-full border-2 transition-all shrink-0', channelType === type.id ? 'border-foreground bg-foreground' : 'border-border')} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── STEP 1: Público ────────────────────────────────────────────── */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-black italic uppercase tracking-tighter text-foreground">Definir Público</h2>
                  <p className="text-sm text-muted-foreground mt-1">Segmente quem receberá esta campanha</p>
                </div>

                {/* Audience size estimate */}
                <div className="bg-muted/40 border border-border rounded-2xl p-4 flex items-center gap-3">
                  <Users className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Alcance estimado</p>
                    <p className="text-2xl font-black text-foreground">{audienceCount?.toLocaleString('pt-BR') || '—'} contatos</p>
                  </div>
                </div>

                {/* Segments */}
                <div>
                  <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-3 block">Segmento base</Label>
                  <div className="grid grid-cols-1 gap-2">
                    {AUDIENCE_SEGMENTS.map(seg => (
                      <button key={seg.id} onClick={() => setSegmentId(seg.id)}
                        className={cn(
                          'w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all',
                          segmentId === seg.id ? 'border-foreground bg-foreground/5' : 'border-border hover:border-foreground/20'
                        )}>
                        <seg.icon className={cn('h-4 w-4 shrink-0', segmentId === seg.id ? 'text-foreground' : 'text-muted-foreground')} />
                        <div className="flex-1">
                          <p className="font-black text-sm text-foreground">{seg.label}</p>
                          <p className="text-[10px] text-muted-foreground">{seg.description}</p>
                        </div>
                        <div className={cn('h-4 w-4 rounded-full border-2 transition-all shrink-0', segmentId === seg.id ? 'border-foreground bg-foreground' : 'border-border')} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tags filter */}
                <div>
                  <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-3 block">
                    <Tag className="h-3 w-3 inline mr-1" />Filtrar por tags (opcional)
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {AUDIENCE_TAGS.map(tag => (
                      <button key={tag} onClick={() => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
                        className={cn(
                          'h-7 px-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all',
                          selectedTags.includes(tag) ? 'bg-foreground text-background' : 'bg-muted border border-border text-muted-foreground hover:text-foreground'
                        )}>
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom filter */}
                <div>
                  <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-2 block">
                    <Filter className="h-3 w-3 inline mr-1" />Filtro personalizado (avançado)
                  </Label>
                  <Input
                    value={customFilter}
                    onChange={e => setCustomFilter(e.target.value)}
                    placeholder='Ex: cidade="São Paulo" AND valor_estimado>5000'
                    className="rounded-xl text-sm font-mono"
                  />
                </div>

                {/* Exclusion options */}
                <div className="space-y-3">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block">Opções de exclusão</Label>
                  {[
                    { label: 'Excluir descadastrados (unsubscribed)', val: excludeUnsubscribed, set: setExcludeUnsubscribed },
                    { label: 'Remover duplicatas (mesmo email)', val: excludeDuplicates, set: setExcludeDuplicates },
                  ].map(opt => (
                    <div key={opt.label} className="flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border">
                      <span className="text-sm font-bold text-foreground">{opt.label}</span>
                      <Switch checked={opt.val} onCheckedChange={opt.set} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── STEP 2: Conteúdo ───────────────────────────────────────────── */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="flex items-end justify-between">
                  <div>
                    <h2 className="text-2xl font-black italic uppercase tracking-tighter text-foreground">Conteúdo</h2>
                    <p className="text-sm text-muted-foreground mt-1">Escreva a mensagem que será enviada</p>
                  </div>
                  <button
                    onClick={() => {
                      setSubject(`🚀 ${name || 'Novidade especial para você'}`);
                      setContent(`Olá!\n\nTemos uma novidade especial que não pode perder.\n\nClique para saber mais.\n\nAtenciosamente,\n${empresa?.nome || 'Nossa equipe'}`);
                      toast.success("Sugestão de conteúdo gerada!");
                    }}
                    className="h-8 px-4 rounded-xl border border-border text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 hover:bg-muted transition-all text-muted-foreground"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-primary" /> Sugestão IA
                  </button>
                </div>

                {/* Sender info (email only) */}
                {(channelType === 'email' || channelType === 'multi_channel') && (
                  <div className="space-y-4 p-4 bg-muted/40 border border-border rounded-2xl">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Remetente</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-[10px] font-bold text-muted-foreground mb-1 block">Nome do remetente</Label>
                        <Input value={senderName} onChange={e => setSenderName(e.target.value)} placeholder={empresa?.nome || 'Nome'} className="rounded-xl h-9 text-sm" />
                      </div>
                      <div>
                        <Label className="text-[10px] font-bold text-muted-foreground mb-1 block">Reply-to (email)</Label>
                        <Input value={replyTo} onChange={e => setReplyTo(e.target.value)} placeholder="resposta@empresa.com" className="rounded-xl h-9 text-sm" type="email" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Subject (email only) */}
                {(channelType === 'email' || channelType === 'multi_channel') && (
                  <div>
                    <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-2 block">Assunto do e-mail *</Label>
                    <Input
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                      placeholder="Ex: 🔥 Oferta exclusiva para você"
                      className="rounded-xl h-12 text-base font-bold"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1 text-right">{subject.length} caracteres · idealmente 40-60</p>
                  </div>
                )}

                {/* Content */}
                <div>
                  <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-2 block">
                    {channelType === 'email' ? 'Corpo do e-mail *' : 'Mensagem *'}
                  </Label>
                  <Textarea
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder={channelType === 'whatsapp'
                      ? "Olá {{nome}}! Temos uma novidade especial..."
                      : "Escreva aqui o conteúdo completo do e-mail...\n\nUse {{nome}} para personalizar com o nome do contato."}
                    rows={10}
                    className="rounded-xl text-sm resize-none"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">Use {'{{nome}}'}, {'{{empresa}}'} para personalização dinâmica</p>
                </div>

                {/* Lead form link */}
                {leadForms.length > 0 && (
                  <div>
                    <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-2 block">Vincular formulário de captura (opcional)</Label>
                    <select className="w-full h-10 rounded-xl border border-border bg-background text-sm px-3 text-foreground">
                      <option value="">Nenhum</option>
                      {leadForms.map((f: any) => (
                        <option key={f.id} value={f.id}>{f.title}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* ── STEP 3: Configuração ───────────────────────────────────────── */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-black italic uppercase tracking-tighter text-foreground">Configurações</h2>
                  <p className="text-sm text-muted-foreground mt-1">Defina datas, orçamento e rastreamento</p>
                </div>

                {/* Schedule */}
                <div>
                  <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-3 block">Quando disparar</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {SCHEDULE_OPTIONS.map(opt => (
                      <button key={opt.id} onClick={() => setScheduleType(opt.id)}
                        className={cn(
                          'flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all',
                          scheduleType === opt.id ? 'border-foreground bg-foreground/5' : 'border-border hover:border-foreground/20'
                        )}>
                        <opt.icon className={cn('h-4 w-4 mt-0.5 shrink-0', scheduleType === opt.id ? 'text-foreground' : 'text-muted-foreground')} />
                        <div>
                          <p className="font-black text-sm text-foreground">{opt.label}</p>
                          <p className="text-[10px] text-muted-foreground">{opt.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>

                  {scheduleType === 'scheduled' && (
                    <div className="mt-3">
                      <Label className="text-[10px] font-bold text-muted-foreground mb-1 block">Data e hora do disparo</Label>
                      <Input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} className="rounded-xl h-10 text-sm" />
                    </div>
                  )}

                  {scheduleType === 'recurring' && (
                    <div className="mt-3">
                      <Label className="text-[10px] font-bold text-muted-foreground mb-1 block">Intervalo de repetição</Label>
                      <select value={recurringInterval} onChange={e => setRecurringInterval(e.target.value)}
                        className="w-full h-10 rounded-xl border border-border bg-background text-sm px-3">
                        {['Diário', 'Semanal', 'Quinzenal', 'Mensal'].map(v => (
                          <option key={v} value={v.toLowerCase()}>{v}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Dates & budget */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-2 block">
                      <Calendar className="h-3 w-3 inline mr-1" />Data início
                    </Label>
                    <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="rounded-xl h-10 text-sm" />
                  </div>
                  <div>
                    <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-2 block">
                      <Calendar className="h-3 w-3 inline mr-1" />Data fim
                    </Label>
                    <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="rounded-xl h-10 text-sm" />
                  </div>
                </div>

                <div>
                  <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-2 block">
                    <DollarSign className="h-3 w-3 inline mr-1" />Orçamento (R$)
                  </Label>
                  <Input type="number" value={budget} onChange={e => setBudget(e.target.value)} placeholder="0,00" className="rounded-xl h-10 text-sm" />
                </div>

                {/* Tracking */}
                <div className="space-y-3">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block">Rastreamento</Label>
                  {[
                    { label: 'Rastrear aberturas (Open Rate)', val: trackOpens, set: setTrackOpens },
                    { label: 'Rastrear cliques (Click Rate)', val: trackClicks, set: setTrackClicks },
                  ].map(opt => (
                    <div key={opt.label} className="flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border">
                      <span className="text-sm font-bold text-foreground">{opt.label}</span>
                      <Switch checked={opt.val} onCheckedChange={opt.set} />
                    </div>
                  ))}
                </div>

                {/* UTM */}
                <div className="space-y-3">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block">
                    <Globe className="h-3 w-3 inline mr-1" />UTM parameters (Google Analytics)
                  </Label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'utm_source', val: utmSource, set: setUtmSource, ph: 'newsletter' },
                      { label: 'utm_medium', val: utmMedium, set: setUtmMedium, ph: 'email' },
                      { label: 'utm_campaign', val: utmCampaign, set: setUtmCampaign, ph: 'promo_jan' },
                    ].map(utm => (
                      <div key={utm.label}>
                        <Label className="text-[9px] font-bold text-muted-foreground mb-1 block">{utm.label}</Label>
                        <Input value={utm.val} onChange={e => utm.set(e.target.value)} placeholder={utm.ph} className="rounded-xl h-9 text-xs" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 4: Revisar ────────────────────────────────────────────── */}
            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-black italic uppercase tracking-tighter text-foreground">Revisar & Publicar</h2>
                  <p className="text-sm text-muted-foreground mt-1">Confirme os dados antes de disparar</p>
                </div>

                {/* Name */}
                <div>
                  <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-2 block">Nome interno da campanha *</Label>
                  <Input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ex: Newsletter Janeiro 2026"
                    className="rounded-xl h-12 text-base font-bold"
                  />
                </div>
                <div>
                  <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-2 block">Descrição (opcional)</Label>
                  <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Objetivo desta campanha..." rows={2} className="rounded-xl text-sm resize-none" />
                </div>

                {/* Summary */}
                <div className="bg-muted/40 border border-border rounded-2xl divide-y divide-border">
                  {[
                    { label: 'Canal', val: CAMPAIGN_TYPES.find(t => t.id === channelType)?.label },
                    { label: 'Público', val: `${segmentInfo?.label} · ~${audienceCount?.toLocaleString('pt-BR') || '?'} contatos` },
                    { label: 'Tags filtradas', val: selectedTags.length > 0 ? selectedTags.join(', ') : 'Nenhuma' },
                    { label: 'Assunto', val: subject || '(não definido)' },
                    { label: 'Agendamento', val: SCHEDULE_OPTIONS.find(s => s.id === scheduleType)?.label },
                    { label: 'Orçamento', val: budget ? `R$ ${Number(budget).toLocaleString('pt-BR')}` : 'Não definido' },
                  ].map(row => (
                    <div key={row.label} className="flex items-start justify-between px-4 py-3">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{row.label}</span>
                      <span className="text-sm font-bold text-foreground text-right max-w-[60%] truncate">{row.val || '—'}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => saveMut.mutate()}
                  disabled={saveMut.isPending || name.trim().length < 3}
                  className="w-full h-14 rounded-2xl bg-foreground text-background font-black uppercase tracking-widest text-sm hover:opacity-90 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {saveMut.isPending ? (
                    <><div className="h-4 w-4 border-2 border-background/40 border-t-background rounded-full animate-spin" /> Salvando...</>
                  ) : scheduleType === 'immediate' ? (
                    <><Send className="h-4 w-4" /> Disparar Campanha</>
                  ) : scheduleType === 'draft' ? (
                    <><FileText className="h-4 w-4" /> Salvar Rascunho</>
                  ) : (
                    <><Calendar className="h-4 w-4" /> Agendar Campanha</>
                  )}
                </button>
              </div>
            )}

          </div>
        </ScrollArea>

        {/* ── Right panel: live preview / help ─────────────────────────────── */}
        <aside className="hidden xl:flex w-72 border-l border-border bg-muted/20 flex-col shrink-0">
          <div className="p-4 border-b border-border">
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Preview / Dicas</p>
          </div>
          <ScrollArea className="flex-1 p-4">
            {step === 0 && (
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Canais disponíveis</p>
                {CAMPAIGN_TYPES.map(t => (
                  <div key={t.id} className={cn('p-3 rounded-xl border transition-all', channelType === t.id ? 'border-foreground bg-background' : 'border-border')}>
                    <div className="flex items-center gap-2 mb-1">
                      <t.icon className={cn('h-3.5 w-3.5', t.color)} />
                      <span className="text-[11px] font-black text-foreground">{t.label}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{t.desc}</p>
                  </div>
                ))}
              </div>
            )}

            {step === 1 && (
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Segmento selecionado</p>
                {segmentInfo && (
                  <div className="p-4 rounded-xl border border-foreground bg-foreground/5">
                    <segmentInfo.icon className="h-6 w-6 text-foreground mb-2" />
                    <p className="font-black text-sm text-foreground">{segmentInfo.label}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">{segmentInfo.description}</p>
                    <p className="text-2xl font-black text-foreground mt-3">{audienceCount?.toLocaleString('pt-BR') || '—'}</p>
                    <p className="text-[10px] text-muted-foreground">contatos elegíveis</p>
                  </div>
                )}
                {selectedTags.length > 0 && (
                  <div className="p-3 rounded-xl border border-border">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-2">Tags ativas</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedTags.map(t => (
                        <span key={t} className="h-5 px-2 rounded-full bg-foreground text-background text-[9px] font-black">{t}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Preview da mensagem</p>
                <div className="p-4 rounded-xl border border-border bg-background space-y-2">
                  {subject && <p className="font-black text-sm text-foreground">{subject}</p>}
                  <p className="text-[11px] text-muted-foreground leading-relaxed whitespace-pre-wrap line-clamp-10">{content || 'Conteúdo aparecerá aqui...'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Personalizações disponíveis</p>
                  {['{{nome}}', '{{empresa}}', '{{email}}', '{{link}}', '{{data}}'].map(v => (
                    <code key={v} className="block text-[10px] font-mono bg-muted px-2 py-1 rounded text-foreground">{v}</code>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Boas práticas</p>
                {[
                  { icon: Clock, tip: 'Melhor horário para e-mail: Terças e Quintas entre 10h-11h' },
                  { icon: Target, tip: 'Segmentos menores têm taxas de abertura 14% maiores' },
                  { icon: Settings2, tip: 'UTMs ajudam a rastrear o ROI real no Google Analytics' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2 p-3 rounded-xl bg-muted/40 border border-border">
                    <item.icon className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                    <p className="text-[10px] text-muted-foreground">{item.tip}</p>
                  </div>
                ))}
              </div>
            )}

            {step === 4 && (
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Checklist</p>
                {[
                  { label: 'Canal definido', ok: !!channelType },
                  { label: 'Público segmentado', ok: !!segmentId },
                  { label: 'Conteúdo escrito', ok: content.length > 20 },
                  { label: 'Assunto definido', ok: !!(channelType !== 'email' || subject.length > 3) },
                  { label: 'Agendamento configurado', ok: !!scheduleType },
                  { label: 'Nome da campanha', ok: name.length >= 3 },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className={cn('h-4 w-4 rounded-full flex items-center justify-center shrink-0', item.ok ? 'bg-primary' : 'bg-muted border border-border')}>
                      {item.ok && <CheckCircle2 className="h-3 w-3 text-primary-foreground" />}
                    </div>
                    <span className={cn('text-[11px] font-bold', item.ok ? 'text-foreground' : 'text-muted-foreground')}>{item.label}</span>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </aside>
      </div>

      {/* ── Bottom navigation ─────────────────────────────────────────────────── */}
      <div className="shrink-0 h-16 border-t border-border bg-background flex items-center justify-between px-6">
        <button
          onClick={() => step === 0 ? navigate(-1) : setStep(s => s - 1)}
          className="h-9 px-5 rounded-xl border border-border text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-muted transition-all flex items-center gap-2"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> {step === 0 ? 'Cancelar' : 'Voltar'}
        </button>

        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
          Etapa {step + 1} de {STEPS.length} · {STEPS[step]}
        </p>

        {step < STEPS.length - 1 ? (
          <button
            onClick={() => canProceed() && setStep(s => s + 1)}
            disabled={!canProceed()}
            className="h-9 px-5 rounded-xl bg-foreground text-background text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-30 flex items-center gap-2"
          >
            Continuar <ChevronRight className="h-3.5 w-3.5" />
          </button>
        ) : (
          <button
            onClick={() => saveMut.mutate()}
            disabled={saveMut.isPending || !canProceed()}
            className="h-9 px-5 rounded-xl bg-foreground text-background text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-30 flex items-center gap-2"
          >
            {scheduleType === 'immediate' ? <><Send className="h-3.5 w-3.5" /> Disparar</> : <><FileText className="h-3.5 w-3.5" /> Salvar</>}
          </button>
        )}
      </div>
    </div>
  );
}
