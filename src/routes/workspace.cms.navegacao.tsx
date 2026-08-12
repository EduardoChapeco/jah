import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";

import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/state/states";

export const Route = createFileRoute("/workspace/cms/navegacao")({
  head: () => ({ meta: [{ title: "Menus de Navegação" }] }),
  component: CmsNavigationPage,
});

function CmsNavigationPage() {
  return (
    <div className="flex flex-col h-full bg-muted/10">
      <PageHeader
        title="Navegação"
        actions={
          <Button onClick={() => {}} className="font-bold border border-border shadow-sm">
            <Plus className="mr-2 h-4 w-4" />
            Novo Menu
          </Button>
        }
      />

      <div className="flex-1 p-6">
        <div>
          <EmptyState title="Nenhum menu configurado" />
        </div>
      </div>
    </div>
  );
}
