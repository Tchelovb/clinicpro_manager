import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import {
  Loader2,
  Save,
  Users,
  Plus,
  Edit,
  Trash2,
  Search,
  Stethoscope,
  UserCheck,
  UserX,
} from "lucide-react";

// Interface para Professional baseada na tabela
interface Professional {
  id: string;
  clinic_id: string;
  name: string;
  crc: string;
  specialty: string;
  council: string;
  is_active: boolean;
  photo_url?: string;
  color: string;
  created_at: string;
  updated_at: string;
}

const ProfessionalsPage: React.FC = () => {
  const { profile } = useAuth();
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingProfessional, setEditingProfessional] =
    useState<Professional | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Form data
  const [formData, setFormData] = useState({
    name: "",
    crc: "",
    specialty: "",
    council: "",
    color: "#3B82F6",
    is_active: true,
  });

  useEffect(() => {
    loadProfessionals();
  }, [profile?.clinic_id]);

  const loadProfessionals = async () => {
    if (!profile?.clinic_id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("professionals")
        .select("*")
        .eq("clinic_id", profile.clinic_id)
        .order("name");

      if (error) throw error;

      setProfessionals(data || []);
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
      crc: "",
      specialty: "",
      council: "",
      color: "#3B82F6",
      is_active: true,
    });
    setEditingProfessional(null);
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const openModal = (professional?: Professional) => {
    if (professional) {
      setEditingProfessional(professional);
      setFormData({
        name: professional.name,
        crc: professional.crc,
        specialty: professional.specialty,
        council: professional.council,
        color: professional.color || "#3B82F6",
        is_active: professional.is_active,
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
    if (!profile?.clinic_id) return;

    // Basic validation
    if (!formData.name.trim() || !formData.crc.trim()) {
      setToast({
        message: "Nome e CRC são obrigatórios.",
        type: "error",
      });
      return;
    }

    try {
      setSaving(true);

      const professionalData = {
        ...formData,
        clinic_id: profile.clinic_id,
        updated_at: new Date().toISOString(),
      };

      if (editingProfessional) {
        const { error } = await supabase
          .from("professionals")
          .update(professionalData)
          .eq("id", editingProfessional.id);

        if (error) throw error;

        setToast({
          message: "Profissional atualizado com sucesso!",
          type: "success",
        });
      } else {
        const { error } = await supabase.from("professionals").insert({
          ...professionalData,
          created_at: new Date().toISOString(),
        });

        if (error) throw error;

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

  const handleDelete = async (professional: Professional) => {
    if (!confirm(`Tem certeza que deseja excluir ${professional.name}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from("professionals")
        .delete()
        .eq("id", professional.id);

      if (error) throw error;

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

  const filteredProfessionals = professionals.filter(
    (professional) =>
      professional.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      professional.crc.toLowerCase().includes(searchTerm.toLowerCase()) ||
      professional.specialty.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          className={`p-4 rounded-lg border ${toast.type === "success"
              ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400"
              : "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400"
            }`}
        >
          {toast.message}
          <button
            onClick={clearToast}
            className="float-right ml-4 font-bold hover:opacity-70"
          >
            ×
          </button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Stethoscope className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Profissionais</h1>
        </div>

        <button
          onClick={() => openModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Novo Profissional
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Buscar por nome, CRC ou especialidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
      </div>

      {/* Lista de Profissionais */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Lista de Profissionais
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gerencie todos os profissionais da clínica (
            {filteredProfessionals.length} encontrado
            {filteredProfessionals.length !== 1 ? "s" : ""})
          </p>
        </div>

        <div className="p-6">
          {filteredProfessionals.length === 0 ? (
            <div className="text-center py-12">
              <Stethoscope className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {professionals.length === 0
                  ? "Nenhum profissional cadastrado"
                  : "Nenhum resultado encontrado"}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {professionals.length === 0
                  ? "Comece cadastrando o primeiro profissional da sua clínica."
                  : "Tente ajustar os filtros de busca."}
              </p>
              {professionals.length === 0 && (
                <button
                  onClick={() => openModal()}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center gap-2 mx-auto shadow-sm"
                >
                  <Plus className="h-5 w-5" />
                  Cadastrar primeiro profissional
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProfessionals.map((professional) => (
                <div
                  key={professional.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-all duration-200 bg-gray-50 dark:bg-gray-700/50"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm"
                        style={{
                          backgroundColor: professional.color || "#3B82F6",
                        }}
                      >
                        {professional.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                          {professional.name}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          CRC: {professional.crc}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {professional.is_active ? (
                        <UserCheck
                          className="h-4 w-4 text-green-500"
                        />
                      ) : (
                        <UserX
                          className="h-4 w-4 text-red-500"
                        />
                      )}
                    </div>
                  </div>

                  <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300 mb-3">
                    <p>
                      <strong>Especialidade:</strong>{" "}
                      {professional.specialty || "Não informado"}
                    </p>
                    <p>
                      <strong>Conselho:</strong>{" "}
                      {professional.council || "Não informado"}
                    </p>
                    <p>
                      <strong>Status:</strong>{" "}
                      <span
                        className={
                          professional.is_active
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }
                      >
                        {professional.is_active ? "Ativo" : "Inativo"}
                      </span>
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => openModal(professional)}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1 text-sm"
                    >
                      <Edit className="h-3 w-3" />
                      Editar
                    </button>

                    <button
                      onClick={() => handleDelete(professional)}
                      className="bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center text-sm"
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
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {editingProfessional
                  ? "Editar Profissional"
                  : "Novo Profissional"}
              </h3>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nome *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Nome completo"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  CRC/CRO *
                </label>
                <input
                  type="text"
                  value={formData.crc}
                  onChange={(e) => handleInputChange("crc", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Ex: 123456/SP"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Especialidade
                </label>
                <input
                  type="text"
                  value={formData.specialty}
                  onChange={(e) =>
                    handleInputChange("specialty", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Ex: Ortodontia"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Conselho
                </label>
                <input
                  type="text"
                  value={formData.council}
                  onChange={(e) => handleInputChange("council", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Ex: CRO-SP"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Cor de Identificação
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => handleInputChange("color", e.target.value)}
                    className="w-12 h-10 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => handleInputChange("color", e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="#3B82F6"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) =>
                    handleInputChange("is_active", e.target.checked)
                  }
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-700"
                />
                <label
                  htmlFor="is_active"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Profissional ativo
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3 justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium"
                disabled={saving}
              >
                Cancelar
              </button>

              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
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

export default ProfessionalsPage;
