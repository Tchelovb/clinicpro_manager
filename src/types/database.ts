// ============================================
// TIPOS DO BANCO DE DADOS - CONFIGURAÇÕES
// ============================================
// Este arquivo define as interfaces TypeScript
// baseadas no schema do Supabase
// ============================================

/**
 * Tabela: clinics
 * Dados da clínica (branding, horários, configurações)
 */
export interface Clinic {
    id: string;
    name: string;
    cnpj?: string;
    address?: string;
    phone?: string;
    email?: string;

    // Branding
    primary_color: string; // Default: '#3B82F6'
    secondary_color: string; // Default: '#10B981'
    logo_light_url?: string;
    logo_dark_url?: string;

    // Configuração de Agenda
    opening_time?: string;
    closing_time?: string;
    slot_duration: number; // Default: 30 (minutos)
    working_days: string[]; // ['monday', 'tuesday', ...]

    // Configuração Financeira
    tax_rate_percent?: number;
    commission_trigger: 'ISSUANCE' | 'RECEIPT';

    created_at: string;
    updated_at: string;
}

/**
 * Tabela: system_settings
 * Configurações do sistema (chaves API, URLs, etc)
 */
export interface SystemSetting {
    key: string;
    value: string;
    description?: string;
    updated_at: string;
}

/**
 * View: view_system_settings_safe
 * Versão segura com chaves mascaradas
 */
export interface SystemSettingSafe {
    key: string;
    value: string; // Chaves sensíveis aparecem como "••••••••1234"
    description?: string;
    updated_at: string;
}

/**
 * Tabela: user_permissions
 * Permissões de usuários
 */
export interface UserPermissions {
    id: string;
    user_id: string;
    can_view_financial: boolean;
    can_give_discount: boolean;
    max_discount_percent: number;
    can_delete_transaction: boolean;
    can_view_all_patients: boolean;
    can_manage_users: boolean;
    can_delete_patient: boolean;
    can_edit_budget: boolean;
    created_at: string;
    updated_at: string;
}

/**
 * Tabela: payment_method
 * Métodos de pagamento disponíveis
 */
export interface PaymentMethod {
    id: string;
    clinic_id: string;
    name: string;
    type: 'CREDIT_CARD' | 'DEBIT_CARD' | 'PIX' | 'CASH' | 'BANK_TRANSFER';
    is_active: boolean;
    created_at: string;
}

/**
 * Tabela: payment_method_fees
 * Taxas por método de pagamento
 */
export interface PaymentMethodFee {
    id: string;
    payment_method_id: string;
    installments: number;
    fee_percent: number;
    created_at: string;
}

/**
 * DTO para atualizar configurações do sistema
 */
export interface UpdateSystemSettingDTO {
    key: string;
    value: string;
    description?: string;
}

/**
 * DTO para atualizar dados da clínica
 */
export interface UpdateClinicDTO {
    name?: string;
    cnpj?: string;
    address?: string;
    phone?: string;
    email?: string;
    primary_color?: string;
    secondary_color?: string;
    logo_light_url?: string;
    logo_dark_url?: string;
    opening_time?: string;
    closing_time?: string;
    slot_duration?: number;
    working_days?: string[];
    tax_rate_percent?: number;
    commission_trigger?: 'ISSUANCE' | 'RECEIPT';
}
