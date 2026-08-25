/**
 * Money helpers Commerce.
 * RULE (AGENTS.md): money is always integer cents + currency BRL, never float.
 * This module only FORMATS server-provided values. It performs no commercial
 * calculation (price/discount/shipping/tax) — that happens server-side only.
 */

export type CurrencyCode = "BRL";

export interface Money {
  /** Integer amount in the currency's minor unit (centavos for BRL). */
  amountCents: number;
  currency: CurrencyCode;
}

const FORMATTERS: Record<CurrencyCode, Intl.NumberFormat> = {
  BRL: new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }),
};

/** Format integer cents as a localized currency string (e.g. "R$ 199,90"). */
export function formatMoney(amountCents: number | null | undefined, currency: CurrencyCode = "BRL"): string {
  const cents = typeof amountCents === "number" && !isNaN(amountCents) ? Math.round(amountCents) : 0;
  return FORMATTERS[currency].format(cents / 100);
}

export function formatMoneyObject(money: Money): string {
  return formatMoney(money.amountCents, money.currency);
}

export function parseMoney(formatted: string, currency: CurrencyCode = "BRL"): number {
  const numericString = formatted.replace(/[^0-9-]/g, "");
  return numericString ? parseInt(numericString, 10) : 0;
}

/** Formata centavos em string decimal pt-BR (ex: 80000 -> "800,00", 1250 -> "12,50"). */
export function formatCentsToBRL(cents: number | null | undefined): string {
  if (cents === null || cents === undefined || isNaN(cents)) return "";
  return (cents / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Converte qualquer string digitada ou formatada para centavos inteiros (ex: "800,00" -> 80000, "8,00" -> 800). */
export function parseBRLToCents(val: string | null | undefined): number {
  if (!val) return 0;
  const digits = val.replace(/\D/g, "");
  return digits ? parseInt(digits, 10) : 0;
}

/** Aplica máscara progressiva de centavos enquanto o usuário digita (ex: "800" -> "8,00", "80000" -> "800,00"). */
export function maskCurrencyBRL(val: string | number | null | undefined): string {
  if (val === null || val === undefined || val === "") return "";
  const digits = typeof val === "number" ? Math.round(val).toString() : val.replace(/\D/g, "");
  if (!digits) return "";
  const cents = parseInt(digits, 10);
  if (isNaN(cents) || cents === 0) return "0,00";
  return formatCentsToBRL(cents);
}
