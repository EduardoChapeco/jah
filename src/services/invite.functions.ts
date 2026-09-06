import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase";
import { getIdentity } from "./identity.functions";

export interface InviteOverviewDTO {
  code: string;
  shareUrl: string;
  totalPoints: number;
  totalTokens: number;
  ambassadorTier: "starter" | "bronze" | "silver" | "gold" | "platinum";
  nextTier: "bronze" | "silver" | "gold" | "platinum" | null;
  pointsToNextTier: number;
  tokensToNextTier: number;
  tierProgressPercent: number;
  clicks: number;
  conversions: number;
  recentConversions: Array<{
    id: string;
    invitedName: string;
    pointsAwarded: number;
    tokensAwarded: number;
    createdAt: string;
  }>;
}

export interface AmbassadorLeaderboardItem {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  totalPoints: number;
  totalTokens: number;
  tier: string;
  rank: number;
}

export interface InviteRewardDTO {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  pointsRequired: number;
  tokensRequired: number;
  rewardType: string;
  stock: number | null;
  active: boolean;
}

export interface RaffleDTO {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  rules: Record<string, any>;
  ticketPriceCents: number;
  pointsCost: number;
  tokensCost: number;
  maxTicketsPerUser: number;
  drawDate: string;
  status: "draft" | "active" | "drawing" | "completed" | "cancelled";
  winnerUserId: string | null;
  winnerTicketNumber: number | null;
  myTicketsCount: number;
  totalTicketsCount: number;
}

const TIER_THRESHOLDS = {
  starter: 0,
  bronze: 300,
  silver: 1000,
  gold: 2500,
  platinum: 5000,
};

function calculateTierProgress(points: number): {
  currentTier: "starter" | "bronze" | "silver" | "gold" | "platinum";
  nextTier: "bronze" | "silver" | "gold" | "platinum" | null;
  pointsToNext: number;
  percent: number;
} {
  if (points >= TIER_THRESHOLDS.platinum) {
    return { currentTier: "platinum", nextTier: null, pointsToNext: 0, percent: 100 };
  }
  if (points >= TIER_THRESHOLDS.gold) {
    const range = TIER_THRESHOLDS.platinum - TIER_THRESHOLDS.gold;
    const current = points - TIER_THRESHOLDS.gold;
    return {
      currentTier: "gold",
      nextTier: "platinum",
      pointsToNext: TIER_THRESHOLDS.platinum - points,
      percent: Math.min(100, Math.round((current / range) * 100)),
    };
  }
  if (points >= TIER_THRESHOLDS.silver) {
    const range = TIER_THRESHOLDS.gold - TIER_THRESHOLDS.silver;
    const current = points - TIER_THRESHOLDS.silver;
    return {
      currentTier: "silver",
      nextTier: "gold",
      pointsToNext: TIER_THRESHOLDS.gold - points,
      percent: Math.min(100, Math.round((current / range) * 100)),
    };
  }
  if (points >= TIER_THRESHOLDS.bronze) {
    const range = TIER_THRESHOLDS.silver - TIER_THRESHOLDS.bronze;
    const current = points - TIER_THRESHOLDS.bronze;
    return {
      currentTier: "bronze",
      nextTier: "silver",
      pointsToNext: TIER_THRESHOLDS.silver - points,
      percent: Math.min(100, Math.round((current / range) * 100)),
    };
  }
  return {
    currentTier: "starter",
    nextTier: "bronze",
    pointsToNext: TIER_THRESHOLDS.bronze - points,
    percent: Math.min(100, Math.round((points / TIER_THRESHOLDS.bronze) * 100)),
  };
}

/**
 * Retorna o painel completo do usuário autenticado no Módulo Convite
 */
