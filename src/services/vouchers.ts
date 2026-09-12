/**
 * vouchers.ts — Contratos e Tipos Canônicos de Vouchers Turísticos (BFF BigTech)
 * Re-exporta Server Functions de travel-vouchers.functions.ts com zero dependência de client Supabase.
 */

import type {
  TravelVoucherDTO,
  VoucherFlightData,
  VoucherHotelData,
  VoucherTransferData,
} from "@/types/travel-vouchers";

export type Voucher = TravelVoucherDTO | any;
export type VoucherFlight = VoucherFlightData | any;
export type VoucherAccommodation = VoucherHotelData | any;
export type VoucherTransfer = VoucherTransferData | any;

export * from "./travel-vouchers.functions";
export * from "@/types/travel-vouchers";
