import React, { useState, useEffect, useRef } from 'react';
import {
    Plus, Search, User, Mail, Trash2, Edit2, RefreshCw
} from 'lucide-react';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import NewMemberSheet from '../../components/settings/NewMemberSheet';
import DeleteConfirmationModal from '../../components/DeleteConfirmationModal';
import toast from 'react-hot-toast';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const Team = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Estados para gerenciar Modais e Edição
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [memberToEdit, setMemberToEdit] = useState<any>(null); // Dados para edição
    const [userToDelete, setUserToDelete] = useState<any>(null);

    const isFetching = useRef(false);

    // Busca Otimizada (Direct Select para garantir dados atualizados)
    const fetchUsers = async (retryCount = 0) => {
        if (isFetching.current || !user?.clinic_id) return;

        isFetching.current = true;
        setLoading(true);

        try {
            await delay(500 + (retryCount * 1000));

            // Usando select direto para garantir que todos os novos campos (gender, cpf, comissões) venham
            const { data, error } = await supabase
                .from('users')
                .select(`
                    id, 
                    name, 
                    email, 
                    role, 
                    photo_url, 
                    created_at, 
                    cro, 
                    specialty, 
                    agenda_color,
                    gender,
                    cpf,
                    is_clinical_provider,
                    is_sales_rep,
                    commission_percent,
                    sales_commission_percent,
                    collection_percent
                `)
                .eq('clinic_id', user.clinic_id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUsers(data || []);

        } catch (error: any) {
            console.error('Erro:', error);
            if (retryCount < 2) {
                isFetching.current = false;
                return fetchUsers(retryCount + 1);
            }
            toast.error('Erro ao carregar equipe. Verifique a conexão.');
        } finally {
            setLoading(false);
            isFetching.current = false;
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [user?.clinic_id]);

    // Abre o modal em modo EDIÇÃO
    const handleEdit = (member: any) => {
        setMemberToEdit(member);
        setIsSheetOpen(true);
    };

    // Abre o modal em modo CRIAÇÃO
    const handleNew = () => {
        setMemberToEdit(null);
        setIsSheetOpen(true);
    };

    const handleDeleteUser = async () => {
        if (!userToDelete) return;
        try {
            const { error } = await supabase.functions.invoke('delete-user', {
                body: { user_id: userToDelete.id }
            });
            if (error) throw error;
            toast.success('Usuário removido');
            fetchUsers();
            setUserToDelete(null);
        } catch (error) {
            toast.error('Erro ao remover.');
        }
    };

    const formatRole = (role: string) => {
        const r = (role || '').toLowerCase();
        if (r === 'dentist') return 'Dentista';
        if (r === 'master') return 'CEO / Master';
        if (r === 'admin') return 'Administrador';
        if (r === 'secretary') return 'Recepção';
        return role;
    };

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <User className="w-6 h-6 text-blue-600" />
                        Gestão de Equipe
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">Gerencie o acesso e funções do sistema.</p>
                </div>

                <div className="flex gap-2">
                    <button onClick={() => fetchUsers(0)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg border border-gray-200">
                        <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                    </button>
                    <button
                        onClick={handleNew}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm font-medium"
                    >
                        <Plus size={18} />
                        Novo Colaborador
                    </button>
                </div>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                    type="text"
                    placeholder="Buscar colaborador..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-gray-500">Carregando equipe...</div>
                ) : filteredUsers.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                        {filteredUsers.map((member) => (
                            <div key={member.id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 transition-colors group">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-lg font-bold text-blue-600 border border-gray-200 overflow-hidden">
                                        {member.photo_url ? (
                                            <img src={member.photo_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            member.name?.substring(0, 2).toUpperCase()
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                            {member.name}
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium border uppercase ${member.role === 'ADMIN' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                                member.role === 'MASTER' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                                                    'bg-gray-50 text-gray-600 border-gray-100'
                                                }`}>
                                                {formatRole(member.role)}
                                            </span>
                                        </h3>
                                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                                            <div className="flex items-center gap-1.5">
                                                <Mail size={14} />
                                                {member.email}
                                            </div>
                                        </div>
                                        {/* Exibe CRO se existir */}
                                        {(member.cro || member.specialty) && (
                                            <div className="mt-2 flex items-center gap-3 text-xs text-gray-500 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 w-fit">
                                                {member.cro && <span className="font-medium text-blue-700">CRO: {member.cro}</span>}
                                                {member.specialty && <span>• {member.specialty}</span>}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                    {/* BOTÃO EDITAR ATIVADO */}
                                    <button
                                        onClick={() => handleEdit(member)}
                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                        title="Editar"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => setUserToDelete(member)}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                        title="Remover"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-12 text-center text-gray-500">Nenhum colaborador encontrado.</div>
                )}
            </div>

            <NewMemberSheet
                isOpen={isSheetOpen}
                onClose={() => setIsSheetOpen(false)}
                onSuccess={() => fetchUsers(0)}
                initialData={memberToEdit}
            />

            <DeleteConfirmationModal
                isOpen={!!userToDelete}
                onClose={() => setUserToDelete(null)}
                onConfirm={handleDeleteUser}
                title="Remover"
                description={`Remover ${userToDelete?.name}?`}
            />
        </div>
    );
};

export default Team;