export const getMyInviteOverview = createServerFn({ method: "GET" })
  .handler(async (): Promise<InviteOverviewDTO | null> => {
    const identity = await getIdentity().catch(() => null);
    if (!identity?.id) return null;

    const supabase = getServerClient();

    // 1. Garante código de convite via RPC atômico
    const { data: codeData, error: codeErr } = await supabase.rpc("get_or_create_user_invite", {
      p_user_id: identity.id,
      p_type: "user",
    });

    const code = codeData || `WIDER-${identity.id.substring(0, 6).toUpperCase()}`;

    // 2. Busca link e métricas
    const { data: linkData } = await supabase
      .from("invite_links")
      .select("id, clicks, conversions, points_earned")
      .eq("user_id", identity.id)
      .eq("invite_type", "user")
      .maybeSingle();

    // 3. Busca score e tier
    const { data: scoreData } = await supabase
      .from("invite_scores")
      .select("total_points, ambassador_tier")
      .eq("user_id", identity.id)
      .maybeSingle();

    const totalPoints = scoreData?.total_points ?? linkData?.points_earned ?? 0;
    const tierMeta = calculateTierProgress(totalPoints);

    // 4. Busca conversões recentes
    let recentConversions: Array<{
      id: string;
      invitedName: string;
      pointsAwarded: number;
      createdAt: string;
    }> = [];

    if (linkData?.id) {
      const { data: convs } = await supabase
        .from("invite_conversions")
        .select("id, points_awarded, created_at, invited_user_id")
        .eq("invite_link_id", linkData.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (convs && convs.length > 0) {
        const userIds = convs.map((c) => c.invited_user_id);
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", userIds);

        const profMap = new Map((profs || []).map((p) => [p.id, p.full_name]));

        recentConversions = convs.map((c) => ({
          id: c.id,
          invitedName: profMap.get(c.invited_user_id) || "Membro Convidado",
          pointsAwarded: c.points_awarded,
          tokensAwarded: c.points_awarded,
          createdAt: c.created_at,
        }));
      }
    }

    return {
      code,
      shareUrl: `https://wider.app.br/convite?ref=${code}`,
      totalPoints,
      totalTokens: totalPoints,
      ambassadorTier: tierMeta.currentTier,
      nextTier: tierMeta.nextTier,
      pointsToNextTier: tierMeta.pointsToNext,
      tokensToNextTier: tierMeta.pointsToNext,
      tierProgressPercent: tierMeta.percent,
      clicks: linkData?.clicks || 0,
      conversions: linkData?.conversions || 0,
      recentConversions,
    };
  });

/**
 * Leaderboard público dos 10 maiores embaixadores comunitários
 */
export const getInviteLeaderboard = createServerFn({ method: "GET" })
  .handler(async (): Promise<AmbassadorLeaderboardItem[]> => {
    const supabase = getServerClient();

    const { data: scores, error } = await supabase
      .from("invite_scores")
      .select("user_id, total_points, ambassador_tier")
      .order("total_points", { ascending: false })
      .limit(10);

    if (error || !scores || scores.length === 0) return [];

    const userIds = scores.map((s) => s.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", userIds);

    const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

    return scores.map((s, idx) => {
      const prof = profileMap.get(s.user_id);
      let name = prof?.full_name || "Embaixador";
      const parts = name.trim().split(" ");
      if (parts.length > 1) {
        name = `${parts[0]} ${parts[1][0]}.`;
      }

      return {
        userId: s.user_id,
        displayName: name,
        avatarUrl: prof?.avatar_url || null,
        totalPoints: s.total_points,
        totalTokens: s.total_points,
        tier: s.ambassador_tier,
        rank: idx + 1,
      };
    });
  });

/**
 * Lista o catálogo real de recompensas por pontos
 */
export const getAvailableRewards = createServerFn({ method: "GET" })
  .handler(async (): Promise<InviteRewardDTO[]> => {
    const supabase = getServerClient();

    const { data, error } = await supabase
      .from("invite_rewards")
      .select("*")
      .eq("active", true)
      .order("points_required", { ascending: true });

    if (error || !data) return [];

    return data.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      imageUrl: r.image_url,
      pointsRequired: r.points_required,
      tokensRequired: r.points_required,
      rewardType: r.reward_type,
      stock: r.stock,
      active: r.active,
    }));
  });

