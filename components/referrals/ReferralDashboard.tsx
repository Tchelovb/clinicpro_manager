// =====================================================
// PÁGINA: ReferralDashboard (Programa de Indicações)
// =====================================================

import React, { useEffect, useState } from 'react';
import { ReferralService } from '../../services/referralService';
import { ReferralLeaderboard } from '../../types/referrals';
import { ReferralRankBadge } from './ReferralRankBadge';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2, RefreshCw, Users, TrendingUp, DollarSign, Gift, Phone, Mail } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const ReferralDashboard: React.FC = () => {
    const { user } = useAuth();
    const [leaderboard, setLeaderboard] = useState<ReferralLeaderboard[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalReferrals: 0,
        totalRevenue: 0,
        averageRevenuePerReferral: 0
    });

    const loadData = async () => {
        if (!user?.clinic_id) return;

        setLoading(true);
        try {
            const [leaderboardData, totalReferrals, totalRevenue] = await Promise.all([
                ReferralService.getLeaderboard(user.clinic_id, 10),
                ReferralService.getTotalReferredPatients(user.clinic_id),
                ReferralService.getTotalReferralRevenue(user.clinic_id)
            ]);

            setLeaderboard(leaderboardData);
            setStats({
                totalReferrals,
                totalRevenue,
                averageRevenuePerReferral: totalReferrals > 0 ? totalRevenue / totalReferrals : 0
            });
        } catch (error) {
            console.error('Error loading referral data:', error);
            toast.error('Erro ao carregar dados de indicações');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [user?.clinic_id]);

    const getScoreBadge = (score?: string) => {
        const config: Record<string, { label: string; color: string; bg: string }> = {
            DIAMOND: { label: '💎 Diamond', color: 'text-purple-700', bg: 'bg-purple-100' },
            GOLD: { label: '🥇 Gold', color: 'text-yellow-700', bg: 'bg-yellow-100' },
            STANDARD: { label: 'Standard', color: 'text-gray-700', bg: 'bg-gray-100' },
            RISK: { label: '⚠️ Risk', color: 'text-orange-700', bg: 'bg-orange-100' },
            BLACKLIST: { label: '🚫 Blacklist', color: 'text-red-700', bg: 'bg-red-100' }
        };

        const { label, color, bg } = config[score || 'STANDARD'] || config.STANDARD;

        return (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${bg} ${color}`}>
                {label}
            </span>
        );
    };

    if (loading && leaderboard.length === 0) {
        return (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 bg-gray-50 min-h-screen">

            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">🎁 Programa de Indicações</h1>
                    <p className="text-gray-500">Reconheça e recompense seus embaixadores de marca</p>
                </div>
                <button
                    onClick={loadData}
                    className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Atualizar
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium text-gray-500">Total de Indicações</div>
                            <div className="text-3xl font-bold text-gray-900 mt-2">{stats.totalReferrals}</div>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-full">
                            <Users className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium text-gray-500">Receita de Indicações</div>
                            <div className="text-3xl font-bold text-green-900 mt-2">
                                R$ {stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                        </div>
                        <div className="p-3 bg-green-100 rounded-full">
                            <DollarSign className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium text-gray-500">Ticket Médio/Indicação</div>
                            <div className="text-3xl font-bold text-purple-900 mt-2">
                                R$ {stats.averageRevenuePerReferral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                        </div>
                        <div className="p-3 bg-purple-100 rounded-full">
                            <TrendingUp className="w-6 h-6 text-purple-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Leaderboard */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Gift className="w-6 h-6 text-purple-600" />
                        🏆 Top 10 Embaixadores de Marca
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                        Pacientes que mais indicam novos clientes para a clínica
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Embaixador</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Indicações</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receita Gerada</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Última Indicação</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {leaderboard.map((item) => (
                                <tr key={item.patient_id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <ReferralRankBadge rank={item.rank} />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{item.patient_name}</div>
                                        <div className="text-xs text-gray-500 flex items-center mt-1">
                                            <Phone className="w-3 h-3 mr-1" />
                                            {item.patient_phone}
                                        </div>
                                        {item.patient_email && (
                                            <div className="text-xs text-gray-500 flex items-center mt-0.5">
                                                <Mail className="w-3 h-3 mr-1" />
                                                {item.patient_email}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getScoreBadge(item.patient_score)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-2xl font-bold text-blue-600">{item.total_referrals}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-green-600">
                                            R$ {item.total_revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {item.last_referral_date
                                            ? new Date(item.last_referral_date).toLocaleDateString('pt-BR')
                                            : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button
                                            className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                                            onClick={() => toast.success('Funcionalidade de recompensa em breve!')}
                                        >
                                            🎁 Recompensar
                                        </button>
                                    </td>
                                </tr>
                            ))}

                            {leaderboard.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                        Nenhuma indicação registrada ainda. Incentive seus pacientes a indicarem amigos!
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Dica de Incentivo */}
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-purple-900 mb-2">💡 Dica: Como Incentivar Indicações</h3>
                <ul className="space-y-2 text-sm text-purple-800">
                    <li className="flex items-start gap-2">
                        <span className="text-purple-600 font-bold">•</span>
                        <span>Ofereça <strong>desconto de 10%</strong> para quem indicar um amigo que fechar tratamento</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-purple-600 font-bold">•</span>
                        <span>Crie um <strong>programa de pontos</strong>: cada indicação = 100 pontos (R$ 100 em crédito)</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-purple-600 font-bold">•</span>
                        <span>Reconheça publicamente no Instagram os <strong>Top 3 embaixadores do mês</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-purple-600 font-bold">•</span>
                        <span>Ofereça <strong>brindes exclusivos</strong> para quem indicar 5+ pacientes (ex: kit de skincare)</span>
                    </li>
                </ul>
            </div>
        </div>
    );
};
