import React, { useEffect, useState } from 'react';
import { Shield, User, DollarSign, Calendar, Settings as SettingsIcon, Save, Trash2, AlertCircle, CheckCircle2, Plus } from 'lucide-react';
import { supabase } from '../../src/lib/supabase';
import { UserForm } from './UserForm';

interface TeamMember {
    user_id: string;
    email: string;
    role: 'admin' | 'dentist' | 'secretary';
    roles?: string[];
    can_view_financial: boolean;
    can_edit_calendar: boolean;
    can_manage_settings: boolean;
    can_delete_patient: boolean;
    can_give_discount: boolean;
    max_discount_percent: number;
    last_sign_in_at: string;
    registered_at: string;
}

export const TeamSettings: React.FC = () => {
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [showNewUserModal, setShowNewUserModal] = useState(false);

    useEffect(() => {
        loadTeam();
    }, []);

    const loadTeam = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('view_team_members')
                .select('*');

            if (error) throw error;
            setMembers(data || []);
        } catch (error: any) {
            console.error('Erro ao carregar equipe:', error);
            showMessage('error', 'Erro ao carregar equipe');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async () => {
        try {
            showMessage('success', 'Usuário criado com sucesso!');
            setShowNewUserModal(false);
            loadTeam();
        } catch (error: any) {
            console.error('Erro ao recarregar:', error);
        }
    };

    const handleUpdate = async (member: TeamMember) => {
        try {
            setSaving(member.user_id);
            const { error } = await supabase.rpc('update_user_permission', {
                target_user_id: member.user_id,
                new_role: member.role,
                view_financial: member.can_view_financial,
                edit_calendar: member.can_edit_calendar,
                manage_settings: member.can_manage_settings,
                delete_patient: member.can_delete_patient,
                give_discount: member.can_give_discount,
                max_discount: member.max_discount_percent
            });

            if (error) throw error;
            showMessage('success', `Permissões de ${member.email} atualizadas!`);
        } catch (error: any) {
            console.error('Erro ao atualizar:', error);
            showMessage('error', 'Erro ao atualizar permissões');
        } finally {
            setSaving(null);
        }
    };

    const togglePermission = (index: number, field: keyof TeamMember) => {
        const newMembers = [...members];
        // @ts-ignore
        newMembers[index][field] = !newMembers[index][field];
        setMembers(newMembers);
    };

    const updateRole = (index: number, newRole: 'admin' | 'dentist' | 'secretary') => {
        const newMembers = [...members];
        newMembers[index].role = newRole;
        setMembers(newMembers);
    };

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 5000);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6 relative">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Shield className="text-blue-600" size={28} />
                        Gestão de Equipe
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Controle quem vê o que no sistema
                    </p>
                </div>
                <button
                    onClick={() => setShowNewUserModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium shadow-sm transition-all active:scale-95"
                >
                    <Plus size={20} />
                    Novo Usuário
                </button>
            </div>

            {/* Message Alert */}
            {message && (
                <div className={`p-4 rounded-lg flex items-center gap-3 ${message.type === 'success'
                    ? 'bg-green-50 text-green-800 border border-green-200 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                    {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                    <span>{message.text}</span>
                </div>
            )}

            {/* Team Members Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium border-b border-gray-200 dark:border-gray-600">
                            <tr>
                                <th className="p-4">Usuário</th>
                                <th className="p-4">Função</th>
                                <th className="p-4 text-center">💰 Financeiro</th>
                                <th className="p-4 text-center">📅 Agenda</th>
                                <th className="p-4 text-center">⚙️ Config</th>
                                <th className="p-4 text-center">🗑️ Deletar</th>
                                <th className="p-4 text-center">💸 Desconto</th>
                                <th className="p-4 text-right">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {members.map((member, index) => (
                                <tr key={member.user_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    {/* User Info */}
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center font-semibold">
                                                {member.email.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900 dark:text-white">{member.email}</div>
                                                <div className="text-xs text-gray-400">
                                                    Último acesso: {member.last_sign_in_at ? new Date(member.last_sign_in_at).toLocaleDateString('pt-BR') : 'Nunca'}
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Role Select */}
                                    <td className="p-4">
                                        <select
                                            value={member.role}
                                            onChange={(e) => updateRole(index, e.target.value as any)}
                                            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="admin">👑 Administrador</option>
                                            <option value="dentist">🦷 Dentista</option>
                                            <option value="secretary">📋 Secretária</option>
                                        </select>
                                    </td>

                                    {/* Permission Toggles */}
                                    <td className="p-4 text-center">
                                        <button
                                            onClick={() => togglePermission(index, 'can_view_financial')}
                                            className={`p-2 rounded-full transition-all ${member.can_view_financial
                                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-300 dark:text-gray-500'
                                                }`}
                                            title="Ver Financeiro"
                                        >
                                            <DollarSign size={18} />
                                        </button>
                                    </td>

                                    <td className="p-4 text-center">
                                        <button
                                            onClick={() => togglePermission(index, 'can_edit_calendar')}
                                            className={`p-2 rounded-full transition-all ${member.can_edit_calendar
                                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-300 dark:text-gray-500'
                                                }`}
                                            title="Editar Agenda"
                                        >
                                            <Calendar size={18} />
                                        </button>
                                    </td>

                                    <td className="p-4 text-center">
                                        <button
                                            onClick={() => togglePermission(index, 'can_manage_settings')}
                                            className={`p-2 rounded-full transition-all ${member.can_manage_settings
                                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-300 dark:text-gray-500'
                                                }`}
                                            title="Gerenciar Configurações"
                                        >
                                            <SettingsIcon size={18} />
                                        </button>
                                    </td>

                                    <td className="p-4 text-center">
                                        <button
                                            onClick={() => togglePermission(index, 'can_delete_patient')}
                                            className={`p-2 rounded-full transition-all ${member.can_delete_patient
                                                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-300 dark:text-gray-500'
                                                }`}
                                            title="Deletar Pacientes"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>

                                    <td className="p-4 text-center">
                                        <button
                                            onClick={() => togglePermission(index, 'can_give_discount')}
                                            className={`p-2 rounded-full transition-all ${member.can_give_discount
                                                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-300 dark:text-gray-500'
                                                }`}
                                            title="Dar Desconto"
                                        >
                                            <span className="text-sm font-bold">%</span>
                                        </button>
                                    </td>

                                    {/* Save Button */}
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => handleUpdate(member)}
                                            disabled={saving === member.user_id}
                                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium text-sm flex items-center justify-end gap-2 ml-auto disabled:opacity-50"
                                        >
                                            {saving === member.user_id ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                                    Salvando...
                                                </>
                                            ) : (
                                                <>
                                                    <Save size={16} />
                                                    Salvar
                                                </>
                                            )}
                                        </button>
                                    </td>
                                </tr>
                            ))}

                            {members.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-gray-500 dark:text-gray-400">
                                        Nenhum membro cadastrado
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal for New User */}
            {showNewUserModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <UserForm
                        onCancel={() => setShowNewUserModal(false)}
                        onSave={handleCreateUser}
                        onError={(msg) => showMessage('error', msg)}
                    />
                </div>
            )}
        </div>
    );
};
