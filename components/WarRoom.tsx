import React, { useState, useMemo, useEffect } from 'react';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    Users,
    Target,
    Flame,
    Brain,
    Download,
    RefreshCw
} from 'lucide-react';
import { StrategyFilterBar } from './StrategyFilterBar';
import { useStrategyFilter, applyClientSideFilter } from '../hooks/useStrategyFilter';
import {
    useExecutiveKPIs,
    useBudgetFunnel,
    useCashFlow,
    useLeadsROI,
    useROIByChannel
} from '../hooks/useIntelligenceReports';
// import { useBOSChat } from '../hooks/useBOSChat'; // Temporariamente desabilitado

export const WarRoom: React.FC = () => {
    const [showBOSAnalysis, setShowBOSAnalysis] = useState(false);
    const { filters } = useStrategyFilter();
    // const { sendMessage, isProcessing } = useBOSChat(); // Temporariamente desabilitado
    const isProcessing = false; // Mock

    // Buscar dados das views
    const { data: kpis, isLoading: loadingKPIs, refetch: refetchKPIs } = useExecutiveKPIs();
    const { data: allBudgets, refetch: refetchBudgets } = useBudgetFunnel();
    const { data: cashFlow, refetch: refetchCashFlow } = useCashFlow(
        filters.dateRange.start,
        filters.dateRange.end
    );
    const { data: leadsROI, refetch: refetchLeads } = useLeadsROI();
    const { data: roiChannels, refetch: refetchROI } = useROIByChannel();

    // 🔥 REATIVIDADE: Atualizar dados quando filtros mudarem
    useEffect(() => {
        console.log('🎯 Filtros mudaram! Atualizando dados...', filters);
        refetchKPIs();
        refetchBudgets();
        refetchCashFlow();
        refetchLeads();
        refetchROI();
    }, [filters.dateRange.start, filters.dateRange.end, filters.minValue, filters.maxValue, filters.budgetTemperature]);

    // Callback para quando filtro mudar
    const handleFilterChange = () => {
        console.log('🔥 War Room: Filtros aplicados, dados sendo recalculados...');
    };

    // Aplicar filtros do lado do cliente
    const filteredBudgets = useMemo(() => {
        if (!allBudgets) return [];
        return applyClientSideFilter(allBudgets, filters, {
            dateField: 'created_at',
            valueField: 'total_value',
            temperatureField: 'temperature',
        });
    }, [allBudgets, filters]);

    const filteredCashFlow = useMemo(() => {
        if (!cashFlow) return [];
        return applyClientSideFilter(cashFlow, filters, {
            dateField: 'date',
            valueField: 'amount',
        });
    }, [cashFlow, filters]);

    const filteredLeads = useMemo(() => {
        if (!leadsROI) return [];
        return applyClientSideFilter(leadsROI, filters, {
            dateField: 'lead_created',
            sourceField: 'source',
        });
    }, [leadsROI, filters]);

    // KPIs Dinâmicos (recalcular com base nos filtros)
    const dynamicKPIs = useMemo(() => {
        const totalRevenue = filteredCashFlow
            .filter(f => f.flow_type === 'ENTRADA')
            .reduce((acc, f) => acc + f.amount, 0);

        const totalExpenses = filteredCashFlow
            .filter(f => f.flow_type === 'SAÍDA')
            .reduce((acc, f) => acc + f.amount, 0);

        const totalBudgetValue = filteredBudgets.reduce((acc, b) => acc + b.total_value, 0);

        const convertedLeads = filteredLeads.filter(l => l.conversion_status === 'CONVERTEU').length;
        const conversionRate = filteredLeads.length > 0
            ? (convertedLeads / filteredLeads.length) * 100
            : 0;

        console.log('📊 KPIs Recalculados:', {
            revenue: totalRevenue,
            expenses: totalExpenses,
            budgetValue: totalBudgetValue,
            conversionRate
        });

        return {
            revenue: totalRevenue,
            expenses: totalExpenses,
            profit: totalRevenue - totalExpenses,
            budgetValue: totalBudgetValue,
            budgetCount: filteredBudgets.length,
            leadsCount: filteredLeads.length,
            conversionRate,
        };
    }, [filteredCashFlow, filteredBudgets, filteredLeads]);

    // Pedir análise ao BOS
    const requestBOSAnalysis = async () => {
        // TODO: Re-enable BOS integration
        console.log('BOS Analysis requested - Feature temporarily disabled');
        // await sendMessage(context);
        // setShowBOSAnalysis(true);
    };

    const refreshAllData = () => {
        console.log('🔄 Atualizando todos os dados manualmente...');
        refetchKPIs();
        refetchBudgets();
        refetchCashFlow();
        refetchLeads();
        refetchROI();
    };

    if (loadingKPIs) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        🎯 Centro de Comando
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        War Room • Análise Estratégica em Tempo Real
                    </p>
                </div>
                <button
                    onClick={refreshAllData}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                >
                    <RefreshCw size={16} />
                    Atualizar Dados
                </button>
            </div>

            {/* Super Filtro Estratégico */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700 shadow-lg">
                <StrategyFilterBar onFilterChange={handleFilterChange} />
            </div>

            {/* KPIs Dinâmicos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Receita Filtrada */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-green-700 dark:text-green-300">
                            Receita (Filtrada)
                        </span>
                        <DollarSign className="text-green-600" size={20} />
                    </div>
                    <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                        R$ {dynamicKPIs.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                        {dynamicKPIs.profit >= 0 ? (
                            <TrendingUp className="text-green-600" size={16} />
                        ) : (
                            <TrendingDown className="text-red-600" size={16} />
                        )}
                        <span className="text-xs text-green-700 dark:text-green-300 font-medium">
                            Lucro: R$ {dynamicKPIs.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                </div>

                {/* Despesas Filtradas */}
                <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl p-6 border border-orange-200 dark:border-orange-800">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                            Despesas (Filtradas)
                        </span>
                        <TrendingDown className="text-orange-600" size={20} />
                    </div>
                    <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                        R$ {dynamicKPIs.expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-orange-700 dark:text-orange-300 mt-2">
                        {filteredCashFlow.filter(f => f.flow_type === 'SAÍDA').length} transações
                    </div>
                </div>

                {/* Orçamentos Filtrados */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                            Em Negociação
                        </span>
                        <Target className="text-purple-600" size={20} />
                    </div>
                    <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                        R$ {dynamicKPIs.budgetValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-purple-700 dark:text-purple-300 mt-2">
                        {dynamicKPIs.budgetCount} orçamentos
                    </div>
                </div>

                {/* Leads Filtrados */}
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                            Conversão
                        </span>
                        <Users className="text-blue-600" size={20} />
                    </div>
                    <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                        {dynamicKPIs.conversionRate.toFixed(1)}%
                    </div>
                    <div className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                        {dynamicKPIs.leadsCount} leads analisados
                    </div>
                </div>
            </div>

            {/* BOS Neural Overlay */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                            <Brain className="text-white" size={28} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">BOS Neural Overlay</h3>
                            <p className="text-sm text-purple-100">
                                Análise estratégica do contexto filtrado
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={requestBOSAnalysis}
                        disabled={isProcessing}
                        className="px-6 py-3 bg-white text-purple-600 font-bold rounded-lg hover:bg-purple-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isProcessing ? (
                            <>
                                <RefreshCw className="animate-spin" size={16} />
                                Analisando...
                            </>
                        ) : (
                            <>
                                <Brain size={16} />
                                Pedir Análise ao BOS
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Tabelas Detalhadas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Orçamentos Filtrados */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            💎 Orçamentos ({filteredBudgets.length})
                        </h3>
                        <button className="text-sm text-purple-600 hover:text-purple-700">
                            <Download size={16} />
                        </button>
                    </div>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {filteredBudgets.slice(0, 10).map((budget) => (
                            <div
                                key={budget.budget_id}
                                className="p-3 bg-gray-50 dark:bg-slate-900 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {budget.patient_name}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {budget.patient_phone} • {Math.floor(budget.days_in_funnel)} dias
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-green-600 dark:text-green-400">
                                            R$ {budget.total_value.toLocaleString('pt-BR')}
                                        </p>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${budget.temperature === 'QUENTE'
                                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                            : budget.temperature === 'MORNO'
                                                ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                                                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                            }`}>
                                            {budget.temperature}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Fluxo de Caixa Filtrado */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            💰 Fluxo de Caixa ({filteredCashFlow.length})
                        </h3>
                        <button className="text-sm text-purple-600 hover:text-purple-700">
                            <Download size={16} />
                        </button>
                    </div>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {filteredCashFlow.slice(0, 10).map((transaction) => (
                            <div
                                key={transaction.id}
                                className="p-3 bg-gray-50 dark:bg-slate-900 rounded-lg"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                                            {transaction.description}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {new Date(transaction.date).toLocaleDateString('pt-BR')} • {transaction.category}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-bold ${transaction.flow_type === 'ENTRADA'
                                            ? 'text-green-600 dark:text-green-400'
                                            : 'text-red-600 dark:text-red-400'
                                            }`}>
                                            {transaction.flow_type === 'ENTRADA' ? '+' : '-'} R$ {transaction.amount.toLocaleString('pt-BR')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
