import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings as SettingsIcon, Building2, Trophy, Users, Zap, Save, Loader2, Edit2, Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const Settings: React.FC = () => {
    const navigate = useNavigate();
    const { profile } = useAuth();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'clinic' | 'gamification' | 'users' | 'integrations'>('clinic');

    const [clinicData, setClinicData] = useState({
        name: '',
        cnpj: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        state: ''
    });

    const [gamificationRules, setGamificationRules] = useState({
        xp_appointment_completed: 10,
        xp_budget_approved: 50,
        xp_patient_referral: 100,
        xp_review_received: 25
    });

    const [users, setUsers] = useState<any[]>([]);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);

            // Load clinic data
            const { data: clinicInfo, error: clinicError } = await supabase
                .from('clinics')
                .select('*')
                .eq('id', profile?.clinic_id)
                .single();

            if (clinicError) throw clinicError;

            setClinicData({
                name: clinicInfo.name || '',
                cnpj: clinicInfo.cnpj || '',
                phone: clinicInfo.phone || '',
                email: clinicInfo.email || '',
                address: clinicInfo.address || '',
                city: clinicInfo.city || '',
                state: clinicInfo.state || ''
            });

            // Load gamification rules
            const { data: gamifData } = await supabase
                .from('gamification_rules')
                .select('*')
                .eq('clinic_id', profile?.clinic_id)
                .single();

            if (gamifData) {
                setGamificationRules({
                    xp_appointment_completed: gamifData.xp_appointment_completed || 10,
                    xp_budget_approved: gamifData.xp_budget_approved || 50,
                    xp_patient_referral: gamifData.xp_patient_referral || 100,
                    xp_review_received: gamifData.xp_review_received || 25
                });
            }

            // Load users
            const { data: usersData } = await supabase
                .from('users')
                .select('id, name, email, role, is_active')
                .eq('clinic_id', profile?.clinic_id)
                .order('name');

            setUsers(usersData || []);
        } catch (error) {
            console.error('Erro ao carregar configurações:', error);
            toast.error('Erro ao carregar configurações');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveClinic = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const { error } = await supabase
                .from('clinics')
                .update({
                    name: clinicData.name,
                    cnpj: clinicData.cnpj,
                    phone: clinicData.phone,
                    email: clinicData.email,
                    address: clinicData.address,
                    city: clinicData.city,
                    state: clinicData.state,
                    updated_at: new Date().toISOString()
                })
                .eq('id', profile?.clinic_id);

            if (error) throw error;
            toast.success('Dados da clínica atualizados!');
        } catch (error: any) {
            console.error('Erro ao salvar:', error);
            toast.error(error.message || 'Erro ao salvar');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveGamification = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const { error } = await supabase
                .from('gamification_rules')
                .upsert({
                    clinic_id: profile?.clinic_id,
                    ...gamificationRules,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;
            toast.success('Regras de gamificação atualizadas!');
        } catch (error: any) {
            console.error('Erro ao salvar:', error);
            toast.error(error.message || 'Erro ao salvar');
        } finally {
            setSaving(false);
        }
    };

    const getRoleLabel = (role: string) => {
        const roles: Record<string, string> = {
            'MASTER': 'Master',
            'ADMIN': 'Administrador',
            'PROFESSIONAL': 'Profissional',
            'CRC': 'Coord. Comercial',
            'RECEPTIONIST': 'Recepcionista'
        };
        return roles[role] || role;
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
                <Loader2 className="w-12 h-12 text-violet-600 animate-spin mb-4" />
                <p className="text-slate-500 font-medium">Carregando configurações...</p>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 max-w-[1600px] mx-auto bg-slate-50 min-h-screen">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
                    <SettingsIcon className="text-slate-600" size={32} />
                    Configurações
                </h1>
                <p className="text-slate-500 mt-2">Gerencie as configurações da clínica</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Left Sidebar - Tabs */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sticky top-6 space-y-2">
                        <button
                            onClick={() => setActiveTab('clinic')}
                            className={`w-full px-4 py-3 rounded-lg text-left text-sm font-medium transition-colors flex items-center gap-3 ${activeTab === 'clinic'
                                    ? 'bg-violet-50 text-violet-700'
                                    : 'text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            <Building2 size={18} />
                            Minha Clínica
                        </button>
                        <button
                            onClick={() => setActiveTab('gamification')}
                            className={`w-full px-4 py-3 rounded-lg text-left text-sm font-medium transition-colors flex items-center gap-3 ${activeTab === 'gamification'
                                    ? 'bg-violet-50 text-violet-700'
                                    : 'text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            <Trophy size={18} />
                            Gamificação
                        </button>
                        <button
                            onClick={() => setActiveTab('users')}
                            className={`w-full px-4 py-3 rounded-lg text-left text-sm font-medium transition-colors flex items-center gap-3 ${activeTab === 'users'
                                    ? 'bg-violet-50 text-violet-700'
                                    : 'text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            <Users size={18} />
                            Usuários
                        </button>
                        <button
                            onClick={() => setActiveTab('integrations')}
                            className={`w-full px-4 py-3 rounded-lg text-left text-sm font-medium transition-colors flex items-center gap-3 ${activeTab === 'integrations'
                                    ? 'bg-violet-50 text-violet-700'
                                    : 'text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            <Zap size={18} />
                            Integrações
                        </button>
                    </div>
                </div>

                {/* Right Content */}
                <div className="lg:col-span-3">
                    {/* Clinic Tab */}
                    {activeTab === 'clinic' && (
                        <form onSubmit={handleSaveClinic} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
                            <h3 className="text-lg font-bold text-slate-800">Dados da Clínica</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Nome da Clínica</label>
                                    <input
                                        type="text"
                                        required
                                        value={clinicData.name}
                                        onChange={(e) => setClinicData({ ...clinicData, name: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">CNPJ</label>
                                    <input
                                        type="text"
                                        value={clinicData.cnpj}
                                        onChange={(e) => setClinicData({ ...clinicData, cnpj: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                                        placeholder="00.000.000/0000-00"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Telefone</label>
                                    <input
                                        type="tel"
                                        value={clinicData.phone}
                                        onChange={(e) => setClinicData({ ...clinicData, phone: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                                        placeholder="(00) 00000-0000"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-slate-700 mb-2">E-mail</label>
                                    <input
                                        type="email"
                                        value={clinicData.email}
                                        onChange={(e) => setClinicData({ ...clinicData, email: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Endereço</label>
                                    <input
                                        type="text"
                                        value={clinicData.address}
                                        onChange={(e) => setClinicData({ ...clinicData, address: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Cidade</label>
                                    <input
                                        type="text"
                                        value={clinicData.city}
                                        onChange={(e) => setClinicData({ ...clinicData, city: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Estado</label>
                                    <input
                                        type="text"
                                        value={clinicData.state}
                                        onChange={(e) => setClinicData({ ...clinicData, state: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                                        placeholder="UF"
                                        maxLength={2}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors font-medium shadow-sm flex items-center gap-2 disabled:opacity-50"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            Salvando...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={18} />
                                            Salvar Alterações
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Gamification Tab */}
                    {activeTab === 'gamification' && (
                        <form onSubmit={handleSaveGamification} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 mb-2">Regras de Gamificação</h3>
                                <p className="text-sm text-slate-500">Configure os pontos de XP para cada ação</p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                                    <div>
                                        <p className="font-medium text-slate-800">Atendimento Concluído</p>
                                        <p className="text-xs text-slate-500">XP ganho ao completar um atendimento</p>
                                    </div>
                                    <input
                                        type="number"
                                        min="0"
                                        value={gamificationRules.xp_appointment_completed}
                                        onChange={(e) => setGamificationRules({ ...gamificationRules, xp_appointment_completed: parseInt(e.target.value) })}
                                        className="w-24 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-center font-bold"
                                    />
                                </div>

                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                                    <div>
                                        <p className="font-medium text-slate-800">Orçamento Aprovado</p>
                                        <p className="text-xs text-slate-500">XP ganho quando um orçamento é aprovado</p>
                                    </div>
                                    <input
                                        type="number"
                                        min="0"
                                        value={gamificationRules.xp_budget_approved}
                                        onChange={(e) => setGamificationRules({ ...gamificationRules, xp_budget_approved: parseInt(e.target.value) })}
                                        className="w-24 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-center font-bold"
                                    />
                                </div>

                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                                    <div>
                                        <p className="font-medium text-slate-800">Indicação de Paciente</p>
                                        <p className="text-xs text-slate-500">XP ganho por indicação bem-sucedida</p>
                                    </div>
                                    <input
                                        type="number"
                                        min="0"
                                        value={gamificationRules.xp_patient_referral}
                                        onChange={(e) => setGamificationRules({ ...gamificationRules, xp_patient_referral: parseInt(e.target.value) })}
                                        className="w-24 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-center font-bold"
                                    />
                                </div>

                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                                    <div>
                                        <p className="font-medium text-slate-800">Avaliação Recebida</p>
                                        <p className="text-xs text-slate-500">XP ganho por avaliação positiva</p>
                                    </div>
                                    <input
                                        type="number"
                                        min="0"
                                        value={gamificationRules.xp_review_received}
                                        onChange={(e) => setGamificationRules({ ...gamificationRules, xp_review_received: parseInt(e.target.value) })}
                                        className="w-24 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-center font-bold"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors font-medium shadow-sm flex items-center gap-2 disabled:opacity-50"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            Salvando...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={18} />
                                            Salvar Regras
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Users Tab */}
                    {activeTab === 'users' && (
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-slate-800">Usuários da Clínica</h3>
                                <button className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors font-medium text-sm">
                                    <Plus size={16} />
                                    Novo Usuário
                                </button>
                            </div>

                            <div className="space-y-3">
                                {users.map(user => (
                                    <div key={user.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                                        <div>
                                            <p className="font-medium text-slate-800">{user.name}</p>
                                            <p className="text-xs text-slate-500">{user.email}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="px-3 py-1 bg-violet-50 text-violet-700 rounded-full text-xs font-bold">
                                                {getRoleLabel(user.role)}
                                            </span>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${user.is_active ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'
                                                }`}>
                                                {user.is_active ? 'Ativo' : 'Inativo'}
                                            </span>
                                            <button className="p-2 hover:bg-white rounded-lg transition-colors">
                                                <Edit2 size={16} className="text-slate-400" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Integrations Tab */}
                    {activeTab === 'integrations' && (
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                            <h3 className="text-lg font-bold text-slate-800 mb-4">Integrações</h3>
                            <div className="text-center py-12">
                                <Zap size={48} className="mx-auto mb-4 text-slate-300" />
                                <p className="text-slate-500">Integrações em breve</p>
                                <p className="text-xs text-slate-400 mt-2">WhatsApp, SMS, E-mail Marketing</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Settings;
