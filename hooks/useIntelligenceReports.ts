import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

// ========================================
// TYPES
// ========================================
export interface CashFlowItem {
    id: string;
    clinic_id: string;
    date: string;
    type: string;
    category: string;
    description: string;
    amount: number;
    payment_method: string;
    flow_type: 'ENTRADA' | 'SAÍDA';
    month: number;
    year: number;
    month_start: string;
    clinic_name: string;
}

export interface LeadROI {
    lead_id: string;
    clinic_id: string;
    lead_name: string;
    phone: string;
    email: string;
    source: string;
    lead_status: string;
    lead_created: string;
    total_budgets: number;
    converted_value: number;
    conversion_status: 'CONVERTEU' | 'NÃO CONVERTEU';
    clinic_name: string;
}

export interface BudgetFunnelItem {
    budget_id: string;
    clinic_id: string;
    patient_id: string;
    patient_name: string;
    patient_phone: string;
    total_value: number;
    discount: number;
    final_value: number;
    status: string;
    created_at: string;
    updated_at: string;
    days_in_funnel: number;
    status_label: string;
    temperature: 'QUENTE' | 'MORNO' | 'FRIO' | 'N/A';
    doctor_name: string;
    clinic_name: string;
}

export interface ScheduleOccupancy {
    appointment_id: string;
    clinic_id: string;
    date: string;
    duration_minutes: number;
    appointment_type: string;
    status: string;
    day_of_week: number;
    hour_of_day: number;
    productivity_score: number;
    patient_name: string;
    doctor_name: string;
    clinic_name: string;
}

export interface IncomeStatement {
    clinic_id: string;
    period: string;
    gross_revenue: number;
    salary_expenses: number;
    rent_expenses: number;
    supply_expenses: number;
    other_expenses: number;
    total_expenses: number;
    net_profit: number;
    profit_margin_percent: number;
}

export interface ExecutiveKPIs {
    clinic_id: string;
    clinic_name: string;
    monthly_revenue: number;
    monthly_expenses: number;
    active_leads: number;
    pending_budgets: number;
    pending_value: number;
    total_patients: number;
    appointments_next_7_days: number;
    conversion_rate: number;
}

// ========================================
// HOOKS
// ========================================

/**
 * Hook para buscar fluxo de caixa
 */
export const useCashFlow = (startDate?: string, endDate?: string) => {
    const { profile } = useAuth();
    const clinicId = profile?.clinic_id;

    return useQuery({
        queryKey: ['cash-flow', clinicId, startDate, endDate],
        queryFn: async () => {
            if (!clinicId) throw new Error('Clinic ID não encontrado');

            let query = supabase
                .from('vw_cash_flow')
                .select('*')
                .eq('clinic_id', clinicId);

            if (startDate) {
                query = query.gte('date', startDate);
            }
            if (endDate) {
                query = query.lte('date', endDate);
            }

            const { data, error } = await query.order('date', { ascending: false });

            if (error) throw error;
            return data as CashFlowItem[];
        },
        enabled: !!clinicId,
    });
};

/**
 * Hook para buscar ROI de leads por origem
 */
export const useLeadsROI = (source?: string) => {
    const { profile } = useAuth();
    const clinicId = profile?.clinic_id;

    return useQuery({
        queryKey: ['leads-roi', clinicId, source],
        queryFn: async () => {
            if (!clinicId) throw new Error('Clinic ID não encontrado');

            let query = supabase
                .from('vw_leads_roi')
                .select('*')
                .eq('clinic_id', clinicId);

            if (source) {
                query = query.eq('source', source);
            }

            const { data, error } = await query.order('lead_created', { ascending: false });

            if (error) throw error;
            return data as LeadROI[];
        },
        enabled: !!clinicId,
    });
};

/**
 * Hook para buscar funil de orçamentos
 */
export const useBudgetFunnel = (temperature?: 'QUENTE' | 'MORNO' | 'FRIO', status?: string) => {
    const { profile } = useAuth();
    const clinicId = profile?.clinic_id;

    return useQuery({
        queryKey: ['budget-funnel', clinicId, temperature, status],
        queryFn: async () => {
            if (!clinicId) throw new Error('Clinic ID não encontrado');

            let query = supabase
                .from('vw_budget_funnel')
                .select('*')
                .eq('clinic_id', clinicId);

            if (temperature) {
                query = query.eq('temperature', temperature);
            }
            if (status) {
                query = query.eq('status', status);
            }

            const { data, error } = await query.order('total_value', { ascending: false });

            if (error) throw error;
            return data as BudgetFunnelItem[];
        },
        enabled: !!clinicId,
    });
};

/**
 * Hook para buscar ocupação de agenda
 */
