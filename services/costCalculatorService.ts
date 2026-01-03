import { supabase } from '../src/lib/supabase';

/**
 * Cost Calculator Service
 * Serviço para cálculos de custos e estrutura financeira
 */

export interface ExpenseCategory {
    id: string;
    name: string;
    is_variable_cost: boolean;
    active: boolean;
}

export interface FixedCostItem {
    id?: string;
    clinic_id: string;
    name: string;
    amount: number;
    category: string;
    is_active: boolean;
}

export interface CostStructure {
    fixed_costs_monthly: number;
    desired_prolabore: number;
    productive_chairs: number;
    weekly_hours: number;
    cost_per_minute: number;
}

export interface CostCalculationResult {
    totalCosts: number;
    monthlyHours: number;
    monthlyMinutes: number;
    costPerMinute: number;
}

class CostCalculatorService {
    /**
     * Busca categorias de despesa que são custos fixos
     */
    async getFixedCostCategories(clinicId: string): Promise<ExpenseCategory[]> {
        try {
            const { data, error } = await supabase
                .from('expense_category')
                .select('id, name, is_variable_cost, active')
                .eq('clinic_id', clinicId)
                .eq('is_variable_cost', false)
                .eq('active', true)
                .order('name');

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Erro ao buscar categorias de custo fixo:', error);
            return [];
        }
    }

    /**
     * Busca itens de custo fixo já cadastrados
     */
    async getFixedCostItems(clinicId: string): Promise<FixedCostItem[]> {
        try {
            const { data, error } = await supabase
                .from('fixed_cost_items')
                .select('*')
                .eq('clinic_id', clinicId)
                .eq('is_active', true)
                .order('name');

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Erro ao buscar itens de custo fixo:', error);
            return [];
        }
    }

    /**
     * Salva ou atualiza itens de custo fixo
     */
    async saveFixedCostItems(clinicId: string, items: Array<{ name: string; amount: number; category: string }>): Promise<boolean> {
        try {
            // Desativar todos os itens existentes
            await supabase
                .from('fixed_cost_items')
                .update({ is_active: false })
                .eq('clinic_id', clinicId);

            // Inserir novos itens
            const itemsToInsert = items
                .filter(item => item.amount > 0)
                .map(item => ({
                    clinic_id: clinicId,
                    name: item.name,
                    amount: item.amount,
                    category: 'ADMINISTRATIVE', // Pode ser ajustado conforme necessário
                    is_active: true
                }));

            if (itemsToInsert.length > 0) {
                const { error } = await supabase
                    .from('fixed_cost_items')
                    .insert(itemsToInsert);

                if (error) throw error;
            }

            return true;
        } catch (error) {
            console.error('Erro ao salvar itens de custo fixo:', error);
            return false;
        }
    }

    /**
     * Busca estrutura de custos da clínica
     */
    async getCostStructure(clinicId: string): Promise<CostStructure | null> {
        try {
            const { data, error } = await supabase
                .from('clinic_cost_structure')
                .select('*')
                .eq('clinic_id', clinicId)
                .single();

            if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
            return data;
        } catch (error) {
            console.error('Erro ao buscar estrutura de custos:', error);
            return null;
        }
    }

    /**
     * Salva estrutura de custos da clínica
     */
    async saveCostStructure(clinicId: string, structure: Omit<CostStructure, 'cost_per_minute'>): Promise<boolean> {
        try {
            // Calcular custo por minuto
            const costPerMinute = this.calculateCostPerMinute(
                structure.fixed_costs_monthly,
                structure.desired_prolabore,
                structure.productive_chairs,
                structure.weekly_hours
            );

            const dataToSave = {
                clinic_id: clinicId,
                fixed_costs_monthly: structure.fixed_costs_monthly,
                desired_prolabore: structure.desired_prolabore,
                productive_chairs: structure.productive_chairs,
                weekly_hours: structure.weekly_hours,
                cost_per_minute: costPerMinute
            };

            // Verificar se já existe
            const existing = await this.getCostStructure(clinicId);

            if (existing) {
                // Atualizar
                const { error } = await supabase
                    .from('clinic_cost_structure')
                    .update(dataToSave)
                    .eq('clinic_id', clinicId);

                if (error) throw error;
            } else {
                // Inserir
                const { error } = await supabase
                    .from('clinic_cost_structure')
                    .insert(dataToSave);

                if (error) throw error;
            }

            return true;
        } catch (error) {
            console.error('Erro ao salvar estrutura de custos:', error);
            return false;
        }
    }

    /**
     * Calcula horas mensais produtivas
     */
    calculateMonthlyHours(
        chairs: number,
        weeklyHours: number,
        efficiency: number = 0.8
    ): number {
        // Horas mensais = (Cadeiras × Horas Semanais × 4 semanas) × Eficiência
        return chairs * weeklyHours * 4 * efficiency;
    }

    /**
     * Calcula custo por minuto
     */
    calculateCostPerMinute(
        fixedCosts: number,
        prolabore: number,
        chairs: number,
        weeklyHours: number,
        efficiency: number = 0.8
    ): number {
        const totalCosts = fixedCosts + prolabore;
        const monthlyHours = this.calculateMonthlyHours(chairs, weeklyHours, efficiency);
        const monthlyMinutes = monthlyHours * 60;

        if (monthlyMinutes === 0) return 0;

        return totalCosts / monthlyMinutes;
    }

    /**
     * Calcula todos os valores relacionados ao custo
     */
    calculateCostBreakdown(
        fixedCosts: number,
        prolabore: number,
        chairs: number,
        weeklyHours: number,
        efficiency: number = 0.8
    ): CostCalculationResult {
        const totalCosts = fixedCosts + prolabore;
        const monthlyHours = this.calculateMonthlyHours(chairs, weeklyHours, efficiency);
        const monthlyMinutes = monthlyHours * 60;
        const costPerMinute = monthlyMinutes > 0 ? totalCosts / monthlyMinutes : 0;

        return {
            totalCosts,
            monthlyHours,
            monthlyMinutes,
            costPerMinute
        };
    }

    /**
     * Valida estrutura de custos
     */
    validateCostStructure(structure: Partial<CostStructure>): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!structure.fixed_costs_monthly || structure.fixed_costs_monthly < 0) {
            errors.push('Custos fixos mensais devem ser maiores que zero');
        }

        if (!structure.desired_prolabore || structure.desired_prolabore < 0) {
            errors.push('Pró-labore deve ser maior que zero');
        }

        if (!structure.productive_chairs || structure.productive_chairs < 1) {
            errors.push('Número de cadeiras produtivas deve ser pelo menos 1');
        }

        if (!structure.weekly_hours || structure.weekly_hours < 1 || structure.weekly_hours > 168) {
            errors.push('Horas semanais devem estar entre 1 e 168');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }
}

export const costCalculatorService = new CostCalculatorService();
export default costCalculatorService;
