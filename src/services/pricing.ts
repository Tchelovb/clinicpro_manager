import { supabase } from '../src/lib/supabase';

export interface Procedure {
  id: string;
  name: string;
  category: string;
  duration_min: number;
  sessions: number;
  base_price: number;
  code_tuss?: string;
  description?: string;
  is_active: boolean;
}

export interface PriceTable {
  id: string;
  clinic_id: string;
  name: string;
  global_adjustment_percent: number;
  is_default: boolean;
  is_active: boolean;
}

export interface PriceTableItem {
  id: string;
  price_table_id: string;
  procedure_id: string;
  custom_price?: number;
  individual_adjustment_percent?: number;
  is_active: boolean;
}

export interface Convention {
  id: string;
  name: string;
  code?: string;
  price_table_id: string;
  status: string;
  price_table?: PriceTable;
}

/**
 * Calculate final price for a procedure in a specific price table
 * Follows the business logic: custom_price > calculated > base_price
 */
export const calculateFinalPrice = (
  basePrice: number,
  priceTableItem: PriceTableItem | null,
  globalAdjustmentPercent: number
): number => {
  // 1. If custom price is set, use it (highest priority)
  if (
    priceTableItem?.custom_price !== null &&
    priceTableItem?.custom_price !== undefined
  ) {
    return priceTableItem.custom_price;
  }

  // 2. Calculate with individual or global adjustment
  const adjustmentPercent =
    priceTableItem?.individual_adjustment_percent ?? globalAdjustmentPercent;
  const finalPrice = basePrice * (1 + adjustmentPercent / 100);

  return Math.round(finalPrice * 100) / 100; // Round to 2 decimal places
};

/**
 * Get all procedures for a clinic
 */
export const getProcedures = async (clinicId: string): Promise<Procedure[]> => {
  try {
    const { data, error } = await supabase
      .from("procedure")
      .select("*")
      .eq("clinic_id", clinicId)
      .eq("is_active", true)
      .order("name");

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Erro ao buscar procedimentos:", error);
    return [];
  }
};

/**
 * Get all price tables for a clinic
 */
export const getPriceTables = async (
  clinicId: string
): Promise<PriceTable[]> => {
  try {
    const { data, error } = await supabase
      .from("price_tables")
      .select("*")
      .eq("clinic_id", clinicId)
      .eq("is_active", true)
      .order("name");

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Erro ao buscar tabelas de preço:", error);
    return [];
  }
};

/**
 * Get price table items for a specific table
 */
export const getPriceTableItems = async (
  priceTableId: string
): Promise<PriceTableItem[]> => {
  try {
    const { data, error } = await supabase
      .from("price_table_items")
      .select("*")
      .eq("price_table_id", priceTableId)
      .eq("is_active", true);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Erro ao buscar itens da tabela de preço:", error);
    return [];
  }
};

/**
 * Get procedures with their pricing for a specific price table
 */
export const getProceduresWithPricing = async (
  clinicId: string,
  priceTableId?: string
): Promise<
  Array<Procedure & { final_price: number; adjustment_type: string }>
> => {
  try {
    const procedures = await getProcedures(clinicId);
    const priceTables = await getPriceTables(clinicId);

    const defaultTable = priceTables.find((pt) => pt.is_default);
    const targetTable =
      priceTables.find((pt) => pt.id === priceTableId) || defaultTable;

    if (!targetTable) {
      // Return procedures with base price only
      return procedures.map((proc) => ({
        ...proc,
        final_price: proc.base_price,
        adjustment_type: "base",
      }));
    }

    const priceTableItems = await getPriceTableItems(targetTable.id);

    return procedures.map((proc) => {
      const item = priceTableItems.find((pti) => pti.procedure_id === proc.id);
      const finalPrice = calculateFinalPrice(
        proc.base_price,
        item || null,
        targetTable.global_adjustment_percent
      );

      let adjustmentType = "global";
      if (item?.custom_price !== null && item?.custom_price !== undefined) {
        adjustmentType = "custom";
      } else if (
        item?.individual_adjustment_percent !== null &&
        item?.individual_adjustment_percent !== undefined
      ) {
        adjustmentType = "individual";
      }

      return {
        ...proc,
        final_price: finalPrice,
        adjustment_type: adjustmentType,
      };
    });
  } catch (error) {
    console.error("Erro ao buscar procedimentos com preços:", error);
    return [];
  }
};

/**
 * Create or update a procedure
 */
export const saveProcedure = async (
  procedure: Partial<Procedure>
): Promise<Procedure | null> => {
  try {
    const clinicId = await getCurrentClinicId();
    if (!clinicId) throw new Error("Clínica não encontrada");

    const procedureData = {
      ...procedure,
      clinic_id: clinicId,
      is_active: procedure.is_active ?? true,
    };

    if (procedure.id) {
      // Update
      const { data, error } = await supabase
        .from("procedure")
        .update(procedureData)
        .eq("id", procedure.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      // Create
      const { data, error } = await supabase
        .from("procedure")
        .insert(procedureData)
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  } catch (error) {
    console.error("Erro ao salvar procedimento:", error);
    throw error;
  }
};

/**
 * Create or update a price table
 */
export const savePriceTable = async (
  priceTable: Partial<PriceTable>
): Promise<PriceTable | null> => {
  try {
    const clinicId = await getCurrentClinicId();
    if (!clinicId) throw new Error("Clínica não encontrada");

    const tableData = {
      ...priceTable,
      clinic_id: clinicId,
      is_active: priceTable.is_active ?? true,
    };

    if (priceTable.id) {
      // Update
      const { data, error } = await supabase
        .from("price_tables")
        .update(tableData)
        .eq("id", priceTable.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      // Create
      const { data, error } = await supabase
        .from("price_tables")
        .insert(tableData)
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  } catch (error) {
    console.error("Erro ao salvar tabela de preços:", error);
    throw error;
  }
};

/**
 * Save price table item (override)
 */
export const savePriceTableItem = async (
  item: Partial<PriceTableItem>
): Promise<PriceTableItem | null> => {
  try {
    const itemData = {
      ...item,
      is_active: item.is_active ?? true,
    };

    if (item.id) {
      // Update
      const { data, error } = await supabase
        .from("price_table_items")
        .update(itemData)
        .eq("id", item.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      // Check if item already exists
      const { data: existing } = await supabase
        .from("price_table_items")
        .select("id")
        .eq("price_table_id", item.price_table_id)
        .eq("procedure_id", item.procedure_id)
        .single();

      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from("price_table_items")
          .update(itemData)
          .eq("id", existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new
        const { data, error } = await supabase
          .from("price_table_items")
          .insert(itemData)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    }
  } catch (error) {
    console.error("Erro ao salvar item da tabela de preços:", error);
    throw error;
  }
};

// Helper function
const getCurrentClinicId = async (): Promise<string | null> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase
      .from("users")
      .select("clinic_id")
      .eq("id", user.id)
      .single();

    return data?.clinic_id || null;
  } catch (error) {
    console.error("Erro ao obter ID da clínica:", error);
    return null;
  }
};
