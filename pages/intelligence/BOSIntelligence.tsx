import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Brain, Sparkles, TrendingUp, AlertTriangle, Lightbulb, Zap, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface AIInsight {
    id: string;
    category: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    title: string;
    description: string;
    action_items: string[];
    created_at: string;
}

const BOSIntelligence: React.FC = () => {
    const navigate = useNavigate();
    const { profile } = useAuth();

    const [loading, setLoading] = useState(true);
    const [insights, setInsights] = useState<AIInsight[]>([]);

    useEffect(() => {
        loadInsights();
    }, []);

    const loadInsights = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('ai_insights')
                .select('*')
                .eq('clinic_id', profile?.clinic_id)
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) throw error;
            setInsights(data || []);
        } catch (error) {
            console.error('Erro ao carregar insights:', error);
        } finally {
            setLoading(false);
        }
    };

    const getPriorityConfig = (priority: string) => {
        const configs: Record<string, any> = {
            HIGH: { label: 'Alta', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
            MEDIUM: { label: 'Média', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
            LOW: { label: 'Baixa', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' }
        };
        return configs[priority] || configs.MEDIUM;
    };

    const getCategoryIcon = (category: string) => {
        const icons: Record<string, any> = {
            'Oportunidade': TrendingUp,
            'Alerta': AlertTriangle,
            'Recomendação': Lightbulb,
            'Otimização': Zap
        };
        return icons[category] || Sparkles;
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
                <Loader2 className="w-12 h-12 text-violet-600 animate-spin mb-4" />
                <p className="text-slate-500 font-medium">Carregando inteligência BOS...</p>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/intelligence')}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                    <ChevronLeft size={24} className="text-slate-400 dark:text-slate-500" />
                </button>
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
                        <Brain className="text-violet-600 dark:text-violet-400" size={32} />
                        BOS Intelligence
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">Insights e recomendações estratégicas da IA</p>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 transition-all hover:shadow-md">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
                            <Sparkles className="text-violet-600 dark:text-violet-400" size={20} />
                        </div>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Total Insights</p>
                    </div>
                    <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">{insights.length}</p>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 transition-all hover:shadow-md">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-rose-50 dark:bg-rose-900/20 rounded-lg">
                            <AlertTriangle className="text-rose-600 dark:text-rose-400" size={20} />
                        </div>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Alta Prioridade</p>
                    </div>
                    <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                        {insights.filter(i => i.priority === 'HIGH').length}
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 transition-all hover:shadow-md">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <TrendingUp className="text-green-600 dark:text-green-400" size={20} />
                        </div>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Oportunidades</p>
                    </div>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {insights.filter(i => i.category === 'Oportunidade').length}
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 transition-all hover:shadow-md">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                            <Lightbulb className="text-amber-600 dark:text-amber-400" size={20} />
                        </div>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Recomendações</p>
                    </div>
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                        {insights.filter(i => i.category === 'Recomendação').length}
                    </p>
                </div>
            </div>

            {/* Insights Feed */}
            {insights.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-12 text-center">
                    <Brain size={48} className="mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">IA Coletando Dados</h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-4">
                        O sistema BOS está analisando os dados da clínica para gerar insights estratégicos.
                    </p>
                    <p className="text-sm text-slate-400 dark:text-slate-500">
                        Insights começarão a aparecer em breve conforme a IA processa informações de atendimentos, financeiro e pipeline.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {insights.map(insight => {
                        const priorityConfig = getPriorityConfig(insight.priority);
                        const Icon = getCategoryIcon(insight.category);

                        // Ajuste dinâmico de cores para dark mode no card de insight
                        const priorityBg = priorityConfig.bg.replace('bg-', 'bg-').replace('-50', '-50 dark:bg-opacity-20');
                        const priorityText = priorityConfig.text.replace('text-', 'text-').replace('-700', '-700 dark:text-white');
                        const priorityBorder = priorityConfig.border.replace('border-', 'border-').replace('-200', '-200 dark:border-opacity-30');

                        return (
                            <div key={insight.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 hover:shadow-md transition-shadow">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-violet-50 dark:bg-violet-900/20 rounded-lg flex-shrink-0">
                                        <Icon className="text-violet-600 dark:text-violet-400" size={24} />
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{insight.category}</span>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${priorityConfig.bg} dark:bg-opacity-10 ${priorityConfig.text} dark:text-opacity-90 ${priorityConfig.border} dark:border-opacity-20`}>
                                                        {priorityConfig.label}
                                                    </span>
                                                </div>
                                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">{insight.title}</h3>
                                            </div>
                                            <span className="text-xs text-slate-400 dark:text-slate-500">
                                                {new Date(insight.created_at).toLocaleDateString('pt-BR')}
                                            </span>
                                        </div>

                                        <p className="text-slate-600 dark:text-slate-300 mb-4">{insight.description}</p>

                                        {insight.action_items && insight.action_items.length > 0 && (
                                            <div className="bg-slate-50 dark:bg-slate-700/30 rounded-lg p-4">
                                                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">Ações Recomendadas:</p>
                                                <ul className="space-y-1">
                                                    {insight.action_items.map((action, idx) => (
                                                        <li key={idx} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                                                            <span className="text-violet-600 dark:text-violet-400 mt-1">•</span>
                                                            <span>{action}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default BOSIntelligence;
