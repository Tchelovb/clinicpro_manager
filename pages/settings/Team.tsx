import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import {
    Users,
    UserPlus,
    Search,
    Edit2,
    Trash2,
    Mail
} from 'lucide-react';
import UserDetailSheet from '../../components/settings/UserDetailSheet';
import { NewMemberSheet } from '../../components/settings/NewMemberSheet';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    active: boolean;
    created_at: string;
    phone?: string;
}

export function Team() {
    const { clinicId } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Sheet Control
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    useEffect(() => {
        if (clinicId) {
            fetchUsers();
        }
    }, [clinicId]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('clinic_id', clinicId)
                .order('name');

            if (error) throw error;
            setUsers(data || []);
        } catch (error: any) {
            console.error("Error fetching users:", error);
            toast.error("Erro ao carregar equipe.");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (e: React.MouseEvent, user: User) => {
        e.stopPropagation(); // Prevent opening the sheet

        if (!confirm(`Tem certeza que deseja remover ${user.name}? Essa ação não pode ser desfeita.`)) {
            return;
        }

        try {
            toast.loading("Removendo usuário...", { id: 'delete-toast' });

            const { error } = await supabase.functions.invoke('delete-user', {
                body: { user_id: user.id }
            });

            if (error) throw error;

            toast.success("Usuário removido com sucesso!", { id: 'delete-toast' });
            fetchUsers();
        } catch (error: any) {
            console.error("Error deleting user:", error);
            toast.error("Erro ao remover usuário: " + (error.message || "Erro desconhecido"), { id: 'delete-toast' });
        }
    };

    const activeUsers = users.filter(u => u.active);
    const inactiveUsers = users.filter(u => !u.active);

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleMemberClick = (userId: string) => {
        setSelectedUserId(userId);
        setIsSheetOpen(true);
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'MASTER': return <span className="px-2 py-1 text-xs font-bold rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">MASTER</span>;
            case 'ADMIN': return <span className="px-2 py-1 text-xs font-bold rounded-full bg-purple-100 text-purple-800 border border-purple-200">ADMIN</span>;
            case 'PROFESSIONAL': return <span className="px-2 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-800 border border-blue-200">DENTISTA</span>;
            default: return <span className="px-2 py-1 text-xs font-bold rounded-full bg-gray-100 text-gray-600 border border-gray-200">EQUIPE</span>;
        }
    };

    return (
        <div className="h-full flex flex-col bg-slate-50 relative overflow-hidden">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between sticky top-0 z-10">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Users className="w-6 h-6 text-blue-600" />
                        Gestão de Equipe
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {activeUsers.length} ativos • {inactiveUsers.length} inativos
                    </p>
                </div>
                <button
                    onClick={() => setIsCreateOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm hover:shadow"
                >
                    <UserPlus size={18} />
                    Cadastrar Colaborador
                </button>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-auto p-8">

                {/* Search Bar */}
                <div className="max-w-md mx-auto mb-8 sticky top-0 z-20">
                    <div className="relative shadow-sm rounded-lg">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Buscar colaborador..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-40 bg-gray-200 rounded-xl animate-pulse"></div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredUsers.length > 0 ? (
                            filteredUsers.map((user) => (
                                <div
                                    key={user.id}
                                    onClick={() => handleMemberClick(user.id)}
                                    className="group bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer relative"
                                >
                                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            className="text-gray-300 hover:text-blue-500 transition-colors"
                                            title="Editar"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={(e) => handleDeleteUser(e, user)}
                                            className="text-gray-300 hover:text-red-500 transition-colors"
                                            title="Remover"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    <div className="flex flex-col items-center text-center">
                                        <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white mb-4 shadow-sm
                       ${user.role === 'MASTER' ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                                                user.role === 'ADMIN' ? 'bg-gradient-to-br from-purple-500 to-indigo-600' :
                                                    'bg-gradient-to-br from-blue-400 to-cyan-500'}`}>
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>

                                        <h3 className="font-bold text-lg text-gray-900 mb-1">{user.name}</h3>
                                        <div className="mb-3">{getRoleBadge(user.role)}</div>

                                        <p className="text-sm text-gray-500 flex items-center gap-1 mb-4">
                                            <Mail size={12} /> {user.email}
                                        </p>

                                        <div className="w-full pt-4 border-t border-gray-100 flex items-center justify-between">
                                            <span className={`text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1
                         ${user.active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${user.active ? 'bg-green-500' : 'bg-red-500'}`} />
                                                {user.active ? 'Ativo' : 'Inativo'}
                                            </span>
                                            <span className="text-xs text-gray-400">Ver detalhes →</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full py-12 text-center text-gray-500">
                                <div className="flex flex-col items-center justify-center">
                                    <Users className="w-12 h-12 text-gray-300 mb-4" />
                                    <p className="text-lg font-medium">Nenhum membro encontrado</p>
                                    <p className="text-sm">Tente buscar com outros termos.</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Sheet Integration (APP SHELL) */}

            <UserDetailSheet
                open={isSheetOpen}
                onOpenChange={setIsSheetOpen}
                userId={selectedUserId}
                onSuccess={() => {
                    fetchUsers();
                }}
            />

            <NewMemberSheet
                open={isCreateOpen}
                onOpenChange={setIsCreateOpen}
                onSuccess={() => {
                    fetchUsers();
                    toast.success("Lista atualizada!");
                }}
            />
        </div>
    );
}
