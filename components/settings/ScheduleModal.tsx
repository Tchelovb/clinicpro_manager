import React, { useState, useEffect } from "react";
import { supabase, getCurrentClinicId } from "../../lib/supabase";
import { Save, X, Loader, Clock } from "lucide-react";
import {
  getProfessionalSchedule,
  saveProfessionalSchedule,
  ProfessionalSchedule,
} from "../../src/services/schedule";

interface ScheduleModalProps {
  professionalId: string;
  professionalName: string;
  isOpen: boolean;
  onClose: () => void;
}

interface DaySchedule {
  day: string;
  label: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

const ScheduleModal: React.FC<ScheduleModalProps> = ({
  professionalId,
  professionalName,
  isOpen,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [schedules, setSchedules] = useState<DaySchedule[]>([]);

  const daysOfWeek = [
    { day: "monday", label: "Segunda-feira" },
    { day: "tuesday", label: "Terça-feira" },
    { day: "wednesday", label: "Quarta-feira" },
    { day: "thursday", label: "Quinta-feira" },
    { day: "friday", label: "Sexta-feira" },
    { day: "saturday", label: "Sábado" },
    { day: "sunday", label: "Domingo" },
  ];

  useEffect(() => {
    if (isOpen && professionalId) {
      loadSchedule();
    }
  }, [isOpen, professionalId]);

  const loadSchedule = async () => {
    try {
      setLoading(true);
      const existingSchedules = await getProfessionalSchedule(professionalId);

      // Inicializar com valores padrão para todos os dias
      const initializedSchedules: DaySchedule[] = daysOfWeek.map((dayInfo) => {
        const existing = existingSchedules.find(
          (s) => s.day_of_week === dayInfo.day
        );
        return {
          day: dayInfo.day,
          label: dayInfo.label,
          start_time: existing?.start_time || "08:00",
          end_time: existing?.end_time || "18:00",
          is_active: existing?.is_active ?? false,
        };
      });

      setSchedules(initializedSchedules);
    } catch (error) {
      console.error("Erro ao carregar agenda:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateSchedule = (
    day: string,
    field: keyof DaySchedule,
    value: any
  ) => {
    setSchedules((prev) =>
      prev.map((schedule) =>
        schedule.day === day ? { ...schedule, [field]: value } : schedule
      )
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const clinicId = await getCurrentClinicId();
      if (!clinicId) throw new Error("Clínica não encontrada");

      const scheduleData: ProfessionalSchedule[] = schedules.map(
        (schedule) => ({
          professional_id: professionalId,
          clinic_id: clinicId,
          day_of_week: schedule.day,
          start_time: schedule.start_time,
          end_time: schedule.end_time,
          is_active: schedule.is_active,
        })
      );

      await saveProfessionalSchedule(scheduleData);
      onClose();
    } catch (error) {
      console.error("Erro ao salvar agenda:", error);
      alert("Erro ao salvar agenda. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Clock size={24} className="text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Agenda de {professionalName}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Configure os horários de trabalho individuais
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader className="animate-spin" size={24} />
              <span className="ml-2">Carregando agenda...</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Nota:</strong> Quando um horário específico é definido
                  para um dia, ele sobrescreve a agenda geral da clínica para
                  este profissional.
                </p>
              </div>

              {schedules.map((schedule) => (
                <div
                  key={schedule.day}
                  className="border border-gray-200 dark:border-gray-600 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={schedule.is_active}
                        onChange={(e) =>
                          updateSchedule(
                            schedule.day,
                            "is_active",
                            e.target.checked
                          )
                        }
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {schedule.label}
                      </span>
                    </label>
                  </div>

                  {schedule.is_active && (
                    <div className="grid grid-cols-2 gap-4 ml-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Horário de Início
                        </label>
                        <input
                          type="time"
                          value={schedule.start_time}
                          onChange={(e) =>
                            updateSchedule(
                              schedule.day,
                              "start_time",
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Horário de Fim
                        </label>
                        <input
                          type="time"
                          value={schedule.end_time}
                          onChange={(e) =>
                            updateSchedule(
                              schedule.day,
                              "end_time",
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? (
              <Loader className="animate-spin" size={16} />
            ) : (
              <Save size={16} />
            )}
            {saving ? "Salvando..." : "Salvar Agenda"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleModal;
