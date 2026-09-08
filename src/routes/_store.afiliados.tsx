import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  Copy,
  Share2,
  Users,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  Target,
  Coins,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  ShoppingBag,
  Store,
  Layers,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDate } from "@/lib/datetime";
import {
  getMyAffiliateTokensOverview,
  registerAffiliate,
  upsertCreatorProfile,
  updateProfilePrivacyMode,
} from "@/services/affiliates.functions";
import { getProfile } from "@/services/auth.functions";

export const Route = createFileRoute("/_store/afiliados")({
  head: () => ({
    meta: [
      { title: "Parceiros & Criadores de Conteúdo | Wider" },
      {
        name: "description",
        content:
          "Indique membros e empresas para a comunidade Wider. Acumule tokens com telemetria criptográfica e construa relevância na rede.",
      },
    ],
  }),
  loader: async () => {
    const [profile, overview] = await Promise.all([
      getProfile().catch(() => null),
      getMyAffiliateTokensOverview().catch(() => ({
        partner: null,
        wallet: { balance: 0, balancePendingMaturity: 0, lifetimeEarned: 0, vestingUnlockDate: null },
        referrals: [],
        rules: [],
        creatorProfile: null,
      })),
    ]);

    return { profile, overview };
  },
  component: AfiliadosPage,
});

