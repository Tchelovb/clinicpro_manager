import React from 'react';
import { useFinancialKPIs } from '../../hooks/useFinancialData';
import { KPICard } from './KPICard';
import { ProfitPerMinuteDashboard } from './ProfitPerMinuteDashboard';
import { DollarSign, TrendingUp, Percent, AlertTriangle } from 'lucide-react';

/**
 * DashboardBI
 * 
 * Dashboard de Business Intelligence Financeiro
 * - KPIs principais (Faturamento, Lucro, Margem, Inadimplência)
 * - Lucro por Minuto (High Ticket Analysis)
 * - Gráficos interativos (futuro)
 * 
 * Design: Apple + Nubank style
 */
export const DashboardBI: React.FC = () => {
    const { kpis, loading } = useFinancialKPIs();

    if (loading) {
        return (
            <div className="p-6 space-y-6">
                {/* KPIs Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div
                            key={i}
                            className="bg-card rounded-xl p-6 border border-gray-200 dark:border-gray-800 animate-pulse"
                        >
                            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
                            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                        </div>
                    ))}
                </div>

                {/* Profit per Minute Skeleton */}
                <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl p-6 h-64 animate-pulse"></div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Dashboard BI
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Visão geral de performance financeira e lucratividade
                </p>
            </div>

            {/* KPIs Principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Faturamento Hoje */}
                <KPICard
                    title="Faturamento Hoje"
                    value={`R$ ${kpis.todayRevenue.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    })}`}
                    icon={DollarSign}
                    color="emerald"
                    trend={kpis.revenueTrend}
                    subtitle="Receitas do dia"
                />

                {/* Lucro Líquido */}
                <KPICard
                    title="Lucro Líquido"
                    value={`R$ ${kpis.netProfit.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    })}`}
                    icon={TrendingUp}
                    color="blue"
                    trend={kpis.profitTrend}
                    subtitle="Receita - Despesas"
                />

                {/* Margem Real */}
                <KPICard
                    title="Margem Real"
                    value={`${kpis.realMargin.toFixed(1)}%`}
                    icon={Percent}
                    color="violet"
                    trend={kpis.marginTrend}
                    subtitle="Lucro / Faturamento"
                />

                {/* Inadimplência */}
                <KPICard
                    title="Inadimplência"
                    value={`${kpis.defaultRate.toFixed(1)}%`}
                    icon={AlertTriangle}
                    color={kpis.defaultRate > 10 ? 'red' : 'amber'}
                    trend={kpis.defaultTrend}
                    subtitle="Parcelas vencidas"
                />
            </div>

            {/* Lucro por Minuto (High Ticket) */}
            <ProfitPerMinuteDashboard />

            {/* Gráficos (Placeholder para futuro) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Receita vs Despesa */}
                <div className="bg-card rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                        Receita vs Despesa (30 dias)
                    </h3>
                    <div className="h-64 flex items-center justify-center text-gray-400">
                        <div className="text-center">
                            <TrendingUp size={48} className="mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Gráfico em desenvolvimento</p>
                        </div>
                    </div>
                </div>

                {/* Evolução de Margem */}
                <div className="bg-card rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                        Evolução de Margem (30 dias)
                    </h3>
                    <div className="h-64 flex items-center justify-center text-gray-400">
                        <div className="text-center">
                            <Percent size={48} className="mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Gráfico em desenvolvimento</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Insights Rápidos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Melhor Dia */}
                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-lg p-4">
                    <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100 mb-1">
                        🏆 Melhor Dia do Mês
                    </p>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300">
                        Em desenvolvimento - Análise histórica
                    </p>
                </div>

                {/* Meta do Mês */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                        🎯 Meta do Mês
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                        Configure metas em Configurações
                    </p>
                </div>

                {/* Alerta de Caixa */}
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4">
                    <p className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-1">
                        ⚠️ Atenção
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                        {kpis.defaultRate > 10
                            ? 'Inadimplência acima de 10%'
                            : 'Tudo sob controle'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default DashboardBI;
