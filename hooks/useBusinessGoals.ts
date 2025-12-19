import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface BusinessGoals {
    monthly_revenue: number;
    monthly_net_result: number;
    conversion_rate: number;
    no_show_rate: number;
    average_ticket: number;
    new_patients: number;
    occupancy_rate: number;
}

const DEFAULT_GOALS: BusinessGoals = {
    monthly_revenue: 50000,
    monthly_net_result: 25000,
    conversion_rate: 30,
    no_show_rate: 5,
    average_ticket: 2000,
    new_patients: 20,
    occupancy_rate: 80,
};

export const useBusinessGoals = () => {
    const [goals, setGoals] = useState<BusinessGoals>(DEFAULT_GOALS);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadGoals();
    }, []);

    const loadGoals = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('clinics')
                .select('goals')
                .eq('id', user.user_metadata.clinic_id)
                .single();

            if (error) throw error;

            if (data?.goals) {
                setGoals({ ...DEFAULT_GOALS, ...data.goals });
            }
        } catch (error) {
            console.error('Erro ao carregar metas:', error);
        } finally {
            setLoading(false);
        }
    };

    return { goals, loading };
};
