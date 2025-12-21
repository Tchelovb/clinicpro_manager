import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Building2,
    Plus,
    Gamepad2,
    TrendingUp,
    Award,
    Zap,
    DollarSign,
    Users,
    Target,
    Sparkles,
    Globe,
    BarChart3
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { CreateClinicModal } from './CreateClinicModal';

interface Clinic {
    id: string;
    name: string;
    code: string;
    environment?: 'PRODUCTION' | 'SIMULATION';
    active: boolean;
}

export function MasterTycoonHub() {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const [clinics, setClinics] = useState<Clinic[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadClinics();
    }, []);

    const loadClinics = async () => {
        try {
            const { data, error } = await supabase
                .from('clinics')
                .select('*')
                .eq('active', true)
                .order('name');

            if (error) throw error;
            setClinics(data || []);
        } catch (error) {
            console.error('Erro ao carregar clínicas:', error);
        } finally {
            setLoading(false);
        }
    };

    const enterClinic = (clinic: Clinic) => {
        // Salvar clínica selecionada
        localStorage.setItem('current_clinic_id', clinic.id);
        // Recarregar para atualizar contexto
        window.location.href = '/dashboard';
    };

    const simulationClinics = clinics.filter(c => c.environment === 'SIMULATION');
    const productionClinics = clinics.filter(c => c.environment === 'PRODUCTION');

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-8">
            {/* Header do Tycoon */}
            <div className="max-w-7xl mx-auto mb-8">
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 shadow-2xl border border-purple-400/30">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <Award className="w-10 h-10 text-yellow-300" />
                                <h1 className="text-4xl font-black text-white">
                                    Tycoon Command Center
                                </h1>
                            </div>
                            <p className="text-purple-100 text-lg">
                                Bem-vindo, <span className="font-bold">{profile?.name || 'CEO'}</span>
                                <span className="mx-2">•</span>
                                <span className="text-yellow-300 font-bold">Nível 5 - Magnata</span>
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-purple-200 text-sm mb-1">Total de Unidades</p>
                            <p className="text-5xl font-black text-white">{clinics.length}</p>
                        </div>
                    </div>

                    {/* Stats Bar */}
                    <div className="grid grid-cols-3 gap-4 mt-6">
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-1">
                                <Gamepad2 className="w-5 h-5 text-yellow-300" />
                                <span className="text-purple-200 text-sm">Simulações</span>
                            </div>
                            <p className="text-2xl font-bold text-white">{simulationClinics.length}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-1">
                                <Building2 className="w-5 h-5 text-green-300" />
                                <span className="text-purple-200 text-sm">Produção</span>
                            </div>
                            <p className="text-2xl font-bold text-white">{productionClinics.length}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-1">
                                <DollarSign className="w-5 h-5 text-green-300" />
                                <span className="text-purple-200 text-sm">Potencial</span>
                            </div>
                            <p className="text-2xl font-bold text-white">R$ 260k</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Grid de Ações */}
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Expansão */}
                <div>
                    <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                        <Zap className="w-6 h-6 text-yellow-400" />
                        Expansão do Império
                    </h2>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-2xl p-8 shadow-2xl border-2 border-green-400/30 transition-all transform hover:scale-[1.02] group"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className="bg-white/20 p-6 rounded-2xl group-hover:scale-110 transition-transform">
                                    <Plus className="w-12 h-12 text-white" />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-3xl font-black text-white mb-2">
                                        Criar Nova Unidade
                                    </h3>
                                    <p className="text-green-100 text-lg">
                                        Expandir para nova franquia ou criar simulação de treinamento
                                    </p>
                                </div>
                            </div>
                            <Sparkles className="w-16 h-16 text-yellow-300 animate-pulse" />
                        </div>
                    </button>
                </div>

                {/* Simuladores (Arcade) */}
                {simulationClinics.length > 0 && (
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                            <Gamepad2 className="w-6 h-6 text-yellow-400" />
                            Arcade de Simulação
                            <span className="text-sm text-yellow-300 font-normal">
                                (Treinamento sem risco)
                            </span>
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {simulationClinics.map((clinic) => (
                                <div
                                    key={clinic.id}
                                    className="bg-gradient-to-br from-yellow-900/40 to-orange-900/40 rounded-2xl p-6 border-2 border-yellow-400/30 hover:border-yellow-400/60 transition-all shadow-xl hover:shadow-2xl transform hover:scale-105"
                                >
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="bg-yellow-400/20 p-3 rounded-lg">
                                            <Globe className="w-8 h-8 text-yellow-300" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-bold text-white">{clinic.name}</h3>
                                            <p className="text-yellow-300 text-sm font-medium">SIMULAÇÃO</p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => enterClinic(clinic)}
                                        className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-black py-3 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg"
                                    >
                                        <Gamepad2 className="w-5 h-5" />
                                        JOGAR AGORA
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Unidades Reais (Produção) */}
                {productionClinics.length > 0 && (
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                            <Building2 className="w-6 h-6 text-green-400" />
                            Unidades em Produção
                            <span className="text-sm text-green-300 font-normal">
                                (Operação real)
                            </span>
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {productionClinics.map((clinic) => (
                                <div
                                    key={clinic.id}
                                    className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 rounded-2xl p-6 border-2 border-blue-400/30 hover:border-blue-400/60 transition-all shadow-xl hover:shadow-2xl transform hover:scale-105"
                                >
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="bg-blue-400/20 p-3 rounded-lg">
                                            <Building2 className="w-8 h-8 text-blue-300" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-bold text-white">{clinic.name}</h3>
                                            <p className="text-green-300 text-sm font-medium">PRODUÇÃO</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 mb-4">
                                        <div className="bg-white/5 rounded p-2">
                                            <p className="text-xs text-gray-400">Faturamento</p>
                                            <p className="text-sm font-bold text-white">R$ 45k</p>
                                        </div>
                                        <div className="bg-white/5 rounded p-2">
                                            <p className="text-xs text-gray-400">Meta</p>
                                            <p className="text-sm font-bold text-green-400">85%</p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => enterClinic(clinic)}
                                        className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-black py-3 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg"
                                    >
                                        <BarChart3 className="w-5 h-5" />
                                        GERENCIAR
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {clinics.length === 0 && !loading && (
                    <div className="text-center py-20">
                        <Target className="w-24 h-24 text-purple-400 mx-auto mb-6 animate-pulse" />
                        <h3 className="text-3xl font-bold text-white mb-4">
                            Seu Império Aguarda
                        </h3>
                        <p className="text-purple-200 text-lg mb-8">
                            Crie sua primeira unidade para começar a construir seu império
                        </p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold px-8 py-4 rounded-lg transition-all inline-flex items-center gap-2"
                        >
                            <Plus className="w-6 h-6" />
                            Criar Primeira Unidade
                        </button>
                    </div>
                )}
            </div>

            {/* Create Clinic Modal */}
            <CreateClinicModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={() => {
                    setShowCreateModal(false);
                    loadClinics();
                }}
            />
        </div>
    );
}
