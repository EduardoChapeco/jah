import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    Zap,
    Target,
    BarChart3,
    ArrowUpRight,
    PieChart,
    Wallet,
    Calendar,
    ChevronRight,
    Sparkles
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    Pie,
    PieChart as RechartsPieChart
} from "recharts";

const MOCK_MONTHLY_DATA = [
    { name: "Jan", revenue: 45000, expenses: 32000 },
    { name: "Fev", revenue: 52000, expenses: 38000 },
    { name: "Mar", revenue: 48000, expenses: 35000 },
    { name: "Abr", revenue: 61000, expenses: 42000 },
    { name: "Mai", revenue: 55000, expenses: 39000 },
    { name: "Jun", revenue: 67000, expenses: 45000 },
];

const MOCK_REVENUE_CHANNELS = [
    { name: "Ingressos", value: 65, color: "#0F172A" },
    { name: "Bar & Food", value: 20, color: "#3B82F6" },
    { name: "Cotas Patrocínio", value: 10, color: "#8B5CF6" },
    { name: "Brand Store", value: 5, color: "#EC4899" },
];

export default function MonetizationHub() {
    const { id: empresaId } = useParams<{ id: string }>();

    // Simulated Fetch Monetization Stats
    const { data: stats, isLoading } = useQuery({
        queryKey: ["monetization-stats", empresaId],
        queryFn: async () => {
            // Real count from tickets
            const { data: ticketTypes } = await supabase
                .from("ingressos_tipos")
                .select("preco, quantidade_vendida")
                .not("evento_id", "is", null);

            const ticketRevenue = ticketTypes?.reduce((acc, t) => acc + (t.preco * (t.quantidade_vendida || 0)), 0) || 0;

            // Income from transactions
            const { data: lancamentos } = await supabase
                .from("financeiro_lancamentos")
                .select("valor, tipo")
                .eq("empresa_id", empresaId);

            const totalRevenue = lancamentos?.filter(l => l.tipo === 'receita').reduce((acc, l) => acc + l.valor, 0) || 0;
            const totalExpenses = lancamentos?.filter(l => l.tipo === 'despesa').reduce((acc, l) => acc + l.valor, 0) || 0;

            return {
                ticketRevenue,
                totalRevenue,
                totalExpenses,
                netProfit: totalRevenue - totalExpenses,
                opportunities: [
                    { title: "Ticket Médio Baixo", description: "O ticket médio no Bar Sul está 15% abaixo da média do evento.", icon: TrendingDown, color: "text-amber-500" },
                    { title: "Combo de Merch", description: "Produtos individuais vendem bem, mas combos podem aumentar ROI em 22%.", icon: Zap, color: "text-purple-500" },
                    { title: "Early Bird Gap", description: "Lote 1 esgotado rápido. Considere aumentar preço do Lote 2 em +8%.", icon: Target, color: "text-blue-500" }
                ]
            };
        }
    });

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            {/* Premium Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-black text-[10px] uppercase tracking-wider">
                            Real-time Intelligence
                        </Badge>
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-2">Hub de Monetização</h1>
                    <p className="text-slate-500 font-medium max-w-xl">
                        Visão estratégica de receita multi-canal, otimização de preços e análise de performance financeira.
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="rounded-lg h-12 px-6 border-slate-200 font-bold text-slate-600 hover:bg-slate-50">
                        <Calendar className="mr-2 h-4 w-4" /> Últimos 30 dias
                    </Button>
                    <Button className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg h-12 px-6 font-bold shadow-xl shadow-slate-200">
                        Gerar Relatório Executivo
                    </Button>
                </div>
            </div>

            {/* Top Cards: Financial Health */}
            <div className="grid gap-6 md:grid-cols-4">
                {[
                    { label: 'Receita Total', value: `R$ ${stats?.totalRevenue.toLocaleString('pt-BR') || '0'}`, trend: '+12.5%', icon: DollarSign, color: 'text-slate-900', bg: 'bg-slate-100' },
                    { label: 'Lucro Líquido', value: `R$ ${stats?.netProfit.toLocaleString('pt-BR') || '0'}`, trend: '+8.2%', icon: Wallet, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Receita de Ingressos', value: `R$ ${stats?.ticketRevenue.toLocaleString('pt-BR') || '0'}`, trend: '+24%', icon: BarChart3, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Custos Operacionais', value: `R$ ${stats?.totalExpenses.toLocaleString('pt-BR') || '0'}`, trend: '-4.1%', icon: TrendingDown, color: 'text-rose-600', bg: 'bg-rose-50' },
                ].map((stat, i) => (
                    <Card key={i} className="border-none shadow-sm bg-white rounded-lg overflow-hidden group hover:shadow-xl transition-all duration-500">
                        <CardContent className="p-8">
                            <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center mb-6", stat.bg)}>
                                <stat.icon className={cn("h-6 w-6", stat.color)} />
                            </div>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-2xl font-black text-slate-900">{stat.value}</h3>
                                <span className={cn("text-xs font-black", stat.color)}>{stat.trend}</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                {/* Revenue Trend Chart */}
                <Card className="lg:col-span-2 border-none shadow-sm bg-white rounded-lg overflow-hidden p-8">
                    <CardHeader className="p-0 mb-8 flex flex-row items-center justify-between space-y-0">
                        <div>
                            <CardTitle className="text-xl font-black text-slate-900">Fluxo de Receita vs Despesa</CardTitle>
                            <CardDescription className="font-medium text-slate-500">Acompanhamento mensal do desempenho financeiro.</CardDescription>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-sm bg-slate-900" />
                                <span className="text-xs font-bold text-slate-600 uppercase">Receita</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-sm bg-blue-400" />
                                <span className="text-xs font-bold text-slate-600 uppercase">Despesa</span>
                            </div>
                        </div>
                    </CardHeader>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={MOCK_MONTHLY_DATA}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0F172A" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#0F172A" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 700 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 700 }}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px' }}
                                    itemStyle={{ fontWeight: 800 }}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#0F172A" strokeWidth={4} fillOpacity={1} fill="url(#colorRevenue)" />
                                <Area type="monotone" dataKey="expenses" stroke="#3B82F6" strokeWidth={4} fillOpacity={1} fill="url(#colorExpenses)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Revenue Channels (Pie) */}
                <Card className="border-none shadow-sm bg-white rounded-lg overflow-hidden p-8 flex flex-col">
                    <CardTitle className="text-xl font-black text-slate-900 mb-2">Mix de Receita</CardTitle>
                    <CardDescription className="font-medium text-slate-500 mb-8">Composição por canal de venda.</CardDescription>

                    <div className="flex-1 flex flex-col items-center justify-center">
                        <div className="h-[200px] w-[200px] mb-8">
                            <ResponsiveContainer width="100%" height="100%">
                                <RechartsPieChart>
                                    <Pie
                                        data={MOCK_REVENUE_CHANNELS}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {MOCK_REVENUE_CHANNELS.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                </RechartsPieChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="w-full space-y-4">
                            {MOCK_REVENUE_CHANNELS.map((channel, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: channel.color }} />
                                        <span className="text-sm font-bold text-slate-600">{channel.name}</span>
                                    </div>
                                    <span className="text-sm font-black text-slate-900">{channel.value}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
                {/* Insights and Opportunities */}
                <Card className="border-none shadow-sm bg-slate-900 rounded-lg overflow-hidden p-8 text-white">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2 bg-white/10 rounded-lg">
                            <Sparkles className="h-6 w-6 text-blue-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black">Monetization AI Insights</h3>
                            <p className="text-slate-400 text-sm font-medium">Recomendações automáticas baseadas no comportamento de venda.</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {stats?.opportunities.map((opt, i) => (
                            <div key={i} className="group p-6 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-3">
                                        <opt.icon className={cn("h-5 w-5", opt.color)} />
                                        <h4 className="font-black text-slate-100">{opt.title}</h4>
                                    </div>
                                    <ArrowUpRight className="h-4 w-4 text-slate-500 group-hover:text-white transition-colors" />
                                </div>
                                <p className="text-sm text-slate-400 font-medium ml-8 leading-relaxed">
                                    {opt.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Quick Actions and Links */}
                <div className="grid gap-6 sm:grid-cols-2">
                    {[
                        { title: 'Fluxo de Caixa', desc: 'Lançamentos e extratos.', icon: DollarSign, color: 'bg-emerald-500', path: '../financeiro' },
                        { title: 'Orçamentos', desc: 'Propostas enviadas.', icon: BarChart3, color: 'bg-blue-500', path: '../orcamentos' },
                        { title: 'Contratos', desc: 'Gestão de assinaturas.', icon: PieChart, color: 'bg-indigo-500', path: '../contratos' },
                        { title: 'Brand Store', desc: 'Loja de produtos.', icon: Wallet, color: 'bg-rose-500', path: '../itens' },
                    ].map((action, i) => (
                        <Card key={i} className="group border-none shadow-sm bg-white rounded-lg overflow-hidden hover:shadow-xl transition-all cursor-pointer">
                            <CardContent className="p-8 h-full flex flex-col">
                                <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center mb-6", action.color)}>
                                    <action.icon className="h-6 w-6 text-white" />
                                </div>
                                <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors mb-1">{action.title}</h3>
                                <p className="text-sm font-medium text-slate-500 mb-6 flex-1">{action.desc}</p>
                                <div className="flex items-center text-xs font-black text-slate-400 group-hover:text-slate-900 transition-all gap-1">
                                    VER DETALHES <ChevronRight className="h-3 w-3" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
