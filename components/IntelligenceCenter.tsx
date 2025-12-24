import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useBusinessGoals } from '../hooks/useBusinessGoals';
import { useComercialMetrics, useClinicoMetrics, useFinanceiroMetrics } from '../hooks/useIntelligenceViews';
import { PilaresTab } from './intelligence/PilaresTab';
import { InsightsTab } from './intelligence/InsightsTab';
import { WarRoomTab } from './intelligence/WarRoomTab';
import { supabase } from '../lib/supabase';
import {
    Activity, Lightbulb, Target, AlertCircle, Calendar
} from 'lucide-react';

// Master Navigation Types
type MasterView = 'pilares' | 'insights' | 'war-room' | 'alertas';
type PilarSubView = 'marketing' | 'vendas' | 'clinico' | 'operacional' | 'financeiro';

const IntelligenceCenter: React.FC = () => {
    const { patients, globalFinancials, leads, treatments, appointments } = useData();
    const { goals } = useBusinessGoals();
    const { profile } = useAuth();

    // Master Navigation State
    const [masterView, setMasterView] = useState<MasterView>('pilares');
    const [pilarSubView, setPilarSubView] = useState<PilarSubView>('marketing');

    // Date Range State (Unified Period Selector)
    const [startDate, setStartDate] = useState<Date>(() => {
        const date = new Date();
        date.setDate(1); // First day of current month
        return date;
    });
    const [endDate, setEndDate] = useState<Date>(new Date());

    // Critical Alerts Count (for badge)
    const [criticalAlertsCount, setCriticalAlertsCount] = useState(0);

    // Fetch real-time metrics from SQL Views
    const { metrics: comercialMetrics, loading: comercialLoading } = useComercialMetrics(startDate, endDate);
    const { metrics: clinicoMetrics, loading: clinicoLoading } = useClinicoMetrics(startDate, endDate);
    const { metrics: financeiroMetrics, loading: financeiroLoading } = useFinanceiroMetrics(startDate, endDate);

    // 🚀 AUTO-EXECUTE NATIVE INSIGHTS ENGINE
    // Runs automatically when Intelligence Center loads
    // Generates fresh insights without needing CRON
    useEffect(() => {
        const generateInsights = async () => {
            if (!profile?.clinic_id) return;

            try {
                console.log('🔄 Executando Motor de Insights Nativo...');

                const { error } = await supabase.rpc('generate_native_insights', {
                    p_clinic_id: profile.clinic_id
                });

                if (error) {
                    console.error('❌ Erro ao gerar insights:', error);
                } else {
                    console.log('✅ Insights atualizados com sucesso!');
                }
            } catch (err) {
                console.error('❌ Erro ao executar motor de insights:', err);
            }
        };

        generateInsights();
    }, [profile?.clinic_id]); // Executa quando o componente monta

    // Helper functions
    const getDateRange = (start: Date, end: Date) => ({ startDate: start, endDate: end });

    const getPreviousPeriodRange = (start: Date, end: Date) => {
        const duration = end.getTime() - start.getTime();
        return {
            startDate: new Date(start.getTime() - duration),
            endDate: new Date(start.getTime() - 1)
        };
    };

    const filterByDateRange = (data: any[], dateField: string, range: { startDate: Date; endDate: Date }) => {
        return data.filter(item => {
            const itemDate = new Date(item[dateField]);
            return itemDate >= range.startDate && itemDate <= range.endDate;
        });
    };

    // KPI Engine: Unified Data from SQL Views
    const kpis = useMemo(() => {
        // Financial Metrics
        const totalRevenue = financeiroMetrics.faturamentoRealizado || 0;
        const totalExpense = financeiroMetrics.despesasTotais || 0;
        const netResult = financeiroMetrics.saldoLiquido || 0;
        const totalReceivables = patients.reduce((acc, p) => acc + (p.balance_due || 0), 0);
        const payingPatients = patients.filter(p => (p.total_paid || 0) > 0).length || 1;
        const ticketAvg = totalRevenue / payingPatients;

        // Commercial Metrics
        const totalLeads = comercialMetrics.totalOportunidades || 0;
        const wonLeads = Math.round((comercialMetrics.taxaConversao / 100) * totalLeads);
        const conversionRate = comercialMetrics.taxaConversao || 0;

        // Clinical Metrics
        const totalTreatments = clinicoMetrics.totalProducao || 0;
        const completedTreatments = Math.round(totalTreatments * 0.7);

        // Operational Metrics
        const range = getDateRange(startDate, endDate);
        const periodAppts = filterByDateRange(appointments, 'date', range);
        const totalAppts = periodAppts.length || 1;
        const completedAppts = periodAppts.filter(a => a.status === 'Concluído').length;
        const canceledAppts = periodAppts.filter(a => a.status === 'Cancelado' || a.status === 'Faltou').length;
        const noShowRate = (canceledAppts / totalAppts) * 100;

        // Calculate trends
        const prevRange = getPreviousPeriodRange(startDate, endDate);
        const prevPeriodFinancials = filterByDateRange(globalFinancials, 'date', prevRange);
        const prevRevenue = prevPeriodFinancials.filter(r => r.type === 'income').reduce((acc, r) => acc + r.amount, 0);
        const prevExpense = prevPeriodFinancials.filter(r => r.type === 'expense').reduce((acc, r) => acc + r.amount, 0);
        const prevNetResult = prevRevenue - prevExpense;

        const revenueTrend = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;
        const expenseTrend = prevExpense > 0 ? ((totalExpense - prevExpense) / prevExpense) * 100 : 0;
        const netResultTrend = prevNetResult !== 0 ? ((netResult - prevNetResult) / Math.abs(prevNetResult)) * 100 : 0;

        return {
            totalRevenue, totalExpense, netResult, ticketAvg, totalReceivables,
            conversionRate, totalLeads, wonLeads,
            noShowRate, totalAppts, completedAppts,
            totalTreatments, completedTreatments,
            revenueTrend, expenseTrend, netResultTrend,
            prevRevenue, prevExpense, prevNetResult
        };
    }, [financeiroMetrics, comercialMetrics, clinicoMetrics, patients, appointments, startDate, endDate, globalFinancials]);

    // Compact Master Button Component
    const MasterButton = ({ view, label, icon: Icon, alertCount }: any) => (
        <button
            onClick={() => setMasterView(view)}
            className={`relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${masterView === view
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
        >
            <Icon size={14} />
            <span className="hidden sm:inline">{label}</span>
            {alertCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center animate-pulse">
                    {alertCount}
                </span>
            )}
        </button>
    );

    // Compact Pilar Sub-Navigation Component
    const PilarSubNav = () => {
        const pilares = [
            { id: 'marketing', label: '1. Marketing', short: 'Marketing' },
            { id: 'vendas', label: '2. Vendas', short: 'Vendas' },
            { id: 'clinico', label: '3. Clínico', short: 'Clínico' },
            { id: 'operacional', label: '4. Operacional', short: 'Operacional' },
            { id: 'financeiro', label: '5. Financeiro', short: 'Financeiro' }
        ];

        return (
            <div className="flex gap-6 border-b border-gray-200 dark:border-gray-700">
                {pilares.map(pilar => (
                    <button
                        key={pilar.id}
                        onClick={() => setPilarSubView(pilar.id as PilarSubView)}
                        className={`pb-2 text-sm font-medium transition-all relative ${pilarSubView === pilar.id
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        <span className="hidden md:inline">{pilar.label}</span>
                        <span className="md:hidden">{pilar.short}</span>
                        {pilarSubView === pilar.id && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"></div>
                        )}
                    </button>
                ))}
            </div>
        );
    };

    // Compact Period Selector Component
    const PeriodSelector = () => (
        <div className="flex items-center gap-3 py-2 px-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <Calendar className="text-gray-400" size={14} />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Período:</span>
            <input
                type="date"
                value={startDate.toISOString().split('T')[0]}
                onChange={(e) => setStartDate(new Date(e.target.value))}
                className="px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
            />
            <span className="text-xs text-gray-400">até</span>
            <input
                type="date"
                value={endDate.toISOString().split('T')[0]}
                onChange={(e) => setEndDate(new Date(e.target.value))}
                className="px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
            />
            {(comercialLoading || clinicoLoading || financeiroLoading) && (
                <span className="text-[10px] text-blue-600 dark:text-blue-400 animate-pulse font-medium">
                    ● Atualizando...
                </span>
            )}
        </div>
    );

    return (
        <div className="space-y-3 pb-20 md:pb-0">
            {/* COMPACT HEADER - Single Line */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <Activity className="text-blue-600 dark:text-blue-400" size={20} />
                        Intelligence Center 7.0
                    </h1>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">Cockpit Executivo</p>
                </div>

                {/* COMPACT MASTER NAVIGATION - Right Side */}
                <div className="flex gap-1.5">
                    <MasterButton view="pilares" label="5 Pilares" icon={Activity} />
                    <MasterButton view="insights" label="Insights" icon={Lightbulb} />
                    <MasterButton view="war-room" label="Central de Metas" icon={Target} />
                    <MasterButton view="alertas" label="Alertas" icon={AlertCircle} alertCount={criticalAlertsCount} />
                </div>
            </div>

            {/* COMPACT PERIOD SELECTOR */}
            <PeriodSelector />

            {/* CONDITIONAL SUB-NAVIGATION (Compact Tabs) */}
            {masterView === 'pilares' && <PilarSubNav />}

            {/* CONTENT AREA */}
            <div className="animate-in fade-in">
                {masterView === 'pilares' && (
                    <PilaresTab
                        period={`${startDate.toLocaleDateString('pt-BR')} - ${endDate.toLocaleDateString('pt-BR')}`}
                        comercialMetrics={comercialMetrics}
                        clinicoMetrics={clinicoMetrics}
                        financeiroMetrics={financeiroMetrics}
                        kpis={kpis}
                        goals={goals}
                        activeSubView={pilarSubView}
                    />
                )}

                {masterView === 'insights' && (
                    <InsightsTab
                        period={`${startDate.toLocaleDateString('pt-BR')} - ${endDate.toLocaleDateString('pt-BR')}`}
                        strategicOnly={true}  // FIXED: Show only medium/low priority
                    />
                )}

                {masterView === 'war-room' && (
                    <WarRoomTab
                        goals={goals}
                        kpis={kpis}
                        period={`${startDate.toLocaleDateString('pt-BR')} - ${endDate.toLocaleDateString('pt-BR')}`}
                    />
                )}

                {masterView === 'alertas' && (
                    <InsightsTab
                        period={`${startDate.toLocaleDateString('pt-BR')} - ${endDate.toLocaleDateString('pt-BR')}`}
                        criticalOnly={true}  // Show only critical/high priority
                        onAlertsCountChange={setCriticalAlertsCount}
                    />
                )}
            </div>
        </div>
    );
};

export default IntelligenceCenter;
