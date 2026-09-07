
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import {
    ArrowRightLeft,
    Package,
    ChevronRight,
    MapPin,
    History,
    AlertCircle,
    CheckCircle2,
    Search,
    ArrowLeft,
    MoveRight,
    Zap,
    Scale,
    Trash2,
    Plus,
    Minus,
    ArrowDownRight,
    Truck,
    Navigation,
    ShieldCheck,
    Container,
    LayoutGrid,
    Activity,
    ArrowRight,
    LucideIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { cn, formatCurrency } from '@/lib/utils';

type StockMovementInsert = Database['public']['Tables']['estoque_movimentacoes']['Insert'];
type Subpanel = Database['public']['Tables']['eventos_subpaineis']['Row'] & {
    eventos: { titulo: string } | null
};

interface StockItem {
    id: string;
    nome: string;
    type: 'insumo' | 'produto';
    icon: LucideIcon;
    unidade_medida?: string;
    transferQty?: number;
}

export default function StockTransfer() {
    const { id: empresaId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [originId, setOriginId] = useState<string>('');
    const [destId, setDestId] = useState<string>('');
    const [selectedItems, setSelectedItems] = useState<StockItem[]>([]);

    // Fetch Subpanels
    const { data: subpanels } = useQuery({
        queryKey: ['pos-subpanels-transfer', empresaId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('eventos_subpaineis')
                .select('*, eventos(titulo)')
                .eq('is_ativo', true);
            if (error) throw error;
            return data as unknown as Subpanel[];
        }
    });

    // Fetch Items
    const { data: items, isLoading: loadingItems } = useQuery({
        queryKey: ['transferable-items', empresaId],
        queryFn: async () => {
            const [insumos, produtos] = await Promise.all([
                supabase.from('produtos_insumos').select('*').eq('empresa_id', empresaId),
                supabase.from('produtos_evento').select('*').limit(50)
            ]);

            return [
                ...(insumos.data?.map(i => ({ ...i, type: 'insumo' as const, icon: Package })) || []),
                ...(produtos.data?.map(p => ({ ...p, type: 'produto' as const, icon: Zap })) || [])
            ] as StockItem[];
        }
    });

    const transferMutation = useMutation({
        mutationFn: async (payload: StockMovementInsert[]) => {
            console.log('[StockTransfer] Initiating transfer:', { itemCount: payload.length, originId, destId });
            const { error } = await supabase
                .from('estoque_movimentacoes')
                .insert(payload);
            if (error) {
                console.error('[StockTransfer] Transfer error:', { message: error.message, code: error.code, details: error.details });
                throw error;
            }
            console.log('[StockTransfer] Transfer successful');
        },
        onSuccess: () => {
            toast.success("Transferência de ativos efetuada!");
            setSelectedItems([]);
            queryClient.invalidateQueries({ queryKey: ['estoque-movimentacoes'] });
        },
        onError: (err: Error) => {
            console.error('[StockTransfer] Mutation error:', err);
            toast.error("Erro na operação logística: " + err.message);
        }
    });

    const addItem = (item: StockItem) => {
        if (selectedItems.find(i => i.id === item.id)) return;
        setSelectedItems(prev => [...prev, { ...item, transferQty: 1 }]);
    };

    const removeItem = (id: string) => {
        setSelectedItems(prev => prev.filter(i => i.id !== id));
    };

    const updateQty = (id: string, delta: number) => {
        setSelectedItems(prev => prev.map(i => i.id === id ? { ...i, transferQty: Math.max(0, (i.transferQty || 0) + delta) } : i));
    };

    const handleTransfer = () => {
        if (!originId || !destId || originId === destId) {
            toast.error("Configure uma rota válida (Origem ≠ Destino)");
            return;
        }
        if (selectedItems.length === 0) {
            toast.error("Nenhum ativo selecionado para o manifesto");
            return;
        }

        const payload: StockMovementInsert[] = selectedItems.map(item => ({
            empresa_id: empresaId || '',
            subpainel_origem_id: originId,
            subpainel_destino_id: destId,
            [item.type === 'insumo' ? 'insumo_id' : 'produto_id']: item.id,
            tipo: 'transferencia_enviada',
            quantidade: Number(item.transferQty),
            motivo: 'Logística Inter-PDV'
        }));

        transferMutation.mutate(payload);
    };

    const filteredItems = items?.filter(i =>
        i.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                        <p className="luma-subtitle-premium !tracking-[0.6em] mb-1">Supply Chain & Internal Logistics</p>
                        <h1 className="luma-title-premium !text-5xl lg:!text-6xl">Remanejamento</h1>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button className="h-14 px-8 rounded-[24px] bg-white border border-slate-100 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-slate-900 transition-all flex items-center gap-4 group">
                        <History className="h-4 w-4 group-hover:rotate-12 transition-transform" /> Manifestos Anteriores
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                {/* Logistics Steps */}
                <div className="lg:col-span-5 space-y-12">
                    <div className="luma-card p-12 lg:p-16 space-y-12 bg-white border-slate-100 rounded-[56px] shadow-3xl shadow-slate-200/50">
                        <div className="space-y-2">
                            <h3 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">Network Routing</h3>
                            <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.4em] mt-2">Activate logistics flow</p>
                        </div>
                        
                        <div className="space-y-8 relative">
                            {/* Origin Node */}
                            <div className="p-10 bg-slate-50/50 rounded-[40px] border border-slate-100 space-y-6 group hover:border-rose-200 transition-all duration-700">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-3 w-3 rounded-sm bg-rose-500 animate-pulse" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.6em] text-slate-400">Node Origem</span>
                                    </div>
                                    <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center text-slate-200 group-hover:text-rose-500 transition-all">
                                        <MapPin className="h-5 w-5" />
                                    </div>
                                </div>
                                <Select onValueChange={setOriginId} value={originId}>
                                    <SelectTrigger className="h-16 rounded-[24px] bg-white border-slate-100 font-black uppercase text-[11px] tracking-[0.2em] px-8 shadow-inner focus:ring-0 group-hover:border-rose-100 transition-all">
                                        <SelectValue placeholder="Identify source node..." />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-[32px] border-slate-100 p-3 shadow-3xl">
                                        {subpanels?.map(s => (
                                            <SelectItem key={s.id} value={s.id} className="rounded-xl py-4 font-black uppercase text-[10px] tracking-widest pl-8">{s.nome}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Divider with Logistics Symbol */}
                            <div className="flex justify-center -my-4 relative z-20">
                                <div className="h-16 w-16 bg-slate-950 rounded-[28px] flex items-center justify-center text-white shadow-3xl shadow-slate-950/20 group hover:rotate-180 transition-all duration-1000 cursor-pointer">
                                    <Navigation className="h-8 w-8 text-emerald-400 rotate-90" />
                                </div>
                            </div>

                            {/* Destination Node */}
                            <div className="p-10 bg-slate-50/50 rounded-[40px] border border-slate-100 space-y-6 group hover:border-emerald-200 transition-all duration-700">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-3 w-3 rounded-sm bg-emerald-500" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.6em] text-slate-400">Node Destino</span>
                                    </div>
                                    <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center text-slate-200 group-hover:text-emerald-500 transition-all">
                                        <Navigation className="h-5 w-5" />
                                    </div>
                                </div>
                                <Select onValueChange={setDestId} value={destId}>
                                    <SelectTrigger className="h-16 rounded-[24px] bg-white border-slate-100 font-black uppercase text-[11px] tracking-[0.2em] px-8 shadow-inner focus:ring-0 group-hover:border-emerald-100 transition-all">
                                        <SelectValue placeholder="Identify target node..." />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-[32px] border-slate-100 p-3 shadow-3xl">
                                        {subpanels?.map(s => (
                                            <SelectItem key={s.id} value={s.id} className="rounded-xl py-4 font-black uppercase text-[10px] tracking-widest pl-8">{s.nome}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <div className="luma-card p-12 bg-slate-950 border-none text-white space-y-12 shadow-[0_64px_128px_-32px_rgba(0,0,0,0.4)] group relative overflow-hidden rounded-[56px]">
                        <div className="absolute right-0 top-0 h-full w-48 bg-emerald-500/5 group-hover:w-full transition-all duration-1000 blur-[80px] pointer-events-none" />
                        <div className="space-y-8 relative z-10">
                            <div className="h-20 w-20 rounded-[32px] bg-white/10 flex items-center justify-center text-emerald-400 shadow-inner group-hover:scale-110 transition-transform duration-700">
                                <Scale className="h-10 w-10" />
                            </div>
                            <div className="space-y-3">
                                <h3 className="text-4xl font-black italic uppercase tracking-tighter text-white leading-none">Manifest Seal</h3>
                                <p className="text-lg font-medium opacity-50 leading-relaxed">Confirme que o deslocamento físico dos ativos em rede corresponde a esta instrução virtual.</p>
                            </div>
                        </div>
                        <button
                            onClick={handleTransfer}
                            disabled={transferMutation.isPending || selectedItems.length === 0}
                            className="w-full h-24 rounded-[40px] bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-[0.5em] text-[12px] shadow-3xl shadow-emerald-500/30 transition-all active:scale-95 duration-500 disabled:opacity-30 relative z-10 group flex items-center justify-center gap-6"
                        >
                            {transferMutation.isPending ? "VALIDATING LEDGER..." : "Authorize Redistribution"}
                            <ArrowRight className="h-5 w-5 group-hover:translate-x-3 transition-transform" />
                        </button>
                         <p className="text-center text-[9px] font-black uppercase text-white/20 tracking-[1em] pt-8">EVENT I/OS SUPPLY CHAIN PROTOCOL v1.0</p>
                    </div>
                </div>

                {/* Content Section */}
                <div className="lg:col-span-7 space-y-12">
                    <div className="luma-card p-0 overflow-hidden bg-white border-slate-100 shadow-3xl shadow-slate-200/50 rounded-[56px]">
                        <div className="p-12 lg:px-16 border-b border-slate-50 flex flex-col md:flex-row items-center justify-between gap-12 bg-slate-50/20">
                            <div className="space-y-1">
                                <h3 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">Network Assets</h3>
                                <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.5em] mt-2">Scan cluster inventory</p>
                            </div>
                            <div className="relative w-full md:w-96 group/search">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within/search:text-slate-950 transition-colors" />
                                <Input
                                    placeholder="Localizar ativo..."
                                    className="h-16 pl-16 rounded-[24px] border-slate-100 bg-white font-black uppercase text-[11px] tracking-[0.2em] shadow-inner focus-visible:ring-0 focus-visible:border-slate-950 transition-all"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        
                        <div className="p-12 lg:p-16">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                {loadingItems ? (
                                    Array.from({ length: 9 }).map((_, i) => (
                                        <div key={i} className="h-40 bg-slate-50/50 rounded-[32px] animate-pulse border border-slate-50" />
                                    ))
                                ) : (filteredItems?.length === 0 ? (
                                    <div className="col-span-full py-24 text-center space-y-4 opacity-40">
                                        <Search className="h-12 w-12 mx-auto text-slate-300" />
                                        <p className="font-black italic uppercase tracking-tighter text-2xl">Asset Not Located</p>
                                    </div>
                                ) : filteredItems?.map(item => {
                                    const Icon = item.icon;
                                    const isSelected = selectedItems.find(i => i.id === item.id);
                                    return (
                                        <div
                                            key={item.id}
                                            onClick={() => addItem(item)}
                                            className={cn(
                                                "group p-8 rounded-[40px] border-2 transition-all duration-700 cursor-pointer relative overflow-hidden flex flex-col items-center text-center gap-6",
                                                isSelected
                                                    ? "bg-slate-950 border-slate-950 shadow-3xl shadow-slate-950/20 scale-[1.05]"
                                                    : "bg-white border-slate-50 hover:border-slate-400 hover:shadow-2xl hover:shadow-slate-200/50"
                                            )}
                                        >
                                            <div className={cn(
                                                "h-16 w-16 rounded-[24px] flex items-center justify-center transition-all duration-700 shadow-xl",
                                                isSelected ? "bg-white border border-white text-slate-950" : "bg-slate-50 text-slate-200 group-hover:scale-110 group-hover:bg-white group-hover:text-slate-950"
                                            )}>
                                                <Icon className="h-8 w-8" />
                                            </div>
                                            <div className="space-y-1">
                                                <h4 className={cn("text-sm font-black italic uppercase tracking-tighter truncate w-full px-4", isSelected ? "text-white" : "text-slate-900")}>
                                                    {item.nome}
                                                </h4>
                                                <p className={cn("text-[8px] font-black uppercase tracking-[0.4em] mt-1", isSelected ? "text-emerald-400" : "text-slate-300")}>
                                                    {item.type}
                                                </p>
                                            </div>
                                            {isSelected && (
                                                <div className="absolute top-4 right-4 h-6 w-6 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-lg animate-in zoom-in duration-500">
                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                </div>
                                            )}
                                        </div>
                                    );
                                }))}
                            </div>

                            {/* Manifesto Manifest */}
                            <div className="mt-20 pt-20 border-t-4 border-dashed border-slate-50 space-y-12">
                                <div className="flex items-center justify-between mx-4">
                                    <div className="space-y-1">
                                        <h3 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900">Manifest Assets ({selectedItems.length})</h3>
                                        <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.4em]">Audit queue synchronization</p>
                                    </div>
                                    {selectedItems.length > 0 && (
                                        <button 
                                            onClick={() => setSelectedItems([])} 
                                            className="h-10 px-6 rounded-xl bg-rose-50 text-rose-500 text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all duration-500 active:scale-90"
                                        >
                                            Purge Manifesto
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-6">
                                    {selectedItems.length === 0 ? (
                                        <div className="py-32 text-center bg-slate-50/20 rounded-[64px] border-4 border-dashed border-slate-50 animate-in fade-in duration-1000 group">
                                            <div className="h-24 w-24 rounded-[32px] bg-white border border-slate-100 flex items-center justify-center mx-auto text-slate-100 shadow-3xl transition-transform duration-1000 group-hover:rotate-12 mb-8">
                                                <Container className="h-12 w-12" />
                                            </div>
                                            <div className="space-y-3">
                                                <p className="text-3xl font-black italic uppercase tracking-tighter text-slate-300">Null Asset Projection</p>
                                                <p className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-200">Selecione itens no cluster para iniciar a remessa virtual</p>
                                            </div>
                                        </div>
                                    ) : selectedItems.map((item, idx) => (
                                        <div 
                                            key={item.id} 
                                            className="luma-card p-8 flex flex-col md:flex-row items-center gap-10 group animate-in slide-in-from-bottom-8 rounded-[48px] bg-white border-slate-100 hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-700 hover:border-slate-900"
                                            style={{ animationDelay: `${idx * 100}ms` }}
                                        >
                                            <div className="h-20 w-20 bg-slate-950 rounded-[28px] flex items-center justify-center text-white shrink-0 shadow-2xl shadow-slate-950/20 group-hover:rotate-6 transition-transform duration-700">
                                                <item.icon className="h-9 w-9 text-white" />
                                            </div>
                                            <div className="flex-1 text-center md:text-left min-w-0 space-y-2">
                                                <h4 className="font-black italic uppercase tracking-tighter text-2xl text-slate-900 leading-tight truncate">{item.nome}</h4>
                                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                                                    <Badge className="bg-slate-100 text-slate-400 text-[9px] font-black uppercase tracking-widest px-3 border-none">CLASS: {item.type}</Badge>
                                                    <Badge className="bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest px-3 border border-emerald-100">UNIT: {item.unidade_medida || 'UN'}</Badge>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-8 p-3 rounded-[32px] bg-slate-50 border border-slate-100 shadow-inner group-hover:bg-white transition-all duration-700">
                                                <button onClick={() => updateQty(item.id, -1)} className="h-12 w-12 rounded-2xl bg-white text-slate-400 hover:text-slate-950 hover:shadow-lg transition-all active:scale-90"><Minus className="h-5 w-5" /></button>
                                                <div className="w-16 text-center tabular-nums">
                                                    <span className="text-3xl font-black italic text-slate-900 leading-none">{item.transferQty}</span>
                                                </div>
                                                <button onClick={() => updateQty(item.id, 1)} className="h-12 w-12 rounded-2xl bg-white text-slate-400 hover:text-slate-950 hover:shadow-lg transition-all active:scale-90"><Plus className="h-5 w-5" /></button>
                                            </div>
                                            <button 
                                                onClick={() => removeItem(item.id)}
                                                className="h-14 w-14 rounded-[24px] bg-white border border-slate-100 flex items-center justify-center text-slate-200 hover:text-rose-500 hover:border-rose-100 transition-all shadow-sm hover:shadow-rose-500/10"
                                            >
                                                <Trash2 className="h-6 w-6" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
