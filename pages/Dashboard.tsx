import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Calendar,
    CheckCircle,
    Clock,
    AlertCircle,
    MessageCircle,
    Phone,
    User,
    ArrowRight,
    ListTodo,
    Bell,
    X,
    AlertTriangle,
    Target,
    Sparkles,
    TrendingUp,
    Activity,
    DollarSign,
    TrendingDown,
    Users
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useDashboardData } from "../hooks/useDashboardData";
import { LeadStatus } from "../types";
import AIInsightsFeed from "../components/dashboard/AIInsightsFeed";
import ComplianceWidget from "../components/dashboard/ComplianceWidget";
import { HealthPillars } from "../components/dashboard/HealthPillars";
import { supabase } from "../lib/supabase";

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const { profile } = useAuth();
    const [showNotifications, setShowNotifications] = useState(false);
    const [completedTasks, setCompletedTasks] = useState<string[]>([]);

    // Estados para dados financeiros
    const [financialData, setFinancialData] = useState({
        revenue: 0,
        expenses: 0,
        profit: 0,
        profitMargin: 0
    });
    const [loadingFinancial, setLoadingFinancial] = useState(true);

    // Usar o hook personalizado para dados do dashboard
    const {
        appointments: todaysAppointments,
        leads,
        kpis,
        reminders,
        isLoading,
        hasError,
        appointmentsError,
        leadsError,
        patientsError,
        refetch,
    } = useDashboardData();

    // Filtrar leads prioritários
    const priorityLeads = useMemo(
        () =>
            leads.filter(
                (l) => l.status === LeadStatus.NEW || l.status === LeadStatus.CONTACT
            ),
        [leads]
    );

    // Carregar dados financeiros do mês atual
    useEffect(() => {
        const loadFinancialData = async () => {
            if (!profile?.clinic_id) return;

            setLoadingFinancial(true);
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

            try {
                // Buscar receita real (transações de entrada no mês)
                // Usando a tabela transactions que é a fonte de verdade financeira
                const { data: revenueData, error: revenueError } = await supabase
                    .from('transactions')
                    .select('amount')
                    .eq('clinic_id', profile.clinic_id)
                    .eq('type', 'INCOME')
                    .gte('created_at', startOfMonth)
                    .lte('created_at', endOfMonth);

                if (revenueError) {
                    console.warn('Erro ao buscar transações, tentando fallback para budget_items (legado):', revenueError);
                    // Tentativa de Fallback para sistemas antigos sem transactions
                    const { data: fallbackData } = await supabase
                        .from('budget_items')
                        .select('amount') // Tentar amount se amount_paid falhar
                        .eq('status', 'PAID') // Isso assume que existe status no item
                        .gte('created_at', startOfMonth)
                        .lte('created_at', endOfMonth);

                    // Se ainda falhar, assumimos 0
                }

                // Buscar despesas (expenses pagos)
                const { data: expensesData } = await supabase
                    .from('expenses')
                    .select('amount')
                    .eq('clinic_id', profile.clinic_id)
                    .eq('status', 'PAID')
                    .gte('payment_date', startOfMonth.split('T')[0]) // payment_date usually DATE type
                    .lte('payment_date', endOfMonth.split('T')[0]);

                const revenue = revenueData ? revenueData.reduce((sum, item) => sum + (item.amount || 0), 0) : 0;
                const expenses = expensesData ? expensesData.reduce((sum, item) => sum + (item.amount || 0), 0) : 0;
                const profit = revenue - expenses;
                const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;

                setFinancialData({ revenue, expenses, profit, profitMargin });
            } catch (error) {
                console.error('Erro ao carregar dados financeiros:', error);
            } finally {
                setLoadingFinancial(false);
            }
        };

        loadFinancialData();
    }, [profile?.clinic_id]);

    // Componente de estado vazio
    const EmptyState: React.FC<{
        icon: React.ComponentType<any>;
        title: string;
        description: string;
    }> = ({ icon: Icon, title, description }) => (
        <div className="flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            <Icon size={32} className="mb-3 opacity-50" />
            <p className="text-sm font-semibold text-slate-600">{title}</p>
            <p className="text-xs text-slate-500 mt-1 max-w-[200px]">{description}</p>
        </div>
    );

    // Estado de loading
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] animate-pulse">
                <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mb-4" />
                <p className="text-slate-500 font-medium">Sincronizando dados da clínica...</p>
            </div>
        );
    }

    // Estado de erro geral
    if (hasError) {
        return (
            <div className="p-6">
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 max-w-2xl mx-auto text-center">
                    <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-rose-800 mb-2">Ops! Algo deu errado.</h3>
                    <p className="text-sm text-rose-600 mb-6">
                        Não conseguimos carregar todas as informações do dashboard.
                    </p>

                    <div className="text-left bg-white p-4 rounded-lg border border-rose-100 mb-6 text-xs text-rose-500 space-y-1">
                        {appointmentsError && <p>• Agenda: {appointmentsError.message}</p>}
                        {leadsError && <p>• CRM: {leadsError.message}</p>}
                        {patientsError && <p>• Pacientes: {patientsError.message}</p>}
                    </div>

                    <button
                        onClick={refetch}
                        className="px-6 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors font-medium shadow-sm"
                    >
                        Tentar Novamente
                    </button>
                </div>
            </div>
        );
    }

    // Funções auxiliares mantidas
    const handleConfirmAppointment = (id: string) => {
        console.log("Confirmar agendamento:", id);
    };

    const handleQuickLeadAction = (id: string) => {
        navigate("/pipeline"); // Redireciona para o novo Pipeline
    };

    const handleCompleteTask = (id: string) => {
        setCompletedTasks((prev) => [...prev, id]);
    };

    const getPatientPhone = (appointment: any) => {
        return ""; // TODO: Implementar busca real
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {/* SECTION 1: HEADER & KPI CARDS */}
            <div className="flex flex-col xl:flex-row gap-6 items-start justify-between">

                {/* Welcome Block */}
                <div className="flex-1 min-w-[300px]">
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">
                        Olá, {profile?.name?.split(' ')[0] || 'Doutor'}! 👋
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-2 text-sm">
                        <Calendar size={14} className="text-violet-500 dark:text-violet-400" />
                        <span className="capitalize">{new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}</span>
                        <span className="w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full" />
                        <span className="font-medium text-slate-700 dark:text-slate-300">{profile?.clinics?.name}</span>
                    </p>
                </div>

                {/* Global KPIs Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full xl:w-auto">
                    {/* KPI 1: Atendimentos */}
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Atendimentos</p>
                            <Activity size={16} className="text-blue-500 dark:text-blue-400" />
                        </div>
                        <div className="flex items-end gap-2">
                            <span className="text-2xl font-bold text-slate-800 dark:text-white">{kpis.confirmed}</span>
                            <span className="text-xs text-slate-400 dark:text-slate-500 mb-1">/ {kpis.appointments}</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full mt-3 overflow-hidden">
                            <div
                                className="bg-blue-500 dark:bg-blue-400 h-full rounded-full transition-all duration-1000"
                                style={{ width: `${kpis.appointments > 0 ? (kpis.confirmed / kpis.appointments) * 100 : 0}%` }}
                            />
                        </div>
                    </div>

                    {/* KPI 2: Oportunidades CRM */}
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Novos Leads</p>
                            <Target size={16} className="text-purple-500 dark:text-purple-400" />
                        </div>
                        <div className="flex items-end gap-2">
                            <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">{kpis.pendingLeads}</span>
                            <span className="text-xs text-purple-200 dark:text-purple-900 bg-purple-600 dark:bg-purple-400/20 rounded px-1 mb-1 font-bold">HOT</span>
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-3 align-bottom">Oportunidades ativas</p>
                    </div>

                    {/* KPI 3: Lembretes */}
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Pendências</p>
                            <ListTodo size={16} className="text-orange-500 dark:text-orange-400" />
                        </div>
                        <span className="text-2xl font-bold text-slate-800 dark:text-white">{reminders.length}</span>
                        <p className="text-[10px] text-orange-600 dark:text-orange-400 mt-3 font-medium">Requer atenção</p>
                    </div>

                    {/* KPI 4: Faturamento do Mês */}
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all relative overflow-hidden group cursor-pointer" onClick={() => navigate('/reports')}>
                        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                            <DollarSign size={48} className="text-green-600 dark:text-green-400" />
                        </div>
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Faturamento</p>
                        </div>
                        {loadingFinancial ? (
                            <div className="h-8 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" />
                        ) : (
                            <span className="text-xl font-bold text-green-600 dark:text-green-400">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(financialData.revenue)}
                            </span>
                        )}
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-4 flex items-center gap-1">
                            Ver relatórios <ArrowRight size={10} />
                        </p>
                    </div>
                </div>
            </div>

            {/* SECTION 1.5: DESEMPENHO FINANCEIRO */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 transition-all">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <DollarSign className="text-green-600 dark:text-green-400" size={20} />
                            Desempenho Financeiro
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Resumo do mês atual</p>
                    </div>
                    <button
                        onClick={() => navigate('/reports')}
                        className="text-xs text-violet-600 dark:text-violet-400 hover:text-violet-700 font-medium flex items-center gap-1"
                    >
                        Ver completo <ArrowRight size={12} />
                    </button>
                </div>

                {loadingFinancial ? (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-24 bg-slate-100 dark:bg-slate-700 rounded-lg animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Receita */}
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 p-4 rounded-lg border border-green-100 dark:border-green-800/30">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded">
                                    <DollarSign size={14} className="text-green-600 dark:text-green-400" />
                                </div>
                                <p className="text-xs font-bold text-green-700 dark:text-green-400 uppercase">Receita</p>
                            </div>
                            <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(financialData.revenue)}
                            </p>
                        </div>

                        {/* Despesas */}
                        <div className="bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-900/10 dark:to-red-900/10 p-4 rounded-lg border border-rose-100 dark:border-rose-800/30">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-1.5 bg-rose-100 dark:bg-rose-900/30 rounded">
                                    <TrendingDown size={14} className="text-rose-600 dark:text-rose-400" />
                                </div>
                                <p className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase">Despesas</p>
                            </div>
                            <p className="text-2xl font-bold text-rose-700 dark:text-rose-400">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(financialData.expenses)}
                            </p>
                        </div>

                        {/* Lucro */}
                        <div className={`
                            bg-gradient-to-br p-4 rounded-lg border
                            ${financialData.profit >= 0
                                ? 'from-blue-50 to-cyan-50 border-blue-100 dark:from-blue-900/10 dark:to-cyan-900/10 dark:border-blue-800/30'
                                : 'from-orange-50 to-amber-50 border-orange-100 dark:from-orange-900/10 dark:to-amber-900/10 dark:border-orange-800/30'} 
                        `}>
                            <div className="flex items-center gap-2 mb-2">
                                <div className={`p-1.5 rounded ${financialData.profit >= 0 ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-orange-100 dark:bg-orange-900/30'}`}>
                                    <Activity size={14} className={financialData.profit >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'} />
                                </div>
                                <p className={`text-xs font-bold uppercase ${financialData.profit >= 0 ? 'text-blue-700 dark:text-blue-400' : 'text-orange-700 dark:text-orange-400'}`}>Lucro</p>
                            </div>
                            <p className={`text-2xl font-bold ${financialData.profit >= 0 ? 'text-blue-700 dark:text-blue-400' : 'text-orange-700 dark:text-orange-400'}`}>
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(financialData.profit)}
                            </p>
                        </div>

                        {/* Margem */}
                        <div className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/10 dark:to-purple-900/10 p-4 rounded-lg border border-violet-100 dark:border-violet-800/30">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-1.5 bg-violet-100 dark:bg-violet-900/30 rounded">
                                    <Target size={14} className="text-violet-600 dark:text-violet-400" />
                                </div>
                                <p className="text-xs font-bold text-violet-700 dark:text-violet-400 uppercase">Margem</p>
                            </div>
                            <p className="text-2xl font-bold text-violet-700 dark:text-violet-400">
                                {financialData.profitMargin.toFixed(1)}%
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* SECTION 2: DESEMPENHO OPERACIONAL */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 transition-all">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <Activity className="text-blue-600 dark:text-blue-400" size={20} />
                            Desempenho Operacional
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Indicadores do mês atual</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Novos Pacientes */}
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/10 dark:to-cyan-900/10 p-4 rounded-lg border border-blue-100 dark:border-blue-800/30">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded">
                                <Users size={14} className="text-blue-600 dark:text-blue-400" />
                            </div>
                            <p className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase">Novos Pacientes</p>
                        </div>
                        <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{kpis.newPatients || 0}</p>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Este mês</p>
                    </div>

                    {/* Ticket Médio */}
                    <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/10 dark:to-green-900/10 p-4 rounded-lg border border-emerald-100 dark:border-emerald-800/30">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded">
                                <DollarSign size={14} className="text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase">Ticket Médio</p>
                        </div>
                        <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                            {financialData.revenue > 0 && kpis.appointments > 0
                                ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(financialData.revenue / kpis.appointments)
                                : 'R$ 0'}
                        </p>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">Por atendimento</p>
                    </div>

                    {/* Taxa de Conversão */}
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 p-4 rounded-lg border border-amber-100 dark:border-amber-800/30">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded">
                                <TrendingUp size={14} className="text-amber-600 dark:text-amber-400" />
                            </div>
                            <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase">Taxa de Conversão</p>
                        </div>
                        <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                            {kpis.pendingLeads > 0
                                ? `${((kpis.confirmed / (kpis.pendingLeads + kpis.confirmed)) * 100).toFixed(1)}%`
                                : '0%'}
                        </p>
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Leads → Pacientes</p>
                    </div>
                </div>
            </div>

            {/* SEÇÃO 0: CLINIC HEALTH (5 PILARES) */}
            <HealthPillars financialData={financialData} kpis={kpis} />

            {/* SECTION 1: AGENDA E COMPLIANCE */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">

                {/* COLUMN 1: AGENDA (Larger) */}
                <div className="xl:col-span-1 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                            <Clock className="text-violet-600" size={20} />
                            Agenda de Hoje
                        </h3>
                        <button onClick={() => navigate('/agenda')} className="text-sm font-medium text-violet-600 hover:text-violet-700 hover:underline">
                            Ver Completa
                        </button>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[400px]">
                        {todaysAppointments.length > 0 ? (
                            <div className="divide-y divide-slate-100">
                                {todaysAppointments.map((apt) => (
                                    <div key={apt.id} className="p-4 hover:bg-slate-50 transition-colors group">
                                        <div className="flex gap-4">
                                            <div className="flex flex-col items-center justify-center min-w-[50px] bg-slate-100/50 rounded-lg p-2 h-fit">
                                                <span className="text-sm font-bold text-slate-900">{apt.time}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <h4 className="font-bold text-slate-800 text-sm truncate">{apt.patientName}</h4>
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${apt.status === "Confirmado" ? "bg-green-100 text-green-700" :
                                                        apt.status === "Pendente" ? "bg-amber-100 text-amber-700" :
                                                            "bg-slate-100 text-slate-600"
                                                        }`}>
                                                        {apt.status}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-500 mt-0.5">{apt.type} • {apt.doctorName}</p>

                                                {/* Actions overlay for pending */}
                                                {apt.status === "Pendente" && (
                                                    <div className="flex gap-2 mt-3">
                                                        <button onClick={() => handleConfirmAppointment(apt.id)} className="flex-1 bg-green-50 text-green-700 hover:bg-green-100 py-1.5 rounded text-xs font-bold flex items-center justify-center gap-1 transition-colors">
                                                            <CheckCircle size={12} /> Confirmar
                                                        </button>
                                                        <button className="flex-1 bg-blue-50 text-blue-700 hover:bg-blue-100 py-1.5 rounded text-xs font-bold flex items-center justify-center gap-1 transition-colors">
                                                            <MessageCircle size={12} /> WhatsApp
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center p-8">
                                <EmptyState
                                    icon={Calendar}
                                    title="Agenda Livre"
                                    description="Nenhum agendamento encontrado para hoje."
                                />
                                <button onClick={() => navigate('/agenda')} className="mt-4 px-4 py-2 bg-violet-50 text-violet-700 rounded-lg text-sm font-bold hover:bg-violet-100 transition-colors">
                                    Agendar Paciente
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* COLUMN 2 & 3: OPERATIONAL & CRM (Combined Width) */}
                <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* TASKS / COMPLIANCE */}
                    <div className="space-y-6">
                        <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                            <CheckCircle className="text-teal-500" size={20} />
                            Lembretes & Compliance
                        </h3>

                        <ComplianceWidget />

                        <div className="space-y-3">
                            {reminders.length > 0 ? (
                                reminders.map(item => (
                                    <div key={item.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all relative group">
                                        <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full ${item.type === 'urgent' ? 'bg-rose-500' : 'bg-blue-500'
                                            }`} />

                                        <div className="ml-3">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${item.type === 'urgent' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'
                                                    }`}>
                                                    {item.type === 'urgent' ? 'Prioridade' : 'Lembrete'}
                                                </span>
                                                <button onClick={() => handleCompleteTask(item.id)} className="text-slate-300 hover:text-teal-500 transition-colors">
                                                    <CheckCircle size={18} />
                                                </button>
                                            </div>
                                            <h4 className="font-bold text-slate-700 text-sm">{item.title}</h4>
                                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.desc}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm border-dashed text-center">
                                    <p className="text-sm text-slate-500">Nenhum lembrete pendente.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* CRM QUEUE */}
                    <div className="space-y-6">
                        <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                            <User className="text-amber-500" size={20} />
                            Fila de Oportunidades
                        </h3>

                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full max-h-[500px]">
                            {priorityLeads.length > 0 ? (
                                <div className="divide-y divide-slate-100 overflow-y-auto">
                                    {priorityLeads.map((lead) => (
                                        <div key={lead.id} className="p-4 hover:bg-amber-50/50 transition-colors">
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-600">
                                                        {lead.name.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-bold text-slate-800 leading-tight">{lead.name}</h4>
                                                        <p className="text-[10px] text-slate-500 capitalize">{lead.source} • <span className="font-medium text-amber-600">{lead.status}</span></p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex gap-2 pl-10">
                                                <button className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors" title="WhatsApp">
                                                    <MessageCircle size={14} />
                                                </button>
                                                <button className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors" title="Ligar">
                                                    <Phone size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleQuickLeadAction(lead.id)}
                                                    className="ml-auto px-3 py-1.5 bg-slate-800 text-white rounded-lg text-[10px] font-bold hover:bg-slate-900 transition-colors flex items-center gap-1"
                                                >
                                                    Ver no Pipeline <ArrowRight size={10} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8">
                                    <EmptyState
                                        icon={Sparkles}
                                        title="Fila Limpa!"
                                        description="Todas as oportunidades recentes foram processadas."
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div >
    );
};

export default Dashboard;
