import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Search, Calendar as CalendarIcon, MapPin, MoreVertical, Settings } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listAdminEvents } from "@/services/events.functions";

export const Route = createFileRoute("/admin/events/")({
  head: () => ({ meta: [{ title: "Eventos — Admin" }] }),
  loader: async () => {
    const events = await listAdminEvents();
    return { events };
  },
  component: AdminEventsIndex,
});

function AdminEventsIndex() {
  const { events } = Route.useLoaderData();
  const [search, setSearch] = useState("");

  const filteredEvents = events.filter((e) =>
    e.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Eventos & Cultura</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie seus shows, workshops e encontros comunitários.
          </p>
        </div>

        <Button asChild>
          <Link to="/admin/events/new">
            <Plus className="mr-2 h-4 w-4" />
            Novo Evento
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar evento..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredEvents.map((event) => (
          <Card key={event.id} className="group overflow-hidden flex flex-col hover:border-primary/50 transition-colors">
             <div className="h-32 bg-muted/50 border-b relative flex items-center justify-center">
              {event.image ? (
                <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
              ) : (
                <CalendarIcon className="h-8 w-8 text-muted-foreground/50" />
              )}
              <Badge 
                variant={event.status === "published" ? "default" : "secondary"}
                className="absolute top-2 right-2 shadow-sm"
              >
                {event.status === "published" ? "Publicado" : "Rascunho"}
              </Badge>
            </div>
            
            <CardContent className="p-4 flex flex-col flex-1">
              <h3 className="font-semibold text-lg truncate">{event.title}</h3>
              <div className="flex items-center text-xs text-muted-foreground mt-2 mb-4">
                <MapPin className="h-3 w-3 mr-1 shrink-0" />
                <span className="truncate">{event.location || "Local a definir"}</span>
              </div>

              <div className="mt-auto flex items-center justify-between pt-4 border-t">
                 <span className="text-xs text-muted-foreground flex items-center">
                  <CalendarIcon className="h-3 w-3 mr-1" />
                  {format(new Date(event.event_date), "dd MMM, HH:mm", { locale: ptBR })}
                </span>
                
                <Button variant="secondary" size="sm" asChild>
                  <Link to="/admin/events/$eventId" params={{ eventId: event.id }}>
                    <Settings className="h-4 w-4 mr-1.5" />
                    Gerenciar
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredEvents.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/20 border border-dashed rounded-lg">
            {events.length === 0
              ? "Nenhum evento criado. Crie seu primeiro show ou workshop."
              : "Nenhum evento encontrado para esta busca."}
          </div>
        )}
      </div>
    </div>
  );
}
