import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface WorkflowExecution {
    id: string;
    workflow_id: string;
    lead_id: string;
    current_step_id: string | null;
    status: 'WAITING' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'CANCELLED' | 'FAILED';
    started_at: string;
    completed_at: string | null;
    next_execution_at: string | null;
    execution_data: any;
    error_message: string | null;
    created_at: string;
    updated_at: string;
    workflow?: {
        id: string;
        name: string;
        description: string;
        trigger_type: string;
        is_active: boolean;
    };
}

interface Workflow {
    id: string;
    name: string;
    description: string;
    trigger_type: string;
    is_active: boolean;
}

export function useWorkflowExecutions(leadId: string | null) {
    const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
    const [availableWorkflows, setAvailableWorkflows] = useState<Workflow[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchExecutions = async () => {
        if (!leadId) {
            setExecutions([]);
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('crm_workflow_executions')
                .select(`
          *,
          workflow:crm_workflows(id, name, description, trigger_type, is_active)
        `)
                .eq('lead_id', leadId)
                .order('started_at', { ascending: false });

            if (error) throw error;

            setExecutions(data || []);
        } catch (error) {
            console.error('Error fetching workflow executions:', error);
            toast.error('Erro ao carregar fluxos de trabalho');
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailableWorkflows = async (clinicId: string) => {
        try {
            // Get all active workflows for this clinic
            const { data: workflows, error: workflowsError } = await supabase
                .from('crm_workflows')
                .select('id, name, description, trigger_type, is_active')
                .eq('clinic_id', clinicId)
                .eq('is_active', true);

            if (workflowsError) throw workflowsError;

            // Filter out workflows the lead is already enrolled in
            const enrolledWorkflowIds = executions.map(e => e.workflow_id);
            const available = (workflows || []).filter(
                w => !enrolledWorkflowIds.includes(w.id)
            );

            setAvailableWorkflows(available);
        } catch (error) {
            console.error('Error fetching available workflows:', error);
        }
    };

    const cancelExecution = async (executionId: string) => {
        try {
            const { error } = await supabase
                .from('crm_workflow_executions')
                .update({
                    status: 'CANCELLED',
                    completed_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                })
                .eq('id', executionId);

            if (error) throw error;

            toast.success('Fluxo cancelado com sucesso');
            await fetchExecutions();
        } catch (error) {
            console.error('Error cancelling workflow execution:', error);
            toast.error('Erro ao cancelar fluxo');
        }
    };

    const pauseExecution = async (executionId: string) => {
        try {
            const { error } = await supabase
                .from('crm_workflow_executions')
                .update({
                    status: 'PAUSED',
                    updated_at: new Date().toISOString(),
                })
                .eq('id', executionId);

            if (error) throw error;

            toast.success('Fluxo pausado');
            await fetchExecutions();
        } catch (error) {
            console.error('Error pausing workflow execution:', error);
            toast.error('Erro ao pausar fluxo');
        }
    };

    const resumeExecution = async (executionId: string) => {
        try {
            const { error } = await supabase
                .from('crm_workflow_executions')
                .update({
                    status: 'WAITING',
                    updated_at: new Date().toISOString(),
                })
                .eq('id', executionId);

            if (error) throw error;

            toast.success('Fluxo retomado');
            await fetchExecutions();
        } catch (error) {
            console.error('Error resuming workflow execution:', error);
            toast.error('Erro ao retomar fluxo');
        }
    };

    const manualEnroll = async (workflowId: string) => {
        if (!leadId) {
            toast.error('Lead ID não encontrado');
            return;
        }

        try {
            // Get workflow's first step
            const { data: workflow, error: workflowError } = await supabase
                .from('crm_workflows')
                .select('first_step_id')
                .eq('id', workflowId)
                .single();

            if (workflowError) throw workflowError;

            // Create execution
            const { error } = await supabase
                .from('crm_workflow_executions')
                .insert({
                    workflow_id: workflowId,
                    lead_id: leadId,
                    current_step_id: workflow.first_step_id,
                    status: 'WAITING',
                    started_at: new Date().toISOString(),
                });

            if (error) {
                // Check if it's a duplicate enrollment error
                if (error.code === '23505') {
                    toast.error('Lead já está inscrito neste fluxo');
                } else {
                    throw error;
                }
                return;
            }

            toast.success('Lead inscrito no fluxo com sucesso');
            await fetchExecutions();
        } catch (error) {
            console.error('Error enrolling in workflow:', error);
            toast.error('Erro ao inscrever no fluxo');
        }
    };

    useEffect(() => {
        fetchExecutions();
    }, [leadId]);

    return {
        executions,
        availableWorkflows,
        loading,
        cancelExecution,
        pauseExecution,
        resumeExecution,
        manualEnroll,
        fetchAvailableWorkflows,
        refresh: fetchExecutions,
    };
}
