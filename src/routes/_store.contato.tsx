import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/commerce/page-header";
import { EmptyState } from "@/components/state/states";

export const Route = createFileRoute("/_store/contato")({
  head: () => ({ meta: [{ title: "Contato" }] }),
  component: Page,
});

function Page() {
  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8 md:px-6 md:py-12">
      <EmptyState title="Canais de contato em configuração" />
    </div>
  );
}
