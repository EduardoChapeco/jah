import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Plus,
    Search,
    Filter,
    Scan,
    List,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    UserCheck,
    RefreshCw,
    Camera,
    ChevronRight,
    SearchX,
    Wifi,
    WifiOff,
    Users,
    Activity,
    CreditCard
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
// Tabs removed - using iOS-style buttons instead
import { useEmpresa } from "@/hooks/useEmpresa";
import { toast } from "sonner";
import { format } from "date-fns";
import { Html5QrcodeScanner } from "html5-qrcode";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { getCheckinErrorMessage } from "@/modules/operations/checkin";
import { parseProcessCheckinResponse } from "@/lib/rpc/contracts";

export default function UnifiedCheckIn() {
    const { empresa } = useEmpresa();
    const queryClient = useQueryClient();
    const [selectedEventId, setSelectedEventId] = useState<string>("");
    const [activeTab, setActiveTab] = useState("list");
    const [searchTerm, setSearchTerm] = useState("");
    const [isManualDialogOpen, setIsManualDialogOpen] = useState(false);
    const [manualCode, setManualCode] = useState("");
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Fetch Events
    const { data: events, isLoading: isLoadingEvents } = useQuery({
        queryKey: ["events-checkin", empresa?.id],
        queryFn: async () => {
            if (!empresa?.id) return [];
            const { data, error } = await supabase
                .from("eventos")
                .select("id, titulo, data_inicio")
                .eq("empresa_id", empresa?.id)
                .order("data_inicio", { ascending: false });

            if (error) throw error;
            return data;
        },
        enabled: !!empresa?.id,
    });

    useEffect(() => {
        if (events && events.length > 0 && !selectedEventId) {
            setSelectedEventId(events[0].id);
        }
    }, [events]);

    // Fetch Check-ins
    const { data: checkins, isLoading: isLoadingCheckins } = useQuery({
        queryKey: ["checkins", selectedEventId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("event_checkins")
                .select("*")
                .eq("event_id", selectedEventId)
                .order("checkin_time", { ascending: false });

            if (error) throw error;
            return data;
        },
        enabled: !!selectedEventId,
    });

    // Fetch Capacity Info (Mocked/Aggregated)
    const { data: capacity } = useQuery({
        queryKey: ["event-capacity", selectedEventId],
        queryFn: async () => {
            // Get total tickets sold for this event
            const { count: total, error } = await supabase
                .from("ingressos")
                .select('id', { count: 'exact', head: true })
                .eq("status", "ativo"); // Assume active tickets

            // Get total badges
            const { count: badgesCount } = await supabase
                .from("badges")
                .select('id', { count: 'exact', head: true })
                .eq("event_id", selectedEventId);

            return { total: (total || 0) + (badgesCount || 0), present: checkins?.filter(c => c.status === 'success').length || 0 };
        },
        enabled: !!selectedEventId && !!checkins,
    });

    // Perform Check-in Mutation
    const checkInMutation = useMutation({
        mutationFn: async ({ code, eventId }: { code: string; eventId: string }) => {
            const codeUpper = code.trim().toUpperCase();
            const { data, error } = await (supabase.rpc as any)('process_checkin', {
                p_event_id: eventId,
                p_code: codeUpper,
                p_method: 'qr_scan',
                p_device_info: {
                    userAgent: navigator.userAgent,
                    platform: navigator.platform,
                    language: navigator.language,
                }
            });

            if (error) throw error;

            const rawPayload = Array.isArray(data) ? data[0] : data;

            if (!rawPayload) {
                throw new Error('Resposta inválida do servidor de check-in.');
            }

            const payload = parseProcessCheckinResponse(rawPayload);

            if (!payload.success) {
                throw new Error(getCheckinErrorMessage(payload.reason));
            }

            return { code: codeUpper, checkinId: payload.checkin_id };
        },
        onSuccess: (data) => {
            toast.success(`Check-in autorizado: ${data.code}`, {
                className: "rounded-lg bg-slate-900 shadow-2xl border-none text-white",
                duration: 2000
            });
            queryClient.invalidateQueries({ queryKey: ["checkins"] });
            queryClient.invalidateQueries({ queryKey: ["event-capacity"] });
        },
        onError: (error) => {
            toast.error(error.message, {
                className: "rounded-lg bg-rose-500 text-white border-none shadow-2xl",
                duration: 4000
            });
        }
    });

    // Scanner Logic
    useEffect(() => {
        if (activeTab === "scanner" && selectedEventId) {
            const timer = setTimeout(() => {
                const config = {
                    fps: 30,
                    qrbox: { width: 300, height: 300 },
                    aspectRatio: 1.0
                };
                const scanner = new Html5QrcodeScanner("reader", config, false);

                scanner.render((decodedText) => {
                    scanner.pause(true);
                    if (navigator.vibrate) navigator.vibrate(100);

                    checkInMutation.mutate({ code: decodedText, eventId: selectedEventId }, {
                        onSettled: () => {
                            setTimeout(() => scanner.resume(), 1200);
                        }
                    });
                }, () => { });
                scannerRef.current = scanner;
            }, 500);

            return () => {
                clearTimeout(timer);
                if (scannerRef.current) {
                    scannerRef.current.clear().catch(() => { });
                }
            };
        }
    }, [activeTab, selectedEventId]);

    const filteredCheckins = checkins?.filter((c) =>
        c.ticket_code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const progress = capacity?.total ? (capacity.present / capacity.total) * 100 : 0;

    return (
        <div className="space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Real-time Status Floating */}
            <div className="fixed top-24 right-8 z-50 flex items-center gap-3 bg-white/80  p-2 pl-4 rounded-lg shadow-2xl border border-slate-100">
                <div className="flex flex-col items-end">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sync Status</p>
                    <p className="text-xs font-bold text-slate-900">{isOnline ? "Online" : "Offline Mode"}</p>
                </div>
                <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center transition-colors", isOnline ? "bg-green-500/10 text-green-600" : "bg-rose-500/10 text-rose-600")}>
                    {isOnline ? <Wifi className="h-5 w-5" /> : <WifiOff className="h-5 w-5" />}
                </div>
            </div>

            {/* Header / Context Selection */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2.5 rounded-lg">
                            <Activity className="h-5 w-5 text-primary" />
                        </div>
                        <h1 className="text-5xl font-black tracking-tighter text-slate-900 italic uppercase">
                            Operational Engine
                        </h1>
                    </div>
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em] ml-1">
                        Controle de Acesso & Gestão de Fluxo em Tempo Real
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex flex-col gap-1.5 min-w-[280px]">
                        <Label className="text-[10px] font-black uppercase ml-2 text-slate-400 tracking-widest">Seletor de Contexto</Label>
                        <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                            <SelectTrigger className="h-16 rounded-lg border-none bg-white shadow-sm px-8 text-base font-black focus:ring-4 focus:ring-primary/5">
                                <SelectValue placeholder="Escolha um evento..." />
                            </SelectTrigger>
                            <SelectContent className="rounded-lg border-none shadow-2xl p-2 bg-white/95 ">
                                {isLoadingEvents ? (
                                    <SelectItem value="loading" disabled>Sincronizando eventos...</SelectItem>
                                ) : events?.map((e) => (
                                    <SelectItem key={e.id} value={e.id} className="rounded-lg h-14 font-bold">
                                        {e.titulo}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Premium Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="rounded-lg border-none bg-white shadow-sm p-8 flex flex-col justify-between h-52 group hover:shadow-xl transition-all">
                    <div className="w-14 h-14 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                        <UserCheck className="h-8 w-8" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Presentes</p>
                        <h3 className="text-4xl font-black text-slate-900 tracking-tighter italic">
                            {isLoadingCheckins ? "..." : checkins?.filter(c => c.status === 'success').length || 0}
                        </h3>
                    </div>
                </Card>

                <Card className="rounded-lg border-none bg-white shadow-sm p-8 flex flex-col justify-between h-52 group hover:shadow-xl transition-all">
                    <div className="w-14 h-14 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500">
                        <AlertTriangle className="h-8 w-8" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Alertas/Fraudes</p>
                        <h3 className="text-4xl font-black text-slate-900 tracking-tighter italic">
                            {checkins?.filter(c => c.status !== 'success').length || 0}
                        </h3>
                    </div>
                </Card>

                <Card className="rounded-lg border-none bg-white col-span-1 md:col-span-2 shadow-sm p-8 h-52 flex flex-col justify-between hover:shadow-xl transition-all">
                    <div className="flex justify-between items-center">
                        <div className="w-14 h-14 rounded-lg bg-slate-900 flex items-center justify-center text-white">
                            <Users className="h-8 w-8" />
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Taxa de Lotação</p>
                            <h4 className="text-2xl font-black text-slate-900 italic">{progress.toFixed(1)}%</h4>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                            <span>{capacity?.present || 0} Capturados</span>
                            <span>{capacity?.total || 0} Esperados</span>
                        </div>
                        <Progress value={progress} className="h-3 rounded-sm bg-slate-100" />
                    </div>
                </Card>
            </div>

            {/* Main Interaction Area - iOS-Style Navigation */}
            <div className="w-full space-y-8">
                <div className="grid grid-cols-2 gap-3 max-w-md mx-auto md:mx-0">
                    <Button
                        variant={activeTab === "list" ? "default" : "outline"}
                        className={cn(
                            "h-20 flex-col gap-2 rounded-lg transition-all",
                            activeTab === "list" && "shadow-lg"
                        )}
                        onClick={() => setActiveTab("list")}
                    >
                        <List className="h-6 w-6" />
                        <span className="text-sm font-bold">Histórico</span>
                    </Button>
                    <Button
                        variant={activeTab === "scanner" ? "default" : "outline"}
                        className={cn(
                            "h-20 flex-col gap-2 rounded-lg transition-all",
                            activeTab === "scanner" && "shadow-lg bg-slate-900 hover:bg-black"
                        )}
                        onClick={() => setActiveTab("scanner")}
                    >
                        <Scan className="h-6 w-6" />
                        <span className="text-sm font-bold">Scanner</span>
                    </Button>
                </div>

                {activeTab === "list" && (
                    <div className="space-y-6">
                        <div className="flex flex-col md:flex-row items-center gap-4 bg-white p-4 rounded-lg shadow-sm">
                            <div className="relative flex-1 w-full">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                                <Input
                                    placeholder="Buscar código, nome ou setor..."
                                    className="h-16 rounded-lg border-none bg-slate-50 pl-16 pr-8 text-base focus-visible:ring-0 font-bold placeholder:text-slate-300"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-3 w-full md:w-auto">
                                <Button
                                    variant="outline"
                                    className="h-16 min-w-[180px] rounded-lg border-2 border-slate-100 bg-white font-black uppercase text-xs tracking-widest"
                                    onClick={() => { setManualCode(""); setIsManualDialogOpen(true); }}
                                    disabled={!selectedEventId}
                                >
                                    <ChevronRight className="mr-2 h-4 w-4" /> Entrada Manual
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="h-16 w-16 rounded-lg bg-slate-900 text-white"
                                    onClick={() => queryClient.invalidateQueries({ queryKey: ["checkins"] })}
                                >
                                    <RefreshCw className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>

                        <AnimatePresence mode="wait">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white rounded-lg shadow-sm overflow-hidden border border-slate-50"
                            >
                                <Table>
                                    <TableHeader className="bg-slate-50/50">
                                        <TableRow className="border-none">
                                            <TableHead className="h-20 px-10 font-black text-slate-400 uppercase text-[10px] tracking-widest">Identificador</TableHead>
                                            <TableHead className="h-20 font-black text-slate-400 uppercase text-[10px] tracking-widest">Validação</TableHead>
                                            <TableHead className="h-20 font-black text-slate-400 uppercase text-[10px] tracking-widest">Timestamp</TableHead>
                                            <TableHead className="h-20 px-10 text-right font-black text-slate-400 uppercase text-[10px] tracking-widest">Modo</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoadingCheckins ? (
                                            Array.from({ length: 5 }).map((_, i) => (
                                                <TableRow key={i} className="border-b border-slate-50">
                                                    <TableCell className="px-10"><Skeleton className="h-6 w-32 rounded-lg" /></TableCell>
                                                    <TableCell><Skeleton className="h-6 w-24 rounded-lg" /></TableCell>
                                                    <TableCell><Skeleton className="h-6 w-40 rounded-lg" /></TableCell>
                                                    <TableCell className="px-10"><Skeleton className="h-6 w-20 ml-auto rounded-lg" /></TableCell>
                                                </TableRow>
                                            ))
                                        ) : filteredCheckins?.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="h-80 text-center opacity-30">
                                                    <SearchX className="h-20 w-20 mx-auto mb-6" />
                                                    <p className="font-black uppercase tracking-widest">Vazio Operacional</p>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredCheckins?.map((checkin) => (
                                                <TableRow key={checkin.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-all duration-300 group">
                                                    <TableCell className="px-10 py-6">
                                                        <div className="flex flex-col">
                                                            <span className="font-black text-sm italic tracking-tighter text-slate-900">{checkin.ticket_code}</span>
                                                            <span className="text-[10px] font-bold text-slate-400">ID: {checkin.id.slice(0, 8)}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge className={cn(
                                                            "rounded-lg px-4 py-1.5 text-[10px] font-black uppercase tracking-widest border-none",
                                                            checkin.status === 'success' ? "bg-green-500 text-white" :
                                                                checkin.status === 'duplicate' ? "bg-amber-500 text-white" : "bg-rose-500 text-white"
                                                        )}>
                                                            {checkin.status === 'success' ? 'AUTORIZADO' :
                                                                checkin.status === 'duplicate' ? 'DUPLICADO' : 'INVÁLIDO'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-slate-600 font-bold text-sm">
                                                        {checkin.checkin_time && format(new Date(checkin.checkin_time), 'HH:mm:ss')}
                                                        <span className="text-[10px] ml-3 opacity-40 uppercase">{checkin.checkin_time && format(new Date(checkin.checkin_time), 'dd MMM')}</span>
                                                    </TableCell>
                                                    <TableCell className="px-10 text-right">
                                                        <div className="flex items-center justify-end gap-2 text-slate-300 font-black uppercase text-[9px]">
                                                            {checkin.method === 'qr_scan' ? <Scan className="h-3.3 w-3.2" /> : <ChevronRight className="h-3.3 w-3.3" />}
                                                            {checkin.method?.replace('_', ' ')}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                )}

                {activeTab === "scanner" && (
                    <div>
                        <div className="flex flex-col md:flex-row gap-12 items-start justify-center py-6">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="w-full max-w-xl"
                            >
                                <Card className="rounded-lg border-none bg-slate-900 shadow-[0_40px_100px_rgba(0,0,0,0.3)] overflow-hidden p-3 aspect-square relative ring-1 ring-white/10">
                                    <div id="reader" className="w-full h-full rounded-lg overflow-hidden" />

                                    {/* Aesthetic Scanner Overlays */}
                                    <div className="absolute inset-0 pointer-events-none z-20 border-[32px] border-slate-900">
                                        <div className="h-full w-full rounded-lg border border-white/10 relative">
                                            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-primary/40 animate-scanner-line" />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-64 h-64 border-2 border-dashed border-white/20 rounded-lg" />
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>

                            <div className="flex-1 space-y-8 max-w-md">
                                <div className="space-y-4">
                                    <h3 className="text-4xl font-black italic tracking-tighter uppercase text-slate-900">Modo Captura Viva</h3>
                                    <p className="text-slate-500 font-bold leading-relaxed">
                                        O sistema está pronto para validar tokens de acesso, crachás digitais e ingressos impressos.
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-6 rounded-lg bg-white border border-slate-100 space-y-3 shadow-sm">
                                        <Scan className="h-6 w-6 text-primary" />
                                        <p className="font-black text-[10px] uppercase tracking-widest text-slate-400">Scanner Cam</p>
                                        <p className="font-bold text-slate-900 text-sm">30 FPS Active</p>
                                    </div>
                                    <div className="p-6 rounded-lg bg-white border border-slate-100 space-y-3 shadow-sm">
                                        <CreditCard className="h-6 w-6 text-blue-500" />
                                        <p className="font-black text-[10px] uppercase tracking-widest text-slate-400">Suporte Crachás</p>
                                        <p className="font-bold text-slate-900 text-sm">Habilitado</p>
                                    </div>
                                </div>

                                <Card className="rounded-lg bg-slate-50 border-none p-8">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center text-white">
                                            <Activity className="h-5 w-5" />
                                        </div>
                                        <p className="font-black uppercase text-[10px] tracking-widest text-slate-900">Última Leitura</p>
                                    </div>
                                    {checkins?.[0] ? (
                                        <div className="space-y-1">
                                            <p className="text-lg font-black italic tracking-tighter">{checkins[0].ticket_code}</p>
                                            <p className="text-xs font-bold text-slate-400 uppercase">{checkins[0].status === 'success' ? 'Autorizado' : 'Rejeitado'}</p>
                                        </div>
                                    ) : (
                                        <p className="text-slate-400 font-bold text-sm italic">Aguardando Captura...</p>
                                    )}
                                </Card>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Manual Check-in Sheet */}
            <Sheet open={isManualDialogOpen} onOpenChange={setIsManualDialogOpen}>
                <SheetContent className="sm:max-w-lg">
                    <SheetHeader className="space-y-4">
                        <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center text-slate-900">
                            <Search className="h-8 w-8" />
                        </div>
                        <SheetTitle className="text-4xl font-black italic tracking-tighter uppercase text-slate-900">
                            Entrada Manual
                        </SheetTitle>
                        <SheetDescription className="font-bold text-slate-400 uppercase text-[10px] tracking-[0.3em]">
                            Validação via código ou CPF do portador
                        </SheetDescription>
                    </SheetHeader>

                    <div className="space-y-6 py-6">
                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                Código Alfanumérico
                            </Label>
                            <Input
                                placeholder="EX: TKT-V882-EVENTIO"
                                value={manualCode}
                                onChange={(e) => setManualCode(e.target.value)}
                                className="h-20 rounded-lg border-none bg-slate-50 px-10 text-2xl font-black italic tracking-tighter placeholder:text-slate-200 focus-visible:ring-4 focus-visible:ring-primary/5"
                            />
                        </div>

                        <div className="flex flex-col gap-4">
                            <Button
                                className="h-20 w-full rounded-lg bg-slate-900 hover:bg-black text-white text-sm font-black uppercase tracking-widest shadow-2xl transition-all active:scale-95"
                                onClick={() => {
                                    checkInMutation.mutate({ code: manualCode, eventId: selectedEventId }, {
                                        onSuccess: () => {
                                            setIsManualDialogOpen(false);
                                            setManualCode("");
                                        }
                                    });
                                }}
                                disabled={!manualCode || checkInMutation.isPending}
                            >
                                {checkInMutation.isPending ? 'VALIDANDO...' : 'AUTORIZAR ACESSO'}
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => setIsManualDialogOpen(false)}
                                className="h-14 w-full rounded-lg font-black uppercase text-[10px] tracking-[0.3em] text-slate-300"
                            >
                                Cancelar Operação
                            </Button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>

            <style>{`
                .scanner-luma video { border-radius: 56px !important; object-fit: cover !important; }
                #reader__scan_region img { display: none !important; }
                #reader__dashboard_section_csr button { display: none !important; }
                #reader { border: none !important; }
                #reader__header_message { display: none !important; }
                @keyframes scanner-line {
                    0% { top: 10%; }
                    50% { top: 90%; }
                    100% { top: 10%; }
                }
                .animate-scanner-line {
                    position: absolute;
                    animation: scanner-line 3s infinite ease-in-out;
                }
            `}</style>
        </div>
    );
}
