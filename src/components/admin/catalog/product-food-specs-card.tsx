import React from "react";
import {
  Sparkles,
  Leaf,
  Apple,
  Wine,
  Users,
  Scale,
  Clock,
  ShieldCheck,
  Tag,
  Flame,
  Check,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface FoodSpecsData {
  dietaryRestrictions: string[]; // ["vegano", "sem_gluten", ...]
  beverageTags: string[]; // ["gelada", "alcoolica", ...]
  servesCount?: string; // "1 pessoa", "2 pessoas", "3-4 pessoas", "familia"
  portionWeight?: string; // "750"
  portionUnit?: string; // "g", "kg", "ml", "L", "un", "fatias"
  preparationTimeMinutes?: number; // 20
  posCode?: string; // "XGAHTQ"
  spiceLevel?: "none" | "mild" | "medium" | "hot";
}

const DIETARY_OPTIONS = [
  { id: "vegano", label: "Vegano", icon: Leaf },
  { id: "vegetariano", label: "Vegetariano", icon: Leaf },
  { id: "organico", label: "Orgânico", icon: Apple },
  { id: "sem_acucar", label: "Sem açúcar", icon: Sparkles },
  { id: "sem_lactose", label: "Sem lactose", icon: ShieldCheck },
  { id: "sem_gluten", label: "Sem glúten", icon: ShieldCheck },
  { id: "artesanal", label: "Produção Artesanal", icon: Sparkles },
];

const BEVERAGE_OPTIONS = [
  { id: "gelada", label: "Bebida gelada" },
  { id: "alcoolica", label: "Bebida alcoólica" },
  { id: "natural", label: "Natural / Sem álcool" },
  { id: "zero", label: "Zero Caloria" },
];

interface ProductFoodSpecsCardProps {
  value: FoodSpecsData;
  onChange: (value: FoodSpecsData) => void;
  isFoodNiche?: boolean;
}

export function ProductFoodSpecsCard({
  value,
  onChange,
  isFoodNiche = true,
}: ProductFoodSpecsCardProps) {
  const dietary = value.dietaryRestrictions || [];
  const beverages = value.beverageTags || [];

  const toggleDietary = (id: string) => {
    const next = dietary.includes(id) ? dietary.filter((d) => d !== id) : [...dietary, id];
    onChange({ ...value, dietaryRestrictions: next });
  };

  const toggleBeverage = (id: string) => {
    const next = beverages.includes(id) ? beverages.filter((b) => b !== id) : [...beverages, id];
    onChange({ ...value, beverageTags: next });
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-6 shadow-xs">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3 border-b border-border/40 pb-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Especificações Gastronômicas & Destaque</h3>
            <Badge variant="outline" className="text-[10px] font-bold bg-primary/10 text-primary border-none">
              Padrão iFood
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Estas informações ajudam os clientes a encontrar seu produto através dos filtros do cardápio e no checkout.
          </p>
        </div>
      </div>

      {/* ── 1. Restrições Alimentares ── */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-bold text-foreground uppercase tracking-wider text-[11px]">
            Restrições Alimentares
          </Label>
          <span className="text-[10px] text-muted-foreground">Selecione todas que se aplicam</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {DIETARY_OPTIONS.map((item) => {
            const isSelected = dietary.includes(item.id);
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => toggleDietary(item.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer",
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary font-bold shadow-xs"
                    : "bg-muted/40 text-muted-foreground border-border/70 hover:border-foreground/30 hover:text-foreground"
                )}
              >
                <Icon className="size-3.5" />
                <span>{item.label}</span>
                {isSelected && <Check className="size-3 ml-0.5" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 2. Em Caso de Bebidas ── */}
      <div className="space-y-2.5 pt-2 border-t border-border/40">
        <Label className="text-xs font-bold text-foreground uppercase tracking-wider text-[11px]">
          Classificação para Bebidas
        </Label>
        <div className="flex flex-wrap gap-2">
          {BEVERAGE_OPTIONS.map((item) => {
            const isSelected = beverages.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => toggleBeverage(item.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer",
                  isSelected
                    ? "bg-foreground text-background border-foreground font-bold shadow-xs"
                    : "bg-muted/40 text-muted-foreground border-border/70 hover:border-foreground/30 hover:text-foreground"
                )}
              >
                <span>{item.label}</span>
                {isSelected && <Check className="size-3 ml-0.5" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 3. Tamanho do Item, Porção & Tempo de Preparo ── */}
      <div className="pt-2 border-t border-border/40 space-y-4">
        <Label className="text-xs font-bold text-foreground uppercase tracking-wider text-[11px]">
          Tamanho do Item & Porção da Refeição
        </Label>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Serve Até */}
          <div className="sm:col-span-4 space-y-1.5">
            <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Users className="size-3.5 text-muted-foreground" />
              <span>Serve até</span>
            </Label>
            <Select
              value={value.servesCount || "1 pessoa"}
              onValueChange={(val) => onChange({ ...value, servesCount: val })}
            >
              <SelectTrigger className="h-9 rounded-xl text-xs">
                <SelectValue placeholder="Selecione a porção" />
              </SelectTrigger>
              <SelectContent className="rounded-xl text-xs">
                <SelectItem value="1 pessoa">1 pessoa (Individual)</SelectItem>
                <SelectItem value="2 pessoas">2 pessoas</SelectItem>
                <SelectItem value="3-4 pessoas">3 a 4 pessoas</SelectItem>
                <SelectItem value="familia">Família (5+ pessoas)</SelectItem>
                <SelectItem value="petisco">Porção / Petisco para compartilhar</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Peso / Volume */}
          <div className="sm:col-span-4 space-y-1.5">
            <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Scale className="size-3.5 text-muted-foreground" />
              <span>Peso / Volume</span>
            </Label>
            <div className="flex items-center gap-1.5">
              <Input
                type="number"
                placeholder="Ex: 750"
                value={value.portionWeight || ""}
                onChange={(e) => onChange({ ...value, portionWeight: e.target.value })}
                className="h-9 text-xs rounded-xl flex-1"
              />
              <Select
                value={value.portionUnit || "g"}
                onValueChange={(val) => onChange({ ...value, portionUnit: val })}
              >
                <SelectTrigger className="h-9 w-20 rounded-xl text-xs shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl text-xs">
                  <SelectItem value="g">g</SelectItem>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="ml">ml</SelectItem>
                  <SelectItem value="L">L</SelectItem>
                  <SelectItem value="un">un</SelectItem>
                  <SelectItem value="fatias">fatias</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tempo de Preparo Próprio do Item */}
          <div className="sm:col-span-4 space-y-1.5">
            <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Clock className="size-3.5 text-muted-foreground" />
              <span>Preparo deste item</span>
            </Label>
            <div className="relative">
              <Input
                type="number"
                placeholder="Minutos (ex: 25)"
                value={value.preparationTimeMinutes ?? ""}
                onChange={(e) =>
                  onChange({
                    ...value,
                    preparationTimeMinutes: e.target.value ? parseInt(e.target.value, 10) : undefined,
                  })
                }
                className="h-9 text-xs rounded-xl pr-10"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-bold">
                min
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. Código PDV / SKU de Integração ── */}
      <div className="pt-2 border-t border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Tag className="size-3.5 text-muted-foreground" />
            <span>Código de Integração / PDV</span>
          </Label>
          <p className="text-[11px] text-muted-foreground">
            Código SKU interno usado para sincronizar com sistemas de frente de caixa ou iFood.
          </p>
        </div>
        <Input
          placeholder="Ex: XGAHTQ ou PRD-01"
          value={value.posCode || ""}
          onChange={(e) => onChange({ ...value, posCode: e.target.value.toUpperCase() })}
          className="h-9 text-xs rounded-xl font-mono max-w-xs uppercase"
        />
      </div>

      {/* Aviso de Transparência */}
      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-300 leading-snug">
        Lembre-se: Você é legalmente responsável pela veracidade dos ingredientes e restrições alimentares declaradas, garantindo segurança aos clientes com alergias alimentares.
      </div>
    </div>
  );
}
