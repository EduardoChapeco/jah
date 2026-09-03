import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { listSecurityEvents, getSecurityTelemetryOverview } from "@/services/security.functions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ShieldAlert,
  ShieldCheck,
  Shield,
  Globe,
  Search,
  RefreshCw,
  AlertTriangle,
  Activity,
  Radio,
  Clock,
  Fingerprint,
  Ban,
  ChevronDown,
  Cpu,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin-master/seguranca/telemetria")({
  head: () => ({ meta: [{ title: "Telemetria de Segurança | Admin Master" }] }),
  loader: async () => {
    try {
      const [overview, events] = await Promise.all([
        getSecurityTelemetryOverview({ data: undefined }),
        listSecurityEvents({ data: { severity: "all", limit: 100, offset: 0 } }),
      ]);
      return { overview, events: events || [] };
    } catch {
      return {
        overview: { stats: { total_certs_today: 0, flagged_today: 0, critical_events_today: 0, unique_ips_today: 0, avg_risk_score: 0 }, top_event_types: [], top_suspicious_ips: [] },
        events: [],
      };
    }
  },
  component: SecurityTelemetryPage,
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SEVERITY_META = {
  info:      { label: "Info",      color: "bg-blue-500/10 text-blue-500 border-blue-500/20",      dot: "bg-blue-500" },
  warning:   { label: "Aviso",     color: "bg-amber-500/10 text-amber-500 border-amber-500/20",   dot: "bg-amber-500" },
  critical:  { label: "Crítico",   color: "bg-red-500/10 text-red-500 border-red-500/20",         dot: "bg-red-500" },
  emergency: { label: "Emergência",color: "bg-red-600/20 text-red-600 border-red-600/30",         dot: "bg-red-600 animate-pulse" },
};

