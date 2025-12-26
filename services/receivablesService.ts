import { supabase } from '../lib/supabase';

// =====================================================
// TYPES
// =====================================================

export interface Installment {
    id: string;
    patient_id: string;
    clinic_id: string;
    budget_id?: string;
    installment_number: number;
    total_installments: number;
    amount: number;
    due_date: string;
    paid_date?: string;
    status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
    payment_method?: string;
    notes?: string;
    created_at: string;
    updated_at: string;

    // Relations
    patient?: {
        id: string;
        name: string;
        phone: string;
        email?: string;
    };
}

export interface CollectionRule {
    daysBeforeDue: number;
    daysAfterDue: number;
    action: 'REMINDER' | 'WARNING' | 'BLOCK_SCHEDULE';
    message: string;
}

export interface ReceivablesStats {
    totalPending: number;
    totalOverdue: number;
    totalPaid: number;
    overdueCount: number;
    dueThisWeek: number;
    averageTicket: number;
}

// =====================================================
// COLLECTION RULES (Régua de Cobrança)
// =====================================================

export const COLLECTION_RULES: CollectionRule[] = [
    {
        daysBeforeDue: 3,
        daysAfterDue: 0,
        action: 'REMINDER',
        message: 'Olá {PATIENT_NAME}! Lembramos que sua parcela de R$ {AMOUNT} vence em {DAYS} dias. Qualquer dúvida, estamos à disposição! 😊'
    },
    {
        daysBeforeDue: 0,
        daysAfterDue: 1,
        action: 'WARNING',
        message: 'Olá {PATIENT_NAME}, identificamos que sua parcela de R$ {AMOUNT} venceu ontem. Por favor, regularize para evitar bloqueios. Link de pagamento: {PAYMENT_LINK}'
    },
    {
        daysBeforeDue: 0,
        daysAfterDue: 15,
        action: 'BLOCK_SCHEDULE',
        message: 'Olá {PATIENT_NAME}, sua parcela está em atraso há 15 dias. Seu agendamento foi bloqueado até a regularização. Entre em contato conosco.'
    }
];

// =====================================================
// SERVICE
// =====================================================

