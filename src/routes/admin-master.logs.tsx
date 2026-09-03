import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/commerce/page-header";
import { Surface } from "@/components/ui/surface";
import { Badge } from "@/components/ui/badge";
import { getSystemLogs } from "@/services/admin-logs.functions";
import { AlertCircle, Clock, Server, Terminal, User } from "lucide-react";

export const Route = createFileRoute("/admin-master/logs")({
  head: () => ({ meta: [{ title: "System Logs | Master Admin" }] }),
  loader: async () => {
    try {
      const data = await getSystemLogs({ data: undefined });
      return { logs: data || [] };
    } catch (e) {
      console.error("Erro ao carregar logs:", e);
      return { logs: [] };
    }
  },
  component: SystemLogsPage,
});

function SystemLogsPage() {
  const { logs } = Route.useLoaderData();

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 md:px-8 py-6">
      <PageHeader 
        eyebrow="Auditoria"
        title="Logs do Sistema" 
      />

      <div className="grid grid-cols-1 gap-4">
        {logs.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground border border-dashed border-border rounded-xl">
            <Server className="size-10 mx-auto mb-3 opacity-20" />
            <p>Nenhum erro registrado no sistema.</p>
          </div>
        ) : (
          logs.map((log: any) => (
            <Surface key={log.id} className="p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-destructive/10 text-destructive rounded-lg">
                    <AlertCircle className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm font-mono text-foreground">{log.route}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                      <Clock className="size-3" />
                      {new Date(log.created_at).toLocaleString("pt-BR")}
                    </p>
                  </div>
                </div>
                <Badge variant={log.severity === "critical" ? "destructive" : "secondary"}>
                  {log.severity || "error"}
                </Badge>
              </div>

              <div className="bg-destructive/5 border border-destructive/10 rounded-lg p-3 text-sm text-foreground">
                <span className="font-semibold text-destructive mr-2">Error:</span>
                {log.error_message}
              </div>

              {log.profiles && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 w-fit px-3 py-1.5 rounded-full border border-border/50">
                  <User className="size-3" />
                  {log.profiles.full_name} ({log.profiles.email})
                </div>
              )}

              {(log.payload || log.stack_trace) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  {log.payload && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <Terminal className="size-3" /> Payload
                      </span>
                      <pre className="bg-muted p-2 rounded-lg text-[11px] overflow-x-auto border border-border/50 text-foreground/80 font-mono">
                        {JSON.stringify(log.payload, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  {log.stack_trace && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Stack Trace
                      </span>
                      <pre className="bg-muted p-2 rounded-lg text-[10px] overflow-x-auto border border-border/50 text-foreground/60 font-mono">
                        {log.stack_trace}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </Surface>
          ))
        )}
      </div>
    </div>
  );
}
