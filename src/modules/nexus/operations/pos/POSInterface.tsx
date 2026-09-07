
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
    ChevronLeft,
    ShoppingCart,
    Search,
    CreditCard,
    Plus,
    Minus,
    Trash2,
    LayoutGrid,
    History,
    Info,
    Check,
    ChevronRight,
    User,
    Package,
    Zap,
    TrendingUp,
    Clock,
    Monitor,
    X,
    MoreVertical,
    ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from '@/components/ui/sheet';
import { POS_TEMPLATES } from '@/lib/pos-templates';
import { BuffetPOS } from './templates/BuffetPOS';
import { cn, formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type Comanda = Database['public']['Tables']['comandas']['Row'];

interface Subpanel {
    id: string;
    tipo: string;
    nome: string;
    evento_id: string;
    template_tipo?: string;
    eventos: { titulo: string };
}

interface Produto {
    id: string;
    nome: string;
    preco: number;
    tipo_preco: string;
    categoria: string;
    estoque_atual: number;
}

interface ActiveAbertura {
    id: string;
    caixa_id: string;
    status: string;
    empresa_id: string;
    valor_inicial: number;
}

interface Modifier {
    id: string;
    nome: string;
    preco_adicional: number;
    grupo_id: string;
}

interface CartItem extends Produto {
    cartId: string;
    quantidade: number;
    modifiers: Modifier[];
    peso?: number;
}

interface ModifierGroup {
    id: string;
    nome: string;
    obrigatorio: boolean;
    maximo_selecao: number;
    produtos_complementos_itens: Modifier[];
}

export default function POSInterface() {
    const { id: empresaId, subpainelId } = useParams<{ id: string, subpainelId: string }>();
    const navigate = useNavigate();
    const [cart, setCart] = useState<CartItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedProductForModifiers, setSelectedProductForModifiers] = useState<Produto | null>(null);
    const [selectedComanda, setSelectedComanda] = useState<Comanda | null>(null);

    // Fetch Subpanel
    const { data: subpanel, isLoading: loadingSub } = useQuery({
        queryKey: ['pos-subpanel', subpainelId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('eventos_subpaineis')
                .select('*, eventos(titulo)')
                .eq('id', subpainelId)
                .single();
            if (error) throw error;
            return data;
        },
        enabled: !!subpainelId
    });

    // Fetch Products
    const { data: produtos, isLoading: loadingProd } = useQuery({
        queryKey: ['pos-products', subpanel?.evento_id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('produtos_evento')
                .select('*')
                .eq('evento_id', subpanel?.evento_id);
            if (error) throw error;
            return data;
        },
        enabled: !!subpanel?.evento_id
    });

    const categories = Array.from(new Set(produtos?.map(p => p.categoria) || []));

    // Fetch Active Abertura
    const { data: activeAbertura } = useQuery({
        queryKey: ['active-abertura-pos', empresaId],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;

            const { data, error } = await supabase
                .from('aberturas_caixa')
                .select('*')
                .eq('empresa_id', empresaId)
                .eq('usuario_abertura_id', user.id)
                .eq('status', 'aberto')
                .maybeSingle();

            if (error) return null;
            return data;
        },
        enabled: !!empresaId
    });

    const addToCart = (produto: Produto, modifiers: Modifier[] = []) => {
        if (produto.tipo_preco === 'por_peso') return;

        const cartItemId = modifiers.length > 0
            ? `${produto.id}-${modifiers.map(m => m.id).sort().join('-')}`
            : produto.id;

        setCart(prev => {
            const existing = prev.find(item => item.cartId === cartItemId);
            if (existing) {
                return prev.map(item => item.cartId === cartItemId ? { ...item, quantidade: item.quantidade + 1 } : item);
            }
            return [...prev, { ...produto, cartId: cartItemId, modifiers, quantidade: 1 }];
        });
        toast.success(`${produto.nome} adicionado`);
        setSelectedProductForModifiers(null);
    };

    const updateQty = (cartId: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.cartId === cartId) {
                const n = Math.max(1, item.quantidade + delta);
                return { ...item, quantidade: n };
            }
            return item;
        }));
    };

    const removeFromCart = (cartId: string) => {
        setCart(prev => prev.filter(item => item.cartId !== cartId));
    };

    const checkoutMutation = useMutation({
        mutationFn: async ({ paymentMethod }: { paymentMethod: string }) => {
            const { data: pedido, error: pedidoErr } = await supabase
                .from('pedidos')
                .insert({
                    empresa_id: empresaId as string, 
                    evento_id: subpanel?.evento_id as string,
                    subpainel_id: subpainelId,
                    comanda_id: selectedComanda?.id || null,
                    valor_total: total,
                    metodo_pagamento: selectedComanda ? 'saldo_comanda' : paymentMethod,
                    status: (selectedComanda ? 'aberto' : 'pago') as Database["public"]["Enums"]["status_pedido"],
                    abertura_caixa_id: activeAbertura?.id || null
                })
                .select()
                .single();

            if (pedidoErr) throw pedidoErr;

            const itensPayload = cart.map(item => ({
                pedido_id: pedido.id,
                produto_id: item.id,
                quantidade: item.quantidade,
                preco_unitario: item.preco,
                valor_total: item.preco * item.quantidade
            }));

            const { error: itensErr } = await supabase
                .from('pedidos_itens')
                .insert(itensPayload);

            if (itensErr) throw itensErr;

            if (activeAbertura && !selectedComanda) {
                await supabase
                    .from('movimentacoes_caixa')
                    .insert({
                        abertura_caixa_id: activeAbertura.id,
                        empresa_id: empresaId,
                        tipo: 'venda',
                        valor: total,
                        descricao: `Venda Pedido #${pedido.id}`,
                        metodo_pagamento: paymentMethod,
                        usuario_id: (await supabase.auth.getUser()).data.user?.id
                    });
            }

            console.log("Checkout successful:", pedido.id);
            return pedido;
        },
        onSuccess: () => {
            toast.success("Venda finalizada com sucesso!");
            setCart([]);
            setSelectedComanda(null);
        },
        onError: (err: Error) => {
            toast.error("Falha na transação: " + err.message);
        }
    });

    const total = cart.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);

    if (loadingSub || loadingProd) return (
        <div className="h-screen flex flex-col items-center justify-center bg-white space-y-6">
            <div className="w-12 h-12 border-4 border-slate-100 border-t-slate-900 rounded-xl animate-spin"></div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Loading Terminal Protocol 4.2...</p>
        </div>
    );

    return (
        <div className="h-screen flex flex-col bg-slate-50 text-slate-900 overflow-hidden font-sans selection:bg-slate-900 selection:text-white">
            {/* Ultra Premium Header */}
            <header className="h-28 bg-white border-b border-slate-100 flex items-center justify-between px-10 shrink-0 z-50">
                <div className="flex items-center gap-10">
                    <button 
                        onClick={() => navigate(-1)} 
                        className="h-16 w-16 rounded-[24px] bg-slate-50 border border-slate-100 flex items-center justify-center hover:bg-white hover:border-slate-900 transition-all group"
                    >
                        <ChevronLeft className="h-7 w-7 text-slate-400 group-hover:text-slate-900 transition-colors" />
                    </button>
                    <div className="space-y-1">
                        <div className="flex items-center gap-4">
                            <h1 className="text-3xl font-black italic uppercase italic tracking-tighter text-slate-900">{subpanel?.nome}</h1>
                            <div className="h-6 px-3 rounded-xl bg-slate-900 text-white flex items-center justify-center text-[9px] font-black uppercase tracking-widest leading-none">
                                {subpanel?.template_tipo || 'GENERIC POS'}
                            </div>
                        </div>
                        <p className="text-slate-300 font-bold uppercase text-[9px] tracking-[0.5em] flex items-center gap-2">
                             EVENT CORE_ <span className="text-slate-400">{subpanel?.eventos?.titulo}</span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-8">
                    <div className="text-right hidden sm:block">
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Status do Terminal</p>
                        <div className="flex items-center gap-2 justify-end">
                            <div className="h-2 w-2 rounded-sm bg-emerald-500 animate-pulse" />
                            <span className="text-xs font-black uppercase tracking-wider text-slate-900">Online · Seguro</span>
                        </div>
                    </div>
                    <div className="h-16 w-[1px] bg-slate-100 mx-2" />
                    <button className="h-16 w-16 rounded-[24px] bg-white border border-slate-100 flex items-center justify-center hover:scale-105 transition-all text-slate-400 hover:text-slate-900">
                        <History className="h-6 w-6" />
                    </button>
                    <div className="flex items-center gap-4 pl-4">
                        <div className="h-16 w-16 rounded-[24px] bg-slate-900 border-4 border-slate-100 flex items-center justify-center shadow-lg shadow-slate-900/10">
                            <User className="h-8 w-8 text-white" />
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 flex overflow-hidden">
                <div className="flex-1 flex flex-col bg-slate-50 relative overflow-hidden">
                    {/* Category Stream - Better UI */}
                    <div className="h-24 bg-white/40 border-b border-slate-100 flex items-center px-10 gap-4 overflow-x-auto no-scrollbar shrink-0 backdrop-blur-xl sticky top-0 z-40">
                        <button
                            onClick={() => setSelectedCategory(null)}
                            className={cn(
                                "px-10 h-14 rounded-[24px] text-[10px] font-black uppercase italic tracking-[0.3em] transition-all whitespace-nowrap",
                                !selectedCategory ? "bg-slate-900 text-white shadow-2xl shadow-slate-900/20" : "bg-white/60 text-slate-400 border border-slate-100 hover:bg-white"
                            )}
                        >
                            All Categories
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={cn(
                                    "px-10 h-14 rounded-[24px] text-[10px] font-black uppercase italic tracking-[0.3em] transition-all whitespace-nowrap border",
                                    selectedCategory === cat ? "bg-slate-900 text-white shadow-2xl shadow-slate-900/20 border-slate-900" : "bg-white/60 text-slate-400 border-slate-100 hover:bg-white"
                                )}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                        {subpanel?.template_tipo === 'buffet_kg' ? (
                            <div className="max-w-4xl mx-auto py-12">
                                <BuffetPOS
                                    produto={(produtos?.find(p => p.tipo_preco === 'por_peso') || { id: '0', nome: 'Refeição por Kg', preco: 79.90, tipo_preco: 'por_peso', categoria: 'Buffet', estoque_atual: 999 }) as any}
                                    onConfirm={(data) => {
                            const buffetBase = (produtos?.find(p => p.tipo_preco === 'por_peso') || { 
                                            id: '0', 
                                            nome: 'Refeição por Kg', 
                                            preco: 79.90, 
                                            tipo_preco: 'por_peso', 
                                            categoria: 'Buffet', 
                                            estoque_atual: 999 
                                        }) as any;
                                        const buffetItem: CartItem = {
                                            ...buffetBase,
                                            id: buffetBase.id,
                                            cartId: `buffet-${Date.now()}`,
                                            nome: 'Buffet Kg',
                                            preco: data.valor,
                                            quantidade: 1,
                                            peso: data.peso,
                                            modifiers: []
                                        };
                                        setCart(prev => [...prev, buffetItem]);
                                    }}
                                />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-10">
                                {produtos?.filter(p => !selectedCategory || p.categoria === selectedCategory).map((produto, idx) => (
                                    <div
                                        key={produto.id}
                                        onClick={() => setSelectedProductForModifiers(produto)}
                                        className="group cursor-pointer relative animate-in fade-in slide-in-from-bottom-4 duration-500"
                                        style={{ animationDelay: `${idx * 40}ms` }}
                                    >
                                        <div className="luma-card p-0 overflow-hidden border-none group-hover:ring-2 group-hover:ring-slate-900 transition-all duration-500 shadow-2xl shadow-slate-200/50 bg-white">
                                            <div className="aspect-[4/3] bg-slate-50 relative overflow-hidden flex items-center justify-center p-12">
                                                <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none" />
                                                <LayoutGrid className="h-16 w-16 text-slate-100 group-hover:scale-110 group-hover:text-slate-200 transition-all duration-700" />
                                                <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                                                    <div className="bg-slate-900 text-white p-4 rounded-[20px] shadow-2xl">
                                                        <Plus className="h-6 w-6" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="p-8 space-y-4">
                                                <div className="space-y-1">
                                                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{produto.categoria || 'GENERAL ITEM'}</p>
                                                    <h4 className="text-xl font-black text-slate-900 leading-tight uppercase italic tracking-tighter truncate">{produto.nome}</h4>
                                                </div>
                                                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                                    <span className="text-2xl font-black text-slate-900 tracking-tighter italic uppercase">
                                                        {formatCurrency(produto.preco)}
                                                    </span>
                                                    {produto.estoque_atual <= 10 && (
                                                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-rose-50 border border-rose-100">
                                                            <div className="h-1 w-1 rounded-sm bg-rose-500 animate-pulse" />
                                                            <span className="text-[8px] font-black uppercase text-rose-500">{produto.estoque_atual} LEFT</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side Cart - Premium Redesign */}
                <aside className="hidden xl:flex w-[500px] bg-white border-l border-slate-100 flex-col shrink-0 z-50">
                    <div className="flex flex-col h-full bg-white relative">
                        {/* Cart Header */}
                        <div className="p-10 pb-6 shrink-0">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-5">
                                    <div className="h-16 w-16 bg-slate-900 rounded-[24px] flex items-center justify-center text-white shadow-xl shadow-slate-900/10">
                                        <ShoppingCart className="h-7 w-7" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black italic uppercase tracking-tighter">Current Order</h2>
                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">{cart.length} LINE ITEMS</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setCart([])}
                                    className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all"
                                >
                                    <Trash2 className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        {/* Items Stream */}
                        <div className="flex-1 overflow-y-auto px-10 space-y-4 custom-scrollbar">
                            {cart.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-30 select-none">
                                    <div className="w-32 h-32 bg-slate-50 rounded-[40px] flex items-center justify-center border border-slate-100">
                                        <Package className="h-12 w-12 text-slate-200" />
                                    </div>
                                    <div>
                                        <p className="font-black text-slate-400 uppercase tracking-[0.5em] text-[10px] mb-2">Cart is empty</p>
                                        <p className="text-xs font-bold text-slate-300">Select items to build ticket</p>
                                    </div>
                                </div>
                            ) : (
                                cart.map((item, idx) => (
                                    <div key={item.cartId} className="group relative bg-slate-50/50 hover:bg-white border border-slate-100 p-6 rounded-[28px] transition-all duration-500 flex flex-col gap-4 animate-in slide-in-from-right-4">
                                        <div className="flex items-center gap-6">
                                            <div className="h-16 w-16 bg-white rounded-2xl border border-slate-100 flex items-center justify-center shrink-0 shadow-sm">
                                                <LayoutGrid className="h-6 w-6 text-slate-100" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h5 className="font-black text-slate-900 truncate uppercase italic tracking-tighter text-base leading-none mb-1">{item.nome}</h5>
                                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{formatCurrency(item.preco)}</p>
                                            </div>
                                            <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
                                                <button onClick={() => updateQty(item.cartId, -1)} className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-slate-50 text-slate-400"><Minus className="h-4 w-4" /></button>
                                                <span className="font-black text-slate-900 text-lg w-6 text-center italic">{item.quantidade}</span>
                                                <button onClick={() => updateQty(item.cartId, 1)} className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-slate-50 text-slate-400"><Plus className="h-4 w-4" /></button>
                                            </div>
                                        </div>
                                        {item.modifiers?.length > 0 && (
                                            <div className="flex flex-wrap gap-2 px-1">
                                                {item.modifiers.map((mod: Modifier) => (
                                                    <span key={mod.id} className="bg-white border border-slate-100 text-[8px] font-black uppercase text-slate-400 px-3 py-1.5 rounded-md tracking-wider">
                                                        + {mod.nome}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        <button 
                                            onClick={() => removeFromCart(item.cartId)}
                                            className="absolute -top-2 -right-2 h-8 w-8 rounded-xl bg-white border border-slate-100 text-slate-200 hover:text-rose-500 hover:border-rose-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Order Summary & Actions */}
                        <div className="p-10 pt-0 bg-white">
                            <div className="h-[2px] w-full bg-slate-50 mb-10 overflow-hidden">
                                <div className="h-full bg-slate-900 w-1/3 animate-shimmer" />
                            </div>
                            
                            <div className="space-y-4 mb-10">
                                <div className="flex justify-between items-center text-slate-400 font-black uppercase text-[10px] tracking-[0.4em]">
                                    <span>Base Subtotal</span>
                                    <span className="text-slate-900">{formatCurrency(total)}</span>
                                </div>
                                <div className="flex justify-between items-center text-slate-400 font-black uppercase text-[10px] tracking-[0.4em]">
                                    <span>Taxes & Service</span>
                                    <span className="text-slate-900">R$ 0.00</span>
                                </div>
                                <div className="flex justify-between items-center pt-8 mt-4 border-t border-slate-50">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-300 mb-2">Consolidated Total</p>
                                        <span className="text-5xl font-black tracking-tighter text-slate-900 italic uppercase">{formatCurrency(total)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <button
                                    className={cn(
                                        "h-20 rounded-[28px] border-2 font-black uppercase text-[10px] tracking-[0.2em] transition-all flex items-center justify-center gap-3",
                                        selectedComanda ? "border-slate-900 bg-slate-900 text-white" : "border-slate-100 text-slate-300 hover:border-slate-300 hover:text-slate-600 shadow-sm"
                                    )}
                                >
                                    <User className="h-4 w-4" /> {selectedComanda ? selectedComanda.identificador : 'COMANDA'}
                                </button>
                                <button className="h-20 rounded-[28px] border-2 border-slate-100 text-slate-300 font-black uppercase text-[10px] tracking-[0.2em] shadow-sm hover:border-slate-300 hover:text-slate-600 transition-all">
                                    SPLIT BILL
                                </button>
                            </div>

                            <button
                                disabled={cart.length === 0 || checkoutMutation.isPending}
                                onClick={() => handleCheckout()}
                                className="w-full h-28 rounded-[32px] bg-slate-900 hover:bg-black text-white font-black text-2xl uppercase italic tracking-widest shadow-2xl shadow-slate-900/10 disabled:opacity-20 transition-all active:scale-95 duration-500 flex flex-col items-center justify-center"
                            >
                                <span className="text-[10px] font-black uppercase tracking-[0.8em] opacity-40 mb-2">Verify & Commit</span>
                                <div className="flex items-center gap-4">
                                    {checkoutMutation.isPending ? 'PROCESSING...' : (selectedComanda ? 'COMMIT TO ACCOUNT' : 'SECURE CHECKOUT')}
                                    <ArrowRight className="h-8 w-8" />
                                </div>
                            </button>
                            <p className="text-center text-[8px] font-black uppercase text-slate-200 tracking-[1em] mt-6">EVENT I/OS SECURE POS ENGINE</p>
                        </div>
                    </div>
                </aside>
            </main>

            {/* Modifiers Sheet */}
            <Sheet open={!!selectedProductForModifiers} onOpenChange={(open) => !open && setSelectedProductForModifiers(null)}>
                <SheetContent side="bottom" className="h-[85vh] rounded-t-[64px] border-none p-0 overflow-hidden bg-white shadow-[0_-32px_120px_rgba(0,0,0,0.15)]">
                    <ModifierSelector
                        product={selectedProductForModifiers}
                        onConfirm={(modifiers) => addToCart(selectedProductForModifiers, modifiers)}
                    />
                </SheetContent>
            </Sheet>
        </div>
    );

    function handleCheckout(paymentMethod: string = 'credit') {
        if (cart.length === 0) return;
        checkoutMutation.mutate({ paymentMethod });
    }
}

function ModifierSelector({ product, onConfirm }: { product: Produto, onConfirm: (mods: Modifier[]) => void }) {
    const [selectedMods, setSelectedMods] = useState<Modifier[]>([]);

    const { data: modifierGroups, isLoading } = useQuery({
        queryKey: ['product-modifiers', product?.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('produto_has_complementos')
                .select('grupo_id, produtos_complementos_grupos(*, produtos_complementos_itens(*))')
                .eq('produto_id', product?.id);
            if (error) throw error;
            return data.map(d => (d as any).produtos_complementos_grupos as ModifierGroup);
        },
        enabled: !!product?.id
    });

    const toggleMod = (item: Modifier) => {
        const group = modifierGroups?.find(g => (g as ModifierGroup).id === item.grupo_id);
        setSelectedMods(prev => {
            if (prev.find(m => m.id === item.id)) return prev.filter(m => m.id !== item.id);
            if (group) {
                const modifierGroup = group as ModifierGroup;
                const currentInGroup = prev.filter(m => m.grupo_id === item.grupo_id);
                if (modifierGroup.maximo_selecao === 1) {
                    const others = prev.filter(m => m.grupo_id !== item.grupo_id);
                    return [...others, item];
                }
                if (currentInGroup.length >= modifierGroup.maximo_selecao) {
                    toast.error(`Limit reached: maximum ${modifierGroup.maximo_selecao} for this group`);
                    return prev;
                }
            }
            return [...prev, item];
        });
    };

    if (isLoading) return <div className="h-full flex items-center justify-center"><div className="w-10 h-10 border-4 border-slate-100 border-t-slate-900 rounded-xl animate-spin"></div></div>;

    const currentTotal = product?.preco + selectedMods.reduce((acc, m) => acc + (m.preco_adicional || 0), 0);

    return (
        <div className="h-full flex flex-col bg-white">
            <header className="p-16 pb-12 bg-white shrink-0">
                <div className="flex justify-between items-end">
                    <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.6em] text-slate-300">Modifier Protocol</p>
                        <h2 className="text-5xl font-black italic uppercase italic tracking-tighter text-slate-900">{product?.nome}</h2>
                    </div>
                    <div className="text-right">
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-2">Base Cost Unit</span>
                        <span className="text-4xl font-black text-slate-900 italic uppercase tracking-tighter">{formatCurrency(product?.preco || 0)}</span>
                    </div>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto px-16 space-y-16 pb-32 custom-scrollbar">
                {(modifierGroups?.length || 0) === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-8 py-20 grayscale opacity-30">
                        <div className="w-32 h-32 bg-slate-50 rounded-[40px] flex items-center justify-center">
                            <Info className="h-12 w-12 text-slate-900" />
                        </div>
                        <p className="font-black text-slate-900 uppercase italic tracking-widest text-lg">No modifications available</p>
                    </div>
                ) : (modifierGroups as ModifierGroup[])?.map((group) => (
                    <div key={group.id} className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
                        <div className="flex items-end gap-6 border-b border-slate-50 pb-6">
                            <h4 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900">{group.nome}</h4>
                            <div className="h-6 px-3 rounded-md bg-slate-50 border border-slate-100 flex items-center justify-center text-[9px] font-black uppercase tracking-widest text-slate-400">
                                {group.obrigatorio ? 'Required' : 'Optional'} • MAX {group.maximo_selecao}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {group.produtos_complementos_itens?.map((item: Modifier) => {
                                const isSelected = selectedMods.find(m => m.id === item.id);
                                return (
                                    <div
                                        key={item.id}
                                        onClick={() => toggleMod(item)}
                                        className={cn(
                                            "p-8 rounded-[32px] border-2 transition-all duration-500 cursor-pointer flex items-center justify-between group",
                                            isSelected
                                                ? "bg-slate-50 border-slate-900 shadow-2xl shadow-slate-900/5 scale-[1.02]"
                                                : "bg-white border-slate-50 hover:border-slate-200"
                                        )}
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className={cn(
                                                "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500",
                                                isSelected ? "bg-slate-900 text-white shadow-xl" : "bg-slate-50 text-slate-200"
                                            )}>
                                                {isSelected ? <Check className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900 uppercase tracking-tighter text-base italic leading-none mb-1">{item.nome}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">+ {formatCurrency(item.preco_adicional)}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            <footer className="p-16 border-t border-slate-50 shrink-0 bg-white/80 backdrop-blur-xl">
                <div className="flex items-center justify-between gap-12">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.6em]">Consolidated Unit Value</p>
                        <p className="text-6xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">
                            {formatCurrency(currentTotal)}
                        </p>
                    </div>
                    <button
                        onClick={() => onConfirm(selectedMods)}
                        className="h-28 px-20 rounded-[32px] bg-slate-900 hover:bg-black text-white px-12 font-black text-2xl uppercase italic tracking-widest shadow-3xl shadow-slate-900/20 active:scale-95 transition-all duration-500 flex flex-col items-center justify-center gap-2"
                    >
                        <span className="text-[10px] font-black uppercase tracking-[0.8em] opacity-40">Confirm Unit</span>
                        ADD TO TICKET
                    </button>
                </div>
            </footer>
        </div>
    );
}


