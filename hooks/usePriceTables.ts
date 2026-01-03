import { useQuery } from "@tanstack/react-query";
import { supabase } from "../src/lib/supabase";
import { useAuth } from "../contexts/AuthContext";

export const usePriceTables = () => {
    const { profile } = useAuth();
    const clinicId = profile?.clinic_id;

    const query = useQuery({
        queryKey: ["price_tables", clinicId],
        queryFn: async () => {
            if (!clinicId) return [];

            // Fetch tables
            const { data: tables, error: tableError } = await supabase
                .from("price_tables")
                .select("*")
                .eq("clinic_id", clinicId)
                .eq("active", true);

            if (tableError) throw tableError;

            // Fetch items for all active tables
            const { data: items, error: itemsError } = await supabase
                .from("price_table_items")
                .select("*, procedure (name)") // Fetch procedure name for fallback matching
                .in("price_table_id", tables.map(t => t.id));

            if (itemsError) throw itemsError;

            // Attach items to tables
            return tables.map(table => ({
                ...table,
                items: items.filter(i => i.price_table_id === table.id).map((i: any) => ({
                    ...i,
                    procedureName: i.procedure?.name // Helper
                }))
            }));
        },
        enabled: !!clinicId,
    });

    return {
        priceTables: query.data || [],
        isLoading: query.isLoading,
    };
};
