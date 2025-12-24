import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface PillarScoreData {
    pilar: string;
    A: number;
    full: number;
}

interface PillarScoresResponse {
    atracao: number;
    conversao: number;
    producao: number;
    lucro: number;
    inovacao: number;
    retencao: number;
    encantamento: number;
    gente: number;
    processos: number;
    compliance: number;
    error?: string;
}

const PILLAR_NAMES = [
    'Atração', 'Conversão', 'Produção', 'Lucro', 'Inovação',
    'Retenção', 'Encantamento', 'Gente', 'Processos', 'Compliance'
] as const;

const formatPillarData = (data: PillarScoresResponse): PillarScoreData[] => {
    return [
        { pilar: 'Atração', A: data.atracao || 0, full: 100 },
        { pilar: 'Conversão', A: data.conversao || 0, full: 100 },
        { pilar: 'Produção', A: data.producao || 80, full: 100 },
        { pilar: 'Lucro', A: data.lucro || 0, full: 100 },
        { pilar: 'Inovação', A: data.inovacao || 0, full: 100 },
        { pilar: 'Retenção', A: data.retencao || 70, full: 100 },
        { pilar: 'Encantamento', A: data.encantamento || 90, full: 100 },
        { pilar: 'Gente', A: data.gente || 85, full: 100 },
        { pilar: 'Processos', A: data.processos || 75, full: 100 },
        { pilar: 'Compliance', A: data.compliance || 0, full: 100 }
    ];
};

const fetchPillarScores = async (clinicId: string): Promise<PillarScoreData[]> => {
    if (!clinicId) {
        throw new Error('Clinic ID is required');
    }

    const { data, error } = await supabase
        .rpc('calculate_pillar_scores', { p_clinic_id: clinicId });

    if (error) {
        console.error('Error fetching pillar scores:', error);
        throw error;
    }

    if (data?.error) {
        console.error('RPC function error:', data.error);
        throw new Error(data.error);
    }

    return formatPillarData(data);
};

export const useOptimizedPillarScores = (clinicId: string) => {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['pillar-scores', clinicId],
        queryFn: () => fetchPillarScores(clinicId),
        enabled: !!clinicId,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
        refetchOnWindowFocus: true,
        refetchOnMount: false,
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    });

    const refresh = () => {
        queryClient.invalidateQueries({ queryKey: ['pillar-scores', clinicId] });
    };

    return {
        pillarData: query.data || [],
        loading: query.isLoading,
        error: query.error?.message || null,
        isRefetching: query.isRefetching,
        lastUpdated: query.dataUpdatedAt,
        refresh,
    };
};
