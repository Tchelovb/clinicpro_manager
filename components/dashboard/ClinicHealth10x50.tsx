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
    CheckCircle,
    Lightbulb,
    Heart,
    Star,
    Smile,
    ClipboardCheck,
    ShieldCheck,
    RefreshCw
} from 'lucide-react';
import { useOptimizedPillarScores } from '../../hooks/useOptimizedPillarScores';
import { CentralDeMetasRadar } from './CentralDeMetasRadar';
import { useAuth } from '../../contexts/AuthContext';

interface PillarCardProps {
    title: string;
    score: number;
    icon: React.ElementType;
    color: string;
    isLoading?: boolean;
}

const PillarCardSkeleton = () => (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 animate-pulse">
        <div className="flex justify-between items-start mb-3">
            <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
            <div className="flex flex-col items-end gap-1">
                <div className="w-8 h-6 bg-slate-200 dark:bg-slate-700 rounded"></div>
                <div className="w-12 h-3 bg-slate-200 dark:bg-slate-700 rounded"></div>
            </div>
        </div>
        <div className="w-24 h-4 bg-slate-200 dark:bg-slate-700 rounded mb-3"></div>
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/50">
            <div className="w-16 h-3 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </div>
    </div>
);

const PillarCard: React.FC<PillarCardProps> = ({ title, score, icon: Icon, color, isLoading }) => {
    if (isLoading) return <PillarCardSkeleton />;

    // Determine status based on score
    let status: 'healthy' | 'warning' | 'critical' = 'critical';
    if (score >= 70) status = 'healthy';
    else if (score >= 40) status = 'warning';

    const statusColor =
        status === 'healthy' ? 'text-emerald-500' :
            status === 'warning' ? 'text-amber-500' : 'text-rose-500';

    const paramColor =
        color === 'blue' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' :
            color === 'violet' ? 'bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400' :
                color === 'emerald' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' :
                    color === 'amber' ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400' :
                        color === 'rose' ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400' :
                            color === 'cyan' ? 'bg-cyan-50 text-cyan-600 dark:bg-cyan-900/20 dark:text-cyan-400' :
                                color === 'pink' ? 'bg-pink-50 text-pink-600 dark:bg-pink-900/20 dark:text-pink-400' :
                                    color === 'orange' ? 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400' :
                                        color === 'slate' ? 'bg-slate-50 text-slate-600 dark:bg-slate-900/20 dark:text-slate-400' :
                                            'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400'; // Default/Compliance

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 transition-all hover:shadow-md">
            <div className="flex justify-between items-start mb-3">
                <div className={`p-2 rounded-lg ${paramColor}`}>
                    <Icon size={20} />
                </div>
                <div className="flex flex-col items-end">
                    <span className={`text-xl font-bold ${statusColor}`}>{score}</span>
                    <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Score</span>
                </div>
            </div>

            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3">{title}</h3>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/50 flex items-center gap-2">
                {status === 'healthy' ? <CheckCircle size={14} className="text-emerald-500" /> : <AlertCircle size={14} className={status === 'warning' ? 'text-amber-500' : 'text-rose-500'} />}
                <span className={`text-xs font-medium ${status === 'healthy' ? 'text-emerald-600' : status === 'warning' ? 'text-amber-600' : 'text-rose-600'}`}>
                    {status === 'healthy' ? 'Saudável' : status === 'warning' ? 'Atenção' : 'Crítico'}
                </span>
            </div>
        </div>
    );
};

export const ClinicHealth10x50 = () => {
    const { user } = useAuth();
    const clinicId = user?.user_metadata?.clinic_id;
    const { pillarData, loading, isRefetching, lastUpdated, refresh, error } = useOptimizedPillarScores(clinicId);

    // Mapeamento de Configuração Visual dos 10 Pilares
    const pillarConfig: Record<string, { icon: React.ElementType, color: string }> = {
        'Atração': { icon: Megaphone, color: 'blue' },
        'Conversão': { icon: Briefcase, color: 'violet' },
        'Produção': { icon: Stethoscope, color: 'emerald' },
        'Lucro': { icon: DollarSign, color: 'rose' },
        'Inovação': { icon: Lightbulb, color: 'cyan' },
        'Retenção': { icon: Heart, color: 'pink' },
        'Encantamento': { icon: Star, color: 'amber' },
        'Gente': { icon: Smile, color: 'orange' },
        'Processos': { icon: ClipboardCheck, color: 'slate' },
        'Compliance': { icon: ShieldCheck, color: 'green' },
    };

    // Calculate IVC (Average)
    const ivcScore = pillarData.length > 0
        ? Math.round(pillarData.reduce((acc, curr) => acc + curr.A, 0) / pillarData.length)
        : 0;

    // Format last updated time
    const formatLastUpdated = (timestamp: number) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'agora mesmo';
        if (diffMins === 1) return 'há 1 minuto';
        if (diffMins < 60) return `há ${diffMins} minutos`;

        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Activity className="text-violet-600 dark:text-violet-400" size={20} />
                        Saúde da Clínica
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Índice de Vitalidade Corporativa: <strong className={ivcScore >= 70 ? 'text-emerald-500' : 'text-amber-500'}>{ivcScore}/100</strong>
                        {lastUpdated && (
                            <span className="ml-2 text-slate-400">
                                • Atualizado {formatLastUpdated(lastUpdated)}
                            </span>
                        )}
                    </p>
                </div>
                <button
                    onClick={refresh}
                    disabled={isRefetching}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Atualizar dados"
                >
                    <RefreshCw size={16} className={isRefetching ? 'animate-spin' : ''} />
                    {isRefetching ? 'Atualizando...' : 'Atualizar'}
                </button>
            </div>

            {/* Error State */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <p className="text-sm text-red-600 dark:text-red-400">
                        Erro ao carregar dados: {error}
                    </p>
                </div>
            )}

            {/* Radar Section - Destaque */}
            <div className="w-full">
                <CentralDeMetasRadar />
            </div>

            {/* Grid de 10 Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {loading ? (
                    // Show 10 skeleton loaders
                    Array.from({ length: 10 }).map((_, i) => <PillarCardSkeleton key={i} />)
                ) : pillarData.length > 0 ? (
                    pillarData.map((item) => {
                        const config = pillarConfig[item.pilar] || { icon: Activity, color: 'slate' };
                        return (
                            <PillarCard
                                key={item.pilar}
                                title={item.pilar}
                                score={item.A}
                                icon={config.icon}
                                color={config.color}
                            />
                        );
                    })
                ) : (
                    <div className="col-span-full text-center text-slate-400 py-8">
                        Nenhum dado de inteligência disponível. As sentinelas estão sendo iniciadas.
                    </div>
                )}
            </div>
        </div>
    );
};
