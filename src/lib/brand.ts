/**
 * Identidade Canônica de Marca e Configurações Globais (Waesy)
 * Garante White-Label nativo alimentado diretamente das tabelas do banco de dados.
 */

export const DEFAULT_BRAND_NAME = "Waesy";
export const DEFAULT_PLATFORM_TITLE = "Waesy";
export const DEFAULT_WORKSPACE_TITLE = "Workspace Waesy";
export const DEFAULT_ADMIN_TITLE = "Admin Waesy";

export const DEFAULT_BRAND_CONFIG = {
  platform_name: DEFAULT_BRAND_NAME,
  support_email: "contato@usewaesy.com",
  support_whatsapp: null,
  support_hours: "Segunda a Sexta, das 08h às 18h",
  social_instagram: null,
  social_facebook: null,
  social_linkedin: null,
} as const;

/**
 * Monta o título da aba do navegador dinamicamente respeitando White-Label.
 * Ex: formatPageTitle("Catálogo & Itens", "Waesy") => "Catálogo & Itens | Waesy"
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

