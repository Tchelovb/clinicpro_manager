import { supabase } from '../lib/supabase';

export type TriggerEvent = 'ENTER_STAGE' | 'EXIT_STAGE' | 'STAGNATED' | 'CREATED';
export type ActionType = 'SEND_WHATSAPP' | 'CREATE_TASK' | 'CHANGE_OWNER';

export interface AutomationRule {
    id: string;
    pipeline_id: string;
    stage_id?: string;
    trigger_event: TriggerEvent;
    action_type: ActionType;
    config: any;
    is_active: boolean;
}

export const automationService = {
    /**
     * Check and trigger automations for a specific event
     */
    async checkAndTriggerAutomations(
        leadId: string,
        triggerEvent: TriggerEvent,
        context: {
            pipelineId?: string,
            stageId?: string,
            previousStageId?: string
        }
    ) {
        console.log(`🤖 Checking automations for lead ${leadId} on event ${triggerEvent}`);

        try {
            // 1. Fetch active automation rules matching criteria
            let query = supabase
                .from('crm_automations')
                .select('*')
                .eq('is_active', true)
                .eq('trigger_event', triggerEvent);

            if (context.pipelineId) {
                query = query.eq('pipeline_id', context.pipelineId);
            }

            if (context.stageId && triggerEvent === 'ENTER_STAGE') {
                query = query.eq('stage_id', context.stageId);
            }

            if (context.previousStageId && triggerEvent === 'EXIT_STAGE') {
                query = query.eq('stage_id', context.previousStageId);
            }

            const { data: rules, error } = await query;

            if (error) {
                console.error('Error fetching automations:', error);
                return;
            }

            if (!rules || rules.length === 0) {
                console.log('No automations found for this event.');
                return;
            }

            console.log(`Found ${rules.length} automations to execute.`);

            // 2. Execute each rule
            for (const rule of rules) {
                await this.executeAutomation(rule, leadId, context);
            }

        } catch (err) {
            console.error('Unexpected error in automation service:', err);
        }
    },

    /**
     * Execute a specific automation rule
     */
    async executeAutomation(rule: AutomationRule, leadId: string, context: any) {
        console.log(`Executing automation rule: ${rule.id} (${rule.action_type})`);

        try {
            let resultData = {};
            let status = 'SUCCESS';

            switch (rule.action_type) {
                case 'SEND_WHATSAPP':
                    resultData = await this.executeSendWhatsapp(rule, leadId);
                    break;
                case 'CREATE_TASK':
                    resultData = await this.executeCreateTask(rule, leadId);
                    break;
                case 'CHANGE_OWNER':
                    resultData = await this.executeChangeOwner(rule, leadId);
                    break;
                default:
                    console.warn(`Unknown action type: ${rule.action_type}`);
                    status = 'SKIPPED';
            }

            // Log execution
            await this.logExecution(rule.id, leadId, status, resultData);

        } catch (err) {
            console.error(`Error executing rule ${rule.id}:`, err);
            await this.logExecution(rule.id, leadId, 'FAILURE', { error: (err as Error).message });
        }
    },

    /**
     * Action: Send WhatsApp Message
     */
    async executeSendWhatsapp(rule: AutomationRule, leadId: string) {
        // TODO: Integrate with actual WhatsApp service/API
        // For now, we simulate the action
        const { message_template, delay_minutes } = rule.config;

        console.log(`[MOCK] Sending WhatsApp to lead ${leadId}:`, message_template);

        // Simulating DB call to fetch lead phone...

        return { message_sent: message_template, recipient: 'lead_phone' };
    },

    /**
     * Action: Create Task
     */
    async executeCreateTask(rule: AutomationRule, leadId: string) {
        const { title, due_days, description } = rule.config;
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + (due_days || 1));

        const { data, error } = await supabase
            .from('lead_tasks')
            .insert([{
                lead_id: leadId,
                title: title || 'Tarefa Automática',
                due_date: dueDate.toISOString().split('T')[0],
                completed: false
            }])
            .select()
            .single();

        if (error) throw error;
        return { task_id: data.id, title: data.title };
    },

    /**
     * Action: Change Owner
     */
    async executeChangeOwner(rule: AutomationRule, leadId: string) {
        const { new_owner_id } = rule.config;

        if (!new_owner_id) throw new Error('No new owner specified in config');

        const { error } = await supabase
            .from('leads')
            .update({ owner_id: new_owner_id })
            .eq('id', leadId);

        if (error) throw error;
        return { new_owner_id };
    },

    /**
     * Log execution to database
     */
    async logExecution(automationId: string, leadId: string, status: string, resultData: any) {
        const { error } = await supabase
            .from('crm_automation_logs')
            .insert([{
                automation_id: automationId,
                lead_id: leadId,
                status: status,
                result_data: resultData
            }]);

        if (error) console.error('Error logging automation:', error);
    }
};
