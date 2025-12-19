import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import {
    Sparkles,
    TrendingUp,
    AlertTriangle,
    Lightbulb,
    X,
    ArrowRight,
    BrainCircuit,
    RefreshCw
} from "lucide-react";

export interface AIInsight {
    id: string;
    type: 'ALERT' | 'OPPORTUNITY' | 'KNOWLEDGE' | 'PREDICTION';
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    category: 'FINANCE' | 'MARKETING' | 'CLINICAL' | 'OPERATIONAL';
    title: string;
    description: string;
    action_label?: string;
    action_link?: string;
    is_read: boolean;
    created_at: string;
}

const AIInsightsFeed: React.FC = () => {
    const [insights, setInsights] = useState<AIInsight[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        fetchInsights();

        // Inscricao Realtime
        const subscription = supabase
            .channel('ai_insights_changes')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'ai_insights'
            }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    setInsights(prev => [payload.new as AIInsight, ...prev]);
                } else if (payload.eventType === 'UPDATE') {
                    setInsights(prev => prev.map(i => i.id === payload.new.id ? payload.new as AIInsight : i));
                }
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const fetchInsights = async () => {
        try {
            const session = await supabase.auth.getSession();
            if (!session.data.session) return;

            const { data, error } = await supabase
                .from('ai_insights')
                .select('*')
                .eq('is_read', false) // Apenas não lidos por padrão
                .order('priority', { ascending: false }) // Prioridade ALTA primeiro
                .order('generated_at', { ascending: false })
                .limit(5);

            if (error) throw error;
            setInsights(data || []);
        } catch (error) {
            console.error('Error fetching insights:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id: string) => {
        // Optimistic update
        setInsights(prev => prev.filter(i => i.id !== id));

        await supabase
            .from('ai_insights')
            .update({ is_read: true })
            .eq('id', id);
    };

    const generateMockInsight = async () => {
        setGenerating(true);
        try {
            // Simula um delay de processamento da IA
            await new Promise(resolve => setTimeout(resolve, 1500));

            const clinicId = (await supabase.auth.getUser()).data.user?.user_metadata?.clinic_id
                || (await supabase.from('clinics').select('id').limit(1).single()).data?.id;

            if (!clinicId) return;

            const mockInsights = [
                {
                    clinic_id: clinicId,
                    type: 'ALERT',
                    priority: 'HIGH',
                    category: 'FINANCE',
                    title: 'Margem Crítica: Harmonização Facial',
                    description: 'Sua margem atual é de 12%, abaixo do mínimo ideal de 30%. O custo de materiais subiu recentemente.',
                    action_label: 'Ajustar Preços',
                    action_link: '/settings',
                    is_read: false
                },
                {
                    clinic_id: clinicId,
                    type: 'OPPORTUNITY',
                    priority: 'MEDIUM',
                    category: 'MARKETING',
                    title: 'Oportunidade de Recall',
                    description: 'Você tem 15 pacientes de Botox que não retornam há 6 meses. Potencial de receita: R$ 22.500.',
                    action_label: 'Ver Lista de Pacientes',
                    action_link: '/patients',
                    is_read: false
                }
            ];

            // Escolhe um aleatório para inserir
            const randomInsight = mockInsights[Math.floor(Math.random() * mockInsights.length)];

            const { error } = await supabase.from('ai_insights').insert(randomInsight);
            if (error) throw error;

        } catch (error) {
            console.error('Error generating mock insight:', error);
        } finally {
            setGenerating(false);
        }
    };

    if (loading) return null;

    // Se não houver insights, mostra botão de gerar (apenas demo)
    if (insights.length === 0) {
        return (
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-indigo-100 dark:border-indigo-800 mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-white dark:bg-gray-800 rounded-full shadow-sm text-indigo-600 dark:text-indigo-400">
                        <BrainCircuit size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-indigo-900 dark:text-indigo-100">BOS Intelligence</h3>
                        <p className="text-sm text-indigo-700 dark:text-indigo-300">
                            O sistema está analisando seus dados em segundo plano...
                        </p>
                    </div>
                </div>
                <button
                    onClick={generateMockInsight}
                    disabled={generating}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                    {generating ? <RefreshCw className="animate-spin" size={16} /> : <Sparkles size={16} />}
                    {generating ? 'Processando...' : 'Forçar Análise Agora'}
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                    <Sparkles className="text-indigo-500" size={18} />
                    Insights Estratégicos (BOS)
                </h3>
                <span className="text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                    {insights.length} novos alertas
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {insights.map((insight) => (
                    <div
                        key={insight.id}
                        className={`
              relative p-5 rounded-xl border shadow-sm transition-all duration-300 hover:shadow-md
              ${insight.priority === 'HIGH'
                                ? 'bg-red-50/50 border-red-100 dark:bg-red-900/10 dark:border-red-800'
                                : 'bg-white border-gray-100 dark:bg-gray-800 dark:border-gray-700'}
            `}
                    >
                        {/* Fechar/Ler */}
                        <button
                            onClick={() => markAsRead(insight.id)}
                            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            title="Marcar como lido"
                        >
                            <X size={16} />
                        </button>

                        {/* Cabeçalho */}
                        <div className="flex items-center gap-3 mb-3">
                            <div className={`
                p-2 rounded-lg
                ${insight.type === 'ALERT' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                                    insight.type === 'OPPORTUNITY' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                                        'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'}
              `}>
                                {insight.type === 'ALERT' ? <AlertTriangle size={18} /> :
                                    insight.type === 'OPPORTUNITY' ? <TrendingUp size={18} /> :
                                        <Lightbulb size={18} />}
                            </div>
                            <div>
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${insight.priority === 'HIGH' ? 'text-red-600' : 'text-gray-500'
                                    }`}>
                                    {insight.category} • {insight.priority === 'HIGH' ? 'Crítico' : 'Info'}
                                </span>
                                <h4 className="font-bold text-gray-800 dark:text-white leading-tight">
                                    {insight.title}
                                </h4>
                            </div>
                        </div>

                        {/* Conteúdo */}
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                            {insight.description}
                        </p>

                        {/* Ação */}
                        {insight.action_link && (
                            <a
                                href={`#${insight.action_link}`}
                                className={`
                  inline-flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-lg transition-colors
                  ${insight.priority === 'HIGH'
                                        ? 'bg-red-600 text-white hover:bg-red-700'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'}
                `}
                            >
                                {insight.action_label || 'Ver Detalhes'}
                                <ArrowRight size={14} />
                            </a>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AIInsightsFeed;
