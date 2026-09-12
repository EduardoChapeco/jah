/**
 * proposals.ts — Contratos e Tipos Canônicos de Propostas de Viagem (BFF BigTech)
 * Re-exporta Server Functions de travel-proposal.functions.ts com zero dependência de client Supabase.
 */

export type Flight = {
  id: string;
  origin: string;
  destination: string;
  date: string;
  departure_time: string;
  arrival_time: string;
  airline: string;
  flight_number: string;
  stops: number;
  baggage_rules: string;
  price: number;
};

export type HotelRoom = { type: string; qty: number };

export type Hotel = {
  id: string;
  name: string;
  city: string;
  checkin: string;
  checkout: string;
  meal_plan: string;
  rooms: HotelRoom[];
  images: string[];
  price: number;
};

export type Transfer = {
  id: string;
  description: string;
  date: string;
  type: "private" | "shared";
  vehicle: string;
  price: number;
  notes: string;
};

export type Insurance = {
  provider?: string | null;
  policy?: string | null;
  plan?: string | null;
  price?: number | null;
  cost?: number | null;
  coverage?: string | null;
  start_date?: string | null;
  end_date?: string | null;
};

export type Tour = {
  id: string;
  description: string;
  date: string;
  price: number;
};

export type ItineraryDay = {
  day_number: number;
  title: string;
  description: string;
};

export type ProposalOption = {
  id: string;
  name: string;
  description?: string;
  subtotal: number;
  total: number;
  flights: Flight[];
  hotels: Hotel[];
  transfers: Transfer[];
  tours: Tour[];
  itinerary: ItineraryDay[];
  includes: string[];
  excludes: string[];
};

export type Proposal = {
  id: string;
  title: string;
  status: string;
  destination: string;
  start_date: string | null;
  end_date: string | null;
  pax_adults: number;
  pax_children: number;
  pax_infants: number;
  pax_seniors?: number;
  currency: string;
  subtotal: number;
  discount: number;
  total: number;
  valid_until: string | null;
  notes: string | null;
  terms: string | null;
  public_token: string;
  agency_id: string;
  flights: Flight[];
  hotels: Hotel[];
  transfers: Transfer[];
  tours: Tour[];
  itinerary: ItineraryDay[];
  includes: string[];
  excludes: string[];
  pix_discount_percent: number;
  installments_card: number;
  installments_boleto: number;
  template: string;
  cover_image_url?: string | null;
  map_image_url?: string | null;
  agent_name?: string | null;
  agent_photo_url?: string | null;
  agent_whatsapp?: string | null;
  custom_payments?: any[] | null;
  waypoints?: any[] | null;
  extra_pages?: any[] | null;
  canvas_format?: string;
  cover_prompt?: string | null;
  client_id?: string | null;
  lead_id?: string | null;
  is_public_template?: boolean;
  insurance?: Insurance | null;
  client_name?: string;
  client_email?: string;
  agency_name?: string;
  agency_logo_url?: string;
  agency_brand_color?: string;
};

// Re-export canonical Server Functions
export * from "./travel-proposal.functions";
