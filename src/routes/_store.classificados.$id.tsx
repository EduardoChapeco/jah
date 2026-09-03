import { createFileRoute, Link, useNavigate, isRedirect } from "@tanstack/react-router";
import { useState, useMemo } from "react";
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
  Calendar,
  Users,
  Check,
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
import { trackAndOpenWhatsApp } from "@/lib/whatsapp";
import {
  getPublicClassifiedById,
  updateClassifiedStatus,
  deleteClassified,
} from "@/services/classifieds.functions";
import { createDealProposal } from "@/services/deals.functions";
import { ContentActionsMenu } from "@/components/common/content-actions-menu";
import {
  resolveClassifiedNiche,
  getSemanticBadges,
  getSemanticCondition,
} from "@/lib/classifieds/semantics";

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
            ? `${classified.title} | Classificados Wider`
            : "Classificado | Wider",
        },
        {
          name: "description",
          content: classified?.content?.slice(0, 160) || "Anúncio comunitário na plataforma Wider.",
        },
        { property: "og:title", content: classified?.title || "Classificado Wider" },
        { property: "og:description", content: classified?.content?.slice(0, 160) || "" },
        { property: "og:image", content: cover },
        { property: "og:type", content: "website" },
      ],
    };
  },
  loader: async ({
    params,
  }): Promise<{ classified: any; isOwner: boolean; canManage: boolean; viewerContext: string; currentProfile: any }> => {
    const [result, profileRes] = await Promise.all([
      getPublicClassifiedById({ data: params.id }).catch(() => null),
      getProfile().catch(() => null),
    ]);
    return {
      classified: result?.classified || null,
      isOwner: result?.isOwner || false,
      canManage: result?.canManage || false,
      viewerContext: result?.viewerContext || "anonymous",
      currentProfile: profileRes || null,
    };
  },
  component: ClassifiedDetailPage,
  errorComponent: ClassifiedDetailError,
});

