import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  Gift,
  Copy,
  Check,
  Share2,
  Trophy,
  Ticket,
  Users,
  Award,
  ArrowRight,
  ShieldCheck,
  Flame,
  Calendar,
  ChevronRight,
  Loader2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  getMyInviteOverview,
  getInviteLeaderboard,
  getAvailableRewards,
  getActiveRaffles,
  claimReward,
  participateInRaffle,
  type InviteOverviewDTO,
  type AmbassadorLeaderboardItem,
  type InviteRewardDTO,
  type RaffleDTO,
} from "@/services/invite.functions";

export const Route = createFileRoute("/_store/convite")({
  head: () => ({
    meta: [
      { title: "Programa de Embaixadores & Convites | Wider" },
      {
        name: "description",
        content:
          "Convide amigos e empresas para a comunidade Wider, acumule pontos e troque por ingressos, vouchers e prêmios exclusivos.",
      },
    ],
  }),
  loader: async () => {
    try {
    const [overview, leaderboard, rewards, raffles] = await Promise.all([
      getMyInviteOverview().catch(() => null),
      getInviteLeaderboard().catch(() => []),
      getAvailableRewards().catch(() => []),
      getActiveRaffles().catch(() => []),
    ]);

    return { overview, leaderboard, rewards, raffles };
    } catch (err) {
      console.error("[loader:_store.convite] Unhandled loader error:", err);
      return null;
    }
  },
  component: ConvitePage,
});

