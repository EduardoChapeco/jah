import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  ShoppingBag,
  Utensils,
  Scissors,
  Briefcase,
  Plane,
  Flame,
  Shirt,
  Music,
  Check,
  ArrowRight,
} from "lucide-react";
import { saveUserPreferences } from "@/services/hotpage.functions";
import { toast } from "sonner";

const NICHES_LIST = [
  {
    id: "all",
    label: "Tudo na Cidade",
    icon: Sparkles,
    color: "from-amber-500/20 to-orange-500/20",
  },
  {
    id: "ofertas",
    label: "Ofertas Relâmpago",
    icon: Flame,
    color: "from-red-500/20 to-rose-500/20",
  },
  {
    id: "gastronomia",
    label: "Gastronomia & Lanches",
    icon: Utensils,
    color: "from-orange-500/20 to-amber-500/20",
  },
  {
    id: "mercado",
    label: "Mercado & Produtores",
    icon: ShoppingBag,
    color: "from-emerald-500/20 to-green-500/20",
  },
  {
    id: "beleza",
    label: "Beleza & Barbearia",
    icon: Scissors,
    color: "from-purple-500/20 to-pink-500/20",
  },
  {
    id: "empregos",
    label: "Vagas & Oportunidades",
    icon: Briefcase,
    color: "from-blue-500/20 to-cyan-500/20",
  },
  {
    id: "viagens",
    label: "Viagens & Passeios",
    icon: Plane,
    color: "from-sky-500/20 to-indigo-500/20",
  },
  { id: "moda", label: "Moda & Estilo", icon: Shirt, color: "from-fuchsia-500/20 to-pink-500/20" },
  {
    id: "arte",
    label: "Música & Eventos",
    icon: Music,
    color: "from-violet-500/20 to-purple-500/20",
  },
];

export function InterestPickerModal() {
  const [open, setOpen] = useState(false);
  const [selectedNiches, setSelectedNiches] = useState<string[]>(["all"]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const done = localStorage.getItem("jah_onboarding_interests_done");
      if (!done) {
        // First access: trigger modal after 800ms
        const t = setTimeout(() => setOpen(true), 800);
        return () => clearTimeout(t);
      }
    }
  }, []);

  const toggleNiche = (id: string) => {
    if (id === "all") {
      setSelectedNiches(["all"]);
      return;
    }

    let updated = selectedNiches.filter((n) => n !== "all");
    if (updated.includes(id)) {
      updated = updated.filter((n) => n !== id);
      if (updated.length === 0) updated = ["all"];
    } else {
      updated.push(id);
    }
    setSelectedNiches(updated);
  };

  const handleConfirm = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem("jah_onboarding_interests_done", "true");
      localStorage.setItem("jah_user_niches", JSON.stringify(selectedNiches));
      await saveUserPreferences({
        data: {
          selected_niches: selectedNiches,
          onboarding_done: true,
        },
      }).catch(() => null);

      toast.success("Preferências salvas com sucesso! Seu feed foi personalizado.");
      setOpen(false);
    } catch {
      setOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-xl p-6 sm:p-8 rounded-3xl border border-border bg-background shadow-2xl">
        <DialogHeader className="space-y-2 text-center sm:text-left">
          <div className="size-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold mx-auto sm:mx-0">
            <Sparkles className="size-5" />
          </div>
          <DialogTitle className="text-xl sm:text-2xl font-black tracking-tight">
            O que você mais gosta de acompanhar?
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
            Selecione seus temas favoritos para personalizarmos suas ofertas, novidades e eventos
            locais.
          </DialogDescription>
        </DialogHeader>

        {/* Niche Grid (Pinterest / Twitter Style) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 py-4">
          {NICHES_LIST.map((item) => {
            const Icon = item.icon;
            const isSelected = selectedNiches.includes(item.id);

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => toggleNiche(item.id)}
                className={`relative flex flex-col items-start justify-between p-3.5 rounded-2xl border text-left transition-all select-none cursor-pointer group ${
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary shadow-sm scale-[1.02]"
                    : "bg-card text-foreground border-border/80 hover:border-primary/40 hover:bg-muted/40"
                }`}
              >
                <div
                  className={`size-8 rounded-xl flex items-center justify-center mb-2 transition-transform group-hover:scale-110 ${
                    isSelected ? "bg-white/20 text-white" : "bg-muted text-foreground"
                  }`}
                >
                  <Icon className="size-4" />
                </div>

                <div className="w-full flex items-center justify-between gap-1">
                  <span className="text-xs font-bold leading-tight">{item.label}</span>
                  {isSelected && <Check className="size-3.5 shrink-0" />}
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border/60">
          <button
            type="button"
            onClick={() => {
              localStorage.setItem("jah_onboarding_interests_done", "true");
              setOpen(false);
            }}
            className="text-xs text-muted-foreground hover:text-foreground font-semibold"
          >
            Pular por enquanto
          </button>

          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isSaving}
            className="h-11 px-6 rounded-xl font-bold bg-primary text-primary-foreground text-xs gap-2 shadow-xs"
          >
            <span>Continuar</span>
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
