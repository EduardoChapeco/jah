
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
    Store,
    DollarSign,
    Package,
    TrendingUp,
    Users,
    Search,
    Plus,
    Filter,
    ArrowUpRight,
    ChefHat,
    Ticket,
    ShoppingBag,
    Sparkles,
    ArrowRightLeft,
    ClipboardList,
    BarChart3,
    BookOpen,
    ArrowLeft,
    MoreHorizontal,
    Monitor,
    Zap,
    Scale,
    Activity
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export default function POSManagement() {
    const { id: empresaId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");

    // Fetch POS Units across all events
    const { data: posUnits, isLoading } = useQuery({
        queryKey: ["pos-units-global", empresaId],
        queryFn: async () => {
            if (!empresaId) return [];
            const { data, error } = await supabase
                .from("eventos_subpaineis")
                .select("*, eventos(titulo, empresa_id)")
                .eq("eventos.empresa_id", empresaId);

            if (error) throw error;
            return data.map(sub => ({
                id: sub.id,
                name: sub.nome,
                type: sub.tipo,
                event: sub.eventos?.titulo || "Evento s/ Nome",
                sales: Math.random() * 50000, // Placeholder for real metrics
                status: sub.is_ativo ? "online" : "offline",
                staff: sub.responsavel_nome ? 1 : 0
            }));
        },
        enabled: Boolean(empresaId),
    });

    const getIcon = (type: string) => {
        switch (type) {
            case 'bar': return ChefHat;
            case 'ingresso': return Ticket;
            case 'loja': return ShoppingBag;
            case 'parque': return Sparkles;
            default: return Monitor;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'bar': return 'text-amber-500 bg-amber-50';
            case 'ingresso': return 'text-blue-500 bg-blue-50';
            case 'loja': return 'text-purple-500 bg-purple-50';
            case 'parque': return 'text-emerald-500 bg-emerald-50';
            default: return 'text-slate-500 bg-slate-50';
        }
    };

    const filteredPOS = posUnits?.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.event.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-12 animate-in fade-in duration-700 pb-20">
            {/* Premium Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-8 border-b border-slate-100">
                <div className="flex items-center gap-6">
                    <div className="h-14 w-14 rounded-2xl bg-slate-900 flex items-center justify-center shadow-xl shadow-slate-900/10 transition-transform hover:scale-105">
                        <Monitor className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <p className="luma-subtitle-premium">Global Operations & POS</p>
                        <h1 className="luma-title-premium !text-4xl">Infraestrutura de Vendas</h1>
                    </div>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() => navigate(`/empresa/${empresaId}/pos/logistica`)}
                        className="h-11 px-6 rounded-xl bg-white border border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 hover:border-slate-900 transition-all flex items-center gap-2"
                    >
                        <ArrowRightLeft className="h-3.5 w-3.5" /> Transferências
                    </button>
                    <button
                        onClick={() => navigate(`/empresa/${empresaId}/pos/comandas`)}
                        className="h-11 px-6 rounded-xl bg-white border border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 hover:border-slate-900 transition-all flex items-center gap-2"
                    >
                        <ClipboardList className="h-3.5 w-3.5" /> Comandas
                    </button>
                    <button
                        onClick={() => navigate(`/empresa/${empresaId}/pos/analytics`)}
                        className="h-11 px-6 rounded-xl bg-white border border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 hover:border-slate-900 transition-all flex items-center gap-2"
                    >
                        <BarChart3 className="h-3.5 w-3.5" /> Analytics
                    </button>
                    <button
                        onClick={() => navigate(`/empresa/${empresaId}/pos/playbooks`)}
                        className="h-11 px-6 rounded-xl bg-white border border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 hover:border-slate-900 transition-all flex items-center gap-2"
                    >
                        <BookOpen className="h-3.5 w-3.5" /> Playbooks
                    </button>
                    <button className="h-11 px-6 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2 shadow-xl shadow-slate-900/10 active:scale-95 duration-300">
                        <Plus className="h-4 w-4" /> Novo PDV
                    </button>
                </div>
            </div>

            {/* Modern Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Revenue Stream Today', value: 'R$ 68.150,70', trend: '+18.4%', icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50/20', border: 'border-emerald-100' },
                    { label: 'Terminais Ativos', value: '14/15', trend: '93% ONLINE', icon: Monitor, color: 'text-blue-600', bg: 'bg-blue-50/20', border: 'border-blue-100' },
                    { label: 'Equipe em Campo', value: '24 Operadores', trend: 'ATIVO', icon: Users, color: 'text-amber-600', bg: 'bg-amber-50/20', border: 'border-amber-100' },
                    { label: 'Ticket Médio', value: 'R$ 84,20', trend: 'ESTÁVEL', icon: Activity, color: 'text-purple-600', bg: 'bg-purple-50/20', border: 'border-purple-100' },
                ].map((stat, i) => (
                    <div key={i} className={cn("luma-card p-8 flex flex-col justify-between group overflow-hidden relative", stat.bg, stat.border)}>
                        <div className="absolute -right-2 -top-2 h-20 w-20 bg-white/5 rounded-2xl blur-2xl group-hover:scale-150 transition-transform duration-1000" />
                        <p className={cn("text-[10px] font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2", stat.color)}>
                            <stat.icon className="h-3 w-3" /> {stat.label}
                        </p>
                        <div className="flex items-baseline gap-3">
                            <h3 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900">{stat.value}</h3>
                            <span className={cn("text-[8px] font-black px-1.5 py-0.5 rounded-md bg-white border border-slate-100", stat.color)}>{stat.trend}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* List System */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 border-l-4 border-slate-900 pl-4 py-1 ml-2">Unidades da Rede</h2>
                    <div className="relative max-w-sm w-full">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                        <Input
                            placeholder="Buscar unidades..."
                            className="h-12 pl-14 rounded-2xl border-slate-100 bg-slate-50 focus-visible:bg-white focus-visible:ring-0 focus-visible:border-slate-900 font-bold text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="luma-card p-0 overflow-hidden bg-white">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-slate-50/50 border-none">
                                <TableRow className="hover:bg-transparent border-slate-50">
                                    <TableHead className="px-8 py-6 text-slate-400 font-black uppercase tracking-[0.2em] text-[9px]">Identificador</TableHead>
                                    <TableHead className="py-6 text-slate-400 font-black uppercase tracking-[0.2em] text-[11px]">Tipo</TableHead>
                                    <TableHead className="py-6 text-slate-400 font-black uppercase tracking-[0.2em] text-[11px]">Evento Vinculado</TableHead>
                                    <TableHead className="py-6 text-slate-400 font-black uppercase tracking-[0.2em] text-[11px]">Volume (24h)</TableHead>
                                    <TableHead className="py-6 text-slate-400 font-black uppercase tracking-[0.2em] text-[11px]">Equipe</TableHead>
                                    <TableHead className="py-6 text-slate-400 font-black uppercase tracking-[0.2em] text-[11px]">Status</TableHead>
                                    <TableHead className="pr-8 py-6 text-right text-slate-400 font-black uppercase tracking-[0.2em] text-[11px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i} className="border-slate-50">
                                            <TableCell className="px-8 py-6"><Skeleton className="h-6 w-40 rounded-lg" /></TableCell>
                                            <TableCell><Skeleton className="h-8 w-8 rounded-lg" /></TableCell>
                                            <TableCell><Skeleton className="h-6 w-32 rounded-lg" /></TableCell>
                                            <TableCell><Skeleton className="h-6 w-24 rounded-lg" /></TableCell>
                                            <TableCell><Skeleton className="h-6 w-12 rounded-lg" /></TableCell>
                                            <TableCell><Skeleton className="h-6 w-20 rounded-lg" /></TableCell>
                                            <TableCell className="pr-8 text-right"><Skeleton className="h-8 w-8 ml-auto rounded-lg" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : filteredPOS?.map((unit, idx) => {
                                    const Icon = getIcon(unit.type);
                                    return (
                                        <TableRow key={unit.id} className="hover:bg-slate-50/30 transition-all border-slate-50 group duration-500">
                                            <TableCell className="px-8 py-6">
                                                <div className="flex items-center gap-6">
                                                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110 duration-500", getTypeColor(unit.type))}>
                                                        <Icon className="h-6 w-6" />
                                                    </div>
                                                    <div>
                                                        <span className="font-black italic uppercase tracking-tighter text-slate-900 text-lg group-hover:translate-x-1 transition-transform duration-300 block">{unit.name}</span>
                                                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">ID: {unit.id.slice(0, 8)}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className="bg-slate-100 text-slate-400 border-none rounded-lg px-3 py-1 text-[8px] font-black uppercase tracking-widest group-hover:bg-slate-950 group-hover:text-white transition-colors">
                                                    {unit.type || 'Standard'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">{unit.event}</TableCell>
                                            <TableCell className="font-black text-slate-900 italic uppercase tracking-tighter text-lg">
                                                {formatCurrency(unit.sales)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 text-slate-500 font-black text-[11px] uppercase tracking-widest">
                                                    <Users className="h-3.5 w-3.5 text-slate-300" />
                                                    {unit.staff} OPS
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className={cn(
                                                    "inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest",
                                                    unit.status === 'online' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-300 border border-slate-100'
                                                )}>
                                                    <div className={cn("h-2 w-2 rounded-sm", unit.status === 'online' ? 'bg-emerald-500' : 'bg-slate-300')} />
                                                    {unit.status === 'online' ? 'Online' : 'Offline'}
                                                </div>
                                            </TableCell>
                                            <TableCell className="pr-8 text-right">
                                                <button
                                                    onClick={() => navigate(`/empresa/${empresaId}/pos/${unit.id}`)}
                                                    className="h-12 w-12 rounded-2xl border border-slate-100 bg-white flex items-center justify-center text-slate-300 hover:text-slate-900 hover:border-slate-950 transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <ArrowUpRight className="h-6 w-6" />
                                                </button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </div>
    );
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}
