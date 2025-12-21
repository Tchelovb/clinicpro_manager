import React, { useState, useEffect } from 'react';
import {
    Gem,
    Award,
    Star,
    Phone,
    MessageSquare,
    Calendar,
    TrendingUp,
    Clock,
    DollarSign,
    Loader,
    AlertCircle,
    CheckCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
    opportunityRadarService,
    Opportunity,
    RadarStats,
    DiamondOpportunity,
    GoldOpportunity,
    SilverOpportunity
} from '../services/opportunityRadarService';

export const OpportunityRadar: React.FC = () => {
    const { profile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [stats, setStats] = useState<RadarStats | null>(null);
    const [selectedTier, setSelectedTier] = useState<'ALL' | 'DIAMOND' | 'GOLD' | 'SILVER'>('ALL');

    useEffect(() => {
        if (profile?.clinic_id) {
            loadData();
        }
    }, [profile?.clinic_id]);

    const loadData = async () => {
        try {
            setLoading(true);
            const clinicId = profile?.clinic_id!;

            const [allOpportunities, radarStats] = await Promise.all([
                opportunityRadarService.getAllOpportunities(clinicId),
                opportunityRadarService.getRadarStats(clinicId)
            ]);

            setOpportunities(allOpportunities);
            setStats(radarStats);
        } catch (error) {
            console.error('Erro ao carregar radar:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleWhatsAppClick = (phone: string, script: string) => {
        const cleanPhone = phone.replace(/\D/g, '');
        const encodedScript = encodeURIComponent(script);
        window.open(`https://wa.me/55${cleanPhone}?text=${encodedScript}`, '_blank');
    };

    const filteredOpportunities = selectedTier === 'ALL'
        ? opportunities
        : opportunities.filter(o => o.tier === selectedTier);

    const getTierConfig = (tier: Opportunity['tier']) => {
        switch (tier) {
            case 'DIAMOND':
                return {
                    icon: Gem,
                    color: 'from-blue-600 to-cyan-600',
                    bgColor: 'bg-blue-900/20',
                    borderColor: 'border-blue-500',
                    textColor: 'text-blue-300',
                    label: '💎 DIAMANTE'
                };
            case 'GOLD':
                return {
                    icon: Award,
                    color: 'from-yellow-600 to-amber-600',
                    bgColor: 'bg-yellow-900/20',
                    borderColor: 'border-yellow-500',
                    textColor: 'text-yellow-300',
                    label: '🥇 OURO'
                };
            case 'SILVER':
                return {
                    icon: Star,
                    color: 'from-gray-500 to-slate-500',
                    bgColor: 'bg-gray-800/20',
                    borderColor: 'border-gray-500',
                    textColor: 'text-gray-300',
                    label: '🥈 PRATA'
                };
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
                <Loader className="animate-spin text-purple-500" size={48} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pb-20 md:pb-0">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white p-8 shadow-2xl">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-4 bg-white/20 rounded-xl backdrop-blur-sm">
                            <TrendingUp size={48} className="animate-pulse" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold flex items-center gap-3">
                                Radar de Oportunidades Vilas
                                <Gem size={28} className="text-cyan-300" />
                            </h1>
                            <p className="text-lg text-purple-100 mt-2">
                                Sistema Multidisciplinar de Conversão Inteligente
                            </p>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    {stats && (
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <AlertCircle size={20} className="text-red-300" />
                                    <span className="text-white/70 text-sm">Urgentes</span>
                                </div>
                                <p className="text-white text-2xl font-bold">{stats.urgentCount}</p>
                            </div>

                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Gem size={20} className="text-blue-300" />
                                    <span className="text-white/70 text-sm">Diamante</span>
                                </div>
                                <p className="text-white text-2xl font-bold">{stats.diamondCount}</p>
                            </div>

                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Award size={20} className="text-yellow-300" />
                                    <span className="text-white/70 text-sm">Ouro</span>
                                </div>
                                <p className="text-white text-2xl font-bold">{stats.goldCount}</p>
                            </div>

                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Star size={20} className="text-gray-300" />
                                    <span className="text-white/70 text-sm">Prata</span>
                                </div>
                                <p className="text-white text-2xl font-bold">{stats.silverCount}</p>
                            </div>

                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <DollarSign size={20} className="text-green-300" />
                                    <span className="text-white/70 text-sm">Potencial</span>
                                </div>
                                <p className="text-white text-2xl font-bold">
                                    R$ {(stats.totalEstimatedValue / 1000).toFixed(0)}k
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto p-8">
                {/* Filters */}
                <div className="flex gap-4 mb-6 flex-wrap">
                    <button
                        onClick={() => setSelectedTier('ALL')}
                        className={`px-6 py-3 rounded-lg font-bold transition-all ${selectedTier === 'ALL'
                                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                            }`}
                    >
                        Todas ({opportunities.length})
                    </button>

                    <button
                        onClick={() => setSelectedTier('DIAMOND')}
                        className={`px-6 py-3 rounded-lg font-bold transition-all ${selectedTier === 'DIAMOND'
                                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                            }`}
                    >
                        💎 Diamante ({stats?.diamondCount || 0})
                    </button>

                    <button
                        onClick={() => setSelectedTier('GOLD')}
                        className={`px-6 py-3 rounded-lg font-bold transition-all ${selectedTier === 'GOLD'
                                ? 'bg-gradient-to-r from-yellow-600 to-amber-600 text-white shadow-lg'
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                            }`}
                    >
                        🥇 Ouro ({stats?.goldCount || 0})
                    </button>

                    <button
                        onClick={() => setSelectedTier('SILVER')}
                        className={`px-6 py-3 rounded-lg font-bold transition-all ${selectedTier === 'SILVER'
                                ? 'bg-gradient-to-r from-gray-500 to-slate-500 text-white shadow-lg'
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                            }`}
                    >
                        🥈 Prata ({stats?.silverCount || 0})
                    </button>
                </div>

                {/* Opportunities List */}
                <div className="space-y-4">
                    {filteredOpportunities.length === 0 ? (
                        <div className="bg-gray-800/50 rounded-xl p-12 text-center">
                            <CheckCircle size={64} className="mx-auto text-green-600 mb-4" />
                            <p className="text-gray-400 text-lg">Nenhuma oportunidade nesta categoria</p>
                            <p className="text-gray-500 text-sm mt-2">
                                Excelente trabalho! Continue monitorando o radar.
                            </p>
                        </div>
                    ) : (
                        filteredOpportunities.map(opp => {
                            const config = getTierConfig(opp.tier);
                            const TierIcon = config.icon;

                            return (
                                <div
                                    key={opp.id}
                                    className={`${config.bgColor} backdrop-blur-sm rounded-xl p-6 border-2 ${config.borderColor} hover:shadow-xl transition-all`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            {/* Header */}
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className={`p-2 bg-gradient-to-br ${config.color} rounded-lg`}>
                                                    <TierIcon size={24} className="text-white" />
                                                </div>
                                                <div>
                                                    <h3 className="text-white text-xl font-bold">{opp.patient_name}</h3>
                                                    <span className={`text-sm font-bold ${config.textColor}`}>
                                                        {config.label} • {opp.category}
                                                    </span>
                                                </div>
                                                {opp.days_waiting > 7 && (
                                                    <span className="px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-xs font-bold">
                                                        🚨 URGENTE
                                                    </span>
                                                )}
                                            </div>

                                            {/* Details */}
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                                <div className="flex items-center gap-2 text-gray-400">
                                                    <Phone size={16} />
                                                    <span className="text-sm">{opp.patient_phone}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-green-400">
                                                    <DollarSign size={16} />
                                                    <span className="text-sm font-bold">
                                                        R$ {opp.estimated_value.toLocaleString('pt-BR')}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-yellow-400">
                                                    <Clock size={16} />
                                                    <span className="text-sm">{opp.days_waiting} dias esperando</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-purple-400">
                                                    <TrendingUp size={16} />
                                                    <span className="text-sm">Score: {opp.score}</span>
                                                </div>
                                            </div>

                                            {/* Action Label */}
                                            <div className="bg-white/5 rounded-lg p-3 mb-3">
                                                <p className="text-white text-sm">
                                                    <strong>Ação Recomendada:</strong> {opp.action_label}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex flex-col gap-2 ml-4">
                                            <button
                                                onClick={() => handleWhatsAppClick(opp.patient_phone, opp.whatsapp_script)}
                                                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition-all flex items-center gap-2 whitespace-nowrap"
                                            >
                                                <MessageSquare size={20} />
                                                WhatsApp
                                            </button>
                                            <button
                                                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-all flex items-center gap-2"
                                            >
                                                <Calendar size={20} />
                                                Agendar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};
