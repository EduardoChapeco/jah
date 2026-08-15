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
  User,
  ChatText,
  ShieldCheck,
  Wrench,
  Buildings,
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
import { getPublicDirectoryById, requestDirectoryQuote, type DirectoryListingDTO } from "@/services/directory.functions";
import { getUserSession } from "@/services/auth.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_store/diretorio/$id")({
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData?.listing
          ? `${loaderData.listing.business_name} — Guia & Diretório JAH`
          : "Empresa / Especialista — JAH",
      },
      {
        name: "description",
        content: loaderData?.listing
          ? `${loaderData.listing.description.slice(0, 160)}...`
          : "Confira especialidades, horários, endereço e solicite orçamento.",
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
  component: DirectoryDetailPage,
});

function DirectoryDetailPage() {
  const { listing, session } = Route.useLoaderData();
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
      toast.success("Solicitação de orçamento enviada com sucesso! A empresa retornará em breve.");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Erro ao solicitar orçamento.");
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

  const cleanWhatsapp = listing.contact_whatsapp?.replace(/\D/g, "") || "";
  const whatsappMessage = encodeURIComponent(
    `Olá! Encontrei o perfil da *${listing.business_name}* no Guia JAH e gostaria de solicitar um orçamento/atendimento.`,
  );
  const whatsappUrl = cleanWhatsapp ? `https://wa.me/55${cleanWhatsapp}?text=${whatsappMessage}` : null;

  const handleShare = () => {
    if (typeof window !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link do perfil copiado para a área de transferência!");
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 pb-24">
      {/* ── 1. Top Navigation & Breadcrumb ── */}
      <div className="flex items-center justify-between pt-2">
        <Link
          to="/diretorio"
          className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft size={16} weight="bold" className="group-hover:-translate-x-1 transition-transform" />
          <span>Voltar para o Guia & Diretório</span>
        </Link>

        <Button
          variant="outline"
          size="sm"
          onClick={handleShare}
          className="rounded-xl font-semibold text-xs gap-1.5 h-9"
        >
          <ShareNetwork size={16} weight="bold" />
          <span>Compartilhar</span>
        </Button>
      </div>

      {/* ── 2. Hero Header com Banner & Avatar ── */}
      <header className="rounded-3xl border border-border bg-card overflow-hidden shadow-2xs">
        {listing.banner_url && (
          <div className="h-40 sm:h-52 w-full bg-muted overflow-hidden relative">
            <img
              src={listing.banner_url}
              alt={listing.business_name}
              className="size-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          </div>
        )}

        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="size-16 sm:size-20 rounded-2xl bg-muted border-2 border-border flex items-center justify-center font-black text-xl shrink-0 overflow-hidden shadow-xs">
                {listing.avatar_url ? (
                  <img
                    src={listing.avatar_url}
                    alt={listing.business_name}
                    className="size-full object-cover"
                  />
                ) : (
                  <Buildings size={32} weight="duotone" className="text-muted-foreground" />
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider font-mono text-muted-foreground">
                    {listing.category.toUpperCase()}
                  </span>
                  {listing.is_verified && (
                    <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                      <CheckCircle size={13} weight="fill" /> Verificado JAH
                    </span>
                  )}
                </div>

                <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight leading-snug">
                  {listing.business_name}
                </h1>

                <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs text-muted-foreground pt-1">
                  <span className="flex items-center gap-1 font-semibold text-foreground">
                    <MapPin size={14} weight="bold" />
                    {listing.address}
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-foreground">
                    <Clock size={14} weight="bold" />
                    {listing.working_hours}
                  </span>
                  <span className="flex items-center gap-1 font-bold text-foreground bg-muted px-2 py-0.5 rounded-md font-mono">
                    <Star size={13} weight="fill" className="text-amber-500" />
                    {listing.rating.toFixed(1)} ({listing.reviews_count} avaliações)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── 3. Conteúdo Principal & Coluna Lateral ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <main className="lg:col-span-2 space-y-8">
          {/* Sobre a Empresa */}
          <section className="rounded-3xl border border-border bg-card p-6 sm:p-8 space-y-4 shadow-2xs">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Compass size={18} weight="bold" />
              <span>Sobre a Empresa & Atuação</span>
            </h2>
            <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
              {listing.description}
            </div>
          </section>

          {/* Especialidades & Serviços */}
          {listing.specialties && listing.specialties.length > 0 && (
            <section className="rounded-3xl border border-border bg-card p-6 sm:p-8 space-y-4 shadow-2xs">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <CheckCircle size={18} weight="bold" />
                <span>Especialidades & Serviços Prestados</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {listing.specialties.map((spec, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl border border-border bg-muted/30 flex items-center gap-3 text-xs font-semibold text-foreground"
                  >
                    <CheckCircle size={16} weight="bold" className="text-foreground shrink-0" />
                    <span>{spec}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Contatos & Canais Oficiais */}
          <section className="rounded-3xl border border-border bg-card p-6 sm:p-8 space-y-4 shadow-2xs">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Phone size={18} weight="bold" />
              <span>Canais de Atendimento</span>
            </h2>
            <div className="space-y-3 text-xs text-foreground/90">
              {listing.contact_phone && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border">
                  <Phone size={16} weight="bold" className="text-foreground shrink-0" />
                  <div>
                    <span className="text-[10px] text-muted-foreground block uppercase font-mono">Telefone Fixo / Central</span>
                    <span className="font-semibold">{listing.contact_phone}</span>
                  </div>
                </div>
              )}
              {listing.contact_email && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border">
                  <EnvelopeSimple size={16} weight="bold" className="text-foreground shrink-0" />
                  <div>
                    <span className="text-[10px] text-muted-foreground block uppercase font-mono">E-mail Comercial</span>
                    <span className="font-semibold">{listing.contact_email}</span>
                  </div>
                </div>
              )}
              {listing.website_url && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border">
                  <Globe size={16} weight="bold" className="text-foreground shrink-0" />
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
        </main>

        {/* ── 4. Coluna Lateral de Ação / Orçamento ── */}
        <aside className="space-y-5">
          <div className="sticky top-20 rounded-3xl border border-border bg-card p-6 space-y-5 shadow-2xs">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-foreground">Solicitar Atendimento</h3>
              <p className="text-xs text-muted-foreground">
                Peça um orçamento sem compromisso para {listing.business_name}.
              </p>
            </div>

            {/* Modal de Orçamento Real */}
            <Dialog open={isQuoteOpen} onOpenChange={setIsQuoteOpen}>
              <DialogTrigger asChild>
                <Button className="w-full rounded-xl font-bold h-12 text-sm bg-foreground text-background shadow-xs gap-2">
                  <PaperPlaneTilt size={18} weight="bold" />
                  <span>Pedir Orçamento Grátis</span>
                </Button>
              </DialogTrigger>

              <DialogContent className="max-w-md rounded-3xl p-6 sm:p-8">
                <DialogHeader className="space-y-2">
                  <DialogTitle className="text-lg font-black text-foreground">
                    Orçamento — {listing.business_name}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Descreva o que você precisa para receber uma estimativa de valor e prazos.
                  </DialogDescription>
                </DialogHeader>

                {hasQuoted ? (
                  <div className="py-8 text-center space-y-3">
                    <div className="size-12 rounded-2xl bg-foreground text-background flex items-center justify-center mx-auto">
                      <CheckCircle size={24} weight="bold" />
                    </div>
                    <h4 className="text-sm font-bold text-foreground">Solicitação Enviada!</h4>
                    <p className="text-xs text-muted-foreground">
                      A equipe de atendimento da empresa recebeu sua mensagem e responderá pelo WhatsApp/e-mail informado.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setIsQuoteOpen(false)}
                      className="rounded-xl font-bold text-xs"
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
                    className="space-y-4 pt-2"
                  >
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <User size={14} weight="bold" />
                        <span>Seu Nome Completo *</span>
                      </label>
                      <Input
                        required
                        placeholder="Ex: Roberto Carlos"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="rounded-xl h-10 text-xs bg-background"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Phone size={14} weight="bold" />
                        <span>WhatsApp para Retorno *</span>
                      </label>
                      <Input
                        required
                        placeholder="(49) 99999-9999"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="rounded-xl h-10 text-xs bg-background"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <EnvelopeSimple size={14} weight="bold" />
                        <span>Seu E-mail *</span>
                      </label>
                      <Input
                        required
                        type="email"
                        placeholder="seu.email@exemplo.com"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        className="rounded-xl h-10 text-xs bg-background"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Wrench size={14} weight="bold" />
                        <span>Serviço que você precisa *</span>
                      </label>
                      <Input
                        required
                        placeholder="Ex: Manutenção preventiva, consulta, projeto..."
                        value={serviceNeeded}
                        onChange={(e) => setServiceNeeded(e.target.value)}
                        className="rounded-xl h-10 text-xs bg-background"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <ChatText size={14} weight="bold" />
                        <span>Detalhes ou Dúvidas</span>
                      </label>
                      <Textarea
                        placeholder="Descreva detalhes específicos da sua necessidade..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="rounded-xl min-h-[90px] text-xs bg-background resize-none"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={quoteMutation.isPending}
                      className="w-full rounded-xl font-bold h-11 text-xs bg-foreground text-background mt-2"
                    >
                      {quoteMutation.isPending ? (
                        <>
                          <CircleNotch size={16} className="animate-spin mr-2" />
                          Enviando solicitação...
                        </>
                      ) : (
                        "Enviar Pedido de Orçamento"
                      )}
                    </Button>
                  </form>
                )}
              </DialogContent>
            </Dialog>

            {/* WhatsApp Direto */}
            {whatsappUrl && (
              <Button
                asChild
                variant="outline"
                className="w-full rounded-xl font-bold h-11 text-xs border-border gap-2"
              >
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                  <WhatsappLogo size={18} weight="bold" />
                  <span>Conversar no WhatsApp</span>
                </a>
              </Button>
            )}

            <div className="pt-3 border-t border-border space-y-2 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} weight="bold" className="text-foreground shrink-0" />
                <span>Especialista verificado e referenciado pela comunidade JAH.</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
