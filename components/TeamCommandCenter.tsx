import React, { useState, useEffect } from 'react';
import { Users, Shield, Crown, Briefcase, UserCog, AlertCircle, CheckCircle, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

import { UserRole } from '../types';

interface TeamMember {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    active: boolean;
    created_at: string;
    photo_url?: string;
}

const ROLE_CONFIG = {
    ADMIN: {
        label: 'Administrador',
        persona: 'Sócio Estrategista',
        color: 'from-purple-600 to-indigo-600',
        bgColor: 'bg-purple-100',
        textColor: 'text-purple-800',
        icon: Crown,
        description: 'Acesso total ao sistema'
    },
    PROFESSIONAL: {
        label: 'Profissional Clínico',
        persona: 'Guardião da Técnica',
        color: 'from-teal-600 to-cyan-600',
        bgColor: 'bg-teal-100',
        textColor: 'text-teal-800',
        icon: Shield,
        description: 'Foco em produção clínica, qualidade e procedimentos'
    },
    RECEPTIONIST: {
        label: 'Recepcionista',
        persona: 'Mestre de Fluxo',
        color: 'from-blue-600 to-cyan-600',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-800',
        icon: Users,
        description: 'Foco em agenda, atendimento e confirmações'
    },
    CRC: {
        label: 'Consultor de Vendas',
        persona: 'Arquiteto de Conversão',
        color: 'from-amber-600 to-orange-600',
        bgColor: 'bg-amber-100',
        textColor: 'text-amber-800',
        icon: Briefcase,
        description: 'Foco em conversão, upsell e pipeline de vendas'
    }
};

export default function TeamCommandCenter() {
    const { profile } = useAuth();
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
    const [newRole, setNewRole] = useState<string>('');
    const [showModal, setShowModal] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Verificar se é ADMIN
    if (profile?.role !== 'ADMIN') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-6">
                <div className="glass-card p-8 max-w-md text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2">Acesso Restrito</h2>
                    <p className="text-gray-300">
                        Esta área é exclusiva para o <span className="text-purple-400 font-bold">Diretor Exponencial</span>.
                    </p>
                </div>
            </div>
        );
    }

    useEffect(() => {
        fetchTeamMembers();
    }, [profile]);

    const fetchTeamMembers = async () => {
        if (!profile?.clinic_id) return;

        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('clinic_id', profile.clinic_id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setTeamMembers(data || []);
        } catch (error) {
            console.error('Erro ao buscar equipe:', error);
            showNotification('error', 'Erro ao carregar equipe');
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = (member: TeamMember) => {
        setSelectedMember(member);
        setNewRole(member.role);
        setShowModal(true);
    };

    const confirmRoleChange = async () => {
        if (!selectedMember || !newRole) return;

        setUpdating(true);

        try {
            // Atualizar role no banco
            const { error } = await supabase
                .from('users')
                .update({
                    role: newRole,
                    updated_at: new Date().toISOString()
                })
                .eq('id', selectedMember.id);

            if (error) throw error;

            // Atualizar estado local
            setTeamMembers(prev =>
                prev.map(member =>
                    member.id === selectedMember.id
                        ? { ...member, role: newRole as any }
                        : member
                )
            );

            // Enviar notificação BOS (simulado - implementar com real-time depois)
            await sendBOSNotification(selectedMember, newRole);

            showNotification('success', `${selectedMember.name} agora é ${ROLE_CONFIG[newRole as keyof typeof ROLE_CONFIG].persona}!`);
            setShowModal(false);
            setSelectedMember(null);
        } catch (error) {
            console.error('Erro ao atualizar role:', error);
            showNotification('error', 'Erro ao atualizar função');
        } finally {
            setUpdating(false);
        }
    };

    const sendBOSNotification = async (member: TeamMember, role: string) => {
        // TODO: Implementar notificação real via Supabase Realtime
        const messages = {
            ADMIN: `Parabéns! Você foi promovido a Sócio Estrategista. Agora você tem acesso total ao sistema!`,
            PROFESSIONAL: `Parabéns! Você é agora o Guardião da Técnica. Foco em produção clínica de excelência e satisfação do paciente!`,
            RECEPTIONIST: `Parabéns! Você é agora o Mestre de Fluxo. Vamos otimizar essa agenda e garantir zero no-show!`,
            CRC: `Parabéns! Você foi promovido a Arquiteto de Conversão. Vamos transformar esses orçamentos em vitórias de alto ticket!`
        };

        console.log(`[BOS] Notificação para ${member.name}: ${messages[role as keyof typeof messages]}`);
    };

    const showNotification = (type: 'success' | 'error', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 5000);
    };

    const RoleBadge = ({ role }: { role: keyof typeof ROLE_CONFIG }) => {
        const config = ROLE_CONFIG[role];
        const Icon = config.icon;

        return (
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${config.bgColor}`}>
                <Icon className={`w-4 h-4 ${config.textColor}`} />
                <span className={`text-sm font-semibold ${config.textColor}`}>
                    {config.label}
                </span>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
                <div className="text-white text-xl">Carregando equipe...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-8">
                <div className="glass-card p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl">
                            <UserCog className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-1">
                                Torre de Controle de Acessos
                            </h1>
                            <p className="text-gray-400">
                                Gerencie funções e permissões da equipe
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Notification */}
            {notification && (
                <div className="max-w-7xl mx-auto mb-4">
                    <div className={`glass-card p-4 border-l-4 ${notification.type === 'success' ? 'border-green-500' : 'border-red-500'
                        }`}>
                        <div className="flex items-center gap-3">
                            {notification.type === 'success' ? (
                                <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                                <AlertCircle className="w-5 h-5 text-red-500" />
                            )}
                            <span className="text-white">{notification.message}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Team Grid */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teamMembers.map((member) => {
                    const config = ROLE_CONFIG[member.role];
                    const Icon = config.icon;

                    return (
                        <div key={member.id} className="glass-card p-6 hover:scale-105 transition-transform">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${config.color} flex items-center justify-center`}>
                                        <Icon className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white">{member.name}</h3>
                                        <p className="text-sm text-gray-400">{member.email}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Role Badge */}
                            <div className="mb-4">
                                <RoleBadge role={member.role} />
                            </div>

                            {/* Persona */}
                            <div className="mb-4">
                                <p className="text-sm text-gray-400 mb-1">Persona:</p>
                                <p className="text-white font-semibold">{config.persona}</p>
                            </div>

                            {/* Description */}
                            <p className="text-sm text-gray-400 mb-4">{config.description}</p>

                            {/* Actions */}
                            <button
                                onClick={() => handleRoleChange(member)}
                                className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all"
                            >
                                Alterar Função
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Modal de Alteração */}
            {showModal && selectedMember && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="glass-card p-6 max-w-md w-full">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-white">Alterar Função</h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-white"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="mb-6">
                            <p className="text-gray-400 mb-2">Membro:</p>
                            <p className="text-white font-semibold text-lg">{selectedMember.name}</p>
                        </div>

                        <div className="mb-6">
                            <label className="block text-gray-400 mb-3">Nova Função:</label>
                            <div className="space-y-3">
                                {Object.entries(ROLE_CONFIG).map(([role, config]) => {
                                    const Icon = config.icon;
                                    return (
                                        <button
                                            key={role}
                                            onClick={() => setNewRole(role)}
                                            className={`w-full p-4 rounded-lg border-2 transition-all ${newRole === role
                                                ? 'border-purple-500 bg-purple-500/20'
                                                : 'border-gray-600 hover:border-gray-500'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg bg-gradient-to-br ${config.color}`}>
                                                    <Icon className="w-5 h-5 text-white" />
                                                </div>
                                                <div className="text-left flex-1">
                                                    <p className="text-white font-semibold">{config.label}</p>
                                                    <p className="text-sm text-gray-400">{config.persona}</p>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                disabled={updating}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmRoleChange}
                                disabled={updating || newRole === selectedMember.role}
                                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {updating ? 'Atualizando...' : 'Confirmar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
