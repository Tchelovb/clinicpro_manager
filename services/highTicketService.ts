import { supabase } from '../lib/supabase';

export interface HighTicketLead {
    id: string;
    name: string;
    phone: string;
    email?: string;
    source: string;
    status: string;
    value?: number;
    desired_treatment?: string;
    interest?: string;
    patient_id?: string;
    created_at: string;
    last_interaction: string;
    lead_score: number;
    priority: string;
    agent_logs?: Array<{
        message_sent: string;
        created_at: string;
    }>;
}

export interface HighTicketBudget {
    id: string;
    patient_id: string;
    patient_name: string;
    total_value: number;
    final_value: number;
    discount: number;
    status: string;
    created_at: string;
    updated_at: string;
    procedures: string[];
    rejection_reason?: string;
}

export interface PipelineStats {
    totalLeads: number;
    totalBudgets: number;
    totalValue: number;
    conversionRate: number;
    avgTicket: number;
    hotLeads: number;
}

const HIGH_TICKET_PROCEDURES = [
    'Cervicoplastia',
    'Lip Lifting',
    'Lifting Temporal Smart',
    'Lipoescultura',
    'Protocolo 560h',
    'Harmonização Facial Completa',
    'Bichectomia',
    'Rinoplastia'
];

export const highTicketService = {
    // Buscar leads high-ticket (interessados em procedimentos de alta margem)
    async getHighTicketLeads(clinicId: string): Promise<HighTicketLead[]> {
        const { data, error } = await supabase
            .from('leads')
            .select(`
                *,
                agent_logs (
                    message_sent,
                    created_at
                )
            `)
            .eq('clinic_id', clinicId)
            .in('status', ['NEW', 'CONTACT', 'SCHEDULED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'])
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching leads:', error);
            throw error;
        }

        // Filtrar apenas leads com interesse em procedimentos high-ticket
        const filtered = data?.filter(lead => {
            const treatment = lead.desired_treatment?.toLowerCase() || '';
            const interest = lead.interest?.toLowerCase() || '';

            return HIGH_TICKET_PROCEDURES.some(proc =>
                treatment.includes(proc.toLowerCase()) ||
                interest.includes(proc.toLowerCase())
            );
        }) || [];

        // Sort by lead_score after filtering
        return filtered.sort((a, b) => (b.lead_score || 0) - (a.lead_score || 0));
    },

    // Buscar orçamentos high-ticket (>= R$ 5.000)
    async getHighTicketBudgets(clinicId: string): Promise<HighTicketBudget[]> {
        const { data, error } = await supabase
            .from('budgets')
            .select(`
        *,
        patient:patients(name),
        items:budget_items(procedure_name)
      `)
            .eq('clinic_id', clinicId)
            .gte('total_value', 5000)
            .in('status', ['DRAFT', 'SENT', 'APPROVED'])
            .order('total_value', { ascending: false });

        if (error) throw error;

        return data?.map(budget => ({
            id: budget.id,
            patient_id: budget.patient_id,
            patient_name: budget.patient?.name || 'N/A',
            total_value: budget.total_value,
            final_value: budget.final_value,
            discount: budget.discount,
            status: budget.status,
            created_at: budget.created_at,
            updated_at: budget.updated_at,
            procedures: budget.items?.map((i: any) => i.procedure_name) || [],
            rejection_reason: budget.rejection_reason
        })) || [];
    },

    // Estatísticas do pipeline
    async getPipelineStats(clinicId: string): Promise<PipelineStats> {
        const [leads, budgets] = await Promise.all([
            this.getHighTicketLeads(clinicId),
            this.getHighTicketBudgets(clinicId)
        ]);

        const totalValue = budgets.reduce((sum, b) => sum + b.total_value, 0);
        const avgTicket = budgets.length > 0 ? totalValue / budgets.length : 0;
        const hotLeads = leads.filter(l => l.priority === 'HIGH' || l.lead_score >= 70).length;
        const conversionRate = leads.length > 0
            ? (budgets.filter(b => b.status === 'APPROVED').length / leads.length) * 100
            : 0;

        return {
            totalLeads: leads.length,
            totalBudgets: budgets.length,
            totalValue,
            conversionRate,
            avgTicket,
            hotLeads
        };
    },

    // Buscar scripts de vendas por estágio
    async getSalesScripts(clinicId: string, stage: string) {
        const { data, error } = await supabase
            .from('sales_scripts')
            .select('*')
            .eq('clinic_id', clinicId)
            .eq('stage', stage)
            .eq('is_active', true);

        if (error) throw error;
        return data || [];
    },

    // Atualizar status de lead
    async updateLeadStatus(leadId: string, status: string) {
        const { error } = await supabase
            .from('leads')
            .update({
                status,
                updated_at: new Date().toISOString(),
                last_interaction: new Date().toISOString()
            })
            .eq('id', leadId);

        if (error) throw error;
    },

    // Adicionar interação com lead
    async addLeadInteraction(leadId: string, userId: string, type: string, content: string) {
        const { error } = await supabase
            .from('lead_interactions')
            .insert({
                lead_id: leadId,
                user_id: userId,
                type,
                content
            });

        if (error) throw error;
    }
};
