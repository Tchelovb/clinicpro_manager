import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Calendar, DollarSign, Users, TrendingUp, Download, Filter, Loader2, Target, Activity } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface ReportData {
    revenue: number;
    expenses: number;
    profit: number;
    appointments: number;
    newPatients: number;
    conversion: number;
    avgTicket: number;
}

const Reports: React.FC = () => {
    const navigate = useNavigate();
    const { profile } = useAuth();

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<ReportData>({
        revenue: 0,
        expenses: 0,
        profit: 0,
        appointments: 0,
        newPatients: 0,
        conversion: 0,
        avgTicket: 0
    });

    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        loadReportData();
    }, [dateRange]);

    const loadReportData = async () => {
        try {
            setLoading(true);

            // Revenue (from budget_items paid)
            const { data: revenueData } = await supabase
                .from('budget_items')
                .select('amount_paid')
                .eq('status', 'PAID')
                .gte('payment_date', dateRange.start)
                .lte('payment_date', dateRange.end);

            const revenue = revenueData?.reduce((sum, item) => sum + (item.amount_paid || 0), 0) || 0;

            // Expenses
            const { data: expensesData } = await supabase
                .from('expenses')
                .select('amount')
                .eq('clinic_id', profile?.clinic_id)
                .eq('status', 'PAID')
                .gte('payment_date', dateRange.start)
                .lte('payment_date', dateRange.end);

            const expenses = expensesData?.reduce((sum, item) => sum + item.amount, 0) || 0;

            // Appointments
            const { data: appointmentsData } = await supabase
                .from('appointments')
                .select('id, status')
                .eq('clinic_id', profile?.clinic_id)
                .gte('date', `${dateRange.start}T00:00:00`)
                .lte('date', `${dateRange.end}T23:59:59`);

            const appointments = appointmentsData?.length || 0;
            const completedAppointments = appointmentsData?.filter(a => a.status === 'COMPLETED').length || 0;

            // New Patients
            const { data: patientsData } = await supabase
                .from('patients')
                .select('id')
                .eq('clinic_id', profile?.clinic_id)
                .gte('created_at', `${dateRange.start}T00:00:00`)
                .lte('created_at', `${dateRange.end}T23:59:59`);

            const newPatients = patientsData?.length || 0;

            // Leads
            const { data: leadsData } = await supabase
                .from('leads')
                .select('id, status')
                .eq('clinic_id', profile?.clinic_id)
                .gte('created_at', `${dateRange.start}T00:00:00`)
                .lte('created_at', `${dateRange.end}T23:59:59`);

            const totalLeads = leadsData?.length || 0;
            const convertedLeads = leadsData?.filter(l => l.status === 'WON').length || 0;
            const conversion = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

            const avgTicket = completedAppointments > 0 ? revenue / completedAppointments : 0;

            setData({
                revenue,
                expenses,
                profit: revenue - expenses,
                appointments,
                newPatients,
                conversion,
                avgTicket
            });
        } catch (error) {
            console.error('Erro ao carregar relatórios:', error);
            toast.error('Erro ao carregar dados dos relatórios');
        } finally {
            setLoading(false);
        }
    };

    const profitMargin = data.revenue > 0 ? ((data.profit / data.revenue) * 100) : 0;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
                <Loader2 className="w-12 h-12 text-violet-600 animate-spin mb-4" />
                <p className="text-slate-500 font-medium">Gerando relatórios...</p>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 max-w-[1600px] mx-auto bg-slate-50 min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
                        <BarChart3 className="text-indigo-600" size={32} />
                        Relatórios & BI
                    </h1>
                    <p className="text-slate-500 mt-2">Análise de desempenho e indicadores estratégicos</p>
                </div>
                <button
                    onClick={() => toast.success('Exportação em desenvolvimento')}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm"
                >
                    <Download size={18} />
                    Exportar PDF
                </button>
            </div>

            {/* Date Range Filter */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center gap-4">
                    <Calendar className="text-slate-400" size={20} />
                    <span className="font-bold text-slate-700">Período:</span>
                    <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                        className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                    <span className="text-slate-500">até</span>
                    <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                        className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                    <button
                        onClick={loadReportData}
                        className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors font-medium"
                    >
                        Atualizar
                    </button>
                </div>
            </div>

            {/* Financial KPIs */}
            <div>
                <h2 className="text-lg font-bold text-slate-800 mb-4">Desempenho Financeiro</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-green-50 rounded-lg">
                                <DollarSign className="text-green-600" size={20} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Receita</p>
                        </div>
                        <p className="text-2xl font-bold text-green-600">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.revenue)}
                        </p>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-rose-50 rounded-lg">
                                <TrendingUp className="text-rose-600" size={20} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Despesas</p>
                        </div>
                        <p className="text-2xl font-bold text-rose-600">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.expenses)}
                        </p>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className={`p-2 ${data.profit >= 0 ? 'bg-blue-50' : 'bg-rose-50'} rounded-lg`}>
                                <Activity className={data.profit >= 0 ? 'text-blue-600' : 'text-rose-600'} size={20} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Lucro</p>
                        </div>
                        <p className={`text-2xl font-bold ${data.profit >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.profit)}
                        </p>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-violet-50 rounded-lg">
                                <Target className="text-violet-600" size={20} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Margem</p>
                        </div>
                        <p className={`text-2xl font-bold ${profitMargin >= 20 ? 'text-green-600' : profitMargin >= 10 ? 'text-amber-600' : 'text-rose-600'}`}>
                            {profitMargin.toFixed(1)}%
                        </p>
                        <div className="mt-2 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                                className={`h-full ${profitMargin >= 20 ? 'bg-green-600' : profitMargin >= 10 ? 'bg-amber-600' : 'bg-rose-600'}`}
                                style={{ width: `${Math.min(profitMargin, 100)}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Operational KPIs */}
            <div>
                <h2 className="text-lg font-bold text-slate-800 mb-4">Desempenho Operacional</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <Calendar className="text-blue-600" size={20} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Atendimentos</p>
                        </div>
                        <p className="text-2xl font-bold text-blue-600">{data.appointments}</p>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-teal-50 rounded-lg">
                                <Users className="text-teal-600" size={20} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Novos Pacientes</p>
                        </div>
                        <p className="text-2xl font-bold text-teal-600">{data.newPatients}</p>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-amber-50 rounded-lg">
                                <DollarSign className="text-amber-600" size={20} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Ticket Médio</p>
                        </div>
                        <p className="text-2xl font-bold text-amber-600">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.avgTicket)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Conversion Funnel */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h2 className="text-lg font-bold text-slate-800 mb-4">Funil de Conversão</h2>
                <div className="space-y-4">
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-slate-700">Taxa de Conversão (Leads → Pacientes)</span>
                            <span className={`text-sm font-bold ${data.conversion >= 30 ? 'text-green-600' : data.conversion >= 15 ? 'text-amber-600' : 'text-rose-600'}`}>
                                {data.conversion.toFixed(1)}%
                            </span>
                        </div>
                        <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden">
                            <div
                                className={`h-full ${data.conversion >= 30 ? 'bg-green-600' : data.conversion >= 15 ? 'bg-amber-600' : 'bg-rose-600'}`}
                                style={{ width: `${data.conversion}%` }}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                        <div className="text-center">
                            <p className="text-xs text-slate-500 mb-1">Meta</p>
                            <p className="text-lg font-bold text-violet-600">30%</p>
                        </div>
                        <div className="text-center">
                            <p className="text-xs text-slate-500 mb-1">Realizado</p>
                            <p className="text-lg font-bold text-slate-800">{data.conversion.toFixed(1)}%</p>
                        </div>
                        <div className="text-center">
                            <p className="text-xs text-slate-500 mb-1">Status</p>
                            <p className={`text-lg font-bold ${data.conversion >= 30 ? 'text-green-600' : data.conversion >= 15 ? 'text-amber-600' : 'text-rose-600'}`}>
                                {data.conversion >= 30 ? '✓ Atingida' : data.conversion >= 15 ? '⚡ Próximo' : '⚠️ Abaixo'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Insights */}
            <div className="bg-gradient-to-br from-violet-600 to-violet-800 rounded-xl shadow-lg p-6 text-white">
                <h2 className="text-lg font-bold mb-4">Insights do Período</h2>
                <div className="space-y-2">
                    {profitMargin >= 20 && (
                        <p className="text-sm">✓ Margem de lucro saudável ({profitMargin.toFixed(1)}%). Continue monitorando despesas.</p>
                    )}
                    {profitMargin < 10 && (
                        <p className="text-sm">⚠️ Margem de lucro baixa ({profitMargin.toFixed(1)}%). Revise despesas e precificação.</p>
                    )}
                    {data.conversion >= 30 && (
                        <p className="text-sm">✓ Taxa de conversão excelente! Mantenha o padrão de atendimento.</p>
                    )}
                    {data.conversion < 15 && (
                        <p className="text-sm">⚠️ Taxa de conversão abaixo da meta. Melhore follow-up de leads.</p>
                    )}
                    {data.newPatients > 10 && (
                        <p className="text-sm">✓ Boa captação de novos pacientes ({data.newPatients} no período).</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Reports;
