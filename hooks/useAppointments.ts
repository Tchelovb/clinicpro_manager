import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../src/lib/supabase";
import { useAuth } from "../contexts/AuthContext";

export interface Appointment {
    id: string;
    patient_id: string;
    professional_id: string;
    date: string;
    duration: number;
    type: string;
    status: 'PENDING' | 'CONFIRMED' | 'ARRIVED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' | 'ADMINISTRATIVE';
    notes?: string;
    patient_name?: string;
    patient_phone?: string;
    doctor_name?: string;
    doctor_color?: string;
}

export const useAppointments = (startDate?: Date, endDate?: Date, professionalId: string = 'ALL') => {
    const { profile } = useAuth();
    const clinicId = profile?.clinic_id;
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ["appointments", clinicId, startDate?.toISOString(), endDate?.toISOString(), professionalId],
        queryFn: async () => {
            if (!clinicId || !startDate || !endDate) return [];

            let query = supabase
                .from('appointments')
                .select(`
                    *,
                    patients!appointments_patient_id_fkey(name, phone),
                    professional:users!appointments_professional_id_fkey(
                        id,
                        name,
                        agenda_color,
                        photo_url,
                        specialty
                    )
                `)
                .eq('clinic_id', clinicId)
                .gte('date', startDate.toISOString())
                .lt('date', endDate.toISOString())
                .order('date');

            // ✅ Filter by professional if not 'ALL'
            if (professionalId !== 'ALL') {
                query = query.eq('professional_id', professionalId);
            }

            const { data: appts, error } = await query;
            if (error) throw error;

            // Enrichen data
            return (appts || []).map((apt: any) => ({
                ...apt,
                type: apt.type?.toUpperCase() || 'EVALUATION',
                status: apt.status?.toUpperCase() || 'PENDING',
                patient_name: apt.patients?.name || 'Paciente Sem Nome',
                patient_phone: apt.patients?.phone || '',
                doctor_name: apt.professional?.name || 'Profissional',
                doctor_color: apt.professional?.agenda_color || '#3B82F6',
                doctor_specialty: apt.professional?.specialty || ''
            })) as Appointment[];
        },
        enabled: !!clinicId && !!startDate && !!endDate,
    });

    const invalidateAppointments = () => {
        queryClient.invalidateQueries({ queryKey: ["appointments"] });
    };

    return {
        appointments: query.data || [],
        isLoading: query.isLoading,
        error: query.error,
        invalidateAppointments
    };
};

export const useAppointmentMutations = () => {
    const queryClient = useQueryClient();
    const { profile } = useAuth();
    const clinicId = profile?.clinic_id;

    const createAppointment = useMutation({
        mutationFn: async (newAppointment: any) => {
            if (!clinicId) throw new Error("Sem Clinic ID");
            const { data, error } = await supabase
                .from('appointments')
                .insert({ ...newAppointment, clinic_id: clinicId })
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onMutate: async (newAppointment) => {
            await queryClient.cancelQueries({ queryKey: ["appointments"] });
            const previousAppointments = queryClient.getQueryData(["appointments"]);

            // Optimistic Update
            queryClient.setQueriesData({ queryKey: ["appointments"] }, (old: any) => {
                const optimisticAppt = {
                    ...newAppointment,
                    id: Math.random().toString(), // Temp ID
                    status: newAppointment.status || 'PENDING',
                    type: newAppointment.type || 'EVALUATION',
                    // Mock joined fields for UI display
                    patient_name: newAppointment.patient_name || 'Novo Paciente',
                    doctor_name: 'Processando...',
                    clinic_id: clinicId
                };
                return old ? [...old, optimisticAppt] : [optimisticAppt];
            });

            return { previousAppointments };
        },
        onError: (err, newTodo, context) => {
            // Rollback
            if (context?.previousAppointments) {
                queryClient.setQueriesData({ queryKey: ["appointments"] }, context.previousAppointments);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["appointments"] });
        }
    });

    const updateAppointment = useMutation({
        mutationFn: async ({ id, ...updates }: any) => {
            const { data, error } = await supabase
                .from('appointments')
                .update(updates)
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onMutate: async ({ id, ...updates }) => {
            await queryClient.cancelQueries({ queryKey: ["appointments"] });
            const previousAppointments = queryClient.getQueryData(["appointments"]);

            // Optimistic Update
            queryClient.setQueriesData({ queryKey: ["appointments"] }, (old: any) => {
                if (!old) return [];
                return old.map((appt: any) =>
                    appt.id === id ? { ...appt, ...updates } : appt
                );
            });

            return { previousAppointments };
        },
        onError: (err, variables, context) => {
            if (context?.previousAppointments) {
                queryClient.setQueriesData({ queryKey: ["appointments"] }, context.previousAppointments);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["appointments"] });
        }
    });

    return {
        createAppointment,
        updateAppointment
    };
};

export const useAppointmentOperations = () => {
    // Deprecated wrapper - keeping for backward compatibility if needed, 
    // but prefer useAppointmentMutations
    const queryClient = useQueryClient();
    return {
        invalidateAppointments: () => queryClient.invalidateQueries({ queryKey: ["appointments"] })
    };
};
