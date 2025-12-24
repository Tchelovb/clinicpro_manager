import { supabase } from '../lib/supabase';

export interface ProcedureRecipe {
    id: string;
    procedure_id: string;
    clinic_id: string;
    created_at: string;
    updated_at: string;
}

export interface ProcedureRecipeItem {
    id: string;
    recipe_id: string;
    inventory_item_id: string;
    quantity: number;
    unit: string;
    created_at: string;
    // Dados do item de estoque (join)
    item_name?: string;
    item_cost?: number;
    item_unit?: string;
}

export interface InventoryItem {
    id: string;
    name: string;
    average_cost: number;
    unit: string;
    current_stock: number;
}

class ProcedureRecipeService {
    /**
     * Buscar receita de um procedimento
     */
    async getRecipe(procedureId: string, clinicId: string): Promise<ProcedureRecipe | null> {
        try {
            const { data, error } = await supabase
                .from('procedure_recipes')
                .select('*')
                .eq('procedure_id', procedureId)
                .eq('clinic_id', clinicId)
                .maybeSingle();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Erro ao buscar receita:', error);
            return null;
        }
    }

    /**
     * Buscar itens da receita com dados do estoque
     */
    async getRecipeItems(recipeId: string): Promise<ProcedureRecipeItem[]> {
        try {
            const { data, error } = await supabase
                .from('procedure_recipe_items')
                .select(`
                    *,
                    inventory_items:inventory_item_id (
                        name,
                        average_cost,
                        unit,
                        current_stock
                    )
                `)
                .eq('recipe_id', recipeId);

            if (error) throw error;

            // Mapear dados do join
            return (data || []).map(item => ({
                ...item,
                item_name: item.inventory_items?.name,
                item_cost: item.inventory_items?.average_cost,
                item_unit: item.inventory_items?.unit
            }));
        } catch (error) {
            console.error('Erro ao buscar itens da receita:', error);
            return [];
        }
    }

    /**
     * Buscar itens de estoque disponíveis
     */
    async getInventoryItems(clinicId: string): Promise<InventoryItem[]> {
        try {
            const { data, error } = await supabase
                .from('inventory_items')
                .select('id, name, average_cost, unit, current_stock')
                .eq('clinic_id', clinicId)
                .order('name');

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Erro ao buscar itens de estoque:', error);
            return [];
        }
    }

    /**
     * Criar ou atualizar receita completa
     */
    async saveRecipe(
        procedureId: string,
        clinicId: string,
        items: Array<{ inventory_item_id: string; quantity: number; unit: string }>
    ): Promise<boolean> {
        try {
            // 1. Buscar ou criar receita
            let recipe = await this.getRecipe(procedureId, clinicId);

            if (!recipe) {
                const { data: newRecipe, error: recipeError } = await supabase
                    .from('procedure_recipes')
                    .insert([{
                        procedure_id: procedureId,
                        clinic_id: clinicId
                    }])
                    .select()
                    .single();

                if (recipeError) throw recipeError;
                recipe = newRecipe;
            }

            if (!recipe) throw new Error('Falha ao criar receita');

            // 2. Deletar itens antigos
            const { error: deleteError } = await supabase
                .from('procedure_recipe_items')
                .delete()
                .eq('recipe_id', recipe.id);

            if (deleteError) throw deleteError;

            // 3. Inserir novos itens
            if (items.length > 0) {
                const itemsToInsert = items.map(item => ({
                    recipe_id: recipe!.id,
                    inventory_item_id: item.inventory_item_id,
                    quantity: item.quantity,
                    unit: item.unit
                }));

                const { error: insertError } = await supabase
                    .from('procedure_recipe_items')
                    .insert(itemsToInsert);

                if (insertError) throw insertError;
            }

            return true;
        } catch (error) {
            console.error('Erro ao salvar receita:', error);
            return false;
        }
    }

    /**
     * Calcular custo total do kit de materiais
     */
    calculateKitCost(items: ProcedureRecipeItem[]): number {
        return items.reduce((total, item) => {
            const itemCost = (item.item_cost || 0) * item.quantity;
            return total + itemCost;
        }, 0);
    }

    /**
     * Deletar receita completa
     */
    async deleteRecipe(recipeId: string): Promise<boolean> {
        try {
            // Deletar itens primeiro (cascade deve fazer isso, mas garantindo)
            await supabase
                .from('procedure_recipe_items')
                .delete()
                .eq('recipe_id', recipeId);

            // Deletar receita
            const { error } = await supabase
                .from('procedure_recipes')
                .delete()
                .eq('id', recipeId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Erro ao deletar receita:', error);
            return false;
        }
    }
}

export const procedureRecipeService = new ProcedureRecipeService();
export default procedureRecipeService;