function ClassifiedDetailError({ error }: { error: Error }) {
  if (isRedirect(error)) {
    throw error;
  }

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

      {/* Modal de Candidatura Inteligente (Padrão InfoJobs / LinkedIn) */}
      <Dialog open={applyModalOpen} onOpenChange={setApplyModalOpen}>
        <DialogContent className="max-w-xl rounded-2xl p-6 space-y-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Briefcase className="size-5 text-primary" />
              <span>Candidatura: {classified.title}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Escolha a forma que deseja se apresentar para o recrutador desta oportunidade.
            </DialogDescription>
          </DialogHeader>

          {/* Abas de Escolha de Envio */}
          <div className="flex sm:grid sm:grid-cols-3 gap-1.5 p-1 bg-muted/40 rounded-xl overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setApplyTab("perfil_wider")}
              className={`py-2 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                applyTab === "perfil_wider"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              🌟 Perfil Wider (1-Clique)
            </button>
            <button
              type="button"
              onClick={() => setApplyTab("upload_cv")}
              className={`py-2 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                applyTab === "upload_cv"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              📄 Anexar Currículo PDF
            </button>
            <button
              type="button"
              onClick={() => setApplyTab("whatsapp")}
              className={`py-2 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                applyTab === "whatsapp"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              💬 Falar no WhatsApp
            </button>
          </div>

          {/* Opção 1: Perfil Profissional Wider */}
          {applyTab === "perfil_wider" && (
            <div className="space-y-4 pt-2">
              <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar className="size-12 border-2 border-primary/30">
                    <AvatarImage src={currentProfile?.avatarUrl || ""} />
                    <AvatarFallback className="font-bold text-xs">
                      {(currentProfile?.fullName || "W")[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">
                      {currentProfile?.fullName || "Seu Perfil Profissional"}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {currentProfile?.occupation || "Profissional Cadastrado no Wider"}
                    </p>
                    <span className="text-[10px] text-primary font-medium mt-0.5 block">
                      ✓ Formação, experiências e competências serão enviadas automaticamente
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-primary/15">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Escolaridade</span>
                    <span className="font-semibold text-foreground">
                      {currentProfile?.resume_data?.educations?.[0]?.degree || "Nível Superior / Médio"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Competências</span>
                    <span className="font-semibold text-foreground">
                      {Array.isArray(currentProfile?.resume_data?.skills)
                        ? `${currentProfile.resume_data.skills.length} registradas`
                        : "Cadastradas no perfil"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">
                  Mensagem de Apresentação ao Recrutador (Opcional)
                </Label>
                <Textarea
                  value={coverNote}
                  onChange={(e) => setCoverNote(e.target.value)}
                  placeholder="Explique brevemente por que você se interessou por esta vaga..."
                  className="rounded-xl text-xs h-20 bg-background"
                />
              </div>

              <Button
                size="lg"
                disabled={isSubmittingApp}
                onClick={async () => {
                  setIsSubmittingApp(true);
                  try {
                    const resumeSnapshot = currentProfile?.resume_data || {};
                    await applyToClassifiedJob({
                      data: {
                        classified_id: classified.id,
                        candidate_name: currentProfile?.fullName || currentProfile?.full_name || "Candidato Wider",
                        candidate_email: currentProfile?.email || undefined,
                        candidate_phone: currentProfile?.phone || undefined,
                        education_level: resumeSnapshot.educations?.[0]?.degree || candidateEducation || "superior_completo",
                        experience_years: candidateExperience || "1_a_2_anos",
                        candidate_role: currentProfile?.occupation || resumeSnapshot.headline || "Profissional",
                        resume_snapshot: {
                          profile_id: currentProfile?.id,
                          fullName: currentProfile?.fullName,
                          avatarUrl: currentProfile?.avatarUrl,
                          occupation: currentProfile?.occupation,
                          city: currentProfile?.city,
                          state: currentProfile?.state,
                          headline: resumeSnapshot.headline,
                          summary: resumeSnapshot.summary,
                          experiences: resumeSnapshot.experiences,
                          educations: resumeSnapshot.educations,
                          skills: resumeSnapshot.skills,
                          certifications: resumeSnapshot.certifications,
                        },
                        cover_note: coverNote,
                      },
                    });
                    toast.success("Candidatura enviada com sucesso! O recrutador foi notificado.");
                    setApplyModalOpen(false);
                  } catch (err: any) {
                    toast.error(err.message || "Falha ao enviar candidatura.");
                  } finally {
                    setIsSubmittingApp(false);
                  }
                }}
                className="w-full rounded-xl font-bold text-xs h-11 bg-primary text-primary-foreground gap-2 cursor-pointer"
              >
                {isSubmittingApp ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                <span>Confirmar Envio do Meu Perfil Profissional</span>
              </Button>
            </div>
          )}

          {/* Opção 2: Upload de Currículo PDF */}
          {applyTab === "upload_cv" && (
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-foreground">Seu Nome Completo *</Label>
                  <Input
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    placeholder="Nome completo"
                    className="h-9 rounded-xl text-xs bg-background"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-foreground">Seu WhatsApp *</Label>
                  <Input
                    value={candidatePhone}
                    onChange={(e) => setCandidatePhone(e.target.value)}
                    placeholder="(49) 99999-9999"
                    className="h-9 rounded-xl text-xs bg-background font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-foreground">Sua Escolaridade *</Label>
                  <Select value={candidateEducation} onValueChange={setCandidateEducation}>
                    <SelectTrigger className="h-9 rounded-xl text-xs bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CANONICAL_EDUCATION_LEVELS.map((edu) => (
                        <SelectItem key={edu.value} value={edu.value}>
                          {edu.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-foreground">Tempo de Experiência *</Label>
                  <Select value={candidateExperience} onValueChange={setCandidateExperience}>
                    <SelectTrigger className="h-9 rounded-xl text-xs bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CANONICAL_EXPERIENCE_LEVELS.map((exp) => (
                        <SelectItem key={exp.value} value={exp.value}>
                          {exp.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-foreground">Link do Currículo (PDF/Drive/LinkedIn)</Label>
                <Input
                  value={cvFileUrl}
                  onChange={(e) => setCvFileUrl(e.target.value)}
                  placeholder="https://drive.google.com/... ou link direto do PDF"
                  className="h-9 rounded-xl text-xs bg-background"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-foreground">Mensagem Adicional</Label>
                <Textarea
                  value={coverNote}
                  onChange={(e) => setCoverNote(e.target.value)}
                  placeholder="Mensagem para o recrutador..."
                  className="rounded-xl text-xs h-16 bg-background"
                />
              </div>

              <Button
                size="lg"
                disabled={isSubmittingApp}
                onClick={async () => {
                  if (!candidateName.trim()) {
                    toast.error("Informe seu nome completo.");
                    return;
                  }
                  setIsSubmittingApp(true);
                  try {
                    await applyToClassifiedJob({
                      data: {
                        classified_id: classified.id,
                        candidate_name: candidateName.trim(),
                        candidate_email: candidateEmail.trim() || undefined,
                        candidate_phone: candidatePhone.trim() || undefined,
                        education_level: candidateEducation,
                        experience_years: candidateExperience,
                        candidate_role: candidateRole.trim() || undefined,
                        resume_url: cvFileUrl.trim() || undefined,
                        cover_note: coverNote,
                      },
                    });
                    toast.success("Currículo anexado e enviado com sucesso!");
                    setApplyModalOpen(false);
                  } catch (err: any) {
                    toast.error(err.message || "Falha ao enviar candidatura.");
                  } finally {
                    setIsSubmittingApp(false);
                  }
                }}
                className="w-full rounded-xl font-bold text-xs h-11 bg-primary text-primary-foreground gap-2 cursor-pointer"
              >
                {isSubmittingApp ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                <span>Enviar Currículo para Triagem</span>
              </Button>
            </div>
          )}

          {/* Opção 3: WhatsApp */}
          {applyTab === "whatsapp" && (
            <div className="space-y-4 pt-2 text-center">
              <div className="size-14 rounded-2xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center mx-auto">
                <MessageCircle className="size-7" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">Contato Direto com o Recrutador</h4>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  Você será redirecionado para o WhatsApp oficial com uma mensagem pré-formatada informando a vaga desejada.
                </p>
              </div>

              <Button
                size="lg"
                onClick={() => {
                  const targetPhone = classified.contact_whatsapp || classified.whatsapp || classified.profiles?.phone;
                  if (!targetPhone) {
                    toast.error("WhatsApp de contato não informado pelo anunciante.");
                    return;
                  }
                  const text = `Olá! Vi a oportunidade de "${classified.title}" no portal Wider e gostaria de enviar meu currículo para participar do processo seletivo.`;
                  trackAndOpenWhatsApp(targetPhone, text, {
                    classifiedId: classified.id,
                    classifiedTitle: classified.title,
                    action: "job_application_contact",
                  });
                  setApplyModalOpen(false);
                }}
                className="w-full rounded-xl font-bold text-xs h-11 bg-emerald-600 hover:bg-emerald-700 text-white gap-2 cursor-pointer"
              >
                <MessageCircle className="size-4" />
                <span>Iniciar Conversa no WhatsApp</span>
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Gestão de Candidatos para o Anunciante Proprietário */}
      <Dialog open={candidatesListOpen} onOpenChange={setCandidatesListOpen}>
        <DialogContent className="max-w-2xl rounded-2xl p-6 space-y-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Users className="size-5 text-primary" />
              <span>Candidatos Inscritos: {classified.title}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Acompanhe os talentos que se candidataram com perfil digital ou currículo anexado.
            </DialogDescription>
          </DialogHeader>

          {isLoadingCandidates ? (
            <div className="py-12 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
              <Loader2 className="size-6 animate-spin text-primary" />
              <span>Carregando candidaturas...</span>
            </div>
          ) : candidatesList.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground space-y-2">
              <Users className="size-8 mx-auto text-muted-foreground/60" />
              <p className="font-semibold text-foreground">Nenhuma candidatura recebida ainda</p>
              <p>Assim que os candidatos aplicarem, seus dados e escolaridades aparecerão aqui.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {candidatesList.map((app) => (
                <div key={app.id} className="p-3.5 rounded-xl border border-border/80 bg-card space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-foreground">{app.candidate_name}</h4>
                      <p className="text-[11px] text-muted-foreground font-mono">
                        {app.candidate_phone || app.candidate_email || "Contato cadastrado"}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-[10px] font-medium bg-primary/10 text-primary">
                      {getEducationLabel(app.education_level)}
                    </Badge>
                  </div>

                  {app.cover_note && (
                    <p className="text-xs text-foreground/80 bg-muted/30 p-2.5 rounded-lg italic">
                      "{app.cover_note}"
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground">
                    <span>Experiência: <strong>{getExperienceLabel(app.experience_years)}</strong></span>
                    {app.resume_url && (
                      <a
                        href={app.resume_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary font-bold hover:underline flex items-center gap-1"
                      >
                        <FileText className="size-3" />
                        <span>Ver Currículo Anexo</span>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

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
  const { classified, isOwner, canManage, viewerContext, currentProfile } = Route.useLoaderData();

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

  // Direct Booking State (Hospedagem / Temporada / Diárias)
  const [bookingOpen, setBookingOpen] = useState(false);
  const [checkInDate, setCheckInDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });
  const [checkOutDate, setCheckOutDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 4);
    return d.toISOString().split("T")[0];
  });
  const [bookingGuests, setBookingGuests] = useState(1);
  const [isBooking, setIsBooking] = useState(false);
  const [isBuyingDirect, setIsBuyingDirect] = useState(false);

  // Job Candidacy State (Microfase 78B — BigTech InfoJobs & LinkedIn Style)
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [applyTab, setApplyTab] = useState<"perfil_wider" | "upload_cv" | "whatsapp">("perfil_wider");
  const [coverNote, setCoverNote] = useState("");
  const [candidateName, setCandidateName] = useState(currentProfile?.fullName || currentProfile?.full_name || "");
  const [candidateEmail, setCandidateEmail] = useState(currentProfile?.email || "");
  const [candidatePhone, setCandidatePhone] = useState(currentProfile?.phone || "");
  const [candidateEducation, setCandidateEducation] = useState("superior_completo");
  const [candidateExperience, setCandidateExperience] = useState("1_a_2_anos");
  const [candidateRole, setCandidateRole] = useState(currentProfile?.occupation || "");
  const [cvFileUrl, setCvFileUrl] = useState("");
  const [isSubmittingApp, setIsSubmittingApp] = useState(false);
  const [candidatesListOpen, setCandidatesListOpen] = useState(false);
  const [candidatesList, setCandidatesList] = useState<any[]>([]);
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(false);

  const nightsCount = useMemo(() => {
    if (!checkInDate || !checkOutDate) return 1;
    const start = new Date(checkInDate).getTime();
    const end = new Date(checkOutDate).getTime();
    const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  }, [checkInDate, checkOutDate]);

  const cleaningFeeCents = classified?.cleaning_fee_cents || 0;
  const dailyRateCents = classified?.price_cents || 0;
  const bookingTotalCents = dailyRateCents * nightsCount + cleaningFeeCents;

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

  const handleDirectBooking = async () => {
    if (!classified) return;
    setIsBooking(true);
    try {
      await createDealProposal({
        data: {
          classifiedId: classified.id,
          sellerId: classified.author_profile_id,
          proposedPriceCents: bookingTotalCents,
          totalPriceCents: bookingTotalCents,
          dailyRateCents,
          cleaningFeeCents,
          nightsCount,
          guestsCount: bookingGuests,
          dealType: "rental",
          startDate: checkInDate,
          endDate: checkOutDate,
          isDirectBooking: true,
          terms: `Reserva direta de ${nightsCount} diárias (${checkInDate} a ${checkOutDate}) para ${bookingGuests} hóspede(s).`,
        },
      });

      toast.success("Reserva confirmada! Acompanhe em Minhas Negociações e na sua Agenda.");
      setBookingOpen(false);
      navigate({ to: "/conta/negociacoes" });
    } catch (err: any) {
      console.error("Erro ao reservar:", err);
      toast.error(err?.message || "Erro ao efetuar reserva.");
    } finally {
      setIsBooking(false);
    }
  };

  const handleDirectBuy = async () => {
    if (!classified) return;
    setIsBuyingDirect(true);
    try {
      await createDealProposal({
        data: {
          classifiedId: classified.id,
          sellerId: classified.author_profile_id,
          proposedPriceCents: classified.price_cents || 0,
          totalPriceCents: classified.price_cents || 0,
          dealType: classified.category === "real_estate" ? "rental" : "sale",
          isDirectBooking: true,
          terms: "Compra direta pelo valor integral anunciado.",
        },
      });

      toast.success("Compra confirmada com o vendedor! Acompanhe em Minhas Negociações.");
      navigate({ to: "/conta/negociacoes" });
    } catch (err: any) {
      console.error("Erro ao comprar direto:", err);
      toast.error(err?.message || "Erro ao processar compra.");
    } finally {
      setIsBuyingDirect(false);
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
  // whatsappUrl: removido — usamos trackAndOpenWhatsApp para rastreamento real de conversões
  const author = classified.profiles as any;
  const authorInitial = author?.full_name?.charAt(0)?.toUpperCase() ?? "J";
  const statusInfo = STATUS_LABELS[classified.status] || {
    label: classified.status,
    variant: "outline",
  };

  const niche = useMemo(() => resolveClassifiedNiche(classified), [classified]);
  const semanticBadges = useMemo(() => getSemanticBadges(classified), [classified]);
  const semanticCondition = useMemo(() => getSemanticCondition(classified), [classified]);

  return (
    <div className="w-full space-y-6">
      {/* ── Barra Superior de Navegação & Ações Perfeitas ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3  pb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            to="/classificados"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors mr-1"
          >
            <ArrowLeft className="size-3.5" />
            <span>Classificados</span>
          </Link>

          <span className="text-muted-foreground/40 text-xs">/</span>

          <Badge variant="outline" className="text-xs font-semibold gap-1">
            <niche.icon className="size-3 text-primary" />
            <span>{niche.shortLabel}</span>
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
          <div className="bg-card rounded-2xl border border-border/60 overflow-hidden">
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
              <div className="flex items-center gap-2.5 p-3.5 overflow-x-auto  bg-muted/20 scrollbar-none">
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
          <div className="bg-card rounded-2xl border border-border/60 p-6 sm:p-7 space-y-4">
            <h2 className="text-base font-bold text-foreground  pb-2">
              Descrição do Anúncio
            </h2>
            <div className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
              {classified.content}
            </div>

            {/* Atributos Gerais Semânticos */}
            <div className=" pt-4 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              {semanticCondition && (
                <div>
                  <span className="text-muted-foreground block mb-0.5">{semanticCondition.label}</span>
                  <span className="font-semibold text-foreground">
                    {semanticCondition.value}
                  </span>
                </div>
              )}
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
              <div className=" pt-4 space-y-3">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Ficha do Veículo
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-muted/30 p-3.5 rounded-xl ">
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

            {/* ─── Ficha Técnica: Desapego & Bens Físicos ─── */}
            {classified.category === "sale" && classified.attributes?.desapego_subcategory && (
              <div className="pt-4 space-y-4">
                <h3 className="text-xs font-medium text-muted-foreground">
                  Especificações do Item
                </h3>

                {/* Smartphone */}
                {classified.attributes.desapego_subcategory === "smartphones" && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-muted/30 p-4 rounded-2xl">
                    {classified.attributes.brand && (
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Marca</span>
                        <span className="font-semibold">{classified.attributes.brand}</span>
                      </div>
                    )}
                    {classified.attributes.model && (
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Modelo</span>
                        <span className="font-semibold">{classified.attributes.model}</span>
                      </div>
                    )}
                    {classified.attributes.storage && (
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Armazenamento</span>
                        <span className="font-semibold">{classified.attributes.storage}</span>
                      </div>
                    )}
                    {classified.attributes.battery_health && (
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Saúde da Bateria</span>
                        <span className="font-semibold">{classified.attributes.battery_health}%</span>
                      </div>
                    )}
                    {classified.attributes.condition && (
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Estado</span>
                        <span className="font-semibold capitalize">{classified.attributes.condition.replace(/_/g, " ")}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Computador / Notebook */}
                {classified.attributes.desapego_subcategory === "computadores" && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-muted/30 p-4 rounded-2xl">
                    {classified.attributes.computer_type && (
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Tipo</span>
                        <span className="font-semibold">{classified.attributes.computer_type}</span>
                      </div>
                    )}
                    {classified.attributes.brand && (
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Marca</span>
                        <span className="font-semibold">{classified.attributes.brand}</span>
                      </div>
                    )}
                    {classified.attributes.processor && (
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Processador</span>
                        <span className="font-semibold">{classified.attributes.processor}</span>
                      </div>
                    )}
                    {classified.attributes.ram && (
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Memória RAM</span>
                        <span className="font-semibold">{classified.attributes.ram}</span>
                      </div>
                    )}
                    {classified.attributes.storage && (
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Armazenamento</span>
                        <span className="font-semibold">{classified.attributes.storage}</span>
                      </div>
                    )}
                    {classified.attributes.condition && (
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Estado</span>
                        <span className="font-semibold capitalize">{classified.attributes.condition.replace(/_/g, " ")}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Eletrodoméstico */}
                {classified.attributes.desapego_subcategory === "eletrodomesticos" && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-muted/30 p-4 rounded-2xl">
                    {classified.attributes.appliance_type && (
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Tipo</span>
                        <span className="font-semibold">{classified.attributes.appliance_type}</span>
                      </div>
                    )}
                    {classified.attributes.brand && (
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Marca</span>
                        <span className="font-semibold">{classified.attributes.brand}</span>
                      </div>
                    )}
                    {classified.attributes.voltage && (
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Voltagem</span>
                        <span className="font-semibold">{classified.attributes.voltage}</span>
                      </div>
                    )}
                    {classified.attributes.condition && (
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Estado</span>
                        <span className="font-semibold capitalize">{classified.attributes.condition.replace(/_/g, " ")}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Games & Consoles */}
                {classified.attributes.desapego_subcategory === "games_consoles" && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-muted/30 p-4 rounded-2xl">
                    {classified.attributes.console && (
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Console</span>
                        <span className="font-semibold">{classified.attributes.console}</span>
                      </div>
                    )}
                    {classified.attributes.condition && (
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Estado</span>
                        <span className="font-semibold capitalize">{classified.attributes.condition.replace(/_/g, " ")}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Móveis & Decoração */}
                {classified.attributes.desapego_subcategory === "moveis" && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-muted/30 p-4 rounded-2xl">
                    {classified.attributes.room && (
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Ambiente</span>
                        <span className="font-semibold">{classified.attributes.room}</span>
                      </div>
                    )}
                    {classified.attributes.material && (
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Material</span>
                        <span className="font-semibold">{classified.attributes.material}</span>
                      </div>
                    )}
                    {classified.attributes.condition && (
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Estado</span>
                        <span className="font-semibold capitalize">{classified.attributes.condition.replace(/_/g, " ")}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Brechó & Moda */}
                {classified.attributes.desapego_subcategory === "moda_brecho" && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-muted/30 p-4 rounded-2xl">
                    {classified.attributes.fashion_category && (
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Categoria</span>
                        <span className="font-semibold">{classified.attributes.fashion_category}</span>
                      </div>
                    )}
                    {classified.attributes.gender && (
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Gênero</span>
                        <span className="font-semibold">{classified.attributes.gender}</span>
                      </div>
                    )}
                    {classified.attributes.size && (
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Tamanho</span>
                        <span className="font-semibold">{classified.attributes.size}</span>
                      </div>
                    )}
                    {classified.attributes.brand && (
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Marca</span>
                        <span className="font-semibold">{classified.attributes.brand}</span>
                      </div>
                    )}
                    {classified.attributes.condition && (
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Estado</span>
                        <span className="font-semibold capitalize">{classified.attributes.condition.replace(/_/g, " ")}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Acessórios inclusos (smartphone) */}
                {Array.isArray(classified.attributes.accessories) && classified.attributes.accessories.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] text-muted-foreground">Incluso no Item</span>
                    <div className="flex flex-wrap gap-1.5">
                      {classified.attributes.accessories.map((acc: string, i: number) => (
                        <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-muted text-foreground font-medium">
                          ✓ {acc}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Garantia */}
                {classified.attributes.warranty && (
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Garantia / Procedência:</span> {classified.attributes.warranty}
                  </p>
                )}
              </div>
            )}

            {/* ─── Ficha Técnica: Veículo — Cor + Opcionais + Procedência ─── */}
            {classified.category === "vehicle" && classified.attributes && (classified.attributes.color || (Array.isArray(classified.attributes.features) && classified.attributes.features.length > 0)) && (
              <div className="pt-2 space-y-3">
                {classified.attributes.color && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">Cor:</span>
                    <span className="font-semibold">{classified.attributes.color}</span>
                  </div>
                )}
                {Array.isArray(classified.attributes.features) && classified.attributes.features.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] text-muted-foreground">Opcionais & Diferenciais</span>
                    <div className="flex flex-wrap gap-1.5">
                      {classified.attributes.features.map((feat: string, i: number) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded-lg bg-muted text-foreground font-medium">
                          {feat}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {Array.isArray(classified.attributes.provenance) && classified.attributes.provenance.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] text-muted-foreground">Procedência & Documentação</span>
                    <div className="flex flex-wrap gap-1.5">
                      {classified.attributes.provenance.map((prov: string, i: number) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded-lg bg-primary/10 text-primary font-medium">
                          ✓ {prov}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Ficha Técnica de Vaga de Emprego & Oportunidade (Microfase 78B — BigTech InfoJobs & LinkedIn Style) */}
            {(classified.category === "job" || classified.attributes?.niche === "vaga") && (
              <div className=" pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Briefcase className="size-4 text-primary" />
                    <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                      Requisitos & Detalhes da Vaga
                    </h3>
                  </div>
                  <Badge variant="outline" className="text-[10px] uppercase font-mono font-bold text-primary border-primary/30">
                    {classified.attributes?.role || classified.title}
                  </Badge>
                </div>

                {/* Grade de 4 parâmetros mensuráveis */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-muted/30 p-4 rounded-2xl text-center">
                  <div>
                    <span className="text-muted-foreground block text-[10px] mb-0.5">Escolaridade Mínima</span>
                    <span className="font-bold text-foreground">
                      {getEducationLabel(classified.attributes?.min_education)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] mb-0.5">Experiência Mínima</span>
                    <span className="font-bold text-foreground">
                      {getExperienceLabel(classified.attributes?.experience_level)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] mb-0.5">Regime</span>
                    <span className="font-bold text-foreground">
                      {getRegimeLabel(classified.attributes?.regime)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] mb-0.5">Modelo</span>
                    <span className="font-bold text-foreground">
                      {getWorkplaceModelLabel(classified.attributes?.work_model)}
                    </span>
                  </div>
                </div>

                {/* Benefícios Oferecidos */}
                {Array.isArray(classified.attributes?.benefits) && classified.attributes.benefits.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Benefícios & Vantagens Oferecidas
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {classified.attributes.benefits.map((ben: string, idx: number) => (
                        <Badge key={idx} variant="secondary" className="text-xs font-semibold px-2.5 py-1 rounded-lg gap-1.5 bg-primary/10 text-primary border-primary/20">
                          <CheckCircle2 className="size-3 text-primary" />
                          <span>{ben}</span>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Habilidades & Competências Exigidas */}
                {Array.isArray(classified.attributes?.skills) && classified.attributes.skills.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Competências & Habilidades Desejadas
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {classified.attributes.skills.map((skill: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-xs font-medium px-2.5 py-1 rounded-lg">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Widget de Mensuração e Estatísticas de Candidatos (Estilo InfoJobs / LinkedIn) */}
                <div className="mt-4 p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="size-4 text-primary" />
                      <span className="text-xs font-bold text-foreground">Mensuração & Análise de Aderência</span>
                    </div>
                    <Badge variant="secondary" className="text-[10px] font-mono text-primary">
                      Padrão InfoJobs / LinkedIn
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Esta oportunidade mensura candidatos por competências e escolaridade canônica. Candidatos com formação equivalente ou superior têm alta prioridade de triagem.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-center">
                    <div className="bg-background/80 p-2.5 rounded-xl border border-border/60">
                      <span className="text-[10px] text-muted-foreground block">Status do Processo</span>
                      <span className="text-xs font-bold text-emerald-600">Inscrições Abertas</span>
                    </div>
                    <div className="bg-background/80 p-2.5 rounded-xl border border-border/60">
                      <span className="text-[10px] text-muted-foreground block">Canal Recomendado</span>
                      <span className="text-xs font-bold text-primary">Perfil Profissional</span>
                    </div>
                    <div className="bg-background/80 p-2.5 rounded-xl border border-border/60">
                      <span className="text-[10px] text-muted-foreground block">Triagem Média</span>
                      <span className="text-xs font-bold text-foreground">Em até 48h</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Ficha Técnica de Imóvel & Hospedagem */}
            {classified.category === "real_estate" && (
              <div className=" pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                    {classified.deal_type === "temporada"
                      ? "Detalhes da Hospedagem (Temporada)"
                      : "Detalhes do Imóvel"}
                  </h3>
                  <Badge variant="outline" className="text-[10px] uppercase font-mono font-bold">
                    {classified.deal_type === "temporada"
                      ? "Diária / Temporada"
                      : classified.deal_type === "aluguel"
                        ? "Aluguel Mensal"
                        : "Venda"}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-muted/30 p-3.5 rounded-xl  text-center">
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
          <div className=" bg-card rounded-2xl p-6 space-y-2 ">
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
          <div className="bg-card rounded-2xl border border-border/60 p-6 sm:p-7 space-y-6">
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
            <div className=" pt-4">
              <span className="text-xs uppercase font-bold text-muted-foreground tracking-wider block mb-1">
                {classified.deal_type === "aluguel"
                  ? "Valor do Aluguel Mensal"
                  : classified.deal_type === "temporada"
                    ? "Valor por Diária"
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

              {/* Badges Semânticos do Nicho */}
              <div className="flex flex-wrap gap-1.5 pt-2.5">
                {semanticBadges.map((badge, idx) => {
                  const Icon = badge.icon;
                  return (
                    <Badge
                      key={idx}
                      variant={badge.variant || "outline"}
                      className="text-[10px] font-medium gap-1 bg-muted/40"
                    >
                      <Icon className="size-3 text-primary" />
                      <span>{badge.label}</span>
                    </Badge>
                  );
                })}
              </div>

              {classified.negotiable && (
                <span className="text-xs text-muted-foreground font-medium mt-2 block">
                  ✓ Vendedor aceita propostas e negociação
                </span>
              )}
            </div>

            {/* Simulador de Frete & Logística Wider Express (Exclusivo para produtos físicos/desapegos) */}
            {niche.showDeliveryBadges && classified.attributes?.delivery_mode !== "pickup" && (
              <div className="border border-primary/20 rounded-2xl p-4 bg-primary/5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <Truck className="size-4 text-primary" />
                    <span>Calcular Entrega no seu Endereço</span>
                  </div>
                  <Badge variant="default" className="text-[9px] font-mono bg-primary text-primary-foreground">
                    Wider Express
                  </Badge>
                </div>

                <div className="space-y-1.5 text-xs pt-1">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-background ">
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

                  <div className="flex items-center justify-between p-2 rounded-xl bg-background ">
                    <div className="flex items-center gap-2">
                      <div className="size-6 rounded-lg bg-muted flex items-center justify-center text-foreground">
                        <Package className="size-3.5" />
                      </div>
                      <div>
                        <p className="font-semibold text-xs text-foreground">Ponto PUDO / Locker Wider</p>
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
              {isOwner ? (
                /* Painel de Gestão para o Anunciante Proprietário */
                <div className="p-4 rounded-2xl bg-muted/40  space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                    <ShieldCheck className="size-4 text-primary" />
                    <span>Este anúncio pertence a você</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Como anunciante, você pode editar informações, pausar o anúncio e acompanhar as
                    propostas e reservas recebidas.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {(classified.category === "job" || classified.attributes?.niche === "vaga") && (
                      <div className="col-span-2 pb-1">
                        <Button
                          size="sm"
                          onClick={async () => {
                            setCandidatesListOpen(true);
                            setIsLoadingCandidates(true);
                            try {
                              const apps = await listClassifiedJobApplications({ data: classified.id });
                              setCandidatesList(apps || []);
                            } catch (err) {
                              toast.error("Erro ao carregar lista de candidatos.");
                            } finally {
                              setIsLoadingCandidates(false);
                            }
                          }}
                          className="w-full rounded-xl text-xs font-bold h-9 bg-primary text-primary-foreground gap-2"
                        >
                          <Users className="size-3.5" />
                          <span>Gerenciar Candidatos Inscritos</span>
                        </Button>
                      </div>
                    )}
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="rounded-xl text-xs font-bold h-9"
                    >
                      <Link
                        to="/conta/classificados/novo"
                        search={{ editId: classified.id } as any}
                      >
                        <Edit3 className="size-3.5 mr-1" />
                        Editar Anúncio
                      </Link>
                    </Button>
                    <Button
                      asChild
                      size="sm"
                      className="rounded-xl text-xs font-bold h-9 bg-foreground text-background"
                    >
                      <Link to="/conta/negociacoes">
                        <Handshake className="size-3.5 mr-1" />
                        Ver Propostas
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : (classified.category === "job" || classified.attributes?.niche === "vaga") ? (
                /* Bloco Especial de Candidatura à Vaga */
                <div className="space-y-3">
                  <Button
                    size="lg"
                    onClick={() => setApplyModalOpen(true)}
                    className="w-full h-12 rounded-xl font-bold bg-primary text-primary-foreground gap-2 text-sm shadow-md hover:bg-primary/90 transition-all cursor-pointer"
                  >
                    <Briefcase className="size-5" />
                    <span>Candidatar-se à Vaga</span>
                  </Button>

                  {(classified.contact_whatsapp || classified.whatsapp || classified.profiles?.phone) && (
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => {
                        const targetPhone = classified.contact_whatsapp || classified.whatsapp || classified.profiles?.phone;
                        const text = `Olá! Vi a oportunidade de "${classified.title}" no portal Wider e gostaria de me candidatar.`;
                        trackAndOpenWhatsApp(targetPhone, text, {
                          classifiedId: classified.id,
                          classifiedTitle: classified.title,
                          action: "job_quick_whatsapp",
                        });
                      }}
                      className="w-full h-11 rounded-xl font-semibold text-xs gap-2 border-emerald-600/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer"
                    >
                      <MessageCircle className="size-4 text-emerald-600" />
                      <span>Falar com o Recrutador via WhatsApp</span>
                    </Button>
                  )}
                </div>
              ) : classified.deal_type === "temporada" ? (
                /* Bloco de Reserva Direta de Hospedagem / Diárias */
                <div className="space-y-3">
                  <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
                    <DialogTrigger asChild>
                      <Button
                        size="lg"
                        className="w-full h-12 rounded-xl font-bold bg-primary text-primary-foreground  gap-2 text-sm"
                      >
                        <Calendar className="size-5" />
                        Reservar Diárias
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md sm:rounded-2xl">
                      {viewerContext === "anonymous" ? (
                        <div className="text-center py-6 space-y-4">
                          <Calendar className="size-10 text-primary mx-auto" />
                          <div className="space-y-1">
                            <DialogTitle className="text-lg font-bold">
                              Identifique-se para reservar
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground">
                              Faça login na sua conta Wider para reservar este imóvel por temporada com
                              garantia e suporte regional.
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
                              <Calendar className="size-5 text-primary" />
                              Reservar Hospedagem por Diária
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground">
                              Selecione as datas de check-in e check-out para confirmar sua estadia.
                            </DialogDescription>
                          </DialogHeader>

                          <div className="space-y-4 py-2">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-foreground">
                                  Check-in *
                                </label>
                                <Input
                                  type="date"
                                  value={checkInDate}
                                  onChange={(e) => setCheckInDate(e.target.value)}
                                  className="h-10 rounded-xl text-xs bg-background font-mono"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-foreground">
                                  Check-out *
                                </label>
                                <Input
                                  type="date"
                                  value={checkOutDate}
                                  onChange={(e) => setCheckOutDate(e.target.value)}
                                  className="h-10 rounded-xl text-xs bg-background font-mono"
                                />
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-xs font-semibold text-foreground">
                                Número de Hóspedes
                              </label>
                              <Input
                                type="number"
                                min={1}
                                max={classified.max_guests || 10}
                                value={bookingGuests}
                                onChange={(e) => setBookingGuests(parseInt(e.target.value) || 1)}
                                className="h-10 rounded-xl text-xs bg-background font-mono"
                              />
                            </div>

                            {/* Resumo de Valores */}
                            <div className="p-3.5 rounded-xl bg-muted/40  space-y-2 text-xs">
                              <div className="flex justify-between text-muted-foreground">
                                <span>
                                  {formatMoney(dailyRateCents)} × {nightsCount} diária(s)
                                </span>
                                <span className="font-mono font-medium text-foreground">
                                  {formatMoney(dailyRateCents * nightsCount)}
                                </span>
                              </div>
                              {cleaningFeeCents > 0 && (
                                <div className="flex justify-between text-muted-foreground">
                                  <span>Taxa única de limpeza</span>
                                  <span className="font-mono font-medium text-foreground">
                                    {formatMoney(cleaningFeeCents)}
                                  </span>
                                </div>
                              )}
                              <div className="pt-2  flex justify-between font-bold text-sm text-foreground">
                                <span>Total Estimado</span>
                                <span className="font-mono text-primary">
                                  {formatMoney(bookingTotalCents)}
                                </span>
                              </div>
                            </div>

                            <Button
                              onClick={handleDirectBooking}
                              disabled={isBooking}
                              className="w-full h-11 rounded-xl text-xs font-bold gap-2"
                            >
                              {isBooking ? (
                                <>
                                  <Loader2 className="size-4 animate-spin" />
                                  <span>Confirmando Reserva...</span>
                                </>
                              ) : (
                                <>
                                  <Check className="size-4" />
                                  <span>Confirmar Reserva de {formatMoney(bookingTotalCents)}</span>
                                </>
                              )}
                            </Button>
                          </div>
                        </>
                      )}
                    </DialogContent>
                  </Dialog>

                  {/* Modal Secundário de Proposta/Negociação para Temporada */}
                  <Dialog open={proposalOpen} onOpenChange={setProposalOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full h-10 rounded-xl font-bold text-xs gap-1.5"
                      >
                        <Handshake className="size-4 text-muted-foreground" />
                        Fazer Oferta Especial / Negociar
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md sm:rounded-2xl">
                      {viewerContext === "anonymous" ? (
                        <div className="text-center py-6 space-y-4">
                          <Handshake className="size-10 text-primary mx-auto" />
                          <div className="space-y-1">
                            <DialogTitle className="text-lg font-bold">
                              Identifique-se para negociar
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground">
                              Para enviar ofertas personalizadas, faça login na sua conta Wider.
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
                              Enviar Oferta para o Anfitrião
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground">
                              Proponha um pacote diferenciado ou período estendido.
                            </DialogDescription>
                          </DialogHeader>

                          <div className="space-y-4 py-2">
                            <div className="space-y-1.5">
                              <label className="text-xs font-semibold text-foreground">
                                Valor Total Proposto (R$) *
                              </label>
                              <CurrencyField
                                value={proposalPriceCents}
                                onChange={setProposalPriceCents}
                                placeholder="0,00"
                                className="h-10 rounded-xl text-xs bg-background"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-xs font-semibold text-foreground">
                                Detalhes do Período ou Condições
                              </label>
                              <Textarea
                                value={proposalTerms}
                                onChange={(e) => setProposalTerms(e.target.value)}
                                placeholder="Ex: Período de 15 dias, pagamento antecipado no PIX..."
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
                                  <span>Enviar Proposta ao Anfitrião</span>
                                </>
                              )}
                            </Button>
                          </div>
                        </>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              ) : (
                /* Bloco de Compra / Negociação para Venda, Aluguel e Outros Itens */
                <div className="space-y-3">
                  {/* Botão Primário Semântico adaptado ao nicho */}
                  {niche.id === "goods" && classified.price_cents && classified.price_cents > 0 ? (
                    <Button
                      onClick={handleDirectBuy}
                      disabled={isBuyingDirect}
                      size="lg"
                      className="w-full h-12 rounded-xl font-bold bg-primary text-primary-foreground  gap-2 text-sm"
                    >
                      {isBuyingDirect ? (
                        <>
                          <Loader2 className="size-5 animate-spin" />
                          <span>Processando Compra Segura...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="size-5" />
                          <span>Comprar com Garantia por {formatMoney(classified.price_cents)}</span>
                        </>
                      )}
                    </Button>
                  ) : (
                    <Dialog open={proposalOpen} onOpenChange={setProposalOpen}>
                      <DialogTrigger asChild>
                        <Button
                          size="lg"
                          className="w-full h-12 rounded-xl font-bold bg-primary text-primary-foreground gap-2 text-sm"
                        >
                          <niche.icon className="size-5" />
                          <span>{niche.primaryActionLabel}</span>
                        </Button>
                      </DialogTrigger>
                    </Dialog>
                  )}

                  {/* Botão Fazer Proposta / Negociar */}
                  <Dialog open={proposalOpen} onOpenChange={setProposalOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant={classified.price_cents ? "outline" : "default"}
                        size="lg"
                        className={`w-full ${classified.price_cents ? "h-10 text-xs" : "h-12 text-sm"} rounded-xl font-bold gap-2`}
                      >
                        <Handshake className="size-4" />
                        <span>Fazer Proposta / Negociar Valor</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md sm:rounded-2xl">
                      {viewerContext === "anonymous" ? (
                        <div className="text-center py-6 space-y-4">
                          <Handshake className="size-10 text-primary mx-auto" />
                          <div className="space-y-1">
                            <DialogTitle className="text-lg font-bold">
                              Identifique-se para negociar
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground">
                              Para enviar propostas, negociar valores e trocar itens com segurança,
                              faça login na sua conta Wider.
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

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                                placeholder="Ex: Retiro no sábado, aceito troca com volta..."
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
                </div>
              )}

              {/* Botão de WhatsApp Rastreado */}
              {cleanPhone && (
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  onClick={() =>
                    trackAndOpenWhatsApp({
                      phone: cleanPhone,
                      storeId: (classified as any).store_id || null,
                      entityType: "classified",
                      entityId: classified.id,
                      entityTitle: classified.title,
                      niche: classified.category || "classificados",
                    })
                  }
                  className="w-full h-11 rounded-xl font-bold border-emerald-600/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 gap-2 text-xs cursor-pointer"
                >
                  <MessageCircle className="size-4" />
                  Conversar no WhatsApp
                </Button>
              )}
            </div>

            {/* Autor Real do Anúncio */}
            <div className=" pt-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar className="size-10 rounded-xl ">
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
                  <Link to="/membro/$id" params={{ id: author.id }} search={{ modo: "comercial" }}>
                    Ver Perfil
                  </Link>
                </Button>
              )}
            </div>

            {/* Dica de Segurança */}
            <div className=" bg-muted/30 rounded-xl p-3.5 flex gap-3 text-xs text-muted-foreground">
              <ShieldCheck className="size-5 text-primary shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-semibold text-foreground">Negociação Segura</p>
                <p>
                  Prefira encontros em locais públicos e formalize acordos de valor via proposta na
                  Wider.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Fullscreen de Imagem */}
      {fullscreenImage && (
        <Dialog open={!!fullscreenImage} onOpenChange={() => setFullscreenImage(null)}>
          <DialogContent className="sm:max-w-4xl p-2 bg-black border-none sm:rounded-2xl overflow-hidden">
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
