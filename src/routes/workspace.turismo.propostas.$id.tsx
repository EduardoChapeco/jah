import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  ArrowLeft,
  Download,
  Image as ImageIcon,
  Send,
  Check,
  Loader2,
  Copy,
  ExternalLink,
  Sparkle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  getTravelProposalById,
  updateTravelProposal,
  type TravelProposalDTO,
  type ProposalCanvasFormat,
} from "@/services/travel-proposal.functions";
import { StudioFrame, CANVAS_DIMENSIONS } from "@/components/tourism/studio/studio-frame";
import { ProposalCanvasRenderer } from "@/components/tourism/studio/proposal-canvas-renderer";
import { StudioSidebarEditor } from "@/components/tourism/studio/studio-sidebar-editor";
import { exportElementAsPdf, exportElementAsImage } from "@/lib/pdf-export";

export const Route = createFileRoute("/workspace/turismo/propostas/$id")({
  head: () => ({ meta: [{ title: "Studio de Propostas & Lâminas | Workspace Wider" }] }),
  loader: async ({ params }) => {
    const proposal = await getTravelProposalById({ data: { id: params.id } });
    return { proposal };
  },
  component: WorkspaceProposalStudioPage,
});

function WorkspaceProposalStudioPage() {
  const { proposal: initialProposal } = Route.useLoaderData();
  const [proposal, setProposal] = useState<TravelProposalDTO | null>(initialProposal);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingImage, setIsExportingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const saveMutation = useMutation({
    mutationFn: (patch: Partial<TravelProposalDTO>) =>
      updateTravelProposal({
        data: {
          id: proposal!.id,
          patch,
        },
      }),
    onMutate: () => setIsSaving(true),
    onSettled: () => setIsSaving(false),
    onError: (err: any) => toast.error(err?.message || "Erro ao salvar alterações"),
  });

  const handleChange = useCallback(
    (patch: Partial<TravelProposalDTO>) => {
      if (!proposal) return;
      const next = { ...proposal, ...patch };
      setProposal(next);
      saveMutation.mutate(patch);
    },
    [proposal, saveMutation]
  );

  if (!proposal) {
    return (
      <div className="py-20 text-center space-y-4">
        <h2 className="text-sm font-bold text-foreground">Proposta não encontrada</h2>
        <Button asChild size="sm" variant="outline" className="rounded-xl">
          <Link to="/workspace/turismo/cotacoes">Voltar para Cotações</Link>
        </Button>
      </div>
    );
  }

  const publicUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/proposta/${proposal.public_token}`;

  const handleCopyLink = () => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(publicUrl);
      toast.success("Link público da proposta copiado!");
    }
  };

  const handleExportPdf = async () => {
    try {
      setIsExportingPdf(true);
      await exportElementAsPdf("proposal-canvas", `${proposal.title.replace(/\s+/g, "_")}.pdf`);
      toast.success("PDF gerado e baixado com sucesso!");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao exportar PDF.");
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportImage = async () => {
    try {
      setIsExportingImage(true);
      await exportElementAsImage("proposal-canvas", `${proposal.title.replace(/\s+/g, "_")}.png`);
      toast.success("Imagem PNG gerada e baixada com sucesso!");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao exportar imagem.");
    } finally {
      setIsExportingImage(false);
    }
  };

  const cleanWhatsapp = (proposal.client_whatsapp || "").replace(/\D/g, "");
  const waMessage = encodeURIComponent(
    `Olá ${proposal.client_name}! Preparamos a sua proposta personalizada de viagem para ${proposal.destination_city}. Você pode visualizá-la online no link:\n\n${publicUrl}`
  );

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* ── 1. TOP TOOLBAR ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-card border border-border/80">
        <div className="flex items-center gap-3">
          <Button asChild size="sm" variant="ghost" className="size-8 p-0 rounded-xl">
            <Link to="/workspace/turismo/cotacoes">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>

          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-foreground truncate max-w-xs sm:max-w-md">
                {proposal.title}
              </h1>
              <Badge variant="outline" className="text-[10px] font-mono uppercase font-bold">
                {proposal.status}
              </Badge>
              {isSaving ? (
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
                  <Loader2 className="size-3 animate-spin text-primary" /> Salvando...
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-mono">
                  <Check className="size-3" /> Salvo
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Cliente: <span className="font-bold text-foreground">{proposal.client_name}</span> • Destino: {proposal.destination_city}
            </p>
          </div>
        </div>

        {/* Formatos do Canvas & Ações de Exportação */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Seletor de Formato */}
          <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border/40">
            {(["a4-portrait", "a4-landscape", "story-916"] as ProposalCanvasFormat[]).map((fmt) => (
              <button
                key={fmt}
                type="button"
                onClick={() => handleChange({ canvas_format: fmt })}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  proposal.canvas_format === fmt
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {CANVAS_DIMENSIONS[fmt].iconEmoji} {fmt === "a4-portrait" ? "A4" : fmt === "a4-landscape" ? "Paisagem" : "Story"}
              </button>
            ))}
          </div>

          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isExportingImage}
            onClick={handleExportImage}
            className="rounded-xl text-xs font-bold gap-1.5 h-9"
          >
            <ImageIcon className="size-3.5" />
            <span>{isExportingImage ? "Exportando..." : "Baixar PNG"}</span>
          </Button>

          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isExportingPdf}
            onClick={handleExportPdf}
            className="rounded-xl text-xs font-bold gap-1.5 h-9"
          >
            <Download className="size-3.5" />
            <span>{isExportingPdf ? "Gerando..." : "Baixar PDF"}</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleCopyLink}
            className="rounded-xl text-xs font-bold gap-1.5 h-9 bg-foreground text-background hover:bg-foreground/90"
          >
            <Copy className="size-3.5" />
            <span>Copiar Link</span>
          </Button>

          {cleanWhatsapp && (
            <Button
              asChild
              size="sm"
              className="rounded-xl text-xs font-bold gap-1.5 h-9 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <a
                href={`https://wa.me/55${cleanWhatsapp}?text=${waMessage}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Send className="size-3.5" />
                <span>Enviar no WhatsApp</span>
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* ── 2. STUDIO WORKSPACE: SIDEBAR EDITOR + TRUTHFUL CANVAS PREVIEW ── */}
      <div className="flex flex-col lg:flex-row items-start gap-4">
        {/* Editor Lateral */}
        <StudioSidebarEditor proposal={proposal} onChange={handleChange} />

        {/* Truthful Preview Canvas */}
        <StudioFrame format={proposal.canvas_format}>
          <ProposalCanvasRenderer proposal={proposal} />
        </StudioFrame>
      </div>
    </div>
  );
}
