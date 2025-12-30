import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface WarRoomData {
    currentRevenue: number;
    monthlyGoal: number;
    progressPercent: number;
    daysInMonth: number;
    daysElapsed: number;
    projectedRevenue: number;
    gap: number;
    status: 'on_track' | 'at_risk' | 'critical' | 'exceeded';
    revenueByCategory: {
        category: string;
        amount: number;
    }[];
}

export const useWarRoom = () => {
    const [data, setData] = useState<WarRoomData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { profile } = useAuth();

    useEffect(() => {
        if (!profile?.clinic_id) return;
        loadWarRoomData();
    }, [profile?.clinic_id]);

    const loadWarRoomData = async () => {
        try {
            setLoading(true);
            const clinicId = profile?.clinic_id;
            if (!clinicId) throw new Error('Clínica não encontrada');

            // 1. Buscar meta mensal da clínica
            const { data: clinicData, error: clinicError } = await supabase
                .from('clinics')
                .select('goals')
                .eq('id', clinicId)
                .single();

            if (clinicError) throw clinicError;

            const monthlyGoal = clinicData?.goals?.monthly_revenue || 50000;

            // 2. Calcular período do mês atual
            const now = new Date();
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
            const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            const daysInMonth = lastDay.getDate();
            const daysElapsed = now.getDate();

            // 3. Buscar receitas do mês atual
            const { data: transactions, error: transError } = await supabase
                .from('transactions')
                .select('amount, category, date')
                .eq('clinic_id', clinicId)
                .eq('type', 'INCOME')
                .gte('date', firstDay.toISOString().split('T')[0])
                .lte('date', now.toISOString().split('T')[0]);

            if (transError) throw transError;

            // 4. Calcular receita atual
            const currentRevenue = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

            // 5. Calcular projeção (baseado no ritmo atual)
            const dailyAverage = daysElapsed > 0 ? currentRevenue / daysElapsed : 0;
            const projectedRevenue = dailyAverage * daysInMonth;

            // 6. Calcular gap e status
            const progressPercent = (currentRevenue / monthlyGoal) * 100;
            const gap = monthlyGoal - currentRevenue;

            let status: WarRoomData['status'] = 'on_track';
            if (progressPercent >= 100) status = 'exceeded';
            else if (progressPercent >= 80) status = 'on_track';
            else if (progressPercent >= 50) status = 'at_risk';
            else status = 'critical';

            // 7. Agrupar por categoria
            const categoryMap = new Map<string, number>();
            transactions?.forEach(t => {
                const current = categoryMap.get(t.category) || 0;
                categoryMap.set(t.category, current + Number(t.amount));
            });

            const revenueByCategory = Array.from(categoryMap.entries())
                .map(([category, amount]) => ({ category, amount }))
                .sort((a, b) => b.amount - a.amount);

            setData({
                currentRevenue,
                monthlyGoal,
                progressPercent,
                daysInMonth,
                daysElapsed,
                projectedRevenue,
                gap,
                status,
                revenueByCategory
            });

        } catch (err: any) {
            console.warn('⚠️ [WARROOM] Falha ao carregar War Room:', err.message);
            // setError(err.message); // Silent fail to protect UI
        } finally {
            setLoading(false);
        }
    };

    return { data, loading, error, refresh: loadWarRoomData };
};