function SeverityBadge({ severity }: { severity: string }) {
  const meta = SEVERITY_META[severity as keyof typeof SEVERITY_META] || SEVERITY_META.info;
  return (
    <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1.5", meta.color)}>
      <span className={cn("size-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </span>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, icon: Icon, accent }: { label: string; value: string | number; icon: React.ElementType; accent?: string }) {
  return (
    <div className="bg-card border border-border/50 rounded-xl p-4">
      <div className={cn("size-8 rounded-lg flex items-center justify-center mb-2.5", accent || "bg-primary/10")}>
        <Icon className="size-4 text-foreground/80" />
      </div>
      <div className="text-2xl font-bold font-mono tracking-tight">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}

// ─── Page Component ───────────────────────────────────────────────────────────
function SecurityTelemetryPage() {
  const { overview: initOverview, events: initEvents } = Route.useLoaderData() as any;

  const [events, setEvents] = useState<any[]>(initEvents || []);
  const [overview, setOverview] = useState<any>(initOverview);
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [liveMode, setLiveMode] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const refresh = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [ov, evs] = await Promise.all([
        getSecurityTelemetryOverview({ data: undefined }),
        listSecurityEvents({ data: { severity: "all", limit: 100, offset: 0 } }),
      ]);
      setOverview(ov);
      setEvents(evs || []);
    } catch {
      // silencioso
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Live mode: poll a cada 5s
  useEffect(() => {
    if (liveMode) {
      intervalRef.current = setInterval(() => refresh(true), 5000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [liveMode]);

  const stats = overview?.stats || {};
  const topIps = overview?.top_suspicious_ips || [];
  const topEvents = overview?.top_event_types || [];

  const filtered = events.filter((ev: any) => {
    const matchSev = severityFilter === "all" || ev.severity === severityFilter;
    const matchSearch = !search ||
      ev.ip_address?.includes(search) ||
      ev.event_type?.toLowerCase().includes(search.toLowerCase()) ||
      ev.session_jti?.includes(search);
    return matchSev && matchSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/30 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <div className={cn("size-9 rounded-xl flex items-center justify-center", liveMode ? "bg-green-500/10" : "bg-primary/10")}>
            <Radio className={cn("size-5", liveMode ? "text-green-500 animate-pulse" : "text-primary")} />
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-tight">Telemetria de Segurança</h1>
            <p className="text-xs text-muted-foreground">Monitoramento de invasão, DevTools, automação e comportamentos suspeitos</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant={liveMode ? "default" : "outline"}
              size="sm"
              onClick={() => setLiveMode(v => !v)}
              className={cn("text-xs gap-1.5", liveMode && "bg-green-500 hover:bg-green-600 text-white border-green-500")}
              id="live-mode-toggle"
            >
              <Radio className="size-3.5" />
              {liveMode ? "LIVE" : "Live off"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => refresh()} disabled={loading} className="gap-1.5 text-xs" id="refresh-telemetry">
              <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
              Atualizar
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <KpiCard label="Certificados hoje" value={stats.total_certs_today ?? "—"} icon={Shield} accent="bg-primary/10" />
          <KpiCard label="Sinalizados (24h)" value={stats.flagged_today ?? "—"} icon={ShieldAlert} accent="bg-red-500/10" />
          <KpiCard label="Eventos críticos" value={stats.critical_events_today ?? "—"} icon={AlertTriangle} accent="bg-red-500/10" />
          <KpiCard label="IPs únicos" value={stats.unique_ips_today ?? "—"} icon={Globe} accent="bg-blue-500/10" />
          <KpiCard label="Risco médio" value={stats.avg_risk_score ? `${stats.avg_risk_score}/100` : "—"} icon={Activity} accent="bg-amber-500/10" />
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {/* Feed principal */}
          <div className="md:col-span-2 space-y-3">
            {/* Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative flex-1 min-w-44">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input
                  placeholder="Filtrar por IP, evento, session JTI…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 text-sm h-8"
                  id="telemetry-search"
                />
              </div>
              {(["all", "info", "warning", "critical", "emergency"] as const).map(sev => (
                <button
                  key={sev}
                  id={`sev-filter-${sev}`}
                  onClick={() => setSeverityFilter(sev)}
                  className={cn(
                    "text-xs px-3 py-1.5 rounded-lg border transition-colors",
                    severityFilter === sev
                      ? "bg-foreground text-background border-foreground"
                      : "bg-card border-border/50 hover:border-border text-muted-foreground"
                  )}
                >
                  {sev === "all" ? "Todos" : SEVERITY_META[sev as keyof typeof SEVERITY_META]?.label || sev}
                </button>
              ))}
            </div>

            {/* Event feed */}
            <div ref={listRef} className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-1">
              {filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <ShieldCheck className="size-10 mb-3 opacity-20" />
                  <p className="text-sm">Nenhum evento encontrado.</p>
                </div>
              )}
              {filtered.map((ev: any) => (
                <div
                  key={ev.id}
                  className={cn(
                    "bg-card border rounded-lg px-4 py-3 flex items-start gap-3",
                    ev.severity === "emergency" ? "border-red-600/30 bg-red-600/5" :
                    ev.severity === "critical" ? "border-red-500/20 bg-red-500/3" :
                    ev.severity === "warning" ? "border-amber-500/20" :
                    "border-border/40"
                  )}
                >
                  <div className="mt-0.5">
                    <SeverityBadge severity={ev.severity} />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <code className="text-xs font-semibold">{ev.event_type}</code>
                      {ev.risk_score > 0 && (
                        <span className={cn(
                          "text-[10px] font-mono px-1.5 py-0.5 rounded",
                          ev.risk_score >= 70 ? "bg-red-500/10 text-red-500" :
                          ev.risk_score >= 40 ? "bg-amber-500/10 text-amber-500" :
                          "bg-muted text-muted-foreground"
                        )}>
                          {ev.risk_score}pts
                        </span>
                      )}
                      {ev.is_auto_blocked && (
                        <span className="text-[10px] bg-red-500/20 text-red-500 px-1.5 py-0.5 rounded flex items-center gap-1">
                          <Ban className="size-2.5" />Bloqueado
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <Globe className="size-3" />
                        <code>{ev.ip_address}</code>
                      </span>
                      {ev.session_jti && (
                        <span className="flex items-center gap-1">
                          <Fingerprint className="size-3" />
                          <code>{ev.session_jti.substring(0, 12)}…</code>
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {new Date(ev.created_at).toLocaleString("pt-BR")}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar: IPs suspeitos + Top eventos */}
          <div className="space-y-4">
            {/* Top IPs */}
            <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border/40 flex items-center gap-2">
                <Globe className="size-4 text-muted-foreground" />
                <span className="text-sm font-medium">IPs Mais Ativos (24h)</span>
              </div>
              <div className="p-2 space-y-1">
                {topIps.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">Nenhum dado disponível</p>
                )}
                {topIps.slice(0, 8).map((ip: any, i: number) => (
                  <div key={i} className="flex items-center justify-between px-2 py-2 rounded-lg hover:bg-muted/40 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground font-mono w-4">{i + 1}.</span>
                      <code className="text-xs font-mono">{ip.ip_address}</code>
                    </div>
                    <div className="flex items-center gap-2">
                      {ip.max_risk >= 70 && <AlertTriangle className="size-3 text-red-500" />}
                      <Badge variant="outline" className="text-[10px]">{ip.count}×</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Tipos de Evento */}
            <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border/40 flex items-center gap-2">
                <Activity className="size-4 text-muted-foreground" />
                <span className="text-sm font-medium">Top Tipos de Evento</span>
              </div>
              <div className="p-3 space-y-2">
                {topEvents.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">Nenhum dado disponível</p>
                )}
                {topEvents.map((ev: any, i: number) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <code className="text-muted-foreground">{ev.event_type}</code>
                      <span className="font-mono font-semibold">{ev.count}</span>
                    </div>
                    <div className="h-1 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${Math.min((ev.count / (topEvents[0]?.count || 1)) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
