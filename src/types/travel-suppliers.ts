export type SupplierKind =
  | 'operator'
  | 'airline'
  | 'hotel'
  | 'car_rental'
  | 'insurance'
  | 'transfer'
  | 'visa'
  | 'other';

export interface TravelSupplierDTO {
  id: string;
  store_id: string;
  name: string;
  legal_name?: string | null;
  kind: SupplierKind;
  document?: string | null;
  commission_rate: number;
  notes?: string | null;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  country: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export const SUPPLIER_KIND_LABELS: Record<SupplierKind, string> = {
  operator: 'Operadora / DMC',
  airline: 'Companhia Aérea',
  hotel: 'Rede Hoteleira / Resort',
  car_rental: 'Locadora de Veículos',
  insurance: 'Seguradora de Viagem',
  transfer: 'Receptivo / Transfer',
  visa: 'Assessoria Consular',
  other: 'Outro Fornecedor',
};
