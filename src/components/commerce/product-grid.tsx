import { ProductGridSkeleton } from "@/components/state/loading";
import { EmptyState, UnconfiguredState, ErrorState } from "@/components/state/states";
import { DynamicProductCard } from "@/components/commerce/dynamic-product-card";
import type { ProductListResult } from "@/types/catalog";

export function ProductGrid({
  isLoading,
  result,
}: {
  isLoading?: boolean;
  result: ProductListResult;
}) {
  if (isLoading) {
    return <ProductGridSkeleton count={8} />;
  }

  if (result.status === "unconfigured") {
    return <UnconfiguredState title="Catálogo não disponível" description={result.reason} />;
  }

  if (
    result.status === "empty" ||
    !("data" in result) ||
    !result.data ||
    result.data.length === 0
  ) {
    return (
      <EmptyState
        title="Nenhum produto publicado ainda"
        description="Assim que a loja publicar os primeiros produtos, eles aparecerão aqui."
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {result.data.map((product) => (
        <DynamicProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
