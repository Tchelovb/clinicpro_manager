import React from 'react';
import { Target, TrendingUp, AlertTriangle, Zap, CheckCircle, ArrowRight } from 'lucide-react';
import { useWarRoom } from '../hooks/useWarRoom';

export const WarRoomCard: React.FC = () => {
    const { data, loading, error } = useWarRoom();

    if (loading) {
        return (
            <div className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-2xl p-6 shadow-2xl animate-pulse h-full min-h-[220px]">
                <div className="h-8 bg-white/20 rounded w-1/2 mb-4"></div>
                <div className="h-24 bg-white/20 rounded"></div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 h-full">
                <p className="text-white">Carregando dados...</p>
            </div>
        );
    }

    const progress = Math.min(100, data.progressPercent);

    return (
        <div className="relative bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl p-6 shadow-xl border border-indigo-800/50 overflow-hidden h-full flex flex-col justify-between group hover:scale-[1.02] transition-all duration-300">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 p-4 opacity-5">
                <Target size={140} className="text-white" />
            </div>

            {/* Header */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-500/20 rounded-xl backdrop-blur-sm border border-indigo-500/30">
                            <Target size={22} className="text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white tracking-tight">Central de Metas</h2>
                            <p className="text-indigo-200/60 text-xs font-medium uppercase tracking-wide">SCR-01-A</p>
                        </div>
                    </div>
                </div>

                <div className="mt-6 mb-2">
                    <div className="flex justify-between items-end mb-2">
                        <div>
                            <span className="text-3xl font-bold text-white tracking-tight">
                                {data.progressPercent.toFixed(0)}%
                            </span>
                            <span className="text-indigo-200 text-xs ml-1 font-medium">atingido</span>
                        </div>
                        <div className="text-right">
                            <p className="text-indigo-200 text-xs mb-0.5 font-medium">Meta Mensal</p>
                            <p className="text-white font-bold text-sm">R$ {data.monthlyGoal.toLocaleString('pt-BR', { notation: 'compact' })}</p>
                        </div>
                    </div>

                    {/* Barra de Progresso Clean */}
                    <div className="w-full bg-slate-700/50 rounded-full h-2.5 overflow-hidden backdrop-blur-sm border border-white/5">
                        <div
                            className="h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r from-indigo-500 to-purple-500 relative shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                            style={{ width: `${progress}%` }}
                        >
                            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Metrics simplified */}
            <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                <div>
                    <p className="text-indigo-200/60 text-[10px] uppercase font-bold tracking-wider mb-0.5">Realizado</p>
                    <p className="text-white font-bold text-lg">R$ {data.currentRevenue.toLocaleString('pt-BR', { notation: 'compact' })}</p>
                </div>

                <button className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-white transition-colors group-hover:translate-x-1 duration-200">
                    Ver Completa <ArrowRight size={14} />
                </button>
            </div>
        </div>
    );
};
