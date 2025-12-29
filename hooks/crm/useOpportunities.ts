import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Opportunity, OpportunityTypeFilter } from '../../types/crm';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Hook for managing opportunities in hybrid CRM
 * Supports filtering by pipeline and type (Lead vs Patient)
 */
export const useOpportunities = (
    pipelineId: string,
    typeFilter: OpportunityTypeFilter = 'ALL'
) => {
    const { profile } = useAuth();

    return useQuery({
        queryKey: ['opportunities', pipelineId, typeFilter, profile?.clinic_id],
        queryFn: async () => {
            if (!pipelineId || !profile?.clinic_id) return [];

            let query = supabase
                .from('crm_opportunities')
                .select(`
                    *,
                    leads:leads(id, name, phone, source, email, interest),
                    patients:patients(id, name, phone, profile_photo_url, email)
                `)
                .eq('pipeline_id', pipelineId)
                .eq('clinic_id', profile.clinic_id);

            // Apply type filter
            if (typeFilter === 'LEAD') {
                query = query.not('lead_id', 'is', null);
            } else if (typeFilter === 'PATIENT') {
                query = query.not('patient_id', 'is', null);
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) {
                console.error('❌ Opportunities query error:', error);
                throw error;
            }

            console.log('✅ Opportunities loaded:', data?.length || 0);
            return (data || []) as Opportunity[];
        },
        enabled: !!pipelineId && !!profile?.clinic_id
    });
};

/**
 * Hook for creating new opportunities
 */
export const useCreateOpportunity = () => {
    const { profile } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (opportunity: Partial<Opportunity>) => {
            const { data, error } = await supabase
                .from('crm_opportunities')
                .insert({
                    ...opportunity,
                    clinic_id: profile?.clinic_id,
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['opportunities'] });
        }
    });
};

/**
 * Hook for updating opportunity stage (drag & drop)
 */
export const useUpdateOpportunityStage = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, stage_id }: { id: string; stage_id: string }) => {
            const { data, error } = await supabase
                .from('crm_opportunities')
                .update({ stage_id, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['opportunities'] });
        }
    });
};

/**
 * Hook for updating opportunity status (WON/LOST)
 */
export const useUpdateOpportunityStatus = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            id,
            status,
            lost_reason,
            lost_reason_notes
        }: {
            id: string;
            status: Opportunity['status'];
            lost_reason?: string;
            lost_reason_notes?: string;
        }) => {
            const { data, error } = await supabase
                .from('crm_opportunities')
                .update({
                    status,
                    lost_reason,
                    lost_reason_notes,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['opportunities'] });
        }
    });
};
