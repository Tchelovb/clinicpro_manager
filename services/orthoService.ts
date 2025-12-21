import { supabase } from '../lib/supabase';

export interface OrthoContract {
    id: string;
    clinic_id: string;
    patient_id: string;
    budget_id?: string;
    professional_id?: string;
    contract_type: 'FIXED_BRACES' | 'ALIGNERS' | 'ORTHOPEDIC' | 'LINGUAL' | 'CERAMIC';
    total_value: number;
    down_payment: number;
    monthly_payment: number;
    number_of_months: number;
    billing_day: number;
    start_date: string;
    estimated_end_date?: string;
    actual_end_date?: string;
    status: 'ACTIVE' | 'SUSPENDED' | 'COMPLETED' | 'CANCELLED';
    suspension_reason?: string;
    suspended_at?: string;
    auto_charge: boolean;
    block_scheduling_if_overdue: boolean;
    overdue_tolerance_days: number;
    notes?: string;
    created_at: string;
    updated_at: string;
}

export interface OrthoTreatmentPlan {
    id: string;
    contract_id: string;
    total_aligners_upper: number;
    total_aligners_lower: number;
    current_aligner_upper: number;
    current_aligner_lower: number;
    change_frequency_days: number;
    last_aligner_change_date?: string;
    next_aligner_change_date?: string;
    installation_date?: string;
    bracket_type?: 'METAL' | 'CERAMIC' | 'SAPPHIRE' | 'LINGUAL' | 'SELF_LIGATING';
    current_phase: 'DIAGNOSIS' | 'LEVELING' | 'ALIGNMENT' | 'WORKING' | 'SPACE_CLOSURE' | 'FINISHING' | 'RETENTION';
    phase_started_at?: string;
    treatment_goals?: string;
    extractions_planned?: string[];
    extractions_completed?: string[];
    ipr_planned?: any;
    attachments_planned?: string[];
    attachments_placed?: string[];
    notes?: string;
    updated_at: string;
}

export interface OrthoAppointment {
    id: string;
    appointment_id: string;
    treatment_plan_id: string;
    appointment_type: 'INSTALLATION' | 'MAINTENANCE' | 'ADJUSTMENT' | 'EMERGENCY' | 'REMOVAL' | 'RETENTION_CHECK';
    archwire_upper?: string;
    archwire_lower?: string;
    elastics_upper?: string;
    elastics_lower?: string;
    chain_upper?: string;
    chain_lower?: string;
    aligners_delivered_from?: number;
    aligners_delivered_to?: number;
    aligners_stock_given?: number;
    ipr_performed: boolean;
    ipr_teeth?: string;
    attachments_placed: boolean;
    attachments_removed: boolean;
    attachments_list?: string;
    bracket_broken?: string[];
    bracket_replaced?: string[];
    band_loose?: string[];
    wire_broken: boolean;
    hygiene_score?: number;
    compliance_score?: number;
    cooperation_notes?: string;
    next_visit_plan?: string;
    next_visit_interval_days: number;
    extra_charge_reason?: string;
    extra_charge_value: number;
    notes?: string;
    photos_urls?: string[];
    created_at: string;
}

export interface AlignerStock {
    id: string;
    treatment_plan_id: string;
    aligner_number: number;
    arch: 'UPPER' | 'LOWER';
    status: 'ORDERED' | 'RECEIVED' | 'DELIVERED' | 'IN_USE' | 'COMPLETED' | 'LOST' | 'DAMAGED';
    ordered_date?: string;
    received_date?: string;
    delivered_date?: string;
    expected_start_date?: string;
    actual_start_date?: string;
    expected_end_date?: string;
    actual_end_date?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
}

class OrthoService {
    // =====================================================
    // CONTRATOS
    // =====================================================

