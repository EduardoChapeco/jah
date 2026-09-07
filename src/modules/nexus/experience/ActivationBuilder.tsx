import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Trash2, Smartphone, Trophy, Gift, QrCode as QrCodeIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useEmpresa } from "@/hooks/useEmpresa";
import { toast } from "sonner";
import { QRCodeCanvas } from "qrcode.react";
import { cn } from "@/lib/utils";

export default function ActivationBuilder() {
    const { empresa } = useEmpresa();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Form State
    const [title, setTitle] = useState("");
    const [type, setType] = useState("scan_win");
    const [eventId, setEventId] = useState("");
    const [winProbability, setWinProbability] = useState("20");

    const { data: events } = useQuery({
        queryKey: ["events-activations", empresa?.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("eventos")
                .select("id, titulo")
                .eq("empresa_id", empresa?.id)
                .order("data_inicio", { ascending: false });

            if (error) throw error;
            return data;
        },
        enabled: !!empresa?.id
    });

    const { data: activations, isLoading } = useQuery({
        queryKey: ["activations", empresa?.id],
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from("event_activations")
                .select("*, eventos(titulo)")
                .eq("empresa_id", empresa?.id)
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data;
        },
        enabled: !!empresa?.id,
    });

    const createActivationMutation = useMutation({
        mutationFn: async () => {
            if (!empresa?.id) return;

            const { error } = await supabase.from("event_activations").insert({
                empresa_id: empresa.id,
                event_id: eventId || null,
                title,
                activation_type: type,
                rules: { probability: parseInt(winProbability), max_winners: 100 },
                is_active: true
            });

            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Ativação criada com sucesso!");
            setIsDialogOpen(false);
            resetForm();
            queryClient.invalidateQueries({ queryKey: ["activations"] });
        },
        onError: (error) => {
            toast.error("Erro ao criar ativação.");
        }
    });

    const deleteActivationMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("event_activations").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Ativação removida.");
            queryClient.invalidateQueries({ queryKey: ["activations"] });
        }
    });

    const resetForm = () => {
        setTitle("");
        setType("scan_win");
        setEventId("");
        setWinProbability("20");
    };

    const getActivationLink = (id: string) => `https://eventio.live/activations/${id}`;

    const filteredActivations = activations?.filter((a) =>
        a.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900">Ativações QR</h1>
                    <p className="text-slate-500 mt-2 text-lg">
                        Crie experiências gamificadas e interativas para seu público.
                    </p>
                </div>
                <Button
                    className="bg-black text-white hover:bg-black/90 rounded-lg px-8 h-12 text-md font-bold shadow-xl shadow-black/10 transition-all hover:scale-105"
                    onClick={() => setIsDialogOpen(true)}
                >
                    <Plus className="mr-2 h-5 w-5" /> Nova Ativação
                </Button>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-black transition-colors" />
                    <Input
                        placeholder="Buscar ativações ativação..."
                        className="pl-12 h-14 rounded-lg border-slate-200 bg-white/50  focus:ring-4 focus:ring-black/5 transition-all text-md"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-[320px] rounded-lg bg-slate-100 animate-pulse" />
                    ))
                ) : filteredActivations?.length === 0 ? (
                    <div className="col-span-full text-center py-24 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/50">
                        <div className="w-20 h-20 bg-white rounded-xl flex items-center justify-center mx-auto mb-6 border border-slate-100">
                            <QRCodeCanvas value="demo" size={40} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">Nenhuma ativação encontrada</h3>
                        <p className="text-slate-500 mt-2">Comece criando sua primeira experiência interativa.</p>
                    </div>
                ) : (
                    filteredActivations?.map((activation) => (
                        <Card key={activation.id} className="group relative overflow-hidden rounded-lg border-none shadow-2xl shadow-slate-200/50 bg-white hover:shadow-black/5 transition-all duration-500">
                            {/* Visual Header */}
                            <div className="h-24 bg-muted/10   flex items-center px-8 border-b border-slate-50">
                                <div className="space-y-0.5">
                                    <h3 className="text-xl font-black text-slate-900 group-hover:text-black transition-colors">
                                        {activation.title}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <Badge className="bg-white/80  text-slate-600 border-none shadow-sm text-[10px] font-bold uppercase tracking-wider">
                                            {(activation.eventos as { titulo: string } | null)?.titulo || "Geral"}
                                        </Badge>
                        <div className={cn(
                            "w-2 h-2 rounded-sm",
                                            activation.is_active ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]" : "bg-slate-300"
                                        )} />
                                    </div>
                                </div>
                            </div>

                            <CardContent className="p-8 space-y-8">
                                <div className="flex justify-between items-center">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center">
                                                <Trophy className="h-5 w-5 text-amber-500" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Tipo</p>
                                                <p className="text-sm font-bold text-slate-700">
                                                    {activation.activation_type === 'scan_win' ? 'Escanear & Ganhar' :
                                                        activation.activation_type === 'survey' ? 'Pesquisa Rápida' : 'Informativo'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center">
                                                <Gift className="h-5 w-5 text-indigo-500" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Próx. Sorteio</p>
                                                <p className="text-sm font-bold text-slate-700">
                                                    {(activation.rules as { probability?: number } | null)?.probability || 0}% chance
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 p-4 rounded-lg transition-transform group-hover:scale-105 duration-500 border border-slate-100/50">
                                        <QRCodeCanvas value={getActivationLink(activation.id)} size={96} />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between gap-3 pt-6 border-t border-slate-50">
                                    <div className="flex gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-12 w-12 rounded-lg text-slate-400 hover:text-destructive hover:bg-destructive/5 transition-all"
                                            onClick={() => deleteActivationMutation.mutate(activation.id)}
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </Button>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            className="h-12 px-6 rounded-lg border-slate-200 font-bold text-sm hover:bg-slate-50"
                                            onClick={() => window.open(getActivationLink(activation.id), '_blank')}
                                        >
                                            <Smartphone className="mr-2 h-4 w-4" /> Link
                                        </Button>
                                        <Button className="h-12 px-6 rounded-lg bg-slate-900 text-white font-bold text-sm shadow-xl shadow-slate-200">
                                            Gerenciar
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            <Sheet open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <SheetContent side="right" className="w-full sm:max-w-xl p-0 overflow-y-auto border-none shadow-2xl rounded-l-[40px] bg-white/95 ">
                    <div className="bg-slate-50 p-10 border-b border-slate-100">
                        <SheetTitle className="text-3xl font-black text-slate-900 tracking-tight">Nova Ativação</SheetTitle>
                        <SheetDescription className="text-slate-500 mt-2 text-md font-medium">
                            Configure uma experiência de QR Code envolvente.
                        </SheetDescription>
                    </div>

                    <div className="p-10 space-y-8">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Título da Ativação</Label>
                                <Input
                                    placeholder="Ex: Roleta de Brindes Master"
                                    className="h-16 rounded-lg border-slate-200 bg-white focus:ring-4 focus:ring-black/5 font-bold text-lg"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Vincular a Evento</Label>
                                <Select value={eventId} onValueChange={setEventId}>
                                    <SelectTrigger className="h-16 rounded-lg border-slate-200 bg-white font-bold">
                                        <SelectValue placeholder="Selecione um evento (opcional)" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-lg p-2 border-none shadow-2xl">
                                        {events?.map((e) => (
                                            <SelectItem key={e.id} value={e.id} className="rounded-lg px-4 py-3 font-bold">{e.titulo}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Tipo de Experiência</Label>
                                <Select value={type} onValueChange={setType}>
                                    <SelectTrigger className="h-16 rounded-lg border-slate-200 bg-white font-bold">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-lg p-2 border-none shadow-2xl">
                                        <SelectItem value="scan_win" className="rounded-lg px-4 py-3 font-bold">Escanear & Ganhar (Gamificado)</SelectItem>
                                        <SelectItem value="survey" className="rounded-lg px-4 py-3 font-bold">Pesquisa Interativa</SelectItem>
                                        <SelectItem value="info" className="rounded-lg px-4 py-3 font-bold">Página Premium de Conteúdo</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {type === "scan_win" && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Probabilidade de Vitória (%)</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        max="100"
                                        className="h-16 rounded-lg border-slate-200 bg-white font-bold text-lg"
                                        value={winProbability}
                                        onChange={(e) => setWinProbability(e.target.value)}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Visual Preview Placeholder */}
                        <div className="bg-slate-50 rounded-lg p-10 border border-slate-100 flex flex-col items-center justify-center text-center space-y-6">
                            <div className="w-20 h-20 bg-white rounded-xl flex items-center justify-center border border-slate-100">
                                <Smartphone className="h-10 w-10 text-slate-300" />
                            </div>
                            <div>
                                <h4 className="font-black text-slate-900 text-lg">Preview ao vivo</h4>
                                <p className="text-sm font-medium text-slate-400 mt-2 px-4 leading-relaxed">Esta será a experiência que seus participantes verão no celular ao escanear o QR Code.</p>
                            </div>
                        </div>

                        <div className="pt-4 flex gap-4">
                            <Button
                                className="w-full bg-slate-900 text-white hover:bg-black rounded-lg h-16 font-black uppercase tracking-widest text-xs shadow-xl shadow-slate-900/10 hover:scale-[1.02] transition-all"
                                onClick={() => createActivationMutation.mutate()}
                                disabled={createActivationMutation.isPending || !title}
                            >
                                {createActivationMutation.isPending ? "Criando..." : "Criar Experiência"}
                            </Button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
