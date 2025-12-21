import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Activity, Sparkles, TrendingUp, AlertCircle, Target, Briefcase, Stethoscope, Users, Calendar, CheckCircle } from 'lucide-react';
import { useGameification } from '../hooks/useGameification';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import { WarRoomCard } from './WarRoomCard';
import { MasterGateway } from './MasterGateway';

export const IntelligenceGateway: React.FC = () => {
    const { profile } = useAuth();
    const role = profile?.role as UserRole | undefined;

    // MASTER gets special Tycoon Hub (check before hooks)
    if (role === 'MASTER') {
        return <MasterGateway />;
    }

    // Hooks only for non-MASTER users
    const navigate = useNavigate();
    const { progression, dashboard, loading } = useGameification();

    const roleConfig = useMemo(() => {
        if (!role) return null;

        switch (role) {
            case 'PROFESSIONAL':
                return {
                    title: 'Portal do Guardião da Técnica',
                    subtitle: 'Excelência Clínica e Encantamento',
                    card1: {
                        title: 'Performance Clínica',
                        subtitle: 'Produtividade & Qualidade',
                        icon: Stethoscope,
                        color: 'from-teal-600 to-cyan-600',
                        shadow: 'shadow-teal-500/50',
                        desc: 'Monitore sua produção, tickets médio e satisfação dos pacientes.',
                        path: '/dashboard/clinic-health', // Idealmente teria uma view filtrada
                        metrics: [
                            { label: 'Atendimentos', val: 'Agenda', icon: Users, color: 'text-blue-300' },
                            { label: 'Qualidade', val: 'NPS', icon: Sparkles, color: 'text-yellow-300' }
                        ]
                    },
                    card2: {
                        title: 'Insights Clínicos',
                        subtitle: 'Oportunidades de Tratamento',
                        icon: Brain,
                        color: 'from-emerald-600 to-green-600',
                        shadow: 'shadow-emerald-500/50',
                        desc: 'Recomendações inteligentes de tratamentos complementares e preventivos.',
                        path: '/dashboard/bos-intelligence',
                        metrics: [
                            { label: 'Alertas', val: 'Clínicos', icon: AlertCircle, color: 'text-red-300' },
                            { label: 'Insights', val: 'Técnicos', icon: Sparkles, color: 'text-white' }
                        ]
                    },
                    masteryTitle: 'Clinical Mastery',
                    masteryDesc: 'Evolução técnica e reconhecimento profissional.'
                };
            case 'CRC':
                return {
                    title: 'Portal do Arquiteto de Conversão',
                    subtitle: 'Acelerador de Vendas e Relacionamento',
                    card1: {
                        title: 'Radar de Oportunidades',
                        subtitle: 'Multidisciplinar',
                        icon: Briefcase,
                        color: 'from-amber-600 to-orange-600',
                        shadow: 'shadow-amber-500/50',
                        desc: 'Sistema inteligente de 3 camadas: Diamante (High-Ticket), Ouro (Avaliações) e Prata (Recorrência).',
                        path: '/dashboard/opportunity-radar', // Radar Multidisciplinar
                        metrics: [
                            { label: 'Leads', val: 'Novos', icon: Users, color: 'text-blue-300' },
                            { label: 'Conversão', val: '% Alta', icon: TrendingUp, color: 'text-green-300' }
                        ]
                    },
                    card2: {
                        title: 'Inteligência de Vendas',
                        subtitle: 'Scripts & Objeções',
                        icon: Brain,
                        color: 'from-red-600 to-rose-600',
                        shadow: 'shadow-red-500/50',
                        desc: 'Alertas de oportunidades quentes e scripts para contornar objeções.',
                        path: '/dashboard/bos-intelligence',
                        metrics: [
                            { label: 'Alertas', val: 'Hot Leads', icon: AlertCircle, color: 'text-yellow-300' },
                            { label: 'Scripts', val: 'BOS', icon: Sparkles, color: 'text-white' }
                        ]
                    },
                    masteryTitle: 'Rainmaker Mastery',
                    masteryDesc: 'Domínio da arte de vendas e negociação.'
                };
            case 'RECEPTIONIST':
                return {
                    title: 'Portal da Mestre de Fluxo',
                    subtitle: 'Organização, Confirmações e Triagem',
                    card1: {
                        title: 'Gestão de Agenda',
                        subtitle: 'Calendário & Encaixes',
                        icon: Calendar,
                        color: 'from-indigo-600 to-purple-600',
                        shadow: 'shadow-indigo-500/50',
                        desc: 'Controle total da agenda, confirmações e otimização de horários.',
                        path: '/dashboard/schedule',
                        metrics: [
                            { label: 'Hoje', val: 'Agendamentos', icon: Calendar, color: 'text-blue-300' },
                            { label: 'Pendentes', val: 'Confirmações', icon: AlertCircle, color: 'text-yellow-300' }
                        ]
                    },
                    card2: {
                        title: 'Triagem de Leads',
                        subtitle: 'Novos Contatos',
                        icon: Users,
                        color: 'from-pink-600 to-rose-600',
                        shadow: 'shadow-pink-500/50',
                        desc: 'Cadastro rápido de novos leads e agendamento de primeira consulta.',
                        path: '/dashboard/contatos',
                        metrics: [
                            { label: 'Novos', val: 'Leads', icon: Users, color: 'text-green-300' },
                            { label: 'Aguardando', val: 'Cadastro', icon: CheckCircle, color: 'text-white' }
                        ]
                    },
                    masteryTitle: 'Flow Mastery',
                    masteryDesc: 'Excelência operacional e organização impecável.'
                };
            case 'ADMIN':
            default:
                return {
                    title: 'Intelligence Gateway',
                    subtitle: 'Portal Central de Inteligência Executiva - Visão 360°',
                    card1: {
                        title: 'ClinicHealth',
                        subtitle: 'Saúde Macro',
                        icon: Activity,
                        color: 'from-blue-600 to-cyan-600',
                        shadow: 'shadow-blue-500/50',
                        desc: 'Monitoramento dos <strong>5 Pilares</strong> e gestão de metas através da <strong>War Room</strong>.',
                        path: '/dashboard/clinic-health',
                        metrics: [
                            { label: 'War Room', val: 'Metas', icon: Target, color: 'text-yellow-300' },
                            { label: '5 Pilares', val: 'KPIs', icon: TrendingUp, color: 'text-green-300' }
                        ]
                    },
                    card2: {
                        title: 'BOS Intelligence',
                        subtitle: 'Ação Micro',
                        icon: Brain,
                        color: 'from-red-600 to-orange-600',
                        shadow: 'shadow-red-500/50',
                        desc: 'Central de <strong>Alertas</strong> (Reativo) e <strong>Insights</strong> (Proativo) com gatilhos para ChatBOS.',
                        path: '/dashboard/bos-intelligence',
                        metrics: [
                            { label: 'Alertas', val: 'R$', icon: AlertCircle, color: 'text-red-300' },
                            { label: 'Insights', val: 'Upsell', icon: Sparkles, color: 'text-blue-300' }
                        ]
                    },
                    masteryTitle: 'Executive Mastery',
                    masteryDesc: 'Progressão do gestor com <strong>XP</strong>, <strong>Níveis</strong> e <strong>Árvore de Habilidades</strong>.'
                };
        }
    }, [role]);

    if (!roleConfig) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pb-20 md:pb-0">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white p-8 shadow-2xl">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-4 bg-white/20 rounded-xl backdrop-blur-sm">
                            <Brain size={48} className="animate-pulse" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold flex items-center gap-3">
                                {roleConfig.title}
                                <Sparkles size={28} className="text-yellow-300" />
                            </h1>
                            <p className="text-lg text-purple-100 mt-2">
                                {roleConfig.subtitle}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Gateway Cards */}
            <div className="max-w-7xl mx-auto p-8">
                {/* WAR ROOM - Apenas para ADMIN */}
                {role === 'ADMIN' && (
                    <div className="mb-8">
                        <WarRoomCard />
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* CARD 1: Operational Core */}
                    <div
                        onClick={() => navigate(roleConfig.card1.path)}
                        className={`group relative bg-gradient-to-br ${roleConfig.card1.color} rounded-2xl p-6 shadow-2xl hover:${roleConfig.card1.shadow} transition-all duration-300 cursor-pointer transform hover:scale-[1.02] overflow-hidden`}
                    >
                        {/* Background Pattern */}
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute top-0 right-0 w-48 h-48">
                                <roleConfig.card1.icon size={192} className="text-white" />
                            </div>
                        </div>

                        {/* Content */}
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm group-hover:bg-white/30 transition-all">
                                    <roleConfig.card1.icon size={32} className="text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white">{roleConfig.card1.title}</h2>
                                    <p className="text-blue-100 text-xs">{roleConfig.card1.subtitle}</p>
                                </div>
                            </div>

                            <p className="text-white text-sm mb-4 leading-relaxed" dangerouslySetInnerHTML={{ __html: roleConfig.card1.desc }} />

                            <div className="grid grid-cols-2 gap-2 mb-4">
                                {roleConfig.card1.metrics.map((metric, idx) => (
                                    <div key={idx} className="bg-white/10 backdrop-blur-sm rounded-lg p-2">
                                        <div className="flex items-center gap-1 mb-1">
                                            <metric.icon size={16} className={metric.color} />
                                            <span className="text-white font-bold text-xs">{metric.label}</span>
                                        </div>
                                        <p className="text-blue-100 text-[10px]">{metric.val}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-white/80 text-xs">Acessar →</span>
                                <div className="px-3 py-1.5 bg-white/20 rounded-lg backdrop-blur-sm group-hover:bg-white/30 transition-all">
                                    <span className="text-white font-bold text-xs">ABRIR</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CARD 2: Intelligence & Strategy */}
                    <div
                        onClick={() => navigate(roleConfig.card2.path)}
                        className={`group relative bg-gradient-to-br ${roleConfig.card2.color} rounded-2xl p-6 shadow-2xl hover:${roleConfig.card2.shadow} transition-all duration-300 cursor-pointer transform hover:scale-[1.02] overflow-hidden`}
                    >
                        {/* Background Pattern */}
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute top-0 right-0 w-48 h-48">
                                <roleConfig.card2.icon size={192} className="text-white" />
                            </div>
                        </div>

                        {/* Content */}
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm group-hover:bg-white/30 transition-all">
                                    <roleConfig.card2.icon size={32} className="text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white">{roleConfig.card2.title}</h2>
                                    <p className="text-orange-100 text-xs">{roleConfig.card2.subtitle}</p>
                                </div>
                            </div>

                            <p className="text-white text-sm mb-4 leading-relaxed" dangerouslySetInnerHTML={{ __html: roleConfig.card2.desc }} />

                            <div className="grid grid-cols-2 gap-2 mb-4">
                                {roleConfig.card2.metrics.map((metric, idx) => (
                                    <div key={idx} className="bg-white/10 backdrop-blur-sm rounded-lg p-2">
                                        <div className="flex items-center gap-1 mb-1">
                                            <metric.icon size={16} className={metric.color} />
                                            <span className="text-white font-bold text-xs">{metric.label}</span>
                                        </div>
                                        <p className="text-orange-100 text-[10px]">{metric.val}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-white/80 text-xs">Acessar →</span>
                                <div className="px-3 py-1.5 bg-white/20 rounded-lg backdrop-blur-sm group-hover:bg-white/30 transition-all">
                                    <span className="text-white font-bold text-xs">ABRIR</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CARD 3: Mastery (Gamificação) - Keep as is but with dynamic title */}
                    <div
                        onClick={() => navigate('/dashboard/gamification-test')}
                        className="group relative bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl p-6 shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 cursor-pointer transform hover:scale-[1.02] overflow-hidden"
                    >
                        {/* Background Pattern */}
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute top-0 right-0 w-48 h-48">
                                <Target size={192} className="text-white" />
                            </div>
                        </div>

                        {/* Content */}
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm group-hover:bg-white/30 transition-all">
                                    <Target size={32} className="text-white animate-pulse" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white">{roleConfig.masteryTitle}</h2>
                                    <p className="text-purple-100 text-xs">Evolução Profissional</p>
                                </div>
                            </div>

                            <p className="text-white text-sm mb-4 leading-relaxed" dangerouslySetInnerHTML={{ __html: roleConfig.masteryDesc }} />

                            <div className="space-y-2 mb-4">
                                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-white font-bold text-xs">Nível Atual</span>
                                        <span className="text-yellow-300 font-black text-lg">
                                            {loading ? '...' : progression?.current_level || 1}
                                        </span>
                                    </div>
                                    <p className="text-purple-100 text-[10px]">
                                        {loading ? 'Carregando...' :
                                            progression?.current_level === 1 ? 'Iniciante' :
                                                progression?.current_level === 2 ? 'Intermediário' :
                                                    progression?.current_level === 3 ? 'Avançado' :
                                                        progression?.current_level === 4 ? 'Especialista' : 'Lendário'}
                                    </p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-white font-bold text-xs">XP Atual</span>
                                        <span className="text-blue-300 font-bold text-xs">
                                            {loading ? '...' : (progression?.total_xp || 0).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="w-full bg-white/20 rounded-full h-1.5">
                                        <div
                                            className="bg-gradient-to-r from-yellow-400 to-green-400 h-1.5 rounded-full transition-all duration-500"
                                            style={{
                                                width: dashboard && dashboard.xp_to_next_level > 0
                                                    ? `${Math.min(100, ((progression?.total_xp || 0) / ((progression?.total_xp || 0) + dashboard.xp_to_next_level)) * 100)}%`
                                                    : '100%'
                                            }}
                                        ></div>
                                    </div>
                                    <p className="text-purple-100 text-[10px] mt-1">
                                        {loading ? 'Carregando...' :
                                            dashboard && dashboard.xp_to_next_level > 0
                                                ? `Faltam ${dashboard.xp_to_next_level.toLocaleString()} XP`
                                                : 'Nível Máximo!'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-white/80 text-xs">Acessar →</span>
                                <div className="px-3 py-1.5 bg-white/20 rounded-lg backdrop-blur-sm group-hover:bg-white/30 transition-all">
                                    <span className="text-white font-bold text-xs">ABRIR</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Quick Stats Bar */}
                <div className="mt-8 bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Sparkles size={24} className="text-purple-400" />
                            <span className="text-white font-bold">Acesso Rápido ao ChatBOS</span>
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate('/dashboard/chatbos');
                            }}
                            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-bold hover:from-purple-700 hover:to-indigo-700 transition-all transform hover:scale-105 shadow-lg"
                        >
                            Abrir ChatBOS
                        </button>
                    </div>
                </div>

                {/* Manifesto */}
                <div className="mt-8 bg-gradient-to-r from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-xl p-6 border border-purple-500/30">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Brain size={24} className="text-purple-400" />
                        Manifesto de Inteligência BOS
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="text-gray-300">
                            <strong className="text-purple-400">• Proatividade Radical:</strong> Dados sempre acompanhados de soluções
                        </div>
                        <div className="text-gray-300">
                            <strong className="text-blue-400">• Upsell de Vendas:</strong> HOF → Cirurgias Faciais
                        </div>
                        <div className="text-gray-300">
                            <strong className="text-red-400">• Proteção de Receita:</strong> R$ 500 a R$ 15k+
                        </div>
                        <div className="text-gray-300">
                            <strong className="text-green-400">• Meta Mensal:</strong> R$ 50.000,00
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IntelligenceGateway;
