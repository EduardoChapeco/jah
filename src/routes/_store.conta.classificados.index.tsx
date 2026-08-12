import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getClassifieds } from "@/services/classifieds.functions";
import { Surface } from "@/components/ui/surface";
import { Button } from "@/components/ui/button";
import { Tag, Plus, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_store/conta/classificados/")({
  component: ClassificadosIndex,
});

function ClassificadosIndex() {
  const { data: classifieds, isLoading } = useQuery({
    queryKey: ["classifieds"],
    queryFn: () => getClassifieds(),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl uppercase tracking-tighter text-foreground flex items-center gap-3">
            <Tag className="size-8 text-electric-cyan" />
            Classificados
          </h1>
          <p className="font-sans text-muted-foreground text-foreground/70">
            Gerencie seus classificados no mural da comunidade.
          </p>
        </div>
        <Button
          asChild
          variant="default"
          className="bg-primary text-foreground hover:bg-primary/90 border border-border shadow-sm"
        >
          <Link to="/workspace">
            <Plus className="size-4 mr-2" />
            Criar Anúncio
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-8 animate-spin text-foreground/40" />
        </div>
      ) : classifieds && classifieds.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classifieds.map((ad) => (
            <Surface
              key={ad.id}
              variant="default"
              padding="md"
              className="flex flex-col justify-between h-full group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="bg-primary text-primary-foreground text-xs font-mono uppercase px-2 py-1 rounded-sm">
                    {ad.category}
                  </span>
                  <span
                    className={`text-xs font-mono uppercase font-bold ${ad.status === "active" ? "text-green-600" : "text-primary"}`}
                  >
                    {ad.status === "active" ? "Ativo" : ad.status}
                  </span>
                </div>
                <h3 className="font-display text-2xl uppercase tracking-tight text-foreground mb-2">
                  {ad.title}
                </h3>
                <p className="font-sans text-muted-foreground text-foreground/80 line-clamp-3 mb-4">
                  {ad.content}
                </p>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-border/10 pt-4">
                <span className="font-mono text-foreground font-bold">
                  {ad.price_cents
                    ? `R$ ${(ad.price_cents / 100).toFixed(2).replace(".", ",")}`
                    : "À combinar"}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="border border-border shadow-sm bg-white text-foreground hover:bg-ivory"
                >
                  <Link to="/conta/classificados">Editar</Link>
                </Button>
              </div>
            </Surface>
          ))}
        </div>
      ) : (
        <Surface
          variant="default"
          padding="lg"
          className="text-center py-20 flex flex-col items-center justify-center grayscale opacity-80"
        >
          <div className="bg-primary/10 p-6 rounded-full border border-border border-dashed mb-6">
            <Tag className="size-12 text-foreground/50" />
          </div>
          <h2 className="font-display text-3xl uppercase tracking-tight text-foreground mb-2">
            Muro Vazio
          </h2>
          <p className="font-sans text-muted-foreground text-foreground/70 max-w-md mx-auto mb-8">
            Você ainda não publicou nenhum classificado. Anuncie serviços, vagas ou venda aquele
            instrumento encostado.
          </p>
          <Button
            asChild
            variant="default"
            className="bg-primary text-primary-foreground border border-border shadow-sm"
          >
            <Link to="/workspace">Colar o primeiro cartaz</Link>
          </Button>
        </Surface>
      )}
    </div>
  );
}
