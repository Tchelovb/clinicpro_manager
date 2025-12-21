import React from 'react';
import { TrendingUp, TrendingDown, Target, AlertTriangle, CheckCircle, Zap } from 'lucide-react';
import { useWarRoom } from '../hooks/useWarRoom';

export const WarRoomCard: React.FC = () => {
    const { data, loading, error } = useWarRoom();

    if (loading) {
        return (
            <div className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-2xl p-6 shadow-2xl animate-pulse">
                <div className="h-8 bg-white/20 rounded w-1/2 mb-4"></div>
                <div className="h-24 bg-white/20 rounded"></div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="bg-red-900/50 rounded-2xl p-6 border border-red-500">
                <p className="text-white">Erro ao carregar War Room: {error}</p>
            </div>
        );
    }

    const statusConfig = {
        exceeded: {
            color: 'from-green-600 to-emerald-600',
            icon: CheckCircle,
            iconColor: 'text-green-300',
            label: 'META SUPERADA! 🎉',
            message: 'Parabéns! Você ultrapassou a meta mensal.'
        },
        on_track: {
            color: 'from-blue-600 to-cyan-600',
            icon: TrendingUp,
            iconColor: 'text-blue-300',
            label: 'No Caminho Certo',
            message: 'Ritmo sustentável para atingir a meta.'
        },
        at_risk: {
            color: 'from-yellow-600 to-orange-600',
            icon: AlertTriangle,
            iconColor: 'text-yellow-300',
            label: 'Atenção Necessária',
            message: 'Aceleração necessária para atingir meta.'
        },
        critical: {
            color: 'from-red-600 to-rose-600',
            icon: Zap,
            iconColor: 'text-red-300',
            label: 'MODO CRISE',
            message: 'Ação imediata necessária!'
        }
    };

    const config = statusConfig[data.status];
    const StatusIcon = config.icon;

    return (
        <div className={`relative bg-gradient-to-br ${config.color} rounded-2xl p-6 shadow-2xl overflow-hidden`}>
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-64 h-64">
                    <Target size={256} className="text-white" />
                </div>
            </div>

            {/* Content */}
            <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                            <Target size={32} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">War Room</h2>
                            <p className="text-white/80 text-sm">Milestone R$ 50k</p>
                        </div>
                    </div>
                    <div className={`flex items-center gap-2 px-4 py-2 bg-white/20 rounded-lg backdrop-blur-sm`}>
                        <StatusIcon size={20} className={config.iconColor} />
                        <span className="text-white font-bold text-sm">{config.label}</span>
                    </div>
                </div>

                {/* Main Metrics */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    {/* Receita Atual */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                        <p className="text-white/70 text-xs mb-1">Faturamento Atual</p>
                        <p className="text-white text-3xl font-black">
                            R$ {data.currentRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-white/60 text-xs mt-1">
                            {data.daysElapsed} de {data.daysInMonth} dias
                        </p>
                    </div>

                    {/* Meta */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                        <p className="text-white/70 text-xs mb-1">Meta Mensal</p>
                        <p className="text-white text-3xl font-black">
                            R$ {data.monthlyGoal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-white/60 text-xs mt-1">
                            Gap: R$ {data.gap.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-white font-bold text-sm">Progresso</span>
                        <span className="text-white font-black text-lg">{data.progressPercent.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-4 overflow-hidden">
                        <div
                            className={`h-4 rounded-full transition-all duration-500 ${data.progressPercent >= 100 ? 'bg-gradient-to-r from-green-400 to-emerald-400' :
                                    data.progressPercent >= 80 ? 'bg-gradient-to-r from-blue-400 to-cyan-400' :
                                        data.progressPercent >= 50 ? 'bg-gradient-to-r from-yellow-400 to-orange-400' :
                                            'bg-gradient-to-r from-red-400 to-rose-400'
                                }`}
                            style={{ width: `${Math.min(100, data.progressPercent)}%` }}
                        >
                            <div className="h-full w-full animate-pulse bg-white/20"></div>
                        </div>
                    </div>
                </div>

                {/* Projeção */}
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-white/70 text-xs mb-1">Projeção (Ritmo Atual)</p>
                            <p className="text-white text-xl font-bold">
                                R$ {data.projectedRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                        <div className="text-right">
                            {data.projectedRevenue >= data.monthlyGoal ? (
                                <div className="flex items-center gap-2 text-green-300">
                                    <TrendingUp size={24} />
                                    <span className="font-bold">+{((data.projectedRevenue / data.monthlyGoal - 1) * 100).toFixed(1)}%</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-red-300">
                                    <TrendingDown size={24} />
                                    <span className="font-bold">{((data.projectedRevenue / data.monthlyGoal - 1) * 100).toFixed(1)}%</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Status Message */}
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border-l-4 border-white/50">
                    <p className="text-white text-sm font-medium">{config.message}</p>
                </div>

                {/* Top Categories (Mini) */}
                {data.revenueByCategory.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/20">
                        <p className="text-white/70 text-xs mb-2">Top Categorias</p>
                        <div className="grid grid-cols-3 gap-2">
                            {data.revenueByCategory.slice(0, 3).map((cat, idx) => (
                                <div key={idx} className="bg-white/10 rounded-lg p-2">
                                    <p className="text-white/60 text-[10px] truncate">{cat.category}</p>
                                    <p className="text-white font-bold text-xs">
                                        R$ {cat.amount.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
