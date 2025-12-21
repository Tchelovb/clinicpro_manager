import React from 'react';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    Users,
    Target,
    Calendar,
    AlertCircle,
    CheckCircle,
    Clock,
    Flame
} from 'lucide-react';
import { useExecutiveKPIs, useBudgetFunnel, useROIByChannel } from '../hooks/useIntelligenceReports';

export const IntelligenceDashboard: React.FC = () => {
    const { data: kpis, isLoading: loadingKPIs } = useExecutiveKPIs();
    const { data: hotBudgets } = useBudgetFunnel('QUENTE');
    const { data: roiChannels } = useROIByChannel();

    if (loadingKPIs) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    if (!kpis) return null;

    // Calcular variações
    const profit = kpis.monthly_revenue - kpis.monthly_expenses;
    const profitMargin = kpis.monthly_revenue > 0
        ? (profit / kpis.monthly_revenue) * 100
        : 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                    Intelligence Dashboard
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Visão 360° em tempo real
                </p>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Receita */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Receita do Mês
                        </span>
                        <DollarSign className="text-green-600" size={20} />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        R$ {kpis.monthly_revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                        {profit >= 0 ? (
                            <>
                                <TrendingUp className="text-green-600" size={16} />
                                <span className="text-xs text-green-600 font-medium">
                                    Margem: {profitMargin.toFixed(1)}%
                                </span>
                            </>
                        ) : (
                            <>
                                <TrendingDown className="text-red-600" size={16} />
                                <span className="text-xs text-red-600 font-medium">
                                    Prejuízo
                                </span>
                            </>
                        )}
                    </div>
                </div>

                {/* Despesas */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Despesas do Mês
                        </span>
                        <AlertCircle className="text-orange-600" size={20} />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        R$ {kpis.monthly_expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Lucro Líquido: R$ {profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                </div>

                {/* Leads Ativos */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Leads Ativos
                        </span>
                        <Users className="text-blue-600" size={20} />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {kpis.active_leads}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Conversão: {kpis.conversion_rate.toFixed(1)}%
                    </div>
                </div>

                {/* Orçamentos Pendentes */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Em Negociação
                        </span>
                        <Target className="text-purple-600" size={20} />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        R$ {kpis.pending_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        {kpis.pending_budgets} orçamentos
                    </div>
                </div>
            </div>

            {/* Orçamentos Quentes */}
            {hotBudgets && hotBudgets.length > 0 && (
                <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl p-6 border border-orange-200 dark:border-orange-800">
                    <div className="flex items-center gap-2 mb-4">
                        <Flame className="text-orange-600" size={24} />
                        <h3 className="text-lg font-bold text-orange-900 dark:text-orange-300">
                            🔥 Orçamentos Quentes (≤3 dias)
                        </h3>
                    </div>
                    <div className="space-y-3">
                        {hotBudgets.slice(0, 5).map((budget) => (
                            <div
                                key={budget.budget_id}
                                className="bg-white dark:bg-slate-800 rounded-lg p-4 flex items-center justify-between border border-orange-100 dark:border-orange-900"
                            >
                                <div className="flex-1">
                                    <p className="font-bold text-gray-900 dark:text-white">
                                        {budget.patient_name}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {budget.patient_phone} • {Math.floor(budget.days_in_funnel)} dias no funil
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold text-green-600 dark:text-green-400">
                                        R$ {budget.total_value.toLocaleString('pt-BR')}
                                    </p>
                                    <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                                        {budget.temperature}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ROI por Canal */}
            {roiChannels && roiChannels.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                        📊 ROI por Canal de Marketing
                    </h3>
                    <div className="space-y-3">
                        {roiChannels
                            .sort((a: any, b: any) => b.total_revenue - a.total_revenue)
                            .map((channel: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-900 rounded-lg">
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {channel.channel}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {channel.total_leads} leads • {channel.converted_leads} convertidos
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-green-600 dark:text-green-400">
                                            R$ {channel.total_revenue.toLocaleString('pt-BR')}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Conv: {channel.conversion_rate.toFixed(1)}%
                                        </p>
                                    </div>
                                </div>
                            ))
                        }
                    </div>
                </div>
            )}

            {/* Footer Stats */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-2">
                        <Users className="text-blue-600" size={20} />
                        <span className="text-sm font-medium text-blue-900 dark:text-blue-300">
                            Base de Pacientes
                        </span>
                    </div>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">
                        {kpis.total_patients}
                    </p>
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center gap-2 mb-2">
                        <Calendar className="text-purple-600" size={20} />
                        <span className="text-sm font-medium text-purple-900 dark:text-purple-300">
                            Próximos 7 Dias
                        </span>
                    </div>
                    <p className="text-2xl font-bold text-purple-900 dark:text-purple-300">
                        {kpis.appointments_next_7_days} consultas
                    </p>
                </div>
            </div>
        </div>
    );
};
