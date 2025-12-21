import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

export const useUnapprovedBudgets = () => {
    const { profile } = useAuth();
    const clinicId = profile?.clinic_id;

    const query = useQuery({
        queryKey: ["unapproved_budgets", clinicId],
        queryFn: async () => {
            if (!clinicId) return [];

            // 1. Fetch Budgets (Raw)
            const { data: budgets, error: budgetError } = await supabase
                .from("budgets")
                .select('id, status, total_value, final_value, patient_id, created_at, clinic_id')
                .order('created_at', { ascending: false });

            // Client-side filter for the current clinic
            const filteredBudgets = (budgets || []).filter((b: any) => b.clinic_id === clinicId);

            // 2. Fetch Associated Patients manually to avoid FK errors
            const patientIds = Array.from(new Set(filteredBudgets.map((b: any) => b.patient_id).filter(Boolean)));

            if (budgetError) throw budgetError;
            if (!budgets || budgets.length === 0) return [];



            let patientsMap: Record<string, any> = {};

            if (patientIds.length > 0) {
                const { data: patients, error: patientsError } = await supabase
                    .from('patients')
                    .select('id, name, phone')
                    .in('id', patientIds);

                if (!patientsError && patients) {
                    patients.forEach((p: any) => {
                        patientsMap[p.id] = p;
                    });
                }
            }

            // 3. Merge Data and filter by status
            const allowedStatuses = ['Em Análise', 'Enviado', 'Em Negociação', 'DRAFT'];
            return filteredBudgets
                .filter((b: any) => allowedStatuses.includes(b.status))
                .map((b: any) => {
                    const patient = patientsMap[b.patient_id];
                    return {
                        ...b,
                        patientName: patient?.name || 'Paciente Desconhecido',
                        patientPhone: patient?.phone,
                        patientId: b.patient_id
                    };
                });
        },
        enabled: !!clinicId,
    });

    return {
        budgets: query.data || [],
        isLoading: query.isLoading,
        error: query.error
    };
};

export const useBudget = (id?: string) => {
    const { profile } = useAuth();
    const clinicId = profile?.clinic_id;

    return useQuery({
        queryKey: ["budget", id],
        queryFn: async () => {
            if (!id) return null;
            const { data, error } = await supabase
                .from('budgets')
                .select(`*, items:budget_items(*)`)
                .eq('id', id)
                .single();
            if (error) throw error;
            return data;
        },
        enabled: !!id && !!clinicId
    });
}

