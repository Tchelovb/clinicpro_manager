import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import { Building2, ChevronDown, Globe } from "lucide-react";

interface Clinic {
    id: string;
    name: string;
    code: string;
    status: string;
}

const TenantSwitcher: React.FC = () => {
    const { profile, activeClinicId, setActiveClinic } = useAuth();
    const [clinics, setClinics] = useState<Clinic[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (profile?.role === 'MASTER') {
            loadClinics();
        }
    }, [profile]);

    const loadClinics = async () => {
        try {
            const { data, error } = await supabase
                .from('clinics')
                .select('id, name, code, status')
                .eq('status', 'ACTIVE')
                .order('name');

            if (error) throw error;
            setClinics(data || []);
        } catch (error) {
            console.error('Erro ao carregar clínicas:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectClinic = (clinicId: string | null) => {
        setActiveClinic(clinicId);
        setIsOpen(false);
    };

    // Só exibe para usuários MASTER
    if (profile?.role !== 'MASTER') {
        return null;
    }

    const selectedClinic = clinics.find(c => c.id === activeClinicId);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            >
                <div className="flex items-center gap-3">
                    {activeClinicId ? (
                        <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    ) : (
                        <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    )}
                    <div className="text-left">
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                            Visualizando
                        </div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {selectedClinic ? selectedClinic.name : 'Visão Global'}
                        </div>
                    </div>
                </div>
                <ChevronDown
                    className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''
                        }`}
                />
            </button>

            {isOpen && (
                <>
                    {/* Overlay para fechar ao clicar fora */}
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Dropdown */}
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 max-h-96 overflow-y-auto">
                        {/* Opção: Visão Global */}
                        <button
                            onClick={() => handleSelectClinic(null)}
                            className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${!activeClinicId ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                                }`}
                        >
                            <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            <div className="text-left">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    Visão Global
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                    Todas as clínicas
                                </div>
                            </div>
                        </button>

                        <div className="border-t border-gray-200 dark:border-gray-700" />

                        {/* Lista de Clínicas */}
                        {loading ? (
                            <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                                Carregando...
                            </div>
                        ) : clinics.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                                Nenhuma clínica ativa
                            </div>
                        ) : (
                            clinics.map((clinic) => (
                                <button
                                    key={clinic.id}
                                    onClick={() => handleSelectClinic(clinic.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${activeClinicId === clinic.id
                                            ? 'bg-blue-50 dark:bg-blue-900/20'
                                            : ''
                                        }`}
                                >
                                    <Building2 className="w-5 h-5 text-gray-400" />
                                    <div className="text-left">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                            {clinic.name}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            {clinic.code}
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default TenantSwitcher;
