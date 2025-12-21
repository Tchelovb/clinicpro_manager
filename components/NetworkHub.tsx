import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Building2, Plus, Users, ArrowRight, TrendingUp, DollarSign } from 'lucide-react';
import { CreateClinicModal } from './CreateClinicModal';

export function NetworkHub() {
    const [clinics, setClinics] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchRealClinics();
    }, []);

    const fetchRealClinics = async () => {
        try {
            // BUSCA APENAS CLÍNICAS REAIS (type PRODUCTION ou REAL)
            const { data, error } = await supabase
                .from('clinics')
                .select('*')
                .in('type', ['PRODUCTION', 'REAL'])
                .eq('status', 'ACTIVE')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Erro ao buscar clínicas:', error);
            }

            if (data) {
                console.log('Clínicas reais encontradas:', data);
                setClinics(data);
            }
        } catch (error) {
            console.error('Erro ao buscar rede:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAccess = (clinicId: string) => {
        localStorage.setItem('current_clinic_id', clinicId);
        window.location.href = '/dashboard';
    };

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-screen bg-gray-50">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Rede de Clínicas</h1>
                    <p className="text-gray-600 text-lg">Gestão das unidades reais e franquias</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl flex items-center gap-3 font-bold shadow-lg transition-all"
                >
                    <Plus className="w-6 h-6" /> Nova Unidade Real
                </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center gap-3 mb-2">
                        <Building2 className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium text-gray-600">Total de Unidades</span>
                    </div>
                    <p className="text-4xl font-black text-gray-900">{clinics.length}</p>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center gap-3 mb-2">
                        <DollarSign className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-medium text-gray-600">Faturamento Total</span>
                    </div>
                    <p className="text-4xl font-black text-gray-900">R$ --</p>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center gap-3 mb-2">
                        <Users className="w-5 h-5 text-purple-600" />
                        <span className="text-sm font-medium text-gray-600">Pacientes Ativos</span>
                    </div>
                    <p className="text-4xl font-black text-gray-900">--</p>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center gap-3 mb-2">
                        <TrendingUp className="w-5 h-5 text-orange-600" />
                        <span className="text-sm font-medium text-gray-600">Saúde Média</span>
                    </div>
                    <p className="text-4xl font-black text-green-600">--%</p>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-20">
                    <div className="animate-spin w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600 text-lg">Carregando império...</p>
                </div>
            ) : clinics.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-300 shadow-sm">
                    <Building2 className="w-24 h-24 text-gray-300 mx-auto mb-6" />
                    <h3 className="text-2xl font-bold text-gray-700 mb-2">Nenhuma unidade real encontrada</h3>
                    <p className="text-gray-500 mb-8 text-lg">Comece criando sua primeira franquia ou unidade de produção</p>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl inline-flex items-center gap-3 font-bold shadow-lg transition-all"
                    >
                        <Plus className="w-6 h-6" /> Criar Primeira Unidade
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {clinics.map(clinic => (
                        <div key={clinic.id} className="bg-white p-6 rounded-2xl shadow-md border-2 border-gray-200 hover:border-blue-500 hover:shadow-xl transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-blue-100 rounded-xl">
                                    <Building2 className="w-8 h-8 text-blue-600" />
                                </div>
                                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">ATIVO</span>
                            </div>

                            <h3 className="text-xl font-bold text-gray-900 mb-1">{clinic.name}</h3>
                            <p className="text-sm text-gray-500 mb-6">{clinic.code || 'Sem código'}</p>

                            <div className="space-y-2 mb-6">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">Saúde Financeira</span>
                                    <span className="font-bold text-green-600">--%</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">Pacientes</span>
                                    <span className="font-bold text-gray-900">--</span>
                                </div>
                            </div>

                            <button
                                onClick={() => handleAccess(clinic.id)}
                                className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-bold transition-all flex justify-center items-center gap-2 shadow-md"
                            >
                                Gerenciar Unidade <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <CreateClinicModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    fetchRealClinics();
                }}
                onSuccess={() => {
                    setIsModalOpen(false);
                    fetchRealClinics();
                }}
            />
        </div>
    );
}
