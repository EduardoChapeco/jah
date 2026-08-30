import type { StyleSpecification } from "maplibre-gl";

/**
 * Estilos de Mapa Canônicos e Confiáveis (Retina 2x, Zero API Key, 100% Uptime)
 * Utiliza CARTO Voyager e CARTO Dark Matter hospedados globalmente com HTTPS,
 * eliminando falhas de renderização (quadro cinza) causadas por endpoints de terceiros.
 */

export const CANONICAL_MAP_STYLE_LIGHT: StyleSpecification = {
  version: 8,
  sources: {
    "carto-voyager": {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
        "https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
        "https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
        "https://d.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
      ],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    },
  },
  layers: [
    {
      id: "carto-voyager-layer",
      type: "raster",
      source: "carto-voyager",
      minzoom: 0,
      maxzoom: 20,
    },
  ],
};

export const CANONICAL_MAP_STYLE_DARK: StyleSpecification = {
  version: 8,
  sources: {
    "carto-dark": {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
        "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
        "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
        "https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
      ],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    },
  },
  layers: [
    {
      id: "carto-dark-layer",
      type: "raster",
      source: "carto-dark",
      minzoom: 0,
      maxzoom: 20,
    },
  ],
};

export function getCanonicalMapStyle(isDark?: boolean): StyleSpecification {
  if (isDark !== undefined) {
    return isDark ? CANONICAL_MAP_STYLE_DARK : CANONICAL_MAP_STYLE_LIGHT;
  }
  if (typeof document !== "undefined") {
    const isDarkMode = document.documentElement.classList.contains("dark");
    return isDarkMode ? CANONICAL_MAP_STYLE_DARK : CANONICAL_MAP_STYLE_LIGHT;
  }
  return CANONICAL_MAP_STYLE_LIGHT;
}

/**
 * Garante que o canvas do MapLibre seja recalculado imediatamente quando o container
 * ganha dimensões no DOM (evita tela cinza em modais, tabs ou carregamentos assíncronos).
 */
export function setupMapResizeObserver(map: any, container: HTMLElement): () => void {
  if (!map || !container) return () => {};

  // Força recálculo imediato e após render inicial
  const t1 = setTimeout(() => map.resize(), 50);
  const t2 = setTimeout(() => map.resize(), 200);
  const t3 = setTimeout(() => map.resize(), 600);

  let resizeObserver: ResizeObserver | null = null;
  if (typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(() => {
      map.resize();
    });
    resizeObserver.observe(container);
  }

  return () => {
    clearTimeout(t1);
    clearTimeout(t2);
    clearTimeout(t3);
    if (resizeObserver) {
      resizeObserver.disconnect();
    }
  };
}
