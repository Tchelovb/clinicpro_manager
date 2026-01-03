import { useQuery } from "@tanstack/react-query";
import { supabase } from "../src/lib/supabase";
import { useAuth } from "../contexts/AuthContext";

export interface DashboardAppointment {
  id: string;
  date: string;
  time: string;
  patientName: string;
  doctorName: string;
  type: string;
  status: string;
  duration: number;
  notes: string;
}

export interface DashboardLead {
  id: string;
  name: string;
  phone: string;
  email: string;
  source: string;
  status: string;
  interest: string;
  value: number;
  createdAt: string;
  lastInteraction: string;
  leadInteractions: any[];
  leadTasks: any[];
}

export const useDashboardData = ({ enabled = true }: { enabled?: boolean } = {}) => {
  const { profile } = useAuth();
  const clinicId = profile?.clinic_id;

  // Query para agendamentos de hoje
  const appointmentsQuery = useQuery({
    queryKey: ["dashboard-appointments", clinicId],
    queryFn: async (): Promise<DashboardAppointment[]> => {
      if (!clinicId) return [];

      const today = new Date().toISOString().split("T")[0];

      const { data: appointmentsData, error: appointmentsError } =
        await supabase
          .from("appointments")
          .select(
            `
          id,
          date,

          duration,
          type,
          status,
          notes,
          patient_id,
          doctor_id
        `
          )
          .eq("clinic_id", clinicId)
          .gte("date", `${today}T00:00:00`)
          .lte("date", `${today}T23:59:59`)
          .order("date");

      if (appointmentsError) throw appointmentsError;
      if (!appointmentsData || appointmentsData.length === 0) return [];

      // Buscar nomes de pacientes e doutores
      const patientIds = appointmentsData
        .map((apt) => apt.patient_id)
        .filter(Boolean);
      const doctorIds = appointmentsData
        .map((apt) => apt.doctor_id)
        .filter(Boolean);

      const [patientsData, doctorsData] = await Promise.all([
        patientIds.length > 0
          ? supabase.from("patients").select("id, name").in("id", patientIds)
          : Promise.resolve({ data: [] }),
        doctorIds.length > 0
          ? supabase.from("users").select("id, name").in("id", doctorIds)
          : Promise.resolve({ data: [] }),
      ]);

      const patientsMap = (patientsData.data || []).reduce(
        (acc: any, p: any) => {
          acc[p.id] = p.name;
          return acc;
        },
        {}
      );

      const doctorsMap = (doctorsData.data || []).reduce((acc: any, d: any) => {
        acc[d.id] = d.name;
        return acc;
      }, {});

      return appointmentsData.map((apt: any) => ({
        id: apt.id,
        date: apt.date,
        time: new Date(apt.date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        patientName: patientsMap[apt.patient_id] || "Paciente não encontrado",
        doctorName: doctorsMap[apt.doctor_id] || "Dr. não encontrado",
        type: apt.type,
        status:
          apt.status === "PENDING"
            ? "Pendente"
            : apt.status === "CONFIRMED"
              ? "Confirmado"
              : apt.status === "COMPLETED"
                ? "Concluído"
                : apt.status === "MISSED"
                  ? "Faltou"
                  : "Cancelado",
        duration: apt.duration,
        notes: apt.notes,
      }));
    },
    enabled: enabled && !!clinicId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 2,
  });

  // Query para leads/oportunidades
  const leadsQuery = useQuery({
    queryKey: ["dashboard-leads", clinicId],
    queryFn: async (): Promise<DashboardLead[]> => {
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
        .eq("clinic_id", clinicId)
        .order("last_interaction", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    enabled: enabled && !!clinicId,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  // REMOVED REDUNDANT PATIENTS QUERY
  // DataContext already fetches patients. Dashboard should use DataContext or lean on KPIs.

  // Query para novos pacientes deste mês (KPI)
  const newPatientsQuery = useQuery({
    queryKey: ["dashboard-new-patients", clinicId],
    queryFn: async () => {
      if (!clinicId) return 0;
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const { count, error } = await supabase
        .from("patients")
        .select('*', { count: 'exact', head: true })
        .eq("clinic_id", clinicId)
        .gte("created_at", startOfMonth);

      if (error) throw error;
      return count || 0;
    },
    enabled: enabled && !!clinicId,
    staleTime: 5 * 60 * 1000,
  });

  // Calcular KPIs
  const appointments = appointmentsQuery.data || [];
  const leads = leadsQuery.data || [];
  // Use patients from DataContext if needed, but for dashboard KPI we use atomic counts or just remove dependency
  // const patients = patientsQuery.data || []; // REMOVED to save bandwidth
  const newPatientsCount = newPatientsQuery.data || 0;

  const kpis = {
    appointments: appointments.length,
    confirmed: appointments.filter(
      (a) => a.status === "Confirmado" || a.status === "Concluído"
    ).length,
    pendingLeads: leads.filter(
      (l) =>
        l.status === "NEW" ||
        l.status === "CONTACT" ||
        l.status === "NEGOTIATION"
    ).length,
    newPatients: newPatientsCount
  };

  // Calcular lembretes baseados nos dados
  const reminders = [];
  const pendingConf = appointments.filter((a) => a.status === "Pendente");
  if (pendingConf.length > 0) {
    reminders.push({
      id: "task-confirm",
      type: "urgent",
      title: "Confirmar Agendamentos",
      desc: `${pendingConf.length} pacientes pendentes para hoje.`,
      actionLabel: "Iniciar Confirmações",
      iconName: "Phone",
      color: "orange",
      actionPath: "/agenda",
    });
  }

  return {
    // Dados
    appointments,
    leads: leads.slice(0, 5), // Limitar a 5 para o dashboard
    patients: [], // Removed redundant fetch
    kpis,
    reminders,

    // Estados de loading
    isLoadingAppointments: appointmentsQuery.isLoading,
    isLoadingLeads: leadsQuery.isLoading,
    isLoadingPatients: false, // redundancy removed
    isLoading:
      appointmentsQuery.isLoading ||
      leadsQuery.isLoading,

    // Estados de erro
    appointmentsError: appointmentsQuery.error,
    leadsError: leadsQuery.error,
    patientsError: null,
    hasError: !!(
      appointmentsQuery.error ||
      leadsQuery.error
    ),

    // Utilitários
    refetch: () => {
      appointmentsQuery.refetch();
      leadsQuery.refetch();
    },
  };
};
