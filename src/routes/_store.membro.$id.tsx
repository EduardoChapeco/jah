import { CreatorAnalyticsCard } from "@/components/social/creator-analytics-card";
import { ThreadsFeedCard } from "@/components/social/threads-feed-card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetTrigger,
} from "@/components/ui/sheet";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Package,
  Settings,
  User,
  MessageSquare,
  Tag,
  MapPin,
  Briefcase,
  Globe,
  Instagram,
  Store,
  Check,
  Plus,
  Edit3,
  Share2,
  Sparkles,
  ExternalLink,
  MessageCircle,
  GraduationCap,
  Grid,
  List,
  ArrowLeft,
  Building2,
  Clock,
  ShieldCheck,
  Award,
  Calendar,
  Send,
  ShoppingBag,
  Trash2,
  FileText,
  Upload,
  HeartHandshake,
  Languages,
  X,
  UserPlus,
  Eye,
  ChevronRight,
  Heart,
} from "lucide-react";
import { MediaLightboxModal } from "@/components/community/media-lightbox-modal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/datetime";
import {
  getPublicMemberProfile,
  toggleUserFollow,
  updateMemberResumeData,
  searchStoresForCompanyAutocomplete,
} from "@/services/social.functions";
import { getPostMediaSignedUrl } from "@/services/storage.functions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export type MembroSearchParams = {
  modo?: "social" | "profissional" | "comercial";
};

export const Route = createFileRoute("/_store/membro/$id")({
  validateSearch: (search: Record<string, unknown>): MembroSearchParams => ({
    modo:
      search.modo === "profissional" || search.modo === "comercial"
        ? (search.modo as "profissional" | "comercial")
        : "social",
  }),
  head: ({ loaderData, search }: { loaderData?: { data: any }; search?: MembroSearchParams }) => {
    const modo = search?.modo;
    const fullName = loaderData?.data?.profile?.full_name || "Membro";
    const username = loaderData?.data?.profile?.username ? "@" + loaderData.data.profile.username : "";
    let title = fullName + (username ? " (" + username + ")" : "") + " | Wider";
    if (modo === "profissional") {
      title = fullName + " — Perfil Profissional | Wider";
    } else if (modo === "comercial") {
      title = fullName + " — Catálogo & Desapegos | Wider";
    }
    return {
      meta: [
        { title },
        {
          name: "description",
          content: loaderData?.data?.profile?.bio || "Perfil no ecossistema comunitário Wider.",
        },
      ],
    };
  },
  loader: async ({ params }): Promise<{ data: any }> => {
    const data = await getPublicMemberProfile({ data: { profileId: params.id } }).catch(() => null);
    return { data };
  },
  component: MemberPublicProfilePage,
});

export default function MemberPublicProfilePage() {
  const { data } = Route.useLoaderData();
  const search = Route.useSearch();
  return <MemberPublicProfileView data={data} activeMode={search.modo || "social"} />;
}

// 14 Causas sociais pré-cadastradas
const SOCIAL_CAUSES_LIST = [
  "Proteção animal",
  "Cultura e artes",
  "Crianças",
  "Direitos civis e ações sociais",
  "Empoderamento econômico",
  "Educação",
  "Meio ambiente",
  "Saúde",
  "Direitos humanos",
  "Resposta a desastres e assistência humanitária",
  "Política",
  "Alívio à pobreza",
  "Ciência e tecnologia",
  "Serviço social",
];

