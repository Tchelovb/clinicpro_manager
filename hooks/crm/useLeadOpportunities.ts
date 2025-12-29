
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Opportunity } from '../../types/crm';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Hook for managing opportunities for a specific LEAD
 */
export const useLeadOpportunities = (leadId: string | undefined | null) => {
    const { profile } = useAuth();
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['lead-opportunities', leadId, profile?.clinic_id],
        queryFn: async () => {
            if (!leadId || !profile?.clinic_id) return [];

            const { data, error } = await supabase
                .from('crm_opportunities')
                .select(`
                    *,
                    leads:leads(id, name, phone, source, email, interest),
                    patients:patients(id, name, phone, profile_photo_url, email)
                `)
                .eq('lead_id', leadId)
                .eq('clinic_id', profile.clinic_id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('❌ Lead Opportunities query error:', error);
                throw error;
            }

            return (data || []) as Opportunity[];
        },
        enabled: !!leadId && !!profile?.clinic_id
    });

    const markAsLost = useMutation({
        mutationFn: async ({ id, reason, notes }: { id: string, reason: string, notes?: string }) => {
            const { error } = await supabase
                .from('crm_opportunities')
                .update({
                    status: 'LOST',
                    lost_reason: reason,
                    lost_reason_notes: notes,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['lead-opportunities', leadId] });
            queryClient.invalidateQueries({ queryKey: ['opportunities'] }); // Also refresh pipeline
        }
    });

    return {
        ...query,
        opportunities: query.data || [],
        refresh: query.refetch,
        markAsLost,
        totalValue: (query.data || []).reduce((acc, curr) => acc + (curr.monetary_value || 0), 0)
    };
};
