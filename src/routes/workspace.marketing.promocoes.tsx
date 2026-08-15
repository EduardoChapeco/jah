import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Flame,
  Plus,
  Percent,
  Sparkles,
  Calendar,
  Package,
  CheckCircle2,
  Clock,
  Trash2,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  listStorePromotions,
  createPromotion,
  togglePromotionStatus,
  type PromotionDTO,
} from "@/services/promotions.functions";
import { formatMoney } from "@/lib/money";
import { toast } from "sonner";

export const Route = createFileRoute("/workspace/marketing/promocoes")({
  head: () => ({
    meta: [{ title: "Promoções & Ofertas Relâmpago | Workspace JAH" }],
  }),
  loader: async () => {
    const promotions = await listStorePromotions();
    return { promotions };
  },
  component: WorkspacePromotionsPage,
});

function WorkspacePromotionsPage() {
  const { promotions: initialPromos } = Route.useLoaderData();
  const [promos, setPromos] = useState<PromotionDTO[]>(initialPromos);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<PromotionDTO["type"]>("flash_offer");
  const [discountPercent, setDiscountPercent] = useState<number>(20);
  const [buyQty, setBuyQty] = useState<number>(2);
  const [getQty, setGetQty] = useState<number>(1);
  const [durationHours, setDurationHours] = useState<number>(24);

  const handleToggle = async (promoId: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    setPromos((prev) => prev.map((p) => (p.id === promoId ? { ...p, is_active: nextStatus } : p)));

    try {
      await togglePromotionStatus({
        data: { id: promoId, is_active: nextStatus },
      });
      toast.success(nextStatus ? "Promoção ativada!" : "Promoção pausada.");
    } catch {
      toast.error("Erro ao alterar status.");
      // Rollback
      setPromos((prev) =>
        prev.map((p) => (p.id === promoId ? { ...p, is_active: currentStatus } : p)),
      );
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      toast.error("Informe o título da promoção.");
      return;
    }

    setIsSubmitting(true);
    try {
      const endsAt = new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString();

      await createPromotion({
        data: {
          title,
          description,
          type,
          discount_percent: discountPercent,
          buy_qty: buyQty,
          get_qty: getQty,
          ends_at: endsAt,
        },
      });

      toast.success("Promoção criada com sucesso!");
      setIsDialogOpen(false);
      // Reload
      const updated = await listStorePromotions();
      setPromos(updated);

      // Reset form
      setTitle("");
      setDescription("");
    } catch (err: unknown) {
      toast.error("Erro ao salvar promoção.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Flame className="size-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Promoções & Ofertas Relâmpago
              </h1>
              <p className="text-xs text-muted-foreground">
                Crie mecânicas de desconto, ofertas por tempo limitado e impulsione seu canal no
                Mercado JAH.
              </p>
            </div>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl font-bold bg-primary text-primary-foreground text-xs gap-2 shadow-xs">
              <Plus className="size-4" />
              Nova Promoção
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg rounded-2xl">
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle className="text-base font-bold flex items-center gap-2">
                  <Flame className="size-4 text-amber-500" />
                  Criar Nova Oferta ou Promoção
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Título Comercial</label>
                  <Input
                    placeholder="Ex: 30% OFF em Todos os Burgers Artesanais"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Mecânica Promocional</label>
                  <Select value={type} onValueChange={(val: any) => setType(val)}>
                    <SelectTrigger className="rounded-xl text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl text-xs">
                      <SelectItem value="flash_offer">
                        ⚡ Oferta Relâmpago (Contagem Regressiva)
                      </SelectItem>
                      <SelectItem value="percentage_discount">
                        % Desconto Percentual Direto
                      </SelectItem>
                      <SelectItem value="buy_x_get_y">🎁 Compre X e Leve Y (Combo)</SelectItem>
                      <SelectItem value="progressive_quantity">
                        📈 Desconto Progressivo por Quantidade
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(type === "flash_offer" || type === "percentage_discount") && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="font-semibold text-foreground">Desconto (%)</label>
                      <Input
                        type="number"
                        min={1}
                        max={90}
                        value={discountPercent}
                        onChange={(e) => setDiscountPercent(Number(e.target.value))}
                        className="rounded-xl text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-semibold text-foreground">Duração (Horas)</label>
                      <Input
                        type="number"
                        min={1}
                        max={168}
                        value={durationHours}
                        onChange={(e) => setDurationHours(Number(e.target.value))}
                        className="rounded-xl text-xs"
                      />
                    </div>
                  </div>
                )}

                {type === "buy_x_get_y" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="font-semibold text-foreground">Compre Quantidade</label>
                      <Input
                        type="number"
                        min={1}
                        value={buyQty}
                        onChange={(e) => setBuyQty(Number(e.target.value))}
                        className="rounded-xl text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-semibold text-foreground">Pague Quantidade</label>
                      <Input
                        type="number"
                        min={1}
                        value={getQty}
                        onChange={(e) => setGetQty(Number(e.target.value))}
                        className="rounded-xl text-xs"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">
                    Regulamento / Descrição Curta
                  </label>
                  <Textarea
                    placeholder="Válido enquanto durarem os estoques. Limite de 2 por CPF."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    className="rounded-xl text-xs"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="rounded-xl text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl text-xs font-bold bg-primary text-primary-foreground"
                >
                  {isSubmitting ? "Salvando..." : "Publicar Promoção"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* ── Stats Bar ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl border border-border/80 bg-card space-y-1 shadow-2xs">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            Promoções Ativas
          </span>
          <div className="text-2xl font-mono font-black text-foreground">
            {promos.filter((p) => p.is_active).length}
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-border/80 bg-card space-y-1 shadow-2xs">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            Total de Ofertas Criadas
          </span>
          <div className="text-2xl font-mono font-black text-foreground">{promos.length}</div>
        </div>

        <div className="p-4 rounded-2xl border border-border/80 bg-card space-y-1 shadow-2xs">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            Desconto Médio Aplicado
          </span>
          <div className="text-2xl font-mono font-black text-primary">
            {promos.length > 0
              ? `${Math.round(
                  promos.reduce((acc, p) => acc + (p.discount_percent || 0), 0) /
                    Math.max(1, promos.length),
                )}%`
              : "0%"}
          </div>
        </div>
      </div>

      {/* ── Promotions List ───────────────────────────────────── */}
      <div className="space-y-3">
        {promos.length === 0 ? (
          <div className="p-12 text-center space-y-3 rounded-2xl border border-dashed border-border bg-card/40">
            <Tag className="size-8 text-muted-foreground mx-auto" />
            <h3 className="text-sm font-bold text-foreground">Nenhuma promoção cadastrada ainda</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Crie sua primeira oferta relâmpago para aparecer em destaque na vitrine e nos rails do
              Mercado Central.
            </p>
          </div>
        ) : (
          promos.map((promo) => (
            <div
              key={promo.id}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-2xl border border-border/80 bg-card gap-4 shadow-2xs hover:border-primary/40 transition-all"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div
                  className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${
                    promo.type === "flash_offer"
                      ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                      : "bg-primary/10 text-primary border border-primary/20"
                  }`}
                >
                  {promo.type === "flash_offer" ? (
                    <Flame className="size-5" />
                  ) : (
                    <Percent className="size-5" />
                  )}
                </div>

                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-foreground truncate">{promo.title}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase font-mono bg-primary/10 text-primary">
                      {promo.discount_percent ? `${promo.discount_percent}% OFF` : "COMBO"}
                    </span>
                  </div>
                  {promo.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {promo.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-border/40">
                <div className="text-left sm:text-right">
                  <span className="text-[11px] text-muted-foreground block font-mono">
                    {promo.ends_at
                      ? `Até ${new Date(promo.ends_at).toLocaleDateString("pt-BR")}`
                      : "Sem data limite"}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-semibold text-muted-foreground">
                    {promo.is_active ? "Ativa" : "Pausada"}
                  </span>
                  <Switch
                    checked={promo.is_active}
                    onCheckedChange={() => handleToggle(promo.id, promo.is_active)}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
