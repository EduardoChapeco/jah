import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Plus, Edit3, Trash2, Search, FileText } from "lucide-react";

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
import { listAdminPages } from "@/services/cms.functions";

export const Route = createFileRoute("/workspace/cms/paginas/")({
  head: () => ({ meta: [{ title: "Páginas (CMS)" }] }),
  loader: async () => {
    const res = await listAdminPages();
    return res || [];
  },
  component: CmsPagesPage,
});

function CmsPagesPage() {
  const navigate = useNavigate();
  const pages = Route.useLoaderData();

  return (
    <div className="flex flex-col h-full bg-muted/10">
      <PageHeader
        title="Páginas (CMS)"
        description="Gerencie as páginas institucionais e de conteúdo da sua loja."
        actions={
          <Button onClick={() => {}} className="font-bold border-2 border-ink shadow-hard">
            <Plus className="mr-2 h-4 w-4" />
            Nova Página
          </Button>
        }
      />

      <div className="flex-1 p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar páginas..." className="pl-9 bg-background border-2 border-border" />
            </div>
          </div>

          {pages.length === 0 ? (
            <EmptyState
              title="Nenhuma página criada"
              description="Você ainda não possui nenhuma página extra. Crie sua primeira página para adicionar conteúdo customizado."
            />
          ) : (
            <div className="bg-card rounded-lg border-2 border-border shadow-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Título</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pages.map((page: any) => (
                    <TableRow key={page.id}>
                      <TableCell className="font-medium font-display">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          {page.title}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">/{page.slug}</TableCell>
                      <TableCell>
                        <Badge variant={page.status === "published" ? "default" : "secondary"}>
                          {page.status === "published" ? "Publicado" : "Rascunho"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon">
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
