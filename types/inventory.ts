// =====================================================
// TYPES: ESTOQUE (INVENTORY)
// Módulo: Estoque Integrado (P2)
// Impacto: +R$ 10.000/mês
// =====================================================

export type UnitOfMeasure =
    | 'UNIT'
    | 'BOX'
    | 'KG'
    | 'G'
    | 'ML'
    | 'L'
    | 'METER'
    | 'OTHER';

export type MovementType =
    | 'IN'          // Entrada
    | 'OUT'         // Saída
    | 'ADJUSTMENT'  // Ajuste
    | 'TRANSFER'    // Transferência
    | 'LOSS'        // Perda
    | 'RETURN';     // Devolução

export type ReferenceType =
    | 'PURCHASE'
    | 'SALE'
    | 'PROCEDURE'
    | 'ADJUSTMENT'
    | 'OTHER';

export type StockStatus =
    | 'OUT_OF_STOCK'
    | 'CRITICAL'
    | 'LOW'
    | 'OK';

// Categoria de Estoque
export interface InventoryCategory {
    id: string;
    clinic_id: string;
    name: string;
    description?: string;
    is_active: boolean;
    created_at: string;
}

// Item de Estoque
export interface InventoryItem {
    id: string;
    clinic_id: string;
    category_id?: string;

    name: string;
    description?: string;
    sku?: string;
    barcode?: string;

    // Unidade de Medida
    unit_of_measure: UnitOfMeasure;

    // Estoque
    current_stock: number;
    minimum_stock: number;
    maximum_stock?: number;

    // Financeiro
    unit_cost: number;
    selling_price: number;

    // Fornecedor
    supplier_name?: string;
    supplier_contact?: string;

    // Status
    is_active: boolean;
    requires_prescription: boolean;
    is_controlled: boolean;

    // Auditoria
    created_at: string;
    updated_at: string;
}

// Movimentação de Estoque
export interface InventoryMovement {
    id: string;
    clinic_id: string;
    inventory_item_id: string;

    movement_type: MovementType;

    quantity: number;
    unit_cost: number;
    total_cost: number;

    // Referências
    reference_type?: ReferenceType;
    reference_id?: string;

    // Detalhes
    reason?: string;
    notes?: string;

    // Estoque Anterior e Novo
    stock_before?: number;
    stock_after?: number;

    // Auditoria
    performed_by?: string;
    performed_at: string;
}

// View de Itens com Estoque Baixo
export interface LowStockItem {
    id: string;
    clinic_id: string;
    name: string;
    sku?: string;
    current_stock: number;
    minimum_stock: number;
    unit_cost: number;
    supplier_name?: string;
    category_name?: string;
    stock_status: StockStatus;
}

// Receita de Procedimento (Bill of Materials)
export interface ProcedureRecipe {
    id: string;
    procedure_id: string;
    clinic_id: string;
    name: string;
    description?: string;
    is_default: boolean;
    created_at: string;
}

// Itens da Receita
export interface ProcedureRecipeItem {
    id: string;
    recipe_id: string;
    inventory_item_id: string;
    quantity_needed: number;
    is_optional: boolean;
    notes?: string;
}

// Consumo Real de Materiais
export interface ProcedureMaterialUsage {
    id: string;
    treatment_item_id: string;
    inventory_item_id: string;
    quantity_used: number;
    unit_cost: number;
    used_at: string;
    used_by?: string;
}

// DTOs
export interface CreateInventoryItemDTO {
    clinic_id: string;
    category_id?: string;
    name: string;
    description?: string;
    sku?: string;
    barcode?: string;
    unit_of_measure?: UnitOfMeasure;
    current_stock?: number;
    minimum_stock?: number;
    maximum_stock?: number;
    unit_cost?: number;
    selling_price?: number;
    supplier_name?: string;
    supplier_contact?: string;
    requires_prescription?: boolean;
    is_controlled?: boolean;
}

export interface UpdateInventoryItemDTO {
    name?: string;
    description?: string;
    sku?: string;
    barcode?: string;
    unit_of_measure?: UnitOfMeasure;
    minimum_stock?: number;
    maximum_stock?: number;
    unit_cost?: number;
    selling_price?: number;
    supplier_name?: string;
    supplier_contact?: string;
    is_active?: boolean;
    requires_prescription?: boolean;
    is_controlled?: boolean;
}

export interface CreateInventoryMovementDTO {
    clinic_id: string;
    inventory_item_id: string;
    movement_type: MovementType;
    quantity: number;
    unit_cost?: number;
    reference_type?: ReferenceType;
    reference_id?: string;
    reason?: string;
    notes?: string;
    performed_by?: string;
}

export interface CreateProcedureRecipeDTO {
    procedure_id: string;
    clinic_id: string;
    name: string;
    description?: string;
    is_default?: boolean;
    items: {
        inventory_item_id: string;
        quantity_needed: number;
        is_optional?: boolean;
        notes?: string;
    }[];
}

// Estatísticas
export interface InventoryStats {
    total_items: number;
    active_items: number;
    low_stock_items: number;
    out_of_stock_items: number;
    total_inventory_value: number;
    total_movements_this_month: number;
    total_cost_this_month: number;
}

// Relatório de Consumo por Procedimento
export interface ProcedureConsumptionReport {
    procedure_name: string;
    total_procedures: number;
    total_material_cost: number;
    average_cost_per_procedure: number;
    most_used_materials: {
        item_name: string;
        total_quantity: number;
        total_cost: number;
    }[];
}