function AfiliadosPage() {
  const { profile, overview } = Route.useLoaderData();
  const router = useRouter();

  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingCreator, setIsSavingCreator] = useState(false);
  const [isUpdatingPrivacy, setIsUpdatingPrivacy] = useState(false);

  // Form states para registro inicial de parceiro
  const [handle, setHandle] = useState("");
  const [displayName, setDisplayName] = useState(profile?.full_name || "");
  const [bio, setBio] = useState("");
  const [category, setCategory] = useState("general");

  // Form states para Sub-Perfil de Criador
  const [creatorStageName, setCreatorStageName] = useState(overview?.creatorProfile?.stage_name || profile?.full_name || "");
  const [creatorBio, setCreatorBio] = useState(overview?.creatorProfile?.bio || "");
  const [creatorCategory, setCreatorCategory] = useState(overview?.creatorProfile?.category || "general");

  // Privacy states
  const [isAnonymous, setIsAnonymous] = useState(Boolean(profile?.is_anonymous));
  const [privacyMode, setPrivacyMode] = useState<"public" | "unlisted" | "private">(
    (profile?.privacy_mode as any) || "public"
  );

  const partner = overview?.partner;
  const wallet = overview?.wallet;
  const referrals = overview?.referrals || [];
  const rules = overview?.rules || [];
  const creator = overview?.creatorProfile;

  const siteUrl = typeof window !== "undefined" ? window.location.origin : "https://wider.app.br";
  const referralCode = partner?.handle || creator?.handle || "";
  const affiliateShareUrl = referralCode ? `${siteUrl}/?ref=${referralCode}` : "";

  const handleCopyLink = () => {
    if (!affiliateShareUrl) return;
    navigator.clipboard.writeText(affiliateShareUrl);
    setCopied(true);
    toast.success("Link exclusivo copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareNative = async () => {
    if (!affiliateShareUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Participe da comunidade Wider",
          text: `Acesse a Wider através do meu convite oficial:`,
          url: affiliateShareUrl,
        });
      } catch {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) {
      toast.error("Você precisa estar logado para se cadastrar como criador.");
      return;
    }

    if (!handle.trim() || handle.length < 3) {
      toast.error("O identificador deve ter no mínimo 3 caracteres.");
      return;
    }

    setIsSubmitting(true);
    try {
      await registerAffiliate({
        data: {
          handle: handle.trim().toLowerCase(),
          displayName: displayName.trim() || profile.full_name || "Criador Wider",
          bio: bio.trim() || undefined,
          category,
        },
      });

      toast.success("Perfil de parceiro ativado com sucesso!");
      router.invalidate();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao registrar perfil.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveCreatorProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partner?.handle) return;

    setIsSavingCreator(true);
    try {
      await upsertCreatorProfile({
        data: {
          handle: partner.handle,
          stageName: creatorStageName.trim() || partner.display_name,
          bio: creatorBio.trim() || undefined,
          category: creatorCategory,
          socialLinks: creator?.social_links || {},
          pinnedProducts: creator?.pinned_products || [],
        },
      });

      toast.success("Perfil público de criador atualizado!");
      router.invalidate();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao salvar perfil.");
    } finally {
      setIsSavingCreator(false);
    }
  };

  const handleTogglePrivacy = async (newAnonymous: boolean, newMode: "public" | "unlisted" | "private") => {
    setIsUpdatingPrivacy(true);
    try {
      await updateProfilePrivacyMode({
        data: {
          isAnonymous: newAnonymous,
          privacyMode: newMode,
        },
      });

      setIsAnonymous(newAnonymous);
      setPrivacyMode(newMode);
      toast.success(
        newAnonymous
          ? "Perfil pessoal oculto. Apenas sua marca/influencer está visível publicamente."
          : "Perfil pessoal restaurado para visibilidade pública."
      );
      router.invalidate();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao atualizar privacidade.");
    } finally {
      setIsUpdatingPrivacy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      {/* ─── Header Limpo ───────────────────────────────────────── */}
      <div className="border-b border-border/40 bg-card/40 px-4 sm:px-6 py-5">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-base font-bold tracking-tight text-foreground">Parceiros</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Indique pessoas e negócios. Ganhe tokens a cada nova entrada.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {partner ? (
          /* ─── Painel do Parceiro Ativo ──────────────────────────── */
          <div className="space-y-8">
            {/* Grid de Métricas em Tokens */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl border border-border/60 bg-card space-y-1">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Tokens Ativos
                </span>
                <p className="text-xl font-bold text-foreground">
                  {(wallet?.balance || 0).toLocaleString("pt-BR")}
                </p>
                <span className="text-[10px] text-muted-foreground">Disponível</span>
              </div>

              <div className="p-4 rounded-2xl border border-primary/30 bg-primary/5 space-y-1">
                <span className="text-[11px] font-medium text-primary uppercase tracking-wider flex items-center gap-1">
                  <Clock className="size-3" /> Em Vesting
                </span>
                <p className="text-xl font-bold text-primary">
                  {(wallet?.balancePendingMaturity || 0).toLocaleString("pt-BR")}
                </p>
                <span className="text-[10px] text-muted-foreground">
                  {wallet?.vestingUnlockDate ? `Maturando até ${formatDate(wallet.vestingUnlockDate)}` : "Maturidade futura"}
                </span>
              </div>

              <div className="p-4 rounded-2xl border border-border/60 bg-card space-y-1">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Total Ganho
                </span>
                <p className="text-xl font-bold text-foreground">
                  {(wallet?.lifetimeEarned || 0).toLocaleString("pt-BR")}
                </p>
                <span className="text-[10px] text-muted-foreground">Tokens emitidos</span>
              </div>

              <div className="p-4 rounded-2xl border border-border/60 bg-card space-y-1">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Indicações
                </span>
                <p className="text-xl font-bold text-foreground">{referrals.length}</p>
                <span className="text-[10px] text-muted-foreground">Convertidas</span>
              </div>
            </div>

            {/* Link Exclusivo de Indicação */}
            <div className="p-6 rounded-2xl border border-border/60 bg-card space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                    <span>Link Exclusivo de Convite</span>
                    <Badge variant="outline" className="text-xs font-mono">
                      @{partner.handle}
                    </Badge>
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Novos usuários e empresas cadastrados através deste link acumulam tokens com validação server-side.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2">
                <Input
                  readOnly
                  value={affiliateShareUrl}
                  className="h-11 rounded-xl bg-muted/40 font-mono text-xs border-border/60"
                />
                <div className="flex w-full sm:w-auto gap-2">
                  <Button
                    type="button"
                    onClick={handleCopyLink}
                    variant="outline"
                    className="flex-1 sm:flex-initial h-11 px-5 rounded-xl text-xs font-semibold gap-1.5"
                  >
                    {copied ? <CheckCircle2 className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
                    <span>{copied ? "Copiado" : "Copiar"}</span>
                  </Button>

                  <Button
                    type="button"
                    onClick={handleShareNative}
                    className="flex-1 sm:flex-initial h-11 px-5 rounded-xl text-xs font-semibold gap-1.5"
                  >
                    <Share2 className="size-4" />
                    <span>Compartilhar</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Sub-Perfil de Criador & Privacidade Civil */}
            <div className="p-6 rounded-2xl border border-border/60 bg-card space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-4">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <ShieldCheck className="size-4 text-primary" />
                    <span>Sub-Perfil de Criador / Marca</span>
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Separe sua atuação pública da sua conta civil pessoal com controle de privacidade.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant={isAnonymous ? "default" : "outline"}
                    size="sm"
                    disabled={isUpdatingPrivacy}
                    onClick={() => handleTogglePrivacy(!isAnonymous, !isAnonymous ? "private" : "public")}
                    className="rounded-xl h-9 text-xs font-semibold gap-1.5"
                  >
                    {isAnonymous ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                    <span>{isAnonymous ? "Perfil Pessoal Oculto" : "Ocultar Perfil Pessoal"}</span>
                  </Button>
                </div>
              </div>

              <form onSubmit={handleSaveCreatorProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Nome Artístico / Marca Pública</Label>
                    <Input
                      value={creatorStageName}
                      onChange={(e) => setCreatorStageName(e.target.value)}
                      placeholder="Ex: Ana Silva / Tech Review"
                      className="h-11 rounded-xl text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Categoria</Label>
                    <Input
                      value={creatorCategory}
                      onChange={(e) => setCreatorCategory(e.target.value)}
                      placeholder="Ex: Gastronomia, Moda, Tecnologia"
                      className="h-11 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Bio Pública de Criador</Label>
                  <Input
                    value={creatorBio}
                    onChange={(e) => setCreatorBio(e.target.value)}
                    placeholder="Descrição para seus seguidores e vitrines recomendadas..."
                    className="h-11 rounded-xl text-xs"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={isSavingCreator}
                    className="h-11 px-6 rounded-xl text-xs font-semibold"
                  >
                    {isSavingCreator ? "Salvando..." : "Salvar Sub-Perfil"}
                  </Button>
                </div>
              </form>
            </div>

            {/* Regras Ativas de Bonificação em Tokens */}
            {rules.length > 0 && (
              <div className="p-6 rounded-2xl border border-border/60 bg-card space-y-4">
                <h3 className="text-sm font-bold text-foreground">Regras de Emissão de Tokens</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {rules.map((r: any) => (
                    <div key={r.id} className="p-3.5 rounded-xl border border-border/60 bg-muted/20 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-foreground">{r.title}</span>
                        <Badge variant="secondary" className="text-[10px]">
                          {r.vesting_days}d vesting
                        </Badge>
                      </div>
                      <p className="text-base font-extrabold text-primary">
                        +{Number(r.tokens_amount).toLocaleString("pt-BR")} tokens
                      </p>
                      <p className="text-[11px] text-muted-foreground leading-tight">{r.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Histórico de Indicações Recentes */}
            <div className="p-6 rounded-2xl border border-border/60 bg-card space-y-4">
              <h3 className="text-sm font-bold text-foreground">Indicações e Conversões Recentes</h3>
              {referrals.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">
                  Nenhuma indicação registrada ainda. Compartilhe seu link exclusivo para começar.
                </p>
              ) : (
                <div className="divide-y divide-border/40">
                  {referrals.map((ref: any) => (
                    <div key={ref.id} className="py-3 flex items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <p className="text-xs font-semibold text-foreground">
                          {ref.referral_type === "store" ? "Loja / Empresa" : "Usuário"} indicado
                        </p>
                        <span className="text-[10px] text-muted-foreground">{formatDate(ref.created_at)}</span>
                      </div>

                      <div className="text-right space-y-0.5">
                        <p className="text-xs font-bold text-primary">
                          +{(ref.tokens_awarded || 0).toLocaleString("pt-BR")} tokens
                        </p>
                        <Badge
                          variant={ref.status === "matured" ? "default" : "outline"}
                          className="text-[10px]"
                        >
                          {ref.status === "matured" ? "Maturado" : "Em Vesting"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ─── Formulário de Cadastro para Novo Criador ───────────── */
          <div className="max-w-lg mx-auto p-6 sm:p-8 rounded-2xl border border-border/60 bg-card space-y-6">
            <div className="space-y-1 text-center">
              <h2 className="text-lg font-bold text-foreground">Ativar Perfil de Parceiro & Criador</h2>
              <p className="text-xs text-muted-foreground">
                Crie seu identificador exclusivo para começar a indicar e acumular tokens.
              </p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Identificador Único (@handle)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">
                    @
                  </span>
                  <Input
                    value={handle}
                    onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                    placeholder="seu_nome_ou_marca"
                    className="h-11 pl-7 rounded-xl text-xs font-mono"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Nome Público</Label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Nome artístico ou de apresentação"
                  className="h-11 rounded-xl text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Bio (Opcional)</Label>
                <Input
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Conte brevemente sobre você ou sua atuação..."
                  className="h-11 rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Nicho / Categoria</Label>
                <Input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Ex: Geral, Gastronomia, Moda"
                  className="h-11 rounded-xl text-xs"
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 rounded-xl text-xs font-semibold mt-2"
              >
                {isSubmitting ? "Ativando..." : "Ativar Perfil de Parceiro"}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
