import { createFileRoute, Link, useNavigate, useRouter, redirect } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import {
  ArrowRight,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Eye,
  EyeOff,
  X,
  UserPlus,
  LogIn,
  ChevronLeft,
  Lock,
  Mail,
  User,
  Sparkles,
  FileCheck,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  signInWithPassword,
  signUpWithPassword,
  getUserSession,
  resetPasswordForEmail,
} from "@/services/auth.functions";
import { getPublicBrandSettings } from "@/services/master.functions";

export const Route = createFileRoute("/_store/entrar")({
  head: () => ({
    meta: [{ title: "Acessar — Wider Community Platform" }],
  }),
  validateSearch: (search: Record<string, unknown>): { returnUrl?: string; error?: string } => {
    return {
      returnUrl: typeof search.returnUrl === "string" ? search.returnUrl : undefined,
      error: typeof search.error === "string" ? search.error : undefined,
    };
  },
  loader: async () => {
    try {
      const brand = await getPublicBrandSettings();
      return { brand };
    } catch {
      return { brand: null };
    }
  },
  beforeLoad: async ({ search }) => {
    const session = await getUserSession();
    if (session) {
      if (search.returnUrl) {
        throw redirect({ to: search.returnUrl as any });
      }
      throw redirect({ to: "/" });
    }
  },
  component: FullscreenLoginPage,
});

type AuthMode = "idle" | "login-identifier" | "login-password" | "register-quick";

const DEFAULT_BG_DESKTOP = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1920&q=85";
const DEFAULT_BG_TABLET = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1024&q=85";
const DEFAULT_BG_MOBILE = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1080&q=85";

