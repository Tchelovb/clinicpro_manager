import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, User, Mail, Phone, Lock, Camera, Save, Loader2, Bell, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const Profile: React.FC = () => {
    const navigate = useNavigate();
    const { profile, user } = useAuth();

    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications'>('profile');

    const [formData, setFormData] = useState({
        name: profile?.name || '',
        email: user?.email || '',
        phone: profile?.phone || '',
        role: profile?.role || ''
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const { error } = await supabase
                .from('users')
                .update({
                    name: formData.name,
                    phone: formData.phone,
                    updated_at: new Date().toISOString()
                })
                .eq('id', profile?.id);

            if (error) throw error;

            toast.success('Perfil atualizado com sucesso!');
        } catch (error: any) {
            console.error('Erro ao atualizar perfil:', error);
            toast.error(error.message || 'Erro ao atualizar perfil');
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('As senhas não coincidem');
            return;
        }

        if (passwordData.newPassword.length < 6) {
            toast.error('A senha deve ter no mínimo 6 caracteres');
            return;
        }

        setSaving(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password: passwordData.newPassword
            });

            if (error) throw error;

            toast.success('Senha alterada com sucesso!');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error: any) {
            console.error('Erro ao alterar senha:', error);
            toast.error(error.message || 'Erro ao alterar senha');
        } finally {
            setSaving(false);
        }
    };

    const getRoleLabel = (role: string) => {
        const roles: Record<string, string> = {
            'MASTER': 'Master (Holding)',
            'ADMIN': 'Administrador',
            'PROFESSIONAL': 'Profissional',
            'CRC': 'Coordenador Comercial',
            'RECEPTIONIST': 'Recepcionista'
        };
        return roles[role] || role;
    };

    return (
        <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                    <ChevronLeft size={24} className="text-slate-400" />
                </button>
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
                        <User className="text-violet-600" size={32} />
                        Meu Perfil
                    </h1>
                    <p className="text-slate-500 mt-2">Gerencie suas informações pessoais e preferências</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Left Sidebar - Profile Card */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sticky top-6">
                        <div className="flex flex-col items-center text-center">
                            <div className="relative mb-4">
                                <div className="w-24 h-24 bg-violet-100 rounded-full flex items-center justify-center">
                                    <User className="text-violet-600" size={40} />
                                </div>
                                <button className="absolute bottom-0 right-0 p-2 bg-violet-600 text-white rounded-full hover:bg-violet-700 transition-colors shadow-lg">
                                    <Camera size={16} />
                                </button>
                            </div>

                            <h3 className="font-bold text-slate-800 text-lg">{profile?.name}</h3>
                            <p className="text-sm text-slate-500 mb-1">{user?.email}</p>
                            <span className="inline-block px-3 py-1 bg-violet-50 text-violet-700 rounded-full text-xs font-bold mt-2">
                                {getRoleLabel(profile?.role || '')}
                            </span>
                        </div>

                        <div className="mt-6 pt-6 border-t border-slate-100 space-y-2">
                            <button
                                onClick={() => setActiveTab('profile')}
                                className={`w-full px-4 py-2 rounded-lg text-left text-sm font-medium transition-colors ${activeTab === 'profile'
                                        ? 'bg-violet-50 text-violet-700'
                                        : 'text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                <User size={16} className="inline mr-2" />
                                Dados Pessoais
                            </button>
                            <button
                                onClick={() => setActiveTab('security')}
                                className={`w-full px-4 py-2 rounded-lg text-left text-sm font-medium transition-colors ${activeTab === 'security'
                                        ? 'bg-violet-50 text-violet-700'
                                        : 'text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                <Shield size={16} className="inline mr-2" />
                                Segurança
                            </button>
                            <button
                                onClick={() => setActiveTab('notifications')}
                                className={`w-full px-4 py-2 rounded-lg text-left text-sm font-medium transition-colors ${activeTab === 'notifications'
                                        ? 'bg-violet-50 text-violet-700'
                                        : 'text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                <Bell size={16} className="inline mr-2" />
                                Notificações
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Content */}
                <div className="lg:col-span-3">
                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                        <form onSubmit={handleUpdateProfile} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
                            <h3 className="text-lg font-bold text-slate-800">Dados Pessoais</h3>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    <User size={16} className="inline mr-2" />
                                    Nome Completo
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    <Mail size={16} className="inline mr-2" />
                                    E-mail
                                </label>
                                <input
                                    type="email"
                                    disabled
                                    value={formData.email}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed"
                                />
                                <p className="text-xs text-slate-500 mt-1">O e-mail não pode ser alterado</p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    <Phone size={16} className="inline mr-2" />
                                    Telefone
                                </label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                                    placeholder="(00) 00000-0000"
                                />
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => navigate('/dashboard')}
                                    disabled={saving}
                                    className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors font-medium disabled:opacity-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors font-medium shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
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

                    {/* Security Tab */}
                    {activeTab === 'security' && (
                        <form onSubmit={handleChangePassword} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
                            <h3 className="text-lg font-bold text-slate-800">Alterar Senha</h3>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    <Lock size={16} className="inline mr-2" />
                                    Nova Senha
                                </label>
                                <input
                                    type="password"
                                    required
                                    value={passwordData.newPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                                    placeholder="Mínimo 6 caracteres"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    <Lock size={16} className="inline mr-2" />
                                    Confirmar Nova Senha
                                </label>
                                <input
                                    type="password"
                                    required
                                    value={passwordData.confirmPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                                    placeholder="Digite a senha novamente"
                                />
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })}
                                    disabled={saving}
                                    className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors font-medium disabled:opacity-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors font-medium shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            Alterando...
                                        </>
                                    ) : (
                                        <>
                                            <Lock size={18} />
                                            Alterar Senha
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Notifications Tab */}
                    {activeTab === 'notifications' && (
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                            <h3 className="text-lg font-bold text-slate-800 mb-4">Preferências de Notificação</h3>
                            <div className="text-center py-12">
                                <Bell size={48} className="mx-auto mb-4 text-slate-300" />
                                <p className="text-slate-500">Configurações de notificação em breve</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;
