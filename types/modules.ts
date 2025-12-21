// =====================================================
// TYPES: ANAMNESE, IMAGENS, CONTRATOS, PRESCRIÇÕES
// Módulos P1 e P2
// =====================================================

// =====================================================
// ANAMNESE DIGITAL (P1)
// =====================================================

export type AlcoholConsumption =
    | 'NONE'
    | 'OCCASIONAL'
    | 'MODERATE'
    | 'HEAVY';

export interface PatientAnamnesis {
    id: string;
    patient_id: string;
    clinic_id: string;

    // Dados Médicos Críticos
    has_allergies: boolean;
    allergies_list?: string[];

    has_chronic_diseases: boolean;
    chronic_diseases?: string[];

    current_medications?: string[];

    // Histórico Cirúrgico
    previous_surgeries?: string[];
    last_surgery_date?: string;

    // Contraindicações
    is_pregnant: boolean;
    is_breastfeeding: boolean;
    has_pacemaker: boolean;
    has_bleeding_disorder: boolean;
    has_diabetes: boolean;
    has_hypertension: boolean;

    // Hábitos
    is_smoker: boolean;
    alcohol_consumption?: AlcoholConsumption;

    // Odontológico
    last_dental_visit?: string;
    brushing_frequency: number;
    uses_floss: boolean;
    has_dental_sensitivity: boolean;

    // Estético
    previous_aesthetic_procedures?: string[];
    aesthetic_goals?: string;

    // Assinatura e Validação
    filled_by?: string;
    filled_at: string;
    patient_signature_url?: string;
    patient_signature_date?: string;

    updated_at: string;
}

export type AlertType =
    | 'ALLERGY'
    | 'CONDITION'
    | 'MEDICATION'
    | 'RISK'
    | 'CONTRAINDICATION';

export type AlertSeverity =
    | 'LOW'
    | 'MEDIUM'
    | 'HIGH'
    | 'CRITICAL';

export interface MedicalAlert {
    id: string;
    patient_id: string;
    alert_type: AlertType;
    description: string;
    severity: AlertSeverity;
    is_critical: boolean;
    is_active: boolean;
    created_by?: string;
    created_at: string;
    updated_at: string;
}

// =====================================================
// IMAGENS CLÍNICAS (P1)
// =====================================================

export type ClinicalImageType =
    | 'XRAY_PERIAPICAL'
    | 'XRAY_PANORAMIC'
    | 'XRAY_BITEWING'
    | 'CBCT'
    | 'INTRAORAL_PHOTO'
    | 'EXTRAORAL_PHOTO'
    | 'SMILE_PHOTO'
    | 'SCAN_3D'
    | 'OTHER';

export interface ClinicalImage {
    id: string;
    patient_id: string;
    clinic_id: string;

    image_type: ClinicalImageType;

    file_url: string;
    thumbnail_url?: string;
    file_size_kb?: number;

    tooth_number?: number;
    region?: string;

    capture_date: string;
    notes?: string;
    tags?: string[];

    // Vinculação com tratamento
    treatment_item_id?: string;
    budget_id?: string;
    is_before_treatment: boolean;

    // Visibilidade
    is_public: boolean;
    patient_consent_signed: boolean;

    uploaded_by?: string;
    created_at: string;
}

// =====================================================
// CONTRATOS RECORRENTES (P1)
// =====================================================

export type ContractType =
    | 'BOTOX_CLUB'
    | 'FILLER_CLUB'
    | 'ORTHO_MAINTENANCE'
    | 'PREVENTION_PLAN'
    | 'AESTHETIC_PLAN'
    | 'OTHER';

export type ContractStatus =
    | 'ACTIVE'
    | 'SUSPENDED'
    | 'CANCELLED'
    | 'FINISHED';

export interface RecurringContract {
    id: string;
    clinic_id: string;
    patient_id: string;
    budget_id?: string;

    contract_type: ContractType;
    contract_name: string;
    description?: string;

    start_date: string;
    end_date?: string;

    billing_day: number; // 1-31
    monthly_value: number;

    status: ContractStatus;

    // Cobrança Automática
    auto_charge: boolean;
    payment_method_id?: string;

    // Histórico
    total_charged: number;
    total_paid: number;
    months_active: number;

    // Notas
    cancellation_reason?: string;
    cancellation_date?: string;
    notes?: string;

    created_by?: string;
    created_at: string;
    updated_at: string;
}

// View de MRR
export interface MRRDashboard {
    clinic_id: string;
    active_contracts: number;
    total_mrr: number;
    average_contract_value: number;
    botox_club_mrr: number;
    filler_club_mrr: number;
    ortho_mrr: number;
}

