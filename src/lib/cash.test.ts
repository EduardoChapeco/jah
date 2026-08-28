import { describe, it, expect } from "vitest";
import { parseCurrencyInputToCents, summarizeCashEntries } from "./cash";

describe("Cash Register Calculations", () => {
  it("parses currency inputs with commas and periods to integer cents", () => {
    expect(parseCurrencyInputToCents("100,50")).toBe(10050);
    expect(parseCurrencyInputToCents("100.50")).toBe(10050);
    expect(parseCurrencyInputToCents("50")).toBe(50);
    expect(parseCurrencyInputToCents("0")).toBe(0);
    expect(parseCurrencyInputToCents("")).toBe(0);
  });

  it("accurately summarizes cash entries with mixed methods and sangrias", () => {
    const initialBalance = 15000; // R$ 150,00
    const entries = [
      { amount_cents: 5000, method: "cash" as const }, // +50,00 cash
      { amount_cents: 10000, method: "pix" as const }, // +100,00 pix
      { amount_cents: -3000, method: "cash" as const }, // -30,00 sangria cash
      { amount_cents: 8000, method: "credit" as const }, // +80,00 credit
    ];

    const summary = summarizeCashEntries(initialBalance, entries);

    // Current cash balance in drawer = 15000 + 5000 - 3000 = 17000
    expect(summary.currentBalanceCents).toBe(17000);
    // Method totals
    expect(summary.methodTotals.cash).toBe(17000);
    expect(summary.methodTotals.pix).toBe(10000);
    expect(summary.methodTotals.credit).toBe(8000);
    // Total income and expense
    expect(summary.incomeCents).toBe(23000);
    expect(summary.expenseCents).toBe(3000);
  });
});
