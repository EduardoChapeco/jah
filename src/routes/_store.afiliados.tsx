import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  Sparkles,
  Copy,
  Check,
  Share2,
  TrendingUp,
  DollarSign,
  Users,
  Award,
  ArrowRight,
  ShieldCheck,
  QrCode,
  CreditCard,
  ChevronRight,
  Loader2,
  Clock,
  ExternalLink,
  Target,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/datetime";
import {
  getMyAffiliateProfile,
  getAffiliateDashboard,
  registerAffiliate,
} from "@/services/affiliates.functions";
import { getProfile } from "@/services/auth.functions";

export const Route = createFileRoute("/_store/afiliados")({
  head: () => ({
    meta: [
      { title: "Programa de Influenciadores & Afiliados | Wider" },
      {
        name: "description",
        content:
          "Monetize sua audiência com comissões de 10% recomendando produtos, lojas e serviços da comunidade Wider. Receba direto via PIX.",
      },
    ],
  }),
  loader: async () => {
    const [profile, affiliateProfile, dashboard] = await Promise.all([
      getProfile().catch(() => null),
      getMyAffiliateProfile().catch(() => null),
      getAffiliateDashboard().catch(() => null),
    ]);

    return { profile, affiliateProfile, dashboard };
  },
  component: AfiliadosPage,
});

