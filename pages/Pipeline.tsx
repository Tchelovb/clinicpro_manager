import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { PipelineColumn } from '../components/crm/PipelineColumn';
import { LeadDetailSheet } from '../components/crm/LeadDetailSheet';
import { toast } from 'react-hot-toast';

interface Pipeline {
    id: string;
    name: string;
    is_default: boolean;
    clinic_id: string;
}

interface Stage {
    id: string;
    name: string;
    color?: string;
    stage_order: number;
    pipeline_id: string;
}

interface Lead {
    id: string;
    name: string;
    phone: string;
    email?: string;
    value?: number;
    desired_treatment?: string;
    created_at: string;
    updated_at: string;
    stage_id: string;
    owner_id?: string;
    clinic_id: string;
}

interface User {
    id: string;
    name: string;
    photo_url?: string;
}

export default function Pipeline() {
    const { profile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [pipelines, setPipelines] = useState<Pipeline[]>([]);
    const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null);
    const [stages, setStages] = useState<Stage[]>([]);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<string>('all');
    const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
    const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);
    const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);

    // Load initial data
    useEffect(() => {
        if (profile?.clinic_id) {
            loadPipelines();
            loadUsers();
        }
    }, [profile?.clinic_id]);

    // Load stages and leads when pipeline changes
    useEffect(() => {
        if (selectedPipeline) {
            loadStages();
            loadLeads();
        }
    }, [selectedPipeline, selectedUser]);


    const loadPipelines = async () => {
        try {
            console.log('🔍 Loading pipelines for clinic:', profile?.clinic_id);
            const { data, error } = await supabase
                .from('crm_pipelines')
                .select('*')
                .eq('clinic_id', profile?.clinic_id)
                .eq('active', true)
                .order('is_default', { ascending: false });

            if (error) {
                console.error('❌ Error loading pipelines:', error);
                throw error;
            }

            console.log('✅ Pipelines loaded:', data);
            setPipelines(data || []);

            // Select default pipeline or first one
            const defaultPipeline = data?.find((p) => p.is_default) || data?.[0];
            setSelectedPipeline(defaultPipeline || null);

            if (!defaultPipeline) {
                console.warn('⚠️ No pipelines found');
                toast.error('Nenhum pipeline encontrado. Crie um pipeline primeiro.');
                setLoading(false);
            }
        } catch (error) {
            console.error('❌ Error loading pipelines:', error);
            toast.error('Erro ao carregar pipelines');
            setLoading(false);
        }
    };

    const loadStages = async () => {
        if (!selectedPipeline) {
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('crm_stages')
                .select('*')
                .eq('pipeline_id', selectedPipeline.id)
                .order('stage_order', { ascending: true });

            if (error) throw error;
            setStages(data || []);
        } catch (error) {
            console.error('Error loading stages:', error);
            toast.error('Erro ao carregar etapas');
        } finally {
            setLoading(false);
        }
    };

    const loadLeads = async () => {
        if (!selectedPipeline) return;

        try {
            setLoading(true);
            let query = supabase
                .from('leads')
                .select('*')
                .eq('clinic_id', profile?.clinic_id)
                .eq('pipeline_id', selectedPipeline.id);

            // Filter by user if selected
            if (selectedUser !== 'all') {
                query = query.eq('owner_id', selectedUser);
            }

            const { data, error } = await query.order('updated_at', { ascending: false });

            if (error) throw error;
            setLeads(data || []);
        } catch (error) {
            console.error('Error loading leads:', error);
            toast.error('Erro ao carregar leads');
        } finally {
            setLoading(false);
        }
    };

    const loadUsers = async () => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('id, name, photo_url')
                .eq('clinic_id', profile?.clinic_id)
                .eq('is_active', true);

            if (error) throw error;
            setUsers(data || []);
        } catch (error) {
            console.error('Error loading users:', error);
        }
    };

    const handleLeadClick = (lead: Lead) => {
        setSelectedLeadId(lead.id);
        setIsDetailSheetOpen(true);
    };

    const handleDragStart = (leadId: string) => {
        setDraggedLeadId(leadId);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = async (stageId: string) => {
        if (!draggedLeadId || draggedLeadId === stageId) {
            setDraggedLeadId(null);
            return;
        }

        try {
            // Update lead stage in database
            const { error } = await supabase
                .from('leads')
                .update({
                    stage_id: stageId,
                    updated_at: new Date().toISOString()
                })
                .eq('id', draggedLeadId);

            if (error) throw error;

            // TODO: Trigger GHL Workflow here (Trigger: Pipeline Stage Change)
            // This should call automationService.checkAndTriggerAutomations()
            // Example:
            // await automationService.checkAndTriggerAutomations(
            //     draggedLeadId,
            //     'ENTER_STAGE',
            //     { pipelineId: selectedPipeline?.id, stageId: stageId }
            // );

            console.log('🔄 Lead moved to new stage. Workflow trigger point.');

            // Refresh leads
            await loadLeads();
            toast.success('Lead movido com sucesso!');
        } catch (error) {
            console.error('Error moving lead:', error);
            toast.error('Erro ao mover lead');
            // Revert on error
            await loadLeads();
        } finally {
            setDraggedLeadId(null);
        }
    };

    if (loading && !selectedPipeline) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600" />
            </div>
        );
    }

    // Empty state when no pipelines exist
    if (!loading && pipelines.length === 0) {
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
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Title & Pipeline Selector */}
                    <div className="flex items-center gap-3">
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                                Pipeline de Vendas
                            </h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {leads.length} leads ativos
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        {/* Pipeline Selector */}
                        <Select
                            value={selectedPipeline?.id || ''}
                            onValueChange={(value) => {
                                const pipeline = pipelines.find((p) => p.id === value);
                                setSelectedPipeline(pipeline || null);
                            }}
                        >
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Selecione o funil" />
                            </SelectTrigger>
                            <SelectContent>
                                {pipelines.map((pipeline) => (
                                    <SelectItem key={pipeline.id} value={pipeline.id}>
                                        {pipeline.name}
                                        {pipeline.is_default && (
                                            <span className="ml-2 text-xs text-slate-400">
                                                (Padrão)
                                            </span>
                                        )}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* User Filter */}
                        <div className="hidden md:flex items-center gap-2">
                            <button
                                onClick={() => setSelectedUser('all')}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${selectedUser === 'all'
                                    ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300'
                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                    }`}
                            >
                                Todos
                            </button>
                            {users.map((user) => (
                                <button
                                    key={user.id}
                                    onClick={() => setSelectedUser(user.id)}
                                    className={`flex items-center gap-1 px-2 py-1 rounded-full transition-all ${selectedUser === user.id
                                        ? 'ring-2 ring-violet-500 ring-offset-2'
                                        : 'hover:ring-2 hover:ring-slate-300'
                                        }`}
                                    title={user.name}
                                >
                                    <Avatar className="h-6 w-6">
                                        <AvatarImage src={user.photo_url} />
                                        <AvatarFallback className="text-xs">
                                            {user.name
                                                .split(' ')
                                                .map((n) => n[0])
                                                .join('')
                                                .toUpperCase()
                                                .slice(0, 2)}
                                        </AvatarFallback>
                                    </Avatar>
                                </button>
                            ))}
                        </div>

                        {/* New Lead Button */}
                        <Button
                            className="bg-violet-600 hover:bg-violet-700 text-white"
                            onClick={() => {
                                setSelectedLeadId(null);
                                setIsDetailSheetOpen(true);
                            }}
                        >
                            <Plus className="h-4 w-4 mr-1" />
                            Novo Lead
                        </Button>
                    </div>
                </div>
            </div>

            {/* Board - Scrollable */}
            <div className="flex-1 overflow-hidden">
                {/* Desktop: Horizontal scroll */}
                <div className="hidden md:flex h-full overflow-x-auto overflow-y-hidden p-4 gap-4">
                    {stages.map((stage) => {
                        const stageLeads = leads.filter((lead) => lead.stage_id === stage.id);
                        return (
                            <div
                                key={stage.id}
                                onDragOver={handleDragOver}
                                onDrop={() => handleDrop(stage.id)}
                            >
                                <PipelineColumn
                                    stage={stage}
                                    leads={stageLeads}
                                    onLeadClick={handleLeadClick}
                                    onDragOver={handleDragOver}
                                    onDrop={handleDrop}
                                />
                            </div>
                        );
                    })}
                </div>

                {/* Mobile: Vertical scroll (Accordion style) */}
                <div className="md:hidden flex flex-col overflow-y-auto p-4 gap-4">
                    {stages.map((stage) => {
                        const stageLeads = leads.filter((lead) => lead.stage_id === stage.id);
                        return (
                            <PipelineColumn
                                key={stage.id}
                                stage={stage}
                                leads={stageLeads}
                                onLeadClick={handleLeadClick}
                            />
                        );
                    })}
                </div>
            </div>

            {/* Lead Detail Sheet */}
            <LeadDetailSheet
                leadId={selectedLeadId}
                pipelineId={selectedPipeline?.id || null}
                initialStageId={stages[0]?.id || null}
                open={isDetailSheetOpen}
                onOpenChange={(open) => {
                    setIsDetailSheetOpen(open);
                    if (!open) {
                        setSelectedLeadId(null); // Reset selected lead
                        loadLeads(); // Refresh leads when sheet closes
                    }
                }}
            />
        </div>
    );
}
