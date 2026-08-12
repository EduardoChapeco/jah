import { Link } from "@tanstack/react-router";
import { PlusCircle, Calendar, Tag, Package, Megaphone, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Surface } from "@/components/ui/surface";
import { useQuery } from "@tanstack/react-query";
import { getIdentity } from "@/services/identity.functions";

export function PublishSheet() {
  const { data: identity, isLoading } = useQuery({
    queryKey: ["identity"],
    queryFn: () => getIdentity(),
  });

  const hasBusiness = identity && identity.memberships && identity.memberships.length > 0;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="default"
          size="lg"
          className="bg-primary text-primary-foreground hover:bg-primary/90 w-full md:w-auto text-lg px-8 shadow-sm border border-border"
        >
          <PlusCircle className="size-5 mr-2" />
          PUBLICAR
        </Button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="h-[80vh] sm:h-[75vh] bg-background border-t border-border rounded-t-3xl sm:rounded-t-[3rem] px-4 py-8 sm:px-12 sm:py-12 overflow-y-auto z-[100]"
      >
        <div className="max-w-4xl mx-auto pb-20">
          <SheetHeader className="mb-8">
            <SheetTitle className="font-display text-4xl sm:text-6xl uppercase tracking-tighter text-foreground text-left flex items-center gap-4">
              <Megaphone className="size-10 sm:size-14 text-primary rotate-[-10deg]" />O que você
              vai colar no muro?
            </SheetTitle>
            <SheetDescription className="font-sans text-muted-foreground text-lg sm:text-xl text-foreground/80 text-left max-w-2xl mt-4">
              A Jah é uma plataforma comunitária. Você pode anunciar serviços, vender produtos da
              sua marca, ou publicar eventos.
            </SheetDescription>
          </SheetHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8">
            <Link to="/workspace/agenda" className="block outline-none group">
              <Surface
                variant="default"
                padding="md"
                className="h-full group-hover:bg-ivory transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 p-4 rounded-xl border border-poster-red">
                    <Calendar className="size-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display text-2xl uppercase tracking-tight text-foreground mb-2 group-hover:text-primary transition-colors">
                      Evento ou Festa
                    </h3>
                    <p className="font-sans text-muted-foreground text-foreground/70">
                      Crie uma página para seu evento, gerencie lotes e venda ingressos diretamente
                      para a comunidade.
                    </p>
                  </div>
                </div>
              </Surface>
            </Link>

            <Link to="/workspace/catalogo/produtos/novo" className="block outline-none group">
              <Surface
                variant="default"
                padding="md"
                className="h-full group-hover:bg-ivory transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 p-4 rounded-xl border border-electric-cyan">
                    <Package className="size-8 text-electric-cyan" />
                  </div>
                  <div>
                    <h3 className="font-display text-2xl uppercase tracking-tight text-foreground mb-2 group-hover:text-electric-cyan transition-colors">
                      Mercadoria (Loja)
                    </h3>
                    <p className="font-sans text-muted-foreground text-foreground/70">
                      Venda produtos físicos ou digitais da sua marca, com gestão de estoque e
                      frete.
                    </p>
                  </div>
                </div>
              </Surface>
            </Link>

            <Link to="/conta/classificados" className="block outline-none group">
              <Surface
                variant="default"
                padding="md"
                className="h-full group-hover:bg-ivory transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="bg-primary/5 p-4 rounded-xl border border-border">
                    <Tag className="size-8 text-foreground" />
                  </div>
                  <div>
                    <h3 className="font-display text-2xl uppercase tracking-tight text-foreground mb-2">
                      Classificado
                    </h3>
                    <p className="font-sans text-muted-foreground text-foreground/70">
                      Anuncie um serviço, vaga, instrumento musical usado ou aluguel de estúdio.
                    </p>
                  </div>
                </div>
              </Surface>
            </Link>

            <Link to="/workspace/mural/novo" className="block outline-none group">
              <Surface
                variant="default"
                padding="md"
                className="h-full group-hover:bg-ivory transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 p-4 rounded-xl border border-border">
                    <PlusCircle className="size-8 text-foreground" />
                  </div>
                  <div>
                    <h3 className="font-display text-2xl uppercase tracking-tight text-foreground mb-2 group-hover:text-signal-orange transition-colors">
                      Post Rápido
                    </h3>
                    <p className="font-sans text-muted-foreground text-foreground/70">
                      Mande uma foto ou mensagem para seus seguidores no Mural da Comunidade.
                    </p>
                  </div>
                </div>
              </Surface>
            </Link>
          </div>

          <div className="mt-12 pt-8 border-t border-border/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            {isLoading ? (
              <div className="flex items-center text-foreground/60 font-mono text-sm uppercase">
                <Loader2 className="size-4 animate-spin mr-2" />
                Verificando acesso...
              </div>
            ) : hasBusiness ? (
              <>
                <p className="font-mono text-sm uppercase font-bold text-foreground/60">
                  Conta de Produtor Ativa
                </p>
                <Button
                  variant="outline"
                  asChild
                  className="border border-border shadow-sm bg-background text-foreground hover:bg-muted"
                >
                  <Link to="/workspace">Ir para meu Painel</Link>
                </Button>
              </>
            ) : (
              <>
                <p className="font-mono text-sm uppercase font-bold text-primary">
                  Para criar Eventos e Lojas, é necessário ter um Coletivo.
                </p>
                <Button
                  variant="default"
                  asChild
                  className="border border-border shadow-sm bg-secondary text-foreground hover:bg-secondary/80"
                >
                  <Link to="/criar-negocio">Criar Conta de Produtor</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
