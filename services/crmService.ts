import { supabase } from '../src/lib/supabase';

export type LeadStatus = 'NEW' | 'CONTACT' | 'SCHEDULED' | 'PROPOSAL' | 'WON' | 'LOST';

export interface Lead {
    id: string;
    name: string;
    phone: string;
    desired_treatment?: string;
    status: LeadStatus;
    last_interaction?: string;
    message_sent?: string;
    created_at: string;
    clinic_id?: string;
}

export const crmService = {
    /**
     * Busca todos os leads ativos
     */
    async getLeads(clinicId?: string) {
        let query = supabase
            .from('leads')
            .select('*')
            .order('created_at', { ascending: false });

        if (clinicId) {
            query = query.eq('clinic_id', clinicId);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Agent logs are in a separate table
        return (data || []).map((lead: any) => ({
            ...lead,
            message_sent: null
        })) as Lead[];
    },

    /**
     * Move o card de coluna (Ex: de Novo para Agendado)
     */
    async updateStatus(id: string, newStatus: LeadStatus) {
        const { error } = await supabase
            .from('leads')
            .update({ status: newStatus })
            .eq('id', id);

        if (error) throw error;
    },

    /**
     * Cria um lead manualmente (caso chegue alguém na recepção)
     */
    async createLead(name: string, phone: string, treatment: string, clinicId: string) {
        const { error } = await supabase
            .from('leads')
            .insert({
                name,
                phone,
                desired_treatment: treatment,
                status: 'NEW',
                source: 'MANUAL', // Identifica que foi a secretária
                clinic_id: clinicId
            });

        if (error) throw error;
    },

    /**
     * Deleta um lead
     */
    async deleteLead(id: string) {
        const { error } = await supabase
            .from('leads')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
