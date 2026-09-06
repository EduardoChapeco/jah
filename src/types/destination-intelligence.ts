export type DestinationTrend = 'rising' | 'stable' | 'falling';
export type SafetyLevel = 'safe' | 'moderate' | 'caution' | 'warning';
export type AlertSeverity = 'info' | 'warning' | 'critical';
export type AlertCategory = 'health' | 'security' | 'weather' | 'operational' | 'visa' | 'currency';

export interface DestinationIntelligence {
 id: string;
 store_id: string;
 destination: string;
 country_code: string;
 continent: string;
 demand_score: number; // 0-100
 trend: DestinationTrend;
 best_months?: string[];
 peak_season?: string | null;
 avg_temp_celsius?: number | null;
 avg_package_brl?: number | null;
 avg_daily_rate_brl?: number | null;
 min_budget_brl?: number | null;
 is_featured: boolean;
 is_visa_required: boolean;
 safety_level: SafetyLevel;
 currency_code?: string | null;
 exchange_rate_brl?: number | null;
 image_url?: string | null;
 tags: string[];
 highlights: string[];
 created_at?: string;
 updated_at?: string;
}

export interface TravelAlert {
 id: string;
 store_id: string;
 destination: string;
 severity: AlertSeverity;
 category: AlertCategory;
 title: string;
 description: string;
 source_url?: string | null;
 is_active: boolean;
 expires_at?: string | null;
 created_at?: string;
 updated_at?: string;
}

export interface DestinationReview {
 id: string;
 store_id: string;
 destination: string;
 reviewer_name: string;
 reviewer_email?: string | null;
 trip_id?: string | null;
 rating: 1 | 2 | 3 | 4 | 5;
 comment?: string | null;
 aspects?: Record<string, number>;
 is_featured: boolean;
 created_at?: string;
}
