import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Plus,
    Search,
    Printer,
    LayoutTemplate,
    Eye,
    Settings2,
    Trash2,
    Download,
    Check
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from "@/components/ui/sheet";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useEmpresa } from "@/hooks/useEmpresa";
import { format } from "date-fns";
import { toast } from "sonner";
import { BadgeCanvas } from "@/components/operations/BadgeCanvas";
import { cn } from "@/lib/utils";

type BadgeVariant = 'standard' | 'vip' | 'staff' | 'press';

interface BadgeTemplate {
    id: string;
    name: string;
    variant: BadgeVariant;
    primary_color: string;
    empresa_id: string;
}

export default function BadgeManager() {
    const { empresa } = useEmpresa();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    const [isTemplateOpen, setIsTemplateOpen] = useState(false);

    // Print Dialog State
    const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<BadgeTemplate | null>(null);
    const [selectedEventId, setSelectedEventId] = useState<string>("");
    const [printing, setPrinting] = useState(false);

    // Template Form
    const [templateName, setTemplateName] = useState("");
    const [templateVariant, setTemplateVariant] = useState<BadgeVariant>('standard');
    const [templateColor, setTemplateColor] = useState("#3b82f6");

    const { data: templates, isLoading } = useQuery({
        queryKey: ["badge-templates", empresa?.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("badge_templates")
                .select("*")
                .eq("empresa_id", empresa?.id)
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data as unknown as BadgeTemplate[];
        },
        enabled: !!empresa?.id,
    });

    const { data: events } = useQuery({
        queryKey: ["events-badges", empresa?.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("eventos")
                .select("id, titulo, data_inicio, local_evento")
                .eq("empresa_id", empresa?.id)
                .order("data_inicio", { ascending: false });

            if (error) throw error;
            return data;
        },
        enabled: !!empresa?.id
    });

    const createTemplateMutation = useMutation({
        mutationFn: async () => {
            if (!empresa?.id) return;

            const { error } = await supabase.from("badge_templates").insert({
                empresa_id: empresa.id,
                name: templateName,
                variant: templateVariant,
                primary_color: templateColor,
                html_structure: "", // Kept for legacy compatibility if needed
                fields: { version: "2.0", type: "canvas" }
            });

            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Modelo de crachá criado!");
            setIsTemplateOpen(false);
            setTemplateName("");
            queryClient.invalidateQueries({ queryKey: ["badge-templates"] });
        },
        onError: () => toast.error("Erro ao criar modelo.")
    });

    const deleteTemplateMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("badge_templates").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Modelo removido.");
            queryClient.invalidateQueries({ queryKey: ["badge-templates"] });
        }
    });

    interface TicketForPrint {
        id: string;
        codigo: string | null;
        nome_comprador: string | null;
        ingressos_tipos: {
            nome: string;
            evento: {
                titulo: string;
                data_inicio: string | null;
                local_evento: string | null;
            } | null;
        } | null;
    }

    const [ticketsToPrint, setTicketsToPrint] = useState<TicketForPrint[]>([]);
    const [isPreviewMode, setIsPreviewMode] = useState(false);

    const handlePrint = async () => {
        if (!selectedEventId || !selectedTemplate) return;
        setPrinting(true);

        try {
            const { data: tickets, error } = await supabase
                .from("ingressos")
                .select(`
                    id,
                    codigo,
                    nome_comprador,
                    ingressos_tipos!inner(nome, evento:eventos(titulo, data_inicio, local_evento))
                `)
                .eq("ingressos_tipos.evento_id", selectedEventId)
                .limit(20); // Limit para não travar a UI no demo

            if (error) throw error;

            if (!tickets || tickets.length === 0) {
                toast.warning("Nenhum participante encontrado.");
                return;
            }

            if (isPreviewMode) {
                setTicketsToPrint(tickets);
                toast.info(`Pré-visualização de ${tickets.length} crachás gerada.`);
            } else {
                setTicketsToPrint(tickets);
                setIsPrintDialogOpen(false);
                toast.info(`Processando ${tickets.length} crachás...`);
                setTimeout(() => {
                    window.print();
                    setTicketsToPrint([]);
                }, 1000);
            }

        } catch (err) {
            console.error(err);
            toast.error("Erro ao gerar crachás.");
        } finally {
            setPrinting(false);
        }
    };

    const filteredTemplates = templates?.filter((t) =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black tracking-tight text-gray-900">Digital Credentials</h1>
                    <p className="text-gray-500 font-bold italic">Transforme participantes em VIPs com crachás de alta fidelidade.</p>
                </div>
                <Button
                    className="h-14 rounded-lg bg-black hover:bg-gray-900 text-white font-black px-8 shadow-xl shadow-black/10 group"
                    onClick={() => setIsTemplateOpen(true)}
                >
                    <Plus className="mr-2 h-5 w-5 group-hover:rotate-90 transition-transform" /> Criar Lote
                </Button>
            </div>

            <div className="flex items-center gap-4 bg-white p-2 rounded-lg shadow-sm max-w-md">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Filtrar modelos..."
                        className="pl-11 h-12 rounded-lg border-none bg-transparent font-bold focus-visible:ring-0"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                    <Settings2 className="h-4 w-4" />
                </div>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <Card key={i} className="rounded-lg overflow-hidden border-none shadow-sm h-[500px] animate-pulse bg-gray-50" />
                    ))
                ) : filteredTemplates?.length === 0 ? (
                    <div className="col-span-full text-center py-24 text-gray-400 bg-gray-50/50 rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center gap-4">
                        <LayoutTemplate className="h-16 w-16 opacity-10" />
                        <p className="font-bold text-lg">Nenhum modelo de credencial criado.</p>
                    </div>
                ) : (
                    filteredTemplates?.map((template) => (
                        <div key={template.id} className="group relative">
                            <div className="scale-90 group-hover:scale-100 transition-all duration-500">
                                <BadgeCanvas
                                    name="João Victor Silva"
                                    role="PARTICIPANTE"
                                    eventName="Summit Nexus 2026"
                                    eventDate="24/Outubro"
                                    qrCodeData="DEMO-PREVIEW"
                                    variant={template.variant}
                                    primaryColor={template.primary_color}
                                />
                            </div>

                            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none group-hover:pointer-events-auto">
                                <div className="p-6 bg-white/95  rounded-lg shadow-2xl space-y-4 w-[280px] border border-white/20 translate-y-4 group-hover:translate-y-0 transition-transform">
                                    <h3 className="text-xl font-black text-center">{template.name}</h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button variant="outline" className="h-12 rounded-lg font-bold" onClick={() => setSelectedTemplate(template)}>
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        <Button className="h-12 rounded-lg font-bold bg-black text-white" onClick={() => { setSelectedTemplate(template); setIsPrintDialogOpen(true); }}>
                                            <Printer className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        className="w-full text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg h-10 font-bold"
                                        onClick={() => deleteTemplateMutation.mutate(template.id)}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" /> Excluir
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Preview Section */}
            {ticketsToPrint.length > 0 && isPreviewMode && (
                <div className="space-y-6 pt-12 border-t mt-12 animate-in slide-in-from-bottom-10 duration-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-black">Visualização de Folha A4</h2>
                            <p className="text-gray-500 font-bold">Confira as margens e sangrias antes de enviar para a gráfica.</p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" className="font-bold h-12 rounded-xl" onClick={() => setTicketsToPrint([])}>Fechar Preview</Button>
                            <Button className="bg-blue-500 hover:bg-blue-600 text-white font-bold h-12 rounded-xl px-8" onClick={() => window.print()}>
                                <Printer className="mr-2 h-4 w-4" /> Iniciar Impressão Lote
                            </Button>
                        </div>
                    </div>
                    
                    <div className="bg-gray-200/50 p-12 rounded-3xl overflow-x-auto flex justify-center">
                        <div className="bg-white shadow-2xl p-8 grid grid-cols-2 gap-8 w-[210mm] min-h-[297mm]">
                            {ticketsToPrint.map((ticket) => (
                                <div key={ticket.id} className="flex justify-center items-center">
                                    <div className="scale-[0.5] origin-center">
                                        <BadgeCanvas
                                            name={ticket.nome_comprador || "Participante"}
                                            role={ticket.ingressos_tipos?.nome || "CONVIDADO"}
                                            eventName={ticket.ingressos_tipos?.evento?.titulo || "Evento"}
                                            eventDate={ticket.ingressos_tipos?.evento?.data_inicio ? 
                                                format(new Date(ticket.ingressos_tipos.evento.data_inicio), "dd/MM") : 
                                                ""}
                                            eventLocation={ticket.ingressos_tipos?.evento?.local_evento || ""}
                                            qrCodeData={ticket.codigo || ticket.id}
                                            variant={selectedTemplate?.variant || 'standard'}
                                            primaryColor={selectedTemplate?.primary_color}
                                            isPrintMode={true}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <Sheet open={isTemplateOpen} onOpenChange={setIsTemplateOpen}>
                <SheetContent className="sm:max-w-md">
                    <SheetHeader className="space-y-4">
                        <div className="w-16 h-16 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500">
                            <LayoutTemplate className="h-8 w-8" />
                        </div>
                        <SheetTitle className="text-3xl font-black tracking-tight">Nova Identidade</SheetTitle>
                        <SheetDescription className="text-gray-500 font-bold">Defina o estilo visual para o seu lote de credenciais.</SheetDescription>
                    </SheetHeader>

                    <div className="space-y-6 py-6 font-bold">
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-black tracking-widest text-gray-400">Título do Modelo</Label>
                            <Input
                                placeholder="Ex: Credencial VIP Exclusive"
                                className="h-14 rounded-lg bg-gray-50 border-none px-6 font-bold"
                                value={templateName}
                                onChange={(e) => setTemplateName(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-black tracking-widest text-gray-400">Variante Visual</Label>
                            <Select value={templateVariant} onValueChange={(v: BadgeVariant) => setTemplateVariant(v)}>
                                <SelectTrigger className="h-14 rounded-lg bg-gray-50 border-none px-6">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-lg border-none shadow-2xl">
                                    <SelectItem value="standard" className="h-12 rounded-lg">Standard (Palpável)</SelectItem>
                                    <SelectItem value="vip" className="h-12 rounded-lg">VIP (Dark/Gold)</SelectItem>
                                    <SelectItem value="staff" className="h-12 rounded-lg">Staff (Operacional)</SelectItem>
                                    <SelectItem value="press" className="h-12 rounded-lg">Press (Media Tech)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-black tracking-widest text-gray-400">Cor de Destaque</Label>
                            <div className="flex gap-3 mt-1">
                                {['#3b82f6', '#f59e0b', '#10b981', '#6366f1', '#f43f5e', '#111827'].map((c) => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => setTemplateColor(c)}
                                        className={cn(
                                            "w-10 h-10 rounded-xl border-4 border-white border-slate-100 transition-all hover:scale-110",
                                            templateColor === c ? "ring-2 ring-gray-900 scale-110" : "scale-100"
                                        )}
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    <SheetFooter>
                        <Button
                            className="w-full h-16 rounded-lg bg-black text-white font-black text-lg shadow-xl shadow-black/10 hover:bg-gray-800"
                            onClick={() => createTemplateMutation.mutate()}
                            disabled={createTemplateMutation.isPending || !templateName}
                        >
                            {createTemplateMutation.isPending ? "Configurando..." : "Gerar Identidade"}
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            <Sheet open={isPrintDialogOpen} onOpenChange={setIsPrintDialogOpen}>
                <SheetContent className="sm:max-w-md">
                    <SheetHeader className="space-y-4">
                        <div className="w-16 h-16 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500">
                            <Printer className="h-8 w-8" />
                        </div>
                        <SheetTitle className="text-3xl font-black tracking-tight">Imprimir Lote</SheetTitle>
                        <SheetDescription className="font-bold">
                            Selecione o evento para gerar os crachás usando <b>{selectedTemplate?.name}</b>.
                        </SheetDescription>
                    </SheetHeader>

                    <div className="py-6 space-y-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-black tracking-widest text-gray-400">Evento Alvo</Label>
                            <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                                <SelectTrigger className="h-14 rounded-lg bg-gray-50 border-none px-6 font-bold">
                                    <SelectValue placeholder="Escolher evento..." />
                                </SelectTrigger>
                                <SelectContent className="rounded-lg border-none shadow-2xl">
                                    {events?.map((e) => (
                                        <SelectItem key={e.id} value={e.id} className="h-12 rounded-lg">{e.titulo}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border border-gray-100">
                            <div className="flex items-center gap-3">
                                <Eye className="h-5 w-5 text-gray-400" />
                                <span className="font-bold text-sm">Modo de Pré-visualização</span>
                            </div>
                            <input 
                                type="checkbox" 
                                checked={isPreviewMode} 
                                onChange={(e) => setIsPreviewMode(e.target.checked)}
                                className="w-5 h-5 accent-blue-500 rounded-md cursor-pointer"
                            />
                        </div>

                        <div className="p-6 rounded-lg bg-blue-50 border border-blue-100 flex items-center gap-4">
                            <Download className="h-8 w-8 text-blue-500" />
                            <div>
                                <p className="text-xs font-black uppercase text-blue-600 tracking-wider">Formato de Saída</p>
                                <p className="text-sm font-bold text-blue-900">PDF Alta Fidelidade (A4)</p>
                            </div>
                        </div>
                    </div>

                    <SheetFooter>
                        <Button
                            className="w-full h-16 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-black text-lg shadow-xl shadow-blue-500/20"
                            onClick={handlePrint}
                            disabled={printing || !selectedEventId}
                        >
                            {printing ? "Processando..." : "Gerar Arquivo de Impressão"}
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
            <style>
                {`
                @media print {
                    body * { visibility: hidden; }
                    #print-section, #print-section * { visibility: visible; }
                    #print-section {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        display: block !important;
                    }
                    .print-page {
                        width: 210mm;
                        height: 297mm;
                        padding: 10mm;
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 10mm;
                        page-break-after: always;
                    }
                }
                `}
            </style>

            <div id="print-section" className="hidden">
                {ticketsToPrint.length > 0 && (
                    <div className="print-page">
                        {ticketsToPrint.map((ticket) => (
                            <div key={ticket.id} className="flex justify-center items-center h-[120mm]">
                                <div className="scale-[0.8] origin-center">
                                    <BadgeCanvas
                                        name={ticket.nome_comprador || "Participante"}
                                        role={ticket.ingressos_tipos?.nome || "CONVIDADO"}
                                        eventName={ticket.ingressos_tipos?.evento?.titulo || "Evento"}
                                        eventDate={ticket.ingressos_tipos?.evento?.data_inicio ? 
                                            format(new Date(ticket.ingressos_tipos.evento.data_inicio), "dd/MM") : 
                                            ""}
                                        eventLocation={ticket.ingressos_tipos?.evento?.local_evento || ""}
                                        qrCodeData={ticket.codigo || ticket.id}
                                        variant={selectedTemplate?.variant || 'standard'}
                                        primaryColor={selectedTemplate?.primary_color}
                                        isPrintMode={true}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
