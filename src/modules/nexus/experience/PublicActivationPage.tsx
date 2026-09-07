import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Gift, Frown, QrCode, Sparkles, CheckCircle2, Ticket, X } from "lucide-react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function PublicActivationPage() {
    const { id } = useParams<{ id: string }>();
    const [hasPlayed, setHasPlayed] = useState(false);
    const [result, setResult] = useState<"win" | "lose" | null>(null);
    const [isSpinning, setIsSpinning] = useState(false);

    const { data: activation, isLoading } = useQuery({
        queryKey: ["public-activation", id],
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from("event_activations")
                .select("*, empresas(nome_fantasia)")
                .eq("id", id)
                .single();

            if (error) throw error;
            return data;
        },
        enabled: !!id
    });

    const handlePlay = async () => {
        if (!activation || hasPlayed || isSpinning) return;

        setIsSpinning(true);

        // Simulate a "loading/spinning" state for theater
        setTimeout(async () => {
            // @ts-ignore
            const probability = activation.rules?.probability || 20;
            const isWin = Math.random() * 100 < probability;

            setResult(isWin ? "win" : "lose");
            setHasPlayed(true);
            setIsSpinning(false);

            // Log result
            await supabase.from("activation_logs").insert({
                empresa_id: activation.empresa_id,
                activation_id: activation.id,
                result: { outcome: isWin ? "win" : "lose" },
                device_info: { userAgent: navigator.userAgent }
            });
        }, 2000);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-xl"
                />
            </div>
        );
    }

    if (!activation) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-center">
                <div className="space-y-4">
                    <div className="w-20 h-20 bg-slate-200 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
                        <X className="h-10 w-10" />
                    </div>
                    <h1 className="text-2xl font-black text-slate-900">Link expirado ou inválido</h1>
                    <p className="text-slate-500 max-w-xs mx-auto">Esta ativação não está mais disponível ou o link está incorreto.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[100dvh] bg-white text-slate-900 overflow-hidden relative flex flex-col font-sans">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-100 rounded-2xl blur-[120px] opacity-60" />
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.4, 0.6, 0.4]
                    }}
                    transition={{ duration: 10, repeat: Infinity }}
                    className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-amber-50 rounded-2xl blur-[120px]"
                />
            </div>

            <div className="relative z-10 flex-1 flex flex-col max-w-md mx-auto w-full px-6 pt-12 pb-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center space-y-2 mb-12"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-slate-50 border border-slate-100 mb-2">
                        <Sparkles className="h-3 w-3 text-slate-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Exclusivo Persona Nexus</span>
                    </div>
                    <h1 className="text-4xl font-black tracking-tight leading-none text-slate-950 px-4">
                        {activation.title}
                    </h1>
                    <p className="text-slate-500 font-medium text-sm">
                        por {/* @ts-ignore */}
                        <span className="text-slate-900">{activation.empresas?.nome_fantasia}</span>
                    </p>
                </motion.div>

                <AnimatePresence mode="wait">
                    {!hasPlayed ? (
                        <motion.div
                            key="play"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05 }}
                            className="flex-1 flex flex-col justify-center"
                        >
                            <div className="bg-white/80  rounded-lg p-10 shadow-huge border border-white/50 space-y-10 text-center relative overflow-hidden">
                                {/* Decorative Ring */}
                                <div className="absolute inset-0 border-2 border-slate-100 rounded-lg pointer-events-none" />

                                <div className="space-y-6 relative">
                                    <motion.div
                                        animate={isSpinning ? { rotate: [0, 360], scale: [1, 1.1, 1] } : {}}
                                        transition={isSpinning ? { duration: 0.8, repeat: Infinity, ease: "linear" } : {}}
                                        className={cn(
                                            "w-40 h-40 mx-auto rounded-lg flex items-center justify-center shadow-2xl transition-all duration-500",
                                            isSpinning ? "bg-black text-white shadow-black/20" : "bg-slate-50 text-slate-200"
                                        )}
                                    >
                                        <QrCode className="h-20 w-20" />
                                    </motion.div>

                                    <div className="space-y-2">
                                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Pronto para a sorte?</h2>
                                        <p className="text-slate-500 font-medium px-4">
                                            Toque no botão abaixo para descobrir seu prêmio agora mesmo.
                                        </p>
                                    </div>
                                </div>

                                <Button
                                    size="lg"
                                    className={cn(
                                        "w-full h-16 rounded-lg text-lg font-black transition-all shadow-xl shadow-black/10 active:scale-95",
                                        isSpinning ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-black text-white hover:bg-black/90"
                                    )}
                                    onClick={handlePlay}
                                    disabled={isSpinning}
                                >
                                    {isSpinning ? "PROCESSANDO..." : "TENTAR A SORTE"}
                                </Button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="result"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex-1 flex flex-col justify-center"
                        >
                            {result === "win" ? (
                                <div className="bg-white rounded-lg p-10 shadow-huge ring-4 ring-slate-950/5 text-center space-y-8 relative overflow-hidden">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: "spring", damping: 12 }}
                                        className="w-40 h-40 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto relative"
                                    >
                                        <Gift className="h-20 w-20 text-indigo-600" />
                                        <motion.div
                                            animate={{ scale: [1, 1.5, 1], opacity: [0, 0.5, 0] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                            className="absolute inset-0 bg-indigo-200 rounded-2xl"
                                        />
                                    </motion.div>

                                    <div className="space-y-2">
                                        <h2 className="text-4xl font-black text-slate-950 uppercase tracking-tighter">VOCÊ GANHOU!</h2>
                                        <p className="text-slate-500 font-medium">Parabéns! Um presente exclusivo está reservado para você.</p>
                                    </div>

                                    <div className="p-6 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200 relative group transition-all hover:border-slate-300">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">CÓDIGO DE RESGATE</p>
                                        <span className="font-mono text-3xl font-black text-slate-900 tracking-wider">
                                            #{Math.random().toString(36).substring(2, 8).toUpperCase()}
                                        </span>
                                    </div>

                                    <div className="flex flex-col gap-2 pt-4">
                                        <div className="flex items-center justify-center gap-2 text-slate-400">
                                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                                            <span className="text-xs font-bold uppercase tracking-wider">Mostre esta tela para retirar</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white rounded-lg p-10 shadow-huge border border-slate-100 text-center space-y-8">
                                    <div className="w-40 h-40 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto grayscale opacity-50">
                                        <Frown className="h-20 w-20 text-slate-400" />
                                    </div>

                                    <div className="space-y-2">
                                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Quase lá...</h2>
                                        <p className="text-slate-500 font-medium">Infelizmente não foi dessa vez. Continue aproveitando as outras ativações do evento!</p>
                                    </div>

                                    <Button
                                        variant="outline"
                                        className="w-full h-14 rounded-lg border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
                                        onClick={() => window.location.reload()}
                                    >
                                        VOLTAR AO EVENTO
                                    </Button>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Footer Logo */}
                <div className="mt-12 text-center">
                    <div className="flex items-center justify-center gap-2 grayscale opacity-40">
                        <Ticket className="h-4 w-4" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-950">
                            Event I/OS <span className="text-slate-500 font-medium ml-1">v4.0</span>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
