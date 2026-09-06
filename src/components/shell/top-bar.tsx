import { Tag } from "lucide-react";
import React from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { DEFAULT_BRAND_NAME } from "@/lib/brand";
import { LocationMasterPill } from "@/components/location/location-master-pill";
import { MobilityQuickButton } from "@/components/mobility/mobility-quick-button";
import { UtilityCluster } from "@/components/shell/utility-cluster";
import { House, ChatCircleText, Newspaper, Flame, ForkKnife, Storefront, Heartbeat, Coffee, CalendarDots, Scissors, DeviceMobile, TShirt, Briefcase, CarProfile, AirplaneTilt, Key, Compass, MapPin, MagnifyingGlass,  } from "@phosphor-icons/react";

export interface MobileQuickChip {
 to: string;
 label: string;
 icon: React.ElementType;
}

export const MOBILE_QUICK_CHIPS: MobileQuickChip[] = [
  { to: "/noticias", label: "Notícias", icon: Newspaper },
  { to: "/classificados", label: "Classificados", icon: Tag },
  { to: "/ofertas", label: "Ofertas", icon: Flame },
  { to: "/mercado", label: "Mercado", icon: Storefront },
  { to: "/agenda", label: "Eventos", icon: CalendarDots },
  { to: "/diretorio", label: "Guia & Lojas", icon: Compass },
  { to: "/gastronomia", label: "Comida", icon: ForkKnife },
  { to: "/turismo", label: "Turismo", icon: AirplaneTilt },
  { to: "/mapa", label: "Mapa", icon: MapPin },
  { to: "/convite", label: "Prêmios", icon: House },
];

export interface TopBarProps {
 session?: any;
 brandSettings?: {
 logo_url?: string | null;
 favicon_url?: string | null;
 show_logo?: boolean;
 show_name?: boolean;
 platform_name?: string;
 } | null;
}

export function TopBar({ session, brandSettings }: TopBarProps) {
 const location = useLocation();

 return (
 <header className="sticky top-0 z-30 w-full bg-background/95 backdrop-blur-md select-none border-b border-border/40">
 {/* ── Camada 1: Topo Principal Compacto ── */}
 <div className="px-3 sm:px-5 py-1.5 sm:py-2 flex items-center justify-between gap-2 sm:gap-4 min-h-[48px] w-full">
 {/* Lado Esquerdo: Logo + Localização */}
 <div className="flex items-center gap-2 sm:gap-3 shrink-0">
 <Link
 to="/"
 className="flex items-center gap-1.5 hover:opacity-90 transition-opacity shrink-0"
 >
 {brandSettings?.show_logo !== false && brandSettings?.logo_url ? (
 <img
 src={brandSettings.logo_url}
 alt={brandSettings.platform_name && brandSettings.platform_name !== "Wider" ? brandSettings.platform_name : DEFAULT_BRAND_NAME}
 className="h-7 max-w-[100px] object-contain"
 />
 ) : null}
 {(brandSettings?.show_name !== false || !brandSettings?.logo_url) && (
 <span className="font-display font-black text-xl sm:text-2xl tracking-tight text-foreground leading-none">
 {brandSettings?.platform_name && brandSettings.platform_name !== "Wider" ? brandSettings.platform_name : DEFAULT_BRAND_NAME}
 </span>
 )}
 </Link>

 {/* Location Pill — compacto no mobile */}
 <LocationMasterPill className="max-w-[80px] sm:max-w-[170px]" />
 </div>

 {/* Centro (Desktop): Busca Global Inteligente */}
 <div className="hidden lg:flex flex-1 max-w-xl mx-4">
 <Link
 to="/buscar"
 className="w-full flex items-center justify-between px-4 py-2 rounded-xl bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-medium transition-all group border border-border/40 hover:border-border"
 >
 <div className="flex items-center gap-2.5">
 <MagnifyingGlass
 size={16}
 className="text-muted-foreground group-hover:text-foreground transition-colors"
 />
 <span>Buscar produtos, lojas, serviços e desapegos...</span>
 </div>
 <kbd className="hidden xl:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono font-bold text-muted-foreground bg-background rounded-md border border-border/40">
 ⌘K
 </kbd>
 </Link>
 </div>

 {/* Lado Direito: Mobilidade Contextual + UtilityCluster */}
 <div className="flex items-center gap-2 shrink-0 ml-auto">
 {/* Exibe o botão de mobilidade apenas em contextos comerciais ou de mobilidade */}
 {(location.pathname === "/" ||
 location.pathname.startsWith("/gastronomia") ||
 location.pathname.startsWith("/mercado") ||
 location.pathname.startsWith("/farmacia") ||
 location.pathname.startsWith("/mobilidade") ||
 location.pathname.startsWith("/mapa")) && (
 <div className="hidden md:block">
 <MobilityQuickButton />
 </div>
 )}
 <UtilityCluster session={session} embedded={true} />
 </div>
 </div>

 {/* ── Camada 2: Chips de Navegação Rápida (Mobile/Tablet) ── */}
 <div className="lg:hidden flex items-center gap-1 px-2.5 py-1 overflow-x-auto no-scrollbar bg-muted/10 border-t border-border/30">
 {MOBILE_QUICK_CHIPS.map((chip) => {
 const isSelected =
 chip.to === "/"
 ? location.pathname === "/"
 : location.pathname.startsWith(chip.to.split("?")[0]) &&
 (chip.to.includes("?")
 ? location.searchStr.includes(chip.to.split("?")[1])
 : true);
 const Icon = chip.icon;

 return (
 <Link
 key={chip.label}
 to={chip.to as any}
 className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold shrink-0 transition-all ${
 isSelected
 ? "bg-foreground text-background"
 : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
 }`}
 >
 <Icon size={12} weight={isSelected ? "fill" : "bold"} />
 <span className="whitespace-nowrap">{chip.label}</span>
 </Link>
 );
 })}
 </div>
 </header>
 );
}
