// =====================================================
// TYPES: CONFIRMAÇÕES DE CONSULTAS
// Módulo: Confirmação Automática de Consultas (P0)
// Impacto: +R$ 7.500/mês
// =====================================================

export type ConfirmationStatus =
    | 'PENDING'
    | 'CONFIRMED'
    | 'CANCELLED'
    | 'RESCHEDULED'
    | 'NO_RESPONSE';

export type ReminderChannel =
    | 'WHATSAPP'
    | 'SMS'
    | 'EMAIL'
    | 'PHONE';

export type ConfirmationMethod =
    | 'WHATSAPP'
    | 'SMS'
    | 'EMAIL'
    | 'PHONE'
    | 'IN_PERSON';

export interface AppointmentConfirmation {
    id: string;
    appointment_id: string;
    clinic_id: string;

    // Rastreamento de Lembretes
    reminder_sent_at?: string;
    reminder_channel?: ReminderChannel;
    reminder_message?: string;

    // Status de Confirmação
    confirmation_status: ConfirmationStatus;
    confirmed_at?: string;
    confirmed_by?: string; // 'PATIENT' ou 'RECEPTIONIST'
    confirmation_method?: ConfirmationMethod;

    // Reagendamento
    rescheduled_to?: string;
    cancellation_reason?: string;
    cancellation_notes?: string;

    // Automação
    auto_reminder_24h_sent: boolean;
    auto_reminder_24h_sent_at?: string;
    auto_reminder_2h_sent: boolean;
    auto_reminder_2h_sent_at?: string;

    // Auditoria
    created_at: string;
    updated_at: string;
}

// View de Confirmações Pendentes
export interface PendingConfirmation {
    confirmation_id: string;
    appointment_id: string;
    confirmation_status: ConfirmationStatus;
    reminder_sent_at?: string;
    auto_reminder_24h_sent: boolean;
    auto_reminder_2h_sent: boolean;
    appointment_date: string;
    duration: number;
    appointment_type: string;
    patient_id: string;
    patient_name: string;
    patient_phone: string;
    patient_email?: string;
    professional_name: string;
    clinic_name: string;
    hours_until_appointment: number;
}

// DTOs para criação e atualização
export interface CreateConfirmationDTO {
    appointment_id: string;
    clinic_id: string;
}

export interface UpdateConfirmationDTO {
    confirmation_status?: ConfirmationStatus;
    confirmed_by?: string;
    confirmation_method?: ConfirmationMethod;
    cancellation_reason?: string;
    cancellation_notes?: string;
    rescheduled_to?: string;
}

export interface SendReminderDTO {
    appointment_id: string;
    channel: ReminderChannel;
    message?: string;
}

// Estatísticas de Confirmação
export interface ConfirmationStats {
    total_appointments: number;
    pending_confirmations: number;
    confirmed_count: number;
    cancelled_count: number;
    no_response_count: number;
    confirmation_rate: number; // Percentual
    no_show_rate: number; // Percentual
}
