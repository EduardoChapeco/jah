const fs = require('fs');
const path = require('path');

const rendererCode = `import * as React from "react";
import { formatMoney } from "@/lib/money";
import { Surface } from "@/components/ui/surface";

export type PresetID = "polaroid" | "lambe" | "ticket";
export type AspectRatio = "1:1" | "9:16";

export interface EntityData {
  title: string;
  description?: string | null;
  price_cents: number;
  image_url?: string | null;
  category?: string;
}

export interface PresentationRendererProps {
  entity: EntityData;
  preset: PresetID;
  aspectRatio: AspectRatio;
  colorScheme: "default" | "primary" | "yellow" | "charcoal";
}

export function PresentationRenderer({ entity, preset, aspectRatio, colorScheme }: PresentationRendererProps) {
  const containerClasses = aspectRatio === "9:16" ? "aspect-[9/16] w-full max-w-[360px]" : "aspect-square w-full max-w-[400px]";
  
  // Base colors mapping
  const colors = {
    default: "bg-paper text-ink",
    primary: "bg-primary text-primary-foreground",
    yellow: "bg-directory-yellow text-ink",
    charcoal: "bg-charcoal text-paper",
  };
  
  const bgClass = colors[colorScheme];

  if (preset === "polaroid") {
    return (
      <div className={\`\${containerClasses} p-8 flex items-center justify-center bg-muted/20 border border-border overflow-hidden relative\`}>
        <Surface variant="polaroid" elevation="hard" className={\`w-full max-w-[85%] flex flex-col gap-4 p-4 pb-12 rotate-2 \${bgClass}\`}>
          <div className="aspect-square w-full bg-muted border-2 border-ink overflow-hidden">
            {entity.image_url ? (
              <img src={entity.image_url} alt={entity.title} className="w-full h-full object-cover grayscale-[20%] contrast-125" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-display opacity-30 text-4xl">NO IMG</div>
            )}
          </div>
          <div className="text-center font-sans">
            <h3 className="font-bold text-lg leading-tight uppercase tracking-wider">{entity.title}</h3>
            <p className="font-display font-black text-2xl mt-1">{formatMoney(entity.price_cents)}</p>
          </div>
        </Surface>
      </div>
    );
  }

  if (preset === "lambe") {
    return (
      <div className={\`\${containerClasses} p-6 flex items-center justify-center bg-muted/20 border border-border overflow-hidden relative\`}>
        <Surface variant="lambe" elevation="none" className={\`w-full h-full flex flex-col justify-between p-6 border-8 border-ink \${bgClass}\`}>
          <div className="text-center mt-4">
            {entity.category && (
              <span className="font-mono text-xs uppercase tracking-widest border-y-2 border-current py-1 px-4 mb-4 inline-block">
                {entity.category}
              </span>
            )}
            <h2 className="font-display font-black text-4xl uppercase leading-[0.9] tracking-tighter mt-4 break-words">
              {entity.title}
            </h2>
          </div>
          
          {entity.image_url && (
            <div className="flex-1 my-6 min-h-0 border-4 border-current overflow-hidden relative mix-blend-luminosity opacity-90">
              <img src={entity.image_url} alt={entity.title} className="w-full h-full object-cover" />
            </div>
          )}

          <div className="text-center border-t-8 border-current pt-4">
            <p className="font-mono text-sm uppercase tracking-widest mb-1">Apenas</p>
            <p className="font-display font-black text-6xl tracking-tighter leading-none">
              {formatMoney(entity.price_cents)}
            </p>
          </div>
        </Surface>
      </div>
    );
  }

  // Default: Ticket
  return (
    <div className={\`\${containerClasses} p-8 flex items-center justify-center bg-muted/20 border border-border overflow-hidden relative\`}>
      <Surface variant="ticket" padding="lg" elevation="none" className={\`w-full max-w-[90%] flex flex-col \${bgClass}\`}>
        <div className="text-center mb-6">
          <p className="font-mono text-xs uppercase tracking-widest opacity-70 mb-2">JAH TICKET</p>
          <h2 className="font-black text-2xl uppercase font-display leading-tight">{entity.title}</h2>
        </div>
        <div className="border-y-2 border-dashed border-current py-6 my-4 flex-1 flex flex-col justify-center text-center">
          {entity.description ? (
            <p className="font-mono text-sm leading-relaxed opacity-80">{entity.description.substring(0, 100)}...</p>
          ) : (
            <div className="h-16 w-full bg-current opacity-10 repeating-linear-gradient" />
          )}
        </div>
        <div className="text-center pt-2 flex justify-between items-end">
          <span className="font-mono text-xs uppercase tracking-widest">Valor</span>
          <span className="font-display font-black text-3xl">{formatMoney(entity.price_cents)}</span>
        </div>
      </Surface>
    </div>
  );
}
`;

const estudioCode = `import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
import { getAdminProductById } from "@/services/admin-catalog.functions";

export const Route = createFileRoute("/workspace/estudio/")({
  head: () => ({ meta: [{ title: "Estúdio de Criação" }] }),
  validateSearch: (search: Record<string, unknown>) => {
    return {
      productId: search.productId as string | undefined,
    };
  },
  loader: async ({ deps: { productId } }) => {
    if (!productId) return null;
    return await getAdminProductById({ data: { id: productId } });
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
      // Fallback placeholder se nao vier do catalogo
      setEntity({
        title: "Nome do Produto",
        description: "Uma breve descrição atraente sobre o produto que você quer destacar.",
        price_cents: 9990,
        category: "Novidade"
      });
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
        icon={<Wand2 className="h-6 w-6 text-primary" />}
      >
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
      </PageHeader>

      <div className="flex-1 flex flex-col md:flex-row gap-6 p-6 min-h-0 overflow-hidden">
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
                    className={\`h-20 flex-col gap-2 border-2 \${preset === p ? 'border-ink shadow-hard -translate-y-0.5' : 'border-border'}\`}
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
                  className={\`h-12 border-2 \${aspectRatio === "1:1" ? 'border-ink shadow-hard -translate-y-0.5' : 'border-border'}\`}
                  onClick={() => setAspectRatio("1:1")}
                >
                  Quadrado (Feed)
                </Button>
                <Button 
                  variant={aspectRatio === "9:16" ? "default" : "outline"} 
                  className={\`h-12 border-2 \${aspectRatio === "9:16" ? 'border-ink shadow-hard -translate-y-0.5' : 'border-border'}\`}
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
                    className={\`h-12 rounded-md font-bold uppercase tracking-widest text-xs border-2 transition-all \${color.bg} \${colorScheme === color.id ? 'border-ink shadow-hard -translate-y-0.5 scale-105' : 'border-transparent opacity-70 hover:opacity-100'}\`}
                    onClick={() => setColorScheme(color.id as any)}
                  >
                    {color.id}
                  </button>
                ))}
              </div>
            </div>

            {!initialProduct && (
              <div className="mt-8 p-4 bg-muted/50 border-2 border-dashed border-border rounded-lg text-center">
                <ImageIcon className="mx-auto h-8 w-8 text-muted-foreground opacity-50 mb-2" />
                <p className="text-sm text-muted-foreground">Você está usando dados ilustrativos. Para gerar com dados reais, acesse o Catálogo e clique em "Criar Post".</p>
              </div>
            )}
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
      </div>
    </div>
  );
}
`;

fs.mkdirSync('src/components/commerce', { recursive: true });
fs.writeFileSync('src/components/commerce/presentation-renderer.tsx', rendererCode);
fs.writeFileSync('src/routes/workspace.estudio.index.tsx', estudioCode);
console.log('Renderer and Studio created.');
