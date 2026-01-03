import React from 'react';
import { Check, ChevronRight } from 'lucide-react';
import { cn } from '../../src/lib/utils';

interface PipelineStage {
    id: string;
    name: string;
    color?: string;
    order: number;
}

interface PipelineStepperProps {
    stages: PipelineStage[];
    currentStageId: string;
    onStageChange: (stageId: string) => void;
}

export function PipelineStepper({ stages, currentStageId, onStageChange }: PipelineStepperProps) {
    const sortedStages = [...stages].sort((a, b) => a.order - b.order);
    const currentIndex = sortedStages.findIndex(s => s.id === currentStageId);

    const getStageColor = (index: number) => {
        if (index < currentIndex) return 'bg-green-500 text-white border-green-600';
        if (index === currentIndex) return 'bg-blue-500 text-white border-blue-600';
        return 'bg-slate-200 text-slate-500 border-slate-300';
    };

    const getLineColor = (index: number) => {
        if (index < currentIndex) return 'bg-green-500';
        return 'bg-slate-300';
    };

    return (
        <div className="w-full overflow-x-auto">
            <div className="flex items-center justify-between min-w-max px-4 py-2">
                {sortedStages.map((stage, index) => (
                    <React.Fragment key={stage.id}>
                        {/* Stage Circle */}
                        <div className="flex flex-col items-center gap-1 relative">
                            <button
                                onClick={() => {
                                    if (index > currentIndex) {
                                        onStageChange(stage.id);
                                    }
                                }}
                                disabled={index < currentIndex}
                                className={cn(
                                    'w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold text-sm transition-all',
                                    getStageColor(index),
                                    index > currentIndex && 'hover:scale-110 cursor-pointer',
                                    index < currentIndex && 'cursor-not-allowed'
                                )}
                            >
                                {index < currentIndex ? (
                                    <Check className="h-5 w-5" />
                                ) : (
                                    index + 1
                                )}
                            </button>
                            <span className={cn(
                                'text-xs font-medium text-center whitespace-nowrap',
                                index === currentIndex ? 'text-blue-700 font-bold' : 'text-slate-600'
                            )}>
                                {stage.name}
                            </span>
                        </div>

                        {/* Connecting Line */}
                        {index < sortedStages.length - 1 && (
                            <div className={cn(
                                'flex-1 h-1 mx-2 rounded transition-colors',
                                getLineColor(index)
                            )} />
                        )}
                    </React.Fragment>
                ))}
            </div>

            {/* Progress Percentage */}
            <div className="text-center mt-2">
                <span className="text-xs text-slate-500">
                    Progresso: {Math.round(((currentIndex + 1) / sortedStages.length) * 100)}%
                </span>
            </div>
        </div>
    );
}
