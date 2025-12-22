/**
 * IntelligenceGateway.tsx
 * SCR-01: Hub Estratégico com 3 Cards
 * 
 * CARDS:
 * 1. Central de Metas (SCR-01-A) - Progresso financeiro
 * 2. BOS Intelligence (SCR-01-B) - Alertas e Insights
 * 3. Clinic Health - Score de saúde geral
 * 
 * ACESSO: MASTER, ADMIN
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
    Target,
    Brain,
    Activity,
    TrendingUp,
    AlertCircle,
    Sparkles,
    ArrowRight,
    DollarSign,
    Users,
    Calendar
} from 'lucide-react';

interface ClinicGoals {
    monthly_revenue: number;
    new_patients: number;
    conversion_rate: number;
}

interface ClinicKPIs {
    total_revenue: number;
    new_patients_count: number;
    conversion_rate: number;
}

export const IntelligenceGateway: React.FC = () => {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const [goals, setGoals] = useState<ClinicGoals | null>(null);
    const [kpis, setKPIs] = useState<ClinicKPIs | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (profile?.clinic_id) {
            loadData();
        }
    }, [profile?.clinic_id]);

    const loadData = async () => {
        try {
            setLoading(true);

            // Load clinic goals
            const { data: clinicData } = await supabase
                .from('clinics')
                .select('goals')
                .eq('id', profile!.clinic_id)
                .single();

            setGoals(clinicData?.goals || {
                monthly_revenue: 50000,
                new_patients: 20,
                conversion_rate: 30
            });

            // Load current month KPIs
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            const endOfMonth = new Date();
            endOfMonth.setMonth(endOfMonth.getMonth() + 1);
            endOfMonth.setDate(0);

            const { data: kpiData } = await supabase
                .from('clinic_kpis')
                .select('*')
                .eq('clinic_id', profile!.clinic_id)
                .gte('period_start', startOfMonth.toISOString().split('T')[0])
                .lte('period_end', endOfMonth.toISOString().split('T')[0])
                .single();

            setKPIs(kpiData || {
                total_revenue: 0,
                new_patients_count: 0,
                conversion_rate: 0
            });
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateProgress = (current: number, goal: number) => {
        if (goal === 0) return 0;
        return Math.min((current / goal) * 100, 100);
    };

    const revenueProgress = calculateProgress(kpis?.total_revenue || 0, goals?.monthly_revenue || 50000);
    const patientsProgress = calculateProgress(kpis?.new_patients_count || 0, goals?.new_patients || 20);
    const conversionProgress = calculateProgress(kpis?.conversion_rate || 0, goals?.conversion_rate || 30);

    const overallHealth = Math.round((revenueProgress + patientsProgress + conversionProgress) / 3);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-violet-600 to-violet-700 rounded-xl p-8 text-white shadow-lg">
                <div className="flex items-center gap-4 mb-4">
                    <div className="p-4 bg-white/20 rounded-xl backdrop-blur-sm">
                        <Brain size={48} className="animate-pulse" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-bold flex items-center gap-3">
                            Intelligence Gateway
                            <Sparkles size={28} className="text-yellow-300" />
                        </h1>
                        <p className="text-lg text-violet-100 mt-2">
                            Hub Estratégico - Visão 360° da Clínica
                        </p>
                    </div>
                </div>
                <p className="text-sm text-violet-200">SCR-01</p>
            </div>

            {/* 3 Strategic Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* CARD 1: Central de Metas (SCR-01-A) */}
                <button
                    onClick={() => navigate('/dashboard/goals')}
                    className="group relative bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden text-left"
                >
                    {/* Background Pattern */}
                    <div className="absolute inset-0 bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/10 dark:to-teal-900/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                    {/* Content */}
                    <div className="relative z-10 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-teal-50 dark:bg-teal-900/30 rounded-xl group-hover:bg-teal-100 dark:group-hover:bg-teal-900/50 transition-colors">
                                <Target className="w-8 h-8 text-teal-600 dark:text-teal-400" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white">Central de Metas</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">SCR-01-A</p>
                            </div>
                            <ArrowRight className="w-5 h-5 text-slate-400 dark:text-slate-600 group-hover:text-teal-600 dark:group-hover:text-teal-400 group-hover:translate-x-1 transition-all" />
                        </div>

                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                            Acompanhe o progresso das metas financeiras e operacionais em tempo real
                        </p>

                        {/* Mini KPIs */}
                        <div className="space-y-3">
                            <div>
                                <div className="flex items-center justify-between text-xs mb-1">
                                    <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                                        <DollarSign className="w-3 h-3" />
                                        Faturamento
                                    </span>
                                    <span className="font-bold text-teal-600 dark:text-teal-400">{revenueProgress.toFixed(0)}%</span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                                    <div
                                        className="bg-teal-500 h-2 rounded-full transition-all duration-500"
                                        style={{ width: `${revenueProgress}%` }}
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between text-xs mb-1">
                                    <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                                        <Users className="w-3 h-3" />
                                        Novos Pacientes
                                    </span>
                                    <span className="font-bold text-violet-600 dark:text-violet-400">{patientsProgress.toFixed(0)}%</span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                                    <div
                                        className="bg-violet-500 h-2 rounded-full transition-all duration-500"
                                        style={{ width: `${patientsProgress}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                            <span className="text-xs text-slate-500 dark:text-slate-400">Clique para detalhes completos</span>
                        </div>
                    </div>
                </button>

                {/* CARD 2: BOS Intelligence (SCR-01-B) */}
                <button
                    onClick={() => navigate('/dashboard/bos-intelligence')}
                    className="group relative bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden text-left"
                >
                    {/* Background Pattern */}
                    <div className="absolute inset-0 bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-900/10 dark:to-rose-900/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                    {/* Content */}
                    <div className="relative z-10 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-rose-50 dark:bg-rose-900/30 rounded-xl group-hover:bg-rose-100 dark:group-hover:bg-rose-900/50 transition-colors">
                                <Brain className="w-8 h-8 text-rose-600 dark:text-rose-400" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white">BOS Intelligence</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">SCR-01-B</p>
                            </div>
                            <ArrowRight className="w-5 h-5 text-slate-400 dark:text-slate-600 group-hover:text-rose-600 dark:group-hover:text-rose-400 group-hover:translate-x-1 transition-all" />
                        </div>

                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                            Alertas críticos e insights proativos para maximizar resultados
                        </p>

                        {/* Alerts Summary */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-rose-50 dark:bg-rose-900/20 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Alertas Críticos</span>
                                </div>
                                <span className="text-lg font-bold text-rose-600 dark:text-rose-400">3</span>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Insights Ativos</span>
                                </div>
                                <span className="text-lg font-bold text-amber-600 dark:text-amber-400">7</span>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                            <span className="text-xs text-slate-500 dark:text-slate-400">Clique para ver todos os alertas</span>
                        </div>
                    </div>
                </button>

                {/* CARD 3: Clinic Health */}
                <button
                    onClick={() => navigate('/dashboard/clinic-health')}
                    className="group relative bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden text-left"
                >
                    {/* Background Pattern */}
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-900/10 dark:to-violet-900/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                    {/* Content */}
                    <div className="relative z-10 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-violet-50 dark:bg-violet-900/30 rounded-xl group-hover:bg-violet-100 dark:group-hover:bg-violet-900/50 transition-colors">
                                <Activity className="w-8 h-8 text-violet-600 dark:text-violet-400" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white">Saúde da Clínica</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Health Score</p>
                            </div>
                            <ArrowRight className="w-5 h-5 text-slate-400 dark:text-slate-600 group-hover:text-violet-600 dark:group-hover:text-violet-400 group-hover:translate-x-1 transition-all" />
                        </div>

                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                            Score geral de saúde baseado nos 5 pilares operacionais
                        </p>

                        {/* Health Score Circle */}
                        <div className="flex items-center justify-center my-6">
                            <div className="relative w-32 h-32">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle
                                        cx="64"
                                        cy="64"
                                        r="56"
                                        stroke="currentColor"
                                        strokeWidth="8"
                                        fill="none"
                                        className="text-slate-100 dark:text-slate-700"
                                    />
                                    <circle
                                        cx="64"
                                        cy="64"
                                        r="56"
                                        stroke="currentColor"
                                        strokeWidth="8"
                                        fill="none"
                                        strokeDasharray={`${2 * Math.PI * 56}`}
                                        strokeDashoffset={`${2 * Math.PI * 56 * (1 - overallHealth / 100)}`}
                                        className={`transition-all duration-1000 ${overallHealth >= 80 ? 'text-teal-500' :
                                            overallHealth >= 60 ? 'text-amber-500' :
                                                'text-rose-500'
                                            }`}
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center">
                                        <div className={`text-3xl font-bold ${overallHealth >= 80 ? 'text-teal-600 dark:text-teal-400' :
                                            overallHealth >= 60 ? 'text-amber-600 dark:text-amber-400' :
                                                'text-rose-600 dark:text-rose-400'
                                            }`}>
                                            {overallHealth}
                                        </div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400">Score</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                            <span className="text-xs text-slate-500 dark:text-slate-400">Clique para análise detalhada</span>
                        </div>
                    </div>
                </button>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Ações Rápidas</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <button
                        onClick={() => navigate('/dashboard/chatbos')}
                        className="px-4 py-3 bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 rounded-lg font-medium hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-colors text-sm"
                    >
                        Abrir ChatBOS
                    </button>
                    <button
                        onClick={() => navigate('/dashboard/patients')}
                        className="px-4 py-3 bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 rounded-lg font-medium hover:bg-teal-100 dark:hover:bg-teal-900/40 transition-colors text-sm"
                    >
                        Ver Pacientes
                    </button>
                    <button
                        onClick={() => navigate('/dashboard/schedule')}
                        className="px-4 py-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-lg font-medium hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors text-sm"
                    >
                        Abrir Agenda
                    </button>
                    <button
                        onClick={() => navigate('/dashboard/reports')}
                        className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 rounded-lg font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm"
                    >
                        Relatórios
                    </button>
                </div>
            </div>
        </div>
    );
};

export default IntelligenceGateway;
