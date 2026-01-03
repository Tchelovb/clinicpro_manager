import React, { useState, useEffect } from 'react';
import { Brain, Sparkles, AlertCircle, TrendingUp, DollarSign, Users, ExternalLink, X } from 'lucide-react';
import { supabase } from '../src/lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { BOSChat } from './BOSChat';

interface Alert {
    id: string;
    title: string;
    explanation: string;
    priority: 'critico' | 'high' | 'medium' | 'low';
    category: string;
    related_entity_id: string | null;
    action_label: string;
    created_at: string;
}

const BOSIntelligencePage: React.FC = () => {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatContext, setChatContext] = useState<{ type: 'alert' | 'insight', priority: string, items: Alert[] } | undefined>(undefined);
    const [briefingContext, setBriefingContext] = useState('');
    const { profile } = useAuth();

    useEffect(() => {
        if (profile?.clinic_id) {
            fetchAlerts();
            // Refresh every 60 seconds
            const interval = setInterval(fetchAlerts, 60000);
            return () => clearInterval(interval);
        }
    }, [profile?.clinic_id]);

    const fetchAlerts = async () => {
        if (!profile?.clinic_id) {
            setLoading(false);
            return;
        }

        const { data, error } = await supabase
            .from('ai_insights')
            .select('*')
            .eq('clinic_id', profile.clinic_id)
            .eq('status', 'open')
            .order('priority', { ascending: true }) // critico, high, medium, low
            .order('created_at', { ascending: false });

        if (data && !error) {
            // Custom sort to ensure proper priority order
            const priorityOrder = { 'critico': 0, 'high': 1, 'medium': 2, 'low': 3 };
            const sorted = data.sort((a, b) => {
                const priorityDiff = (priorityOrder[a.priority] || 99) - (priorityOrder[b.priority] || 99);
                if (priorityDiff !== 0) return priorityDiff;
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            });
            setAlerts(sorted);
        }
        setLoading(false);
    };

    const dismissAlert = async (id: string) => {
        await supabase
            .from('ai_insights')
            .update({ status: 'resolved' })
            .eq('id', id);

        fetchAlerts();
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'critico': return 'border-red-500';
            case 'high': return 'border-orange-500';
            case 'medium': return 'border-yellow-500';
            case 'low': return 'border-blue-500';
            default: return 'border-gray-500';
        }
    };

    const getPriorityIcon = (priority: string) => {
        switch (priority) {
            case 'critico': return <AlertCircle size={24} className="text-red-600" />;
            case 'high': return <AlertCircle size={24} className="text-orange-600" />;
            case 'medium': return <TrendingUp size={24} className="text-yellow-600" />;
            case 'low': return <DollarSign size={24} className="text-blue-600" />;
            default: return <AlertCircle size={24} className="text-gray-600" />;
        }
    };

    const getPriorityLabel = (priority: string) => {
        switch (priority) {
            case 'critico': return 'CRÍTICO';
            case 'high': return 'ALTO';
            case 'medium': return 'MÉDIO';
            case 'low': return 'BAIXO';
            default: return priority.toUpperCase();
        }
    };

    const openChatWithBriefing = (context?: { type: 'alert' | 'insight', priority: string }) => {
        if (context) {
            let filtered: Alert[] = [];
            if (context.type === 'alert') {
                filtered = alerts.filter(a => classifyAlert(a) === 'risk' && a.priority === context.priority);
            } else {
                // Insights
                if (context.priority === 'high_crit') {
                    filtered = alerts.filter(a => classifyAlert(a) === 'opportunity' && (a.priority === 'critico' || a.priority === 'high'));
                } else {
                    filtered = alerts.filter(a => classifyAlert(a) === 'opportunity' && a.priority === context.priority);
                }
            }

            setChatContext({
                type: context.type,
                priority: context.priority === 'high_crit' ? 'Alta' : context.priority,
                items: filtered
            });
            setBriefingContext(''); // Clear standard briefing
        } else {
            // Standard Briefing
            setChatContext(undefined);

            // Get top 3 critical alerts
            const topAlerts = alerts
                .filter(a => a.priority === 'critico' || a.priority === 'high')
                .slice(0, 3);

            // Build briefing context
            const briefing = `BRIEFING DE COMANDO EXECUTIVO

Doutor Marcelo, aqui está o resumo dos ${topAlerts.length} alertas mais críticos:

${topAlerts.map((alert, index) => `
${index + 1}. ${alert.title}
   Prioridade: ${getPriorityLabel(alert.priority)}
   Situação: ${alert.explanation}
   Ação Recomendada: ${alert.action_label}
`).join('\n')}

Como posso ajudá-lo a resolver estas situações?`;

            setBriefingContext(briefing);
        }
        setIsChatOpen(true);
    };

    const criticalCount = alerts.filter(a => a.priority === 'critico').length;
    const highCount = alerts.filter(a => a.priority === 'high').length;
    const mediumCount = alerts.filter(a => a.priority === 'medium').length;
    const lowCount = alerts.filter(a => a.priority === 'low').length;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 md:pb-0">
            {/* Header */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-6 shadow-lg">
                <div className="flex justify-between items-center max-w-7xl mx-auto">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                            <Brain size={32} className="animate-pulse" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                BOS Intelligence
                                <Sparkles size={20} className="text-yellow-300" />
                            </h1>
                            <p className="text-sm text-purple-100">
                                Central de Comando Executivo - Alertas Estratégicos em Tempo Real
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* EXECUTIVE SUMMARY - AIR TRAFFIC CONTROL */}
            <div className="p-6 pb-2 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row gap-6 items-stretch">

                    {/* BLOCO A: ALERTAS (RISCOS) */}
                    <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl p-6 border-l-4 border-red-500 shadow-md relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <AlertCircle size={100} className="text-red-500" />
                        </div>
                        <div className="flex items-center justify-between mb-4 relative z-10">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                <AlertCircle className="text-red-500" size={24} />
                                ALERTAS
                            </h2>
                            <span className="bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                Reativo
                            </span>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-2 relative z-10">
                            <div
                                onClick={() => openChatWithBriefing({ type: 'alert', priority: 'critico' })}
                                className="text-center p-3 rounded-lg bg-red-50 dark:bg-red-900/10 cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors transform hover:scale-105 duration-200"
                            >
                                <p className="text-3xl font-black text-red-600 dark:text-red-400">{alerts.filter(a => classifyAlert(a) === 'risk' && a.priority === 'critico').length}</p>
                                <p className="text-xs font-bold text-red-800 dark:text-red-300 uppercase mt-1">Críticos</p>
                            </div>
                            <div
                                onClick={() => openChatWithBriefing({ type: 'alert', priority: 'high' })}
                                className="text-center p-3 rounded-lg bg-orange-50 dark:bg-orange-900/10 cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors transform hover:scale-105 duration-200"
                            >
                                <p className="text-3xl font-black text-orange-600 dark:text-orange-400">{alerts.filter(a => classifyAlert(a) === 'risk' && a.priority === 'high').length}</p>
                                <p className="text-xs font-bold text-orange-800 dark:text-orange-300 uppercase mt-1">Alta</p>
                            </div>
                            <div
                                onClick={() => openChatWithBriefing({ type: 'alert', priority: 'medium' })}
                                className="text-center p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/10 cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors transform hover:scale-105 duration-200"
                            >
                                <p className="text-3xl font-black text-yellow-600 dark:text-yellow-400">{alerts.filter(a => classifyAlert(a) === 'risk' && a.priority === 'medium').length}</p>
                                <p className="text-xs font-bold text-yellow-800 dark:text-yellow-300 uppercase mt-1">Média</p>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-4 relative z-10">
                            Foco: Proteção de Receita & Gestão de Crise
                        </p>
                    </div>

                    {/* CENTRAL ACTION */}
                    <div className="flex flex-col justify-center gap-4 min-w-[200px]">
                        <button
                            onClick={() => openChatWithBriefing()}
                            className="w-full h-full min-h-[140px] bg-gradient-to-b from-gray-900 to-gray-800 text-white rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex flex-col items-center justify-center gap-3 border border-gray-700/50 p-4 group"
                        >
                            <div className="p-4 bg-purple-600 rounded-full shadow-lg group-hover:animate-pulse">
                                <Brain size={32} className="text-white" />
                            </div>
                            <div className="text-center">
                                <span className="block font-bold text-lg">Consultar BOS</span>
                                <span className="text-xs text-gray-400">Briefing Executivo</span>
                            </div>
                        </button>
                    </div>

                    {/* BLOCO B: INSIGHTS (OPORTUNIDADES) */}
                    <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl p-6 border-l-4 border-blue-500 shadow-md relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Sparkles size={100} className="text-blue-500" />
                        </div>
                        <div className="flex items-center justify-between mb-4 relative z-10">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                <Sparkles className="text-blue-500" size={24} />
                                INSIGHTS
                            </h2>
                            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                Proativo
                            </span>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-2 relative z-10">
                            <div
                                onClick={() => openChatWithBriefing({ type: 'insight', priority: 'high_crit' })}
                                className="text-center p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/10 cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors transform hover:scale-105 duration-200"
                            >
                                <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{alerts.filter(a => classifyAlert(a) === 'opportunity' && (a.priority === 'critico' || a.priority === 'high')).length}</p>
                                <p className="text-xs font-bold text-indigo-800 dark:text-indigo-300 uppercase mt-1">Alta</p>
                            </div>
                            <div
                                onClick={() => openChatWithBriefing({ type: 'insight', priority: 'medium' })}
                                className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-900/10 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors transform hover:scale-105 duration-200"
                            >
                                <p className="text-3xl font-black text-blue-600 dark:text-blue-400">{alerts.filter(a => classifyAlert(a) === 'opportunity' && a.priority === 'medium').length}</p>
                                <p className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase mt-1">Média</p>
                            </div>
                            <div
                                onClick={() => openChatWithBriefing({ type: 'insight', priority: 'low' })}
                                className="text-center p-3 rounded-lg bg-cyan-50 dark:bg-cyan-900/10 cursor-pointer hover:bg-cyan-100 dark:hover:bg-cyan-900/30 transition-colors transform hover:scale-105 duration-200"
                            >
                                <p className="text-3xl font-black text-cyan-600 dark:text-cyan-400">{alerts.filter(a => classifyAlert(a) === 'opportunity' && a.priority === 'low').length}</p>
                                <p className="text-xs font-bold text-cyan-800 dark:text-cyan-300 uppercase mt-1">Baixa</p>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-4 relative z-10">
                            Foco: Novos Negócios & Otimização
                        </p>
                    </div>
                </div>
            </div>

            {/* DETAILED LISTS (COLLAPSIBLE/SEPARATED) */}
            <div className="p-6 pt-2 grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">

                {/* COLUMN 1: RISKS */}
                <div>
                    <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <AlertCircle size={16} /> Detalhe dos Alertas
                    </h3>
                    <div className="space-y-3">
                        {loading ? (
                            <div className="text-center py-8 text-gray-500">Carregando riscos...</div>
                        ) : alerts.filter(a => classifyAlert(a) === 'risk').length === 0 ? (
                            <div className="p-8 text-center bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                                <span className="text-gray-400 text-sm">Nenhum risco identificado. Operação segura. ✅</span>
                            </div>
                        ) : (
                            alerts.filter(a => classifyAlert(a) === 'risk').map(alert => (
                                <AlertCard key={alert.id} alert={alert} onDismiss={dismissAlert} theme="risk" />
                            ))
                        )}
                    </div>
                </div>

                {/* COLUMN 2: OPPORTUNITIES */}
                <div>
                    <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Sparkles size={16} /> Detalhe dos Insights
                    </h3>
                    <div className="space-y-3">
                        {loading ? (
                            <div className="text-center py-8 text-gray-500">Carregando oportunidades...</div>
                        ) : alerts.filter(a => classifyAlert(a) === 'opportunity').length === 0 ? (
                            <div className="p-8 text-center bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                                <span className="text-gray-400 text-sm">Buscando novas oportunidades... 🔎</span>
                            </div>
                        ) : (
                            alerts.filter(a => classifyAlert(a) === 'opportunity').map(alert => (
                                <AlertCard key={alert.id} alert={alert} onDismiss={dismissAlert} theme="opportunity" />
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* ChatBOS Modal */}
            {isChatOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-750 rounded-t-xl">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Brain size={20} className="text-purple-600" />
                                ChatBOS - Briefing de Comando
                            </h2>
                            <button
                                onClick={() => setIsChatOpen(false)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <BOSChat
                                isOpen={isChatOpen}
                                onClose={() => {
                                    setIsChatOpen(false);
                                    setChatContext(undefined);
                                }}
                                mode="embedded"
                                initialContext={chatContext}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Helper function to classify Alert vs Insight
const classifyAlert = (alert: Alert): 'risk' | 'opportunity' => {
    // Keywords for Opportunities
    const opportunityKeywords = ['upsell', 'reativação', 'oportunidade', 'roi', 'otimização', 'breakeven', 'pacote', 'investimento', 'crescimento', 'novo negócio', 'premium'];
    // Keywords for Risks (Explicit)
    const riskKeywords = ['inadimplência', 'atraso', 'risco', 'queda', 'sem contato', 'parado', 'no-show', 'cancelamento'];

    const titleLower = alert.title.toLowerCase();

    // Explicit overrides based on keywords
    if (opportunityKeywords.some(k => titleLower.includes(k))) return 'opportunity';
    if (riskKeywords.some(k => titleLower.includes(k))) return 'risk';

    // Priority-based default fallback
    // Critical is always Risk (unless keyword says otherwise)
    if (alert.priority === 'critico') return 'risk';
    // Low is usually Opportunity
    if (alert.priority === 'low') return 'opportunity';

    // Default assumption for High/Medium
    return alert.priority === 'high' ? 'risk' : 'opportunity';
};

// Sub-component for Cleaner Code
const AlertCard = ({ alert, onDismiss, theme }: { alert: Alert, onDismiss: (id: string) => void, theme: 'risk' | 'opportunity' }) => {
    const isRisk = theme === 'risk';
    const borderColor = isRisk
        ? (alert.priority === 'critico' ? 'border-red-500' : 'border-orange-500')
        : (alert.priority === 'high' || alert.priority === 'critico' ? 'border-indigo-500' : alert.priority === 'medium' ? 'border-blue-500' : 'border-cyan-500');

    const bgBadge = isRisk
        ? (alert.priority === 'critico' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800')
        : (alert.priority === 'high' ? 'bg-indigo-100 text-indigo-800' : 'bg-blue-100 text-blue-800');

    const Icon = isRisk ? AlertCircle : Sparkles;
    const iconColor = isRisk ? 'text-red-500' : 'text-blue-500';

    return (
        <div className={`bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm hover:shadow-md transition-all border-l-4 ${borderColor}`}>
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                    <div className="mt-1">
                        <Icon size={20} className={iconColor} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${bgBadge}`}>
                                {alert.priority === 'critico' ? 'Crítico' : alert.priority === 'high' ? 'Alta' : alert.priority === 'medium' ? 'Média' : 'Baixa'}
                            </span>
                            <span className="text-xs text-gray-400">
                                {new Date(alert.created_at).toLocaleDateString('pt-BR')}
                            </span>
                        </div>
                        <h4 className="font-bold text-gray-800 dark:text-gray-200 text-sm">{alert.title}</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{alert.explanation}</p>

                        {alert.action_label && (
                            <button
                                onClick={() => console.log('Action:', alert.action_label)} // Em breve: Ação real
                                className={`mt-3 px-3 py-1.5 rounded text-xs font-bold transition-colors flex items-center gap-1
                                    ${isRisk
                                        ? 'bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300'
                                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300'}`}
                            >
                                <ExternalLink size={12} />
                                {alert.action_label}
                            </button>
                        )}
                    </div>
                </div>
                <button
                    onClick={() => onDismiss(alert.id)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    title="Arquivar"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
};

export default BOSIntelligencePage;
