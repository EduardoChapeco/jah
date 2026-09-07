
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Plus,
    Search,
    Ticket,
    Gift,
    TrendingUp,
    Calendar,
    MoreHorizontal,
    Percent,
    DollarSign,
    Filter,
    Download,
    Mail,
    Copy,
    Trash2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useParams } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function CouponsManagement() {
    const { id: empresaId } = useParams<{ id: string }>();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<any>(null);
    const [formData, setFormData] = useState({
        code: "",
        discount_type: "percentage",
        discount_value: 0,
        campaign_id: "",
        max_uses: "",
        expires_at: "",
    });

    const { data: coupons, isLoading } = useQuery({
        queryKey: ["coupons", empresaId],
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from("coupons")
                .select("*, campaigns(title)")
                .eq("empresa_id", empresaId)
                .order("created_at", { ascending: false });
            if (error) throw error;
            return data;
        },
    });

    const { data: campaigns } = useQuery({
        queryKey: ["active-campaigns", empresaId],
        queryFn: async () => {
            const { data, error } = await (supabase
                .from as any)("campaigns")
                .select("id, title")
                .eq("empresa_id", empresaId)
                .eq("status", "active");
            if (error) throw error;
            return data;
        },
    });

    const mutation = useMutation({
        mutationFn: async (payload: any) => {
            const cleanPayload = {
                ...payload,
                empresa_id: empresaId,
                max_uses: payload.max_uses ? parseInt(payload.max_uses) : null,
                expires_at: payload.expires_at || null,
                campaign_id: payload.campaign_id || null
            };

            if (editingCoupon) {
                const { error } = await supabase
                    .from("coupons")
                    .update(cleanPayload)
                    .eq("id", editingCoupon.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from("coupons")
                    .insert([cleanPayload]);
                if (error) throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["coupons", empresaId] });
            toast.success("Cupom salvo!");
            setIsSheetOpen(false);
            resetForm();
        },
        onError: (err: any) => {
            toast.error("Erro ao salvar cupom", { description: err.message });
        }
    });

    const resetForm = () => {
        setFormData({
            code: "",
            discount_type: "percentage",
            discount_value: 0,
            campaign_id: "",
            max_uses: "",
            expires_at: "",
        });
        setEditingCoupon(null);
    };

    const handleEdit = (coupon: any) => {
        setEditingCoupon(coupon);
        setFormData({
            code: coupon.code,
            discount_type: coupon.discount_type,
            discount_value: coupon.discount_value,
            campaign_id: coupon.campaign_id || "",
            max_uses: coupon.max_uses?.toString() || "",
            expires_at: coupon.expires_at ? new Date(coupon.expires_at).toISOString().slice(0, 16) : "",
        });
        setIsSheetOpen(true);
    };

    const handleDelete = async (id: string) => {
        const { error } = await supabase.from("coupons").delete().eq("id", id);
        if (error) {
            toast.error("Erro ao excluir");
        } else {
            toast.success("Cupom excluído");
            queryClient.invalidateQueries({ queryKey: ["coupons", empresaId] });
        }
    };

    const filteredCoupons = coupons?.filter(c =>
        c.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Header */}
            <div className="space-y-8 px-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-1">
                        <h1 className="text-5xl font-black tracking-tighter text-gray-900 leading-tight">Cupons</h1>
                        <p className="text-gray-400 font-medium tracking-tight">Crie descontos exclusivos e cartões-presente para sua audiência.</p>
                    </div>
                    <Button
                        onClick={() => { resetForm(); setIsSheetOpen(true); }}
                        className="h-16 px-8 rounded-lg bg-eventio-dark hover:bg-black text-white font-black text-xs tracking-widest uppercase shadow-xl shadow-eventio-dark/10 transition-all flex items-center gap-3"
                    >
                        + NOVO CUPOM
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <Card className="rounded-lg border-none bg-white shadow-sm p-10 flex flex-col justify-between h-56 group hover:shadow-2xl transition-all duration-500">
                        <div className="w-14 h-14 rounded-lg bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Ticket className="h-7 w-7 text-purple-500" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Cupons Ativos</p>
                            <h3 className="text-5xl font-black text-gray-900 tracking-tighter">{coupons?.filter(c => c.is_active).length || 0}</h3>
                        </div>
                    </Card>
                    <Card className="rounded-lg border-none bg-white shadow-sm p-10 flex flex-col justify-between h-56 group hover:shadow-2xl transition-all duration-500">
                        <div className="w-14 h-14 rounded-lg bg-orange-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <TrendingUp className="h-7 w-7 text-orange-500" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Total de Usos</p>
                            <h3 className="text-5xl font-black text-gray-900 tracking-tighter">
                                {coupons?.reduce((acc, curr) => acc + (curr.used_count || 0), 0) || 0}
                            </h3>
                        </div>
                    </Card>
                    <Card className="rounded-lg border-none bg-eventio-dark p-10 flex flex-col justify-between h-56 group hover:shadow-2xl shadow-eventio-dark/20 transition-all duration-500">
                        <div className="w-14 h-14 rounded-lg bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Gift className="h-7 w-7 text-white" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-2">Impacto Total</p>
                            <h3 className="text-5xl font-black text-white tracking-tighter">R$ 1.250</h3>
                        </div>
                    </Card>
                </div>
            </div>

            {/* List */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-4">
                    <h3 className="text-3xl font-black text-gray-900 tracking-tighter">Gerenciar Cupons</h3>
                    <div className="flex items-center gap-4">
                        <div className="relative hidden md:block">
                            <Search className="absolute left-4 top-3.5 h-4 w-4 text-gray-300" />
                            <Input
                                placeholder="Buscar código..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="h-11 pl-11 w-64 rounded-lg bg-gray-50 border-none font-bold text-xs"
                            />
                        </div>
                        <Button variant="ghost" size="icon" className="rounded-lg h-11 w-11 text-gray-400">
                            <Filter className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                <AnimatePresence mode="popLayout">
                    {filteredCoupons?.length === 0 ? (
                        <div className="py-24 text-center rounded-lg border-2 border-dashed border-black/5 bg-gray-50/30 flex flex-col items-center justify-center">
                            <div className="w-20 h-20 rounded-lg bg-white shadow-sm flex items-center justify-center mb-6">
                                <Ticket className="h-10 w-10 text-gray-200" />
                            </div>
                            <p className="font-black text-gray-900 text-lg">Nenhum cupom encontrado</p>
                            <p className="text-sm text-gray-400 font-bold mt-1 uppercase tracking-widest">Tente buscar por outro código ou crie um novo.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredCoupons?.map((c, idx) => (
                                <motion.div
                                    key={c.id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                >
                                    <Card className="rounded-lg border-none bg-white hover:shadow-xl transition-all duration-500 group border border-black/[0.03]">
                                        <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-8">
                                            <div className="flex items-center gap-6">
                                                <div className="w-16 h-16 rounded-lg bg-gray-50 flex items-center justify-center border border-black/[0.03] group-hover:bg-primary/5 transition-colors">
                                                    {c.discount_type === 'percentage' ? (
                                                        <Percent className="h-7 w-7 text-gray-400 group-hover:text-primary transition-colors" />
                                                    ) : (
                                                        <DollarSign className="h-7 w-7 text-gray-400 group-hover:text-primary transition-colors" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-black text-gray-900 text-2xl tracking-tighter uppercase leading-none mb-1">{c.code}</p>
                                                    <p className="text-xs text-primary font-black tracking-[0.2em] uppercase">
                                                        {c.discount_type === 'percentage' ? `${c.discount_value}% EXTRA OFF` : `R$ ${c.discount_value} OFF`}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-8">
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Status</p>
                                                    <Badge className={cn(
                                                        "rounded-lg font-black text-[10px]",
                                                        c.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"
                                                    )}>
                                                        {c.is_active ? 'ATIVO' : 'INATIVO'}
                                                    </Badge>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Usos</p>
                                                    <p className="text-sm font-black text-gray-900">{c.used_count || 0} / {c.max_uses || '∞'}</p>
                                                </div>
                                                <div className="hidden md:block">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Campanha</p>
                                                    <p className="text-sm font-black text-gray-900 truncate max-w-[120px]">
                                                        {c.campaigns?.title || 'Livre'}
                                                    </p>
                                                </div>
                                                <div className="hidden md:block">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Expira em</p>
                                                    <p className="text-sm font-black text-gray-900">
                                                        {c.expires_at ? format(new Date(c.expires_at), 'dd/MM/yy', { locale: ptBR }) : 'Nunca'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="rounded-lg h-12 w-12 text-gray-300 hover:text-gray-900 hover:bg-black/5"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigator.clipboard.writeText(c.code);
                                                        toast.success("Código copiado!");
                                                    }}
                                                >
                                                    <Copy className="h-5 w-5" />
                                                </Button>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="rounded-lg h-12 w-12 text-gray-300 hover:text-gray-900 hover:bg-black/5">
                                                            <MoreHorizontal className="h-5 w-5" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="rounded-lg w-64 p-3 border-none shadow-2xl glass">
                                                        <DropdownMenuItem onClick={() => handleEdit(c)} className="rounded-lg p-4 font-black text-xs uppercase tracking-widest">
                                                            EDITAR CUPOM
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="rounded-lg p-4 font-black text-xs uppercase tracking-widest">
                                                            PAUSAR ATIVIDADE
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator className="bg-black/5 my-2 mx-2" />
                                                        <DropdownMenuItem onClick={() => handleDelete(c.id)} className="rounded-lg p-4 font-black text-xs uppercase tracking-widest text-red-500 hover:bg-red-50">
                                                            EXCLUIR PERMANENTEMENTE
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* Editor Sheet */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent side="right" className="w-full sm:max-w-[500px] border-none shadow-2xl rounded-l-[48px] p-0 overflow-y-auto">
                    <div className="flex flex-col min-h-full">
                        <div className="p-12 space-y-2">
                            <h2 className="text-4xl font-black tracking-tighter text-gray-900">{editingCoupon ? 'Editar' : 'Novo Cupom'}</h2>
                            <p className="text-gray-400 font-medium">Configure as regras de desconto e validade do código.</p>
                        </div>

                        <div className="flex-1 px-12 py-4 space-y-12">
                            <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 px-1">Código do Cupom</Label>
                                <Input
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s/g, '') })}
                                    className="h-16 rounded-lg bg-gray-50 border-none px-8 font-black text-3xl uppercase tracking-tighter shadow-inner focus:ring-primary/10"
                                    placeholder="PROMO2026"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Tipo</Label>
                                    <Select
                                        value={formData.discount_type}
                                        onValueChange={(v) => setFormData({ ...formData, discount_type: v })}
                                    >
                                        <SelectTrigger className="h-14 rounded-lg bg-gray-50 border-none px-6 font-bold">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-lg border-none shadow-2xl">
                                            <SelectItem value="percentage" className="rounded-lg font-bold">Porcentagem</SelectItem>
                                            <SelectItem value="fixed" className="rounded-lg font-bold">Valor Fixo</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Valor</Label>
                                    <Input
                                        type="number"
                                        value={formData.discount_value}
                                        onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) })}
                                        className="h-14 rounded-lg bg-gray-50 border-none px-6 font-bold text-lg"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Vincular Campanha (Opcional)</Label>
                                <Select
                                    value={formData.campaign_id}
                                    onValueChange={(v) => setFormData({ ...formData, campaign_id: v })}
                                >
                                    <SelectTrigger className="h-14 rounded-lg bg-gray-50 border-none px-6 font-bold">
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-lg border-none shadow-2xl">
                                        <SelectItem value="" className="rounded-lg font-bold">Nenhuma</SelectItem>
                                        {campaigns?.map(c => (
                                            <SelectItem key={c.id} value={c.id} className="rounded-lg font-bold">{c.title}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Limite Usos</Label>
                                    <Input
                                        placeholder="Ex: 100"
                                        value={formData.max_uses}
                                        onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                                        className="h-14 rounded-lg bg-gray-50 border-none px-6 font-bold"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Validade</Label>
                                    <Input
                                        type="datetime-local"
                                        value={formData.expires_at}
                                        onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                                        className="h-14 rounded-lg bg-gray-50 border-none px-6 font-bold text-xs"
                                    />
                                </div>
                            </div>

                            <div className="pt-12 pb-12">
                                <Button
                                    onClick={() => mutation.mutate(formData)}
                                    className="w-full h-20 py-6 rounded-lg bg-eventio-dark hover:bg-black text-white font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-eventio-dark/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                    disabled={mutation.isPending}
                                >
                                    {mutation.isPending ? 'PROCESSANDO...' : (editingCoupon ? 'SALVAR ALTERAÇÕES' : 'CONFIRMAR CRIAÇÃO')}
                                </Button>
                            </div>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
