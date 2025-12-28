import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import {
  Loader2,
  Save,
  Users,
  Plus,
  Trash2,
  Search,
  Stethoscope,
  UserCheck,
  UserX,
  DollarSign
} from "lucide-react";
import { ProfessionalMasterSheet } from "./ProfessionalMasterSheet";

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

const ProfessionalsSettings: React.FC = () => {
  const { profile } = useAuth();
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Master Sheet State
  const [selectedProfessionalForSheet, setSelectedProfessionalForSheet] = useState<Professional | null>(null);

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
          onClick={() => setSelectedProfessionalForSheet({ id: '', name: '', crc: '', specialty: '', council: '', is_active: true, color: '#3B82F6', clinic_id: '', created_at: '', updated_at: '' })}
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
                  onClick={() => setSelectedProfessionalForSheet({ id: '', name: '', crc: '', specialty: '', council: '', is_active: true, color: '#3B82F6', clinic_id: '', created_at: '', updated_at: '' })}
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

                  {/* Manage Button (Opens Master Sheet) */}
                  <button
                    onClick={() => setSelectedProfessionalForSheet(professional)}
                    className="w-full bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 dark:from-purple-900/10 dark:to-blue-900/10 dark:hover:from-purple-900/20 dark:hover:to-blue-900/20 text-purple-700 dark:text-purple-400 font-semibold py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-2 text-sm border border-purple-200 dark:border-purple-800 shadow-sm"
                  >
                    <DollarSign className="h-4 w-4" />
                    Gerenciar Profissional
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Professional Master Sheet */}
      {selectedProfessionalForSheet && (
        <ProfessionalMasterSheet
          professionalId={selectedProfessionalForSheet.id}
          isOpen={!!selectedProfessionalForSheet}
          onClose={() => setSelectedProfessionalForSheet(null)}
          onSave={() => {
            loadProfessionals();
            setSelectedProfessionalForSheet(null);
          }}
        />
      )}
    </div>
  );
};

export default ProfessionalsSettings;
