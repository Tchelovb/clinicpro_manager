import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

export interface AIInsight {
    id: string;
    clinic_id: string;
    type: 'RECOVERY' | 'CONVERSION' | 'ENGAGEMENT' | 'RISK';
    category: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    title: string;
    description: string;
    action_link?: string;
    action_label?: string;
    metadata?: any;
    created_at: string;
}

export const useAIInsights = () => {
    const { profile } = useAuth();
    const clinicId = profile?.clinic_id;

    const query = useQuery({
        queryKey: ["ai_insights", clinicId],
        queryFn: async () => {
            if (!clinicId) return [];

            const { data, error } = await supabase
                .from('ai_insights')
                .select('*')
                .eq('clinic_id', clinicId)
                .order('priority', { ascending: false }) // HIGH primeiro
                .order('generated_at', { ascending: false })
                .limit(6); // Top 6 insights

            if (error) throw error;
            return data as AIInsight[];
        },
        enabled: !!clinicId,
    });

    return {
        insights: query.data || [],
        loading: query.isLoading,
        error: query.error,
    };
};
