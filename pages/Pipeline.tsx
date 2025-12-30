import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Settings2, Filter } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { PipelineColumn } from '../components/crm/PipelineColumn';
import { LeadDetailSheet } from '../components/crm/LeadDetailSheet';
import PatientDetail from '../components/PatientDetail';
import { toast } from 'react-hot-toast';
import { usePipelines } from '../hooks/crm/usePipelines';
import { useStages } from '../hooks/crm/useStages';
import { useOpportunities, useUpdateOpportunityStage } from '../hooks/crm/useOpportunities';
import { Opportunity, OpportunityTypeFilter, OpportunityCategory, CATEGORY_LABELS } from '../types/crm';

export default function Pipeline() {
    const { profile } = useAuth();
    const navigate = useNavigate();

    // State
    const [selectedPipelineId, setSelectedPipelineId] = useState<string>('');
    const [typeFilter, setTypeFilter] = useState<OpportunityTypeFilter>('ALL');
    const [categoryFilter, setCategoryFilter] = useState<OpportunityCategory | 'ALL'>('ALL');
    const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
    const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
    const [initialStageId, setInitialStageId] = useState<string | null>(null);
    const [isLeadSheetOpen, setIsLeadSheetOpen] = useState(false);
    const [isPatientSheetOpen, setIsPatientSheetOpen] = useState(false);
    const [draggedOppId, setDraggedOppId] = useState<string | null>(null);

    // Hooks
    const { data: pipelines, isLoading: pipelinesLoading } = usePipelines();
    const { data: stages, isLoading: stagesLoading } = useStages(selectedPipelineId);
    const { data: opportunities, isLoading: oppsLoading } = useOpportunities(selectedPipelineId, typeFilter);
    const updateStageMutation = useUpdateOpportunityStage();

    // Auto-select first pipeline
    useEffect(() => {
        if (pipelines && pipelines.length > 0 && !selectedPipelineId) {
            const defaultPipeline = pipelines.find(p => p.is_default) || pipelines[0];
            setSelectedPipelineId(defaultPipeline.id);
        }
    }, [pipelines, selectedPipelineId]);

    // Deduplicate stages by name (keep the one with highest stage_order)
    const uniqueStages = useMemo(() => {
        if (!stages) return [];

        const stageMap = new Map();
        stages.forEach(stage => {
            const existing = stageMap.get(stage.name);
            if (!existing || stage.stage_order > existing.stage_order) {
                stageMap.set(stage.name, stage);
            }
        });

        return Array.from(stageMap.values()).sort((a, b) => a.stage_order - b.stage_order);
    }, [stages]);

    // Unified Filter Logic (Type + Category)
    const filteredOpportunities = useMemo(() => {
        if (!opportunities) return [];
        return opportunities.filter(op => {
            // 1. Filter by Type (Lead/Patient)
            const typeMatch =
                typeFilter === 'ALL' ? true :
                    typeFilter === 'LEAD' ? (!!op.lead_id && !op.patient_id) :
                        typeFilter === 'PATIENT' ? !!op.patient_id : true;

            // 2. Filter by Category (Context-Aware)
            const categoryMatch = categoryFilter === 'ALL' ? true : op.category === categoryFilter;

            return typeMatch && categoryMatch;
        });
    }, [opportunities, typeFilter, categoryFilter]);

    /**
     * CRITICAL: Smart Sheet Routing
     * Opens the correct sheet based on opportunity type
     */
    const handleOpportunityClick = (opp: Opportunity) => {
        if (opp.patient_id) {
            // It's a Patient opportunity
            setSelectedPatientId(opp.patient_id);
            setIsPatientSheetOpen(true);
        } else if (opp.lead_id) {
            // It's a Lead opportunity
            setSelectedLeadId(opp.lead_id);
            setIsLeadSheetOpen(true);
        } else {
            toast.error('Oportunidade sem Lead ou Paciente vinculado');
        }
    };

    /**
     * Handle drag start
     */
    const handleDragStart = (oppId: string) => {
        setDraggedOppId(oppId);
    };

    /**
     * Handle drop on stage
     */
    const handleDrop = async (stageId: string) => {
        if (!draggedOppId) return;

        try {
            await updateStageMutation.mutateAsync({
                id: draggedOppId,
                stage_id: stageId
            });

            toast.success('Oportunidade movida com sucesso!');
        } catch (error) {
            console.error('Error moving opportunity:', error);
            toast.error('Erro ao mover oportunidade');
        } finally {
            setDraggedOppId(null);
        }
    };

    /**
     * Handle new opportunity
     */
    /**
     * Handle new opportunity
     */
    const handleNewOpportunity = (stageId?: string) => {
        setSelectedLeadId('new');
        setInitialStageId(stageId || null);
        setIsLeadSheetOpen(true);
    };

    // Loading state
    if (pipelinesLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600" />
            </div>
        );
    }

    // Empty state when no pipelines exist
    if (!pipelinesLoading && (!pipelines || pipelines.length === 0)) {
        return (
            <div className="flex items-center justify-center h-full bg-slate-50 dark:bg-slate-950">
                <div className="text-center p-8">
                    <div className="text-6xl mb-4">📊</div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                        Nenhum Pipeline Encontrado
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 mb-4">
                        Você precisa criar um pipeline primeiro para usar esta funcionalidade.
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-500">
                        Vá para Configurações → Pipelines para criar seu primeiro funil de vendas.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
            {/* Header - Fixed */}
            <div className="flex-none bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                            Pipeline de Vendas
                        </h1>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            {filteredOpportunities.length} oportunidades ativas
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* Type Filter Tabs - Inline */}
                        <Tabs value={typeFilter} onValueChange={(v) => setTypeFilter(v as OpportunityTypeFilter)}>
                            <TabsList className="grid grid-cols-3">
                                <TabsTrigger value="ALL" className="text-xs px-3">
                                    Todos ({opportunities?.length || 0})
                                </TabsTrigger>
                                <TabsTrigger value="LEAD" className="text-xs px-3">
                                    Leads ({opportunities?.filter(o => o.lead_id && !o.patient_id).length || 0})
                                </TabsTrigger>
                                <TabsTrigger value="PATIENT" className="text-xs px-3">
                                    Pacientes ({opportunities?.filter(o => o.patient_id).length || 0})
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>

                        {/* Category Filter (Context-Aware) */}
                        <Select value={categoryFilter} onValueChange={(val) => setCategoryFilter(val as any)}>
                            <SelectTrigger className="w-[180px] h-9">
                                <div className="flex items-center gap-2">
                                    <Filter className="w-3.5 h-3.5 text-slate-500" />
                                    <SelectValue placeholder="Categoria" />
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Todas Categorias</SelectItem>
                                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                                    <SelectItem key={key} value={key}>
                                        {key === 'NEW_LEAD' && '⚡ '}
                                        {key === 'BUDGET' && '💰 '}
                                        {key === 'RETENTION' && '🔄 '}
                                        {key === 'RECOVERY' && '🚑 '}
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Pipeline Selector */}
                        <Select
                            value={selectedPipelineId}
                            onValueChange={setSelectedPipelineId}
                        >
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Selecione um funil" />
                            </SelectTrigger>
                            <SelectContent>
                                {pipelines?.map((pipeline) => (
                                    <SelectItem key={pipeline.id} value={pipeline.id}>
                                        {pipeline.name}
                                        {pipeline.is_default && (
                                            <span className="ml-2 text-xs text-slate-500">(Padrão)</span>
                                        )}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Settings Button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate('/settings')}
                            title="Configurar Funis e Etapas"
                        >
                            <Settings2 className="h-4 w-4" />
                        </Button>

                        {/* New Opportunity Button (Desktop) */}
                        <Button onClick={() => handleNewOpportunity()} size="sm" className="hidden md:flex">
                            <Plus className="mr-2 h-4 w-4" />
                            Nova Oportunidade
                        </Button>
                    </div>
                </div>
            </div>

            {/* Kanban Board - Scrollable */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden snap-x snap-mandatory">
                {stagesLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
                    </div>
                ) : (
                    <div className="h-full flex gap-4 p-4 min-w-max">
                        {uniqueStages.map((stage) => {
                            const stageOpportunities = filteredOpportunities.filter(
                                opp => opp.stage_id === stage.id
                            );

                            return (
                                <PipelineColumn
                                    key={stage.id}
                                    stage={stage}
                                    opportunities={stageOpportunities}
                                    onOpportunityClick={handleOpportunityClick}
                                    onDragStart={handleDragStart}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={handleDrop}
                                    onAddOpportunity={() => handleNewOpportunity(stage.id)}
                                />
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Lead Detail Sheet */}
            <LeadDetailSheet
                leadId={selectedLeadId}
                pipelineId={selectedPipelineId}
                initialStageId={initialStageId}
                open={isLeadSheetOpen}
                onOpenChange={setIsLeadSheetOpen}
            />

            {/* Patient Detail Sheet */}
            <PatientDetail
                patientId={selectedPatientId}
                open={isPatientSheetOpen}
                onClose={() => setIsPatientSheetOpen(false)}
            />
        </div>
    );
}
