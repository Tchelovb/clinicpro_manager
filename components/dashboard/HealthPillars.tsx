import React from 'react';
import {
    Activity,
    DollarSign,
    Users,
    Megaphone,
    Stethoscope,
    Briefcase,
    TrendingUp,
    AlertCircle,
    CheckCircle
} from 'lucide-react';

interface HealthPillarProps {
    title: string;
    score: number;
    icon: React.ElementType;
    color: string;
    metrics: { label: string; value: string }[];
    status: 'healthy' | 'warning' | 'critical';
}

const PillarCard: React.FC<HealthPillarProps> = ({ title, score, icon: Icon, color, metrics, status }) => {
    const statusColor =
        status === 'healthy' ? 'text-emerald-500' :
            status === 'warning' ? 'text-amber-500' : 'text-rose-500';

    const paramColor =
        color === 'blue' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' :
            color === 'violet' ? 'bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400' :
                color === 'emerald' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' :
                    color === 'amber' ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400' :
                        'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400';

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 transition-all hover:shadow-md">
            <div className="flex justify-between items-start mb-3">
                <div className={`p-2 rounded-lg ${paramColor}`}>
                    <Icon size={20} />
                </div>
                <div className="flex flex-col items-end">
                    <span className={`text-xl font-bold ${statusColor}`}>{score}%</span>
                    <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">IVC Score</span>
                </div>
            </div>

            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3">{title}</h3>

            <div className="space-y-2">
                {metrics.map((m, idx) => (
                    <div key={idx} className="flex justify-between text-xs">
                        <span className="text-slate-500 dark:text-slate-400">{m.label}</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">{m.value}</span>
                    </div>
                ))}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/50 flex items-center gap-2">
                {status === 'healthy' ? <CheckCircle size={14} className="text-emerald-500" /> : <AlertCircle size={14} className={status === 'warning' ? 'text-amber-500' : 'text-rose-500'} />}
                <span className={`text-xs font-medium ${status === 'healthy' ? 'text-emerald-600' : status === 'warning' ? 'text-amber-600' : 'text-rose-600'}`}>
                    {status === 'healthy' ? 'Saudável' : status === 'warning' ? 'Atenção Necessária' : 'Crítico'}
                </span>
            </div>
        </div>
    );
};

export const HealthPillars: React.FC<{
    financialData: any;
    kpis: any;
}> = ({ financialData, kpis }) => {

    // Cálculos Simulados de Score (Normalizar para 0-100)

    // 1. Marketing: Baseado em Leads Novos. Meta: 30 leads/mês
    const leadsRate = Math.min((kpis.pendingLeads / 30) * 100, 100);
    const marketingScore = Math.round(leadsRate);

    // 2. Vendas: Baseado em Conversão. Meta: 20%
    const conversionRate = kpis.pendingLeads > 0
        ? (kpis.confirmed / (kpis.pendingLeads + kpis.confirmed)) * 100
        : 0;
    const salesScore = Math.min(Math.round((conversionRate / 20) * 100), 100);

    // 3. Clínico: Baseado em Recalls/Retorno (Simulado pois falta dados reais de recall no hook)
    const clinicalScore = 85;

    // 4. Operacional: Baseado em Agenda/No-Show (Simulado)
    const operationalScore = 92;

    // 5. Financeiro: Baseado em Margem. Meta: 30%
    const financialScore = Math.min(Math.round((financialData.profitMargin / 30) * 100), 100);

    // IVC Geral
    const ivcScore = Math.round((marketingScore + salesScore + clinicalScore + operationalScore + financialScore) / 5);

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Activity className="text-violet-600 dark:text-violet-400" size={20} />
                        Clinic Health (IVC)
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Índice de Vitalidade Corporativa: <strong className={ivcScore >= 70 ? 'text-emerald-500' : 'text-amber-500'}>{ivcScore}/100</strong>
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <PillarCard
                    title="Marketing"
                    score={marketingScore}
                    icon={Megaphone}
                    color="blue"
                    status={marketingScore >= 70 ? 'healthy' : marketingScore >= 50 ? 'warning' : 'critical'}
                    metrics={[
                        { label: 'Novos Leads', value: kpis.pendingLeads.toString() },
                        { label: 'Custo/Lead', value: 'R$ 15,00' } // Mock
                    ]}
                />

                <PillarCard
                    title="Vendas"
                    score={salesScore}
                    icon={Briefcase}
                    color="violet"
                    status={salesScore >= 70 ? 'healthy' : salesScore >= 50 ? 'warning' : 'critical'}
                    metrics={[
                        { label: 'Conversão', value: `${conversionRate.toFixed(1)}%` },
                        { label: 'Pipeline', value: `R$ ${new Intl.NumberFormat('pt-BR', { notation: 'compact' }).format(kpis.pendingLeads * 500)}` } // Estimativa
                    ]}
                />

                <PillarCard
                    title="Clínico"
                    score={clinicalScore}
                    icon={Stethoscope}
                    color="emerald"
                    status={clinicalScore >= 70 ? 'healthy' : 'warning'}
                    metrics={[
                        { label: 'Recalls', value: '12 Pend.' },
                        { label: 'NPS', value: '92' }
                    ]}
                />

                <PillarCard
                    title="Operacional"
                    score={operationalScore}
                    icon={Users}
                    color="amber"
                    status={operationalScore >= 70 ? 'healthy' : 'warning'}
                    metrics={[
                        { label: 'Ocupação', value: '85%' },
                        { label: 'No-Show', value: '4%' }
                    ]}
                />

                <PillarCard
                    title="Financeiro"
                    score={financialScore}
                    icon={DollarSign}
                    color="rose"
                    status={financialScore >= 70 ? 'healthy' : financialScore >= 50 ? 'warning' : 'critical'}
                    metrics={[
                        { label: 'Margem', value: `${financialData.profitMargin.toFixed(1)}%` },
                        { label: 'Lucro Líq.', value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(financialData.profit) }
                    ]}
                />
            </div>
        </div>
    );
};
