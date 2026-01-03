import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle, X, ExternalLink } from 'lucide-react';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface InsightsTabProps {
    period: string;
    criticalOnly?: boolean;  // Show only critical/high (Alertas)
    strategicOnly?: boolean;  // Show only medium/low (Insights)
    onAlertsCountChange?: (count: number) => void;
}

export const InsightsTab: React.FC<InsightsTabProps> = ({
    period,
    criticalOnly = false,
    strategicOnly = false,
    onAlertsCountChange
}) => {
    const { profile } = useAuth();
    const [insights, setInsights] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedInsight, setSelectedInsight] = useState<any>(null);

    useEffect(() => {
        fetchInsights();
    }, [profile?.clinic_id, period, criticalOnly, strategicOnly]);

    const fetchInsights = async () => {
        if (!profile?.clinic_id) return;

        setLoading(true);
        try {
            // Build query - FIXED: Use lowercase to match database
            let query = supabase
                .from('ai_insights')
                .select('*')
                .eq('clinic_id', profile.clinic_id)
                .eq('status', 'open');  // FIXED: lowercase 'open'

            // Filter by priority based on mode
            if (criticalOnly) {
                // ALERTAS: Show only critical/high priority (urgent)
                query = query.in('priority', ['critico', 'high']);
            } else if (strategicOnly) {
                // INSIGHTS: Show only medium/low priority (strategic)
                query = query.in('priority', ['medium', 'low']);
            }
            // If neither flag is set, show all

            const { data: insightsData, error } = await query
                .order('priority', { ascending: false })
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Enrich insights with entity names
            const enrichedInsights = await Promise.all(
                (insightsData || []).map(async (insight) => {
                    let entityName = 'Não identificado';

                    if (insight.related_entity_id) {
                        // Try to resolve entity name based on category
                        // Since entity_type doesn't exist, we infer from category
                        if (insight.category === 'Marketing') {
                            const { data: lead } = await supabase
                                .from('leads')
                                .select('name')
                                .eq('id', insight.related_entity_id)
                                .single();
                            if (lead && 'name' in lead) {
                                entityName = lead.name || entityName;
                            }
                        } else if (insight.category === 'Financeiro' || insight.category === 'Financial') {
                            const { data: patient } = await supabase
                                .from('patients')
                                .select('name')
                                .eq('id', insight.related_entity_id)
                                .single();
                            if (patient && 'name' in patient) {
                                entityName = patient.name || entityName;
                            }
                        } else if (insight.category === 'Vendas') {
                            const { data: budget } = await supabase
                                .from('budgets')
                                .select('patient_id, patients(name)')
                                .eq('id', insight.related_entity_id)
                                .single();
                            entityName = (budget as any)?.patients?.name || entityName;
                        }
                    }

                    return {
                        ...insight,
                        entityName
                    };
                })
            );

            setInsights(enrichedInsights);

            // Call callback with critical alerts count - FIXED: lowercase
            if (onAlertsCountChange) {
                const criticalCount = enrichedInsights.filter(i => i.priority === 'critico' || i.priority === 'high').length;
                onAlertsCountChange(criticalCount);
            }
        } catch (error) {
            console.error('Error fetching insights:', error);
        } finally {
            setLoading(false);
        }
    };

    const dismissInsight = async (insightId: string) => {
        try {
            await supabase
                .from('ai_insights')
                .update({ status: 'resolved' })  // FIXED: lowercase
                .eq('id', insightId);

            fetchInsights(); // Refresh list
        } catch (error) {
            console.error('Error dismissing insight:', error);
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority?.toLowerCase()) {  // FIXED: normalize to lowercase
            case 'critico': return 'border-red-500 bg-red-50 dark:bg-red-900/20';
            case 'high': return 'border-orange-500 bg-orange-50 dark:bg-orange-900/20';
            case 'medium': return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
            case 'low': return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
            default: return 'border-gray-500 bg-gray-50 dark:bg-gray-900/20';
        }
    };

    const getPriorityIcon = (priority: string) => {
        switch (priority?.toLowerCase()) {  // FIXED: normalize to lowercase
            case 'critico': return <AlertCircle className="text-red-600 dark:text-red-400" size={24} />;
            case 'high': return <AlertTriangle className="text-orange-600 dark:text-orange-400" size={24} />;
            case 'medium': return <Info className="text-yellow-600 dark:text-yellow-400" size={24} />;
            case 'low': return <CheckCircle className="text-blue-600 dark:text-blue-400" size={24} />;
            default: return <Info className="text-gray-600 dark:text-gray-400" size={24} />;
        }
    };

    const getPriorityLabel = (priority: string) => {
        switch (priority?.toLowerCase()) {  // FIXED: normalize to lowercase
            case 'critico': return 'CRÍTICO';
            case 'high': return 'ALTO';
            case 'medium': return 'MÉDIO';
            case 'low': return 'BAIXO';
            default: return priority?.toUpperCase() || 'DESCONHECIDO';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (insights.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-center">
                <CheckCircle className="text-green-500 mb-4" size={64} />
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                    Nenhum alerta crítico no momento
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                    Sua clínica está operando dentro dos parâmetros esperados.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <p className="text-sm text-red-600 dark:text-red-400 font-medium mb-1">Críticos</p>
                    <p className="text-3xl font-bold text-red-700 dark:text-red-300">
                        {insights.filter(i => i.priority === 'critico').length}
                    </p>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                    <p className="text-sm text-orange-600 dark:text-orange-400 font-medium mb-1">Alta Prioridade</p>
                    <p className="text-3xl font-bold text-orange-700 dark:text-orange-300">
                        {insights.filter(i => i.priority === 'high').length}
                    </p>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium mb-1">Média Prioridade</p>
                    <p className="text-3xl font-bold text-yellow-700 dark:text-yellow-300">
                        {insights.filter(i => i.priority === 'medium').length}
                    </p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">Baixa Prioridade</p>
                    <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                        {insights.filter(i => i.priority === 'low').length}
                    </p>
                </div>
            </div>

            {/* Insights List */}
            <div className="space-y-4">
                {insights.map((insight) => (
                    <div
                        key={insight.id}
                        className={`border-l-4 rounded-lg p-6 shadow-sm hover:shadow-md transition-all ${getPriorityColor(insight.priority)}`}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4 flex-1">
                                <div className="mt-1">
                                    {getPriorityIcon(insight.priority)}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${insight.priority === 'critico' ? 'bg-red-600 text-white' :
                                            insight.priority === 'high' ? 'bg-orange-600 text-white' :
                                                insight.priority === 'medium' ? 'bg-yellow-600 text-white' :
                                                    'bg-blue-600 text-white'
                                            }`}>
                                            {getPriorityLabel(insight.priority)}
                                        </span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            {new Date(insight.created_at).toLocaleDateString('pt-BR')}
                                        </span>
                                        {insight.category && (
                                            <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                                                {insight.category}
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                        {insight.title}
                                    </h3>
                                    <p className="text-gray-700 dark:text-gray-300 mb-3">
                                        {insight.explanation}
                                    </p>
                                    {insight.entityName !== 'Não identificado' && (
                                        <div className="flex items-center gap-2 text-sm mb-3">
                                            <span className="text-gray-600 dark:text-gray-400">Relacionado a:</span>
                                            <span className="font-semibold text-gray-900 dark:text-white">
                                                {insight.entityName}
                                            </span>
                                        </div>
                                    )}
                                    {/* Action Button */}
                                    {insight.action_label && (
                                        <div className="flex gap-2 mt-4">
                                            <button
                                                onClick={() => {
                                                    // TODO: Implement action based on category
                                                    console.log('Action:', insight.action_label, 'Entity:', insight.related_entity_id);
                                                }}
                                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                                            >
                                                <ExternalLink size={16} />
                                                {insight.action_label}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    dismissInsight(insight.id);
                                }}
                                className="ml-4 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                title="Marcar como resolvido"
                            >
                                <X size={20} className="text-gray-600 dark:text-gray-400" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
