export interface TravelIntent {
  destination?: string;
  origin?: string;
  departure_date?: string;
  return_date?: string;
  budget_cents?: number;
  pax_adults?: number;
  pax_children?: number;
  preferences?: Record<string, any>;
  [key: string]: any;
}

export interface NormalizedOffer {
  id?: string;
  provider?: string;
  title?: string;
  description?: string;
  price_cents?: number;
  currency?: string;
  flights?: any[];
  hotels?: any[];
  transfers?: any[];
  tours?: any[];
  insurance?: any;
  normalized_data?: any;
  [key: string]: any;
}
