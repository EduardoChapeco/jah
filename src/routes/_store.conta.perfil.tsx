import { createFileRoute, Link, useRouter, redirect } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { getProfile, updateProfile, requestAccountDeletion, getUserSession } from "@/services/auth.functions";
import { getPostMediaSignedUrl } from "@/services/storage.functions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ImageCropperDialog } from "@/components/ui/image-cropper-dialog";
import { ImageUpload } from "@/components/ui/image-upload";
import { CitySelect } from "@/components/ui/city-select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  User,
  Camera,
  ExternalLink,
  Loader2,
  Image as ImageIcon,
  Trash2,
  Check,
  Briefcase,
  Link as LinkIcon,
  Plus,
  Building2,
  GraduationCap,
  Sparkles,
  Award,
  Store,
} from "lucide-react";

export const Route = createFileRoute("/_store/conta/perfil")({
  head: () => ({ meta: [{ title: "Meu Perfil | Wider" }] }),
  loader: async () => {
    try {
      const res = await getProfile();
      return res || {};
    } catch {
      return {};
    }
  },
  component: ProfilePage,
});

function maskCpf(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
}

function ProfilePage() {
  const rawProfile = Route.useLoaderData() as any;
  const profile = rawProfile || {};
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Estados de Recorte de Imagem (Faca Contextual Única)
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperSrc, setCropperSrc] = useState<string | null>(null);
  const [cropperType, setCropperType] = useState<"avatar" | "cover">("avatar");
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  const initialResume = profile?.resume_data || {};
  const [formData, setFormData] = useState({
    fullName: profile?.fullName || "",
    username: profile?.username || (profile?.email ? profile.email.split("@")[0].toLowerCase().replace(/[^a-z0-9._]/g, "") : "") || (profile?.fullName ? profile.fullName.toLowerCase().replace(/\s+/g, ".").replace(/[^a-z0-9._]/g, "") : "") || "",
    phone: profile?.phone || "",
    avatarUrl: profile?.avatarUrl || "",
    coverUrl: profile?.coverUrl || "",
    bio: profile?.bio || "",
    occupation: profile?.occupation || "",
    city: profile?.city || "",
    state: profile?.state || "SC",
    instagram: profile?.instagram || "",
    website: profile?.website || "",
    cpf: profile?.cpf ? maskCpf(profile.cpf) : "",
    birthDate: profile?.birthDate || "",
    gender: profile?.gender || "",
    newsletterOptIn: profile?.newsletterOptIn ?? false,
    featuredBannerUrl: profile?.featuredBannerUrl || "",
    featuredBannerLink: profile?.featuredBannerLink || "",
  });

  // Biolinks
  const [biolinks, setBiolinks] = useState<Array<{ id: string; label: string; url: string; imageUrl?: string; isHighlight?: boolean }>>(
    Array.isArray(profile?.biolinks) ? profile.biolinks : []
  );

  // Perfil Profissional / Currículo (LinkedIn Style)
  const [resumeData, setResumeData] = useState({
    headline: initialResume?.headline || "",
    summary: initialResume?.summary || "",
    hiringStatus: (initialResume?.hiringStatus as "none" | "open_to_work" | "hiring") || "none",
    skillsString: Array.isArray(initialResume?.skills) ? initialResume.skills.join(", ") : "",
    experiences: Array.isArray(initialResume?.experiences) ? initialResume.experiences : [] as any[],
    education: Array.isArray(initialResume?.education) ? initialResume.education : [] as any[],
  });

  const set = <K extends keyof typeof formData>(key: K, value: (typeof formData)[K]) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>, type: "avatar" | "cover") => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setCropperSrc(reader.result as string);
      setCropperType(type);
      setCropperOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setCropperOpen(false);
    setIsUploadingMedia(true);

    try {
      const type = cropperType;
      const ext = "png";
      const file = new File([croppedBlob], `profile_${type}_${Date.now()}.${ext}`, {
        type: "image/png",
      });

      const { signedUrl, publicUrl } = await getPostMediaSignedUrl({
        data: {
          fileName: file.name,
          contentType: "image/png",
        },
      });

      const uploadRes = await fetch(signedUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": "image/png" },
      });

      if (!uploadRes.ok) throw new Error("Falha no upload para o Storage.");

      if (type === "avatar") set("avatarUrl", publicUrl);
      else set("coverUrl", publicUrl);

      toast.success(type === "avatar" ? "Foto de perfil atualizada!" : "Foto de capa atualizada!");
    } catch (err: unknown) {
      toast.error((err instanceof Error ? err.message : String(err)) || "Erro no upload da imagem.");
    } finally {
      setIsUploadingMedia(false);
    }
  };

  // Funções de Biolinks
  const addBiolink = () => {
    setBiolinks((prev) => [
      ...prev,
      { id: `link_${Date.now()}`, label: "Meu Link", url: "https://", isHighlight: false },
    ]);
  };

  const updateBiolink = (idx: number, field: string, value: any) => {
    setBiolinks((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const removeBiolink = (idx: number) => {
    setBiolinks((prev) => prev.filter((_, i) => i !== idx));
  };

  // Funções de Experiência Profissional
  const addExperience = () => {
    setResumeData((prev) => ({
      ...prev,
      experiences: [
        ...prev.experiences,
        {
          id: `exp_${Date.now()}`,
          title: "Cargo / Especialidade",
          company: "Empresa / Autônomo",
          location: "Chapecó, SC",
          startDate: "2024",
          endDate: "Atual",
          isCurrent: true,
          description: "",
        },
      ],
    }));
  };

  const updateExperience = (idx: number, field: string, value: any) => {
    setResumeData((prev) => {
      const nextExp = [...prev.experiences];
      nextExp[idx] = { ...nextExp[idx], [field]: value };
      return { ...prev, experiences: nextExp };
    });
  };

  const removeExperience = (idx: number) => {
    setResumeData((prev) => ({
      ...prev,
      experiences: prev.experiences.filter((_: any, i: number) => i !== idx),
    }));
  };

  // Funções de Formação
  const addEducation = () => {
    setResumeData((prev) => ({
      ...prev,
      education: [
        ...prev.education,
        {
          id: `edu_${Date.now()}`,
          degree: "Curso / Graduação",
          institution: "Instituição de Ensino",
          year: "2023",
        },
      ],
    }));
  };

  const updateEducation = (idx: number, field: string, value: any) => {
    setResumeData((prev) => {
      const nextEdu = [...prev.education];
      nextEdu[idx] = { ...nextEdu[idx], [field]: value };
      return { ...prev, education: nextEdu };
    });
  };

  const removeEducation = (idx: number) => {
    setResumeData((prev) => ({
      ...prev,
      education: prev.education.filter((_: any, i: number) => i !== idx),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    const cleanUser = formData.username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (!cleanUser || cleanUser.length < 3) {
      toast.error("O nome de usuário (@) é obrigatório e deve ter no mínimo 3 caracteres.");
      return;
    }
    setIsSubmitting(true);
    try {
      const skillsArray = resumeData.skillsString
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean);

      await updateProfile({
        data: {
          fullName: formData.fullName.trim(),
          username: formData.username.trim() || undefined,
          phone: formData.phone.trim() || undefined,
          avatarUrl: formData.avatarUrl || undefined,
          coverUrl: formData.coverUrl || undefined,
          bio: formData.bio.trim() || undefined,
          occupation: formData.occupation.trim() || undefined,
          city: formData.city.trim() || undefined,
          state: formData.state.trim() || undefined,
          instagram: formData.instagram.trim() || undefined,
          website: formData.website.trim() || undefined,
          cpf: formData.cpf.replace(/\D/g, "") || undefined,
          birthDate: formData.birthDate || undefined,
          gender: (formData.gender as any) || undefined,
          newsletterOptIn: formData.newsletterOptIn,
          biolinks: biolinks.length > 0 ? biolinks : undefined,
          resumeData: {
            headline: resumeData.headline.trim() || undefined,
            summary: resumeData.summary.trim() || undefined,
            hiringStatus: resumeData.hiringStatus,
            skills: skillsArray,
            experiences: resumeData.experiences,
            education: resumeData.education,
          },
          featuredBannerUrl: formData.featuredBannerUrl.trim() || undefined,
          featuredBannerLink: formData.featuredBannerLink.trim() || undefined,
        },
      });
      toast.success("Perfil e preferências salvos com sucesso!");
      router.invalidate();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar perfil";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== "EXCLUIR") return;
    setIsDeleting(true);
    try {
      await requestAccountDeletion();
      toast.success("Sua conta foi excluída com sucesso.");
      window.location.href = "/";
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao excluir conta";
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="w-full space-y-6 pb-6 animate-in fade-in duration-200">
      {/* ── Top Header Limpo ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 ">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Editar Perfil
          </h1>
          
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            asChild
            size="sm"
            className="rounded-xl text-xs font-bold gap-1.5 bg-primary text-primary-foreground cursor-pointer"
          >
            <Link
              to="/membro/$id"
              params={{ id: formData.username || profile.username || profile.id }}
              target="_blank"
            >
              <ExternalLink className="size-3.5" />
              <span>Ver Meu Perfil (@{formData.username || "perfil"})</span>
            </Link>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl text-xs font-bold gap-1.5 cursor-pointer"
            onClick={() => {
              if (typeof navigator !== "undefined" && navigator.clipboard) {
                const handle = formData.username || profile.username;
                const link = handle
                  ? `${window.location.origin}/membro/@${handle}`
                  : `${window.location.origin}/membro/${profile.id}`;
                navigator.clipboard.writeText(link);
                toast.success("Link do seu perfil copiado!");
              }
            }}
          >
            <LinkIcon className="size-3.5" />
            <span>Copiar Link</span>
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Tabs defaultValue="dados" className="space-y-6">
          <div className="flex items-center overflow-x-auto pb-1 scrollbar-none ">
            <TabsList className="bg-transparent p-0 gap-2 h-auto flex flex-nowrap">
              <TabsTrigger
                value="dados"
                className="h-10 px-4 rounded-xl text-xs font-bold gap-1.5 data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]: text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <User className="size-3.5" />
                <span>Dados & Identidade</span>
              </TabsTrigger>
              <TabsTrigger
                value="profissional"
                className="h-10 px-4 rounded-xl text-xs font-bold gap-1.5 data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]: text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <Briefcase className="size-3.5" />
                <span>Perfil Profissional & Currículo</span>
              </TabsTrigger>
              <TabsTrigger
                value="biolinks"
                className="h-10 px-4 rounded-xl text-xs font-bold gap-1.5 data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]: text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <LinkIcon className="size-3.5" />
                <span>Botões de Ação & Links</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ── ABA 1: Dados Pessoais & Fotos ── */}
          <TabsContent value="dados" className="space-y-6">
            {/* Fotos de Capa e Perfil */}
            <div className="space-y-6">
              <h2 className="text-sm font-bold text-foreground">Fotos do Perfil</h2>

              {/* Capa Panorâmica 1090px */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground">Foto de Capa Panorâmica (1090px)</Label>
                <div className="w-full h-28 sm:h-36 rounded-3xl bg-muted/30 overflow-x-auto overflow-y-hidden scrollbar-none flex items-center gap-3 pr-3 border border-border/40 relative group">
                  {formData.coverUrl ? (
                    <img src={formData.coverUrl} alt="Capa" className="h-full min-w-[1090px] object-cover flex-shrink-0 select-none rounded-2xl" />
                  ) : (
                    <div className="h-full min-w-[1090px] bg-gradient-to-r from-primary/10 via-muted/40 to-primary/15 flex items-center justify-center rounded-2xl">
                      <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <ImageIcon className="size-4 opacity-50" />
                        Nenhuma capa adicionada (Formato Panorâmico: 1090px de largura)
                      </span>
                    </div>
                  )}

                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileSelected(e, "cover")}
                  />

                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="sticky right-3 z-10 shrink-0 rounded-xl text-xs font-bold gap-1.5 bg-background/90 backdrop-blur-sm shadow-sm hover:bg-background"
                    onClick={() => coverInputRef.current?.click()}
                    disabled={isUploadingMedia}
                  >
                    <Camera className="size-3.5" />
                    <span>{formData.coverUrl ? "Alterar Capa" : "Adicionar Capa"}</span>
                  </Button>
                </div>
              </div>

              {/* Avatar Circular */}
              <div className="flex items-center gap-4 pt-2">
                <div className="relative">
                  <div className="size-20 sm:size-24 rounded-3xl overflow-hidden bg-muted flex items-center justify-center">
                    {formData.avatarUrl ? (
                      <img src={formData.avatarUrl} alt="Avatar" className="size-full object-cover" />
                    ) : (
                      <User className="size-8 text-muted-foreground/50" />
                    )}
                  </div>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileSelected(e, "avatar")}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-muted-foreground">Foto de Perfil (1:1)</Label>
                  <div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="rounded-xl text-xs font-bold gap-1.5 border-border "
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={isUploadingMedia}
                    >
                      <Camera className="size-3.5" />
                      <span>{formData.avatarUrl ? "Trocar Foto" : "Enviar Foto"}</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Informações Pessoais */}
            <div className="space-y-5 pt-4 border-t border-border/40">
              <h2 className="text-sm font-bold text-foreground">Informações de Identidade</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-muted-foreground">Nome Completo *</Label>
                  <Input
                    required
                    value={formData.fullName}
                    onChange={(e) => set("fullName", e.target.value)}
                    placeholder="Seu nome completo"
                    className="h-10 rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-muted-foreground">Nome de Usuário (@) *</Label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-xs font-mono font-bold text-primary select-none">@</span>
                    <Input
                      required
                      value={formData.username}
                      onChange={(e) => set("username", e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                      placeholder="seunome"
                      className="h-10 rounded-xl text-xs pl-7 font-mono font-semibold"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Permitida 1 alteração a cada 30 dias. Seu @ anterior fica protegido por 30 dias caso queira restaurar.
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground">Ocupação / Profissão</Label>
                <Input
                  value={formData.occupation}
                  onChange={(e) => set("occupation", e.target.value)}
                  placeholder="Ex: Arquiteto, Fotógrafo, Estudante..."
                  className="h-10 rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground">Biografia</Label>
                <Textarea
                  value={formData.bio}
                  onChange={(e) => set("bio", e.target.value)}
                  placeholder="Conte um pouco sobre você..."
                  className="rounded-xl text-xs min-h-[90px] resize-none"
                />
              </div>

              <div className="pt-1">
                <CitySelect
                  stateValue={formData.state || "SC"}
                  cityValue={formData.city || ""}
                  onStateChange={(uf) => set("state", uf)}
                  onCityChange={(city) => set("city", city)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-muted-foreground">Instagram</Label>
                  <Input
                    value={formData.instagram}
                    onChange={(e) => set("instagram", e.target.value)}
                    placeholder="usuario"
                    className="h-10 rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-muted-foreground">Site / Link</Label>
                  <Input
                    value={formData.website}
                    onChange={(e) => set("website", e.target.value)}
                    placeholder="https://..."
                    className="h-10 rounded-xl text-xs"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ── ABA 2: Perfil Profissional (LinkedIn Style) ── */}
          <TabsContent value="profissional" className="space-y-6">
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 ">
                <div>
                  <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Briefcase className="size-4 text-primary" />
                    <span>Currículo & Status de Carreira</span>
                  </h2>
                  
                </div>

                {/* Selo Profissional */}
                <Select
                  value={resumeData.hiringStatus}
                  onValueChange={(v: any) => setResumeData({ ...resumeData, hiringStatus: v })}
                >
                  <SelectTrigger className="w-full sm:w-56 h-9 rounded-xl text-xs font-bold">
                    <SelectValue placeholder="Status Profissional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem Selo Ativo</SelectItem>
                    <SelectItem value="open_to_work">🟢 #OpenToWork (Buscando Vagas)</SelectItem>
                    <SelectItem value="hiring">🔵 #Contratando (Empresa/Líder)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground">Título Profissional (Headline)</Label>
                <Input
                  value={resumeData.headline}
                  onChange={(e) => setResumeData({ ...resumeData, headline: e.target.value })}
                  placeholder="Ex: Engenheiro de Software Full Stack | React & Node.js"
                  className="h-10 rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground">Resumo / Sobre Mim</Label>
                <Textarea
                  value={resumeData.summary}
                  onChange={(e) => setResumeData({ ...resumeData, summary: e.target.value })}
                  placeholder="Descreva sua trajetória profissional, principais conquistas e objetivos..."
                  className="rounded-xl text-xs min-h-[90px] resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground">Habilidades & Especialidades (separadas por vírgula)</Label>
                <Input
                  value={resumeData.skillsString}
                  onChange={(e) => setResumeData({ ...resumeData, skillsString: e.target.value })}
                  placeholder="Ex: Gestão de Projetos, Liderança, Atendimento, Excel, Vendas"
                  className="h-10 rounded-xl text-xs"
                />
              </div>

              {/* Experiências Profissionais */}
              <div className="space-y-3 pt-3 ">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Building2 className="size-3.5 text-primary" />
                    <span>Experiências Profissionais</span>
                  </Label>
                  <Button type="button" size="sm" variant="outline" onClick={addExperience} className="rounded-xl text-xs font-bold gap-1 h-8">
                    <Plus className="size-3" />
                    <span>Adicionar Experiência</span>
                  </Button>
                </div>

                {resumeData.experiences.map((exp: any, idx: number) => (
                  <div key={exp.id || idx} className="p-4 rounded-2xl  bg-muted/20 space-y-3 relative">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => removeExperience(idx)}
                      className="absolute top-3 right-3 size-7 text-destructive hover:bg-destructive/10 rounded-lg"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-8">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-muted-foreground">Cargo *</Label>
                        <Input
                          value={exp.title}
                          onChange={(e) => updateExperience(idx, "title", e.target.value)}
                          placeholder="Cargo"
                          className="h-8 rounded-lg text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-muted-foreground">Empresa *</Label>
                        <Input
                          value={exp.company}
                          onChange={(e) => updateExperience(idx, "company", e.target.value)}
                          placeholder="Empresa"
                          className="h-8 rounded-lg text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-muted-foreground">Período Início</Label>
                        <Input
                          value={exp.startDate}
                          onChange={(e) => updateExperience(idx, "startDate", e.target.value)}
                          placeholder="2022"
                          className="h-8 rounded-lg text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-muted-foreground">Período Fim</Label>
                        <Input
                          value={exp.endDate}
                          onChange={(e) => updateExperience(idx, "endDate", e.target.value)}
                          placeholder="Atual"
                          className="h-8 rounded-lg text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-muted-foreground">Local</Label>
                        <Input
                          value={exp.location}
                          onChange={(e) => updateExperience(idx, "location", e.target.value)}
                          placeholder="Cidade, UF"
                          className="h-8 rounded-lg text-xs"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Formação Acadêmica */}
              <div className="space-y-3 pt-3 ">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <GraduationCap className="size-3.5 text-primary" />
                    <span>Formação Acadêmica</span>
                  </Label>
                  <Button type="button" size="sm" variant="outline" onClick={addEducation} className="rounded-xl text-xs font-bold gap-1 h-8">
                    <Plus className="size-3" />
                    <span>Adicionar Formação</span>
                  </Button>
                </div>

                {resumeData.education.map((edu: any, idx: number) => (
                  <div key={edu.id || idx} className="p-4 rounded-2xl  bg-muted/20 space-y-3 relative">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => removeEducation(idx)}
                      className="absolute top-3 right-3 size-7 text-destructive hover:bg-destructive/10 rounded-lg"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pr-8">
                      <div className="space-y-1 sm:col-span-1">
                        <Label className="text-[11px] font-bold text-muted-foreground">Curso / Graduação *</Label>
                        <Input
                          value={edu.degree}
                          onChange={(e) => updateEducation(idx, "degree", e.target.value)}
                          placeholder="Curso"
                          className="h-8 rounded-lg text-xs"
                        />
                      </div>
                      <div className="space-y-1 sm:col-span-1">
                        <Label className="text-[11px] font-bold text-muted-foreground">Instituição *</Label>
                        <Input
                          value={edu.institution}
                          onChange={(e) => updateEducation(idx, "institution", e.target.value)}
                          placeholder="Instituição"
                          className="h-8 rounded-lg text-xs"
                        />
                      </div>
                      <div className="space-y-1 sm:col-span-1">
                        <Label className="text-[11px] font-bold text-muted-foreground">Ano de Conclusão</Label>
                        <Input
                          value={edu.year}
                          onChange={(e) => updateEducation(idx, "year", e.target.value)}
                          placeholder="2024"
                          className="h-8 rounded-lg text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* ── ABA 3: Biolinks & Mini-Banners ── */}
          <TabsContent value="biolinks" className="space-y-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-2 border-b border-border/40">
                <div>
                  <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <LinkIcon className="size-4 text-primary" />
                    <span>Botões de Ação & Links na Bio</span>
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Crie botões personalizados para o seu perfil (com ou sem imagem de fundo).
                  </p>
                </div>

                <Button type="button" size="sm" variant="outline" onClick={addBiolink} className="rounded-xl text-xs font-bold gap-1 cursor-pointer">
                  <Plus className="size-3.5" />
                  <span>Novo Botão de Ação</span>
                </Button>
              </div>

              {biolinks.length === 0 ? (
                <div className="border-0 p-8 text-center rounded-2xl bg-muted/20 space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Você ainda não adicionou botões de ação. Clique em "Novo Botão de Ação" acima para criar.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {biolinks.map((link, idx) => (
                    <div key={link.id || idx} className="p-4 rounded-2xl border border-border/60 bg-muted/20 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-foreground">Botão #{idx + 1}</span>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => removeBiolink(idx)}
                          className="size-7 text-destructive hover:bg-destructive/10 rounded-lg"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-[11px] font-semibold text-muted-foreground">Título do Botão</Label>
                          <Input
                            value={link.label || (link as any).title || ""}
                            onChange={(e) => updateBiolink(idx, "label", e.target.value)}
                            placeholder="Ex: Falar no WhatsApp, Cardápio, Catálogo"
                            className="h-9 rounded-xl text-xs font-bold"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] font-semibold text-muted-foreground">Link de Destino (URL)</Label>
                          <Input
                            value={link.url}
                            onChange={(e) => updateBiolink(idx, "url", e.target.value)}
                            placeholder="https://wa.me/... ou https://..."
                            className="h-9 rounded-xl text-xs font-mono"
                          />
                        </div>
                      </div>

                      {/* Capa / Background Opcional do Botão */}
                      <div className="pt-1">
                        <Label className="text-[11px] font-semibold text-muted-foreground block pb-1">
                          Capa de Fundo do Botão (Opcional - transforma em Mini-Banner de Ação)
                        </Label>
                        <div className="flex items-center gap-3">
                          <Input
                            value={link.imageUrl || ""}
                            onChange={(e) => updateBiolink(idx, "imageUrl", e.target.value)}
                            placeholder="URL da imagem ou cole o link da foto..."
                            className="h-8 rounded-xl text-xs flex-1"
                          />
                          {link.imageUrl && (
                            <div className="size-8 rounded-lg overflow-hidden border border-border shrink-0 bg-muted">
                              <img src={link.imageUrl} alt="Preview" className="size-full object-cover" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Mini-Banner em Destaque */}
              <div className="space-y-3 pt-4 border-t border-border/40">
                <div>
                  <h3 className="text-xs font-bold text-foreground">Mini-Banner de Destaque / Evento</h3>
                  <p className="text-[11px] text-muted-foreground">Banner panorâmico exibido em destaque abaixo da bio.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold text-muted-foreground">Imagem do Banner</Label>
                    <ImageUpload
                      value={formData.featuredBannerUrl}
                      onChange={(url) => set("featuredBannerUrl", url)}
                      aspectPreset="widescreen"
                      bucket="cms-media"
                      helperText="Formato 16:9 ou panorâmico"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold text-muted-foreground">Link de Destino</Label>
                    <Input
                      value={formData.featuredBannerLink}
                      onChange={(e) => set("featuredBannerLink", e.target.value)}
                      placeholder="https://..."
                      className="h-10 rounded-xl text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* ── Botão Salvar Principal ── */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl px-6 h-11 text-xs font-bold bg-primary text-primary-foreground  gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <Check className="size-4 stroke-[2.5]" />
                <span>Salvar Todas as Alterações</span>
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Modal de Recorte de Imagem */}
      {cropperSrc && (
        <ImageCropperDialog
          open={cropperOpen}
          onOpenChange={(v) => {
            if (!v) setCropperOpen(false);
          }}
          imageSrc={cropperSrc}
          aspect={cropperType === "avatar" ? 1 : 1090 / 144}
          cropShape={cropperType === "avatar" ? "round" : "rect"}
          lockAspect={true}
          title={cropperType === "avatar" ? "Recortar Foto de Perfil" : "Recortar Capa Panorâmica (1090px)"}
          onCropComplete={handleCropComplete}
        />
      )}
    </div>
  );
}
