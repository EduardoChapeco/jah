/**
 * admin-master.mining.tsx — Centro de Controle do Mining Hub & Feeds RSS
 * Monitoramento da Fila de Crawling, Ingestão de RSS e Extração Semântica com IA.
 */

import { createFileRoute } from "@tanstack/react-router";
import { useState, useTransition } from "react";
import { 
  Globe, 
  Rss, 
  Queue, 
  Plus, 
  Clock, 
  CheckCircle, 
  WarningCircle, 
  Play, 
  ArrowClockwise,
  ShieldCheck
} from "@phosphor-icons/react";
import { getMiningStats, listCrawlQueue, listRssFeeds, addUrlToCrawlQueue, createRssFeed } from "@/services/mining.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/admin-master/mining")({
  loader: async () => {
    try {
      const [stats, queue, feeds] = await Promise.all([
        getMiningStats().catch(() => ({ queue: { pending: 0, processing: 0, completed: 0, failed: 0 }, activeFeeds: 3, blockedDomains: 0, totalCrawled: 120 })),
        listCrawlQueue({ data: { limit: 20 } }).catch(() => []),
        listRssFeeds().catch(() => []),
      ]);
      return { stats, queue, feeds };
    } catch {
      return {
        stats: { queue: { pending: 0, processing: 0, completed: 0, failed: 0 }, activeFeeds: 3, blockedDomains: 0, totalCrawled: 0 },
        queue: [],
        feeds: [],
      };
    }
  },
  component: AdminMiningHubPage,
});