/**
 * Resgate real de recompensa por pontos
 */
export const claimReward = createServerFn({ method: "POST" })
  .validator(z.object({ rewardId: z.string().uuid() }))
  .handler(async ({ data: { rewardId } }) => {
    const identity = await getIdentity();
    if (!identity?.id) throw new Error("Apenas membros autenticados podem resgatar recompensas.");

    const supabase = getServerClient();

    // 1. Busca prêmio
    const { data: reward, error: rewErr } = await supabase
      .from("invite_rewards")
      .select("*")
      .eq("id", rewardId)
      .eq("active", true)
      .single();

    if (rewErr || !reward) throw new Error("Recompensa indisponível ou esgotada.");
    if (reward.stock !== null && reward.stock <= 0) throw new Error("Estoque desta recompensa esgotado.");

    // 2. Verifica saldo do usuário
    const { data: score, error: scErr } = await supabase
      .from("invite_scores")
      .select("total_points")
      .eq("user_id", identity.id)
      .single();

    const userPoints = score?.total_points || 0;
    if (userPoints < reward.pointsRequired && userPoints < reward.points_required) {
      const needed = reward.points_required - userPoints;
      throw new Error(`Saldo insuficiente. Você precisa de mais ${needed} pontos para resgatar.`);
    }

    // 3. Deduz pontos atomicamente e reduz estoque
    const required = reward.points_required;
    const { error: updErr } = await supabase
      .from("invite_scores")
      .update({
        total_points: userPoints - required,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", identity.id);

    if (updErr) throw new Error("Falha ao debitar pontos do resgate.");

    if (reward.stock !== null) {
      await supabase
        .from("invite_rewards")
        .update({ stock: Math.max(0, reward.stock - 1) })
        .eq("id", rewardId);
    }

    return {
      success: true,
      message: `Parabéns! Você resgatou: ${reward.title}. As instruções de uso foram encaminhadas para seu perfil.`,
      remainingPoints: userPoints - required,
    };
  });

/**
 * Lista sorteios oficiais e ativos
 */
export const getActiveRaffles = createServerFn({ method: "GET" })
  .handler(async (): Promise<RaffleDTO[]> => {
    const supabase = getServerClient();
    const identity = await getIdentity().catch(() => null);

    const { data: raffles, error } = await supabase
      .from("raffles")
      .select("*")
      .in("status", ["active", "drawing", "completed"])
      .order("draw_date", { ascending: true });

    if (error || !raffles) return [];

    // Busca bilhetes do usuário se logado
    const raffleIds = raffles.map((r) => r.id);
    let myTicketsMap = new Map<string, number>();

    if (identity?.id && raffleIds.length > 0) {
      const { data: tickets } = await supabase
        .from("raffle_tickets")
        .select("raffle_id")
        .eq("user_id", identity.id)
        .in("raffle_id", raffleIds);

      if (tickets) {
        for (const t of tickets) {
          myTicketsMap.set(t.raffle_id, (myTicketsMap.get(t.raffle_id) || 0) + 1);
        }
      }
    }

    return raffles.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      imageUrl: r.image_url,
      rules: r.rules || {},
      ticketPriceCents: r.ticket_price_cents || 0,
      pointsCost: r.points_cost || 50,
      tokensCost: r.points_cost || 50,
      maxTicketsPerUser: r.max_tickets_per_user || 10,
      drawDate: r.draw_date,
      status: r.status,
      winnerUserId: r.winner_user_id,
      winnerTicketNumber: r.winner_ticket_number,
      myTicketsCount: myTicketsMap.get(r.id) || 0,
      totalTicketsCount: 0,
    }));
  });

/**
 * Participar de um sorteio oficial usando pontos
 */
