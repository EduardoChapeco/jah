import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Loader2, AlertCircle, Phone, CheckCircle, Store } from "lucide-react";
import { getPublicDirectory } from "@/services/directory.functions";

export const Route = createFileRoute("/_store/diretorio")({
  head: () => ({ meta: [{ title: "Diretório de Membros & Negócios — JAH" }] }),
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
    <div className="w-full space-y-8">
      {/* Header Editorial do Diretório */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-linear-to-br from-primary/10 via-card to-background p-6 md:p-10 shadow-xs">
        <div className="max-w-2xl space-y-3 relative z-10">
          <span className="text-[11px] font-bold uppercase tracking-wider text-primary font-mono bg-primary/10 px-2.5 py-1 rounded-full inline-block">
            Diretório da Rede JAH
          </span>
          <h1 className="text-2xl md:text-4xl font-black text-foreground tracking-tight">
            Membros, produtores e iniciativas locais.
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
            Conheça as pessoas, negócios e marcas que compõem a nossa comunidade.
          </p>
        </div>
      </div>

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
