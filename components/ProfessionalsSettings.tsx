import React, { useState, useEffect } from "react";
import { SettingsService, User } from "../services/settingsService";
import {
  Loader2,
  Save,
  Users,
  Plus,
  Edit,
  Trash2,
  UserCheck,
  UserX,
} from "lucide-react";

const ProfessionalsSettings: React.FC = () => {
  const [professionals, setProfessionals] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingProfessional, setEditingProfessional] = useState<User | null>(
    null
  );
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Form data
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "DENTIST" as "ADMIN" | "DENTIST" | "RECEPTIONIST" | "PROFESSIONAL",
    color: "#3B82F6",
    active: true,
    phone: "",
  });

  useEffect(() => {
    loadProfessionals();
  }, []);

  const loadProfessionals = async () => {
    try {
      setLoading(true);
      const data = await SettingsService.getProfessionals();
      setProfessionals(data);
    } catch (error) {
      console.error("Erro ao carregar profissionais:", error);
      setToast({
        message: "Não foi possível carregar os profissionais.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      role: "DENTIST",
      color: "#3B82F6",
      active: true,
      phone: "",
    });
    setEditingProfessional(null);
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const openModal = (professional?: User) => {
    if (professional) {
      setEditingProfessional(professional);
      setFormData({
        name: professional.name,
        email: professional.email,
        role: professional.role,
        color: professional.color || "#3B82F6",
        active: professional.active,
        phone: professional.phone || "",
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      if (editingProfessional) {
        await SettingsService.updateProfessional(
          editingProfessional.id,
          formData
        );
        setToast({
          message: "Profissional atualizado com sucesso!",
          type: "success",
        });
      } else {
        await SettingsService.createProfessional(formData);
        setToast({
          message: "Profissional criado com sucesso!",
          type: "success",
        });
      }

      setShowModal(false);
      resetForm();
      await loadProfessionals();
    } catch (error) {
      console.error("Erro ao salvar profissional:", error);
      setToast({
        message: "Não foi possível salvar o profissional.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (professional: User) => {
    if (!confirm(`Tem certeza que deseja excluir ${professional.name}?`)) {
      return;
    }

    try {
      await SettingsService.deleteProfessional(professional.id);
      setToast({
        message: "Profissional excluído com sucesso!",
        type: "success",
      });
      await loadProfessionals();
    } catch (error) {
      console.error("Erro ao excluir profissional:", error);
      setToast({
        message: "Não foi possível excluir o profissional.",
        type: "error",
      });
    }
  };

  const getRoleLabel = (role: string) => {
    const labels = {
      ADMIN: "Administrador",
      DENTIST: "Dentista",
      RECEPTIONIST: "Recepcionista",
      PROFESSIONAL: "Profissional",
    };
    return labels[role as keyof typeof labels] || role;
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

  // Função para limpar toast
  const clearToast = () => {
    setToast(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <span className="ml-2">Carregando profissionais...</span>
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

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Profissionais</h1>
        </div>

        <button
          onClick={() => openModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Novo Profissional
        </button>
      </div>

      {/* Lista de Profissionais */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Lista de Profissionais</h2>
          <p className="text-gray-600">
            Gerencie todos os profissionais da clínica
          </p>
        </div>

        <div className="p-6">
          {professionals.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum profissional cadastrado</p>
              <button
                onClick={() => openModal()}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2 mx-auto"
              >
                <Plus className="h-4 w-4" />
                Cadastrar primeiro profissional
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {professionals.map((professional) => (
                <div
                  key={professional.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                        style={{
                          backgroundColor: professional.color || "#3B82F6",
                        }}
                      >
                        {professional.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {professional.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {getRoleLabel(professional.role)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {professional.active ? (
                        <UserCheck className="h-4 w-4 text-green-500" />
                      ) : (
                        <UserX className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </div>

                  <div className="space-y-1 text-sm text-gray-600">
                    <p>
                      <strong>Email:</strong> {professional.email}
                    </p>
                    {professional.phone && (
                      <p>
                        <strong>Telefone:</strong>{" "}
                        {formatPhone(professional.phone)}
                      </p>
                    )}
                    <p>
                      <strong>Status:</strong>{" "}
                      {professional.active ? "Ativo" : "Inativo"}
                    </p>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => openModal(professional)}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1"
                    >
                      <Edit className="h-3 w-3" />
                      Editar
                    </button>

                    <button
                      onClick={() => handleDelete(professional)}
                      className="bg-red-100 hover:bg-red-200 text-red-700 font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Criação/Edição */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6 border-b">
              <h3 className="text-xl font-semibold">
                {editingProfessional
                  ? "Editar Profissional"
                  : "Novo Profissional"}
              </h3>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Nome *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nome completo"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  E-mail *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="email@exemplo.com"
                  disabled={!!editingProfessional} // Não permite alterar email na edição
                />
                {editingProfessional && (
                  <p className="text-xs text-gray-500">
                    O e-mail não pode ser alterado
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Função *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => handleInputChange("role", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="DENTIST">Dentista</option>
                  <option value="RECEPTIONIST">Recepcionista</option>
                  <option value="PROFESSIONAL">Profissional</option>
                  <option value="ADMIN">Administrador</option>
                </select>
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

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Cor de Identificação
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => handleInputChange("color", e.target.value)}
                    className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => handleInputChange("color", e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="#3B82F6"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) =>
                    handleInputChange("active", e.target.checked)
                  }
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <label
                  htmlFor="active"
                  className="text-sm font-medium text-gray-700"
                >
                  Ativo
                </label>
              </div>
            </div>

            <div className="p-6 border-t flex gap-3 justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                disabled={saving}
              >
                Cancelar
              </button>

              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
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
        </div>
      )}
    </div>
  );
};

export default ProfessionalsSettings;
