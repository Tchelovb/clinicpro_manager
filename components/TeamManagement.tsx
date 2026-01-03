import React, { useState, useEffect } from 'react';
import { supabase } from '../src/lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { createUser, updateUser, deleteUser } from '../services/userService';
import toast from 'react-hot-toast';
import { Users, Plus, Shield, Mail, User, X, Trash2, Edit, Check, AlertCircle } from 'lucide-react';

interface TeamMember {
    user_id: string;
    email: string;
    registered_at: string;
    last_sign_in_at: string | null;
    role: string;
    can_view_financial: boolean;
    can_edit_calendar: boolean;
    can_manage_settings: boolean;
    can_delete_patient: boolean;
    can_give_discount: boolean;
    max_discount_percent: number;
}

export const TeamManagement: React.FC = () => {
    const { profile } = useAuth();
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
    const [creating, setCreating] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);

    // Form state for create
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: '',
        role: 'secretary' as 'admin' | 'dentist' | 'secretary'
    });

    // Form state for edit
    const [editFormData, setEditFormData] = useState({
        email: '',
        fullName: '',
        role: 'secretary' as 'admin' | 'dentist' | 'secretary',
        can_view_financial: false,
        can_edit_calendar: true,
        can_manage_settings: false,
        can_delete_patient: false,
        can_give_discount: false,
        max_discount_percent: 5
    });

    useEffect(() => {
        loadTeamMembers();
    }, []);

    const loadTeamMembers = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('view_team_members')
                .select('*')
                .order('registered_at', { ascending: false });

            if (error) throw error;
            setTeamMembers(data || []);
        } catch (error: any) {
            console.error('Error loading team:', error);
            toast.error('Erro ao carregar equipe');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!profile?.clinic_id) {
            toast.error('Clinic ID não encontrado');
            return;
        }

        try {
            setCreating(true);

            const { data, error } = await createUser({
                email: formData.email,
                password: formData.password,
                fullName: formData.fullName,
                role: formData.role,
                clinicId: profile.clinic_id
            });

            if (error) throw new Error(error);

            toast.success('Usuário criado com sucesso!');
            setShowCreateModal(false);
            setFormData({ email: '', password: '', fullName: '', role: 'secretary' });
            loadTeamMembers();
        } catch (error: any) {
            console.error('Error creating user:', error);
            toast.error(error.message || 'Erro ao criar usuário');
        } finally {
            setCreating(false);
        }
    };

    const handleEditClick = (member: TeamMember) => {
        setEditingMember(member);
        setEditFormData({
            email: member.email,
            fullName: member.email, // We don't have full_name in view, will use email
            role: member.role as any,
            can_view_financial: member.can_view_financial,
            can_edit_calendar: member.can_edit_calendar,
            can_manage_settings: member.can_manage_settings,
            can_delete_patient: member.can_delete_patient,
            can_give_discount: member.can_give_discount,
            max_discount_percent: member.max_discount_percent
        });
        setShowEditModal(true);
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!editingMember) return;

        try {
            setUpdating(true);

            const { error } = await updateUser({
                userId: editingMember.user_id,
                email: editFormData.email,
                fullName: editFormData.fullName,
                role: editFormData.role,
                permissions: {
                    role: editFormData.role,
                    can_view_financial: editFormData.can_view_financial,
                    can_edit_calendar: editFormData.can_edit_calendar,
                    can_manage_settings: editFormData.can_manage_settings,
                    can_delete_patient: editFormData.can_delete_patient,
                    can_give_discount: editFormData.can_give_discount,
                    max_discount_percent: editFormData.max_discount_percent
                }
            });

            if (error) throw new Error(error);

            toast.success('Usuário atualizado com sucesso!');
            setShowEditModal(false);
            setEditingMember(null);
            loadTeamMembers();
        } catch (error: any) {
            console.error('Error updating user:', error);
            toast.error(error.message || 'Erro ao atualizar usuário');
        } finally {
            setUpdating(false);
        }
    };

    const handleDeleteUser = async (member: TeamMember) => {
        if (!confirm(`Deseja realmente deletar o usuário ${member.email}?\n\nEsta ação não pode ser desfeita.`)) {
            return;
        }

        try {
            setDeleting(member.user_id);

            const { error } = await deleteUser(member.user_id);

            if (error) throw new Error(error);

            toast.success('Usuário deletado com sucesso!');
            loadTeamMembers();
        } catch (error: any) {
            console.error('Error deleting user:', error);
            toast.error(error.message || 'Erro ao deletar usuário');
        } finally {
            setDeleting(null);
        }
    };

    const getRoleBadge = (role: string) => {
        const styles = {
            admin: 'bg-purple-100 text-purple-700 border-purple-300',
            dentist: 'bg-blue-100 text-blue-700 border-blue-300',
            secretary: 'bg-slate-100 text-slate-700 border-slate-300'
        };
        return styles[role as keyof typeof styles] || styles.secretary;
    };

    const getRoleLabel = (role: string) => {
        const labels = {
            admin: 'Administrador',
            dentist: 'Dentista',
            secretary: 'Secretária'
        };
        return labels[role as keyof typeof labels] || role;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Users className="text-violet-600" size={28} />
                        Gerenciar Equipe
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                        {teamMembers.length} {teamMembers.length === 1 ? 'membro' : 'membros'} na equipe
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                >
                    <Plus size={18} />
                    Novo Usuário
                </button>
            </div>

            {/* Team Members List */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                Usuário
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                Função
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                Permissões
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                Último Acesso
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                                Ações
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {teamMembers.map((member) => (
                            <tr key={member.user_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                            {member.email.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900 dark:text-white">{member.email}</p>
                                            <p className="text-xs text-slate-500">
                                                Cadastrado em {new Date(member.registered_at).toLocaleDateString('pt-BR')}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getRoleBadge(member.role)}`}>
                                        {getRoleLabel(member.role)}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-wrap gap-1">
                                        {member.can_view_financial && (
                                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs">Financeiro</span>
                                        )}
                                        {member.can_manage_settings && (
                                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">Config</span>
                                        )}
                                        {member.can_delete_patient && (
                                            <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded text-xs">Deletar</span>
                                        )}
                                        {member.can_give_discount && (
                                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs">
                                                Desconto {member.max_discount_percent}%
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-500">
                                    {member.last_sign_in_at
                                        ? new Date(member.last_sign_in_at).toLocaleDateString('pt-BR')
                                        : 'Nunca'}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => handleEditClick(member)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                            title="Editar usuário"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteUser(member)}
                                            disabled={deleting === member.user_id}
                                            className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors disabled:opacity-50"
                                            title="Deletar usuário"
                                        >
                                            {deleting === member.user_id ? (
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-rose-600"></div>
                                            ) : (
                                                <Trash2 size={16} />
                                            )}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Create User Modal - keeping existing code */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    {/* ... existing create modal code ... */}
                </div>
            )}

            {/* Edit User Modal */}
            {showEditModal && editingMember && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full my-8">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Shield className="text-blue-600" size={24} />
                                    Editar Usuário
                                </h3>
                                <button
                                    onClick={() => setShowEditModal(false)}
                                    className="text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleUpdateUser} className="p-6 space-y-6">
                            {/* Basic Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                        <Mail size={14} className="inline mr-1" />
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={editFormData.email}
                                        onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                        <Shield size={14} className="inline mr-1" />
                                        Função
                                    </label>
                                    <select
                                        value={editFormData.role}
                                        onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value as any })}
                                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                    >
                                        <option value="secretary">Secretária</option>
                                        <option value="dentist">Dentista</option>
                                        <option value="admin">Administrador</option>
                                    </select>
                                </div>
                            </div>

                            {/* Permissions */}
                            <div>
                                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                                    <AlertCircle size={16} />
                                    Permissões
                                </h4>
                                <div className="space-y-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={editFormData.can_view_financial}
                                            onChange={(e) => setEditFormData({ ...editFormData, can_view_financial: e.target.checked })}
                                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-slate-700 dark:text-slate-300">Ver Financeiro</span>
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={editFormData.can_manage_settings}
                                            onChange={(e) => setEditFormData({ ...editFormData, can_manage_settings: e.target.checked })}
                                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-slate-700 dark:text-slate-300">Gerenciar Configurações</span>
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={editFormData.can_delete_patient}
                                            onChange={(e) => setEditFormData({ ...editFormData, can_delete_patient: e.target.checked })}
                                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-slate-700 dark:text-slate-300">Deletar Pacientes</span>
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={editFormData.can_give_discount}
                                            onChange={(e) => setEditFormData({ ...editFormData, can_give_discount: e.target.checked })}
                                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-slate-700 dark:text-slate-300">Dar Descontos</span>
                                    </label>
                                    {editFormData.can_give_discount && (
                                        <div className="ml-7">
                                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                                                Desconto Máximo (%)
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={editFormData.max_discount_percent}
                                                onChange={(e) => setEditFormData({ ...editFormData, max_discount_percent: parseFloat(e.target.value) })}
                                                className="w-32 px-3 py-1 border border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={updating}
                                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {updating ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            Salvando...
                                        </>
                                    ) : (
                                        <>
                                            <Check size={18} />
                                            Salvar Alterações
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
