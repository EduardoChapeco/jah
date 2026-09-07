import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, ClipboardList, Users, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { INITIAL_REQUESTS, INITIAL_PROFESSIONALS, STATUS_MAP, PRO_STATUS_MAP, formatCurrency } from "./logistics-data";

export function DashboardSection() {
  const activeCount = INITIAL_REQUESTS.filter((r) => r.status === "new" || r.status === "in_progress").length;
  const onlineCount = INITIAL_PROFESSIONALS.filter((p) => p.status === "online" || p.status === "busy").length;

  const kpis = [
    { label: "Solicitações Ativas", value: String(activeCount), icon: ClipboardList, trend: `+3 hoje`, up: true },
    { label: "Profissionais Online", value: `${onlineCount}/${INITIAL_PROFESSIONALS.length}`, icon: Users, trend: "disponíveis agora", up: true },
    { label: "Faturamento do Dia", value: formatCurrency(2340), icon: DollarSign, trend: "+18% vs ontem", up: true },
    { label: "Avaliação Média", value: "4.7", icon: Star, trend: "últimos 30 dias", up: false },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <kpi.icon className="h-5 w-5 text-muted-foreground" />
                {kpi.up ? <TrendingUp className="h-3 w-3 text-primary" /> : <Star className="h-3 w-3 text-primary" />}
              </div>
              <p className="text-2xl font-bold">{kpi.value}</p>
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
              <p className="text-xs text-muted-foreground mt-1">{kpi.trend}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 space-y-2">
            <p className="text-sm font-semibold mb-1">Solicitações Recentes</p>
            {INITIAL_REQUESTS.slice(0, 4).map((r) => {
              const s = STATUS_MAP[r.status];
              return (
                <div key={r.id} className="flex items-center justify-between p-2 rounded-lg border">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{r.type} — {r.customer}</p>
                    <p className="text-xs text-muted-foreground truncate">{r.origin} → {r.destination}</p>
                  </div>
                  <Badge variant="outline" className={cn("text-xs shrink-0 ml-2", s.color)}>{s.label}</Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-2">
            <p className="text-sm font-semibold mb-1">Profissionais</p>
            {INITIAL_PROFESSIONALS.map((p) => {
              const ps = PRO_STATUS_MAP[p.status];
              return (
                <div key={p.id} className="flex items-center justify-between p-2 rounded-lg border">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={cn("h-2 w-2 rounded-full shrink-0", ps.dotClass)} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.type} — {p.vehicle}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-sm shrink-0">
                    <Star className="h-3 w-3 fill-primary text-primary" />
                    {p.rating}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
