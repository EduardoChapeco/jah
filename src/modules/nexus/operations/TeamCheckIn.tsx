
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Clock, Play, Pause, StopCircle, List, LayoutList, History, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LumaCard, LumaCardContent, LumaCardHeader, LumaCardTitle } from '@/components/ui/luma-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';

// --- Interfaces ---

interface PontoLog {
    id: string;
    tipo: 'entrada' | 'saida' | 'pausa' | 'retorno';
    registrado_em: string;
    localizacao: { lat: number; lng: number; accuracy: number } | null;
    turno?: {
        evento?: {
            titulo: string;
        };
        colaborador?: {
            nome_completo: string;
        };
    };
}

// --- Componente: Meu Ponto (Lógica Original) ---

function MyPointTab() {
    const queryClient = useQueryClient();
    const [location, setLocation] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
    const [loadingLocation, setLoadingLocation] = useState(false);
    const [locationError, setLocationError] = useState<string | null>(null);

    // Fetch active shift
    const { data: myShift, isLoading: shiftLoading } = useQuery({
        queryKey: ['my-shift'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not logged in');

            const { data: person } = await supabase.from('pessoas').select('id').eq('user_id', user.id).single();
            if (!person) return null;

            const { data: shift } = await supabase
                .from('eventos_equipe')
                .select(`
                    *,
                    evento:eventos(titulo, local_evento)
                `)
                .eq('colaborador_id', person.id)
                .eq('confirmado', true)
                .order('data_inicio', { ascending: false })
                .limit(1)
                .maybeSingle();

            return shift;
        }
    });

    // Fetch personal logs
    const { data: logs, isLoading: logsLoading } = useQuery({
        queryKey: ['ponto-logs', myShift?.id],
        enabled: !!myShift?.id,
        queryFn: async () => {
            const { data } = await supabase
                .from('equipe_ponto_logs')
                .select('*')
                .eq('evento_equipe_id', myShift.id)
                .order('registrado_em', { ascending: false });
            return data as unknown as PontoLog[];
        }
    });

    const getCurrentPosition = () => {
        setLoadingLocation(true);
        setLocationError(null);

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setLocation({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                    accuracy: pos.coords.accuracy
                });
                setLoadingLocation(false);
            },
            (err) => {
                console.error(err);
                setLocationError("Permissão de GPS negada ou indisponível.");
                setLoadingLocation(false);
                toast.error("Erro ao obter localização.");
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    useEffect(() => {
        getCurrentPosition();
    }, []);

    const punchMutation = useMutation({
        mutationFn: async (tipo: 'entrada' | 'saida' | 'pausa' | 'retorno') => {
            if (!myShift) return;
            if (!location) throw new Error("Localização obrigatória.");

            const { error } = await supabase.from('equipe_ponto_logs').insert({
                evento_equipe_id: myShift.id,
                tipo,
                localizacao: location
            });

            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Ponto registrado com sucesso!");
            queryClient.invalidateQueries({ queryKey: ['ponto-logs'] });
        },
        onError: (err) => {
            toast.error("Erro ao registrar ponto: " + err.message);
        }
    });

    if (shiftLoading) return <div className="p-8 text-center text-slate-500">Carregando escala...</div>;

    if (!myShift) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
                <div className="h-16 w-16 bg-yellow-50 rounded-2xl flex items-center justify-center">
                    <AlertTriangle className="h-8 w-8 text-yellow-500" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Nenhuma escala ativa</h2>
                    <p className="text-slate-500 max-w-xs mx-auto mt-2">
                        Você não tem turnos agendados para hoje ou seu usuário não está vinculado a uma equipe.
                    </p>
                </div>
                <Button variant="outline" onClick={() => window.location.reload()}>
                    Atualizar Página
                </Button>
            </div>
        );
    }

    const lastLog = logs?.[0];
    const isWorking = lastLog?.tipo === 'entrada' || lastLog?.tipo === 'retorno';
    const isOnBreak = lastLog?.tipo === 'pausa';

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <LumaCard>
                <LumaCardHeader>
                    <LumaCardTitle className="text-center text-lg">
                        {/* @ts-ignore */}
                        {myShift.evento?.titulo}
                    </LumaCardTitle>
                    <div className="text-center text-sm text-gray-500 flex items-center justify-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {/* @ts-ignore */}
                        {myShift.evento?.local_evento || 'Local não definido'}
                    </div>
                </LumaCardHeader>
                <LumaCardContent className="space-y-8 pb-8">
                    {/* Location Status */}
                    <div className="bg-slate-50 p-4 rounded-xl flex items-center justify-between text-sm border border-slate-100">
                        <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-sm ${location ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                            <span className="font-medium text-slate-600">
                                {loadingLocation ? 'Buscando satélites...' : location ? 'GPS Calibrado' : 'Sem sinal GPS'}
                            </span>
                        </div>
                        {!location && !loadingLocation && (
                            <Button variant="link" size="sm" onClick={getCurrentPosition}>Tentar Novamente</Button>
                        )}
                    </div>
                    {locationError && <p className="text-xs text-rose-500 text-center font-medium bg-rose-50 p-2 rounded-lg">{locationError}</p>}

                    {/* Big Action Button */}
                    <div className="flex justify-center py-2 h-40 items-center">
                        {!isWorking && !isOnBreak && (
                            <Button
                                className="h-36 w-36 rounded-3xl flex flex-col items-center justify-center gap-3 bg-emerald-500 hover:bg-emerald-600 hover:scale-105 transition-all duration-300 border-[6px] border-emerald-100"
                                onClick={() => punchMutation.mutate('entrada')}
                                disabled={!location || punchMutation.isPending}
                            >
                                <Play className="h-10 w-10 fill-current" />
                                <span className="font-black tracking-widest text-sm">INICIAR</span>
                            </Button>
                        )}

                        {isWorking && (
                            <div className="flex gap-6">
                                <Button
                                    className="h-28 w-28 rounded-3xl flex flex-col items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 hover:scale-105 border-[5px] border-amber-100 transition-all duration-300"
                                    onClick={() => punchMutation.mutate('pausa')}
                                    disabled={!location || punchMutation.isPending}
                                >
                                    <Pause className="h-8 w-8 fill-current" />
                                    <span className="text-[10px] font-black tracking-wider">PAUSA</span>
                                </Button>
                                <Button
                                    className="h-28 w-28 rounded-3xl flex flex-col items-center justify-center gap-2 bg-rose-500 hover:bg-rose-600 hover:scale-105 border-[5px] border-rose-100 transition-all duration-300"
                                    onClick={() => punchMutation.mutate('saida')}
                                    disabled={!location || punchMutation.isPending}
                                >
                                    <StopCircle className="h-8 w-8 fill-current" />
                                    <span className="text-[10px] font-black tracking-wider">FINALIZAR</span>
                                </Button>
                            </div>
                        )}

                        {isOnBreak && (
                            <Button
                                className="h-36 w-36 rounded-3xl flex flex-col items-center justify-center gap-3 bg-blue-500 hover:bg-blue-600 hover:scale-105 border-[6px] border-blue-100 transition-all duration-300"
                                onClick={() => punchMutation.mutate('retorno')}
                                disabled={!location || punchMutation.isPending}
                            >
                                <Play className="h-10 w-10 fill-current" />
                                <span className="font-black tracking-widest text-sm">RETORNAR</span>
                            </Button>
                        )}
                    </div>

                    <div className="text-center text-xs text-slate-400 font-medium">
                        Registro auditável via Geolocalização
                    </div>
                </LumaCardContent>
            </LumaCard>

            {/* Historico */}
            <div className="space-y-3 pt-4">
                <h3 className="font-bold text-slate-800 px-1 flex items-center gap-2 text-sm uppercase tracking-wider">
                    <Clock className="h-4 w-4" />
                    Registros do Dia
                </h3>
                {logs?.length === 0 && (
                    <div className="text-center p-8 border-2 border-dashed border-slate-200 rounded-xl">
                        <p className="text-sm text-slate-400">Nenhum registro hoje.</p>
                    </div>
                )}
                <div className="grid gap-3">
                    {logs?.map((log) => (
                        <div key={log.id} className="bg-white p-4 rounded-xl border border-slate-100 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-4">
                                <div className={`h-10 w-10 rounded-xl flex items-center justify-center
                                ${log.tipo === 'entrada' ? 'bg-emerald-100 text-emerald-600' :
                                        log.tipo === 'saida' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}
                                >
                                    <Clock className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-700 capitalize text-sm">{log.tipo}</p>
                                    <p className="text-xs text-slate-500 font-medium">
                                        {new Date(log.registrado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                            {log.localizacao && (
                                <div className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100 flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    GPS VALIDADO
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// --- Componente: Gestão (Visão do Admin) ---

function ManagementTab() {
    const { id: empresaId } = useParams<{ id: string }>();

    const { data: teamLogs, isLoading } = useQuery({
        queryKey: ['team-ponto-logs', empresaId],
        queryFn: async () => {
            // Fetch logs linked to events of this company
            // This assumes RLS allows reading these logs if the user is an admin of the company
            const { data, error } = await supabase
                .from('equipe_ponto_logs')
                .select(`
                    *,
                    turno:eventos_equipe!inner(
                        colaborador:pessoas!inner(nome_completo),
                        evento:eventos!inner(titulo, empresa_id)
                    )
                `)
                .eq('turno.evento.empresa_id', empresaId)
                .order('registrado_em', { ascending: false })
                .limit(50); // Limit for performance

            if (error) {
                console.error("Erro ao buscar logs de equipe:", error);
                return [];
            }
            return data as unknown as PontoLog[];
        },
        enabled: !!empresaId
    });

    if (isLoading) return <div className="p-8 text-center text-slate-500">Carregando histórico da equipe...</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-800">Últimos Registros da Equipe</h2>
                <Button variant="outline" size="sm" onClick={() => window.location.reload()}>Atualizar</Button>
            </div>

            {teamLogs?.length === 0 ? (
                <div className="text-center p-12 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                    <History className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">Nenhum registro encontrado nesta empresa.</p>
                </div>
            ) : (
                <div className="grid gap-3">
                    {teamLogs?.map((log) => (
                        <div key={log.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                                        <User className="h-5 w-5 text-slate-500" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900 text-sm">
                                            {log.turno?.colaborador?.nome_completo || 'Colaborador Desconhecido'}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {log.turno?.evento?.titulo || 'Evento'}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-bold capitalize mb-1
                                         ${log.tipo === 'entrada' ? 'bg-emerald-100 text-emerald-700' :
                                            log.tipo === 'saida' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {log.tipo}
                                    </div>
                                    <p className="text-xs text-slate-500 font-medium">
                                        {new Date(log.registrado_em).toLocaleString('pt-BR')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// --- Componente Principal com Tabs ---

export default function TeamCheckIn() {
    return (
        <div className="max-w-xl mx-auto p-4 md:p-6 w-full">
            <Tabs defaultValue="meu-ponto" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8 h-12 bg-slate-100/50 p-1 rounded-xl">
                    <TabsTrigger
                        value="meu-ponto"
                        className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all h-full"
                    >
                        Meu Ponto
                    </TabsTrigger>
                    <TabsTrigger
                        value="gestao"
                        className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all h-full"
                    >
                        Gestão & Equipe
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="meu-ponto" className="focus-visible:outline-none">
                    <MyPointTab />
                </TabsContent>

                <TabsContent value="gestao" className="focus-visible:outline-none">
                    <ManagementTab />
                </TabsContent>
            </Tabs>
        </div>
    );
}
