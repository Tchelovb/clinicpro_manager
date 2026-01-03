import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../src/lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import toast from 'react-hot-toast';

export interface Installment {
    id: string;
    patient_id: string;
    patient_name?: string;
    installment_number: number;
    total_installments: number;
    amount: number;
    due_date: string;
    paid_date?: string;
    status: 'PENDING' | 'PAID' | 'OVERDUE' | 'PARTIAL';
    payment_method?: string;
    notes?: string;
}

export const useInstallments = () => {
    const { profile } = useAuth();
    const queryClient = useQueryClient();
    const clinicId = profile?.clinic_id;

    const query = useQuery({
        queryKey: ["financial", "installments", clinicId],
        queryFn: async () => {
            if (!clinicId) return [];

            const { data, error } = await supabase
                .from('installments')
                .select(`
                    *,
                    patients ( name )
                `)
                .eq('clinic_id', clinicId)
                .order('due_date', { ascending: true })
                .limit(200);

            if (error) throw error;

            return data?.map((i: any) => ({
                ...i,
                patient_name: i.patients?.name
            })) as Installment[];
        },
        enabled: !!clinicId,
        staleTime: 1000 * 60 * 5 // 5 min cache
    });

    const receivePayment = useMutation({
        mutationFn: async ({ id, paidDate }: { id: string, paidDate: string }) => {
            const { error } = await supabase
                .from('installments')
                .update({
                    status: 'PAID',
                    paid_date: paidDate
                })
                .eq('id', id);

            if (error) throw error;
        },
        onMutate: async ({ id, paidDate }) => {
            await queryClient.cancelQueries({ queryKey: ["financial", "installments", clinicId] });
            const previousData = queryClient.getQueryData(["financial", "installments", clinicId]);

            queryClient.setQueriesData({ queryKey: ["financial", "installments", clinicId] }, (old: any) => {
                if (!old) return [];
                return old.map((i: Installment) =>
                    i.id === id ? { ...i, status: 'PAID', paid_date: paidDate } : i
                );
            });

            return { previousData };
        },
        onError: (err, newVar, context) => {
            if (context?.previousData) {
                queryClient.setQueriesData({ queryKey: ["financial", "installments", clinicId] }, context.previousData);
            }
            toast.error("Erro ao receber pagamento");
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["financial", "installments", clinicId] });
        }
    });

    return {
        installments: query.data || [],
        isLoading: query.isLoading,
        summary: calculateSummary(query.data || []),
        receivePayment: receivePayment.mutate
    };
};

function calculateSummary(installments: Installment[]) {
    const today = new Date().toISOString().split('T')[0];
    const pending = installments.filter(i => i.status === 'PENDING' && i.due_date >= today);
    const overdue = installments.filter(i => i.status === 'PENDING' && i.due_date < today);
    const paid = installments.filter(i => i.status === 'PAID');

    return {
        totalPending: pending.reduce((sum, i) => sum + i.amount, 0),
        countPending: pending.length,
        totalOverdue: overdue.reduce((sum, i) => sum + i.amount, 0),
        countOverdue: overdue.length,
        totalPaid: paid.reduce((sum, i) => sum + i.amount, 0),
        countPaid: paid.length
    };
}