export const receivablesService = {
    /**
     * Get all installments with filters
     */
    async getInstallments(
        clinicId: string,
        filters?: {
            status?: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
            patientId?: string;
            startDate?: string;
            endDate?: string;
        }
    ): Promise<Installment[]> {
        let query = supabase
            .from('installments')
            .select(`
                *,
                patient:patients(id, name, phone, email)
            `)
            .eq('clinic_id', clinicId)
            .order('due_date', { ascending: true });

        if (filters?.status) {
            query = query.eq('status', filters.status);
        }

        if (filters?.patientId) {
            query = query.eq('patient_id', filters.patientId);
        }

        if (filters?.startDate) {
            query = query.gte('due_date', filters.startDate);
        }

        if (filters?.endDate) {
            query = query.lte('due_date', filters.endDate);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Update status based on due date
        return (data || []).map(installment => ({
            ...installment,
            status: this.calculateStatus(installment)
        }));
    },

    /**
     * Calculate installment status based on due date
     */
    calculateStatus(installment: Installment): 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED' {
        if (installment.paid_date) return 'PAID';
        if (installment.status === 'CANCELLED') return 'CANCELLED';

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dueDate = new Date(installment.due_date);
        dueDate.setHours(0, 0, 0, 0);

        if (dueDate < today) return 'OVERDUE';
        return 'PENDING';
    },

    /**
     * Get receivables statistics
     */
    async getStats(clinicId: string): Promise<ReceivablesStats> {
        const installments = await this.getInstallments(clinicId);

        const totalPending = installments
            .filter(i => i.status === 'PENDING')
            .reduce((sum, i) => sum + i.amount, 0);

        const totalOverdue = installments
            .filter(i => i.status === 'OVERDUE')
            .reduce((sum, i) => sum + i.amount, 0);

        const totalPaid = installments
            .filter(i => i.status === 'PAID')
            .reduce((sum, i) => sum + i.amount, 0);

        const overdueCount = installments.filter(i => i.status === 'OVERDUE').length;

        // Due this week
        const today = new Date();
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);

        const dueThisWeek = installments
            .filter(i => {
                const dueDate = new Date(i.due_date);
                return i.status === 'PENDING' && dueDate >= today && dueDate <= nextWeek;
            })
            .reduce((sum, i) => sum + i.amount, 0);

        const averageTicket = installments.length > 0
            ? installments.reduce((sum, i) => sum + i.amount, 0) / installments.length
            : 0;

        return {
            totalPending,
            totalOverdue,
            totalPaid,
            overdueCount,
            dueThisWeek,
            averageTicket
        };
    },

    /**
     * Mark installment as paid
     */
    async markAsPaid(
        installmentId: string,
        paymentMethod: string,
        paidDate?: string,
        notes?: string
    ): Promise<void> {
        const { error } = await supabase
            .from('installments')
            .update({
                status: 'PAID',
                paid_date: paidDate || new Date().toISOString(),
                payment_method: paymentMethod,
                notes,
                updated_at: new Date().toISOString()
            })
            .eq('id', installmentId);

        if (error) throw error;

        // TODO: Trigger professional commission calculation
        // await this.triggerCommissionCalculation(installmentId);
    },

    /**
     * Get installments that need collection action
     */
    async getInstallmentsForCollection(clinicId: string): Promise<{
        installment: Installment;
        rule: CollectionRule;
        daysUntilDue: number;
    }[]> {
        const installments = await this.getInstallments(clinicId, {
            status: 'PENDING'
        });

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const results: {
            installment: Installment;
            rule: CollectionRule;
            daysUntilDue: number;
        }[] = [];

        for (const installment of installments) {
            const dueDate = new Date(installment.due_date);
            dueDate.setHours(0, 0, 0, 0);

            const diffTime = dueDate.getTime() - today.getTime();
            const daysUntilDue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            // Check each collection rule
            for (const rule of COLLECTION_RULES) {
                const shouldTrigger = daysUntilDue >= 0
                    ? daysUntilDue === rule.daysBeforeDue
                    : Math.abs(daysUntilDue) === rule.daysAfterDue;

                if (shouldTrigger) {
                    results.push({
                        installment,
                        rule,
                        daysUntilDue
                    });
                }
            }
        }

        return results;
    },

    /**
     * Format collection message
     */
    formatCollectionMessage(
        message: string,
        installment: Installment,
        daysUntilDue: number
    ): string {
        return message
            .replace('{PATIENT_NAME}', installment.patient?.name || 'Cliente')
            .replace('{AMOUNT}', installment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 }))
            .replace('{DAYS}', Math.abs(daysUntilDue).toString())
            .replace('{PAYMENT_LINK}', `https://pay.clinicpro.com/${installment.id}`); // TODO: Real payment link
    },

    /**
     * Execute collection action
     */
    async executeCollectionAction(
        installment: Installment,
        rule: CollectionRule,
        daysUntilDue: number
    ): Promise<void> {
        const message = this.formatCollectionMessage(rule.message, installment, daysUntilDue);

        switch (rule.action) {
            case 'REMINDER':
            case 'WARNING':
                // TODO: Integrate with WhatsApp/SMS service
                console.log(`[COLLECTION] Sending ${rule.action} to ${installment.patient?.phone}:`, message);
                // await whatsappService.sendMessage(installment.patient?.phone, message);
                break;

            case 'BLOCK_SCHEDULE':
                // Block patient scheduling
                await this.blockPatientScheduling(installment.patient_id, installment.id);
                console.log(`[COLLECTION] Blocked scheduling for patient ${installment.patient_id}`);
                break;
        }

        // Log collection attempt
        await this.logCollectionAttempt(installment.id, rule.action, message);
    },

    /**
     * Block patient scheduling due to overdue payment
     */
    async blockPatientScheduling(patientId: string, installmentId: string): Promise<void> {
        // TODO: Implement scheduling block logic
        // This could be a flag in the patients table or a separate blocking_reasons table
        console.log(`Blocking scheduling for patient ${patientId} due to installment ${installmentId}`);
    },

    /**
     * Log collection attempt
     */
    async logCollectionAttempt(
        installmentId: string,
        action: string,
        message: string
    ): Promise<void> {
        // TODO: Create collection_logs table
        console.log(`[LOG] Collection attempt for installment ${installmentId}:`, { action, message });
    },

    /**
     * Check if lab order can be sent (Trava de Laboratório)
     */
    async canSendLabOrder(
        patientId: string,
        budgetId: string,
        estimatedLabCost: number
    ): Promise<{ allowed: boolean; reason?: string; amountPaid: number; amountNeeded: number }> {
        // Get all installments for this budget
        const { data: installments, error } = await supabase
            .from('installments')
            .select('*')
            .eq('patient_id', patientId)
            .eq('budget_id', budgetId);

        if (error) throw error;

        // Calculate total paid
        const amountPaid = (installments || [])
            .filter(i => i.status === 'PAID' || i.paid_date)
            .reduce((sum, i) => sum + i.amount, 0);

        const allowed = amountPaid >= estimatedLabCost;

        return {
            allowed,
            reason: allowed
                ? undefined
                : `Cliente precisa pagar mais R$ ${(estimatedLabCost - amountPaid).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} antes de enviar para o laboratório.`,
            amountPaid,
            amountNeeded: estimatedLabCost
        };
    },

    /**
     * Run daily collection routine
     * This should be called by a cron job or scheduled task
     */
    async runDailyCollectionRoutine(clinicId: string): Promise<void> {
        console.log(`[COLLECTION ROUTINE] Starting for clinic ${clinicId}`);

        const actionsNeeded = await this.getInstallmentsForCollection(clinicId);

        console.log(`[COLLECTION ROUTINE] Found ${actionsNeeded.length} actions to execute`);

        for (const { installment, rule, daysUntilDue } of actionsNeeded) {
            try {
                await this.executeCollectionAction(installment, rule, daysUntilDue);
            } catch (error) {
                console.error(`[COLLECTION ROUTINE] Error executing action for installment ${installment.id}:`, error);
            }
        }

        console.log(`[COLLECTION ROUTINE] Completed`);
    }
};