    async createContract(contract: Partial<OrthoContract>): Promise<OrthoContract> {
        const { data, error } = await supabase
            .from('ortho_contracts')
            .insert([contract])
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async getContractsByPatient(patientId: string): Promise<OrthoContract[]> {
        const { data, error } = await supabase
            .from('ortho_contracts')
            .select('*')
            .eq('patient_id', patientId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    async getActiveContracts(clinicId: string): Promise<OrthoContract[]> {
        const { data, error } = await supabase
            .from('ortho_contracts')
            .select('*, patients(name, phone)')
            .eq('clinic_id', clinicId)
            .eq('status', 'ACTIVE')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    async updateContract(id: string, updates: Partial<OrthoContract>): Promise<OrthoContract> {
        const { data, error } = await supabase
            .from('ortho_contracts')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async suspendContract(id: string, reason: string): Promise<OrthoContract> {
        return this.updateContract(id, {
            status: 'SUSPENDED',
            suspension_reason: reason,
            suspended_at: new Date().toISOString(),
        });
    }

    async reactivateContract(id: string): Promise<OrthoContract> {
        return this.updateContract(id, {
            status: 'ACTIVE',
            suspension_reason: null,
            suspended_at: null,
        });
    }

    // =====================================================
    // PLANOS DE TRATAMENTO
    // =====================================================

    async createTreatmentPlan(plan: Partial<OrthoTreatmentPlan>): Promise<OrthoTreatmentPlan> {
        const { data, error } = await supabase
            .from('ortho_treatment_plans')
            .insert([plan])
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async getTreatmentPlanByContract(contractId: string): Promise<OrthoTreatmentPlan | null> {
        const { data, error } = await supabase
            .from('ortho_treatment_plans')
            .select('*')
            .eq('contract_id', contractId)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
    }

    async updateTreatmentPlan(id: string, updates: Partial<OrthoTreatmentPlan>): Promise<OrthoTreatmentPlan> {
        const { data, error } = await supabase
            .from('ortho_treatment_plans')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async advanceAligner(treatmentPlanId: string, arch: 'upper' | 'lower'): Promise<OrthoTreatmentPlan> {
        const plan = await this.getTreatmentPlanByContract(treatmentPlanId);
        if (!plan) throw new Error('Treatment plan not found');

        const updates: Partial<OrthoTreatmentPlan> = {};

        if (arch === 'upper') {
            updates.current_aligner_upper = plan.current_aligner_upper + 1;
        } else {
            updates.current_aligner_lower = plan.current_aligner_lower + 1;
        }

        return this.updateTreatmentPlan(plan.id, updates);
    }

    // =====================================================
    // CONSULTAS ORTODÔNTICAS
    // =====================================================

    async createOrthoAppointment(appointment: Partial<OrthoAppointment>): Promise<OrthoAppointment> {
        const { data, error } = await supabase
            .from('ortho_appointments')
            .insert([appointment])
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async getAppointmentsByTreatmentPlan(treatmentPlanId: string): Promise<OrthoAppointment[]> {
        const { data, error } = await supabase
            .from('ortho_appointments')
            .select('*, appointments(date)')
            .eq('treatment_plan_id', treatmentPlanId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    // =====================================================
    // ESTOQUE DE ALINHADORES
    // =====================================================

    async createAlignerStock(stock: Partial<AlignerStock>): Promise<AlignerStock> {
        const { data, error } = await supabase
            .from('ortho_aligner_stock')
            .insert([stock])
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async getAlignerStockByTreatmentPlan(treatmentPlanId: string): Promise<AlignerStock[]> {
        const { data, error } = await supabase
            .from('ortho_aligner_stock')
            .select('*')
            .eq('treatment_plan_id', treatmentPlanId)
            .order('arch', { ascending: true })
            .order('aligner_number', { ascending: true });

        if (error) throw error;
        return data || [];
    }

    async updateAlignerStock(id: string, updates: Partial<AlignerStock>): Promise<AlignerStock> {
        const { data, error } = await supabase
            .from('ortho_aligner_stock')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async deliverAligners(
        treatmentPlanId: string,
        arch: 'UPPER' | 'LOWER',
        fromNumber: number,
        toNumber: number
    ): Promise<void> {
        const { error } = await supabase
            .from('ortho_aligner_stock')
            .update({
                status: 'DELIVERED',
                delivered_date: new Date().toISOString(),
            })
            .eq('treatment_plan_id', treatmentPlanId)
            .eq('arch', arch)
            .gte('aligner_number', fromNumber)
            .lte('aligner_number', toNumber);

        if (error) throw error;
    }

    // =====================================================
    // RELATÓRIOS E VIEWS
    // =====================================================

    async getContractsAging(clinicId: string): Promise<any[]> {
        const { data, error } = await supabase
            .from('ortho_contracts_aging')
            .select('*')
            .eq('clinic_id', clinicId)
            .order('days_overdue', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    async getAlignerProgress(clinicId: string): Promise<any[]> {
        const { data, error } = await supabase
            .from('ortho_aligner_progress')
            .select('*')
            .order('progress_upper_percent', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    // =====================================================
    // GERAÇÃO DE PARCELAS
    // =====================================================

    async generateInstallments(contractId: string): Promise<void> {
        const contract = await supabase
            .from('ortho_contracts')
            .select('*, patients(id, name)')
            .eq('id', contractId)
            .single();

        if (contract.error) throw contract.error;
        if (!contract.data) throw new Error('Contract not found');

        const { patient_id, clinic_id, monthly_payment, number_of_months, billing_day, start_date } = contract.data;

        // Gerar parcelas
        const installments = [];
        const startDate = new Date(start_date);

        for (let i = 0; i < number_of_months; i++) {
            const dueDate = new Date(startDate);
            dueDate.setMonth(dueDate.getMonth() + i);
            dueDate.setDate(billing_day);

            installments.push({
                patient_id,
                clinic_id,
                description: `Ortodontia - Mensalidade ${i + 1}/${number_of_months}`,
                due_date: dueDate.toISOString().split('T')[0],
                amount: monthly_payment,
                amount_paid: 0,
                status: 'PENDING',
                payment_method: null,
            });
        }

        const { error } = await supabase
            .from('financial_installments')
            .insert(installments);

        if (error) throw error;
    }
}

export const orthoService = new OrthoService();
