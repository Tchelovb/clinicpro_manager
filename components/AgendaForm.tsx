import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useData } from "../contexts/DataContext";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { Appointment } from "../types";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Save,
  User,
  Calendar,
  Clock,
  CheckCircle,
} from "lucide-react";

export const AgendaForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { professionals, patients, refreshData } = useData();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);

  // Captura a data selecionada na agenda através da URL (Ex: ?date=2025-12-30)
  const queryParams = new URLSearchParams(location.search);
  const selectedDate =
    queryParams.get("date") || new Date().toISOString().split("T")[0];

  const [formData, setFormData] = useState<Partial<Appointment>>({
    date: selectedDate,
    time: "09:00",
    type: "EVALUATION" as any,
    status: "PENDING" as any,
    doctor_id: profile?.id || professionals[0]?.id || "",
    patientName: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.patientName || !profile?.clinic_id) {
      toast.error("Por favor, selecione um paciente.");
      return;
    }

    setLoading(true);
    try {
      // Busca o ID do paciente pelo nome selecionado
      const patient = patients.find(
        (p) => p.name.toLowerCase() === formData.patientName?.toLowerCase()
      );

      const newApt = {
        clinic_id: profile.clinic_id,
        patient_id: patient?.id || null,
        doctor_id: formData.doctor_id || profile.id,
        date: `${formData.date}T${formData.time}:00Z`,
        duration: 60,
        type: formData.type,
        status: "Pendente",
        notes: `Agendado via Painel Dr. Marcelo`,
      };

      const { error } = await supabase.from("appointments").insert([newApt]);

      if (error) throw error;

      toast.success("Agendamento realizado com sucesso!");
      await refreshData(); // Atualiza o Dashboard e a Grade
      navigate("/agenda");
    } catch (err: any) {
      console.error("Erro ao salvar:", err);
      toast.error("Erro ao salvar agendamento.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:pt-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate("/agenda")}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-500 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          Novo Agendamento
        </h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 space-y-6"
      >
        {/* Paciente */}
        <div>
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
            Nome do Paciente
          </label>
          <input
            className="w-full bg-white dark:bg-slate-900 text-gray-900 dark:text-white border border-gray-200 dark:border-slate-600 rounded-lg p-3 outline-none focus:ring-2 focus:ring-primary-500"
            required
            list="patients-list"
            value={formData.patientName}
            onChange={(e) =>
              setFormData({ ...formData, patientName: e.target.value })
            }
            placeholder="Digite ou selecione o paciente..."
          />
          <datalist id="patients-list">
            {patients.map((p) => (
              <option key={p.id} value={p.name} />
            ))}
          </datalist>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Data */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
              Data
            </label>
            <input
              type="date"
              className="w-full border border-gray-200 rounded-lg p-3 dark:bg-slate-900 dark:text-white"
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
            />
          </div>
          {/* Horário */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
              Horário
            </label>
            <input
              type="time"
              className="w-full border border-gray-200 rounded-lg p-3 dark:bg-slate-900 dark:text-white"
              value={formData.time}
              onChange={(e) =>
                setFormData({ ...formData, time: e.target.value })
              }
            />
          </div>
        </div>

        {/* Tipo de Consulta - 4 Pilares */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
            Tipo de Procedimento
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { value: "EVALUATION", label: "Avaliação" },
              { value: "TREATMENT", label: "Procedimento" },
              { value: "RETURN", label: "Retorno" },
              { value: "URGENCY", label: "Urgência" },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  setFormData({ ...formData, type: option.value as any })
                }
                className={`py-3 text-xs font-bold rounded-lg border transition-all ${
                  formData.type === option.value
                    ? "bg-primary-600 border-primary-600 text-white shadow-md"
                    : "bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-600 text-gray-500 hover:bg-gray-50"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Botão de Ação */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white py-4 rounded-xl font-bold shadow-lg flex justify-center items-center gap-2 transition-transform active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              "Salvando..."
            ) : (
              <>
                <Save size={20} /> Confirmar Agendamento
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

// Export default para evitar erro de importação no App.tsx
export default AgendaForm;
