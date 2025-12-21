// =====================================================
// TYPES: RECALLS ESTRUTURADOS
// Módulo: Recalls e Retenção (P0)
// Impacto: +R$ 22.500/mês
// =====================================================

export type RecallType =
    | 'PROPHYLAXIS'           // Limpeza/Profilaxia
    | 'PERIO'                 // Periodontal
    | 'BOTOX_RENEWAL'         // Renovação de Botox
    | 'FILLER_RENEWAL'        // Renovação de Preenchimento
    | 'ORTHO_CHECK'           // Manutenção Ortodôntica
    | 'IMPLANT_MAINTENANCE'   // Manutenção de Implante
    | 'CROWN_CHECK'           // Revisão de Coroa/Prótese
    | 'GENERAL_CHECKUP'       // Check-up Geral
    | 'TREATMENT_CONTINUATION'// Continuação de Tratamento
    | 'REACTIVATION';         // Reativação (6+ meses sem visita)

export type RecallStatus =
    | 'PENDING'      // Aguardando contato
    | 'CONTACTED'    // Paciente foi contatado
    | 'SCHEDULED'    // Paciente agendou
    | 'OVERDUE'      // Vencido sem contato
    | 'LOST'         // Paciente perdido (não responde)
    | 'COMPLETED';   // Recall concluído (paciente retornou)

export type ContactMethod =
    | 'WHATSAPP'
    | 'SMS'
    | 'EMAIL'
    | 'PHONE'
    | 'IN_PERSON';

export type RecallCategory =
    | 'HOF'
    | 'ORTODONTIA'
    | 'IMPLANTODONTIA'
    | 'REATIVAÇÃO'
    | 'GERAL';

export interface PatientRecall {
    id: string;
    clinic_id: string;
    patient_id: string;

    // Tipo de Recall
    recall_type: RecallType;

    // Datas
    due_date: string;
    created_date: string;

    // Status
    status: RecallStatus;

    // Vinculação
    linked_appointment_id?: string;
    original_treatment_id?: string;

    // Histórico de Contato
    last_contact_date?: string;
    contact_attempts: number;
    contact_method?: ContactMethod;
    contact_notes?: string;

    // Prioridade (0-100)
    priority: number;

    // Notas
    notes?: string;

    // Auditoria
    created_by?: string;
    created_at: string;
    updated_at: string;
}

// View para Radar de Oportunidades (Camada Prata)
export interface RecallOpportunity {
    recall_id: string;
    clinic_id: string;
    patient_id: string;
    patient_name: string;
    patient_phone: string;
    patient_email?: string;
    patient_ranking?: string;
    patient_ltv: number;
    recall_type: RecallType;
    due_date: string;
    status: RecallStatus;
    priority: number;
    contact_attempts: number;
    last_contact_date?: string;
    days_overdue: number;
    category: RecallCategory;
    suggested_message: string;
}

// DTOs
export interface CreateRecallDTO {
    clinic_id: string;
    patient_id: string;
    recall_type: RecallType;
    due_date: string;
    original_treatment_id?: string;
    notes?: string;
}

export interface UpdateRecallDTO {
    status?: RecallStatus;
    linked_appointment_id?: string;
    contact_method?: ContactMethod;
    contact_notes?: string;
    notes?: string;
}

export interface RecordContactDTO {
    recall_id: string;
    contact_method: ContactMethod;
    contact_notes?: string;
}

// Estatísticas
export interface RecallStats {
    total_recalls: number;
    pending_recalls: number;
    contacted_recalls: number;
    scheduled_recalls: number;
    overdue_recalls: number;
    lost_recalls: number;
    completed_recalls: number;
    average_priority: number;
    total_potential_revenue: number; // Baseado em LTV dos pacientes
    contact_success_rate: number; // Percentual
}

// Estatísticas por Tipo
export interface RecallStatsByType {
    recall_type: RecallType;
    count: number;
    pending_count: number;
    completed_count: number;
    average_days_to_complete: number;
    success_rate: number;
}

// Filtros
export interface RecallFilters {
    clinic_id: string;
    status?: RecallStatus[];
    recall_type?: RecallType[];
    category?: RecallCategory[];
    priority_min?: number;
    priority_max?: number;
    due_date_from?: string;
    due_date_to?: string;
    is_overdue?: boolean;
    patient_id?: string;
}

// Sugestões de Mensagens por Tipo
export const RECALL_MESSAGES: Record<RecallType, string> = {
    BOTOX_RENEWAL: 'Está na hora de renovar seu Botox! Agende já e mantenha os resultados. 💉✨',
    FILLER_RENEWAL: 'Seu preenchimento precisa de manutenção. Vamos agendar? 💆‍♀️',
    ORTHO_CHECK: 'Hora da manutenção ortodôntica! Não deixe seu tratamento atrasar. 🦷',
    IMPLANT_MAINTENANCE: 'Manutenção do implante é essencial. Vamos agendar? 🦷',
    CROWN_CHECK: 'Revisão da sua coroa/prótese. Vamos garantir que está tudo perfeito! 👑',
    PROPHYLAXIS: 'Hora da limpeza! Mantenha seu sorriso saudável. 😁',
    PERIO: 'Manutenção periodontal é importante. Vamos cuidar da saúde das suas gengivas! 🦷',
    GENERAL_CHECKUP: 'Está na hora do seu check-up! Vamos agendar? 📅',
    TREATMENT_CONTINUATION: 'Vamos continuar seu tratamento? Estamos te esperando! 💙',
    REACTIVATION: 'Sentimos sua falta! Que tal retomar seu tratamento? 🤗'
};

// Prioridades por Tipo (base score)
export const RECALL_PRIORITY_BASE: Record<RecallType, number> = {
    BOTOX_RENEWAL: 80,
    FILLER_RENEWAL: 75,
    TREATMENT_CONTINUATION: 75,
    IMPLANT_MAINTENANCE: 70,
    ORTHO_CHECK: 65,
    CROWN_CHECK: 60,
    PERIO: 55,
    PROPHYLAXIS: 50,
    GENERAL_CHECKUP: 50,
    REACTIVATION: 40
};
