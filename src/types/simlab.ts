// ============================================================================
// CONTRATOS DE TIPAGEM: SIMLAB V2, POPULAÇÕES SINTÉTICAS & PROTOCOLO CIENTÍFICO
// ============================================================================

export type SocialClass = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'D_E';
export type RegionBrazil = 'Sudeste' | 'Sul' | 'Nordeste' | 'Centro-Oeste' | 'Norte';
export type LocationType = 'capital_metropole' | 'interior_polo' | 'rural';
export type ExperimentStatus = 'queued' | 'simulating' | 'synthesizing' | 'completed' | 'failed';
export type VerdictStatus = 'aprovado_para_veiculacao' | 'revisar_com_ajustes' | 'bloqueado_por_alto_risco';
export type System1Emotion = 'desejo' | 'desconfianca' | 'tedio' | 'entusiasmo' | 'inseguranca';
export type PricePerception = 'muito_barato_duvidoso' | 'justo' | 'caro_mas_vale' | 'inacessivel';

export interface SyntheticArchetype {
 id: string;
 code: string;
 display_name: string;
 gender: 'feminino' | 'masculino' | 'nao_binario';
 age: number;
 age_range_label: string;
 abep_social_class: SocialClass;
 region: RegionBrazil;
 location_type: LocationType;
 median_income_brl: number;
 education_level: string;
 cynicism_index: number;
 price_sensitivity: number;
 impulsivity_index: number;
 primary_social_networks: string[];
 decision_heuristics: Record<string, any>;
 avatar_url?: string | null;
 bio?: string | null;
 is_active: boolean;
 created_at?: string;
}

export interface SyntheticMemory {
 id: string;
 archetype_id: string;
 memory_category: string;
 narrative: string;
 emotional_valence: number;
 impact_on_buying_decision: string;
 created_at?: string;
}

export interface SimLabExperiment {
 id: string;
 store_id: string;
 title: string;
 objective: string;
 stimulus_payload: {
 product_name?: string;
 description?: string;
 offer_headline?: string;
 test_price_brl?: number;
 original_price_brl?: number;
 installment_options?: string;
 guarantee_days?: number;
 primary_sin_trigger?: string;
 image_url?: string;
 };
 target_audience_filters: {
 social_classes?: SocialClass[];
 regions?: RegionBrazil[];
 age_min?: number;
 age_max?: number;
 };
 sample_size: number;
 status: ExperimentStatus;
 confidence_level: number;
 margin_of_error: number;
 created_by?: string | null;
 created_at: string;
 completed_at?: string | null;
}

export interface SimLabPersonaResponse {
 id: string;
 experiment_id: string;
 archetype_id: string;
 archetype?: SyntheticArchetype;
 interest_score: number; // 0 a 10
 purchase_intent_percent: number; // 0 a 100%
 primary_hook_detected?: string | null;
 primary_barrier_objection: string;
 verbatim_reaction: string;
 system_1_emotion: System1Emotion;
 price_perception: PricePerception;
 simulated_at: string;
}

export interface ScientificReviewerVerdict {
 reviewer_name: string;
 role: string;
 credibility_score: number; // 0 a 100
 critique: string;
 detected_biases: string[];
 status: 'passed' | 'warning' | 'rejected';
}

export interface SimLabStatisticalSynthesis {
 id: string;
 experiment_id: string;
 synthetic_nps: number; // -100 a +100
 overall_approval_rate: number; // %
 rejection_rate: number; // %
 estimated_conversion_range: [number, number]; // [min%, max%]
 price_elasticity_score: number;
 top_3_buying_triggers: string[];
 top_3_friction_barriers: string[];
 scientific_verdict: VerdictStatus;
 reviewer_reports: ScientificReviewerVerdict[];
 recommended_actions: Array<{
 title: string;
 description: string;
 priority: 'alta' | 'media' | 'baixa';
 }>;
 synthesized_at: string;
}

export interface FocusGroupSession {
 id: string;
 store_id: string;
 session_title: string;
 selected_persona_ids: string[];
 moderator_goal?: string | null;
 status: 'active' | 'closed';
 created_at: string;
}

export interface FocusGroupMessage {
 id: string;
 session_id: string;
 sender_type: 'moderator_user' | 'synthetic_persona' | 'squad_scientist';
 sender_id: string;
 sender_name: string;
 sender_avatar_url?: string | null;
 content: string;
 sentiment_score?: number | null;
 created_at: string;
}
