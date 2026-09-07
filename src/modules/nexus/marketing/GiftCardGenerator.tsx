import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Plus, Search, Gift, Upload, RefreshCw, Copy, CheckCircle2,
    Image as ImageIcon, Video, Eye, Trash2, Calendar, MessageSquare,
    User, Sparkles, X, ChevronDown, Palette
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEmpresa } from "@/hooks/useEmpresa";
import { toast } from "sonner";
import { format } from "date-fns";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Cliente {
    id: string;
    nome: string;
    email?: string | null;
    telefone?: string | null;
    pessoa?: { nome_completo: string; foto_url?: string | null } | null;
}

interface GiftCard {
    id: string;
    code: string;
    initial_value: number;
    balance: number;
    status: string | null;
    theme: string | null;
    message: string | null;
    sender_name: string | null;
    recipient_name: string | null;
    animation_url: string | null;
    image_url?: string | null;
    expires_at: string | null;
    created_at: string | null;
    recipient_pessoa_id?: string | null;
}

// ─── Client Search Component ─────────────────────────────────────────────────

function ClienteSearch({
    empresaId,
    value,
    onChange,
}: {
    empresaId: string;
    value: { id: string; nome: string } | null;
    onChange: (c: { id: string; nome: string } | null) => void;
}) {
    const [search, setSearch] = useState("");
    const [open, setOpen] = useState(false);

    const { data: clientes } = useQuery({
        queryKey: ["clientes-search", empresaId, search],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("clientes_leads")
                .select("id, nome, email, telefone")
                .eq("empresa_id", empresaId)
                .ilike("nome", `%${search}%`)
                .limit(10);
            if (error) throw error;
            return data as Cliente[];
        },
        enabled: !!empresaId && open,
    });

    const handleSelect = (c: Cliente) => {
        onChange({ id: c.id, nome: c.nome });
        setSearch(c.nome);
        setOpen(false);
    };

    const handleClear = () => {
        onChange(null);
        setSearch("");
    };

    return (
        <div className="relative">
            <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    className="pl-10 pr-10 h-11"
                    placeholder="Buscar cliente da carteira..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
                    onFocus={() => setOpen(true)}
                />
                {value && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            {open && (clientes?.length ?? 0) > 0 && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-background border border-border rounded-xl shadow-lg overflow-hidden">
                    {clientes?.map((c) => (
                        <button
                            key={c.id}
                            type="button"
                            className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors flex items-center gap-3"
                            onClick={() => handleSelect(c)}
                        >
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                                {c.nome.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <p className="font-medium text-sm text-foreground">{c.nome}</p>
                                {c.email && <p className="text-xs text-muted-foreground">{c.email}</p>}
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Media Upload Component ──────────────────────────────────────────────────

function MediaUpload({
    label,
    accept,
    field,
    value,
    onChange,
    empresaId,
}: {
    label: string;
    accept: string;
    field: "animation_url" | "image_url";
    value: string;
    onChange: (url: string) => void;
    empresaId: string;
}) {
    const [uploading, setUploading] = useState(false);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate type
        const isImage = file.type.startsWith("image/");
        const isVideo = file.type.startsWith("video/");
        if (!isImage && !isVideo) {
            toast.error("Formato não suportado");
            return;
        }

        // Validate size (50MB max)
        if (file.size > 50 * 1024 * 1024) {
            toast.error("Arquivo muito grande. Máximo 50MB");
            return;
        }

        setUploading(true);
        try {
            const ext = file.name.split(".").pop();
            const fileName = `${empresaId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

            const { error: uploadError } = await supabase.storage
                .from("gift-cards")
                .upload(fileName, file, { upsert: false, cacheControl: "3600" });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from("gift-cards")
                .getPublicUrl(fileName);

            onChange(publicUrl);
            toast.success("Arquivo enviado com sucesso!");
        } catch (err: any) {
            console.error("Upload error:", err);
            toast.error("Erro no upload: " + (err?.message || "Tente novamente"));
        } finally {
            setUploading(false);
            // Reset input
            e.target.value = "";
        }
    };

    const inputId = `upload-${field}`;

    return (
        <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{label}</Label>
            <div
                className={cn(
                    "relative border-2 border-dashed rounded-xl transition-colors cursor-pointer group",
                    value
                        ? "border-primary/40 bg-primary/5"
                        : "border-border hover:border-primary/40 hover:bg-muted/30"
                )}
                onClick={() => document.getElementById(inputId)?.click()}
            >
                <input
                    id={inputId}
                    type="file"
                    hidden
                    accept={accept}
                    onChange={handleUpload}
                    disabled={uploading}
                />

                {value ? (
                    <div className="p-4 flex items-center gap-3">
                        {field === "image_url" && value ? (
                            <img src={value} alt="" className="w-16 h-16 rounded-lg object-cover" />
                        ) : (
                            <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Video className="h-6 w-6 text-primary" />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-primary flex items-center gap-1">
                                <CheckCircle2 className="h-4 w-4" /> Enviado
                            </p>
                            <p className="text-xs text-muted-foreground truncate">{value.split("/").pop()}</p>
                        </div>
                        <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                            onClick={(e) => { e.stopPropagation(); onChange(""); }}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                ) : (
                    <div className="p-6 flex flex-col items-center gap-2 text-center">
                        <Upload className={cn("h-8 w-8", uploading ? "text-primary animate-pulse" : "text-muted-foreground group-hover:text-primary transition-colors")} />
                        <p className="text-sm font-medium text-muted-foreground">
                            {uploading ? "Enviando..." : "Clique para enviar"}
                        </p>
                        <p className="text-xs text-muted-foreground/60">
                            {field === "animation_url" ? "MP4, GIF, WebM — máx 50MB" : "JPG, PNG, WebP — máx 50MB"}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Theme Options ────────────────────────────────────────────────────────────

const THEMES = [
    { value: "gold", label: "Dourado", bg: "from-amber-400 to-orange-500", text: "text-white" },
    { value: "dark", label: "Black", bg: "from-slate-800 to-slate-900", text: "text-white" },
    { value: "pink", label: "Rosa", bg: "from-pink-400 to-rose-500", text: "text-white" },
    { value: "blue", label: "Azul", bg: "from-blue-400 to-indigo-600", text: "text-white" },
    { value: "green", label: "Verde", bg: "from-emerald-400 to-teal-600", text: "text-white" },
    { value: "purple", label: "Roxo", bg: "from-violet-500 to-purple-700", text: "text-white" },
];

function getTheme(value: string | null) {
    return THEMES.find(t => t.value === value) ?? THEMES[0];
}

// ─── Gift Card Visual Preview ─────────────────────────────────────────────────

function GiftCardVisual({ card }: { card: Partial<GiftCard> }) {
    const theme = getTheme(card.theme ?? null);
    return (
        <div className={`relative rounded-2xl overflow-hidden bg-gradient-to-br ${theme.bg} p-6 aspect-[1.6/1] flex flex-col justify-between shadow-xl`}>
            {card.image_url && (
                <img src={card.image_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
            )}
            <div className={`relative flex justify-between items-start ${theme.text}`}>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Gift Card</p>
                    <h4 className="text-3xl font-bold tracking-tighter">
                        R$ {parseFloat(card.initial_value?.toString() ?? "0").toFixed(2)}
                    </h4>
                </div>
                <Gift className="h-8 w-8 opacity-40" />
            </div>
            <div className={`relative ${theme.text}`}>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Para</p>
                <p className="font-bold text-sm">{card.recipient_name || "Destinatário"}</p>
                {card.message && <p className="text-xs opacity-60 mt-1 line-clamp-1">{card.message}</p>}
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function GiftCardGenerator() {
    const { empresa } = useEmpresa();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<"list" | "batch">("list");

    const [formData, setFormData] = useState({
        amount: "",
        expiration: "",
        message: "",
        sender_name: "",
        recipient_name: "",
        animation_url: "",
        image_url: "",
        theme: "gold",
    });
    const [selectedCliente, setSelectedCliente] = useState<{ id: string; nome: string } | null>(null);

    const set = (key: keyof typeof formData) => (val: string) =>
        setFormData(prev => ({ ...prev, [key]: val }));

    const resetForm = () => {
        setFormData({ amount: "", expiration: "", message: "", sender_name: "", recipient_name: "", animation_url: "", image_url: "", theme: "gold" });
        setSelectedCliente(null);
    };

    // ── Queries ────────────────────────────────────────────────────────────────

    const { data: giftCards, isLoading } = useQuery({
        queryKey: ["gift_cards", empresa?.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("gift_cards")
                .select("*")
                .eq("empresa_id", empresa?.id)
                .order("created_at", { ascending: false });
            if (error) throw error;
            return data as GiftCard[];
        },
        enabled: !!empresa?.id,
    });

    // ── Mutations ──────────────────────────────────────────────────────────────

    const createMutation = useMutation({
        mutationFn: async () => {
            if (!empresa?.id) throw new Error("Empresa não encontrada");
            if (!formData.amount || isNaN(parseFloat(formData.amount))) {
                throw new Error("Informe o valor do gift card");
            }

            const code = `GC-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
            const value = parseFloat(formData.amount);

            const payload: any = {
                empresa_id: empresa.id,
                code,
                initial_value: value,
                balance: value,
                message: formData.message || null,
                sender_name: formData.sender_name || null,
                recipient_name: selectedCliente?.nome || formData.recipient_name || null,
                animation_url: formData.animation_url || null,
                image_url: formData.image_url || null,
                theme: formData.theme,
                expires_at: formData.expiration ? new Date(formData.expiration).toISOString() : null,
                status: "active",
            };

            if (selectedCliente) {
                payload.recipient_pessoa_id = selectedCliente.id;
            }

            const { error } = await supabase.from("gift_cards").insert([payload]);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["gift_cards"] });
            toast.success("Gift Card criado com sucesso!");
            setIsCreateOpen(false);
            resetForm();
        },
        onError: (err: Error) => toast.error(err.message),
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("gift_cards").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["gift_cards"] });
            toast.success("Gift card removido");
        },
    });

    // ── Filter ─────────────────────────────────────────────────────────────────

    const filtered = giftCards?.filter(c =>
        c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.recipient_name?.toLowerCase() ?? "").includes(searchTerm.toLowerCase())
    );

    const totalActive = giftCards?.reduce((acc, c) => acc + (c.status === "active" ? Number(c.balance) : 0), 0) ?? 0;
    const withMedia = giftCards?.filter(c => c.animation_url || (c as any).image_url).length ?? 0;
    const redeemRate = giftCards?.length
        ? ((giftCards.filter(c => c.balance < c.initial_value).length / giftCards.length) * 100).toFixed(0)
        : "0";

    // ── Render ─────────────────────────────────────────────────────────────────

    return (
        <div className="h-full flex flex-col gap-6 overflow-hidden">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
                <div className="space-y-0.5">
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl bg-background border border-border flex items-center justify-center shadow-sm">
                            <Gift className="h-4 w-4 text-foreground" />
                        </div>
                        Gift Cards
                    </h1>
                    <p className="text-sm text-muted-foreground ml-0.5">Crie e gerencie vale-presentes com animações e imagens</p>
                </div>
                <Button onClick={() => setIsCreateOpen(true)} className="h-10 rounded-xl shrink-0">
                    <Plus className="mr-2 h-4 w-4" /> Novo Gift Card
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
                {[
                    { icon: Gift, label: "Total Emitido", value: isLoading ? "..." : String(giftCards?.length ?? 0), color: "text-orange-500" },
                    { icon: RefreshCw, label: "Saldo Ativo", value: `R$ ${totalActive.toFixed(2)}`, color: "text-emerald-500" },
                    { icon: ImageIcon, label: "Com Mídia", value: String(withMedia), color: "text-blue-500" },
                    { icon: Sparkles, label: "Taxa Resgate", value: `${redeemRate}%`, color: "text-violet-500" },
                ].map(({ icon: Icon, label, value, color }) => (
                    <Card key={label} className="rounded-2xl border border-border bg-card">
                        <CardContent className="p-5 flex flex-col gap-3">
                            <div className={cn("w-8 h-8 rounded-lg bg-muted flex items-center justify-center", color)}>
                                <Icon className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</p>
                                <p className="text-xl font-bold text-foreground mt-0.5">{value}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Search */}
            <div className="relative shrink-0">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar por código ou destinatário..."
                    className="pl-11 h-11 rounded-xl"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Cards Grid */}
            <div className="flex-1 overflow-y-auto pr-1">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 pb-6">
                    {isLoading ? (
                        Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)
                    ) : filtered?.length === 0 ? (
                        <div className="col-span-full py-24 text-center">
                            <Gift className="h-14 w-14 mx-auto mb-4 text-muted-foreground/30" />
                            <p className="font-black uppercase tracking-widest text-muted-foreground/40 text-sm">Nenhum gift card encontrado</p>
                            <p className="text-xs text-muted-foreground/30 mt-1">Clique em "Novo Gift Card" para começar</p>
                        </div>
                    ) : (
                        filtered?.map((card) => {
                            const theme = getTheme(card.theme);
                            return (
                                <Card key={card.id} className="rounded-2xl border border-border overflow-hidden group hover:shadow-md transition-all duration-300">
                                    <CardContent className="p-0">
                                        {/* Card Visual */}
                                        <div className={`relative h-36 bg-gradient-to-br ${theme.bg} p-6 flex justify-between items-start`}>
                                            {(card as any).image_url && (
                                                <img src={(card as any).image_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
                                            )}
                                            <div className="relative">
                                                <p className={`text-[10px] font-black uppercase tracking-widest ${theme.text} opacity-60 mb-1`}>Saldo</p>
                                                <h4 className={`text-3xl font-bold tracking-tighter ${theme.text}`}>
                                                    R$ {Number(card.balance).toFixed(2)}
                                                </h4>
                                            </div>
                                            <div className="relative flex items-center gap-1.5">
                                                {card.animation_url && <Video className={`h-4 w-4 ${theme.text} opacity-60`} />}
                                                {(card as any).image_url && <ImageIcon className={`h-4 w-4 ${theme.text} opacity-60`} />}
                                            </div>
                                        </div>
                                        {/* Info */}
                                        <div className="p-5 bg-card space-y-4">
                                            <div className="flex justify-between items-end">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Para</p>
                                                    <h5 className="font-bold text-base leading-tight truncate">{card.recipient_name || "Voucher Geral"}</h5>
                                                    <code className="text-[10px] font-black text-primary bg-primary/10 px-2 py-1 rounded-lg mt-1.5 inline-block">{card.code}</code>
                                                </div>
                                                <div className="flex gap-1 ml-2">
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg" onClick={() => window.open(`/gift-card/${card.code}`, "_blank")}>
                                                        <Eye className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/gift-card/${card.code}`); toast.success("Link copiado!"); }}>
                                                        <Copy className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive" onClick={() => deleteMutation.mutate(card.id)}>
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center pt-3 border-t border-border">
                                                <Badge variant={card.status === "active" ? "default" : "secondary"} className="rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-widest">
                                                    {card.status === "active" ? "Ativo" : card.status === "used" ? "Usado" : card.status ?? "—"}
                                                </Badge>
                                                <p className="text-[10px] text-muted-foreground font-bold">
                                                    {card.created_at ? format(new Date(card.created_at), "dd/MM/yy") : "—"}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })
                    )}
                </div>
            </div>

            {/* ─── Create Sheet ─────────────────────────────────────────────────── */}
            <Sheet open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if (!open) resetForm(); }}>
                <SheetContent className="sm:max-w-lg flex flex-col h-full p-0 gap-0">
                    <SheetHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
                        <SheetTitle className="text-lg font-bold flex items-center gap-2">
                            <Gift className="h-5 w-5 text-primary" /> Criar Gift Card
                        </SheetTitle>
                        <SheetDescription className="text-sm text-muted-foreground">
                            Configure o vale-presente com mensagem personalizada, imagem e animação.
                        </SheetDescription>
                    </SheetHeader>

                    {/* Scrollable Form */}
                    <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

                        {/* Live Preview */}
                        <GiftCardVisual card={{ ...formData, initial_value: parseFloat(formData.amount) || 0, image_url: formData.image_url, recipient_name: selectedCliente?.nome || formData.recipient_name }} />

                        {/* ── Para (Cliente) ── */}
                        <div className="space-y-3">
                            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Para (Destinatário)</Label>

                            <Tabs defaultValue="cliente" className="w-full">
                                <TabsList className="w-full rounded-xl h-9 mb-3">
                                    <TabsTrigger value="cliente" className="flex-1 text-xs">Da carteira de clientes</TabsTrigger>
                                    <TabsTrigger value="manual" className="flex-1 text-xs">Digitar manualmente</TabsTrigger>
                                </TabsList>

                                <TabsContent value="cliente" className="mt-0">
                                    {empresa?.id ? (
                                        <ClienteSearch
                                            empresaId={empresa.id}
                                            value={selectedCliente}
                                            onChange={(c) => {
                                                setSelectedCliente(c);
                                                if (c) setFormData(p => ({ ...p, recipient_name: c.nome }));
                                            }}
                                        />
                                    ) : (
                                        <p className="text-sm text-muted-foreground">Empresa não carregada</p>
                                    )}
                                    {selectedCliente && (
                                        <div className="mt-2 flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-xl px-3 py-2">
                                            <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                                            <span className="text-sm font-medium text-primary">{selectedCliente.nome}</span>
                                        </div>
                                    )}
                                </TabsContent>

                                <TabsContent value="manual" className="mt-0">
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            className="pl-10 h-11"
                                            placeholder="Nome do destinatário"
                                            value={formData.recipient_name}
                                            onChange={e => set("recipient_name")(e.target.value)}
                                        />
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>

                        {/* ── De ── */}
                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">De (Remetente)</Label>
                            <Input
                                className="h-11"
                                placeholder="Seu nome ou empresa"
                                value={formData.sender_name}
                                onChange={e => set("sender_name")(e.target.value)}
                            />
                        </div>

                        {/* ── Valor e Validade ── */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Valor (R$) *</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="h-11 font-semibold"
                                    placeholder="0,00"
                                    value={formData.amount}
                                    onChange={e => set("amount")(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Expira em</Label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="date"
                                        className="pl-10 h-11"
                                        value={formData.expiration}
                                        onChange={e => set("expiration")(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* ── Mensagem ── */}
                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Mensagem</Label>
                            <Textarea
                                className="min-h-[80px] resize-none"
                                placeholder="Escreva algo especial..."
                                value={formData.message}
                                onChange={e => set("message")(e.target.value)}
                            />
                        </div>

                        {/* ── Tema ── */}
                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Tema Visual</Label>
                            <div className="grid grid-cols-6 gap-2">
                                {THEMES.map(t => (
                                    <button
                                        key={t.value}
                                        type="button"
                                        onClick={() => set("theme")(t.value)}
                                        className={cn(
                                            "relative h-10 rounded-xl bg-gradient-to-br transition-all",
                                            t.bg,
                                            formData.theme === t.value
                                                ? "ring-2 ring-primary ring-offset-2 scale-95"
                                                : "hover:scale-95 opacity-80 hover:opacity-100"
                                        )}
                                        title={t.label}
                                    >
                                        {formData.theme === t.value && (
                                            <CheckCircle2 className="h-4 w-4 text-white absolute inset-0 m-auto" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* ── Mídia ── */}
                        {empresa?.id && (
                            <div className="space-y-4">
                                <MediaUpload
                                    label="Imagem de fundo"
                                    accept="image/jpeg,image/png,image/webp,image/gif"
                                    field="image_url"
                                    value={formData.image_url}
                                    onChange={set("image_url")}
                                    empresaId={empresa.id}
                                />
                                <MediaUpload
                                    label="Animação / Vídeo surpresa"
                                    accept="video/mp4,video/webm,image/gif"
                                    field="animation_url"
                                    value={formData.animation_url}
                                    onChange={set("animation_url")}
                                    empresaId={empresa.id}
                                />
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-border bg-muted/30 shrink-0">
                        <Button
                            className="w-full h-12 rounded-xl font-semibold"
                            onClick={() => createMutation.mutate()}
                            disabled={createMutation.isPending || !formData.amount}
                        >
                            {createMutation.isPending ? (
                                <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Emitindo...</>
                            ) : (
                                <><Gift className="mr-2 h-4 w-4" /> Emitir Gift Card</>
                            )}
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
