import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface ProfitPerMinuteData {
    procedure_id: string;
    procedure_name: string;
    category: string;
    estimated_time_minutes: number;
    base_price: number;
    material_cost: number;
    professional_cost: number;
    operational_overhead: number;
    total_cost: number;
    tax_percent: number;
    card_fee_percent: number;
    tax_amount: number;
    card_fee_amount: number;
    net_profit: number;
    profit_per_minute: number;
    margin_percent: number;
    is_high_ticket: boolean;
    requires_lab: boolean;
}

interface FinancialKPIs {
    todayRevenue: number;
    todayExpense: number;
    netProfit: number;
    realMargin: number;
    defaultRate: number;
    revenueTrend: number;
    profitTrend: number;
    marginTrend: number;
    defaultTrend: number;
}

/**
 * useProfitPerMinute
 * 
 * Hook para buscar análise de lucro por minuto
 * Retorna os procedimentos mais rentáveis
 */
export const useProfitPerMinute = (limit: number = 10) => {
    const { profile } = useAuth();
    const [data, setData] = useState<ProfitPerMinuteData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!profile?.clinic_id) return;

            try {
                setLoading(true);
                const { data: profitData, error: profitError } = await supabase
                    .from('view_profit_per_minute')
                    .select('*')
                    .eq('clinic_id', profile.clinic_id)
                    .order('profit_per_minute', { ascending: false })
                    .limit(limit);

                if (profitError) throw profitError;

                setData(profitData || []);
            } catch (err: any) {
                setError(err.message);
                console.error('Erro ao buscar lucro por minuto:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [profile?.clinic_id, limit]);

    return { data, loading, error };
};

/**
 * useFinancialKPIs
 * 
 * Hook para buscar KPIs financeiros do dashboard
 */
export const useFinancialKPIs = () => {
    const { profile } = useAuth();
    const [kpis, setKpis] = useState<FinancialKPIs>({
        todayRevenue: 0,
        todayExpense: 0,
        netProfit: 0,
        realMargin: 0,
        defaultRate: 0,
        revenueTrend: 0,
        profitTrend: 0,
        marginTrend: 0,
        defaultTrend: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchKPIs = async () => {
            if (!profile?.clinic_id) return;

            try {
                setLoading(true);

                const today = new Date().toISOString().split('T')[0];
                const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

                // Receitas de hoje
                const { data: todayTransactions } = await supabase
                    .from('transactions')
                    .select('amount, type')
                    .eq('clinic_id', profile.clinic_id)
                    .eq('date', today);

                // Receitas de ontem (para trend)
                const { data: yesterdayTransactions } = await supabase
                    .from('transactions')
                    .select('amount, type')
                    .eq('clinic_id', profile.clinic_id)
                    .eq('date', yesterday);

                // Parcelas vencidas (inadimplência)
                const { data: overdueInstallments } = await supabase
                    .from('installments')
                    .select('amount')
                    .eq('clinic_id', profile.clinic_id)
                    .eq('status', 'PENDING')
                    .lt('due_date', today);

                // Total de parcelas
                const { data: totalInstallments } = await supabase
                    .from('installments')
                    .select('amount')
                    .eq('clinic_id', profile.clinic_id);

                // Calcular KPIs
                const todayRevenue = todayTransactions
                    ?.filter(t => t.type === 'INCOME')
                    .reduce((sum, t) => sum + t.amount, 0) || 0;

                const todayExpense = todayTransactions
                    ?.filter(t => t.type === 'EXPENSE')
                    .reduce((sum, t) => sum + t.amount, 0) || 0;

                const yesterdayRevenue = yesterdayTransactions
                    ?.filter(t => t.type === 'INCOME')
                    .reduce((sum, t) => sum + t.amount, 0) || 0;

                const netProfit = todayRevenue - todayExpense;
                const realMargin = todayRevenue > 0 ? (netProfit / todayRevenue) * 100 : 0;

                const overdueAmount = overdueInstallments?.reduce((sum, i) => sum + i.amount, 0) || 0;
                const totalAmount = totalInstallments?.reduce((sum, i) => sum + i.amount, 0) || 1;
                const defaultRate = (overdueAmount / totalAmount) * 100;

                // Trends
                const revenueTrend = yesterdayRevenue > 0
                    ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100
                    : 0;

                setKpis({
                    todayRevenue,
                    todayExpense,
                    netProfit,
                    realMargin,
                    defaultRate,
                    revenueTrend,
                    profitTrend: revenueTrend, // Simplificado
                    marginTrend: 0,
                    defaultTrend: 0,
                });

            } catch (err) {
                console.error('Erro ao buscar KPIs:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchKPIs();
    }, [profile?.clinic_id]);

    return { kpis, loading };
};
