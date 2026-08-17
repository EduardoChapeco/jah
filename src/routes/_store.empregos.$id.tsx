import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Briefcase,
  MapPin,
  Clock,
  CurrencyDollar,
  Buildings,
  CheckCircle,
  Sparkle,
  WhatsappLogo,
  ShareNetwork,
  ArrowLeft,
  PaperPlaneTilt,
  CircleNotch,
  User,
  EnvelopeSimple,
  Phone,
  LinkSimple,
  ChatText,
  ShieldCheck,
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
import { getPublicJobById, applyToJob, type JobItemDTO } from "@/services/jobs.functions";
import { getUserSession } from "@/services/auth.functions";
import { formatDate } from "@/lib/datetime";
import { toast } from "sonner";

export const Route = createFileRoute("/_store/empregos/$id")({
  head: ({ loaderData }: any) => ({
    meta: [
      {
        title: loaderData?.job
          ? `${loaderData.job.title} na ${loaderData.job.company_name} — Vagas JAH`
          : "Vaga de Emprego — JAH",
      },
      {
        name: "description",
        content: loaderData?.job
          ? `${loaderData.job.description.slice(0, 160)}...`
          : "Confira todos os detalhes desta vaga de emprego e envie seu currículo.",
      },
    ],
  }),
  loader: async ({ params }) => {
    const [job, session] = await Promise.all([
      getPublicJobById({ data: { jobId: params.id } }).catch(() => null),
      getUserSession().catch(() => null),
    ]);
    return { job, session };
  },
  component: JobDetailPage,
});

