import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, ArrowUpRight, TrendingUp, TrendingDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePillarScores } from '../hooks/usePillarScores';

// Helper for color coding score
const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-amber-500';
    return 'text-rose-500';
};

const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-emerald-500/10 border-emerald-500/20';
    if (score >= 60) return 'bg-amber-500/10 border-amber-500/20';
    return 'bg-rose-500/10 border-rose-500/20';
};

const ClinicHealthScoreCard: React.FC = () => {
    const navigate = useNavigate();
    const { profile } = useAuth();
    const { pillarData, loading } = usePillarScores(profile?.clinic_id || '');

    const healthScore = useMemo(() => {
        if (!pillarData || pillarData.length === 0) return 0;
        const total = pillarData.reduce((acc, curr) => acc + curr.A, 0);
        return Math.round(total / pillarData.length);
    }, [pillarData]);

    // Mock trend for now (will be real later)
    const trend = 'up'; // or 'down'

    return (
        <div
            onClick={() => navigate('/clinichealth')}
            className="relative bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden cursor-pointer group hover:border-emerald-500/50 hover:shadow-md transition-all flex flex-col justify-between h-full"
        >
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity duration-500">
                <Activity size={120} />
            </div>

            {/* Header */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl border ${getScoreBg(healthScore)} transition-colors`}>
                            <Activity size={20} className={getScoreColor(healthScore)} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white group-hover:text-emerald-500 transition-colors">
                                Health Score
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">IVC - Índice de Valor Clínico</p>
                        </div>
                    </div>
                    {/* Drill-down Icon */}
                    <div className="p-2 rounded-full bg-slate-50 dark:bg-slate-700 text-slate-400 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                        <ArrowUpRight size={16} />
                    </div>
                </div>

                {/* Big Number */}
                <div className="flex flex-col items-center justify-center my-2 relative">
                    {loading ? (
                        <div className="animate-pulse flex flex-col items-center gap-2">
                            <div className="h-12 w-24 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                            <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded-md"></div>
                        </div>
                    ) : (
                        <>
                            <div className={`text-5xl font-black tracking-tighter transition-all duration-500 ${getScoreColor(healthScore)}`}>
                                {healthScore}
                            </div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Pontos BOS</span>

                            {/* Trend Indicator */}
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden lg:flex flex-col items-end opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-x-2 group-hover:translate-x-0">
                                {trend === 'up' ? (
                                    <div className="flex items-center text-emerald-500 text-xs font-bold bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 rounded-full">
                                        <TrendingUp size={12} className="mr-1" /> +2.4%
                                    </div>
                                ) : (
                                    <div className="flex items-center text-rose-500 text-xs font-bold bg-rose-100 dark:bg-rose-900/30 px-2 py-1 rounded-full">
                                        <TrendingDown size={12} className="mr-1" /> -1.2%
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 text-center">
                <span className="text-xs text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
                    Baseado em 10 pilares estratégicos
                </span>
            </div>
        </div>
    );
};

export default ClinicHealthScoreCard;
