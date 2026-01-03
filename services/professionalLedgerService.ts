import { supabase } from '../src/lib/supabase';

// =====================================================
// TYPES
// =====================================================

export interface ProfessionalLedgerEntry {
    id: string;
    professional_id: string;
    clinic_id: string;
    entry_type: 'CREDIT' | 'DEBIT';
    category: 'COMMISSION' | 'LAB_COST' | 'MATERIAL_COST' | 'ADJUSTMENT' | 'WITHDRAWAL';
    amount: number;
    description: string;
    reference_type?: 'INSTALLMENT' | 'BUDGET' | 'TREATMENT_ITEM';
    reference_id?: string;
    created_at: string;
    created_by?: string;

    // Relations
    professional?: {
        id: string;
        name: string;
    };
}

export interface ProfessionalBalance {
    professional_id: string;
    professional_name: string;
    total_credits: number;
    total_debits: number;
    current_balance: number;
    pending_commissions: number; // Comissões de parcelas ainda não pagas
    available_for_withdrawal: number;
}

export interface CommissionCalculation {
    installment_id: string;
    budget_id: string;
    treatment_item_id?: string;
    professional_id: string;
    gross_value: number;
    commission_percent: number;
    commission_value: number;
    taxes_deducted: number;
    net_commission: number;
}

// =====================================================
// SERVICE
// =====================================================

