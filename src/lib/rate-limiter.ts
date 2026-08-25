/**
 * rate-limiter.ts — Proteção Anti-Bot, Anti-Spam e Defesa de Interações
 *
 * Implementa controle por Token Bucket em memória e trava de cooldown por usuário/IP,
 * impedindo bots de curtidas automáticas, spam de comentários, brute force de login e floods de checkout.
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, RateLimitRecord>();

export interface RateLimitOptions {
  windowMs?: number; // Janela de tempo em milissegundos
  maxAllowed?: number; // Máximo de requisições permitidas na janela
}

/**
 * Valida se uma ação está dentro dos limites saudáveis de requisições humanas.
 */
export function checkRateLimit(
  identifier: string,
  actionType?: "like" | "follow" | "comment" | "repost" | "share" | "login" | "checkout" | string,
  options: RateLimitOptions = {}
): { allowed: boolean; remaining: number; retryAfterSec?: number; resetInMs?: number } {
  const type = actionType || "general";
  const windowMs = options.windowMs || (type === "like" ? 10000 : type === "comment" ? 30000 : type === "login" ? 60000 : 60000);
  const maxAllowed = options.maxAllowed || (type === "like" ? 15 : type === "comment" ? 5 : type === "follow" ? 10 : type === "login" ? 5 : 20);

  const key = `${type}:${identifier}`;
  const now = Date.now();
  const record = memoryStore.get(key);

  if (!record || now > record.resetAt) {
    memoryStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return { allowed: true, remaining: maxAllowed - 1, resetInMs: windowMs };
  }

  if (record.count >= maxAllowed) {
    const retryAfterSec = Math.ceil((record.resetAt - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSec,
      resetInMs: Math.max(0, record.resetAt - now),
    };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: maxAllowed - record.count,
    resetInMs: Math.max(0, record.resetAt - now),
  };
}

export function recordFailedAttempt(identifier: string, type = "auth", windowMs = 300000): void {
  const key = `${type}:${identifier}`;
  const now = Date.now();
  const record = memoryStore.get(key);

  if (!record || now > record.resetAt) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs });
  } else {
    record.count += 1;
  }
}

export function resetAttempts(identifier: string, type = "auth"): void {
  const key = `${type}:${identifier}`;
  memoryStore.delete(key);
}

export function formatRetryAfter(seconds?: number): string {
  if (!seconds || seconds <= 0) return "alguns instantes";
  if (seconds < 60) return `${seconds} segundos`;
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} minuto${minutes > 1 ? "s" : ""}`;
}
