import { createFileRoute, redirect } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { getOrCreateBiolinkExperienceDocument } from "@/services/builder.functions";

export const Route = createFileRoute("/workspace/cms/bio")({
  head: () => ({ meta: [{ title: "Abrindo Construtor Visual do Link da Bio | Wider" }] }),
  loader: async () => {
    try {
      const res = await getOrCreateBiolinkExperienceDocument();
      if (res?.documentId) {
        throw redirect({
          to: "/workspace/builder/$documentId/editor",
          params: { documentId: res.documentId },
        });
      }
    } catch (e: any) {
      // If it's already a redirect, re-throw it
      if (e?.to || e?.status) throw e;
    }

    // Fallback: Redireciona para o Hub de Sites & Vitrines
    throw redirect({
      to: "/workspace/marketing/vitrine",
    });
  },
  component: BiolinkRedirectPage,
});

function BiolinkRedirectPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <Sparkles className="size-8 text-primary animate-spin" />
      <p className="text-sm font-bold text-foreground">Abrindo o Construtor Visual do Link da Bio...</p>
      <p className="text-xs text-muted-foreground">Carregando canvas, nós visuais e temas responsivos.</p>
    </div>
  );
}

export default BiolinkRedirectPage;
