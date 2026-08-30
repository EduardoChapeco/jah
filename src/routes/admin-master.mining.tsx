/**
 * admin-master.mining.tsx — Mining Hub & Content Factory
 * Pipeline completo: Fila → Artigos Minerados (Curadoria) → Publicação
 * Inclui: Feeds RSS, Scrapers por Domínio, Importação Manual, Billing de Tokens
 */

import { createFileRoute } from "@tanstack/react-router";
import { useState, useTransition, useRef } from "react";
import {
  Globe,
  Rss,
  Queue,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  ArrowClockwise,
  Play,
  SpinnerGap,
  Warning,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Sparkle,
  MagnifyingGlass,
  Robot,
  Database,
  Broadcast,
  Shield,
  Lightning,
  Star,
  ArrowRight,
  ToggleLeft,
  ToggleRight,
  Funnel,
  PencilSimple,
  TrashSimple,
} from "@phosphor-icons/react";
import {
  getMiningStats,
  listCrawlQueue,
  listRssFeeds,
  listMinedArticles,
  listScraperConfigs,
  addUrlToCrawlQueue,
  processUrlWithAI,
  curateMineArticle,
  triggerRssFeedFetch,
  upsertRssFeed,
  toggleRssFeed,
  type MinedArticleDTO,
  type ScraperConfigDTO,
} from "@/services/mining.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/admin-master/mining")({
  head: () => ({ meta: [{ title: "Mining Hub & Content Factory | Admin Master" }] }),
  loader: async () => {
    try {
      const [stats, queue, feeds, mined, scrapers] = await Promise.all([
        getMiningStats().catch(() => ({
          queue: { pending: 0, processing: 0, completed: 0, failed: 0 },
          mined: { pending_review: 0, approved: 0, rejected: 0, published: 0, processing: 0, failed: 0, avg_quality: 0 },
          feeds: { total: 0, active: 0, total_items: 0, total_published: 0 },
          scrapers: { total: 0, active: 0, blocked: 0, total_scraped: 0 },
        })),
        listCrawlQueue({ data: { limit: 30 } }).catch(() => ({ items: [], total: 0 })),
        listRssFeeds().catch(() => []),
        listMinedArticles({ data: { limit: 30 } }).catch(() => ({ items: [], total: 0 })),
        listScraperConfigs().catch(() => []),
      ]);
      return { stats, queue, feeds, mined, scrapers };
    } catch {
      return {
        stats: {
          queue: { pending: 0, processing: 0, completed: 0, failed: 0 },
          mined: { pending_review: 0, approved: 0, rejected: 0, published: 0, processing: 0, failed: 0, avg_quality: 0 },
          feeds: { total: 0, active: 0, total_items: 0, total_published: 0 },
          scrapers: { total: 0, active: 0, blocked: 0, total_scraped: 0 },
        },
        queue: { items: [], total: 0 },
        feeds: [],
        mined: { items: [], total: 0 },
        scrapers: [],
      };
    }
  },
  component: AdminMiningHubPage,
});

type Tab = "mined" | "queue" | "feeds" | "scrapers" | "import";

