import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Sparkles,
  ExternalLink,
  Smartphone,
  Laptop,
  ArrowRight,
  Plus,
  Search,
  MoreVertical,
  Copy,
  Eye,
  Trash2,
  Grid,
  List as ListIcon,
  Globe,
  Settings,
  SlidersHorizontal,
  CheckCircle2,
  Clock,
  Layers,
  Flame,
  Tag,
  Zap,
  Percent,
  Compass,
} from "lucide-react";
import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  getOrCreateStorefrontExperienceDocument,
  getOrCreateBiolinkExperienceDocument,
  getExperienceDocument,
  createExperienceDocument,
  duplicateExperienceDocument,
} from "@/services/builder.functions";
import { listAdminPages, deletePage } from "@/services/cms.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/workspace/marketing/vitrine")({
  head: () => ({ meta: [{ title: "Sites, Vitrines & Hotpages | Workspace Wider" }] }),
  loader: async () => {
    const [storefrontRes, biolinkRes, customPages] = await Promise.all([
      getOrCreateStorefrontExperienceDocument().catch(() => ({ documentId: "" })),
      getOrCreateBiolinkExperienceDocument().catch(() => ({ documentId: "" })),
      listAdminPages().catch(() => []),
    ]);

    let docData = null;
    if (storefrontRes?.documentId) {
      const fullDoc = await getExperienceDocument({ data: { id: storefrontRes.documentId } }).catch(() => null);
      docData = fullDoc?.data || null;
    }

    let biolinkDocData = null;
    if (biolinkRes?.documentId) {
      const fullBiolinkDoc = await getExperienceDocument({ data: { id: biolinkRes.documentId } }).catch(() => null);
      biolinkDocData = fullBiolinkDoc?.data || null;
    }

    return {
      documentId: storefrontRes.documentId,
      docData,
      biolinkDocumentId: biolinkRes.documentId,
      biolinkDocData,
      customPages: customPages || [],
    };
  },
  component: WorkspaceSitesHubPage,
});

interface TemplateItem {
  id: string;
  title: string;
  niche: string;
  category: "hotpage" | "turismo" | "varejo" | "food" | "servicos" | "editorial" | "imoveis";
  tagline: string;
  badge: string;
  imageUrl: string;
  features: string[];
}

const TEMPLATES_GALLERY: TemplateItem[] = [
  {
    id: "hotpage_flash_sale",
    title: "Hotpage Flash • Queima de Estoque 50% OFF",
    niche: "Ofertas Relâmpago & Campanhas",
    category: "hotpage",
    tagline: "Countdown timer regressivo, cupons de desconto automáticos e grade de produtos em promoção.",
    badge: "🔥 Hotpage",
    imageUrl: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=800&auto=format&fit=crop",
    features: ["Countdown Timer", "Filtro 50% OFF", "Cupom 1-Toque", "Banners Dinâmicos"],
  },
  {
    id: "hotpage_free_shipping",
    title: "Hotpage Regional • Frete Grátis na Sua Cidade",
    niche: "Logística & Fidelização",
    category: "hotpage",
    tagline: "Regras de entrega expressa, valor mínimo no carrinho e produtos elegíveis para entrega grátis.",
    badge: "🚚 Hotpage",
    imageUrl: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=800&auto=format&fit=crop",
    features: ["Aviso de Frete Grátis", "Regiões Atendidas", "Carrinho Integrado"],
  },
  {
    id: "tourism_excelencia",
    title: "Excelência Tour • Agência Boutique & Pacotes",
    niche: "Agências de Turismo & Viagens",
    category: "turismo",
    tagline: "Roteiros com saídas 2027/28, cotação rápida WhatsApp, captura de leads e galeria da loja física.",
    badge: "Novo • Alta Conversão",
    imageUrl: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=800&auto=format&fit=crop",
    features: ["Cotação Rápida WhatsApp", "Captura de Leads", "Galeria Loja Física", "8 Serviços de Turismo"],
  },
  {
    id: "classic_commerce",
    title: "Aura Premium • Moda & Varejo",
    niche: "Moda & Vestuário",
    category: "varejo",
    tagline: "Lookbook interativo, hero 21:9, bento grid de coleções e carrinho lateral.",
    badge: "Mais Popular",
    imageUrl: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=800&auto=format&fit=crop",
    features: ["Hero 21:9", "Bento Grid", "Lookbook", "Filtros de Grade"],
  },
  {
    id: "minimalist_fashion",
    title: "Sapore • Gastronomia & Delivery",
    niche: "Restaurantes & Cafés",
    category: "food",
    tagline: "Cardápio dinâmico com fotos apetitosas, pedidos via WhatsApp e combos.",
    badge: "Delivery 1-Toque",
    imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=800&auto=format&fit=crop",
    features: ["Cardápio 1-Click", "WhatsApp Checkout", "Combos do Chef"],
  },
  {
    id: "institutional_profile",
    title: "Monochrome • Editorial & Zine",
    niche: "Branding & Estúdios",
    category: "editorial",
    tagline: "Storytelling autêntico, manifesto de marca, timeline histórica e depoimentos.",
    badge: "Design Award",
    imageUrl: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800&auto=format&fit=crop",
    features: ["Manifesto de Marca", "Timeline Histórica", "Vídeo Hero"],
  },
  {
    id: "services_studio",
    title: "Atelier • Serviços & Bem-Estar",
    niche: "Clínicas, Salões & Spas",
    category: "servicos",
    tagline: "Agendamento integrado de horários, equipe profissional e tabela de pacotes.",
    badge: "Agendamento",
    imageUrl: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800&auto=format&fit=crop",
    features: ["Grade de Horários", "Equipe & Salas", "Pacotes Multi-Sessão"],
  },
  {
    id: "real_estate_luxury",
    title: "Habitat • Imóveis & Arquitetura",
    niche: "Imobiliárias & Corretores",
    category: "imoveis",
    tagline: "Showcase de empreendimentos de alto padrão, tour virtual e formulário de visita.",
    badge: "Premium",
    imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800&auto=format&fit=crop",
    features: ["Plantas & Vistorias", "Agendar Visita", "Filtro de Bairros"],
  },
];

