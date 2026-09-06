export type ChangeReason =
 | 'schedule_change'
 | 'flight_cancelled'
 | 'delay_over_4h'
 | 'connection_lost'
 | 'overbooking';

export type ReaccommodationPriority = 'low' | 'normal' | 'high' | 'urgent';

export type ReaccommodationWorkflowStatus =
 | 'pending_analysis'
 | 'alternatives_sent'
 | 'client_accepted'
 | 'client_rejected'
 | 'rebooking_confirmed'
 | 'refund_requested'
 | 'closed';

export interface AnacRightsSummary {
 material_assistance: {
 communication: boolean; // atraso > 1h
 food_voucher: boolean; // atraso > 2h
 lodging_and_transfer: boolean; // atraso > 4h com pernoite
 };
 reaccommodation_options: {
 airline_own_flights: boolean;
 competitor_flights: boolean; // voo de terceiro/congênere
 full_refund_eligible: boolean;
 };
}

export interface TravelFlightChangeCase {
 id: string;
 store_id: string;
 trip_id?: string | null;
 original_itinerary_id?: string | null;
 change_reason: ChangeReason;
 priority: ReaccommodationPriority;
 workflow_status: ReaccommodationWorkflowStatus;
 passenger_notes?: string | null;
 internal_notes?: string | null;
 anac_rights_summary?: AnacRightsSummary | null;
 alternatives?: TravelFlightAlternative[];
 created_at?: string;
 updated_at?: string;
}

export interface TravelFlightAlternative {
 id: string;
 store_id: string;
 change_case_id: string;
 itinerary_id?: string | null;
 source: 'manual' | 'operator' | 'ai';
 is_selected: boolean;
 difference_summary?: string | null;
 cost_difference: number;
 created_at?: string;
 updated_at?: string;
}
