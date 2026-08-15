import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Compass,
  MapPin,
  Clock,
  Star,
  WhatsappLogo,
  ShareNetwork,
  ArrowLeft,
  CheckCircle,
  Sparkle,
  CalendarDots,
  Users,
  PaperPlaneTilt,
  CircleNotch,
  User,
  EnvelopeSimple,
  Phone,
  ChatText,
  ShieldCheck,
  AirplaneTilt,
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
import { getPublicTourismById, inquireTourismExperience, type TourismItemDTO } from "@/services/tourism.functions";
import { getUserSession } from "@/services/auth.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_store/turismo/$id")({
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData?.experience
          ? `${loaderData.experience.title} — Turismo JAH`
          : "Experiência Turística — JAH",
      },
      {
        name: "description",
        content: loaderData?.experience
          ? `${loaderData.experience.description.slice(0, 160)}...`
          : "Descubra passeios, hospedagens e roteiros turísticos no Oeste Catarinense.",
      },
    ],
  }),
  loader: async ({ params }) => {
    const [experience, session] = await Promise.all([
      getPublicTourismById({ data: { experienceId: params.id } }).catch(() => null),
      getUserSession().catch(() => null),
    ]);
    return { experience, session };
  },
  component: TourismDetailPage,
});

function TourismDetailPage() {
  const { experience, session } = Route.useLoaderData();
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);
  const [customerName, setCustomerName] = useState(session?.user_metadata?.full_name || "");
  const [customerEmail, setCustomerEmail] = useState(session?.email || "");
  const [customerPhone, setCustomerPhone] = useState("");
  const [desiredDate, setDesiredDate] = useState("");
  const [guestsCount, setGuestsCount] = useState(2);
  const [message, setMessage] = useState("");
  const [hasInquired, setHasInquired] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  const inquiryMutation = useMutation({
    mutationFn: () =>
      inquireTourismExperience({
        data: {
          experienceId: experience!.id,
          customerName,
          customerEmail,
          customerPhone,
          desiredDate: desiredDate || undefined,
          guestsCount,
          message: message || undefined,
        },
      }),
    onSuccess: () => {
      setHasInquired(true);
      toast.success("Solicitação de reserva enviada com sucesso! O anfitrião entrará em contato.");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Erro ao solicitar reserva.");
    },
  });

  if (!experience) {
    return (
      <div className="w-full max-w-3xl mx-auto py-24 text-center space-y-4">
        <Compass size={48} className="text-muted-foreground/40 mx-auto" />
        <h1 className="text-xl font-bold text-foreground">Experiência turística não encontrada</h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Este roteiro ou hospedagem pode ter sido desativado pelo anfitrião.
        </p>
        <Button asChild className="rounded-xl font-bold">
          <Link to="/turismo">
            <ArrowLeft size={16} weight="bold" className="mr-2" />
            Explorar todas as experiências
          </Link>
        </Button>
      </div>
    );
  }

  const images = experience.gallery_urls?.length > 0 ? experience.gallery_urls : [experience.image_url];
  const cleanWhatsapp = experience.contact_whatsapp?.replace(/\D/g, "") || "";
  const whatsappMessage = encodeURIComponent(
    `Olá! Vi a experiência *${experience.title}* no JAH Turismo e gostaria de informações sobre disponibilidade e reservas.`,
  );
  const whatsappUrl = cleanWhatsapp ? `https://wa.me/55${cleanWhatsapp}?text=${whatsappMessage}` : null;

  const handleShare = () => {
    if (typeof window !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link do passeio copiado para a área de transferência!");
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 pb-24">
      {/* ── 1. Top Navigation & Breadcrumb ── */}
      <div className="flex items-center justify-between pt-2">
        <Link
          to="/turismo"
          className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft size={16} weight="bold" className="group-hover:-translate-x-1 transition-transform" />
          <span>Voltar para Turismo & Lazer</span>
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

      {/* ── 2. Galeria Visual em Alta Definição ── */}
      <section className="space-y-3">
        <div className="relative aspect-[16/9] sm:aspect-[21/9] rounded-3xl overflow-hidden border border-border bg-muted">
          <img
            src={images[activeImage] || experience.image_url}
            alt={experience.title}
            className="size-full object-cover"
          />
          {experience.is_featured && (
            <div className="absolute top-4 left-4">
              <Badge variant="default" className="rounded-md font-mono text-[9px] uppercase px-2 py-0.5 shadow-md">
                Experiência em Destaque
              </Badge>
            </div>
          )}
        </div>

        {images.length > 1 && (
          <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
            {images.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveImage(idx)}
                className={`relative size-16 sm:size-20 rounded-2xl overflow-hidden border-2 transition-all shrink-0 ${
                  activeImage === idx ? "border-foreground scale-102 shadow-xs" : "border-border opacity-70 hover:opacity-100"
                }`}
              >
                <img src={img} alt={`Foto ${idx + 1}`} className="size-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </section>

      {/* ── 3. Header Principal ── */}
      <header className="rounded-3xl border border-border bg-card p-6 sm:p-8 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider font-mono text-muted-foreground">
                {experience.provider_name}
              </span>
              <span className="flex items-center gap-1 text-xs font-bold text-foreground bg-muted px-2 py-0.5 rounded-md font-mono">
                <Star size={13} weight="fill" className="text-amber-500" />
                {experience.rating.toFixed(1)}
              </span>
            </div>

            <h1 className="text-xl sm:text-3xl font-black text-foreground tracking-tight leading-tight">
              {experience.title}
            </h1>

            {experience.subtitle && (
              <p className="text-sm text-muted-foreground font-medium">
                {experience.subtitle}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs text-muted-foreground pt-1">
              <span className="flex items-center gap-1 font-semibold text-foreground">
                <MapPin size={14} weight="bold" />
                {experience.location}
              </span>
              <span className="flex items-center gap-1 font-semibold text-foreground">
                <Clock size={14} weight="bold" />
                Duração: {experience.duration}
              </span>
            </div>
          </div>

          {/* Valor */}
          <div className="sm:text-right bg-muted/40 sm:bg-transparent p-4 sm:p-0 rounded-2xl border sm:border-0 border-border">
            <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider block">
              Tarifa
            </span>
            <span className="text-xl sm:text-2xl font-black text-foreground font-mono">
              {experience.price_display}
            </span>
          </div>
        </div>
      </header>

      {/* ── 4. Conteúdo e Reserva ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <main className="lg:col-span-2 space-y-8">
          {/* Descrição & Roteiro */}
          <section className="rounded-3xl border border-border bg-card p-6 sm:p-8 space-y-4 shadow-2xs">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Compass size={18} weight="bold" />
              <span>Sobre o Roteiro & Experiência</span>
            </h2>
            <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
              {experience.description}
            </div>
          </section>

          {/* O que está incluso */}
          {experience.included_items && experience.included_items.length > 0 && (
            <section className="rounded-3xl border border-border bg-card p-6 sm:p-8 space-y-4 shadow-2xs">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <CheckCircle size={18} weight="bold" />
                <span>O que está incluso</span>
              </h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {experience.included_items.map((inc, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs font-semibold text-foreground/90 p-2.5 rounded-xl bg-muted/30 border border-border">
                    <CheckCircle size={16} weight="bold" className="text-foreground shrink-0 mt-0.5" />
                    <span>{inc}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* O que levar */}
          {experience.what_to_bring && experience.what_to_bring.length > 0 && (
            <section className="rounded-3xl border border-border bg-card p-6 sm:p-8 space-y-4 shadow-2xs">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Sparkle size={18} weight="bold" />
                <span>O que levar & Recomendações</span>
              </h2>
              <ul className="space-y-2">
                {experience.what_to_bring.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2.5 text-xs text-foreground/90">
                    <div className="size-1.5 rounded-full bg-foreground shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </main>

        {/* ── 5. Coluna de Ação & Contato ── */}
        <aside className="space-y-5">
          <div className="sticky top-20 rounded-3xl border border-border bg-card p-6 space-y-5 shadow-2xs">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-foreground">Garantir sua Reserva</h3>
              <p className="text-xs text-muted-foreground">
                Solicite datas disponíveis ou fale direto com o operador {experience.provider_name}.
              </p>
            </div>

            {/* Modal de Reserva Real */}
            <Dialog open={isInquiryOpen} onOpenChange={setIsInquiryOpen}>
              <DialogTrigger asChild>
                <Button className="w-full rounded-xl font-bold h-12 text-sm bg-foreground text-background shadow-xs gap-2">
                  <CalendarDots size={18} weight="bold" />
                  <span>Solicitar Reserva / Data</span>
                </Button>
              </DialogTrigger>

              <DialogContent className="max-w-md rounded-3xl p-6 sm:p-8">
                <DialogHeader className="space-y-2">
                  <DialogTitle className="text-lg font-black text-foreground">
                    Reservar {experience.title}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Preencha os dados abaixo para receber a confirmação de disponibilidade da data e detalhes do pagamento.
                  </DialogDescription>
                </DialogHeader>

                {hasInquired ? (
                  <div className="py-8 text-center space-y-3">
                    <div className="size-12 rounded-2xl bg-foreground text-background flex items-center justify-center mx-auto">
                      <CheckCircle size={24} weight="bold" />
                    </div>
                    <h4 className="text-sm font-bold text-foreground">Solicitação Registrada!</h4>
                    <p className="text-xs text-muted-foreground">
                      O anfitrião da experiência entrará em contato via WhatsApp com os detalhes para confirmação.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setIsInquiryOpen(false)}
                      className="rounded-xl font-bold text-xs"
                    >
                      Fechar
                    </Button>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      inquiryMutation.mutate();
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
                        placeholder="Ex: Maria Fernandes"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="rounded-xl h-10 text-xs bg-background"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <Phone size={14} weight="bold" />
                          <span>WhatsApp *</span>
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
                          <Users size={14} weight="bold" />
                          <span>Nº Pessoas</span>
                        </label>
                        <Input
                          type="number"
                          min={1}
                          max={50}
                          value={guestsCount}
                          onChange={(e) => setGuestsCount(parseInt(e.target.value) || 1)}
                          className="rounded-xl h-10 text-xs bg-background"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <CalendarDots size={14} weight="bold" />
                        <span>Data Desejada (Opcional)</span>
                      </label>
                      <Input
                        type="date"
                        value={desiredDate}
                        onChange={(e) => setDesiredDate(e.target.value)}
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
                        <ChatText size={14} weight="bold" />
                        <span>Mensagem ou Dúvidas Especiais</span>
                      </label>
                      <Textarea
                        placeholder="Ex: Gostaria de saber se aceita crianças ou animais de estimação..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="rounded-xl min-h-[80px] text-xs bg-background resize-none"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={inquiryMutation.isPending}
                      className="w-full rounded-xl font-bold h-11 text-xs bg-foreground text-background mt-2"
                    >
                      {inquiryMutation.isPending ? (
                        <>
                          <CircleNotch size={16} className="animate-spin mr-2" />
                          Registrando solicitação...
                        </>
                      ) : (
                        "Enviar Solicitação de Reserva"
                      )}
                    </Button>
                  </form>
                )}
              </DialogContent>
            </Dialog>

            {/* WhatsApp do Provedor */}
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
                <span>Experiência verificada e curada pelo ecossistema JAH.</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
