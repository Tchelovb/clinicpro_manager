import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../src/lib/supabase";
import { useAuth } from "../contexts/AuthContext";

export interface MarketingCampaign {
    id: string;
    name: string;
    channel: string;
    status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
    budget: number;
    start_date: string;
    end_date?: string;
}

export interface SalesScript {
    id: string;
    title: string;
    stage: string;
    content: string;
    tags: string[];
    is_active: boolean;
}

export interface SalesGoal {
    id: string;
    period_month: string;
    target_revenue: number;
    target_leads: number;
    target_conversion_rate: number;
}

export const useCommercial = () => {
    const { profile } = useAuth();
    const clinicId = profile?.clinic_id;
    const queryClient = useQueryClient();

    // --- CAMPAIGNS ---
    const campaignsQuery = useQuery({
        queryKey: ["campaigns", clinicId],
        queryFn: async () => {
            if (!clinicId) return [];
            const { data, error } = await supabase
                .from('marketing_campaigns')
                .select('*')
                .eq('clinic_id', clinicId)
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data as MarketingCampaign[];
        },
        enabled: !!clinicId
    });

    const createCampaign = useMutation({
        mutationFn: async (campaign: Omit<MarketingCampaign, 'id'>) => {
            const { data, error } = await supabase.from('marketing_campaigns').insert({ ...campaign, clinic_id: clinicId }).select().single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["campaigns"] })
    });

    // --- SCRIPTS ---
    const scriptsQuery = useQuery({
        queryKey: ["scripts", clinicId],
        queryFn: async () => {
            if (!clinicId) return [];
            const { data, error } = await supabase
                .from('sales_scripts')
                .select('*')
                .eq('clinic_id', clinicId)
                .eq('is_active', true);
            if (error) throw error;
            return data as SalesScript[];
        },
        enabled: !!clinicId
    });

    // --- GOALS ---
    const currentMonth = new Date().toISOString().slice(0, 7) + '-01'; // YYYY-MM-01
    const goalsQuery = useQuery({
        queryKey: ["sales_goals", clinicId, currentMonth],
        queryFn: async () => {
            if (!clinicId) return null;
            const { data, error } = await supabase
                .from('sales_goals')
                .select('*')
                .eq('clinic_id', clinicId)
                .eq('period_month', currentMonth)
                .maybeSingle();

            if (error && error.code !== 'PGRST116') throw error; // Ignore not found
            return data as SalesGoal;
        },
        enabled: !!clinicId
    });

    return {
        campaigns: campaignsQuery.data || [],
        scripts: scriptsQuery.data || [],
        currentGoal: goalsQuery.data,
        isLoading: campaignsQuery.isLoading || scriptsQuery.isLoading,
        createCampaign: createCampaign.mutateAsync
    };
};
