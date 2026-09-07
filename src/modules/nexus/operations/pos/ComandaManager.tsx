
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
    ClipboardList,
    Search,
    Plus,
    CreditCard,
    User,
    Clock,
    Filter,
    Store,
    ArrowLeft,
    MoreVertical,
    Activity,
    Users,
    ChevronRight,
    CircleDot,
    Lock,
    Zap,
    ArrowRight,
    ShieldCheck,
    Monitor,
    Wallet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { cn, formatCurrency } from '@/lib/utils';
import type { Database } from '@/integrations/supabase/types';

type Comanda = Database['public']['Tables']['comandas']['Row'];
type ComandaStatus = 'livre' | 'aberta' | 'fechando' | 'bloqueada' | 'paga';

export default function ComandaManager() {
    const { id: empresaId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [newComandaId, setNewComandaId] = useState('');
    const [newComandaNome, setNewComandaNome] = useState('');
    const [selectedEventoId, setSelectedEventoId] = useState<string>('');
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [selectedComanda, setSelectedComanda] = useState<Comanda | null>(null);

    // Fetch Active Events
    const { data: eventos } = useQuery({
        queryKey: ['active-eventos-comandas', empresaId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('eventos')
                .select('id, titulo')
                .eq('empresa_id', empresaId)
                .in('status', ['confirmado', 'em_andamento']);
            if (error) throw error;
            return data;
        }
    });

    useEffect(() => {
        if (eventos && eventos.length > 0 && !selectedEventoId) {
            setSelectedEventoId(eventos[0].id);
        }
    }, [eventos, selectedEventoId]);

    // Fetch Comandas
    const { data: comandas, isLoading } = useQuery({
        queryKey: ['active-comandas', empresaId, selectedEventoId],
        enabled: !!selectedEventoId && !!empresaId,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('comandas')
                .select('*')
                .eq('empresa_id', empresaId)
                .eq('evento_id', selectedEventoId)
                .neq('status', 'paga')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        }
    });

    const openComanda = useMutation({
        mutationFn: async () => {
            if (!selectedEventoId || !empresaId) throw new Error("Contexto inválido");
            if (!newComandaId) throw new Error("Identificador obrigatório");

            const { error } = await supabase
                .from('comandas')
                .insert({
                    empresa_id: empresaId,
                    evento_id: selectedEventoId,
                    identificador: newComandaId,
                    cliente_nome: newComandaNome || null,
                    status: 'aberta',
                    tipo: 'mesa',
                    saldo_consumo: 0
                });
            if (error) {
                console.error("Error opening comanda:", error);
                throw error;
            }
            console.log("Comanda opened successfully for identificador:", newComandaId);
        },
        onSuccess: () => {
            toast.success("Consumo iniciado!");
            setNewComandaId('');
            setNewComandaNome('');
            queryClient.invalidateQueries({ queryKey: ['active-comandas'] });
        },
        onError: (error) => toast.error(`Falha ao abrir: ${error.message}`)
    });

    const closeComanda = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('comandas')
                .update({ status: 'paga' })
                .eq('id', id);
            if (error) {
                console.error("Error closing comanda:", error);
                throw error;
            }
            console.log("Comanda closed successfully:", id);
        },
        onSuccess: () => {
            toast.success("Conta liquidada com sucesso.");
            setIsCheckoutOpen(false);
            setSelectedComanda(null);
            queryClient.invalidateQueries({ queryKey: ['active-comandas'] });
        },
        onError: (error) => toast.error(`Erro na liquidação: ${error.message}`)
    });

    const handleCheckoutClick = (comanda: Comanda) => {
        setSelectedComanda(comanda);
        setIsCheckoutOpen(true);
    };

    return (
        <div className="space-y-16 animate-in fade-in duration-1000 pb-32">
            {/* Premium Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-12 pb-12 border-b border-slate-100 relative">
                <div className="flex items-center gap-8 relative z-10">
                    <button 
                        onClick={() => navigate(-1)}
                        className="h-16 w-16 rounded-[24px] bg-white border border-slate-100 flex items-center justify-center hover:bg-slate-50 transition-all shadow-sm group active:scale-90"
                    >
                        <ArrowLeft className="h-7 w-7 text-slate-400 group-hover:text-slate-900 transition-colors" />
                    </button>
                    <div className="space-y-2">
                        <p className="luma-subtitle-premium !tracking-[0.6em] mb-1">Consumption Ledger Hub</p>
                        <h1 className="luma-title-premium !text-5xl lg:!text-6xl">Comandas</h1>
                    </div>
                </div>

                <div className="flex flex-wrap gap-6 items-center">
                    <div className="w-[320px]">
                        <Select value={selectedEventoId} onValueChange={setSelectedEventoId}>
                            <SelectTrigger className="h-14 rounded-[20px] bg-white border-slate-100 font-black uppercase text-[10px] tracking-widest px-8 shadow-sm focus:ring-0">
                                <div className="flex items-center gap-3 truncate">
                                    <Store className="h-4 w-4 text-slate-300" />
                                    <SelectValue placeholder="Selecione o Evento..." />
                                </div>
                            </SelectTrigger>
                            <SelectContent className="rounded-[24px] border-slate-100 p-2 shadow-3xl">
                                {eventos?.map(evt => (
                                    <SelectItem key={evt.id} value={evt.id} className="rounded-xl py-3 font-black uppercase text-[10px] tracking-widest">
                                        {evt.titulo}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Sheet>
                        <SheetTrigger asChild>
                            <button className="h-14 px-10 rounded-[24px] bg-slate-900 text-white text-[11px] font-black uppercase tracking-[0.4em] hover:bg-black transition-all flex items-center gap-4 shadow-3xl shadow-slate-900/10 active:scale-95 duration-500 group">
                                <Plus className="h-5 w-5 group-hover:rotate-180 transition-transform duration-700" /> Iniciar Fluxo
                            </button>
                        </SheetTrigger>
                        <SheetContent className="sm:max-w-xl border-none p-0 overflow-hidden bg-white shadow-[-32px_0_120px_rgba(0,0,0,0.1)] rounded-l-[48px]">
                            <div className="p-12 lg:p-16 border-b border-slate-50 bg-slate-50/30">
                                <SheetHeader>
                                    <div className="h-16 w-16 rounded-[24px] bg-slate-900 flex items-center justify-center text-white mb-8 shadow-xl">
                                        <Plus className="h-8 w-8 text-emerald-400" />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.6em] text-slate-300 mb-2">Protocol Start</p>
                                    <SheetTitle className="text-4xl font-black italic uppercase tracking-tighter text-slate-900">Abertura de Comanda</SheetTitle>
                                    <SheetDescription className="font-medium text-slate-500 pt-2 text-lg leading-relaxed">
                                        Vincule um novo identificador físico à rede de consumo do evento.
                                    </SheetDescription>
                                </SheetHeader>
                            </div>
                            <div className="p-12 lg:p-16 space-y-12 bg-white">
                                <div className="space-y-10">
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-900 ml-4 block mb-2">Node Identifier / Bracelet *</Label>
                                        <div className="relative group/input">
                                            <div className="absolute left-8 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-200 group-focus-within/input:text-slate-900 transition-colors">
                                                <CircleDot className="h-6 w-6" />
                                            </div>
                                            <Input
                                                value={newComandaId}
                                                onChange={e => setNewComandaId(e.target.value)}
                                                placeholder="Ex: Mesa 10, RF-ID #..."
                                                className="h-20 rounded-[32px] border-slate-100 bg-slate-50 focus-visible:bg-white focus-visible:ring-0 focus-visible:border-slate-900 pl-20 pr-10 text-xl font-black italic uppercase tracking-tighter transition-all duration-700 shadow-inner"
                                            />
                                            <div className="absolute inset-x-12 -bottom-3 h-1 bg-slate-900 scale-x-0 group-focus-within/input:scale-x-100 transition-transform duration-700 rounded-sm" />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-900 ml-4 block mb-2">Client Entity Name (Optional)</Label>
                                        <div className="relative group/input">
                                            <div className="absolute left-8 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-200 group-focus-within/input:text-slate-900 transition-colors">
                                                <User className="h-6 w-6" />
                                            </div>
                                            <Input
                                                value={newComandaNome}
                                                onChange={e => setNewComandaNome(e.target.value)}
                                                placeholder="Nenhum titular selecionado..."
                                                className="h-20 rounded-[32px] border-slate-100 bg-slate-50 focus-visible:bg-white focus-visible:ring-0 focus-visible:border-slate-900 pl-20 pr-10 font-bold transition-all duration-700 shadow-inner"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => openComanda.mutate()}
                                    disabled={!newComandaId || openComanda.isPending}
                                    className="w-full h-24 rounded-[40px] bg-slate-900 text-white font-black uppercase tracking-[0.5em] text-[12px] hover:bg-black transition-all active:scale-95 duration-500 shadow-3xl shadow-slate-900/20 disabled:opacity-30 flex items-center justify-center gap-6 group"
                                >
                                    {openComanda.isPending ? 'DEPLOYING NODE...' : 'Authorize Activation'}
                                    <ArrowRight className="h-5 w-5 group-hover:translate-x-3 transition-transform" />
                                </button>
                                <p className="text-center text-[8px] font-black uppercase text-slate-200 tracking-[1em] pt-8">EVENT I/OS CORE SETTLEMENT v4.2</p>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>

            {/* Operations Desk */}
            <div className="space-y-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 ml-4 mr-4">
                     <div className="space-y-2">
                        <h2 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">Open Nodes Cluster</h2>
                        <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.4em]">Real-time consumption ledger monitoring</p>
                     </div>
                     <div className="relative max-w-md w-full">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                        <Input
                            placeholder="Universal Search Grid..."
                            className="h-14 pl-16 rounded-[24px] border-slate-100 bg-slate-50 focus-visible:bg-white focus-visible:ring-0 focus-visible:border-slate-900 font-bold text-sm shadow-sm transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
                    {isLoading ? (
                        Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="h-80 bg-slate-50/50 rounded-[48px] animate-pulse border border-slate-100" />
                        ))
                    ) : (comandas?.filter(c =>
                        c.identificador.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (c.cliente_nome && c.cliente_nome.toLowerCase().includes(searchTerm.toLowerCase()))
                    ).length === 0 ? (
                        <div className="col-span-full py-48 text-center space-y-8 bg-slate-50/30 rounded-[64px] border-4 border-dashed border-slate-100 animate-in fade-in duration-1000">
                             <div className="h-24 w-24 rounded-[32px] bg-white border border-slate-100 flex items-center justify-center mx-auto text-slate-200 shadow-xl group hover:rotate-12 transition-transform duration-700">
                                <ClipboardList className="h-10 w-10" />
                             </div>
                             <div className="space-y-2 max-w-sm mx-auto">
                                <h3 className="text-3xl font-black italic uppercase tracking-tighter text-slate-300">All Nodes Idle</h3>
                                <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.3em] leading-relaxed">Nenhuma comanda ativa neste cluster operacional.</p>
                             </div>
                        </div>
                    ) : (
                        comandas?.filter(c =>
                            c.identificador.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (c.cliente_nome && c.cliente_nome.toLowerCase().includes(searchTerm.toLowerCase()))
                        ).map((comanda, idx) => (
                            <div 
                                key={comanda.id} 
                                onClick={() => handleCheckoutClick(comanda)}
                                className="group luma-card p-0 overflow-hidden bg-white border-slate-100 hover:border-slate-900 hover:shadow-3xl hover:shadow-slate-200/50 transition-all duration-700 cursor-pointer animate-in fade-in slide-in-from-bottom-8 rounded-[48px]"
                                style={{ animationDelay: `${idx * 40}ms` }}
                            >
                                <div className="p-12 space-y-10">
                                    <div className="flex justify-between items-start">
                                        <div className="h-16 w-16 rounded-[24px] bg-slate-900 flex items-center justify-center text-white shadow-2xl shadow-slate-900/10 group-hover:scale-110 transition-transform duration-700">
                                            <CircleDot className="h-8 w-8 text-white group-hover:animate-pulse" />
                                        </div>
                                        <Badge className={cn(
                                            "rounded-[14px] px-4 py-2 text-[9px] font-black uppercase tracking-[0.3em] border-none shadow-sm",
                                            comanda.status === 'aberta' ? 'bg-emerald-500 text-white animate-pulse' : 'bg-amber-100 text-amber-600'
                                        )}>
                                            {comanda.status === 'aberta' ? 'LIVE SYNC' : comanda.status}
                                        </Badge>
                                    </div>
    
                                    <div className="space-y-2">
                                        <h3 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900 truncate leading-none">
                                            {comanda.identificador}
                                        </h3>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] truncate italic">
                                            {comanda.cliente_nome || 'Guest Consumer'}
                                        </p>
                                    </div>
    
                                    <div className="pt-10 border-t border-slate-50 space-y-10">
                                        <div className="flex justify-between items-end">
                                            <div className="space-y-2">
                                                <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.5em]">Consolidado</p>
                                                <p className="text-4xl font-black text-slate-900 italic tracking-tighter uppercase leading-none tabular-nums">
                                                    {formatCurrency(comanda.saldo_consumo || 0)}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center justify-between pt-2">
                                             <div className="flex items-center gap-3 text-slate-300">
                                                <div className="h-2 w-2 rounded-sm bg-emerald-500 animate-pulse" />
                                                <Clock className="h-3.5 w-3.5" />
                                                <span className="text-[9px] font-black uppercase tracking-widest tabular-nums">
                                                    {new Date(comanda.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                             </div>
                                             <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-200 group-hover:bg-slate-900 group-hover:text-white transition-all duration-700 shadow-sm">
                                                 <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
                                             </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ))}
                </div>
            </div>

            {/* Global Perspective Bottom Bar */}
            <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-24 duration-1000">
                <div className="bg-slate-950 px-12 py-6 rounded-[48px] shadow-[0_32px_120px_-24px_rgba(0,0,0,0.5)] flex items-center gap-12 border border-white/5 backdrop-blur-3xl">
                    <div className="flex items-center gap-16 border-r border-white/10 pr-16">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-500">Global Exposure</p>
                            <p className="text-3xl font-black text-white italic tracking-tighter uppercase tabular-nums leading-none">
                                {formatCurrency(comandas?.reduce((acc, c) => acc + (c.saldo_consumo || 0), 0) || 0)}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-500">Nodes Active</p>
                            <p className="text-3xl font-black text-white italic tracking-tighter uppercase tabular-nums leading-none">{comandas?.length || 0}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="h-16 w-16 rounded-[24px] bg-white/5 flex items-center justify-center text-white hover:bg-white hover:text-slate-950 transition-all duration-700 shadow-inner group">
                            <Activity className="h-6 w-6 group-hover:scale-110 transition-transform" />
                        </button>
                        <button className="h-16 w-16 rounded-[24px] bg-white/5 flex items-center justify-center text-white hover:bg-white hover:text-slate-950 transition-all duration-700 shadow-inner group">
                            <Users className="h-6 w-6 group-hover:scale-110 transition-transform" />
                        </button>
                    </div>
                    <button 
                        onClick={() => document.querySelector('[data-state="closed"]')?.dispatchEvent(new CustomEvent('click'))}
                        className="h-16 px-10 rounded-[28px] bg-emerald-500 flex items-center justify-center text-white font-black uppercase text-[11px] tracking-[0.4em] hover:bg-emerald-400 shadow-2xl shadow-emerald-500/20 transition-all active:scale-95 group"
                    >
                        <Plus className="h-5 w-5 mr-3 group-hover:rotate-90 transition-transform duration-500" /> New Node
                    </button>
                </div>
            </div>

            {/* Settlement Engine Sheet */}
            <Sheet open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
                <SheetContent side="right" className="sm:max-w-3xl border-none p-0 overflow-hidden bg-white shadow-[-64px_0_150px_rgba(0,0,0,0.2)] rounded-l-[80px]">
                    <div className="h-full flex flex-col">
                        <header className="p-16 lg:p-20 border-b border-slate-50 bg-slate-50/20 shrink-0">
                            <SheetHeader>
                                <div className="flex justify-between items-start mb-12">
                                    <div className="space-y-3">
                                        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-900/5 text-slate-900 text-[10px] font-black uppercase tracking-[0.5em]">
                                            <ShieldCheck className="h-4 w-4" /> Settlement Protocol Active
                                        </div>
                                        <SheetTitle className="text-6xl font-black italic uppercase tracking-tighter text-slate-900 leading-tight">Settlement</SheetTitle>
                                    </div>
                                    <div className="h-24 w-24 rounded-[32px] bg-slate-950 flex items-center justify-center text-white shadow-3xl shadow-slate-900/30 group cursor-pointer hover:rotate-6 transition-all duration-700">
                                        <Lock className="h-10 w-10 text-emerald-400" />
                                    </div>
                                </div>
                                <div className="flex items-center gap-10 bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden group">
                                    <div className="absolute right-0 top-0 h-full w-24 bg-slate-950 opacity-0 group-hover:opacity-5 transition-opacity duration-700" />
                                    <div className="h-20 w-20 rounded-[24px] bg-slate-50 flex items-center justify-center text-slate-300 font-black italic text-2xl group-hover:bg-slate-900 group-hover:text-white transition-all duration-700">
                                        #Node
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-3xl font-black text-slate-900 italic tracking-tighter uppercase leading-none">{selectedComanda?.identificador}</p>
                                        <p className="text-[12px] font-black text-slate-300 uppercase tracking-[0.4em] mt-2 italic">{selectedComanda?.cliente_nome || 'Unassigned Consumer'}</p>
                                    </div>
                                </div>
                            </SheetHeader>
                        </header>
    
                        <div className="flex-1 overflow-y-auto p-16 lg:p-20 space-y-20 bg-white">
                            <div className="luma-card p-16 lg:p-24 bg-slate-950 border-none text-white shadow-[0_64px_128px_-32px_rgba(0,0,0,0.4)] relative overflow-hidden group rounded-[64px]">
                                <div className="absolute right-0 top-0 h-full w-96 bg-emerald-500/5 blur-[120px] pointer-events-none group-hover:w-full transition-all duration-1000" />
                                <div className="relative z-10 flex flex-col items-center justify-center space-y-8">
                                    <div className="h-16 px-10 rounded-[24px] bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-3xl">
                                        <span className="text-[12px] font-black uppercase text-white tracking-[0.6em]">Payable Ledger Exposure</span>
                                    </div>
                                    <span className="text-8xl lg:text-9xl font-black tracking-tighter italic uppercase leading-none tabular-nums animate-in zoom-in duration-1000">
                                        {formatCurrency(selectedComanda?.saldo_consumo || 0)}
                                    </span>
                                    <div className="h-1.5 w-48 bg-white/10 rounded-lg overflow-hidden">
                                        <div className="h-full w-1/2 bg-emerald-500 animate-slide-infinite" />
                                    </div>
                                </div>
                            </div>
    
                            <div className="space-y-12 pb-24">
                                <div className="flex items-center gap-6 border-b border-slate-50 pb-8 ml-8">
                                    <div className="h-10 w-10 rounded-2xl bg-slate-50 flex items-center justify-center">
                                        <Zap className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">Gateway Authorization</h4>
                                        <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.4em] mt-1">Select valid settlement channel</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                    {[
                                        { label: 'Blockchain PIX', icon: <Zap className="h-7 w-7" />, sub: 'Instant Balance Sync', active: true },
                                        { label: 'Global Credit', icon: <CreditCard className="h-7 w-7" />, sub: 'Master/Visa/Amex' },
                                        { label: 'Physical Assets', icon: <Wallet className="h-7 w-7" />, sub: 'BRL Cash Bullion' },
                                        { label: 'Auth Token', icon: <ShieldCheck className="h-7 w-7" />, sub: 'Provisioned Voucher' }
                                    ].map((meth, i) => (
                                        <button key={i} className={cn(
                                            "h-40 rounded-[56px] border border-slate-50 transition-all duration-700 flex flex-col items-center justify-center gap-6 group/btn shadow-inner hover:bg-slate-950 hover:border-slate-800 hover:shadow-2xl hover:shadow-slate-900/10 active:scale-95 group",
                                            meth.active ? "bg-slate-50" : "bg-white"
                                        )}>
                                            <div className="h-16 w-16 rounded-[24px] bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:scale-110 group-hover:bg-white group-hover:text-slate-900 transition-all duration-700 shadow-sm">
                                                {meth.icon}
                                            </div>
                                            <div className="text-center space-y-1 group-hover:translate-y-1 transition-transform">
                                                <p className="font-black italic uppercase tracking-tighter text-lg text-slate-900 group-hover:text-white transition-colors">{meth.label}</p>
                                                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-300 group-hover:text-emerald-500/60 transition-colors uppercase">{meth.sub}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
    
                        <footer className="p-16 lg:p-20 bg-white border-t border-slate-50 flex flex-col md:flex-row gap-10 shrink-0 relative z-20">
                            <button
                                onClick={() => setIsCheckoutOpen(false)}
                                className="h-24 px-16 rounded-[48px] font-black uppercase tracking-[0.5em] text-[11px] text-slate-300 hover:text-slate-900 hover:bg-slate-50 transition-all duration-700 active:scale-95"
                            >
                                Cancelar Manifesto
                            </button>
                            <button
                                onClick={() => selectedComanda && closeComanda.mutate(selectedComanda.id)}
                                disabled={closeComanda.isPending}
                                className="flex-1 h-24 rounded-[48px] bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-[0.6em] text-[12px] shadow-[0_32px_120px_-24px_rgba(16,185,129,0.3)] active:scale-95 transition-all duration-1000 disabled:opacity-30 group flex items-center justify-center gap-6"
                            >
                                {closeComanda.isPending ? 'LIQUIDATING ASSETS...' : 'Commit Settlement'}
                                <Activity className="h-6 w-6 group-hover:rotate-12 transition-transform" />
                            </button>
                        </footer>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}


