import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import {
  Plus,
  MoreHorizontal,
  Edit,
  Archive,
  RotateCcw,
  EyeOff,
  Check,
  Search,
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/state/states";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { listCollections, updateCollection } from "@/services/admin-catalog.functions";

export const Route = createFileRoute("/workspace/catalogo/colecoes/")({
  head: () => ({ meta: [{ title: "Coleções & Agrupamentos | Workspace Wider" }] }),
  loader: async () => {
    try {
      const res = await listCollections();
      return res || [];
    } catch {
      return [];
    }
  },
  component: AdminCollectionsPage,
});

function AdminCollectionsPage() {
  const collections = Route.useLoaderData();
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<"active" | "archived">("active");
  const [searchQuery, setSearchQuery] = useState("");

  const activeCollectionsCount = collections.filter((c: any) => c.status !== "archived").length;
  const archivedCollectionsCount = collections.filter((c: any) => c.status === "archived").length;

  const filteredCollections = useMemo(() => {
    return collections.filter((c: any) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.slug.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "active" ? c.status !== "archived" : c.status === "archived";

      return matchesSearch && matchesStatus;
    });
  }, [collections, searchQuery, statusFilter]);

  const handleUpdateStatus = async (id: string, newStatus: "active" | "inactive" | "archived") => {
    try {
      const res = await updateCollection({ data: { id, status: newStatus } });
      if (res) {
        toast.success(
          newStatus === "archived"
            ? "Coleção arquivada com sucesso!"
            : "Coleção reativada/atualizada!",
        );
        router.invalidate();
      } else {
        toast.error(res.message || "Erro ao atualizar coleção");
      }
    } catch {
      toast.error("Erro inesperado ao atualizar status");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Catálogo"
        title="Coleções"
        actions={
          <Button asChild size="sm" className="rounded-xl font-bold text-xs gap-1.5 bg-primary text-primary-foreground ">
            <Link to="/workspace/catalogo/colecoes/novo">
              <Plus className="size-3.5" aria-hidden />
              <span>Nova Coleção</span>
            </Link>
          </Button>
        }
      />

      {/* Toolbar & Filtros */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3  bg-card rounded-2xl px-4 py-3 ">
        <Tabs
          defaultValue="active"
          value={statusFilter}
          onValueChange={(val) => setStatusFilter(val as "active" | "archived")}
        >
          <TabsList className="grid w-[280px] grid-cols-2 h-8">
            <TabsTrigger value="active" className="text-xs">Ativas ({activeCollectionsCount})</TabsTrigger>
            <TabsTrigger value="archived" className="text-xs">Arquivo Morto ({archivedCollectionsCount})</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" aria-hidden />
          <Input
            type="search"
            placeholder="Buscar por nome ou slug..."
            className="pl-8 text-xs w-full rounded-xl h-8 bg-background"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {filteredCollections.length === 0 ? (
        <div className="py-12 text-center rounded-3xl border-0 bg-card/60 space-y-4">
          <div className="size-12 rounded-2xl bg-muted flex items-center justify-center mx-auto text-muted-foreground">
            <Plus className="size-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground">
              {statusFilter === "active"
                ? "Nenhuma coleção cadastrada"
                : "Nenhuma coleção no arquivo morto"}
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Crie coleções temáticas e sazonais para agrupar produtos na vitrine da sua loja.
            </p>
          </div>
          {statusFilter === "active" && (
            <Button asChild size="sm" className="rounded-xl font-bold text-xs gap-1.5 bg-primary text-primary-foreground ">
              <Link to="/workspace/catalogo/colecoes/novo">
                <Plus className="size-4" />
                <span>Criar Primeira Coleção</span>
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden bg-card border border-border/60">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Coleção & Slug</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[80px] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCollections.map((col: any) => (
                  <TableRow key={col.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="pl-4 pr-0">
                      <div className="size-10 rounded-xl bg-muted/60 border border-border/50 overflow-hidden flex items-center justify-center shrink-0">
                        {col.cover_url || col.image_url ? (
                          <img
                            src={col.cover_url || col.image_url}
                            alt={col.name}
                            className="size-full object-cover"
                          />
                        ) : (
                          <span className="text-[10px] font-bold text-muted-foreground uppercase">
                            {col.name.slice(0, 2)}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <Link
                          to={`/workspace/catalogo/colecoes/${col.id}` as any}
                          className="font-bold text-xs text-foreground hover:text-primary transition-colors block"
                        >
                          {col.name}
                        </Link>
                        <span className="text-muted-foreground font-mono text-[11px] block">
                          /{col.slug}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          col.status === "active"
                            ? "default"
                            : col.status === "archived"
                              ? "outline"
                              : "secondary"
                        }
                        className="text-[10px] font-semibold"
                      >
                        {col.status === "active"
                          ? "● Ativa"
                          : col.status === "inactive"
                            ? "● Inativa"
                            : "● Arquivada"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Ações da coleção">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {col.status !== "archived" ? (
                            <>
                              <DropdownMenuItem asChild>
                                <Link to={`/workspace/catalogo/colecoes/${col.id}` as any}>
                                  <Edit className="mr-2 size-3.5" />
                                  Editar Coleção
                                </Link>
                              </DropdownMenuItem>
                              {col.status === "active" ? (
                                <DropdownMenuItem
                                  onClick={() => handleUpdateStatus(col.id, "inactive")}
                                >
                                  <EyeOff className="mr-2 size-3.5" />
                                  Desativar
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => handleUpdateStatus(col.id, "active")}
                                >
                                  <Check className="mr-2 size-3.5 text-success" />
                                  Ativar
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => handleUpdateStatus(col.id, "archived")}
                              >
                                <Archive className="mr-2 size-3.5" />
                                Arquivar
                              </DropdownMenuItem>
                            </>
                          ) : (
                            <DropdownMenuItem onClick={() => handleUpdateStatus(col.id, "active")}>
                              <RotateCcw className="mr-2 size-3.5" />
                              Restaurar
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
