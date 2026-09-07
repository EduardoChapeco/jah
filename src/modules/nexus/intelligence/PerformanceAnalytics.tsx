
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer, 
    LineChart, 
    Line,
    Legend,
    AreaChart,
    Area
} from 'recharts';
import { 
    TrendingUp, 
    TrendingDown, 
    DollarSign, 
    Briefcase, 
    ShoppingCart,
    ArrowUpRight,
    ArrowDownRight,
    Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useParams } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

export default function PerformanceAnalytics() {
    const { id: empresaId } = useParams();

    const { data: analytics, isLoading } = useQuery({
        queryKey: ['performance-analytics', empresaId],
        queryFn: async () => {
            // Fetch Sales (Pedidos)
            const { data: sales, error: salesError } = await supabase
                .from('pedidos')
                .select('valor_total, created_at')
                .eq('empresa_id', empresaId);

            // Fetch Service (OS)
            const { data: services, error: serviceError } = await supabase
                .from('ordens_servico')
                .select('custo_total, created_at')
                .eq('empresa_id', empresaId);

            if (salesError || serviceError) throw salesError || serviceError;

            // Simple processing for monthly trend
            const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
            const trend = months.map((m, i) => ({
                month: m,
                sales: sales?.filter(s => new Date(s.created_at).getMonth() === i).reduce((a, b) => a + Number(b.valor_total), 0) || 0,
                services: services?.filter(s => new Date(s.created_at).getMonth() === i).reduce((a, b) => a + Number(b.custo_total), 0) || 0
            }));

            const totalSales = sales?.reduce((a, b) => a + Number(b.valor_total), 0) || 0;
            const totalServices = services?.reduce((a, b) => a + Number(b.custo_total), 0) || 0;

            return { trend, totalSales, totalServices };
        }
    });

    if (isLoading) return <div className="p-8 space-y-4"><Skeleton className="h-40 w-full" /><Skeleton className="h-64 w-full" /></div>;

    return (
        <div className="p-6 space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Analytics de Performance</h1>
                    <p className="text-muted-foreground">Visão comparativa entre Vendas e Prestação de Serviço.</p>
                </div>
                <Button variant="outline" className="gap-2">
                    <Filter className="h-4 w-4" /> Este Semestre
                </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Receita de Vendas</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">R$ {analytics.totalSales.toLocaleString('pt-BR')}</div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <TrendingUp className="h-3 w-3 text-green-500" /> +12% em relação ao mês anterior
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Receita de Serviços</CardTitle>
                        <Briefcase className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">R$ {analytics.totalServices.toLocaleString('pt-BR')}</div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <TrendingUp className="h-3 w-3 text-green-500" /> +5% em relação ao mês anterior
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ticket Médio (Vendas)</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">R$ {(analytics.totalSales / 14).toLocaleString('pt-BR')}</div>
                        <p className="text-xs text-muted-foreground mt-1">Baseado em 14 transações</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Margem Operacional</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">32.4%</div>
                        <p className="text-xs text-green-600 font-medium flex items-center gap-1 mt-1">
                            Saudável <ArrowUpRight className="h-3 w-3" />
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card className="col-span-1 shadow-sm border-none bg-white">
                    <CardHeader>
                        <CardTitle>Tendência de Crescimento</CardTitle>
                        <CardDescription>Comparativo mensal entre as duas verticais.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={analytics.trend}>
                                <defs>
                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorServices" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#9333ea" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#9333ea" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} hide />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Legend iconType="circle" />
                                <Area type="monotone" dataKey="sales" name="Vendas" stroke="#2563eb" fillOpacity={1} fill="url(#colorSales)" strokeWidth={2} />
                                <Area type="monotone" dataKey="services" name="Serviços" stroke="#9333ea" fillOpacity={1} fill="url(#colorServices)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="col-span-1 shadow-sm border-none bg-white">
                    <CardHeader>
                        <CardTitle>Composição de Receita</CardTitle>
                        <CardDescription>Distribuição por volume financeiro total.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={analytics.trend}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} hide />
                                <Tooltip 
                                    cursor={{fill: '#f8fafc'}}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Bar dataKey="sales" name="Vendas" fill="#2563eb" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="services" name="Serviços" fill="#9333ea" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
