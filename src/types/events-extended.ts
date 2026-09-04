export type ContractorServiceCategory = 
  | 'seguranca' 
  | 'limpeza' 
  | 'buffet' 
  | 'som_iluminacao' 
  | 'fotografia' 
  | 'cenografia' 
  | 'brigadistas' 
  | 'atendimento' 
  | 'outro';

export type SubpanelType = 
  | 'bar' 
  | 'foodtruck' 
  | 'restaurant' 
  | 'merchandise' 
  | 'ticketing_box' 
  | 'vip_lounge' 
  | 'security_checkpoint' 
  | 'other';

export type EventAssetCategory = 
  | 'equipment' 
  | 'beverage_stock' 
  | 'food_stock' 
  | 'merchandise' 
  | 'furniture' 
  | 'credential_badges' 
  | 'other';

export type EventAssetStatus = 
  | 'planned' 
  | 'dispatched' 
  | 'in_use' 
  | 'returned' 
  | 'damaged' 
  | 'lost';

export interface EventContractor {
  id: string;
  store_id: string;
  name: string;
  service_category: ContractorServiceCategory;
  document_number?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  hourly_rate_cents: number;
  fixed_fee_cents: number;
  pix_key?: string | null;
  bank_info: Record<string, unknown>;
  rating?: number | null;
  status: 'active' | 'inactive' | 'blocked';
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface EventSubpanel {
  id: string;
  store_id: string;
  event_id: string;
  name: string;
  panel_type: SubpanelType;
  manager_name?: string | null;
  manager_contact?: string | null;
  access_token?: string | null;
  token_expires_at?: string | null;
  is_active: boolean;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface EventStaffAllocation {
  id: string;
  store_id: string;
  event_id: string;
  subpanel_id?: string | null;
  employee_id?: string | null;
  contractor_id?: string | null;
  role_title: string;
  shift_name: string;
  start_time?: string | null;
  end_time?: string | null;
  remuneration_cents: number;
  is_confirmed: boolean;
  check_in_at?: string | null;
  check_out_at?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  // Joins
  subpanel?: EventSubpanel | null;
  contractor?: EventContractor | null;
}

export interface EventAssetInventory {
  id: string;
  store_id: string;
  event_id: string;
  subpanel_id?: string | null;
  item_name: string;
  category: EventAssetCategory;
  quantity_planned: number;
  quantity_delivered: number;
  quantity_consumed: number;
  quantity_returned: number;
  unit_cost_cents: number;
  rental_supplier?: string | null;
  status: EventAssetStatus;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  // Joins
  subpanel?: EventSubpanel | null;
}
