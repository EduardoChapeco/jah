/**
 * useTheme — Hook canônico de gerenciamento de tema Jah
 *
 * Suporta três modos:
 *  - "system" (padrão): segue prefers-color-scheme do dispositivo
 *  - "light": força tema claro (adiciona classe .light ao <html>)
 *  - "dark": força tema escuro (adiciona classe .dark ao <html>)
 *
 * O tema é persistido em localStorage sob a chave "jah-theme".
 * Não acessa o DOM durante SSR (guard typeof window).
 */

import { useState, useEffect, useCallback } from "react";

export type ThemeMode = "system" | "light" | "dark";

const STORAGE_KEY = "jah-theme";

function applyTheme(mode: ThemeMode) {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  html.classList.remove("light", "dark");
  if (mode === "light") html.classList.add("light");
  if (mode === "dark") html.classList.add("dark");
}

function getInitialTheme(): ThemeMode {
  if (typeof localStorage === "undefined") return "system";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }
  return "system";
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "system";
    return getInitialTheme();
  });

  // Deriva o tema "resolvido" levando em conta preferência do sistema
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    if (theme !== "system") return theme;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    applyTheme(theme);

    // Atualiza resolvedTheme
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const updateResolved = () => {
      if (theme === "system") {
        setResolvedTheme(mediaQuery.matches ? "dark" : "light");
      } else {
        setResolvedTheme(theme);
      }
    };

    updateResolved();
    mediaQuery.addEventListener("change", updateResolved);
    return () => mediaQuery.removeEventListener("change", updateResolved);
  }, [theme]);

  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);
    localStorage.setItem(STORAGE_KEY, newTheme);
  }, []);

  return { theme, resolvedTheme, setTheme };
}

/**
 * Injeção inline de script para evitar flash de tema errado (FOUC).
 * Deve ser inserido no <head> antes de qualquer estilo.
 * Use como: <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
 */
export const themeInitScript = `
(function() {
  try {
    var stored = localStorage.getItem('${STORAGE_KEY}');
    if (stored === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (stored === 'light') {
      document.documentElement.classList.add('light');
    }
    // 'system' ou ausente: deixa o CSS @media resolver (sem classe)
  } catch(e) {}
})();
`.trim();
