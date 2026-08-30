import { useState, useRef } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  ImageSquare,
  X,
  CircleNotch,
  VideoCamera,
  FilmStrip,
  SignIn,
  ChatCircleText,
  Storefront,
  User,
  Sparkle,
  Newspaper,
  AirplaneTilt,
  SquaresFour,
  Slideshow,
  IdentificationBadge,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createPost, type PostType } from "@/services/social.functions";
import { getPostMediaSignedUrl, uploadPostMedia } from "@/services/storage.functions";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface MediaPreviewItem {
  url: string;
  type: "image" | "video";
}

export interface InlinePostComposerProps {
  session?: any;
}

export function InlinePostComposer({ session }: InlinePostComposerProps) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<MediaPreviewItem[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<PostType>("simple");
  const [newsTitle, setNewsTitle] = useState("");
  const [newsSource, setNewsSource] = useState("");
  const [travelOrigin, setTravelOrigin] = useState("");
  const [travelDestination, setTravelDestination] = useState("");
  const [badgeTitle, setBadgeTitle] = useState("");
  const [member1Name, setMember1Name] = useState("");
  const [member1Role, setMember1Role] = useState("");
  const [member2Name, setMember2Name] = useState("");
  const [member2Role, setMember2Role] = useState("");
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const router = useRouter();

  const isAuthenticated = Boolean(session?.user || session?.id);

  if (!isAuthenticated) {
    return (
      <div className="w-full p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-card border border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3 text-left">
          <div className="size-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <ChatCircleText className="size-6" weight="bold" />
          </div>
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-foreground">Participe do Mural Comunitário</h3>
            <p className="text-xs text-muted-foreground">
              Entre na sua conta para publicar fotos, vídeos e novidades na sua cidade.
            </p>
          </div>
        </div>
        <Button asChild size="sm" className="h-10 px-5 rounded-xl font-bold text-xs gap-2 shrink-0 w-full sm:w-auto">
          <Link to="/entrar" search={{ returnUrl: "/mural" }}>
            <SignIn className="size-4" weight="bold" />
            <span>Entrar ou Cadastrar</span>
          </Link>
        </Button>
      </div>
    );
  }

  const effectiveSession = session?.user || session;
  const userInitial = (effectiveSession?.user_metadata?.full_name || effectiveSession?.email || "U")[0].toUpperCase();
  const userName = effectiveSession?.user_metadata?.full_name || effectiveSession?.email?.split("@")[0] || "Você";

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      toast.error("Formato não suportado. Por favor, envie uma foto, gif ou vídeo.");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Limite de 50MB.");
      return;
    }

    if (mediaUrls.length >= 6) {
      toast.error("Máximo de 6 mídias por post.");
      return;
    }

    const localUrl = URL.createObjectURL(file);
    const mediaType = isVideo ? "video" : "image";
    setMediaPreviews((prev) => [...prev, { url: localUrl, type: mediaType }]);
    setIsUploadingMedia(true);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string;
          const res = await uploadPostMedia({
            data: {
              fileName: file.name,
              fileType: file.type || (isVideo ? "video/mp4" : "image/jpeg"),
              base64Data,
            },
          });
          if (res?.url) {
            setMediaUrls((prev) => [...prev, res.url]);
          } else {
            throw new Error("Resposta inválida do servidor de mídia.");
          }
        } catch (fbErr: any) {
          toast.error(fbErr.message || "Erro no upload da mídia.");
          setMediaPreviews((prev) => prev.filter((item) => item.url !== localUrl));
        } finally {
          setIsUploadingMedia(false);
        }
      };
      reader.readAsDataURL(file);
      return;
    } catch (err: unknown) {
      toast.error((err instanceof Error ? err.message : String(err)) || "Erro no upload da mídia.");
      setMediaPreviews((prev) => prev.filter((item) => item.url !== localUrl));
      setIsUploadingMedia(false);
    }
  };

  const removeMedia = (index: number) => {
    setMediaPreviews((prev) => prev.filter((_, i) => i !== index));
    setMediaUrls((prev) => prev.filter((_, i) => i !== index));
    if (fileInputRef.current && mediaUrls.length <= 1) fileInputRef.current.value = "";
  };

  const onSubmit = async () => {
    const trimmedContent = content.trim();
    if (!trimmedContent && mediaUrls.length === 0 && !newsTitle.trim()) {
      toast.error("O post precisa ter texto, foto ou título.");
      return;
    }

    setIsSubmitting(true);
    try {
      const metadata: Record<string, any> = {};

      if (selectedTemplate === "news") {
        metadata.is_news = true;
        metadata.title = newsTitle.trim() || trimmedContent.slice(0, 60);
        metadata.source = newsSource.trim() || "Wider News";
        metadata.subtitle = trimmedContent;
      } else if (selectedTemplate === "travel") {
        metadata.is_triptych = true;
        metadata.origin_city = travelOrigin.trim() || "Chapecó";
        metadata.dest_city = travelDestination.trim() || "Destino Especial";
        metadata.travel_headline = trimmedContent || "Some moments shouldn't wait";
      } else if (selectedTemplate === "duo_badge") {
        metadata.badge_group_title = badgeTitle.trim() || trimmedContent.slice(0, 40) || "Family: In Sync";
        metadata.member1_name = member1Name.trim() || userName.split(" ")[0];
        metadata.member1_role = member1Role.trim() || "Criação & Liderança";
        metadata.member2_name = member2Name.trim() || "Parceria";
        metadata.member2_role = member2Role.trim() || "Execução";
      }

      await createPost({
        data: {
          content_text: trimmedContent || undefined,
          media_urls: mediaUrls,
          layout_style: selectedTemplate === "instagram_carousel" ? "carousel" : "grid",
          post_type: selectedTemplate,
          metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
          as_store: false,
          reference_type: selectedTemplate === "news" ? "news" : "none",
        },
      });

      toast.success("Publicado no Mural com sucesso!");
      setContent("");
      setNewsTitle("");
      setNewsSource("");
      setTravelOrigin("");
      setTravelDestination("");
      setMediaUrls([]);
      setMediaPreviews([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      
      await router.invalidate();
      await queryClient.resetQueries({ queryKey: ["mural-feed"] });
      await queryClient.refetchQueries({ queryKey: ["mural-feed"] });
      await queryClient.invalidateQueries({ queryKey: ["moments-map"] });
    } catch (err: unknown) {
      toast.error((err instanceof Error ? err.message : String(err)) || "Erro ao publicar.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-card rounded-3xl p-4 sm:p-5 flex flex-col gap-3 relative border border-border/70">
      {/* Cabeçalho de Identidade & Seletor de Template */}
      <div className="flex items-center justify-between pb-2 border-b border-border/40 text-xs">
        <div className="flex items-center gap-2">
          <Avatar className="size-7 rounded-xl bg-primary/10 border border-border/40">
            <AvatarFallback className="text-[10px] font-bold text-primary">
              {userInitial}
            </AvatarFallback>
          </Avatar>
          <span className="font-semibold text-foreground truncate">
            {userName}
          </span>
        </div>

        {/* Seletor Rápido de Template em Cápsula Segmentada */}
        <div className="flex items-center gap-1 p-1 bg-muted/60 rounded-xl border border-border/40 overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setSelectedTemplate("simple")}
            className={cn(
              "px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer",
              selectedTemplate === "simple"
                ? "bg-card text-foreground shadow-xs border border-border/60"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            )}
          >
            Padrão
          </button>
          <button
            type="button"
            onClick={() => setSelectedTemplate("grid")}
            className={cn(
              "px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1 cursor-pointer",
              selectedTemplate === "grid"
                ? "bg-card text-foreground shadow-xs border border-border/60"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            )}
          >
            <SquaresFour size={13} weight="bold" />
            <span>Grid Orgânico</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedTemplate("news")}
            className={cn(
              "px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1 cursor-pointer",
              selectedTemplate === "news"
                ? "bg-info text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            )}
          >
            <Newspaper size={13} weight="bold" />
            <span>Notícia</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedTemplate("travel")}
            className={cn(
              "px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1 cursor-pointer",
              selectedTemplate === "travel"
                ? "bg-sky-600 text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            )}
          >
            <AirplaneTilt size={13} weight="bold" />
            <span>Viagem</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedTemplate("duo_badge")}
            className={cn(
              "px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1 cursor-pointer",
              selectedTemplate === "duo_badge"
                ? "bg-primary text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            )}
          >
            <IdentificationBadge size={13} weight="bold" />
            <span>Crachás / Sync</span>
          </button>
        </div>
      </div>

      {/* Campos Específicos para Notícia */}
      {selectedTemplate === "news" && (
        <div className="space-y-2 p-3 rounded-2xl bg-muted/40 border border-border/80">
          <Input
            value={newsTitle}
            onChange={(e) => setNewsTitle(e.target.value)}
            placeholder="Manchete Editorial da Notícia..."
            className="font-bold text-sm bg-background border-border h-9"
          />
          <Input
            value={newsSource}
            onChange={(e) => setNewsSource(e.target.value)}
            placeholder="Veículo / Fonte (ex: The New York Times, CNN, G1, Portal Local)..."
            className="text-xs bg-background border-border h-8"
          />
        </div>
      )}

      {/* Campos Específicos para Viagem */}
      {selectedTemplate === "travel" && (
        <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-muted/40 border border-border/80">
          <Input
            value={travelOrigin}
            onChange={(e) => setTravelOrigin(e.target.value)}
            placeholder="Origem (ex: Chapecó)"
            className="text-xs bg-background border-border h-8"
          />
          <Input
            value={travelDestination}
            onChange={(e) => setTravelDestination(e.target.value)}
            placeholder="Destino (ex: Londres / Serra)"
            className="text-xs bg-background border-border h-8"
          />
        </div>
      )}

      {/* Campos Específicos para Duo Badge / Crachás Conectados */}
      {selectedTemplate === "duo_badge" && (
        <div className="space-y-2 p-3 rounded-2xl bg-muted/40 border border-border/80">
          <Input
            value={badgeTitle}
            onChange={(e) => setBadgeTitle(e.target.value)}
            placeholder="Título do Card (ex: Family: In Sync / Dupla de Criação)..."
            className="font-bold text-xs bg-background border-border h-8"
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              value={member1Name}
              onChange={(e) => setMember1Name(e.target.value)}
              placeholder="Nome Membro 1 (ex: MILA)"
              className="text-xs bg-background border-border h-8"
            />
            <Input
              value={member1Role}
              onChange={(e) => setMember1Role(e.target.value)}
              placeholder="Função / Cargo 1 (ex: Design)"
              className="text-xs bg-background border-border h-8"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input
              value={member2Name}
              onChange={(e) => setMember2Name(e.target.value)}
              placeholder="Nome Membro 2 (ex: NEIL)"
              className="text-xs bg-background border-border h-8"
            />
            <Input
              value={member2Role}
              onChange={(e) => setMember2Role(e.target.value)}
              placeholder="Função / Cargo 2 (ex: Tech Lead)"
              className="text-xs bg-background border-border h-8"
            />
          </div>
        </div>
      )}

      {/* Corpo do Post com padding e transição de foco suave */}
      <Textarea
        placeholder={
          selectedTemplate === "news"
            ? "Escreva o resumo ou corpo da notícia..."
            : selectedTemplate === "travel"
            ? "Frase inspiracional sobre a viagem ou dica..."
            : "O que você vai colar no mural hoje?"
        }
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="min-h-20 text-sm sm:text-base border border-border/30 rounded-2xl bg-muted/15 focus:bg-background focus:border-primary/40 p-3 text-foreground transition-all resize-none focus-visible:ring-1 focus-visible:ring-primary/20 placeholder:text-muted-foreground/70"
      />

      {/* Previews de Mídia */}
      {mediaPreviews.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {mediaPreviews.map((preview, index) => (
            <div
              key={index}
              className="relative overflow-hidden rounded-2xl bg-black inline-block w-[120px] aspect-square shrink-0"
            >
              {isUploadingMedia && index === mediaPreviews.length - 1 && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-20 gap-1 text-white">
                  <CircleNotch className="size-5 animate-spin text-primary" />
                  <span className="text-[10px] font-medium">Enviando...</span>
                </div>
              )}

              {preview.type === "video" ? (
                <video
                  src={preview.url}
                  className="size-full object-cover"
                  muted
                  playsInline
                  autoPlay
                  loop
                />
              ) : (
                <img
                  src={preview.url}
                  alt={`Preview ${index}`}
                  className="size-full object-cover"
                />
              )}

              {preview.type === "video" && (
                <div className="absolute bottom-1.5 left-1.5 bg-black/70 text-white px-2 py-0.5 rounded-lg text-[10px] flex items-center gap-1 font-bold">
                  <FilmStrip size={12} weight="bold" />
                  <span>Vídeo</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => removeMedia(index)}
                className="absolute top-1.5 right-1.5 bg-black/70 text-white rounded-xl p-1.5 hover:bg-black z-30 transition-all hover:scale-105"
                aria-label="Remover mídia"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Botões de Ação do Composer */}
      <div className="flex justify-between items-center pt-3 border-t border-border/40 mt-1">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="border-border/50 bg-card hover:bg-muted text-foreground font-bold rounded-xl h-9 px-3.5 text-xs shadow-2xs gap-1.5 cursor-pointer"
          >
            <ImageSquare size={16} weight="bold" className="text-primary" />
            <span>Foto / Vídeo</span>
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        <Button
          onClick={onSubmit}
          disabled={
            isSubmitting ||
            isUploadingMedia ||
            (!content.trim() && mediaUrls.length === 0 && !newsTitle.trim())
          }
          size="sm"
          className="bg-primary text-primary-foreground font-bold rounded-xl h-9 px-6 text-xs hover:opacity-90 active:scale-98 transition-all shadow-xs cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <CircleNotch size={14} className="animate-spin mr-1.5" />
              Publicando...
            </>
          ) : (
            "Publicar"
          )}
        </Button>
      </div>
    </div>
  );
}
