import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, MapPin, PlusCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { getTimelineFeed } from "@/services/timeline.functions";
import { formatMoney } from "@/lib/money";
import { formatDate } from "../lib/datetime";
import { PublishSheet } from "@/components/commerce/publish-sheet";

export const Route = createFileRoute("/_store/")({
  loader: async () => {
    const feed = await getTimelineFeed({ data: { limit: 30 } });
    return { feed };
  },
  component: Home,
});

function Home() {
  const { feed } = Route.useLoaderData();

  return (
    <div className="flex flex-col min-h-screen bg-background bg-noise pb-20">
      {/* Search / Top Bar */}
      <div className="sticky top-0 z-30 bg-secondary px-4 py-4 border-b-4 border-ink shadow-md flex items-center gap-3">
        <div className="flex-1 flex items-center bg-paper border-4 border-ink shadow-hard px-4 py-3 hover-lift">
          <Search className="size-6 text-ink mr-3" />
          <input
            type="text"
            placeholder="BUSCAR EVENTOS, CLASSIFICADOS, MERCADORIAS..."
            className="bg-transparent border-none outline-none w-full text-ink placeholder:text-ink/50 font-mono text-sm md:text-base font-bold uppercase tracking-wider"
          />
        </div>
        <Button variant="default" size="icon" className="shrink-0 w-14 h-14 bg-directory-yellow text-ink hover:bg-directory-yellow/90">
          <MapPin className="size-6" />
        </Button>
      </div>

      <div className="p-4 md:p-8 space-y-10 max-w-4xl mx-auto w-full mt-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b-4 border-ink pb-6">
          <h2 className="text-display text-5xl md:text-7xl text-ink leading-none">
            MURAL DA <br />
            <span className="text-poster-red">COMUNIDADE</span>
          </h2>
          <PublishSheet />
        </div>

        {feed.length === 0 ? (
          <div className="relative rotate-1 hover:rotate-0 transition-all duration-300">
            {/* Fita Adesiva */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-32 h-10 bg-paper/80 backdrop-blur-sm border-2 border-ink/20 -rotate-3 z-10 shadow-sm" />
            <Surface variant="zine" padding="lg" className="text-center relative bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]">
              <div className="absolute -right-6 -top-6 rotate-12">
                <div className="stamp-badge text-2xl px-4 py-2 border-4 shadow-hard">VAZIO</div>
              </div>
              <div className="py-12 flex flex-col items-center justify-center">
                <div className="size-24 rounded-full border-4 border-ink border-dashed flex items-center justify-center mb-6">
                  <Search className="size-10 text-ink/40" />
                </div>
                <h3 className="font-display text-4xl mb-3 uppercase tracking-tighter">O Silêncio das Ruas</h3>
                <p className="font-serif text-lg text-ink/80 max-w-md mx-auto mb-8">
                  Nenhuma publicação foi encontrada neste mural. Seja o primeiro a colar um cartaz, anunciar uma mercadoria ou divulgar um evento.
                </p>
                <Button asChild className="bg-ink text-paper text-lg border-2 border-ink shadow-hard">
                  <Link to="/entrar">Entrar para publicar</Link>
                </Button>
              </div>
            </Surface>
          </div>
        ) : (
          <div className="grid gap-8">
            {feed.map((item: any) => (
              <div key={`${item.type}-${item.id}`} className="hover-lift">
                {item.type === "event" && (
                  <Surface variant="flyer" padding="none">
                    {item.image ? (
                      <div className="bg-ink aspect-video relative overflow-hidden flex flex-col justify-end p-6 border-b-4 border-ink">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-screen grayscale transition-all duration-500 hover:scale-105 hover:opacity-80"
                        />
                        <div className="relative z-10">
                          <span className="bg-directory-yellow text-ink text-badge px-3 py-1 border-2 border-ink inline-block mb-3 font-bold shadow-[2px_2px_0px_0px_#121212]">
                            {formatDate(item.date)}
                          </span>
                          <h3 className="text-display text-5xl md:text-6xl text-paper leading-none mb-1">
                            {item.title}
                          </h3>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-ink aspect-video p-6 flex flex-col justify-end relative overflow-hidden border-b-4 border-ink">
                        <div className="absolute inset-0 opacity-30 bg-noise mix-blend-overlay" />
                        <div className="relative z-10">
                          <span className="bg-electric-cyan text-ink text-badge px-3 py-1 border-2 border-ink inline-block mb-3 font-bold shadow-[2px_2px_0px_0px_#121212]">
                            {formatDate(item.date)}
                          </span>
                          <h3 className="text-display text-5xl md:text-6xl text-paper leading-none mb-1">
                            {item.title}
                          </h3>
                        </div>
                      </div>
                    )}
                    <div className="p-4 bg-paper text-ink flex justify-between items-center gap-4">
                      <div>
                        <p className="font-bold uppercase tracking-tight text-lg">Evento Confirmado</p>
                      </div>
                      <Button variant="default" asChild className="border-2 border-ink shadow-[4px_4px_0px_0px_#121212] bg-electric-cyan text-ink hover:bg-electric-cyan/80">
                        <Link to="/evento/$id" params={{ id: item.id }}>
                          Ver Ingressos
                        </Link>
                      </Button>
                    </div>
                  </Surface>
                )}

                {item.type === "classified" && (
                  <Surface variant="yellow-pages" padding="lg" className="relative -rotate-1">
                    <p className="font-mono text-sm text-ink/70 mb-2 uppercase tracking-wider font-bold border-b-2 border-ink/20 pb-2 inline-block">
                      {formatDate(item.date)}
                    </p>
                    <h3 className="font-display text-3xl md:text-4xl mb-3 leading-none uppercase">{item.title}</h3>
                    <p className="text-ink font-serif text-lg leading-relaxed mb-6">
                      {item.content}
                    </p>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-t-2 border-ink pt-4 mt-4">
                      {item.price_cents !== undefined && item.price_cents !== null ? (
                        <div className="text-2xl font-bold font-mono">
                          {formatMoney(item.price_cents)}
                        </div>
                      ) : <div />}
                      <Button variant="default" asChild className="bg-ink text-paper w-full sm:w-auto hover:bg-ink/80">
                        <Link to="/mural">
                           Ver no Mural
                        </Link>
                      </Button>
                    </div>
                  </Surface>
                )}

                {item.type === "product" && (
                  <Surface variant="polaroid" padding="md" className="rotate-1 max-w-sm mx-auto w-full">
                    <div className="aspect-square bg-newsprint border-2 border-ink mb-4 relative overflow-hidden flex items-center justify-center">
                       {item.image ? (
                         <img src={item.image} alt={item.title} className="absolute inset-0 w-full h-full object-cover mix-blend-multiply" />
                       ) : (
                         <Search className="size-12 text-ink/20" />
                       )}
                    </div>
                    <h3 className="font-display text-2xl uppercase tracking-tight text-ink mb-1 leading-none">
                      {item.title}
                    </h3>
                    <p className="font-mono text-sm text-ink/70 mb-4 truncate">{item.content}</p>
                    <div className="flex justify-between items-center pt-2 border-t-2 border-ink/20">
                      <span className="text-xs font-mono uppercase bg-black text-white px-2 py-1 font-bold">
                        Mercadoria
                      </span>
                      <Button variant="outline" size="sm" asChild className="border-2 border-ink text-ink font-bold hover:bg-ink hover:text-paper">
                        <Link to="/produto/$slug" params={{ slug: item.id }}>
                          Comprar
                        </Link>
                      </Button>
                    </div>
                  </Surface>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
