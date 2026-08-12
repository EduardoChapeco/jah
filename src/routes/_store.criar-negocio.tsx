import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Briefcase, Building, Mic2, Tag, Loader2, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Surface } from "@/components/ui/surface";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { createBusinessProfile } from "@/services/identity.functions";

export const Route = createFileRoute("/_store/criar-negocio")({
  head: () => ({ meta: [{ title: "Criar Coletivo / Negócio" }] }),
  component: CriarNegocioPage,
});

const TYPES = [
  {
    id: "event_producer",
    title: "Produtor de Eventos",
    desc: "Crie festas, festivais e venda ingressos.",
    icon: Megaphone,
    color: "text-primary",
  },
  {
    id: "band",
    title: "Banda / Artista",
    desc: "Portfólio musical, merch e agenda.",
    icon: Mic2,
    color: "text-foreground",
  },
  {
    id: "creator",
    title: "Criador / Serviço",
    desc: "Aulas, serviços culturais, autônomo.",
    icon: Briefcase,
    color: "text-foreground",
  },
  {
    id: "ecommerce",
    title: "Loja Físca / Virtual",
    desc: "Produtos, discos, roupas, zines.",
    icon: Tag,
    color: "text-electric-cyan",
  },
] as const;

function CriarNegocioPage() {
  const [name, setName] = useState("");
  const [document, setDocument] = useState("");
  const [type, setType] = useState<string>("event_producer");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || name.length < 2) {
      toast.error("O nome deve ter no mínimo 2 caracteres.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createBusinessProfile({
        data: {
          name,
          type: type as any,
          document: document || undefined,
        },
      });

      toast.success("Negócio criado com sucesso! Bem-vindo ao painel do produtor.");
      // Força refresh total do cache e vai pro admin
      await router.invalidate();
      navigate({ to: "/workspace" });
    } catch (e: unknown) {
      toast.error((e instanceof Error ? e.message : String(e)) || "Erro ao criar perfil de produtor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pt-12 pb-20">
      <div className="p-4 md:p-8 space-y-8 max-w-3xl mx-auto w-full">
        <div className="mb-8 border-b border-border pb-6">
          <h2 className="text-display text-4xl md:text-6xl text-foreground leading-none">
            ABRA SEU <br />
            <span className="text-primary">COLETIVO</span>
          </h2>
          <p className="font-sans text-muted-foreground text-lg text-foreground/80 mt-4 max-w-lg">
            Torne-se um produtor cultural na plataforma. Publique eventos, venda mercadorias ou
            anuncie seus serviços.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-12">
          <Surface variant="ticket" padding="lg">
            <div className="space-y-6">
              <h3 className="font-display uppercase text-2xl tracking-tight">
                1. Informações Básicas
              </h3>

              <div className="space-y-2">
                <Label className="font-bold text-base uppercase font-mono">
                  Nome do Projeto / Marca *
                </Label>
                <Input
                  className="bg-background border border-border h-14 text-lg font-bold font-sans text-muted-foreground"
                  placeholder="Ex: Banda Jah, Loja de Discos Z..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label className="font-bold text-base uppercase font-mono">
                  CPF / CNPJ Profissional (Opcional)
                </Label>
                <Input
                  className="bg-background border border-border h-14 text-lg font-mono"
                  placeholder="Apenas números..."
                  value={document}
                  onChange={(e) => setDocument(e.target.value)}
                  disabled={isSubmitting}
                />
                <p className="text-sm font-sans text-muted-foreground text-foreground/70">
                  Necessário futuramente para emitir notas e receber repasses (Split de pagamentos).
                </p>
              </div>
            </div>
          </Surface>

          <Surface variant="default" padding="lg">
            <div className="space-y-6">
              <h3 className="font-display uppercase text-2xl tracking-tight">2. Área de Atuação</h3>

              <RadioGroup
                value={type}
                onValueChange={setType}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
              >
                {TYPES.map((t) => (
                  <div key={t.id}>
                    <RadioGroupItem
                      value={t.id}
                      id={t.id}
                      className="peer sr-only"
                      disabled={isSubmitting}
                    />
                    <Label
                      htmlFor={t.id}
                      className="flex flex-col items-start gap-3 rounded-xl border border-border/20 bg-background p-4 hover:bg-ivory hover:border-border peer-data-[state=checked]:border-border peer-data-[state=checked]:bg-secondary peer-data-[state=checked]:shadow-sm transition-all cursor-pointer"
                    >
                      <t.icon className={`size-8 ${t.color}`} />
                      <div className="space-y-1">
                        <p className="font-bold uppercase tracking-tight">{t.title}</p>
                        <p className="text-sm font-sans text-muted-foreground text-foreground/70 leading-snug">
                          {t.desc}
                        </p>
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </Surface>

          <Button
            type="submit"
            size="lg"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-16 text-xl shadow-sm border border-border font-display uppercase tracking-wider"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                Criando espaço...
              </>
            ) : (
              "Criar Meu Espaço"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
