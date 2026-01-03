import React, { useState, useEffect } from 'react';
import { supabase } from '../src/lib/supabase';
import { ChevronDown, Plus, Building2, Globe, Check } from 'lucide-react';
import { CreateClinicModal } from './CreateClinicModal';
import { useAuth } from '../contexts/AuthContext';

interface Clinic {
    id: string;
    name: string;
    code: string;
    type?: 'PRODUCTION' | 'REAL' | 'SIMULATION';
    status: string;
}

export function ClinicSwitcher() {
    const { profile } = useAuth();
    const [clinics, setClinics] = useState<Clinic[]>([]);
    const [currentClinic, setCurrentClinic] = useState<Clinic | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    const isMaster = profile?.role === 'MASTER';

    useEffect(() => {
        loadClinics();
    }, [profile]);

    const loadClinics = async () => {
        try {
            setLoading(true);

            // Buscar clínicas ativas
            const { data: clinicsData, error } = await supabase
                .from('clinics')
                .select('*')
                .eq('status', 'ACTIVE')
                .order('name');

            if (error) throw error;

            if (clinicsData && clinicsData.length > 0) {
                setClinics(clinicsData);

                // Tentar recuperar a última clínica usada
                const savedClinicId = localStorage.getItem('current_clinic_id');
                const activeClinic = clinicsData.find(c => c.id === savedClinicId) || clinicsData[0];

                setCurrentClinic(activeClinic);
                localStorage.setItem('current_clinic_id', activeClinic.id);
            }
        } catch (error) {
            console.error('Erro ao carregar clínicas:', error);
        } finally {
            setLoading(false);
        }
    };

    const switchClinic = (clinic: Clinic) => {
        setCurrentClinic(clinic);
        localStorage.setItem('current_clinic_id', clinic.id);
        setIsOpen(false);

        // Recarregar página para atualizar contexto
        window.location.reload();
    };

    if (loading || !currentClinic) {
        return (
            <div className="flex items-center gap-3 p-2">
                <div className="animate-pulse bg-white/20 p-2 rounded-md w-10 h-10" />
                <div className="hidden md:block">
                    <div className="animate-pulse bg-white/20 h-3 w-20 rounded mb-1" />
                    <div className="animate-pulse bg-white/20 h-4 w-32 rounded" />
                </div>
            </div>
        );
    }

    return (
        <div className="relative">
            {/* Botão Principal */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 hover:bg-white/10 p-2 rounded-lg transition-all"
            >
                <div className="bg-white/20 p-2 rounded-md">
                    {currentClinic.type === 'SIMULATION' ? (
                        <Globe className="w-5 h-5 text-yellow-300" />
                    ) : (
                        <Building2 className="w-5 h-5 text-white" />
                    )}
                </div>
                <div className="text-left hidden md:block">
                    <p className="text-xs text-blue-200 font-medium uppercase tracking-wide">
                        Unidade Atual
                    </p>
                    <h1 className="text-sm font-bold text-white flex items-center gap-2">
                        {currentClinic.name}
                        <ChevronDown className={`w-4 h-4 opacity-70 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </h1>
                </div>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <>
                    {/* Overlay para fechar ao clicar fora */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
                        {/* Header do Dropdown */}
                        <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
                            <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                                Minhas Unidades ({clinics.length})
                            </p>
                        </div>

                        {/* Lista de Clínicas */}
                        <div className="max-h-80 overflow-y-auto p-2">
                            {clinics.map((clinic) => (
                                <button
                                    key={clinic.id}
                                    onClick={() => switchClinic(clinic)}
                                    className={`w-full text-left px-3 py-3 rounded-lg mb-1 flex items-center gap-3 transition-all ${currentClinic.id === clinic.id
                                        ? 'bg-blue-50 text-blue-700 font-bold shadow-sm'
                                        : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    {/* Indicador de Tipo */}
                                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${clinic.type === 'SIMULATION'
                                        ? 'bg-yellow-400 shadow-yellow-200 shadow-md'
                                        : 'bg-green-500 shadow-green-200 shadow-md'
                                        }`} />

                                    {/* Nome da Clínica */}
                                    <div className="flex-1 min-w-0">
                                        <p className="truncate">{clinic.name}</p>
                                        {clinic.type === 'SIMULATION' && (
                                            <p className="text-xs text-yellow-600 font-medium">Simulação</p>
                                        )}
                                    </div>

                                    {/* Check se é a atual */}
                                    {currentClinic.id === clinic.id && (
                                        <Check className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Botão Nova Unidade (MASTER ONLY) */}
                        {isMaster && (
                            <div className="border-t border-gray-200 p-2">
                                <button
                                    onClick={() => {
                                        setIsOpen(false);
                                        setIsModalOpen(true);
                                    }}
                                    className="w-full flex items-center justify-center gap-2 text-purple-600 font-bold text-sm hover:bg-purple-50 p-3 rounded-lg transition-all"
                                >
                                    <Plus className="w-4 h-4" />
                                    Nova Unidade
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Modal de Criação */}
            <CreateClinicModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => {
                    setIsModalOpen(false);
                    loadClinics();
                }}
            />
        </div>
    );
}
