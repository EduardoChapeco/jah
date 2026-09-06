export type PassType = 'boarding_pass' | 'ticket' | 'insurance' | 'voucher';
export type PassStatus = 'active' | 'used' | 'expired';

export interface ClientWalletPass {
 id: string;
 store_id: string;
 client_id?: string | null;
 trip_id?: string | null;
 pass_type: PassType;
 title: string;
 subtitle?: string | null;
 barcode_value: string;
 qr_code_url?: string | null;
 color?: string | null;
 status: PassStatus;
 expires_at?: string | null;
 metadata?: Record<string, any>;
 created_at?: string;
 updated_at?: string;
}

export interface TripMemory {
 id: string;
 store_id: string;
 trip_id: string;
 uploader_name: string;
 media_url: string;
 media_type: 'image' | 'video';
 caption?: string | null;
 location_name?: string | null;
 taken_at: string;
 is_featured: boolean;
 created_at?: string;
 updated_at?: string;
}
