import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { 
  Wand2, LayoutTemplate, Palette, Maximize, Download, ArrowLeft, Image as ImageIcon
} from "lucide-react";

import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Surface } from "@/components/ui/surface";
import { Label } from "@/components/ui/label";
import { PresentationRenderer, PresetID, AspectRatio, EntityData } from "@/components/commerce/presentation-renderer";
import { getProductById } from "@/services/admin-catalog.functions";

export const Route = createFileRoute("/workspace/estudio/")({
  head: () => ({ meta: [{ title: "Estúdio de Criação" }] }),
  validateSearch: (search: Record<string, unknown>) => {
    return {
      productId: search.productId as string | undefined,
    };
  },
  loaderDeps: ({ search }) => ({ productId: search.productId }),
  loader: async ({ deps }) => {
    if (!deps.productId) return null;
    return await getProductById({ data: { id: deps.productId } });
  },
  component: EstudioPage,
});

function EstudioPage() {
  const navigate = useNavigate();
  const searchParams = Route.useSearch();
  const initialProduct = Route.useLoaderData();
  
  const [entity, setEntity] = useState<EntityData | null>(null);
  const [preset, setPreset] = useState<PresetID>("lambe");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1");
  const [colorScheme, setColorScheme] = useState<"default" | "primary" | "yellow" | "charcoal">("primary");

  useEffect(() => {
    if (initialProduct) {
      setEntity({
        title: initialProduct.title,
        description: initialProduct.description,
        price_cents: initialProduct.price_cents,
        image_url: initialProduct.product_media?.[0]?.url,
        category: "Oferta Especial"
      });
    } else {
      setEntity(null);
    }
  }, [initialProduct]);

  const handleDownload = () => {
    toast.success("No futuro, isso fará o download do HTML renderizado como JPG/PNG!");
  };

  return (
    <div className="flex flex-col h-full bg-muted/10">
      <PageHeader 
        title="Estúdio de Criação" 
        description="Transforme seu catálogo em peças visuais impactantes (Flyers, Lambes e Zines)."
        actions={
          <div className="flex gap-2">
            {searchParams.productId && (
              <Button variant="outline" onClick={() => navigate({ to: "/workspace/catalogo/produtos" })}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao Catálogo
              </Button>
            )}
            <Button onClick={handleDownload} className="font-bold border-2 border-ink shadow-hard">
              <Download className="mr-2 h-4 w-4" />
              Baixar Imagem
            </Button>
          </div>
        }
      />

      <div className="flex-1 flex flex-col md:flex-row gap-6 p-6 min-h-0 overflow-hidden">
        {!initialProduct ? (
          <div className="w-full flex items-center justify-center">
            <div className="max-w-md w-full p-8 bg-card rounded-lg border-2 border-dashed border-border text-center">
              <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
              <h2 className="text-xl font-bold font-display text-foreground mb-2">Nenhum produto selecionado</h2>
              <p className="text-muted-foreground mb-6">
                Para criar artes no Estúdio, você precisa selecionar um produto real do seu catálogo. Dados ilustrativos não são permitidos.
              </p>
              <Button onClick={() => navigate({ to: "/workspace/catalogo/produtos" })} className="w-full font-bold border-2 border-ink shadow-hard">
                Ir para o Catálogo
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Editor Sidebar */}
            <ScrollArea className="w-full md:w-80 shrink-0 bg-card rounded-lg border-2 border-border p-6 shadow-sm">
              <div className="space-y-8 pb-10">
                
                <div className="space-y-4">
                  <h3 className="font-bold font-display text-lg flex items-center gap-2">
                    <LayoutTemplate className="h-5 w-5" />
                    Estilo Gráfico
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {["lambe", "polaroid", "ticket"].map((p) => (
                      <Button 
                        key={p} 
                        variant={preset === p ? "default" : "outline"} 
                        className={`h-20 flex-col gap-2 border-2 ${preset === p ? 'border-ink shadow-hard -translate-y-0.5' : 'border-border'}`}
                        onClick={() => setPreset(p as PresetID)}
                      >
                        <span className="capitalize font-bold">{p}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold font-display text-lg flex items-center gap-2">
                    <Maximize className="h-5 w-5" />
                    Formato
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      variant={aspectRatio === "1:1" ? "default" : "outline"} 
                      className={`h-12 border-2 ${aspectRatio === "1:1" ? 'border-ink shadow-hard -translate-y-0.5' : 'border-border'}`}
                      onClick={() => setAspectRatio("1:1")}
                    >
                      Quadrado (Feed)
                    </Button>
                    <Button 
                      variant={aspectRatio === "9:16" ? "default" : "outline"} 
                      className={`h-12 border-2 ${aspectRatio === "9:16" ? 'border-ink shadow-hard -translate-y-0.5' : 'border-border'}`}
                      onClick={() => setAspectRatio("9:16")}
                    >
                      Vertical (Stories)
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold font-display text-lg flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Paleta de Cor
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: "primary", bg: "bg-primary text-white" },
                      { id: "yellow", bg: "bg-directory-yellow text-ink" },
                      { id: "charcoal", bg: "bg-charcoal text-white" },
                      { id: "default", bg: "bg-paper text-ink" }
                    ].map((color) => (
                      <button 
                        key={color.id} 
                        className={`h-12 rounded-md font-bold uppercase tracking-widest text-xs border-2 transition-all ${color.bg} ${colorScheme === color.id ? 'border-ink shadow-hard -translate-y-0.5 scale-105' : 'border-transparent opacity-70 hover:opacity-100'}`}
                        onClick={() => setColorScheme(color.id as any)}
                      >
                        {color.id}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>

            {/* Preview Area */}
            <div className="flex-1 flex items-center justify-center bg-[url('/checkers.svg')] bg-repeat bg-[length:24px_24px] bg-muted/10 rounded-lg border-2 border-border overflow-hidden p-8 shadow-inner relative">
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                <span className="font-display font-black text-[20vw] tracking-tighter leading-none">PREVIEW</span>
              </div>
              
              {entity ? (
                <div className="relative z-10 drop-shadow-2xl transition-all duration-300 hover:scale-[1.02]">
                  <PresentationRenderer 
                    entity={entity} 
                    preset={preset} 
                    aspectRatio={aspectRatio} 
                    colorScheme={colorScheme}
                  />
                </div>
              ) : (
                <div className="animate-pulse">Carregando preview...</div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
