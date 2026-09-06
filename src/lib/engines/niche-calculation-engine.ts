/**
 * JAH Niche Calculation Engine
 * Motor Financeiro e Paramétrico Especializado por Nicho.
 */

export interface SplitBillInput {
 subtotalCents: number;
 serviceTaxPercentage?: number; // Ex: 10 para 10%
 couvertCentsPerPerson?: number;
 peopleCount: number;
 discountCents?: number;
}

export interface SplitBillResult {
 subtotalCents: number;
 serviceTaxCents: number;
 couvertTotalCents: number;
 discountCents: number;
 totalCents: number;
 perPersonCents: number;
 roundingDifferenceCents: number;
}

export interface TourismPackageQuoteInput {
 baseCostCents: number;
 agencyMarkupPercentage: number; // Ex: 15%
 nightsCount: number;
 passengersCount: number;
 dailyRatePerNightCents: number;
 extraTaxesCents?: number;
 maxInstallmentsWithoutInterest?: number;
}

export interface TourismPackageQuoteResult {
 accommodationSubtotalCents: number;
 markupAmountCents: number;
 taxesTotalCents: number;
 totalPriceCents: number;
 pricePerPassengerCents: number;
 installmentAmountCents: number;
 installmentsCount: number;
}

export interface EventLotCalculatorInput {
 basePriceCents: number;
 convenienceTaxPercentage?: number; // Ex: 10%
 isHalfPriceEligible?: boolean;
 halfPriceQuotaCents?: number;
 soldTicketsCount: number;
 totalCapacity: number;
}

export interface EventLotCalculatorResult {
 finalTicketPriceCents: number;
 convenienceTaxCents: number;
 totalChargedCents: number;
 lotName: string;
 occupancyRatePct: number;
 isLotSoldOut: boolean;
}

export interface RetailMarginCalculatorInput {
 costPriceCents: number;
 desiredMarginPercentage: number; // Margem sobre venda (ex: 40%)
 icmsPct?: number;
 pisCofinsPct?: number;
 shippingCents?: number;
}

export interface RetailMarginCalculatorResult {
 costPriceCents: number;
 suggestedSalePriceCents: number;
 grossProfitCents: number;
 effectiveMarginPct: number;
 taxTotalCents: number;
}

export class NicheCalculationEngine {
 // ─── 1. GASTRONOMIA: DIVISÃO DE COMANDA E TAXA DE SERVIÇO ───
 public static calculateSplitBill(input: SplitBillInput): SplitBillResult {
 const people = Math.max(1, input.peopleCount);
 const servicePct = input.serviceTaxPercentage !== undefined ? input.serviceTaxPercentage : 10;
 const couvertPerPerson = input.couvertCentsPerPerson || 0;
 const couvertTotalCents = couvertPerPerson * people;
 const discount = Math.min(input.subtotalCents, input.discountCents || 0);

 const netSubtotal = input.subtotalCents - discount;
 const serviceTaxCents = Math.round((netSubtotal * servicePct) / 100);
 const totalCents = netSubtotal + serviceTaxCents + couvertTotalCents;

 const perPersonCents = Math.floor(totalCents / people);
 const roundingDifferenceCents = totalCents - (perPersonCents * people);

 return {
 subtotalCents: input.subtotalCents,
 serviceTaxCents,
 couvertTotalCents,
 discountCents: discount,
 totalCents,
 perPersonCents,
 roundingDifferenceCents
 };
 }

 // ─── 2. TURISMO: COTAÇÃO DE PACOTES, MARKUP E PARCELAMENTO ───
 public static calculateTourismQuote(input: TourismPackageQuoteInput): TourismPackageQuoteResult {
 const passengers = Math.max(1, input.passengersCount);
 const nights = Math.max(1, input.nightsCount);
 const accommodationSubtotalCents = input.dailyRatePerNightCents * nights * passengers;

 const baseSum = input.baseCostCents + accommodationSubtotalCents;
 const markupAmountCents = Math.round((baseSum * input.agencyMarkupPercentage) / 100);
 const taxes = input.extraTaxesCents || 0;

 const totalPriceCents = baseSum + markupAmountCents + taxes;
 const pricePerPassengerCents = Math.round(totalPriceCents / passengers);

 const installmentsCount = Math.max(1, input.maxInstallmentsWithoutInterest || 10);
 const installmentAmountCents = Math.ceil(totalPriceCents / installmentsCount);

 return {
 accommodationSubtotalCents,
 markupAmountCents,
 taxesTotalCents: taxes,
 totalPriceCents,
 pricePerPassengerCents,
 installmentAmountCents,
 installmentsCount
 };
 }

 // ─── 3. EVENTOS: LOTES DINÂMICOS & TAXA DE CONVENIÊNCIA ───
 public static calculateEventLotPrice(input: EventLotCalculatorInput): EventLotCalculatorResult {
 const capacity = Math.max(1, input.totalCapacity);
 const occupancyRatePct = Math.min(100, Math.round((input.soldTicketsCount / capacity) * 100));

 let lotName = 'Lote 1 Promocional';
 let lotMultiplier = 1.0;

 if (occupancyRatePct >= 80) {
 lotName = 'Lote 3 Final';
 lotMultiplier = 1.4;
 } else if (occupancyRatePct >= 40) {
 lotName = 'Lote 2';
 lotMultiplier = 1.2;
 }

 let finalTicketPriceCents = Math.round(input.basePriceCents * lotMultiplier);
 if (input.isHalfPriceEligible) {
 finalTicketPriceCents = Math.round(finalTicketPriceCents / 2);
 }

 const convPct = input.convenienceTaxPercentage || 0;
 const convenienceTaxCents = Math.round((finalTicketPriceCents * convPct) / 100);
 const totalChargedCents = finalTicketPriceCents + convenienceTaxCents;

 return {
 finalTicketPriceCents,
 convenienceTaxCents,
 totalChargedCents,
 lotName,
 occupancyRatePct,
 isLotSoldOut: input.soldTicketsCount >= capacity
 };
 }

 // ─── 4. VAREJO: FORMAÇÃO DE PREÇO E MARGEM BRUTA ───
 public static calculateRetailPrice(input: RetailMarginCalculatorInput): RetailMarginCalculatorResult {
 const marginRatio = input.desiredMarginPercentage / 100;
 const taxRate = ((input.icmsPct || 0) + (input.pisCofinsPct || 0)) / 100;

 // Fórmula: Preço = (Custo + Frete) / (1 - Margem - Impostos)
 const baseCost = input.costPriceCents + (input.shippingCents || 0);
 const denominator = Math.max(0.1, 1 - marginRatio - taxRate);

 const suggestedSalePriceCents = Math.round(baseCost / denominator);
 const taxTotalCents = Math.round(suggestedSalePriceCents * taxRate);
 const grossProfitCents = suggestedSalePriceCents - baseCost - taxTotalCents;
 const effectiveMarginPct = Math.round((grossProfitCents / suggestedSalePriceCents) * 1000) / 10;

 return {
 costPriceCents: input.costPriceCents,
 suggestedSalePriceCents,
 grossProfitCents,
 effectiveMarginPct,
 taxTotalCents
 };
 }
}
