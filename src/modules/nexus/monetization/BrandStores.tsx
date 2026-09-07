import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
    ShoppingBag,
    Plus,
    Search,
    Filter,
    TrendingUp,
    Store,
    Tag,
    Image as ImageIcon,
    MoreVertical,
    Star,
    ArrowUpRight,
    QrCode,
    BarChart3
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function BrandStores() {
    const { id: empresaId } = useParams<{ id: string }>();
    const [searchTerm, setSearchTerm] = useState("");

    // Real Products for the Store
    const { data: products, isLoading } = useQuery({
        queryKey: ["brand-products", empresaId],
        queryFn: async () => {
            // First get products
            const { data: productsData, error: pError } = await supabase
                .from('brand_products')
                .select('*')
                .eq('empresa_id', empresaId);
            
            if (pError) throw pError;

            // Then get sales counts for each product
            // We'll try to fetch from brand_order_items. If it fails (table not exists), we default to 0.
            const { data: salesData, error: sError } = await supabase
                .from('brand_order_items')
                .select('product_id, quantity');
            
            const salesMap: Record<string, number> = {};
            if (!sError && salesData) {
                salesData.forEach((item: any) => {
                    salesMap[item.product_id] = (salesMap[item.product_id] || 0) + (item.quantity || 0);
                });
            }

            return productsData.map(p => ({
                id: p.id,
                name: p.name,
                price: Number(p.price),
                stock: p.stock_quantity || 0,
                sales: salesMap[p.id] || 0,
                image: p.image_url || "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=60",
                category: p.category || "Geral",
                status: (p.stock_quantity || 0) < 10 ? "stock_low" : "active"
            }));
        },
        enabled: !!empresaId
    });

    // Real KPIs
    const { data: kpis } = useQuery({
        queryKey: ["brand-kpis", empresaId, products],
        queryFn: async () => {
            const { data: orders, error } = await supabase
                .from('brand_orders')
                .select('*')
                .eq('empresa_id', empresaId);
            
            if (error) throw error;

            const totalRevenue = orders.reduce((acc, curr) => acc + Number(curr.total_amount), 0);
            const activeOrders = orders.filter(o => o.status === 'pending').length;

            // Determine Top Product
            const topProduct = products?.reduce((prev, current) => (prev.sales > current.sales) ? prev : current);
            const topProductName = topProduct && topProduct.sales > 0 ? topProduct.name : "---";
            const topProductSales = topProduct ? topProduct.sales : 0;

            return [
                { label: "Receita Total", value: `R$ ${totalRevenue.toLocaleString()}`, trend: "+100%", sub: "total acumulado", icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
                { label: "Pedidos Ativos", value: activeOrders.toString(), trend: `${orders.length} total`, sub: "aguardando retirada", icon: ShoppingBag, color: "text-blue-600", bg: "bg-blue-50" },
                { label: "Top Produto", value: topProductName, trend: `${topProductSales} vendas`, sub: "recorde do evento", icon: Star, color: "text-amber-600", bg: "bg-amber-50" },
            ];
        },
        enabled: !!empresaId && !!products
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-16">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase">BrandStore</h1>
                    <p className="text-slate-500 font-bold">Gestão de E-commerce e Merchandise oficial.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="h-12 rounded-xl font-bold border-2">
                        <BarChart3 className="h-4 w-4 mr-2" /> Relatórios
                    </Button>
                    <Button className="h-12 rounded-xl bg-slate-900 text-white font-bold px-6">
                        <Plus className="h-5 w-5 mr-2" /> Novo Produto
                    </Button>
                </div>
            </div>

            {/* Top KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(kpis || [
                    { label: "Receita Total", value: "R$ 0", trend: "0%", sub: "sem vendas", icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
                    { label: "Pedidos Ativos", value: "0", trend: "0 total", sub: "sem pedidos", icon: ShoppingBag, color: "text-blue-600", bg: "bg-blue-50" },
                    { label: "Top Produto", value: "---", trend: "0 vendas", sub: "sem dados", icon: Star, color: "text-amber-600", bg: "bg-amber-50" },
                ]).map((kpi, i) => (
                    <Card key={i} className="border-none shadow-sm overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">{kpi.label}</CardTitle>
                            <div className={`p-2 rounded-lg ${kpi.bg} ${kpi.color}`}>
                                <kpi.icon className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-black">{kpi.value}</div>
                            <p className="text-xs font-bold text-slate-500 mt-1">
                                <span className={kpi.trend.startsWith('+') ? "text-emerald-600" : "text-amber-600"}>{kpi.trend}</span> {kpi.sub}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                        placeholder="Buscar por nome ou categoria..." 
                        className="pl-11 h-12 rounded-xl border-none bg-white shadow-sm font-bold"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" className="h-12 px-6 rounded-xl bg-white shadow-sm font-bold">
                        <Filter className="h-4 w-4 mr-2" /> Categorias
                    </Button>
                    <Button variant="ghost" className="h-12 px-6 rounded-xl bg-white shadow-sm font-bold">
                        <QrCode className="h-4 w-4 mr-2" /> QR Store
                    </Button>
                </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {isLoading ? (
                    Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-96 rounded-2xl" />)
                ) : (
                    products?.map((product) => (
                        <Card key={product.id} className="border-none shadow-none bg-white rounded-2xl overflow-hidden group">
                            <div className="aspect-[4/3] overflow-hidden relative">
                                <img 
                                    src={product.image} 
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                    alt={product.name}
                                />
                                <div className="absolute top-4 left-4 flex gap-2">
                                    <Badge className="bg-white/90 text-slate-900 border-none font-black text-[10px] uppercase">
                                        {product.category}
                                    </Badge>
                                    {product.status === 'stock_low' && (
                                        <Badge className="bg-rose-500 text-white border-none font-black text-[10px] uppercase">
                                            Estoque Baixo
                                        </Badge>
                                    )}
                                </div>
                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="secondary" size="icon" className="rounded-xl h-8 w-8 bg-white/90">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="rounded-xl border-none shadow-2xl">
                                            <DropdownMenuItem className="font-bold">Editar Produto</DropdownMenuItem>
                                            <DropdownMenuItem className="font-bold">Ver Analytics</DropdownMenuItem>
                                            <DropdownMenuItem className="font-bold text-rose-500">Excluir</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                            <CardContent className="p-6 space-y-4">
                                <div className="flex justify-between items-start gap-3">
                                    <h3 className="font-black text-lg text-slate-900 leading-tight">{product.name}</h3>
                                    <div className="text-right">
                                        <span className="text-lg font-black text-slate-900">R$ {product.price.toFixed(2)}</span>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                        <p className="text-[10px] uppercase font-black text-slate-400 mb-1">Stock</p>
                                        <p className="text-sm font-black">{product.stock} unidades</p>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                        <p className="text-[10px] uppercase font-black text-slate-400 mb-1">Vendas</p>
                                        <p className="text-sm font-black text-emerald-600">{product.sales} itens</p>
                                    </div>
                                </div>

                                <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white h-12 rounded-xl font-bold group/btn">
                                    Promover Produto
                                    <ArrowUpRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                                </Button>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
