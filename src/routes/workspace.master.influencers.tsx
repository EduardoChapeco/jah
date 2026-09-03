import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import {
  Sparkle,
  Search,
  CheckCircle,
  XCircle,
  SlidersHorizontal,
  Star,
  ShieldCheck,
  Globe,
  Share2,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/state/states";
import { listCreatorProfiles, type CreatorProfileDTO } from "@/services/creators.functions";
import { toggleAmbassadorStatus } from "@/services/stories.functions";

export const Route = createFileRoute("/workspace/master/influencers")({
  head: () => ({ meta: [{ title: "Influenciadores & Embaixadores | Master" }] }),
  loader: async () => {
    const res = await listCreatorProfiles();
    return res || [];
  },
  component: MasterInfluencersPage,
});

function MasterInfluencersPage() {
  const router = useRouter();
  const initialCreators = Route.useLoaderData();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterAmbassador, setFilterAmbassador] = useState<"all" | "ambassadors">("all");
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const filteredCreators = (initialCreators || []).filter((creator: CreatorProfileDTO) => {
    if (filterAmbassador === "ambassadors" && !creator.is_official_ambassador) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = creator.name?.toLowerCase().includes(q);
      const matchHandle = creator.handle?.toLowerCase().includes(q);
      const matchNiche = creator.niche?.toLowerCase().includes(q);
      if (!matchName && !matchHandle && !matchNiche) return false;
    }
    return true;
  });

  const handleToggleAmbassador = async (creator: CreatorProfileDTO) => {
    setIsUpdating(creator.id);
    const nextStatus = !creator.is_official_ambassador;
    try {
      await toggleAmbassadorStatus({
        data: {
          creatorId: creator.id,
          isOfficialAmbassador: nextStatus,
          ambassadorBadgeLabel: nextStatus ? "Embaixador Oficial" : undefined,
        },
      });
      toast.success(
        nextStatus
          ? `Selo de Embaixador concedido a ${creator.name}!`
          : `Selo de Embaixador removido de ${creator.name}.`,
      );
      router.invalidate();
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar status de embaixador.");
    } finally {
      setIsUpdating(null);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <PageHeader
        eyebrow="Curadoria"
        title="Influenciadores"
      />

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-3 rounded-2xl border border-border/70">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, @handle ou nicho..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9.5 rounded-xl text-xs h-10 border-border"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant={filterAmbassador === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterAmbassador("all")}
            className="rounded-xl text-xs font-bold"
          >
            Todos ({initialCreators.length})
          </Button>

          <Button
            variant={filterAmbassador === "ambassadors" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterAmbassador("ambassadors")}
            className="rounded-xl text-xs font-bold gap-1.5"
          >
            <Sparkle className="size-3.5 text-purple-500" />
            <span>Embaixadores Oficiais ({initialCreators.filter((c: any) => c.is_official_ambassador).length})</span>
          </Button>
        </div>
      </div>

      {/* Lista de Criadores */}
      {filteredCreators.length === 0 ? (
        <EmptyState
          title="Nenhum influenciador encontrado"
          description="Nenhum criador corresponde aos filtros de busca aplicados."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCreators.map((creator: CreatorProfileDTO) => {
            const isAmbassador = creator.is_official_ambassador;

            return (
              <Card
                key={creator.id}
                className={`overflow-hidden rounded-2xl border transition-all ${
                  isAmbassador
                    ? "border-purple-500/40 bg-gradient-to-b from-purple-500/5 to-transparent"
                    : "border-border/70 bg-card"
                }`}
              >
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="size-12 rounded-full overflow-hidden border-2 border-primary/20 bg-muted shrink-0">
                        {creator.avatar_url ? (
                          <img
                            src={creator.avatar_url}
                            alt={creator.name}
                            className="size-full object-cover"
                          />
                        ) : (
                          <div className="size-full flex items-center justify-center bg-primary/10 text-primary font-bold text-sm">
                            {creator.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-bold text-foreground truncate">
                            {creator.name}
                          </h4>
                          {isAmbassador && (
                            <Sparkle className="size-4 text-purple-500 shrink-0 fill-purple-500" />
                          )}
                        </div>
                        <span className="text-xs font-mono text-muted-foreground block truncate">
                          @{creator.handle}
                        </span>
                      </div>
                    </div>

                    <Badge
                      variant={isAmbassador ? "default" : "outline"}
                      className={`text-[10px] font-bold ${
                        isAmbassador ? "bg-purple-600 hover:bg-purple-700 text-white" : ""
                      }`}
                    >
                      {creator.niche || "Geral"}
                    </Badge>
                  </div>

                  {creator.bio && (
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {creator.bio}
                    </p>
                  )}

                  <div className="pt-2 border-t border-border/50 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
                      <span>Score: {Number(creator.engagement_score || 0).toFixed(1)}</span>
                    </div>

                    <Button
                      size="sm"
                      variant={isAmbassador ? "destructive" : "default"}
                      disabled={isUpdating === creator.id}
                      onClick={() => handleToggleAmbassador(creator)}
                      className="rounded-xl text-xs font-bold gap-1.5"
                    >
                      {isAmbassador ? (
                        <>
                          <XCircle className="size-3.5" />
                          <span>Remover Selo</span>
                        </>
                      ) : (
                        <>
                          <Sparkle className="size-3.5" />
                          <span>Tornar Embaixador</span>
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
