import React, { useState } from 'react';
import { Target, TrendingUp, DollarSign, Users, Calendar, Edit2, Save, X, ExternalLink, Award, Activity } from 'lucide-react';

interface WarRoomTabProps {
    goals: any;
    kpis: any;
    period: string;
}

export const WarRoomTab: React.FC<WarRoomTabProps> = ({ goals, kpis, period }) => {
    const [editMode, setEditMode] = useState(false);
    const [simulatedRevenue, setSimulatedRevenue] = useState(kpis.totalRevenue);
    const [simulatedExpense, setSimulatedExpense] = useState(kpis.totalExpense);

    const simulatedNet = simulatedRevenue - simulatedExpense;
    const simulatedMargin = simulatedRevenue > 0 ? (simulatedNet / simulatedRevenue) * 100 : 0;

    // Goal Card - EXACT SAME STYLE AS ALERTS
    const GoalCard = ({ title, icon: Icon, current, target, unit = 'R$', color, category }: any) => {
        const percentage = target > 0 ? (current / target) * 100 : 0;
        const gap = Math.max(0, target - current);
        const isOnTrack = percentage >= 80;

        const borderColor = isOnTrack ? 'border-green-500' : 'border-orange-500';
        const bgColor = isOnTrack ? 'bg-white dark:bg-gray-800' : 'bg-white dark:bg-gray-800';

        return (
            <div className={`border-l-4 ${borderColor} rounded-lg p-6 shadow-sm hover:shadow-md transition-all ${bgColor}`}>
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                        <div className="mt-1">
                            <Icon size={24} className={isOnTrack ? 'text-green-600' : 'text-orange-600'} />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${isOnTrack ? 'bg-green-600 text-white' : 'bg-orange-600 text-white'}`}>
                                    {percentage.toFixed(0)}%
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {new Date().toLocaleDateString('pt-BR')}
                                </span>
                                {category && (
                                    <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                                        {category}
                                    </span>
                                )}
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                {title}
                            </h3>

                            <div className="space-y-2 mb-3">
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">Realizado:</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                        {unit}{current.toLocaleString('pt-BR')}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">Meta:</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                        {unit}{target.toLocaleString('pt-BR')}
                                    </span>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden mb-2">
                                <div
                                    className={`h-full transition-all duration-500 ${isOnTrack ? 'bg-green-500' : 'bg-orange-500'}`}
                                    style={{ width: `${Math.min(percentage, 100)}%` }}
                                />
                            </div>

                            <p className="text-gray-700 dark:text-gray-300 mb-3">
                                {gap > 0
                                    ? `Faltam ${unit}${gap.toLocaleString('pt-BR')} para atingir a meta.`
                                    : `Meta atingida! ${isOnTrack ? '✓' : ''}`
                                }
                            </p>

                            {/* Action Button */}
                            <div className="flex gap-2 mt-4">
                                <button
                                    onClick={() => console.log('Ver detalhes:', title)}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                                >
                                    <ExternalLink size={16} />
                                    Ver Detalhes
                                </button>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => console.log('Editar meta:', title)}
                        className="ml-4 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="Editar meta"
                    >
                        <Edit2 size={20} className="text-gray-600 dark:text-gray-400" />
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-4 animate-in fade-in">
            {/* Header Stats - Same as Alerts */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <p className="text-sm text-green-600 dark:text-green-400 font-medium mb-1">Metas Atingidas</p>
                    <p className="text-3xl font-bold text-green-700 dark:text-green-300">
                        {[
                            kpis.totalRevenue >= (goals.monthly_revenue || 100000),
                            kpis.netResult >= (goals.monthly_net_result || 50000),
                            kpis.totalLeads >= (goals.new_patients_per_month || 50),
                            kpis.conversionRate >= (goals.conversion_rate_target || 30),
                            kpis.totalAppts >= (goals.appointments_per_month || 200),
                            kpis.ticketAvg >= (goals.average_ticket_target || 5000)
                        ].filter(Boolean).length}
                    </p>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                    <p className="text-sm text-orange-600 dark:text-orange-400 font-medium mb-1">Em Andamento</p>
                    <p className="text-3xl font-bold text-orange-700 dark:text-orange-300">
                        {6 - [
                            kpis.totalRevenue >= (goals.monthly_revenue || 100000),
                            kpis.netResult >= (goals.monthly_net_result || 50000),
                            kpis.totalLeads >= (goals.new_patients_per_month || 50),
                            kpis.conversionRate >= (goals.conversion_rate_target || 30),
                            kpis.totalAppts >= (goals.appointments_per_month || 200),
                            kpis.ticketAvg >= (goals.average_ticket_target || 5000)
                        ].filter(Boolean).length}
                    </p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">Progresso Médio</p>
                    <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                        {(
                            (
                                (kpis.totalRevenue / (goals.monthly_revenue || 100000)) +
                                (kpis.netResult / (goals.monthly_net_result || 50000)) +
                                (kpis.totalLeads / (goals.new_patients_per_month || 50)) +
                                (kpis.conversionRate / (goals.conversion_rate_target || 30)) +
                                (kpis.totalAppts / (goals.appointments_per_month || 200)) +
                                (kpis.ticketAvg / (goals.average_ticket_target || 5000))
                            ) / 6 * 100
                        ).toFixed(0)}%
                    </p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                    <p className="text-sm text-purple-600 dark:text-purple-400 font-medium mb-1">Total de Metas</p>
                    <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">6</p>
                </div>
            </div>

            {/* Goals List - Same style as Alerts */}
            <div className="space-y-4">
                <GoalCard
                    title="💰 Faturamento Mensal"
                    icon={DollarSign}
                    current={kpis.totalRevenue}
                    target={goals.monthly_revenue || 100000}
                    unit="R$ "
                    color="green"
                    category="Financeiro"
                />

                <GoalCard
                    title="📈 Resultado Líquido"
                    icon={TrendingUp}
                    current={kpis.netResult}
                    target={goals.monthly_net_result || 50000}
                    unit="R$ "
                    color="blue"
                    category="Financeiro"
                />

                <GoalCard
                    title="👥 Novos Pacientes"
                    icon={Users}
                    current={kpis.totalLeads}
                    target={goals.new_patients_per_month || 50}
                    unit=""
                    color="purple"
                    category="Marketing"
                />

                <GoalCard
                    title="🎯 Taxa de Conversão"
                    icon={Target}
                    current={kpis.conversionRate}
                    target={goals.conversion_rate_target || 30}
                    unit=""
                    color="orange"
                    category="Vendas"
                />

                <GoalCard
                    title="📅 Agendamentos"
                    icon={Calendar}
                    current={kpis.totalAppts}
                    target={goals.appointments_per_month || 200}
                    unit=""
                    color="indigo"
                    category="Operacional"
                />

                <GoalCard
                    title="🏆 Ticket Médio"
                    icon={Award}
                    current={kpis.ticketAvg}
                    target={goals.average_ticket_target || 5000}
                    unit="R$ "
                    color="emerald"
                    category="Vendas"
                />

                {/* Simulador Estratégico - Same style as Alert card */}
                <div className="border-l-4 border-purple-500 rounded-lg p-6 shadow-sm hover:shadow-md transition-all bg-white dark:bg-gray-800">
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                            <div className="mt-1">
                                <Target size={24} className="text-purple-600" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="px-2 py-1 rounded text-xs font-bold uppercase bg-purple-600 text-white">
                                        SIMULADOR
                                    </span>
                                    <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                                        Estratégico
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                                    🎯 Simulador de Cenários
                                </h3>

                                <div className="space-y-3 mb-3">
                                    <div>
                                        <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">
                                            Faturamento Simulado
                                        </label>
                                        <input
                                            type="number"
                                            value={simulatedRevenue}
                                            onChange={(e) => setSimulatedRevenue(Number(e.target.value))}
                                            className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">
                                            Despesas Simuladas
                                        </label>
                                        <input
                                            type="number"
                                            value={simulatedExpense}
                                            onChange={(e) => setSimulatedExpense(Number(e.target.value))}
                                            className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                </div>

                                <p className="text-gray-700 dark:text-gray-300 mb-3">
                                    Resultado Líquido: <span className={`font-bold ${simulatedNet > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        R$ {simulatedNet.toLocaleString('pt-BR')}
                                    </span> | Margem EBITDA: <span className="font-bold text-purple-600">
                                        {simulatedMargin.toFixed(1)}%
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
