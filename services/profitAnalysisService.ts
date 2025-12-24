import { supabase } from '../lib/supabase';

/**
 * Profit Analysis Service
 * Calcula margem de lucro considerando TODOS os custos:
 * - Custo Operacional (Tempo × Custo/min)
 * - Custo de Material (Estoque)
 * - Custo de Laboratório
 * - Impostos
 * - Taxas de Cartão
 * - Comissão do Profissional
 */

export interface ProcedureData {
    id: string;
    name: string;
    estimated_duration: number; // minutos
    estimated_lab_cost: number;
    commission_type: 'PERCENTAGE' | 'FIXED_AMOUNT';
    commission_base_value: number;
}

export interface SalesCommissionRule {
    id: string;
    user_id: string;
    clinic_id: string;
    commission_type: 'PERCENTAGE' | 'FIXED';
    commission_value: number;
    applies_to_category: string | null;
    min_budget_value: number;
    is_active: boolean;
}

export interface ItemCosts {
    timeCost: number;           // Custo operacional (tempo × custo/min)
    materialCost: number;       // Custo de materiais/kits
    labCost: number;            // Custo de laboratório
    taxCost: number;            // Impostos
    cardFee: number;            // Taxa de cartão
    professionalCost: number;   // Comissão do profissional
    salesCommissionCost: number; // Comissão de venda (CRC/Recepção)
    totalCost: number;          // Soma de todos os custos
}

export interface ItemMargin {
    price: number;
    costs: ItemCosts;
    profit: number;             // Lucro líquido (price - totalCost)
    marginPercent: number;      // Margem % ((profit / price) × 100)
    status: 'excellent' | 'good' | 'warning' | 'danger';
}

export interface BudgetMarginAnalysis {
    totalPrice: number;
    totalCosts: number;
    totalProfit: number;
    marginPercent: number;
    itemsAnalysis: Array<{
        procedureName: string;
        margin: ItemMargin;
    }>;
    lowMarginItems: Array<{
        procedureName: string;
        marginPercent: number;
    }>;
}

class ProfitAnalysisService {
    /**
     * Busca custo por minuto da clínica
     */
    async getCostPerMinute(clinicId: string): Promise<number> {
        try {
            const { data, error } = await supabase
                .from('clinic_cost_structure')
                .select('cost_per_minute')
                .eq('clinic_id', clinicId)
                .single();

            if (error) throw error;
            return data?.cost_per_minute || 0;
        } catch (error) {
            console.error('Erro ao buscar custo por minuto:', error);
            return 0;
        }
    }

