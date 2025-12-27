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
    Phone, Mail, Flame, Snowflake, X, Thermometer
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { InlineEditField } from './InlineEditField';
import { PipelineStepper } from './PipelineStepper';
import { TimelineItem } from './TimelineItem';
import { ActionComposer } from './ActionComposer';
import { useAuth } from '../../contexts/AuthContext';

interface LeadDetailSheetProps {
    leadId: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function LeadDetailSheet({ leadId, open, onOpenChange }: LeadDetailSheetProps) {
    const { profile } = useAuth();
    const [lead, setLead] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [timeline, setTimeline] = useState<any[]>([]);
    const [stages, setStages] = useState<any[]>([]);

    // Fetch lead data and timeline
    useEffect(() => {
        if (open && leadId) {
            fetchLeadData();
            fetchTimeline();
            fetchPipelineStages();
        }
    }, [open, leadId]);

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

        const [interactionsRes, tasksRes] = await Promise.all([
            supabase.from('lead_interactions').select('*').eq('lead_id', leadId).order('created_at', { ascending: false }),
            supabase.from('lead_tasks').select('*').eq('lead_id', leadId).order('created_at', { ascending: false })
        ]);

        const interactions = (interactionsRes.data || []).map(i => ({ ...i, type: 'note' }));
        const tasks = (tasksRes.data || []).map(t => ({ ...t, type: 'task' }));

        const merged = [...interactions, ...tasks].sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        setTimeline(merged);
    };

    const fetchPipelineStages = async () => {
        const { data } = await supabase
            .from('pipeline_stages')
            .select('*')
            .order('order', { ascending: true });

        if (data) setStages(data);
    };

    const updateLeadField = async (field: string, value: any) => {
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

        if (type === 'task') {
            const { error } = await supabase.from('lead_tasks').insert({
                lead_id: leadId,
                title: content,
                completed: false,
                created_at: new Date().toISOString()
            });

            if (error) {
                toast.error('Erro ao criar tarefa');
                return;
            }
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
        const { error } = await supabase
            .from('lead_tasks')
            .update({ completed })
            .eq('id', taskId);

        if (!error) {
            fetchTimeline();
        }
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
                        <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                                <AvatarImage src={`https://ui-avatars.com/api/?name=${lead?.name || 'Lead'}&background=random`} />
                                <AvatarFallback>LD</AvatarFallback>
                            </Avatar>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 leading-tight">
                                    {loading ? 'Carregando...' : lead?.name}
                                </h2>
                                <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                                    <Phone className="h-3 w-3" />
                                    <InlineEditField
                                        value={lead?.phone || ''}
                                        type="phone"
                                        onSave={(v) => updateLeadField('phone', v)}
                                        className="text-sm p-0"
                                    />
                                </div>
                            </div>
                        </div>

                        <Button size="icon" variant="ghost" onClick={() => onOpenChange(false)}>
                            <X className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* Pipeline Stepper */}
                    {!loading && stages.length > 0 && (
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
                            {/* Value */}
                            <InlineEditField
                                value={lead?.value || 0}
                                type="currency"
                                onSave={(v) => updateLeadField('value', v)}
                                className="text-5xl font-bold text-emerald-700 dark:text-emerald-300 text-center p-0"
                                placeholder="R$ 0,00"
                            />

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
                            <div className="bg-white p-8 rounded-lg border border-dashed text-center">
                                <h3 className="text-sm font-medium text-slate-900">Sem orçamentos vinculados</h3>
                                <p className="text-xs text-slate-500 mt-1">Converta este lead em paciente para criar orçamentos.</p>
                            </div>
                        </TabsContent>

                    </Tabs>
                )}
            </SheetContent>
        </Sheet>
    );
}
