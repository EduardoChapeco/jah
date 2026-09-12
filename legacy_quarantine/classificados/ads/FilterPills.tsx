import { useNavigate, useLocation } from "react-router-dom";
import {
  Home, Car, Plane, Briefcase, Calendar, Shirt,
  Wrench, Bike, Smartphone, PawPrint, Wheat,
  type LucideIcon,
} from "lucide-react";
import { useCategories } from "@/hooks/useAds";

const iconMap: Record<string, LucideIcon> = {
  Home, Car, Plane, Briefcase, Calendar, Shirt,
  Wrench, Bike, Smartphone, PawPrint, Wheat,
};

export function FilterPills() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: categories } = useCategories();

  const currentSlug = location.pathname.startsWith("/categoria/")
    ? location.pathname.split("/categoria/")[1]
    : location.pathname === "/" ? "" : "";

  return (
    <div
      className="shrink-0 flex items-center gap-2 overflow-x-auto scrollbar-hide"
      style={{
        height: 44,
        padding: "0 24px",
        background: "rgba(8,8,10,0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid hsl(var(--b0))",
      }}
    >
      <button
        onClick={() => navigate("/")}
        className={currentSlug === "" ? "chip chip-orange" : "chip chip-gray"}
      >
        Todos
      </button>
      {categories?.map((cat) => {
        const isActive = currentSlug === cat.slug;
        return (
          <button
            key={cat.slug}
            onClick={() => navigate(`/categoria/${cat.slug}`)}
            className={isActive ? "chip chip-orange" : "chip chip-gray"}
          >
            {cat.name}
          </button>
        );
      })}
    </div>
  );
}
