/**
 * system-flags.ts — Flags de Governança & Transição de Módulos (Waesy)
 * Permite chavear comportamentos globais de engenharia (como o modo padrão de onboarding de empresas).
 */

export const SYSTEM_FLAGS = {
  /**
   * Determina o modo padrão da rota /criar-negocio.
   * - false: Modo Expresso (1 minuto) como padrão inicial temporário para acelerar o ingresso de empresas no Guia & Classificados.
   * - true: Modo Avançado Pro (6 etapas completas com CNPJ, horários, delivery e equipe) como padrão quando o marketplace avançado for reativado.
   */
  ADVANCED_ONBOARDING_DEFAULT: false,

  /**
   * Indicador visual de versão beta da plataforma no header.
   */
  SHOW_BETA_BADGE: true,
};
