import { supabase } from '../src/lib/supabase';

export interface ProfessionalSchedule {
  id?: string;
  professional_id: string;
  clinic_id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

/**
 * Busca todos os horários de trabalho de um profissional
 */
export const getProfessionalSchedule = async (
  professionalId: string
): Promise<ProfessionalSchedule[]> => {
  try {
    const { data, error } = await supabase
      .from("professional_schedules")
      .select("*")
      .eq("professional_id", professionalId)
      .order("day_of_week");

    if (error) {
      console.error("Erro ao buscar agenda profissional:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Erro ao buscar agenda profissional:", error);
    return [];
  }
};

/**
 * Salva ou atualiza os horários de um profissional
 */
export const saveProfessionalSchedule = async (
  scheduleData: ProfessionalSchedule[]
): Promise<void> => {
  try {
    if (scheduleData.length === 0) return;

    const professionalId = scheduleData[0].professional_id;

    // Primeiro, deletar todos os horários existentes para este profissional
    const { error: deleteError } = await supabase
      .from("professional_schedules")
      .delete()
      .eq("professional_id", professionalId);

    if (deleteError) {
      console.error("Erro ao deletar horários existentes:", deleteError);
      throw deleteError;
    }

    // Filtrar apenas os horários ativos para inserir
    const activeSchedules = scheduleData.filter(
      (schedule) => schedule.is_active
    );

    if (activeSchedules.length > 0) {
      const { error: insertError } = await supabase
        .from("professional_schedules")
        .insert(activeSchedules);

      if (insertError) {
        console.error("Erro ao inserir novos horários:", insertError);
        throw insertError;
      }
    }
  } catch (error) {
    console.error("Erro ao salvar agenda profissional:", error);
    throw error;
  }
};