export function MemberPublicProfileView({
  data,
  activeMode = "social",
}: {
  data: any;
  activeMode?: "social" | "profissional" | "comercial";
}) {
  const router = useRouter();

  const profile = data?.profile;
  const isOwner = Boolean(data?.isOwner);
  const stores = (data?.stores || []) as any[];
  const classifieds = (data?.classifieds || []) as any[];
  const posts = (data?.posts || []) as any[];
  const stats = data?.stats || { followersCount: 0, followingCount: 0, postsCount: 0 };

  const [isFollowing, setIsFollowing] = useState(Boolean(data?.isFollowing));
  const [followersCount, setFollowersCount] = useState(stats.followersCount || 0);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  // Resume data do perfil
  const [resumeData, setResumeData] = useState<any>(profile?.resume_data || {});
  const [isSavingResume, setIsSavingResume] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [socialTab, setSocialTab] = useState<"posts" | "media" | "saved" | "liked">("posts");
  const [postViewMode, setPostViewMode] = useState<"feed" | "grid">("grid");

  // Lightbox Modal para fotos individuais
  const [previewMediaUrl, setPreviewMediaUrl] = useState<string | null>(null);
  const [selectedLightboxPost, setSelectedLightboxPost] = useState<any | null>(null);
  const [selectedLightboxIndex, setSelectedLightboxIndex] = useState<number>(0);

  // Modais de Edição Rápida In-Place
  const [editingSection, setEditingSection] = useState<
    | "availability"
    | "about"
    | "experience"
    | "education"
    | "certification"
    | "project"
    | "volunteering"
    | "causes"
    | "languages"
    | null
  >(null);

  // Item selecionado para edição (null = criando novo)
  const [activeEditItem, setActiveEditItem] = useState<any>(null);

  // Estado expansível de listas longas
  const [showAllExperiences, setShowAllExperiences] = useState(false);
  const [showAllEducations, setShowAllEducations] = useState(false);
  const [showAllCertifications, setShowAllCertifications] = useState(false);
  const [showAllProjects, setShowAllProjects] = useState(false);
  const [showAllVolunteering, setShowAllVolunteering] = useState(false);

  if (!profile) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center space-y-4">
        <div className="size-16 rounded-2xl bg-muted/40 flex items-center justify-center text-muted-foreground">
          <User className="size-8" />
        </div>
        <h2 className="text-xl font-bold">Perfil não encontrado</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          O membro solicitado não existe ou foi desativado da rede comunitária Wider.
        </p>
        <Button asChild variant="outline" className="rounded-xl">
          <Link to="/">Voltar ao Início</Link>
        </Button>
      </div>
    );
  }

  const handleToggleFollow = async () => {
    if (isOwner || isFollowLoading) return;
    setIsFollowLoading(true);
    try {
      const res = await toggleUserFollow({ data: { targetUserId: profile.id } });
      const isNowFollowing = (res as any).following ?? (res as any).isFollowing;
      setIsFollowing(isNowFollowing);
      setFollowersCount((prev: number) => (isNowFollowing ? prev + 1 : Math.max(0, prev - 1)));
      toast.success(isNowFollowing ? `Você está seguindo ${profile.full_name}` : "Deixou de seguir");
    } catch {
      toast.error("Não foi possível atualizar o status de seguidor.");
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleShare = () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator
        .share({
          title: `${profile.full_name} no Wider`,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link do perfil copiado para a área de transferência!");
    }
  };

  const saveResumeChanges = async (newResumeData: any) => {
    setIsSavingResume(true);
    try {
      await updateMemberResumeData({ data: { resumeData: newResumeData } });
      setResumeData(newResumeData);
      toast.success("Perfil atualizado com sucesso!");
      setEditingSection(null);
      setActiveEditItem(null);
      router.invalidate();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao salvar informações do perfil.");
    } finally {
      setIsSavingResume(false);
    }
  };

  // Seções do currículo
  const availability = resumeData.availability || {};
  const experiences = (resumeData.experiences || []) as any[];
  const educations = (resumeData.educations || []) as any[];
  const certifications = (resumeData.certifications || []) as any[];
  const projects = (resumeData.projects || []) as any[];
  const volunteeringList = (resumeData.volunteering || []) as any[];
  const causes = (resumeData.causes || []) as string[];
  const languagesList = (resumeData.languages || []) as any[];
  const aboutSummary = resumeData.summary || profile.bio || "";

  // Itens visíveis conforme estado de expansão
  const visibleExperiences = showAllExperiences ? experiences : experiences.slice(0, 3);
  const visibleEducations = showAllEducations ? educations : educations.slice(0, 3);
  const visibleCertifications = showAllCertifications ? certifications : certifications.slice(0, 4);
  const visibleProjects = showAllProjects ? projects : projects.slice(0, 3);
  const visibleVolunteering = showAllVolunteering ? volunteeringList : volunteeringList.slice(0, 3);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-6 animate-in fade-in duration-200">
      {/* ── Visualizador Lightbox de Mídias ── */}
      {previewMediaUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setPreviewMediaUrl(null)}
        >
          <button
            type="button"
            className="absolute top-6 right-6 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            onClick={() => setPreviewMediaUrl(null)}
            aria-label="Fechar visualizador"
          >
            <X className="size-6" />
          </button>
          <img
            src={previewMediaUrl}
            alt="Mídia ampliada"
            className="max-w-full max-h-[90vh] object-contain rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* ── Media Lightbox Modal com Métricas e Comentários Isolados ── */}
      {selectedLightboxPost && (
        <MediaLightboxModal
          isOpen={Boolean(selectedLightboxPost)}
          onClose={() => setSelectedLightboxPost(null)}
          post={{
            type: "post",
            id: selectedLightboxPost.id,
            author: {
              id: profile.id,
              name: profile.full_name,
              avatar_url: profile.avatar_url,
              is_store: false,
            },
            content_text: selectedLightboxPost.content || selectedLightboxPost.content_text || "",
            media_urls: selectedLightboxPost.media_urls || (selectedLightboxPost.media_url ? [selectedLightboxPost.media_url] : []),
            layout_style: selectedLightboxPost.layout_style || "grid",
            post_type: selectedLightboxPost.post_type || "simple",
            created_at: selectedLightboxPost.created_at || new Date().toISOString(),
            likes_count: selectedLightboxPost.likes_count || 0,
            comments_count: selectedLightboxPost.comments_count || 0,
            user_liked: false,
            reference_type: "none",
            reference_id: null,
          }}
          initialMediaIndex={selectedLightboxIndex}
        />
      )}

      {/* ── Top Bar de Navegação Rápida entre Modos Contextuais ── */}
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/40 text-xs font-semibold">
          <Link
            to="/membro/$id"
            params={{ id: profile.username || profile.id }}
            search={{ modo: "social" }}
            className={cn(
              "px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5",
              activeMode === "social"
                ? "bg-background text-foreground font-bold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Sparkles className="size-3.5" />
            <span>Social</span>
          </Link>
          <Link
            to="/membro/$id"
            params={{ id: profile.username || profile.id }}
            search={{ modo: "profissional" }}
            className={cn(
              "px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5",
              activeMode === "profissional"
                ? "bg-background text-foreground font-bold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Briefcase className="size-3.5" />
            <span>Profissional</span>
          </Link>
          <Link
            to="/membro/$id"
            params={{ id: profile.username || profile.id }}
            search={{ modo: "comercial" }}
            className={cn(
              "px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5",
              activeMode === "comercial"
                ? "bg-background text-foreground font-bold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Store className="size-3.5" />
            <span>Comercial</span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {isOwner && (
            <Button
              asChild
              size="sm"
              variant="outline"
              className="h-8 rounded-xl text-xs font-semibold gap-1.5"
            >
              <Link to="/conta/perfil">
                <Edit3 className="size-3.5" />
                <span>Painel Completo</span>
              </Link>
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-8 size-8 p-0 rounded-xl text-muted-foreground hover:text-foreground"
            onClick={handleShare}
            aria-label="Compartilhar Perfil"
          >
            <Share2 className="size-4" />
          </Button>
        </div>
      </div>

      {/* ── Bloco 1: Header do Perfil (Faixa Panorâmica Alinhada 1:1 com Avatar + Capa 2098px + Card de Stats) ── */}
      {/* ── Mobile Top Bar Minimalista (Instagram-Grade) ── */}
      <div className="sm:hidden -mx-4 -mt-4 px-4 py-3 bg-background/90 backdrop-blur-md sticky top-0 z-40 border-b border-border/40 flex items-center justify-between">
        <Button
          size="sm"
          variant="ghost"
          className="size-9 p-0 rounded-xl text-muted-foreground cursor-pointer"
          onClick={() => window.history.back()}
          aria-label="Voltar"
        >
          <ArrowLeft className="size-5" />
        </Button>

        <div className="flex items-center gap-1.5 font-bold text-sm text-foreground">
          <span>@{profile.username || "perfil"}</span>
          {profile.is_verified && (
            <ShieldCheck className="size-4 text-primary fill-primary/20" />
          )}
        </div>

        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="size-9 p-0 rounded-xl text-muted-foreground cursor-pointer"
            onClick={handleShare}
            aria-label="Compartilhar"
          >
            <Share2 className="size-4" />
          </Button>

          {isOwner && (
            <Sheet open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <SheetTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="size-9 p-0 rounded-xl text-foreground cursor-pointer"
                  aria-label="Configurações e Atividades"
                >
                  <Settings className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-3xl p-6 space-y-4 max-h-[85vh]">
                <SheetHeader className="text-left pb-2 border-b border-border/40">
                  <SheetTitle className="text-base font-bold">Configurações & Gestão</SheetTitle>
                </SheetHeader>
                <div className="grid gap-2 text-sm font-medium">
                  <Link
                    to="/conta/perfil"
                    className="flex items-center gap-3 p-3 rounded-2xl bg-muted/40 hover:bg-muted transition-colors"
                  >
                    <Edit3 className="size-4 text-primary" />
                    <span>Editar Dados do Perfil</span>
                  </Link>
                  <Link
                    to="/conta/lojas"
                    className="flex items-center gap-3 p-3 rounded-2xl bg-muted/40 hover:bg-muted transition-colors"
                  >
                    <Store className="size-4 text-primary" />
                    <span>Minhas Lojas & Negócios</span>
                  </Link>
                  <Link
                    to="/conta/pedidos"
                    className="flex items-center gap-3 p-3 rounded-2xl bg-muted/40 hover:bg-muted transition-colors"
                  >
                    <Package className="size-4 text-primary" />
                    <span>Meus Pedidos & Compras</span>
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>

      <div className="rounded-3xl bg-card border border-border/40 overflow-hidden shadow-xs">
        {/* ── 1. Capa Panorâmica do Perfil ── */}
        <div className="relative w-full h-48 sm:h-64 md:h-72 overflow-hidden bg-muted/40 border-b border-border/30">
          {(profile.cover_url || profile.coverUrl || profile.banner_url) ? (
            <img
              src={profile.cover_url || profile.coverUrl || profile.banner_url}
              alt={`Capa de ${profile.full_name}`}
              className="size-full object-cover select-none"
            />
          ) : (
            <div className="size-full bg-gradient-to-r from-primary/10 via-muted/40 to-primary/15 flex items-center justify-center">
              <Sparkles className="size-8 text-primary/30" />
            </div>
          )}
        </div>

        {/* ── 2. Corpo do Header: Avatar Sobreposto + Stats + Ações ── */}
        <div className="p-4 sm:p-6 pt-0 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-16">
            {/* Foto de Perfil em Squircle 1:1 com Ring Protetor */}
            <Avatar className="size-24 sm:size-32 rounded-3xl ring-4 ring-card bg-muted flex-shrink-0 shadow-md">
              <AvatarImage src={profile.avatar_url || ""} alt={profile.full_name} className="object-cover" />
              <AvatarFallback className="text-2xl sm:text-3xl font-extrabold bg-muted text-foreground rounded-3xl">
                {profile.full_name?.slice(0, 2)?.toUpperCase() || "WD"}
              </AvatarFallback>
            </Avatar>

            {/* Estatísticas Reais em Pílula Alinhada */}
            <div className="flex items-center gap-3 self-start sm:self-end">
              <div className="flex items-center gap-4 px-4 py-2 rounded-2xl bg-muted/30 border border-border/50 shadow-2xs">
                <div className="text-center">
                  <p className="text-sm sm:text-base font-extrabold text-foreground">{followersCount}</p>
                  <p className="text-[10px] text-muted-foreground font-medium">Seguidores</p>
                </div>
                <div className="w-px h-6 bg-border/60" />
                <div className="text-center">
                  <p className="text-sm sm:text-base font-extrabold text-foreground">{stats.followingCount || 0}</p>
                  <p className="text-[10px] text-muted-foreground font-medium">Seguindo</p>
                </div>
                <div className="w-px h-6 bg-border/60" />
                <div className="text-center">
                  <p className="text-sm sm:text-base font-extrabold text-foreground">{stats.totalLikes || stats.postsCount || 0}</p>
                  <p className="text-[10px] text-muted-foreground font-medium">Curtidas</p>
                </div>
              </div>
            </div>
          </div>

        {/* Linha de Identidade e Ações Minimalistas (Estilo Instagram / Threads) */}
        <div className="pt-2 border-t border-border/30 space-y-3">
          {/* Nome, Username, Verificação e Menu */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                  {profile.full_name}
                </h1>
                {profile.is_verified && (
                  <ShieldCheck className="size-4 text-primary fill-primary/20 shrink-0" />
                )}
                {profile.username && (
                  <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                    @{profile.username}
                  </span>
                )}
              </div>

              {profile.occupation && (
                <div className="pt-0.5">
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-muted text-muted-foreground">
                    {profile.occupation}
                  </span>
                </div>
              )}
            </div>

            {/* Ações Minimalistas em Pílulas */}
            <div className="flex flex-wrap items-center gap-2">
              {isOwner ? (
                <>
                  <Button
                    size="sm"
                    className="h-9 px-4 rounded-xl font-bold text-xs bg-primary text-primary-foreground gap-1.5 shadow-xs cursor-pointer"
                    onClick={() => setEditingSection("availability")}
                  >
                    <Sparkles className="size-3.5" />
                    <span>Disponibilidade</span>
                  </Button>
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="h-9 px-4 rounded-xl font-semibold text-xs gap-1.5 cursor-pointer"
                  >
                    <Link to="/conta/perfil">
                      <Edit3 className="size-3.5" />
                      <span>Editar Perfil</span>
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="sm"
                    className={cn(
                      "h-9 px-5 rounded-xl font-bold text-xs gap-1.5 cursor-pointer transition-all",
                      isFollowing ? "bg-muted text-foreground hover:bg-muted/80" : "bg-primary text-primary-foreground"
                    )}
                    onClick={handleToggleFollow}
                    disabled={isFollowLoading}
                  >
                    {isFollowing ? (
                      <>
                        <Check className="size-3.5" />
                        <span>Seguindo</span>
                      </>
                    ) : (
                      <>
                        <Plus className="size-3.5" />
                        <span>Seguir</span>
                      </>
                    )}
                  </Button>
                  {profile.phone && (
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="h-9 px-4 rounded-xl font-semibold text-xs gap-1.5 cursor-pointer"
                    >
                      <a
                        href={`https://wa.me/${profile.phone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MessageCircle className="size-3.5 text-emerald-500" />
                        <span>Mensagem</span>
                      </a>
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-9 size-9 p-0 rounded-xl text-muted-foreground hover:text-foreground"
                    onClick={handleShare}
                    aria-label="Compartilhar Perfil"
                  >
                    <Share2 className="size-4" />
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Métricas Reais do Banco em Linha Única (Instagram Style) */}
          <div className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm text-foreground py-0.5">
            <div>
              <strong className="font-extrabold text-foreground">{posts.length}</strong>{" "}
              <span className="text-muted-foreground">publicações</span>
            </div>
            <div>
              <strong className="font-extrabold text-foreground">{followersCount}</strong>{" "}
              <span className="text-muted-foreground">seguidores</span>
            </div>
            <div>
              <strong className="font-extrabold text-foreground">{stats.followingCount || 0}</strong>{" "}
              <span className="text-muted-foreground">seguindo</span>
            </div>
          </div>

          {/* Bio / Descrição Formatada */}
          {(profile.bio || profile.headline) && (
            <p className="text-xs sm:text-sm text-foreground/90 font-medium leading-relaxed whitespace-pre-line max-w-2xl">
              {profile.bio || profile.headline}
            </p>
          )}

          {/* Links e Localização Minimalistas */}
          <div className="flex flex-wrap items-center gap-3 pt-0.5 text-xs">
            {profile.website && (
              <a
                href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary font-semibold hover:underline"
              >
                <Globe className="size-3.5" />
                <span>{profile.website.replace(/^https?:\/\//, "")}</span>
              </a>
            )}

            {profile.instagram && (
              <a
                href={`https://instagram.com/${profile.instagram.replace(/^@/, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-foreground/80 font-semibold hover:underline"
              >
                <Instagram className="size-3.5 text-primary" />
                <span>@{profile.instagram.replace(/^@/, "")}</span>
              </a>
            )}

            {(profile.city || profile.state) && (
              <div className="inline-flex items-center gap-1 text-muted-foreground font-medium">
                <MapPin className="size-3.5 text-primary" />
                <span>{[profile.city, profile.state].filter(Boolean).join(", ")}</span>
              </div>
            )}
          </div>

          {/* Biolinks Adicionais do Perfil em Pílulas Minimalistas */}
          {Array.isArray(profile.biolinks) && profile.biolinks.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {profile.biolinks.map((link: any, idx: number) => (
                <a
                  key={idx}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 rounded-full text-xs font-semibold bg-muted/60 hover:bg-muted text-foreground border border-border/40 flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <ExternalLink className="size-3 text-muted-foreground" />
                  <span>{link.title || link.url}</span>
                </a>
              ))}
            </div>
          )}

          {/* Carrossel de Destaques (Highlights Stories em Mini-Círculos Estilo Instagram) */}
          {((stores && stores.length > 0) || (classifieds && classifieds.length > 0) || (profile.resume_data?.projects && profile.resume_data.projects.length > 0)) && (
            <div className="pt-3 pb-1 border-t border-border/20 overflow-x-auto no-scrollbar flex items-center gap-4 sm:gap-6">
              {stores.slice(0, 3).map((st: any) => (
                <Link
                  key={st.id}
                  to="/perfil-da-loja"
                  search={{ storeId: st.id }}
                  className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer"
                >
                  <div className="size-14 sm:size-16 rounded-full p-0.5 ring-2 ring-primary/40 group-hover:ring-primary group-hover:scale-105 transition-all bg-background overflow-hidden flex items-center justify-center">
                    {st.logo_url ? (
                      <img src={st.logo_url} alt={st.name} className="size-full object-cover rounded-full" />
                    ) : (
                      <Store className="size-6 text-primary" />
                    )}
                  </div>
                  <span className="text-[11px] font-bold text-foreground/90 max-w-[64px] truncate text-center">
                    {st.name}
                  </span>
                </Link>
              ))}

              {classifieds.slice(0, 3).map((c: any) => (
                <div
                  key={c.id}
                  onClick={() => c.images?.[0] && setPreviewMediaUrl(c.images[0])}
                  className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer"
                >
                  <div className="size-14 sm:size-16 rounded-full p-0.5 ring-2 ring-emerald-500/40 group-hover:ring-emerald-500 group-hover:scale-105 transition-all bg-background overflow-hidden flex items-center justify-center">
                    {c.images?.[0] ? (
                      <img src={c.images[0]} alt={c.title} className="size-full object-cover rounded-full" />
                    ) : (
                      <Tag className="size-6 text-emerald-500" />
                    )}
                  </div>
                  <span className="text-[11px] font-bold text-foreground/90 max-w-[64px] truncate text-center">
                    {c.title}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>

      {/* ── Bloco 2: Perfil Profissional Estilo LinkedIn (Quando modo === "profissional") ── */}
      {activeMode === "profissional" && (
        <div className="rounded-3xl bg-card p-6 sm:p-8 space-y-8 divide-y divide-border/40">
          {/* ── 1. Seção Sobre ── */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground tracking-tight">Sobre</h2>
              {isOwner && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="size-8 p-0 rounded-xl text-muted-foreground hover:text-foreground"
                  onClick={() => setEditingSection("about")}
                  aria-label="Editar Sobre"
                >
                  <Edit3 className="size-4" />
                </Button>
              )}
            </div>
            {aboutSummary ? (
              <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
                {aboutSummary}
              </p>
            ) : isOwner ? (
              <button
                type="button"
                onClick={() => setEditingSection("about")}
                className="text-xs text-muted-foreground hover:text-foreground font-medium py-1 transition-colors flex items-center gap-1.5"
              >
                <Plus className="size-3.5" />
                <span>Adicionar resumo sobre você</span>
              </button>
            ) : null}
          </div>

          {/* ── 2. Seção Experiência com Vinculação a Lojas Wider & Mídias ── */}
          <div className="pt-8 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground tracking-tight">Experiência</h2>
              {isOwner && (
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="size-8 p-0 rounded-xl text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setActiveEditItem(null);
                      setEditingSection("experience");
                    }}
                    aria-label="Adicionar Experiência"
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
              )}
            </div>

            {experiences.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                Nenhuma experiência profissional cadastrada até o momento.
              </p>
            ) : (
              <div className="space-y-6 divide-y divide-border/40">
                {visibleExperiences.map((exp: any, index: number) => (
                  <div key={exp.id || index} className={cn("space-y-3", index > 0 && "pt-6")}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3.5">
                        {/* Logo da Loja Wider ou Ícone Squircle */}
                        <div className="size-12 rounded-2xl bg-muted/50 flex-shrink-0 overflow-hidden flex items-center justify-center">
                          {exp.store_logo ? (
                            <img src={exp.store_logo} alt={exp.company} className="size-full object-cover" />
                          ) : (
                            <Building2 className="size-6 text-muted-foreground" />
                          )}
                        </div>

                        {/* Dados da Experiência */}
                        <div className="space-y-1">
                          <h3 className="text-base font-bold text-foreground leading-snug">
                            {exp.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-1.5 text-xs text-foreground/80 font-medium">
                            <span>{exp.company}</span>
                            {exp.store_id && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-primary/10 text-primary font-bold">
                                Empresa Wider
                              </Badge>
                            )}
                            {exp.employment_type && (
                              <>
                                <span>•</span>
                                <span>{exp.employment_type}</span>
                              </>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span>
                              {exp.start_date} – {exp.is_current ? "o momento" : exp.end_date}
                            </span>
                            {exp.location && (
                              <>
                                <span>•</span>
                                <span>{exp.location}</span>
                              </>
                            )}
                            {exp.location_type && <span>({exp.location_type})</span>}
                          </div>
                        </div>
                      </div>

                      {isOwner && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="size-7 p-0 rounded-lg text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            setActiveEditItem(exp);
                            setEditingSection("experience");
                          }}
                          aria-label="Editar Experiência"
                        >
                          <Edit3 className="size-3.5" />
                        </Button>
                      )}
                    </div>

                    {/* Descrição */}
                    {exp.description && (
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed pl-15 whitespace-pre-line">
                        {exp.description}
                      </p>
                    )}

                    {/* Mídias & Documentos Anexados */}
                    {exp.media_urls && exp.media_urls.length > 0 && (
                      <div className="flex flex-wrap gap-2 pl-15 pt-1">
                        {exp.media_urls.map((url: string, mIdx: number) => (
                          <div
                            key={mIdx}
                            className="size-16 rounded-xl overflow-hidden bg-muted/40 cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => setPreviewMediaUrl(url)}
                          >
                            <img src={url} alt="Anexo de experiência" className="size-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Competências Associadas */}
                    {exp.skills && exp.skills.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pl-15 pt-1 text-xs text-muted-foreground">
                        <Tag className="size-3.5 text-primary" />
                        <span className="font-semibold text-foreground">Competências:</span>
                        <span>{exp.skills.join(" • ")}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {experiences.length > 3 && (
              <Button
                variant="ghost"
                className="w-full h-10 rounded-2xl text-xs font-bold gap-1 text-muted-foreground hover:text-foreground"
                onClick={() => setShowAllExperiences(!showAllExperiences)}
              >
                <span>{showAllExperiences ? "Recolher experiências" : `Exibir todas as ${experiences.length} experiências ➔`}</span>
              </Button>
            )}
          </div>

          {/* ── 3. Seção Formação Acadêmica ── */}
          <div className="pt-8 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground tracking-tight">Formação acadêmica</h2>
              {isOwner && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="size-8 p-0 rounded-xl text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setActiveEditItem(null);
                    setEditingSection("education");
                  }}
                  aria-label="Adicionar Formação"
                >
                  <Plus className="size-4" />
                </Button>
              )}
            </div>

            {educations.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                Nenhuma formação acadêmica cadastrada.
              </p>
            ) : (
              <div className="space-y-6 divide-y divide-border/40">
                {visibleEducations.map((edu: any, index: number) => (
                  <div key={edu.id || index} className={cn("space-y-2", index > 0 && "pt-6")}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3.5">
                        <div className="size-12 rounded-2xl bg-muted/50 flex-shrink-0 flex items-center justify-center text-muted-foreground">
                          <GraduationCap className="size-6 text-primary" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-base font-bold text-foreground leading-snug">
                            {edu.school}
                          </h3>
                          <p className="text-xs text-foreground/80 font-medium">
                            {[edu.degree, edu.field_of_study].filter(Boolean).join(", ")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {edu.start_date} – {edu.end_date || "Presente"}
                          </p>
                        </div>
                      </div>
                      {isOwner && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="size-7 p-0 rounded-lg text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            setActiveEditItem(edu);
                            setEditingSection("education");
                          }}
                          aria-label="Editar Formação"
                        >
                          <Edit3 className="size-3.5" />
                        </Button>
                      )}
                    </div>

                    {edu.description && (
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed pl-15 whitespace-pre-line">
                        {edu.description}
                      </p>
                    )}

                    {edu.media_urls && edu.media_urls.length > 0 && (
                      <div className="flex flex-wrap gap-2 pl-15 pt-1">
                        {edu.media_urls.map((url: string, mIdx: number) => (
                          <div
                            key={mIdx}
                            className="size-16 rounded-xl overflow-hidden bg-muted/40 cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => setPreviewMediaUrl(url)}
                          >
                            <img src={url} alt="Foto de formatura" className="size-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {educations.length > 3 && (
              <Button
                variant="ghost"
                className="w-full h-10 rounded-2xl text-xs font-bold gap-1 text-muted-foreground hover:text-foreground"
                onClick={() => setShowAllEducations(!showAllEducations)}
              >
                <span>{showAllEducations ? "Recolher formações" : `Exibir todas as ${educations.length} formações ➔`}</span>
              </Button>
            )}
          </div>

          {/* ── 4. Seção Licenças e Certificados ── */}
          <div className="pt-8 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground tracking-tight">Licenças e certificados</h2>
              {isOwner && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="size-8 p-0 rounded-xl text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setActiveEditItem(null);
                    setEditingSection("certification");
                  }}
                  aria-label="Adicionar Certificado"
                >
                  <Plus className="size-4" />
                </Button>
              )}
            </div>

            {certifications.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                Nenhum certificado ou licença cadastrado.
              </p>
            ) : (
              <div className="space-y-6 divide-y divide-border/40">
                {visibleCertifications.map((cert: any, index: number) => (
                  <div key={cert.id || index} className={cn("space-y-2", index > 0 && "pt-6")}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3.5">
                        <div className="size-12 rounded-2xl bg-muted/50 flex-shrink-0 flex items-center justify-center">
                          <Award className="size-6 text-amber-500" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-base font-bold text-foreground leading-snug">
                            {cert.name}
                          </h3>
                          <p className="text-xs text-foreground/80 font-medium">{cert.issuer}</p>
                          <p className="text-xs text-muted-foreground">
                            Emitido em {cert.issue_date}
                          </p>
                        </div>
                      </div>
                      {isOwner && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="size-7 p-0 rounded-lg text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            setActiveEditItem(cert);
                            setEditingSection("certification");
                          }}
                          aria-label="Editar Certificado"
                        >
                          <Edit3 className="size-3.5" />
                        </Button>
                      )}
                    </div>

                    {cert.credential_url && (
                      <div className="pl-15 pt-1">
                        <Button
                          asChild
                          size="sm"
                          variant="outline"
                          className="h-8 rounded-xl text-xs font-semibold gap-1.5"
                        >
                          <a href={cert.credential_url} target="_blank" rel="noopener noreferrer">
                            <span>Exibir credencial</span>
                            <ExternalLink className="size-3.5" />
                          </a>
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {certifications.length > 4 && (
              <Button
                variant="ghost"
                className="w-full h-10 rounded-2xl text-xs font-bold gap-1 text-muted-foreground hover:text-foreground"
                onClick={() => setShowAllCertifications(!showAllCertifications)}
              >
                <span>{showAllCertifications ? "Recolher certificados" : `Exibir todas as ${certifications.length} licenças ➔`}</span>
              </Button>
            )}
          </div>

          {/* ── 5. Seção Projetos ── */}
          <div className="pt-8 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground tracking-tight">Projetos</h2>
              {isOwner && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="size-8 p-0 rounded-xl text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setActiveEditItem(null);
                    setEditingSection("project");
                  }}
                  aria-label="Adicionar Projeto"
                >
                  <Plus className="size-4" />
                </Button>
              )}
            </div>

            {projects.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                Nenhum projeto em destaque publicado.
              </p>
            ) : (
              <div className="space-y-6 divide-y divide-border/40">
                {visibleProjects.map((proj: any, index: number) => (
                  <div key={proj.id || index} className={cn("space-y-3", index > 0 && "pt-6")}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <h3 className="text-base font-bold text-foreground leading-snug">
                          {proj.title}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {proj.start_date} – {proj.is_current ? "o momento" : proj.end_date}
                        </p>
                        {proj.associated_with && (
                          <p className="text-xs text-foreground/80 font-medium">
                            Associado a: {proj.associated_with}
                          </p>
                        )}
                      </div>
                      {isOwner && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="size-7 p-0 rounded-lg text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            setActiveEditItem(proj);
                            setEditingSection("project");
                          }}
                          aria-label="Editar Projeto"
                        >
                          <Edit3 className="size-3.5" />
                        </Button>
                      )}
                    </div>

                    {proj.project_url && (
                      <div>
                        <Button
                          asChild
                          size="sm"
                          variant="outline"
                          className="h-8 rounded-xl text-xs font-semibold gap-1.5"
                        >
                          <a href={proj.project_url} target="_blank" rel="noopener noreferrer">
                            <span>Exibir projeto</span>
                            <ExternalLink className="size-3.5" />
                          </a>
                        </Button>
                      </div>
                    )}

                    {proj.description && (
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                        {proj.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {projects.length > 3 && (
              <Button
                variant="ghost"
                className="w-full h-10 rounded-2xl text-xs font-bold gap-1 text-muted-foreground hover:text-foreground"
                onClick={() => setShowAllProjects(!showAllProjects)}
              >
                <span>{showAllProjects ? "Recolher projetos" : `Exibir todos os ${projects.length} projetos ➔`}</span>
              </Button>
            )}
          </div>

          {/* ── 6. Seção Voluntariado ── */}
          <div className="pt-8 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground tracking-tight">Voluntariado</h2>
              {isOwner && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="size-8 p-0 rounded-xl text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setActiveEditItem(null);
                    setEditingSection("volunteering");
                  }}
                  aria-label="Adicionar Voluntariado"
                >
                  <Plus className="size-4" />
                </Button>
              )}
            </div>

            {volunteeringList.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                Nenhuma experiência de voluntariado cadastrada.
              </p>
            ) : (
              <div className="space-y-6 divide-y divide-border/40">
                {visibleVolunteering.map((vol: any, index: number) => (
                  <div key={vol.id || index} className={cn("space-y-2", index > 0 && "pt-6")}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3.5">
                        <div className="size-12 rounded-2xl bg-muted/50 flex-shrink-0 flex items-center justify-center text-muted-foreground">
                          <HeartHandshake className="size-6 text-rose-500" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-base font-bold text-foreground leading-snug">
                            {vol.role}
                          </h3>
                          <p className="text-xs text-foreground/80 font-medium">{vol.organization}</p>
                          <p className="text-xs text-muted-foreground">
                            {vol.start_date} – {vol.is_current ? "o momento" : vol.end_date}
                          </p>
                          {vol.cause && (
                            <Badge variant="secondary" className="text-[10px] px-2 py-0.5 rounded-lg bg-muted/60 font-semibold">
                              {vol.cause}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {isOwner && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="size-7 p-0 rounded-lg text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            setActiveEditItem(vol);
                            setEditingSection("volunteering");
                          }}
                          aria-label="Editar Voluntariado"
                        >
                          <Edit3 className="size-3.5" />
                        </Button>
                      )}
                    </div>

                    {vol.description && (
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed pl-15 whitespace-pre-line">
                        {vol.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── 7. Seção Causas ── */}
          <div className="pt-8 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground tracking-tight">Causas</h2>
              {isOwner && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="size-8 p-0 rounded-xl text-muted-foreground hover:text-foreground"
                  onClick={() => setEditingSection("causes")}
                  aria-label="Editar Causas"
                >
                  <Edit3 className="size-4" />
                </Button>
              )}
            </div>

            {causes.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                Nenhuma causa social selecionada.
              </p>
            ) : (
              <p className="text-xs sm:text-sm text-foreground/90 font-medium leading-relaxed">
                {causes.join(" • ")}
              </p>
            )}
          </div>

          {/* ── 8. Seção Idiomas ── */}
          <div className="pt-8 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground tracking-tight">Idiomas</h2>
              {isOwner && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="size-8 p-0 rounded-xl text-muted-foreground hover:text-foreground"
                  onClick={() => setEditingSection("languages")}
                  aria-label="Editar Idiomas"
                >
                  <Edit3 className="size-4" />
                </Button>
              )}
            </div>

            {languagesList.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                Português (Nativo ou Bilíngue)
              </p>
            ) : (
              <div className="space-y-3 divide-y divide-border/40">
                {languagesList.map((lang: any, index: number) => (
                  <div key={index} className={cn("flex items-center justify-between", index > 0 && "pt-3")}>
                    <div>
                      <h4 className="text-sm font-bold text-foreground">{lang.language}</h4>
                      <p className="text-xs text-muted-foreground">{lang.proficiency}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Painel Privado de Métricas do Criador (Apenas Titular da Conta) ── */}
      {isOwner && activeMode === "social" && (
        <CreatorAnalyticsCard
          stats={stats}
          followersCount={followersCount}
          postsCount={posts.length}
        />
      )}

      {/* ── Bloco 3: Perfil Social & Gestão de Atividades Estilo Instagram ── */}
      {activeMode === "social" && (
        <div className="space-y-6">
          {/* Navegação de Abas do Perfil Social */}
          <div className="flex items-center justify-between border-b border-border/40 pb-2">
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setSocialTab("posts")}
                className={cn(
                  "px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                  socialTab === "posts"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <MessageSquare className="size-3.5" />
                <span>Publicações ({posts.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setSocialTab("media")}
                className={cn(
                  "px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                  socialTab === "media"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Grid className="size-3.5" />
                <span>Fotos & Mídias</span>
              </button>

              {isOwner && (
                <>
                  <button
                    type="button"
                    onClick={() => setSocialTab("saved")}
                    className={cn(
                      "px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                      socialTab === "saved"
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <Tag className="size-3.5" />
                    <span>Salvos</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSocialTab("liked")}
                    className={cn(
                      "px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                      socialTab === "liked"
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <Sparkles className="size-3.5" />
                    <span>Curtidos</span>
                  </button>
                </>
              )}
            </div>

            {/* Alternador de Visualização (Grade 3x3 vs Feed Linear) */}
            {socialTab === "posts" && posts.length > 0 && (
              <div className="hidden sm:flex items-center gap-1 bg-muted/50 p-1 rounded-xl">
                <Button
                  size="sm"
                  variant="ghost"
                  className={cn("size-7 p-0 rounded-lg", postViewMode === "feed" && "bg-background shadow-xs")}
                  onClick={() => setPostViewMode("feed")}
                  aria-label="Modo Feed"
                >
                  <List className="size-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className={cn("size-7 p-0 rounded-lg", postViewMode === "grid" && "bg-background shadow-xs")}
                  onClick={() => setPostViewMode("grid")}
                  aria-label="Modo Grade"
                >
                  <Grid className="size-3.5" />
                </Button>
              </div>
            )}
          </div>

          {/* Conteúdo da Aba: Publicações */}
          {socialTab === "posts" && (
            <div className="space-y-6">
              {posts.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground space-y-3 rounded-3xl bg-card border border-border/40">
                  <MessageSquare className="size-10 mx-auto text-muted-foreground/30" />
                  <p className="text-sm font-medium">Nenhuma publicação compartilhada ainda.</p>
                </div>
              ) : postViewMode === "grid" ? (
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5">
                  {posts.map((p: any) => {
                    const media = p.media_urls?.[0] || p.media_url;
                    return (
                      <div
                        key={p.id}
                        className="aspect-square rounded-xl sm:rounded-2xl bg-muted/40 overflow-hidden relative cursor-pointer group select-none border border-border/20"
                        onClick={() => {
                          if (media) {
                            setSelectedLightboxPost(p);
                            setSelectedLightboxIndex(0);
                          }
                        }}
                      >
                        {media ? (
                          <img
                            src={media}
                            alt="Mídia"
                            className="size-full object-cover group-hover:scale-104 transition-transform duration-300"
                          />
                        ) : (
                          <div className="size-full p-2.5 sm:p-4 flex flex-col justify-between text-xs bg-muted/20">
                            <p className="line-clamp-3 sm:line-clamp-4 font-medium leading-relaxed text-[10px] sm:text-xs text-foreground/90">
                              {p.content || p.content_text}
                            </p>
                            <span className="text-[9px] text-muted-foreground">{formatDate(p.created_at)}</span>
                          </div>
                        )}

                        {/* Hover Overlay com Curtidas e Comentários (Instagram Style) */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 sm:gap-4 text-white font-bold text-xs pointer-events-none">
                          <span className="flex items-center gap-1">
                            <Heart className="size-3.5 sm:size-4 fill-white" />
                            {p.likes_count || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="size-3.5 sm:size-4 fill-white" />
                            {p.comments_count || 0}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-4">
                  {posts.map((p: any) => (
                    <div key={p.id} className="p-4 sm:p-6 rounded-3xl bg-card border border-border/40 shadow-2xs">
                      <ThreadsFeedCard
                        post={{
                          id: p.id,
                          author: {
                            id: profile.id,
                            full_name: profile.full_name,
                            username: profile.username,
                            avatar_url: profile.avatar_url,
                            is_verified: profile.is_verified,
                          },
                          content_text: p.content,
                          media_urls: p.media_url ? [p.media_url] : [],
                          created_at: p.created_at,
                          likes_count: p.likes_count || 0,
                          replies_count: p.comments_count || 0,
                        }}
                        onPreviewMedia={(url) => setPreviewMediaUrl(url)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Conteúdo da Aba: Fotos & Mídias */}
          {socialTab === "media" && (
            <div className="space-y-6">
              {posts.filter((p: any) => !!p.media_url).length === 0 ? (
                <div className="py-16 text-center text-muted-foreground space-y-3 rounded-3xl bg-card border border-border/40">
                  <Grid className="size-10 mx-auto text-muted-foreground/30" />
                  <p className="text-sm font-medium">Nenhuma foto ou vídeo compartilhado ainda.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {posts.filter((p: any) => !!p.media_url).map((p: any) => (
                    <div
                      key={p.id}
                      className="aspect-square rounded-2xl bg-muted/40 overflow-hidden relative cursor-pointer group"
                      onClick={() => setPreviewMediaUrl(p.media_url)}
                    >
                      <img src={p.media_url} alt="Galeria" className="size-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Conteúdo da Aba: Salvos (Apenas Proprietário) */}
          {isOwner && socialTab === "saved" && (
            <div className="py-16 text-center text-muted-foreground space-y-3 rounded-3xl bg-card border border-border/40">
              <Tag className="size-10 mx-auto text-muted-foreground/30" />
              <p className="text-sm font-medium">Seus itens salvos aparecerão aqui de forma privada.</p>
            </div>
          )}

          {/* Conteúdo da Aba: Curtidos (Apenas Proprietário) */}
          {isOwner && socialTab === "liked" && (
            <div className="py-16 text-center text-muted-foreground space-y-3 rounded-3xl bg-card border border-border/40">
              <Sparkles className="size-10 mx-auto text-muted-foreground/30" />
              <p className="text-sm font-medium">Publicações que você curtiu na comunidade Wider.</p>
            </div>
          )}
        </div>
      )}

      {/* ── Bloco 4: Perfil Comercial / Vitrines & Desapegos (Quando modo === "comercial") ── */}
      {activeMode === "comercial" && (
        <div className="space-y-6">
          {stores.length > 0 && (
            <div className="pt-8 space-y-6">
              <h2 className="text-lg font-bold text-foreground tracking-tight">Lojas & Espaços Oficiais</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {stores.map((s: any) => (
                  <Link
                    key={s.id}
                    to="/perfil-da-loja"
                    search={{ slug: s.slug }}
                    className="p-4 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-colors flex items-center gap-4 group"
                  >
                    <div className="size-14 rounded-2xl bg-background flex items-center justify-center overflow-hidden flex-shrink-0">
                      {s.logo_url ? (
                        <img src={s.logo_url} alt={s.name} className="size-full object-cover" />
                      ) : (
                        <Store className="size-6 text-primary" />
                      )}
                    </div>
                    <div className="space-y-1 min-w-0 flex-1">
                      <h3 className="text-base font-bold text-foreground truncate group-hover:text-primary transition-colors">
                        {s.name}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate">{s.description || "Loja da rede Wider"}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="pt-8 space-y-6">
            <h2 className="text-lg font-bold text-foreground tracking-tight">Classificados & Desapegos</h2>
            {classifieds.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground space-y-2">
                <ShoppingBag className="size-8 mx-auto text-muted-foreground/40" />
                <p className="text-sm">Nenhum anúncio ativo no momento.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {classifieds.map((item: any) => (
                  <Link
                    key={item.id}
                    to="/classificados/$id"
                    params={{ id: item.id }}
                    className="group rounded-2xl bg-muted/20 hover:bg-muted/40 transition-all overflow-hidden flex flex-col"
                  >
                    <div className="aspect-[4/3] bg-muted/40 relative overflow-hidden">
                      {item.images?.[0] ? (
                        <img
                          src={item.images[0]}
                          alt={item.title}
                          className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="size-full flex items-center justify-center text-muted-foreground/40">
                          <ShoppingBag className="size-8" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2 px-2.5 py-1 rounded-xl bg-background/90 backdrop-blur-md text-xs font-extrabold text-foreground">
                        {formatMoney(item.price)}
                      </div>
                    </div>
                    <div className="p-4 space-y-1">
                      <h4 className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-xs text-muted-foreground truncate">{item.category || "Classificado"}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modais de Edição In-Place ── */}
      {isOwner && (
        <>
          {/* Modal Disponível Para */}
          <AvailabilityEditModal
            open={editingSection === "availability"}
            onOpenChange={(op) => !op && setEditingSection(null)}
            initialData={availability}
            onSave={(newAvail) => {
              saveResumeChanges({ ...resumeData, availability: newAvail });
            }}
            isSaving={isSavingResume}
          />

          {/* Modal Sobre */}
          <AboutEditModal
            open={editingSection === "about"}
            onOpenChange={(op) => !op && setEditingSection(null)}
            initialHeadline={profile.headline || ""}
            initialSummary={aboutSummary}
            onSave={({ headline, summary }) => {
              saveResumeChanges({ ...resumeData, headline, summary });
            }}
            isSaving={isSavingResume}
          />

          {/* Modal Experiência */}
          <ExperienceEditModal
            open={editingSection === "experience"}
            onOpenChange={(op) => {
              if (!op) {
                setEditingSection(null);
                setActiveEditItem(null);
              }
            }}
            item={activeEditItem}
            onSave={(itemToSave, isDelete) => {
              let updatedExps = [...experiences];
              if (isDelete && activeEditItem) {
                updatedExps = updatedExps.filter((e) => e.id !== activeEditItem.id);
              } else if (activeEditItem) {
                updatedExps = updatedExps.map((e) => (e.id === activeEditItem.id ? itemToSave : e));
              } else {
                updatedExps = [itemToSave, ...updatedExps];
              }
              saveResumeChanges({ ...resumeData, experiences: updatedExps });
            }}
            isSaving={isSavingResume}
          />

          {/* Modal Formação Acadêmica */}
          <EducationEditModal
            open={editingSection === "education"}
            onOpenChange={(op) => {
              if (!op) {
                setEditingSection(null);
                setActiveEditItem(null);
              }
            }}
            item={activeEditItem}
            onSave={(itemToSave, isDelete) => {
              let updated = [...educations];
              if (isDelete && activeEditItem) {
                updated = updated.filter((e) => e.id !== activeEditItem.id);
              } else if (activeEditItem) {
                updated = updated.map((e) => (e.id === activeEditItem.id ? itemToSave : e));
              } else {
                updated = [itemToSave, ...updated];
              }
              saveResumeChanges({ ...resumeData, educations: updated });
            }}
            isSaving={isSavingResume}
          />

          {/* Modal Licenças e Certificados */}
          <CertificationEditModal
            open={editingSection === "certification"}
            onOpenChange={(op) => {
              if (!op) {
                setEditingSection(null);
                setActiveEditItem(null);
              }
            }}
            item={activeEditItem}
            onSave={(itemToSave, isDelete) => {
              let updated = [...certifications];
              if (isDelete && activeEditItem) {
                updated = updated.filter((e) => e.id !== activeEditItem.id);
              } else if (activeEditItem) {
                updated = updated.map((e) => (e.id === activeEditItem.id ? itemToSave : e));
              } else {
                updated = [itemToSave, ...updated];
              }
              saveResumeChanges({ ...resumeData, certifications: updated });
            }}
            isSaving={isSavingResume}
          />

          {/* Modal Projetos */}
          <ProjectEditModal
            open={editingSection === "project"}
            onOpenChange={(op) => {
              if (!op) {
                setEditingSection(null);
                setActiveEditItem(null);
              }
            }}
            item={activeEditItem}
            onSave={(itemToSave, isDelete) => {
              let updated = [...projects];
              if (isDelete && activeEditItem) {
                updated = updated.filter((e) => e.id !== activeEditItem.id);
              } else if (activeEditItem) {
                updated = updated.map((e) => (e.id === activeEditItem.id ? itemToSave : e));
              } else {
                updated = [itemToSave, ...updated];
              }
              saveResumeChanges({ ...resumeData, projects: updated });
            }}
            isSaving={isSavingResume}
          />

          {/* Modal Voluntariado */}
          <VolunteeringEditModal
            open={editingSection === "volunteering"}
            onOpenChange={(op) => {
              if (!op) {
                setEditingSection(null);
                setActiveEditItem(null);
              }
            }}
            item={activeEditItem}
            onSave={(itemToSave, isDelete) => {
              let updated = [...volunteeringList];
              if (isDelete && activeEditItem) {
                updated = updated.filter((e) => e.id !== activeEditItem.id);
              } else if (activeEditItem) {
                updated = updated.map((e) => (e.id === activeEditItem.id ? itemToSave : e));
              } else {
                updated = [itemToSave, ...updated];
              }
              saveResumeChanges({ ...resumeData, volunteering: updated });
            }}
            isSaving={isSavingResume}
          />

          {/* Modal Causas Sociais */}
          <CausesEditModal
            open={editingSection === "causes"}
            onOpenChange={(op) => !op && setEditingSection(null)}
            selectedCauses={causes}
            onSave={(newCauses) => {
              saveResumeChanges({ ...resumeData, causes: newCauses });
            }}
            isSaving={isSavingResume}
          />

          {/* Modal Idiomas */}
          <LanguagesEditModal
            open={editingSection === "languages"}
            onOpenChange={(op) => !op && setEditingSection(null)}
            initialLanguages={languagesList}
            onSave={(newLanguages) => {
              saveResumeChanges({ ...resumeData, languages: newLanguages });
            }}
            isSaving={isSavingResume}
          />
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTES MODAIS DE EDIÇÃO RÁPIDA (In-Place Edit SheetPages)
// ─────────────────────────────────────────────────────────────────────────────

function AvailabilityEditModal({
  open,
  onOpenChange,
  initialData,
  onSave,
  isSaving,
}: {
  open: boolean;
  onOpenChange: (op: boolean) => void;
  initialData: any;
  onSave: (data: any) => void;
  isSaving: boolean;
}) {
  const [openToWork, setOpenToWork] = useState(Boolean(initialData?.open_to_work?.active));
  const [rolesStr, setRolesStr] = useState(initialData?.open_to_work?.roles?.join(", ") || "");
  const [hiring, setHiring] = useState(Boolean(initialData?.hiring?.active));
  const [hiringRolesStr, setHiringRolesStr] = useState(initialData?.hiring?.roles?.join(", ") || "");
  const [providingServices, setProvidingServices] = useState(Boolean(initialData?.providing_services?.active));
  const [servicesStr, setServicesStr] = useState(initialData?.providing_services?.services?.join(", ") || "");
  const [volunteering, setVolunteering] = useState(Boolean(initialData?.volunteering?.active));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      open_to_work: {
        active: openToWork,
        roles: rolesStr.split(",").map((s: string) => s.trim()).filter(Boolean),
      },
      hiring: {
        active: hiring,
        roles: hiringRolesStr.split(",").map((s: string) => s.trim()).filter(Boolean),
      },
      providing_services: {
        active: providingServices,
        services: servicesStr.split(",").map((s: string) => s.trim()).filter(Boolean),
      },
      volunteering: {
        active: volunteering,
      },
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl md:max-w-2xl p-0 flex flex-col h-full bg-background overflow-hidden border-l border-border">
        <div className="p-6 pb-4 border-b border-border/40 shrink-0 flex items-center justify-between">
          <SheetTitle className="text-xl font-extrabold text-foreground">Disponibilidade de Perfil</SheetTitle>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-none">
            {/* Opção 1: Open To Work */}
            <div className="p-4 rounded-2xl bg-muted/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Briefcase className="size-4 text-emerald-500" />
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Encontrar um novo emprego (#OpenToWork)</h4>
                    
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={openToWork}
                  onChange={(e) => setOpenToWork(e.target.checked)}
                  className="size-5 rounded-lg accent-primary cursor-pointer"
                />
              </div>
              {openToWork && (
                <div className="space-y-1.5 pt-2">
                  <Label className="text-xs font-semibold">Cargos de interesse</Label>
                  <Input
                    value={rolesStr}
                    onChange={(e) => setRolesStr(e.target.value)}
                    placeholder="Ex: Gerente de Loja, Vendedora, Desenvolvedor"
                    className="h-10 rounded-xl"
                  />
                </div>
              )}
            </div>

            {/* Opção 2: Hiring */}
            <div className="p-4 rounded-2xl bg-muted/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <UserPlus className="size-4 text-info" />
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Contratar talentos (#Hiring)</h4>
                    
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={hiring}
                  onChange={(e) => setHiring(e.target.checked)}
                  className="size-5 rounded-lg accent-primary cursor-pointer"
                />
              </div>
              {hiring && (
                <div className="space-y-1.5 pt-2">
                  <Label className="text-xs font-semibold">Vagas abertas</Label>
                  <Input
                    value={hiringRolesStr}
                    onChange={(e) => setHiringRolesStr(e.target.value)}
                    placeholder="Ex: Barista, Atendente, Entregador"
                    className="h-10 rounded-xl"
                  />
                </div>
              )}
            </div>

            {/* Opção 3: Prestando Serviços */}
            <div className="p-4 rounded-2xl bg-muted/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="size-4 text-violet-500" />
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Prestar serviços autônomos</h4>
                    <p className="text-xs text-muted-foreground">Destaque sua prestação de serviços para novos clientes</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={providingServices}
                  onChange={(e) => setProvidingServices(e.target.checked)}
                  className="size-5 rounded-lg accent-primary cursor-pointer"
                />
              </div>
              {providingServices && (
                <div className="space-y-1.5 pt-2">
                  <Label className="text-xs font-semibold">Serviços oferecidos</Label>
                  <Input
                    value={servicesStr}
                    onChange={(e) => setServicesStr(e.target.value)}
                    placeholder="Ex: Fotografia, Social Media, Reformas"
                    className="h-10 rounded-xl"
                  />
                </div>
              )}
            </div>

            {/* Opção 4: Voluntariado */}
            <div className="p-4 rounded-2xl bg-muted/30 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <HeartHandshake className="size-4 text-rose-500" />
                <div>
                  <h4 className="text-sm font-bold text-foreground">Voluntariado ativo</h4>
                  
                </div>
              </div>
              <input
                type="checkbox"
                checked={volunteering}
                onChange={(e) => setVolunteering(e.target.checked)}
                className="size-5 rounded-lg accent-primary cursor-pointer"
              />
            </div>
          </div>

          <div className="p-5 border-t border-border/40 shrink-0 bg-background/95 backdrop-blur-sm flex items-center justify-end gap-3">
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="rounded-xl font-bold bg-primary text-primary-foreground" disabled={isSaving}>
              {isSaving ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function AboutEditModal({
  open,
  onOpenChange,
  initialHeadline,
  initialSummary,
  onSave,
  isSaving,
}: {
  open: boolean;
  onOpenChange: (op: boolean) => void;
  initialHeadline: string;
  initialSummary: string;
  onSave: (data: { headline: string; summary: string }) => void;
  isSaving: boolean;
}) {
  const [headline, setHeadline] = useState(initialHeadline);
  const [summary, setSummary] = useState(initialSummary);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ headline, summary });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl md:max-w-2xl p-0 flex flex-col h-full bg-background overflow-hidden border-l border-border">
        <div className="p-6 pb-4 border-b border-border/40 shrink-0 flex items-center justify-between">
          <SheetTitle className="text-xl font-extrabold text-foreground">Sobre & Título</SheetTitle>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-none">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Título / Headline</Label>
              <Input
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="Ex: Gerente Administrativo • Apaixonado por Comunidade"
                className="h-10 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Resumo (Sobre)</Label>
              <Textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={8}
                placeholder="Descreva suas experiências, realizações e projetos..."
                className="rounded-2xl text-xs sm:text-sm"
              />
            </div>
          </div>

          <div className="p-5 border-t border-border/40 shrink-0 bg-background/95 backdrop-blur-sm flex items-center justify-end gap-3">
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="rounded-xl font-bold bg-primary text-primary-foreground" disabled={isSaving}>
              {isSaving ? "Salvando..." : "Salvar Resumo"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function ExperienceEditModal({
  open,
  onOpenChange,
  item,
  onSave,
  isSaving,
}: {
  open: boolean;
  onOpenChange: (op: boolean) => void;
  item: any;
  onSave: (item: any, isDelete?: boolean) => void;
  isSaving: boolean;
}) {
  const [title, setTitle] = useState(item?.title || "");
  const [company, setCompany] = useState(item?.company || "");
  const [storeId, setStoreId] = useState(item?.store_id || "");
  const [storeLogo, setStoreLogo] = useState(item?.store_logo || "");
  const [employmentType, setEmploymentType] = useState(item?.employment_type || "Tempo integral");
  const [location, setLocation] = useState(item?.location || "");
  const [locationType, setLocationType] = useState(item?.location_type || "No local");
  const [isCurrent, setIsCurrent] = useState(item?.is_current !== false);
  const [startDate, setStartDate] = useState(item?.start_date || "");
  const [endDate, setEndDate] = useState(item?.end_date || "");
  const [description, setDescription] = useState(item?.description || "");
  const [skillsStr, setSkillsStr] = useState(item?.skills?.join(", ") || "");
  const [mediaUrls, setMediaUrls] = useState<string[]>(item?.media_urls || []);
  const [isUploading, setIsUploading] = useState(false);

  // Autocomplete de lojas Wider
  const [companySuggestions, setCompanySuggestions] = useState<any[]>([]);

  const handleCompanyChange = async (val: string) => {
    setCompany(val);
    if (val.trim().length >= 2) {
      try {
        const list = await searchStoresForCompanyAutocomplete({ data: { query: val } });
        setCompanySuggestions(list || []);
      } catch {
        setCompanySuggestions([]);
      }
    } else {
      setCompanySuggestions([]);
    }
  };

  const handleSelectStore = (s: any) => {
    setCompany(s.name);
    setStoreId(s.id);
    setStoreLogo(s.logo_url || "");
    if (s.city || s.state) {
      setLocation([s.city, s.state].filter(Boolean).join(", "));
    }
    setCompanySuggestions([]);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const res = await getPostMediaSignedUrl({
          data: { fileName: file.name, contentType: file.type },
        });
        await fetch(res.signedUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });
        setMediaUrls((prev) => [...prev, res.publicUrl]);
      }
      toast.success("Mídia anexada com sucesso!");
    } catch {
      toast.error("Erro ao enviar anexo.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !company.trim()) {
      toast.error("Título e Empresa são campos obrigatórios.");
      return;
    }
    onSave({
      id: item?.id || "exp-" + Date.now(),
      title,
      company,
      store_id: storeId || undefined,
      store_logo: storeLogo || undefined,
      employment_type: employmentType,
      location,
      location_type: locationType,
      is_current: isCurrent,
      start_date: startDate,
      end_date: isCurrent ? undefined : endDate,
      description,
      skills: skillsStr.split(",").map((s: string) => s.trim()).filter(Boolean),
      media_urls: mediaUrls,
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl md:max-w-2xl p-0 flex flex-col h-full bg-background overflow-hidden border-l border-border">
        <div className="p-6 pb-4 border-b border-border/40 shrink-0 flex items-center justify-between">
          <SheetTitle className="text-xl font-extrabold text-foreground">
            {item ? "Editar Experiência" : "Adicionar Experiência"}
          </SheetTitle>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-none">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Título do Cargo *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Gerente de Atendimento"
                className="h-10 rounded-xl"
                required
              />
            </div>

            <div className="space-y-1.5 relative">
              <Label className="text-xs font-semibold">Empresa / Loja *</Label>
              <Input
                value={company}
                onChange={(e) => handleCompanyChange(e.target.value)}
                placeholder="Digite para buscar empresas no Wider..."
                className="h-10 rounded-xl"
                required
              />
              {companySuggestions.length > 0 && (
                <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-card rounded-2xl border border-border/80 p-2 space-y-1 max-h-48 overflow-y-auto">
                  <p className="text-[10px] font-bold text-muted-foreground px-2 py-0.5">
                    Lojas do Ecossistema Wider:
                  </p>
                  {companySuggestions.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center gap-2 p-2 rounded-xl hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleSelectStore(s)}
                    >
                      <div className="size-6 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                        {s.logo_url ? <img src={s.logo_url} className="size-full object-cover" /> : <Store className="size-3 text-primary" />}
                      </div>
                      <span className="text-xs font-bold text-foreground">{s.name}</span>
                      <Badge variant="secondary" className="text-[9px] ml-auto">
                        Wider
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Tipo de Emprego</Label>
                <Select value={employmentType} onValueChange={setEmploymentType}>
                  <SelectTrigger className="h-10 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="Tempo integral">Tempo integral</SelectItem>
                    <SelectItem value="Meio período">Meio período</SelectItem>
                    <SelectItem value="Autônomo">Autônomo</SelectItem>
                    <SelectItem value="PJ / Contrato">PJ / Contrato</SelectItem>
                    <SelectItem value="Estágio">Estágio</SelectItem>
                    <SelectItem value="Trainee">Trainee</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Modelo de Trabalho</Label>
                <Select value={locationType} onValueChange={setLocationType}>
                  <SelectTrigger className="h-10 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="No local">Presencial (No local)</SelectItem>
                    <SelectItem value="Híbrido">Híbrido</SelectItem>
                    <SelectItem value="Remoto">Remoto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Localidade</Label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ex: Chapecó, Santa Catarina, Brasil"
                className="h-10 rounded-xl"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="is_current_exp"
                checked={isCurrent}
                onChange={(e) => setIsCurrent(e.target.checked)}
                className="size-4 rounded accent-primary cursor-pointer"
              />
              <Label htmlFor="is_current_exp" className="text-xs font-semibold cursor-pointer">
                Trabalho atualmente neste cargo
              </Label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Data de Início</Label>
                <Input
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  placeholder="Ex: jan de 2024"
                  className="h-10 rounded-xl"
                />
              </div>
              {!isCurrent && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Data de Término</Label>
                  <Input
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    placeholder="Ex: mai de 2026"
                    className="h-10 rounded-xl"
                  />
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Descrição da Função</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Descreva suas responsabilidades, conquistas e projetos..."
                className="rounded-2xl text-xs sm:text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Competências Utilizadas (separadas por vírgula)</Label>
              <Input
                value={skillsStr}
                onChange={(e) => setSkillsStr(e.target.value)}
                placeholder="Ex: Vendas, Gestão de Equipe, Atendimento"
                className="h-10 rounded-xl"
              />
            </div>

            {/* Mídias & Anexos */}
            <div className="space-y-2 pt-1">
              <Label className="text-xs font-semibold">Mídias & Anexos (Fotos, Certificados, PDFs)</Label>
              <div className="flex flex-wrap gap-2">
                {mediaUrls.map((url, idx) => (
                  <div key={idx} className="relative size-16 rounded-xl overflow-hidden bg-muted group">
                    <img src={url} className="size-full object-cover" />
                    <button
                      type="button"
                      className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      onClick={() => setMediaUrls(mediaUrls.filter((_, i) => i !== idx))}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
                <label className="size-16 rounded-xl border border-dashed border-border flex flex-col items-center justify-center text-muted-foreground hover:bg-muted/40 cursor-pointer transition-colors">
                  <Upload className="size-4" />
                  <span className="text-[9px] font-bold mt-1">Subir Mídia</span>
                  <input type="file" multiple accept="image/*,.pdf" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                </label>
              </div>
            </div>
          </div>

          <div className="p-5 border-t border-border/40 shrink-0 bg-background/95 backdrop-blur-sm flex items-center justify-between gap-3">
            {item ? (
              <Button
                type="button"
                variant="destructive"
                className="rounded-xl"
                onClick={() => onSave(item, true)}
                disabled={isSaving}
              >
                Excluir
              </Button>
            ) : <div />}
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="rounded-xl font-bold bg-primary text-primary-foreground" disabled={isSaving || isUploading}>
                {isSaving ? "Salvando..." : "Salvar Experiência"}
              </Button>
            </div>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function EducationEditModal({
  open,
  onOpenChange,
  item,
  onSave,
  isSaving,
}: {
  open: boolean;
  onOpenChange: (op: boolean) => void;
  item: any;
  onSave: (item: any, isDelete?: boolean) => void;
  isSaving: boolean;
}) {
  const [school, setSchool] = useState(item?.school || "");
  const [degree, setDegree] = useState(item?.degree || "");
  const [fieldOfStudy, setFieldOfStudy] = useState(item?.field_of_study || "");
  const [startDate, setStartDate] = useState(item?.start_date || "");
  const [endDate, setEndDate] = useState(item?.end_date || "");
  const [description, setDescription] = useState(item?.description || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!school.trim()) {
      toast.error("Instituição de Ensino é obrigatória.");
      return;
    }
    onSave({
      id: item?.id || "edu-" + Date.now(),
      school,
      degree,
      field_of_study: fieldOfStudy,
      start_date: startDate,
      end_date: endDate,
      description,
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl md:max-w-2xl p-0 flex flex-col h-full bg-background overflow-hidden border-l border-border">
        <div className="p-6 pb-4 border-b border-border/40 shrink-0 flex items-center justify-between">
          <SheetTitle className="text-xl font-extrabold text-foreground">
            {item ? "Editar Formação" : "Adicionar Formação Acadêmica"}
          </SheetTitle>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-none">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Instituição de Ensino *</Label>
              <Input
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                placeholder="Ex: UFFS - Universidade Federal da Fronteira Sul"
                className="h-10 rounded-xl"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Grau / Diploma</Label>
              <Input
                value={degree}
                onChange={(e) => setDegree(e.target.value)}
                placeholder="Ex: Bacharelado, Pós-graduação, Técnico"
                className="h-10 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Área de Estudo</Label>
              <Input
                value={fieldOfStudy}
                onChange={(e) => setFieldOfStudy(e.target.value)}
                placeholder="Ex: Administração, Ciência da Computação"
                className="h-10 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Início</Label>
                <Input
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  placeholder="Ex: 2018"
                  className="h-10 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Término (ou previsto)</Label>
                <Input
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  placeholder="Ex: 2022"
                  className="h-10 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Atividades e Sociedades</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Projetos de extensão, monitorias..."
                className="rounded-2xl text-xs sm:text-sm"
              />
            </div>
          </div>

          <div className="p-5 border-t border-border/40 shrink-0 bg-background/95 backdrop-blur-sm flex items-center justify-between gap-3">
            {item ? (
              <Button
                type="button"
                variant="destructive"
                className="rounded-xl"
                onClick={() => onSave(item, true)}
                disabled={isSaving}
              >
                Excluir
              </Button>
            ) : <div />}
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="rounded-xl font-bold bg-primary text-primary-foreground" disabled={isSaving}>
                {isSaving ? "Salvando..." : "Salvar Formação"}
              </Button>
            </div>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function CertificationEditModal({
  open,
  onOpenChange,
  item,
  onSave,
  isSaving,
}: {
  open: boolean;
  onOpenChange: (op: boolean) => void;
  item: any;
  onSave: (item: any, isDelete?: boolean) => void;
  isSaving: boolean;
}) {
  const [name, setName] = useState(item?.name || "");
  const [issuer, setIssuer] = useState(item?.issuer || "");
  const [issueDate, setIssueDate] = useState(item?.issue_date || "");
  const [credentialUrl, setCredentialUrl] = useState(item?.credential_url || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !issuer.trim()) {
      toast.error("Nome e Órgão Emissor são obrigatórios.");
      return;
    }
    onSave({
      id: item?.id || "cert-" + Date.now(),
      name,
      issuer,
      issue_date: issueDate,
      credential_url: credentialUrl,
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl md:max-w-2xl p-0 flex flex-col h-full bg-background overflow-hidden border-l border-border">
        <div className="p-6 pb-4 border-b border-border/40 shrink-0 flex items-center justify-between">
          <SheetTitle className="text-xl font-extrabold text-foreground">
            {item ? "Editar Certificação" : "Adicionar Certificação"}
          </SheetTitle>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-none">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Nome da Certificação *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Gestão de RH, UX Design"
                className="h-10 rounded-xl"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Organização Emissora *</Label>
              <Input
                value={issuer}
                onChange={(e) => setIssuer(e.target.value)}
                placeholder="Ex: EBAC, SENAC, Google"
                className="h-10 rounded-xl"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Data de Emissão</Label>
              <Input
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                placeholder="Ex: fev de 2021"
                className="h-10 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">URL da Credencial / Certificado</Label>
              <Input
                value={credentialUrl}
                onChange={(e) => setCredentialUrl(e.target.value)}
                placeholder="https://..."
                className="h-10 rounded-xl"
              />
            </div>
          </div>

          <div className="p-5 border-t border-border/40 shrink-0 bg-background/95 backdrop-blur-sm flex items-center justify-between gap-3">
            {item ? (
              <Button
                type="button"
                variant="destructive"
                className="rounded-xl"
                onClick={() => onSave(item, true)}
                disabled={isSaving}
              >
                Excluir
              </Button>
            ) : <div />}
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="rounded-xl font-bold bg-primary text-primary-foreground" disabled={isSaving}>
                {isSaving ? "Salvando..." : "Salvar Certificado"}
              </Button>
            </div>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function ProjectEditModal({
  open,
  onOpenChange,
  item,
  onSave,
  isSaving,
}: {
  open: boolean;
  onOpenChange: (op: boolean) => void;
  item: any;
  onSave: (item: any, isDelete?: boolean) => void;
  isSaving: boolean;
}) {
  const [title, setTitle] = useState(item?.title || "");
  const [associatedWith, setAssociatedWith] = useState(item?.associated_with || "");
  const [projectUrl, setProjectUrl] = useState(item?.project_url || "");
  const [startDate, setStartDate] = useState(item?.start_date || "");
  const [endDate, setEndDate] = useState(item?.end_date || "");
  const [isCurrent, setIsCurrent] = useState(item?.is_current !== false);
  const [description, setDescription] = useState(item?.description || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Nome do projeto é obrigatório.");
      return;
    }
    onSave({
      id: item?.id || "proj-" + Date.now(),
      title,
      associated_with: associatedWith,
      project_url: projectUrl,
      start_date: startDate,
      end_date: isCurrent ? undefined : endDate,
      is_current: isCurrent,
      description,
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl md:max-w-2xl p-0 flex flex-col h-full bg-background overflow-hidden border-l border-border">
        <div className="p-6 pb-4 border-b border-border/40 shrink-0 flex items-center justify-between">
          <SheetTitle className="text-xl font-extrabold text-foreground">
            {item ? "Editar Projeto" : "Adicionar Projeto"}
          </SheetTitle>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-none">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Nome do Projeto *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Case Ebis"
                className="h-10 rounded-xl"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Associado à Empresa / Cliente</Label>
              <Input
                value={associatedWith}
                onChange={(e) => setAssociatedWith(e.target.value)}
                placeholder="Ex: Decibal Alimentos"
                className="h-10 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Link do Projeto</Label>
              <Input
                value={projectUrl}
                onChange={(e) => setProjectUrl(e.target.value)}
                placeholder="https://..."
                className="h-10 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Início</Label>
                <Input
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  placeholder="Ex: mai de 2017"
                  className="h-10 rounded-xl"
                />
              </div>
              {!isCurrent && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Término</Label>
                  <Input
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    placeholder="Ex: dez de 2022"
                    className="h-10 rounded-xl"
                  />
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Descrição</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Descreva o objetivo e resultados do projeto..."
                className="rounded-2xl text-xs sm:text-sm"
              />
            </div>
          </div>

          <div className="p-5 border-t border-border/40 shrink-0 bg-background/95 backdrop-blur-sm flex items-center justify-between gap-3">
            {item ? (
              <Button
                type="button"
                variant="destructive"
                className="rounded-xl"
                onClick={() => onSave(item, true)}
                disabled={isSaving}
              >
                Excluir
              </Button>
            ) : <div />}
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="rounded-xl font-bold bg-primary text-primary-foreground" disabled={isSaving}>
                {isSaving ? "Salvando..." : "Salvar Projeto"}
              </Button>
            </div>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function VolunteeringEditModal({
  open,
  onOpenChange,
  item,
  onSave,
  isSaving,
}: {
  open: boolean;
  onOpenChange: (op: boolean) => void;
  item: any;
  onSave: (item: any, isDelete?: boolean) => void;
  isSaving: boolean;
}) {
  const [role, setRole] = useState(item?.role || "");
  const [organization, setOrganization] = useState(item?.organization || "");
  const [cause, setCause] = useState(item?.cause || "Serviço social");
  const [startDate, setStartDate] = useState(item?.start_date || "");
  const [endDate, setEndDate] = useState(item?.end_date || "");
  const [isCurrent, setIsCurrent] = useState(item?.is_current !== false);
  const [description, setDescription] = useState(item?.description || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!role.trim() || !organization.trim()) {
      toast.error("Função e Organização são obrigatórios.");
      return;
    }
    onSave({
      id: item?.id || "vol-" + Date.now(),
      role,
      organization,
      cause,
      start_date: startDate,
      end_date: isCurrent ? undefined : endDate,
      is_current: isCurrent,
      description,
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl md:max-w-2xl p-0 flex flex-col h-full bg-background overflow-hidden border-l border-border">
        <div className="p-6 pb-4 border-b border-border/40 shrink-0 flex items-center justify-between">
          <SheetTitle className="text-xl font-extrabold text-foreground">
            {item ? "Editar Voluntariado" : "Adicionar Voluntariado"}
          </SheetTitle>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-none">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Função / Papel *</Label>
              <Input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Ex: Voluntário de Apoio"
                className="h-10 rounded-xl"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Organização / Entidade *</Label>
              <Input
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="Ex: ONG Esperança"
                className="h-10 rounded-xl"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Causa Social</Label>
              <Select value={cause} onValueChange={setCause}>
                <SelectTrigger className="h-10 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl max-h-48 overflow-y-auto">
                  {SOCIAL_CAUSES_LIST.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Início</Label>
                <Input
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  placeholder="Ex: out de 2018"
                  className="h-10 rounded-xl"
                />
              </div>
              {!isCurrent && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Término</Label>
                  <Input
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    placeholder="Ex: dez de 2023"
                    className="h-10 rounded-xl"
                  />
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Descrição</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Descreva seu impacto e atividades..."
                className="rounded-2xl text-xs sm:text-sm"
              />
            </div>
          </div>

          <div className="p-5 border-t border-border/40 shrink-0 bg-background/95 backdrop-blur-sm flex items-center justify-between gap-3">
            {item ? (
              <Button
                type="button"
                variant="destructive"
                className="rounded-xl"
                onClick={() => onSave(item, true)}
                disabled={isSaving}
              >
                Excluir
              </Button>
            ) : <div />}
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="rounded-xl font-bold bg-primary text-primary-foreground" disabled={isSaving}>
                {isSaving ? "Salvando..." : "Salvar Voluntariado"}
              </Button>
            </div>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function CausesEditModal({
  open,
  onOpenChange,
  selectedCauses,
  onSave,
  isSaving,
}: {
  open: boolean;
  onOpenChange: (op: boolean) => void;
  selectedCauses: string[];
  onSave: (causes: string[]) => void;
  isSaving: boolean;
}) {
  const [causes, setCauses] = useState<string[]>(selectedCauses || []);

  const toggleCause = (cause: string) => {
    if (causes.includes(cause)) {
      setCauses(causes.filter((c) => c !== cause));
    } else {
      setCauses([...causes, cause]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(causes);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl md:max-w-2xl p-0 flex flex-col h-full bg-background overflow-hidden border-l border-border">
        <div className="p-6 pb-4 border-b border-border/40 shrink-0 flex items-center justify-between">
          <SheetTitle className="text-xl font-extrabold text-foreground">Causas Sociais</SheetTitle>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 scrollbar-none">
            <div className="flex flex-wrap gap-2">
              {SOCIAL_CAUSES_LIST.map((cause) => {
                const isSelected = causes.includes(cause);
                return (
                  <button
                    type="button"
                    key={cause}
                    onClick={() => toggleCause(cause)}
                    className={cn(
                      "px-4 py-2.5 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer",
                      isSelected
                        ? "bg-primary text-primary-foreground font-bold"
                        : "bg-muted/40 text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                    )}
                  >
                    {isSelected ? "✓ " : "+ "}
                    {cause}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-5 border-t border-border/40 shrink-0 bg-background/95 backdrop-blur-sm flex items-center justify-end gap-3">
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="rounded-xl font-bold bg-primary text-primary-foreground" disabled={isSaving}>
              {isSaving ? "Salvando..." : "Salvar Causas"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function LanguagesEditModal({
  open,
  onOpenChange,
  initialLanguages,
  onSave,
  isSaving,
}: {
  open: boolean;
  onOpenChange: (op: boolean) => void;
  initialLanguages: any[];
  onSave: (languages: any[]) => void;
  isSaving: boolean;
}) {
  const [list, setList] = useState<any[]>(
    initialLanguages.length > 0
      ? initialLanguages
      : [{ language: "Português", proficiency: "Nativo ou bilíngue" }]
  );

  const addLanguage = () => {
    setList([...list, { language: "", proficiency: "Básico" }]);
  };

  const removeLanguage = (index: number) => {
    setList(list.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, val: string) => {
    const updated = [...list];
    updated[index] = { ...updated[index], [field]: val };
    setList(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(list.filter((item) => item.language.trim().length > 0));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl md:max-w-2xl p-0 flex flex-col h-full bg-background overflow-hidden border-l border-border">
        <div className="p-6 pb-4 border-b border-border/40 shrink-0 flex items-center justify-between">
          <SheetTitle className="text-xl font-extrabold text-foreground">Idiomas</SheetTitle>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-none">
            <div className="space-y-3">
              {list.map((item, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-muted/30 space-y-2 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground">Idioma #{idx + 1}</span>
                    {list.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLanguage(idx)}
                        className="text-muted-foreground hover:text-destructive text-xs cursor-pointer"
                      >
                        Remover
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={item.language}
                      onChange={(e) => updateItem(idx, "language", e.target.value)}
                      placeholder="Ex: Inglês, Espanhol"
                      className="h-10 rounded-xl text-xs"
                    />
                    <Select
                      value={item.proficiency}
                      onValueChange={(val) => updateItem(idx, "proficiency", val)}
                    >
                      <SelectTrigger className="h-10 rounded-xl text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl">
                        <SelectItem value="Nativo ou bilíngue">Nativo ou bilíngue</SelectItem>
                        <SelectItem value="Fluente / Avançado">Fluente / Avançado</SelectItem>
                        <SelectItem value="Intermediário">Intermediário</SelectItem>
                        <SelectItem value="Básico">Básico</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full rounded-xl text-xs font-semibold gap-1.5"
              onClick={addLanguage}
            >
              <Plus className="size-3.5" />
              <span>Adicionar outro idioma</span>
            </Button>
          </div>

          <div className="p-5 border-t border-border/40 shrink-0 bg-background/95 backdrop-blur-sm flex items-center justify-end gap-3">
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="rounded-xl font-bold bg-primary text-primary-foreground" disabled={isSaving}>
              {isSaving ? "Salvando..." : "Salvar Idiomas"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