function FullscreenLoginPage() {
  const { brand } = Route.useLoaderData() as any;
  const navigate = useNavigate();
  const router = useRouter();
  const search = Route.useSearch();
  const returnUrl = search.returnUrl ?? "/";

  const [mode, setMode] = useState<AuthMode>("idle");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Modais de Recuperação e Termos
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [isSendingReset, setIsSendingReset] = useState(false);

  // Sheet de Termos Legais com Scroll Obrigatório
  const [isTermsSheetOpen, setIsTermsSheetOpen] = useState(false);
  const [hasScrolledTermsToBottom, setHasScrolledTermsToBottom] = useState(false);
  const [termsScrollProgress, setTermsScrollProgress] = useState(0);
  const termsScrollRef = useRef<HTMLDivElement>(null);

  const identifierInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mode === "login-identifier" || mode === "register-quick") {
      setTimeout(() => identifierInputRef.current?.focus(), 150);
    } else if (mode === "login-password") {
      setTimeout(() => passwordInputRef.current?.focus(), 150);
    }
  }, [mode]);

  // Handler para avançar do Identificador para a Senha
  const handleNextFromIdentifier = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanId = identifier.trim();
    if (!cleanId) {
      toast.error("Digite seu e-mail, telefone, CPF ou @usuário.");
      return;
    }
    setMode("login-password");
  };

  // Handler de Login Efetivo
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      toast.error("Digite sua senha de acesso.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await signInWithPassword({
        data: {
          identifier: identifier.trim(),
          password,
        },
      });

      if (res.status === "success") {
        toast.success("Autenticação realizada com sucesso!");
        router.invalidate();
        navigate({ to: returnUrl as any });
      } else if (res.status === "rate_limited") {
        toast.error(res.message);
      }
    } catch (err: any) {
      toast.error(err?.message || "Identificador ou senha incorretos.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handler de Início de Cadastro (Abre o Sheet de Termos e Finalização)
  const handleStartRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      toast.error("Informe seu e-mail, telefone ou @usuário.");
      return;
    }
    if (password.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres.");
      return;
    }
    setHasScrolledTermsToBottom(false);
    setTermsScrollProgress(0);
    setIsTermsSheetOpen(true);
  };

  // Monitora o scroll dos Termos até o final (100%)
  const handleTermsScroll = () => {
    if (!termsScrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = termsScrollRef.current;
    const progress = Math.min(100, Math.round((scrollTop / (scrollHeight - clientHeight)) * 100));
    setTermsScrollProgress(progress);

    if (scrollTop + clientHeight >= scrollHeight - 20) {
      setHasScrolledTermsToBottom(true);
    }
  };

  // Conclui o Cadastro com Consentimento LGPD após Leitura
  const handleCompleteRegistration = async () => {
    if (!hasScrolledTermsToBottom) {
      toast.error("Role o documento de termos até o final para habilitar o aceite.");
      return;
    }

    setIsLoading(true);
    try {
      const cleanEmail = identifier.includes("@")
        ? identifier.trim().toLowerCase()
        : `${identifier.replace(/\D/g, "") || "usuario"}@wider.local`;

      const result = await signUpWithPassword({
        data: {
          email: cleanEmail,
          password,
          fullName: fullName.trim() || identifier.split("@")[0] || "Membro da Comunidade",
          redirectTo: returnUrl,
          isConsentLgpd: true,
        },
      });

      if (!result.sessionActive) {
        toast.success("Conta criada! Verifique seu e-mail para ativar seu acesso.", {
          duration: 7000,
        });
        setIsTermsSheetOpen(false);
        setMode("idle");
        return;
      }

      toast.success("Conta criada e termos aceitos com sucesso!");
      setIsTermsSheetOpen(false);
      await getUserSession();
      window.location.href = returnUrl || "/";
    } catch (err: any) {
      toast.error(err?.message || "Erro ao concluir cadastro.");
    } finally {
      setIsLoading(false);
    }
  };

  // Recuperação de Senha
  const handleSendResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      toast.error("Informe seu e-mail cadastrado.");
      return;
    }

    setIsSendingReset(true);
    try {
      await resetPasswordForEmail({
        data: {
          email: forgotEmail.trim(),
          redirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/redefinir-senha`,
        },
      });
      toast.success("Link de recuperação enviado para seu e-mail.");
      setIsForgotModalOpen(false);
      setForgotEmail("");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao solicitar recuperação de senha.");
    } finally {
      setIsSendingReset(false);
    }
  };

  const desktopBg = brand?.login_bg_desktop_url || brand?.login_split_image_url || DEFAULT_BG_DESKTOP;
  const tabletBg = brand?.login_bg_tablet_url || desktopBg || DEFAULT_BG_TABLET;
  const mobileBg = brand?.login_bg_mobile_url || tabletBg || DEFAULT_BG_MOBILE;

  return (
    <main
      role="main"
      aria-label="Tela de Autenticação e Acesso"
      className="h-screen w-screen overflow-hidden relative select-none flex flex-col justify-between p-5 sm:p-8 md:p-10 bg-black text-white"
    >
      {/* ── 1. Background Imersivo com 3 Breakpoints Responsivos (Zero Scroll) ── */}
      <picture className="absolute inset-0 size-full pointer-events-none z-0">
        <source media="(min-width: 1024px)" srcSet={desktopBg} />
        <source media="(min-width: 768px)" srcSet={tabletBg} />
        <img
          src={mobileBg}
          alt=""
          className="size-full object-cover transition-transform duration-1000 scale-100"
        />
      </picture>

      {/* Overlay Cinematográfico para Alto Contraste */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[0.5px] z-1 pointer-events-none" />

      {/* ── 2. Top Bar Minimalista ── */}
      <header className="relative z-10 flex items-center justify-between w-full">
        <Link
          to="/"
          className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-2xl bg-black/50 backdrop-blur-xl border border-white/15 text-white shadow-lg hover:border-white/30 transition-colors"
        >
          <span className="bg-primary text-primary-foreground font-black text-xs px-2 py-0.5 rounded-lg tracking-wider uppercase">
            {brand?.platform_name || "WIDER"}
          </span>
          <span className="text-xs font-semibold tracking-tight text-white/90 hidden sm:inline">
            Community Commerce
          </span>
        </Link>

        <Link
          to="/"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/40 backdrop-blur-xl border border-white/15 text-xs font-medium text-white/80 hover:text-white hover:border-white/30 transition-all"
        >
          <ArrowLeft className="size-3.5" />
          <span>Voltar à Vitrine</span>
        </Link>
      </header>

      {/* ── 3. Linha Minimalista de Autenticação no Canto Inferior Direito ── */}
      <div className="relative z-10 w-full flex justify-end items-end">
        {/* FASE 0: Pílula Inicial [ Entrar ] [ Cadastrar-se ] */}
        {mode === "idle" && (
          <div className="inline-flex items-center gap-2 p-1.5 rounded-2xl bg-black/70 backdrop-blur-2xl border border-white/20 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Button
              onClick={() => setMode("login-identifier")}
              className="h-10 px-5 rounded-xl bg-white text-black font-bold text-xs hover:bg-white/90 shadow-md gap-1.5 cursor-pointer"
            >
              <LogIn className="size-3.5" />
              <span>Entrar</span>
            </Button>

            <Button
              variant="ghost"
              onClick={() => setMode("register-quick")}
              className="h-10 px-4 rounded-xl text-white/90 hover:text-white hover:bg-white/10 text-xs font-medium gap-1.5 cursor-pointer"
            >
              <UserPlus className="size-3.5" />
              <span>Cadastrar-se</span>
            </Button>
          </div>
        )}

        {/* FASE 1: Entrar - Linha de Identificador */}
        {mode === "login-identifier" && (
          <form
            onSubmit={handleNextFromIdentifier}
            className="w-full sm:w-auto max-w-md inline-flex items-center gap-1.5 p-1.5 rounded-2xl bg-black/80 backdrop-blur-2xl border border-white/25 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
          >
            {/* Botão de Fechar */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                setMode("idle");
                setIdentifier("");
              }}
              className="size-9 rounded-xl text-white/70 hover:text-white hover:bg-white/10 shrink-0"
              title="Cancelar"
            >
              <X className="size-4" />
            </Button>

            {/* Input com Botão -> Embutido */}
            <div className="relative flex-1 min-w-[200px] sm:min-w-[260px]">
              <Input
                ref={identifierInputRef}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="E-mail, telefone, CPF ou @"
                className="h-10 pl-3.5 pr-10 text-xs bg-white/10 text-white placeholder:text-white/40 border-white/15 rounded-xl focus-visible:ring-1 focus-visible:ring-white/40"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 size-7 rounded-lg bg-white text-black flex items-center justify-center hover:bg-white/90 transition-all active:scale-95 cursor-pointer shadow-xs"
                title="Avançar"
              >
                <ArrowRight className="size-3.5 font-black" />
              </button>
            </div>

            {/* Botão Escudo: Esqueci a Senha */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                setForgotEmail(identifier.includes("@") ? identifier : "");
                setIsForgotModalOpen(true);
              }}
              className="size-9 rounded-xl text-amber-400 hover:text-amber-300 hover:bg-amber-400/10 shrink-0"
              title="Esqueci a senha"
            >
              <ShieldAlert className="size-4" />
            </Button>

            {/* Botão Pequeno: Alternar para Cadastrar */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setMode("register-quick")}
              className="h-9 px-2.5 rounded-xl text-[11px] font-medium text-white/80 hover:text-white hover:bg-white/10 shrink-0 hidden sm:inline-flex"
            >
              Cadastrar
            </Button>
          </form>
        )}

        {/* FASE 2: Entrar - Linha de Senha */}
        {mode === "login-password" && (
          <form
            onSubmit={handleLoginSubmit}
            className="w-full sm:w-auto max-w-md inline-flex items-center gap-1.5 p-1.5 rounded-2xl bg-black/80 backdrop-blur-2xl border border-white/25 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
          >
            {/* Botão Voltar ao Identificador */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setMode("login-identifier")}
              className="size-9 rounded-xl text-white/70 hover:text-white hover:bg-white/10 shrink-0"
              title="Voltar"
            >
              <ChevronLeft className="size-4" />
            </Button>

            {/* Input de Senha com Botão -> Embutido */}
            <div className="relative flex-1 min-w-[200px] sm:min-w-[260px]">
              <Input
                ref={passwordInputRef}
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={`Senha para ${identifier}`}
                className="h-10 pl-3.5 pr-16 text-xs bg-white/10 text-white placeholder:text-white/40 border-white/15 rounded-xl focus-visible:ring-1 focus-visible:ring-white/40"
              />

              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="size-6 text-white/50 hover:text-white flex items-center justify-center cursor-pointer"
                  title={showPassword ? "Ocultar" : "Mostrar"}
                >
                  {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </button>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="size-7 rounded-lg bg-white text-black flex items-center justify-center hover:bg-white/90 transition-all active:scale-95 cursor-pointer shadow-xs disabled:opacity-50"
                  title="Entrar"
                >
                  <ArrowRight className="size-3.5 font-black" />
                </button>
              </div>
            </div>

            {/* Botão Escudo: Esqueci a Senha */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                setForgotEmail(identifier.includes("@") ? identifier : "");
                setIsForgotModalOpen(true);
              }}
              className="size-9 rounded-xl text-amber-400 hover:text-amber-300 hover:bg-amber-400/10 shrink-0"
              title="Esqueci a senha"
            >
              <ShieldAlert className="size-4" />
            </Button>
          </form>
        )}

        {/* FASE 3: Cadastrar-se Rápido (Inline) */}
        {mode === "register-quick" && (
          <form
            onSubmit={handleStartRegister}
            className="w-full sm:w-auto max-w-lg inline-flex flex-wrap sm:flex-nowrap items-center gap-1.5 p-1.5 rounded-2xl bg-black/80 backdrop-blur-2xl border border-white/25 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
          >
            {/* Botão Cancelar */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                setMode("idle");
                setIdentifier("");
                setPassword("");
              }}
              className="size-9 rounded-xl text-white/70 hover:text-white hover:bg-white/10 shrink-0"
              title="Cancelar"
            >
              <X className="size-4" />
            </Button>

            {/* Input 1: E-mail / Telefone / @ */}
            <Input
              ref={identifierInputRef}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="E-mail ou @usuário"
              className="h-10 text-xs bg-white/10 text-white placeholder:text-white/40 border-white/15 rounded-xl min-w-[140px] flex-1"
            />

            {/* Input 2: Senha com Botão -> Embutido */}
            <div className="relative min-w-[150px] flex-1">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Criar Senha (min 6)"
                className="h-10 pl-3 pr-10 text-xs bg-white/10 text-white placeholder:text-white/40 border-white/15 rounded-xl"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 size-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-400 transition-all active:scale-95 cursor-pointer shadow-xs"
                title="Prosseguir para Termos"
              >
                <ArrowRight className="size-3.5 font-black" />
              </button>
            </div>

            {/* Botão Pequeno para Alternar para Login */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setMode("login-identifier")}
              className="h-9 px-2.5 rounded-xl text-[11px] font-medium text-white/80 hover:text-white hover:bg-white/10 shrink-0"
            >
              Já tenho conta
            </Button>
          </form>
        )}
      </div>

      {/* ── 4. SheetPage de Termos Legais com Scroll Auditado 100% (Melhor que Meta/Apple) ── */}
      <Sheet open={isTermsSheetOpen} onOpenChange={setIsTermsSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl flex flex-col justify-between overflow-hidden p-0">
          <div className="p-6 pb-3 border-b border-border/40 space-y-2">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                <FileCheck className="size-4" />
              </div>
              <div>
                <SheetTitle className="text-base font-bold text-foreground">
                  Termos de Uso & Consentimento LGPD
                </SheetTitle>
                <SheetDescription className="text-xs text-muted-foreground">
                  Transparência absoluta e proteção aos seus dados pessoais
                </SheetDescription>
              </div>
            </div>

            {/* Barra de Progresso de Leitura */}
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-muted-foreground">Progresso de leitura obrigatória:</span>
                <span className={hasScrolledTermsToBottom ? "text-emerald-500 font-bold" : "text-primary font-bold"}>
                  {hasScrolledTermsToBottom ? "100% (Concluído)" : `${termsScrollProgress}%`}
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-150"
                  style={{ width: `${hasScrolledTermsToBottom ? 100 : termsScrollProgress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Container dos Termos com Scroll Listener */}
          <div
            ref={termsScrollRef}
            onScroll={handleTermsScroll}
            className="flex-1 overflow-y-auto p-6 space-y-4 text-xs text-muted-foreground leading-relaxed select-text"
          >
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-foreground text-xs space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="size-4 text-primary" />
                Compromisso com a Privacidade e Soberania Comunitária
              </p>
              <p className="text-[11px] text-muted-foreground">
                Nós nunca vendemos seus dados para terceiros. O ecossistema Wider opera sob o padrão de isolamento multi-tenant estrito e criptografia de ponta a ponta.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-foreground text-sm">1. Finalidade do Cadastro</h4>
              <p>
                Ao criar sua conta na Wider Community Platform, você obtém uma identidade única e soberana para participar do comércio local, negociar classificados, adquirir ingressos culturais, interagir em murais comunitários e realizar pedidos no balcão e delivery.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-foreground text-sm">2. Tratamento e Proteção de Dados (LGPD - Lei 13.709/2018)</h4>
              <p>
                Seus dados (nome, e-mail, telefone, histórico de compras e preferências) são utilizados exclusivamente para o cumprimento de contratos comerciais, emissão de comprovantes fiscais e comunicações de segurança.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-foreground text-sm">3. Direitos do Titular</h4>
              <p>
                A qualquer momento, através da aba "Minha Conta", você pode exportar seu histórico de atividades, gerenciar seus consentimentos ou solicitar a exclusão irrevogável de seus dados.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-foreground text-sm">4. Transações Financeiras e Anti-Fraude</h4>
              <p>
                Pagamentos via PIX e Cartão são processados em conformidade com as normas do Banco Central do Brasil. Não retemos números completos de cartões de crédito.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-muted/40 border border-border/40 text-center space-y-1">
              <p className="font-bold text-foreground">Fim do Documento</p>
              <p className="text-[11px] text-muted-foreground">
                Ao clicar no botão abaixo, você declara estar de pleno acordo com todas as diretrizes.
              </p>
            </div>
          </div>

          {/* Rodapé com Botão Habilitado Apenas Após 100% de Leitura */}
          <div className="p-6 pt-3 border-t border-border/40 space-y-3 bg-card">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Seu Nome Completo (Opcional)</label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ex: Maria Silva"
                className="text-xs"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1">
              <span className="text-[11px] text-muted-foreground text-center sm:text-left">
                {!hasScrolledTermsToBottom ? "⚠️ Role até o fim do texto para aceitar" : "✅ Termos lidos na íntegra"}
              </span>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsTermsSheetOpen(false)}
                  className="text-xs flex-1 sm:flex-none"
                >
                  Cancelar
                </Button>

                <Button
                  type="button"
                  size="sm"
                  disabled={!hasScrolledTermsToBottom || isLoading}
                  onClick={handleCompleteRegistration}
                  className="text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex-1 sm:flex-none cursor-pointer"
                >
                  {isLoading ? "Criando Conta..." : "Concordo e Criar Conta"}
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── 5. SheetPage: Esqueci a Senha / Recuperar Acesso ── */}
      <Sheet open={isForgotModalOpen} onOpenChange={setIsForgotModalOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md flex flex-col justify-between overflow-y-auto">
          <div>
            <SheetHeader className="pb-4">
              <div className="size-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-2">
                <Shield className="size-5" />
              </div>
              <SheetTitle>Recuperar Senha</SheetTitle>
              <SheetDescription>
                Informe seu e-mail cadastrado para receber as instruções de redefinição de acesso.
              </SheetDescription>
            </SheetHeader>

            <form id="forgot-password-form" onSubmit={handleSendResetPassword} className="space-y-4 py-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">E-mail Cadastrado</label>
                <Input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="seuemail@exemplo.com"
                  className="text-xs"
                  required
                />
              </div>
            </form>
          </div>

          <SheetFooter className="pt-4 border-t border-border/40">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsForgotModalOpen(false)}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="forgot-password-form"
              disabled={isSendingReset}
              className="text-xs font-bold"
            >
              {isSendingReset ? "Enviando..." : "Enviar Instruções"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </main>
  );
}
