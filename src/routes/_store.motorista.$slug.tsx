import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Car,
  Bike,
  Star,
  ShieldCheck,
  CheckCircle,
  Phone,
  ArrowRight,
  Sparkles,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCourierBySlug } from "@/services/mobility.functions";

export const Route = createFileRoute("/_store/motorista/$slug")({
  head: ({ loaderData }) => ({
    meta: [
      {
        title: `${loaderData?.courier?.full_name || "Motorista Autônomo"} — JAH Mobilidade`,
      },
    ],
  }),
  loader: async ({ params }) => {
    const courier = await getCourierBySlug({ data: { slug: params.slug } }).catch(() => null);
    return { courier, slug: params.slug };
  },
  component: DriverDirectPage,
});

function DriverDirectPage() {
  const { courier, slug } = Route.useLoaderData();

  if (!courier) {
    return (
      <div className="py-24 text-center space-y-4">
        <Car className="size-12 text-muted-foreground/40 mx-auto" />
        <h1 className="text-xl font-bold text-foreground">Motorista não encontrado</h1>
        <p className="text-xs text-muted-foreground">O link do motorista é inválido ou foi desativado.</p>
        <Button asChild className="rounded-2xl">
          <Link to="/mobilidade">Voltar para Mobilidade</Link>
        </Button>
      </div>
    );
  }

  const phoneDigits = courier.phone ? courier.phone.replace(/\D/g, "") : "";

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8 pb-24">
      {/* Profile Card */}
      <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-xs text-center space-y-6">
        <div className="relative size-24 rounded-3xl mx-auto overflow-hidden border-2 border-primary/20 shadow-md">
          {courier.avatar_url ? (
            <img
              src={courier.avatar_url}
              alt={courier.full_name}
              className="size-full object-cover"
            />
          ) : (
            <div className="size-full bg-primary/10 text-primary flex items-center justify-center font-black text-2xl">
              {courier.full_name.charAt(0)}
            </div>
          )}
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-center gap-1.5 text-xs font-mono text-emerald-600 font-bold">
            <ShieldCheck className="size-4" />
            <span>Motorista Parceiro Verificado</span>
          </div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">
            {courier.full_name}
          </h1>
          <p className="text-xs text-muted-foreground font-mono">
            {courier.vehicle_model || courier.vehicle_type} • Placa {courier.vehicle_plate || "Verificada"}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-muted/40 border border-border/50 text-center">
          <div>
            <div className="flex items-center justify-center gap-1 text-amber-500 font-bold text-sm">
              <Star className="size-4 fill-amber-500" />
              <span>{courier.rating.toFixed(1)}</span>
            </div>
            <span className="text-[10px] text-muted-foreground">Avaliação</span>
          </div>

          <div>
            <span className="font-bold text-foreground text-sm font-mono">{courier.total_rides}</span>
            <p className="text-[10px] text-muted-foreground">Corridas Realizadas</p>
          </div>

          <div>
            <span className="inline-block size-2.5 rounded-full bg-emerald-500 my-1 animate-pulse" />
            <p className="text-[10px] text-muted-foreground">Online Agora</p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-2">
          <Button
            asChild
            className="w-full h-12 rounded-2xl font-bold text-xs bg-primary text-primary-foreground shadow-sm gap-2"
          >
            <Link to="/mobilidade">
              <span>Chamar {courier.full_name.split(" ")[0]} Agora</span>
              <ArrowRight className="size-4" />
            </Link>
          </Button>

          {courier.phone && (
            <Button
              asChild
              variant="outline"
              className="w-full h-12 rounded-2xl font-bold text-xs border-emerald-500/30 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 gap-2"
            >
              <a href={`https://wa.me/55${phoneDigits}`} target="_blank" rel="noreferrer">
                <Phone className="size-4 text-emerald-600" />
                <span>Conversar no WhatsApp</span>
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
