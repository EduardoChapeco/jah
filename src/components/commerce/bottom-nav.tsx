/**
 * BottomNav — Alias Canônico apontando para o dock móvel unificado
 * Design System Waesy — Apple HIG, alvos de 44px, botão [+] contextual e atalhos horizontais
 */

import { MobileNav } from "@/components/shell/mobile-nav";

export function BottomNav(props: any) {
  return <MobileNav {...props} />;
}

export const MobileBottomNav = BottomNav;
