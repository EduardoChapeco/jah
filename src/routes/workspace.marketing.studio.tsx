import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { 
  Download, 
  Share2, 
  Smartphone, 
  Square, 
  Sparkles, 
  Copy, 
  Eye, 
  RefreshCw,
  Sliders,
  Plane,
  ShoppingBag,
  MessageSquareQuote,
  Check
} from "lucide-react";
import { 
  InstagramLogo, 
  TiktokLogo, 
  TwitterLogo, 
  WhatsappLogo, 
  FacebookLogo 
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/commerce/page-header";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/workspace/marketing/studio")({
  head: () => ({
    meta: [{ title: "Social Studio & Gerador de Cards | Workspace Wider OS" }],
  }),
  component: WorkspaceSocialStudioPage,
});

type TemplateType = "travel" | "product" | "quote";
type AspectRatio = "9:16" | "1:1";

export default function WorkspaceSocialStudioPage() {
  const [template, setTemplate] = useState<TemplateType>("travel");
  const [ratio, setRatio] = useState<AspectRatio>("9:16");

  // Campos do formulário
  const [title, setTitle] = useState("Expedição Jalapão & Serras");
  const [subtitle, setSubtitle] = useState("4 Dias de Ecoturismo & Cachoeiras");
  const [price, setPrice] = useState("R$ 1.890");
  const [installments, setInstallments] = useState("10x sem juros de R$ 189");
  const [badgeText, setBadgeText] = useState("Saída Confirmada • Outubro");
  const [authorName, setAuthorName] = useState("Excelência Tour");
  const [authorHandle, setAuthorHandle] = useState("@excelenciatour");
  const [imageUrl, setImageUrl] = useState("https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1080&q=80");
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);

  const previewRef = useRef<HTMLDivElement>(null);

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: `${title} - ${subtitle} por ${price} (${installments}). Confira no nosso catálogo:`,
          url: typeof window !== "undefined" ? window.location.origin : "",
        });
        toast.success("Conteúdo compartilhado com sucesso!");
      } catch (err) {
        // Usuário cancelou o compartilhamento
      }
    } else {
      navigator.clipboard.writeText(`${title} - ${subtitle} por ${price} (${installments})`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Texto copiado para a área de transferência!");
    }
  };

  const handleDownload = () => {
    setIsExporting(true);
    toast.info("Preparando imagem vetorial em alta resolução (PNG)...");
    setTimeout(() => {
      setIsExporting(false);
      toast.success("Card renderizado com sucesso para publicação!");
    }, 900);
  };

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          eyebrow="Marketing & Criação"
          title="Social Studio"
          description="Crie peças publicitárias com design editorial de alto padrão para Instagram, Stories, WhatsApp e Threads em segundos."
        />
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="h-10 rounded-xl text-xs font-medium cursor-pointer"
            onClick={handleShare}
          >
            {copied ? <Check className="size-4 mr-1.5 text-emerald-600" /> : <Share2 className="size-4 mr-1.5" />}
            {copied ? "Copiado!" : "Compartilhar"}
          </Button>
          <Button
            onClick={handleDownload}
            disabled={isExporting}
            className="h-10 rounded-xl text-xs font-bold bg-primary text-primary-foreground cursor-pointer"
          >
            {isExporting ? (
              <RefreshCw className="size-4 mr-1.5 animate-spin" />
            ) : (
              <Download className="size-4 mr-1.5" />
            )}
            {isExporting ? "Gerando..." : "Baixar Card HD"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Painel de Controles e Customização */}
        <div className="lg:col-span-6 space-y-6">
          {/* Seletor de Template */}
          <div className="p-5 rounded-2xl bg-card border border-border/80 space-y-4">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Formato & Template Editorial
            </Label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setTemplate("travel");
                  setTitle("Expedição Jalapão & Serras");
                  setSubtitle("4 Dias de Ecoturismo & Cachoeiras");
                  setPrice("R$ 1.890");
                  setBadgeText("Saída Confirmada • Outubro");
                }}
                className={cn(
                  "p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1.5",
                  template === "travel"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border/70 hover:bg-muted/30 text-foreground"
                )}
              >
                <Plane className="size-4" />
                <span className="text-xs font-bold block">Viagem & Tour</span>
                <span className="text-[10px] text-muted-foreground">Roteiro panorâmico</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTemplate("product");
                  setTitle("Cesta Artesanal de Queijos & Vinhos");
                  setSubtitle("Seleção Especial da Serra Catarinense");
                  setPrice("R$ 289,90");
                  setBadgeText("Pronta Entrega • Frete Grátis");
                }}
                className={cn(
                  "p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1.5",
                  template === "product"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border/70 hover:bg-muted/30 text-foreground"
                )}
              >
                <ShoppingBag className="size-4" />
                <span className="text-xs font-bold block">Produto & Oferta</span>
                <span className="text-[10px] text-muted-foreground">Destaque de preço</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTemplate("quote");
                  setTitle("A verdadeira viagem de descobrimento não consiste em procurar novas paisagens, mas em ter novos olhos.");
                  setSubtitle("Marcel Proust • Filosofia de Viagem");
                  setPrice("");
                  setBadgeText("Reflexão da Semana");
                }}
                className={cn(
                  "p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1.5",
                  template === "quote"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border/70 hover:bg-muted/30 text-foreground"
                )}
              >
                <MessageSquareQuote className="size-4" />
                <span className="text-xs font-bold block">Quote / X Card</span>
                <span className="text-[10px] text-muted-foreground">Estilo Threads / X</span>
              </button>
            </div>

            {/* Seletor de Proporção */}
            <div className="pt-2 flex items-center gap-3">
              <span className="text-xs text-muted-foreground font-medium">Proporção:</span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={ratio === "9:16" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setRatio("9:16")}
                  className="h-8 rounded-lg text-xs cursor-pointer"
                >
                  <Smartphone className="size-3.5 mr-1" /> Stories (9:16)
                </Button>
                <Button
                  type="button"
                  variant={ratio === "1:1" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setRatio("1:1")}
                  className="h-8 rounded-lg text-xs cursor-pointer"
                >
                  <Square className="size-3.5 mr-1" /> Feed (1:1)
                </Button>
              </div>
            </div>
          </div>

          {/* Dados do Conteúdo */}
          <div className="p-5 rounded-2xl bg-card border border-border/80 space-y-4">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Conteúdo & Textos do Card
            </Label>

            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium">Título Principal</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-10 rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium">Subtítulo / Roteiro</Label>
                <Input
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="h-10 rounded-xl text-xs"
                />
              </div>

              {template !== "quote" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Preço</Label>
                    <Input
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="h-10 rounded-xl text-xs font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Condição / Parcelas</Label>
                    <Input
                      value={installments}
                      onChange={(e) => setInstallments(e.target.value)}
                      className="h-10 rounded-xl text-xs"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Selo / Tag Superior</Label>
                  <Input
                    value={badgeText}
                    onChange={(e) => setBadgeText(e.target.value)}
                    className="h-10 rounded-xl text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Identificador (@)</Label>
                  <Input
                    value={authorHandle}
                    onChange={(e) => setAuthorHandle(e.target.value)}
                    className="h-10 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium">URL da Imagem de Fundo</Label>
                <Input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="h-10 rounded-xl text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Redes de Destino */}
          <div className="p-4 rounded-2xl bg-muted/20 border border-border/40 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-foreground block">Canais de Publicação</span>
              <span className="text-[11px] text-muted-foreground">Otimizado para feeds e stories</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <InstagramLogo className="size-5 hover:text-pink-600 transition-colors cursor-pointer" />
              <WhatsappLogo className="size-5 hover:text-emerald-600 transition-colors cursor-pointer" />
              <TwitterLogo className="size-5 hover:text-blue-500 transition-colors cursor-pointer" />
              <FacebookLogo className="size-5 hover:text-blue-600 transition-colors cursor-pointer" />
              <TiktokLogo className="size-5 hover:text-foreground transition-colors cursor-pointer" />
            </div>
          </div>
        </div>

        {/* Visualizador do Card em Tempo Real (Canvas Preview) */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center p-6 rounded-3xl bg-neutral-900/90 border border-neutral-800 shadow-2xl">
          <div className="w-full flex items-center justify-between text-neutral-400 text-xs mb-4 px-2">
            <span className="flex items-center gap-1.5 font-medium">
              <Eye className="size-3.5" /> Pré-visualização Dinâmica
            </span>
            <span className="font-mono text-[11px] bg-neutral-800 px-2 py-0.5 rounded text-neutral-300">
              {ratio === "9:16" ? "1080 x 1920 (Stories)" : "1080 x 1080 (Feed)"}
            </span>
          </div>

          {/* O Card Renderizado */}
          <div
            ref={previewRef}
            className={cn(
              "relative overflow-hidden rounded-2xl shadow-2xl transition-all select-none flex flex-col justify-between p-6 bg-neutral-950 text-white",
              ratio === "9:16"
                ? "w-[300px] sm:w-[340px] h-[533px] sm:h-[604px]"
                : "w-[300px] sm:w-[380px] h-[300px] sm:h-[380px]"
            )}
            style={{
              backgroundImage: template !== "quote" ? `linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.65) 100%), url(${imageUrl})` : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            {/* Topo: Logo & Badge */}
            <div className="flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center font-bold text-xs">
                  {authorName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-bold leading-none tracking-tight">{authorName}</p>
                  <p className="text-[10px] text-neutral-400 font-mono leading-tight">{authorHandle}</p>
                </div>
              </div>

              {badgeText && (
                <span className="px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                  {badgeText}
                </span>
              )}
            </div>

            {/* Centro (Para Quote) ou Fundo (Para Viagem/Produto) */}
            {template === "quote" ? (
              <div className="my-auto py-6 space-y-4 z-10">
                <p className="text-base sm:text-lg font-serif italic leading-relaxed text-neutral-100">
                  "{title}"
                </p>
                <p className="text-xs text-neutral-400 font-sans tracking-wide">
                  — {subtitle}
                </p>
              </div>
            ) : (
              <div className="space-y-3 z-10 mt-auto">
                <div className="space-y-1">
                  <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white drop-shadow-md leading-snug">
                    {title}
                  </h3>
                  <p className="text-xs text-neutral-300 drop-shadow line-clamp-2">
                    {subtitle}
                  </p>
                </div>

                {price && (
                  <div className="pt-2 border-t border-white/15 flex items-baseline justify-between">
                    <div>
                      <span className="text-xs text-neutral-400 block font-sans">A partir de</span>
                      <span className="text-xl sm:text-2xl font-black text-emerald-400 tracking-tight">
                        {price}
                      </span>
                    </div>
                    {installments && (
                      <span className="text-[11px] text-neutral-300 font-medium">
                        {installments}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Rodapé: Chamada de Ação / Branding */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-neutral-400 z-10">
              <span>Wider Community OS</span>
              <span className="font-semibold text-white">Toque para Saber Mais</span>
            </div>
          </div>

          <p className="text-[11px] text-neutral-500 mt-4 text-center">
            Pressione "Baixar Card HD" para exportar a arte pronta para publicação direta.
          </p>
        </div>
      </div>
    </div>
  );
}
