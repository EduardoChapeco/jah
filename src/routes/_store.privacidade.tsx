import { createFileRoute } from "@tanstack/react-router";
import { getLegalDocumentBySlug } from "@/services/legal.functions";
import { LegalDocumentViewer } from "@/components/legal/legal-document-viewer";
import { EmptyState } from "@/components/state/states";

export const Route = createFileRoute("/_store/privacidade")({
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData?.title
          ? `${loaderData.title} | Wider`
          : "Política de Privacidade e Proteção de Dados (LGPD) | Wider",
      },
    ],
  }),
  loader: async () => {
    try {
      const doc = await getLegalDocumentBySlug({ data: { slug: "privacidade" } });
      return doc;
    } catch {
      return null;
    }
  },
  component: PrivacidadePage,
});

function PrivacidadePage() {
  const doc = Route.useLoaderData();

  if (!doc) {
    return (
      <div className="container py-20">
        <EmptyState title="Documento de privacidade não encontrado" />
      </div>
    );
  }

  return <LegalDocumentViewer document={doc} />;
}
