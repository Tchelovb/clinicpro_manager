import React, { useState, useEffect } from 'react';
import {
    Sheet, SheetContent
} from '../../components/ui/sheet';
import { Tabs, TabsList, TabsContent, TabsTrigger } from '../../components/ui/tabs';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import {
    Phone, Mail, Flame, Snowflake, Thermometer, X, Loader2, Play, Pause, Ban, Plus
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { InlineEditField } from './InlineEditField';
import { PipelineStepper } from './PipelineStepper';
import { TimelineItem } from './TimelineItem';
import { ActionComposer } from './ActionComposer';
import { useAuth } from '../../contexts/AuthContext';
import { useOpportunities } from '../../hooks/useOpportunities';
import { useWorkflowExecutions } from '../../hooks/useWorkflowExecutions';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../../components/ui/select';

interface LeadDetailSheetProps {
    leadId: string | null;
    pipelineId: string | null;
    initialStageId: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function LeadDetailSheet({ leadId, pipelineId, initialStageId, open, onOpenChange }: LeadDetailSheetProps) {
    const { profile } = useAuth();
    const [lead, setLead] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [timeline, setTimeline] = useState<any[]>([]);
    const [stages, setStages] = useState<any[]>([]);
    const [isNewLead, setIsNewLead] = useState(false);
    const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>('');

    // Opportunities management
    const { opportunities, totalValue, loading: opportunitiesLoading, markAsLost, refresh: refreshOpportunities } = useOpportunities(leadId);

    // Workflows management
    const {
        executions,
        availableWorkflows,
        loading: workflowsLoading,
        cancelExecution,
        pauseExecution,
        resumeExecution,
        manualEnroll,
        fetchAvailableWorkflows,
        refresh: refreshWorkflows
    } = useWorkflowExecutions(leadId);

    // Fetch available workflows when profile changes
    useEffect(() => {
        if (profile?.clinic_id && !isNewLead) {
            fetchAvailableWorkflows(profile.clinic_id);
        }
    }, [profile?.clinic_id, executions, isNewLead]);

    // Initialize lead data when sheet opens
    useEffect(() => {
        if (open) {
            if (leadId) {
                // Existing lead - fetch data
                setIsNewLead(false);
                fetchLeadData();
                fetchTimeline();
            } else {
                // New lead - initialize empty object
                setIsNewLead(true);
                setLead({
                    name: '',
                    phone: '',
                    email: '',
                    value: 0,
                    desired_treatment: '',
                    pipeline_id: pipelineId,
                    stage_id: initialStageId,
                    clinic_id: profile?.clinic_id,
                    source: 'MANUAL',
                    lead_temperature: 'COLD',
                    priority: 'MEDIUM',
                    lead_score: 0
                });
                setTimeline([]);
                setLoading(false);
            }
            fetchPipelineStages();
        }
    }, [open, leadId, pipelineId, initialStageId]);

    const fetchLeadData = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('leads')
            .select('*')
            .eq('id', leadId)
            .single();

        if (error) console.error(error);
        else setLead(data);
        setLoading(false);
    };

    const fetchTimeline = async () => {
        if (!leadId) return;

        // TODO: Uncomment when lead_tasks table is created
        const [interactionsRes] = await Promise.all([
            supabase.from('lead_interactions').select('*').eq('lead_id', leadId).order('created_at', { ascending: false }),
            // supabase.from('lead_tasks').select('*').eq('lead_id', leadId).order('created_at', { ascending: false })
        ]);

        const interactions = (interactionsRes.data || []).map(i => ({ ...i, type: 'note' }));
        // const tasks = (tasksRes.data || []).map(t => ({ ...t, type: 'task' }));

        const merged = [...interactions /* , ...tasks */].sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        setTimeline(merged);
    };

    const fetchPipelineStages = async () => {
        const { data } = await supabase
            .from('crm_stages')
            .select('*')
            .order('stage_order', { ascending: true });

        if (data) setStages(data);
    };

    const updateLeadField = async (field: string, value: any) => {
        if (isNewLead) {
            // For new leads, just update local state
            setLead((prev: any) => ({ ...prev, [field]: value }));
            return;
        }

        if (!leadId) return;

        const { error } = await supabase
            .from('leads')
            .update({ [field]: value })
            .eq('id', leadId);

        if (error) {
            console.error('Error updating lead:', error);
            toast.error('Erro ao atualizar');
        } else {
            toast.success('Salvo!', { duration: 1500 });
            setLead((prev: any) => ({ ...prev, [field]: value }));
        }
    };

    const createNewLead = async () => {
        if (!lead?.name || !lead?.phone) {
            toast.error('Nome e telefone são obrigatórios');
            return;
        }

        if (!pipelineId || !initialStageId) {
            toast.error('Pipeline não selecionado');
            return;
        }

        try {
            // 1. Create lead
            const { data: newLead, error: leadError } = await supabase
                .from('leads')
                .insert([{
                    ...lead,
                    pipeline_id: pipelineId,
                    stage_id: initialStageId,
                    clinic_id: profile?.clinic_id,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }])
                .select()
                .single();

            if (leadError) throw leadError;

            // 2. Create first opportunity automatically
            const { error: opportunityError } = await supabase
                .from('crm_opportunities')
                .insert([{
                    lead_id: newLead.id,
                    title: lead.desired_treatment || 'Interesse Inicial',
                    monetary_value: lead.value || 0,
                    pipeline_id: pipelineId,
                    stage_id: initialStageId,
                    clinic_id: profile?.clinic_id,
                    status: 'OPEN',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }]);

            if (opportunityError) {
                console.warn('Error creating initial opportunity:', opportunityError);
                // Don't fail the entire operation if opportunity creation fails
            }

            toast.success('Lead criado com sucesso!');
            onOpenChange(false); // Close sheet after creation
        } catch (error) {
            console.error('Error creating lead:', error);
            toast.error('Erro ao criar lead');
        }
    };

    const handleStageChange = async (stageId: string) => {
        await updateLeadField('stage_id', stageId);

        // Add system event to timeline
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from('lead_interactions').insert({
            lead_id: leadId,
            user_id: user?.id,
            type: 'system',
            content: `Movido para nova etapa`
        });

        fetchTimeline();
    };

    const handleNewInteraction = async (type: 'note' | 'whatsapp' | 'task', content: string) => {
        const { data: { user } } = await supabase.auth.getUser();

        // TODO: Uncomment when lead_tasks table is created
        if (type === 'task') {
            // const { error } = await supabase.from('lead_tasks').insert({
            //     lead_id: leadId,
            //     title: content,
            //     completed: false,
            //     created_at: new Date().toISOString()
            // });

            // if (error) {
            //     toast.error('Erro ao criar tarefa');
            //     return;
            // }
            toast.error('Funcionalidade de tarefas em desenvolvimento');
            return;
        } else {
            const { error } = await supabase.from('lead_interactions').insert({
                lead_id: leadId,
                user_id: user?.id,
                type: type === 'whatsapp' ? 'whatsapp' : 'note',
                content
            });

            if (error) {
                toast.error('Erro ao adicionar');
                return;
            }
        }

        toast.success('Adicionado!');
        fetchTimeline();
    };

    const handleTaskToggle = async (taskId: string, completed: boolean) => {
        // TODO: Uncomment when lead_tasks table is created
        // const { error } = await supabase
        //     .from('lead_tasks')
        //     .update({ completed })
        //     .eq('id', taskId);

        // if (!error) {
        //     fetchTimeline();
        // }
        toast.error('Funcionalidade de tarefas em desenvolvimento');
    };

    const toggleTemperature = () => {
        const temps = ['COLD', 'WARM', 'HOT'];
        const currentIndex = temps.indexOf(lead?.lead_temperature || 'COLD');
        const nextTemp = temps[(currentIndex + 1) % temps.length];
        updateLeadField('lead_temperature', nextTemp);
    };

    if (!lead && !loading) return null;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-4xl h-full flex flex-col p-0 gap-0 border-l bg-slate-50">

                {/* --- 1. HEADER & PIPELINE --- */}
                <div className="flex-none bg-white border-b">
                    {/* Basic Info */}
                    <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                            <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                                <AvatarImage src={`https://ui-avatars.com/api/?name=${lead?.name || 'Lead'}&background=random`} />
                                <AvatarFallback>LD</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                {isNewLead ? (
                                    <Input
                                        value={lead?.name || ''}
                                        onChange={(e) => setLead((prev: any) => ({ ...prev, name: e.target.value }))}
                                        placeholder="Nome do lead"
                                        className="text-lg font-bold h-auto p-1 border-0 border-b border-transparent hover:border-slate-300 focus:border-blue-500 rounded-none"
                                    />
                                ) : (
                                    <h2 className="text-lg font-bold text-slate-900 leading-tight">
                                        {loading ? 'Carregando...' : lead?.name}
                                    </h2>
                                )}
                                <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                                    <Phone className="h-3 w-3" />
                                    {isNewLead ? (
                                        <Input
                                            value={lead?.phone || ''}
                                            onChange={(e) => setLead((prev: any) => ({ ...prev, phone: e.target.value }))}
                                            placeholder="(00) 00000-0000"
                                            className="text-sm h-auto p-1 border-0 border-b border-transparent hover:border-slate-300 focus:border-blue-500 rounded-none"
                                        />
                                    ) : (
                                        <InlineEditField
                                            value={lead?.phone || ''}
                                            type="phone"
                                            onSave={(v) => updateLeadField('phone', v)}
                                            className="text-sm p-0"
                                        />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Removed manual close button - using SheetContent default */}
                    </div>

                    {/* Pipeline Stepper */}
                    {!loading && !isNewLead && stages.length > 0 && (
                        <div className="pb-4">
                            <PipelineStepper
                                stages={stages}
                                currentStageId={lead?.stage_id || stages[0]?.id}
                                onStageChange={handleStageChange}
                            />
                        </div>
                    )}
                </div>

                {/* --- 2. HERO SECTION (DEAL BAR) --- */}
                {!loading && (
                    <div className="flex-none bg-gradient-to-r from-emerald-50 via-blue-50 to-purple-50 dark:from-emerald-900/20 dark:via-blue-900/20 dark:to-purple-900/20 border-b border-emerald-200 dark:border-emerald-800 p-6">
                        <div className="flex flex-col items-center gap-3">
                            {/* Value - Dynamic from Opportunities */}
                            {isNewLead ? (
                                <InlineEditField
                                    value={lead?.value || 0}
                                    type="currency"
                                    onSave={(v) => setLead((prev: any) => ({ ...prev, value: v }))}
                                    className="text-5xl font-bold text-emerald-700 dark:text-emerald-300 text-center p-0"
                                    placeholder="R$ 0,00"
                                />
                            ) : (
                                <div className="text-5xl font-bold text-emerald-700 dark:text-emerald-300 text-center">
                                    {opportunitiesLoading ? (
                                        <Loader2 className="h-12 w-12 animate-spin mx-auto" />
                                    ) : (
                                        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)
                                    )}
                                </div>
                            )}

                            {/* Interest */}
                            <InlineEditField
                                value={lead?.desired_treatment || ''}
                                type="text"
                                onSave={(v) => updateLeadField('desired_treatment', v)}
                                className="text-lg font-semibold text-blue-700 dark:text-blue-300 text-center uppercase tracking-wide p-0"
                                placeholder="Interesse do cliente"
                            />

                            {/* Temperature Selector */}
                            <button
                                onClick={toggleTemperature}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:scale-105 transition-transform"
                            >
                                {lead?.lead_temperature === 'HOT' ? (
                                    <Flame className="h-4 w-4 text-red-500" />
                                ) : lead?.lead_temperature === 'WARM' ? (
                                    <Thermometer className="h-4 w-4 text-orange-500" />
                                ) : (
                                    <Snowflake className="h-4 w-4 text-blue-500" />
                                )}
                                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                    {lead?.lead_temperature || 'COLD'}
                                </span>
                            </button>
                        </div>
                    </div>
                )}

                {/* --- 3. TABS & TIMELINE --- */}
                {loading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                    </div>
                ) : (
                    <Tabs defaultValue="timeline" className="flex-1 flex flex-col overflow-hidden">

                        {/* Tabs */}
                        <div className="flex-none bg-white px-4 border-b">
                            <TabsList className="bg-transparent h-12 w-full justify-start gap-4 overflow-x-auto">
                                <TabsTrigger value="timeline" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-2">Negociação</TabsTrigger>
                                <TabsTrigger value="data" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-2">Dados</TabsTrigger>
                                <TabsTrigger value="opportunities" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-2">Oportunidades</TabsTrigger>
                                {!isNewLead && (
                                    <TabsTrigger value="workflows" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-2">Workflows</TabsTrigger>
                                )}
                            </TabsList>
                        </div>

                        {/* Timeline Tab */}
                        <TabsContent value="timeline" className="flex-1 flex flex-col overflow-hidden m-0">
                            <div className="flex-1 overflow-y-auto bg-slate-100 dark:bg-slate-900 p-4">
                                {timeline.length === 0 ? (
                                    <div className="text-center py-12 text-slate-500">
                                        <p>Nenhuma interação ainda.</p>
                                        <p className="text-sm mt-1">Use o compositor abaixo para iniciar.</p>
                                    </div>
                                ) : (
                                    timeline.map((item) => (
                                        <TimelineItem
                                            key={item.id}
                                            data={{
                                                ...item,
                                                user_name: profile?.name || 'Você',
                                                onTaskToggle: handleTaskToggle
                                            }}
                                        />
                                    ))
                                )}
                            </div>

                            {/* Action Composer */}
                            <ActionComposer onSend={handleNewInteraction} />
                        </TabsContent>

                        {/* Data Tab */}
                        <TabsContent value="data" className="flex-1 overflow-y-auto p-6 m-0">
                            <div className="max-w-2xl mx-auto space-y-6">
                                <div className="bg-white dark:bg-slate-800 rounded-lg border p-6 space-y-4">
                                    <h3 className="font-semibold text-slate-900 dark:text-white">Informações de Contato</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <InlineEditField
                                            label="Nome Completo"
                                            value={lead?.name || ''}
                                            onSave={(v) => updateLeadField('name', v)}
                                        />
                                        <InlineEditField
                                            label="Email"
                                            value={lead?.email || ''}
                                            onSave={(v) => updateLeadField('email', v)}
                                        />
                                        <InlineEditField
                                            label="Telefone"
                                            value={lead?.phone || ''}
                                            type="phone"
                                            onSave={(v) => updateLeadField('phone', v)}
                                        />
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-slate-500">Origem</label>
                                            <div className="px-2 py-1 text-slate-700 dark:text-slate-300">
                                                {lead?.source}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* Opportunities Tab */}
                        <TabsContent value="opportunities" className="flex-1 overflow-y-auto p-6 m-0">
                            {isNewLead ? (
                                <div className="bg-blue-50 p-8 rounded-lg border border-blue-200 text-center">
                                    <h3 className="text-sm font-medium text-blue-900">Oportunidade Inicial</h3>
                                    <p className="text-xs text-blue-700 mt-1">Ao salvar o lead, a primeira oportunidade será criada automaticamente.</p>
                                </div>
                            ) : opportunitiesLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                                </div>
                            ) : opportunities.length === 0 ? (
                                <div className="bg-white p-8 rounded-lg border border-dashed text-center">
                                    <h3 className="text-sm font-medium text-slate-900">Nenhuma oportunidade cadastrada</h3>
                                    <p className="text-xs text-slate-500 mt-1">Este lead ainda não possui oportunidades de negócio.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {opportunities.map((opportunity) => (
                                        <div key={opportunity.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <h4 className="font-semibold text-slate-900">{opportunity.title}</h4>
                                                    <p className="text-2xl font-bold text-emerald-600 mt-2">
                                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(opportunity.monetary_value || 0)}
                                                    </p>
                                                </div>
                                                <Badge variant={opportunity.status === 'OPEN' ? 'default' : 'secondary'}>
                                                    {opportunity.status}
                                                </Badge>
                                            </div>

                                            {opportunity.status === 'OPEN' && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="mt-3 w-full text-red-600 hover:bg-red-50 border-red-200"
                                                    onClick={() => {
                                                        const reason = prompt('Por que esta oportunidade foi perdida?');
                                                        if (reason) {
                                                            markAsLost(opportunity.id, reason);
                                                        }
                                                    }}
                                                >
                                                    <X className="w-4 h-4 mr-2" />
                                                    Marcar como Perdido
                                                </Button>
                                            )}

                                            {opportunity.status === 'LOST' && opportunity.lost_reason && (
                                                <div className="mt-3 p-3 bg-red-50 rounded border border-red-100">
                                                    <p className="text-xs font-medium text-red-900">Motivo da Perda:</p>
                                                    <p className="text-sm text-red-700 mt-1">{opportunity.lost_reason}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        {/* Workflows Tab */}
                        <TabsContent value="workflows" className="flex-1 overflow-y-auto p-6 m-0">
                            {workflowsLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Manual Enrollment Section */}
                                    {availableWorkflows.length > 0 && (
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                            <h3 className="text-sm font-semibold text-blue-900 mb-3">Inscrever em Novo Fluxo</h3>
                                            <div className="flex gap-2">
                                                <Select value={selectedWorkflowId} onValueChange={setSelectedWorkflowId}>
                                                    <SelectTrigger className="flex-1 bg-white">
                                                        <SelectValue placeholder="Selecione um fluxo..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {availableWorkflows.map((workflow) => (
                                                            <SelectItem key={workflow.id} value={workflow.id}>
                                                                {workflow.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <Button
                                                    onClick={() => {
                                                        if (selectedWorkflowId) {
                                                            manualEnroll(selectedWorkflowId);
                                                            setSelectedWorkflowId('');
                                                        }
                                                    }}
                                                    disabled={!selectedWorkflowId}
                                                    className="bg-blue-600 hover:bg-blue-700"
                                                >
                                                    <Plus className="w-4 h-4 mr-2" />
                                                    Inscrever
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Enrolled Workflows List */}
                                    {executions.length === 0 ? (
                                        <div className="bg-white p-8 rounded-lg border border-dashed text-center">
                                            <h3 className="text-sm font-medium text-slate-900">Nenhum fluxo ativo</h3>
                                            <p className="text-xs text-slate-500 mt-1">
                                                Este lead ainda não está inscrito em nenhum fluxo de automação.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {executions.map((execution) => {
                                                const getStatusColor = (status: string) => {
                                                    switch (status) {
                                                        case 'RUNNING': return 'bg-blue-100 text-blue-800 border-blue-200';
                                                        case 'WAITING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
                                                        case 'COMPLETED': return 'bg-green-100 text-green-800 border-green-200';
                                                        case 'CANCELLED': return 'bg-gray-100 text-gray-800 border-gray-200';
                                                        case 'PAUSED': return 'bg-orange-100 text-orange-800 border-orange-200';
                                                        case 'FAILED': return 'bg-red-100 text-red-800 border-red-200';
                                                        default: return 'bg-slate-100 text-slate-800 border-slate-200';
                                                    }
                                                };

                                                const getStatusIcon = (status: string) => {
                                                    switch (status) {
                                                        case 'RUNNING': return <Play className="w-4 h-4" />;
                                                        case 'PAUSED': return <Pause className="w-4 h-4" />;
                                                        case 'CANCELLED': return <Ban className="w-4 h-4" />;
                                                        default: return null;
                                                    }
                                                };

                                                return (
                                                    <div key={execution.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition">
                                                        <div className="flex items-start justify-between mb-3">
                                                            <div className="flex-1">
                                                                <h4 className="font-semibold text-slate-900">
                                                                    {execution.workflow?.name || 'Fluxo sem nome'}
                                                                </h4>
                                                                {execution.workflow?.description && (
                                                                    <p className="text-sm text-slate-600 mt-1">
                                                                        {execution.workflow.description}
                                                                    </p>
                                                                )}
                                                                <p className="text-xs text-slate-500 mt-2">
                                                                    Iniciado em: {new Date(execution.started_at).toLocaleDateString('pt-BR', {
                                                                        day: '2-digit',
                                                                        month: 'short',
                                                                        year: 'numeric',
                                                                        hour: '2-digit',
                                                                        minute: '2-digit'
                                                                    })}
                                                                </p>
                                                            </div>
                                                            <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-medium ${getStatusColor(execution.status)}`}>
                                                                {getStatusIcon(execution.status)}
                                                                {execution.status}
                                                            </div>
                                                        </div>

                                                        {/* Action Buttons */}
                                                        {(execution.status === 'WAITING' || execution.status === 'RUNNING') && (
                                                            <div className="flex gap-2">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="flex-1 text-orange-600 hover:bg-orange-50 border-orange-200"
                                                                    onClick={() => pauseExecution(execution.id)}
                                                                >
                                                                    <Pause className="w-4 h-4 mr-2" />
                                                                    Pausar
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="flex-1 text-red-600 hover:bg-red-50 border-red-200"
                                                                    onClick={() => {
                                                                        if (confirm('Tem certeza que deseja cancelar este fluxo?')) {
                                                                            cancelExecution(execution.id);
                                                                        }
                                                                    }}
                                                                >
                                                                    <Ban className="w-4 h-4 mr-2" />
                                                                    Interromper
                                                                </Button>
                                                            </div>
                                                        )}

                                                        {execution.status === 'PAUSED' && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="w-full text-green-600 hover:bg-green-50 border-green-200"
                                                                onClick={() => resumeExecution(execution.id)}
                                                            >
                                                                <Play className="w-4 h-4 mr-2" />
                                                                Retomar
                                                            </Button>
                                                        )}

                                                        {execution.error_message && (
                                                            <div className="mt-3 p-3 bg-red-50 rounded border border-red-100">
                                                                <p className="text-xs font-medium text-red-900">Erro:</p>
                                                                <p className="text-sm text-red-700 mt-1">{execution.error_message}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </TabsContent>

                    </Tabs>
                )}

                {/* --- 4. STICKY FOOTER (NEW LEAD ONLY) --- */}
                {isNewLead && !loading && (
                    <div className="flex-none bg-white border-t p-4">
                        <div className="flex items-center justify-end gap-3">
                            <Button
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={createNewLead}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                                Salvar Lead
                            </Button>
                        </div>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
