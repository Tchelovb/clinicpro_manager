import React, { useState, useEffect } from 'react';
import { BaseSheet } from '../ui/BaseSheet';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import {
    User, Shield, Lock, Activity,
    Save, Key, AlertTriangle, LogOut, Verified
} from 'lucide-react';

interface TeamMemberSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    userId: string | null;
    onSuccess: () => void;
}

const TeamMemberSheet: React.FC<TeamMemberSheetProps> = ({ open, onOpenChange, userId, onSuccess }) => {
    const { clinicId, profile: currentUserProfile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'profile' | 'permissions' | 'security'>('overview');

    // Data States
    const [userData, setUserData] = useState<any>(null);
    const [permissions, setPermissions] = useState<any>({});

    // Form States
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: '',
        active: true,
        cpf: '',
        phone: '',
        specialty: '',
        council_number: '', // CRO
        color: '#3B82F6'
    });

    useEffect(() => {
        if (open && userId && clinicId) {
            fetchMemberData();
        } else {
            // Reset forms on close
            setUserData(null);
            setPermissions({});
        }
    }, [open, userId, clinicId]);

    const fetchMemberData = async () => {
        try {
            setLoading(true);

            // 1. Fetch User Base Data
            const { data: user, error: userError } = await supabase
                .from('users')
                .select(`
          *,
          professionals:professional_id (*)
        `)
                .eq('id', userId)
                .eq('clinic_id', clinicId)
                .single();

            if (userError) throw userError;

            // 2. Fetch Permissions
            const { data: perms } = await supabase
                .from('user_permissions')
                .select('*')
                .eq('user_id', userId)
                .maybeSingle();

            setUserData(user);
            setPermissions(perms || {}); // Default empty if none found

            // 3. Populate Form
            setFormData({
                name: user.name,
                email: user.email,
                role: user.role,
                active: user.active,
                cpf: user.professionals?.cpf || '',
                phone: user.phone || '',
                specialty: user.professionals?.specialty || '',
                council_number: user.professionals?.crc || '',
                color: user.color || '#3B82F6'
            });

        } catch (error) {
            console.error('Error loading member:', error);
            toast.error('Erro ao carregar dados do usuário');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        try {
            setLoading(true);

            // Update User Table
            const { error: userError } = await supabase
                .from('users')
                .update({
                    name: formData.name,
                    role: formData.role,
                    active: formData.active,
                    phone: formData.phone,
                    color: formData.color
                })
                .eq('id', userId);

            if (userError) throw userError;

            // Update Professional Table (if applicable)
            if (formData.role === 'PROFESSIONAL' && userData.professional_id) {
                await supabase
                    .from('professionals')
                    .update({
                        specialty: formData.specialty,
                        crc: formData.council_number
                    })
                    .eq('id', userData.professional_id);
            } else if (formData.role === 'PROFESSIONAL' && !userData.professional_id) {
                // Create professional record if missing (advanced logic omitted for brevity, handled in backend usually)
                toast('Atenção: Vínculo profissional deve ser criado na admissão.');
            }

            toast.success('Perfil atualizado!');
            onSuccess();
        } catch (error) {
            toast.error('Erro ao salvar perfil');
        } finally {
            setLoading(false);
        }
    };

    const handleTogglePermission = async (key: string) => {
        // Optimistic Update
        const newVal = !permissions[key];
        setPermissions({ ...permissions, [key]: newVal });

        try {
            const { error } = await supabase
                .from('user_permissions')
                .upsert({
                    user_id: userId,
                    [key]: newVal,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id' });

            if (error) throw error;
            toast.success(`Permissão ${newVal ? 'concedida' : 'removida'}`);
        } catch (error) {
            // Revert on error
            setPermissions({ ...permissions, [key]: !newVal });
            toast.error('Erro ao atualizar permissão');
        }
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                                <p className="text-sm text-slate-500">Cadastrado em</p>
                                <p className="text-lg font-medium text-slate-900">
                                    {userData?.created_at ? new Date(userData.created_at).toLocaleDateString() : '-'}
                                </p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                                <p className="text-sm text-slate-500">Último Login</p>
                                <p className="text-lg font-medium text-slate-900">-</p>
                            </div>
                        </div>
                        {/* Stats placeholder */}
                        <div className="p-4 border border-dashed border-slate-300 rounded-lg text-center text-slate-500">
                            Gráficos de Performance (Vendas/Atendimentos) virão aqui.
                        </div>
                    </div>
                );

            case 'profile':
                return (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-slate-700">Nome Completo</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Cargo (Role)</label>
                                <select
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                >
                                    <option value="ADMIN">Administrador</option>
                                    <option value="PROFESSIONAL">Dentista/Profissional</option>
                                    <option value="SECRETARY">Secretária</option>
                                    <option value="MASTER">Master (Dono)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Telefone</label>
                                <input
                                    type="text"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                />
                            </div>
                        </div>

                        {formData.role === 'PROFESSIONAL' && (
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 grid grid-cols-2 gap-4">
                                <div className="col-span-2 text-sm font-bold text-blue-800 flex items-center gap-2">
                                    <Verified size={16} /> Dados Profissionais
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-blue-700">CRO (Conselho)</label>
                                    <input
                                        type="text"
                                        value={formData.council_number}
                                        onChange={e => setFormData({ ...formData, council_number: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-blue-200 focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-blue-700">Especialidade</label>
                                    <input
                                        type="text"
                                        value={formData.specialty}
                                        onChange={e => setFormData({ ...formData, specialty: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-blue-200 focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-medium text-blue-700">Cor na Agenda</label>
                                    <div className="flex gap-2 mt-1">
                                        {['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'].map(c => (
                                            <button
                                                key={c}
                                                onClick={() => setFormData({ ...formData, color: c })}
                                                className={`w-8 h-8 rounded-full border-2 ${formData.color === c ? 'border-slate-600 scale-110' : 'border-transparent'}`}
                                                style={{ backgroundColor: c }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={handleSaveProfile}
                            className="w-full flex justify-center items-center gap-2 bg-slate-900 text-white py-2 px-4 rounded-lg hover:bg-slate-800 transition-colors"
                        >
                            <Save size={18} /> Salvar Alterações
                        </button>
                    </div>
                );

            case 'permissions':
                return (
                    <div className="space-y-4">
                        <InfoBanner text="Permissões são salvas automaticamente ao alterar." />

                        <div className="space-y-2">
                            {[
                                { key: 'can_view_financial', label: 'Ver Financeiro Completo' },
                                { key: 'can_give_discount', label: 'Conceder Descontos' },
                                { key: 'can_delete_patient', label: 'Deletar Pacientes' },
                                { key: 'can_view_crm', label: 'Acessar CRM' },
                                { key: 'can_access_settings', label: 'Acessar Configurações' }
                            ].map(perm => (
                                <div key={perm.key} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg">
                                    <span className="text-sm font-medium text-slate-700">{perm.label}</span>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={!!permissions[perm.key]}
                                            onChange={() => handleTogglePermission(perm.key)}
                                        />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'security':
                return (
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <h3 className="text-sm font-medium text-slate-900">Credenciais</h3>
                            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-center justify-between">
                                <div className="flex gap-3">
                                    <AlertTriangle className="text-orange-500" />
                                    <div>
                                        <p className="text-sm font-bold text-orange-800">Forçar Reset de Senha</p>
                                        <p className="text-xs text-orange-600">O usuário receberá um email.</p>
                                    </div>
                                </div>
                                <button className="px-3 py-1 bg-white border border-orange-300 text-orange-700 text-xs font-bold rounded shadow-sm">
                                    Enviar
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h3 className="text-sm font-medium text-slate-900">Sessão</h3>
                            <button className="w-full flex items-center justify-center gap-2 p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors">
                                <LogOut size={18} /> Forçar Logout de Todos os Dispositivos
                            </button>
                        </div>

                        <div className="space-y-3">
                            <h3 className="text-sm font-medium text-slate-900">Segurança Financeira (PIN)</h3>
                            <div className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <Key size={16} /> PIN Financeiro
                                </div>
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Ativo</span>
                            </div>
                        </div>
                    </div>
                );
        }
    };

    if (!open) return null;

    return (
        <BaseSheet
            open={open}
            onOpenChange={onOpenChange}
            title={userData?.name || 'Carregando...'}
            description={userData?.email}
            size="lg"
            footer={null} // Custom footer inside tabs if needed
        >
            <div className="flex flex-col h-full">
                {/* Tabs Header */}
                <div className="flex border-b border-slate-200 mb-6">
                    <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={Activity} label="Visão Geral" />
                    <TabButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={User} label="Dados" />
                    <TabButton active={activeTab === 'permissions'} onClick={() => setActiveTab('permissions')} icon={Shield} label="Permissões" />
                    <TabButton active={activeTab === 'security'} onClick={() => setActiveTab('security')} icon={Lock} label="Segurança" />
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto pb-20">
                    {loading && !userData ? (
                        <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
                    ) : (
                        renderTabContent()
                    )}
                </div>
            </div>
        </BaseSheet>
    );
};

const TabButton = ({ active, onClick, icon: Icon, label }: any) => (
    <button
        onClick={onClick}
        className={`
      flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
      ${active
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}
    `}
    >
        <Icon size={16} />
        {label}
    </button>
);

const InfoBanner = ({ text }: { text: string }) => (
    <div className="bg-blue-50 text-blue-700 px-3 py-2 rounded text-xs flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
        {text}
    </div>
);

export default TeamMemberSheet;