export const useScheduleOccupancy = (startDate?: string, endDate?: string) => {
    const { profile } = useAuth();
    const clinicId = profile?.clinic_id;

    return useQuery({
        queryKey: ['schedule-occupancy', clinicId, startDate, endDate],
        queryFn: async () => {
            if (!clinicId) throw new Error('Clinic ID não encontrado');

            let query = supabase
                .from('vw_schedule_occupancy')
                .select('*')
                .eq('clinic_id', clinicId);

            if (startDate) {
                query = query.gte('date', startDate);
            }
            if (endDate) {
                query = query.lte('date', endDate);
            }

            const { data, error } = await query.order('date', { ascending: false });

            if (error) throw error;
            return data as ScheduleOccupancy[];
        },
        enabled: !!clinicId,
    });
};

/**
 * Hook para buscar DRE (Demonstrativo de Resultados)
 */
export const useIncomeStatement = (months: number = 12) => {
    const { profile } = useAuth();
    const clinicId = profile?.clinic_id;

    return useQuery({
        queryKey: ['income-statement', clinicId, months],
        queryFn: async () => {
            if (!clinicId) throw new Error('Clinic ID não encontrado');

            const { data, error } = await supabase
                .from('vw_income_statement')
                .select('*')
                .eq('clinic_id', clinicId)
                .order('period', { ascending: false })
                .limit(months);

            if (error) throw error;
            return data as IncomeStatement[];
        },
        enabled: !!clinicId,
    });
};

/**
 * Hook para buscar KPIs executivos
 */
export const useExecutiveKPIs = () => {
    const { profile } = useAuth();
    const clinicId = profile?.clinic_id;

    return useQuery({
        queryKey: ['executive-kpis', clinicId],
        queryFn: async () => {
            if (!clinicId) throw new Error('Clinic ID não encontrado');

            const { data, error } = await supabase
                .from('vw_executive_kpis')
                .select('*')
                .eq('clinic_id', clinicId)
                .single();

            if (error) throw error;
            return data as ExecutiveKPIs;
        },
        enabled: !!clinicId,
        refetchInterval: 60000, // Atualiza a cada 1 minuto
    });
};

/**
 * Hook para análise de ROI agregado por canal
 */
export const useROIByChannel = () => {
    const { profile } = useAuth();
    const clinicId = profile?.clinic_id;

    return useQuery({
        queryKey: ['roi-by-channel', clinicId],
        queryFn: async () => {
            if (!clinicId) throw new Error('Clinic ID não encontrado');

            const { data, error } = await supabase
                .from('vw_leads_roi')
                .select('*')
                .eq('clinic_id', clinicId);

            if (error) throw error;

            // Agregar por canal
            const byChannel = (data as LeadROI[]).reduce((acc, item) => {
                const channel = item.source || 'Sem origem';
                if (!acc[channel]) {
                    acc[channel] = {
                        channel,
                        total_leads: 0,
                        converted_leads: 0,
                        total_revenue: 0,
                        conversion_rate: 0,
                    };
                }
                acc[channel].total_leads++;
                if (item.conversion_status === 'CONVERTEU') {
                    acc[channel].converted_leads++;
                    acc[channel].total_revenue += item.converted_value;
                }
                return acc;
            }, {} as Record<string, any>);

            // Calcular taxa de conversão
            Object.values(byChannel).forEach((channel: any) => {
                channel.conversion_rate = channel.total_leads > 0
                    ? (channel.converted_leads / channel.total_leads) * 100
                    : 0;
            });

            return Object.values(byChannel);
        },
        enabled: !!clinicId,
    });
};

/**
 * Hook para análise de produtividade por dia da semana
 */
export const useProductivityByWeekday = () => {
    const { profile } = useAuth();
    const clinicId = profile?.clinic_id;

    return useQuery({
        queryKey: ['productivity-weekday', clinicId],
        queryFn: async () => {
            if (!clinicId) throw new Error('Clinic ID não encontrado');

            // Buscar últimos 30 dias
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const { data, error } = await supabase
                .from('vw_schedule_occupancy')
                .select('*')
                .eq('clinic_id', clinicId)
                .gte('date', thirtyDaysAgo.toISOString());

            if (error) throw error;

            // Agregar por dia da semana
            const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
            const byWeekday = (data as ScheduleOccupancy[]).reduce((acc, item) => {
                const day = item.day_of_week;
                if (!acc[day]) {
                    acc[day] = {
                        day: weekdays[day],
                        total_appointments: 0,
                        total_productivity: 0,
                        avg_productivity: 0,
                    };
                }
                acc[day].total_appointments++;
                acc[day].total_productivity += item.productivity_score;
                return acc;
            }, {} as Record<number, any>);

            // Calcular média
            Object.values(byWeekday).forEach((day: any) => {
                day.avg_productivity = day.total_appointments > 0
                    ? (day.total_productivity / day.total_appointments) * 100
                    : 0;
            });

            return Object.values(byWeekday);
        },
        enabled: !!clinicId,
    });
};
