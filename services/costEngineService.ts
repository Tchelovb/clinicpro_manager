import { supabase } from '../lib/supabase';

export interface ClinicCostStructure {
    clinic_id: string;
    fixed_costs_monthly: number;
    desired_prolabore: number;
    productive_chairs: number;
    weekly_hours: number;
    efficiency_rate: number;
    cost_per_minute: number;
    available_minutes_month: number;
}

export interface FixedCostItem {
    id: string;
    clinic_id: string;
    name: string;
    amount: number;
    category: 'ADMINISTRATIVE' | 'STAFF' | 'INFRASTRUCTURE' | 'MARKETING' | 'PROLABORE' | 'OTHER';
    is_active: boolean;
}

export const costEngineService = {
    /**
     * Busca a estrutura de custos da clínica
     */
    async getCostStructure(clinicId: string): Promise<ClinicCostStructure | null> {
        const { data, error } = await supabase
            .from('clinic_cost_structure')
            .select('*')
            .eq('clinic_id', clinicId)
            .single();

        if (error && error.code !== 'PGRST116') throw error;

        // Se não existir, retorna defaults
        if (!data) {
            return {
                clinic_id: clinicId,
                fixed_costs_monthly: 0,
                desired_prolabore: 0,
                productive_chairs: 1,
                weekly_hours: 40,
                efficiency_rate: 0.8,
                cost_per_minute: 0,
                available_minutes_month: 0
            };
        }

        return data;
    },

    /**
     * Busca itens de custo fixo
     */
    async getFixedCostItems(clinicId: string): Promise<FixedCostItem[]> {
        const { data, error } = await supabase
            .from('fixed_cost_items')
            .select('*')
            .eq('clinic_id', clinicId)
            .eq('is_active', true)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    /**
     * Salva ou atualiza um item de custo fixo
     */
    async saveFixedCostItem(item: Partial<FixedCostItem>): Promise<FixedCostItem> {
        if (!item.clinic_id) throw new Error('Clinic ID is required');

        const { data, error } = await supabase
            .from('fixed_cost_items')
            .upsert(item)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Remove (desativa) um item de custo fixo
     */
    async deleteFixedCostItem(itemId: string): Promise<void> {
        const { error } = await supabase
            .from('fixed_cost_items')
            .update({ is_active: false })
            .eq('id', itemId);

        if (error) throw error;
    },

    /**
     * Atualiza a capacidade e calcula o custo por minuto
     */
    async updateStructureAndCalculate(
        clinicId: string,
        capacity: { chairs: number; hours: number; efficiency: number }
    ): Promise<ClinicCostStructure> {
        // 1. Recalcular total de custos fixos
        const items = await this.getFixedCostItems(clinicId);
        const totalFixedCosts = items.reduce((sum, item) => sum + item.amount, 0);

        // Separar Prolabore se houver items categorizados (opcional, por enquanto soma tudo em fixed_costs_monthly para simplificar ou divide se a tabela exigir)
        // A tabela tem campos separados: fixed_costs_monthly e desired_prolabore.
        // Vamos somar Items 'PROLABORE' em desired_prolabore e o resto em fixed_costs_monthly
        const prolabore = items.filter(i => i.category === 'PROLABORE').reduce((sum, i) => sum + i.amount, 0);
        const otherCosts = items.filter(i => i.category !== 'PROLABORE').reduce((sum, i) => sum + i.amount, 0);

        // 2. Calcular Minutos Disponíveis
        // (Horas Semanais * 4 Semanas * Cadeiras) * Eficiência * 60 min
        const rawHoursMonth = capacity.hours * 4 * capacity.chairs;
        const productiveHoursMonth = rawHoursMonth * capacity.efficiency;
        const availableMinutes = Math.floor(productiveHoursMonth * 60);

        // 3. Calcular Custo Minuto
        const totalMonthlyExpenses = otherCosts + prolabore;
        const costPerMinute = availableMinutes > 0 ? totalMonthlyExpenses / availableMinutes : 0;

        // 4. Salvar no Banco
        const { data, error } = await supabase
            .from('clinic_cost_structure')
            .upsert({
                clinic_id: clinicId,
                fixed_costs_monthly: otherCosts,
                desired_prolabore: prolabore,
                productive_chairs: capacity.chairs,
                weekly_hours: capacity.hours,
                efficiency_rate: capacity.efficiency,
                available_minutes_month: availableMinutes,
                cost_per_minute: costPerMinute,
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};