function AdminMiningHubPage() {
  const { stats, queue: initialQueue, feeds: initialFeeds, mined: initialMined, scrapers: initialScrapers } = Route.useLoaderData();
  const [activeTab, setActiveTab] = useState<Tab>("mined");
  const [isPending, startTransition] = useTransition();

  // State local para mutações otimistas
  const [minedItems, setMinedItems] = useState<MinedArticleDTO[]>(initialMined.items as MinedArticleDTO[]);
  const [queueItems, setQueueItems] = useState(initialQueue.items || []);
  const [feeds, setFeeds] = useState<any[]>(initialFeeds as any[]);
  const [scrapers] = useState<ScraperConfigDTO[]>(initialScrapers as ScraperConfigDTO[]);

  // Curadoria: estado do artigo em foco
  const [focusedArticle, setFocusedArticle] = useState<MinedArticleDTO | null>(null);
  const [titleOverride, setTitleOverride] = useState("");
  const [kickerOverride, setKickerOverride] = useState("");
  const [categoryOverride, setCategoryOverride] = useState("");
  const [curatorNotes, setCuratorNotes] = useState("");
  const [curatingId, setCuratingId] = useState<string | null>(null);

  // Import URL form
  const [importUrl, setImportUrl] = useState("");
  const [importTone, setImportTone] = useState<"editorial" | "profissional" | "tecnico" | "persuasivo" | "minimalista">("editorial");
  const [importContentType, setImportContentType] = useState<"news" | "blog_post" | "recipe">("news");
  const [isImporting, setIsImporting] = useState(false);

  // RSS form
  const [feedName, setFeedName] = useState("");
  const [feedUrl, setFeedUrl] = useState("");
  const [fetchingFeedId, setFetchingFeedId] = useState<string | null>(null);

  // Filter mined
  const [minedFilter, setMinedFilter] = useState<"all" | "pending_review" | "published" | "rejected">("pending_review");

  // ─── Curadoria ───────────────────────────────────────────────────────────

  const handleCurate = (article: MinedArticleDTO) => {
    setFocusedArticle(article);
    setTitleOverride(article.ai_structured_title || "");
    setKickerOverride(article.ai_suggested_kicker || "");
    setCategoryOverride(article.ai_suggested_category || "");
    setCuratorNotes("");
  };

  const handleApprove = () => {
    if (!focusedArticle) return;
    setCuratingId(focusedArticle.id);
    startTransition(async () => {
      try {
        await curateMineArticle({
          data: {
            mined_article_id: focusedArticle.id,
            action: "approve",
            curator_notes: curatorNotes || undefined,
            title_override: titleOverride !== focusedArticle.ai_structured_title ? titleOverride : undefined,
            kicker_override: kickerOverride !== focusedArticle.ai_suggested_kicker ? kickerOverride : undefined,
            category_override: categoryOverride !== focusedArticle.ai_suggested_category ? categoryOverride : undefined,
          },
        });
        toast.success("Matéria aprovada e publicada!");
        setMinedItems((prev) => prev.map((m) => m.id === focusedArticle.id ? { ...m, status: "published" as const } : m));
        setFocusedArticle(null);
      } catch (err: any) {
        toast.error(err.message || "Erro ao aprovar matéria");
      } finally {
        setCuratingId(null);
      }
    });
  };

  const handleReject = () => {
    if (!focusedArticle) return;
    setCuratingId(focusedArticle.id);
    startTransition(async () => {
      try {
        await curateMineArticle({
          data: {
            mined_article_id: focusedArticle.id,
            action: "reject",
            curator_notes: curatorNotes || "Não atende os critérios editoriais.",
          },
        });
        toast.success("Matéria rejeitada.");
        setMinedItems((prev) => prev.map((m) => m.id === focusedArticle.id ? { ...m, status: "rejected" as const } : m));
        setFocusedArticle(null);
      } catch (err: any) {
        toast.error(err.message || "Erro ao rejeitar matéria");
      } finally {
        setCuratingId(null);
      }
    });
  };

  // ─── Import URL ──────────────────────────────────────────────────────────

  const handleImportUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importUrl) return;
    setIsImporting(true);
    try {
      const result = await processUrlWithAI({
        data: {
          url: importUrl,
          content_type: importContentType,
          tone: importTone,
          auto_enqueue: true,
          consume_tokens: false,
        },
      });
      toast.success(`Artigo extraído com IA! Qualidade: ${result.quality_score}/100`);
      setMinedItems((prev) => [result as any, ...prev]);
      setImportUrl("");
      setActiveTab("mined");
    } catch (err: any) {
      toast.error(err.message || "Erro ao processar URL");
    } finally {
      setIsImporting(false);
    }
  };

  // ─── RSS Fetch ───────────────────────────────────────────────────────────

  const handleFetchRss = (feedId: string) => {
    setFetchingFeedId(feedId);
    startTransition(async () => {
      try {
        const result = await triggerRssFeedFetch({ data: { feed_id: feedId } });
        toast.success(`RSS processado! ${result.fetched} novos itens enfileirados.`);
        setFeeds((prev) => prev.map((f) => f.id === feedId
          ? { ...f, last_fetched_at: new Date().toISOString(), items_count: (f.items_count || 0) + result.fetched }
          : f
        ));
      } catch (err: any) {
        toast.error(err.message || "Erro ao buscar feed RSS");
      } finally {
        setFetchingFeedId(null);
      }
    });
  };

  const handleToggleFeed = (feedId: string, currentActive: boolean) => {
    startTransition(async () => {
      try {
        await toggleRssFeed({ data: { id: feedId, is_active: !currentActive } });
        setFeeds((prev) => prev.map((f) => f.id === feedId ? { ...f, is_active: !currentActive } : f));
        toast.success(!currentActive ? "Feed ativado." : "Feed desativado.");
      } catch (err: any) {
        toast.error(err.message || "Erro ao alternar feed");
      }
    });
  };

  const handleAddFeed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedName || !feedUrl) return;
    startTransition(async () => {
      try {
        const feed = await upsertRssFeed({
          data: { name: feedName, feed_url: feedUrl, content_type: "news", region: "Brasil" },
        });
        setFeeds((prev) => [...prev, feed]);
        toast.success("Feed RSS cadastrado!");
        setFeedName(""); setFeedUrl("");
      } catch (err: any) {
        toast.error(err.message || "Erro ao cadastrar feed");
      }
    });
  };

  // ─── Utilitários ─────────────────────────────────────────────────────────

  const filteredMined = minedFilter === "all"
    ? minedItems
    : minedItems.filter((m) => m.status === minedFilter);

  const qualityColor = (score: number | null) => {
    if (!score) return "text-muted-foreground";
    if (score >= 75) return "text-emerald-500";
    if (score >= 50) return "text-amber-500";
    return "text-red-400";
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      pending_review: { label: "Aguardando Curadoria", cls: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
      approved: { label: "Aprovado", cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
      published: { label: "Publicado", cls: "bg-primary/10 text-primary" },
      rejected: { label: "Rejeitado", cls: "bg-destructive/10 text-destructive" },
      processing: { label: "Processando", cls: "bg-primary/10 text-primary" },
      failed: { label: "Falhou", cls: "bg-destructive/10 text-destructive" },
    };
    const s = map[status] || { label: status, cls: "bg-muted text-muted-foreground" };
    return (
      <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-bold ${s.cls}`}>
        {s.label}
      </span>
    );
  };

  const TABS: { id: Tab; icon: React.ReactNode; label: string; badge?: number }[] = [
    { id: "mined", icon: <Robot className="h-4 w-4" />, label: "Artigos Minerados", badge: stats.mined.pending_review },
    { id: "queue", icon: <Queue className="h-4 w-4" />, label: "Fila de Extração", badge: stats.queue.pending },
    { id: "feeds", icon: <Rss className="h-4 w-4" />, label: "Feeds RSS", badge: stats.feeds.active },
    { id: "scrapers", icon: <Globe className="h-4 w-4" />, label: "Scrapers", badge: stats.scrapers.active },
    { id: "import", icon: <Lightning className="h-4 w-4" />, label: "Importar URL com IA" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="mb-6 border-b border-border/40 pb-4">
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Extração & Curadoria de Conteúdo
          </h1>
        </div>

        {/* ── KPIs ───────────────────────────────────────────────────────── */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          <StatCard icon={<Clock className="h-4 w-4 text-amber-400" />} label="Pendentes na Fila" value={stats.queue.pending} />
          <StatCard icon={<ArrowClockwise className="h-4 w-4 text-violet-400 animate-spin" />} label="Processando" value={stats.queue.processing} />
          <StatCard icon={<Warning className="h-4 w-4 text-amber-400" />} label="Aguardando Curadoria" value={stats.mined.pending_review} accent="amber" />
          <StatCard icon={<CheckCircle className="h-4 w-4 text-emerald-400" />} label="Publicados" value={stats.mined.published} accent="green" />
          <StatCard icon={<Rss className="h-4 w-4 text-blue-400" />} label="Feeds Ativos" value={stats.feeds.active} />
          <StatCard icon={<Star className="h-4 w-4 text-amber-400" />} label="Qualidade Média" value={`${stats.mined.avg_quality}%`} />
        </div>

        {/* ── Tabs ───────────────────────────────────────────────────────── */}
        <div className="mb-5 flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className={`ml-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                  activeTab === tab.id ? "bg-primary-foreground/20 text-primary-foreground" : "bg-primary/10 text-primary"
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            ABA 1: Artigos Minerados (Curadoria)
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "mined" && (
          <div className="space-y-4">
            {/* Panel de curadoria */}
            {focusedArticle && (
              <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-primary tracking-wider mb-1">Curadoria do Artigo</p>
                    <h3 className="text-sm font-bold text-foreground">{focusedArticle.source_url}</h3>
                  </div>
                  <button
                    onClick={() => setFocusedArticle(null)}
                    className="text-xs text-muted-foreground hover:text-foreground shrink-0"
                  >
                    × Fechar
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1">Título</label>
                    <input
                      value={titleOverride}
                      onChange={(e) => setTitleOverride(e.target.value)}
                      className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1">Chapéu</label>
                    <input
                      value={kickerOverride}
                      onChange={(e) => setKickerOverride(e.target.value)}
                      className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1">Categoria</label>
                    <select
                      value={categoryOverride}
                      onChange={(e) => setCategoryOverride(e.target.value)}
                      className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                    >
                      {["cidade", "politica", "economia", "cultura", "esportes", "tecnologia", "urgente", "geral"].map((c) => (
                        <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">Notas do Curador (opcional)</label>
                  <textarea
                    value={curatorNotes}
                    onChange={(e) => setCuratorNotes(e.target.value)}
                    rows={2}
                    placeholder="Motivo da decisão ou observações para a redação..."
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none resize-none"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleApprove}
                    disabled={curatingId === focusedArticle.id}
                    id="btn-approve-mined-article"
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                  >
                    {curatingId === focusedArticle.id ? <SpinnerGap className="h-4 w-4 animate-spin" /> : <ThumbsUp className="h-4 w-4" />}
                    Aprovar & Publicar
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={curatingId === focusedArticle.id}
                    id="btn-reject-mined-article"
                    className="inline-flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/30 px-5 py-2.5 text-sm font-bold text-destructive hover:bg-destructive/20 disabled:opacity-50 transition-colors"
                  >
                    <ThumbsDown className="h-4 w-4" />
                    Rejeitar
                  </button>
                </div>
              </div>
            )}

            {/* Filtros */}
            <div className="flex items-center gap-2">
              <Funnel className="h-4 w-4 text-muted-foreground" />
              {(["all", "pending_review", "published", "rejected"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setMinedFilter(f)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    minedFilter === f ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f === "all" ? "Todos" : f === "pending_review" ? "Pendentes" : f === "published" ? "Publicados" : "Rejeitados"}
                </button>
              ))}
            </div>

            {/* Lista */}
            {filteredMined.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card/50 py-14 text-center">
                <Robot className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm font-semibold text-muted-foreground">
                  {minedFilter === "pending_review" ? "Nenhum artigo aguardando curadoria." : "Nenhum artigo encontrado."}
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Use a aba "Importar URL com IA" ou ative Feeds RSS para gerar conteúdo.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredMined.map((article) => (
                  <div
                    key={article.id}
                    className={`rounded-2xl border bg-card p-4 transition-all ${
                      focusedArticle?.id === article.id ? "border-primary/50 bg-primary/5" : "border-border"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        {/* Cover */}
                        {article.ai_suggested_cover_url ? (
                          <img
                            src={article.ai_suggested_cover_url}
                            alt=""
                            className="h-14 w-14 rounded-xl object-cover shrink-0 bg-muted"
                            onError={(e) => (e.currentTarget.style.display = "none")}
                          />
                        ) : (
                          <div className="h-14 w-14 rounded-xl bg-muted/50 flex items-center justify-center shrink-0">
                            <Robot className="h-6 w-6 text-muted-foreground/40" />
                          </div>
                        )}

                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {article.ai_suggested_kicker && (
                              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                                {article.ai_suggested_kicker}
                              </span>
                            )}
                            {statusBadge(article.status)}
                            {article.ai_sentiment && (
                              <span className={`text-[10px] font-semibold ${
                                article.ai_sentiment === "positive" ? "text-emerald-500" :
                                article.ai_sentiment === "negative" ? "text-red-400" : "text-muted-foreground"
                              }`}>
                                {article.ai_sentiment}
                              </span>
                            )}
                          </div>

                          <h3 className="text-sm font-bold text-foreground line-clamp-2">
                            {article.ai_structured_title || article.raw_title || "Sem título"}
                          </h3>

                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="font-mono truncate max-w-32">{article.source_domain}</span>
                            <span>·</span>
                            <span className={`font-bold ${qualityColor(article.quality_score)}`}>
                              {article.quality_score ?? "--"}/100
                            </span>
                            <span>·</span>
                            <span>{article.word_count} palavras</span>
                            {article.ai_provider_used && (
                              <>
                                <span>·</span>
                                <span className="flex items-center gap-1">
                                  <Sparkle className="h-3 w-3" />
                                  {article.ai_provider_used}
                                </span>
                              </>
                            )}
                          </div>

                          {article.ai_summary && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                              {article.ai_summary}
                            </p>
                          )}

                          {article.ai_suggested_tags && article.ai_suggested_tags.length > 0 && (
                            <div className="flex items-center gap-1 mt-1 flex-wrap">
                              {article.ai_suggested_tags.slice(0, 4).map((tag) => (
                                <span key={tag} className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Ações */}
                      {article.status === "pending_review" && (
                        <button
                          id={`btn-curate-${article.id}`}
                          onClick={() => handleCurate(article)}
                          className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-primary/10 border border-primary/30 px-3 py-2 text-xs font-bold text-primary hover:bg-primary hover:text-primary-foreground transition-all"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Curar
                        </button>
                      )}
                      {article.status === "published" && (
                        <span className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1.5 text-[10px] font-bold text-primary">
                          <CheckCircle className="h-3 w-3" />
                          Publicado
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            ABA 2: Fila de Crawling
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "queue" && (
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground">URLs na Fila de Extração</h2>
              <span className="text-xs text-muted-foreground">{stats.queue.pending} pendentes · {stats.queue.processing} processando</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border text-muted-foreground uppercase">
                  <tr>
                    <th className="py-2.5 pr-4 font-bold">Domínio & URL</th>
                    <th className="py-2.5 pr-4 font-bold">Tipo</th>
                    <th className="py-2.5 pr-4 font-bold">Prioridade</th>
                    <th className="py-2.5 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {queueItems.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-10 text-center text-muted-foreground">
                        Fila vazia. Use "Importar URL com IA" para adicionar conteúdo.
                      </td>
                    </tr>
                  ) : (
                    queueItems.map((item: any) => (
                      <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 pr-4">
                          <div className="font-semibold text-foreground">{item.domain}</div>
                          <div className="max-w-xs truncate text-[11px] text-muted-foreground font-mono">{item.url}</div>
                        </td>
                        <td className="py-3 pr-4 font-semibold uppercase text-primary text-[11px]">
                          {item.content_type || item.entity_type}
                        </td>
                        <td className="py-3 pr-4">
                          <span className="font-mono text-foreground">{item.priority || 5}</span>
                        </td>
                        <td className="py-3">{statusBadge(item.status)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            ABA 3: Feeds RSS
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "feeds" && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {feeds.map((feed: any) => (
                <div key={feed.id} className="rounded-2xl border border-border bg-card p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-foreground truncate">{feed.name}</h3>
                      <p className="text-[11px] font-mono text-muted-foreground truncate mt-0.5">{feed.feed_url}</p>
                    </div>
                    <button
                      onClick={() => handleToggleFeed(feed.id, feed.is_active)}
                      className="shrink-0 mt-0.5"
                      title={feed.is_active ? "Desativar feed" : "Ativar feed"}
                    >
                      {feed.is_active
                        ? <ToggleRight className="h-6 w-6 text-emerald-500" />
                        : <ToggleLeft className="h-6 w-6 text-muted-foreground" />
                      }
                    </button>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground border-t border-border pt-2.5">
                    <span className="font-mono">{feed.items_count || 0} itens</span>
                    <span>·</span>
                    <span className="font-mono">{feed.items_published_count || 0} publicados</span>
                    {feed.last_success_at && (
                      <>
                        <span>·</span>
                        <span>
                          {new Date(feed.last_success_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                        </span>
                      </>
                    )}
                  </div>

                  <button
                    id={`btn-fetch-rss-${feed.id}`}
                    onClick={() => handleFetchRss(feed.id)}
                    disabled={fetchingFeedId === feed.id || !feed.is_active}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary/10 border border-primary/20 py-2 text-xs font-bold text-primary hover:bg-primary hover:text-primary-foreground disabled:opacity-50 transition-all"
                  >
                    {fetchingFeedId === feed.id
                      ? <SpinnerGap className="h-3.5 w-3.5 animate-spin" />
                      : <Broadcast className="h-3.5 w-3.5" />
                    }
                    {fetchingFeedId === feed.id ? "Buscando..." : "Fetch Agora"}
                  </button>
                </div>
              ))}
            </div>

            {/* Form novo feed */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="text-sm font-bold text-foreground mb-4">Cadastrar Novo Feed RSS</h3>
              <form onSubmit={handleAddFeed} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Nome (ex: G1 Chapecó)"
                  value={feedName}
                  onChange={(e) => setFeedName(e.target.value)}
                  required
                  className="rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
                <input
                  type="url"
                  placeholder="URL do Feed XML"
                  value={feedUrl}
                  onChange={(e) => setFeedUrl(e.target.value)}
                  required
                  className="rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all"
                >
                  {isPending ? "Cadastrando..." : "Cadastrar Feed"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            ABA 4: Scrapers por Domínio
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "scrapers" && (
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground">Configurações de Scraper por Domínio</h2>
              <span className="text-xs text-muted-foreground">{scrapers.filter((s) => !s.is_blocked).length} ativos · {scrapers.filter((s) => s.is_blocked).length} bloqueados</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border text-muted-foreground uppercase">
                  <tr>
                    <th className="py-2.5 pr-4 font-bold">Domínio</th>
                    <th className="py-2.5 pr-4 font-bold">Credibilidade</th>
                    <th className="py-2.5 pr-4 font-bold">Confiabilidade</th>
                    <th className="py-2.5 pr-4 font-bold">Scraped / Publicados</th>
                    <th className="py-2.5 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {scrapers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-muted-foreground">
                        Nenhum scraper configurado. As configurações são criadas automaticamente na primeira extração.
                      </td>
                    </tr>
                  ) : (
                    scrapers.map((sc) => (
                      <tr key={sc.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 pr-4">
                          <div className="font-semibold text-foreground">{sc.label}</div>
                          <div className="font-mono text-[11px] text-muted-foreground">{sc.domain}</div>
                        </td>
                        <td className="py-3 pr-4">
                          <span className={`font-semibold capitalize ${
                            sc.source_credibility === "high" ? "text-emerald-500" :
                            sc.source_credibility === "medium" ? "text-amber-500" : "text-red-400"
                          }`}>
                            {sc.source_credibility}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-1.5">
                            <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full rounded-full bg-primary"
                                style={{ width: `${sc.reliability_score}%` }}
                              />
                            </div>
                            <span className="font-mono text-foreground">{sc.reliability_score}%</span>
                          </div>
                        </td>
                        <td className="py-3 pr-4 font-mono">
                          {sc.total_scraped} / {sc.total_published}
                        </td>
                        <td className="py-3">
                          {sc.is_blocked
                            ? <span className="rounded-lg bg-destructive/10 px-2 py-0.5 text-[10px] font-bold text-destructive flex items-center gap-1">
                                <Shield className="h-3 w-3" />
                                Bloqueado
                              </span>
                            : <span className="rounded-lg bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Ativo</span>
                          }
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            ABA 5: Importar URL com IA
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "import" && (
          <div className="max-w-2xl">
            <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
              <div className="flex items-center gap-2">
                <Lightning className="h-5 w-5 text-primary" />
                <h2 className="text-base font-bold text-foreground">Importar & Estruturar com IA</h2>
              </div>

              <div className="rounded-xl bg-primary/5 border border-primary/20 p-3.5 text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground">Como funciona:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Cole a URL de qualquer artigo, notícia ou blog post</li>
                  <li>Firecrawl extrai o conteúdo limpo (ou fallback HTTP)</li>
                  <li>Gemini/Groq estrutura o conteúdo editorialmente</li>
                  <li>O artigo vai para "Artigos Minerados" aguardando curadoria</li>
                </ol>
              </div>

              <form onSubmit={handleImportUrl} className="space-y-4">
                <div>
                  <label htmlFor="import-url" className="text-xs font-bold text-foreground block mb-1.5">URL do Conteúdo</label>
                  <input
                    id="import-url"
                    type="url"
                    placeholder="https://g1.globo.com/santa-catarina/..."
                    value={importUrl}
                    onChange={(e) => setImportUrl(e.target.value)}
                    required
                    className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1.5">Tom Editorial</label>
                    <select
                      value={importTone}
                      onChange={(e) => setImportTone(e.target.value as any)}
                      className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                    >
                      <option value="editorial">Editorial (Jornalístico)</option>
                      <option value="profissional">Profissional</option>
                      <option value="imparcial">Imparcial / Factual</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1.5">Tipo de Conteúdo</label>
                    <select
                      value={importContentType}
                      onChange={(e) => setImportContentType(e.target.value as any)}
                      className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                    >
                      <option value="news">Notícia / Artigo</option>
                      <option value="blog_post">Blog Post</option>
                      <option value="recipe">Receita</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isImporting || !importUrl}
                  id="btn-import-url-ai"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all"
                >
                  {isImporting ? (
                    <>
                      <SpinnerGap className="h-4 w-4 animate-spin" />
                      Extraindo e estruturando com IA...
                    </>
                  ) : (
                    <>
                      <Sparkle className="h-4 w-4" />
                      Importar & Estruturar com IA
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ── StatCard ─────────────────────────────────────────────────────────────────
function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  accent?: "amber" | "green" | "red";
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3.5">
      <div className="flex items-center justify-between text-muted-foreground mb-2">
        <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
        {icon}
      </div>
      <div className={`text-xl font-bold ${
        accent === "amber" ? "text-amber-500" :
        accent === "green" ? "text-emerald-500" :
        accent === "red" ? "text-red-400" : "text-foreground"
      }`}>
        {value}
      </div>
    </div>
  );
}
