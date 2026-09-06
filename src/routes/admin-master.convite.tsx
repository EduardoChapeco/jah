import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  Gift,
  Trophy,
  Ticket,
  Users,
  Plus,
  Play,
  CheckCircle2,
  Clock,
  Award,
  Calendar,
  Layers,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  adminListGamification,
  adminDrawRaffle,
  adminUpsertReward,
  adminCreateRaffle,
} from "@/services/invite.functions";

export const Route = createFileRoute("/admin-master/convite")({
  head: () => ({ meta: [{ title: "Gestão de Convites, Prêmios & Sorteios | Admin Master" }] }),
  loader: async () => {
    try {
      const data = await adminListGamification();
      return data;
    } catch (e: any) {
      console.error("[admin-master.convite] Loader error:", e);
      return {
        totalLinks: 0,
        totalConversions: 0,
        links: [],
        conversions: [],
        rewards: [],
        raffles: [],
      };
    }
  },
  component: AdminConvitePage,
});

function AdminConvitePage() {
  const data = Route.useLoaderData();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"sorteios" | "premios" | "conversoes">("sorteios");
  const [drawingRaffleId, setDrawingRaffleId] = useState<string | null>(null);
  const [raffleToDraw, setRaffleToDraw] = useState<any | null>(null);

  // New Raffle Modal
  const [isRaffleModalOpen, setIsRaffleModalOpen] = useState(false);
  const [newRaffleTitle, setNewRaffleTitle] = useState("");
  const [newRaffleDesc, setNewRaffleDesc] = useState("");
  const [newRaffleImg, setNewRaffleImg] = useState("");
  const [newRafflePoints, setNewRafflePoints] = useState(50);
  const [newRaffleDate, setNewRaffleDate] = useState("");
  const [isSavingRaffle, setIsSavingRaffle] = useState(false);

  // New Reward Modal
  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);
  const [newRewardTitle, setNewRewardTitle] = useState("");
  const [newRewardDesc, setNewRewardDesc] = useState("");
  const [newRewardPoints, setNewRewardPoints] = useState(300);
  const [newRewardStock, setNewRewardStock] = useState<number | undefined>(10);
  const [newRewardType, setNewRewardType] = useState("ticket");
  const [isSavingReward, setIsSavingReward] = useState(false);

  const confirmDrawRaffle = async () => {
    if (!raffleToDraw) return;

    setDrawingRaffleId(raffleToDraw.id);
    try {
      const res = await adminDrawRaffle({ data: { raffleId: raffleToDraw.id } });
      toast.success(
        `Sorteio apurado com sucesso! Bilhete vencedor: #${res.ticketNumber} (${res.winnerName})`,
        { duration: 6000 }
      );
      setRaffleToDraw(null);
      router.invalidate();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao realizar apuração do sorteio.");
    } finally {
      setDrawingRaffleId(null);
    }
  };

  const handleCreateRaffleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRaffleTitle.trim() || !newRaffleDate) {
      toast.error("Preencha título e data do sorteio.");
      return;
    }

    setIsSavingRaffle(true);
    try {
      await adminCreateRaffle({
        data: {
          title: newRaffleTitle.trim(),
          description: newRaffleDesc.trim() || undefined,
          image_url: newRaffleImg.trim() || undefined,
          points_cost: newRafflePoints,
          draw_date: new Date(newRaffleDate).toISOString(),
        },
      });
      toast.success("Sorteio oficial criado com sucesso!");
      setIsRaffleModalOpen(false);
      setNewRaffleTitle("");
      setNewRaffleDesc("");
      router.invalidate();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao criar sorteio.");
    } finally {
      setIsSavingRaffle(false);
    }
  };

  const handleCreateRewardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRewardTitle.trim() || !newRewardPoints) {
      toast.error("Preencha título e pontos da recompensa.");
      return;
    }

    setIsSavingReward(true);
    try {
      await adminUpsertReward({
        data: {
          title: newRewardTitle.trim(),
          description: newRewardDesc.trim() || undefined,
          points_required: newRewardPoints,
          stock: newRewardStock ?? null,
          reward_type: newRewardType,
          active: true,
        },
      });
      toast.success("Recompensa cadastrada no catálogo!");
      setIsRewardModalOpen(false);
      setNewRewardTitle("");
      setNewRewardDesc("");
      router.invalidate();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao cadastrar recompensa.");
    } finally {
      setIsSavingReward(false);
    }
  };

  return (
    <div className="w-full space-y-6 pb-20 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* ── 1. TOPO & ESTATÍSTICAS DO PROGRAMA ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Programa de Convites, Prêmios & Sorteios
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Governança da gamificação comunitária, controle de apuração de sorteios e estoque de recompensas.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-border/70 bg-card p-4">
          <span className="text-xs font-mono text-muted-foreground uppercase block">Links de Convite</span>
          <span className="text-2xl font-black font-mono text-foreground">{data.totalLinks}</span>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-4">
          <span className="text-xs font-mono text-muted-foreground uppercase block">Membros Convertidos</span>
          <span className="text-2xl font-black font-mono text-foreground">{data.totalConversions}</span>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-4">
          <span className="text-xs font-mono text-muted-foreground uppercase block">Prêmios no Catálogo</span>
          <span className="text-2xl font-black font-mono text-foreground">{data.rewards.length}</span>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-4">
          <span className="text-xs font-mono text-muted-foreground uppercase block">Sorteios Ativos</span>
          <span className="text-2xl font-black font-mono text-foreground">
            {data.raffles.filter((r: any) => r.status === "active").length}
          </span>
        </div>
      </div>

      {/* ── 2. NAVEGAÇÃO DE ABAS ── */}
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("sorteios")}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
            activeTab === "sorteios"
              ? "bg-foreground text-background shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
          }`}
        >
          Sorteios Oficiais ({data.raffles.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("premios")}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
            activeTab === "premios"
              ? "bg-foreground text-background shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
          }`}
        >
          Catálogo de Prêmios ({data.rewards.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("conversoes")}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
            activeTab === "conversoes"
              ? "bg-foreground text-background shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
          }`}
        >
          Telemetria de Indicações ({data.conversions.length})
        </button>
      </div>

      {/* ── 3. CONTEÚDO DAS ABAS ── */}

      {/* ABA 1: SORTEIOS OFICIAIS */}
      {activeTab === "sorteios" && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-muted-foreground">
              A apuração sorteia de forma criptográfica entre todos os bilhetes emitidos.
            </span>
            <Button
              type="button"
              onClick={() => setIsRaffleModalOpen(true)}
              className="h-9 rounded-xl text-xs font-mono gap-1.5"
            >
              <Plus className="size-3.5" />
              <span>Novo Sorteio</span>
            </Button>
          </div>

          <div className="space-y-3">
            {data.raffles.length === 0 ? (
              <div className="p-12 text-center text-xs text-muted-foreground bg-card rounded-2xl border border-border/70">
                Nenhum sorteio cadastrado.
              </div>
            ) : (
              data.raffles.map((raffle: any) => {
                const isCompleted = raffle.status === "completed";

                return (
                  <div
                    key={raffle.id}
                    className="rounded-2xl border border-border/70 bg-card p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 max-w-xl">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={isCompleted ? "secondary" : "default"}
                          className="font-mono text-[10px] uppercase"
                        >
                          {isCompleted ? "Concluído / Sorteado" : "Ativo"}
                        </Badge>
                        <span className="text-xs font-mono text-muted-foreground">
                          Data: {new Date(raffle.draw_date).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-foreground">{raffle.title}</h3>
                      {raffle.description && (
                        <p className="text-xs text-muted-foreground">{raffle.description}</p>
                      )}
                      <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground pt-1">
                        <span>Custo: {raffle.points_cost} pts</span>
                        <span>•</span>
                        <span>Total de Bilhetes: <strong>{raffle.totalTickets}</strong></span>
                        {raffle.winner_ticket_number && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-600 font-bold">
                              Ganhador: Bilhete #{raffle.winner_ticket_number}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {!isCompleted && (
                        <Button
                          type="button"
                          disabled={drawingRaffleId === raffle.id || raffle.totalTickets === 0}
                          onClick={() => setRaffleToDraw(raffle)}
                          className="h-9 rounded-xl text-xs font-mono font-bold gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
                        >
                          {drawingRaffleId === raffle.id ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Play className="size-3.5" />
                          )}
                          <span>Realizar Apuração</span>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      )}

      {/* ABA 2: CATÁLOGO DE PRÊMIOS */}
      {activeTab === "premios" && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-muted-foreground">
              Recompensas resgatáveis pelos usuários com saldo de pontos.
            </span>
            <Button
              type="button"
              onClick={() => setIsRewardModalOpen(true)}
              className="h-9 rounded-xl text-xs font-mono gap-1.5"
            >
              <Plus className="size-3.5" />
              <span>Adicionar Prêmio</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.rewards.map((reward: any) => (
              <div
                key={reward.id}
                className="rounded-2xl border border-border/70 bg-card p-4 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {reward.reward_type}
                    </Badge>
                    <span className="text-sm font-black font-mono text-foreground">
                      {reward.points_required} pts
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-foreground">{reward.title}</h3>
                  {reward.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{reward.description}</p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs font-mono text-muted-foreground">
                  <span>Estoque: {reward.stock ?? "Ilimitado"}</span>
                  <Badge variant={reward.active ? "default" : "secondary"} className="text-[9px]">
                    {reward.active ? "Ativo" : "Pausado"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ABA 3: TELEMETRIA DE CONVERSÕES */}
      {activeTab === "conversoes" && (
        <section className="space-y-4">
          <div className="rounded-2xl border border-border/70 bg-card overflow-hidden">
            <div className="divide-y divide-border/60">
              {data.conversions.length === 0 ? (
                <div className="p-10 text-center text-xs text-muted-foreground">
                  Nenhuma conversão registrada ainda.
                </div>
              ) : (
                data.conversions.map((conv: any) => (
                  <div key={conv.id} className="p-4 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <span className="font-bold text-foreground">
                        {conv.invited_profile?.full_name || "Membro Registrado"}
                      </span>
                      <span className="text-muted-foreground font-mono block text-[11px]">
                        Data: {new Date(conv.created_at).toLocaleString("pt-BR")}
                      </span>
                    </div>
                    <div className="text-right space-y-0.5 font-mono">
                      <span className="text-emerald-600 font-bold">+{conv.points_awarded} pts</span>
                      <Badge variant="outline" className="text-[9px] block">
                        {conv.status}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── MODAL NOVO SORTEIO ── */}
      <Dialog open={isRaffleModalOpen} onOpenChange={setIsRaffleModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Criar Novo Sorteio Oficial</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateRaffleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label className="text-xs">Título do Sorteio *</Label>
              <Input
                value={newRaffleTitle}
                onChange={(e) => setNewRaffleTitle(e.target.value)}
                placeholder="Ex: Fim de Semana em Pousada Termas"
                className="h-10 rounded-xl text-xs"
                required
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Descrição / Regulamento</Label>
              <Textarea
                value={newRaffleDesc}
                onChange={(e) => setNewRaffleDesc(e.target.value)}
                placeholder="Detalhes sobre a experiência, acomodação e regras..."
                className="rounded-xl text-xs min-h-20"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Custo por Bilhete (Pontos)</Label>
                <Input
                  type="number"
                  value={newRafflePoints}
                  onChange={(e) => setNewRafflePoints(parseInt(e.target.value) || 0)}
                  className="h-10 rounded-xl text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Data da Apuração *</Label>
                <Input
                  type="date"
                  value={newRaffleDate}
                  onChange={(e) => setNewRaffleDate(e.target.value)}
                  className="h-10 rounded-xl text-xs font-mono"
                  required
                />
              </div>
            </div>
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsRaffleModalOpen(false)}
                className="h-9 rounded-xl text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSavingRaffle}
                className="h-9 rounded-xl text-xs font-mono font-bold"
              >
                {isSavingRaffle ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : null}
                Salvar Sorteio
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── MODAL NOVO PRÊMIO ── */}
      <Dialog open={isRewardModalOpen} onOpenChange={setIsRewardModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Cadastrar Recompensa no Catálogo</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateRewardSubmit} className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label className="text-xs">Título do Prêmio *</Label>
              <Input
                value={newRewardTitle}
                onChange={(e) => setNewRewardTitle(e.target.value)}
                placeholder="Ex: Ingresso Parque Beto Carrero World"
                className="h-10 rounded-xl text-xs"
                required
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Descrição</Label>
              <Textarea
                value={newRewardDesc}
                onChange={(e) => setNewRewardDesc(e.target.value)}
                placeholder="Instruções de uso e validade..."
                className="rounded-xl text-xs min-h-20"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Pontos Necessários *</Label>
                <Input
                  type="number"
                  value={newRewardPoints}
                  onChange={(e) => setNewRewardPoints(parseInt(e.target.value) || 0)}
                  className="h-10 rounded-xl text-xs font-mono"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Estoque (Qtd)</Label>
                <Input
                  type="number"
                  value={newRewardStock ?? ""}
                  onChange={(e) => setNewRewardStock(e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="Vazio = Ilimitado"
                  className="h-10 rounded-xl text-xs font-mono"
                />
              </div>
            </div>
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsRewardModalOpen(false)}
                className="h-9 rounded-xl text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSavingReward}
                className="h-9 rounded-xl text-xs font-mono font-bold"
              >
                {isSavingReward ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : null}
                Cadastrar Prêmio
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Confirmação de Realização de Sorteio */}
      <AlertDialog open={Boolean(raffleToDraw)} onOpenChange={(open) => { if (!open) setRaffleToDraw(null); }}>
        <AlertDialogContent className="max-w-md rounded-2xl p-6 border-border/80">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold">
              Realizar apuração do sorteio?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Você está prestes a apurar o sorteio <strong className="text-foreground">{raffleToDraw?.title}</strong>.
              O algoritmo criptográfico no servidor selecionará aleatoriamente um bilhete válido, registrará o ganhador e encerrará as apostas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2">
            <AlertDialogCancel
              disabled={Boolean(drawingRaffleId)}
              className="h-10 px-4 rounded-xl text-xs font-semibold"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDrawRaffle();
              }}
              disabled={Boolean(drawingRaffleId)}
              className="h-10 px-4 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white"
            >
              {drawingRaffleId ? "Apurando..." : "Confirmar e Sortear"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
