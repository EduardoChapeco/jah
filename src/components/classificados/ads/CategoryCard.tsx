import { Link } from "react-router-dom";
import { Category } from "@/types";
import {
  Home, Car, Plane, Briefcase, Calendar, Shirt,
  Wrench, Bike, Smartphone, PawPrint, Wheat, MoreHorizontal,
  type LucideIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  Home, Car, Plane, Briefcase, Calendar, Shirt,
  Wrench, Bike, Smartphone, PawPrint, Wheat, MoreHorizontal,
};

const iconBgMap: Record<string, string> = {
  blue: "bg-badge-blue/10 text-badge-blue",
  teal: "bg-badge-teal/10 text-badge-teal",
  green: "bg-badge-green/10 text-badge-green",
  purple: "bg-badge-purple/10 text-badge-purple",
  pink: "bg-badge-pink/10 text-badge-pink",
  red: "bg-badge-red/10 text-badge-red",
  orange: "bg-badge-orange/10 text-badge-orange",
  indigo: "bg-badge-indigo/10 text-badge-indigo",
};

interface CategoryCardProps {
  category: Category;
  active?: boolean;
}

export function CategoryCard({ category, active }: CategoryCardProps) {
  const Icon = iconMap[category.icon] || MoreHorizontal;
  const iconBg = iconBgMap[category.color] || iconBgMap.blue;

  return (
    <Link
      to={`/categoria/${category.slug}`}
      className={`shrink-0 flex flex-col items-center gap-2 px-4 py-3 rounded-[var(--r4)] border-[1.5px] transition-all duration-300 ease-ereemby hover:-translate-y-[2px] ${
        active
          ? "bg-primary text-primary-foreground border-primary shadow-md"
          : "bg-card border-border hover:shadow-sm hover:border-primary/30"
      }`}
    >
      <div className={`w-10 h-10 rounded-[var(--r3)] flex items-center justify-center ${active ? "bg-white/20 text-primary-foreground" : iconBg}`}>
        <Icon className="w-5 h-5" />
      </div>
      <span className={`text-xs font-medium whitespace-nowrap ${active ? "" : "text-foreground"}`}>{category.name}</span>
      <span className={`text-[10px] ${active ? "text-white/60" : "text-muted-foreground"}`}>{category.count}</span>
    </Link>
  );
}