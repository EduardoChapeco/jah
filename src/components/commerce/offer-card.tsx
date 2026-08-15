import { Link } from "@tanstack/react-router";
import { Plus, Clock, Check, ShoppingBag } from "lucide-react";
import { useState, useEffect } from "react";
import { formatMoney } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { addToCart } from "@/services/cart.functions";
import { useCartContext } from "@/lib/cart-context";
import { toast } from "sonner";

export interface OfferCardProps {
  id: string;
  title: string;
  slug: string;
  store_name: string;
  price_cents: number;
  original_price_cents: number;
  discount_percent: number;
  mechanic_label: string;
  ends_at: string;
  cover_image: string;
  selling_unit?: string;
  in_stock?: boolean;
}

export function OfferCard({
  id,
  title,
  slug,
  store_name,
  price_cents,
  original_price_cents,
  discount_percent,
  mechanic_label,
  ends_at,
  cover_image,
  selling_unit = "un",
  in_stock = true,
}: OfferCardProps) {
  const { refreshCart } = useCartContext();
  const [isAdding, setIsAdding] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");

  // Countdown timer derived from server ends_at timestamp
  useEffect(() => {
    const calculateTime = () => {
      const diff = Math.max(0, new Date(ends_at).getTime() - Date.now());
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(
        `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`,
      );
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [ends_at]);

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsAdding(true);
    try {
      await addToCart({
        data: {
          productId: id,
          quantity: 1,
        },
      });
      toast.success(`${title} adicionado ao carrinho!`);
      await refreshCart();
    } catch (err: unknown) {
      toast.error("Erro ao adicionar produto.");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="group relative flex flex-col justify-between w-52 sm:w-60 shrink-0 snap-start squircle-card border border-border/80 bg-card hover:border-primary/50 transition-all duration-200 overflow-hidden shadow-xs hover-elevate">
      {/* ── Imagem 4:5 com Badges ───────────────────────────── */}
      <Link
        to="/produto/$slug"
        params={{ slug }}
        className="block relative aspect-4/5 w-full bg-muted overflow-hidden rounded-2xl"
      >
        <img
          src={cover_image}
          alt={title}
          className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Badge de Desconto / Mecânica */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
          <span className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-primary text-primary-foreground shadow-xs">
            {mechanic_label}
          </span>
        </div>

        {/* Timer de Oferta Relâmpago (Vibrante / Colorido) */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-center">
          <div className="timer-pill w-full justify-center">
            <Clock className="size-3 text-white animate-pulse" />
            <span>{timeLeft || "00:00:00"}</span>
          </div>
        </div>
      </Link>

      {/* ── Conteúdo & Preço ────────────────────────────────── */}
      <div className="pt-3 space-y-2 flex-1 flex flex-col justify-between">
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider line-clamp-1">
            {store_name}
          </span>
          <Link to="/produto/$slug" params={{ slug }}>
            <h3 className="text-xs sm:text-sm font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
              {title}
            </h3>
          </Link>
        </div>

        {/* Bloco de Preços & Quick Add */}
        <div className="flex items-end justify-between gap-2 pt-2 border-t border-border/40">
          <div>
            {original_price_cents > price_cents && (
              <span className="text-[10px] text-muted-foreground line-through block font-mono">
                {formatMoney(original_price_cents)}
              </span>
            )}
            <div className="text-sm sm:text-base font-black text-primary font-mono leading-tight">
              {formatMoney(price_cents)}
              <span className="text-[10px] text-muted-foreground font-normal ml-0.5">
                /{selling_unit}
              </span>
            </div>
          </div>

          <Button
            size="sm"
            onClick={handleQuickAdd}
            disabled={isAdding || !in_stock}
            className="size-9 squircle-action p-0 font-bold bg-primary text-primary-foreground shadow-xs shrink-0 hover:scale-105 active:scale-95 transition-all"
            aria-label={`Adicionar ${title} ao carrinho`}
          >
            {isAdding ? (
              <span className="size-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
