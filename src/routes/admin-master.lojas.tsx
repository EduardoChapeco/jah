import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import { getPlatformStoresList, toggleStoreStatus } from "@/services/master.functions";
import { setTenantContext } from "@/services/identity.functions";
import { Surface } from "@/components/ui/surface";
import { Store, Search, Filter, Eye, Download, ExternalLink, ShieldAlert, Sparkles } from "lucide-react";
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

  const handleImpersonateStore = async (storeId: string, storeName: string) => {
    setLoadingId(storeId);
    try {
      if (typeof window !== "undefined") {
        window.document.cookie = `wider_active_tenant=${storeId}; path=/; max-age=31536000; SameSite=Lax`;
      }
      await setTenantContext({ data: { store_id: storeId } }).catch(() => null);
      toast.success(`Acessando painel de "${storeName}" em modo Olho de Deus...`);
      window.location.href = "/workspace";
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro ao assumir contexto da loja.");
      setLoadingId(null);
    }
  };

  const handleExportStoresCsv = () => {
    const headers = ["ID", "Nome", "Slug", "Criado Em", "Status", "Tipo"];
    const rows = filteredStores.map((st: any) => [
      `"${st.id}"`,
      `"${st.name.replace(/"/g, '""')}"`,
      `"${st.slug}"`,
      `"${st.created_at}"`,
      `"${st.is_active ? "Ativo" : "Bloqueado"}"`,
      `"${st.settings?.segment || "Geral"}"`,
    ]);
    const csvContent = [headers.join(","), ...rows.map((r: any) => r.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `lojas_wider_master_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Arquivo CSV exportado com sucesso!");
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row gap-4 justify-between md:items-end">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight flex items-center gap-2">
            <Store className="size-8 text-primary" />
            Ecossistema de Lojas & Empresas
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Gestão global, modo Olho de Deus (impersonate), bloqueio e auditoria de todos os negócios registrados.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportStoresCsv}
            className="h-10 px-4 rounded-xl font-bold text-xs gap-2 cursor-pointer bg-card"
          >
            <Download className="size-4 text-primary" />
            <span>Exportar CSV Geral</span>
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border/70 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-border/40 bg-muted/20 flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou slug..."
              className="pl-9 bg-background h-10 rounded-xl text-xs"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <span className="text-xs font-mono font-bold text-muted-foreground">
            {filteredStores.length} lojas registradas
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/40 text-muted-foreground border-b border-border/40 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-6 py-4">Negócio</th>
                <th className="px-6 py-4">Acesso (Slug)</th>
                <th className="px-6 py-4">Registro</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ações & Olho de Deus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filteredStores.map((store: any) => (
                <tr key={store.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-foreground">{store.name}</p>
                    <span className="text-[10px] text-muted-foreground font-mono">ID: {store.id.slice(0, 8)}...</span>
                  </td>
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
                        className="bg-emerald-600 text-white uppercase text-[9px] tracking-wider font-bold"
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
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Botão Olho de Deus (Impersonate) */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleImpersonateStore(store.id, store.name)}
                        disabled={loadingId === store.id}
                        className="h-8 px-3 rounded-xl font-bold text-xs gap-1.5 cursor-pointer bg-primary/5 hover:bg-primary hover:text-primary-foreground border-primary/30 transition-all"
                        title="Entrar no painel de gestão desta loja com plenos poderes (Olho de Deus)"
                      >
                        <Eye className="size-3.5" />
                        <span className="hidden xl:inline">Olho de Deus</span>
                      </Button>

                      {/* Ver Vitrine Pública */}
                      <Button
                        asChild
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2.5 rounded-xl text-xs font-bold gap-1 cursor-pointer"
                        title="Ver página pública da loja"
                      >
                        <Link to="/perfil-da-loja" search={{ storeId: store.id }}>
                          <ExternalLink className="size-3.5 text-muted-foreground" />
                        </Link>
                      </Button>

                      {/* Bloquear / Desbloquear */}
                      <Button
                        size="sm"
                        variant={store.is_active ? "outline" : "default"}
                        disabled={loadingId === store.id}
                        onClick={() => handleToggleStore(store.id, store.is_active)}
                        className="h-8 px-3 rounded-xl font-bold text-xs cursor-pointer"
                      >
                        {store.is_active ? "Bloquear" : "Desbloquear"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredStores.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground text-xs">
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
