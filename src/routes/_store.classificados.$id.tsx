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
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
});

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
  const [proposalPriceReal, setProposalPriceReal] = useState("");
  const [proposalInstallments, setProposalInstallments] = useState("1");
  const [proposalDepositReal, setProposalDepositReal] = useState("");
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
    const priceCents = proposalPriceReal
      ? Math.round(parseFloat(proposalPriceReal.replace(/\D/g, "")) || 0)
      : classified.price_cents || 0;

    if (!priceCents || priceCents <= 0) {
      toast.error("Informe um valor válido para a proposta.");
      return;
    }

    const depositCents = proposalDepositReal
      ? Math.round(parseFloat(proposalDepositReal.replace(/\D/g, "")) || 0)
      : 0;

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
      {/* ── Barra Superior Natural: Sem Breadcrumbs Administrativos ── */}
      <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
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

        {/* Menu de Ações de Três Pontos Canônico */}
        <div className="flex items-center gap-2">
          {isOwner && (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="rounded-xl text-xs font-semibold h-8 gap-1.5 hidden sm:inline-flex"
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
          {/* Galeria de Mídias Dominante */}
          <div className="border border-border bg-card rounded-2xl overflow-hidden shadow-2xs">
            <div className="relative aspect-4/3 sm:aspect-16/10 bg-muted/30 flex items-center justify-center overflow-hidden group">
              {images.length > 0 ? (
                isVideoUrl(images[activeImage]) ? (
                  <video
                    src={images[activeImage]}
                    controls
                    className="w-full h-full object-contain bg-black"
                  />
                ) : (
                  <img
                    src={images[activeImage]}
                    alt={`${classified.title} - Imagem ${activeImage + 1}`}
                    className="w-full h-full object-cover select-none cursor-pointer transition-transform duration-300 group-hover:scale-[1.01]"
                    onClick={() => setFullscreenImage(images[activeImage])}
                  />
                )
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground/60">
                  <ImageIcon className="size-12 stroke-[1.5]" />
                  <span className="text-xs">Sem imagens disponíveis</span>
                </div>
              )}

              {/* Botão de Expansão Fullscreen */}
              {images.length > 0 && !isVideoUrl(images[activeImage]) && (
                <button
                  type="button"
                  onClick={() => setFullscreenImage(images[activeImage])}
                  className="absolute bottom-3 right-3 p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
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
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm transition-opacity"
                    aria-label="Imagem anterior"
                  >
                    <ChevronLeft className="size-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveImage((prev) => (prev < images.length - 1 ? prev + 1 : 0))
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm transition-opacity"
                    aria-label="Próxima imagem"
                  >
                    <ChevronRight className="size-5" />
                  </button>
                </>
              )}
            </div>

            {/* Carrossel de Miniaturas */}
            {images.length > 1 && (
              <div className="flex items-center gap-2 p-3 overflow-x-auto border-t border-border bg-muted/20 scrollbar-none">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImage(idx)}
                    className={`relative size-16 sm:size-20 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                      activeImage === idx
                        ? "border-primary ring-2 ring-primary/20 scale-105"
                        : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    {isVideoUrl(img) ? (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <Play className="size-5 text-primary" />
                      </div>
                    ) : (
                      <img
                        src={img}
                        alt={`Miniatura ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Descrição & Especificações */}
          <div className="border border-border bg-card rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-bold text-foreground">Descrição do Anúncio</h2>
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

            {/* Ficha Técnica de Imóvel */}
            {classified.category === "real_estate" && classified.attributes && (
              <div className="border-t border-border pt-4 space-y-3">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Detalhes do Imóvel
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-muted/30 p-3.5 rounded-xl border border-border text-center">
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Área Útil</span>
                    <span className="font-bold">
                      {classified.attributes.area_sqm
                        ? `${classified.attributes.area_sqm} m²`
                        : "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Quartos</span>
                    <span className="font-bold">{classified.attributes.bedrooms || "-"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Suítes</span>
                    <span className="font-bold">{classified.attributes.suites || "-"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Vagas</span>
                    <span className="font-bold">{classified.attributes.parking_spots || "-"}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Localização Aproximada */}
          <div className="border border-border bg-card rounded-2xl p-6 space-y-2">
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
          <div className="border border-border bg-card rounded-2xl p-6 shadow-2xs space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="size-3.5" />
                <span>Publicado {formatRelativeTime(classified.created_at)}</span>
              </div>

              <h1 className="text-xl sm:text-2xl font-bold text-foreground leading-tight">
                {classified.title}
              </h1>
            </div>

            {/* Bloco de Preço */}
            <div className="border-t border-border pt-4">
              <span className="text-xs uppercase font-bold text-muted-foreground tracking-wider block mb-1">
                Valor
              </span>
              <div className="text-3xl font-black text-primary font-mono">
                {classified.price_cents !== null && classified.price_cents !== undefined
                  ? formatMoney(classified.price_cents)
                  : "A Combinar"}
              </div>
              {classified.negotiable && (
                <span className="text-xs text-muted-foreground font-medium mt-1 block">
                  Aceita negociação / contraproposta
                </span>
              )}
            </div>

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
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                              R$
                            </span>
                            <Input
                              value={proposalPriceReal}
                              onChange={(e) => setProposalPriceReal(e.target.value)}
                              placeholder="0,00"
                              className="pl-9 h-10 rounded-xl text-xs bg-background font-mono font-bold"
                            />
                          </div>
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
                            <Input
                              value={proposalDepositReal}
                              onChange={(e) => setProposalDepositReal(e.target.value)}
                              placeholder="0,00"
                              className="h-9 rounded-xl text-xs bg-background font-mono"
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
