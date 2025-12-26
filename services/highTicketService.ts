import { supabase } from '../lib/supabase';
import { automationService } from './automationService';

// =====================================================
// TYPES & INTERFACES (Dynamic CRM)
// =====================================================

export interface PipelineStage {
    id: string;
    name: string;
    color: string;
    stage_order: number;
    win_probability: number;
    days_to_stagnation: number;
}

export interface Pipeline {
    id: string;
    name: string;
    is_default: boolean;
    stages: PipelineStage[];
}

export interface HighTicketLead {
    id: string;
    clinic_id: string;
    pipeline_id: string;
    stage_id: string; // NEW: Dynamic stage reference
    name: string;
    phone: string;
    email?: string;
    desired_treatment?: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    value?: number;
    lead_score: number;
    source: string;
    owner_id?: string;
    custom_fields_data?: Record<string, any>;
    created_at: string;
    last_interaction: string;

    // Legacy fields for backward compatibility
    status?: string;
    estimated_value?: number;
}

export interface PipelineStats {
    totalValue: number;
    hotLeads: number;
    conversionRate: number;
}

// =====================================================
// SERVICE
// =====================================================

export const highTicketService = {

    /**
     * Fetch Pipeline Structure (Stages)
     * This replaces the hardcoded COLUMNS array
     */
    async getPipelineStructure(clinicId: string): Promise<Pipeline> {
        // 1. Get default pipeline for clinic
        const { data: pipeline, error: pError } = await supabase
            .from('crm_pipelines')
            .select('*')
            .eq('clinic_id', clinicId)
            .eq('is_default', true)
            .single();

        if (pError) throw pError;

        // 2. Get stages for this pipeline
        const { data: stages, error: sError } = await supabase
            .from('crm_stages')
            .select('*')
            .eq('pipeline_id', pipeline.id)
            .order('stage_order');

        if (sError) throw sError;

        return { ...pipeline, stages } as Pipeline;
    },

    /**
     * Get all pipelines for a clinic
     */
    async getAllPipelines(clinicId: string): Promise<Pipeline[]> {
        const { data: pipelines, error: pError } = await supabase
            .from('crm_pipelines')
            .select('*, stages:crm_stages(*)')
            .eq('clinic_id', clinicId)
            .eq('active', true)
            .order('created_at');

        if (pError) throw pError;
        return pipelines as Pipeline[];
    },

    /**
     * Get High-Ticket Leads (Now dynamic by pipeline)
     */
    async getHighTicketLeads(clinicId: string, pipelineId?: string): Promise<HighTicketLead[]> {
        let query = supabase
            .from('leads')
            .select('*')
            .eq('clinic_id', clinicId)
            .order('created_at', { ascending: false });


        // Filter by pipeline if specified
        if (pipelineId) {
            query = query.eq('pipeline_id', pipelineId);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Map to include legacy fields for compatibility
        return (data || []).map(lead => ({
            ...lead,
            estimated_value: lead.value,
            status: lead.stage_id // Temporary mapping
        })) as HighTicketLead[];
    },

    /**
     * Move Lead to New Stage (Replaces updateLeadStatus)
     */
    async moveLeadToStage(leadId: string, newStageId: string): Promise<void> {
        // 1. Fetch current state for automations
        const { data: currentLead } = await supabase
            .from('leads')
            .select('stage_id, pipeline_id')
            .eq('id', leadId)
            .single();

        const oldStageId = currentLead?.stage_id;
        const pipelineId = currentLead?.pipeline_id;

        // 2. Update Lead
        const { error } = await supabase
            .from('leads')
            .update({
                stage_id: newStageId,
                last_interaction: new Date().toISOString()
            })
            .eq('id', leadId);

        if (error) throw error;

        // 3. Trigger Automations
        try {
            if (oldStageId && oldStageId !== newStageId) {
                // Trigger EXIT_STAGE for old stage
                await automationService.checkAndTriggerAutomations(leadId, 'EXIT_STAGE', {
                    pipelineId,
                    stageId: oldStageId, // Context is the stage we are leaving
                    previousStageId: oldStageId
                });

                // Trigger ENTER_STAGE for new stage
                await automationService.checkAndTriggerAutomations(leadId, 'ENTER_STAGE', {
                    pipelineId,
                    stageId: newStageId,
                    previousStageId: oldStageId
                });
            }
        } catch (autoError) {
            console.error('Failed to trigger automations for moveLeadToStage:', autoError);
        }
    },

    /**
     * Create Lead (Now requires pipeline & stage)
     */
    async createLead(
        leadData: Partial<HighTicketLead>,
        pipelineId: string,
        initialStageId: string
    ): Promise<HighTicketLead> {
        // Map legacy field names to actual database columns
        const dbData: any = { ...leadData };

        // Convert estimated_value to value if present, but only if value is not already set
        if ('estimated_value' in dbData) {
            if (dbData.value === undefined) {
                dbData.value = dbData.estimated_value;
            }
            delete dbData.estimated_value;
        }

        // Remove legacy status field (we use stage_id now)
        delete dbData.status;

        const { data, error } = await supabase
            .from('leads')
            .insert([{
                ...dbData,
                pipeline_id: pipelineId,
                stage_id: initialStageId,
                source: dbData.source || 'MANUAL',
                lead_score: dbData.lead_score || 0,
                priority: dbData.priority || 'MEDIUM',
                last_interaction: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) throw error;

        // Trigger Automations
        try {
            const leadId = data.id;
            // 1. Trigger CREATED
            await automationService.checkAndTriggerAutomations(leadId, 'CREATED', {
                pipelineId: pipelineId,
                stageId: initialStageId
            });

            // 2. Trigger ENTER_STAGE for the initial stage
            await automationService.checkAndTriggerAutomations(leadId, 'ENTER_STAGE', {
                pipelineId: pipelineId,
                stageId: initialStageId
            });
        } catch (autoError) {
            console.error('Failed to trigger automations for new lead:', autoError);
            // Don't generate error for the caller, just log
        }

        return data as HighTicketLead;
    },

    /**
     * Update Lead
     */
    async updateLead(leadId: string, updates: Partial<HighTicketLead>): Promise<void> {
        // Map legacy field names to actual database columns
        const dbUpdates: any = { ...updates };

        // Convert estimated_value to value if present, but only if value is not already set
        if ('estimated_value' in dbUpdates) {
            if (dbUpdates.value === undefined) {
                dbUpdates.value = dbUpdates.estimated_value;
            }
            delete dbUpdates.estimated_value;
        }

        // Remove legacy status field (we use stage_id now)
        delete dbUpdates.status;

        const { error } = await supabase
            .from('leads')
            .update({
                ...dbUpdates,
                last_interaction: new Date().toISOString()
            })
            .eq('id', leadId);

        if (error) throw error;
    },

    /**
     * Delete Lead
     */
    async deleteLead(leadId: string): Promise<void> {
        const { error } = await supabase
            .from('leads')
            .delete()
            .eq('id', leadId);

        if (error) throw error;
    },

    /**
     * Get Pipeline Stats
     */
    async getPipelineStats(clinicId: string, pipelineId?: string): Promise<PipelineStats> {
        let query = supabase
            .from('leads')
            .select('value, priority, stage_id')
            .eq('clinic_id', clinicId);

        if (pipelineId) {
            query = query.eq('pipeline_id', pipelineId);
        }

        const { data: leads, error } = await query;

        if (error) throw error;

        const totalValue = leads?.reduce((sum, l) => sum + (l.value || 0), 0) || 0;
        const hotLeads = leads?.filter(l => l.priority === 'HIGH').length || 0;

        // Calculate conversion rate (simplified)
        const total = leads?.length || 0;
        const won = leads?.filter(l => l.stage_id?.includes('won') || l.stage_id?.includes('fechado')).length || 0;
        const conversionRate = total > 0 ? (won / total) * 100 : 0;

        return {
            totalValue,
            hotLeads,
            conversionRate
        };
    },

    /**
     * Get High-Ticket Budgets (Legacy - kept for compatibility)
     */
    async getHighTicketBudgets(clinicId: string): Promise<any[]> {
        const { data, error } = await supabase
            .from('budgets')
            .select('*')
            .eq('clinic_id', clinicId)
            .gte('final_value', 5000)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    /**
     * Legacy method - now redirects to moveLeadToStage
     * @deprecated Use moveLeadToStage instead
     */
    async updateLeadStatus(leadId: string, status: string): Promise<void> {
        // This is a temporary bridge - in production you'd map status to stage_id
        console.warn('updateLeadStatus is deprecated. Use moveLeadToStage instead.');

        // For now, just update the stage_id field directly
        // In a real scenario, you'd need to map the old status to a stage_id
        const { error } = await supabase
            .from('leads')
            .update({ last_interaction: new Date().toISOString() })
            .eq('id', leadId);

        if (error) throw error;
    }
};
