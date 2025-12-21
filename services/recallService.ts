// =====================================================
// SERVICE: RECALLS ESTRUTURADOS
// =====================================================

import { supabase } from '../lib/supabase';
import {
    PatientRecall,
    RecallStatus,
    RecallType,
    RecallStats,
    CreateRecallDTO,
    UpdateRecallDTO,
    RecallOpportunity,
    RecordContactDTO
} from '../types/recalls';

export const RecallService = {

    // Criar Recall
    async createRecall(data: CreateRecallDTO): Promise<PatientRecall> {
        const { data: newRecall, error } = await supabase
            .from('patient_recalls')
            .insert(data)
            .select()
            .single();

        if (error) throw error;
        return newRecall as PatientRecall;
    },

    // Buscar Recalls (Oportunidades)
    async getRecallOpportunities(clinicId: string): Promise<RecallOpportunity[]> {
        const { data, error } = await supabase
            .from('recall_opportunities_view')
            .select('*')
            .eq('clinic_id', clinicId)
            // Ordenar por prioridade (desc) e dias de atraso (desc)
            .order('priority', { ascending: false });

        if (error) throw error;
        return data as RecallOpportunity[];
    },

    // Atualizar Status/Progresso
    async updateRecall(id: string, updates: UpdateRecallDTO): Promise<void> {
        const { error } = await supabase
            .from('patient_recalls')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) throw error;
    },

    // Registrar Contato
    async recordContact(data: RecordContactDTO): Promise<void> {
        // 1. Buscar tentativas atuais
        const { data: current, error: fetchError } = await supabase
            .from('patient_recalls')
            .select('contact_attempts')
            .eq('id', data.recall_id)
            .single();

        if (fetchError) throw fetchError;

        // 2. Atualizar
        const { error } = await supabase
            .from('patient_recalls')
            .update({
                status: 'CONTACTED',
                last_contact_date: new Date().toISOString(),
                contact_attempts: (current?.contact_attempts || 0) + 1,
                contact_method: data.contact_method,
                contact_notes: data.contact_notes,
                updated_at: new Date().toISOString()
            })
            .eq('id', data.recall_id);

        if (error) throw error;
    },

    // Agendar (Converter Recall)
    async convertToAppointment(recallId: string, appointmentId: string): Promise<void> {
        const { error } = await supabase
            .from('patient_recalls')
            .update({
                status: 'SCHEDULED',
                linked_appointment_id: appointmentId,
                updated_at: new Date().toISOString()
            })
            .eq('id', recallId);

        if (error) throw error;
    },

    // Obter Estatísticas
    async getStats(clinicId: string): Promise<RecallStats> {
        const { data, error } = await supabase
            .from('patient_recalls')
            .select('*')
            .eq('clinic_id', clinicId);

        if (error) throw error;

        const total = data.length;
        const pending = data.filter(r => r.status === 'PENDING').length;
        const contacted = data.filter(r => r.status === 'CONTACTED').length;
        const scheduled = data.filter(r => r.status === 'SCHEDULED' || r.status === 'COMPLETED').length;
        const overdue = data.filter(r => r.status === 'OVERDUE').length;
        const lost = data.filter(r => r.status === 'LOST').length;

        // Sucesso = agendados / total de tentados (contacted + scheduled + lost)
        const attempted = contacted + scheduled + lost;
        const successRate = attempted > 0 ? (scheduled / attempted) * 100 : 0;

        // Potencial Financeiro (simplificado: cada recall vale ~R$ 500 em média)
        const potentialRevenue = pending * 500;

        return {
            total_recalls: total,
            pending_recalls: pending,
            contacted_recalls: contacted,
            scheduled_recalls: scheduled,
            overdue_recalls: overdue,
            lost_recalls: lost,
            completed_recalls: scheduled, // Considerando scheduled como sucesso
            average_priority: 0, // Placeholder
            total_potential_revenue: potentialRevenue,
            contact_success_rate: successRate
        };
    }
};
