/**
 * Presentation Presets & Post Themes (Derivado do Wider Luma Themes Engine)
 * Permite ao autor escolher a cara pública do post sem alterar o dado canônico.
 */

export interface PresentationTheme {
  id: string;
  name: string;
  category: "clean" | "editorial" | "noturno" | "cultural" | "comercial";
  description: string;
  badgeLabel?: string;
  colors: {
    primary: string;
    background: string;
    cardBg: string;
    text: string;
    accent: string;
    border: string;
  };
  gradient?: string;
  animation?: "none" | "glow" | "shimmer" | "float";
  fontFamily?: string;
  patternType?: "none" | "grid" | "halftone" | "zine_noise";
}

export const PRESENTATION_THEMES: PresentationTheme[] = [
  {
    id: "clean_standard",
    name: "Clean Padrão",
    category: "clean",
    description: "Design neutro e funcional com foco na leitura.",
    colors: {
      primary: "var(--color-primary)",
      background: "var(--color-background)",
      cardBg: "var(--color-card)",
      text: "var(--color-foreground)",
      accent: "var(--color-primary)",
      border: "var(--color-border)",
    },
    animation: "none",
    fontFamily: "Inter, sans-serif",
  },
  {
    id: "editorial_zine",
    name: "Zine Cultural / Lambe-Lambe",
    category: "editorial",
    description: "Estética independente lambe-lambe com tipografia de alto impacto.",
    badgeLabel: "Zine",
    colors: {
      primary: "#000000",
      background: "#f4f1ea",
      cardBg: "#fcfbf7",
      text: "#111111",
      accent: "#e11d48",
      border: "#111111",
    },
    patternType: "zine_noise",
    animation: "none",
    fontFamily: "Plus Jakarta Sans, sans-serif",
  },
  {
    id: "dark_glow",
    name: "Dark Glow / Noturno",
    category: "noturno",
    description: "Fundo profundo com iluminação neon suave para festas e música.",
    badgeLabel: "Night",
    colors: {
      primary: "#38bdf8",
      background: "#090d16",
      cardBg: "#111827",
      text: "#f1f5f9",
      accent: "#ec4899",
      border: "#1e293b",
    },
    gradient: "linear-gradient(135deg, #090d16 0%, #1e1b4b 100%)",
    animation: "glow",
    fontFamily: "Inter, sans-serif",
  },
  {
    id: "event_ticket",
    name: "Ticket de Evento",
    category: "cultural",
    description: "Formato de ingresso perfurado com foco em data e portaria.",
    badgeLabel: "Ingresso",
    colors: {
      primary: "#10b981",
      background: "#064e3b",
      cardBg: "#022c22",
      text: "#ecfdf5",
      accent: "#34d399",
      border: "#059669",
    },
    gradient: "linear-gradient(135deg, #022c22 0%, #064e3b 100%)",
    animation: "none",
    fontFamily: "Inter, sans-serif",
  },
  {
    id: "gourmet_experience",
    name: "Experiência Gastronômica",
    category: "comercial",
    description: "Cores acolhedoras e elegantes para restaurantes e cafés.",
    badgeLabel: "Menu",
    colors: {
      primary: "#ea580c",
      background: "#fffbeb",
      cardBg: "#ffffff",
      text: "#451a03",
      accent: "#f59e0b",
      border: "#fed7aa",
    },
    animation: "none",
    fontFamily: "Inter, sans-serif",
  },
  {
    id: "underground_riot",
    name: "Underground Brutal",
    category: "editorial",
    description: "Cores ácidas contrastantes para o circuito de bandas e festivais.",
    badgeLabel: "Live",
    colors: {
      primary: "#84cc16",
      background: "#18181b",
      cardBg: "#27272a",
      text: "#fafafa",
      accent: "#a855f7",
      border: "#3f3f46",
    },
    gradient: "linear-gradient(135deg, #18181b 0%, #27272a 100%)",
    animation: "shimmer",
    fontFamily: "JetBrains Mono, monospace",
  },
];

export function getThemeById(id?: string): PresentationTheme {
  return PRESENTATION_THEMES.find((t) => t.id === id) || PRESENTATION_THEMES[0];
}
