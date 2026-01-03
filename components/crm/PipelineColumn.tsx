import React from 'react';
import { Badge } from '../ui/badge';
import { Plus } from 'lucide-react';
import { cn } from '../../src/lib/utils';
import { PipelineCard } from './PipelineCard';
import { Opportunity } from '../../types/crm';

interface PipelineColumnProps {
    stage: {
        id: string;
        name: string;
        color?: string;
        stage_order: number;
    };
    opportunities: Opportunity[];
    onOpportunityClick: (opp: Opportunity) => void;
    onDragStart?: (oppId: string) => void;
    onDragOver?: (e: React.DragEvent) => void;
    onDrop?: (stageId: string) => void;
    onAddOpportunity?: () => void;
}

export function PipelineColumn({
    stage,
    opportunities,
    onOpportunityClick,
    onDragStart,
    onDragOver,
    onDrop,
    onAddOpportunity
}: PipelineColumnProps) {
    // Calculate total value in this column
    const totalValue = (opportunities || []).reduce((sum, opp) => sum + (opp.monetary_value || 0), 0);

    // Format currency
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            notation: 'compact',
            maximumFractionDigits: 1,
        }).format(value);
    };

    // Get background color based on stage
    const getStageColor = () => {
        if (!stage.color) return 'bg-slate-100 dark:bg-slate-800';

        // Map database colors to Tailwind classes
        const colorMap: Record<string, string> = {
            'bg-blue-100': 'bg-blue-50 dark:bg-blue-900/20',
            'bg-yellow-100': 'bg-yellow-50 dark:bg-yellow-900/20',
            'bg-purple-100': 'bg-purple-50 dark:bg-purple-900/20',
            'bg-orange-100': 'bg-orange-50 dark:bg-orange-900/20',
            'bg-green-100': 'bg-emerald-50 dark:bg-emerald-900/20',
            'bg-red-100': 'bg-red-50 dark:bg-red-900/20',
            'bg-gray-100': 'bg-slate-100 dark:bg-slate-800',
        };

        return colorMap[stage.color] || 'bg-slate-100 dark:bg-slate-800';
    };

    // Get border color based on stage
    const getBorderColor = () => {
        if (!stage.color) return 'border-slate-300 dark:border-slate-600';

        const colorMap: Record<string, string> = {
            'bg-blue-100': 'border-blue-300 dark:border-blue-700',
            'bg-yellow-100': 'border-yellow-300 dark:border-yellow-700',
            'bg-purple-100': 'border-purple-300 dark:border-purple-700',
            'bg-orange-100': 'border-orange-300 dark:border-orange-700',
            'bg-green-100': 'border-emerald-300 dark:border-emerald-700',
            'bg-red-100': 'border-red-300 dark:border-red-700',
            'bg-gray-100': 'border-slate-300 dark:border-slate-600',
        };

        return colorMap[stage.color] || 'border-slate-300 dark:border-slate-600';
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (onDrop) {
            onDrop(stage.id);
        }
    };

    return (
        <div
            className={cn(
                'flex flex-col rounded-xl border-2 overflow-hidden',
                'w-[85vw] md:w-80 flex-shrink-0 snap-center',
                'h-full',
                getBorderColor()
            )}
            onDragOver={onDragOver}
            onDrop={handleDrop}
        >
            {/* Header - Sticky on mobile */}
            <div
                className={cn(
                    'p-4 border-b border-slate-200 dark:border-slate-700',
                    'sticky top-0 z-10 md:static',
                    getStageColor()
                )}
            >
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {stage.name}
                    </h3>
                    <div className="flex items-center gap-1">
                        <Badge
                            variant="secondary"
                            className="bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs"
                        >
                            {(opportunities || []).length}
                        </Badge>
                        {onAddOpportunity && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onAddOpportunity();
                                }}
                                className="p-1 hover:bg-slate-200/50 dark:hover:bg-slate-600/50 rounded-full transition-colors"
                            >
                                <Plus size={14} className="text-slate-500 dark:text-slate-400" />
                            </button>
                        )}
                    </div>
                </div>

                {/* KPIs */}
                <div className="flex items-center gap-2">
                    <div className="flex-1">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Valor Total
                        </p>
                        <p className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(totalValue)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Cards Container - Scrollable */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50/50 dark:bg-slate-900/50">
                {(opportunities || []).length > 0 ? (
                    (opportunities || []).map((opp) => (
                        <PipelineCard
                            key={opp.id}
                            opportunity={opp}
                            onClick={() => onOpportunityClick(opp)}
                            onDragStart={onDragStart}
                        />
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center mb-2">
                            <span className="text-2xl">📋</span>
                        </div>
                        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                            Nenhuma oportunidade nesta fase
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

