import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { z } from "zod";
import {
  ShoppingBag,
  Calendar,
  Tag,
  Store,
  ChevronRight,
  Sparkles,
} from "lucide-react";

import {
  federatedSearch,
  type FederatedSearchResponse,
  type SearchResultProduct,
  type SearchResultEvent,
  type SearchResultClassified,
  type SearchResultStore,
} from "@/services/search.functions";
import { ProductGrid } from "@/components/commerce/product-grid";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/state/states";
import { PageSkeleton } from "@/components/state/loading";
import { formatMoney } from "@/lib/money";
import { toast } from "sonner";
import {
  DiscoveryControlBar,
  type ViewModeType,
  type FilterChipOption,
} from "@/components/commerce/discovery-control-bar";

const SearchSchema = z.object({
  q: z.string().optional(),
  tipo: z.enum(["product", "event", "classified", "store"]).optional(),
});

export const Route = createFileRoute("/_store/buscar")({
  head: () => ({ meta: [{ title: "Buscar na Plataforma — Wider" }] }),
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

const TYPE_FILTERS: FilterChipOption[] = [
  { id: "todos", label: "Tudo", icon: Sparkles as any },
  { id: "product", label: "Produtos", icon: ShoppingBag as any },
  { id: "classified", label: "Classificados", icon: Tag as any },
  { id: "store", label: "Lojas & Negócios", icon: Store as any },
  { id: "event", label: "Eventos", icon: Calendar as any },
];

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
      className="flex items-stretch rounded-2xl  bg-card hover:bg-muted/50 transition-colors overflow-hidden p-0 group"
    >
      <div className="relative w-20 sm:w-24 bg-muted shrink-0 overflow-hidden">
        {event.cover_image ? (
          <img
            src={event.cover_image}
            alt={event.title}
            className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="size-full bg-muted flex items-center justify-center">
            <Calendar className="size-6 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0 p-3 space-y-1">
        <p className="font-semibold text-xs sm:text-sm text-foreground truncate group-hover:text-primary">
          {event.title}
        </p>
        <p className="text-xs text-muted-foreground">{formatted}</p>
        {event.location && (
          <p className="text-xs text-muted-foreground truncate">{event.location}</p>
        )}
        <Badge variant="secondary" className="mt-1 text-[10px] chip-status">
          {event.is_free ? "Gratuito" : "Pago"}
        </Badge>
      </div>
      <ChevronRight className="size-4 text-muted-foreground self-center mr-3 shrink-0" />
    </Link>
  );
}

function ClassifiedCard({ classified }: { classified: SearchResultClassified }) {
  return (
    <Link
      to="/classificados/$id"
      params={{ id: classified.id }}
      className="flex items-stretch justify-between rounded-2xl  bg-card hover:border-foreground/30 transition-all overflow-hidden p-0 group"
    >
      <div className="relative w-24 sm:w-28 bg-muted shrink-0 overflow-hidden">
        {classified.images && classified.images[0] ? (
          <img
            src={classified.images[0]}
            alt={classified.title}
            className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="size-full flex items-center justify-center text-muted-foreground/30">
            <Tag size={24} />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 p-3 space-y-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          {classified.category && (
            <Badge variant="outline" className="text-[9px] uppercase font-mono px-1.5 py-0">
              {classified.category}
            </Badge>
          )}
          {(classified as any).deal_type && (
            <span className="text-[10px] font-mono text-muted-foreground uppercase font-bold">
              • {(classified as any).deal_type}
            </span>
          )}
        </div>

        <h3 className="font-bold text-xs sm:text-sm text-foreground truncate group-hover:text-primary transition-colors">
          {classified.title}
        </h3>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-mono font-black text-foreground text-sm">
            {classified.price_cents ? formatMoney(classified.price_cents) : "A combinar"}
          </span>
          {classified.location_text && (
            <>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground truncate">{classified.location_text}</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}

function StoreCard({ store }: { store: SearchResultStore }) {
  return (
    <Link
      to="/vendedora/$slug"
      params={{ slug: store.slug }}
      className="flex gap-3 p-3 rounded-2xl  bg-card hover:bg-muted transition-colors group"
    >
      {store.logo_url ? (
        <img
          src={store.logo_url}
          alt={store.name}
          className="size-12 object-cover rounded-xl shrink-0"
        />
      ) : (
        <div className="size-12 bg-muted rounded-xl shrink-0 flex items-center justify-center">
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
      <ChevronRight className="size-4 text-muted-foreground self-center shrink-0" />
    </Link>
  );
}

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
    <section className="mb-8 space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="size-4 text-primary" />
        <h2 className="text-sm font-bold text-foreground">{title}</h2>
        <Badge variant="secondary" className="text-[10px] font-mono">
          {count}
        </Badge>
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

// ── Componente Principal ───────────────────────────────────────────────────

function SearchPage() {
  const { result: initialResult, query: initialQuery } = Route.useLoaderData() as {
    result: FederatedSearchResponse | null;
    query: string;
  };
  const navigate = useNavigate();
  const [input, setInput] = useState(initialQuery ?? "");
  const [result, setResult] = useState<FederatedSearchResponse | null>(initialResult);
  const [activeType, setActiveType] = useState<string>("todos");
  const [viewMode, setViewMode] = useState<ViewModeType>("grid");

  const handleSearch = async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed || trimmed.length < 2) return;

    navigate({ to: Route.fullPath, search: { q: trimmed } });

    try {
      const res = await federatedSearch({ data: { query: trimmed } });
      setResult(res);
    } catch (e: unknown) {
      toast.error(
        (e instanceof Error ? e.message : String(e)) || "Erro ao buscar. Tente novamente.",
      );
      setResult(null);
    }
  };

  const total = getTotalCount(result);
  const hasResults = result !== null && total > 0;

  // Filtrar por tipo ativo
  const filteredProducts = activeType === "todos" || activeType === "product" ? (result?.products ?? []) : [];
  const filteredEvents = activeType === "todos" || activeType === "event" ? (result?.events ?? []) : [];
  const filteredClassifieds =
    activeType === "todos" || activeType === "classified" ? (result?.classifieds ?? []) : [];
  const filteredStores = activeType === "todos" || activeType === "store" ? (result?.stores ?? []) : [];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-6">
      {/* ── 1. Barra de Busca Canônica Padronizada ── */}
      <DiscoveryControlBar
        search={input}
        onSearchChange={(val) => {
          setInput(val);
          if (val.length >= 2) handleSearch(val);
          else if (!val) setResult(null);
        }}
        searchPlaceholder="Busque por produto, mercado, vaga, serviço, passeio..."
        categories={TYPE_FILTERS}
        activeCategory={activeType}
        onSelectCategory={setActiveType}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        allowedViewModes={["grid", "list"]}
        resultsCount={total}
      />

      {/* ── 2. Estado Inicial (Sugestões, Termos em Alta e Categorias Rápidas) ── */}
      {!input && !hasResults && (
        <div className="space-y-6 pt-2">
          {/* Termos Populares / Em Alta */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-muted-foreground">
                Buscas Populares na Cidade
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                "Pizza Artesanal",
                "Hortifrúti & Feira",
                "Carros & Motos",
                "Apartamento Aluguel",
                "Farmácia 24h",
                "Eletricista & Obras",
                "Corte de Cabelo",
                "Vagas de Emprego",
                "Shows & Festas",
                "Passeios & Cachoeiras",
              ].map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => {
                    setInput(term);
                    handleSearch(term);
                  }}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-card hover:bg-primary/10 hover:text-primary hover:border-primary/40 text-foreground  transition-all cursor-pointer select-none active:scale-95 "
                >
                  {term}
                </button>
              ))}
            </div>
          </div>

          {/* Atalhos Rápidos para Verticais */}
          <div className="space-y-3 pt-2">
            <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-muted-foreground">
              Explorar por Departamento
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { to: "/mercado", label: "Mercado & Feira", icon: ShoppingBag, color: "text-emerald-600 bg-emerald-500/10" },
                { to: "/gastronomia", label: "Gastronomia", icon: Store, color: "text-orange-600 bg-orange-500/10" },
                { to: "/classificados", label: "Classificados", icon: Tag, color: "text-amber-600 bg-amber-500/10" },
                { to: "/agenda", label: "Eventos & Festas", icon: Calendar, color: "text-purple-600 bg-purple-500/10" },
              ].map((cat) => {
                const Icon = cat.icon;
                return (
                  <Link
                    key={cat.to}
                    to={cat.to as any}
                    className="flex items-center gap-3 p-3 rounded-2xl  bg-card hover:bg-muted/60 transition-all group"
                  >
                    <div className={`flex size-9 items-center justify-center rounded-xl ${cat.color} shrink-0 group-hover:scale-105 transition-transform`}>
                      <Icon className="size-4.5" />
                    </div>
                    <span className="text-xs font-bold text-foreground truncate">
                      {cat.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {input.length >= 2 && result !== null && total === 0 && (
        <div className="py-12 text-center space-y-4 bg-card rounded-3xl  p-6 ">
          <EmptyState
            title={`Nenhum resultado encontrado para "${input}"`}
            description="Tente buscar por termos mais genéricos ou explore as categorias abaixo."
          />
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <Link
              to="/mercado"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
            >
              Ir para o Mercado
            </Link>
            <Link
              to="/gastronomia"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-muted hover:bg-muted/80 text-foreground transition-all"
            >
              Ver Restaurantes
            </Link>
            <Link
              to="/classificados"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-muted hover:bg-muted/80 text-foreground transition-all"
            >
              Explorar Desapegos
            </Link>
          </div>
        </div>
      )}

      {hasResults && (
        <div className="space-y-6 pt-2">
          {/* Seção de Lojas */}
          <ResultSection
            title="Lojas & Comércios"
            count={filteredStores.length}
            icon={Store}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filteredStores.map((store) => (
                <StoreCard key={store.id} store={store} />
              ))}
            </div>
          </ResultSection>

          {/* Seção de Produtos */}
          {filteredProducts.length > 0 && (
            <section className="mb-8 space-y-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="size-4 text-primary" />
                <h2 className="text-sm font-bold text-foreground">Produtos & Cardápio</h2>
                <Badge variant="secondary" className="text-[10px] font-mono">
                  {filteredProducts.length}
                </Badge>
              </div>
              <ProductGrid
                result={{
                  status: "ok",
                  data: filteredProducts as any,
                  total: filteredProducts.length,
                } as any}
                viewMode={viewMode === "list" ? "list" : "grid"}
              />
            </section>
          )}

          {/* Seção de Classificados */}
          <ResultSection
            title="Classificados & Anúncios"
            count={filteredClassifieds.length}
            icon={Tag}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredClassifieds.map((classified) => (
                <ClassifiedCard key={classified.id} classified={classified} />
              ))}
            </div>
          </ResultSection>

          {/* Seção de Eventos */}
          <ResultSection
            title="Eventos & Agenda Cultural"
            count={filteredEvents.length}
            icon={Calendar}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filteredEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </ResultSection>
        </div>
      )}
    </div>
  );
}
