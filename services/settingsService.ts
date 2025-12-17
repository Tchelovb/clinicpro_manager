import { supabase } from "../lib/supabase";

// Tipos básicos para o serviço
export interface Clinic {
  id: string;
  name: string;
  cnpj?: string;
  address?: string;
  phone?: string;
  email?: string;
  code?: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "DENTIST" | "RECEPTIONIST" | "PROFESSIONAL";
  color?: string;
  active: boolean;
  phone?: string;
  clinic_id: string;
  professional_id?: string;
  professional?: {
    id: string;
    name: string;
    crc: string;
  };
  created_at: string;
  updated_at: string;
}

export interface Procedure {
  id: string;
  name: string;
  category?: string;
  base_price: number;
  duration_min?: number;
  sessions?: number;
  code_tuss?: string;
  description?: string;
  clinic_id: string;
  created_at: string;
  updated_at: string;
}

export interface PriceTable {
  id: string;
  clinic_id: string;
  name: string;
  global_adjustment_percent?: number;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PriceTableItem {
  id: string;
  price_table_id: string;
  procedure_id: string;
  custom_price?: number;
  individual_adjustment_percent?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Convention {
  id: string;
  clinic_id: string;
  name: string;
  code?: string;
  price_table_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ProfessionalSchedule {
  id: string;
  professional_id: string;
  clinic_id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export class SettingsService {
  // ==========================================
  // CLINIC SETTINGS
  // ==========================================

  static async getClinic(): Promise<Clinic | null> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error("Usuário não autenticado");

    const { data, error } = await supabase
      .from("users")
      .select("clinic_id")
      .eq("id", user.user.id)
      .single();

    if (error || !data?.clinic_id) return null;

    const { data: clinic, error: clinicError } = await supabase
      .from("clinics")
      .select("*")
      .eq("id", data.clinic_id)
      .single();

    if (clinicError) throw clinicError;
    return clinic;
  }

  static async updateClinic(updates: Partial<Clinic>): Promise<Clinic> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error("Usuário não autenticado");

    const { data: userData } = await supabase
      .from("users")
      .select("clinic_id")
      .eq("id", user.user.id)
      .single();

    if (!userData?.clinic_id) throw new Error("Clínica não encontrada");

    const { data, error } = await supabase
      .from("clinics")
      .update(updates)
      .eq("id", userData.clinic_id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ==========================================
  // PROFESSIONALS MANAGEMENT
  // ==========================================

  static async getProfessionals(): Promise<User[]> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error("Usuário não autenticado");

    const { data: userData } = await supabase
      .from("users")
      .select("clinic_id")
      .eq("id", user.user.id)
      .single();

    if (!userData?.clinic_id) throw new Error("Clínica não encontrada");

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("clinic_id", userData.clinic_id)
      .order("name");

    if (error) throw error;
    return data || [];
  }

  static async createProfessional(
    professional: Omit<User, "id" | "clinic_id" | "created_at" | "updated_at">
  ): Promise<User> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error("Usuário não autenticado");

    const { data: userData } = await supabase
      .from("users")
      .select("clinic_id")
      .eq("id", user.user.id)
      .single();

    if (!userData?.clinic_id) throw new Error("Clínica não encontrada");

    const { data, error } = await supabase
      .from("users")
      .insert({ ...professional, clinic_id: userData.clinic_id })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateProfessional(
    id: string,
    updates: Partial<User>
  ): Promise<User> {
    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteProfessional(id: string): Promise<void> {
    const { error } = await supabase.from("users").delete().eq("id", id);

    if (error) throw error;
  }

  // ==========================================
  // PROCEDURES MANAGEMENT
  // ==========================================

  static async getProcedures(): Promise<Procedure[]> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error("Usuário não autenticado");

    const { data: userData } = await supabase
      .from("users")
      .select("clinic_id")
      .eq("id", user.user.id)
      .single();

    if (!userData?.clinic_id) throw new Error("Clínica não encontrada");

    const { data, error } = await supabase
      .from("procedure")
      .select("*")
      .eq("clinic_id", userData.clinic_id)
      .order("name");

    if (error) throw error;
    return data || [];
  }

  static async createProcedure(
    procedure: Omit<Procedure, "id" | "clinic_id" | "created_at" | "updated_at">
  ): Promise<Procedure> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error("Usuário não autenticado");

    const { data: userData } = await supabase
      .from("users")
      .select("clinic_id")
      .eq("id", user.user.id)
      .single();

    if (!userData?.clinic_id) throw new Error("Clínica não encontrada");

    const { data, error } = await supabase
      .from("procedure")
      .insert({ ...procedure, clinic_id: userData.clinic_id })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateProcedure(
    id: string,
    updates: Partial<Procedure>
  ): Promise<Procedure> {
    const { data, error } = await supabase
      .from("procedure")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteProcedure(id: string): Promise<void> {
    const { error } = await supabase.from("procedure").delete().eq("id", id);

    if (error) throw error;
  }

  // ==========================================
  // PRICE TABLES MANAGEMENT
  // ==========================================

  static async getPriceTables(): Promise<PriceTable[]> {
    const { data, error } = await supabase
      .from("price_tables")
      .select("*")
      .order("name");

    if (error) throw error;
    return data || [];
  }

  static async createPriceTable(
    priceTable: Omit<PriceTable, "id" | "created_at" | "updated_at">
  ): Promise<PriceTable> {
    const { data, error } = await supabase
      .from("price_tables")
      .insert(priceTable)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updatePriceTable(
    id: string,
    updates: Partial<PriceTable>
  ): Promise<PriceTable> {
    const { data, error } = await supabase
      .from("price_tables")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deletePriceTable(id: string): Promise<void> {
    const { error } = await supabase.from("price_tables").delete().eq("id", id);

    if (error) throw error;
  }

  // ==========================================
  // PRICE TABLE ITEMS MANAGEMENT
  // ==========================================

  static async getPriceTableItems(
    priceTableId: string
  ): Promise<(PriceTableItem & { procedures?: Procedure })[]> {
    const { data, error } = await supabase
      .from("price_table_items")
      .select(
        `
        *,
        procedures (*)
      `
      )
      .eq("price_table_id", priceTableId)
      .eq("is_active", true);

    if (error) throw error;
    return data || [];
  }

  static async updatePriceTableItem(
    priceTableId: string,
    procedureId: string,
    updates: Partial<
      Omit<
        PriceTableItem,
        "id" | "price_table_id" | "procedure_id" | "created_at" | "updated_at"
      >
    >
  ): Promise<PriceTableItem> {
    const { data, error } = await supabase
      .from("price_table_items")
      .upsert({
        price_table_id: priceTableId,
        procedure_id: procedureId,
        ...updates,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deletePriceTableItem(
    priceTableId: string,
    procedureId: string
  ): Promise<void> {
    const { error } = await supabase
      .from("price_table_items")
      .delete()
      .eq("price_table_id", priceTableId)
      .eq("procedure_id", procedureId);

    if (error) throw error;
  }

  // ==========================================
  // CONVENTIONS MANAGEMENT
  // ==========================================

  static async getConventions(): Promise<
    (Convention & { price_tables?: PriceTable })[]
  > {
    const { data, error } = await supabase
      .from("conventions")
      .select(
        `
        *,
        price_tables (*)
      `
      )
      .order("name");

    if (error) throw error;
    return data || [];
  }

  static async createConvention(
    convention: Omit<Convention, "id" | "created_at" | "updated_at">
  ): Promise<Convention> {
    const { data, error } = await supabase
      .from("conventions")
      .insert(convention)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateConvention(
    id: string,
    updates: Partial<Convention>
  ): Promise<Convention> {
    const { data, error } = await supabase
      .from("conventions")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteConvention(id: string): Promise<void> {
    const { error } = await supabase.from("conventions").delete().eq("id", id);

    if (error) throw error;
  }

  // ==========================================
  // PROFESSIONAL SCHEDULES
  // ==========================================

  static async getProfessionalSchedules(
    professionalId?: string
  ): Promise<ProfessionalSchedule[]> {
    let query = supabase
      .from("professional_schedules")
      .select("*")
      .order("day_of_week");

    if (professionalId) {
      query = query.eq("professional_id", professionalId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  static async createProfessionalSchedule(
    schedule: Omit<ProfessionalSchedule, "id" | "created_at" | "updated_at">
  ): Promise<ProfessionalSchedule> {
    const { data, error } = await supabase
      .from("professional_schedules")
      .insert(schedule)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateProfessionalSchedule(
    id: string,
    updates: Partial<ProfessionalSchedule>
  ): Promise<ProfessionalSchedule> {
    const { data, error } = await supabase
      .from("professional_schedules")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteProfessionalSchedule(id: string): Promise<void> {
    const { error } = await supabase
      .from("professional_schedules")
      .delete()
      .eq("id", id);

    if (error) throw error;
  }

  // ==========================================
  // FINANCIAL CATEGORIES (Static for now)
  // ==========================================

  static async getExpenseCategories(): Promise<any[]> {
    return [
      { id: "1", name: "Aluguel" },
      { id: "2", name: "Materiais" },
      { id: "3", name: "Salários" },
      { id: "4", name: "Marketing" },
      { id: "5", name: "Outros" },
    ];
  }

  static async getIncomeCategories(): Promise<any[]> {
    return [
      { id: "1", name: "Tratamentos" },
      { id: "2", name: "Consultas" },
      { id: "3", name: "Procedimentos" },
      { id: "4", name: "Outros" },
    ];
  }

  // ==========================================
  // PAYMENT METHODS
  // ==========================================

  static async getPaymentMethods(): Promise<any[]> {
    return [
      { id: "1", name: "Dinheiro" },
      { id: "2", name: "PIX" },
      { id: "3", name: "Cartão de Crédito" },
      { id: "4", name: "Cartão de Débito" },
      { id: "5", name: "Boleto" },
      { id: "6", name: "Cheque" },
    ];
  }

  // ==========================================
  // CRM CATEGORIES
  // ==========================================

  static async getLeadSources(): Promise<any[]> {
    return [
      { id: "1", name: "Instagram" },
      { id: "2", name: "Facebook" },
      { id: "3", name: "Google Ads" },
      { id: "4", name: "Indicação" },
      { id: "5", name: "Site" },
      { id: "6", name: "Outros" },
    ];
  }

  static async getLeadStatuses(): Promise<any[]> {
    return [
      { id: "1", name: "Novo" },
      { id: "2", name: "Contato Inicial" },
      { id: "3", name: "Qualificado" },
      { id: "4", name: "Proposta" },
      { id: "5", name: "Negociação" },
      { id: "6", name: "Fechado" },
      { id: "7", name: "Perdido" },
    ];
  }

  // ==========================================
  // PRICE CALCULATION
  // ==========================================

  static async calculateProcedurePrice(
    procedureId: string,
    priceTableId?: string
  ): Promise<number> {
    const { data, error } = await supabase.rpc("calculate_procedure_price", {
      p_procedure_id: procedureId,
      p_price_table_id: priceTableId || null,
    });

    if (error) throw error;
    return data || 0;
  }
}

