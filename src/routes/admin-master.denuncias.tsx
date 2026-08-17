import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  Trash2,
  Ban,
  ShieldAlert,
  Loader2,
  Filter,
  ExternalLink,
} from "lucide-react";
import {
  listModerationReports,
  resolveModerationReport,
} from "@/services/master.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { formatDateTime } from "@/lib/datetime";

export const Route = createFileRoute("/admin-master/denuncias")({
  head: () => ({ meta: [{ title: "Trust & Safety — Central de Denúncias" }] }),
  loader: async () => {
    const reports = await listModerationReports({ data: { status: "all" } });
    return { reports };
  },
  component: AdminDenunciasPage,
});

function AdminDenunciasPage() {
  const { reports: initialReports } = Route.useLoaderData();
  const router = useRouter();

  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [actionType, setActionType] = useState<
    "content_removed" | "author_warned" | "author_banned" | "dismissed" | null
  >(null);
  const [moderatorNotes, setModeratorNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filteredReports = (initialReports || []).filter((r: any) => {
    if (filterStatus === "all") return true;
    if (filterStatus === "pending") return r.status === "pending";
    if (filterStatus === "resolved") return r.status.startsWith("resolved");
    return true;
  });

  const handleOpenAction = (report: any, action: typeof actionType) => {
    setSelectedReport(report);
    setActionType(action);
    setModeratorNotes("");
  };

  const handleExecuteAction = async () => {
    if (!selectedReport || !actionType) return;
    if (!moderatorNotes.trim()) {
      toast.error("Informe uma justificativa interna para registrar no log forense.");
      return;
    }

    setIsSubmitting(true);
    try {
      await resolveModerationReport({
        data: {
          reportId: selectedReport.id,
          actionTaken: actionType,
          moderatorNotes,
        },
      });

      toast.success("Ação de moderação executada com sucesso!");
      setSelectedReport(null);
      setActionType(null);
      router.invalidate();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro ao executar moderação");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <AlertTriangle className="size-6 text-amber-500" />
            Central de Denúncias & Trust & Safety
          </h1>
          <p className="text-sm text-muted-foreground">
            Auditoria global de conteúdos sinalizados, histórico de infrações e sanções disciplinares.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={filterStatus === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("all")}
          >
            Todas ({initialReports?.length || 0})
          </Button>
          <Button
            variant={filterStatus === "pending" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("pending")}
          >
            Pendentes (
            {(initialReports || []).filter((r: any) => r.status === "pending").length}
            )
          </Button>
          <Button
            variant={filterStatus === "resolved" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("resolved")}
          >
            Resolvidas
          </Button>
        </div>
      </div>

      {filteredReports.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl p-12 text-center">
          <ShieldAlert className="size-12 text-muted-foreground mx-auto mb-3 opacity-40" />
          <h3 className="text-base font-bold text-foreground">Nenhuma denúncia pendente</h3>
          <p className="text-xs text-muted-foreground mt-1">
            A comunidade está limpa e operando dentro das diretrizes legais.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredReports.map((r: any) => (
            <div
              key={r.id}
              className="border border-border bg-card rounded-xl p-5 shadow-xs space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
                <div className="flex items-center gap-2">
                  <Badge variant={r.status === "pending" ? "destructive" : "secondary"}>
                    {r.status === "pending" ? "Pendente de Análise" : "Resolvido"}
                  </Badge>
                  <span className="text-xs font-mono uppercase font-bold text-muted-foreground">
                    {r.entity_type} • #{r.entity_id.slice(0, 8)}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  Registrada em {formatDateTime(r.created_at)}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase text-muted-foreground">
                    Motivo da Denúncia
                  </span>
                  <p className="text-sm font-semibold text-destructive capitalize">
                    {r.reason}
                  </p>
                  {r.description && (
                    <p className="text-xs text-foreground/80 bg-muted/30 p-2 rounded-lg mt-1">
                      "{r.description}"
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase text-muted-foreground">
                    Denunciante & Alvo
                  </span>
                  <p className="text-xs text-foreground">
                    Denunciante:{" "}
                    <span className="font-semibold">
                      {r.reporter?.full_name || "Anônimo"}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Título do Conteúdo:{" "}
                    <span className="font-semibold text-foreground">
                      {r.entity_title || "Sem título registrado"}
                    </span>
                  </p>
                </div>
              </div>

              {r.evidence_urls && r.evidence_urls.length > 0 && (
                <div>
                  <span className="text-[11px] font-bold uppercase text-muted-foreground block mb-1">
                    Evidências Fotográficas
                  </span>
                  <div className="flex gap-2">
                    {r.evidence_urls.map((url: string, i: number) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="size-16 rounded-lg overflow-hidden border border-border shrink-0 hover:opacity-80"
                      >
                        <img
                          src={url}
                          alt="Evidência"
                          className="w-full h-full object-cover"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {r.status === "pending" && (
                <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => handleOpenAction(r, "dismissed")}
                  >
                    <XCircle className="size-3.5 mr-1" />
                    Dispensar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs text-amber-600 border-amber-500/30 hover:bg-amber-50"
                    onClick={() => handleOpenAction(r, "author_warned")}
                  >
                    <AlertTriangle className="size-3.5 mr-1" />
                    Advertir Autor
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="text-xs"
                    onClick={() => handleOpenAction(r, "content_removed")}
                  >
                    <Trash2 className="size-3.5 mr-1" />
                    Remover Conteúdo
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="text-xs bg-red-800 hover:bg-red-900"
                    onClick={() => handleOpenAction(r, "author_banned")}
                  >
                    <Ban className="size-3.5 mr-1" />
                    Banir Usuário
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Dialog de Confirmação & Justificativa Forense */}
      <Dialog
        open={!!selectedReport && !!actionType}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedReport(null);
            setActionType(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Ação de Moderação Master</DialogTitle>
            <DialogDescription>
              Esta ação será auditada e gravada de forma imutável no log forense de litígios.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Justificativa Interna & Parecer do Auditor *</Label>
              <Textarea
                value={moderatorNotes}
                onChange={(e) => setModeratorNotes(e.target.value)}
                placeholder="Descreva a fundamentação legal ou violação de diretrizes comunitárias..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedReport(null);
                setActionType(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleExecuteAction}
              disabled={isSubmitting || !moderatorNotes.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" /> Executando...
                </>
              ) : (
                "Executar Ação"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
