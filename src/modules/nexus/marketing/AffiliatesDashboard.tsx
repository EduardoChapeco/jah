
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Plus,
    Search,
    MoreHorizontal,
    Users,
    Share2,
    DollarSign,
    QrCode,
    Download,
    Mail,
    ArrowRight,
    TrendingUp,
    Filter
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useParams } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";


type AffiliateRow = Database["public"]["Tables"]["affiliates"]["Row"];
type AffiliateWithCampaign = AffiliateRow & {
    campaign: {
        nome: string;
    } | null;
};
type AffiliateFormData = {
    name: string;
    email: string;
    campaign_id: string;
    code: string;
};

export default function AffiliatesDashboard() {
    const { id: empresaId } = useParams<{ id: string }>();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedAffiliate, setSelectedAffiliate] = useState<AffiliateRow | null>(null);
    const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingAffiliate, setEditingAffiliate] = useState<AffiliateRow | null>(null);
    const [formData, setFormData] = useState<AffiliateFormData>({
        name: "",
        email: "",
        campaign_id: "",
        code: "",
    });

    const { data: affiliates, isLoading } = useQuery({
        queryKey: ["affiliates", empresaId],
        queryFn: async () => {
            if (!empresaId) return [];
            const { data, error } = await supabase
                .from("affiliates")
                .select("*, campaign:eventos_campanhas(nome)")
                .order("created_at", { ascending: false });
            if (error) throw error;
            return data as AffiliateWithCampaign[];
        },
        enabled: Boolean(empresaId),
    });

    const { data: campaigns } = useQuery({
        queryKey: ["campaigns", empresaId],
        queryFn: async () => {
            if (!empresaId) return [];
            const { data, error } = await supabase
                .from("eventos_campanhas")
                .select("id, nome")
                .eq("empresa_id", empresaId)
                .eq("status", "active");
            if (error) throw error;
            return data.map(c => ({ id: c.id, title: c.nome }));
        },
        enabled: Boolean(empresaId),
    });

    const mutation = useMutation({
        mutationFn: async (payload: AffiliateFormData) => {
            if (editingAffiliate) {
                const { error } = await supabase
                    .from("affiliates")
                    .update(payload)
                    .eq("id", editingAffiliate.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from("affiliates")
                    .insert([{ ...payload, email: payload.email || null, empresa_id: empresaId!, clicks: 0, conversions: 0, total_commission: 0 }]);
                if (error) throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["affiliates", empresaId] });
            toast.success(editingAffiliate ? "Afiliado atualizado!" : "Afiliado criado!");
            setIsSheetOpen(false);
            resetForm();
        },
        onError: (err: Error) => {
            toast.error("Erro ao salvar afiliado", { description: err.message });
        }
    });

    const resetForm = () => {
        setFormData({ name: "", email: "", campaign_id: "", code: "" });
        setEditingAffiliate(null);
    };

    const handleEdit = (affiliate: AffiliateRow) => {
        setEditingAffiliate(affiliate);
        setFormData({
            name: affiliate.name,
            email: affiliate.email || "",
            campaign_id: affiliate.campaign_id,
            code: affiliate.code,
        });
        setIsSheetOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate(formData);
    };

    const filteredAffiliates = affiliates?.filter((aff) =>
        aff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        aff.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleOpenQrCode = (affiliate: AffiliateRow) => {
        setSelectedAffiliate(affiliate);
        setIsQrDialogOpen(true);
    };

    const downloadQrCode = () => {
        const canvas = document.getElementById("qr-code-canvas") as HTMLCanvasElement;
        if (canvas) {
            const pngUrl = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
            const downloadLink = document.createElement("a");
            downloadLink.href = pngUrl;
            downloadLink.download = `qrcode-${selectedAffiliate?.code}.png`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        }
    };

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Header & Stats */}
            <div className="space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-4">
                    <div className="space-y-1">
                        <h1 className="text-5xl font-black tracking-tighter text-gray-900 leading-tight">Afiliados</h1>
                        <p className="text-gray-400 font-medium tracking-tight">Gerencie sua rede de promotores e acompanhe o desempenho.</p>
                    </div>
                    <Button
                        onClick={() => { resetForm(); setIsSheetOpen(true); }}
                        className="h-16 px-8 rounded-lg bg-Event I/OS-dark hover:bg-black text-white font-black text-xs tracking-widest uppercase shadow-xl shadow-Event I/OS-dark/10 transition-all flex items-center gap-3"
                    >
                        + NOVO AFILIADO
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <Card className="rounded-lg border-none bg-white shadow-sm p-10 flex flex-col justify-between h-56 group hover:shadow-2xl transition-all duration-500">
                        <div className="w-14 h-14 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Users className="h-7 w-7 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Total Ativos</p>
                            <h3 className="text-5xl font-black text-gray-900 tracking-tighter">{affiliates?.length || 0}</h3>
                        </div>
                    </Card>
                    <Card className="rounded-lg border-none bg-white shadow-sm p-10 flex flex-col justify-between h-56 group hover:shadow-2xl transition-all duration-500">
                        <div className="w-14 h-14 rounded-lg bg-green-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <TrendingUp className="h-7 w-7 text-green-500" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Cliques Totais</p>
                            <h3 className="text-5xl font-black text-gray-900 tracking-tighter">
                                {affiliates?.reduce((acc: number, curr) => acc + (curr.clicks || 0), 0) || 0}
                            </h3>
                        </div>
                    </Card>
                    <Card className="rounded-lg border-none bg-Event I/OS-dark p-10 flex flex-col justify-between h-56 group hover:shadow-2xl shadow-Event I/OS-dark/20 transition-all duration-500">
                        <div className="w-14 h-14 rounded-lg bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <DollarSign className="h-7 w-7 text-white" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-2">Comissões</p>
                            <h3 className="text-5xl font-black text-white tracking-tighter">
                                R$ {affiliates?.reduce((acc: number, curr) => acc + (curr.total_commission || 0), 0).toFixed(0) || '0'}
                            </h3>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Quick Actions (Hero Style) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Button variant="ghost" className="h-24 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-start px-8 gap-6 group transition-all">
                    <div className="w-12 h-12 rounded-lg bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="text-left">
                        <p className="font-black text-gray-900">Enviar Convite</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Por E-mail ou Link</p>
                    </div>
                    <ArrowRight className="h-5 w-5 ml-auto text-gray-200 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button variant="ghost" className="h-24 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-start px-8 gap-6 group transition-all">
                    <div className="w-12 h-12 rounded-lg bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                        <DollarSign className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="text-left">
                        <p className="font-black text-gray-900">Configurar Comissões</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Global ou por Campanha</p>
                    </div>
                    <ArrowRight className="h-5 w-5 ml-auto text-gray-200 group-hover:translate-x-1 transition-transform" />
                </Button>
            </div>

            {/* Affiliates List */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-4">
                    <h3 className="text-3xl font-black text-gray-900 tracking-tighter">Promotores</h3>
                    <div className="flex items-center gap-2">
                        <div className="relative hidden md:block">
                            <Search className="absolute left-4 top-3.5 h-4 w-4 text-gray-300" />
                            <Input
                                placeholder="Buscar..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="h-11 pl-11 w-64 rounded-lg bg-gray-50 border-none font-bold text-xs"
                            />
                        </div>
                        <Button variant="ghost" size="icon" className="rounded-lg h-11 w-11 text-gray-400 hover:bg-gray-50">
                            <Filter className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="rounded-lg h-11 w-11 text-gray-400 hover:bg-gray-50">
                            <Download className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                <AnimatePresence mode="popLayout">
                    {filteredAffiliates?.length === 0 ? (
                        <motion.div
                            className="py-24 flex flex-col items-center justify-center text-center opacity-40"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        >
                            <Users className="h-16 w-16 mb-6 text-gray-200" />
                            <h3 className="text-xl font-bold">Nenhum promotor encontrado</h3>
                            <p className="text-sm font-medium">Comece adicionando seu primeiro parceiro de vendas.</p>
                        </motion.div>
                    ) : (
                        <div className="space-y-4">
                            {filteredAffiliates?.map((aff, idx) => (
                                <motion.div
                                    key={aff.id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="group"
                                >
                                    <Card className="rounded-lg border-none bg-white hover:shadow-xl transition-all duration-500 group border border-black/[0.03]">
                                        <CardContent className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-8">
                                            <div className="flex items-center gap-6">
                                                <Avatar className="h-16 w-16 rounded-lg shadow-sm group-hover:scale-105 transition-transform">
                                                    <AvatarImage src={`https://ui-avatars.com/api/?name=${aff.name}&background=f3f4f6&color=111827&bold=true`} />
                                                    <AvatarFallback className="rounded-lg font-black">{aff.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-black text-gray-900 text-2xl tracking-tighter leading-none mb-1">{aff.name}</p>
                                                    <p className="text-xs text-primary font-black uppercase tracking-[0.2em]">
                                                        {aff.campaign?.nome || 'Campanha Direta'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-16">
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Código</p>
                                                    <code className="text-sm font-black text-gray-900">{aff.code}</code>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Cliques</p>
                                                    <p className="text-sm font-black text-gray-900">{aff.clicks || 0}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Conversão</p>
                                                    <p className="text-sm font-black text-indigo-600">
                                                        {aff.clicks ? ((Number(aff.conversions) / Number(aff.clicks)) * 100).toFixed(1) : "0.0"}%
                                                    </p>
                                                </div>
                                                <div className="hidden md:block">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Comissão</p>
                                                    <p className="text-sm font-black text-emerald-600">
                                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(aff.total_commission || 0)}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={(e) => { e.stopPropagation(); handleOpenQrCode(aff); }}
                                                    className="rounded-lg h-11 w-11 text-gray-300 group-hover:text-gray-900 hover:bg-white shadow-sm transition-all"
                                                >
                                                    <QrCode className="h-5 w-5" />
                                                </Button>

                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="rounded-lg h-11 w-11 text-gray-300 group-hover:text-gray-900 hover:bg-white shadow-sm transition-all">
                                                            <MoreHorizontal className="h-5 w-5" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="rounded-lg w-56 p-2 shadow-2xl border-none">
                                                        <DropdownMenuItem
                                                            onClick={(e) => { e.stopPropagation(); handleEdit(aff); }}
                                                            className="rounded-lg p-3 font-bold text-xs"
                                                        >
                                                            Editar Perfil
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="rounded-lg p-3 font-bold text-xs">Ver Performance</DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="rounded-lg p-3 font-bold text-xs"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                navigator.clipboard.writeText(`eventios.com/ref/${aff.code}`);
                                                                toast.success("Link copiado!");
                                                            }}
                                                        >
                                                            Copiar Link
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator className="bg-gray-50 my-1 mx-2" />
                                                        <DropdownMenuItem
                                                            className="rounded-lg p-3 font-bold text-xs text-destructive"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            Desativar Afiliado
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

            <Sheet open={isQrDialogOpen} onOpenChange={setIsQrDialogOpen}>
                <SheetContent className="sm:max-w-md bg-white/80  border-white/20 shadow-2xl rounded-lg m-4 h-auto max-h-[85vh]">
                    <div className="flex flex-col items-center justify-center space-y-8 py-8">
                        <SheetHeader className="text-center space-y-2">
                            <SheetTitle className="text-2xl font-black tracking-tighter">{selectedAffiliate?.name}</SheetTitle>
                            <SheetDescription className="font-bold text-[10px] uppercase tracking-[0.2em]">{selectedAffiliate?.code}</SheetDescription>
                        </SheetHeader>

                        <div className="bg-white p-8 rounded-lg shadow-2xl border-2 border-gray-100">
                            {selectedAffiliate && (
                                <QRCodeCanvas
                                    id="qr-code-canvas"
                                    value={`https://eventios.com/ref/${selectedAffiliate.code}`}
                                    size={220}
                                    level={"H"}
                                    includeMargin={true}
                                />
                            )}
                        </div>

                        <Button
                            onClick={downloadQrCode}
                            className="w-full h-16 rounded-lg bg-Event I/OS-dark hover:bg-black text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-Event I/OS-dark/10"
                        >
                            <Download className="mr-2 h-4 w-4" /> Baixar QR Code (PNG)
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent side="right" className="w-full sm:max-w-[500px] border-none shadow-2xl rounded-l-[48px] p-0 overflow-y-auto bg-white/95 ">
                    <div className="flex flex-col min-h-full">
                        <div className="p-12 space-y-2">
                            <h2 className="text-4xl font-black tracking-tighter text-gray-900">{editingAffiliate ? 'Editar' : 'Novo Afiliado'}</h2>
                            <p className="text-gray-400 font-medium">Configure seu promotor e vincule a uma campanha ativa.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 px-12 py-4 space-y-10">
                            <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Nome Completo</Label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="h-14 rounded-lg bg-gray-50 border-none px-6 font-bold text-lg"
                                    required
                                />
                            </div>

                            <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Email</Label>
                                <Input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="h-14 rounded-lg bg-gray-50 border-none px-6 font-bold text-lg"
                                />
                            </div>

                            <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Campanha</Label>
                                <Select
                                    value={formData.campaign_id}
                                    onValueChange={(value) => setFormData({ ...formData, campaign_id: value })}
                                    required
                                >
                                    <SelectTrigger className="h-14 rounded-lg bg-gray-50 border-none px-6 font-bold text-lg">
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-lg border-none shadow-2xl">
                                        {campaigns?.map((camp: { id: string; title: string }) => (
                                            <SelectItem key={camp.id} value={camp.id} className="rounded-lg p-3 font-bold">{camp.title}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Código (Slug)</Label>
                                <Input
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s/g, '') })}
                                    className="h-14 rounded-lg bg-gray-50 border-none px-6 font-black text-xl"
                                    required
                                />
                            </div>

                            <div className="pt-8">
                                <Button
                                    type="submit"
                                    className="w-full h-18 py-6 rounded-lg bg-Event I/OS-dark hover:bg-black text-white font-black uppercase tracking-widest text-xs shadow-2xl shadow-Event I/OS-dark/20"
                                    disabled={mutation.isPending}
                                >
                                    {mutation.isPending ? 'SALVANDO...' : (editingAffiliate ? 'SALVAR ALTERAÇÕES' : 'CADASTRAR AFILIADO')}
                                </Button>
                            </div>
                        </form>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
