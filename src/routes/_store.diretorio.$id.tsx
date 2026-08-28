import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Compass,
  MapPin,
  Clock,
  Star,
  CheckCircle,
  WhatsappLogo,
  ShareNetwork,
  ArrowLeft,
  Phone,
  EnvelopeSimple,
  Globe,
  PaperPlaneTilt,
  CircleNotch,
  ShieldCheck,
  NavigationArrow,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  getPublicDirectoryById,
  requestDirectoryQuote,
} from "@/services/directory.functions";
import { getUserSession } from "@/services/auth.functions";
import { trackAndOpenWhatsApp } from "@/lib/whatsapp";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const CATEGORY_DEFAULT_COVERS: Record<string, string> = {
  saude: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=85",
  reformas: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=85",
  auto: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=1200&q=85",
  pet: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=1200&q=85",
  servicos: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=85",
  default: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=85",
};

export const Route = createFileRoute("/_store/diretorio/$id")({
  head: ({ loaderData }: any) => ({
    meta: [
      {
        title: loaderData?.listing
          ? `${loaderData.listing.business_name} — Perfil Institucional | Wider`
          : "Perfil Institucional — Wider",
      },
      {
        name: "description",
        content: loaderData?.listing
          ? `${loaderData.listing.description.slice(0, 160)}...`
          : "Conheça horários, especialidades, endereço e solicite atendimento.",
      },
    ],
  }),
  loader: async ({ params }) => {
    const [listing, session] = await Promise.all([
      getPublicDirectoryById({ data: { listingId: params.id } }).catch(() => null),
      getUserSession().catch(() => null),
    ]);
    return { listing, session };
  },
  component: CanonicalDirectoryDetailPage,
});

