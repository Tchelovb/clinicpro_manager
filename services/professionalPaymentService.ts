import { supabase } from '../src/lib/supabase';

export interface PendingProductionItem {
    item_id: string;
    clinic_id: string;
    budget_id: string;
    patient_id: string;
    patient_name: string;
    procedure_id: string;
    procedure_name: string;
    professional_id: string;
    professional_name: string;
    production_date: string;
    quantity: number;
    total_charged: number;
    unit_commission_value: number;
    total_commission_value: number;
}

export const professionalPaymentService = {
    /**
     * Fetches pending production items for a specific professional within a date range.
     * Uses the 'view_professional_production_pending' view.
     */
    async getPendingProduction(
        clinicId: string,
        professionalId: string | null,
        startDate: string,
        endDate: string
    ): Promise<PendingProductionItem[]> {
        let query = supabase
            .from('view_professional_production_pending')
            .select('*')
            .eq('clinic_id', clinicId)
            .gte('production_date', startDate)
            .lte('production_date', endDate)
            .order('production_date', { ascending: false });

        if (professionalId) {
            query = query.eq('professional_id', professionalId);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching pending production:', error);
            throw error;
        }

        return data as PendingProductionItem[];
    },

    /**
     * Generates a payment order (Commission Payment) for a professional.
     * This creates a record in 'commission_payments' and potentially in 'expenses' if configured.
     * It also updates the 'treatment_items' status to 'PROCESSING' or 'PAID'.
     */
    async generatePaymentOrder(
        clinicId: string,
        professionalId: string,
        periodStart: string,
        periodEnd: string,
        items: string[], // List of treatment_item_ids
        totalValue: number,
        notes: string
    ): Promise<string> { // Returns the Payment ID

        // 1. Create Commission Payment Record
        const { data: payment, error: paymentError } = await supabase
            .from('commission_payments')
            .insert({
                clinic_id: clinicId,
                professional_id: professionalId,
                period_start: periodStart,
                period_end: periodEnd,
                commission_value: totalValue,
                procedures_count: items.length,
                status: 'PENDING',
                notes: notes,
                details: { item_ids: items }
            })
            .select()
            .single();

        if (paymentError) throw paymentError;

        // 2. Update Treatment Items
        const { error: updateError } = await supabase
            .from('treatment_items')
            .update({
                professional_payment_id: payment.id,
                professional_payment_status: 'PROCESSING'
            })
            .in('id', items);

        if (updateError) throw updateError;

        // 3. Create Expense Record (Accounts Payable)
        // Get professional name for description
        const { data: prof } = await supabase.from('professionals').select('name').eq('id', professionalId).single();
        const profName = prof?.name || 'Profissional';

        const { error: expenseError } = await supabase
            .from('expenses')
            .insert({
                clinic_id: clinicId,
                description: `Repasse Honorários - ${profName}`,
                category: 'HONORARIOS_PROFISSIONAIS', // Ensure this category exists or use default
                amount: totalValue,
                due_date: new Date().toISOString().split('T')[0], // Due today by default? Or leave for user to edit
                status: 'PENDING',
                provider: profName
            });

        if (expenseError) {
            console.error("Error creating expense record:", expenseError);
            // We don't block the flow if expense fails, but we should log it.
        }

        return payment.id;
    },

    /**
     * Get summary of payments history
     */
    async getPaymentHistory(clinicId: string, professionalId?: string) {
        let query = supabase
            .from('commission_payments')
            .select(`
                *,
                professional:professionals(name)
            `)
            .eq('clinic_id', clinicId)
            .order('created_at', { ascending: false });

        if (professionalId) {
            query = query.eq('professional_id', professionalId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
    }
};
