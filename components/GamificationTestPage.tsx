import React from 'react';
import { useGameification } from '../hooks/useGameification';
import { Brain, TrendingUp, Heart, Award, Zap, Target } from 'lucide-react';

export const GamificationTestPage: React.FC = () => {
    const {
        progression,
        operations,
        dashboard,
        loading,
        error,
        completeOperation,
        addXP,
        updateHealth,
        getLevelInfo,
        getHealthStatus
    } = useGameification();

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <Brain size={48} className="animate-pulse text-purple-600 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">Carregando Sistema de Gamificação...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-xl border border-red-200 dark:border-red-800">
                    <p className="text-red-600 dark:text-red-400">Erro: {error}</p>
                </div>
            </div>
        );
    }

    const levelInfo = progression ? getLevelInfo(progression.current_level) : null;
    const healthStatus = progression ? getHealthStatus(progression.clinic_health_score) : null;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 md:pb-0">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white p-6 shadow-lg">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Brain size={32} className="animate-pulse" />
                        BOS 8.0 - Sistema de Gamificação
                    </h1>
                    <p className="text-purple-100 mt-2">Teste de Fundação - Fase 1</p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-6 space-y-6">

                {/* Progressão do Usuário */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                        <Award size={24} className="text-purple-600" />
                        Progressão do Usuário
                    </h2>

                    {progression ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Nível e XP */}
                            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-purple-600 dark:text-purple-400 font-bold">NÍVEL</span>
                                    <span className="text-3xl font-black text-purple-700 dark:text-purple-300">{progression.current_level}</span>
                                </div>
                                <p className="text-sm font-bold text-gray-800 dark:text-white mb-1">{levelInfo?.title}</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">{levelInfo?.description}</p>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-gray-600 dark:text-gray-400">XP Total</span>
                                        <span className="font-bold text-gray-800 dark:text-white">{progression.total_xp.toLocaleString()}</span>
                                    </div>
                                    {dashboard && (
                                        <>
                                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                <div
                                                    className="bg-gradient-to-r from-purple-600 to-indigo-600 h-2 rounded-full transition-all"
                                                    style={{
                                                        width: `${Math.min(100, (progression.total_xp / (progression.total_xp + dashboard.xp_to_next_level)) * 100)}%`
                                                    }}
                                                />
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-gray-600 dark:text-gray-400">Próximo Nível</span>
                                                <span className="font-bold text-purple-600 dark:text-purple-400">
                                                    {dashboard.xp_to_next_level > 0 ? `${dashboard.xp_to_next_level.toLocaleString()} XP` : 'MAX'}
                                                </span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* ClinicHealth */}
                            <div className={`bg-gradient-to-br p-4 rounded-lg border ${healthStatus?.status === 'excellent' ? 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800' :
                                    healthStatus?.status === 'good' ? 'from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-yellow-200 dark:border-yellow-800' :
                                        healthStatus?.status === 'warning' ? 'from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-800' :
                                            'from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-red-200 dark:border-red-800'
                                }`}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className={`text-sm font-bold ${healthStatus?.status === 'excellent' ? 'text-green-600 dark:text-green-400' :
                                            healthStatus?.status === 'good' ? 'text-yellow-600 dark:text-yellow-400' :
                                                healthStatus?.status === 'warning' ? 'text-orange-600 dark:text-orange-400' :
                                                    'text-red-600 dark:text-red-400'
                                        }`}>CLINICHEALTH</span>
                                    <span className="text-3xl font-black text-gray-800 dark:text-white">{progression.clinic_health_score}</span>
                                </div>
                                <p className="text-sm font-bold text-gray-800 dark:text-white mb-3">{healthStatus?.label}</p>

                                <div className="space-y-1 text-xs">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">📱 Marketing</span>
                                        <span className="font-bold">{progression.health_marketing}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">💰 Vendas</span>
                                        <span className="font-bold">{progression.health_sales}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">⚕️ Clínico</span>
                                        <span className="font-bold">{progression.health_clinical}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">⚙️ Operacional</span>
                                        <span className="font-bold">{progression.health_operational}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">💵 Financeiro</span>
                                        <span className="font-bold">{progression.health_financial}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Estatísticas */}
                            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                                <div className="flex items-center gap-2 mb-3">
                                    <TrendingUp size={20} className="text-blue-600" />
                                    <span className="text-sm font-bold text-gray-800 dark:text-white">ESTATÍSTICAS</span>
                                </div>

                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Operações Completadas</span>
                                        <span className="font-bold text-gray-800 dark:text-white">{progression.total_operations_completed}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Receita Gerada</span>
                                        <span className="font-bold text-green-600 dark:text-green-400">
                                            R$ {progression.total_revenue_generated.toLocaleString('pt-BR')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Streak Atual</span>
                                        <span className="font-bold text-orange-600 dark:text-orange-400">
                                            🔥 {progression.current_streak}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Melhor Streak</span>
                                        <span className="font-bold text-purple-600 dark:text-purple-400">
                                            ⭐ {progression.best_streak}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Milestones 50K</span>
                                        <span className="font-bold text-yellow-600 dark:text-yellow-400">
                                            🏆 {progression.milestone_50k_count}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-500">Nenhuma progressão encontrada. Criando...</p>
                    )}
                </div>

                {/* Operações Táticas */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                        <Target size={24} className="text-red-600" />
                        Operações Táticas Ativas
                        {dashboard && (
                            <span className="ml-auto text-sm bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-3 py-1 rounded-full">
                                {dashboard.active_operations} ativas
                            </span>
                        )}
                    </h2>

                    {operations.length > 0 ? (
                        <div className="space-y-3">
                            {operations.map(op => (
                                <div
                                    key={op.id}
                                    className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${op.priority === 'critical' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
                                                        op.priority === 'high' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400' :
                                                            op.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' :
                                                                'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                                                    }`}>
                                                    {op.priority.toUpperCase()}
                                                </span>
                                                <span className="px-2 py-0.5 rounded text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400">
                                                    {op.type.replace('_', ' ').toUpperCase()}
                                                </span>
                                            </div>
                                            <h3 className="font-bold text-gray-800 dark:text-white">{op.title}</h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{op.description}</p>
                                            <div className="flex gap-4 mt-2 text-xs">
                                                <span className="text-green-600 dark:text-green-400 font-bold">
                                                    💰 R$ {op.financial_impact.toLocaleString('pt-BR')}
                                                </span>
                                                <span className="text-purple-600 dark:text-purple-400 font-bold">
                                                    ⚡ +{op.xp_reward} XP
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => completeOperation(op.id)}
                                            className="ml-4 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-bold hover:from-green-700 hover:to-emerald-700 transition-all transform hover:scale-105"
                                        >
                                            Completar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Zap size={48} className="text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                            <p className="text-gray-500 dark:text-gray-400">Nenhuma operação ativa no momento</p>
                            <p className="text-sm text-gray-400 dark:text-gray-600 mt-1">
                                Operações serão geradas automaticamente a partir de ai_insights
                            </p>
                        </div>
                    )}
                </div>

                {/* Ações de Teste */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Ações de Teste</h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button
                            onClick={() => addXP(500, 'test')}
                            className="px-4 py-3 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 transition-colors"
                        >
                            + 500 XP (Teste)
                        </button>

                        <button
                            onClick={() => updateHealth('marketing', 10)}
                            className="px-4 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors"
                        >
                            + 10 HP Marketing
                        </button>

                        <button
                            onClick={() => updateHealth('financial', -15)}
                            className="px-4 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors"
                        >
                            - 15 HP Financeiro
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default GamificationTestPage;
