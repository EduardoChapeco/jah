import React from "react";
import { Badge } from "@/components/ui/badge";

export type ChannelSource =
  | "mercadolivre"
  | "mercado_livre"
  | "ifood"
  | "shopee"
  | "amazon"
  | "magalu"
  | "magazine_luiza"
  | "99food"
  | "amodelivery"
  | "amo_delivery"
  | "classifieds"
  | "classificados"
  | "online_store"
  | "store"
  | "vitrine"
  | "pos"
  | "pdv"
  | "balcao"
  | "manual"
  | string;

export interface ChannelInfo {
  id: string;
  label: string;
  badgeClass: string;
}

export function getChannelInfo(source?: string | null): ChannelInfo {
  const norm = (source || "").toLowerCase().replace(/[\s-]/g, "_");

  if (norm.includes("mercadolivre") || norm.includes("mercado_livre") || norm === "ml") {
    return {
      id: "mercadolivre",
      label: "Mercado Livre",
      badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
    };
  }
  if (norm.includes("ifood")) {
    return {
      id: "ifood",
      label: "iFood",
      badgeClass: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30",
    };
  }
  if (norm.includes("shopee")) {
    return {
      id: "shopee",
      label: "Shopee",
      badgeClass: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30",
    };
  }
  if (norm.includes("amazon")) {
    return {
      id: "amazon",
      label: "Amazon",
      badgeClass: "bg-neutral-500/15 text-neutral-700 dark:text-neutral-300 border-neutral-500/30",
    };
  }
  if (norm.includes("magalu") || norm.includes("magazine_luiza")) {
    return {
      id: "magalu",
      label: "Magalu",
      badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
    };
  }
  if (norm.includes("99food")) {
    return {
      id: "99food",
      label: "99Food",
      badgeClass: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/30",
    };
  }
  if (norm.includes("amodelivery") || norm.includes("amo_delivery")) {
    return {
      id: "amodelivery",
      label: "Amo Delivery",
      badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    };
  }
  if (norm.includes("classificados") || norm.includes("classifieds")) {
    return {
      id: "classifieds",
      label: "Classificados",
      badgeClass: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30",
    };
  }
  if (
    norm.includes("online_store") ||
    norm.includes("store") ||
    norm.includes("vitrine") ||
    norm.includes("ecommerce")
  ) {
    return {
      id: "online_store",
      label: "Loja Online",
      badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    };
  }

  return {
    id: "pos",
    label: "Balcão / PDV",
    badgeClass: "bg-muted text-muted-foreground border-border",
  };
}

export function ChannelBadge({
  source,
  className = "",
}: {
  source?: string | null;
  className?: string;
}) {
  const info = getChannelInfo(source);

  return (
    <Badge
      variant="outline"
      className={`text-[10px] font-semibold tracking-wide ${info.badgeClass} ${className}`}
    >
      {info.label}
    </Badge>
  );
}
