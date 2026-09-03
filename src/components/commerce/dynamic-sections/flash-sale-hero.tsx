import * as React from "react";
import { useState, useEffect } from "react";
import { Flame, Clock, Copy, Check, Sparkles, ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface FlashSaleHeroProps {
  title?: string;
  subtitle?: string;
  badge?: string;
  discountPercentage?: string;
  couponCode?: string;
  endDate?: string;
  targetLink?: string;
  bgImageUrl?: string;
}

export const FlashSaleHero: React.FC<FlashSaleHeroProps> = ({
  title = "Queima de Estoque Relâmpago",
  subtitle = "Descontos de até 50% OFF em itens selecionados por tempo limitado. Aproveite antes que acabe!",
  badge = "🔥 Oferta por Tempo Limitado",
  discountPercentage = "50% OFF",
  couponCode = "RELAMPAGO50",
  endDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 dias
  targetLink = "#produtos",
  bgImageUrl = "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=1600&auto=format&fit=crop",
}) => {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTime = () => {
      const target = new Date(endDate).getTime();
      const now = new Date().getTime();
      const diff = Math.max(0, target - now);

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / 1000 / 60) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [endDate]);

  const handleCopyCoupon = () => {
    if (!couponCode) return;
    navigator.clipboard.writeText(couponCode);
    setCopied(true);
    toast.success(`Cupom ${couponCode} copiado!`);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="relative w-full overflow-hidden bg-zinc-950 py-12 md:py-20 text-white">
      {/* Background Image com Overlay Escuro */}
      <div className="absolute inset-0 z-0">
        <img src={bgImageUrl} alt="Oferta Relâmpago" className="h-full w-full object-cover opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/80 to-zinc-950/50" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/15 via-transparent to-transparent" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Lado Esquerdo: Mensagem e Oferta */}
          <div className="space-y-6 lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/15 px-3.5 py-1 text-xs font-bold text-amber-300 backdrop-blur-md">
              <Flame className="size-3.5 text-amber-400 animate-pulse" />
              <span>{badge}</span>
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
                {title} <span className="text-amber-400 underline decoration-amber-500/50">{discountPercentage}</span>
              </h1>
              <p className="text-sm sm:text-base text-zinc-300 max-w-lg leading-relaxed">
                {subtitle}
              </p>
            </div>

            {/* Cupom 1-Toque */}
            {couponCode && (
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-900/90 border border-amber-500/30 max-w-md">
                <div className="space-y-0.5 min-w-0 flex-1">
                  <p className="text-[10px] uppercase font-bold text-amber-400">Cupom de Desconto</p>
                  <p className="font-mono text-sm font-bold text-white tracking-widest">{couponCode}</p>
                </div>
                <Button
                  type="button"
                  onClick={handleCopyCoupon}
                  size="sm"
                  className={cn(
                    "h-8 px-3 rounded-xl text-xs font-bold gap-1.5 transition-all cursor-pointer",
                    copied ? "bg-emerald-500 text-white" : "bg-amber-500 hover:bg-amber-400 text-zinc-950"
                  )}
                >
                  {copied ? (
                    <>
                      <Check className="size-3.5" />
                      <span>Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" />
                      <span>Copiar Cupom</span>
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Lado Direito: Temporizador Regressivo & CTA */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl border border-amber-500/30 bg-zinc-900/90 p-6 sm:p-8 shadow-2xl backdrop-blur-xl text-center space-y-6">
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400">
                  <Clock className="size-4" />
                  <span>A Oferta Encerra Em:</span>
                </div>
              </div>

              {/* Blocos de Contagem */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { value: timeLeft.days, label: "Dias" },
                  { value: timeLeft.hours, label: "Horas" },
                  { value: timeLeft.minutes, label: "Min" },
                  { value: timeLeft.seconds, label: "Seg" },
                ].map((item, idx) => (
                  <div key={idx} className="p-3 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 flex flex-col items-center">
                    <span className="text-2xl sm:text-3xl font-mono font-black text-amber-300">
                      {String(item.value).padStart(2, "0")}
                    </span>
                    <span className="text-[10px] font-semibold text-zinc-400 uppercase mt-0.5">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>

              <Button
                asChild
                className="w-full h-11 rounded-2xl text-xs sm:text-sm font-bold gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 shadow-lg cursor-pointer transition-transform hover:scale-102"
              >
                <a href={targetLink}>
                  <Zap className="size-4 fill-current" />
                  <span>Garantir Ofertas com Desconto</span>
                  <ArrowRight className="size-4" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlashSaleHero;