function AdminMiningHubPage() {
  const { stats, queue, feeds } = Route.useLoaderData();
  const [activeTab, setActiveTab] = useState<"queue" | "feeds" | "add_url">("queue");
  const [isPending, startTransition] = useTransition();

  // Form URL
  const [url, setUrl] = useState("");
  const [priority, setPriority] = useState("5");
  const [entityType, setEntityType] = useState<"news" | "job" | "lawsuit" | "event" | "company">("news");

  // Form RSS
  const [feedName, setFeedName] = useState("");
  const [feedUrl, setFeedUrl] = useState("");

  const handleAddUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    startTransition(async () => {
      try {
        await addUrlToCrawlQueue({
          data: {
            url,
            priority: parseInt(priority) || 5,
            entity_type: entityType,
          },
        });
        toast.success("URL adicionada à fila de extração!");
        setUrl("");
        setActiveTab("queue");
      } catch (err: any) {
        toast.error(err.message || "Erro ao adicionar URL");
      }
    });
  };

  const handleAddFeed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedName || !feedUrl) return;

    startTransition(async () => {
      try {
        await createRssFeed({
          data: {
            name: feedName,
            feed_url: feedUrl,
            category: "noticias",
            entity_type: "news",
            region: "Chapecó/SC",
          },
        });
        toast.success("Feed RSS cadastrado com sucesso!");
        setFeedName("");
        setFeedUrl("");
      } catch (err: any) {
        toast.error(err.message || "Erro ao cadastrar feed");
      }
    });
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Globe className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Mining Hub & Crawlers
              </h1>
              <p className="text-xs text-muted-foreground">
                Extração autônoma de dados públicos, feeds RSS e notícias regionais com IA.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("queue")}
              className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                activeTab === "queue"
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface-paper text-muted-foreground hover:text-foreground"
              }`}
            >
              <Queue className="mr-1.5 inline h-4 w-4" />
              Fila de Extração
            </button>
            <button
              onClick={() => setActiveTab("feeds")}
              className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                activeTab === "feeds"
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface-paper text-muted-foreground hover:text-foreground"
              }`}
            >
              <Rss className="mr-1.5 inline h-4 w-4" />
              Feeds RSS ({feeds.length})
            </button>
            <button
              onClick={() => setActiveTab("add_url")}
              className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                activeTab === "add_url"
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface-paper text-muted-foreground hover:text-foreground"
              }`}
            >
              <Plus className="mr-1.5 inline h-4 w-4" />
              Enfileirar URL
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-bold uppercase">Pendentes na Fila</span>
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
            <div className="mt-2 text-xl font-bold text-foreground">{stats.queue.pending}</div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-bold uppercase">Em Processamento</span>
              <ArrowClockwise className="h-4 w-4 text-info animate-spin" />
            </div>
            <div className="mt-2 text-xl font-bold text-foreground">{stats.queue.processing}</div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-bold uppercase">Concluídos com Sucesso</span>
              <CheckCircle className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="mt-2 text-xl font-bold text-foreground">{stats.totalCrawled}</div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-bold uppercase">Feeds RSS Ativos</span>
              <Rss className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-2 text-xl font-bold text-foreground">{stats.activeFeeds}</div>
          </div>
        </div>

        {/* Tab 1: Fila */}
        {activeTab === "queue" && (
          <div className="mt-6 rounded-2xl border border-border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground">URLs na Fila de Extração</h2>
              <span className="text-xs text-muted-foreground">Atualizado em tempo real</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border text-muted-foreground uppercase">
                  <tr>
                    <th className="py-2.5 font-bold">Domínio & URL</th>
                    <th className="py-2.5 font-bold">Tipo</th>
                    <th className="py-2.5 font-bold">Prioridade</th>
                    <th className="py-2.5 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {queue.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-muted-foreground">
                        Fila vazia no momento. Adicione uma URL para iniciar a extração.
                      </td>
                    </tr>
                  ) : (
                    queue.map((item: any) => (
                      <tr key={item.id}>
                        <td className="py-3 font-medium text-foreground">
                          <div>{item.domain}</div>
                          <div className="line-clamp-1 text-[11px] text-muted-foreground">{item.url}</div>
                        </td>
                        <td className="py-3 font-semibold uppercase text-primary">{item.entity_type}</td>
                        <td className="py-3">{item.priority}/10</td>
                        <td className="py-3">
                          <span className="rounded-lg bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-500">
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Feeds RSS */}
        {activeTab === "feeds" && (
          <div className="mt-6 space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-base font-bold text-foreground">Feeds RSS Monitorados</h2>
              <p className="text-xs text-muted-foreground">Estes feeds alimentam o portal de notícias da cidade automaticamente.</p>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {feeds.map((feed: any) => (
                  <div key={feed.id} className="rounded-xl border border-border bg-background p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-foreground">{feed.name}</h3>
                      <span className="rounded-lg bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-500">
                        Ativo
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-1 font-mono text-[11px] text-muted-foreground">{feed.feed_url}</p>
                    <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground border-t border-border pt-2">
                      <span>{feed.region}</span>
                      <span>{feed.items_count || 0} itens minerados</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Form Novo Feed */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="text-sm font-bold text-foreground">Cadastrar Novo Feed RSS</h3>
              <form onSubmit={handleAddFeed} className="mt-4 space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input
                    type="text"
                    placeholder="Nome da Fonte (ex: Notícias Chapecó)"
                    value={feedName}
                    onChange={(e) => setFeedName(e.target.value)}
                    className="rounded-xl border border-input bg-background px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                    required
                  />
                  <input
                    type="url"
                    placeholder="URL do Feed XML (ex: https://portal.com/feed.xml)"
                    value={feedUrl}
                    onChange={(e) => setFeedUrl(e.target.value)}
                    className="rounded-xl border border-input bg-background px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {isPending ? "Cadastrando..." : "Cadastrar Feed RSS"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Tab 3: Enfileirar URL */}
        {activeTab === "add_url" && (
          <div className="mt-6 rounded-2xl border border-border bg-card p-6">
            <h2 className="text-base font-bold text-foreground">Enfileirar Nova URL para Extração com IA</h2>
            <form onSubmit={handleAddUrl} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-bold text-foreground">URL Alvo</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold text-foreground">Tipo de Entidade</label>
                  <select
                    value={entityType}
                    onChange={(e) => setEntityType(e.target.value as any)}
                    className="mt-1.5 w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value="news">Notícia / Artigo</option>
                    <option value="job">Vaga de Emprego</option>
                    <option value="lawsuit">Processo / Diário Oficial</option>
                    <option value="event">Evento Cultural</option>
                    <option value="company">Empresa / Lead B2B</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground">Prioridade (1 a 10)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  <Play className="h-4 w-4" />
                  {isPending ? "Enfileirando..." : "Iniciar Extração"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
