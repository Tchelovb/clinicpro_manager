import React from 'react';
import { OrthoContract, OrthoTreatmentPlan } from '../../services/orthoService';
import { Activity, Calendar, DollarSign, TrendingUp, CheckCircle } from 'lucide-react';

interface OrthoDashboardProps {
    contract: OrthoContract;
    plan: OrthoTreatmentPlan | null;
}

export const OrthoDashboard: React.FC<OrthoDashboardProps> = ({ contract, plan }) => {
    // Helper to calculate days overdue or until next maintenance
    const nextMaintenance = plan?.next_aligner_change_date || new Date().toISOString(); // Mock
    const daysUntil = Math.ceil((new Date(nextMaintenance).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

    // Status color (Adaptive)
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800';
            case 'SUSPENDED': return 'text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800';
            default: return 'text-muted-foreground bg-secondary border-border';
        }
    };

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* 1. Status & Phase */}
            <div className={`p-4 rounded-xl border ${getStatusColor(contract.status)} shadow-sm`}>
                <div className="flex items-start justify-between mb-2">
                    <span className="text-xs uppercase font-bold opacity-80">Status Atual</span>
                    <Activity size={16} />
                </div>
                <h3 className="text-lg font-black tracking-tight">{contract.status === 'ACTIVE' ? 'ATIVO' : 'SUSPENSO'}</h3>
                <p className="text-sm opacity-80 mt-1">
                    {contract.contract_type === 'ALIGNERS' ? 'Invisalign' : 'Fixo Metálico'}
                </p>
                {plan && (
                    <div className="mt-3 pt-3 border-t border-black/10 dark:border-white/10">
                        <span className="text-xs font-mono bg-black/10 dark:bg-white/10 px-2 py-1 rounded">
                            {plan.current_phase || 'DIAGNOSIS'}
                        </span>
                    </div>
                )}
            </div>

            {/* 2. Maintenance */}
            <div className="bg-card text-card-foreground border border-border rounded-xl p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2 text-blue-500 dark:text-blue-400">
                    <span className="text-xs uppercase font-bold text-muted-foreground">Próxima Consulta</span>
                    <Calendar size={16} />
                </div>
                <h3 className="text-lg font-bold">
                    {new Date(nextMaintenance).toLocaleDateString('pt-BR')}
                </h3>
                <p className={`text-sm mt-1 font-medium ${daysUntil < 0 ? 'text-destructive' : 'text-primary'}`}>
                    {daysUntil === 0 ? 'É HOJE!' : daysUntil < 0 ? `${Math.abs(daysUntil)} dias atrasado` : `Em ${daysUntil} dias`}
                </p>
            </div>

            {/* 3. Progress (Aligners or Phase) */}
            <div className="bg-card text-card-foreground border border-border rounded-xl p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2 text-purple-500 dark:text-purple-400">
                    <span className="text-xs uppercase font-bold text-muted-foreground">
                        {contract.contract_type === 'ALIGNERS' ? 'Alinhadores' : 'Evolução'}
                    </span>
                    <TrendingUp size={16} />
                </div>
                {contract.contract_type === 'ALIGNERS' && plan ? (
                    <div>
                        <div className="flex items-end gap-1 mb-1">
                            <span className="text-2xl font-black">{plan.current_aligner_upper}</span>
                            <span className="text-sm text-muted-foreground mb-1">/ {plan.total_aligners_upper}</span>
                        </div>
                        <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                            <div
                                className="bg-purple-600 h-full rounded-full transition-all"
                                style={{ width: `${(plan.current_aligner_upper / plan.total_aligners_upper) * 100}%` }}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 mt-2">
                        <CheckCircle className="text-emerald-500" size={20} />
                        <span className="text-foreground">Em dia</span>
                    </div>
                )}
            </div>

            {/* 4. Hygiene Score (Gamification) */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/10 border border-amber-200 dark:border-amber-800/30 rounded-xl p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2 text-amber-500 dark:text-amber-400">
                    <span className="text-xs uppercase font-bold text-amber-600/80 dark:text-amber-500/80">Smile Score</span>
                    <DollarSign size={16} />
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-3xl font-black text-amber-900 dark:text-white">95</span>
                    <span className="text-sm text-emerald-600 dark:text-emerald-400 font-bold">+5 pts</span>
                </div>
                <p className="text-xs text-amber-700/60 dark:text-amber-300/60 mt-2">Nível Ouro ⭐</p>
            </div>
        </div>
    );
};
