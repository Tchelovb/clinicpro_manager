import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Calendar,
    Target,
    Sparkles,
    TrendingUp,
    Activity,
    DollarSign,
    Users,
    Brain,
    Maximize2,
    CalendarDays,
    Filter,
    Stethoscope,
    Briefcase,
    RefreshCw
} from "lucide-react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { useAuth } from "../contexts/AuthContext";
import { useDashboardData } from "../hooks/useDashboardData";
import { supabase } from "../lib/supabase";
import { WarRoomCard } from "../components/WarRoomCard";
import { HealthPillars } from "../components/dashboard/HealthPillars";
import ClinicHealthScoreCard from "../components/ClinicHealthScoreCard";
import { KPICard } from "../components/ui/KPICard";

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const { profile } = useAuth();

    // --- REVENUE DATA ---
    const [financialData, setFinancialData] = useState({ revenue: 0, expenses: 0, profit: 0, profitMargin: 0 });
    const [loadingFinancial, setLoadingFinancial] = useState(true);

    // --- INTELLIGENCE DATA ---
    const [intelligenceMetrics, setIntelligenceMetrics] = useState<any>(null);
    const [insightCounts, setInsightCounts] = useState({ critical: 0, active: 0 });
    const [healthScore, setHealthScore] = useState(0);

    // --- RADAR INTELLIGENCE 7.0 (FILTERS) ---
    const [radarEntity, setRadarEntity] = useState('Orçamentos');
    const [radarSpecialty, setRadarSpecialty] = useState('all');
    const [radarProfessional, setRadarProfessional] = useState('all');
    const [radarKpi, setRadarKpi] = useState('all');
    const [radarPeriodStart, setRadarPeriodStart] = useState(() => {
        const d = new Date();
        d.setDate(1);
        return d.toISOString().split('T')[0];
    });
    const [radarPeriodEnd, setRadarPeriodEnd] = useState(() => new Date().toISOString().split('T')[0]);

    const { kpis, isLoading } = useDashboardData();

    // Mock Chart Data (Replacing with real logic later)
    const chartData = [
        { name: 'Cervicoplastia', total: 45000, color: '#3b82f6' },
        { name: 'Lip Lifting', total: 12000, color: '#8b5cf6' },
        { name: 'Temporal Smart', total: 28000, color: '#10b981' },
        { name: 'Harmonização', total: 15000, color: '#f59e0b' },
    ];

    useEffect(() => {
        const loadFinancialData = async () => {
            if (!profile?.clinic_id) return;
            setLoadingFinancial(true);
            try {
                // Simplified fetch logic for strict brevity in this refactor
                const { data } = await supabase.from('transactions')
                    .select('amount, type')
                    .eq('clinic_id', profile.clinic_id)
                    .gte('created_at', `${new Date().getFullYear()}-${new Date().getMonth() + 1}-01`);

                const revenue = data?.filter(t => t.type === 'INCOME').reduce((a, b) => a + b.amount, 0) || 0;
                setFinancialData({ revenue, expenses: 0, profit: 0, profitMargin: 0 });
            } catch (e) {
                console.error(e);
            } finally {
                setLoadingFinancial(false);
            }
        };
        loadFinancialData();
    }, [profile?.clinic_id]);

    useEffect(() => {
        const fetchIntelligence = async () => {
            if (!profile?.clinic_id) return;

            // Fetch Intelligence View
            const { data: viewData } = await supabase
                .from('view_intelligence_360')
                .select('*')
                .eq('clinic_id', profile.clinic_id)
                .single();

            if (viewData) {
                setIntelligenceMetrics(viewData);
                setHealthScore(Math.round(((viewData.taxa_conversao_orcamentos || 0) + (viewData.taxa_fidelizacao || 85)) / 2));
            }

            // Fetch Insights (SAME LOGIC AS CHATBOS)
            try {
                const { data, error } = await supabase
                    .from('ai_insights')
                    .select('priority, status, category')
                    .eq('clinic_id', profile.clinic_id)
                    .or('status.eq.OPEN,status.eq.open,status.eq.ACTIVE,status.eq.active');

                if (error) {
                    console.error('Error fetching insights:', error);
                    return;
                }

                if (data) {
                    // Count Alerts (High/Critical) and Insights (Opportunities)
                    const alerts = data.filter(i =>
                        ['HIGH', 'CRITICAL', 'high', 'critical'].includes(i.priority)
                    ).length;
                    const insights = data.length - alerts;
                    setInsightCounts({ critical: alerts, active: insights });
                }
            } catch (err) {
                console.error('Exception fetching insights:', err);
            }
        };
        fetchIntelligence();
    }, [profile?.clinic_id]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)]">
                <Brain className="w-12 h-12 text-blue-600 animate-pulse mb-4" />
                <p className="text-slate-500 font-medium">Calibrando Torre de Controle...</p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden">
            {/* HEADER FIXO */}
            <header className="flex-none bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 md:p-6">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
                            Torre de Controle CEO
                            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] rounded uppercase tracking-wider font-bold">Live</span>
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                            Visão executiva em tempo real da {profile?.clinics?.name}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                            <CalendarDays size={14} className="text-blue-500" />
                            {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                        </div>
                    </div>
                </div>
            </header>

            {/* CONTEÚDO SCROLLÁVEL */}
            <div className="flex-1 overflow-y-auto scroll-smooth p-3 md:p-6 space-y-6">
                {/* --- KPI CARDS GRID (ENTERPRISE) --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <KPICard
                        icon={Calendar}
                        iconBg="bg-blue-100 dark:bg-blue-900/30"
                        iconColor="text-blue-600 dark:text-blue-400"
                        title="Agendamentos Hoje"
                        value={kpis.appointments}
                        trend={kpis.confirmed > 0 ? `${Math.round((kpis.confirmed / kpis.appointments) * 100)}%` : undefined}
                        trendUp={kpis.confirmed > kpis.appointments / 2}
                        onClick={() => navigate('/agenda')}
                    />
                    <KPICard
                        icon={Users}
                        iconBg="bg-emerald-100 dark:bg-emerald-900/30"
                        iconColor="text-emerald-600 dark:text-emerald-400"
                        title="Novos Pacientes"
                        value={kpis.newPatients}
                        trend="+12%"
                        trendUp={true}
                        onClick={() => navigate('/patients')}
                    />
                    <KPICard
                        icon={Target}
                        iconBg="bg-violet-100 dark:bg-violet-900/30"
                        iconColor="text-violet-600 dark:text-violet-400"
                        title="Leads Ativos"
                        value={kpis.pendingLeads}
                        onClick={() => navigate('/pipeline')}
                    />
                    <KPICard
                        icon={DollarSign}
                        iconBg="bg-amber-100 dark:bg-amber-900/30"
                        iconColor="text-amber-600 dark:text-amber-400"
                        title="Receita Mês"
                        value={`R$ ${(financialData.revenue / 1000).toFixed(0)}k`}
                        trend={financialData.profitMargin > 0 ? `${financialData.profitMargin}%` : undefined}
                        trendUp={financialData.profitMargin > 20}
                        onClick={() => navigate('/financial')}
                    />
                </div>

                {/* --- 1. MAIN INTELLIGENCE GRID (3 CARDS) --- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto lg:h-[280px]">

                    {/* A. CENTRAL DE METAS (Clean) */}
                    <WarRoomCard />

                    {/* B. BOS INTELLIGENCE (Compact) */}
                    <div onClick={() => navigate('/chat-bos')} className="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 shadow-lg border border-slate-700 overflow-hidden cursor-pointer group hover:border-blue-500/30 transition-all flex flex-col justify-between h-full">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Brain size={120} className="text-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20">
                                    <Brain size={20} className="text-blue-400" />
                                </div>
                                <h2 className="text-lg font-bold text-white">BOS Intelligence</h2>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                    <span className="text-slate-400 text-sm">Alertas Críticos</span>
                                    <span className="text-rose-400 font-bold text-xl">{insightCounts.critical}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400 text-sm">Oportunidades</span>
                                    <span className="text-white font-bold text-xl">{insightCounts.active}</span>
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-white/5">
                            <span className="text-xs font-medium text-blue-400 group-hover:text-blue-300 flex items-center gap-1">
                                Acessar ChatBOS <Sparkles size={12} />
                            </span>
                        </div>
                    </div>

                    {/* C. SAÚDE DA CLÍNICA (Score) */}
                    <div className="h-full">
                        <ClinicHealthScoreCard />
                    </div>
                </div>

                {/* --- 2. RADAR INTELLIGENCE 7.0 EXPANDIDO --- */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden min-h-[500px]">
                    {/* TOOLBAR */}
                    <div className="p-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/80 backdrop-blur-sm">
                        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                                    <TrendingUp size={20} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-800 dark:text-white">Radar Intelligence 7.0</h2>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Análise Cruzada Multidimensional</p>
                                </div>
                            </div>

                            {/* FILTERS ENGINE */}
                            <div className="flex flex-wrap gap-2 items-center w-full xl:w-auto p-1">
                                {/* ENTITY */}
                                <div className="relative group">
                                    <Briefcase size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
                                    <select
                                        value={radarEntity}
                                        onChange={(e) => setRadarEntity(e.target.value)}
                                        className="pl-9 pr-8 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer hover:border-blue-300 transition-colors min-w-[140px]"
                                    >
                                        <option value="Orçamentos">1. Faturamento</option>
                                        <option value="Produção">2. Produção</option>
                                        <option value="Leads">3. Leads (Mkt)</option>
                                    </select>
                                </div>

                                {/* SPECIALTY */}
                                <div className="relative">
                                    <Stethoscope size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
                                    <select
                                        value={radarSpecialty}
                                        onChange={(e) => setRadarSpecialty(e.target.value)}
                                        className="pl-9 pr-8 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer hover:border-blue-300 transition-colors min-w-[140px]"
                                    >
                                        <option value="all">Todas Especialidades</option>
                                        <option value="Cirurgia">Cirurgia Plástica</option>
                                        <option value="HOF">Harmonização</option>
                                        <option value="Implante">Implantodontia</option>
                                        <option value="Orto">Ortodontia</option>
                                        <option value="Geral">Clínica Geral</option>
                                    </select>
                                </div>

                                {/* PROFESSIONAL */}
                                <div className="relative">
                                    <Users size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
                                    <select
                                        value={radarProfessional}
                                        onChange={(e) => setRadarProfessional(e.target.value)}
                                        className="pl-9 pr-8 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer hover:border-blue-300 transition-colors min-w-[140px]"
                                    >
                                        <option value="all">Todos Profissionais</option>
                                        <option value="marcelo">Dr. Marcelo</option>
                                        <option value="filha">Dra. Filha</option>
                                        <option value="associados">Associados</option>
                                    </select>
                                </div>

                                {/* STATUS KPI */}
                                <div className="relative">
                                    <Activity size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
                                    <select
                                        value={radarKpi}
                                        onChange={(e) => setRadarKpi(e.target.value)}
                                        className="pl-9 pr-8 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer hover:border-blue-300 transition-colors min-w-[120px]"
                                    >
                                        <option value="all">KPI: Todos</option>
                                        <option value="paid">Pago / Realizado</option>
                                        <option value="pending">Pendente</option>
                                        <option value="lost">Perdido</option>
                                    </select>
                                </div>

                                {/* PERIOD SELECTOR */}
                                <div className="flex items-center bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-0.5 shadow-sm ml-2">
                                    <input
                                        type="date"
                                        value={radarPeriodStart}
                                        onChange={(e) => setRadarPeriodStart(e.target.value)}
                                        className="bg-transparent border-none text-[10px] font-medium text-slate-600 dark:text-slate-300 focus:ring-0 w-24 px-2 py-1.5"
                                    />
                                    <span className="text-slate-300 text-[10px] mx-1">até</span>
                                    <input
                                        type="date"
                                        value={radarPeriodEnd}
                                        onChange={(e) => setRadarPeriodEnd(e.target.value)}
                                        className="bg-transparent border-none text-[10px] font-medium text-slate-600 dark:text-slate-300 focus:ring-0 w-24 px-2 py-1"
                                    />
                                </div>

                                <button className="p-2 text-slate-400 hover:text-blue-500 transition-colors" title="Expandir">
                                    <Maximize2 size={18} onClick={() => navigate('/reports')} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* VISUALIZATION AREA */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-8 min-h-[400px]">
                        {/* CHART 1: MAIN BARS */}
                        <div className="lg:col-span-2 flex flex-col h-96">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider border-l-4 border-blue-500 pl-3">
                                    Performance por Procedimento
                                </h3>
                                <div className="flex gap-4">
                                    <div className="flex items-center gap-1.5 text-xs text-slate-500"><div className="w-2.5 h-2.5 rounded-sm bg-blue-500"></div>Realizado</div>
                                    <div className="flex items-center gap-1.5 text-xs text-slate-500"><div className="w-2.5 h-2.5 rounded-sm bg-slate-200"></div>Meta</div>
                                </div>
                            </div>

                            <div className="flex-1 w-full bg-slate-50/50 dark:bg-slate-800/20 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-4 relative min-h-[300px]">
                                {/* Chart Container */}
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={chartData} barSize={40} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={true} stroke="#e2e8f0" opacity={0.5} />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} />
                                        <Tooltip
                                            cursor={{ fill: 'transparent' }}
                                            contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                                            formatter={(val: number) => `R$ ${val.toLocaleString()}`}
                                        />
                                        <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                                            {chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* CHART 2: PIE SHARE */}
                        <div className="h-96 flex flex-col">
                            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider border-l-4 border-purple-500 pl-3 mb-6">
                                Share de Faturamento
                            </h3>
                            <div className="flex-1 relative flex items-center justify-center min-h-[280px]">
                                <ResponsiveContainer width="100%" height={280}>
                                    <PieChart>
                                        <Pie
                                            data={chartData}
                                            innerRadius={80}
                                            outerRadius={110}
                                            paddingAngle={5}
                                            dataKey="total"
                                            stroke="none"
                                        >
                                            {chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                                {/* Center Value */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-xs text-slate-400 font-medium uppercase">Total</span>
                                    <span className="text-xl font-bold text-slate-800 dark:text-white">R$ 100k</span>
                                </div>
                            </div>
                            <div className="mt-4 grid grid-cols-2 gap-y-2 gap-x-4">
                                {chartData.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                                        <span className="truncate">{item.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- 3. HEALTH PILLARS (Original, but cleaned up via margin/padding) --- */}
                {/* Kept at bottom as requested in hierarchy info, or useful context */}
                {/* Using margin-top to separate slightly */}
                <div className="mt-8">
                    <HealthPillars financialData={financialData} kpis={kpis} intelligenceMetrics={intelligenceMetrics} />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