export const useBudgetOperations = () => {
    const { profile } = useAuth();
    const queryClient = useQueryClient();
    const clinicId = profile?.clinic_id;

    const createBudget = useMutation({
        mutationFn: async ({ patientId, data }: { patientId: string, data: any }) => {
            console.log('🔵 Creating budget with data:', { patientId, clinicId, data });

            // 1. Create Budget with minimal required fields first
            const budgetPayload: any = {
                patient_id: patientId,
                clinic_id: clinicId,
                status: 'DRAFT',
                total_value: data.totalValue || 0,
                final_value: data.finalValue || 0,
                discount: data.discount || 0
            };

            // Add optional fields only if they exist
            // doctor_id MUST be a valid ID from the users table (NOT professionals table)
            console.log('🔍 Checking doctor_id (User ID required)...', {
                providedId: data.doctorId,
                profileProfessionalId: profile?.professional_id,
                profileId: profile?.id
            });

            let userIdToSave = null;

            // CASO 1: Foi passado um ID (provavelmente ID de Profissional, precisamos achar o User correspondente)
            if (data.doctorId) {
                // Tenta achar um usuário que tenha esse professional_id
                const { data: userByProf, error: userProfError } = await supabase
                    .from('users')
                    .select('id')
                    .eq('professional_id', data.doctorId)
                    .single();

                if (userByProf) {
                    console.log('✅ Found User ID via Professional ID:', userByProf.id);
                    userIdToSave = userByProf.id;
                } else {
                    // Talvez o ID passado JÁ SEJA um ID de usuário? (Fallback)
                    const { data: userdById, error: userIdError } = await supabase
                        .from('users')
                        .select('id')
                        .eq('id', data.doctorId)
                        .single();

                    if (userdById) {
                        console.log('✅ The provided ID was already a User ID:', userdById.id);
                        userIdToSave = userdById.id;
                    }
                }
            }

            // CASO 2: Se não achou ainda, tenta pelo usuário logado
            if (!userIdToSave && profile?.email) {
                console.log('🔍 Fallback: Searching for current user by email:', profile.email);
                const { data: userData, error: userError } = await supabase
                    .from('users')
                    .select('id')
                    .eq('email', profile.email)
                    .single();

                if (userData) {
                    userIdToSave = userData.id;
                    console.log('✅ Used current logged user ID:', userData.id);
                }
            }

            if (userIdToSave) {
                budgetPayload.doctor_id = userIdToSave;
            } else {
                console.error('❌ CRITICAL: Could not resolve a valid User ID for doctor_id field');
                throw new Error('Erro: Não foi possível vincular um Usuário válido a este Profissional. Verifique o cadastro do profissional em Configurações > Usuários.');
            }

            if (data.priceTableId) budgetPayload.price_table_id = data.priceTableId;
            if (data.paymentConfig) budgetPayload.payment_config = data.paymentConfig;

            console.log('🔵 Final payload:', budgetPayload);

            const { data: budget, error: budgetError } = await supabase
                .from('budgets')
                .insert(budgetPayload)
                .select()
                .single();

            if (budgetError) {
                console.error('❌ Budget creation error:', budgetError);
                throw budgetError;
            }

            console.log('✅ Budget created:', budget);

            // 2. Create Items
            if (data.items && data.items.length > 0) {
                const itemsPayload = data.items.map((item: any) => ({
                    budget_id: budget.id,
                    procedure_name: item.procedure,
                    // procedure_id: we need to find this if possible, but form sends name
                    region: item.region,
                    quantity: item.quantity,
                    unit_value: item.unitValue,
                    total_value: item.total
                }));

                const { error: itemsError } = await supabase
                    .from('budget_items')
                    .insert(itemsPayload);

                if (itemsError) throw itemsError;
            }

            return budget;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["unapproved_budgets"] });
            queryClient.invalidateQueries({ queryKey: ["patients"] }); // To refresh patient budget list
        }
    });

    const updateBudget = useMutation({
        mutationFn: async ({ budgetId, data }: { budgetId: string, data: any }) => {
            // Update Budget Header
            const { error: budgetError } = await supabase
                .from('budgets')
                .update({
                    doctor_id: data.doctorId,
                    price_table_id: data.priceTableId,
                    total_value: data.totalValue,
                    discount: data.discount,
                    final_value: data.finalValue,
                    payment_config: data.paymentConfig,
                    updated_at: new Date().toISOString()
                })
                .eq('id', budgetId);

            if (budgetError) throw budgetError;

            // Replace Items (Delete All + Insert New) - Simple approach
            await supabase.from('budget_items').delete().eq('budget_id', budgetId);

            if (data.items && data.items.length > 0) {
                const itemsPayload = data.items.map((item: any) => ({
                    budget_id: budgetId,
                    procedure_name: item.procedure,
                    region: item.region,
                    quantity: item.quantity,
                    unit_value: item.unitValue,
                    total_value: item.total
                }));

                await supabase.from('budget_items').insert(itemsPayload);
            }
        },
        onSuccess: (_, vars) => {
            queryClient.invalidateQueries({ queryKey: ["budget", vars.budgetId] });
            queryClient.invalidateQueries({ queryKey: ["unapproved_budgets"] });
        }
    });

    const approveBudget = useMutation({
        mutationFn: async ({ budgetId, patientId }: { budgetId: string, patientId: string }) => {
            // 1. Update Status
            const { error } = await supabase.from('budgets').update({ status: 'Aprovado' }).eq('id', budgetId);
            if (error) throw error;

            // NOTE: Future implementation should generate treatments and installments here.
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["unapproved_budgets"] });
            queryClient.invalidateQueries({ queryKey: ["patient", variables.patientId] });
            queryClient.invalidateQueries({ queryKey: ["patient"] });
        }
    });

    return {
        createBudget: createBudget.mutate,
        updateBudget: updateBudget.mutate,
        approveBudget: approveBudget.mutate,
        isCreating: createBudget.isPending,
        isUpdating: updateBudget.isPending
    }
}
