import { createFileRoute, useRouter } from "@tanstack/react-router";
import { getPlatformStoresList, toggleStoreStatus } from "@/services/master.functions";
import { Surface } from "@/components/ui/surface";
import { Store, Search, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/admin-master/lojas")({
  head: () => ({ meta: [{ title: "Lojas - Master" }] }),
  loader: async () => {
    const stores = await getPlatformStoresList();
    return { stores };
  },
  component: MasterLojasPage,
});

function MasterLojasPage() {
  const { stores } = Route.useLoaderData();
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredStores = stores.filter(
    (s: any) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.slug.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleToggleStore = async (storeId: string, currentStatus: boolean) => {
    if (
      !confirm(
        `Deseja realmente ${currentStatus ? "bloquear" : "desbloquear"} esta loja no ecossistema?`,
      )
    )
      return;

    setLoadingId(storeId);
    try {
      await toggleStoreStatus({ data: { storeId, isActive: !currentStatus } });
      toast.success("Status da loja alterado com sucesso.");
      router.invalidate();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row gap-4 justify-between md:items-end">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight flex items-center gap-2">
            <Store className="size-8" />
            Ecossistema de Lojas
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestão e supervisão de todos os negócios registrados na plataforma.
          </p>
        </div>
      </div>

      <div className="border border-border bg-card rounded-xl overflow-hidden">
        <div className="p-4 border-b bg-muted/30 flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou slug..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="font-semibold text-xs h-9">
              <Filter className="size-3 mr-2" />
              Filtrar
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground border-b font-medium uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-6 py-4">Negócio</th>
                <th className="px-6 py-4">Acesso (Slug)</th>
                <th className="px-6 py-4">Registro</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredStores.map((store: any) => (
                <tr key={store.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 font-bold text-foreground">{store.name}</td>
                  <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                    /{store.slug}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground text-xs">
                    {format(new Date(store.created_at), "dd 'de' MMM, yyyy", { locale: ptBR })}
                  </td>
                  <td className="px-6 py-4">
                    {store.is_active ? (
                      <Badge
                        variant="default"
                        className="bg-success text-white uppercase text-[9px] tracking-wider font-bold"
                      >
                        Operante
                      </Badge>
                    ) : (
                      <Badge
                        variant="destructive"
                        className="uppercase text-[9px] tracking-wider font-bold"
                      >
                        Bloqueada
                      </Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button
                      size="sm"
                      variant={store.is_active ? "outline" : "default"}
                      disabled={loadingId === store.id}
                      onClick={() => handleToggleStore(store.id, store.is_active)}
                      className="font-bold text-xs"
                    >
                      {store.is_active ? "Bloquear Operação" : "Desbloquear Operação"}
                    </Button>
                  </td>
                </tr>
              ))}
              {filteredStores.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    Nenhuma loja encontrada para sua busca.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
