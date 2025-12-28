import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface Opportunity {
    id: string;
    title: string;
    lead_id: string | null;
    patient_id: string | null;
    pipeline_id: string;
    stage_id: string;
    status: 'OPEN' | 'WON' | 'LOST' | 'ABANDONED';
    monetary_value: number;
    probability: number;
    lost_reason: string | null;
    lost_reason_notes: string | null;
    origin_opportunity_id: string | null;
    owner_id: string | null;
    created_at: string;
    updated_at: string;
    expected_close_date: string | null;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export function useOpportunities(leadId: string | null) {
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [totalValue, setTotalValue] = useState(0);
    const [loading, setLoading] = useState(false);

    const fetchOpportunities = async () => {
        if (!leadId) {
            setOpportunities([]);
            setTotalValue(0);
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('crm_opportunities')
                .select('*')
                .eq('lead_id', leadId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            setOpportunities(data || []);

            // Calculate total value of OPEN opportunities
            const total = (data || [])
                .filter((o) => o.status === 'OPEN')
                .reduce((sum, o) => sum + (o.monetary_value || 0), 0);

            setTotalValue(total);
        } catch (error) {
            console.error('Error fetching opportunities:', error);
            toast.error('Erro ao carregar oportunidades');
        } finally {
            setLoading(false);
        }
    };

    const markAsLost = async (opportunityId: string, reason: string, notes?: string) => {
        try {
            const { error } = await supabase
                .from('crm_opportunities')
                .update({
                    status: 'LOST',
                    lost_reason: reason,
                    lost_reason_notes: notes || null,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', opportunityId);

            if (error) throw error;

            toast.success('Oportunidade marcada como perdida');
            await fetchOpportunities(); // Refresh list
        } catch (error) {
            console.error('Error marking opportunity as lost:', error);
            toast.error('Erro ao marcar oportunidade como perdida');
        }
    };

    const createOpportunity = async (data: {
        title: string;
        monetary_value: number;
        pipeline_id: string;
        stage_id: string;
        clinic_id: string;
    }) => {
        if (!leadId) {
            toast.error('Lead ID não encontrado');
            return null;
        }

        try {
            const { data: newOpportunity, error } = await supabase
                .from('crm_opportunities')
                .insert({
                    lead_id: leadId,
                    title: data.title,
                    monetary_value: data.monetary_value,
                    pipeline_id: data.pipeline_id,
                    stage_id: data.stage_id,
                    clinic_id: data.clinic_id,
                    status: 'OPEN',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                })
                .select()
                .single();

            if (error) throw error;

            toast.success('Oportunidade criada com sucesso');
            await fetchOpportunities(); // Refresh list
            return newOpportunity;
        } catch (error) {
            console.error('Error creating opportunity:', error);
            toast.error('Erro ao criar oportunidade');
            return null;
        }
    };

    useEffect(() => {
        fetchOpportunities();
    }, [leadId]);

    return {
        opportunities,
        totalValue,
        loading,
        markAsLost,
        createOpportunity,
        refresh: fetchOpportunities,
    };
}
