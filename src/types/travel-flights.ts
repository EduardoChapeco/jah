export type FlightCabin = 'economy' | 'premium_economy' | 'business' | 'first';
export type FlightItineraryType = 'original' | 'operator_suggestion' | 'customer_selected' | 'confirmed';
export type FlightItineraryStatus = 'draft' | 'active' | 'archived';

export interface TravelFlightSegment {
 id: string;
 store_id: string;
 itinerary_id: string;
 segment_order: number;
 airline_code: string;
 airline_name?: string | null;
 flight_number: string;
 origin_iata: string;
 origin_city?: string | null;
 destination_iata: string;
 destination_city?: string | null;
 departure_at: string;
 arrival_at: string;
 duration_minutes?: number | null;
 cabin: FlightCabin;
 baggage?: string | null;
 record_locator?: string | null; // PNR
 ticket_number?: string | null;
 airport_terminal?: string | null;
 aircraft_model?: string | null;
 status: string;
 created_at?: string;
 updated_at?: string;
}

export interface TravelFlightItinerary {
 id: string;
 store_id: string;
 trip_id?: string | null;
 title: string;
 version: number;
 itinerary_type: FlightItineraryType;
 status: FlightItineraryStatus;
 total_duration_minutes?: number | null;
 notes?: string | null;
 segments?: TravelFlightSegment[];
 created_at?: string;
 updated_at?: string;
}
