import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

// ============================================================================
// TYPES
// ============================================================================

export interface UserProgression {
    id: string;
    user_id: string;
    clinic_id: string;
    current_level: number;
    total_xp: number;
    clinic_health_score: number;
    health_marketing: number;
    health_sales: number;
    health_clinical: number;
    health_operational: number;
    health_financial: number;
    current_streak: number;
    best_streak: number;
    achievements: string[];
    unlocked_features: string[];
    total_operations_completed: number;
    total_revenue_generated: number;
    milestone_50k_count: number;
}

export interface TacticalOperation {
    id: string;
    clinic_id: string;
    type: 'rescue_roi' | 'ticket_expansion' | 'base_protection' | 'milestone_conquest';
    title: string;
    description: string;
    financial_impact: number;
    xp_reward: number;
    priority: 'critical' | 'high' | 'medium' | 'low';
    status: 'active' | 'completed' | 'failed' | 'expired';
    related_insight_id?: string;
    deadline?: string;
    completed_at?: string;
    created_at: string;
}

export interface HealthEvent {
    id: string;
    clinic_id: string;
    event_type: string;
    impact: number;
    pillar: 'marketing' | 'sales' | 'clinical' | 'operational' | 'financial' | 'overall';
    title: string;
    description?: string;
    created_at: string;
}

export interface GamificationDashboard {
    user_id: string;
    clinic_id: string;
    current_level: number;
    total_xp: number;
    xp_to_next_level: number;
    clinic_health_score: number;
    current_streak: number;
    best_streak: number;
    total_operations_completed: number;
    total_revenue_generated: number;
    active_operations: number;
    rescue_roi_count: number;
    ticket_expansion_count: number;
    base_protection_count: number;
    health_marketing: number;
    health_sales: number;
    health_clinical: number;
    health_operational: number;
    health_financial: number;
    total_achievements: number;
    total_features_unlocked: number;
}

// ============================================================================
// HOOK: useGameification
// ============================================================================

