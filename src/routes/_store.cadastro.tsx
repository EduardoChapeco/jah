import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { ChevronRight, Eye, EyeOff, ShieldCheck, Sparkles, ArrowRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";

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
import { Checkbox } from "@/components/ui/checkbox";
import { signUpWithPassword, signInWithOAuth, getUserSession } from "@/services/auth.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_store/cadastro")({
  head: () => ({
    meta: [{ title: "Criar Conta — JAH Community Commerce" }],
  }),
  validateSearch: (search: Record<string, unknown>): { returnUrl?: string; error?: string } => {
    return {
      returnUrl: typeof search.returnUrl === "string" ? search.returnUrl : undefined,
      error: typeof search.error === "string" ? search.error : undefined,
    };
  },
  component: RegisterPage,
});

const RegisterSchema = z.object({
  fullName: z.string().min(2, "Digite seu nome completo"),
  email: z.string().email("Digite um e-mail válido"),
  password: z
    .string()
    .min(6, "A senha deve ter pelo menos 6 caracteres")
    .regex(/[a-zA-Z]/, "A senha deve conter pelo menos uma letra")
    .regex(/[0-9]/, "A senha deve conter pelo menos um número"),
  isConsentLgpd: z.literal(true, {
    errorMap: () => ({ message: "Você deve aceitar os termos de privacidade (LGPD)." }),
  }),
});

type RegisterForm = z.infer<typeof RegisterSchema>;

function RegisterPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const search = Route.useSearch();
  const returnUrl = search.returnUrl ?? "/conta";
  const errorParam = search.error;
  const [showPassword, setShowPassword] = useState(false);

  // Integração Google Login desativada por padrão
  const isGoogleAuthEnabled = false;

  useEffect(() => {
    if (errorParam === "auth-callback-failed") {
      toast.error("Ocorreu um erro ao concluir o cadastro social. Tente novamente.");
    } else if (errorParam) {
      toast.error(errorParam);
    }
  }, [errorParam]);

  const form = useForm<RegisterForm>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: { fullName: "", email: "", password: "", isConsentLgpd: false as true },
  });

  const onSubmit = async (data: RegisterForm) => {
    try {
      const result = await signUpWithPassword({
        data: {
          email: data.email,
          password: data.password,
          fullName: data.fullName,
          redirectTo: returnUrl,
        },
      });

      if (!result.sessionActive) {
        toast.success(
          "Conta criada! Verifique seu e-mail e clique no link de confirmação para ativar seu acesso.",
          { duration: 8000 },
        );
        navigate({ to: "/entrar", search: { returnUrl } });
        return;
      }

      toast.success("Conta criada com sucesso!");
      await new Promise((r) => setTimeout(r, 100));
      await getUserSession();
      window.location.href = returnUrl || "/conta";
    } catch (e: unknown) {
      toast.error((e instanceof Error ? e.message : String(e)) || "Erro ao cadastrar.");
    }
  };

  const handleOAuth = async (provider: "google" | "github") => {
    try {
      const result = await signInWithOAuth({ data: { provider, redirectTo: returnUrl } });
      if (result.status === "success" && result.url) {
        window.location.href = result.url;
      } else {
        toast.error(result.message || "Erro ao inicializar cadastro social.");
      }
    } catch (e) {
      toast.error("Ocorreu um erro com o cadastro social.");
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
            <span>Faça parte da nossa comunidade</span>
          </div>

          <h2 className="text-4xl font-extrabold tracking-tight leading-tight">
            Crie sua conta para desapegar, comprar e interagir sem intermediários.
          </h2>

          <p className="text-sm text-zinc-400 leading-relaxed">
            Tenha acesso instantâneo a propostas de troca seguras, ingressos oficiais com QR Code e
            feeds culturais locais.
          </p>
        </div>

        {/* Bottom Trust Badge */}
        <div className="relative z-10 flex items-center justify-between text-xs text-zinc-500 border-t border-white/10 pt-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-emerald-400" />
            <span>Proteção de dados com RLS e LGPD nativa</span>
          </div>
          <span>Jah OS v2.4</span>
        </div>
      </div>

      {/* ── Right Side: Clean Register Form ────────── */}
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
              <Link
                to="/entrar"
                search={{ returnUrl }}
                className="px-3 py-1 rounded-lg text-muted-foreground hover:text-foreground font-medium transition-colors"
              >
                Entrar
              </Link>
              <span className="px-3 py-1 rounded-lg bg-background font-bold text-foreground shadow-2xs">
                Cadastrar
              </span>
            </div>
          </div>

          {/* Header Title */}
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Crie seu perfil
            </h1>
            <p className="text-sm text-muted-foreground">
              Leva menos de 1 minuto para começar a usar.
            </p>
          </div>

          {/* Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Nome Completo
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Seu nome"
                        autoComplete="name"
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
                    <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Senha (mínimo 6 caracteres)
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          autoComplete="new-password"
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

              <FormField
                control={form.control}
                name="isConsentLgpd"
                render={({ field }) => (
                  <FormItem className="flex items-start gap-2.5 space-y-0 pt-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="rounded-md mt-0.5"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-xs text-muted-foreground font-normal leading-relaxed cursor-pointer">
                        Concordo com os{" "}
                        <Link to="/termos" className="text-primary font-semibold hover:underline">
                          Termos de Uso
                        </Link>{" "}
                        e{" "}
                        <Link
                          to="/privacidade"
                          className="text-primary font-semibold hover:underline"
                        >
                          Política de Privacidade
                        </Link>
                        .
                      </FormLabel>
                      <FormMessage className="text-xs font-semibold" />
                    </div>
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                size="lg"
                className="w-full h-12 rounded-xl font-bold bg-primary text-primary-foreground shadow-xs gap-2 text-sm mt-2"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? (
                  "Criando conta..."
                ) : (
                  <>
                    <span>Concluir Cadastro</span>
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </form>
          </Form>

          {/* Footer Call to Action */}
          <div className="text-center text-xs text-muted-foreground pt-4 border-t border-border/40">
            Já possui uma conta?{" "}
            <Link
              to="/entrar"
              search={{ returnUrl }}
              className="text-primary font-bold hover:underline"
            >
              Fazer login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
