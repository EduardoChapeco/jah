import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Loader2 } from "lucide-react";

interface MarketingAnalyticsProps {
    empresaId: string;
}

const COLORS = ['#f97316', '#3b82f6', '#22c55e', '#a855f7', '#ef4444', '#eab308'];

export function MarketingAnalytics({ empresaId }: MarketingAnalyticsProps) {
    const { data: leads, isLoading } = useQuery({
        queryKey: ["leads", "analytics", empresaId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("clientes_leads")
                .select("status, origem, valor_estimado, probabilidade")
                .eq("empresa_id", empresaId);

            if (error) throw error;
            return data;
        }
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // Revenue Metrics
    const totalPotential = leads?.reduce((sum, l) => sum + (Number(l.valor_estimado) || 0), 0) || 0;
    const weightedPotential = leads?.reduce((sum, l) => {
        const value = Number(l.valor_estimado) || 0;
        const prob = (Number(l.probabilidade) || 0) / 100;
        return sum + (value * prob);
    }, 0) || 0;

    const activeLeadsCount = leads?.filter(l => l.status !== 'perdido' && l.status !== 'convertido')?.length || 0;

    // Process data for Funnel
    const statusCounts = leads?.reduce((acc, lead) => {
        const status = lead.status || 'novo';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    // Order for rendering: Bottom to Top in Recharts Vertical BarChart default
    // We want Novo at Top. So Novo should be last? 
    // Actually simpler to just rely on user adjusting or standard list.
    // Let's assume standard intuitive order: Novo -> Contatado -> ...
    // If Recharts renders bottom-up, then [Perdido, Convertido, Qualificado, Contatado, Novo] will put Novo at top.

    const funnelData = [
        { name: 'Perdido', value: statusCounts?.['perdido'] || 0, fill: '#ef4444' },
        { name: 'Convertido', value: statusCounts?.['convertido'] || 0, fill: '#22c55e' },
        { name: 'Qualificado', value: statusCounts?.['qualificado'] || 0, fill: '#a855f7' },
        { name: 'Em Contato', value: statusCounts?.['contatado'] || 0, fill: '#eab308' },
        { name: 'Novo', value: statusCounts?.['novo'] || 0, fill: '#f97316' },
    ];

    // Process data for Sources
    const sourceCounts = leads?.reduce((acc, lead) => {
        const source = lead.origem || 'Direto';
        acc[source] = (acc[source] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const sourceData = Object.entries(sourceCounts || {})
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value); // Sort by value desc

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Revenue Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="p-6 border-none shadow-sm bg-slate-900 text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <Loader2 className="h-20 w-20" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">Potencial Total</p>
                    <h3 className="text-3xl font-black mb-1">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPotential)}
                    </h3>
                    <p className="text-[10px] font-bold text-emerald-400">Total em Negociações Alternativas</p>
                </Card>

                <Card className="p-6 border-none shadow-sm bg-orange-500 text-white relative overflow-hidden group">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-2">Forecast Ponderado</p>
                    <h3 className="text-3xl font-black mb-1">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(weightedPotential)}
                    </h3>
                    <p className="text-[10px] font-bold opacity-80">Ajustado pela Probabilidade</p>
                </Card>

                <Card className="p-6 border-none shadow-sm bg-white relative overflow-hidden border border-slate-100">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Leads em Aberto</p>
                    <h3 className="text-3xl font-black text-slate-900 mb-1">{activeLeadsCount}</h3>
                    <p className="text-[10px] font-bold text-slate-400">Pipe Ativo no Momento</p>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 rounded-lg border-none shadow-sm bg-white">
                <h3 className="text-lg font-bold mb-6 text-slate-900 uppercase tracking-tight">Funil de Conversão</h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={funnelData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                            <XAxis type="number" hide />
                            <YAxis
                                dataKey="name"
                                type="category"
                                width={80}
                                tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip
                                cursor={{ fill: '#f8fafc' }}
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                            />
                            <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={24}>
                                {
                                    funnelData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))
                                }
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            <Card className="p-6 rounded-lg border-none shadow-sm bg-white">
                <h3 className="text-lg font-bold mb-6 text-slate-900 uppercase tracking-tight">Origem dos Leads</h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={sourceData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={90}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {sourceData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                            />
                            <Legend
                                verticalAlign="bottom"
                                height={36}
                                iconType="circle"
                                formatter={(value) => <span className="text-xs font-bold text-slate-500 ml-1">{value}</span>}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </Card>
            </div>
        </div>
    );
}
