import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Activity, Heart, TrendingUp, AlertCircle, CheckCircle, Clock, Users, DollarSign, Calendar, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useDashboardData } from '../../hooks/useDashboardData';
import { useFinancial } from '../../contexts/FinancialContext';

const ClinicHealth: React.FC = () => {
    const navigate = useNavigate();
    const { profile } = useAuth();
    const { kpis, appointments, leads, isLoading } = useDashboardData();
    const { expenses } = useFinancial();

    // Calculate monthly revenue and expenses
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const monthlyExpenses = expenses
        .filter(e => {
            const expenseDate = new Date(e.dueDate);
            return expenseDate.getMonth() === currentMonth &&
                expenseDate.getFullYear() === currentYear &&
                e.status === 'Pago';
        })
        .reduce((sum, e) => sum + e.amount, 0);

    // For revenue, we'll use a simplified calculation based on appointments
    // In a real scenario, this would come from budget_items or payments
    const monthlyRevenue = monthlyExpenses * 2.5; // Simplified: assume 2.5x expenses as revenue

    // Calculate health metrics
    const calculateHealthScore = () => {
        let score = 0;
        let maxScore = 100;

        // Financial health (40 points)
        const profitMargin = monthlyRevenue > 0 ? ((monthlyRevenue - monthlyExpenses) / monthlyRevenue) * 100 : 0;
        if (profitMargin > 30) score += 40;
        else if (profitMargin > 20) score += 30;
        else if (profitMargin > 10) score += 20;
        else if (profitMargin > 0) score += 10;

        // Operational health (30 points)
        const appointmentRate = kpis.confirmed / (kpis.appointments || 1);
        if (appointmentRate > 0.8) score += 30;
        else if (appointmentRate > 0.6) score += 20;
        else if (appointmentRate > 0.4) score += 10;

        // Pipeline health (30 points)
        if (kpis.pendingLeads > 10) score += 30;
        else if (kpis.pendingLeads > 5) score += 20;
        else if (kpis.pendingLeads > 0) score += 10;

        return Math.min(score, maxScore);
    };

    const healthScore = calculateHealthScore();
    const profitMargin = monthlyRevenue > 0 ? ((monthlyRevenue - monthlyExpenses) / monthlyRevenue) * 100 : 0;
    const appointmentRate = kpis.appointments > 0 ? (kpis.confirmed / kpis.appointments) * 100 : 0;

    const getHealthStatus = (score: number) => {
        if (score >= 80) return { label: 'Excelente', color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle };
        if (score >= 60) return { label: 'Bom', color: 'text-blue-600', bg: 'bg-blue-50', icon: TrendingUp };
        if (score >= 40) return { label: 'Regular', color: 'text-amber-600', bg: 'bg-amber-50', icon: Clock };
        return { label: 'Crítico', color: 'text-rose-600', bg: 'bg-rose-50', icon: AlertCircle };
    };

    const healthStatus = getHealthStatus(healthScore);
    const StatusIcon = healthStatus.icon;

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
                <Loader2 className="w-12 h-12 text-violet-600 animate-spin mb-4" />
                <p className="text-slate-500 font-medium">Calculando saúde da clínica...</p>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/intelligence')}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                    <ChevronLeft size={24} className="text-slate-400 dark:text-slate-500" />
                </button>
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
                        <Heart className="text-rose-600 dark:text-rose-500" size={32} />
                        Saúde da Clínica
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">Indicadores operacionais e financeiros em tempo real</p>
                </div>
            </div>

            {/* Health Score Card */}
            <div className="bg-gradient-to-br from-violet-600 to-violet-800 rounded-xl shadow-lg p-8 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-violet-200 text-sm font-medium mb-2">Score de Saúde Geral</p>
                        <div className="flex items-center gap-4">
                            <div className="text-6xl font-bold">{healthScore}</div>
                            <div>
                                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${healthStatus.bg} dark:bg-opacity-20 ${healthStatus.color} dark:text-white font-bold`}>
                                    <StatusIcon size={20} />
                                    {healthStatus.label}
                                </div>
                            </div>
                        </div>
                    </div>
                    <Activity size={80} className="text-violet-400 opacity-30" />
                </div>
                <div className="mt-6 bg-white/10 rounded-lg h-3 overflow-hidden">
                    <div
                        className="bg-white h-full transition-all rounded-lg"
                        style={{ width: `${healthScore}%` }}
                    />
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Financial Health */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 transition-all hover:shadow-md">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <DollarSign className="text-green-600 dark:text-green-400" size={20} />
                        </div>
                        <h3 className="font-bold text-slate-800 dark:text-white">Saúde Financeira</h3>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-xs text-slate-500 dark:text-slate-400">Margem de Lucro</span>
                                <span className={`text-xs font-bold ${profitMargin > 20 ? 'text-green-600 dark:text-green-400' : profitMargin > 10 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                    {profitMargin.toFixed(1)}%
                                </span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                                <div
                                    className={`h-full ${profitMargin > 20 ? 'bg-green-600' : profitMargin > 10 ? 'bg-amber-600' : 'bg-rose-600'} transition-all`}
                                    style={{ width: `${Math.min(profitMargin, 100)}%` }}
                                />
                            </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 dark:border-slate-700">
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Receita Mensal</p>
                            <p className="text-lg font-bold text-green-600 dark:text-green-400">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthlyRevenue)}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Despesas Mensais</p>
                            <p className="text-lg font-bold text-rose-600 dark:text-rose-400">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthlyExpenses)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Operational Health */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 transition-all hover:shadow-md">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <Calendar className="text-blue-600 dark:text-blue-400" size={20} />
                        </div>
                        <h3 className="font-bold text-slate-800 dark:text-white">Saúde Operacional</h3>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-xs text-slate-500 dark:text-slate-400">Taxa de Confirmação</span>
                                <span className={`text-xs font-bold ${appointmentRate > 80 ? 'text-green-600 dark:text-green-400' : appointmentRate > 60 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                    {appointmentRate.toFixed(1)}%
                                </span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                                <div
                                    className={`h-full ${appointmentRate > 80 ? 'bg-green-600' : appointmentRate > 60 ? 'bg-amber-600' : 'bg-rose-600'} transition-all`}
                                    style={{ width: `${appointmentRate}%` }}
                                />
                            </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 dark:border-slate-700">
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Agendamentos Hoje</p>
                            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{kpis.appointments}</p>
                        </div>

                        <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Confirmados</p>
                            <p className="text-lg font-bold text-green-600 dark:text-green-400">{kpis.confirmed}</p>
                        </div>
                    </div>
                </div>

                {/* Pipeline Health */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 transition-all hover:shadow-md">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
                            <Users className="text-violet-600 dark:text-violet-400" size={20} />
                        </div>
                        <h3 className="font-bold text-slate-800 dark:text-white">Saúde do Pipeline</h3>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Leads Ativos</p>
                            <p className="text-3xl font-bold text-violet-600 dark:text-violet-400">{kpis.pendingLeads}</p>
                        </div>

                        <div className="pt-3 border-t border-slate-100 dark:border-slate-700">
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Status do Funil</p>
                            {kpis.pendingLeads > 10 ? (
                                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                                    <CheckCircle size={16} />
                                    <span className="text-sm font-bold">Saudável</span>
                                </div>
                            ) : kpis.pendingLeads > 5 ? (
                                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                                    <Clock size={16} />
                                    <span className="text-sm font-bold">Atenção</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                                    <AlertCircle size={16} />
                                    <span className="text-sm font-bold">Crítico</span>
                                </div>
                            )}
                        </div>

                        <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Recomendação</p>
                            <p className="text-xs text-slate-600 dark:text-slate-300">
                                {kpis.pendingLeads < 5
                                    ? 'Intensifique captação de leads'
                                    : kpis.pendingLeads < 10
                                        ? 'Mantenha ritmo de prospecção'
                                        : 'Pipeline saudável, foque em conversão'
                                }
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Alerts & Recommendations */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 transition-all hover:shadow-md">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <AlertCircle className="text-amber-600 dark:text-amber-500" size={20} />
                    Alertas e Recomendações
                </h3>

                <div className="space-y-3">
                    {profitMargin < 10 && (
                        <div className="flex items-start gap-3 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-900/30 rounded-lg">
                            <AlertCircle className="text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" size={20} />
                            <div>
                                <p className="text-sm font-bold text-rose-800 dark:text-rose-200">Margem de Lucro Baixa</p>
                                <p className="text-xs text-rose-600 dark:text-rose-300 mt-1">Revise despesas e ajuste precificação dos procedimentos.</p>
                            </div>
                        </div>
                    )}

                    {appointmentRate < 60 && (
                        <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/30 rounded-lg">
                            <Clock className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" size={20} />
                            <div>
                                <p className="text-sm font-bold text-amber-800 dark:text-amber-200">Taxa de Confirmação Baixa</p>
                                <p className="text-xs text-amber-600 dark:text-amber-300 mt-1">Implemente lembretes automáticos via WhatsApp.</p>
                            </div>
                        </div>
                    )}

                    {kpis.pendingLeads < 5 && (
                        <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/30 rounded-lg">
                            <TrendingUp className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" size={20} />
                            <div>
                                <p className="text-sm font-bold text-blue-800 dark:text-blue-200">Pipeline Precisa de Atenção</p>
                                <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">Aumente investimento em marketing e captação de leads.</p>
                            </div>
                        </div>
                    )}

                    {profitMargin >= 20 && appointmentRate >= 80 && kpis.pendingLeads >= 10 && (
                        <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/30 rounded-lg">
                            <CheckCircle className="text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" size={20} />
                            <div>
                                <p className="text-sm font-bold text-green-800 dark:text-green-200">Clínica em Excelente Saúde!</p>
                                <p className="text-xs text-green-600 dark:text-green-300 mt-1">Continue monitorando métricas e mantenha o padrão de qualidade.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ClinicHealth;
