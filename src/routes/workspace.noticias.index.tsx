import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Newspaper,
  Plus,
  Eye,
  Trash2,
  Edit,
  ExternalLink,
  Calendar,
  Clock,
  CheckCircle2,
  FileText,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  listWorkspaceArticles,
  deleteArticle,
  type NewsArticleDTO,
} from "@/services/news.functions";
import { toast } from "sonner";

import { PageHeader } from "@/components/commerce/page-header";

export const Route = createFileRoute("/workspace/noticias/")({
  head: () => ({ meta: [{ title: "Redação & Gestão de Notícias | Wider Workspace" }] }),
  loader: async () => {
    const articles = await listWorkspaceArticles().catch(() => []);
    return { articles };
  },
  component: WorkspaceNoticiasIndexPage,
});

function WorkspaceNoticiasIndexPage() {
  const { articles: initialArticles } = Route.useLoaderData();
  const [articles, setArticles] = useState<NewsArticleDTO[]>(initialArticles || []);

  const refreshArticles = async () => {
    const updated = await listWorkspaceArticles().catch(() => []);
    setArticles(updated);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente remover esta matéria?")) return;
    try {
      await deleteArticle({ data: { id } });
      toast.success("Matéria removida com sucesso.");
      await refreshArticles();
    } catch {
      toast.error("Erro ao remover matéria.");
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <PageHeader
        eyebrow="Redação & Conteúdo"
        title="Matérias & Notícias"
        actions={
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="rounded-xl font-bold text-xs ">
              <Link to={"/workspace/marketing/patrocinadores" as any}>Patrocinadores</Link>
            </Button>
            <Button asChild size="sm" className="rounded-xl font-bold gap-1.5 text-xs bg-primary text-primary-foreground ">
              <Link to={"/workspace/noticias/novo" as any}>
                <Plus className="size-3.5" />
                <span>Nova Matéria</span>
              </Link>
            </Button>
          </div>
        }
      />

      {/* Lista de Matérias */}
      {articles.length === 0 ? (
        <div className="py-12 text-center rounded-3xl border-0 bg-card/60 space-y-4">
          <div className="size-12 rounded-2xl bg-muted flex items-center justify-center mx-auto text-muted-foreground">
            <Newspaper className="size-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground">Nenhuma matéria publicada ainda</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Comece a produzir notícias, reportagens e coberturas locais para engajar sua comunidade.
            </p>
          </div>
          <Button asChild size="sm" className="rounded-xl font-bold text-xs gap-1.5 bg-primary text-primary-foreground ">
            <Link to={"/workspace/noticias/novo" as any}>
              <Plus className="size-4" />
              <span>Escrever Primeira Matéria</span>
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {articles.map((art) => (
            <div
              key={art.id}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-3xl  bg-card hover-elevate transition-all"
            >
              <div className="flex items-start sm:items-center gap-4 min-w-0 flex-1">
                {art.cover_media_url ? (
                  <div className="size-20 rounded-2xl overflow-hidden bg-muted shrink-0">
                    <img
                      src={art.cover_media_url}
                      alt={art.title}
                      className="size-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="size-20 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground/40 shrink-0">
                    <FileText className="size-8" />
                  </div>
                )}

                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {art.kicker && (
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-primary/10 text-primary">
                        {art.kicker}
                      </span>
                    )}
                    <Badge
                      variant={art.status === "published" ? "default" : "secondary"}
                      className="text-[10px]"
                    >
                      {art.status === "published" ? "Publicado" : "Rascunho"}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      /{art.slug}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-foreground truncate">
                    {art.title}
                  </h3>

                  <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="size-3.5" />
                      <span>{art.views_count} views</span>
                    </span>
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="size-3.5" />
                      <span>{art.reading_time_minutes} min</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Ações */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-border/40">
                <Button asChild variant="outline" size="sm" className="h-8 rounded-xl text-xs">
                  <Link to={"/noticias/$slug" as any} params={{ slug: art.slug } as any} target="_blank">
                    <ExternalLink className="size-3.5 mr-1" />
                    <span>Ver</span>
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(art.id)}
                  className="size-8 rounded-xl text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
