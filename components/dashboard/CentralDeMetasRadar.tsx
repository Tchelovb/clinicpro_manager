import React, { useMemo } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useOptimizedPillarScores } from '../../hooks/useOptimizedPillarScores';
import { useAuth } from '../../contexts/AuthContext';

export const CentralDeMetasRadar = () => {
    const { user } = useAuth();
    const clinicId = user?.user_metadata?.clinic_id;

    const { pillarData, loading } = useOptimizedPillarScores(clinicId);

    // Default data for skeleton loading or empty state
    const defaultData = [
        { pilar: 'Atração', A: 0, full: 100 },
        { pilar: 'Conversão', A: 0, full: 100 },
        { pilar: 'Produção', A: 0, full: 100 },
        { pilar: 'Lucro', A: 0, full: 100 },
        { pilar: 'Inovação', A: 0, full: 100 },
        { pilar: 'Retenção', A: 0, full: 100 },
        { pilar: 'Encantamento', A: 0, full: 100 },
        { pilar: 'Gente', A: 0, full: 100 },
        { pilar: 'Processos', A: 0, full: 100 },
        { pilar: 'Compliance', A: 0, full: 100 },
    ];

    const chartData = pillarData && pillarData.length > 0 ? pillarData : defaultData;

    const { dominantPilar, attentionPilar } = useMemo(() => {
        if (!pillarData || pillarData.length === 0) return { dominantPilar: null, attentionPilar: null };

        // Find highest score
        const sorted = [...pillarData].sort((a, b) => b.A - a.A);
        const dominant = sorted[0];

        // Find lowest score
        const attention = [...pillarData].sort((a, b) => a.A - b.A)[0];

        return { dominantPilar: dominant, attentionPilar: attention };
    }, [pillarData]);

    if (loading) {
        return (
            <div className="bg-slate-900 p-6 rounded-2xl shadow-2xl border border-slate-800 h-[500px] flex items-center justify-center">
                <div className="text-blue-500 animate-pulse">Carregando Radar 10x50...</div>
            </div>
        );
    }

    return (
        <div className="bg-slate-900 p-6 rounded-2xl shadow-2xl border border-slate-800">
            <div className="mb-4">
                <h2 className="text-xl font-bold text-white tracking-tight">Radar de Gestão</h2>
                <p className="text-slate-400 text-sm">Visão estratégica dos indicadores da clínica</p>
            </div>

            <div className="h-[400px] min-h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%" minHeight={400}>
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                        <PolarGrid stroke="#334155" />
                        <PolarAngleAxis dataKey="pilar" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                            itemStyle={{ color: '#3b82f6' }}
                        />
                        <Radar
                            name="Clínica"
                            dataKey="A"
                            stroke="#3b82f6"
                            fill="#3b82f6"
                            fillOpacity={0.5}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <span className="block text-blue-400 text-xs font-semibold uppercase">Pilar Dominante</span>
                    <span className="text-lg font-bold text-white text-blue-500">
                        {dominantPilar ? `${dominantPilar.pilar} (${dominantPilar.A})` : '-'}
                    </span>
                </div>
                <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                    <span className="block text-amber-400 text-xs font-semibold uppercase">Ponto de Atenção</span>
                    <span className="text-lg font-bold text-white text-amber-500">
                        {attentionPilar ? `${attentionPilar.pilar} (${attentionPilar.A})` : '-'}
                    </span>
                </div>
            </div>
        </div>
    );
};
