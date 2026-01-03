import React, { useState, useEffect } from 'react';
import { BaseSheet } from '../ui/BaseSheet';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';
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
    const { clinicId, user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'profile' | 'permissions' | 'security'>('overview');

    // Data States
    const [userData, setUserData] = useState<any>(null);
    const [permissions, setPermissions] = useState<any>({});

    // Form States - COMPLETO conforme schema
    const [formData, setFormData] = useState({
        // Dados Básicos
        name: '',
        email: '',
        role: '',
        active: true,

        // Contato
        cpf: '',
        phone: '',

        // Profissional
        specialty: '',
        council_number: '', // CRO
        council: 'CRO',
        gender: 'M',

        // Visual
        color: '#3B82F6',
        photo_url: '',

        // Flags de Tipo
        is_clinical_provider: false,
        is_sales_rep: false,
        is_orcamentista: false,

        // Financeiro
        commission_percent: 30,
        sales_commission_percent: 0,
        collection_percent: 0,
        payment_release_rule: 'FULL_ON_COMPLETION'
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

            console.log('🔍 [FETCH] Carregando dados do membro...');
            console.log('📋 [FETCH] User ID:', userId);
            console.log('🏥 [FETCH] Clinic ID:', clinicId);

            // 1. Fetch User Base Data
            const { data: user, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .eq('clinic_id', clinicId)
                .single();

            if (userError) {
                console.error('❌ [FETCH] Erro ao buscar user:', userError);
                throw userError;
            }

            console.log('✅ [FETCH] User encontrado:', user);

            // 2. Fetch Professional Data (se existir)
            // ✅ UNIFICAÇÃO: users.id = professionals.id
            const { data: professional, error: profError } = await supabase
                .from('professionals')
                .select('*')
                .eq('id', userId)  // ✅ MESMO ID
                .maybeSingle();

            if (profError) {
                console.error('⚠️ [FETCH] Erro ao buscar professional:', profError);
            } else if (professional) {
                console.log('✅ [FETCH] Professional encontrado:', professional);
            } else {
                console.log('ℹ️ [FETCH] Nenhum registro em professionals (usuário não é clínico)');
            }

            // 3. Fetch Permissions
            const { data: perms } = await supabase
                .from('user_permissions')
                .select('*')
                .eq('user_id', userId)
                .maybeSingle();

            console.log('✅ [FETCH] Permissões:', perms || 'Nenhuma');

            setUserData({ ...user, professional });  // Combinar dados
            setPermissions(perms || {}); // Default empty if none found

            // 4. Populate Form - COMPLETO
            // ✅ PRIORIDADE: Dados de 'users' sobrescrevem 'professionals'
            setFormData({
                // Dados Básicos
                name: user.name || '',
                email: user.email || '',
                role: user.role || '',
                active: user.active !== undefined ? user.active : true,

                // Contato
                cpf: user.cpf || professional?.cpf || '',
                phone: user.phone || '',

                // Profissional
                specialty: user.specialty || professional?.specialty || '',
                council_number: user.cro || professional?.crc || '',
                council: user.council || 'CRO',
                gender: user.gender || 'M',

                // Visual
                color: user.agenda_color || professional?.color || '#3B82F6',
                photo_url: user.photo_url || professional?.photo_url || '',

                // Flags de Tipo
                is_clinical_provider: user.is_clinical_provider || false,
                is_sales_rep: user.is_sales_rep || false,
                is_orcamentista: user.is_orcamentista || false,

                // Financeiro
                commission_percent: user.commission_percent !== undefined ? user.commission_percent : 30,
                sales_commission_percent: user.sales_commission_percent || 0,
                collection_percent: user.collection_percent || 0,
                payment_release_rule: user.payment_release_rule || 'FULL_ON_COMPLETION'
            });

            console.log('✅ [FETCH] Formulário populado com sucesso');

        } catch (error) {
            console.error('❌ [FETCH] Erro fatal ao carregar membro:', error);
            toast.error('Erro ao carregar dados do usuário');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        try {
            setLoading(true);

            // ✅ CORREÇÃO: Usar clinic_id do usuário logado (não hardcoded)
            const clinic_id = user?.clinic_id;

            if (!clinic_id) {
                throw new Error('Clinic ID não encontrado. Faça login novamente.');
            }

            console.log('🔄 [SAVE] Iniciando salvamento atômico...');
            console.log('📋 [SAVE] User ID:', userId);
            console.log('🏥 [SAVE] Clinic ID:', clinic_id);

            // ✅ OPERAÇÃO 1: UPDATE em users (SEMPRE)
            const usersPayload = {
                // Dados Básicos
                name: formData.name,
                role: formData.role,
                active: formData.active,

                // Contato
                cpf: formData.cpf,
                phone: formData.phone,

                // Profissional
                specialty: formData.specialty,
                cro: formData.council_number,
                council: formData.council,
                gender: formData.gender,

                // Visual
                agenda_color: formData.color,
                photo_url: formData.photo_url,

                // Flags de Tipo
                is_clinical_provider: formData.is_clinical_provider,
                is_sales_rep: formData.is_sales_rep,
                is_orcamentista: formData.is_orcamentista,

                // Financeiro
                commission_percent: formData.commission_percent,
                sales_commission_percent: formData.sales_commission_percent,
                collection_percent: formData.collection_percent,
                payment_release_rule: formData.payment_release_rule,

                // Sistema
                clinic_id: clinic_id,
                updated_at: new Date().toISOString()
            };

            console.log('📦 [SAVE] Payload Users:', usersPayload);

            const { error: userError, data: updatedUser } = await supabase
                .from('users')
                .update(usersPayload)
                .eq('id', userId)
                .select()
                .single();

            if (userError) {
                console.error('❌ [SAVE] Erro ao atualizar users:', userError);
                throw userError;
            }

            console.log('✅ [SAVE] Users atualizado com sucesso:', updatedUser);

            // ✅ OPERAÇÃO 2: UPSERT em professionals (SE for profissional clínico)
            if (formData.is_clinical_provider) {
                const professionalsPayload = {
                    id: userId,  // ✅ MESMO ID (FK garante integridade)
                    clinic_id: clinic_id,
                    name: formData.name,
                    specialty: formData.specialty,
                    crc: formData.council_number,
                    council: formData.council,
                    color: formData.color,
                    photo_url: formData.photo_url,
                    is_active: formData.active,
                    payment_release_rule: formData.payment_release_rule,
                    active: formData.active  // Alguns schemas usam 'active' ao invés de 'is_active'
                };

                console.log('📦 [SAVE] Payload Professionals:', professionalsPayload);

                const { error: profError, data: updatedProf } = await supabase
                    .from('professionals')
                    .upsert(professionalsPayload, {
                        onConflict: 'id'  // ✅ Atualiza se já existir
                    })
                    .select()
                    .single();

                if (profError) {
                    console.error('⚠️ [SAVE] Erro ao atualizar professionals:', profError);
                    // Não falha a operação inteira, pois users já foi salvo
                    toast.error('Dados salvos em users, mas erro em professionals: ' + profError.message);
                } else {
                    console.log('✅ [SAVE] Professionals atualizado com sucesso:', updatedProf);
                }
            } else {
                console.log('ℹ️ [SAVE] Usuário não é profissional clínico, pulando professionals');
            }

            console.log('🎉 [SAVE] Salvamento atômico concluído com sucesso!');
            toast.success('Perfil atualizado com sucesso!');

            // Recarregar dados para garantir sincronia
            await fetchMemberData();

            onSuccess();
        } catch (error: any) {
            console.error('❌ [SAVE] Erro fatal ao salvar perfil:', error);
            toast.error(error.message || 'Erro ao salvar perfil');
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
                            <div>
                                <label className="block text-sm font-medium text-slate-700">CPF</label>
                                <input
                                    type="text"
                                    value={formData.cpf}
                                    onChange={e => setFormData({ ...formData, cpf: e.target.value })}
                                    placeholder="000.000.000-00"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Gênero</label>
                                <select
                                    value={formData.gender}
                                    onChange={e => setFormData({ ...formData, gender: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                >
                                    <option value="M">Masculino</option>
                                    <option value="F">Feminino</option>
                                </select>
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

                                {/* Checkboxes de Tipo */}
                                <div className="col-span-2 space-y-2">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_clinical_provider}
                                            onChange={e => setFormData({ ...formData, is_clinical_provider: e.target.checked })}
                                            className="rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-xs text-blue-700">É Profissional Clínico (aparece na agenda)</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_sales_rep}
                                            onChange={e => setFormData({ ...formData, is_sales_rep: e.target.checked })}
                                            className="rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-xs text-blue-700">É Vendedor (recebe comissão de vendas)</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_orcamentista}
                                            onChange={e => setFormData({ ...formData, is_orcamentista: e.target.checked })}
                                            className="rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-xs text-blue-700">É Orçamentista</span>
                                    </label>
                                </div>

                                {/* Configurações Financeiras */}
                                <div className="col-span-2 border-t border-blue-200 pt-3 mt-2">
                                    <p className="text-xs font-bold text-blue-800 mb-2">Configurações Financeiras</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-blue-700">Comissão (%)</label>
                                            <input
                                                type="number"
                                                value={formData.commission_percent}
                                                onChange={e => setFormData({ ...formData, commission_percent: parseFloat(e.target.value) || 0 })}
                                                min="0"
                                                max="100"
                                                step="0.1"
                                                className="mt-1 block w-full rounded-md border-blue-200 focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-blue-700">Comissão Vendas (%)</label>
                                            <input
                                                type="number"
                                                value={formData.sales_commission_percent}
                                                onChange={e => setFormData({ ...formData, sales_commission_percent: parseFloat(e.target.value) || 0 })}
                                                min="0"
                                                max="100"
                                                step="0.1"
                                                className="mt-1 block w-full rounded-md border-blue-200 focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-xs font-medium text-blue-700">Regra de Pagamento</label>
                                            <select
                                                value={formData.payment_release_rule}
                                                onChange={e => setFormData({ ...formData, payment_release_rule: e.target.value })}
                                                className="mt-1 block w-full rounded-md border-blue-200 focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                            >
                                                <option value="FULL_ON_COMPLETION">Integral ao Completar</option>
                                                <option value="PROPORTIONAL_TO_PAYMENT">Proporcional ao Recebimento</option>
                                            </select>
                                        </div>
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
