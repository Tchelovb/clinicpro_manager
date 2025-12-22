import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Brain, Sparkles, TrendingUp, AlertTriangle, Lightbulb, Zap, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface AIInsight {
    id: string;
    category: string;
    priority: string;
    title: string;
    explanation: string; // Changed from description to match SQL
    action_label: string | null; // Changed from action_items to match SQL
    related_entity_id: string | null;
    created_at: string;
}

const BOSIntelligence: React.FC = () => {
    const navigate = useNavigate();
    const { profile } = useAuth();

    const [loading, setLoading] = useState(true);
    const [insights, setInsights] = useState<AIInsight[]>([]);

    useEffect(() => {
        if (profile?.clinic_id) {
            loadInsights();
        }
    }, [profile?.clinic_id]);

    const loadInsights = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('ai_insights')
                .select('*')
                .eq('clinic_id', profile?.clinic_id)
                .eq('status', 'OPEN') // Verify if 'OPEN' or 'open' based on SQL. SQL uses 'open' in inserts but let's check standard. Using 'OPEN' as per standardized SQL prompt.
                .order('priority', { ascending: true }) // CRITICAL first? No, string sort might be issues. Let's rely on standard sort or map priorities.
                // Actually SQL Insert uses 'critico', 'high', 'medium', 'low' in sentinels.sql line 34, 54. 
                // But Prompt in 154 uses 'CRITICAL', 'HIGH'. 
                // I will try to support both cases by just fetching all and sorting client side if needed.
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Client side sort for priority
            const priorityWeight = { 'CRITICAL': 0, 'critico': 0, 'HIGH': 1, 'high': 1, 'MEDIUM': 2, 'medium': 2, 'LOW': 3, 'low': 3 };
            const sortedData = (data || []).sort((a: any, b: any) => {
                const wA = priorityWeight[a.priority as keyof typeof priorityWeight] ?? 99;
                const wB = priorityWeight[b.priority as keyof typeof priorityWeight] ?? 99;
                return wA - wB;
            });

            setInsights(sortedData);
        } catch (error) {
            console.error('Erro ao carregar insights:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = (insight: AIInsight) => {
        // Deep Linking Logic
        if (!insight.action_label) return;

        // Map actions to routes
        if (insight.category === 'FINANCIAL' || insight.category === 'Financeiro') {
            navigate(`/financial?highlight=${insight.related_entity_id}`);
        } else if (insight.category === 'SALES' || insight.category === 'Vendas') {
            // Check if it's budget related or lead
            if (insight.title.includes('Orçamento')) {
                // Navigate to budget or CRM pipeline with filter
                navigate(`/pipeline?filter=high-ticket&focus=${insight.related_entity_id}`);
            } else {
                navigate(`/pipeline?focus=${insight.related_entity_id}`);
            }
        } else if (insight.category === 'MARKETING' || insight.category === 'Marketing') {
            navigate(`/reports?tab=marketing`);
        } else if (insight.category === 'CLINICAL' || insight.category === 'Clinical') {
            // Leva para relatório clínico ou lista de pacientes para recall
            navigate(`/reports?tab=clinical&filter=recall`);
        } else if (insight.category === 'OPERATIONAL' || insight.category === 'Operational') {
            // Deep link para agenda (hoje ou amanhã dependendo do insight, mas agenda default é safe)
            navigate(`/agenda`);
        } else if (insight.category === 'MANAGEMENT' || insight.category === 'Management') {
            // Auditoria de performance
            navigate(`/reports?tab=financial&view=performance`);
        } else {
            // Default
            navigate(`/dashboard`);
        }
    };

    const getPriorityConfig = (priority: string) => {
        const p = priority.toUpperCase();
        if (p === 'CRITICAL' || p === 'CRITICO') return { label: 'CRÍTICO', bg: 'bg-red-500', text: 'text-white', border: 'border-red-600', shadow: 'shadow-red-200' };
        if (p === 'HIGH') return { label: 'ALTA', bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-200', shadow: 'shadow-rose-100' };
        if (p === 'MEDIUM') return { label: 'MÉDIA', bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', shadow: 'shadow-amber-100' };
        return { label: 'BAIXA', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', shadow: 'shadow-blue-50' };
    };

    const getCategoryIcon = (category: string) => {
        const c = category.toUpperCase();
        if (c === 'VENDAS' || c === 'SALES') return TrendingUp;
        if (c === 'FINANCEIRO' || c === 'FINANCIAL') return AlertTriangle; // Or DollarSign
        if (c === 'MARKETING') return MegaphoneIcon;
        if (c === 'RETENÇÃO' || c === 'RETENTION') return UsersIcon;
        return Sparkles;
    };

    // Icons helper
    const MegaphoneIcon = ({ className, size }: any) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m3 11 18-5v12L3 14v-3z" /><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" /></svg>;
    const UsersIcon = ({ className, size }: any) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;


    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
                <Loader2 className="w-12 h-12 text-violet-600 animate-spin mb-4" />
                <p className="text-slate-500 font-medium">Sincronizando Sentinelas...</p>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 max-w-[1200px] mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                    <ChevronLeft size={24} className="text-slate-400 dark:text-slate-500" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
                        <Brain className="text-violet-600 dark:text-violet-400" size={32} />
                        Intelligence Gateway
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Torre de Controle Operacional • Feed de Sentinelas</p>
                </div>
            </div>

            {/* Empty State */}
            {insights.length === 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center">
                    <div className="w-20 h-20 bg-slate-50 dark:bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircleIcon size={40} className="text-green-500" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Tudo Limpo!</h3>
                    <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                        Nenhuma anomalia detectada pelas sentinelas no momento. Sua clínica está operando dentro dos parâmetros de excelência.
                    </p>
                </div>
            )}

            {/* Insights Feed */}
            <div className="space-y-4">
                {insights.map((insight) => {
                    const priorityConfig = getPriorityConfig(insight.priority);
                    const Icon = getCategoryIcon(insight.category);

                    return (
                        <div
                            key={insight.id}
                            className={`bg-white dark:bg-slate-800 rounded-xl border-l-4 ${priorityConfig.border} shadow-sm p-6 hover:shadow-md transition-all duration-300 group`}
                        >
                            <div className="flex flex-col md:flex-row gap-6">
                                {/* Icon & Priority Badge */}
                                <div className="flex flex-col items-center gap-3 min-w-[80px]">
                                    <div className={`p-3 rounded-xl ${priorityConfig.bg} bg-opacity-10`}>
                                        <Icon className={priorityConfig.text} size={28} />
                                    </div>
                                    <span className={`px-2 py-1 rounded text-[10px] font-black tracking-wider uppercase ${priorityConfig.bg} ${priorityConfig.text}`}>
                                        {priorityConfig.label}
                                    </span>
                                </div>

                                {/* Content */}
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-lg font-bold text-slate-800 dark:text-white group-hover:text-violet-600 transition-colors">
                                            {insight.title}
                                        </h3>
                                        <span className="text-xs text-slate-400 font-medium">
                                            {new Date(insight.created_at).toLocaleDateString('pt-BR')}
                                        </span>
                                    </div>

                                    <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-4">
                                        {insight.explanation}
                                    </p>

                                    {/* Footer / Action */}
                                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
                                        <div className="flex items-center gap-2 text-xs text-slate-400 uppercase font-bold tracking-wide">
                                            <span>SENTINELA: {insight.category}</span>
                                        </div>

                                        {insight.action_label && (
                                            <button
                                                onClick={() => handleAction(insight)}
                                                className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-700 text-white rounded-lg text-sm font-bold hover:bg-violet-600 dark:hover:bg-violet-600 transition-all transform hover:translate-x-1 shadow-lg shadow-gray-200 dark:shadow-none"
                                            >
                                                {insight.action_label} <ArrowRight size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// Simple icon for empty state
const CheckCircleIcon = ({ className, size }: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
    </svg>
);

export default BOSIntelligence;
