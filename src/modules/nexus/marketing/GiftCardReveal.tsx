
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
    Gift,
    Sparkles,
    Heart,
    Share2,
    PartyPopper,
    ChevronRight,
    QrCode,
    Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function GiftCardReveal() {
    const { code } = useParams<{ code: string }>();
    const [card, setCard] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [revealed, setRevealed] = useState(false);
    const [empresa, setEmpresa] = useState<any>(null);

    useEffect(() => {
        if (code) {
            fetchCard();
        }
    }, [code]);

    const fetchCard = async () => {
        try {
            const { data, error } = await supabase
                .from("gift_cards")
                .select("*")
                .eq("code", code)
                .single();

            if (error) throw error;
            setCard(data);

            const { data: empData } = await supabase
                .from("empresas")
                .select("nome, logo_url, vertical")
                .eq("id", data.empresa_id)
                .single();
            setEmpresa(empData);

        } catch (error) {
            console.error(error);
            toast.error("Voucher identitário não encontrado.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="min-h-[100dvh] bg-white flex items-center justify-center">
            <motion.div
                animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="flex flex-col items-center gap-6"
            >
                <div className="h-20 w-20 rounded-[32px] bg-slate-900 flex items-center justify-center text-white shadow-2xl shadow-slate-900/20">
                    <Gift className="h-8 w-8" />
                </div>
                <p className="luma-subtitle-premium animate-pulse">Synchronizing Asset...</p>
            </motion.div>
        </div>
    );

    if (!card) return (
        <div className="min-h-[100dvh] bg-white flex items-center justify-center p-8">
            <div className="text-center space-y-6 max-w-sm">
                <div className="h-20 w-20 rounded-[32px] bg-slate-50 flex items-center justify-center text-slate-200 mx-auto">
                    <Zap className="h-10 w-10" />
                </div>
                <div className="space-y-2">
                    <h1 className="luma-title-premium !text-3xl">Asset Expired.</h1>
                    <p className="luma-subtitle-premium !text-slate-400">O código de resgate não foi localizado ou o ciclo de ativação expirou.</p>
                </div>
                <Button 
                    onClick={() => window.location.href = '/'}
                    className="w-full h-14 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-[0.2em] text-[10px] hover:bg-black transition-all active:scale-95 shadow-none"
                >
                    Retornar ao Hub Central
                </Button>
            </div>
        </div>
    );

    return (
        <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 bg-white font-sans overflow-hidden relative">
            {/* Subtle Gradient Background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(0,0,0,0.02),transparent)] pointer-events-none" />

            <AnimatePresence mode="wait">
                {!revealed ? (
                    <motion.div
                        key="closed"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.1, filter: "blur(20px)" }}
                        transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                        className="relative z-10 text-center"
                    >
                        <div className="relative group cursor-pointer" onClick={() => setRevealed(true)}>
                            {/* The Card Envelope / Asset Carrier */}
                            <div className="relative aspect-[3/4.2] w-80 md:w-[400px] bg-white rounded-[48px] border border-slate-100 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)] flex flex-col items-center justify-between p-12 overflow-hidden group-hover:shadow-[0_48px_80px_-16px_rgba(0,0,0,0.12)] transition-all duration-700">
                                
                                <div className="absolute top-0 right-0 p-8 opacity-5">
                                    <Sparkles className="h-32 w-32 text-slate-900" />
                                </div>

                                <motion.div
                                    animate={{ y: [0, -8, 0] }}
                                    transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                                    className="space-y-8 flex flex-col items-center pt-8"
                                >
                                    <div className="h-24 w-24 rounded-[36px] bg-slate-900 flex items-center justify-center text-white shadow-2xl shadow-slate-900/20">
                                        <Gift className="h-10 w-10 animate-pulse" />
                                    </div>
                                    <div className="space-y-3">
                                        <p className="luma-subtitle-premium !text-slate-400">Identity Gift Received</p>
                                        <h2 className="luma-title-premium !text-4xl">Persona<br />Network</h2>
                                    </div>
                                </motion.div>

                                <div className="w-full space-y-6">
                                    <Button
                                        onClick={() => setRevealed(true)}
                                        className="w-full h-16 rounded-[24px] bg-slate-900 text-white font-black uppercase text-[10px] tracking-[0.2em] hover:bg-black transition-all duration-500 active:scale-95 group/btn shadow-none"
                                    >
                                        REVELAR ATIVO <ChevronRight className="ml-3 h-4 w-4 group-hover/btn:translate-x-1.5 transition-transform" />
                                    </Button>
                                    <p className="text-[9px] font-black uppercase text-slate-300 tracking-[0.3em]">Omni-Channel Activation Hub</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="revealed"
                        initial={{ opacity: 0, y: 40, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
                        className="relative z-10 w-full max-w-lg"
                    >
                        {/* Interactive Animation Background Overlay */}
                        <div className="fixed inset-0 pointer-events-none opacity-[0.03]">
                            {card.animation_url?.endsWith('.mp4') ? (
                                <video autoPlay loop muted className="w-full h-full object-cover">
                                    <source src={card.animation_url} type="video/mp4" />
                                </video>
                            ) : card.animation_url ? (
                                <img src={card.animation_url} className="w-full h-full object-cover" alt="" />
                            ) : null}
                        </div>

                        <div className="luma-card p-12 space-y-12 flex flex-col items-center text-center !bg-white/80 backdrop-blur-3xl border-slate-100 shadow-[0_48px_96px_-24px_rgba(0,0,0,0.12)]">
                            {/* Brand Identifier */}
                            <div className="flex flex-col items-center gap-6">
                                <motion.div
                                    className="w-20 h-20 bg-white rounded-[24px] flex items-center justify-center overflow-hidden border border-slate-100 shadow-xl shadow-slate-900/5 group"
                                    whileHover={{ scale: 1.1, rotate: 5 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                >
                                    {empresa?.logo_url ? <img src={empresa.logo_url} className="w-full h-full object-contain p-2" alt="" /> : <PartyPopper className="h-10 w-10 text-slate-900" />}
                                </motion.div>
                                <div className="space-y-1">
                                    <h3 className="luma-title-premium !text-3xl text-slate-900">
                                        {empresa?.nome}
                                    </h3>
                                    <p className="luma-subtitle-premium !text-slate-400">Exclusive Settlement Card</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                >
                                    <h4 className="text-7xl font-black italic text-slate-900 tracking-tighter leading-none mb-4">
                                        R$ {Number(card.initial_value).toFixed(2).replace('.', ',')}
                                    </h4>
                                    <Badge className="rounded-xl px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-100 font-black tracking-widest text-[9px] uppercase shadow-none">
                                        SALDO DISPONÍVEL
                                    </Badge>
                                </motion.div>
                            </div>

                            <div className="bg-slate-50 p-10 rounded-[32px] w-full relative border border-slate-100/50">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-4 rounded-xl border border-slate-100 text-slate-900">
                                    <Heart className="h-6 w-6 fill-slate-900" />
                                </div>
                                <p className="luma-subtitle-premium !text-slate-300 mb-6 !text-[9px]">Manifesto de {card.sender_name?.toUpperCase() || 'Identidade Privada'}</p>
                                <p className="text-xl font-black italic tracking-tight text-slate-800 leading-relaxed uppercase">
                                    "{card.message || "Aproveite esta experiência exclusiva da nossa infraestrutura."}"
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                                <div className="p-8 rounded-[24px] bg-slate-900 text-white flex flex-col items-center justify-center space-y-2 shadow-2xl shadow-slate-900/20">
                                    <p className="luma-subtitle-premium !text-white/40 mb-1">Settlement Code</p>
                                    <p className="font-black italic text-2xl tracking-[0.2em]">{card.code}</p>
                                </div>
                                <div className="p-8 rounded-[24px] border border-slate-100 bg-white flex flex-col items-center justify-center space-y-2 group hover:bg-slate-50 transition-all cursor-pointer">
                                    <QrCode className="h-8 w-8 text-slate-200 group-hover:text-slate-400 transition-colors" />
                                    <p className="luma-subtitle-premium !text-slate-300 group-hover:text-slate-500 transition-colors">Visual QR Resgate</p>
                                </div>
                            </div>

                            <div className="w-full space-y-4 pt-6">
                                <Button className="w-full h-16 rounded-[24px] bg-slate-900 hover:bg-black text-white font-black uppercase tracking-[0.2em] text-[10px] transition-all duration-500 active:scale-95 shadow-none">
                                    SINCRO CARTEIRA DIGITAL
                                </Button>
                                <div className="flex gap-4">
                                    <Button variant="ghost" className="flex-1 h-12 rounded-2xl font-black text-[9px] uppercase tracking-widest gap-2 bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-all">
                                        <Share2 className="h-3.5 w-3.5" /> Transmitir
                                    </Button>
                                    <Button variant="ghost" className="flex-1 h-12 rounded-2xl font-black text-[9px] uppercase tracking-widest bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-all">
                                        Ativar Agora
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 text-center pb-12">
                            <p className="luma-subtitle-premium !text-[9px] opacity-20">EVENT I/OS EXPERIENCE & INFRASTRUCTURE GROUP</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
