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
        description="Organize os menus principais e rodapés da sua vitrine."
        actions={
          <Button onClick={() => {}} className="font-bold border-2 border-ink shadow-hard">
            <Plus className="mr-2 h-4 w-4" />
            Novo Menu
          </Button>
        }
      />

      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <EmptyState
            title="Nenhum menu configurado"
            description="A navegação customizada ainda não foi configurada. Em breve você poderá criar menus aninhados para sua vitrine."
          />
        </div>
      </div>
    </div>
  );
}