const TIER_LABELS: Record<string, { label: string; color: string }> = {
  starter: { label: "Iniciante", color: "bg-muted text-muted-foreground" },
  bronze: { label: "Bronze", color: "bg-amber-900/30 text-amber-500 border border-amber-500/30" },
  silver: { label: "Prata", color: "bg-slate-300/20 text-slate-300 border border-slate-400/40" },
  gold: { label: "Ouro", color: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/40" },
  platinum: { label: "Platina", color: "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40" },
};

function ConvitePage() {
  const { overview: initialOverview, leaderboard, rewards, raffles } = Route.useLoaderData();
  const router = useRouter();

  const [overview, setOverview] = useState<InviteOverviewDTO | null>(initialOverview);
  const [copied, setCopied] = useState(false);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [enteringRaffleId, setEnteringRaffleId] = useState<string | null>(null);

  const handleCopyLink = () => {
    if (!overview?.shareUrl) return;
    navigator.clipboard.writeText(overview.shareUrl);
    setCopied(true);
    toast.success("Link exclusivo copiado para a área de transferência!");
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    if (!overview?.shareUrl) return;
    const msg = encodeURIComponent(
      `Olá! Te convido a conhecer a plataforma Wider na nossa região: notícias, classificados, eventos e comércio local. Acesse pelo meu link de convite: ${overview.shareUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${msg}`, "_blank");
  };

  const handleClaim = async (rewardId: string) => {
    setClaimingId(rewardId);
    try {
      const res = await claimReward({ data: { rewardId } });
      toast.success(res.message);
      if (overview) {
        setOverview({ ...overview, totalPoints: res.remainingPoints });
      }
      router.invalidate();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao resgatar recompensa.");
    } finally {
      setClaimingId(null);
    }
  };

  const handleEnterRaffle = async (raffleId: string) => {
    setEnteringRaffleId(raffleId);
    try {
      const res = await participateInRaffle({ data: { raffleId } });
      toast.success(res.message);
      if (overview) {
        setOverview({ ...overview, totalPoints: res.remainingPoints });
      }
      router.invalidate();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao participar do sorteio.");
    } finally {
      setEnteringRaffleId(null);
    }
  };

  const currentTierMeta = overview
    ? TIER_LABELS[overview.ambassadorTier] || TIER_LABELS.starter
    : TIER_LABELS.starter;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-10 pb-24 px-4 sm:px-6 pt-4">
      {/* ── 1. HERO & PAINEL DO EMBAIXADOR ── */}
      {overview ? (
        <section className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 space-y-6 shadow-sm relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <Badge className={`font-mono text-xs uppercase px-2.5 py-0.5 rounded-lg ${currentTierMeta.color}`}>
                  Embaixador {currentTierMeta.label}
                </Badge>
                <span className="text-xs font-mono text-muted-foreground">
                  Código: <strong>{overview.code}</strong>
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                Indicações
              </h1>
            </div>

            <div className="flex items-baseline gap-2 bg-muted/40 px-4 py-2.5 rounded-2xl border border-border/50">
              <Trophy className="size-5 text-amber-500" />
              <span className="text-2xl sm:text-3xl font-black font-mono text-foreground">
                {overview.totalPoints}
              </span>
              <span className="text-xs font-mono text-muted-foreground uppercase">pontos</span>
            </div>
          </div>

          {/* Barra de Progresso do Próximo Nível */}
          {overview.nextTier && (
            <div className="space-y-2 bg-muted/20 p-4 rounded-2xl border border-border/40">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-muted-foreground">
                  Próximo nível: <strong className="text-foreground uppercase">{overview.nextTier}</strong>
                </span>
                <span className="text-muted-foreground">
                  Faltam <strong>{overview.pointsToNextTier}</strong> pontos ({overview.tierProgressPercent}%)
                </span>
              </div>
              <Progress value={overview.tierProgressPercent} className="h-2 rounded-full" />
            </div>
          )}

          {/* Compartilhamento do Link Único */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider block">
              Seu Link Exclusivo de Indicação
            </label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="flex-1 bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs font-mono text-foreground select-all truncate">
                {overview.shareUrl}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCopyLink}
                  className="h-10 rounded-xl text-xs font-mono gap-1.5 flex-1 sm:flex-initial"
                >
                  {copied ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
                  <span>{copied ? "Copiado!" : "Copiar Link"}</span>
                </Button>
                <Button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="h-10 rounded-xl text-xs font-mono gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white flex-1 sm:flex-initial"
                >
                  <Share2 className="size-4" />
                  <span>WhatsApp</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Métricas Auditadas */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            <div className="rounded-2xl border border-border/60 bg-muted/30 p-3.5 text-center">
              <span className="text-[11px] font-mono text-muted-foreground uppercase block">Cliques no Link</span>
              <span className="text-xl font-bold font-mono text-foreground">{overview.clicks}</span>
            </div>
            <div className="rounded-2xl border border-border/60 bg-muted/30 p-3.5 text-center">
              <span className="text-[11px] font-mono text-muted-foreground uppercase block">Membros Cadastrados</span>
              <span className="text-xl font-bold font-mono text-foreground">{overview.conversions}</span>
            </div>
            <div className="col-span-2 sm:col-span-1 rounded-2xl border border-border/60 bg-muted/30 p-3.5 text-center">
              <span className="text-[11px] font-mono text-muted-foreground uppercase block">Pontos por Amigo</span>
              <span className="text-xl font-bold font-mono text-emerald-600">+100 pts</span>
            </div>
          </div>
        </section>
      ) : (
        /* Teaser para não autenticado */
        <section className="rounded-3xl border border-border/80 bg-card p-6 sm:p-10 space-y-6 text-center shadow-sm">
          <div className="size-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
            <Gift className="size-7" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              Embaixadores
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Convide seus amigos e comércios locais para a Wider. A cada novo membro cadastrado pelo seu link, você ganha 100 pontos para trocar por ingressos e prêmios.
            </p>
          </div>
          <div className="flex justify-center">
            <Link
              to="/entrar"
              className="h-11 px-8 rounded-xl bg-foreground text-background font-bold text-sm flex items-center justify-center gap-2 hover:bg-foreground/90 transition-all shadow-sm"
            >
              <span>Entrar e Gerar Meu Link de Convite</span>
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>
      )}

      {/* ── 2. CATÁLOGO REAL DE RECOMPENSAS (PRÊMIOS) ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-foreground">Prêmios & Experiências Resgatáveis</h2>
            <p className="text-xs text-muted-foreground">Troque seus pontos acumulados por benefícios reais na região.</p>
          </div>
          <Badge variant="outline" className="font-mono text-xs">
            {rewards.length} prêmios
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rewards.map((reward) => {
            const canClaim = overview && overview.totalPoints >= reward.pointsRequired;
            const isOutOfStock = reward.stock !== null && reward.stock <= 0;

            return (
              <div
                key={reward.id}
                className="rounded-2xl border border-border/70 bg-card overflow-hidden flex flex-col justify-between p-4 space-y-3 hover:border-foreground/30 transition-all shadow-sm"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-black font-mono text-foreground">
                      {reward.pointsRequired} pts
                    </span>
                    {reward.stock !== null && (
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {reward.stock} disponíveis
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-foreground leading-snug">{reward.title}</h3>
                  {reward.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{reward.description}</p>
                  )}
                </div>

                <Button
                  type="button"
                  variant={canClaim ? "default" : "secondary"}
                  disabled={!canClaim || isOutOfStock || claimingId === reward.id}
                  onClick={() => handleClaim(reward.id)}
                  className="w-full h-9 rounded-xl text-xs font-mono font-bold"
                >
                  {claimingId === reward.id ? (
                    <Loader2 className="size-3.5 animate-spin mr-1.5" />
                  ) : null}
                  {isOutOfStock
                    ? "Esgotado"
                    : !overview
                    ? "Faça login para resgatar"
                    : canClaim
                    ? "Resgatar Recompensa"
                    : `Faltam ${reward.pointsRequired - (overview?.totalPoints || 0)} pts`}
                </Button>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 3. SORTEIOS OFICIAIS ── */}
      {raffles.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-foreground">Sorteios Oficiais</h2>
              <p className="text-xs text-muted-foreground">Participe com cupons gerados a partir dos seus pontos de convite.</p>
            </div>
            <Badge variant="outline" className="font-mono text-xs">
              Auditado
            </Badge>
          </div>

          <div className="space-y-4">
            {raffles.map((raffle) => {
              const hasPoints = overview && overview.totalPoints >= raffle.pointsCost;
              const hasReachedLimit = raffle.myTicketsCount >= raffle.maxTicketsPerUser;

              return (
                <div
                  key={raffle.id}
                  className="rounded-3xl border border-border/80 bg-card p-5 sm:p-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6 shadow-sm"
                >
                  <div className="space-y-2 max-w-xl">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-amber-500 text-black font-mono text-[9px] font-bold uppercase">
                        Sorteio Ativo
                      </Badge>
                      <span className="text-xs font-mono text-muted-foreground flex items-center gap-1">
                        <Clock className="size-3" />
                        Sorteio em: {new Date(raffle.drawDate).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-foreground leading-snug">
                      {raffle.title}
                    </h3>
                    {raffle.description && (
                      <p className="text-xs text-muted-foreground">{raffle.description}</p>
                    )}
                    <div className="flex items-center gap-3 pt-1 text-xs font-mono text-muted-foreground">
                      <span>Custo: <strong>{raffle.pointsCost} pontos/bilhete</strong></span>
                      {overview && (
                        <span>Seus bilhetes: <strong className="text-foreground">{raffle.myTicketsCount}</strong></span>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center">
                    <Button
                      type="button"
                      disabled={!hasPoints || hasReachedLimit || enteringRaffleId === raffle.id}
                      onClick={() => handleEnterRaffle(raffle.id)}
                      className="h-11 px-6 rounded-xl font-mono text-xs font-bold w-full md:w-auto"
                    >
                      {enteringRaffleId === raffle.id ? (
                        <Loader2 className="size-3.5 animate-spin mr-1.5" />
                      ) : (
                        <Ticket className="size-4 mr-1.5" />
                      )}
                      {hasReachedLimit
                        ? "Limite Atingido"
                        : !overview
                        ? "Entrar para Participar"
                        : hasPoints
                        ? `Gerar Bilhete (${raffle.pointsCost} pts)`
                        : `Precisa de ${raffle.pointsCost} pts`}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── 4. LEADERBOARD TOP 10 EMBAIXADORES ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-foreground">Top Embaixadores Comunitários</h2>
            <p className="text-xs text-muted-foreground">Membros que mais impulsionam a rede local.</p>
          </div>
          <Trophy className="size-5 text-amber-500" />
        </div>

        <div className="rounded-2xl border border-border/70 bg-card overflow-hidden divide-y divide-border/60">
          {leaderboard.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              Seja o primeiro a convidar amigos e assumir a liderança!
            </div>
          ) : (
            leaderboard.map((ambassador) => {
              const tierBadge = TIER_LABELS[ambassador.tier] || TIER_LABELS.starter;

              return (
                <div
                  key={ambassador.userId}
                  className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold w-6 text-center text-muted-foreground">
                      #{ambassador.rank}
                    </span>
                    <div className="size-8 rounded-full bg-muted flex items-center justify-center font-bold text-xs text-foreground shrink-0 overflow-hidden">
                      {ambassador.avatarUrl ? (
                        <img src={ambassador.avatarUrl} alt="" className="size-full object-cover" />
                      ) : (
                        ambassador.displayName[0]
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-foreground block">{ambassador.displayName}</span>
                      <Badge className={`font-mono text-[9px] uppercase px-1.5 py-0 ${tierBadge.color}`}>
                        {tierBadge.label}
                      </Badge>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-black font-mono text-foreground block">
                      {ambassador.totalPoints} pts
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
