import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Tag,
  MapPin,
  MessageCircle,
  Share2,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  AlertTriangle,
  ArrowLeft,
  Handshake,
  Loader2,
  Image as ImageIcon,
  Play,
  Maximize2,
  ExternalLink,
  Edit3,
  Truck,
  Package,
  CreditCard,
  QrCode,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CurrencyField } from "@/components/ui/currency-field";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatMoney } from "@/lib/money";
import { formatRelativeTime, formatDate } from "@/lib/datetime";
import {
  getPublicClassifiedById,
  updateClassifiedStatus,
  deleteClassified,
} from "@/services/classifieds.functions";
import { createDealProposal } from "@/services/deals.functions";
import { ContentActionsMenu } from "@/components/common/content-actions-menu";

export const Route = createFileRoute("/_store/classificados/$id")({
  head: ({
    loaderData,
  }: {
    loaderData?: { classified: any; isOwner: boolean; canManage: boolean; viewerContext: string };
  }) => {
    const classified = loaderData?.classified;
    const cover = classified?.images?.[0] || "";
    return {
      meta: [
        {
          title: classified?.title
            ? `${classified.title} | Classificados JAH`
            : "Classificado | JAH",
        },
        {
          name: "description",
          content: classified?.content?.slice(0, 160) || "Anúncio comunitário na plataforma JAH.",
        },
        { property: "og:title", content: classified?.title || "Classificado JAH" },
        { property: "og:description", content: classified?.content?.slice(0, 160) || "" },
        { property: "og:image", content: cover },
        { property: "og:type", content: "website" },
      ],
    };
  },
  loader: async ({
    params,
  }): Promise<{ classified: any; isOwner: boolean; canManage: boolean; viewerContext: string }> => {
    const result = await getPublicClassifiedById({ data: params.id }).catch(() => null);
    return {
      classified: result?.classified || null,
      isOwner: result?.isOwner || false,
      canManage: result?.canManage || false,
      viewerContext: result?.viewerContext || "anonymous",
    };
  },
  component: ClassifiedDetailPage,
  errorComponent: ClassifiedDetailError,
});

function ClassifiedDetailError({ error }: { error: Error }) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 text-center space-y-4">
      <div className="inline-flex size-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-2">
        <Tag className="size-8 text-primary" />
      </div>
      <h1 className="text-xl font-bold text-foreground">Anúncio em Carregamento ou Indisponível</h1>
      <p className="text-xs text-muted-foreground max-w-md mx-auto">
        Não foi possível carregar os dados deste anúncio no momento. Tente novamente em instantes.
      </p>
      <div className="pt-2 flex items-center justify-center gap-3">
        <Button asChild variant="outline" className="rounded-xl text-xs">
          <Link to="/classificados">
            <ArrowLeft className="size-4 mr-1.5" />
            <span>Voltar aos Classificados</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}

const CATEGORY_LABELS: Record<string, string> = {
  sale: "Desapego / Item Geral",
  vehicle: "Veículo",
  real_estate: "Imóvel",
  service: "Serviço Profissional",
  job: "Emprego / Vaga",
  trade: "Troca",
};

const CONDITION_LABELS: Record<string, string> = {
  new: "Novo / Na Caixa",
  used: "Usado - Bom Estado",
  refurbished: "Revisado / Reformado",
};

const STATUS_LABELS: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  active: { label: "Publicado", variant: "default" },
  published: { label: "Publicado", variant: "default" },
  paused: { label: "Pausado", variant: "secondary" },
  reserved: { label: "Reservado", variant: "secondary" },
  completed: { label: "Concluído / Vendido", variant: "outline" },
  archived: { label: "Arquivado", variant: "destructive" },
};

function isVideoUrl(url?: string | null): boolean {
  if (!url) return false;
  const clean = url.split("?")[0].toLowerCase();
  return (
    clean.endsWith(".mp4") ||
    clean.endsWith(".webm") ||
    clean.endsWith(".mov") ||
    clean.includes("video")
  );
}

function ClassifiedDetailPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { classified, isOwner, canManage, viewerContext } = Route.useLoaderData();

  const [activeImage, setActiveImage] = useState(0);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  // Proposal Dialog State
  const [proposalOpen, setProposalOpen] = useState(false);
  const [proposalPriceCents, setProposalPriceCents] = useState<number | undefined>(
    classified?.price_cents || undefined,
  );
  const [proposalInstallments, setProposalInstallments] = useState("1");
  const [proposalDepositCents, setProposalDepositCents] = useState<number | undefined>(undefined);
  const [proposalTerms, setProposalTerms] = useState("");
  const [isSendingProposal, setIsSendingProposal] = useState(false);

  // Status Mutation
  const statusMutation = useMutation({
    mutationFn: updateClassifiedStatus,
    onSuccess: () => {
      queryClient.invalidateQueries();
      navigate({ reloadDocument: true });
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: deleteClassified,
    onSuccess: () => {
      queryClient.invalidateQueries();
      navigate({ to: "/conta/classificados" });
    },
  });

  const handleStatusChange = async (newStatus: string) => {
    if (!classified) return;
    await statusMutation.mutateAsync({
      data: {
        id: classified.id,
        status: newStatus as any,
      },
    });
  };

  const handleDelete = async () => {
    if (!classified) return;
    await deleteMutation.mutateAsync({ data: classified.id });
  };

  const handleSendProposal = async () => {
    if (!classified) return;
    const priceCents = proposalPriceCents ?? classified.price_cents ?? 0;

    if (!priceCents || priceCents <= 0) {
      toast.error("Informe um valor válido para a proposta.");
      return;
    }

    const depositCents = proposalDepositCents ?? 0;
    const installments = parseInt(proposalInstallments) || 1;

    setIsSendingProposal(true);
    try {
      await createDealProposal({
        data: {
          classifiedId: classified.id,
          sellerId: classified.author_profile_id,
          proposedPriceCents: priceCents,
          depositCents,
          installmentsCount: installments,
          dealType: classified.category === "real_estate" ? "rental" : "sale",
          terms: proposalTerms.trim() || undefined,
        },
      });

      toast.success("Proposta enviada ao vendedor! Acompanhe em Minhas Negociações.");
      setProposalOpen(false);
      navigate({ to: "/conta/negociacoes" });
    } catch (err: any) {
      console.error("Erro ao enviar proposta:", err);
      toast.error(err?.message || "Erro ao enviar proposta. Verifique se você está autenticado.");
    } finally {
      setIsSendingProposal(false);
    }
  };

  if (!classified) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <div className="inline-flex size-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-4">
          <Tag className="size-8" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Anúncio não encontrado</h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
          Este anúncio pode ter sido pausado, vendido ou encerrado pelo proprietário.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button asChild variant="outline" className="rounded-xl">
            <Link to="/mercado">
              <ArrowLeft className="size-4 mr-2" />
              Voltar ao Mercado
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const images: string[] =
    Array.isArray(classified.images) && classified.images.length > 0 ? classified.images : [];

  const rawPhone = classified.contact_whatsapp || classified.whatsapp;
  const cleanPhone = rawPhone ? rawPhone.replace(/\D/g, "") : null;
  const whatsappUrl = cleanPhone
    ? `https://api.whatsapp.com/send?phone=55${cleanPhone}&text=${encodeURIComponent(
        `Olá! Vi seu anúncio "${classified.title}" na JAH e tenho interesse em negociar.`,
      )}`
    : null;
  const author = classified.profiles as any;
  const authorInitial = author?.full_name?.charAt(0)?.toUpperCase() ?? "J";
  const statusInfo = STATUS_LABELS[classified.status] || {
    label: classified.status,
    variant: "outline",
  };

  return (
    <div className="w-full space-y-6">
      {/* ── Barra Superior de Navegação & Ações Perfeitas ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            to="/classificados"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors mr-1"
          >
            <ArrowLeft className="size-3.5" />
            <span>Classificados</span>
          </Link>

          <span className="text-muted-foreground/40 text-xs">/</span>

          <Badge variant="outline" className="text-xs font-semibold">
            {CATEGORY_LABELS[classified.category] || classified.category}
          </Badge>

          <Badge
            variant={statusInfo.variant}
            className="text-[10px] font-bold uppercase tracking-wider"
          >
            {statusInfo.label}
          </Badge>

          {isOwner && (
            <Badge
              variant="secondary"
              className="text-[10px] font-bold uppercase bg-primary/10 text-primary border-primary/20"
            >
              Seu Anúncio
            </Badge>
          )}
        </div>

        {/* Ações de Compartilhamento, Edição & Menu */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: classified.title,
                  text: classified.content,
                  url: window.location.href,
                }).catch(() => {});
              } else {
                navigator.clipboard.writeText(window.location.href);
                toast.success("Link do anúncio copiado!");
              }
            }}
            className="rounded-xl text-xs font-semibold h-8 gap-1.5"
          >
            <Share2 className="size-3.5 text-muted-foreground" />
            <span className="hidden sm:inline">Compartilhar</span>
          </Button>

          {isOwner && (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="rounded-xl text-xs font-semibold h-8 gap-1.5"
            >
              <Link to="/conta/classificados/novo" search={{ editId: classified.id } as any}>
                <Edit3 className="size-3.5 text-muted-foreground" />
                <span>Editar</span>
              </Link>
            </Button>
          )}

          <ContentActionsMenu
            entityType="classified"
            entityId={classified.id}
            isOwner={canManage}
            status={classified.status}
            category={classified.category}
            canonicalUrl={`/classificados/${classified.id}`}
            title={classified.title}
            description={classified.content}
            mediaUrl={images[0]}
            onStatusChange={handleStatusChange}
            onEdit={() =>
              navigate({
                to: "/conta/classificados/novo",
                search: { editId: classified.id } as any,
              })
            }
            onDelete={handleDelete}
          />
        </div>
      </div>

      {/* ── Grid Principal de Apresentação (Split-Layout Maduro) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Coluna Esquerda: Mídias & Detalhes (7 colunas) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Galeria de Mídias Dominante com Ambient Backdrop */}
          <div className="border border-border bg-card rounded-3xl overflow-hidden shadow-2xs">
            <div className="relative aspect-[16/10] bg-black/95 flex items-center justify-center overflow-hidden group">
              {/* Ambient Blurred Backdrop para mídias verticais ou formatos mistos */}
              {images.length > 0 && !isVideoUrl(images[activeImage]) && (
                <div
                  className="absolute inset-0 bg-cover bg-center blur-2xl opacity-40 scale-125 pointer-events-none transition-all duration-500"
                  style={{ backgroundImage: `url(${images[activeImage]})` }}
                />
              )}

              {images.length > 0 ? (
                isVideoUrl(images[activeImage]) ? (
                  <video
                    src={images[activeImage]}
                    controls
                    playsInline
                    className="relative z-10 size-full max-h-full max-w-full object-contain"
                  />
                ) : (
                  <img
                    src={images[activeImage]}
                    alt={`${classified.title} - Imagem ${activeImage + 1}`}
                    className="relative z-10 size-full max-h-full max-w-full object-contain select-none cursor-pointer transition-transform duration-300 group-hover:scale-[1.01]"
                    onClick={() => setFullscreenImage(images[activeImage])}
                  />
                )
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground/60">
                  <ImageIcon className="size-12 stroke-[1.5]" />
                  <span className="text-xs">Sem imagens disponíveis</span>
                </div>
              )}

              {/* Indicador Numérico de Fotos */}
              {images.length > 1 && (
                <div className="absolute top-3 right-3 z-20 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-mono font-bold tracking-wider">
                  {activeImage + 1} / {images.length}
                </div>
              )}

              {/* Botão de Expansão Fullscreen */}
              {images.length > 0 && !isVideoUrl(images[activeImage]) && (
                <button
                  type="button"
                  onClick={() => setFullscreenImage(images[activeImage])}
                  className="absolute bottom-3 right-3 z-20 p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Ver imagem cheia"
                >
                  <Maximize2 className="size-4" />
                </button>
              )}

              {/* Setas de Navegação */}
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveImage((prev) => (prev > 0 ? prev - 1 : images.length - 1))
                    }
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-20 size-9 rounded-full bg-black/50 hover:bg-black/75 text-white backdrop-blur-md flex items-center justify-center transition-all opacity-80 hover:opacity-100"
                    aria-label="Imagem anterior"
                  >
                    <ChevronLeft className="size-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveImage((prev) => (prev < images.length - 1 ? prev + 1 : 0))
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-20 size-9 rounded-full bg-black/50 hover:bg-black/75 text-white backdrop-blur-md flex items-center justify-center transition-all opacity-80 hover:opacity-100"
                    aria-label="Próxima imagem"
                  >
                    <ChevronRight className="size-5" />
                  </button>
                </>
              )}
            </div>

            {/* Carrossel de Miniaturas Alinhado e Consistente */}
            {images.length > 1 && (
              <div className="flex items-center gap-2.5 p-3.5 overflow-x-auto border-t border-border bg-muted/20 scrollbar-none">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImage(idx)}
                    className={`relative size-16 sm:size-20 aspect-square rounded-xl overflow-hidden border-2 shrink-0 transition-all bg-black/20 ${
                      activeImage === idx
                        ? "border-primary ring-2 ring-primary/20 scale-105"
                        : "border-border/60 opacity-70 hover:opacity-100 hover:border-border"
                    }`}
                  >
                    {isVideoUrl(img) ? (
                      <div className="relative size-full flex items-center justify-center bg-black/40">
                        <video
                          src={img}
                          className="size-full object-cover pointer-events-none"
                          preload="metadata"
                          muted
                        />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <div className="size-6 rounded-full bg-black/60 backdrop-blur-xs flex items-center justify-center text-white">
                            <Play className="size-3 fill-white ml-0.5" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <img
                        src={img}
                        alt={`Miniatura ${idx + 1}`}
                        className="size-full object-cover"
                      />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Descrição & Especificações */}
          <div className="border border-border bg-card rounded-3xl p-6 sm:p-7 space-y-4 shadow-2xs">
            <h2 className="text-base font-bold text-foreground border-b border-border/50 pb-2">
              Descrição do Anúncio
            </h2>
            <div className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
              {classified.content}
            </div>

            {/* Atributos Gerais */}
            <div className="border-t border-border pt-4 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-muted-foreground block mb-0.5">Condição</span>
                <span className="font-semibold text-foreground">
                  {CONDITION_LABELS[classified.condition] || "Não informada"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-0.5">Negociação</span>
                <span className="font-semibold text-foreground">
                  {classified.negotiable !== false ? "Aceita propostas" : "Valor fixo"}
                </span>
              </div>
              {classified.attributes?.modality && (
                <div>
                  <span className="text-muted-foreground block mb-0.5">Modalidade</span>
                  <span className="font-semibold text-foreground">
                    {classified.attributes.modality}
                  </span>
                </div>
              )}
            </div>

            {/* Ficha Técnica de Veículo */}
            {classified.category === "vehicle" && classified.attributes && (
              <div className="border-t border-border pt-4 space-y-3">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Ficha do Veículo
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-muted/30 p-3.5 rounded-xl border border-border">
                  {classified.attributes.brand && (
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Marca</span>
                      <span className="font-bold">{classified.attributes.brand}</span>
                    </div>
                  )}
                  {classified.attributes.model && (
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Modelo</span>
                      <span className="font-bold">{classified.attributes.model}</span>
                    </div>
                  )}
                  {classified.attributes.year_fab && (
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Ano Fab/Mod</span>
                      <span className="font-bold">
                        {classified.attributes.year_fab}/{classified.attributes.year_model || "-"}
                      </span>
                    </div>
                  )}
                  {classified.attributes.mileage_km && (
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Quilometragem</span>
                      <span className="font-bold">{classified.attributes.mileage_km} km</span>
                    </div>
                  )}
                  {classified.attributes.transmission && (
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Câmbio</span>
                      <span className="font-bold">{classified.attributes.transmission}</span>
                    </div>
                  )}
                  {classified.attributes.fuel_type && (
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Combustível</span>
                      <span className="font-bold">{classified.attributes.fuel_type}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Ficha Técnica de Imóvel & Hospedagem */}
            {classified.category === "real_estate" && (
              <div className="border-t border-border pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                    {classified.deal_type === "temporada"
                      ? "Detalhes da Hospedagem (Temporada)"
                      : "Detalhes do Imóvel"}
                  </h3>
                  <Badge variant="outline" className="text-[10px] uppercase font-mono font-bold">
                    {classified.deal_type === "temporada"
                      ? "Temporada (Airbnb)"
                      : classified.deal_type === "aluguel"
                        ? "Aluguel Mensal"
                        : "Venda"}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-muted/30 p-3.5 rounded-xl border border-border text-center">
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Área Útil</span>
                    <span className="font-bold">
                      {(classified.area_sqm || classified.attributes?.area_sqm)
                        ? `${classified.area_sqm || classified.attributes?.area_sqm} m²`
                        : "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">
                      {classified.deal_type === "temporada" ? "Hóspedes" : "Quartos"}
                    </span>
                    <span className="font-bold">
                      {classified.deal_type === "temporada"
                        ? `Até ${classified.max_guests || 2}`
                        : (classified.bedrooms ?? classified.attributes?.bedrooms ?? "-")}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Suítes / Banheiros</span>
                    <span className="font-bold">
                      {(classified.suites ?? classified.attributes?.suites) || (classified.bathrooms ?? 1)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Vagas de Garagem</span>
                    <span className="font-bold">
                      {classified.parking_spots ?? classified.attributes?.parking_spots ?? "-"}
                    </span>
                  </div>
                </div>

                {/* Comodidades & Diferenciais */}
                {((classified.amenities && classified.amenities.length > 0) || (classified.attributes?.amenities && classified.attributes.amenities.length > 0)) && (
                  <div className="space-y-2 pt-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Comodidades & Diferenciais
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {(classified.amenities || classified.attributes?.amenities || []).map((amenity: string, idx: number) => (
                        <Badge key={idx} variant="secondary" className="text-xs font-semibold px-2.5 py-1 rounded-lg">
                          ✓ {amenity}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Localização Aproximada */}
          <div className="border border-border bg-card rounded-3xl p-6 space-y-2 shadow-2xs">
            <div className="flex items-center gap-2">
              <MapPin className="size-4 text-primary" />
              <h2 className="text-sm font-bold text-foreground">Localização Aproximada</h2>
            </div>
            <p className="text-xs font-medium text-foreground">
              {classified.location_name || classified.location_text || "Região Central"}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Por segurança e privacidade, o endereço detalhado é combinado diretamente com o
              anunciante após a proposta.
            </p>
          </div>
        </div>

        {/* Coluna Direita: Informações Essenciais & Ações (5 colunas) */}
        <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-24">
          <div className="border border-border bg-card rounded-3xl p-6 sm:p-7 shadow-2xs space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Clock className="size-3.5" />
                  <span>Publicado {formatRelativeTime(classified.created_at)}</span>
                </div>
                <Badge variant="outline" className="text-[10px] font-bold">
                  {CATEGORY_LABELS[classified.category] || classified.category}
                </Badge>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-foreground leading-tight tracking-tight">
                {classified.title}
              </h1>
            </div>

            {/* Bloco de Preço */}
            <div className="border-t border-border pt-4">
              <span className="text-xs uppercase font-bold text-muted-foreground tracking-wider block mb-1">
                {classified.deal_type === "aluguel"
                  ? "Valor do Aluguel Mensal"
                  : classified.deal_type === "temporada"
                    ? "Valor por Diária (Airbnb-style)"
                    : "Valor"}
              </span>
              <div className="text-3xl font-black text-primary font-mono flex items-baseline gap-1">
                {classified.price_cents !== null && classified.price_cents !== undefined ? (
                  <>
                    <span>{formatMoney(classified.price_cents)}</span>
                    {classified.deal_type === "aluguel" && (
                      <span className="text-sm font-normal text-muted-foreground">/mês</span>
                    )}
                    {classified.deal_type === "temporada" && (
                      <span className="text-sm font-normal text-muted-foreground">/diária</span>
                    )}
                  </>
                ) : (
                  "A Combinar"
                )}
              </div>
              {classified.deal_type === "temporada" && classified.cleaning_fee_cents > 0 && (
                <span className="text-xs text-muted-foreground block mt-1 font-mono">
                  + {formatMoney(classified.cleaning_fee_cents)} taxa de limpeza única
                </span>
              )}
              {classified.price_cents && classified.attributes?.accepts_card && (classified.attributes?.max_installments || 12) > 1 && (
                <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1 mt-1">
                  <CreditCard className="size-3 text-primary" />
                  <span>
                    ou em até <strong>{classified.attributes?.max_installments || 12}x de {formatMoney(Math.round(classified.price_cents / (classified.attributes?.max_installments || 12)))}</strong>
                  </span>
                </p>
              )}

              {/* Badges de Modalidade & Pagamento */}
              <div className="flex flex-wrap gap-1.5 pt-2.5">
                {(classified.attributes?.delivery_mode === "both" || !classified.attributes?.delivery_mode) && (
                  <Badge variant="outline" className="text-[10px] font-medium gap-1 bg-muted/40">
                    <Truck className="size-3 text-primary" />
                    <span>Retirada & Entrega Local</span>
                  </Badge>
                )}
                {classified.attributes?.delivery_mode === "local_delivery" && (
                  <Badge variant="outline" className="text-[10px] font-medium gap-1 bg-muted/40">
                    <Truck className="size-3 text-primary" />
                    <span>Entrega JAH Express</span>
                  </Badge>
                )}
                {classified.attributes?.delivery_mode === "pickup" && (
                  <Badge variant="outline" className="text-[10px] font-medium gap-1 bg-muted/40">
                    <Package className="size-3 text-primary" />
                    <span>Somente Retirada</span>
                  </Badge>
                )}
                {classified.attributes?.delivery_mode === "shipping" && (
                  <Badge variant="outline" className="text-[10px] font-medium gap-1 bg-muted/40">
                    <Truck className="size-3 text-primary" />
                    <span>Envio Nacional</span>
                  </Badge>
                )}
                {classified.attributes?.accepts_pix !== false && (
                  <Badge variant="secondary" className="text-[10px] font-medium gap-1">
                    <QrCode className="size-3 text-emerald-600" />
                    <span>PIX</span>
                  </Badge>
                )}
                {classified.attributes?.accepts_trade && (
                  <Badge variant="secondary" className="text-[10px] font-medium gap-1">
                    <RefreshCw className="size-3 text-amber-600" />
                    <span>Aceita Troca</span>
                  </Badge>
                )}
              </div>

              {classified.negotiable && (
                <span className="text-xs text-muted-foreground font-medium mt-2 block">
                  ✓ Vendedor aceita propostas e negociação
                </span>
              )}
            </div>

            {/* Simulador de Frete & Logística JAH Express */}
            {(classified.attributes?.delivery_mode !== "pickup" && classified.category !== "real_estate") && (
              <div className="border border-primary/20 rounded-2xl p-4 bg-primary/5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <Truck className="size-4 text-primary" />
                    <span>Calcular Entrega no seu Endereço</span>
                  </div>
                  <Badge variant="default" className="text-[9px] font-mono bg-primary text-primary-foreground">
                    JAH Express
                  </Badge>
                </div>

                <div className="space-y-1.5 text-xs pt-1">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-background border border-border/60">
                    <div className="flex items-center gap-2">
                      <div className="size-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <Truck className="size-3.5" />
                      </div>
                      <div>
                        <p className="font-semibold text-xs text-foreground">Entrega Expressa Motoboy</p>
                        <p className="text-[10px] text-muted-foreground">Chega hoje em até 2 horas</p>
                      </div>
                    </div>
                    <span className="font-bold text-xs text-primary font-mono">
                      {classified.attributes?.free_shipping_local ? "Grátis" : "R$ 12,00"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-background border border-border/60">
                    <div className="flex items-center gap-2">
                      <div className="size-6 rounded-lg bg-muted flex items-center justify-center text-foreground">
                        <Package className="size-3.5" />
                      </div>
                      <div>
                        <p className="font-semibold text-xs text-foreground">Ponto PUDO / Locker JAH</p>
                        <p className="text-[10px] text-muted-foreground">Retire no ponto credenciado</p>
                      </div>
                    </div>
                    <span className="font-bold text-xs text-foreground font-mono">
                      R$ 5,00
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Ações de Negociação & Contato */}
            <div className="space-y-3 pt-2">
              {/* Botão Fazer Proposta (Se logado abre Modal, se anônimo convida a logar) */}
              <Dialog open={proposalOpen} onOpenChange={setProposalOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="lg"
                    className="w-full h-12 rounded-xl font-bold bg-primary text-primary-foreground shadow-xs gap-2 text-sm"
                  >
                    <Handshake className="size-5" />
                    Fazer Proposta / Negociar
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md rounded-2xl">
                  {viewerContext === "anonymous" ? (
                    <div className="text-center py-6 space-y-4">
                      <Handshake className="size-10 text-primary mx-auto" />
                      <div className="space-y-1">
                        <DialogTitle className="text-lg font-bold">
                          Identifique-se para negociar
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                          Para enviar propostas, negociar valores e trocar itens com segurança, faça
                          login na sua conta JAH.
                        </DialogDescription>
                      </div>
                      <Button
                        asChild
                        className="w-full h-11 rounded-xl font-bold bg-primary text-primary-foreground text-sm"
                      >
                        <Link
                          to="/entrar"
                          search={{ returnUrl: `/classificados/${classified.id}` }}
                        >
                          Entrar na Minha Conta
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <>
                      <DialogHeader>
                        <DialogTitle className="text-lg font-bold flex items-center gap-2">
                          <Handshake className="size-5 text-primary" />
                          Enviar Proposta de Negociação
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                          Envie uma oferta formal para o vendedor. O valor e os termos ficarão
                          registrados com segurança.
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-foreground">
                            Sua Oferta de Preço (R$) *
                          </label>
                          <CurrencyField
                            value={proposalPriceCents}
                            onChange={setProposalPriceCents}
                            placeholder="0,00"
                            className="h-10 rounded-xl text-xs bg-background"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground">
                              Forma de Pagamento
                            </label>
                            <Input
                              value={proposalInstallments}
                              onChange={(e) => setProposalInstallments(e.target.value)}
                              placeholder="1 (À vista)"
                              className="h-9 rounded-xl text-xs bg-background font-mono"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground">
                              Sinal / Entrada (R$)
                            </label>
                            <CurrencyField
                              value={proposalDepositCents}
                              onChange={setProposalDepositCents}
                              placeholder="0,00"
                              className="h-9 rounded-xl text-xs bg-background"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-foreground">
                            Termos ou Condições Especiais
                          </label>
                          <Textarea
                            value={proposalTerms}
                            onChange={(e) => setProposalTerms(e.target.value)}
                            placeholder="Ex: Retiro no sábado, pagamento via PIX..."
                            rows={3}
                            className="rounded-xl text-xs bg-background resize-none leading-relaxed"
                          />
                        </div>

                        <Button
                          onClick={handleSendProposal}
                          disabled={isSendingProposal}
                          className="w-full h-10 rounded-xl text-xs font-bold gap-2"
                        >
                          {isSendingProposal ? (
                            <>
                              <Loader2 className="size-4 animate-spin" />
                              <span>Enviando Proposta...</span>
                            </>
                          ) : (
                            <>
                              <Handshake className="size-4" />
                              <span>Confirmar e Enviar Proposta</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </>
                  )}
                </DialogContent>
              </Dialog>

              {/* Botão de WhatsApp Somente se Fornecido */}
              {whatsappUrl && (
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="w-full h-11 rounded-xl font-bold border-emerald-600/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 gap-2 text-xs"
                >
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="size-4" />
                    Conversar no WhatsApp
                  </a>
                </Button>
              )}
            </div>

            {/* Autor Real do Anúncio */}
            <div className="border-t border-border pt-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar className="size-10 rounded-xl border border-border">
                  <AvatarImage src={author?.avatar_url || ""} alt={author?.full_name || ""} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm rounded-xl">
                    {authorInitial}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground font-medium">Anunciado por</p>
                  <p className="text-sm font-bold text-foreground truncate">
                    {author?.full_name || "Membro da Comunidade"}
                  </p>
                </div>
              </div>

              {author?.id && (
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="rounded-xl text-xs font-semibold h-8"
                >
                  <Link to="/membro/$id" params={{ id: author.id }}>
                    Ver Perfil
                  </Link>
                </Button>
              )}
            </div>

            {/* Dica de Segurança */}
            <div className="border border-border/60 bg-muted/30 rounded-xl p-3.5 flex gap-3 text-xs text-muted-foreground">
              <ShieldCheck className="size-5 text-primary shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-semibold text-foreground">Negociação Segura</p>
                <p>
                  Prefira encontros em locais públicos e formalize acordos de valor via proposta na
                  JAH.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Fullscreen de Imagem */}
      {fullscreenImage && (
        <Dialog open={!!fullscreenImage} onOpenChange={() => setFullscreenImage(null)}>
          <DialogContent className="max-w-4xl p-2 bg-black border-none rounded-2xl overflow-hidden">
            <img
              src={fullscreenImage}
              alt="Visualização cheia"
              className="w-full h-auto max-h-[85vh] object-contain rounded-xl mx-auto"
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
