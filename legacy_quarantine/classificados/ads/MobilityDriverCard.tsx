import { Star, MapPin, Clock, Car, Bike, Truck, Users, Dog, Snowflake, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DriverProfile } from "@/hooks/useDriverProfile";

const VEHICLE_ICONS: Record<string, any> = {
  bicicleta: Bike, ebike: Bike, moto: Bike, carro: Car, suv: Car, van: Truck, caminhao: Truck, micro_onibus: Truck,
};

const SERVICE_LABELS: Record<string, { label: string; color: string }> = {
  product: { label: "Entregas", color: "bg-blue-500/10 text-blue-600" },
  passenger: { label: "Carona", color: "bg-green-500/10 text-green-600" },
  moving: { label: "Mudança", color: "bg-orange-500/10 text-orange-600" },
  transfer: { label: "Transfer", color: "bg-purple-500/10 text-purple-600" },
  freight: { label: "Frete", color: "bg-yellow-500/10 text-yellow-700" },
  medicine: { label: "Urgência", color: "bg-red-500/10 text-red-600" },
  pet_taxi: { label: "Pet Taxi", color: "bg-pink-500/10 text-pink-600" },
  b2b_freight: { label: "B2B", color: "bg-indigo-500/10 text-indigo-600" },
};

interface Props {
  driver: DriverProfile;
  onRequest?: () => void;
  onSchedule?: () => void;
}

export function MobilityDriverCard({ driver, onRequest, onSchedule }: Props) {
  const VehicleIcon = VEHICLE_ICONS[driver.vehicle_type] || Car;
  const cities = driver.cities || [];
  const services = driver.service_types || [];
  const isOnline = driver.is_available;

  return (
    <div className="bg-card border-[1.5px] border-border rounded-[var(--r5)] overflow-hidden hover:border-primary/30 transition-all">
      <div className="p-4 flex gap-4">
        {/* Profile photo */}
        <div className="relative shrink-0">
          {(driver as any).profile_photo ? (
            <img src={(driver as any).profile_photo} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-border" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <VehicleIcon className="w-7 h-7 text-muted-foreground" />
            </div>
          )}
          {/* Live status badge */}
          {isOnline && (
            <div className="absolute -bottom-1 -right-1 flex items-center gap-1 bg-green-500 text-white text-[8px] font-bold px-2 py-0.5 rounded-full shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              Online
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-bold text-foreground truncate">
              {(driver as any).display_name || `Profissional ${driver.vehicle_type}`}
            </h3>
            {driver.rating > 0 && (
              <span className="flex items-center gap-0.5 text-[10px] font-bold text-yellow-600 bg-yellow-500/10 px-1.5 py-0.5 rounded-[var(--rF)]">
                <Star className="w-2.5 h-2.5 fill-current" /> {driver.rating}
              </span>
            )}
            <span className="text-[10px] px-1.5 py-0.5 bg-muted text-muted-foreground rounded-[var(--rF)] capitalize flex items-center gap-1">
              <VehicleIcon className="w-2.5 h-2.5" /> {driver.vehicle_type}
            </span>
          </div>

          {/* Service chips */}
          <div className="flex flex-wrap gap-1 mb-2">
            {services.map(s => {
              const info = SERVICE_LABELS[s];
              if (!info) return null;
              return (
                <span key={s} className={`text-[9px] font-medium px-2 py-0.5 rounded-[var(--rF)] ${info.color}`}>
                  {info.label}
                </span>
              );
            })}
          </div>

          {/* Area & price */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {cities.length > 0 && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {cities.slice(0, 2).join(", ")}{cities.length > 2 ? ` +${cities.length - 2}` : ""}
              </span>
            )}
            {driver.min_price > 0 && (
              <span className="font-medium text-foreground">A partir de R$ {driver.min_price}</span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> {driver.total_deliveries || 0} entregas
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 pb-4 flex gap-2">
        <Button onClick={onRequest} className="flex-1 bg-primary text-primary-foreground font-bold gap-1.5 h-10">
          <Zap className="w-3.5 h-3.5" /> Solicitar agora
        </Button>
        <Button variant="outline" onClick={onSchedule} className="flex-1 h-10 font-medium gap-1.5">
          <Clock className="w-3.5 h-3.5" /> Agendar
        </Button>
      </div>
    </div>
  );
}
