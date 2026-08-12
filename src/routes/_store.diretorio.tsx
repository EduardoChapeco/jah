import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/commerce/page-header";
import { Surface } from "@/components/ui/surface";
import { Button } from "@/components/ui/button";
import { BookOpen, Loader2, AlertCircle, Phone, MapPin, CheckCircle } from "lucide-react";
import { getPublicDirectory } from "@/services/directory.functions";

export const Route = createFileRoute("/_store/diretorio")({
  head: () => ({ meta: [{ title: "Diretório" }] }),
  component: DirectoryPage,
});

function DirectoryPage() {
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
    <div className="container max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-20 space-y-10">
      <PageHeader eyebrow="Yellow Pages" title="Diretório" />

      {isLoading && (
        <div className="flex justify-center py-20 mt-10">
          <Loader2 className="size-10 animate-spin text-foreground/30" />
        </div>
      )}

      {isError && (
        <div className="mt-12 flex justify-center">
          <Surface
            variant="default"
            padding="lg"
            className="flex items-center gap-4 text-primary max-w-xl w-full"
          >
            <AlertCircle className="size-8 shrink-0" />
            <div>
              <p className="font-display text-xl uppercase font-bold">
                Erro ao carregar o Diretório
              </p>
              <p className="font-sans text-muted-foreground text-sm text-foreground/70">
                Tente novamente em instantes.
              </p>
            </div>
          </Surface>
        </div>
      )}

      {!isLoading && !isError && listings?.length === 0 && (
        <div className="mt-12 flex justify-center">
          <Surface
            variant="default"
            padding="lg"
            className="text-center py-20 flex flex-col items-center justify-center max-w-2xl w-full"
          >
            <div className="bg-primary/10 p-6 rounded-full border border-border border-dashed mb-6">
              <BookOpen className="size-12 text-foreground/50" />
            </div>
            <h2 className="font-display text-3xl uppercase tracking-tight text-foreground mb-2">
              Páginas em Branco
            </h2>
            <p className="font-sans text-muted-foreground text-foreground/70 max-w-md mx-auto mb-8">
              O diretório comunitário ainda não possui registros. Seja o primeiro a cadastrar seu
              coletivo ou serviço!
            </p>
            <Button
              asChild
              className="bg-primary text-primary-foreground text-lg border border-border shadow-sm"
            >
              <Link to="/criar-negocio">Cadastrar Negócio</Link>
            </Button>
          </Surface>
        </div>
      )}

      {!isLoading && !isError && listings && listings.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => (
            <Surface
              key={listing.id}
              variant="default"
              padding="md"
              className="flex flex-col group"
            >
              <div className="border-b border-border/20 pb-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="bg-primary text-primary-foreground text-xs font-mono uppercase px-2 py-1 font-bold">
                    {listing.category}
                  </span>
                  {listing.is_verified && (
                    <span className="flex items-center gap-1 text-xs font-mono uppercase text-green-700 font-bold">
                      <CheckCircle className="size-3" /> Verificado
                    </span>
                  )}
                </div>
                <h3 className="font-display text-2xl uppercase tracking-tight text-foreground mb-1">
                  {(listing.stores as any)?.name || "Negócio"}
                </h3>
                <p className="font-sans text-muted-foreground text-foreground/70 text-sm">
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

              <div className="flex-1 space-y-3">
                {listing.contact_phone && (
                  <p className="flex items-center gap-2 font-mono text-sm text-foreground/80">
                    <Phone className="size-4 shrink-0" />
                    {listing.contact_phone}
                  </p>
                )}
                {listing.address && (
                  <p className="flex items-start gap-2 font-mono text-sm text-foreground/80">
                    <MapPin className="size-4 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{listing.address}</span>
                  </p>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-border/20">
                <Button
                  asChild
                  variant="outline"
                  className="w-full border border-border text-foreground hover:bg-primary hover:text-primary-foreground shadow-sm"
                >
                  <Link to="/mercado">Ver Loja</Link>
                </Button>
              </div>
            </Surface>
          ))}
        </div>
      )}
    </div>
  );
}
