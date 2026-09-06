/**
 * Identidade Canônica de Marca e Configurações Globais (Wider OS)
 * Garante White-Label nativo e elimina qualquer hardcoding de nomes estáticos.
 */

export const DEFAULT_BRAND_NAME = "Wider";
export const DEFAULT_PLATFORM_TITLE = "Wider OS";
export const DEFAULT_WORKSPACE_TITLE = "Workspace Wider OS";
export const DEFAULT_ADMIN_TITLE = "Admin Wider OS";

export const DEFAULT_BRAND_CONFIG = {
  platform_name: DEFAULT_BRAND_NAME,
  support_email: "contato@wider.com.br",
  support_whatsapp: "+5549991716233",
  support_hours: "Segunda a Sexta, das 08h às 18h",
  social_instagram: "@wider.app",
  social_facebook: null,
  social_linkedin: "linkedin.com/company/wider",
} as const;

/**
 * Monta o título da aba do navegador dinamicamente respeitando White-Label.
 * Ex: formatPageTitle("Catálogo & Itens", "Wider OS") => "Catálogo & Itens | Wider OS"
 */
export function formatPageTitle(pageName: string, suffix: string = DEFAULT_PLATFORM_TITLE): string {
  if (!pageName) return suffix;
  return `${pageName} | ${suffix}`;
}

/**
 * Monta o título de página operacional do Workspace.
 */
export function formatWorkspaceTitle(pageName: string, customBrand?: string): string {
  const brand = customBrand || DEFAULT_WORKSPACE_TITLE;
  if (!pageName) return brand;
  return `${pageName} | ${brand}`;
}

/**
 * Monta o título de página administrativa Master.
 */
export function formatAdminTitle(pageName: string, customBrand?: string): string {
  const brand = customBrand || DEFAULT_ADMIN_TITLE;
  if (!pageName) return brand;
  return `${pageName} | ${brand}`;
}
