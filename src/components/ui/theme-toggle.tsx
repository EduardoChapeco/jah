/**
 * ThemeToggle — Componente de alternância de tema Jah
 *
 * Exibe um botão com ícone de sol/lua que cicla entre:
 * system → light → dark → system
 *
 * Uso: <ThemeToggle /> em qualquer ponto do layout (header, settings, etc.)
 */

import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme, type ThemeMode } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const themeLabels: Record<ThemeMode, string> = {
  system: "Sistema",
  light: "Claro",
  dark: "Escuro",
};

const ThemeIcon = ({ theme, resolved }: { theme: ThemeMode; resolved: "light" | "dark" }) => {
  if (theme === "system") return <Monitor className="size-4" aria-hidden="true" />;
  if (resolved === "dark") return <Moon className="size-4" aria-hidden="true" />;
  return <Sun className="size-4" aria-hidden="true" />;
};

const themeOrder: ThemeMode[] = ["system", "light", "dark"];

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, resolvedTheme, setTheme } = useTheme();

  const cycle = () => {
    const idx = themeOrder.indexOf(theme);
    const next = themeOrder[(idx + 1) % themeOrder.length];
    setTheme(next);
  };

  return (
    <Button
      id="theme-toggle"
      variant="ghost"
      size="icon"
      onClick={cycle}
      aria-label={`Tema atual: ${themeLabels[theme]}. Clique para alternar`}
      title={`Tema: ${themeLabels[theme]}`}
      className={cn("border-transparent", className)}
    >
      <ThemeIcon theme={theme} resolved={resolvedTheme} />
      <span className="sr-only">{themeLabels[theme]}</span>
    </Button>
  );
}
