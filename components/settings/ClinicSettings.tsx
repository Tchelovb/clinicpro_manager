import React, { useState, useEffect } from "react";
import { supabase, getCurrentClinicId } from "../../src/lib/supabase";
import { Save, Loader, Plus } from "lucide-react";

interface ClinicData {
  id: string;
  name: string;
  cnpj: string;
  address: string;
  phone: string;
  email: string;
  code: string;
  opening_time: string;
  closing_time: string;
  slot_duration: number;
  working_days: string[];
}

const ClinicSettings: React.FC = () => {
  const [clinic, setClinic] = useState<ClinicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clinicDoesNotExist, setClinicDoesNotExist] = useState(false);

  useEffect(() => {
    loadClinicData();
  }, []);

  const loadClinicData = async () => {
    try {
      const clinicId = await getCurrentClinicId();

      // 1. CASO CRÍTICO: Se o ID ainda não está disponível ou é nulo
      if (!clinicId) {
        // Se você tem certeza que getCurrentClinicId é rápido e se o ID é nulo,
        // isso significa que o usuário não tem clínica.

        // Para fins de correção de bug, vamos definir que a clínica não existe
        // e permitir que o modo "Criar" seja ativado
        setClinicDoesNotExist(true);
        setLoading(false);
        return; // Para o fluxo aqui.
      }

      // 2. BUSCA NO SUPABASE (ID VÁLIDO)
      const { data, error } = await supabase
        .from("clinics")
        .select("*")
        .eq("id", clinicId)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        // Clínica encontrada, carregando dados...
        setClinic({
          ...data,
          opening_time: data.opening_time || "08:00",
          closing_time: data.closing_time || "18:00",
          slot_duration: data.slot_duration || 30,
          working_days: data.working_days || [
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
          ],
        });
        setClinicDoesNotExist(false); // Garante que o estado de "não existe" está falso
      } else {
        // PGRST116: ID válido, mas clínica não existe no DB.
        setClinicDoesNotExist(true);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!clinic) return;

    setSaving(true);
    try {
      if (clinic.id) {
        // Update existing
        const { error } = await supabase
          .from("clinics")
          .update({
            name: clinic.name,
            cnpj: clinic.cnpj,
            address: clinic.address,
            phone: clinic.phone,
            email: clinic.email,
            opening_time: clinic.opening_time,
            closing_time: clinic.closing_time,
            slot_duration: clinic.slot_duration,
            working_days: clinic.working_days,
          })
          .eq("id", clinic.id);

        if (error) throw error;
        alert("Dados salvos com sucesso!");
      } else {
        // Create new
        const { data, error } = await supabase
          .from("clinics")
          .insert({
            name: clinic.name,
            cnpj: clinic.cnpj,
            address: clinic.address,
            phone: clinic.phone,
            email: clinic.email,
            opening_time: clinic.opening_time,
            closing_time: clinic.closing_time,
            slot_duration: clinic.slot_duration,
            working_days: clinic.working_days,
          })
          .select()
          .single();

        if (error) throw error;
        setClinic({
          ...data,
          opening_time: data.opening_time || "08:00",
          closing_time: data.closing_time || "18:00",
          slot_duration: data.slot_duration || 30,
          working_days: data.working_days || [
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
          ],
        });
        alert("Clínica criada com sucesso!");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const updateClinic = (field: keyof ClinicData, value: any) => {
    setClinic((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  const daysOfWeek = [
    { key: "monday", label: "Segunda" },
    { key: "tuesday", label: "Terça" },
    { key: "wednesday", label: "Quarta" },
    { key: "thursday", label: "Quinta" },
    { key: "friday", label: "Sexta" },
    { key: "saturday", label: "Sábado" },
    { key: "sunday", label: "Domingo" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="animate-spin" size={24} />
        <span className="ml-2">Carregando dados da clínica...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        Erro: {error}
      </div>
    );
  }

  // MUDANÇA PRINCIPAL: Se loading=false E a clínica não existe no DB (ou o clinicId é nulo)
  if (clinicDoesNotExist || !clinic) {
    // Permite que o usuário crie a clínica se o clinicId for nulo ou se o ID não achou um registro

    // Inicializa o objeto clinic para o modo 'Criação'
    const newClinicDefaults: ClinicData = {
      id: "", // ID vazio para indicar que é uma nova clínica
      name: "",
      cnpj: "",
      address: "",
      phone: "",
      email: "",
      code: "",
      opening_time: "08:00",
      closing_time: "18:00",
      slot_duration: 30,
      working_days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    };

    // Retorna a interface do formulário, mas com o botão "Criar"
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            Configuração Geral da Clínica
          </h2>
          <button
            onClick={() => {
              setClinic(newClinicDefaults);
              setClinicDoesNotExist(false);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Plus size={16} />
            Nova Clínica
          </button>
        </div>

        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700">
          Clínica não configurada. Clique em **Nova Clínica** para configurar.
        </div>
      </div>
    );
  }

  // Renderização normal (Clínica encontrada)
  return (
    <ClinicForm
      clinic={clinic}
      updateClinic={updateClinic}
      handleSave={handleSave}
      saving={saving}
      daysOfWeek={daysOfWeek}
    />
  );
};

// Crie um componente funcional ClinicForm para isolar o JSX de renderização
const ClinicForm: React.FC<{
  clinic: ClinicData;
  updateClinic: (field: keyof ClinicData, value: any) => void;
  handleSave: () => void;
  saving: boolean;
  daysOfWeek: { key: string; label: string }[];
}> = ({ clinic, updateClinic, handleSave, saving, daysOfWeek }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">
          Configuração Geral da Clínica
        </h2>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? (
            <Loader className="animate-spin" size={16} />
          ) : (
            <Save size={16} />
          )}
          {saving ? "Salvando..." : clinic.id ? "Salvar" : "Criar"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Dados Básicos */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Dados Básicos
          </h3>

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Nome da Clínica *
            </label>
            <input
              type="text"
              value={clinic.name}
              onChange={(e) => updateClinic("name", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              CNPJ
            </label>
            <input
              type="text"
              value={clinic.cnpj}
              onChange={(e) => updateClinic("cnpj", e.target.value)}
              placeholder="00.000.000/0000-00"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Endereço
            </label>
            <textarea
              value={clinic.address}
              onChange={(e) => updateClinic("address", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Telefone
            </label>
            <input
              type="text"
              value={clinic.phone}
              onChange={(e) => updateClinic("phone", e.target.value)}
              placeholder="(00) 00000-0000"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Email
            </label>
            <input
              type="email"
              value={clinic.email}
              onChange={(e) => updateClinic("email", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Código de Identificação
            </label>
            <input
              type="text"
              value={clinic.code}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
            />
          </div>
        </div>

        {/* Configuração de Agenda */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Configuração de Agenda
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Horário de Abertura
              </label>
              <input
                type="time"
                value={clinic.opening_time}
                onChange={(e) => updateClinic("opening_time", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Horário de Fechamento
              </label>
              <input
                type="time"
                value={clinic.closing_time}
                onChange={(e) => updateClinic("closing_time", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Duração do Slot (minutos)
            </label>
            <select
              value={clinic.slot_duration}
              onChange={(e) =>
                updateClinic("slot_duration", parseInt(e.target.value))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={10}>10 minutos</option>
              <option value={15}>15 minutos</option>
              <option value={20}>20 minutos</option>
              <option value={30}>30 minutos</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
              Dias de Funcionamento
            </label>
            <div className="grid grid-cols-2 gap-2">
              {daysOfWeek.map((day) => (
                <label key={day.key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={clinic.working_days.includes(day.key)}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      updateClinic(
                        "working_days",
                        checked
                          ? [...clinic.working_days, day.key]
                          : clinic.working_days.filter((d) => d !== day.key)
                      );
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {day.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClinicSettings;
