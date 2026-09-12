/**
 * tokens.ts — Utilitária de Geração de Tokens & Códigos (Criptograficamente Seguros)
 *
 * Substituição definitiva de Math.random() para geração de:
 * - Tokens de acesso público (vouchers, contratos, propostas)
 * - Códigos sequenciais com sufixo único (TRIP-, PROP-, TKT-)
 * - Hashes de identificação (QR codes, tickets)
 * - Nomes únicos de arquivos no Storage
 *
 * Usa `crypto.getRandomValues` (Web Crypto API — disponível em Node 18+ e browsers).
 */

// ─── Alfabeto Base36 restrito (sem caracteres ambíguos: 0, O, I, l) ─────────
const SAFE_CHARS = "123456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const SAFE_CHARS_LOWER = "abcdefghjkmnpqrstuvwxyz23456789";

/**
 * Gera uma string aleatória segura de comprimento `length` usando `crypto.getRandomValues`.
 * @param length - Comprimento da string resultante
 * @param chars - Alfabeto de caracteres (padrão: alfanumérico maiúsculo sem ambiguidade)
 */
function secureRandomString(length: number, chars = SAFE_CHARS): string {
  const randomBytes = new Uint32Array(length);
  crypto.getRandomValues(randomBytes);
  return Array.from(randomBytes, (b) => chars[b % chars.length]).join("");
}

/**
 * Gera um número inteiro aleatório seguro no intervalo [min, max).
 */
function secureRandomInt(min: number, max: number): number {
  const range = max - min;
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return min + (bytes[0] % range);
}

// ─── TOKENS DE ACESSO PÚBLICO ─────────────────────────────────────────────────

/** Token de contrato público. Ex: ct_a2b3c4d5e6f7g8h9 */
export function generateContractToken(): string {
  return `ct_${secureRandomString(16, SAFE_CHARS_LOWER)}`;
}

/** Token de proposta público. Ex: prop_a2b3c4d5 */
export function generateProposalToken(): string {
  return `prop_${secureRandomString(10, SAFE_CHARS_LOWER)}`;
}

/** Token de voucher. Ex: vch_a2b3c4d5e6f7 */
export function generateVoucherToken(): string {
  return `vch_${secureRandomString(12, SAFE_CHARS_LOWER)}`;
}

/** Token de contrato. Ex: ctr_a2b3c4d5e6f7 */
export function generateContractAccessToken(): string {
  return `ctr_${secureRandomString(12, SAFE_CHARS_LOWER)}`;
}

/** Token de entrega. Ex: dlv_a2b3c4d5e6f7 */
export function generateDeliveryToken(): string {
  return `dlv_${secureRandomString(12, SAFE_CHARS_LOWER)}`;
}

/** Token de claim público. Ex: CLM-A2B3C4D */
export function generateClaimToken(): string {
  return `CLM-${secureRandomString(7)}`;
}

/** Token de lead WhatsApp. Ex: WDR-WA2B3C4 */
export function generateWhatsAppLeadCode(): string {
  return `WDR-W${secureRandomString(6)}`;
}

// ─── CÓDIGOS SEQUENCIAIS COM SUFIXO ÚNICO ────────────────────────────────────

/** Código de ticket de suporte. Ex: TKT-A2B3C4D5 */
export function generateTicketCode(): string {
  return `TKT-${secureRandomString(8)}`;
}

/** Código de voucher de viagem. Ex: VCH-A2B3C4-1234 */
export function generateVoucherNumber(): string {
  return `VCH-${secureRandomString(6)}-${Date.now().toString().slice(-4)}`;
}

/** Código de viagem. Ex: TRIP-2026-A2B3 */
export function generateTripNumber(year = new Date().getFullYear()): string {
  return `TRIP-${year}-${secureRandomString(4)}`;
}

/** Código de proposta de viagem. Ex: PROP-2026-A2B3 */
export function generateProposalNumber(year = new Date().getFullYear()): string {
  return `PROP-${year}-${secureRandomString(4)}`;
}

/** Código de tarefa. Ex: TSK-A2B3 */
export function generateTaskCode(): string {
  return `TSK-${secureRandomString(4)}`;
}

/** Código de lote WMS. Ex: WAVE-20260101-A2B */
export function generateWaveBatchCode(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `WAVE-${date}-${secureRandomString(3)}`;
}

/** Código de manifesto WMS. Ex: ROM-20260101-A2B3 */
export function generateManifestCode(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `ROM-${date}-${secureRandomString(4)}`;
}

// ─── HASHES E SERIAIS ─────────────────────────────────────────────────────────

/** Hash de QR code de ingresso. Ex: TKT-A2B3C4 */
export function generateTicketQRHash(): string {
  return `TKT-${secureRandomString(6)}`;
}

/** Serial de certificado. Ex: CERT-A2B3C4-1234 */
export function generateCertificateSerial(): string {
  return `CERT-${secureRandomString(6)}-${Date.now().toString().slice(-4)}`;
}

/** Código de gift card. Ex: GCA2B3C4D5E6F7G8 */
export function generateGiftCardCode(): string {
  return `GC${secureRandomString(14)}`;
}

/** Digest de assinatura de contrato. Ex: SIG-<id>-<ts>-A2B3C4D5 */
export function generateSignatureDigest(envelopeId: string): string {
  return `SIG-${envelopeId}-${Date.now()}-${secureRandomString(8, SAFE_CHARS_LOWER)}`;
}

/** Hash de clique de afiliado. Ex: clk_a2b3c4d5 */
export function generateClickHash(): string {
  return `clk_${secureRandomString(8, SAFE_CHARS_LOWER)}`;
}

// ─── NOMES DE ARQUIVO ÚNICOS (STORAGE) ───────────────────────────────────────

/** Nome único para upload de arquivo. Ex: stores/1730000000000-a2b3c4d.jpg */
export function generateStorageFileName(ext: string, prefix = ""): string {
  const suffix = secureRandomString(9, SAFE_CHARS_LOWER);
  const ts = Date.now();
  return prefix ? `${prefix}/${ts}-${suffix}.${ext}` : `${ts}-${suffix}.${ext}`;
}

// ─── PINs NUMÉRICOS ───────────────────────────────────────────────────────────

/** PIN numérico de 4 dígitos criptograficamente seguro. Ex: 7284 */
export function generatePIN4(): string {
  return secureRandomInt(1000, 9999 + 1).toString().padStart(4, "0");
}

/** Sufixo numérico de 4 dígitos. Ex: 7284 */
export function generateNumericSuffix4(): number {
  return secureRandomInt(1000, 9999 + 1);
}

/** Sufixo numérico de 6 dígitos. Ex: 728491 */
export function generateNumericSuffix6(): number {
  return secureRandomInt(100000, 999999 + 1);
}

// ─── SHUFFLE SEGURO ───────────────────────────────────────────────────────────

/**
 * Embaralha um array in-place usando Fisher-Yates com crypto.getRandomValues.
 * Substitui: array.sort(() => Math.random() - 0.5)
 */
export function shuffleSecure<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const randomBytes = new Uint32Array(1);
    crypto.getRandomValues(randomBytes);
    const j = randomBytes[0] % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ─── HANDLE ÚNICO ─────────────────────────────────────────────────────────────

/** Adiciona sufixo único a um handle. Ex: joao-silva-7284 */
export function generateUniqueHandle(base: string): string {
  return `${base}${secureRandomInt(1000, 9999 + 1)}`;
}
