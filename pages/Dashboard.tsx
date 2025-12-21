import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
    TrendingUp,
    Users,
    DollarSign,
    Target,
    Calendar,
    AlertCircle,
    CheckCircle,
    Clock,
    Sparkles
} from 'lucide-react';

interface ClinicKPI {
    total_revenue: number;
    new_patients_count: number;
    conversion_rate: number;
    appointments_scheduled: number;
    appointments_completed: number;
    no_show_rate: number;
    budgets_created_count: number;
    budgets_approved_count: number;
}

interface ClinicGoals {
    new_patients: number;
    no_show_rate: number;
    average_ticket: number;
    occupancy_rate: number;
    conversion_rate: number;
    monthly_revenue: number;
    monthly_net_result: number;
}

export const Dashboard: React.FC = () => {
    const { profile } = useAuth();
    const [kpis, setKpis] = useState<ClinicKPI | null>(null);
    const [goals, setGoals] = useState<ClinicGoals | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (profile?.clinic_id) {
            loadDashboardData();
        }
    }, [profile?.clinic_id]);

    const loadDashboardData = async () => {
        try {
            setLoading(true);

            // Load current month KPIs
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            const endOfMonth = new Date();
            endOfMonth.setMonth(endOfMonth.getMonth() + 1);
            endOfMonth.setDate(0);
            endOfMonth.setHours(23, 59, 59, 999);

            const { data: kpiData } = await supabase
                .from('clinic_kpis')
                .select('*')
                .eq('clinic_id', profile!.clinic_id)
                .gte('period_start', startOfMonth.toISOString().split('T')[0])
                .lte('period_end', endOfMonth.toISOString().split('T')[0])
                .single();

            // Load clinic goals
            const { data: clinicData } = await supabase
                .from('clinics')
                .select('goals')
                .eq('id', profile!.clinic_id)
                .single();

            setKpis(kpiData || {
                total_revenue: 0,
                new_patients_count: 0,
                conversion_rate: 0,
                appointments_scheduled: 0,
                appointments_completed: 0,
                no_show_rate: 0,
                budgets_created_count: 0,
                budgets_approved_count: 0
            });

            setGoals(clinicData?.goals || {
                new_patients: 20,
                no_show_rate: 5,
                average_ticket: 2000,
                occupancy_rate: 80,
                conversion_rate: 30,
                monthly_revenue: 50000,
                monthly_net_result: 25000
            });
        } catch (error) {
            console.error('Erro ao carregar dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateProgress = (current: number, goal: number, inverse = false) => {
        if (goal === 0) return 0;
        const percentage = (current / goal) * 100;
        return inverse ? 100 - Math.min(percentage, 100) : Math.min(percentage, 100);
    };

    const getProgressColor = (progress: number) => {
        if (progress >= 90) return 'bg-teal-500';
        if (progress >= 60) return 'bg-amber-400';
        return 'bg-rose-600';
    };

    const getProgressTextColor = (progress: number) => {
        if (progress >= 90) return 'text-teal-600';
        if (progress >= 60) return 'text-amber-600';
        return 'text-rose-600';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
            </div>
        );
    }

    const revenueProgress = calculateProgress(kpis?.total_revenue || 0, goals?.monthly_revenue || 50000);
    const patientsProgress = calculateProgress(kpis?.new_patients_count || 0, goals?.new_patients || 20);
    const conversionProgress = calculateProgress(kpis?.conversion_rate || 0, goals?.conversion_rate || 30);
    const noShowProgress = calculateProgress(kpis?.no_show_rate || 0, goals?.no_show_rate || 5, true);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-violet-600 to-violet-700 rounded-xl p-6 text-white">
                <div className="flex items-center gap-3 mb-2">
                    <Target className="w-8 h-8" />
                    <h1 className="text-3xl font-bold">Central de Metas</h1>
                </div>
                <p className="text-violet-100">
                    Acompanhe o desempenho da clínica em tempo real
                </p>
            </div>

            {/* KPI Cards - Top 3 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Faturamento */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center">
                                <DollarSign className="w-6 h-6 text-teal-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Faturamento</p>
                                <p className="text-2xl font-bold text-slate-800">
                                    R$ {(kpis?.total_revenue || 0).toLocaleString('pt-BR')}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600">Meta: R$ {(goals?.monthly_revenue || 0).toLocaleString('pt-BR')}</span>
                            <span className={`font-bold ${getProgressTextColor(revenueProgress)}`}>
                                {revenueProgress.toFixed(0)}%
                            </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                            <div
                                className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(revenueProgress)}`}
                                style={{ width: `${revenueProgress}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Novos Pacientes */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-violet-50 rounded-xl flex items-center justify-center">
                                <Users className="w-6 h-6 text-violet-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Novos Pacientes</p>
                                <p className="text-2xl font-bold text-slate-800">
                                    {kpis?.new_patients_count || 0}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600">Meta: {goals?.new_patients || 20}</span>
                            <span className={`font-bold ${getProgressTextColor(patientsProgress)}`}>
                                {patientsProgress.toFixed(0)}%
                            </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                            <div
                                className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(patientsProgress)}`}
                                style={{ width: `${patientsProgress}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Taxa de Conversão */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Conversão</p>
                                <p className="text-2xl font-bold text-slate-800">
                                    {(kpis?.conversion_rate || 0).toFixed(1)}%
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600">Meta: {goals?.conversion_rate || 30}%</span>
                            <span className={`font-bold ${getProgressTextColor(conversionProgress)}`}>
                                {conversionProgress.toFixed(0)}%
                            </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                            <div
                                className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(conversionProgress)}`}
                                style={{ width: `${conversionProgress}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Secondary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Orçamentos Criados */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500">Orçamentos</p>
                            <p className="text-xl font-bold text-slate-800">{kpis?.budgets_created_count || 0}</p>
                        </div>
                    </div>
                    <p className="text-xs text-slate-600">
                        {kpis?.budgets_approved_count || 0} aprovados
                    </p>
                </div>

                {/* Agendamentos */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500">Agendamentos</p>
                            <p className="text-xl font-bold text-slate-800">{kpis?.appointments_scheduled || 0}</p>
                        </div>
                    </div>
                    <p className="text-xs text-slate-600">
                        {kpis?.appointments_completed || 0} realizados
                    </p>
                </div>

                {/* No-Show */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${noShowProgress >= 90 ? 'bg-teal-50' : 'bg-rose-50'
                            }`}>
                            <Clock className={`w-5 h-5 ${noShowProgress >= 90 ? 'text-teal-600' : 'text-rose-600'
                                }`} />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500">No-Show</p>
                            <p className="text-xl font-bold text-slate-800">{(kpis?.no_show_rate || 0).toFixed(1)}%</p>
                        </div>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                        <div
                            className={`h-1.5 rounded-full transition-all duration-500 ${getProgressColor(noShowProgress)}`}
                            style={{ width: `${noShowProgress}%` }}
                        />
                    </div>
                </div>

                {/* Status Geral */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${revenueProgress >= 90 ? 'bg-teal-50' : revenueProgress >= 60 ? 'bg-amber-50' : 'bg-rose-50'
                            }`}>
                            {revenueProgress >= 90 ? (
                                <CheckCircle className="w-5 h-5 text-teal-600" />
                            ) : (
                                <AlertCircle className={`w-5 h-5 ${revenueProgress >= 60 ? 'text-amber-600' : 'text-rose-600'}`} />
                            )}
                        </div>
                        <div>
                            <p className="text-xs text-slate-500">Status</p>
                            <p className={`text-sm font-bold ${revenueProgress >= 90 ? 'text-teal-600' : revenueProgress >= 60 ? 'text-amber-600' : 'text-rose-600'
                                }`}>
                                {revenueProgress >= 90 ? 'Excelente' : revenueProgress >= 60 ? 'Atenção' : 'Crítico'}
                            </p>
                        </div>
                    </div>
                    <p className="text-xs text-slate-600">
                        Desempenho geral
                    </p>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Ações Rápidas</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <button className="px-4 py-3 bg-violet-50 text-violet-600 rounded-lg font-medium hover:bg-violet-100 transition-colors text-sm">
                        Ver Relatórios
                    </button>
                    <button className="px-4 py-3 bg-teal-50 text-teal-600 rounded-lg font-medium hover:bg-teal-100 transition-colors text-sm">
                        Ajustar Metas
                    </button>
                    <button className="px-4 py-3 bg-amber-50 text-amber-600 rounded-lg font-medium hover:bg-amber-100 transition-colors text-sm">
                        Pipeline Vendas
                    </button>
                    <button className="px-4 py-3 bg-slate-50 text-slate-600 rounded-lg font-medium hover:bg-slate-100 transition-colors text-sm">
                        Exportar Dados
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
