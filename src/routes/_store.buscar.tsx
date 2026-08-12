import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { z } from "zod";
import { Search, X, Loader2, ShoppingBag, Calendar, Tag, Store, ChevronRight } from "lucide-react";

import {
  federatedSearch,
  type FederatedSearchResponse,
  type SearchResultProduct,
  type SearchResultEvent,
  type SearchResultClassified,
  type SearchResultStore,
} from "@/services/search.functions";
import { ProductGrid } from "@/components/commerce/product-grid";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/state/states";
import { PageSkeleton } from "@/components/state/loading";
import { formatMoney } from "@/lib/money";
import { toast } from "sonner";

const SearchSchema = z.object({
  q: z.string().optional(),
  tipo: z.enum(["product", "event", "classified", "store"]).optional(),
});

export const Route = createFileRoute("/_store/buscar")({
  head: () => ({ meta: [{ title: "Buscar — JAH" }] }),
  validateSearch: SearchSchema,
  loader: async ({ location }) => {
    const q = (location.search as { q?: string }).q;
    if (!q || q.trim().length < 2) return { result: null, query: q ?? "" };
    try {
      const result = await federatedSearch({ data: { query: q.trim() } });
      return { result, query: q };
    } catch {
      return { result: null, query: q };
    }
  },
  pendingComponent: PageSkeleton,
  component: SearchPage,
});

// ── Filtros de tipo ────────────────────────────────────────────────────────
const TYPE_FILTERS = [
  { key: "product" as const, label: "Produtos", icon: ShoppingBag },
  { key: "event" as const, label: "Eventos", icon: Calendar },
  { key: "classified" as const, label: "Classificados", icon: Tag },
  { key: "store" as const, label: "Lojas", icon: Store },
] as const;

function getTotalCount(result: FederatedSearchResponse | null): number {
  if (!result) return 0;
  return result.total;
}

// ── Cards de resultado ─────────────────────────────────────────────────────

