import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Store,
  Plus,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  Package,
  Building2,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { getMyStoresList } from "@/services/store.functions";
import { setTenantContext } from "@/services/identity.functions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/_store/conta/lojas")({
  head: () => ({ meta: [{ title: "Minhas Lojas & Negócios | Wider" }] }),
  loader: async () => {
    const stores = await getMyStoresList().catch(() => []);
    return { stores: stores || [] };
  },
  component: ContaLojasPage,
});

export default function ContaLojasPage() {
  const { stores } = Route.useLoaderData();
  const [switchingId, setSwitchingId] = useState<string | null>(null);

  const handleSelectStore = async (storeId: string, storeName: string) => {
    setSwitchingId(storeId);
    try {
      await setTenantContext({ data: { store_id: storeId } });
      if (typeof window !== "undefined") {
        window.document.cookie = `wider_active_tenant=${storeId}; path=/; max-age=31536000; SameSite=Lax`;
        toast.success(`Contexto alterado para ${storeName}`);
        window.location.href = "/workspace";
      }
    } catch {
      toast.error("Erro ao alternar loja.");
      setSwitchingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-4">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Minhas Lojas & Negócios
            </h1>
            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
              {stores.length} {stores.length === 1 ? "Loja" : "Lojas"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Acesse o painel operacional de cada uma de suas lojas ou crie novas unidades.
          </p>
        </div>

        {/* Botão de Criação */}
        <div className="flex items-center gap-2">
          <Button asChild className="gap-2 rounded-xl text-xs font-bold ">
            <Link to="/criar-negocio">
              <Plus className="size-4" />
              Cadastrar Nova Loja
            </Link>
          </Button>
        </div>
      </div>

      {/* ── Grid de Lojas / Empty State ── */}
      {stores.length === 0 ? (
        <Card className="p-12 text-center rounded-3xl border border-dashed border-border/80 bg-card space-y-4 max-w-xl mx-auto my-6">
          <div className="size-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Store className="size-8" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-foreground">
              Nenhum negócio vinculado ao seu perfil
            </h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
              Você ainda não cadastrou uma loja ou filial com este usuário. Crie seu primeiro negócio para gerenciar produtos, pedidos, equipe e catálogo no Workspace operacional.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild className="rounded-xl text-xs font-bold gap-2">
              <Link to="/criar-negocio">
                <Plus className="size-4" />
                Cadastrar Meu Negócio
              </Link>
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stores.map((st: any) => {
            const isCurrentActive = st.is_active_context;
            const isCurrentSwitching = switchingId === st.id;

            return (
              <Card
                key={st.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between relative overflow-hidden bg-card ${
                  isCurrentActive
                    ? "border-primary/50 ring-1 ring-primary/20"
                    : "border-border hover:border-foreground/20"
                }`}
              >
              {isCurrentActive && (
                <div className="absolute top-3 right-3">
                  <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold px-2 py-0.5">
                    ● Painel Ativo
                  </Badge>
                </div>
              )}

              <div className="space-y-4">
                {/* Header do Card */}
                <div className="flex items-start gap-3.5 pr-20">
                  <div className="size-12 rounded-2xl bg-muted  flex items-center justify-center overflow-hidden shrink-0">
                    {st.logo_url ? (
                      <img
                        src={st.logo_url}
                        alt={st.name}
                        className="size-full object-cover"
                      />
                    ) : (
                      <Store className="size-6 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground line-clamp-1">
                      {st.name}
                    </h3>
                    <p className="text-xs text-muted-foreground font-mono">
                      /{st.slug}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1 text-[11px] text-muted-foreground">
                      <MapPin className="size-3 text-muted-foreground shrink-0" />
                      <span className="truncate">{st.city ? `${st.city} - ${st.state}` : "Brasil"}</span>
                    </div>
                  </div>
                </div>

                {/* Informações Rápidas */}
                <div className="grid grid-cols-2 gap-2 py-3 border-y border-border/60 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                      Função
                    </span>
                    <span className="font-semibold text-foreground flex items-center gap-1 capitalize">
                      <ShieldCheck className="size-3 text-primary" />
                      {st.role || "Proprietário"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                      Produtos
                    </span>
                    <span className="font-semibold text-foreground">
                      {st.product_count} cadastrados
                    </span>
                  </div>
                </div>
              </div>

              {/* Ações Inferiores */}
              <div className="pt-4 mt-2 flex items-center gap-2">
                <Button
                  onClick={() => handleSelectStore(st.id, st.name)}
                  disabled={isCurrentSwitching}
                  variant={isCurrentActive ? "default" : "secondary"}
                  className="flex-1 rounded-xl text-xs font-bold h-9 gap-1.5"
                >
                  {isCurrentSwitching ? (
                    "Carregando..."
                  ) : (
                    <>
                      <span>Acessar Workspace</span>
                      <ArrowRight className="size-3.5" />
                    </>
                  )}
                </Button>

                <Button
                  asChild
                  variant="outline"
                  size="icon"
                  className="size-9 rounded-xl shrink-0"
                  title="Ver Vitrine Pública"
                >
                  <Link to={`/destaques/${st.slug}` as any}>
                    <ExternalLink className="size-4 text-muted-foreground" />
                  </Link>
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
      )}
    </div>
  );
}
