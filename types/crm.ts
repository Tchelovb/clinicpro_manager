// CRM Types for Hybrid Architecture
// Supports both Leads and Patients in unified Pipeline

export type OpportunityCategory = 'NEW_LEAD' | 'BUDGET' | 'RETENTION' | 'RECOVERY' | 'GENERAL';

export const CATEGORY_LABELS: Record<OpportunityCategory, string> = {
    NEW_LEAD: 'Novos Leads',
    BUDGET: 'Orçamentos',
    RETENTION: 'Retenção',
    RECOVERY: 'Recuperação',
    GENERAL: 'Geral'
};

export interface Opportunity {
    id: string;
    title: string;
    monetary_value: number;
    status: 'OPEN' | 'WON' | 'LOST' | 'ABANDONED';
    pipeline_id: string;
    stage_id: string;

    // Hybrid: can have Lead OR Patient
    lead_id?: string | null;
    patient_id?: string | null;

    // NOVOS CAMPOS (GHL Context-Aware)
    category: OpportunityCategory;
    budget_id?: string | null;

    // Joins from Supabase
    leads?: {
        name: string;
        phone: string;
        source?: string;
        email?: string;
        interest?: string;
    };
    patients?: {
        name: string;
        phone: string;
        profile_photo_url?: string;
        email?: string;
    };

    // Metadata
    probability?: number;
    expected_close_date?: string;
    priority?: 'HIGH' | 'MEDIUM' | 'LOW';
    lost_reason?: string;
    lost_reason_notes?: string;
    owner_id?: string;
    clinic_id?: string;

    created_at: string;
    updated_at: string;
}

export type OpportunityTypeFilter = 'ALL' | 'LEAD' | 'PATIENT';

export interface Pipeline {
    id: string;
    clinic_id: string;
    name: string;
    is_default: boolean;
    active: boolean;
    created_at: string;
}

export interface Stage {
    id: string;
    pipeline_id: string;
    name: string;
    color?: string;
    stage_order: number;
    days_to_stagnation?: number;
    win_probability?: number;
    created_at: string;
}

export interface Lead {
    id: string;
    clinic_id: string;
    name: string;
    phone: string;
    email?: string;
    source: string;
    status?: string;
    interest?: string;
    value?: number;
    desired_treatment?: string;
    lead_temperature?: 'COLD' | 'WARM' | 'HOT';
    priority?: 'HIGH' | 'MEDIUM' | 'LOW';
    pipeline_id?: string;
    stage_id?: string;
    owner_id?: string;
    created_at: string;
    updated_at: string;
    last_interaction?: string;
}
