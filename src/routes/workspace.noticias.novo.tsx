import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Newspaper,
  Plus,
  Trash2,
  Image,
  Quote,
  Heading,
  AlignLeft,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Eye,
  Sliders,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/commerce/page-header";
import { createArticle, type NewsSectionDTO } from "@/services/news.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/workspace/noticias/novo")({
  head: () => ({ meta: [{ title: "Nova Matéria | Redação Wider" }] }),
  component: WorkspaceNovaMateriaPage,
});

function WorkspaceNovaMateriaPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Campos principais
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [kicker, setKicker] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [category, setCategory] = useState("cidade");
  const [coverMediaUrl, setCoverMediaUrl] = useState("");
  const [coverMediaType, setCoverMediaType] = useState<"image" | "video" | "gif">("image");
  const [readingTime, setReadingTime] = useState(3);

  // Seções do artigo
  const [sections, setSections] = useState<NewsSectionDTO[]>([
    { type: "paragraph", content: "" },
  ]);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!slug || slug === title.toLowerCase().replace(/[^a-z0-9]+/g, "-")) {
      const generated = val
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
      setSlug(generated);
    }
  };

  const addSection = (type: "paragraph" | "heading" | "quote") => {
    setSections([...sections, { type, content: "" }]);
  };

  const updateSectionContent = (index: number, content: string, caption?: string) => {
    const updated = [...sections];
    updated[index] = { ...updated[index], content, caption };
    setSections(updated);
  };

  const removeSection = (index: number) => {
    if (sections.length <= 1) return;
    setSections(sections.filter((_, i) => i !== index));
  };

  const handleSubmit = async (status: "published" | "draft") => {
    if (!title.trim() || title.length < 3) {
      toast.error("Informe um título com pelo menos 3 caracteres.");
      return;
    }
    if (!slug.trim()) {
      toast.error("Informe o slug identificador da matéria.");
      return;
    }

    const validSections = sections.filter((s) => String(s.content).trim().length > 0);
    if (validSections.length === 0 && !subtitle.trim()) {
      toast.error("Adicione pelo menos um parágrafo de conteúdo.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createArticle({
        data: {
          title: title.trim(),
          slug: slug.trim(),
          kicker: kicker.trim() || undefined,
          subtitle: subtitle.trim() || undefined,
          content_sections: validSections,
          cover_media_url: coverMediaUrl.trim() || undefined,
          cover_media_type: coverMediaType,
          category,
          reading_time_minutes: readingTime,
          status,
        },
      });

      toast.success(
        status === "published"
          ? "Matéria publicada com sucesso!"
          : "Rascunho salvo com sucesso!",
      );
      navigate({ to: "/workspace/noticias" });
    } catch (err: unknown) {
      toast.error((err instanceof Error ? err.message : String(err)) || "Erro ao salvar matéria.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <PageHeader
        eyebrow="Redação"
        title="Nova Matéria"
        actions={
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="rounded-xl font-bold text-xs ">
              <Link to="/workspace/noticias">
                <ArrowLeft className="size-3.5 mr-1.5" />
                Voltar
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSubmitting}
              onClick={() => handleSubmit("draft")}
              className="rounded-xl font-bold text-xs "
            >
              Salvar Rascunho
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isSubmitting}
              onClick={() => handleSubmit("published")}
              className="rounded-xl font-bold text-xs bg-primary text-primary-foreground "
            >
              {isSubmitting ? (
                <Loader2 className="size-3.5 animate-spin mr-1.5" />
              ) : (
                <CheckCircle2 className="size-3.5 mr-1.5" />
              )}
              <span>Publicar</span>
            </Button>
          </div>
        }
      />

      <div className="space-y-6">
        {/* ── 1. Metadados e Manchete ── */}
        <div className="p-5 rounded-3xl  bg-card space-y-4 ">
          <span className="text-xs font-black uppercase tracking-wider text-primary">
            1. Estrutura Editorial
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Chapéu / Kicker</Label>
              <Input
                placeholder="Ex: POLÍTICA LOCAL"
                value={kicker}
                onChange={(e) => setKicker(e.target.value)}
                className="rounded-xl h-10 uppercase text-xs"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-bold">Categoria / Editoria</Label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-10 px-3 rounded-xl  bg-background text-xs font-semibold"
              >
                <option value="cidade">Cidade & Região</option>
                <option value="politica">Política</option>
                <option value="economia">Economia & Negócios</option>
                <option value="cultura">Cultura & Lazer</option>
                <option value="esportes">Esportes</option>
                <option value="tecnologia">Inovação & Tecnologia</option>
                <option value="geral">Geral</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Título da Manchete</Label>
            <Input
              placeholder="Ex: Feira de Inovação de Chapecó reúne mais de 10 mil participantes"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="rounded-xl h-11 text-sm font-bold"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Slug da Matéria (URL amigável)</Label>
            <Input
              placeholder="feira-de-inovacao-chapeco"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="rounded-xl h-10 font-mono text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold">
              Subtítulo / Lead (Resumo expansível no mural)
            </Label>
            <textarea
              placeholder="Escreva um resumo conciso de 2 a 3 linhas sobre a matéria..."
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              rows={2}
              className="w-full p-3 rounded-xl  bg-background text-xs leading-relaxed resize-none"
            />
          </div>
        </div>

        {/* ── 2. Mídia de Capa ── */}
        <div className="p-5 rounded-3xl  bg-card space-y-4 ">
          <span className="text-xs font-black uppercase tracking-wider text-primary">
            2. Capa da Notícia
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-bold">URL da Mídia de Capa (Imagem / Vídeo)</Label>
              <Input
                placeholder="https://images.unsplash.com/..."
                value={coverMediaUrl}
                onChange={(e) => setCoverMediaUrl(e.target.value)}
                className="rounded-xl h-10 font-mono text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Tipo de Mídia</Label>
              <select
                value={coverMediaType}
                onChange={(e) => setCoverMediaType(e.target.value as any)}
                className="w-full h-10 px-3 rounded-xl  bg-background text-xs font-semibold"
              >
                <option value="image">Imagem</option>
                <option value="video">Vídeo</option>
                <option value="gif">GIF Animado</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── 3. Redação em Blocos / Seções ── */}
        <div className="p-5 rounded-3xl  bg-card space-y-4 ">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-primary">
              3. Conteúdo da Matéria (Blocos)
            </span>

            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addSection("paragraph")}
                className="h-7 px-2.5 rounded-lg text-[11px] font-bold gap-1"
              >
                <AlignLeft className="size-3" />
                <span>+ Parágrafo</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addSection("heading")}
                className="h-7 px-2.5 rounded-lg text-[11px] font-bold gap-1"
              >
                <Heading className="size-3" />
                <span>+ Subtítulo</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addSection("quote")}
                className="h-7 px-2.5 rounded-lg text-[11px] font-bold gap-1"
              >
                <Quote className="size-3" />
                <span>+ Citação</span>
              </Button>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            {sections.map((sec, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl  bg-muted/20 space-y-2 relative group"
              >
                <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground">
                  <span className="capitalize">
                    Bloco {idx + 1}: {sec.type === "heading" ? "Subtítulo" : sec.type === "quote" ? "Citação Destacada" : "Parágrafo"}
                  </span>
                  {sections.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSection(idx)}
                      className="text-destructive hover:opacity-80 cursor-pointer"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>

                {sec.type === "heading" ? (
                  <Input
                    placeholder="Subtítulo da seção..."
                    value={String(sec.content)}
                    onChange={(e) => updateSectionContent(idx, e.target.value)}
                    className="rounded-xl h-10 font-bold text-sm bg-background"
                  />
                ) : sec.type === "quote" ? (
                  <div className="space-y-2">
                    <textarea
                      placeholder="Citação ou declaração importante..."
                      value={String(sec.content)}
                      onChange={(e) => updateSectionContent(idx, e.target.value, sec.caption)}
                      rows={2}
                      className="w-full p-3 rounded-xl  bg-background text-xs font-serif italic"
                    />
                    <Input
                      placeholder="Nome do autor da fala / cargo"
                      value={sec.caption || ""}
                      onChange={(e) => updateSectionContent(idx, String(sec.content), e.target.value)}
                      className="rounded-xl h-8 text-xs bg-background"
                    />
                  </div>
                ) : (
                  <textarea
                    placeholder="Digite o texto do parágrafo..."
                    value={String(sec.content)}
                    onChange={(e) => updateSectionContent(idx, e.target.value)}
                    rows={4}
                    className="w-full p-3 rounded-xl  bg-background text-xs leading-relaxed resize-y"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
