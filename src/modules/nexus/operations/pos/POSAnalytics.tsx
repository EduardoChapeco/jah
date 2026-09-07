
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    Users,
    DollarSign,
    Package,
    AlertTriangle,
    ArrowUpRight,
    Calendar,
    ArrowLeft,
    Zap,
    Target,
    Activity,
    ChevronDown,
    Download,
    Share2,
    PieChart as PieChartIcon,
    CheckCircle2
} from 'lucide-react';
import { format, subHours, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn, formatCurrency } from '@/lib/utils';

import type { Database } from '@/integrations/supabase/types';

type Pedido = Database['public']['Tables']['pedidos']['Row'] & {
    pedidos_itens: (Database['public']['Tables']['pedidos_itens']['Row'] & {
        produtos_evento: Database['public']['Tables']['produtos_evento']['Row'] | null;
    })[];
    subpainel: Database['public']['Tables']['eventos_subpaineis']['Row'] | null;
};

const COLORS = ['#0F172A', '#334155', '#64748B', '#94A3B8', '#CBD5E1'];

export default function POSAnalytics() {
    const { id: empresaId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [timeRange, setTimeRange] = useState('24h');

    // Fetch Sales Data
    const { data: salesStats, isLoading } = useQuery({
        queryKey: ['pos-analytics-sales', empresaId, timeRange],
        queryFn: async () => {
            const now = new Date();
            let startDate = new Date(0);

            if (timeRange === '24h') startDate = subHours(now, 24);
            else if (timeRange === '7d') startDate = subDays(now, 7);
            else if (timeRange === '30d') startDate = subDays(now, 30);

            const { data: pedidos, error } = await supabase
                .from('pedidos')
                .select('*, pedidos_itens(*, produtos_evento(nome, categoria)), subpainel:eventos_subpaineis(nome), eventos!inner(empresa_id)')
                .eq('eventos.empresa_id', empresaId)
                .gte('created_at', startDate.toISOString())
                .order('created_at', { ascending: true });

            if (error) throw error;

            const totalRevenue = pedidos.reduce((acc, p) => acc + Number(p.valor_total), 0);
            const avgTicket = pedidos.length > 0 ? totalRevenue / pedidos.length : 0;

            const catMap: Record<string, number> = {};
            const sectorMap: Record<string, number> = {};
            const timeMap: Record<string, number> = {};

            pedidos.forEach(p => {
                if (p.pedidos_itens && p.pedidos_itens.length > 0) {
                    p.pedidos_itens.forEach((item) => {
                        const cat = item.produtos_evento?.categoria || 'Outro';
                        catMap[cat] = (catMap[cat] || 0) + Number(item.valor_total);
                    });
                } else {
                    catMap['Geral'] = (catMap['Geral'] || 0) + Number(p.valor_total);
                }

                const sectorName = p.subpainel?.nome || 'Ponto Central';
                sectorMap[sectorName] = (sectorMap[sectorName] || 0) + Number(p.valor_total);

                const date = new Date(p.created_at);
                let timeKey = '';
                if (timeRange === '24h') {
                    timeKey = format(date, 'HH:00');
                } else {
                    timeKey = format(date, 'dd/MM');
                }
                timeMap[timeKey] = (timeMap[timeKey] || 0) + Number(p.valor_total);
            });

            const categoryData = Object.entries(catMap)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value);

            const sectorData = Object.entries(sectorMap)
                .map(([name, value]) => ({
                    name,
                    value,
                    percent: totalRevenue > 0 ? Math.round((value / totalRevenue) * 100) : 0,
                    trend: '-'
                }))
                .sort((a, b) => b.value - a.value);

            const chartData = Object.entries(timeMap).map(([time, sales]) => ({ time, sales }));

            return {
                totalRevenue,
                avgTicket,
                orderCount: pedidos.length,
                categoryData,
                sectorData,
                chartData
            };
        }
    });

    // Fetch Inventory Alerts
    const { data: inventoryAlerts } = useQuery({
        queryKey: ['pos-inventory-alerts', empresaId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('produtos_insumos')
                .select('*')
                .eq('empresa_id', empresaId);

            if (error) throw error;
            return data.filter(item => {
                const min = Number(item.estoque_minimo || 0);
                const current = Number(item.estoque_atual || 0);
                return current <= min;
            });
        },
        enabled: !!empresaId
    });

    return (
        <div className="space-y-12 animate-in fade-in duration-1000 pb-20">
            {/* Premium Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-10 border-b border-slate-100">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={() => navigate(-1)}
                        className="h-14 w-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center hover:bg-slate-50 transition-all group"
                    >
                        <ArrowLeft className="h-6 w-6 text-slate-400 group-hover:text-slate-900 transition-colors" />
                    </button>
                    <div>
                        <p className="luma-subtitle-premium">Advanced Business Intelligence</p>
                        <h1 className="luma-title-premium !text-4xl">Intelligence Hub</h1>
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-[24px] border border-slate-100 shadow-sm">
                    {['24h', '7d', '30d', 'All'].map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={cn(
                                "px-6 h-12 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all",
                                timeRange === range ? "bg-slate-900 text-white shadow-2xl shadow-slate-900/10" : "text-slate-400 hover:text-slate-900 hover:bg-white"
                            )}
                        >
                            {range}
                        </button>
                    ))}
                    <div className="w-[1px] h-8 bg-slate-200 mx-2" />
                    <button className="h-12 w-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 shadow-sm">
                        <Download className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Strategic Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <StatMetric
                    label="Receita Bruta"
                    value={formatCurrency(salesStats?.totalRevenue || 0)}
                    trend="+22.4%"
                    trendUp={true}
                    icon={<DollarSign className="h-6 w-6" />}
                    color="text-emerald-500"
                    bg="bg-emerald-50/20"
                />
                <StatMetric
                    label="Ticket Médio"
                    value={formatCurrency(salesStats?.avgTicket || 0)}
                    trend="+R$ 14,20"
                    trendUp={true}
                    icon={<TrendingUp className="h-6 w-6" />}
                    color="text-blue-500"
                    bg="bg-blue-50/20"
                />
                <StatMetric
                    label="Volume Pedidos"
                    value={salesStats?.orderCount || 0}
                    trend="-4.1%"
                    trendUp={false}
                    icon={<Users className="h-6 w-6" />}
                    color="text-amber-500"
                    bg="bg-amber-50/20"
                />
                <StatMetric
                    label="Ruptura Provável"
                    value={inventoryAlerts?.length || 0}
                    trend="Itens Críticos"
                    trendUp={false}
                    icon={<AlertTriangle className="h-6 w-6" />}
                    color="text-rose-500"
                    bg="bg-rose-50/20"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Main Visualizer */}
                <div className="lg:col-span-8">
                    <div className="luma-card p-10 bg-white border-slate-100 flex flex-col h-full">
                        <div className="flex items-center justify-between mb-12">
                            <div className="space-y-1">
                                <h3 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900">Dynamics Stream</h3>
                                <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest">Fluxo financeiro consolidado</p>
                            </div>
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest border border-emerald-100 animate-pulse">
                                Live Ledger
                            </div>
                        </div>
                        
                        <div className="flex-1 h-[450px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={salesStats?.chartData}>
                                    <defs>
                                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#0F172A" stopOpacity={0.08} />
                                            <stop offset="95%" stopColor="#0F172A" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#F1F5F9" />
                                    <XAxis
                                        dataKey="time"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94A3B8', fontSize: 9, fontWeight: 900 }}
                                        dy={15}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94A3B8', fontSize: 9, fontWeight: 900 }}
                                        tickFormatter={(v) => `R$${v}`}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 32px 64px -12px rgba(0,0,0,0.15)', padding: '24px', background: '#0F172A' }}
                                        itemStyle={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '10px', color: '#fff' }}
                                        labelStyle={{ color: 'rgba(255,255,255,0.4)', fontWeight: 900, textTransform: 'uppercase', fontSize: '9px', marginBottom: '8px' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="sales"
                                        stroke="#0F172A"
                                        strokeWidth={6}
                                        fillOpacity={1}
                                        fill="url(#colorSales)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Side Insights */}
                <div className="lg:col-span-4 space-y-10">
                    <div className="luma-card p-10 bg-slate-900 border-none text-white overflow-hidden relative">
                         <div className="absolute top-0 right-0 p-10 opacity-20 group-hover:scale-125 transition-transform duration-1000">
                             <PieChartIcon className="h-32 w-32" />
                         </div>
                         <div className="relative z-10 space-y-8">
                            <div className="space-y-1">
                                <h3 className="text-2xl font-black italic uppercase tracking-tighter">Inventory Mix</h3>
                                <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Distribuição por categoria</p>
                            </div>
                            
                            <div className="h-56 relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={salesStats?.categoryData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={65}
                                            outerRadius={90}
                                            paddingAngle={8}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {salesStats?.categoryData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="focus:outline-none" />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-[9px] font-black uppercase tracking-[0.5em] text-slate-500">Clusters</span>
                                    <span className="text-3xl font-black italic uppercase italic tracking-tighter leading-none mt-1">{salesStats?.categoryData.length || 0}</span>
                                </div>
                            </div>

                            <div className="space-y-3 pt-4">
                                {salesStats?.categoryData.slice(0, 4).map((cat, i) => (
                                    <div key={cat.name} className="flex items-center justify-between p-4 bg-white/5 rounded-[20px] transition-all hover:bg-white/10 group cursor-default">
                                        <div className="flex items-center gap-4">
                                            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white transition-colors">{cat.name}</span>
                                        </div>
                                        <span className="text-xs font-black italic uppercase italic tracking-tighter">{formatCurrency(cat.value)}</span>
                                    </div>
                                ))}
                            </div>
                         </div>
                    </div>

                    <div className="luma-card p-10 space-y-8 border-slate-100 bg-white">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <h3 className="text-xl font-black italic uppercase tracking-tighter text-slate-900">Alert Registry</h3>
                                <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest">Anomalias de estoque</p>
                            </div>
                            <div className="h-12 w-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500">
                                <AlertTriangle className="h-6 w-6" />
                            </div>
                        </div>

                        <div className="space-y-4">
                            {inventoryAlerts?.slice(0, 3).map((item) => (
                                <div key={item.id} className="p-5 rounded-[24px] bg-slate-50 border border-slate-100 flex items-center justify-between group hover:border-rose-200 transition-all">
                                    <div>
                                        <p className="font-black text-slate-900 text-sm uppercase italic tracking-tighter truncate">{item.nome}</p>
                                        <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-1">Crítico: {item.estoque_minimo} {item.unidade_medida}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="block text-xl font-black text-rose-600 italic tracking-tighter">{item.estoque_atual}</span>
                                        <span className="text-[8px] font-black uppercase tracking-widest text-rose-400">STOCK OUT</span>
                                    </div>
                                </div>
                            ))}
                            {(inventoryAlerts?.length || 0) === 0 && (
                                <div className="py-10 text-center space-y-4 grayscale opacity-30">
                                    <CheckCircle2 className="h-10 w-10 mx-auto text-emerald-500" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">No active alerts found</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Performance Ranking Table */}
            <div className="luma-card p-0 overflow-hidden bg-white border-slate-100">
                <div className="p-10 border-b border-slate-50 flex flex-col md:flex-row items-center justify-between gap-8 bg-slate-50/30">
                    <div>
                        <h3 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900">Sector Performance Breakdown</h3>
                        <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest mt-1">Ranking de unidades produtivas</p>
                    </div>
                </div>
                <div className="p-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {salesStats?.sectorData?.map((sector, idx) => (
                            <div key={sector.name} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: `${idx * 100}ms` }}>
                                <div className="flex justify-between items-end">
                                    <div className="space-y-1">
                                         <p className="text-[9px] font-black uppercase text-slate-300 tracking-[0.4em]">Node #{(idx + 1).toString().padStart(2, '0')}</p>
                                         <h4 className="text-xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">{sector.name}</h4>
                                    </div>
                                    <span className="text-2xl font-black italic uppercase italic tracking-tighter text-slate-900 leading-none">{formatCurrency(sector.value)}</span>
                                </div>
                                <div className="relative h-4 w-full bg-slate-50 rounded-xl overflow-hidden">
                                     <div className="absolute inset-0 bg-slate-100" />
                                     <div 
                                        className="absolute inset-y-0 left-0 bg-slate-950 rounded-xl transition-all duration-1000 ease-out" 
                                        style={{ width: `${sector.percent}%` }}
                                     />
                                </div>
                                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-[0.2em]">
                                    <span className="text-slate-400">Share of Total</span>
                                    <span className="text-slate-900">{sector.percent}%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatMetric({ label, value, trend, trendUp, icon, color, bg }: { 
    label: string, 
    value: string | number, 
    trend: string, 
    trendUp: boolean, 
    icon: React.ReactNode, 
    color: string, 
    bg: string 
}) {
    return (
        <div className={cn("luma-card p-10 flex flex-col justify-between group overflow-hidden relative border-slate-100 bg-white hover:bg-slate-50 transition-all duration-500", bg)}>
             <div className="flex items-start justify-between mb-10">
                <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center shadow-xl shadow-slate-900/5 transition-transform group-hover:scale-110 duration-500 bg-white", color)}>
                    {icon}
                </div>
                <div className={cn(
                    "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-white border border-slate-100",
                    trendUp ? "text-emerald-500 shadow-sm" : "text-rose-500 shadow-sm"
                )}>
                    {trend}
                </div>
            </div>
            <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-2">{label}</p>
                <h3 className="text-4xl font-black italic uppercase italic tracking-tighter text-slate-900 leading-none">{value}</h3>
            </div>
            <div className="mt-8 flex items-center gap-2">
                 <div className="h-1 flex-1 bg-slate-100 rounded-xl overflow-hidden">
                     <div className={cn("h-full rounded-xl transition-all duration-1000", trendUp ? "bg-emerald-500" : "bg-rose-500")} style={{ width: '70%' }} />
                 </div>
                 <ArrowUpRight className={cn("h-4 w-4", trendUp ? "text-emerald-500" : "text-rose-500")} />
            </div>
        </div>
    );
}


