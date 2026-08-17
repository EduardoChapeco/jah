import { createFileRoute, Link, useNavigate, useRouter, redirect } from "@tanstack/react-router";
import { ChevronRight, Eye, EyeOff, ShieldCheck, Sparkles, ArrowRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState, useRef } from "react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { signInWithPassword, signInWithOAuth, getUserSession } from "@/services/auth.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_store/entrar")({
  head: () => ({
    meta: [{ title: "Entrar — JAH Community Commerce" }],
  }),
  validateSearch: (search: Record<string, unknown>): { returnUrl?: string; error?: string } => {
    return {
      returnUrl: typeof search.returnUrl === "string" ? search.returnUrl : undefined,
      error: typeof search.error === "string" ? search.error : undefined,
    };
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
  component: LoginPage,
});

const LoginSchema = z.object({
  email: z.string().email("Digite um e-mail válido"),
  password: z.string().min(1, "A senha é obrigatória"),
});

type LoginForm = z.infer<typeof LoginSchema>;

function LoginPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const search = Route.useSearch();
  const returnUrl = search.returnUrl ?? "/";
  const errorParam = search.error;
  const [rateLimitedUntil, setRateLimitedUntil] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Integração Google Login desativada por padrão conforme diretriz de segurança e governança
  const isGoogleAuthEnabled = false;

  useEffect(() => {
    if (errorParam === "auth-callback-failed") {
      toast.error("Ocorreu um erro ao concluir o login social. Tente novamente.");
    } else if (errorParam) {
      toast.error(errorParam);
    }
  }, [errorParam]);

  useEffect(() => {
    if (!rateLimitedUntil) return;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((rateLimitedUntil - Date.now()) / 1000));
      setCountdown(remaining);
      if (remaining <= 0) {
        setRateLimitedUntil(null);
        if (countdownRef.current) clearInterval(countdownRef.current);
      }
    };
    tick();
    countdownRef.current = setInterval(tick, 1000);
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [rateLimitedUntil]);

  const form = useForm<LoginForm>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginForm) => {
    if (rateLimitedUntil && Date.now() < rateLimitedUntil) return;
    try {
      const result = await signInWithPassword({
        data: { ...data, redirectTo: returnUrl },
      });

      if (result.status === "rate_limited") {
        const until = Date.now() + (result.retryAfterMs ?? 10 * 60 * 1000);
        setRateLimitedUntil(until);
        return;
      }

      toast.success("Login efetuado com sucesso!");
      window.location.href = returnUrl || "/";
    } catch (e: unknown) {
      toast.error((e instanceof Error ? e.message : String(e)) || "Erro inesperado ao fazer login");
    }
  };

  const handleOAuth = async (provider: "google" | "github") => {
    try {
      const result = await signInWithOAuth({ data: { provider, redirectTo: returnUrl } });
      if (result.status === "success" && result.url) {
        window.location.href = result.url;
      } else {
        toast.error(result.message || "Erro ao inicializar login social.");
      }
    } catch (e) {
      toast.error("Ocorreu um erro com o login social.");
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full flex flex-col lg:flex-row bg-background">
      {/* ── Left Side: Split Editorial Screen (Desktop) ────────── */}
      <div className="relative hidden lg:flex lg:w-1/2 bg-zinc-950 text-white flex-col justify-between p-12 overflow-hidden border-r border-border/40">
        {/* Background Gradient & Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(120,50,255,0.15),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff15_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />

        {/* Top Branding */}
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-2 text-xl font-bold tracking-tight">
            <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded-lg text-sm font-black">
              JAH
            </span>
            <span>Community Platform</span>
          </Link>
        </div>

        {/* Center Editorial Focus */}
        <div className="relative z-10 max-w-lg space-y-4 my-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold border border-white/15">
            <Sparkles className="size-3.5 text-primary" />
            <span>Ecossistema de Comércio & Cultura Local</span>
          </div>

          <h2 className="text-4xl font-extrabold tracking-tight leading-tight">
            Conecte sua comunidade. Negocie, crie e viva a cena local.
          </h2>

          <p className="text-sm text-zinc-400 leading-relaxed">
            Acesse seu painel exclusivo para gerenciar seus pedidos, desapegos, ingressos para
            eventos locais e conversar diretamente com produtores da sua região.
          </p>
        </div>

        {/* Bottom Trust Badge */}
        <div className="relative z-10 flex items-center justify-between text-xs text-zinc-500 border-t border-white/10 pt-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-emerald-400" />
            <span>Ambiente seguro criptografado ponta a ponta</span>
          </div>
          <span>Jah OS v2.4</span>
        </div>
      </div>

      {/* ── Right Side: Clean Login Form ────────── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-16">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Back / Breadcrumb */}
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              ← Voltar para o início
            </Link>
            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/60 text-xs">
              <span className="px-3 py-1 rounded-lg bg-background font-bold text-foreground shadow-2xs">
                Entrar
              </span>
              <Link
                to="/cadastro"
                search={{ returnUrl }}
                className="px-3 py-1 rounded-lg text-muted-foreground hover:text-foreground font-medium transition-colors"
              >
                Cadastrar
              </Link>
            </div>
          </div>

          {/* Header Title */}
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Acesse sua conta
            </h1>
            <p className="text-sm text-muted-foreground">
              Insira suas credenciais para continuar sua navegação.
            </p>
          </div>

          {/* Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      E-mail
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="seu.email@exemplo.com"
                        autoComplete="email"
                        className="h-11 rounded-xl border-border bg-card/50 text-sm focus-visible:ring-primary/20"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs font-semibold" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Senha
                      </FormLabel>
                      <Link
                        to="/recuperar-senha"
                        className="text-xs text-primary hover:underline font-semibold"
                      >
                        Esqueceu a senha?
                      </Link>
                    </div>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          autoComplete="current-password"
                          className="h-11 rounded-xl border-border bg-card/50 text-sm pr-10 focus-visible:ring-primary/20"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          aria-label={showPassword ? "Ocultar senha" : "Ver senha"}
                        >
                          {showPassword ? (
                            <EyeOff className="size-4" />
                          ) : (
                            <Eye className="size-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs font-semibold" />
                  </FormItem>
                )}
              />

              {rateLimitedUntil && (
                <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-center gap-2">
                  <span>Muitas tentativas. Aguarde {countdown}s antes de tentar novamente.</span>
                </div>
              )}

              <Button
                type="submit"
                size="lg"
                className="w-full h-12 rounded-xl font-bold bg-primary text-primary-foreground shadow-xs gap-2 text-sm"
                disabled={Boolean(rateLimitedUntil) || form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? (
                  "Autenticando..."
                ) : (
                  <>
                    <span>Entrar na Conta</span>
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </form>
          </Form>

          {/* Conditional Social SSO (Disabled by default) */}
          {isGoogleAuthEnabled && (
            <div className="space-y-4 pt-2">
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 border-t border-border" />
                <span className="relative bg-background px-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Ou continue com
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOAuth("google")}
                className="w-full h-11 rounded-xl font-semibold border-border bg-card/60 gap-2 text-xs"
              >
                <svg className="size-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                Google
              </Button>
            </div>
          )}

          {/* Footer Call to Action */}
          <div className="text-center text-xs text-muted-foreground pt-4 border-t border-border/40">
            Ainda não tem conta?{" "}
            <Link
              to="/cadastro"
              search={{ returnUrl }}
              className="text-primary font-bold hover:underline"
            >
              Crie seu cadastro gratuito
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
