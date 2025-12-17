import React, { useState, useEffect } from "react";
import { SettingsService, Clinic } from "../services/settingsService";
import { Loader2, Save, Building2, Clock, Calendar } from "lucide-react";

const ClinicSettings: React.FC = () => {
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Dados da clínica
  const [formData, setFormData] = useState({
    name: "",
    cnpj: "",
    address: "",
    phone: "",
    email: "",
    code: "",
  });

  // Configurações de agenda (serão implementadas futuramente)
  const [scheduleConfig, setScheduleConfig] = useState({
    openingTime: "08:00",
    closingTime: "18:00",
    slotDuration: 30,
    workingDays: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: false,
      sunday: false,
    },
  });

  useEffect(() => {
    loadClinicData();
  }, []);

  const loadClinicData = async () => {
    try {
      setLoading(true);
      const clinicData = await SettingsService.getClinic();
      if (clinicData) {
        setClinic(clinicData);
        setFormData({
          name: clinicData.name || "",
          cnpj: clinicData.cnpj || "",
          address: clinicData.address || "",
          phone: clinicData.phone || "",
          email: clinicData.email || "",
          code: clinicData.code || "",
        });
      }
    } catch (error) {
      console.error("Erro ao carregar dados da clínica:", error);
      setToast({
        message: "Não foi possível carregar os dados da clínica.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const formatCNPJ = (value: string) => {
    // Remove todos os caracteres não numéricos
    const numbers = value.replace(/\D/g, "");

    // Aplica a máscara CNPJ: 99.999.999/9999-99
    if (numbers.length <= 14) {
      return numbers
        .replace(/^(\d{2})(\d)/, "$1.$2")
        .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})(\d)/, ".$1/$2")
        .replace(/(\d{4})(\d)/, "$1-$2");
    }

    return numbers
      .slice(0, 14)
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  };

  const formatPhone = (value: string) => {
    // Remove todos os caracteres não numéricos
    const numbers = value.replace(/\D/g, "");

    // Aplica a máscara telefone: (99) 99999-9999
    if (numbers.length <= 11) {
      return numbers
        .replace(/^(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{5})(\d)/, "$1-$2");
    }

    return numbers
      .slice(0, 11)
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2");
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      await SettingsService.updateClinic(formData);

      setToast({
        message: "Dados da clínica atualizados com sucesso!",
        type: "success",
      });

      // Recarregar dados
      await loadClinicData();
    } catch (error) {
      console.error("Erro ao salvar dados da clínica:", error);
      setToast({
        message: "Não foi possível salvar os dados da clínica.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  // Função para limpar toast
  const clearToast = () => {
    setToast(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <span className="ml-2">Carregando dados da clínica...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast de feedback */}
      {toast && (
        <div
          className={`p-4 rounded-lg border ${
            toast.type === "success"
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          {toast.message}
          <button onClick={clearToast} className="float-right ml-4 font-bold">
            ×
          </button>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Building2 className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Configurações da Clínica</h1>
      </div>

      {/* Informações Básicas da Clínica */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Informações Básicas</h2>
          <p className="text-gray-600">
            Configure os dados principais da sua clínica
          </p>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Nome da Clínica *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Digite o nome da clínica"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                CNPJ
              </label>
              <input
                type="text"
                value={formData.cnpj}
                onChange={(e) =>
                  handleInputChange("cnpj", formatCNPJ(e.target.value))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="99.999.999/9999-99"
                maxLength={18}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                E-mail
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="contato@clinica.com"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Telefone
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) =>
                  handleInputChange("phone", formatPhone(e.target.value))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="(99) 99999-9999"
                maxLength={15}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Endereço Completo
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Rua, número, bairro, cidade - UF, CEP"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Código de Identificação
            </label>
            <input
              type="text"
              value={formData.code}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
              placeholder="Gerado automaticamente"
            />
            <p className="text-sm text-gray-500">
              Este código é gerado automaticamente pelo sistema
            </p>
          </div>
        </div>
      </div>

      {/* Configurações de Agenda - Placeholder para futura implementação */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Configurações de Agenda
          </h2>
          <p className="text-gray-600">
            Configure os horários e dias de funcionamento
          </p>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Horário de Abertura
              </label>
              <input
                type="time"
                value={scheduleConfig.openingTime}
                onChange={(e) =>
                  setScheduleConfig((prev) => ({
                    ...prev,
                    openingTime: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Horário de Fechamento
              </label>
              <input
                type="time"
                value={scheduleConfig.closingTime}
                onChange={(e) =>
                  setScheduleConfig((prev) => ({
                    ...prev,
                    closingTime: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Duração do Slot (min)
              </label>
              <input
                type="number"
                value={scheduleConfig.slotDuration}
                onChange={(e) =>
                  setScheduleConfig((prev) => ({
                    ...prev,
                    slotDuration: parseInt(e.target.value) || 30,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min={10}
                max={120}
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Dias de Funcionamento
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(scheduleConfig.workingDays).map(
                ([day, isActive]) => (
                  <div key={day} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={day}
                      checked={isActive}
                      onChange={(e) =>
                        setScheduleConfig((prev) => ({
                          ...prev,
                          workingDays: {
                            ...prev.workingDays,
                            [day]: e.target.checked,
                          },
                        }))
                      }
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label
                      htmlFor={day}
                      className="text-sm font-medium text-gray-700 capitalize"
                    >
                      {day === "monday"
                        ? "Segunda"
                        : day === "tuesday"
                        ? "Terça"
                        : day === "wednesday"
                        ? "Quarta"
                        : day === "thursday"
                        ? "Quinta"
                        : day === "friday"
                        ? "Sexta"
                        : day === "saturday"
                        ? "Sábado"
                        : "Domingo"}
                    </label>
                  </div>
                )
              )}
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-700">
              <Calendar className="h-4 w-4 inline mr-1" />
              As configurações de agenda serão implementadas em uma futura
              atualização. Por enquanto, os valores são apenas para referência
              visual.
            </p>
          </div>
        </div>
      </div>

      {/* Botão de Salvar */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-2 px-6 rounded-lg transition-colors flex items-center gap-2 min-w-[120px] justify-center"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Salvar
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ClinicSettings;
