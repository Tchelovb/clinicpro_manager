import { useState, useEffect } from 'react';
import { supabase } from '../src/lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export type ViewType = 'comercial' | 'producao' | 'financeiro' | 'operacional' | '360';

interface ViewData {
    data: any[];
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

const VIEW_MAP: Record<ViewType, string> = {
    'comercial': 'view_radar_comercial',
    'producao': 'view_radar_producao',
    'financeiro': 'view_radar_financeiro',
    'operacional': 'view_radar_operacional',
    '360': 'view_radar_360'
};

export const useIntelligenceView = (viewType: ViewType, startDate?: Date, endDate?: Date): ViewData => {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { profile } = useAuth();

    const fetchData = async () => {
        if (!profile?.clinic_id) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const viewName = VIEW_MAP[viewType];
            let query = supabase
                .from(viewName)
                .select('*')
                .eq('clinic_id', profile.clinic_id)
                .order('data_referencia', { ascending: false });

            // Apply date filters if provided
            if (startDate) {
                query = query.gte('data_referencia', startDate.toISOString().split('T')[0]);
            }
            if (endDate) {
                query = query.lte('data_referencia', endDate.toISOString().split('T')[0]);
            }

            const { data: viewData, error: viewError } = await query;

            if (viewError) {
                console.error(`Error fetching ${viewName}:`, viewError);
                setError(viewError.message);
                setData([]);
            } else {
                setData(viewData || []);
            }
        } catch (err: any) {
            console.error('View fetch error:', err);
            setError(err.message || 'Erro desconhecido');
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [viewType, profile?.clinic_id, startDate?.toISOString(), endDate?.toISOString()]);

    return {
        data,
        loading,
        error,
        refresh: fetchData
    };
};

// Hook específico para métricas comerciais
export const useComercialMetrics = (startDate?: Date, endDate?: Date) => {
    const { data, loading, error } = useIntelligenceView('comercial', startDate, endDate);

    const metrics = {
        totalOportunidades: data.length,
        valorPipeline: data.reduce((acc, item) => acc + (item.montante || 0), 0),
        taxaConversao: data.length > 0
            ? (data.filter(item => item.status === 'Aprovado' || item.status === 'APPROVED').length / data.length) * 100
            : 0,
        origemDistribution: data.reduce((acc: any, item) => {
            const origem = item.origem || 'Não Informado';
            acc[origem] = (acc[origem] || 0) + 1;
            return acc;
        }, {})
    };

    return { metrics, data, loading, error };
};

// Hook específico para métricas clínicas
export const useClinicoMetrics = (startDate?: Date, endDate?: Date) => {
    const { data, loading, error } = useIntelligenceView('producao', startDate, endDate);

    const metrics = {
        totalProducao: data.length,
        valorProducao: data.reduce((acc, item) => acc + (item.montante_bruto || 0), 0),
        procedimentosPorProfissional: data.reduce((acc: any, item) => {
            const prof = item.profissional || 'Não Informado';
            if (!acc[prof]) {
                acc[prof] = { count: 0, valor: 0 };
            }
            acc[prof].count += 1;
            acc[prof].valor += (item.montante_bruto || 0);
            return acc;
        }, {}),
        statusDistribution: data.reduce((acc: any, item) => {
            const status = item.status_clinico || 'Não Informado';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {})
    };

    return { metrics, data, loading, error };
};

// Hook específico para métricas financeiras
export const useFinanceiroMetrics = (startDate?: Date, endDate?: Date) => {
    const { data, loading, error } = useIntelligenceView('financeiro', startDate, endDate);

    const metrics = {
        faturamentoRealizado: data
            .filter(item => item.tipo_transacao === 'INCOME' || item.tipo_transacao === 'income')
            .reduce((acc, item) => acc + (item.montante || 0), 0),
        despesasTotais: data
            .filter(item => item.tipo_transacao === 'EXPENSE' || item.tipo_transacao === 'expense')
            .reduce((acc, item) => acc + (item.montante || 0), 0),
        saldoLiquido: 0, // Calculated below
        transacoesPorCategoria: data.reduce((acc: any, item) => {
            const cat = item.categoria || 'Não Informado';
            if (!acc[cat]) {
                acc[cat] = { receita: 0, despesa: 0 };
            }
            if (item.tipo_transacao === 'INCOME' || item.tipo_transacao === 'income') {
                acc[cat].receita += (item.montante || 0);
            } else {
                acc[cat].despesa += (item.montante || 0);
            }
            return acc;
        }, {})
    };

    metrics.saldoLiquido = metrics.faturamentoRealizado - metrics.despesasTotais;

    return { metrics, data, loading, error };
};
