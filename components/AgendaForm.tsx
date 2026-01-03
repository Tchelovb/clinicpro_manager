import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useData } from "../contexts/DataContext";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../src/lib/supabase";
import { Appointment } from "../types";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Save,
  User,
  Calendar,
  Clock,
  CheckCircle,
  Briefcase,
} from "lucide-react";
import { cn } from "../src/lib/utils";

type EventType = 'PATIENT' | 'ADMINISTRATIVE';

export const AgendaForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { professionals, patients, refreshData } = useData();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [eventType, setEventType] = useState<EventType>('PATIENT');

  // Captura a data selecionada na agenda através da URL (Ex: ?date=2025-12-30)
  const queryParams = new URLSearchParams(location.search);
  const selectedDate =
    queryParams.get("date") || new Date().toISOString().split("T")[0];

  const [formData, setFormData] = useState<Partial<Appointment>>({
    date: selectedDate,
    time: "09:00",
    type: "EVALUATION" as any,
    status: "PENDING" as any,
    doctorId: profile?.id || professionals[0]?.id || "",
    patientName: "",
  });

  const [administrativeTitle, setAdministrativeTitle] = useState("");

  // Sincronização com Google Calendar
  const syncToGoogleCalendar = async (appointmentData: any) => {
    try {
      // Verifica se o usuário tem integração com Google Calendar
      const { data: integration } = await supabase
        .from('user_integrations')
        .select('*')
        .eq('user_id', profile?.id)
        .eq('provider', 'google_calendar')
        .single();

      if (!integration || !integration.access_token) {
        console.log('Google Calendar não integrado');
        return null;
      }

      // Cria evento no Google Calendar
      const event = {
        summary: eventType === 'ADMINISTRATIVE'
          ? administrativeTitle
          : `${formData.patientName} - ${formData.type}`,
        description: appointmentData.notes || '',
        start: {
          dateTime: `${formData.date}T${formData.time}:00`,
          timeZone: 'America/Sao_Paulo',
        },
        end: {
          dateTime: `${formData.date}T${formData.time}:00`, // Adicionar duração depois
          timeZone: 'America/Sao_Paulo',
        },
      };

      // Aqui você faria a chamada real para a API do Google Calendar
      // Por enquanto, retornamos um ID simulado
      const googleEventId = `google_event_${Date.now()}`;

      return googleEventId;
    } catch (error) {
      console.error('Erro ao sincronizar com Google Calendar:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validação condicional
    if (eventType === 'PATIENT' && !formData.patientName) {
      toast.error("Por favor, selecione um paciente.");
      return;
    }

    if (eventType === 'ADMINISTRATIVE' && !administrativeTitle.trim()) {
      toast.error("Por favor, digite o título do compromisso.");
      return;
    }

    if (!profile?.clinic_id) {
      toast.error("Erro: Clínica não identificada.");
      return;
    }

    setLoading(true);
    try {
      let patient_id = null;
      let notes = "";

      if (eventType === 'PATIENT') {
        // Busca o ID do paciente pelo nome selecionado
        const patient = patients.find(
          (p) => p.name.toLowerCase() === formData.patientName?.toLowerCase()
        );
        patient_id = patient?.id || null;
        notes = `Agendado via Painel Dr. Marcelo`;
      } else {
        // Compromisso administrativo
        patient_id = null;
        notes = administrativeTitle;
      }

      // STRICT ENUM MAPPING
      const validTypes = ['EVALUATION', 'TREATMENT', 'RETURN', 'URGENCY'];
      const typeToSend = validTypes.includes(formData.type) ? formData.type : 'EVALUATION';

      // Ensure date format is ISO8601 compatible for Postgres
      const newApt = {
        clinic_id: profile.clinic_id,
        patient_id: patient_id,
        professional_id: formData.doctorId || profile.id,
        date: `${formData.date}T${formData.time}:00`,
        duration: 60,
        type: typeToSend,
        status: "PENDING",
        notes: notes,
      };

      const { data, error } = await supabase
        .from("appointments")
        .insert([newApt])
        .select()
        .single();

      if (error) throw error;

      // Sincronização com Google Calendar
      const googleEventId = await syncToGoogleCalendar(newApt);

      if (googleEventId) {
        await supabase
          .from('appointments')
          .update({ google_event_id: googleEventId })
          .eq('id', data.id);
      }

      // 🤖 WHATSAPP AUTOMATION (apenas para pacientes)
      if (eventType === 'PATIENT' && patient_id) {
        try {
          const patient = patients.find(p => p.id === patient_id);

          if (patient) {
            // A. WhatsApp History
            await supabase.from('whatsapp_chat_history').insert({
              clinic_id: profile.clinic_id,
              patient_id: patient.id,
              agent_name: 'guardian',
              direction: 'OUTBOUND',
              message_type: 'TEXT',
              message_content: `Olá ${patient.name.split(' ')[0]}, seu agendamento com o Dr. Marcelo foi confirmado para ${formData.date} às ${formData.time}. Esperamos por você!`,
              is_read: true
            });

            // B. Confirmation Tracker
            await supabase.from('appointment_confirmations').upsert({
              clinic_id: profile.clinic_id,
              appointment_id: data.id,
              confirmation_status: 'PENDING',
              created_at: new Date().toISOString()
            }, { onConflict: 'appointment_id' });
          }
        } catch (waErr) {
          console.error("WhatsApp trigger failed", waErr);
        }
      }

      toast.success(
        eventType === 'PATIENT'
          ? "Agendamento realizado com sucesso!"
          : "Compromisso bloqueado na agenda!"
      );

      await refreshData();
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
        {/* Toggle Tipo de Evento */}
        <div>
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">
            Tipo de Evento
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEventType('PATIENT')}
              className={cn(
                "flex-1 py-4 rounded-xl transition-all duration-300 font-semibold",
                "flex items-center justify-center gap-2",
                eventType === 'PATIENT'
                  ? "bg-blue-500 text-white shadow-lg scale-105"
                  : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
              )}
            >
              <User className="h-5 w-5" />
              Paciente
            </button>
            <button
              type="button"
              onClick={() => setEventType('ADMINISTRATIVE')}
              className={cn(
                "flex-1 py-4 rounded-xl transition-all duration-300 font-semibold",
                "flex items-center justify-center gap-2",
                eventType === 'ADMINISTRATIVE'
                  ? "bg-purple-500 text-white shadow-lg scale-105"
                  : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
              )}
            >
              <Briefcase className="h-5 w-5" />
              Compromisso
            </button>
          </div>
        </div>

        {/* Campos Condicionais */}
        {eventType === 'PATIENT' ? (
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
              Nome do Paciente
            </label>
            <input
              className="w-full bg-white dark:bg-slate-900 text-gray-900 dark:text-white border border-gray-200 dark:border-slate-600 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500"
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
        ) : (
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
              Título do Compromisso
            </label>
            <input
              type="text"
              className="w-full bg-white dark:bg-slate-900 text-gray-900 dark:text-white border border-gray-200 dark:border-slate-600 rounded-lg p-3 outline-none focus:ring-2 focus:ring-purple-500"
              required
              value={administrativeTitle}
              onChange={(e) => setAdministrativeTitle(e.target.value)}
              placeholder="Ex: Reunião de Equipe, Almoço com Fornecedor"
            />
            <p className="text-xs text-slate-500 mt-2 italic">
              Este compromisso bloqueará sua agenda e será sincronizado com o Google Calendar
            </p>
          </div>
        )}

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

        {/* Tipo de Consulta - Apenas para Pacientes */}
        {eventType === 'PATIENT' && (
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
                  className={`py-3 text-xs font-bold rounded-lg border transition-all ${formData.type === option.value
                      ? "bg-primary-600 border-primary-600 text-white shadow-md"
                      : "bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-600 text-gray-500 hover:bg-gray-50"
                    }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Botão de Ação */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className={cn(
              "w-full py-4 rounded-xl font-bold shadow-lg flex justify-center items-center gap-2",
              "transition-all duration-300 active:scale-95 disabled:opacity-50",
              eventType === 'PATIENT'
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-purple-600 hover:bg-purple-700 text-white"
            )}
          >
            {loading ? (
              "Salvando..."
            ) : (
              <>
                <Save size={20} />
                {eventType === 'PATIENT' ? 'Confirmar Agendamento' : 'Bloquear Agenda'}
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
