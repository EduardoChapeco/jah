import React from 'react';
import { Globe, Plane, Users, MapPin, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface ActiveTravelerLocation {
  id: string;
  clientName: string;
  destination: string;
  status: 'flight_boarding' | 'in_flight' | 'hotel_checked_in' | 'returning';
  countryCode: string;
  flag: string;
}

export const MOCK_ACTIVE_TRAVELERS: ActiveTravelerLocation[] = [
  { id: '1', clientName: 'Roberto Albuquerque', destination: 'Paris, França', status: 'hotel_checked_in', countryCode: 'FR', flag: '🇫🇷' },
  { id: '2', clientName: 'Família Mendonça (4 pax)', destination: 'Orlando, EUA', status: 'in_flight', countryCode: 'US', flag: '🇺🇸' },
  { id: '3', clientName: 'Camila & Felipe (Lua de Mel)', destination: 'Cancún, México', status: 'hotel_checked_in', countryCode: 'MX', flag: '🇲🇽' },
  { id: '4', clientName: 'Excursão Beto Carrero (46 pax)', destination: 'Penha, SC', status: 'hotel_checked_in', countryCode: 'BR', flag: '🇧🇷' },
];

export function RadarMapWidget() {
  return (
    <div className="p-6 rounded-2xl bg-card border border-border shadow-md space-y-5">
      <div className="flex items-center justify-between border-b border-border/70 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600">
            <Globe className="size-5 animate-spin duration-1000" style={{ animationDuration: '12s' }} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Radar Global de Operações</h3>
            <p className="text-[11px] text-muted-foreground">Monitoramento 24h de viajantes e excursões ativas</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">Tempo Real</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {MOCK_ACTIVE_TRAVELERS.map((t) => (
          <div key={t.id} className="p-4 rounded-2xl bg-muted/30 border border-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xl">{t.flag}</span>
              <Badge variant="outline" className="text-[9px] font-mono uppercase py-0">
                {t.status === 'in_flight' ? 'Em Voo' : 'No Hotel'}
              </Badge>
            </div>
            <div>
              <h4 className="text-xs font-bold text-foreground truncate">{t.clientName}</h4>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="size-3 text-primary shrink-0" /> {t.destination}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
