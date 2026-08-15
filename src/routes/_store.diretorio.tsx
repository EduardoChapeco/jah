import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Loader2, AlertCircle, Phone, CheckCircle, Store } from "lucide-react";
import { getPublicDirectory } from "@/services/directory.functions";
import { listHotpages } from "@/services/hotpage.functions";
import { listActiveBanners } from "@/services/banner.functions";
import { BannerHeroCarousel } from "@/components/commerce/banner-hero-carousel";
import { HotpagesRail } from "@/components/commerce/hotpages-rail";

export const Route = createFileRoute("/_store/diretorio")({
  head: () => ({ meta: [{ title: "Diretório de Membros & Negócios — JAH" }] }),
  loader: async () => {
    const [banners, hotpages] = await Promise.all([
      listActiveBanners({ data: { placement: "all" } }).catch(() => []),
      listHotpages().catch(() => []),
    ]);
    return { banners, hotpages };
  },
  component: DirectoryPage,
});

function DirectoryPage() {
  const { banners, hotpages } = Route.useLoaderData();
  const {
    data: listings,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["public-directory"],
    queryFn: () => getPublicDirectory({ data: { limit: 50 } }),
    staleTime: 60_000,
  });

  return (
    <div className="w-full space-y-6">
      {/* ── Banners Hero ── */}
      {banners && banners.length > 0 && (
        <BannerHeroCarousel banners={banners} className="w-full" />
      )}

      {/* ── Hotpages & Categorias ── */}
      {hotpages && hotpages.length > 0 && (
        <section aria-label="Categorias">
          <HotpagesRail hotpages={hotpages} />
        </section>
      )}

      {isLoading && (
        <div className="flex justify-center py-24">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      )}

      {isError && (
        <div className="py-12 px-6 rounded-2xl border border-destructive/20 bg-destructive/5 text-center space-y-3">
          <AlertCircle className="size-8 text-destructive mx-auto" />
          <p className="font-bold text-foreground text-sm">Erro ao carregar o Diretório</p>
        </div>
      )}

      {!isLoading && !isError && listings?.length === 0 && (
        <div className="py-24 text-center space-y-3 bg-muted/10 rounded-3xl border border-border p-8">
          <BookOpen className="size-10 text-muted-foreground/40 mx-auto" />
          <h2 className="text-base font-bold text-foreground">Diretório em Formação</h2>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Seja o primeiro a cadastrar seu coletivo, ateliê ou negócio na comunidade!
          </p>
        </div>
      )}

      {!isLoading && !isError && listings && listings.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 w-full">
          {listings.map((listing) => (
            <div
              key={listing.id}
              className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-xs hover:border-primary/50 transition-colors space-y-4"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px] uppercase font-mono">
                    {listing.category || "Geral"}
                  </Badge>
                  {listing.is_verified && (
                    <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-600 font-bold">
                      <CheckCircle className="size-3" /> Verificado
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-bold text-foreground leading-snug">
                    {(listing.stores as any)?.name || "Negócio Comunitário"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {(listing.stores as any)?.type === "event_producer"
                      ? "Produtor de Eventos"
                      : (listing.stores as any)?.type === "band"
                        ? "Banda / Artista"
                        : (listing.stores as any)?.type === "ecommerce"
                          ? "Loja Virtual"
                          : (listing.stores as any)?.type === "physical_store"
                            ? "Loja Física"
                            : "Coletivo"}
                  </p>
                </div>
              </div>

              {listing.contact_phone && (
                <p className="flex items-center gap-2 font-mono text-xs text-muted-foreground bg-muted/40 p-2.5 rounded-xl border border-border/40">
                  <Phone className="size-3.5 shrink-0" />
                  <span>{listing.contact_phone}</span>
                </p>
              )}

              <div className="pt-2 border-t border-border/40">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="w-full rounded-xl text-xs font-semibold"
                >
                  <Link to="/mercado">
                    <Store className="size-3.5 mr-1.5" />
                    <span>Ver Produtos & Perfil</span>
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