// =====================================================
// PRESCRIÇÕES ELETRÔNICAS (P2)
// =====================================================

export type MedicationForm =
    | 'TABLET'
    | 'CAPSULE'
    | 'SYRUP'
    | 'OINTMENT'
    | 'INJECTION'
    | 'DROPS'
    | 'OTHER';

export type PrescriptionType =
    | 'MEDICATION'
    | 'EXAM'
    | 'PROCEDURE';

export type PrescriptionStatus =
    | 'ACTIVE'
    | 'COMPLETED'
    | 'CANCELLED';

export type CertificateType =
    | 'ABSENCE'
    | 'COMPANION'
    | 'FITNESS'
    | 'PROCEDURE'
    | 'OTHER';

export interface MedicationLibrary {
    id: string;
    clinic_id?: string;

    name: string;
    active_ingredient?: string;
    dosage?: string;
    form?: MedicationForm;

    is_controlled: boolean;
    requires_special_prescription: boolean;

    common_usage?: string;
    common_dosage_instructions?: string;

    is_active: boolean;
    created_at: string;
}

export interface Prescription {
    id: string;
    patient_id: string;
    clinic_id: string;
    professional_id: string;

    prescription_type: PrescriptionType;

    diagnosis?: string;
    notes?: string;

    status: PrescriptionStatus;

    digital_signature_url?: string;
    signed_at?: string;

    created_at: string;
}

export interface PrescriptionItem {
    id: string;
    prescription_id: string;
    medication_id?: string;

    medication_name: string;
    dosage: string;
    frequency: string;
    duration: string;
    quantity?: string;
    instructions?: string;
}

export interface MedicalCertificate {
    id: string;
    patient_id: string;
    clinic_id: string;
    professional_id: string;

    certificate_type?: CertificateType;

    days_off?: number;
    start_date: string;
    end_date: string;

    reason?: string;
    cid_code?: string;

    content: string;

    digital_signature_url?: string;
    signed_at?: string;

    created_at: string;
}

// =====================================================
// ODONTOGRAMA (P1)
// =====================================================

export type ToothStatus =
    | 'SOUND'        // Hígido
    | 'DECAYED'      // Cariado
    | 'FILLED'       // Restaurado
    | 'MISSING'      // Ausente
    | 'IMPLANT'      // Implante
    | 'CROWN'        // Coroa
    | 'VENEER'       // Faceta/Lente
    | 'ENDODONTIC'   // Tratamento de canal
    | 'FRACTURED'    // Fraturado
    | 'EXTRACTED';   // Extraído

export interface DentalCharting {
    id: string;
    patient_id: string;
    tooth_number: number; // 11-85 (ISO)

    status_code?: ToothStatus;
    surfaces?: Record<string, boolean>; // {m: true, o: true, d: false}
    existing_material?: string;

    condition_notes?: string;
    last_update: string;
    updated_by?: string;
}

// =====================================================
// PRODUTIVIDADE PROFISSIONAL (P2)
// =====================================================

export interface ProfessionalMonthlyMetrics {
    id: string;
    professional_id: string;
    clinic_id: string;

    period_month: string;

    // Métricas de Produção
    procedures_completed: number;
    total_production_value: number;

    // Métricas de Conversão
    evaluations_performed: number;
    budgets_created: number;
    budgets_approved: number;
    conversion_rate: number;

    // Métricas de Tempo
    total_hours_worked: number;
    average_procedure_duration: number;

    // Métricas de Satisfação
    nps_score?: number;
    complaints_count: number;
    compliments_count: number;

    // Métricas Financeiras
    commission_earned: number;
    average_ticket: number;

    // Ranking
    clinic_rank?: number;

    created_at: string;
    updated_at: string;
}

export interface ProfessionalRanking {
    professional_id: string;
    name: string;
    period_month: string;
    total_production_value: number;
    conversion_rate: number;
    nps_score?: number;
    rank_by_production: number;
    rank_by_conversion: number;
}

// =====================================================
// KPIs HISTÓRICOS (P2)
// =====================================================

export interface ClinicKPIs {
    id: string;
    clinic_id: string;

    period_start: string;
    period_end: string;

    // Métricas Financeiras
    total_revenue: number;
    total_expenses: number;
    net_profit: number;

    // Métricas de Pacientes
    new_patients_count: number;
    returning_patients_count: number;
    lost_patients_count: number;

    // Métricas de Conversão
    budgets_created_count: number;
    budgets_approved_count: number;
    conversion_rate: number;

    // Métricas de Produtividade
    appointments_scheduled: number;
    appointments_completed: number;
    no_show_rate: number;

    // Ticket Médio
    average_budget_value: number;
    average_treatment_value: number;

    created_at: string;
}
