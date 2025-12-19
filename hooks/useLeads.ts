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

      return data.map((d: any) => ({
        ...d,
        createdAt: d.created_at,
        lastInteraction: d.last_interaction,
        budgetId: d.budget_id,
        history: d.lead_interactions || [],
        tasks: d.lead_tasks || []
      })) as Lead[];
    },
    enabled: !!clinicId,
  });

  const createLeadMutation = useMutation({
    mutationFn: async (
      lead: Omit<Lead, "id" | "createdAt" | "lastInteraction" | "history" | "tasks">
    ) => {
      const now = new Date().toISOString();

      // Map back to DB Columns
      const dbLead = {
        clinic_id: clinicId,
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        source: lead.source,
        status: lead.status,
        interest: lead.interest,
        value: lead.value,
        budget_id: lead.budgetId,
        created_at: now,
        last_interaction: now
      };

      const { data, error } = await supabase
        .from("leads")
        .insert([dbLead])
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
      // Map partial updates to DB columns
      const dbUpdates: any = { ...data };
      if (data.lastInteraction) dbUpdates.last_interaction = data.lastInteraction;
      if (data.budgetId) dbUpdates.budget_id = data.budgetId;
      if (data.createdAt) dbUpdates.created_at = data.createdAt;

      // Clean up interface fields that don't exist in DB
      delete dbUpdates.lastInteraction;
      delete dbUpdates.budgetId;
      delete dbUpdates.createdAt;
      delete dbUpdates.history; // History updated via interactions table usually
      delete dbUpdates.tasks;

      // Ensure last_interaction is updated on any change
      dbUpdates.last_interaction = new Date().toISOString();

      const { data: result, error } = await supabase
        .from("leads")
        .update(dbUpdates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads", clinicId] });
      queryClient.invalidateQueries({ queryKey: ["lead"] }); // Invalidate detail too
    },
  });

  const addInteractionMutation = useMutation({
    mutationFn: async ({ leadId, type, content }: { leadId: string; type: string; content: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase.from('lead_interactions').insert({
        lead_id: leadId,
        user_id: user.id,
        type,
        content
      });

      if (error) throw error;

      // Update lead's last_interaction timestamp
      await supabase
        .from('leads')
        .update({ last_interaction: new Date().toISOString() })
        .eq('id', leadId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["leads", clinicId] });
      queryClient.invalidateQueries({ queryKey: ["lead", variables.leadId] });
    },
  });

  return {
    leads: leadsQuery.data || [],
    isLoading: leadsQuery.isLoading,
    error: leadsQuery.error,
    createLead: createLeadMutation.mutate,
    updateLead: updateLeadMutation.mutate,
    addInteraction: addInteractionMutation.mutate,
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

      return {
        ...data,
        createdAt: data.created_at,
        lastInteraction: data.last_interaction,
        budgetId: data.budget_id,
        history: (data.lead_interactions || []).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
        tasks: data.lead_tasks || []
      } as Lead;
    },
    enabled: !!id && !!clinicId,
  });
};
