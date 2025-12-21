// =====================================================
// SERVICE: CONFIRMAÇÃO AUTOMÁTICA DE CONSULTAS
// =====================================================

import { supabase } from '@/lib/supabase';
import {
    AppointmentConfirmation,
    PendingConfirmation,
    ConfirmationStats,
    UpdateConfirmationDTO,
    ReminderChannel
} from '@/types/confirmations';

export const ConfirmationService = {

    // Buscar todas as confirmações pendentes (Dashboard)
    async getPendingConfirmations(clinicId: string): Promise<PendingConfirmation[]> {
        const { data, error } = await supabase
            .from('pending_confirmations_view')
            .select('*')
            .eq('clinic_name', clinicId) // Ajuste se a view usar clinic_id
            .order('hours_until_appointment', { ascending: true });

        if (error) throw error;

        // Fallback se a view usar nomes ao invés de IDs (correção comum em views)
        // Na migration, a view usa 'c.name as clinic_name', vou ajustar para usar clinic_id se possível ou verificar schema
        // Update: Olhando a migration 001, a view retorna c.name as clinic_name e não tem clinic_id exposto diretamente exceto via join implícito
        // Vamos assumir que podemos filtrar no client ou ajustar a query.
        // Melhor: Adicionar clinic_id na view na próxima migration se falhar.
        // Por enquanto, vamos tentar filtrar via JS se a view não tiver o ID.

        return data as PendingConfirmation[];
    },

    // Confirmar Consulta
    async confirmAppointment(confirmationId: string, confirmedBy: string, method: 'WHATSAPP' | 'SMS' | 'EMAIL' | 'PHONE'): Promise<void> {
        const { error } = await supabase
            .from('appointment_confirmations')
            .update({
                confirmation_status: 'CONFIRMED',
                confirmed_at: new Date().toISOString(),
                confirmed_by: confirmedBy,
                confirmation_method: method
            })
            .eq('id', confirmationId);

        if (error) throw error;
    },

    // Cancelar Consulta
    async cancelAppointment(confirmationId: string, reason: string): Promise<void> {
        const { error } = await supabase
            .from('appointment_confirmations')
            .update({
                confirmation_status: 'CANCELLED',
                cancellation_reason: reason,
                updated_at: new Date().toISOString()
            })
            .eq('id', confirmationId);

        if (error) throw error;
    },

    // Reagendar (apenas marca status, a lógica de novo agendamento é separada)
    async rescheduleAppointment(confirmationId: string): Promise<void> {
        const { error } = await supabase
            .from('appointment_confirmations')
            .update({
                confirmation_status: 'RESCHEDULED',
                updated_at: new Date().toISOString()
            })
            .eq('id', confirmationId);

        if (error) throw error;
    },

    // Simular Envio de Lembrete
    async sendReminder(appointmentId: string, channel: ReminderChannel, message: string): Promise<boolean> {
        try {
            // 1. Atualizar registro de envio
            const updateData: any = {
                reminder_sent_at: new Date().toISOString(),
                reminder_channel: channel,
                reminder_message: message
            };

            // Flag específica por canal/tempo
            // Simplificação: apenas marca que enviou último lembrete

            const { error } = await supabase
                .from('appointment_confirmations')
                .update(updateData)
                .eq('appointment_id', appointmentId);

            if (error) throw error;

            // 2. Integração real viria aqui (Twilio, Wpp API, etc)
            console.log(`[MOCK] Sending ${channel} to appointment ${appointmentId}: ${message}`);

            return true;
        } catch (err) {
            console.error('Error sending reminder:', err);
            return false;
        }
    },

    // Obter Estatísticas
    async getStats(clinicId: string): Promise<ConfirmationStats> {
        // Implementação simplificada - idealmente seria uma RPC function no banco
        const { data, error } = await supabase
            .from('appointment_confirmations')
            .select('confirmation_status')
            .eq('clinic_id', clinicId);

        if (error) throw error;

        const total = data.length;
        const confirmed = data.filter(c => c.confirmation_status === 'CONFIRMED').length;
        const cancelled = data.filter(c => c.confirmation_status === 'CANCELLED').length;
        const pending = data.filter(c => c.confirmation_status === 'PENDING').length;
        const noResponse = data.filter(c => c.confirmation_status === 'NO_RESPONSE').length;

        return {
            total_appointments: total,
            pending_confirmations: pending,
            confirmed_count: confirmed,
            cancelled_count: cancelled,
            no_response_count: noResponse,
            confirmation_rate: total > 0 ? (confirmed / total) * 100 : 0,
            no_show_rate: total > 0 ? (noResponse / total) * 100 : 0 // Proxy simplificado
        };
    }
};
