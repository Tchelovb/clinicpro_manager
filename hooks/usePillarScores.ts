import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface PillarScoreData {
    pilar: string;
    A: number;
    full: number;
}

export const usePillarScores = (clinicId: string) => {
    const [pillarData, setPillarData] = useState<PillarScoreData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!clinicId) return;

        const fetchScores = async () => {
            try {
                setLoading(true);
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
                    setPillarData(formatted);
                }
            } catch (err: any) {
                // Silently fail for diagnostics or log warning
                console.warn('⚠️ [RADAR] Falha ao calcular scores (RPC):', err.message);
                // Não setar erro para não quebrar a UI, apenas deixar sem dados
                // setError(err.message); 
            } finally {
                setLoading(false);
            }
        };

        fetchScores();
    }, [clinicId]);

    return { pillarData, loading, error };
};
