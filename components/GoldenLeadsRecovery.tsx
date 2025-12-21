import React, { useEffect, useState } from 'react';
import {
    MessageCircle,
    DollarSign,
    Clock,
    Gem,
    Award,
    Star,
    RefreshCw,
    ArrowRight,
    Loader
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
    opportunityRadarService,
    Opportunity,
    DiamondOpportunity,
    GoldOpportunity,
    SilverOpportunity
} from '../services/opportunityRadarService';

export function GoldenLeadsRecovery() {
    const { profile } = useAuth();
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'ALL' | 'DIAMOND' | 'GOLD' | 'SILVER'>('ALL');

    useEffect(() => {
        if (profile?.clinic_id) {
            loadRadar();
        }
    }, [profile?.clinic_id]);

    const loadRadar = async () => {
        if (!profile?.clinic_id) return;

        setLoading(true);
        try {
            const data = await opportunityRadarService.getAllOpportunities(profile.clinic_id);
            setOpportunities(data);
        } catch (error) {
            console.error('Erro ao carregar radar:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleWhatsAppClick = (opp: Opportunity) => {
        const cleanPhone = opp.patient_phone.replace(/\D/g, '');
        const text = encodeURIComponent(opp.whatsapp_script);
        window.open(`https://wa.me/55${cleanPhone}?text=${text}`, '_blank');
    };

    const getStyleByTier = (tier: Opportunity['tier']) => {
        switch (tier) {
            case 'DIAMOND':
                return {
                    bg: 'bg-blue-50',
                    border: 'border-blue-300',
                    icon: <Gem className="w-5 h-5 text-blue-600" />,
                    titleColor: 'text-blue-900',
                    badge: 'bg-blue-100 text-blue-700 border border-blue-300',
                    label: 'DIAMANTE 💎',
                    xpColor: 'bg-blue-100 text-blue-700 border-blue-200'
                };
            case 'GOLD':
                return {
                    bg: 'bg-yellow-50',
                    border: 'border-yellow-300',
                    icon: <Award className="w-5 h-5 text-yellow-600" />,
                    titleColor: 'text-yellow-900',
                    badge: 'bg-yellow-100 text-yellow-700 border border-yellow-300',
                    label: 'OURO 🥇',
                    xpColor: 'bg-yellow-100 text-yellow-700 border-yellow-200'
                };
            case 'SILVER':
                return {
                    bg: 'bg-slate-50',
                    border: 'border-slate-300',
                    icon: <Star className="w-5 h-5 text-slate-600" />,
                    titleColor: 'text-slate-900',
                    badge: 'bg-slate-100 text-slate-700 border border-slate-300',
                    label: 'PRATA 🥈',
                    xpColor: 'bg-slate-100 text-slate-700 border-slate-200'
                };
        }
    };

    const filteredOpportunities = filter === 'ALL'
        ? opportunities
        : opportunities.filter(o => o.tier === filter);

    if (loading) {
        return (
            <div className="w-full bg-white rounded-xl shadow-sm border border-gray-100 p-8 flex items-center justify-center">
                <Loader className="w-6 h-6 text-purple-500 animate-spin mr-3" />
                <span className="text-gray-500">Carregando Radar de Oportunidades...</span>
            </div>
        );
    }

    return (
        <div className="w-full bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Cabeçalho do Radar */}
            <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-white">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            📡 Radar de Oportunidades Vilas
                        </h2>
                        <p className="text-sm text-gray-500">
                            {filteredOpportunities.length} pacientes prioritários identificados pela IA
                        </p>
                    </div>
                    <button
                        onClick={loadRadar}
                        className="p-2 hover:bg-purple-100 rounded-full transition-colors"
                        title="Atualizar Radar"
                    >
                        <RefreshCw className="w-4 h-4 text-purple-600" />
                    </button>
                </div>

                {/* Filtros */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setFilter('ALL')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === 'ALL'
                                ? 'bg-purple-600 text-white shadow-sm'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        Todas ({opportunities.length})
                    </button>
                    <button
                        onClick={() => setFilter('DIAMOND')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === 'DIAMOND'
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                            }`}
                    >
                        💎 Diamante ({opportunities.filter(o => o.tier === 'DIAMOND').length})
                    </button>
                    <button
                        onClick={() => setFilter('GOLD')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === 'GOLD'
                                ? 'bg-yellow-600 text-white shadow-sm'
                                : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                            }`}
                    >
                        🥇 Ouro ({opportunities.filter(o => o.tier === 'GOLD').length})
                    </button>
                    <button
                        onClick={() => setFilter('SILVER')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === 'SILVER'
                                ? 'bg-slate-600 text-white shadow-sm'
                                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                            }`}
                    >
                        🥈 Prata ({opportunities.filter(o => o.tier === 'SILVER').length})
                    </button>
                </div>
            </div>

            {/* Lista de Cards */}
            <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
                {filteredOpportunities.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                        <div className="text-6xl mb-4">🎉</div>
                        <p className="text-lg font-medium text-gray-600">
                            Nenhuma oportunidade {filter !== 'ALL' ? filter.toLowerCase() : ''} detectada!
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                            {filter === 'ALL'
                                ? 'Excelente trabalho! Continue monitorando o radar.'
                                : 'Tente outro filtro ou atualize o radar.'}
                        </p>
                    </div>
                ) : (
                    filteredOpportunities.map((opp) => {
                        const style = getStyleByTier(opp.tier);

                        return (
                            <div
                                key={opp.id}
                                className={`relative p-4 rounded-lg border-2 ${style.border} ${style.bg} hover:shadow-lg transition-all duration-200 group`}
                            >
                                {/* Badge de Score (Gamificação) */}
                                <div className={`absolute top-0 right-0 ${style.xpColor} text-xs font-bold px-3 py-1.5 rounded-bl-lg border-b-2 border-l-2`}>
                                    Score: {opp.score}
                                </div>

                                <div className="flex items-start gap-4">
                                    {/* Ícone Lateral */}
                                    <div className="p-3 rounded-full bg-white shadow-md border-2 border-gray-200">
                                        {style.icon}
                                    </div>

                                    {/* Conteúdo */}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`text-xs font-bold px-3 py-1 rounded-full ${style.badge}`}>
                                                {style.label}
                                            </span>
                                            <span className="text-xs text-gray-600 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {opp.days_waiting} dias esperando
                                            </span>
                                        </div>

                                        <h3 className={`font-bold ${style.titleColor} text-lg mb-1`}>
                                            {opp.patient_name}
                                        </h3>

                                        <p className="text-sm text-gray-700 font-medium mb-1">
                                            {opp.category}
                                        </p>

                                        <p className="text-sm text-gray-600 mb-3">
                                            {opp.action_label}
                                        </p>

                                        {/* Informações Adicionais */}
                                        {opp.tier === 'DIAMOND' && (
                                            <div className="mb-3 p-2 bg-blue-100/50 rounded border border-blue-200">
                                                <p className="text-xs text-blue-800 font-medium">
                                                    Procedimentos: {(opp as DiamondOpportunity).procedures.join(', ')}
                                                </p>
                                            </div>
                                        )}

                                        {opp.tier === 'GOLD' && (
                                            <div className="mb-3 p-2 bg-yellow-100/50 rounded border border-yellow-200">
                                                <p className="text-xs text-yellow-800 font-medium">
                                                    Avaliação: {new Date((opp as GoldOpportunity).appointment_date).toLocaleDateString('pt-BR')}
                                                </p>
                                            </div>
                                        )}

                                        {opp.tier === 'SILVER' && (
                                            <div className="mb-3 p-2 bg-slate-100/50 rounded border border-slate-200">
                                                <p className="text-xs text-slate-800 font-medium">
                                                    Último procedimento: {(opp as SilverOpportunity).last_procedure || 'N/A'}
                                                </p>
                                            </div>
                                        )}

                                        {/* Botão de Ação (WhatsApp) */}
                                        <button
                                            onClick={() => handleWhatsAppClick(opp)}
                                            className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-bold text-sm transition-all shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                                        >
                                            <MessageCircle className="w-4 h-4" />
                                            Enviar Mensagem Pronta via WhatsApp
                                            <ArrowRight className="w-4 h-4 opacity-70 group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                </div>

                                {/* Valor Estimado */}
                                <div className="mt-3 pt-3 border-t-2 border-gray-200/50 flex justify-between items-center">
                                    <span className="text-sm text-gray-600 font-medium">Potencial Estimado:</span>
                                    <span className="font-black text-lg text-green-700 flex items-center gap-1">
                                        <DollarSign className="w-4 h-4" />
                                        {opp.estimated_value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Footer com Resumo */}
            {filteredOpportunities.length > 0 && (
                <div className="p-4 border-t border-gray-100 bg-gray-50">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">
                            Potencial Total:
                        </span>
                        <span className="font-black text-xl text-green-700">
                            {filteredOpportunities
                                .reduce((sum, o) => sum + o.estimated_value, 0)
                                .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
