import { useQuery } from "@tanstack/react-query";
import { supabase } from "../src/lib/supabase";
import { useAuth } from "../contexts/AuthContext";

export interface ProcedureWithCost {
    id: string;
    name: string;
    category: string;
    base_price: number;
    price: number; // Adapter for legacy components using 'price'
    duration: number;
    cost?: {
        total_cost: number;
        material_cost: number;
        professional_cost: number;
        operational_overhead: number;
    };
    margin_percent?: number;
    margin_value?: number;
}

export const useProcedures = () => {
    const { profile } = useAuth();
    const clinicId = profile?.clinic_id;

    const query = useQuery({
        queryKey: ["procedures_with_costs", clinicId],
        queryFn: async () => {
            if (!clinicId) return [];

            const { data, error } = await supabase
                .from('procedure')
                .select(`
            *,
            procedure_costs (
                total_cost,
                material_cost,
                professional_cost,
                operational_overhead
            )
        `)
                .eq('clinic_id', clinicId)
                .order('name');

            if (error) throw error;

            return data.map((p: any) => {
                // Supabase returns relationship as array for One-to-Many or One-to-One without explicit hint
                // procedure_costs has UNIQUE(procedure_id), so it should be effectively 1:1, but probably returned as array
                const costData = Array.isArray(p.procedure_costs) ? p.procedure_costs[0] : p.procedure_costs;

                const totalCost = costData?.total_cost || 0;
                const basePrice = p.base_price || 0;
                const marginValue = basePrice - totalCost;
                const marginPercent = basePrice > 0 ? (marginValue / basePrice) * 100 : 0;

                return {
                    ...p,
                    price: basePrice, // Map base_price to price for compatibility
                    cost: costData,
                    margin_value: marginValue,
                    margin_percent: marginPercent
                };
            }) as ProcedureWithCost[];
        },
        enabled: !!clinicId
    });

    return {
        procedures: query.data || [],
        isLoading: query.isLoading,
        error: query.error
    };
}
