import { Check, Circle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { STORE_TYPES, type StepProps } from "./types";

interface PublishStepProps extends StepProps {
  onPublish: () => void;
  publishing: boolean;
}

export function PublishStep({ data, onPublish, publishing }: PublishStepProps) {
  const storeType = STORE_TYPES.find((t) => t.id === data.storeType);

  const checks = [
    { done: !!data.storeType, label: "Tipo definido" },
    { done: !!data.name && !!data.slug, label: "Identidade criada" },
    { done: data.onlineOnly || (!!data.city && !!data.whatsapp), label: "Localização configurada" },
    {
      done: Object.values(data.hours).some((d) => d.active),
      label: "Horários cadastrados",
    },
  ];

  const allDone = checks.every((c) => c.done);

  return (
    <div className="max-w-2xl mx-auto px-4 space-y-8">
      <h1 className="text-2xl font-bold text-foreground text-center">
        Quase lá! Revise e publique
      </h1>

      {/* Mini preview */}
      <div className="rounded-2xl border overflow-hidden bg-card">
        {data.bannerPreview ? (
          <div className="aspect-[3/1] w-full overflow-hidden">
            <img src={data.bannerPreview} alt="" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="aspect-[3/1] w-full" style={{ backgroundColor: data.accentColor + "33" }} />
        )}
        <div className="p-5 flex items-center gap-4 -mt-8 relative z-10">
          {data.logoPreview ? (
            <img
              src={data.logoPreview}
              alt=""
              className="w-16 h-16 rounded-full border-4 border-card object-cover bg-card"
            />
          ) : (
            <div
              className="w-16 h-16 rounded-full border-4 border-card flex items-center justify-center text-2xl bg-muted"
            >
              {storeType?.icon || "🏪"}
            </div>
          )}
          <div className="pt-6">
            <h2 className="font-bold text-lg text-foreground">{data.name || "Sua Loja"}</h2>
            {data.tagline && (
              <p className="text-sm text-muted-foreground">{data.tagline}</p>
            )}
          </div>
        </div>
      </div>

      {/* Checklist */}
      <div className="space-y-2">
        {checks.map((check, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 p-3 rounded-lg border ${
              check.done ? "border-primary/30 bg-primary/5" : "border-border"
            }`}
          >
            {check.done ? (
              <Check className="h-5 w-5 text-primary" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground" />
            )}
            <span className={`text-sm ${check.done ? "text-foreground" : "text-muted-foreground"}`}>
              {check.label}
            </span>
          </div>
        ))}
        <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
          <Circle className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Adicionar primeiro produto/anúncio</span>
          <ExternalLink className="h-3 w-3 text-muted-foreground ml-auto" />
        </div>
      </div>

      {/* Plans */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { name: "Grátis", price: "R$ 0", desc: "10 produtos, sem destaque" },
          { name: "Pro", price: "R$ 29/mês", desc: "Ilimitado + destaque + estatísticas" },
          { name: "Premium", price: "R$ 59/mês", desc: "Tudo + domínio próprio + multivendedor" },
        ].map((plan) => (
          <div
            key={plan.name}
            className="rounded-xl border p-4 text-center space-y-1 hover:border-primary/40 transition-colors"
          >
            <p className="font-bold text-foreground">{plan.name}</p>
            <p className="text-lg font-semibold text-primary">{plan.price}</p>
            <p className="text-xs text-muted-foreground">{plan.desc}</p>
          </div>
        ))}
      </div>

      {/* Publish button */}
      <Button
        onClick={onPublish}
        disabled={!allDone || publishing}
        className="w-full h-14 text-lg font-bold rounded-2xl"
        size="lg"
      >
        {publishing ? "Publicando..." : "🚀 Publicar minha loja"}
      </Button>
    </div>
  );
}
