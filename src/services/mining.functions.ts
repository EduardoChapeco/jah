/**
 * mining.functions.ts — BFF Server Functions para o Mining Hub & Crawlers
 * Extração de Notícias, Feeds RSS, Scrapers de Domínio e Fila de Descoberta.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient, getAnonServerClient } from "@/lib/supabase";
import { getServerIdentity, assertStoreAccess } from "@/lib/server-access";

// ============================================================
// Schemas
// ============================================================

export const addCrawlUrlSchema = z.object({
  url: z.string().url("URL inválida"),
  priority: z.number().int().min(1).max(10).default(5),
  entity_type: z.enum(["news", "job", "lawsuit", "event", "company"]).default("news"),
});

export const addRssFeedSchema = z.object({
  name: z.string().min(2, "Nome muito curto"),
  feed_url: z.string().url("URL de feed inválida"),
  website_url: z.string().url().optional(),
  category: z.string().default("general"),
  entity_type: z.string().default("news"),
  region: z.string().default("Geral/Nacional"),
});

// ============================================================
// Server Functions
// ============================================================

/**
 * 1. Estatísticas do Mining Hub
 */
export const getMiningStats = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = getServerClient();

  const [queueRes, feedsRes, domainsRes] = await Promise.all([
    supabase.from("crawl_queue").select("status"),
    supabase.from("rss_feeds").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("domain_configs").select("id", { count: "exact", head: true }).eq("is_blocked", true),
  ]);

  const queueData = queueRes.data || [];
  const stats = {
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
  };

  queueData.forEach((item) => {
    if (item.status in stats) {
      stats[item.status as keyof typeof stats]++;
    }
  });

  return {
    queue: stats,
    activeFeeds: feedsRes.count || 0,
    blockedDomains: domainsRes.count || 0,
    totalCrawled: stats.completed,
  };
});

/**
 * 2. Lista a fila de extração
 */
export const listCrawlQueue = createServerFn({ method: "GET" })
  .validator(
    z
      .object({
        status: z.string().optional(),
        limit: z.number().int().default(50),
      })
      .optional(),
  )
  .handler(async ({ data }) => {
    const supabase = getServerClient();
    let query = supabase
      .from("crawl_queue")
      .select("*")
      .order("priority", { ascending: false })
      .order("scheduled_for", { ascending: true })
      .limit(data?.limit || 50);

    if (data?.status && data.status !== "all") {
      query = query.eq("status", data.status);
    }

    const { data: queue, error } = await query;
    if (error) throw new Error(`Falha ao listar fila: ${error.message}`);
    return queue || [];
  });

/**
 * 3. Adiciona nova URL à fila de crawling
 */
export const addUrlToCrawlQueue = createServerFn({ method: "POST" })
  .validator(addCrawlUrlSchema)
  .handler(async ({ data }) => {
    const identity = await getServerIdentity();
    if (!identity) throw new Error("Não autenticado");

    const domain = new URL(data.url).hostname;
    const supabase = getServerClient();

    const { data: item, error } = await supabase
      .from("crawl_queue")
      .insert({
        url: data.url,
        domain,
        priority: data.priority,
        entity_type: data.entity_type,
        status: "pending",
        discovered_via: "admin_manual",
      })
      .select()
      .single();

    if (error) throw new Error(`Falha ao enfileirar URL: ${error.message}`);
    return item;
  });

/**
 * 4. Lista Feeds RSS cadastrados
 */
export const listRssFeeds = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = getAnonServerClient();
  const { data, error } = await supabase
    .from("rss_feeds")
    .select("*")
    .order("name");

  if (error) throw new Error(`Falha ao listar feeds: ${error.message}`);
  return data || [];
});

/**
 * 5. Adiciona novo feed RSS
 */
export const createRssFeed = createServerFn({ method: "POST" })
  .validator(addRssFeedSchema)
  .handler(async ({ data }) => {
    const identity = await getServerIdentity();
    if (!identity) throw new Error("Não autenticado");

    const supabase = getServerClient();
    const { data: feed, error } = await supabase
      .from("rss_feeds")
      .insert(data)
      .select()
      .single();

    if (error) throw new Error(`Falha ao cadastrar feed: ${error.message}`);
    return feed;
  });
