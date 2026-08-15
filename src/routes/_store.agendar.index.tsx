import { createFileRoute, Link } from "@tanstack/react-router";
import { listBookingServices } from "@/services/booking.functions";
import { formatMoney } from "@/lib/money";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";

export const Route = createFileRoute("/_store/agendar/")({
  head: () => ({ meta: [{ title: "Agendar Serviço" }] }),
  loader: async () => {
    return await listBookingServices();
  },
  component: BookingIndexPage,
});

function BookingIndexPage() {
  const { data: services } = Route.useLoaderData();

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Serviços</h1>
        <p className="text-muted-foreground">Selecione o serviço que deseja agendar.</p>
      </div>

      {!services || services.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nenhum serviço disponível no momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {services.map((service: any) => (
            <Card key={service.id} className="hover:border-primary/50 transition-colors">
              <CardContent className="p-6 flex flex-col h-full justify-between gap-4">
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg leading-none">{service.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground font-mono bg-muted/50 w-fit px-2 py-1 rounded-xl">
                    <Clock className="size-3.5" />
                    {service.duration_minutes} minutos
                  </div>
                  {service.description && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {service.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-border">
                  <span className="font-bold text-lg">
                    {formatMoney(service.price_cents, "BRL")}
                  </span>
                  <Button asChild>
                    <Link to="/agendar">Agendar</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
