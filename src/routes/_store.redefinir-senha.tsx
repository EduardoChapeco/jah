import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { updatePassword, getUserSession } from "@/services/auth.functions";
import { Lock, CheckCircle2, ShieldCheck, ShieldAlert, ArrowRight, Mail } from "lucide-react";

export const Route = createFileRoute("/_store/redefinir-senha")({
  head: () => ({
    meta: [
      { title: "Redefinir Senha de Acesso — Wider" },
      { name: "description", content: "Crie uma nova senha segura para sua conta na plataforma Wider." },
    ],
  }),
  loader: async () => {
    try {
      const session = await getUserSession();
      const hasActiveSession = Boolean(session?.user?.id);
      return { hasActiveSession };
    } catch {
      return { hasActiveSession: false };
    }
  },
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { hasActiveSession } = Route.useLoaderData();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("A nova senha deve ter no mínimo 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("As senhas digitadas não conferem.");
      return;
    }

    setIsLoading(true);
    try {
      await updatePassword({
        data: {
          password,
        },
      });

      setSuccess(true);
      toast.success("Sua senha foi redefinida com sucesso!");
    } catch (err: any) {
      toast.error(err?.message || "Não foi possível atualizar sua senha. O link pode ter expirado.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-card border border-border/60 rounded-3xl p-6 sm:p-8 shadow-xs">
        {success ? (
          <div className="text-center space-y-5 py-4">
            <div className="size-14 rounded-2xl bg-success/10 text-success mx-auto flex items-center justify-center border border-success/20">
              <CheckCircle2 className="size-7" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-foreground">Senha Atualizada!</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Sua credencial de acesso foi alterada com sucesso. Você já pode acessar todas as funcionalidades da sua conta.
              </p>
            </div>
            <Button
              asChild
              className="w-full h-11 rounded-xl bg-foreground text-background font-bold text-xs hover:opacity-90 gap-2"
            >
              <Link to="/entrar">
                <span>Ir para o Login</span>
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        ) : !hasActiveSession ? (
          <div className="text-center space-y-5 py-2">
            <div className="size-14 rounded-2xl bg-warning/10 text-warning mx-auto flex items-center justify-center border border-warning/20">
              <ShieldAlert className="size-7" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground">Validação por E-mail Obrigatória</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Por motivos de segurança e proteção de conta, a redefinição de senha exige a confirmação do link enviado para o seu e-mail cadastrado.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 text-left space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                <Mail className="size-4 text-primary" />
                <span>Como redefinir sua senha:</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                1. Solicite o link informando seu e-mail.<br />
                2. Abra a mensagem na sua caixa de entrada.<br />
                3. Clique no link oficial para validar sua identidade.
              </p>
            </div>

            <div className="pt-2 space-y-2">
              <Button
                asChild
                className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:opacity-90 gap-2"
              >
                <Link to="/recuperar-senha">
                  <span>Solicitar Link de Recuperação</span>
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                className="w-full h-10 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                <Link to="/entrar">
                  <span>Voltar ao Login</span>
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2 text-center">
              <div className="size-12 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center border border-primary/20 mb-3">
                <Lock className="size-6" />
              </div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Criar Nova Senha</h1>
              <p className="text-xs text-muted-foreground">
                Digite e confirme sua nova senha para recuperar o acesso à sua conta.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Nova Senha</label>
                <Input
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 rounded-xl bg-muted/30 text-sm"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Confirmar Nova Senha</label>
                <Input
                  type="password"
                  placeholder="Repita a nova senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-11 rounded-xl bg-muted/30 text-sm"
                  required
                />
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/40 flex items-start gap-2.5 text-[11px] text-muted-foreground">
              <ShieldCheck className="size-4 text-primary shrink-0 mt-0.5" />
              <span>Sua senha é protegida por criptografia de ponta a ponta e hashes com salt seguro no Supabase Auth.</span>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 rounded-xl bg-foreground text-background font-bold text-xs hover:opacity-90 transition-opacity"
            >
              {isLoading ? "Atualizando senha..." : "Salvar Nova Senha"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
