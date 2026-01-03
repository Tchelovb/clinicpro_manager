import React, { useState } from 'react';
import { X, Building2, Loader, CheckCircle } from 'lucide-react';
import { supabase } from '../src/lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface CreateClinicModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const CreateClinicModal: React.FC<CreateClinicModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const { profile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        code: '',
        email: '',
        phone: '',
        environment: 'PRODUCTION' as 'PRODUCTION' | 'SIMULATION'
    });

    // Auto-gerar código baseado no nome
    const handleNameChange = (name: string) => {
        setFormData(prev => ({
            ...prev,
            name,
            code: name
                .toUpperCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '') // Remove acentos
                .replace(/[^A-Z0-9\s]/g, '') // Remove caracteres especiais
                .replace(/\s+/g, '-') // Substitui espaços por hífen
                .substring(0, 20) // Limita tamanho
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!profile?.id) {
            alert('Erro: Usuário não autenticado');
            return;
        }

        setLoading(true);

        try {
            // 1. Criar a clínica
            const { data: newClinic, error: clinicError } = await supabase
                .from('clinics')
                .insert({
                    name: formData.name,
                    code: formData.code,
                    email: formData.email,
                    phone: formData.phone,
                    active: true,
                    environment: formData.environment
                })
                .select()
                .single();

            if (clinicError) throw clinicError;

            // 2. Vincular Master à nova clínica
            // Criar usuário Master na nova clínica
            const { error: userError } = await supabase
                .from('users')
                .insert({
                    clinic_id: newClinic.id,
                    email: profile.email,
                    name: profile.name,
                    role: 'ADMIN', // Master vira Admin na nova clínica
                    active: true
                });

            if (userError && userError.code !== '23505') { // Ignora erro de duplicação
                console.warn('Aviso ao vincular Master:', userError);
            }

            // 3. Criar procedimentos básicos (opcional)
            const basicProcedures = [
                { name: 'Consulta de Avaliação', category: 'CONSULTA', price: 150, is_recurring: false },
                { name: 'Limpeza Dental', category: 'PREVENTIVA', price: 200, is_recurring: true, recurrence_period_days: 180 }
            ];

            await supabase
                .from('procedures')
                .insert(
                    basicProcedures.map(proc => ({
                        clinic_id: newClinic.id,
                        ...proc
                    }))
                );

            // Sucesso!
            setSuccess(true);
            setTimeout(() => {
                onSuccess();
                onClose();
                setSuccess(false);
                setFormData({
                    name: '',
                    code: '',
                    email: '',
                    phone: '',
                    environment: 'PRODUCTION'
                });
            }, 2000);

        } catch (error: any) {
            console.error('Erro ao criar clínica:', error);
            alert(`Erro ao criar clínica: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl border-2 border-purple-500/50 max-w-2xl w-full">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-purple-600 rounded-lg">
                            <Building2 size={24} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">Nova Unidade</h2>
                            <p className="text-gray-400 text-sm">Criar nova clínica no sistema</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                        disabled={loading}
                    >
                        <X size={24} className="text-gray-400" />
                    </button>
                </div>

                {/* Success State */}
                {success && (
                    <div className="p-8 text-center">
                        <CheckCircle size={64} className="mx-auto text-green-500 mb-4 animate-bounce" />
                        <h3 className="text-2xl font-bold text-white mb-2">Clínica Criada!</h3>
                        <p className="text-gray-400">Redirecionando...</p>
                    </div>
                )}

                {/* Form */}
                {!success && (
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Nome da Unidade */}
                        <div>
                            <label className="block text-white font-medium mb-2">
                                Nome da Unidade *
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => handleNameChange(e.target.value)}
                                placeholder="Ex: Instituto Vilas - Unidade Jardins"
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 outline-none transition-all"
                                required
                                disabled={loading}
                            />
                        </div>

                        {/* Código/Slug */}
                        <div>
                            <label className="block text-white font-medium mb-2">
                                Código da Unidade *
                            </label>
                            <input
                                type="text"
                                value={formData.code}
                                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                                placeholder="Ex: VILAS-JARDINS"
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 outline-none transition-all font-mono"
                                required
                                disabled={loading}
                            />
                            <p className="text-gray-500 text-xs mt-1">
                                Identificador único (gerado automaticamente, mas editável)
                            </p>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-white font-medium mb-2">
                                Email da Unidade *
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                placeholder="Ex: jardins@institutovilas.com.br"
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 outline-none transition-all"
                                required
                                disabled={loading}
                            />
                        </div>

                        {/* Telefone */}
                        <div>
                            <label className="block text-white font-medium mb-2">
                                Telefone
                            </label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                placeholder="(11) 3000-0000"
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 outline-none transition-all"
                                disabled={loading}
                            />
                        </div>

                        {/* Tipo de Ambiente */}
                        <div>
                            <label className="block text-white font-medium mb-3">
                                Tipo de Ambiente *
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, environment: 'PRODUCTION' }))}
                                    className={`p-4 rounded-lg border-2 transition-all ${formData.environment === 'PRODUCTION'
                                            ? 'border-green-500 bg-green-500/20'
                                            : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                                        }`}
                                    disabled={loading}
                                >
                                    <div className="text-center">
                                        <div className="text-3xl mb-2">🟢</div>
                                        <p className="text-white font-bold">Produção</p>
                                        <p className="text-gray-400 text-xs mt-1">Clínica real para atendimento</p>
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, environment: 'SIMULATION' }))}
                                    className={`p-4 rounded-lg border-2 transition-all ${formData.environment === 'SIMULATION'
                                            ? 'border-yellow-500 bg-yellow-500/20'
                                            : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                                        }`}
                                    disabled={loading}
                                >
                                    <div className="text-center">
                                        <div className="text-3xl mb-2">🟡</div>
                                        <p className="text-white font-bold">Simulação</p>
                                        <p className="text-gray-400 text-xs mt-1">Ambiente de treinamento</p>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Botões */}
                        <div className="flex gap-4 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-bold transition-all"
                                disabled={loading}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader size={20} className="animate-spin" />
                                        Criando...
                                    </>
                                ) : (
                                    <>
                                        <Building2 size={20} />
                                        Criar Unidade
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};
