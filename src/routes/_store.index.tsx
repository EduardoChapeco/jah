import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, MapPin, PlusCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { getTimelineFeed } from "@/services/timeline.functions";
import { formatMoney } from "@/lib/money";

export const Route = createFileRoute("/_store/")({
  loader: async () => {
    // In a real app we might pass the storeId if we are on a specific store subdomain,
    // but for the global community feed we fetch across all stores.
    const feed = await getTimelineFeed({ data: { limit: 30 } });
    return { feed };
  },
  component: Home,
});

function Home() {
  const { feed } = Route.useLoaderData();

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20">
      {/* Search / Top Bar */}
      <div className="sticky top-0 z-10 bg-secondary px-4 py-3 border-b-2 border-border shadow-sm flex items-center gap-3">
        <div className="flex-1 flex items-center bg-background border-2 border-border px-3 py-2">
          <Search className="size-5 text-muted-foreground mr-2" />
          <input 
            type="text" 
            placeholder="Buscar eventos, classificados, mercadorias..." 
            className="bg-transparent border-none outline-none w-full text-foreground placeholder:text-muted-foreground font-mono text-sm"
          />
        </div>
        <Button variant="default" size="icon" className="shrink-0 border-2">
          <MapPin className="size-5" />
        </Button>
      </div>

      <div className="p-4 space-y-6 max-w-2xl mx-auto w-full mt-4">
        
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-editorial text-2xl">Mural da Comunidade</h2>
          <Button variant="outline" size="sm" className="bg-transparent border-2">
            <PlusCircle className="size-4 mr-2" />
            Publicar
          </Button>
        </div>

        {feed.length === 0 ? (
          <Surface variant="zine" padding="lg" className="text-center">
            <h3 className="font-bold text-xl mb-2">Mural Vazio</h3>
            <p className="font-serif">O silêncio das ruas. Nenhuma publicação encontrada.</p>
          </Surface>
        ) : (
          feed.map((item) => (
            <div key={`${item.type}-${item.id}`}>
              {item.type === "event" && (
                <Surface variant="flyer" padding="none">
                  {item.image ? (
                    <div className="bg-ink aspect-video relative overflow-hidden flex flex-col justify-end p-6">
                      <img src={item.image} alt={item.title} className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-screen grayscale" />
                      <div className="relative z-10">
                         <span className="bg-secondary text-secondary-foreground text-badge px-2 py-1 border border-border inline-block mb-2 font-bold">
                          {new Date(item.date).toLocaleDateString('pt-BR')}
                        </span>
                        <h3 className="text-editorial text-4xl text-primary-foreground leading-none mb-1">
                          {item.title}
                        </h3>
                      </div>
                    </div>
                  ) : (
                     <div className="bg-primary aspect-video p-6 flex flex-col justify-end relative overflow-hidden">
                       <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/black-paper.png')] mix-blend-multiply" />
                       <div className="relative z-10">
                        <span className="bg-secondary text-secondary-foreground text-badge px-2 py-1 border border-border inline-block mb-2 font-bold">
                          {new Date(item.date).toLocaleDateString('pt-BR')}
                        </span>
                        <h3 className="text-editorial text-4xl text-primary-foreground leading-none mb-1">
                          {item.title}
                        </h3>
                      </div>
                     </div>
                  )}
                  <div className="p-4 bg-paper text-ink border-t-4 border-ink flex justify-between items-center">
                    <div>
                      <p className="font-bold uppercase tracking-tight">Evento Confirmado</p>
                    </div>
                    <Button variant="default" className="border-2 border-ink shadow-sm">
                      Ver Ingressos
                    </Button>
                  </div>
                </Surface>
              )}

              {item.type === "classified" && (
                <Surface variant="zine" padding="md" className="relative">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-6 bg-white/50 backdrop-blur-sm border border-border/20 rotate-2 z-10"></div>
                  <p className="font-mono text-xs text-muted-foreground mb-3 uppercase tracking-wider">
                    {new Date(item.date).toLocaleDateString('pt-BR')}
                  </p>
                  <h3 className="font-bold text-xl mb-2 leading-tight">
                    {item.title}
                  </h3>
                  <p className="text-foreground/90 font-serif leading-relaxed mb-4">
                    {item.content}
                  </p>
                  {item.price_cents !== undefined && item.price_cents !== null && (
                    <div className="text-xs text-muted-foreground mt-2 border-t pt-2">
                      Valor: {formatMoney(item.price_cents)}
                    </div>
                  )}
                  <Button variant="default" className="w-full bg-ink text-paper hover:bg-ink/90">
                    Responder
                  </Button>
                </Surface>
              )}

              {item.type === "product" && (
                <Surface variant="polaroid" padding="md">
                  <h3 className="font-bold text-lg uppercase tracking-tight text-ink mb-1">{item.title}</h3>
                  <p className="font-mono text-sm text-ink/70 mb-2">{item.content}</p>
                  <div className="flex justify-between items-center mt-4">
                    <span className="text-xs font-mono uppercase bg-black text-white px-2 py-1">Mercadoria</span>
                    <Button variant="outline" size="sm" className="border-ink text-ink">Comprar</Button>
                  </div>
                </Surface>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
