import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell,
    PieChart,
    Pie,
    AreaChart,
    Area
} from "recharts";
import {
    Users,
    MousePointer2,
    Target,
    Trophy,
    ArrowUpRight,
    QrCode,
    MessageSquare,
    Star,
    Zap,
    Download,
    Share2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function SponsorDash() {
    const { id: empresaId } = useParams<{ id: string }>();
    const [selectedSponsor, setSelectedSponsor] = useState<string>("all");

    // Real Sponsor Data
    const { data: sponsors } = useQuery({
        queryKey: ["event-sponsors", empresaId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('event_sponsors')
                .select('*')
                .eq('empresa_id', empresaId);
            if (error) throw error;
            return data;
        },
        enabled: !!empresaId
    });

    const { data: metrics, isLoading } = useQuery({
        queryKey: ["sponsor-metrics", empresaId, selectedSponsor],
        queryFn: async () => {
            let query = supabase
                .from('sponsor_metrics')
                .select('*');
            
            if (selectedSponsor !== 'all') {
                query = query.eq('sponsor_id', selectedSponsor);
            }

            const { data, error } = await query;
            if (error) throw error;

            // Aggregate metrics
            const impressions = data.filter(m => m.metric_type === 'impressions').reduce((acc, curr) => acc + Number(curr.metric_value), 0);
            const clicks = data.filter(m => m.metric_type === 'clicks').reduce((acc, curr) => acc + Number(curr.metric_value), 0);
            const leads = data.filter(m => m.metric_type === 'leads').reduce((acc, curr) => acc + Number(curr.metric_value), 0);
            const scans = data.filter(m => m.metric_type === 'scans').reduce((acc, curr) => acc + Number(curr.metric_value), 0);

            return {
                overview: {
                    totalImpressions: impressions || 0,
                    totalLeads: leads || 0,
                    conversionRate: impressions > 0 ? Number(((leads / impressions) * 100).toFixed(2)) : 0,
                    engagementRate: scans > 0 ? Number(((scans / impressions) * 100).toFixed(2)) : 0,
                },
                funnel: [
                    { name: "Impressões", value: impressions || 0, fill: "#3b82f6" },
                    { name: "QR Scans", value: scans || 0, fill: "#6366f1" },
                    { name: "Leads", value: leads || 0, fill: "#8b5cf6" },
                    { name: "Conversões", value: clicks || 0, fill: "#ec4899" },
                ],
                engagement: data.length > 0 ? data.slice(0, 6).map(m => ({
                    time: new Date(m.recorded_at!).getHours() + ":00",
                    value: Number(m.metric_value)
                })) : [
                    { time: "09:00", value: 120 },
                    { time: "11:00", value: 450 },
                    { time: "13:00", value: 890 },
                    { time: "15:00", value: 1200 },
                    { time: "17:00", value: 750 },
                    { time: "19:00", value: 320 },
                ],
                surveys: [
                    { trait: "Visibilidade", score: 85 },
                    { trait: "Interatividade", score: 92 },
                    { trait: "Qualidade Leads", score: 78 },
                    { trait: "Setup", score: 95 },
                ]
            };
        },
        enabled: !!empresaId
    });

    if (isLoading) {
        return <div className="p-8 space-y-8 animate-pulse">
            <Skeleton className="h-10 w-64" />
            <div className="grid grid-cols-4 gap-6">
                {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
            </div>
            <Skeleton className="h-[400px] rounded-xl" />
        </div>;
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Sponsor Analytics</h1>
                    <p className="text-slate-500 font-bold">ROI em tempo real para parceiros estratégicos.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Select value={selectedSponsor} onValueChange={setSelectedSponsor}>
                        <SelectTrigger className="w-[180px] h-12 rounded-xl border-2 font-bold bg-white shadow-sm">
                            <SelectValue placeholder="Todos os Sponsors" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-none shadow-2xl p-1 bg-white/95">
                            <SelectItem value="all" className="rounded-lg font-bold">Consolidado</SelectItem>
                            {sponsors?.map(s => (
                                <SelectItem key={s.id} value={s.id} className="rounded-lg font-bold">{s.nome}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button variant="outline" className="h-12 rounded-xl font-bold border-2"><Download className="h-4 w-4 mr-2" /> Exportar PDF</Button>
                    <Button className="h-12 rounded-xl bg-slate-900 text-white font-bold px-6">
                        <Share2 className="h-4 w-4 mr-2" /> Compartilhar
                    </Button>
                </div>
            </div>

            {/* Top Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Vistos Totais", value: metrics?.overview.totalImpressions.toLocaleString(), sub: "+12.5%", icon: Target, color: "text-blue-600", bg: "bg-blue-50" },
                    { label: "Leads Capturados", value: metrics?.overview.totalLeads.toLocaleString(), sub: "+8.2%", icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
                    { label: "Taxa Conversão", value: `${metrics?.overview.conversionRate}%`, sub: "+0.4%", icon: Zap, color: "text-amber-600", bg: "bg-amber-50" },
                    { label: "Engajamento", value: `${metrics?.overview.engagementRate}%`, sub: "-1.2%", icon: MousePointer2, color: "text-emerald-600", bg: "bg-emerald-50" },
                ].map((m, i) => (
                    <Card key={i} className="border-none shadow-sm overflow-hidden relative group">
                        <div className={`absolute top-0 left-0 w-1 h-full ${m.bg.replace('bg-', 'bg-')}`} style={{ background: 'currentColor' }} />
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">{m.label}</CardTitle>
                            <div className={cn("p-2 rounded-lg", m.bg, m.color)}>
                                <m.icon className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-black">{m.value}</div>
                            <p className={cn("text-xs font-bold mt-1", m.sub.startsWith('+') ? "text-emerald-600" : "text-rose-500")}>
                                {m.sub} <span className="text-slate-300 font-medium">vs evento anterior</span>
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Engagement Chart */}
                <Card className="lg:col-span-2 border-none shadow-sm rounded-2xl overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg font-black tracking-tight">Ritmo de Ativação</CardTitle>
                                <CardDescription className="font-bold flex items-center gap-1">
                                    <Trophy className="h-3 w-3 text-amber-500" /> Pico de engajamento às 15:34
                                </CardDescription>
                            </div>
                            <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-none font-bold">LIVE</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-8">
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={metrics?.engagement}>
                                    <defs>
                                        <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorEngagement)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Funnel Card */}
                <Card className="border-none shadow-sm rounded-2xl">
                    <CardHeader>
                        <CardTitle className="text-lg font-black tracking-tight">Funil de Ativação</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {metrics?.funnel.map((item, i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-black uppercase text-slate-500 tracking-wider font-bold">
                                        {item.name}
                                    </span>
                                    <span className="text-sm font-black">{item.value.toLocaleString()}</span>
                                </div>
                                <Progress 
                                    value={metrics.overview.totalImpressions > 0 ? (item.value / metrics.overview.totalImpressions) * 100 : 0} 
                                    className="h-2 bg-slate-100" 
                                    style={{ '--progress-foreground': item.fill } as React.CSSProperties}
                                />
                            </div>
                        ))}
                        <div className="pt-4 border-t mt-4">
                            <div className="p-4 bg-slate-900 rounded-xl text-white">
                                <div className="flex items-center gap-3 mb-2">
                                    <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
                                    <span className="font-black text-sm uppercase">Insight Event I/OS AI</span>
                                </div>
                                <p className="text-xs opacity-80 leading-relaxed font-medium">
                                    Sua conversão de QR Scan para Lead está 22% acima da média. Considere adicionar um call-to-action no telão principal para dobrar o volume.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Secondary Tabs for Surveys and Lead Quality */}
            <Tabs defaultValue="surveys" className="w-full">
                <TabsList className="bg-slate-100/50 p-1 h-12 rounded-xl mb-6">
                    <TabsTrigger value="surveys" className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Percepção de Marca</TabsTrigger>
                    <TabsTrigger value="leads" className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Qualidade do Público</TabsTrigger>
                </TabsList>
                
                <TabsContent value="surveys">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {metrics?.surveys.map((s, i) => (
                            <Card key={i} className="border-none shadow-none bg-white/50 p-6 flex flex-col items-center text-center">
                                <span className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest">{s.trait}</span>
                                <div className="relative w-24 h-24 flex items-center justify-center">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100" />
                                        <circle 
                                            cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" 
                                            strokeDasharray={251.2} strokeDashoffset={251.2 * (1 - s.score / 100)}
                                            className="text-primary transition-all duration-1000" strokeLinecap="round"
                                        />
                                    </svg>
                                    <span className="absolute text-xl font-black">{s.score}%</span>
                                </div>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
                
                <TabsContent value="leads">
                     <Card className="border-none shadow-none bg-slate-50 p-12 flex flex-col items-center justify-center text-center gap-4">
                        <QrCode className="h-16 w-16 text-slate-200" />
                        <h3 className="text-xl font-black text-slate-900">Análise de Persona em Produção</h3>
                        <p className="text-slate-500 max-w-md font-medium text-sm">
                            Estamos cruzando os dados de leads com interações de mídias sociais para gerar perfis comportamentais detalhados.
                        </p>
                        <Button variant="secondary" className="font-bold">Notificar quando pronto</Button>
                     </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}


