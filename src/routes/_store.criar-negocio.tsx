import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  Briefcase,
  Mic2,
  Tag,
  Loader2,
  Megaphone,
  ChevronRight,
  Building2,
  ArrowLeft,
  Newspaper,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { provisionBusiness } from "@/services/onboarding.functions";
import { getUserSession } from "@/services/auth.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_store/criar-negocio")({
  head: () => ({ meta: [{ title: "Criar Espaço de Trabalho | JAH" }] }),
  beforeLoad: async ({ location }) => {
    const session = await getUserSession();
    if (!session) {
      throw redirect({
        to: "/entrar",
        search: { returnUrl: location.pathname },
      });
    }
  },
  component: CriarNegocioPage,
});

const TYPES = [
  {
    id: "news_portal",
    title: "Jornal / Portal de Notícias",
    desc: "Matérias, colunas, patrocinadores e telemetria.",
    icon: Newspaper,
  },
  {
    id: "event_producer",
    title: "Produtor de Eventos",
    desc: "Festas, festivais e venda de ingressos.",
    icon: Megaphone,
  },
  {
    id: "band",
    title: "Banda / Artista",
    desc: "Portfólio musical, merch e agenda.",
    icon: Mic2,
  },
  {
    id: "creator",
    title: "Criador / Serviço",
    desc: "Aulas, serviços culturais, autônomo.",
    icon: Briefcase,
  },
  {
    id: "ecommerce",
    title: "Loja Física / Virtual",
    desc: "Produtos, discos, roupas, zines.",
    icon: Tag,
  },
  {
    id: "collective",
    title: "Coletivo Cultural",
    desc: "Grupo, associação ou movimento.",
    icon: Building2,
  },
] as const;

type Step = 1 | 2;

function CriarNegocioPage() {
  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState("");
  const [docNumber, setDocNumber] = useState("");
  const [type, setType] = useState<string>("event_producer");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTypeSelect = (id: string) => {
    setType(id);
    setStep(2);
  };

  const handleBack = () => setStep(1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || name.length < 2) {
      toast.error("O nome deve ter no mínimo 2 caracteres.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await provisionBusiness({
        data: {
          name,
          type: type as any,
          document: docNumber || undefined,
        },
      });

      // CRÍTICO: setar o cookie jah_active_tenant com o novo storeId.
      // O resolveTenantStoreId() lê este cookie para determinar o contexto ativo.
      // Sem isso, o workspace guard retorna role='customer' e causa loop infinito.
      if (result?.storeId) {
        // eslint-disable-next-line no-restricted-globals
        window.document.cookie = `jah_active_tenant=${result.storeId}; path=/; max-age=31536000; SameSite=Lax`;
      }

      toast.success("Espaço criado! Abrindo seu painel...");

      // Forçar reload completo para que o servidor releia o cookie na próxima requisição.
      window.location.href = "/workspace";
    } catch (e: unknown) {
      toast.error(
        (e instanceof Error ? e.message : String(e)) || "Erro ao criar Espaço de Trabalho.",
      );
      setIsSubmitting(false);
    }
  };

  const selectedType = TYPES.find((t) => t.id === type);

  return (
    // Shell minimalista: não usa AppShell social.
    // bg-background neutro, sem menu lateral, sem hero pesado.
    <div className="min-h-screen bg-muted/30 flex flex-col">
      {/* Topbar mínima */}
      <header className="h-14 flex items-center justify-between px-6 bg-background border-b border-border/60 shrink-0">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="size-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-black text-sm">
            J
          </div>
          <span className="text-sm font-bold text-foreground tracking-tight hidden sm:block">
            JAH
          </span>
        </Link>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {/* Indicador de progresso */}
          <span
            className={cn("font-semibold", step === 1 ? "text-primary" : "text-muted-foreground")}
          >
            1 Tipo
          </span>
          <ChevronRight className="size-3" />
          <span
            className={cn("font-semibold", step === 2 ? "text-primary" : "text-muted-foreground")}
          >
            2 Dados
          </span>
        </div>
        <Button asChild variant="ghost" size="sm" className="text-xs">
          <Link to="/">Cancelar</Link>
        </Button>
      </header>

      {/* Área central */}
      <main className="flex-1 flex items-start justify-center px-4 py-12 sm:py-16">
        <div className="w-full max-w-xl">
          {/* === ETAPA 1: Seleção de Tipo === */}
          {step === 1 && (
            <div className="space-y-8">
              <div className="space-y-1.5">
                <p className="text-xs font-bold uppercase tracking-wider text-primary">
                  Passo 1 de 2
                </p>
                <h1 className="text-2xl font-bold text-foreground tracking-tight">
                  Qual é a natureza do seu espaço?
                </h1>
                <p className="text-sm text-muted-foreground">
                  Escolha o perfil mais próximo da sua atividade. Você pode ajustar depois.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {TYPES.map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleTypeSelect(t.id)}
                      className={cn(
                        // JahSquircle: geometria orgânica para cards de escolha
                        "squircle group flex items-start gap-4 p-5 text-left",
                        "bg-background border border-border/80",
                        "hover:border-primary/50 hover:bg-primary/[0.02]",
                        "active:scale-[0.98] transition-all duration-150",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                        type === t.id && "border-primary bg-primary/5 ring-1 ring-primary/30",
                      )}
                    >
                      <div
                        className={cn(
                          "size-10 rounded-xl flex items-center justify-center shrink-0",
                          "bg-muted group-hover:bg-primary/10 transition-colors",
                          type === t.id && "bg-primary/10",
                        )}
                      >
                        <Icon
                          className={cn(
                            "size-5 text-muted-foreground group-hover:text-primary transition-colors",
                            type === t.id && "text-primary",
                          )}
                        />
                      </div>
                      <div className="space-y-0.5 pt-0.5">
                        <p className="text-sm font-semibold text-foreground leading-none">
                          {t.title}
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{t.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* === ETAPA 2: Dados Básicos === */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors mb-4"
                >
                  <ArrowLeft className="size-3.5" />
                  Voltar
                </button>
                <p className="text-xs font-bold uppercase tracking-wider text-primary">
                  Passo 2 de 2
                </p>
                <h1 className="text-2xl font-bold text-foreground tracking-tight">
                  Nomeie seu Espaço de Trabalho
                </h1>
                {selectedType && (
                  <p className="text-sm text-muted-foreground">
                    Tipo selecionado:{" "}
                    <span className="font-semibold text-foreground">{selectedType.title}</span>
                  </p>
                )}
              </div>

              {/* Formulário em card squircle-soft */}
              <div className="squircle-soft bg-background border border-border/80 p-6 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-semibold text-foreground">
                    Nome do Espaço <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="Ex: Produtora Fênix, Loja de Discos Z..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isSubmitting}
                    required
                    minLength={2}
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground">
                    Será o nome público do seu espaço na JAH.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="document" className="text-sm font-semibold text-foreground">
                    CPF / CNPJ <span className="text-muted-foreground font-normal">(opcional)</span>
                  </Label>
                  <Input
                    id="document"
                    placeholder="Apenas números..."
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-muted-foreground">
                    Pode ser preenchido depois no painel financeiro.
                  </p>
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full font-semibold"
                disabled={isSubmitting || name.length < 2}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Criando seu Espaço...
                  </>
                ) : (
                  "Criar Espaço de Trabalho"
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Ao criar, você concorda com os{" "}
                <Link to="/termos" className="underline hover:text-foreground">
                  Termos de Uso
                </Link>{" "}
                da JAH.
              </p>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
