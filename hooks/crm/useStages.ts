import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Stage } from '../../types/crm';

/**
 * Hook for fetching stages for a specific pipeline
 */
export const useStages = (pipelineId: string) => {
    return useQuery({
        queryKey: ['stages', pipelineId],
        queryFn: async () => {
            if (!pipelineId) return [];

            const { data, error } = await supabase
                .from('crm_stages')
                .select('*')
                .eq('pipeline_id', pipelineId)
                .order('stage_order');

            if (error) throw error;
            return (data || []) as Stage[];
        },
        enabled: !!pipelineId
    });
};
