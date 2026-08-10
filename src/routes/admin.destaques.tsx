import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Pin, ArrowRight } from "lucide-react";

import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { EmptyState } from "@/components/state/states";
import { formatMoney } from "@/lib/money";
import { toggleProductCollection, getAdminDestaques } from "@/services/admin-catalog.functions";

export const Route = createFileRoute("/admin/destaques")({
  head: () => ({ meta: [{ title: "Destaques" }] }),
  loader: async () => {
    return await getAdminDestaques();
  },
  component: DestaquesPage,
});

function DestaquesPage() {
  const res = Route.useLoaderData();
  const router = useRouter();

  if (res.status !== "ok") {
    return (
      <div className="space-y-6">
        <PageHeader title="Destaques" description="Produtos em destaque na vitrine." />
        <EmptyState title="Sem dados" description="Loja não configurada." />
      </div>
    );
  }

  const products = Array.isArray(res) ? res : [];

  const handleToggle = async (productId: string, currentIsFeatured: boolean) => {
    toast.promise(
      toggleProductCollection({
        data: {
          productId,
          collectionSlug: "destaques",
          add: !currentIsFeatured,
        },
      }).then(() => {
        router.invalidate();
      }),
      {
        loading: "Atualizando destaque...",
        success: "Destaque atualizado!",
        error: "Erro ao atualizar",
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Destaques da Vitrine"
          description="Selecione os produtos publicados que serão destacados na Home e em coleções."
        />
        <Button asChild>
          <Link to="/admin/catalogo/produtos">
            Gerenciar Produtos
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {products.length === 0 ? (
        <EmptyState
          title="Nenhum produto publicado"
          description="Publique produtos em Catálogo → Produtos para que apareçam aqui."
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {products.map((p: any) => {
            const cover = p.product_media?.[0]?.url;
            const isFeatured = p.product_collections?.some(
              (pc: any) => pc.collections?.slug === "destaques",
            );
            return (
              <div
                key={p.id}
                className="group border bg-card overflow-hidden hover:shadow-md transition-shadow flex flex-col"
              >
                <Link to="/admin/catalogo/produtos/$id" params={{ id: p.id }} className="block">
                  <div className="aspect-square bg-muted relative overflow-hidden">
                    {cover ? (
                      <img
                        src={cover}
                        alt={p.product_media[0].alt || p.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Pin className="h-8 w-8 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                </Link>
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-sm font-medium truncate" title={p.title}>
                      {p.title}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatMoney(p.price_cents)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-3 border-t">
                    <span className="text-xs font-medium text-muted-foreground">
                      Destacar na Home
                    </span>
                    <Switch
                      checked={isFeatured}
                      onCheckedChange={() => handleToggle(p.id, isFeatured)}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
