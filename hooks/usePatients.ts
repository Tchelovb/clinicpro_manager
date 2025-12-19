import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { Patient } from "../types";
import { useAuth } from "../contexts/AuthContext";

export const usePatients = () => {
  const { profile } = useAuth();
  const clinicId = profile?.clinic_id;
  const queryClient = useQueryClient();

  const patientsQuery = useQuery({
    queryKey: ["patients", clinicId],
    queryFn: async () => {
      if (!clinicId) return [];

      const { data, error } = await supabase
        .from("patients")
        .select(
          `
          id,
          name,
          phone,
          email,
          cpf,
          birth_date,
          gender,
          address,
          status,
          total_approved,
          total_paid,
          balance_due,
          created_at,
          updated_at,
          clinic_id
        `
        )
        .eq("clinic_id", clinicId)
        .order("name", { ascending: true });

      if (error) {
        console.error("Erro ao buscar pacientes:", error);
        throw error;
      }

      return data as Patient[];
    },
    enabled: !!clinicId,
  });

  const createPatientMutation = useMutation({
    mutationFn: async (patient: any) => {
      const { data, error } = await supabase
        .from("patients")
        .insert([
          {
            ...patient,
            clinic_id: clinicId,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients", clinicId] });
    },
  });

  const updatePatientMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Patient>;
    }) => {
      const { data: result, error } = await supabase
        .from("patients")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients", clinicId] });
    },
  });

  return {
    patients: patientsQuery.data || [],
    isLoading: patientsQuery.isLoading,
    error: patientsQuery.error,
    createPatient: createPatientMutation.mutate,
    updatePatient: updatePatientMutation.mutate,
    isCreating: createPatientMutation.isPending,
    isUpdating: updatePatientMutation.isPending,
  };
};

export const usePatient = (id: string) => {
  const { profile } = useAuth();
  const clinicId = profile?.clinic_id;

  return useQuery({
    queryKey: ["patient", id, clinicId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select(
          `
          *,
          budgets (*),
          treatments:treatment_items (*),
          financials:financial_installments (*),
          notes:clinical_notes (*)
        `
        )
        .eq("id", id)
        .eq("clinic_id", clinicId)
        .single();

      if (error) throw error;
      return data as Patient & {
        budgets?: any[];
        treatments?: any[];
        financials?: any[];
        notes?: any[];
      };
    },
    enabled: !!id && !!clinicId,
  });
};
