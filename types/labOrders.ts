// =====================================================
// TYPES: GESTÃO LABORATORIAL
// Módulo: Gestão Laboratorial (P0)
// Impacto: +R$ 15.000/mês
// =====================================================

export type LabOrderWorkType =
    | 'CROWN'
    | 'BRIDGE'
    | 'DENTURE'
    | 'IMPLANT'
    | 'VENEER'
    | 'ORTHODONTIC'
    | 'OTHER';

export type LabOrderStatus =
    | 'PREPARING'
    | 'SENT'
    | 'IN_PROGRESS'
    | 'READY'
    | 'RECEIVED'
    | 'DELIVERED_TO_PATIENT'
    | 'RETURNED_FOR_CORRECTION'
    | 'CANCELLED';

export type LabOrderDelayStatus =
    | 'ON_TIME'
    | 'MINOR_DELAY'
    | 'MODERATE_DELAY'
    | 'CRITICAL_DELAY'
    | 'COMPLETED';

export interface LabOrder {
    id: string;
    clinic_id: string;
    patient_id: string;
    professional_id: string;

    // Laboratório
    supplier_name: string;
    supplier_contact?: string;
    supplier_email?: string;
    supplier_phone?: string;

    // Vinculação com Tratamento
    treatment_item_id?: string;
    budget_id?: string;

    // Descrição do Trabalho
    work_description: string;
    work_type?: LabOrderWorkType;
    quantity: number;

    // Datas Críticas
    sent_date: string;
    expected_return_date: string;
    received_date?: string;
    delivered_to_patient_date?: string;

    // Financeiro do Lab
    cost: number;
    is_paid: boolean;
    payment_date?: string;
    payment_method?: string;

    // Workflow
    status: LabOrderStatus;

    // Detalhes Técnicos
    shade_guide?: string;
    material?: string;
    special_instructions?: string;

    // Controle de Qualidade
    quality_check_passed?: boolean;
    quality_notes?: string;
    returned_for_correction_count: number;
    correction_reason?: string;

    // Notas
    notes?: string;

    // Auditoria
    created_by?: string;
    created_at: string;
    updated_at: string;
}

// View de Pedidos Atrasados
export interface OverdueLabOrder {
    id: string;
    clinic_id: string;
    patient_id: string;
    patient_name: string;
    patient_phone: string;
    professional_id: string;
    professional_name: string;
    supplier_name: string;
    work_description: string;
    work_type?: LabOrderWorkType;
    sent_date: string;
    expected_return_date: string;
    status: LabOrderStatus;
    cost: number;
    days_overdue: number;
    returned_for_correction_count: number;
}

// View de Performance de Laboratórios
export interface LabSupplierPerformance {
    clinic_id: string;
    supplier_name: string;
    total_orders: number;
    completed_orders: number;
    late_deliveries: number;
    orders_with_corrections: number;
    average_cost: number;
    average_turnaround_days: number;
    average_delay_days: number;
}

// DTOs
export interface CreateLabOrderDTO {
    clinic_id: string;
    patient_id: string;
    professional_id: string;
    supplier_name: string;
    supplier_contact?: string;
    supplier_email?: string;
    supplier_phone?: string;
    treatment_item_id?: string;
    budget_id?: string;
    work_description: string;
    work_type?: LabOrderWorkType;
    quantity?: number;
    sent_date: string;
    expected_return_date: string;
    cost?: number;
    shade_guide?: string;
    material?: string;
    special_instructions?: string;
    notes?: string;
}

export interface UpdateLabOrderDTO {
    status?: LabOrderStatus;
    received_date?: string;
    delivered_to_patient_date?: string;
    is_paid?: boolean;
    payment_date?: string;
    payment_method?: string;
    quality_check_passed?: boolean;
    quality_notes?: string;
    correction_reason?: string;
    notes?: string;
}

// Estatísticas
export interface LabOrderStats {
    total_orders: number;
    active_orders: number;
    overdue_orders: number;
    completed_orders: number;
    average_turnaround_days: number;
    total_cost: number;
    total_paid: number;
    pending_payment: number;
}

// Filtros
export interface LabOrderFilters {
    clinic_id: string;
    status?: LabOrderStatus[];
    supplier_name?: string;
    patient_id?: string;
    professional_id?: string;
    is_overdue?: boolean;
    date_from?: string;
    date_to?: string;
}
