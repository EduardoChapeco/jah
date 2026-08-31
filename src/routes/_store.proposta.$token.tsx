import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Download,
  Share2,
  CheckCircle,
  MessageCircle,
  Sparkle,
  ShieldCheck,
  MapPin,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  getPublicTravelProposalByToken,
  approveTravelProposal,
  type TravelProposalDTO,
} from "@/services/travel-proposal.functions";
import { ProposalCanvasRenderer } from "@/components/tourism/studio/proposal-canvas-renderer";
import { exportElementAsPdf } from "@/lib/pdf-export";

export const Route = createFileRoute("/_store/proposta/$token")({
  head: ({ loaderData }: { loaderData?: { proposal: TravelProposalDTO | null } }) => ({
    meta: [
      {
        title: loaderData?.proposal
          ? `Proposta de Viagem: ${loaderData.proposal.destination_city} — Wider`
          : "Proposta de Viagem — Wider",
      },
      {
        name: "description",
        content: "Visualize seu roteiro exclusivo, malha aérea, hospedagem e condições especiais de viagem.",
      },
    ],
  }),
  loader: async ({ params }) => {
    const proposal = await getPublicTravelProposalByToken({ data: { token: params.token } });
    return { proposal };
  },
  component: PublicTravelProposalPage,
});

function PublicTravelProposalPage() {
  const { proposal } = Route.useLoaderData();
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isApproved, setIsApproved] = useState(proposal?.status === "approved");

  const approveMutation = useMutation({
    mutationFn: () => approveTravelProposal({ data: { token: proposal!.public_token } }),
    onSuccess: (res) => {
      setIsApproved(true);
      toast.success(res.message);
    },
    onError: (err: any) => toast.error(err?.message || "Erro ao aprovar proposta."),
  });

  if (!proposal) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center space-y-4">
        <h2 className="text-lg font-bold text-foreground">Proposta não encontrada</h2>
        <p className="text-xs text-muted-foreground">
          Esta proposta pode ter expirado ou o link informado está incorreto.
        </p>
        <Button asChild size="sm" variant="outline" className="rounded-xl">
          <Link to="/turismo">Explorar Outros Destinos</Link>
        </Button>
      </div>
    );
  }

  const handleExportPdf = async () => {
    try {
      setIsExportingPdf(true);
      await exportElementAsPdf("public-proposal-canvas", `${proposal.title.replace(/\s+/g, "_")}.pdf`);
      toast.success("PDF da proposta baixado com sucesso!");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao gerar PDF.");
    } finally {
      setIsExportingPdf(false);
    }
  };

  const cleanWhatsapp = (proposal.agency_whatsapp || "").replace(/\D/g, "");
  const waConfirmMessage = encodeURIComponent(
    `Olá! Gostei muito da proposta #${proposal.public_token} para ${proposal.destination_city} e gostaria de prosseguir com a reserva e emissão dos vouchers!`
  );

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6 animate-in fade-in duration-200">
      {/* ── 1. FLOATING ACTION HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-card border border-border/80 sticky top-4 z-20 shadow-md">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-foreground truncate">{proposal.title}</span>
            {isApproved ? (
              <Badge className="bg-emerald-600 text-white text-[10px] font-bold">
                ✓ Proposta Aprovada
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] font-mono font-bold">
                Aguardando Aprovação
              </Badge>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Consultoria por: <span className="font-bold text-foreground">{proposal.agency_name}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isExportingPdf}
            onClick={handleExportPdf}
            className="rounded-xl text-xs font-bold gap-1.5 h-10"
          >
            <Download className="size-3.5" />
            <span>{isExportingPdf ? "Gerando..." : "Baixar PDF"}</span>
          </Button>

          {cleanWhatsapp && (
            <Button
              asChild
              size="sm"
              variant="outline"
              className="rounded-xl text-xs font-bold gap-1.5 h-10 border-emerald-500/40 text-emerald-700 hover:bg-emerald-50"
            >
              <a
                href={`https://wa.me/55${cleanWhatsapp}?text=${waConfirmMessage}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="size-4 text-emerald-600" />
                <span>Tirar Dúvidas</span>
              </a>
            </Button>
          )}

          {!isApproved && (
            <Button
              type="button"
              size="sm"
              disabled={approveMutation.isPending}
              onClick={() => approveMutation.mutate()}
              className="rounded-xl text-xs font-bold gap-1.5 h-10 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <CheckCircle className="size-4" />
              <span>{approveMutation.isPending ? "Aprovando..." : "Aprovar Proposta"}</span>
            </Button>
          )}
        </div>
      </div>

      {/* ── 2. RENDERIZAÇÃO DA LÂMINA EDITORIAL ── */}
      <div id="public-proposal-canvas" className="rounded-3xl border border-border/80 shadow-lg overflow-hidden bg-white">
        <ProposalCanvasRenderer proposal={proposal} />
      </div>
    </div>
  );
}
