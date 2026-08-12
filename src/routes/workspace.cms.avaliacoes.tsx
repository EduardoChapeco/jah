import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Star, CheckCircle, XCircle, Clock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/state/states";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listReviews, updateReviewStatus } from "@/services/cms.functions";
import { formatDate } from "@/lib/datetime";

export const Route = createFileRoute("/workspace/cms/avaliacoes")({
  head: () => ({ meta: [{ title: "Avaliações (CMS)" }] }),
  loader: async () => {
    const res = await listReviews();
    return res || [];
  },
  component: CmsAvaliacoesPage,
});

function CmsAvaliacoesPage() {
  const router = useRouter();
  const reviews = Route.useLoaderData();

  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filteredReviews = reviews.filter((r: any) => 
    filterStatus === "all" ? true : r.status === filterStatus
  );

  const handleUpdateStatus = async (id: string, status: "approved" | "rejected" | "pending") => {
    try {
      await updateReviewStatus({ data: { id, status } });
      toast.success(`Avaliação atualizada para: ${status === 'approved' ? 'Aprovada' : status === 'rejected' ? 'Rejeitada' : 'Pendente'}`);
      router.invalidate();
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar status");
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case "approved": return <Badge className="bg-success/10 text-success border-success/20">Aprovada</Badge>;
      case "rejected": return <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">Rejeitada</Badge>;
      case "pending": return <Badge variant="outline" className="text-warning border-warning/50 bg-warning/10">Pendente</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <PageHeader
        title="Moderação de Avaliações"
      />

      <div className="flex-1 p-6">
        <div className="space-y-6">
          <div className="flex gap-2">
            <Button 
              variant={filterStatus === "all" ? "default" : "outline"} 
              size="sm"
              onClick={() => setFilterStatus("all")}
            >
              Todas
            </Button>
            <Button 
              variant={filterStatus === "pending" ? "default" : "outline"} 
              size="sm"
              onClick={() => setFilterStatus("pending")}
            >
              <Clock className="size-4 mr-2" />
              Pendentes
            </Button>
            <Button 
              variant={filterStatus === "approved" ? "default" : "outline"} 
              size="sm"
              onClick={() => setFilterStatus("approved")}
            >
              <CheckCircle className="size-4 mr-2" />
              Aprovadas
            </Button>
            <Button 
              variant={filterStatus === "rejected" ? "default" : "outline"} 
              size="sm"
              onClick={() => setFilterStatus("rejected")}
            >
              <XCircle className="size-4 mr-2" />
              Rejeitadas
            </Button>
          </div>

          {filteredReviews.length === 0 ? (
            <EmptyState title="Nenhuma avaliação encontrada" />
          ) : (
            <div className="surface-paper overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Data</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Avaliação</TableHead>
                    <TableHead>Comentário</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReviews.map((review: any) => (
                    <TableRow key={review.id}>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {formatDate(review.created_at)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {review.products?.title || "Produto desconhecido"}
                      </TableCell>
                      <TableCell>
                        <div className="flex text-warning">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star 
                              key={i} 
                              className={`size-4 ${i < review.rating ? "fill-current" : "text-muted-foreground/30"}`} 
                            />
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate">
                        {review.comment || <span className="text-muted-foreground italic">Sem comentário</span>}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(review.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {review.status !== "approved" && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-success border-success/20 hover:bg-success/10"
                              onClick={() => handleUpdateStatus(review.id, "approved")}
                            >
                              Aprovar
                            </Button>
                          )}
                          {review.status !== "rejected" && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-destructive border-destructive/20 hover:bg-destructive/10"
                              onClick={() => handleUpdateStatus(review.id, "rejected")}
                            >
                              Rejeitar
                            </Button>
                          )}
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
