import React from 'react';
import { Lightbulb, TrendingUp, AlertCircle, ArrowRight, DollarSign, Users, Clock } from 'lucide-react';
import { useAIInsights } from '../hooks/useAIInsights';

export function BOSInsightsRadar() {
    const { insights, loading } = useAIInsights();

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse h-40 bg-gray-100 dark:bg-slate-800 rounded-xl" />
                ))}
            </div>
        );
    }

    if (insights.length === 0) {
        return (
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-900 p-8 rounded-xl border border-blue-100 dark:border-slate-700 mb-8">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500 rounded-xl">
                        <Lightbulb size={28} className="text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 dark:text-white mb-1">BOS Radar Ativo</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            O sistema está analisando orçamentos e leads. Insights aparecerão aqui em breve.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'OPPORTUNITY': return <TrendingUp size={20} />;
            case 'ALERT': return <AlertCircle size={20} />;
            case 'PREDICTION': return <DollarSign size={20} />;
            case 'KNOWLEDGE': return <Users size={20} />;
            default: return <Lightbulb size={20} />;
        }
    };

    const getColorClasses = (priority: string) => {
        switch (priority) {
            case 'HIGH': return 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
            case 'MEDIUM': return 'bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800';
            default: return 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800';
        }
    };

    return (
        <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg">
                        <Lightbulb size={20} className="text-white" />
                    </div>
                    <div>
                        <h2 className="font-bold text-gray-800 dark:text-white">Radar de Inteligência</h2>
                        <p className="text-xs text-gray-500">Oportunidades identificadas pelo BOS</p>
                    </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock size={14} />
                    <span>Atualizado agora</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {insights.map((insight) => (
                    <div
                        key={insight.id}
                        className={`bg-white dark:bg-slate-800 p-5 rounded-xl border shadow-sm hover:shadow-lg transition-all cursor-pointer ${getColorClasses(insight.priority)}`}
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className={`p-2 rounded-lg ${getColorClasses(insight.priority)}`}>
                                {getIcon(insight.type)}
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${insight.priority === 'HIGH' ? 'bg-red-100 text-red-700 dark:bg-red-900/40' :
                                    insight.priority === 'MEDIUM' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40' :
                                        'bg-blue-100 text-blue-700 dark:bg-blue-900/40'
                                    }`}>
                                    {insight.priority}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                    {insight.category}
                                </span>
                            </div>
                        </div>

                        <h3 className="font-bold text-gray-800 dark:text-white mb-2 leading-tight">
                            {insight.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                            {insight.description}
                        </p>

                        {insight.action_link && (
                            <button
                                onClick={() => window.location.href = insight.action_link!}
                                className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                            >
                                <span>{insight.action_label || 'Ver Oportunidade'}</span>
                                <ArrowRight size={16} />
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