export const professionalLedgerService = {
    /**
     * Get ledger entries for a professional
     */
    async getLedgerEntries(
        professionalId: string,
        filters?: {
            startDate?: string;
            endDate?: string;
            entryType?: 'CREDIT' | 'DEBIT';
            category?: string;
        }
    ): Promise<ProfessionalLedgerEntry[]> {
        let query = supabase
            .from('professional_ledger')
            .select(`
                *,
                professional:professionals(id, name)
            `)
            .eq('professional_id', professionalId)
            .order('created_at', { ascending: false });

        if (filters?.startDate) {
            query = query.gte('created_at', filters.startDate);
        }

        if (filters?.endDate) {
            query = query.lte('created_at', filters.endDate);
        }

        if (filters?.entryType) {
            // Try both column names for compatibility
            query = query.or(`entry_type.eq.${filters.entryType},type.eq.${filters.entryType}`);
        }

        if (filters?.category) {
            query = query.eq('category', filters.category);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Map to ensure entry_type is populated
        return (data || []).map(entry => ({
            ...entry,
            entry_type: entry.entry_type || entry.type
        }));
    },

    /**
     * Get professional balance
     */
    async getProfessionalBalance(professionalId: string): Promise<ProfessionalBalance> {
        const entries = await this.getLedgerEntries(professionalId);

        const total_credits = entries
            .filter(e => e.entry_type === 'CREDIT')
            .reduce((sum, e) => sum + e.amount, 0);

        const total_debits = entries
            .filter(e => e.entry_type === 'DEBIT')
            .reduce((sum, e) => sum + e.amount, 0);

        const current_balance = total_credits - total_debits;

        // Calculate pending commissions (from unpaid installments)
        const pending_commissions = await this.calculatePendingCommissions(professionalId);

        return {
            professional_id: professionalId,
            professional_name: entries[0]?.professional?.name || '',
            total_credits,
            total_debits,
            current_balance,
            pending_commissions,
            available_for_withdrawal: Math.max(0, current_balance)
        };
    },

    /**
     * Calculate commission when installment is paid
     * This is the CORE of the protection: only pay commission on received money
     */
    async calculateCommissionOnPayment(
        installmentId: string,
        professionalId: string,
        clinicId: string
    ): Promise<CommissionCalculation | null> {
        // 1. Get installment details
        const { data: installment, error: instError } = await supabase
            .from('installments')
            .select('*, budget:budgets(*)')
            .eq('id', installmentId)
            .single();

        if (instError || !installment) {
            console.error('Installment not found:', instError);
            return null;
        }

        // 2. Get professional commission configuration
        const { data: commissionConfig } = await supabase
            .from('professional_commissions')
            .select('*')
            .eq('professional_id', professionalId)
            .eq('clinic_id', clinicId)
            .eq('active', true)
            .single();

        const commission_percent = commissionConfig?.commission_percent || 30; // Default 30%

        // 3. Get clinic tax configuration
        const { data: clinic } = await supabase
            .from('clinics')
            .select('tax_rate_percent, commission_calculation_base')
            .eq('id', clinicId)
            .single();

        const tax_rate = clinic?.tax_rate_percent || 0;
        const calculation_base = clinic?.commission_calculation_base || 'NET_RECEIPT';

        // 4. Calculate commission
        const gross_value = installment.amount;

        // If base is NET_RECEIPT, deduct taxes first
        const taxable_value = calculation_base === 'NET_RECEIPT'
            ? gross_value * (1 - tax_rate / 100)
            : gross_value;

        const commission_value = taxable_value * (commission_percent / 100);
        const taxes_deducted = gross_value - taxable_value;
        const net_commission = commission_value;

        return {
            installment_id: installmentId,
            budget_id: installment.budget_id!,
            professional_id: professionalId,
            gross_value,
            commission_percent,
            commission_value,
            taxes_deducted,
            net_commission
        };
    },

    /**
     * Credit commission to professional ledger
     */
    async creditCommission(
        calculation: CommissionCalculation,
        createdBy?: string
    ): Promise<void> {
        const { error } = await supabase
            .from('professional_ledger')
            .insert([{
                professional_id: calculation.professional_id,
                clinic_id: (await supabase.from('professionals').select('clinic_id').eq('id', calculation.professional_id).single()).data?.clinic_id,
                entry_type: 'CREDIT',
                category: 'COMMISSION',
                amount: calculation.net_commission,
                description: `Comissão sobre parcela paga - R$ ${calculation.gross_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${calculation.commission_percent}%)`,
                reference_type: 'INSTALLMENT',
                reference_id: calculation.installment_id,
                created_by: createdBy
            }]);

        if (error) throw error;
    },

    /**
     * Debit lab or material cost from professional
     */
    async debitCost(
        professionalId: string,
        clinicId: string,
        category: 'LAB_COST' | 'MATERIAL_COST',
        amount: number,
        description: string,
        referenceId?: string,
        createdBy?: string
    ): Promise<void> {
        const { error } = await supabase
            .from('professional_ledger')
            .insert([{
                professional_id: professionalId,
                clinic_id: clinicId,
                entry_type: 'DEBIT',
                category,
                amount,
                description,
                reference_type: referenceId ? 'TREATMENT_ITEM' : undefined,
                reference_id: referenceId,
                created_by: createdBy
            }]);

        if (error) throw error;
    },

    /**
     * Process withdrawal request
     */
    async processWithdrawal(
        professionalId: string,
        clinicId: string,
        amount: number,
        notes?: string,
        createdBy?: string
    ): Promise<void> {
        // 1. Check available balance
        const balance = await this.getProfessionalBalance(professionalId);

        if (balance.available_for_withdrawal < amount) {
            throw new Error(`Saldo insuficiente. Disponível: R$ ${balance.available_for_withdrawal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
        }

        // 2. Create debit entry
        const { error } = await supabase
            .from('professional_ledger')
            .insert([{
                professional_id: professionalId,
                clinic_id: clinicId,
                entry_type: 'DEBIT',
                category: 'WITHDRAWAL',
                amount,
                description: `Saque - ${notes || 'Sem observações'}`,
                created_by: createdBy
            }]);

        if (error) throw error;
    },

    /**
     * Calculate pending commissions (from unpaid installments)
     */
    async calculatePendingCommissions(professionalId: string): Promise<number> {
        // Get all unpaid installments for this professional's treatments
        // This is a simplified version - in production, you'd need to join with treatment_items

        // TODO: Implement full logic with treatment_items relationship
        // For now, return 0
        return 0;
    },

    /**
     * Get commission summary for a period
     */
    async getCommissionSummary(
        professionalId: string,
        startDate: string,
        endDate: string
    ): Promise<{
        total_gross: number;
        total_commissions: number;
        total_taxes: number;
        total_net: number;
        entries_count: number;
    }> {
        const entries = await this.getLedgerEntries(professionalId, {
            startDate,
            endDate,
            entryType: 'CREDIT',
            category: 'COMMISSION'
        });

        const total_commissions = entries.reduce((sum, e) => sum + e.amount, 0);

        return {
            total_gross: 0, // TODO: Calculate from installments
            total_commissions,
            total_taxes: 0, // TODO: Calculate from clinic config
            total_net: total_commissions,
            entries_count: entries.length
        };
    },

    /**
     * Trigger commission calculation when installment is marked as paid
     * This should be called from receivablesService.markAsPaid()
     */
    async onInstallmentPaid(
        installmentId: string,
        professionalId: string,
        clinicId: string
    ): Promise<void> {
        try {
            // 1. Calculate commission
            const calculation = await this.calculateCommissionOnPayment(
                installmentId,
                professionalId,
                clinicId
            );

            if (!calculation) {
                console.warn('Could not calculate commission for installment:', installmentId);
                return;
            }

            // 2. Credit to ledger
            await this.creditCommission(calculation);

            console.log(`✅ Commission credited: R$ ${calculation.net_commission.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} to professional ${professionalId}`);
        } catch (error) {
            console.error('Error processing commission:', error);
            throw error;
        }
    },

    /**
     * Get all professionals with their balances
     */
    async getAllProfessionalBalances(clinicId: string): Promise<ProfessionalBalance[]> {
        const { data: professionals, error } = await supabase
            .from('professionals')
            .select('id, name')
            .eq('clinic_id', clinicId)
            .eq('is_active', true);

        if (error) throw error;

        const balances = await Promise.all(
            (professionals || []).map(prof => this.getProfessionalBalance(prof.id))
        );

        return balances;
    }
};
