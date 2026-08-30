import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import {
  getUserSecurityAuditLogs,
  getUserRegisteredDevices,
  revokeUserDevice,
  trustUserDevice,
  getUserSession,
} from "@/services/auth.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Laptop,
  Globe,
  MapPin,
  Clock,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Lock,
  Radio,
  Activity,
  KeyRound,
  RefreshCw,
} from "lucide-react";

export const Route = createFileRoute("/_store/conta/seguranca")({
  head: () => ({ meta: [{ title: "Segurança e Dispositivos | Wider" }] }),
  loader: async () => {
    try {
      const [session, logs, devices] = await Promise.all([
        getUserSession(),
        getUserSecurityAuditLogs(),
        getUserRegisteredDevices(),
      ]);
      return { session, logs, devices };
    } catch {
      return { session: null, logs: [], devices: [] };
    }
  },
  component: SecurityAndDevicesPage,
});

function SecurityAndDevicesPage() {
  const { session, logs: initialLogs, devices: initialDevices } = Route.useLoaderData() as any;
  const router = useRouter();

  const [devices, setDevices] = useState(initialDevices || []);
  const [logs, setLogs] = useState(initialLogs || []);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingDeviceId, setLoadingDeviceId] = useState<string | null>(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const [freshLogs, freshDevices] = await Promise.all([
        getUserSecurityAuditLogs(),
        getUserRegisteredDevices(),
      ]);
      setLogs(freshLogs);
      setDevices(freshDevices);
      toast.success("Logs e dispositivos atualizados.");
    } catch (e: any) {
      toast.error("Erro ao atualizar dados: " + (e?.message || "Falha de rede"));
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRevokeDevice = async (deviceId: string) => {
    if (!confirm("Deseja realmente desconectar este dispositivo? O usuário precisará fazer login novamente.")) {
      return;
    }
    setLoadingDeviceId(deviceId);
    try {
      await revokeUserDevice({ data: { deviceId } });
      setDevices((prev: any[]) => prev.filter((d) => d.id !== deviceId));
      toast.success("Dispositivo desconectado com sucesso.");
    } catch (e: any) {
      toast.error("Erro ao revogar: " + (e?.message || "Falha"));
    } finally {
      setLoadingDeviceId(null);
    }
  };

  const handleTrustDevice = async (deviceId: string) => {
    setLoadingDeviceId(deviceId);
    try {
      await trustUserDevice({ data: { deviceId } });
      setDevices((prev: any[]) =>
        prev.map((d) => (d.id === deviceId ? { ...d, is_trusted: true } : d))
      );
      toast.success("Dispositivo marcado como confiável.");
    } catch (e: any) {
      toast.error("Erro ao marcar: " + (e?.message || "Falha"));
    } finally {
      setLoadingDeviceId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground py-8 px-4 sm:px-6 max-w-5xl mx-auto space-y-8">
      {/* Header com Navegação */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              to="/conta"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              Voltar para Minha Conta
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground flex items-center gap-2.5">
            <Shield className="size-7 text-primary" />
            Segurança & Atividade de Login
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Monitore dispositivos conectados, histórico de acessos por IP e mantenha sua conta protegida.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="self-start sm:self-auto gap-2 rounded-xl text-xs"
        >
          <RefreshCw className={`size-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          Atualizar Dados
        </Button>
      </div>

      {/* Card de Visão Geral de Postura de Segurança */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-card border border-border/70 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Status da Conta</span>
            <ShieldCheck className="size-5 text-green-500" />
          </div>
          <p className="text-lg font-black text-foreground">100% Protegida</p>
          <p className="text-[11px] text-muted-foreground">
            Isolamento criptográfico e RLS deny-by-default ativos no servidor.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border/70 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Dispositivos</span>
            <Smartphone className="size-5 text-primary" />
          </div>
          <p className="text-lg font-black text-foreground">{devices.length} Registrado(s)</p>
          <p className="text-[11px] text-muted-foreground">
            Apenas aparelhos verificados têm acesso contínuo.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border/70 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Logs de Acesso</span>
            <Activity className="size-5 text-amber-500" />
          </div>
          <p className="text-lg font-black text-foreground">{logs.length} Eventos</p>
          <p className="text-[11px] text-muted-foreground">
            Auditoria forense completa com IP, cidade e score de risco.
          </p>
        </div>
      </div>

      {/* ── 1. Seção de Dispositivos Conectados ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Laptop className="size-5 text-primary" />
              Dispositivos Conhecidos
            </h2>
            <p className="text-xs text-muted-foreground">
              Aparelhos que já acessaram sua conta pessoal. Desconecte qualquer item desconhecido imediatamente.
            </p>
          </div>
        </div>

        {devices.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed border-border/70 bg-muted/20">
            <Shield className="size-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-xs font-semibold text-muted-foreground">Nenhum dispositivo registrado ainda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {devices.map((device: any) => (
              <div
                key={device.id}
                className="p-4 rounded-2xl bg-card border border-border/70 flex flex-col justify-between gap-3 relative overflow-hidden"
              >
                <div className="flex items-start gap-3">
                  <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    {device.device_type === "mobile" ? (
                      <Smartphone className="size-5" />
                    ) : (
                      <Laptop className="size-5" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-foreground truncate">
                        {device.device_name || "Navegador Web"}
                      </p>
                      {device.is_trusted && (
                        <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-600 border-green-500/30 px-1.5 py-0">
                          Confiável
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground mt-1">
                      {device.city && (
                        <span className="flex items-center gap-1">
                          <MapPin className="size-3" />
                          {device.city}, {device.country_code}
                        </span>
                      )}
                      {device.ip_address && (
                        <span className="flex items-center gap-1">
                          <Globe className="size-3" />
                          {device.ip_address}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        Visto em: {new Date(device.last_seen_at).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50">
                  {!device.is_trusted && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={loadingDeviceId === device.id}
                      onClick={() => handleTrustDevice(device.id)}
                      className="h-8 text-[11px] rounded-lg gap-1.5 text-green-600 border-green-500/30 hover:bg-green-500/10"
                    >
                      <CheckCircle2 className="size-3" />
                      Confiar
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={loadingDeviceId === device.id}
                    onClick={() => handleRevokeDevice(device.id)}
                    className="h-8 text-[11px] rounded-lg gap-1.5 text-red-600 hover:bg-red-500/10 hover:text-red-700"
                  >
                    <Trash2 className="size-3" />
                    Desconectar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── 2. Linha do Tempo / Histórico de Logins ── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Radio className="size-5 text-amber-500" />
            Histórico Forense de Acessos
          </h2>
          <p className="text-xs text-muted-foreground">
            Registro em tempo real de todas as tentativas de autenticação com dados de IP, dispositivo e score de risco.
          </p>
        </div>

        {logs.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed border-border/70 bg-muted/20">
            <Clock className="size-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-xs font-semibold text-muted-foreground">Nenhum evento registrado recentemente.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-border/70 bg-card overflow-hidden">
            <div className="divide-y divide-border/60">
              {logs.map((log: any) => {
                const isSuccess = log.event_type === "login_success" || log.event_type === "signup";
                const isFailed = log.event_type === "login_failed";
                const isSuspicious = log.risk_score >= 40 || log.is_datacenter;

                return (
                  <div key={log.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isSuccess
                            ? "bg-green-500/10 text-green-600"
                            : isFailed
                            ? "bg-red-500/10 text-red-600"
                            : "bg-amber-500/10 text-amber-600"
                        }`}
                      >
                        {isSuccess ? (
                          <ShieldCheck className="size-4" />
                        ) : isFailed ? (
                          <AlertTriangle className="size-4" />
                        ) : (
                          <Activity className="size-4" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs font-bold text-foreground">
                            {log.event_type === "login_success"
                              ? "Login Efetuado"
                              : log.event_type === "login_failed"
                              ? "Tentativa com Senha Incorreta"
                              : log.event_type === "signup"
                              ? "Nova Conta Criada"
                              : log.event_type === "session_revoked"
                              ? "Sessão Revogada"
                              : log.event_type}
                          </p>

                          {isSuspicious && (
                            <Badge variant="outline" className="text-[10px] bg-red-500/10 text-red-600 border-red-500/30 px-1.5 py-0">
                              Risco Alto ({log.risk_score}%)
                            </Badge>
                          )}

                          {log.is_datacenter && (
                            <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-600 border-purple-500/30 px-1.5 py-0">
                              VPN / VPS
                            </Badge>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground mt-1">
                          <span className="flex items-center gap-1 font-mono">
                            <Globe className="size-3" />
                            {log.ip_address || "IP Oculto"}
                          </span>
                          {log.city && (
                            <span className="flex items-center gap-1">
                              <MapPin className="size-3" />
                              {log.city}, {log.country_code}
                            </span>
                          )}
                          <span>{log.metadata?.device_name || log.device_type}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-[11px] text-muted-foreground text-left sm:text-right shrink-0">
                      <p>{new Date(log.created_at).toLocaleDateString("pt-BR")}</p>
                      <p className="font-mono text-[10px] text-muted-foreground/70">
                        {new Date(log.created_at).toLocaleTimeString("pt-BR")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