function WorkspaceSitesHubPage() {
  const { documentId, docData, biolinkDocumentId, biolinkDocData, customPages } = Route.useLoaderData();
  const navigate = useNavigate();
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"sites" | "hotpages" | "templates">("sites");
  const [templateNicheFilter, setTemplateNicheFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isApplyingTemplate, setIsApplyingTemplate] = useState(false);
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
  const [isSubmittingPage, setIsSubmittingPage] = useState(false);

  const [newPageData, setNewPageData] = useState({
    title: "",
    slug: "",
    template_id: "hotpage_flash_sale",
    document_type: "campaign" as "storefront" | "biolink" | "campaign" | "seller_showcase",
  });

  const document = docData?.document;
  const nodes = docData?.nodes || [];

  const filteredTemplates = useMemo(() => {
    return TEMPLATES_GALLERY.filter((tpl) => {
      if (templateNicheFilter === "all") return true;
      return tpl.category === templateNicheFilter;
    });
  }, [templateNicheFilter]);

  const handleOpenBuilder = (docId?: string) => {
    const targetId = docId || documentId;
    if (!targetId) {
      toast.error("Documento não encontrado.");
      return;
    }
    navigate({
      to: "/workspace/builder/$documentId/editor",
      params: { documentId: targetId },
    });
  };

  const handleApplyTemplate = async (templateId: string) => {
    if (!window.confirm("Deseja abrir e editar este modelo no Construtor Visual?")) return;
    setIsApplyingTemplate(true);
    try {
      const isHotpage = templateId.startsWith("hotpage_");
      const res = await createExperienceDocument({
        data: {
          title: isHotpage ? "Nova Hotpage Promocional" : "Vitrine Personalizada",
          slug: `${isHotpage ? "ofertas" : "site"}-${Date.now().toString().slice(-4)}`,
          document_type: isHotpage ? "campaign" : "storefront",
          template_id: templateId,
        },
      });

      const targetDocId = (res as any)?.data?.document?.id || (res as any)?.documentId;
      if (targetDocId) {
        toast.success("Modelo aberto no Construtor Visual!");
        navigate({
          to: "/workspace/builder/$documentId/editor",
          params: { documentId: targetDocId },
        });
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao aplicar modelo.");
    } finally {
      setIsApplyingTemplate(false);
    }
  };

  const handleCreatePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPageData.title.trim()) {
      toast.error("Informe o nome do site, hotpage ou página.");
      return;
    }

    const cleanSlug = (newPageData.slug || newPageData.title)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    setIsSubmittingPage(true);
    try {
      const res = await createExperienceDocument({
        data: {
          title: newPageData.title.trim(),
          slug: cleanSlug,
          document_type: newPageData.document_type,
          template_id: newPageData.template_id,
        },
      });

      const targetDocId = (res as any)?.data?.document?.id || (res as any)?.documentId;
      if (targetDocId) {
        toast.success("Documento criado com sucesso no Construtor Visual!");
        setIsCreateSheetOpen(false);
        setNewPageData({
          title: "",
          slug: "",
          template_id: "hotpage_flash_sale",
          document_type: "campaign",
        });
        navigate({
          to: "/workspace/builder/$documentId/editor",
          params: { documentId: targetDocId },
        });
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar página.");
    } finally {
      setIsSubmittingPage(false);
    }
  };

  const handleDuplicatePage = async (pageId: string) => {
    try {
      await duplicateExperienceDocument({ data: { id: pageId } });
      toast.success("Página duplicada com sucesso!");
      router.invalidate();
    } catch (err: any) {
      toast.error(err.message || "Erro ao duplicar página.");
    }
  };

  const handleDeletePage = async (pageId: string) => {
    if (!window.confirm("Deseja realmente excluir este documento?")) return;
    try {
      await deletePage({ data: { id: pageId } });
      toast.success("Documento excluído.");
      router.invalidate();
    } catch (err: any) {
      toast.error(err.message || "Erro ao excluir documento.");
    }
  };

  // Separação de Hotpages vs Páginas Comuns
  const allCustomPages = customPages || [];
  const hotpagesList = allCustomPages.filter((p: any) => p.document_type === "campaign" || p.slug?.includes("oferta") || p.slug?.includes("promo") || p.slug?.includes("hotpage"));
  const landingPagesList = allCustomPages.filter((p: any) => !hotpagesList.includes(p));

  const totalSitesCount = 2 + allCustomPages.length;

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full p-4 sm:p-6 pb-28">
      {/* ── Header Canônico & Limpo ── */}
      <PageHeader
        eyebrow="Marketing & Design"
        title="Sites, Vitrines & Hotpages"
        actions={
          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-9 px-3.5 rounded-xl text-xs font-semibold gap-1.5 cursor-pointer border-border/80 hover:bg-muted"
            >
              <a href="/perfil-da-loja" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-3.5 text-muted-foreground" />
                <span>Ver Loja Online</span>
              </a>
            </Button>

            <Button
              onClick={() => {
                setNewPageData({
                  title: "",
                  slug: "",
                  template_id: "hotpage_flash_sale",
                  document_type: "campaign",
                });
                setIsCreateSheetOpen(true);
              }}
              size="sm"
              className="h-9 px-4 rounded-xl text-xs font-bold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs cursor-pointer"
            >
              <Plus className="size-4" />
              <span>Nova Hotpage / Página</span>
            </Button>
          </div>
        }
      />

      {/* ── Barra de Navegação de Abas & Controles (Padrão Wix Studio / Framer) ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-2 border-b border-border/60">
        <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border/50 self-start flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab("sites")}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
              activeTab === "sites"
                ? "bg-background text-foreground shadow-xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Todos os Sites ({totalSitesCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("hotpages")}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5",
              activeTab === "hotpages"
                ? "bg-background text-foreground shadow-xs font-bold text-amber-600 dark:text-amber-400"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Flame className="size-3.5 text-amber-500" />
            <span>Hotpages & Ofertas ({hotpagesList.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("templates")}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
              activeTab === "templates"
                ? "bg-background text-foreground shadow-xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Modelos & Templates ({TEMPLATES_GALLERY.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={activeTab === "sites" ? "Buscar por nome ou URL..." : "Buscar modelos..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8.5 h-8.5 rounded-xl text-xs bg-muted/30 border-border/60 focus-visible:ring-1 focus-visible:ring-primary"
            />
          </div>

          <div className="flex items-center border border-border/60 rounded-xl p-0.5 bg-muted/30">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode("grid")}
              className={cn("size-7.5 rounded-lg cursor-pointer", viewMode === "grid" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground")}
              title="Visualização em Grade"
            >
              <Grid className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode("list")}
              className={cn("size-7.5 rounded-lg cursor-pointer", viewMode === "list" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground")}
              title="Visualização em Lista"
            >
              <ListIcon className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* ABA 1: TODOS OS SITES, VITRINES & BIOLINKS                          */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {activeTab === "sites" && (
        <div className={cn("gap-5", viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "flex flex-col space-y-3")}>
          {/* Card 1: Criar Novo Site / Hotpage */}
          {viewMode === "grid" && (
            <div
              onClick={() => setIsCreateSheetOpen(true)}
              className="group border border-dashed border-border/80 hover:border-primary/60 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-muted/10 hover:bg-muted/30 min-h-[260px]"
            >
              <div className="size-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-105 transition-transform mb-3">
                <Plus className="size-5" />
              </div>
              <p className="text-sm font-bold text-foreground">Criar Hotpage ou Site</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                Crie páginas de ofertas, landing pages ou personalize sua vitrine.
              </p>
            </div>
          )}

          {/* Card 2: Vitrine Principal / Loja Online */}
          <div className="group rounded-2xl bg-card border border-border/70 hover:border-border transition-all overflow-hidden flex flex-col justify-between shadow-xs">
            <div className="aspect-[16/10] bg-muted/40 relative overflow-hidden border-b border-border/60">
              <img
                src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=800&auto=format&fit=crop"
                alt="Vitrine Oficial"
                className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none" />

              <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-background/90 backdrop-blur-md border border-border/60 text-[11px] font-bold text-foreground">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Vitrine Principal</span>
              </div>

              <div className="absolute inset-0 bg-black/50 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-4">
                <Button
                  onClick={() => handleOpenBuilder(documentId)}
                  size="sm"
                  className="h-9 px-4 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md cursor-pointer gap-1.5"
                >
                  <SlidersHorizontal className="size-3.5" />
                  <span>Editar no Builder</span>
                </Button>

                <Button
                  asChild
                  size="sm"
                  variant="secondary"
                  className="h-9 px-3 rounded-xl text-xs font-semibold bg-background/90 text-foreground hover:bg-background shadow-md cursor-pointer gap-1.5"
                >
                  <a href="/perfil-da-loja" target="_blank" rel="noopener noreferrer">
                    <Eye className="size-3.5" />
                    <span>Visualizar</span>
                  </a>
                </Button>
              </div>
            </div>

            <div className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1 min-w-0">
                  <h3 className="text-sm font-bold text-foreground truncate">
                    {document?.title || "Vitrine Principal da Loja"}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Globe className="size-3 text-muted-foreground shrink-0" />
                    <span className="font-mono text-[11px] truncate">wider.app/perfil-da-loja</span>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-8 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer shrink-0">
                      <MoreVertical className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 rounded-xl p-1 bg-card">
                    <DropdownMenuItem onClick={() => handleOpenBuilder(documentId)} className="rounded-lg text-xs font-medium cursor-pointer">
                      <SlidersHorizontal className="size-3.5 mr-2 text-primary" />
                      <span>Abrir no Construtor</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-lg text-xs font-medium cursor-pointer">
                      <a href="/perfil-da-loja" target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="size-3.5 mr-2" />
                        <span>Abrir Loja ao Vivo</span>
                      </a>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[11px] text-muted-foreground font-medium">
                <span className="flex items-center gap-1">
                  <Layers className="size-3" />
                  <span>{nodes.length || 12} seções ativas</span>
                </span>
                <span>Página Inicial</span>
              </div>
            </div>
          </div>

          {/* Card 3: Link da Bio & Perfil Mobile (Biolink Document) */}
          <div className="group rounded-2xl bg-card border border-sky-300/60 dark:border-sky-800/50 hover:border-sky-400 transition-all overflow-hidden flex flex-col justify-between shadow-xs">
            <div className="aspect-[16/10] bg-linear-to-b from-sky-50 via-blue-50/50 to-slate-100 dark:from-slate-950 dark:to-sky-950 relative overflow-hidden border-b border-sky-200/60 flex items-center justify-center p-3">
              <div className="w-32 h-full rounded-t-2xl bg-white dark:bg-zinc-900 border-2 border-sky-200 shadow-md p-2 flex flex-col items-center gap-1.5 group-hover:scale-105 transition-transform">
                <div className="size-6 rounded-full bg-sky-500/20 text-sky-600 flex items-center justify-center text-[10px] font-bold">
                  ★
                </div>
                <div className="h-1.5 w-16 bg-slate-200 dark:bg-zinc-800 rounded-full" />
                <div className="h-4 w-full bg-sky-600 text-white rounded-md text-[8px] font-bold flex items-center justify-center">
                  Ver Pacotes
                </div>
                <div className="h-4 w-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-md text-[8px] flex items-center justify-center">
                  Falar no WhatsApp
                </div>
              </div>

              <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-background/90 backdrop-blur-md border border-border/60 text-[11px] font-bold text-sky-700 dark:text-sky-300">
                <Smartphone className="size-3 text-sky-600" />
                <span>Link da Bio (Mobile)</span>
              </div>

              <div className="absolute inset-0 bg-black/50 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-4">
                <Button
                  onClick={() => handleOpenBuilder(biolinkDocumentId)}
                  size="sm"
                  className="h-9 px-4 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md cursor-pointer gap-1.5"
                >
                  <SlidersHorizontal className="size-3.5" />
                  <span>Editar no Builder</span>
                </Button>

                <Button
                  asChild
                  size="sm"
                  variant="secondary"
                  className="h-9 px-3 rounded-xl text-xs font-semibold bg-background/90 text-foreground hover:bg-background shadow-md cursor-pointer gap-1.5"
                >
                  <a href="/bio/loja" target="_blank" rel="noopener noreferrer">
                    <Eye className="size-3.5" />
                    <span>Visualizar</span>
                  </a>
                </Button>
              </div>
            </div>

            <div className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1 min-w-0">
                  <h3 className="text-sm font-bold text-foreground truncate">
                    Link da Bio & Perfil Oficial
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Smartphone className="size-3 text-muted-foreground shrink-0" />
                    <span className="font-mono text-[11px] truncate">wider.app/bio/loja</span>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-8 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer shrink-0">
                      <MoreVertical className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 rounded-xl p-1 bg-card">
                    <DropdownMenuItem onClick={() => handleOpenBuilder(biolinkDocumentId)} className="rounded-lg text-xs font-medium cursor-pointer">
                      <SlidersHorizontal className="size-3.5 mr-2 text-primary" />
                      <span>Abrir no Construtor</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-lg text-xs font-medium cursor-pointer">
                      <a href="/bio/loja" target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="size-3.5 mr-2" />
                        <span>Abrir Biolink ao Vivo</span>
                      </a>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[11px] text-muted-foreground font-medium">
                <span className="flex items-center gap-1 text-sky-600 font-bold">
                  <Sparkles className="size-3" />
                  <span>Design Responsivo & Leads</span>
                </span>
                <span>Mobile First</span>
              </div>
            </div>
          </div>

          {/* Demais Páginas & Hotpages Customizadas */}
          {allCustomPages.map((page: any) => (
            <div
              key={page.id}
              className="group rounded-2xl bg-card border border-border/70 hover:border-border transition-all overflow-hidden flex flex-col justify-between shadow-xs"
            >
              <div className="aspect-[16/10] bg-muted/30 relative overflow-hidden border-b border-border/60 flex items-center justify-center">
                {page.document_type === "campaign" ? (
                  <Flame className="size-10 text-amber-500/40" />
                ) : (
                  <Globe className="size-10 text-muted-foreground/30" />
                )}

                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-background/90 backdrop-blur-md border border-border/60 text-[11px] font-bold text-foreground">
                  <span className={cn("size-2 rounded-full", page.status === "published" ? "bg-emerald-500" : "bg-amber-500")} />
                  <span>{page.document_type === "campaign" ? "Hotpage" : "Landing Page"}</span>
                </div>

                <div className="absolute inset-0 bg-black/50 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-4">
                  <Button
                    onClick={() => handleOpenBuilder(page.id)}
                    size="sm"
                    className="h-9 px-4 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md cursor-pointer gap-1.5"
                  >
                    <SlidersHorizontal className="size-3.5" />
                    <span>Editar no Builder</span>
                  </Button>

                  <Button
                    asChild
                    size="sm"
                    variant="secondary"
                    className="h-9 px-3 rounded-xl text-xs font-semibold bg-background/90 text-foreground hover:bg-background shadow-md cursor-pointer gap-1.5"
                  >
                    <a href={`/paginas/${page.slug}`} target="_blank" rel="noopener noreferrer">
                      <Eye className="size-3.5" />
                      <span>Visualizar</span>
                    </a>
                  </Button>
                </div>
              </div>

              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0">
                    <h3 className="text-sm font-bold text-foreground truncate">{page.title}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Globe className="size-3 text-muted-foreground shrink-0" />
                      <span className="font-mono text-[11px] truncate">wider.app/paginas/{page.slug}</span>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer shrink-0">
                        <MoreVertical className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 rounded-xl p-1 bg-card">
                      <DropdownMenuItem onClick={() => handleOpenBuilder(page.id)} className="rounded-lg text-xs font-medium cursor-pointer">
                        <SlidersHorizontal className="size-3.5 mr-2 text-primary" />
                        <span>Abrir no Construtor</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicatePage(page.id)} className="rounded-lg text-xs font-medium cursor-pointer">
                        <Copy className="size-3.5 mr-2" />
                        <span>Duplicar Página</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleDeletePage(page.id)} className="rounded-lg text-xs font-medium text-destructive cursor-pointer">
                        <Trash2 className="size-3.5 mr-2" />
                        <span>Excluir</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[11px] text-muted-foreground font-medium">
                  <span className={cn("font-semibold", page.document_type === "campaign" ? "text-amber-600" : "text-muted-foreground")}>
                    {page.document_type === "campaign" ? "🔥 Hotpage" : "Landing Page"}
                  </span>
                  <span>{new Date(page.created_at || Date.now()).toLocaleDateString("pt-BR")}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* ABA 2: HOTPAGES & CAMPANHAS PROMOCIONAIS                              */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {activeTab === "hotpages" && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Flame className="size-5 text-amber-500" />
                <h3 className="text-sm font-bold text-foreground">O que são Hotpages?</h3>
              </div>
              <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
                Hotpages são páginas de ofertas, promoções relâmpago, regras de frete grátis ou pacotes sazonais criadas no Construtor Visual. Você pode mantê-las ativas em espera ou conectá-las aos banners da sua Vitrine Principal.
              </p>
            </div>

            <Button
              onClick={() => {
                setNewPageData({
                  title: "",
                  slug: "",
                  template_id: "hotpage_flash_sale",
                  document_type: "campaign",
                });
                setIsCreateSheetOpen(true);
              }}
              size="sm"
              className="h-9 px-4 rounded-xl text-xs font-bold gap-1.5 bg-amber-500 hover:bg-amber-600 text-white shadow-xs shrink-0 cursor-pointer"
            >
              <Plus className="size-4" />
              <span>Nova Hotpage</span>
            </Button>
          </div>

          {hotpagesList.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-border/80 rounded-2xl space-y-3">
              <Flame className="size-10 text-amber-500/60 mx-auto" />
              <h4 className="text-sm font-bold text-foreground">Nenhuma Hotpage criada ainda</h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Crie sua primeira Hotpage de promoção, oferta relâmpago ou frete grátis usando nossos modelos de alta conversão.
              </p>
              <Button
                onClick={() => {
                  setNewPageData({
                    title: "",
                    slug: "",
                    template_id: "hotpage_flash_sale",
                    document_type: "campaign",
                  });
                  setIsCreateSheetOpen(true);
                }}
                size="sm"
                className="rounded-xl text-xs font-bold"
              >
                Criar Primeira Hotpage
              </Button>
            </div>
          ) : (
            <div className={cn("gap-5", viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "flex flex-col space-y-3")}>
              {hotpagesList.map((page: any) => (
                <div
                  key={page.id}
                  className="group rounded-2xl bg-card border border-amber-300/60 dark:border-amber-800/40 hover:border-amber-400 transition-all overflow-hidden flex flex-col justify-between shadow-xs"
                >
                  <div className="aspect-[16/10] bg-amber-500/5 relative overflow-hidden border-b border-amber-200/50 flex items-center justify-center">
                    <Flame className="size-12 text-amber-500/40 group-hover:scale-110 transition-transform" />

                    <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-background/90 backdrop-blur-md border border-border/60 text-[11px] font-bold text-amber-700 dark:text-amber-400">
                      <Flame className="size-3 text-amber-500" />
                      <span>Hotpage Ativa</span>
                    </div>

                    <div className="absolute inset-0 bg-black/50 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-4">
                      <Button
                        onClick={() => handleOpenBuilder(page.id)}
                        size="sm"
                        className="h-9 px-4 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md cursor-pointer gap-1.5"
                      >
                        <SlidersHorizontal className="size-3.5" />
                        <span>Editar no Builder</span>
                      </Button>

                      <Button
                        asChild
                        size="sm"
                        variant="secondary"
                        className="h-9 px-3 rounded-xl text-xs font-semibold bg-background/90 text-foreground hover:bg-background shadow-md cursor-pointer gap-1.5"
                      >
                        <a href={`/paginas/${page.slug}`} target="_blank" rel="noopener noreferrer">
                          <Eye className="size-3.5" />
                          <span>Visualizar</span>
                        </a>
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0">
                        <h3 className="text-sm font-bold text-foreground truncate">{page.title}</h3>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Globe className="size-3 text-muted-foreground shrink-0" />
                          <span className="font-mono text-[11px] truncate">wider.app/paginas/{page.slug}</span>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer shrink-0">
                            <MoreVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 rounded-xl p-1 bg-card">
                          <DropdownMenuItem onClick={() => handleOpenBuilder(page.id)} className="rounded-lg text-xs font-medium cursor-pointer">
                            <SlidersHorizontal className="size-3.5 mr-2 text-primary" />
                            <span>Abrir no Construtor</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicatePage(page.id)} className="rounded-lg text-xs font-medium cursor-pointer">
                            <Copy className="size-3.5 mr-2" />
                            <span>Duplicar Hotpage</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDeletePage(page.id)} className="rounded-lg text-xs font-medium text-destructive cursor-pointer">
                            <Trash2 className="size-3.5 mr-2" />
                            <span>Excluir</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[11px] text-muted-foreground font-medium">
                      <span className="font-bold text-amber-600">Ofertas & Descontos</span>
                      <span>{new Date(page.created_at || Date.now()).toLocaleDateString("pt-BR")}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* ABA 3: MODELOS & TEMPLATES PROFISSIONAIS                              */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {activeTab === "templates" && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {[
              { id: "all", label: "Todos os Segmentos" },
              { id: "hotpage", label: "🔥 Hotpages & Ofertas" },
              { id: "turismo", label: "✈️ Turismo & Viagens" },
              { id: "varejo", label: "🛍️ Moda & Varejo" },
              { id: "food", label: "🍔 Gastronomia" },
              { id: "servicos", label: "✂️ Serviços & Spas" },
              { id: "imoveis", label: "🏠 Imobiliárias" },
              { id: "editorial", label: "📰 Editorial & Zine" },
            ].map((niche) => (
              <button
                key={niche.id}
                type="button"
                onClick={() => setTemplateNicheFilter(niche.id)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border",
                  templateNicheFilter === niche.id
                    ? "bg-primary text-primary-foreground border-primary font-bold shadow-xs"
                    : "bg-muted/30 text-muted-foreground border-border/60 hover:text-foreground hover:bg-muted/60"
                )}
              >
                {niche.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((tpl) => (
              <div
                key={tpl.id}
                className="group rounded-2xl bg-card border border-border/70 hover:border-border transition-all overflow-hidden flex flex-col justify-between shadow-xs"
              >
                <div className="aspect-[16/10] bg-muted/40 relative overflow-hidden border-b border-border/60">
                  <img
                    src={tpl.imageUrl}
                    alt={tpl.title}
                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />

                  <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-background/90 backdrop-blur-md border border-border/60 text-[11px] font-bold text-foreground">
                    <Sparkles className="size-3 text-amber-500" />
                    <span>{tpl.badge}</span>
                  </div>

                  <div className="absolute inset-0 bg-black/50 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
                    <Button
                      onClick={() => handleApplyTemplate(tpl.id)}
                      disabled={isApplyingTemplate}
                      size="sm"
                      className="h-9 px-4 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md cursor-pointer gap-1.5"
                    >
                      <Sparkles className="size-3.5" />
                      <span>{isApplyingTemplate ? "Abrindo..." : "Editar este Modelo"}</span>
                    </Button>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-bold text-foreground">{tpl.title}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                      {tpl.tagline}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {tpl.features.map((feat, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-muted/60 text-muted-foreground border border-border/40"
                      >
                        {feat}
                      </span>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-border/50 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-sky-700 dark:text-sky-300">{tpl.niche}</span>
                    <Button
                      onClick={() => handleApplyTemplate(tpl.id)}
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs font-bold text-primary hover:text-primary gap-1 p-0 cursor-pointer"
                    >
                      <span>Abrir Modelo</span>
                      <ArrowRight className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Sheet: Criar Novo Site, Hotpage ou Landing Page ── */}
      <Sheet open={isCreateSheetOpen} onOpenChange={setIsCreateSheetOpen}>
        <SheetContent side="right" className="sm:max-w-md p-6 flex flex-col justify-between">
          <div className="space-y-6">
            <SheetHeader>
              <SheetTitle className="text-lg font-bold">Criar Novo Site ou Hotpage</SheetTitle>
              <SheetDescription className="text-xs">
                Defina o formato da página que deseja criar no Construtor Visual.
              </SheetDescription>
            </SheetHeader>

            <form id="create-site-form" onSubmit={handleCreatePage} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="page-title" className="text-xs font-bold">Título da Página ou Campanha</Label>
                <Input
                  id="page-title"
                  placeholder="Ex: Queima de Estoque 50% OFF"
                  value={newPageData.title}
                  onChange={(e) => setNewPageData({ ...newPageData, title: e.target.value })}
                  className="h-9 rounded-xl text-xs font-bold"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="page-slug" className="text-xs font-bold">URL Amigável (Slug)</Label>
                <Input
                  id="page-slug"
                  placeholder="Ex: queima-de-estoque-50"
                  value={newPageData.slug}
                  onChange={(e) => setNewPageData({ ...newPageData, slug: e.target.value })}
                  className="h-9 rounded-xl text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Tipo de Documento</Label>
                <Select
                  value={newPageData.document_type}
                  onValueChange={(val: any) => setNewPageData({ ...newPageData, document_type: val })}
                >
                  <SelectTrigger className="h-9 rounded-xl text-xs font-semibold">
                    <SelectValue placeholder="Selecione o formato" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="campaign" className="text-xs font-bold text-amber-600">🔥 Hotpage Promocional & Oferta</SelectItem>
                    <SelectItem value="biolink" className="text-xs font-bold text-sky-600">📱 Link da Bio Mobile</SelectItem>
                    <SelectItem value="storefront" className="text-xs font-bold text-primary">🛍️ Vitrine Comercial Completa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Modelo Inicial</Label>
                <Select
                  value={newPageData.template_id}
                  onValueChange={(val: any) => setNewPageData({ ...newPageData, template_id: val })}
                >
                  <SelectTrigger className="h-9 rounded-xl text-xs">
                    <SelectValue placeholder="Selecione o modelo" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="hotpage_flash_sale" className="text-xs">🔥 Hotpage Flash Sale • 50% OFF</SelectItem>
                    <SelectItem value="hotpage_free_shipping" className="text-xs">🚚 Hotpage Frete Grátis na Região</SelectItem>
                    <SelectItem value="tourism_excelencia" className="text-xs">✈️ Excelência Tour • Agência Boutique</SelectItem>
                    <SelectItem value="classic_commerce" className="text-xs">🛍️ Aura Premium • Moda & Varejo</SelectItem>
                    <SelectItem value="minimalist_fashion" className="text-xs">🍔 Sapore • Gastronomia</SelectItem>
                    <SelectItem value="blank" className="text-xs">📄 Página em Branco (Do Zero)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </form>
          </div>

          <SheetFooter className="flex-row items-center justify-end gap-2 pt-4 border-t border-border/50">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCreateSheetOpen(false)}
              className="h-9 rounded-xl text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="create-site-form"
              size="sm"
              disabled={isSubmittingPage}
              className="h-9 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSubmittingPage ? "Criando..." : "Abrir no Construtor"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default WorkspaceSitesHubPage;