function AfiliadosPage() {
  const { profile, affiliateProfile: initialAffiliate, dashboard } = Route.useLoaderData();
  const router = useRouter();

  const [affiliate, setAffiliate] = useState(initialAffiliate);
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states para novos parceiros
  const [handle, setHandle] = useState("");
  const [displayName, setDisplayName] = useState(profile?.full_name || "");
  const [bio, setBio] = useState("");
  const [socialChannel, setSocialChannel] = useState<"instagram" | "tiktok" | "youtube" | "whatsapp" | "other">("instagram");
  const [socialHandle, setSocialHandle] = useState("");
  const [pixKey, setPixKey] = useState(profile?.phone || "");
  const [pixKeyType, setPixKeyType] = useState<"cpf" | "cnpj" | "email" | "phone" | "random">("phone");

  const siteUrl = typeof window !== "undefined" ? window.location.origin : "https://wider.app";
  const affiliateShareUrl = affiliate?.handle ? `${siteUrl}/?ref=${affiliate.handle}` : "";

  const handleCopyLink = () => {
    if (!affiliateShareUrl) return;
    navigator.clipboard.writeText(affiliateShareUrl);
    setCopied(true);
    toast.success("Link exclusivo de afiliado copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) {
      toast.error("Você precisa estar logado para se registrar como afiliado.");
      return;
    }

    if (!handle.trim() || handle.length < 3) {
      toast.error("O identificador (handle) deve ter no mínimo 3 caracteres.");
      return;
    }

    if (!pixKey.trim()) {
      toast.error("Por favor, informe sua chave PIX para repasse das comissões.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await registerAffiliate({
        data: {
          handle: handle.trim().toLowerCase(),
          displayName: displayName.trim() || profile.full_name || "Parceiro Wider",
          bio: bio.trim() || undefined,
          socialChannel,
          socialHandle: socialHandle.trim() || undefined,
          pixKey: pixKey.trim(),
          pixKeyType,
        },
      });

      toast.success("Conta de afiliado ativada com sucesso!");
      setAffiliate(res);
      router.invalidate();
    } catch (err: any) {
      console.error("Erro ao registrar afiliado:", err);
      toast.error(err.message || "Erro ao registrar perfil de afiliado.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* ─── Hero Section ────────────────────────────────────────── */}
      <div className="relative border-b border-border/40 bg-gradient-to-b from-muted/30 to-background pt-8 pb-12 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
            <Target className="size-3.5" />
            <span>Wider Influencer & Partner Engine</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground max-w-2xl mx-auto">
            Monetize sua influência com <span className="text-primary">10% de comissão</span>
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Recomende produtos, classificados, gastronomia e lojas locais da comunidade Wider. Ganhe comissões automáticas pagas diretamente via PIX.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {affiliate ? (
          /* ─── Painel do Afiliado Ativo ────────────────────────────────────────── */
          <div className="space-y-8">
            {/* Card Principal: Link Rastreável de Divulgação */}
            <div className="bg-card rounded-2xl border border-primary/30 p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-foreground">
                      Olá, {affiliate.display_name}!
                    </h2>
                    <Badge variant="outline" className="text-xs text-primary border-primary/40">
                      @{affiliate.handle}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Compartilhe seu link exclusivo. Qualquer compra ou reserva originada por ele rende 10% de comissão imediata.
                  </p>
                </div>

                <Badge variant="secondary" className="self-start sm:self-auto text-xs font-semibold px-3 py-1">
                  Taxa Padrão: 10% de comissão
                </Badge>
              </div>

              {/* Caixa do Link com Botão de Cópia */}
              <div className="flex flex-col sm:flex-row items-stretch gap-2 pt-2">
                <div className="flex-1 bg-muted/40 rounded-xl border border-border px-3.5 py-2.5 flex items-center gap-2 overflow-hidden">
                  <span className="text-xs font-mono text-foreground truncate select-all">
                    {affiliateShareUrl}
                  </span>
                </div>
                <Button
                  onClick={handleCopyLink}
                  className="rounded-xl h-11 px-5 font-semibold text-xs gap-2 shrink-0"
                >
                  {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                  <span>{copied ? "Copiado!" : "Copiar Link"}</span>
                </Button>
              </div>
            </div>

            {/* Grid de 4 Métricas Chave */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-card rounded-2xl border border-border/80 p-5 space-y-1">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-medium">Total de Cliques</span>
                  <TrendingUp className="size-4 text-primary" />
                </div>
                <p className="text-2xl font-bold font-mono text-foreground">
                  {affiliate.total_clicks || 0}
                </p>
                <p className="text-[11px] text-muted-foreground">Últimos 30 dias</p>
              </div>

              <div className="bg-card rounded-2xl border border-border/80 p-5 space-y-1">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-medium">Vendas Geradas</span>
                  <Users className="size-4 text-primary" />
                </div>
                <p className="text-2xl font-bold font-mono text-foreground">
                  {affiliate.total_orders || 0}
                </p>
                <p className="text-[11px] text-muted-foreground">Pedidos convertidos</p>
              </div>

              <div className="bg-card rounded-2xl border border-border/80 p-5 space-y-1">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-medium">Volume Transacionado</span>
                  <DollarSign className="size-4 text-primary" />
                </div>
                <p className="text-2xl font-bold font-mono text-foreground">
                  {formatMoney(Number(affiliate.total_gmv_cents || 0))}
                </p>
                <p className="text-[11px] text-muted-foreground">GMV acumulado</p>
              </div>

              <div className="bg-card rounded-2xl border border-border/80 p-5 space-y-1 bg-emerald-500/5 border-emerald-500/20">
                <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                  <span className="text-xs font-semibold">Comissões Acumuladas</span>
                  <Wallet className="size-4" />
                </div>
                <p className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  {formatMoney(Number(affiliate.total_commission_cents || 0))}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Pago: {formatMoney(Number(affiliate.paid_commission_cents || 0))}
                </p>
              </div>
            </div>

            {/* Informações de Pagamento PIX Cadastradas */}
            <div className="bg-card rounded-2xl border border-border/80 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="size-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <QrCode className="size-5" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs text-muted-foreground font-medium">
                    Chave PIX Cadastrada para Recebimentos
                  </p>
                  <p className="text-sm font-bold font-mono text-foreground">
                    {affiliate.pix_key} ({affiliate.pix_key_type?.toUpperCase()})
                  </p>
                </div>
              </div>

              <Badge variant="outline" className="text-xs text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                PIX Ativo & Verificado
              </Badge>
            </div>

            {/* Tabela de Comissões Auditada */}
            <div className="bg-card rounded-2xl border border-border/80 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                  Extrato de Comissões Auditadas
                </h3>
                <span className="text-xs text-muted-foreground font-mono">
                  {dashboard?.commissions?.length || 0} registro(s)
                </span>
              </div>

              {dashboard?.commissions && dashboard.commissions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border/60 text-muted-foreground pb-2">
                        <th className="pb-2 font-medium">Data</th>
                        <th className="pb-2 font-medium">Valor do Pedido</th>
                        <th className="pb-2 font-medium">Taxa</th>
                        <th className="pb-2 font-medium">Sua Comissão</th>
                        <th className="pb-2 font-medium text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {dashboard.commissions.map((c: any) => (
                        <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3 text-muted-foreground">{formatDate(c.created_at)}</td>
                          <td className="py-3 font-mono font-medium">{formatMoney(c.order_amount_cents)}</td>
                          <td className="py-3 font-mono">{c.commission_rate_percent}%</td>
                          <td className="py-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {formatMoney(c.commission_amount_cents)}
                          </td>
                          <td className="py-3 text-right">
                            <Badge
                              variant={c.status === "paid" ? "default" : c.status === "approved" ? "secondary" : "outline"}
                              className="text-[10px]"
                            >
                              {c.status === "paid"
                                ? "Liquidado via PIX"
                                : c.status === "approved"
                                ? "Aprovado"
                                : "Pendente"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground space-y-2">
                  <Clock className="size-8 mx-auto opacity-40" />
                  <p className="text-xs">Nenhuma comissão gerada ainda.</p>
                  <p className="text-[11px]">
                    Comece a divulgar seu link em suas redes sociais para receber as primeiras comissões.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ─── Formulário de Adesão para Novos Parceiros ────────────────────────────────────────── */
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Coluna Esquerda: Vantagens e Funcionamento (5 colunas) */}
            <div className="md:col-span-5 space-y-6">
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-foreground">Por que se tornar um Afiliado Wider?</h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Transforme seu alcance em renda recorrente sem precisar estocar ou gerenciar entregas.
                </p>
              </div>

              <div className="space-y-3.5">
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-card border border-border/70">
                  <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <DollarSign className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-foreground">Comissão Fixa de 10%</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Você recebe uma porcentagem justa e generosa sobre todo produto, serviço ou classificado vendido através da sua indicação.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-card border border-border/70">
                  <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                    <QrCode className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-foreground">Repasses Automáticos via PIX</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Sem burocracia de saque mínimo abusivo. Receba diretamente na sua conta corrente via chave PIX cadastrada.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-card border border-border/70">
                  <div className="size-8 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
                    <ShieldCheck className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-foreground">Painel com Auditoria Real</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Acompanhe cada clique, carrinho convertido e comissão gerada em tempo real com transparência total.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Coluna Direita: Formulário de Cadastro em 1 Minuto (7 colunas) */}
            <div className="md:col-span-7 bg-card rounded-2xl border border-border/80 p-6 sm:p-8 space-y-6 shadow-sm">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-foreground">Ative seu Link de Influenciador</h2>
                <p className="text-xs text-muted-foreground">
                  Preencha as informações abaixo para gerar seu identificador exclusivo na plataforma.
                </p>
              </div>

              {!profile ? (
                <div className="p-6 rounded-xl bg-muted/40 border border-border text-center space-y-4">
                  <p className="text-xs text-muted-foreground">
                    Para se cadastrar como parceiro ou influenciador, você precisa primeiro estar conectado à sua conta Wider.
                  </p>
                  <Button asChild className="rounded-xl text-xs font-semibold h-10 px-6">
                    <Link to="/entrar" search={{ returnUrl: "/afiliados" }}>
                      Fazer Login na Conta Wider
                    </Link>
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-foreground font-medium">
                      Identificador Exclusivo (Handle / Slug) <span className="text-destructive">*</span>
                    </Label>
                    <div className="flex items-center rounded-xl border border-border bg-background px-3 h-10 focus-within:ring-2 focus-within:ring-primary/20">
                      <span className="text-xs font-mono text-muted-foreground mr-1">
                        wider.app/?ref=
                      </span>
                      <input
                        type="text"
                        value={handle}
                        onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                        placeholder="seunome"
                        className="w-full bg-transparent text-xs font-mono font-bold text-foreground focus:outline-none"
                        required
                        maxLength={30}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Apenas letras minúsculas, números, hífen e underline.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-foreground font-medium">Nome de Exibição</Label>
                      <Input
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Seu Nome ou Nome do Canal"
                        className="h-10 rounded-xl text-xs bg-background"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-foreground font-medium">Principal Canal de Divulgação</Label>
                      <Select value={socialChannel} onValueChange={(v: any) => setSocialChannel(v)}>
                        <SelectTrigger className="h-10 rounded-xl text-xs bg-background font-medium">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="instagram">Instagram</SelectItem>
                          <SelectItem value="tiktok">TikTok</SelectItem>
                          <SelectItem value="youtube">YouTube</SelectItem>
                          <SelectItem value="whatsapp">Grupo / Canal WhatsApp</SelectItem>
                          <SelectItem value="other">Blog / Site / Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-foreground font-medium">
                      Perfil / @ da Rede Social (Opcional)
                    </Label>
                    <Input
                      value={socialHandle}
                      onChange={(e) => setSocialHandle(e.target.value)}
                      placeholder="@seu.perfil"
                      className="h-10 rounded-xl text-xs bg-background"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div className="space-y-1.5 sm:col-span-1">
                      <Label className="text-xs text-foreground font-medium">Tipo da Chave PIX</Label>
                      <Select value={pixKeyType} onValueChange={(v: any) => setPixKeyType(v)}>
                        <SelectTrigger className="h-10 rounded-xl text-xs bg-background font-medium">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cpf">CPF</SelectItem>
                          <SelectItem value="cnpj">CNPJ</SelectItem>
                          <SelectItem value="email">E-mail</SelectItem>
                          <SelectItem value="phone">Telefone</SelectItem>
                          <SelectItem value="random">Chave Aleatória</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <Label className="text-xs text-foreground font-medium">
                        Chave PIX para Depósito <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        value={pixKey}
                        onChange={(e) => setPixKey(e.target.value)}
                        placeholder="Informe sua chave PIX"
                        className="h-10 rounded-xl text-xs bg-background font-mono"
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-11 rounded-xl font-bold text-xs gap-2 mt-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        <span>Ativando Perfil...</span>
                      </>
                    ) : (
                      <>
                        <Check className="size-4" />
                        <span>Cadastrar e Ativar Link de Afiliado</span>
                      </>
                    )}
                  </Button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
