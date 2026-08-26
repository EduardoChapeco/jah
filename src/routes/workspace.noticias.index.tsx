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
  Inbox,
  User,
  Phone,
  Megaphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  listWorkspaceArticles,
  deleteArticle,
  listCommunityNewsTips,
  type NewsArticleDTO,
} from "@/services/news.functions";
import { toast } from "sonner";
import { PageHeader } from "@/components/commerce/page-header";
import { EmptyState } from "@/components/state/states";

export const Route = createFileRoute("/workspace/noticias/")({
  head: () => ({ meta: [{ title: "Redação & Gestão de Notícias | Wider Workspace" }] }),
  loader: async () => {
    const [articles, tips] = await Promise.all([
      listWorkspaceArticles().catch(() => []),
      listCommunityNewsTips().catch(() => []),
    ]);
    return { articles, tips: tips || [] };
  },
  component: WorkspaceNoticiasIndexPage,
});

function WorkspaceNoticiasIndexPage() {
  const { articles: initialArticles, tips } = Route.useLoaderData() as any;
  const [articles, setArticles] = useState<NewsArticleDTO[]>(initialArticles || []);
  const [activeTab, setActiveTab] = useState("materias");

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
        title="Redação & Notícias"
        actions={
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="rounded-xl font-bold text-xs gap-1.5">
              <Link to="/workspace/marketing/patrocinadores">
                <Megaphone className="size-3.5" />
                Patrocinadores & Ads
              </Link>
            </Button>
            <Button asChild size="sm" className="rounded-xl font-bold gap-1.5 text-xs">
              <Link to="/workspace/noticias/novo">
                <Plus className="size-3.5" />
                <span>Nova Matéria</span>
              </Link>
            </Button>
          </div>
        }
      />

      {/* Abas */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 h-10 w-full max-w-sm mb-6">
          <TabsTrigger value="materias" className="text-xs font-semibold gap-1.5">
            <Newspaper className="size-3.5" />
            Matérias ({articles.length})
          </TabsTrigger>
          <TabsTrigger value="pautas" className="text-xs font-semibold gap-1.5">
            <Inbox className="size-3.5" />
            Pautas dos Leitores ({tips.length})
          </TabsTrigger>
        </TabsList>

        {/* ── Aba 1: Matérias ── */}
        <TabsContent value="materias" className="space-y-4">
          {articles.length === 0 ? (
            <EmptyState
              title="Nenhuma matéria publicada ainda"
              description="Comece a produzir notícias, reportagens e coberturas locais para engajar sua comunidade."
            />
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {articles.map((art) => (
                <div
                  key={art.id}
                  className="p-4 sm:p-5 rounded-2xl bg-card border border-border/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4 min-w-0">
                    {art.cover_media_url && (
                      <div className="size-16 rounded-xl overflow-hidden bg-muted shrink-0">
                        <img
                          src={art.cover_media_url}
                          alt={art.title}
                          className="size-full object-cover"
                        />
                      </div>
                    )}

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-[10px] uppercase font-mono">
                          {art.category}
                        </Badge>
                        <Badge
                          variant={art.status === "published" ? "default" : "secondary"}
                          className="text-[10px]"
                        >
                          {art.status === "published" ? "Publicado" : "Rascunho"}
                        </Badge>
                      </div>

                      <h3 className="text-sm sm:text-base font-bold text-foreground line-clamp-1">
                        {art.title}
                      </h3>

                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1 font-mono">
                          <Eye className="size-3.5" />
                          {art.views_count || 0} views
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="size-3.5" />
                          {art.reading_time_minutes || 3} min
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-xs">
                      <Link to="/noticias/$slug" params={{ slug: art.slug }} target="_blank">
                        <ExternalLink className="size-3.5 mr-1" />
                        Ver
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(art.id)}
                      className="size-8 text-muted-foreground hover:text-destructive"
                      title="Excluir Matéria"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Aba 2: Pautas dos Leitores ── */}
        <TabsContent value="pautas" className="space-y-4">
          {tips.length === 0 ? (
            <EmptyState
              title="Nenhuma sugestão de pauta pendente"
              description="Quando os leitores enviarem denúncias ou sugestões no portal, elas aparecerão aqui para a redação analisar."
            />
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {tips.map((tip: any) => (
                <div
                  key={tip.id}
                  className="p-4 sm:p-5 rounded-2xl bg-card border border-border/60 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <User className="size-3.5" />
                      <span className="font-bold text-foreground">{tip.author_name}</span>
                      {tip.contact_info && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 font-mono">
                            <Phone className="size-3" />
                            {tip.contact_info}
                          </span>
                        </>
                      )}
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {tip.status === "pending" ? "Pendente" : tip.status}
                    </Badge>
                  </div>

                  <p className="text-xs sm:text-sm text-foreground whitespace-pre-line leading-relaxed">
                    {tip.tip_text}
                  </p>

                  <div className="pt-2 border-t border-border/40 flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(tip.created_at).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <Button asChild size="sm" variant="outline" className="h-7 text-xs font-bold gap-1">
                      <Link to="/workspace/noticias/novo">
                        <Plus className="size-3" />
                        Escrever Matéria
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
