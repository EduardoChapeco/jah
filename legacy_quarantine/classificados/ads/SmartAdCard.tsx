/**
 * SmartAdCard — dispatches to the correct card variant based on ad category.
 * Use this instead of AdCard wherever you want niche-specific card rendering.
 */
import { Ad } from "@/types";
import { AdCard } from "./AdCard";
import { EventCard } from "./EventCard";
import { JobCard } from "./JobCard";
import { ServiceCard } from "./ServiceCard";

interface SmartAdCardProps {
  ad: Ad;
  size?: "default" | "large";
  horizontal?: boolean;
}

export function SmartAdCard({ ad, size, horizontal }: SmartAdCardProps) {
  const slug = ad.categorySlug;

  // Dispatch to specialized card variants
  switch (slug) {
    case "eventos":
      return <EventCard ad={ad} />;
    case "empregos":
      return <JobCard ad={ad} />;
    case "servicos":
      return <ServiceCard ad={ad} />;
    default:
      return <AdCard ad={ad} size={size} horizontal={horizontal} />;
  }
}
