
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
    Sparkles, 
    AlertTriangle, 
    Zap, 
    Truck, 
    Package, 
    TrendingDown,
    BrainCircuit,
    ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function OperationalInsights() {
    const navigate = useNavigate();

    // Mock AI Analysis (in a real scenario, this would call an Edge Function with OpenAI/Gemini)
    const { data: insights, isLoading } = useQuery({
        queryKey: ['ai-operational-insights'],
        queryFn: async () => {
            // Simulated AI processing delay
            await new Promise(resolve => setTimeout(resolve, 800));

            return [
                {
                    id: 1,
                    type: 'stock',
                    priority: 'high',
                    title: 'Crise de Insumos Iminente',
                    description: 'O estoque de "Malte Extra" atingirá o nível crítico em 3 dias baseado na média de consumo do GarçomApp e eventos agendados.',
                    action: 'Repor Agora',
                    icon: Package,
                    color: 'text-red-600',
                    bg: 'bg-red-50'
                },
                {
                    id: 2,
                    type: 'routing',
                    priority: 'medium',
                    title: 'Otimização de Rota Sugerida',
                    description: 'A rota de hoje para o Vendedor "João Silva" pode ser encurtada em 12km (18% economia) invertendo as paradas 3 e 5.',
                    action: 'Aplicar Rota',
                    icon: Truck,
                    color: 'text-blue-600',
                    bg: 'bg-blue-50'
                },
                {
                    id: 3,
                    type: 'sales',
                    priority: 'low',
                    title: 'Queda de Performance Local',
                    description: 'O PDV "Arena Sul" apresenta queda de 15% em vendas de bebidas. Sugerimos ativação de cupom relâmpago para reverter.',
                    action: 'Criar Campanha',
                    icon: TrendingDown,
                    color: 'text-orange-600',
                    bg: 'bg-orange-50'
                }
            ];
        }
    });

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-3">
                <div className="bg-purple-600 p-2 rounded-xl">
                    <BrainCircuit className="h-6 w-6 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">AI Operations Assistant</h1>
                    <p className="text-muted-foreground italic flex items-center gap-1">
                        <Sparkles className="h-3 w-3" /> Analisando dados em tempo real...
                    </p>
                </div>
            </div>

            <div className="grid gap-6">
                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-xl" />
                        ))}
                    </div>
                ) : (
                    insights?.map((insight) => (
                        <Card key={insight.id} className="border-none shadow-md overflow-hidden group hover:shadow-lg transition-all duration-300">
                            <CardContent className="p-0">
                                <div className="flex flex-col md:flex-row">
                                    <div className={`w-full md:w-2 p-1 ${insight.bg.replace('50', '500')}`} />
                                    <div className="p-6 flex-1 flex flex-col md:flex-row gap-6 items-start">
                                        <div className={`${insight.bg} p-4 rounded-2xl`}>
                                            <insight.icon className={`h-8 w-8 ${insight.color}`} />
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-xl font-bold text-gray-900">{insight.title}</h3>
                                                <Badge variant={insight.priority === 'high' ? 'destructive' : 'secondary'} className="rounded-xl px-3">
                                                    {insight.priority.toUpperCase()}
                                                </Badge>
                                            </div>
                                            <p className="text-gray-600 leading-relaxed text-lg">
                                                {insight.description}
                                            </p>
                                            <div className="pt-4 flex items-center gap-4">
                                                <Button className="rounded-xl px-6 font-bold shadow-sm">
                                                    {insight.action} <Zap className="h-4 w-4 ml-2 fill-current" />
                                                </Button>
                                                <Button variant="ghost" className="text-gray-500 hover:text-gray-900 gap-1 rounded-xl">
                                                    Ignorar <ArrowRight className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* AI Training / Confidence Card */}
            <Card className="rounded-2xl border-dashed border-2 bg-muted/20">
                <CardContent className="p-8 text-center space-y-4">
                    <div className="bg-white p-3 rounded-2xl w-fit mx-auto border border-slate-100">
                        <Zap className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="max-w-md mx-auto">
                        <h4 className="font-bold text-lg">Confiança do Assistente: 94%</h4>
                        <p className="text-sm text-muted-foreground">
                            As sugestões são geradas cruzando dados de todos os módulos verticais ativos na empresa. Quanto mais você usa, melhor ele fica.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
