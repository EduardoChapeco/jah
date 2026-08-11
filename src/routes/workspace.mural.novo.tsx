import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ArrowLeft, Send, ImagePlus, X, Loader2, User, Store } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { PageHeader } from "@/components/commerce/page-header";
import { Surface } from "@/components/ui/surface";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createPost } from "@/services/social.functions";
import { getPostMediaSignedUrl } from "@/services/storage.functions";

const postSchema = z.object({
  content_text: z.string().min(1, "Escreva algo para publicar.").optional(),
  as_store: z.boolean(),
});

type PostFormData = z.infer<typeof postSchema>;

export const Route = createFileRoute("/workspace/mural/novo")(
{
  head: () => ({ meta: [{ title: "Nova Publicacao - JAH" }] }),
  component: NovoPostPage,
}
);

function NovoPostPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: { content_text: "", as_store: false },
  });

  const asStore = watch("as_store");

  // Upload real de midia para Supabase Storage via BFF
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validacao de tipo e tamanho no cliente (defesa em profundidade — servidor valida novamente)
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Formato nao suportado. Use JPG, PNG, WebP, GIF ou MP4.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Limite de 20MB.");
      return;
    }

    // Preview local imediato
    const localUrl = URL.createObjectURL(file);
    setMediaPreview(localUrl);
    setIsUploadingMedia(true);

    try {
      // 1. Obter URL assinada do servidor (autenticado)
      const { signedUrl, publicUrl } = await getPostMediaSignedUrl({
        data: {
          fileName: file.name,
          contentType: file.type as
            | "image/jpeg"
            | "image/png"
            | "image/webp"
            | "image/gif"
            | "video/mp4",
        },
      });
      // 2. Upload direto para o Supabase Storage (sem passar pelo servidor)
      const uploadRes = await fetch(signedUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      if (!uploadRes.ok) throw new Error("Falha no upload para o Storage.");
      setMediaUrls([publicUrl]);
      toast.success("Midia enviada com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao fazer upload da midia.");
      setMediaPreview(null);
      setMediaUrls([]);
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const removeMedia = () => {
    setMediaPreview(null);
    setMediaUrls([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onSubmit = async (data: PostFormData) => {
    if (!data.content_text && mediaUrls.length === 0) {
      toast.error("O post precisa ter texto ou midia.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createPost({
        data: {
          content_text: data.content_text,
          media_urls: mediaUrls,
          as_store: data.as_store,
          reference_type: "none",
        },
      });

      toast.success("Publicacao enviada pro Mural!");
      navigate({ to: "/mural" });
    } catch (err: any) {
      toast.error(err.message || "Erro ao publicar.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container max-w-2xl mx-auto px-4 md:px-8 py-10 space-y-8">
      <PageHeader
        title="Nova Publicacao"
        description="Compartilhe novidades com a comunidade."
        actions={
          <Button
            variant="outline"
            onClick={() => navigate({ to: "/mural" })}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Mural
          </Button>
        }
      />

      <Surface variant="zine" padding="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Contexto de publicacao: Pessoal ou Loja */}
          <div className="space-y-2">
            <Label className="font-mono uppercase text-xs font-bold text-ink/70">
              Como voce quer postar?
            </Label>
            <div className="flex gap-4">
              <label
                className={`flex-1 border-2 p-4 flex flex-col items-center gap-2 cursor-pointer transition-colors ${
                  !asStore ? "border-ink bg-ink text-paper" : "border-ink/20 hover:border-ink/50"
                }`}
              >
                <input
                  type="radio"
                  className="sr-only"
                  checked={!asStore}
                  onChange={() => setValue("as_store", false)}
                />
                <User className="size-6" />
                <span className="font-bold uppercase font-mono text-sm">Pessoal</span>
              </label>
              <label
                className={`flex-1 border-2 p-4 flex flex-col items-center gap-2 cursor-pointer transition-colors ${
                  asStore ? "border-ink bg-ink text-paper" : "border-ink/20 hover:border-ink/50"
                }`}
              >
                <input
                  type="radio"
                  className="sr-only"
                  checked={asStore}
                  onChange={() => setValue("as_store", true)}
                />
                <Store className="size-6" />
                <span className="font-bold uppercase font-mono text-sm">Como Loja</span>
              </label>
            </div>
          </div>

          {/* Texto do post */}
          <div className="space-y-2">
            <Label
              htmlFor="content_text"
              className="font-mono uppercase text-xs font-bold text-ink/70"
            >
              Mensagem
            </Label>
            <Textarea
              id="content_text"
              placeholder="O que esta acontecendo?"
              className="min-h-32 text-lg font-serif border-2 border-ink rounded-none bg-transparent resize-none focus-visible:ring-0 focus-visible:border-ink p-4"
              {...register("content_text")}
            />
            {errors.content_text && (
              <p className="text-poster-red text-sm font-bold font-mono">
                {errors.content_text.message}
              </p>
            )}
          </div>

          {/* Upload de midia real */}
          <div className="space-y-2">
            <Label className="font-mono uppercase text-xs font-bold text-ink/70">
              Midia (Opcional)
            </Label>

            {mediaPreview ? (
              <div className="relative border-2 border-ink overflow-hidden">
                {isUploadingMedia && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                    <Loader2 className="size-8 text-white animate-spin" />
                    <span className="text-white font-bold ml-2 font-mono text-sm">Enviando...</span>
                  </div>
                )}
                <img
                  src={mediaPreview}
                  alt="Preview"
                  className="w-full max-h-64 object-contain bg-black"
                />
                <button
                  type="button"
                  onClick={removeMedia}
                  className="absolute top-2 right-2 bg-ink text-paper p-1 hover:bg-ink/80 transition-colors"
                  aria-label="Remover midia"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <div
                className="border-2 border-dashed border-ink/30 p-8 flex flex-col items-center justify-center text-ink/50 cursor-pointer hover:bg-ink/5 hover:border-ink/60 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImagePlus className="size-8 mb-2 opacity-50" />
                <span className="font-mono text-xs uppercase font-bold">
                  Anexar Arte / Foto
                </span>
                <span className="font-mono text-[10px] mt-1 opacity-60">
                  JPG, PNG, WebP, GIF, MP4 — max 20MB
                </span>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,video/mp4"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || isUploadingMedia}
            className="w-full font-bold font-display uppercase tracking-widest text-lg h-14 bg-ink text-paper border-2 border-ink shadow-hard hover:translate-y-1 hover:shadow-none transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-5 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                Publicar no Mural
                <Send className="ml-2 size-5" />
              </>
            )}
          </Button>
        </form>
      </Surface>
    </div>
  );
}
