import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { Lead } from "../types";
import { useAuth } from "../contexts/AuthContext";

export const useLeads = () => {
  const { profile } = useAuth();
  const clinicId = profile?.clinic_id;
  const queryClient = useQueryClient();

  const leadsQuery = useQuery({
    queryKey: ["leads", clinicId],
    queryFn: async () => {
      if (!clinicId) return [];

      const { data, error } = await supabase
        .from("leads")
        .select(
          `
          *,
          lead_interactions (*),
          lead_tasks (*)
        `
        )
        .order("last_interaction", { ascending: false });

      if (error) throw error;
      return data as Lead[];
    },
    enabled: !!clinicId,
  });

  const createLeadMutation = useMutation({
    mutationFn: async (
      lead: Omit<Lead, "id" | "created_at" | "last_interaction">
    ) => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("leads")
        .insert([
          {
            ...lead,
            clinic_id: clinicId,
            created_at: now,
            last_interaction: now,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads", clinicId] });
    },
  });

  const updateLeadMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Lead> }) => {
      const { data: result, error } = await supabase
        .from("leads")
        .update({
          ...data,
          last_interaction: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads", clinicId] });
    },
  });

  return {
    leads: leadsQuery.data || [],
    isLoading: leadsQuery.isLoading,
    error: leadsQuery.error,
    createLead: createLeadMutation.mutate,
    updateLead: updateLeadMutation.mutate,
    isCreating: createLeadMutation.isPending,
    isUpdating: updateLeadMutation.isPending,
  };
};

export const useLead = (id: string) => {
  const { profile } = useAuth();
  const clinicId = profile?.clinic_id;

  return useQuery({
    queryKey: ["lead", id, clinicId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select(
          `
          *,
          lead_interactions (*),
          lead_tasks (*)
        `
        )
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Lead;
    },
    enabled: !!id && !!clinicId,
  });
};