function CanonicalDirectoryDetailPage() {
  const { listing, session } = Route.useLoaderData() as any;
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const [customerName, setCustomerName] = useState(session?.user_metadata?.full_name || "");
  const [customerEmail, setCustomerEmail] = useState(session?.email || "");
  const [customerPhone, setCustomerPhone] = useState("");
  const [serviceNeeded, setServiceNeeded] = useState("");
  const [message, setMessage] = useState("");
  const [hasQuoted, setHasQuoted] = useState(false);

  const quoteMutation = useMutation({
    mutationFn: () =>
      requestDirectoryQuote({
        data: {
          listingId: listing!.id,
          customerName,
          customerEmail,
          customerPhone,
          serviceNeeded,
          message: message || undefined,
        },
      }),
    onSuccess: () => {
      setHasQuoted(true);
      toast.success("Solicitação enviada com sucesso! A empresa retornará em breve.");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Erro ao solicitar atendimento.");
    },
  });

  if (!listing) {
    return (
      <div className="w-full max-w-3xl mx-auto py-24 text-center space-y-4">
        <Compass size={48} className="text-muted-foreground/40 mx-auto" />
        <h1 className="text-xl font-bold text-foreground">Empresa ou profissional não encontrado</h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Este cadastro pode ter sido alterado ou desativado temporariamente.
        </p>
        <Button asChild className="rounded-xl font-bold">
          <Link to="/diretorio">
            <ArrowLeft size={16} weight="bold" className="mr-2" />
            Voltar para o Guia Local
          </Link>
        </Button>
      </div>
    );
  }

  const coverUrl =
    listing.banner_url ||
    CATEGORY_DEFAULT_COVERS[listing.category] ||
    CATEGORY_DEFAULT_COVERS.default;

  const handleShare = () => {
    if (typeof window !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link do perfil copiado para a área de transferência!");
    }
  };

  return (
    <div className="w-full -mx-3 sm:-mx-6 -mt-4 sm:-mt-6 pb-6 animate-in fade-in duration-200">
      {/* ── 1. CAPA 100% LARGURA (FULL BLEED COM CONTROLES FLUTUANTES) ── */}
      <div className="relative h-56 sm:h-72 md:h-80 w-full overflow-hidden bg-muted">
        <img
          src={coverUrl}
          alt={listing.business_name}
          className="size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-black/30 to-black/50" />

        {/* Botões Flutuantes no Topo da Imagem */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
          <Link
            to="/diretorio"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md text-xs font-bold transition-all border border-white/20  cursor-pointer"
          >
            <ArrowLeft size={14} weight="bold" />
            <span>Guia & Diretório</span>
          </Link>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            className="h-8 px-3 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md text-xs font-bold border border-white/20  gap-1.5 cursor-pointer"
          >
            <ShareNetwork size={14} weight="bold" />
            <span>Compartilhar</span>
          </Button>
        </div>

        {/* Badges no Canto Inferior da Foto */}
        <div className="absolute bottom-4 left-4 sm:left-8 flex items-center gap-2 z-10">
          <Badge className="bg-background/90 text-foreground backdrop-blur-md text-xs font-bold px-3 py-1 rounded-xl   uppercase font-mono">
            {listing.category}
          </Badge>
          {listing.is_verified && (
            <Badge className="bg-emerald-500 text-white backdrop-blur-md text-xs font-bold px-3 py-1 rounded-xl  flex items-center gap-1">
              <ShieldCheck size={14} weight="bold" />
              <span>Verificado Wider</span>
            </Badge>
          )}
        </div>
      </div>

      {/* ── 2. CORPO INSTITUCIONAL PADRONIZADO (CONTAINER MÁXIMO 4XL) ── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6 pt-2">
        {/* Identidade Visual & Cabeçalho do Perfil */}
        <div className="space-y-4">
          {/* Logo Limpo sem borda pesada */}
          <div className="flex items-end justify-between gap-4 -mt-12 sm:-mt-16 relative z-10">
            <div className="size-24 sm:size-28 rounded-3xl bg-card   overflow-hidden shrink-0 flex items-center justify-center">
              {listing.avatar_url ? (
                <img
                  src={listing.avatar_url}
                  alt={listing.business_name}
                  className="size-full object-cover"
                />
              ) : (
                <div className="size-full bg-primary/10 text-primary flex items-center justify-center font-black text-2xl">
                  {listing.business_name.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
          </div>

          {/* Nome da Empresa, Avaliações e Status de Atendimento */}
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground tracking-tight leading-tight">
              {listing.business_name}
            </h1>

            {/* Estrelas + Quantidade de Avaliações + Atendimento Ativo */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
              {listing.rating ? (
                <>
                  <div className="flex items-center text-amber-500 font-bold font-mono">
                    <Star size={15} weight="fill" className="mr-1" />
                    <span>{Number(listing.rating).toFixed(1)}</span>
                  </div>
                  {listing.reviews_count > 0 && (
                    <>
                      <span>•</span>
                      <span>{listing.reviews_count} avaliações</span>
                    </>
                  )}
                  <span>•</span>
                </>
              ) : null}
              <span className="text-emerald-600 font-bold flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Atendimento Ativo</span>
              </span>
            </div>

            {/* Endereço Completo & Horário de Atendimento */}
            <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-muted-foreground pt-3 ">
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <MapPin size={16} weight="bold" className="text-primary shrink-0" />
                <span>{listing.address}</span>
              </span>

              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <Clock size={16} weight="bold" className="text-primary shrink-0" />
                <span>{listing.working_hours}</span>
              </span>

              {listing.latitude && listing.longitude && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${listing.latitude},${listing.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary font-bold hover:underline flex items-center gap-1 ml-auto"
                >
                  <NavigationArrow size={14} weight="bold" />
                  <span>Como Chegar</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* ── 2.5 LOJA OFICIAL INTEGRADA (SE CONECTADA NO BANCO) ── */}
        {listing.store && (
          <div className="p-4 rounded-2xl bg-card border border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                {listing.store.name?.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-foreground">{listing.store.name}</p>
                  <span className="bg-emerald-600/90 text-white text-[9px] font-semibold px-2 py-0.5 rounded-md">
                    Loja Oficial
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Esta empresa possui loja e catálogo de produtos ativos no marketplace.
                </p>
              </div>
            </div>
            <Button asChild size="sm" className="rounded-xl font-semibold text-xs h-9 px-4 shrink-0">
              <Link to="/mercado">
                Abrir Loja & Catálogo ↗
              </Link>
            </Button>
          </div>
        )}

        {/* ── 3. BOTÕES DE AÇÃO RÁPIDA (CONVERSÃO NO TOPO) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {listing.whatsapp && (
            <Button
              type="button"
              onClick={() =>
                trackAndOpenWhatsApp({
                  phone: listing.whatsapp!,
                  storeId: (listing as any).store_id || null,
                  entityType: "directory",
                  entityId: listing.id,
                  entityTitle: listing.business_name,
                  niche: listing.category,
                  customMessage: `Olá! Vi o perfil institucional de ${listing.business_name} no Wider e gostaria de solicitar um atendimento/orçamento.`,
                })
              }
              className="h-12 rounded-2xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-2  cursor-pointer transition-all active:scale-98"
            >
              <WhatsappLogo size={20} weight="bold" />
              <span>Conversar no WhatsApp</span>
            </Button>
          )}

          <Dialog open={isQuoteOpen} onOpenChange={setIsQuoteOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="h-12 rounded-2xl font-bold text-xs gap-2 border-border/80 bg-card hover:bg-muted  cursor-pointer"
              >
                <PaperPlaneTilt size={18} weight="bold" />
                <span>Pedir Orçamento / Informações</span>
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md sm:rounded-3xl sm:p-6 p-5">
              <DialogHeader>
                <DialogTitle className="text-base font-bold">Solicitar Atendimento / Orçamento</DialogTitle>
                <DialogDescription className="text-xs">
                  Preencha os dados e a equipe de {listing.business_name} responderá em breve.
                </DialogDescription>
              </DialogHeader>

              {hasQuoted ? (
                <div className="py-6 text-center space-y-3">
                  <CheckCircle size={44} weight="fill" className="text-emerald-500 mx-auto" />
                  <h4 className="font-bold text-sm">Solicitação Enviada!</h4>
                  <p className="text-xs text-muted-foreground">
                    A empresa recebeu seu pedido e entrará em contato pelo telefone/e-mail informado.
                  </p>
                  <Button
                    size="sm"
                    onClick={() => {
                      setIsQuoteOpen(false);
                      setHasQuoted(false);
                    }}
                    className="rounded-xl font-bold text-xs mt-2"
                  >
                    Fechar
                  </Button>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    quoteMutation.mutate();
                  }}
                  className="space-y-3.5 pt-2"
                >
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Seu Nome Completo
                    </label>
                    <Input
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Ex: João da Silva"
                      required
                      className="h-10 rounded-xl text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        WhatsApp / Telefone
                      </label>
                      <Input
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="(49) 99999-9999"
                        required
                        className="h-10 rounded-xl text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        E-mail
                      </label>
                      <Input
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="seu@email.com"
                        required
                        className="h-10 rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Serviço Desejado
                    </label>
                    <Input
                      value={serviceNeeded}
                      onChange={(e) => setServiceNeeded(e.target.value)}
                      placeholder="Ex: Reforma elétrica, laudo, orçamento..."
                      required
                      className="h-10 rounded-xl text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Detalhes ou Observações
                    </label>
                    <Textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Descreva detalhes do que precisa..."
                      rows={3}
                      className="rounded-xl text-xs resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={quoteMutation.isPending}
                    className="w-full h-10 rounded-xl font-bold text-xs mt-2"
                  >
                    {quoteMutation.isPending ? (
                      <>
                        <CircleNotch size={14} className="animate-spin mr-2" />
                        Enviando...
                      </>
                    ) : (
                      "Enviar Solicitação de Orçamento"
                    )}
                  </Button>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </div>

        {/* ── 4. SEÇÕES INSTITUCIONAIS DETALHADAS ── */}
        <div className="space-y-6 pt-4">
          {/* Sobre a Empresa */}
          <section className="rounded-2xl border border-border/60 bg-card p-6 space-y-3">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Compass size={18} weight="bold" className="text-primary" />
              <span>Sobre a Empresa & Atuação</span>
            </h2>
            <div className="text-xs sm:text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
              {listing.description || "Empresa referência em prestação de serviços e atendimento qualificado na região."}
            </div>
          </section>

          {/* Especialidades & Serviços */}
          {listing.specialties && listing.specialties.length > 0 && (
            <section className="rounded-2xl border border-border/60 bg-card p-6 space-y-3">
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <CheckCircle size={18} weight="bold" className="text-primary" />
                <span>Especialidades & Serviços Prestados</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {listing.specialties.map((spec: string, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-muted/30 flex items-center gap-2.5 text-xs font-semibold text-foreground border border-border/40"
                  >
                    <CheckCircle size={15} weight="bold" className="text-emerald-500 shrink-0" />
                    <span>{spec}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Canais de Atendimento */}
          <section className="rounded-2xl border border-border/60 bg-card p-6 space-y-3">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Phone size={18} weight="bold" className="text-primary" />
              <span>Canais de Atendimento Oficial</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {listing.contact_phone && (
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/30 ">
                  <Phone size={16} weight="bold" className="text-primary shrink-0" />
                  <div>
                    <span className="text-[10px] text-muted-foreground block uppercase font-mono">Telefone / Central</span>
                    <span className="font-semibold text-foreground">{listing.contact_phone}</span>
                  </div>
                </div>
              )}
              {listing.contact_email && (
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/30 ">
                  <EnvelopeSimple size={16} weight="bold" className="text-primary shrink-0" />
                  <div>
                    <span className="text-[10px] text-muted-foreground block uppercase font-mono">E-mail Comercial</span>
                    <span className="font-semibold text-foreground">{listing.contact_email}</span>
                  </div>
                </div>
              )}
              {listing.website_url && (
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/30  sm:col-span-2">
                  <Globe size={16} weight="bold" className="text-primary shrink-0" />
                  <div>
                    <span className="text-[10px] text-muted-foreground block uppercase font-mono">Website Oficial</span>
                    <a href={listing.website_url} target="_blank" rel="noreferrer" className="font-semibold text-primary hover:underline">
                      {listing.website_url}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
