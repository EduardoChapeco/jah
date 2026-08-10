import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PenTool, Image as ImageIcon, Send, Copy } from "lucide-react";

import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Surface } from "@/components/ui/surface";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listSocialPosts, createSocialPost } from "@/services/marketing-engagement.functions";
import { EmptyState } from "@/components/state/states";
import { formatDate } from "../lib/datetime";

export const Route = createFileRoute("/admin/criador")({
  head: () => ({ meta: [{ title: "Criador de Posts" }] }),
  loader: async () => {
    const res = await listSocialPosts();
    return res;
  },
  component: CreatorPage,
});

function CreatorPage() {
  const posts = Route.useLoaderData() || [];
  const router = useRouter();

  const [platform, setPlatform] = useState("instagram");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content) return;

    setIsSaving(true);
    try {
      const res = await createSocialPost({
        data: { platform, content_text: content, image_url: imageUrl || undefined },
      });
      if (res) {
        toast.success("Post arquivado!");
        setContent("");
        setImageUrl("");
        router.invalidate();
      } else {
        toast.error(res.message || "Erro ao salvar post.");
      }
    } catch {
      toast.error("Erro inesperado");
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado para a área de transferência!");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Criador de Posts (Social)"
        description="Escreva e arquive textos e ideias para suas redes sociais."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Creator Form */}
        {/* Creator Form */}
        <Surface variant="default" padding="none" className="md:col-span-1 h-fit">
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="font-semibold leading-none tracking-tight flex items-center gap-2 text-base">
              <PenTool className="h-4 w-4" /> Escrever Novo Post
            </h3>
          </div>
          <div className="p-6 pt-0">
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Plataforma</label>
                <Select value={platform} onValueChange={setPlatform}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Mídia do Catálogo (URL da Imagem)</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="https://..."
                      className="pl-9"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                    />
                  </div>
                </div>
                {imageUrl && (
                  <div className="mt-2 relative rounded-md overflow-hidden aspect-video bg-muted border">
                    <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Legenda / Texto</label>
                <Textarea
                  placeholder="Escreva a legenda do post..."
                  className="min-h-[150px]"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSaving || !content}>
                {isSaving ? "Salvando..." : "Arquivar Ideia"}
              </Button>
            </form>
          </div>
        </Surface>

        {/* Timeline */}
        <div className="md:col-span-2 space-y-4">
          <h3 className="font-semibold text-lg">Posts Arquivados</h3>
          {posts.length === 0 ? (
            <EmptyState
              title="Nenhum post arquivado"
              description="Comece escrevendo suas ideias ao lado."
            />
          ) : (
            <div className="grid gap-4">
              {posts.map((post: any) => (
                <Surface variant="default" padding="none" key={post.id}>
                  <div className="flex flex-col space-y-1.5 p-6 pb-2">
                    <div className="flex justify-between items-start">
                      <Badge variant="secondary" className="capitalize">
                        {post.platform}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(post.created_at)}
                      </span>
                    </div>
                  </div>
                  <div className="p-6 pt-0 space-y-4">
                    {post.image_url && (
                      <div className="w-full aspect-video rounded-md overflow-hidden bg-muted border relative">
                        <img
                          src={post.image_url}
                          alt="Post"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{post.content_text}</p>
                  </div>
                  <div className="flex items-center p-6 pt-2 border-t justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(post.content_text)}
                    >
                      <Copy className="mr-2 h-4 w-4" /> Copiar Texto
                    </Button>
                  </div>
                </Surface>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