function JobDetailPage() {
  const { job, session } = Route.useLoaderData() as any;
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [candidateName, setCandidateName] = useState(session?.user_metadata?.full_name || "");
  const [candidateEmail, setCandidateEmail] = useState(session?.email || "");
  const [candidatePhone, setCandidatePhone] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [hasApplied, setHasApplied] = useState(false);

  const applyMutation = useMutation({
    mutationFn: () =>
      applyToJob({
        data: {
          jobId: job!.id,
          candidateName,
          candidateEmail,
          candidatePhone,
          resumeUrl: resumeUrl || undefined,
          coverLetter: coverLetter || undefined,
        },
      }),
    onSuccess: () => {
      setHasApplied(true);
      toast.success("Candidatura enviada com sucesso! A empresa entrará em contato.");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Erro ao enviar candidatura.");
    },
  });

  if (!job) {
    return (
      <div className="w-full max-w-3xl mx-auto py-24 text-center space-y-4">
        <Briefcase size={48} className="text-muted-foreground/40 mx-auto" />
        <h1 className="text-xl font-bold text-foreground">Vaga não encontrada ou encerrada</h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Esta oportunidade de emprego pode ter sido preenchida ou pausada pelo recrutador.
        </p>
        <Button asChild className="rounded-xl font-bold">
          <Link to="/empregos">
            <ArrowLeft size={16} weight="bold" className="mr-2" />
            Ver todas as vagas disponíveis
          </Link>
        </Button>
      </div>
    );
  }

  const cleanWhatsapp = job.contact_whatsapp?.replace(/\D/g, "") || "";
  const whatsappMessage = encodeURIComponent(
    `Olá! Vi o anúncio da vaga de *${job.title}* na plataforma JAH e gostaria de mais informações.`,
  );
  const whatsappUrl = cleanWhatsapp ? `https://wa.me/55${cleanWhatsapp}?text=${whatsappMessage}` : null;

  const handleShare = () => {
    if (typeof window !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link da vaga copiado para a área de transferência!");
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 pb-24">
      {/* ── 1. Top Navigation & Breadcrumb ── */}
      <div className="flex items-center justify-between pt-2">
        <Link
          to="/empregos"
          className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft size={16} weight="bold" className="group-hover:-translate-x-1 transition-transform" />
          <span>Voltar para Vagas & Carreiras</span>
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

      {/* ── 2. Hero Header da Vaga ── */}
      <header className="rounded-3xl border border-border bg-card p-6 sm:p-8 space-y-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="size-16 sm:size-20 rounded-2xl bg-muted border border-border flex items-center justify-center text-foreground font-black text-xl shrink-0 overflow-hidden">
              {job.company_logo_url ? (
                <img
                  src={job.company_logo_url}
                  alt={job.company_name}
                  className="size-full object-cover"
                />
              ) : (
                <Buildings size={32} weight="duotone" className="text-muted-foreground" />
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider font-mono text-muted-foreground">
                  {job.company_name}
                </span>
                {job.is_featured && (
                  <Badge variant="default" className="rounded-md font-mono text-[9px] uppercase px-1.5 py-0">
                    Destaque
                  </Badge>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight leading-snug">
                {job.title}
              </h1>

              <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs text-muted-foreground pt-1">
                <span className="flex items-center gap-1">
                  <MapPin size={14} weight="bold" className="text-foreground" />
                  {job.location}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={14} weight="bold" className="text-foreground" />
                  Publicada em {formatDate(job.created_at)}
                </span>
                {job.applications_count !== undefined && job.applications_count > 0 && (
                  <span className="flex items-center gap-1 font-semibold text-foreground">
                    <User size={14} weight="bold" />
                    {job.applications_count} {job.applications_count === 1 ? "candidato" : "candidatos"}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Salário em Destaque */}
          <div className="sm:text-right bg-muted/40 sm:bg-transparent p-3 sm:p-0 rounded-2xl border sm:border-0 border-border">
            <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider block">
              Remuneração Prevista
            </span>
            <span className="text-lg sm:text-xl font-black text-foreground font-mono">
              {job.salary_display}
            </span>
          </div>
        </div>

        {/* Tags Rápidas de Contratação */}
        <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-border">
          <Badge variant="secondary" className="rounded-xl px-3 py-1 text-xs font-bold gap-1.5">
            <Briefcase size={14} weight="bold" />
            {job.contract_type}
          </Badge>
          <Badge variant="secondary" className="rounded-xl px-3 py-1 text-xs font-bold gap-1.5">
            <Buildings size={14} weight="bold" />
            Regime {job.workplace_type}
          </Badge>
          <Badge variant="outline" className="rounded-xl px-3 py-1 text-xs font-semibold text-muted-foreground">
            Área: {job.category.toUpperCase()}
          </Badge>
        </div>
      </header>

      {/* ── 3. Conteúdo Principal & Descrição Completa ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <main className="lg:col-span-2 space-y-8">
          {/* Descrição das Atividades */}
          <section className="rounded-3xl border border-border bg-card p-6 sm:p-8 space-y-4 shadow-2xs">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Briefcase size={18} weight="bold" />
              <span>Sobre a Vaga e Atribuições</span>
            </h2>
            <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
              {job.description}
            </div>
          </section>

          {/* Requisitos & Qualificações */}
          {job.requirements && job.requirements.length > 0 && (
            <section className="rounded-3xl border border-border bg-card p-6 sm:p-8 space-y-4 shadow-2xs">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <CheckCircle size={18} weight="bold" />
                <span>Requisitos & Conhecimentos</span>
              </h2>
              <ul className="space-y-2.5">
                {job.requirements.map((req: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-foreground/90">
                    <div className="size-5 rounded-lg bg-foreground text-background flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle size={13} weight="bold" />
                    </div>
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Benefícios & Vantagens */}
          {job.benefits && job.benefits.length > 0 && (
            <section className="rounded-3xl border border-border bg-card p-6 sm:p-8 space-y-4 shadow-2xs">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Sparkle size={18} weight="bold" />
                <span>Benefícios & Vantagens</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {job.benefits.map((ben: string, idx: number) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl border border-border bg-muted/30 flex items-center gap-3 text-xs font-semibold text-foreground"
                  >
                    <Sparkle size={16} weight="fill" className="text-foreground shrink-0" />
                    <span>{ben}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>

        {/* ── 4. Coluna Lateral de Ação / Candidatura ── */}
        <aside className="space-y-5">
          <div className="sticky top-20 rounded-3xl border border-border bg-card p-6 space-y-5 shadow-2xs">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-foreground">Candidate-se a esta vaga</h3>
              <p className="text-xs text-muted-foreground">
                Envie suas informações diretamente para o time de RH da {job.company_name}.
              </p>
            </div>

            {/* Modal de Candidatura Real */}
            <Dialog open={isApplyOpen} onOpenChange={setIsApplyOpen}>
              <DialogTrigger asChild>
                <Button className="w-full rounded-xl font-bold h-12 text-sm bg-foreground text-background shadow-xs gap-2">
                  <PaperPlaneTilt size={18} weight="bold" />
                  <span>Enviar Candidatura</span>
                </Button>
              </DialogTrigger>

              <DialogContent className="max-w-md rounded-3xl p-6 sm:p-8">
                <DialogHeader className="space-y-2">
                  <DialogTitle className="text-lg font-black text-foreground">
                    Candidatura para {job.title}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Preencha os dados abaixo para enviar seu perfil profissional para {job.company_name}.
                  </DialogDescription>
                </DialogHeader>

                {hasApplied ? (
                  <div className="py-8 text-center space-y-3">
                    <div className="size-12 rounded-2xl bg-foreground text-background flex items-center justify-center mx-auto">
                      <CheckCircle size={24} weight="bold" />
                    </div>
                    <h4 className="text-sm font-bold text-foreground">Candidatura Registrada!</h4>
                    <p className="text-xs text-muted-foreground">
                      Seu perfil foi enviado com sucesso. Fique atento ao seu WhatsApp e e-mail.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setIsApplyOpen(false)}
                      className="rounded-xl font-bold text-xs"
                    >
                      Fechar
                    </Button>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      applyMutation.mutate();
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
                        placeholder="Ex: João da Silva"
                        value={candidateName}
                        onChange={(e) => setCandidateName(e.target.value)}
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
                        value={candidateEmail}
                        onChange={(e) => setCandidateEmail(e.target.value)}
                        className="rounded-xl h-10 text-xs bg-background"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Phone size={14} weight="bold" />
                        <span>Telefone / WhatsApp *</span>
                      </label>
                      <Input
                        required
                        placeholder="(49) 99999-9999"
                        value={candidatePhone}
                        onChange={(e) => setCandidatePhone(e.target.value)}
                        className="rounded-xl h-10 text-xs bg-background"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <LinkSimple size={14} weight="bold" />
                        <span>Link do Currículo / LinkedIn (Opcional)</span>
                      </label>
                      <Input
                        placeholder="https://linkedin.com/in/seuperfil ou Google Drive"
                        value={resumeUrl}
                        onChange={(e) => setResumeUrl(e.target.value)}
                        className="rounded-xl h-10 text-xs bg-background"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <ChatText size={14} weight="bold" />
                        <span>Carta de Apresentação / Mensagem (Opcional)</span>
                      </label>
                      <Textarea
                        placeholder="Conte brevemente por que você se interessou por esta vaga..."
                        value={coverLetter}
                        onChange={(e) => setCoverLetter(e.target.value)}
                        className="rounded-xl min-h-[90px] text-xs bg-background resize-none"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={applyMutation.isPending}
                      className="w-full rounded-xl font-bold h-11 text-xs bg-foreground text-background mt-2"
                    >
                      {applyMutation.isPending ? (
                        <>
                          <CircleNotch size={16} className="animate-spin mr-2" />
                          Enviando candidatura...
                        </>
                      ) : (
                        "Confirmar e Enviar Currículo"
                      )}
                    </Button>
                  </form>
                )}
              </DialogContent>
            </Dialog>

            {/* Contato WhatsApp Direto */}
            {whatsappUrl && (
              <Button
                asChild
                variant="outline"
                className="w-full rounded-xl font-bold h-11 text-xs border-border gap-2"
              >
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                  <WhatsappLogo size={18} weight="bold" />
                  <span>Falar com o Recrutador</span>
                </a>
              </Button>
            )}

            <div className="pt-3 border-t border-border space-y-2 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} weight="bold" className="text-foreground shrink-0" />
                <span>Processo seletivo verificado pela comunidade JAH.</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