    /**
     * Busca dados do procedimento incluindo comissão
     */
    async getProcedureData(procedureId: string): Promise<ProcedureData | null> {
        try {
            const { data, error } = await supabase
                .from('procedures')
                .select('id, name, estimated_duration, estimated_lab_cost, commission_type, commission_base_value')
                .eq('id', procedureId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Erro ao buscar dados do procedimento:', error);
            return null;
        }
    }

    /**
     * Busca custo de materiais do procedimento
     */
    async getMaterialCost(procedureId: string): Promise<number> {
        try {
            const { data, error } = await supabase
                .from('procedure_costs')
                .select('material_cost')
                .eq('procedure_id', procedureId);

            if (error) throw error;

            // Soma todos os custos de materiais/kits
            return data?.reduce((sum, item) => sum + (item.material_cost || 0), 0) || 0;
        } catch (error) {
            console.error('Erro ao buscar custo de materiais:', error);
            return 0;
        }
    }

    /**
     * Busca regra de comissão de venda para um usuário
     */
    async getSalesCommissionRule(
        userId: string,
        clinicId: string,
        categoryId?: string
    ): Promise<SalesCommissionRule | null> {
        try {
            // Busca regra específica por categoria primeiro
            if (categoryId) {
                const { data, error } = await supabase
                    .from('sales_commission_rules')
                    .select('*')
                    .eq('user_id', userId)
                    .eq('clinic_id', clinicId)
                    .eq('applies_to_category', categoryId)
                    .eq('is_active', true)
                    .maybeSingle();

                if (!error && data) return data;
            }

            // Busca regra geral (sem categoria específica)
            const { data, error } = await supabase
                .from('sales_commission_rules')
                .select('*')
                .eq('user_id', userId)
                .eq('clinic_id', clinicId)
                .is('applies_to_category', null)
                .eq('is_active', true)
                .maybeSingle();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Erro ao buscar regra de comissão de venda:', error)
                ; return null;
        }
    }

    /**
     * Calcula todos os custos de um item
     */
    async calculateItemCosts(
        procedureId: string,
        price: number,
        costPerMinute: number,
        taxRate: number = 0,
        cardFeeRate: number = 0,
        salesRepId?: string,
        clinicId?: string,
        categoryId?: string
    ): Promise<ItemCosts> {
        // Buscar dados do procedimento
        const procedure = await this.getProcedureData(procedureId);
        if (!procedure) {
            return {
                timeCost: 0,
                materialCost: 0,
                labCost: 0,
                taxCost: 0,
                cardFee: 0,
                professionalCost: 0,
                salesCommissionCost: 0,
                totalCost: 0
            };
        }

        // 1. CUSTO OPERACIONAL (Tempo)
        const timeCost = (procedure.estimated_duration || 0) * costPerMinute;

        // 2. CUSTO DE MATERIAL
        const materialCost = await this.getMaterialCost(procedureId);

        // 3. CUSTO DE LABORATÓRIO
        const labCost = procedure.estimated_lab_cost || 0;

        // 4. IMPOSTOS (sobre o preço de venda)
        const taxCost = (price * taxRate) / 100;

        // 5. TAXA DE CARTÃO (sobre o preço de venda)
        const cardFee = (price * cardFeeRate) / 100;

        // 6. COMISSÃO DO PROFISSIONAL
        let professionalCost = 0;
        if (procedure.commission_type === 'FIXED_AMOUNT') {
            // Valor fixo independente do preço
            professionalCost = procedure.commission_base_value || 0;
        } else if (procedure.commission_type === 'PERCENTAGE') {
            // Percentual sobre o preço bruto (gross)
            professionalCost = (price * (procedure.commission_base_value || 0)) / 100;
        }

        // 7. COMISSÃO DE VENDA (CRC/Recepção)
        let salesCommissionCost = 0;
        if (salesRepId && clinicId) {
            const rule = await this.getSalesCommissionRule(salesRepId, clinicId, categoryId);
            if (rule && price >= rule.min_budget_value) {
                if (rule.commission_type === 'FIXED') {
                    salesCommissionCost = rule.commission_value;
                } else if (rule.commission_type === 'PERCENTAGE') {
                    salesCommissionCost = (price * rule.commission_value) / 100;
                }
            }
        }

        // CUSTO TOTAL
        const totalCost = timeCost + materialCost + labCost + taxCost + cardFee + professionalCost + salesCommissionCost;

        return {
            timeCost,
            materialCost,
            labCost,
            taxCost,
            cardFee,
            professionalCost,
            salesCommissionCost,
            totalCost
        };
    }

    /**
     * Calcula margem de um item
     */
    async calculateItemMargin(
        procedureId: string,
        price: number,
        costPerMinute: number,
        taxRate: number = 0,
        cardFeeRate: number = 0,
        salesRepId?: string,
        clinicId?: string,
        categoryId?: string
    ): Promise<ItemMargin> {
        const costs = await this.calculateItemCosts(
            procedureId,
            price,
            costPerMinute,
            taxRate,
            cardFeeRate,
            salesRepId,
            clinicId,
            categoryId
        );

        const profit = price - costs.totalCost;
        const marginPercent = price > 0 ? (profit / price) * 100 : 0;

        // Determinar status baseado na margem
        let status: 'excellent' | 'good' | 'warning' | 'danger';
        if (marginPercent >= 30) {
            status = 'excellent'; // Verde
        } else if (marginPercent >= 20) {
            status = 'good'; // Verde claro
        } else if (marginPercent >= 15) {
            status = 'warning'; // Amarelo
        } else {
            status = 'danger'; // Vermelho
        }

        return {
            price,
            costs,
            profit,
            marginPercent,
            status
        };
    }

    /**
     * Calcula margem total de um orçamento
     */
    async calculateBudgetMargin(
        items: Array<{
            procedure_id: string;
            procedure_name: string;
            unit_price: number;
            quantity: number;
        }>,
        costPerMinute: number,
        taxRate: number = 0,
        cardFeeRate: number = 0,
        salesRepId?: string,
        clinicId?: string,
        categoryId?: string
    ): Promise<BudgetMarginAnalysis> {
        let totalPrice = 0;
        let totalCosts = 0;
        const itemsAnalysis: Array<{ procedureName: string; margin: ItemMargin }> = [];
        const lowMarginItems: Array<{ procedureName: string; marginPercent: number }> = [];

        for (const item of items) {
            const itemTotal = item.unit_price * item.quantity;
            totalPrice += itemTotal;

            const margin = await this.calculateItemMargin(
                item.procedure_id,
                itemTotal,
                costPerMinute,
                taxRate,
                cardFeeRate,
                salesRepId,
                clinicId,
                categoryId
            );

            totalCosts += margin.costs.totalCost;

            itemsAnalysis.push({
                procedureName: item.procedure_name,
                margin
            });

            // Identificar itens com margem baixa (< 20%)
            if (margin.marginPercent < 20) {
                lowMarginItems.push({
                    procedureName: item.procedure_name,
                    marginPercent: margin.marginPercent
                });
            }
        }

        const totalProfit = totalPrice - totalCosts;
        const marginPercent = totalPrice > 0 ? (totalProfit / totalPrice) * 100 : 0;

        return {
            totalPrice,
            totalCosts,
            totalProfit,
            marginPercent,
            itemsAnalysis,
            lowMarginItems
        };
    }

    /**
     * Identifica itens com margem abaixo do limite
     */
    identifyLowMarginItems(
        analysis: BudgetMarginAnalysis,
        threshold: number = 20
    ): Array<{ procedureName: string; marginPercent: number }> {
        return analysis.itemsAnalysis
            .filter(item => item.margin.marginPercent < threshold)
            .map(item => ({
                procedureName: item.procedureName,
                marginPercent: item.margin.marginPercent
            }));
    }

    /**
     * Sugere preço mínimo para atingir margem desejada
     */
    async suggestMinimumPrice(
        procedureId: string,
        costPerMinute: number,
        targetMarginPercent: number = 30,
        taxRate: number = 0,
        cardFeeRate: number = 0
    ): Promise<number> {
        // Buscar custos fixos (sem comissão, pois ela depende do preço)
        const procedure = await this.getProcedureData(procedureId);
        if (!procedure) return 0;

        const timeCost = (procedure.estimated_duration || 0) * costPerMinute;
        const materialCost = await this.getMaterialCost(procedureId);
        const labCost = procedure.estimated_lab_cost || 0;

        // Custos fixos
        const fixedCosts = timeCost + materialCost + labCost;

        // Fórmula para calcular preço mínimo considerando custos variáveis (impostos, taxas, comissão)
        // price = (fixedCosts) / (1 - (taxRate + cardFeeRate + commissionRate + targetMargin) / 100)

        let commissionRate = 0;
        if (procedure.commission_type === 'PERCENTAGE') {
            commissionRate = procedure.commission_base_value || 0;
        }

        const variableRatesSum = taxRate + cardFeeRate + commissionRate + targetMarginPercent;

        if (variableRatesSum >= 100) {
            // Impossível atingir margem (custos variáveis > 100%)
            return fixedCosts * 10; // Retorna valor alto como indicativo
        }

        let suggestedPrice = fixedCosts / (1 - variableRatesSum / 100);

        // Se comissão for fixa, ajustar
        if (procedure.commission_type === 'FIXED_AMOUNT') {
            const fixedCommission = procedure.commission_base_value || 0;
            suggestedPrice = (fixedCosts + fixedCommission) / (1 - (taxRate + cardFeeRate + targetMarginPercent) / 100);
        }

        return Math.ceil(suggestedPrice); // Arredondar para cima
    }

    /**
     * Formata valor monetário
     */
    formatCurrency(value: number): string {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    }

    /**
     * Formata percentual
     */
    formatPercent(value: number): string {
        return `${value.toFixed(1)}%`;
    }
}

export const profitAnalysisService = new ProfitAnalysisService();
export default profitAnalysisService;
