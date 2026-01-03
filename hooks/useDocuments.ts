import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../src/lib/supabase";
import { useAuth } from "../contexts/AuthContext";

export type PrintStatus = 'PENDING' | 'PRINTED' | 'SIGNED' | 'ARCHIVED';

export const useDocuments = (statusFilter?: PrintStatus) => {
    const { profile } = useAuth();
    const clinicId = profile?.clinic_id;
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ["documents", clinicId, statusFilter],
        queryFn: async () => {
            if (!clinicId) return [];

            let q = supabase
                .from('patient_documents')
                .select(`
            *,
            patient:patients (name, cpf)
        `)
                .eq('clinic_id', clinicId)
                .order('created_at', { ascending: false });

            if (statusFilter) {
                q = q.eq('print_status', statusFilter);
            }

            const { data, error } = await q;
            if (error) throw error;
            return data;
        },
        enabled: !!clinicId
    });

    const updateStatus = useMutation({
        mutationFn: async ({ id, status }: { id: string, status: PrintStatus }) => {
            const { error } = await supabase
                .from('patient_documents')
                .update({ print_status: status })
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["documents"] });
        }
    });

    const deleteDocument = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('patient_documents').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["documents"] });
        }
    })

    return {
        documents: query.data || [],
        isLoading: query.isLoading,
        updateStatus: updateStatus.mutate,
        deleteDocument: deleteDocument.mutate
    };
};
