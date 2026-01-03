import { supabase } from "../src/lib/supabase";

export const fetchBudgetById = async (id: string) => {
    const { data, error } = await supabase
        .from('budgets')
        .select(`*, items:budget_items(*)`)
        .eq('id', id)
        .single();

    if (error) throw error;
    return data;
};
