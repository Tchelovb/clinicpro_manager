import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useData } from "../contexts/DataContext";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../src/lib/supabase";
import { Appointment } from "../types";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Save,
  CheckCircle,
  Clock,
  User,
  Calendar,
  XCircle,
  FileText,
  AlertTriangle,
} from "lucide-react";

// Input size optimized for mobile
const inputClass =
  "w-full bg-white text-gray-900 border border-gray-200 rounded-lg p-3 md:p-2.5 text-base md:text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all shadow-input h-12 md:h-10";
const labelClass =
  "block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide";

export const AgendaForm: React.FC = () => {
  const navigate = useNavigate();
  const { addAppointment, professionals, patients } = useData();
  const [formData, setFormData] = useState<Partial<Appointment>>({
    date: new Date().toISOString().split("T")[0],
    time: "09:00",
    type: "EVALUATION",
    status: "PENDING",
    doctorName: professionals[0]?.name,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.patientName && formData.date) {
      const patient = patients.find(
        (p) => p.name.toLowerCase() === formData.patientName?.toLowerCase()
      );
      const newApt: Appointment = {
        id: Math.random().toString(36).substr(2, 5),
        patientId: patient?.id || "lead-temp",
        patientName: formData.patientName,
        doctorName: formData.doctorName || "Dr. Logado",
        date: formData.date,
        time: formData.time || "09:00",
        type: formData.type as any,
        status: "Pendente",
      };
      addAppointment(newApt);
      navigate("/agenda");
    }
  };

  const TIME_SLOTS = Array.from(
    { length: 13 },
    (_, i) => `${String(i + 8).padStart(2, "0")}:00`
  );

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300 pb-24 md:pb-0">
      <div className="flex items-center gap-4 mb-6 pt-4 px-4 md:px-0">
        <button
          onClick={() => navigate("/agenda")}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-500 dark:text-gray-400 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          Novo Agendamento
        </h1>
      </div>
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-xl shadow-card border border-gray-200 dark:border-slate-700 space-y-6 mx-4 md:mx-0"
      >
        <div>
          <label className={labelClass}>
            <span className="flex items-center gap-2">
              <User size={16} /> Nome do Paciente
            </span>
          </label>
          <input
            className={inputClass}
            required
            value={formData.patientName || ""}
            onChange={(e) =>
              setFormData({ ...formData, patientName: e.target.value })
            }
            placeholder="Digite o nome..."
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>
              <span className="flex items-center gap-2">
                <Calendar size={16} /> Data
              </span>
            </label>
            <input
              type="date"
              className={inputClass}
              required
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
            />
          </div>
          <div>
            <label className={labelClass}>
              <span className="flex items-center gap-2">
                <Clock size={16} /> Horário
              </span>
            </label>
            <select
              className={inputClass}
              value={formData.time}
              onChange={(e) =>
                setFormData({ ...formData, time: e.target.value })
              }
            >
              {TIME_SLOTS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className={labelClass}>Profissional</label>
          <select
            className={inputClass}
            value={formData.doctorName}
            onChange={(e) =>
              setFormData({ ...formData, doctorName: e.target.value })
            }
          >
            {professionals.map((p) => (
              <option key={p.id} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Tipo de Consulta</label>
          <div className="grid grid-cols-2 md:flex gap-2">
            {[
              { value: "EVALUATION", label: "Avaliação" },
              { value: "TREATMENT", label: "Procedimento" },
              { value: "RETURN", label: "Retorno" },
              { value: "URGENCY", label: "Urgência" },
            ].map((option) => (
              <button
                type="button"
                key={option.value}
                onClick={() =>
                  setFormData({ ...formData, type: option.value as any })
                }
                className={`flex-1 py-3 md:py-2.5 text-xs font-bold rounded-lg border transition-all ${
                  formData.type === option.value
                    ? "bg-primary-50 border-primary-500 text-primary-700 shadow-sm"
                    : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Desktop Buttons */}
        <div className="hidden md:flex pt-6 justify-end gap-3 border-t border-gray-100 dark:border-slate-700">
          <button
            type="button"
            onClick={() => navigate("/agenda")}
            className="px-6 py-2.5 border border-gray-300 bg-white rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2 font-medium shadow-sm transition-transform active:scale-95"
          >
            <Save size={18} /> Agendar
          </button>
        </div>
      </form>

      {/* Mobile Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50 md:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] safe-bottom">
        <button
          onClick={handleSubmit}
          className="w-full bg-primary-600 text-white py-3 rounded-xl font-bold shadow-md flex justify-center items-center gap-2 active:scale-95 transition-transform text-base"
        >
          <Save size={20} /> Confirmar Agendamento
        </button>
      </div>
    </div>
  );
};

export const AgendaDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { appointments, updateAppointment, patients } = useData();
  const apt = appointments.find((a) => a.id === id);

  if (!apt)
    return (
      <div className="p-8 text-center text-gray-500">
        Agendamento não encontrado.
      </div>
    );

  const handleStatusChange = (status: any) => {
    updateAppointment(apt.id, { status });
    navigate("/agenda");
  };

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300 pb-20 md:pb-0">
      <div className="flex items-center gap-4 mb-6 pt-4 px-4 md:px-0">
        <button
          onClick={() => navigate("/agenda")}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-500 dark:text-gray-400 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          Detalhes
        </h1>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-card border border-gray-200 dark:border-slate-700 overflow-hidden mx-4 md:mx-0">
        <div className="p-6 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {apt.patientName}
          </h2>
          <div className="flex items-center gap-2 mt-1 text-gray-500 dark:text-gray-400 text-sm">
            <Calendar size={14} /> {new Date(apt.date).toLocaleDateString()} •{" "}
            <Clock size={14} /> {apt.time}
          </div>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">
                Profissional
              </p>
              <p className="text-gray-800 dark:text-gray-200 font-medium">
                {apt.doctorName}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">
                Tipo
              </p>
              <p className="text-gray-800 dark:text-gray-200 font-medium">
                {apt.type}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">
                Status Atual
              </p>
              <span
                className={`inline-block px-2 py-1 rounded text-xs font-bold uppercase mt-1 
                            ${
                              apt.status === "Confirmado"
                                ? "bg-green-100 text-green-700"
                                : apt.status === "Faltou"
                                ? "bg-red-100 text-red-700"
                                : apt.status === "Cancelado"
                                ? "bg-gray-100 text-gray-600"
                                : "bg-orange-100 text-orange-700"
                            }`}
              >
                {apt.status}
              </span>
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-slate-700 pt-6">
            <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-3">
              Ações
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={() => handleStatusChange("Confirmado")}
                className="flex items-center justify-center gap-2 p-3 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 font-bold text-sm transition-colors"
              >
                <CheckCircle size={18} /> Confirmar Presença
              </button>
              <button
                onClick={() => handleStatusChange("Concluído")}
                className="flex items-center justify-center gap-2 p-3 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 font-bold text-sm transition-colors"
              >
                <FileText size={18} /> Concluir Atendimento
              </button>
              <button
                onClick={() => handleStatusChange("Faltou")}
                className="flex items-center justify-center gap-2 p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 font-bold text-sm transition-colors"
              >
                <AlertTriangle size={18} /> Marcar como Falta
              </button>
              <button
                onClick={() => handleStatusChange("Cancelado")}
                className="flex items-center justify-center gap-2 p-3 bg-gray-50 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100 font-bold text-sm transition-colors"
              >
                <XCircle size={18} /> Cancelar
              </button>
            </div>
            <div className="mt-3">
              <button
                onClick={() => {
                  const p = patients.find((pat) => pat.id === apt.patientId);
                  if (p) navigate(`/patients/${p.id}`);
                }}
                className="w-full flex items-center justify-center gap-2 p-3 bg-slate-800 text-white border border-slate-800 rounded-lg hover:bg-slate-900 font-bold text-sm shadow-sm transition-colors"
              >
                <User size={18} /> Acessar Prontuário Completo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
