import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Building, Plus, Building2 } from "lucide-react";

interface Clinic {
  id: string;
  name: string;
  cnpj: string;
}

const ClinicSelector: React.FC = () => {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadClinics();
  }, []);

  const loadClinics = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("clinics")
        .select("id, name, cnpj")
        .order("name");

      if (error) throw error;

      setClinics(data || []);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar clínicas");
    } finally {
      setLoading(false);
    }
  };

  const handleClinicSelect = (clinicId: string) => {
    navigate(`/signin?clinicId=${clinicId}`);
  };

  const handleNewClinic = () => {
    navigate("/signup");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-4xl mx-auto pt-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-6">
            <Building2 size={32} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            ClinicPro
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Selecione sua clínica para continuar
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-4 rounded-lg mb-8 text-center">
            {error}
            <button
              onClick={loadClinics}
              className="ml-4 underline hover:no-underline"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* Clinics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {clinics.map((clinic) => (
            <div
              key={clinic.id}
              onClick={() => handleClinicSelect(clinic.id)}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 border border-gray-100 dark:border-gray-700"
            >
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mr-4">
                    <Building
                      size={24}
                      className="text-blue-600 dark:text-blue-400"
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      {clinic.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {clinic.cnpj || "CNPJ não informado"}
                    </p>
                  </div>
                </div>
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                  Selecionar Clínica
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* New Clinic Button */}
        <div className="text-center">
          <button
            onClick={handleNewClinic}
            className="inline-flex items-center px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <Plus size={24} className="mr-3" />
            Cadastrar Nova Clínica
          </button>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500 dark:text-gray-400">
          <p>Precisa de ajuda? Entre em contato com nosso suporte.</p>
        </div>
      </div>
    </div>
  );
};

export default ClinicSelector;