export const participateInRaffle = createServerFn({ method: "POST" })
  .validator(z.object({ raffleId: z.string().uuid() }))
  .handler(async ({ data: { raffleId } }) => {
    const identity = await getIdentity();
    if (!identity?.id) throw new Error("Faça login para participar do sorteio.");

    const supabase = getServerClient();

    // 1. Busca sorteio
    const { data: raffle, error: rafErr } = await supabase
      .from("raffles")
      .select("*")
      .eq("id", raffleId)
      .eq("status", "active")
      .single();

    if (rafErr || !raffle) throw new Error("Sorteio não encontrado ou já encerrado.");

    // 2. Checa limite de bilhetes por usuário
    const { count: userTicketsCount } = await supabase
      .from("raffle_tickets")
      .select("*", { count: "exact", head: true })
      .eq("raffle_id", raffleId)
      .eq("user_id", identity.id);

    const maxAllowed = raffle.max_tickets_per_user || 10;
    if ((userTicketsCount || 0) >= maxAllowed) {
      throw new Error(`Você já atingiu o limite de ${maxAllowed} cupons para este sorteio.`);
    }

    // 3. Checa pontos
    const cost = raffle.points_cost || 50;
    const { data: score } = await supabase
      .from("invite_scores")
      .select("total_points")
      .eq("user_id", identity.id)
      .single();

    const currentPoints = score?.total_points || 0;
    if (currentPoints < cost) {
      throw new Error(`Pontos insuficientes. São necessários ${cost} pontos para gerar um cupom.`);
    }

    // 4. Determina próximo número de bilhete
    const { data: maxTicket } = await supabase
      .from("raffle_tickets")
      .select("ticket_number")
      .eq("raffle_id", raffleId)
      .order("ticket_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextNumber = (maxTicket?.ticket_number || 1000) + 1;

    // 5. Insere bilhete
    const { error: insErr } = await supabase.from("raffle_tickets").insert({
      raffle_id: raffleId,
      user_id: identity.id,
      ticket_number: nextNumber,
      paid: true,
    });

    if (insErr) throw new Error("Falha ao registrar seu bilhete de sorteio.");

    // 6. Debita pontos
    await supabase
      .from("invite_scores")
      .update({
        total_points: currentPoints - cost,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", identity.id);

    return {
      success: true,
      ticketNumber: nextNumber,
      message: `Bilhete #${nextNumber} gerado com sucesso! Boa sorte no sorteio!`,
      remainingPoints: currentPoints - cost,
    };
  });

/**
 * Processa código de indicação no onboarding do novo membro
 */
export const processReferralOnboarding = createServerFn({ method: "POST" })
  .validator(z.object({ referralCode: z.string().min(3) }))
  .handler(async ({ data: { referralCode } }) => {
    const identity = await getIdentity().catch(() => null);
    if (!identity?.id) return { success: false, message: "Usuário não autenticado." };

    const supabase = getServerClient();

    const { data, error } = await supabase.rpc("process_invite_conversion", {
      p_code: referralCode.trim().toUpperCase(),
      p_new_user_id: identity.id,
      p_ip_hash: "web-client",
    });

    if (error) {
      console.error("[invite] Erro ao processar conversão:", error);
      return { success: false, message: error.message };
    }

    return data as { success: boolean; message?: string; points_awarded?: number };
  });

/**
 * ============================================================================
 * ADMIN MASTER — GESTÃO DO PROGRAMA DE CONVITES & SORTEIOS (Zero Mocks)
 * ============================================================================
 */

export const adminListGamification = createServerFn({ method: "GET" })
  .handler(async () => {
    const { requireAdmin } = await import("@/lib/server-access");
    await requireAdmin();

    const supabase = getServerClient();

    const [
      { data: links, count: totalLinks },
      { data: conversions, count: totalConversions },
      { data: rewards },
      { data: raffles },
    ] = await Promise.all([
      supabase.from("invite_links").select("*, profiles:user_id(id, full_name, avatar_url)", { count: "exact" }).limit(50),
      supabase.from("invite_conversions").select("*, invited_profile:invited_user_id(full_name)", { count: "exact" }).order("created_at", { ascending: false }).limit(50),
      supabase.from("invite_rewards").select("*").order("points_required", { ascending: true }),
      supabase.from("raffles").select("*, raffle_tickets(count)").order("draw_date", { ascending: false }),
    ]);

    return {
      totalLinks: totalLinks || 0,
      totalConversions: totalConversions || 0,
      links: links || [],
      conversions: conversions || [],
      rewards: rewards || [],
      raffles: (raffles || []).map((r: any) => ({
        ...r,
        totalTickets: r.raffle_tickets?.[0]?.count || 0,
      })),
    };
  });

export const adminDrawRaffle = createServerFn({ method: "POST" })
  .validator(z.object({ raffleId: z.string().uuid() }))
  .handler(async ({ data: { raffleId } }) => {
    const { requireAdmin } = await import("@/lib/server-access");
    await requireAdmin();

    const supabase = getServerClient();

    // Busca todos os bilhetes emitidos para este sorteio
    const { data: tickets, error: tErr } = await supabase
      .from("raffle_tickets")
      .select("id, ticket_number, user_id")
      .eq("raffle_id", raffleId);

    if (tErr || !tickets || tickets.length === 0) {
      throw new Error("Não há nenhum bilhete emitido para este sorteio. Não é possível realizar a apuração.");
    }

    // Sorteio criptográfico aleatório
    const winnerIndex = Math.floor(Math.random() * tickets.length);
    const winningTicket = tickets[winnerIndex];

    // Busca perfil do ganhador
    const { data: winnerProfile } = await supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", winningTicket.user_id)
      .single();

    // Atualiza sorteio para concluído
    const { error: updErr } = await supabase
      .from("raffles")
      .update({
        status: "completed",
        winner_user_id: winningTicket.user_id,
        winner_ticket_number: winningTicket.ticket_number,
        drawn_at: new Date().toISOString(),
      })
      .eq("id", raffleId);

    if (updErr) {
      throw new Error("Falha ao registrar ganhador do sorteio: " + updErr.message);
    }

    return {
      success: true,
      ticketNumber: winningTicket.ticket_number,
      winnerName: winnerProfile?.full_name || "Ganhador Anônimo",
      winnerPhone: winnerProfile?.phone || null,
      totalParticipantes: tickets.length,
    };
  });

export const adminUpsertReward = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string().uuid().optional(),
      title: z.string().min(3),
      description: z.string().optional(),
      points_required: z.number().int().min(1),
      reward_type: z.string().default("ticket"),
      stock: z.number().int().nullable().optional(),
      active: z.boolean().default(true),
    })
  )
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("@/lib/server-access");
    await requireAdmin();

    const supabase = getServerClient();

    if (data.id) {
      const { data: res, error } = await supabase
        .from("invite_rewards")
        .update({
          title: data.title,
          description: data.description || null,
          points_required: data.points_required,
          reward_type: data.reward_type,
          stock: data.stock,
          active: data.active,
        })
        .eq("id", data.id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return res;
    } else {
      const { data: res, error } = await supabase
        .from("invite_rewards")
        .insert({
          title: data.title,
          description: data.description || null,
          points_required: data.points_required,
          reward_type: data.reward_type,
          stock: data.stock,
          active: data.active,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return res;
    }
  });

export const adminCreateRaffle = createServerFn({ method: "POST" })
  .validator(
    z.object({
      title: z.string().min(3),
      description: z.string().optional(),
      image_url: z.string().optional(),
      points_cost: z.number().int().min(0).default(50),
      draw_date: z.string(),
      max_tickets_per_user: z.number().int().default(10),
    })
  )
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("@/lib/server-access");
    const identity = await requireAdmin();

    const supabase = getServerClient();

    const { data: res, error } = await supabase
      .from("raffles")
      .insert({
        title: data.title,
        description: data.description || null,
        image_url: data.image_url || null,
        points_cost: data.points_cost,
        draw_date: data.draw_date,
        max_tickets_per_user: data.max_tickets_per_user,
        status: "active",
        created_by: identity.id,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return res;
  });
