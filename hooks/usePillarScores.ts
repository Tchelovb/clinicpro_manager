import { useQuery } from '@tanstack/react-query';
import { supabase } from '../src/lib/supabase';

export interface PillarScoreData {
    pilar: string;
    A: number;
    full: number;
}

export const usePillarScores = (clinicId: string, enabled: boolean = true) => {
    const query = useQuery({
        queryKey: ['pillar-scores', clinicId],
        queryFn: async (): Promise<PillarScoreData[]> => {
            // Chama a função mestra que calcula as 50 sentinelas
            const { data, error } = await supabase
                .rpc('calculate_pillar_scores', { p_clinic_id: clinicId });

            if (error) throw error;

            if (data) {
                // Formata os campos para o padrão do Radar Chart
                // Ensure we handle potential missing keys or nulls gracefully with defaults
                const formatted = [
                    { pilar: 'Atração', A: data.atracao || 0, full: 100 },
                    { pilar: 'Conversão', A: data.conversao || 0, full: 100 },
                    { pilar: 'Produção', A: data.producao || 80, full: 100 }, // Default logic from request
                    { pilar: 'Lucro', A: data.lucro || 0, full: 100 },
                    { pilar: 'Inovação', A: data.inovacao || 0, full: 100 },
                    { pilar: 'Retenção', A: data.retencao || 70, full: 100 },
                    { pilar: 'Encantamento', A: data.encantamento || 90, full: 100 },
                    { pilar: 'Gente', A: data.gente || 85, full: 100 },
                    { pilar: 'Processos', A: data.processos || 75, full: 100 },
                    { pilar: 'Compliance', A: data.compliance || 0, full: 100 }
                ];
                return formatted;
            }

            return [];
        },
        enabled: enabled && !!clinicId,
        staleTime: 5 * 60 * 1000, // 5 minutos
        retry: 3,
    });

    return {
        pillarData: query.data || [],
        loading: query.isLoading,
        error: query.error ? String(query.error) : null
    };
};
