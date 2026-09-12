/**
 * brand.config.ts — Fonte Canônica Única de Identidade & Marca da Plataforma
 *
 * Qualquer componente, rota, serviço, metatag ou e-mail consome
 * esta configuração para garantir propagação 100% unificada.
 */

export interface PlatformBrandConfig {
 name: string;
 legalName: string;
 tagline: string;
 description: string;
 communityName: string;
 domain: string;
 supportEmail: string;
 appSlug: string;
 defaultTitle: string;
}

export const BRAND_CONFIG: PlatformBrandConfig = {
 name: "Waesy",
 legalName: "Waesy Plataforma & Tecnologia Ltda",
 tagline: "Super App Comunitário & Negócios Locais",
 description: "Explore comércio local, gastronomia, serviços, notícias, turismo, classificados e vagas na comunidade Waesy.",
 communityName: "Comunidade Waesy",
 domain: "usewaesy.pages.dev",
 supportEmail: "contato@usewaesy.com",
 appSlug: "waesy",
 defaultTitle: "Waesy — Super App Comunitário",
};

export function getBrandName(overrideName?: string | null): string {
 return overrideName?.trim() || BRAND_CONFIG.name;
}

export function formatPageTitle(pageTitle?: string | null, customBrandName?: string | null): string {
 const brand = getBrandName(customBrandName);
 if (!pageTitle || pageTitle.trim() === "") return brand;
 return `${pageTitle} — ${brand}`;
}
