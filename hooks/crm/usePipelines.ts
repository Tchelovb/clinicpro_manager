import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../src/lib/supabase';
import { Pipeline } from '../../types/crm';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Hook for fetching all pipelines for the clinic
 */
export const usePipelines = () => {
    const { profile } = useAuth();

    return useQuery({
        queryKey: ['pipelines', profile?.clinic_id],
        queryFn: async () => {
            if (!profile?.clinic_id) return [];

            const { data, error } = await supabase
                .from('crm_pipelines')
                .select('*')
                .eq('clinic_id', profile.clinic_id)
                .eq('active', true)
                .order('name');

            if (error) throw error;
            return (data || []) as Pipeline[];
        },
        enabled: !!profile?.clinic_id
    });
};

/**
 * Hook for getting the default pipeline
 */
export const useDefaultPipeline = () => {
    const { profile } = useAuth();

    return useQuery({
        queryKey: ['default-pipeline', profile?.clinic_id],
        queryFn: async () => {
            if (!profile?.clinic_id) return null;

            const { data, error } = await supabase
                .from('crm_pipelines')
                .select('*')
                .eq('clinic_id', profile.clinic_id)
                .eq('is_default', true)
                .eq('active', true)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            return data as Pipeline | null;
        },
        enabled: !!profile?.clinic_id
    });
};
