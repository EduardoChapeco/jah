import React from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Shield, Image as ImageIcon, Sparkles, Sliders, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AdminContextualBarProps {
  userRole?: string | null;
}

const ROUTE_NICHE_MAP: Record<string, { id: string; label: string; emoji: string }> = {
  "/": { id: "home", label: "Início (Home)", emoji: "🏠" },
  "/mercado": { id: "mercado", label: "Supermercado & Feira", emoji: "🛒" },
  "/gastronomia": { id: "gastronomia", label: "Gastronomia & Delivery", emoji: "🍽️" },
  "/farmacia": { id: "farmacia", label: "Farmácia & Saúde", emoji: "💊" },
  "/bebidas": { id: "bebidas", label: "Bebidas & Adega", emoji: "🍻" },
  "/acougue": { id: "acougue", label: "Açougue & Carnes", emoji: "🥩" },
  "/moda": { id: "moda", label: "Moda & Vestuário", emoji: "👗" },
  "/eletronicos": { id: "eletronicos", label: "Eletrônicos & Tech", emoji: "📱" },
  "/pet": { id: "pet", label: "Pet Shop", emoji: "🐾" },
  "/servicos": { id: "servicos", label: "Serviços & Profissionais", emoji: "💼" },
  "/imoveis": { id: "imoveis", label: "Imóveis & Locação", emoji: "🏢" },
  "/construcao": { id: "construcao", label: "Construção & Reforma", emoji: "🔨" },
  "/casa": { id: "casa", label: "Casa & Decoração", emoji: "🛋️" },
  "/beleza": { id: "beleza", label: "Beleza & Estética", emoji: "✂️" },
  "/limpeza": { id: "limpeza", label: "Limpeza & Utilidades", emoji: "🧹" },
  "/livros": { id: "livros", label: "Livros & Papelaria", emoji: "📚" },
  "/noticias": { id: "noticias", label: "Portal de Notícias", emoji: "📰" },
  "/agenda": { id: "agenda", label: "Agenda & Eventos", emoji: "📅" },
  "/turismo": { id: "turismo", label: "Turismo & Hospedagem", emoji: "✈️" },
  "/empregos": { id: "empregos", label: "Empregos & Vagas", emoji: "💼" },
  "/classificados": { id: "classificados", label: "Classificados P2P", emoji: "🏷️" },
  "/diretorio": { id: "diretorio", label: "Diretório Comercial", emoji: "🧭" },
  "/mobilidade": { id: "mobilidade", label: "Mobilidade Urbana", emoji: "🚗" },
  "/ofertas": { id: "ofertas", label: "Ofertas Relâmpago", emoji: "⚡" },
};

export function AdminContextualBar({ userRole }: AdminContextualBarProps) {
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;

  // Renderiza apenas se for platform_admin e estiver em uma vitrine pública (não admin ou workspace)
  if (userRole !== "platform_admin" || pathname.startsWith("/admin-master") || pathname.startsWith("/workspace")) {
    return null;
  }

  // Identifica o nicho atual
  const activeNiche = ROUTE_NICHE_MAP[pathname] || {
    id: "all",
    label: "Vitrine Pública",
    emoji: "🌐",
  };

  return (
    <aside
      aria-label="Barra de Governança Contextual Master"
      className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 max-w-2xl w-[94%] sm:w-auto bg-card/95 backdrop-blur-xl border border-primary/40 shadow-2xl rounded-2xl p-2 px-3.5 flex items-center justify-between gap-3 text-xs animate-in slide-in-from-bottom-3 duration-300"
    >
      <div className="flex items-center gap-2">
        <div className="size-6 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-[10px]">
          <Shield className="size-3.5" />
        </div>
        <div className="hidden sm:block">
          <div className="flex items-center gap-1.5 font-bold text-foreground">
            <span>{activeNiche.emoji}</span>
            <span>{activeNiche.label}</span>
          </div>
          <p className="text-[10px] text-muted-foreground">Admin Master Ativo</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          asChild
          size="sm"
          variant="outline"
          className="h-8 px-2.5 rounded-xl text-[11px] font-bold gap-1 cursor-pointer bg-background hover:bg-muted/70"
        >
          <Link to="/admin-master/banners">
            <ImageIcon className="size-3 text-primary" />
            <span>Editar Banners</span>
          </Link>
        </Button>

        <Button
          asChild
          size="sm"
          variant="outline"
          className="h-8 px-2.5 rounded-xl text-[11px] font-bold gap-1 cursor-pointer bg-background hover:bg-muted/70"
        >
          <Link to="/admin-master/botoes">
            <Sparkles className="size-3 text-amber-500" />
            <span>Editar Botões</span>
          </Link>
        </Button>

        <Button
          asChild
          size="sm"
          className="h-8 px-3 rounded-xl text-[11px] font-bold bg-primary text-primary-foreground gap-1 cursor-pointer"
        >
          <Link to="/admin-master">
            <span>Painel Master</span>
          </Link>
        </Button>
      </div>
    </aside>
  );
}