function EventCard({ event }: { event: SearchResultEvent }) {
  const date = new Date(event.event_date);
  const formatted = date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  return (
    <Link
      to="/evento/$id"
      params={{ id: event.id }}
      className="flex gap-3 p-3 rounded-[var(--radius-op-md)] border border-border bg-card hover:bg-muted transition-colors group"
    >
      {event.cover_image ? (
        <img
          src={event.cover_image}
          alt={event.title}
          className="w-16 h-16 object-cover rounded-[var(--radius-op-sm)] flex-shrink-0"
        />
      ) : (
        <div className="w-16 h-16 bg-muted rounded-[var(--radius-op-sm)] flex-shrink-0 flex items-center justify-center">
          <Calendar className="size-6 text-muted-foreground" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-foreground truncate group-hover:text-primary">
          {event.title}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{formatted}</p>
        {event.location && (
          <p className="text-xs text-muted-foreground truncate">{event.location}</p>
        )}
        <Badge variant="secondary" className="mt-1 text-xs chip-status">
          {event.is_free ? "Gratuito" : "Pago"}
        </Badge>
      </div>
      <ChevronRight className="size-4 text-muted-foreground self-center flex-shrink-0" />
    </Link>
  );
}

function ClassifiedCard({ classified }: { classified: SearchResultClassified }) {
  const CATEGORY_LABELS: Record<string, string> = {
    job: "Vaga",
    job_offer: "Trabalho",
    sale: "Venda",
    trade: "Troca",
    service: "Serviço",
    real_estate: "Imóvel",
    vehicle: "Veículo",
    event: "Evento",
    donation: "Doação",
  };
  return (
    <div className="flex gap-3 p-3 rounded-[var(--radius-op-md)] border border-border bg-card hover:bg-muted transition-colors">
      {classified.images?.[0] ? (
        <img
          src={classified.images[0]}
          alt={classified.title}
          className="w-16 h-16 object-cover rounded-[var(--radius-op-sm)] flex-shrink-0"
        />
      ) : (
        <div className="w-16 h-16 bg-muted rounded-[var(--radius-op-sm)] flex-shrink-0 flex items-center justify-center">
          <Tag className="size-6 text-muted-foreground" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-foreground truncate">{classified.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{classified.content}</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <Badge variant="outline" className="text-xs chip-status">
            {CATEGORY_LABELS[classified.category] || classified.category}
          </Badge>
          {classified.price_cents !== null && classified.price_cents !== undefined ? (
            <span className="text-xs font-semibold text-foreground">
              {formatMoney(classified.price_cents)}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">À combinar</span>
          )}
          {classified.location_text && (
            <span className="text-xs text-muted-foreground truncate">
              {classified.location_text}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function StoreCard({ store }: { store: SearchResultStore }) {
  return (
    <Link
      to="/vendedora/$slug"
      params={{ slug: store.slug }}
      className="flex gap-3 p-3 rounded-[var(--radius-op-md)] border border-border bg-card hover:bg-muted transition-colors group"
    >
      {store.logo_url ? (
        <img
          src={store.logo_url}
          alt={store.name}
          className="w-12 h-12 object-cover rounded-[var(--radius-op-full)] flex-shrink-0"
        />
      ) : (
        <div className="w-12 h-12 bg-muted rounded-[var(--radius-op-full)] flex-shrink-0 flex items-center justify-center">
          <Store className="size-5 text-muted-foreground" />
        </div>
      )}
      <div className="flex-1 min-w-0 self-center">
        <p className="font-semibold text-sm text-foreground group-hover:text-primary">
          {store.name}
        </p>
        {store.description && (
          <p className="text-xs text-muted-foreground truncate">{store.description}</p>
        )}
      </div>
      <ChevronRight className="size-4 text-muted-foreground self-center flex-shrink-0" />
    </Link>
  );
}

// ── Seção de grupo de resultados ───────────────────────────────────────────

function ResultSection({
  title,
  count,
  icon: Icon,
  children,
}: {
  title: string;
  count: number;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  if (count === 0) return null;
  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="size-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <Badge variant="secondary" className="chip-status">
          {count}
        </Badge>
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

// ── Componente principal ───────────────────────────────────────────────────

function SearchPage() {
  const { result: initialResult, query: initialQuery } = Route.useLoaderData() as {
    result: FederatedSearchResponse | null;
    query: string;
  };
  const navigate = useNavigate();
  const [input, setInput] = useState(initialQuery ?? "");
  const [result, setResult] = useState<FederatedSearchResponse | null>(initialResult);
  const [isSearching, setIsSearching] = useState(false);
  const [activeType, setActiveType] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSearch = async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed || trimmed.length < 2) return;

    setIsSearching(true);
    navigate({ to: Route.fullPath, search: { q: trimmed } });

    try {
      const res = await federatedSearch({ data: { query: trimmed } });
      setResult(res);
    } catch (e: unknown) {
      toast.error((e instanceof Error ? e.message : String(e)) || "Erro ao buscar. Tente novamente.");
      setResult(null);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(input);
  };

  const handleClear = () => {
    setInput("");
    setResult(null);
    setActiveType(null);
    navigate({ to: Route.fullPath, search: {} });
    inputRef.current?.focus();
  };

  const total = getTotalCount(result);
  const hasResults = result !== null && total > 0;

  // Filtrar por tipo ativo
  const filteredProducts = !activeType || activeType === "product" ? (result?.products ?? []) : [];
  const filteredEvents = !activeType || activeType === "event" ? (result?.events ?? []) : [];
  const filteredClassifieds =
    !activeType || activeType === "classified" ? (result?.classifieds ?? []) : [];
  const filteredStores = !activeType || activeType === "store" ? (result?.stores ?? []) : [];

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-10 md:px-6 md:py-16">
      {/* Header */}
      <div className="mx-auto max-w-2xl text-center mb-10">
        <h1 className="font-display text-3xl md:text-4xl uppercase tracking-tighter text-foreground mb-2">
          Encontre o que procura
        </h1>
        <p className="text-sm text-muted-foreground">
          Produtos, eventos, classificados e lojas — tudo em um só lugar.
        </p>
      </div>

      {/* Search form */}
      <form onSubmit={handleSubmit} className="mx-auto max-w-2xl mb-6">
        <div className="relative flex items-center">
          <Search
            className="absolute left-4 size-5 text-muted-foreground pointer-events-none"
            aria-hidden
          />
          <Input
            ref={inputRef}
            id="input-buscar"
            type="search"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            className="h-14 pl-12 pr-32 text-base rounded-[var(--radius-op-sm)]"
            placeholder="Busque por produto, evento, vaga, serviço..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            aria-label="Buscar na plataforma"
          />
          {input && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-[7.5rem] size-7 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Limpar busca"
            >
              <X className="size-4" />
            </button>
          )}
          <Button
            id="btn-buscar"
            type="submit"
            disabled={isSearching || input.trim().length < 2}
            className="absolute right-2 h-10 px-5 rounded-[var(--radius-op-sm)]"
          >
            {isSearching ? <Loader2 className="size-4 animate-spin" /> : "Buscar"}
          </Button>
        </div>
      </form>

      {/* Filtros de tipo — aparecem somente quando há resultados */}
      {hasResults && (
        <div className="mx-auto max-w-2xl mb-8 flex flex-wrap gap-2 justify-center">
          <button
            onClick={() => setActiveType(null)}
            className={`chip-status px-4 py-1.5 border transition-colors ${!activeType ? "bg-foreground text-background border-foreground" : "bg-transparent text-muted-foreground border-border hover:border-foreground hover:text-foreground"}`}
          >
            Todos ({total})
          </button>
          {TYPE_FILTERS.map(({ key, label, icon: Icon }) => {
            const count =
              key === "product"
                ? (result?.products.length ?? 0)
                : key === "event"
                  ? (result?.events.length ?? 0)
                  : key === "classified"
                    ? (result?.classifieds.length ?? 0)
                    : (result?.stores.length ?? 0);
            if (count === 0) return null;
            return (
              <button
                key={key}
                onClick={() => setActiveType(activeType === key ? null : key)}
                className={`chip-status px-4 py-1.5 border transition-colors flex items-center gap-1.5 ${activeType === key ? "bg-foreground text-background border-foreground" : "bg-transparent text-muted-foreground border-border hover:border-foreground hover:text-foreground"}`}
              >
                <Icon className="size-3" />
                {label} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Estados */}
      {isSearching && (
        <div className="flex justify-center py-16">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isSearching && result !== null && !hasResults && (
        <EmptyState title="Nenhum resultado encontrado" />
      )}

      {/* Resultados por grupo */}
      {!isSearching && hasResults && (
        <div className="mx-auto max-w-3xl">
          {/* Produtos — usa o grid existente */}
          {filteredProducts.length > 0 && (!activeType || activeType === "product") && (
            <section className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <ShoppingBag className="size-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">Produtos</h2>
                <Badge variant="secondary" className="chip-status">
                  {filteredProducts.length}
                </Badge>
              </div>
              {/* Adaptar para ProductGrid que espera ProductCardDTO — passamos dados simplificados */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {filteredProducts.map((p) => (
                  <Link
                    key={p.id}
                    to="/produto/$slug"
                    params={{ slug: p.slug }}
                    className="card-op p-3 hover-elevate group transition-all"
                  >
                    <div className="aspect-square bg-muted rounded-[var(--radius-op-sm)] mb-2 flex items-center justify-center">
                      <ShoppingBag className="size-8 text-muted-foreground" />
                    </div>
                    <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary">
                      {p.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatMoney(p.price_cents)}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <ResultSection title="Eventos" count={filteredEvents.length} icon={Calendar}>
            {filteredEvents.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </ResultSection>

          <ResultSection title="Classificados" count={filteredClassifieds.length} icon={Tag}>
            {filteredClassifieds.map((c) => (
              <ClassifiedCard key={c.id} classified={c} />
            ))}
          </ResultSection>

          <ResultSection title="Lojas" count={filteredStores.length} icon={Store}>
            {filteredStores.map((s) => (
              <StoreCard key={s.id} store={s} />
            ))}
          </ResultSection>
        </div>
      )}

      {/* Estado vazio inicial (sem query) */}
      {!isSearching && result === null && !input && (
        <div className="mx-auto max-w-2xl text-center py-8">
          <p className="text-sm text-muted-foreground">Digite ao menos 2 caracteres para buscar.</p>
        </div>
      )}
    </div>
  );
}