export const useGameification = () => {
    const { profile } = useAuth();
    const [progression, setProgression] = useState<UserProgression | null>(null);
    const [operations, setOperations] = useState<TacticalOperation[]>([]);
    const [dashboard, setDashboard] = useState<GamificationDashboard | null>(null);
    const [recentEvents, setRecentEvents] = useState<HealthEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // ========================================================================
    // FETCH PROGRESSION
    // ========================================================================

    const fetchProgression = useCallback(async () => {
        if (!profile?.id || !profile?.clinic_id) return;

        try {
            const { data, error } = await supabase
                .from('user_progression')
                .select('*')
                .eq('user_id', profile.id)
                .eq('clinic_id', profile.clinic_id)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 = not found
                throw error;
            }

            if (data) {
                setProgression(data);
            } else {
                // Criar progressão inicial
                const { data: newProgression, error: createError } = await supabase
                    .from('user_progression')
                    .insert({
                        user_id: profile.id,
                        clinic_id: profile.clinic_id
                    })
                    .select()
                    .single();

                if (createError) throw createError;
                setProgression(newProgression);
            }
        } catch (err) {
            console.error('Error fetching progression:', err);
            setError(err instanceof Error ? err.message : 'Unknown error');
        }
    }, [profile]);

    // ========================================================================
    // FETCH OPERATIONS
    // ========================================================================

    const fetchOperations = useCallback(async () => {
        if (!profile?.clinic_id) return;

        try {
            const { data, error } = await supabase
                .from('tactical_operations')
                .select('*')
                .eq('clinic_id', profile.clinic_id)
                .eq('status', 'active')
                .order('priority', { ascending: true })
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOperations(data || []);
        } catch (err) {
            console.error('Error fetching operations:', err);
        }
    }, [profile]);

    // ========================================================================
    // FETCH DASHBOARD
    // ========================================================================

    const fetchDashboard = useCallback(async () => {
        if (!profile?.id || !profile?.clinic_id) return;

        try {
            const { data, error } = await supabase
                .from('gamification_dashboard')
                .select('*')
                .eq('user_id', profile.id)
                .eq('clinic_id', profile.clinic_id)
                .single();

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            setDashboard(data);
        } catch (err) {
            console.error('Error fetching dashboard:', err);
        }
    }, [profile]);

    // ========================================================================
    // FETCH RECENT EVENTS
    // ========================================================================

    const fetchRecentEvents = useCallback(async () => {
        if (!profile?.clinic_id) return;

        try {
            const { data, error } = await supabase
                .from('health_events')
                .select('*')
                .eq('clinic_id', profile.clinic_id)
                .order('created_at', { ascending: false })
                .limit(10);

            if (error) throw error;
            setRecentEvents(data || []);
        } catch (err) {
            console.error('Error fetching events:', err);
        }
    }, [profile]);

    // ========================================================================
    // COMPLETE OPERATION
    // ========================================================================

    const completeOperation = async (operationId: string) => {
        if (!profile?.id) return;

        try {
            // Chamar função SQL
            const { data, error } = await supabase.rpc('complete_tactical_operation', {
                p_operation_id: operationId,
                p_user_id: profile.id
            });

            if (error) throw error;

            // Atualizar dados locais
            await Promise.all([
                fetchProgression(),
                fetchOperations(),
                fetchDashboard(),
                fetchRecentEvents()
            ]);

            return data;
        } catch (err) {
            console.error('Error completing operation:', err);
            throw err;
        }
    };

    // ========================================================================
    // ADD XP
    // ========================================================================

    const addXP = async (amount: number, source: string = 'manual') => {
        if (!profile?.id || !profile?.clinic_id) return;

        try {
            const { data, error } = await supabase.rpc('add_xp', {
                p_user_id: profile.id,
                p_clinic_id: profile.clinic_id,
                p_xp_amount: amount,
                p_source: source
            });

            if (error) throw error;

            // Atualizar dados locais
            await fetchProgression();
            await fetchDashboard();

            return data;
        } catch (err) {
            console.error('Error adding XP:', err);
            throw err;
        }
    };

    // ========================================================================
    // UPDATE HEALTH
    // ========================================================================

    const updateHealth = async (
        pillar: 'marketing' | 'sales' | 'clinical' | 'operational' | 'financial',
        impact: number
    ) => {
        if (!profile?.clinic_id) return;

        try {
            const { data, error } = await supabase.rpc('update_clinic_health', {
                p_clinic_id: profile.clinic_id,
                p_pillar: pillar,
                p_impact: impact
            });

            if (error) throw error;

            // Atualizar dados locais
            await fetchProgression();
            await fetchDashboard();
            await fetchRecentEvents();

            return data;
        } catch (err) {
            console.error('Error updating health:', err);
            throw err;
        }
    };

    // ========================================================================
    // GET LEVEL INFO
    // ========================================================================

    const getLevelInfo = (level: number) => {
        const levels = {
            1: {
                title: 'Gestor de Fluxo',
                description: 'Controle básico de inadimplência e leads',
                xpRequired: 0,
                features: ['dashboard_basic', 'alerts_inadimplencia', 'lead_control']
            },
            2: {
                title: 'Estrategista High-Ticket',
                description: 'Análise de ROI e Upsell Intelligence',
                xpRequired: 5000,
                features: ['roi_analysis', 'upsell_intelligence', 'scenario_simulator', 'sales_scripts']
            },
            3: {
                title: 'Arquiteto do Instituto',
                description: 'PIPE e Torre de Controle',
                xpRequired: 15000,
                features: ['pipe_dashboard', 'control_tower', 'advanced_automations', 'ai_forecasting']
            },
            4: {
                title: 'Diretor Exponencial',
                description: 'Elite - Todas as features + Mentoria IA',
                xpRequired: 30000,
                features: ['all_features', 'ai_mentorship', 'benchmarking', 'scaling_strategies']
            }
        };

        return levels[level as keyof typeof levels] || levels[1];
    };

    // ========================================================================
    // GET HEALTH STATUS
    // ========================================================================

    const getHealthStatus = (score: number) => {
        if (score >= 80) return { status: 'excellent', color: 'green', label: 'Alta Performance' };
        if (score >= 60) return { status: 'good', color: 'yellow', label: 'Atenção Necessária' };
        if (score >= 40) return { status: 'warning', color: 'orange', label: 'Correção Urgente' };
        return { status: 'critical', color: 'red', label: 'Intervenção Imediata' };
    };

    // ========================================================================
    // INITIAL LOAD
    // ========================================================================

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await Promise.all([
                fetchProgression(),
                fetchOperations(),
                fetchDashboard(),
                fetchRecentEvents()
            ]);
            setLoading(false);
        };

        if (profile?.id && profile?.clinic_id) {
            loadData();
        }
    }, [profile, fetchProgression, fetchOperations, fetchDashboard, fetchRecentEvents]);

    // ========================================================================
    // REAL-TIME SUBSCRIPTIONS
    // ========================================================================

    useEffect(() => {
        if (!profile?.clinic_id) return;

        // Subscribe to operations changes
        const operationsSubscription = supabase
            .channel('tactical_operations_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'tactical_operations',
                    filter: `clinic_id=eq.${profile.clinic_id}`
                },
                () => {
                    fetchOperations();
                }
            )
            .subscribe();

        // Subscribe to progression changes
        const progressionSubscription = supabase
            .channel('user_progression_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'user_progression',
                    filter: `clinic_id=eq.${profile.clinic_id}`
                },
                () => {
                    fetchProgression();
                    fetchDashboard();
                }
            )
            .subscribe();

        return () => {
            operationsSubscription.unsubscribe();
            progressionSubscription.unsubscribe();
        };
    }, [profile, fetchOperations, fetchProgression, fetchDashboard]);

    // ========================================================================
    // RETURN
    // ========================================================================

    return {
        // Data
        progression,
        operations,
        dashboard,
        recentEvents,
        loading,
        error,

        // Actions
        completeOperation,
        addXP,
        updateHealth,

        // Helpers
        getLevelInfo,
        getHealthStatus,

        // Refresh
        refresh: async () => {
            await Promise.all([
                fetchProgression(),
                fetchOperations(),
                fetchDashboard(),
                fetchRecentEvents()
            ]);
        }
    };
};

export default useGameification;
