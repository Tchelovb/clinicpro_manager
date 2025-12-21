// =====================================================
// PÁGINA: RecallDashboard (Retention Module)
// =====================================================

import React, { useEffect, useState } from 'react';
import { RecallService } from '../../services/recallService';
import { RecallOpportunity, RecallStats, RECALL_MESSAGES } from '../../types/recalls';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2, RefreshCw, Calendar, Phone, CheckCircle, Clock, AlertTriangle, MessageSquare, Filter } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { RecallStatusBadge } from './RecallStatusBadge';

export const RecallDashboard: React.FC = () => {
    const { user } = useAuth();
    const [opportunities, setOpportunities] = useState<RecallOpportunity[]>([]);
    const [stats, setStats] = useState<RecallStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'ALL' | 'OVERDUE' | 'PENDING' | 'TODAY'>('ALL');

    const loadData = async () => {
        if (!user?.clinic_id) return;

        setLoading(true);
        try {
            const [opps, statistics] = await Promise.all([
                RecallService.getRecallOpportunities(user.clinic_id),
                RecallService.getStats(user.clinic_id)
            ]);

            setOpportunities(opps);
            setStats(statistics);
        } catch (error) {
            console.error('Error loading recalls:', error);
            // toast.error('Erro ao carregar dados de recalls'); // Comentado para não spamar se tabela não existir ainda
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [user?.clinic_id]);

    const handleCopyMessage = (message: string) => {
        navigator.clipboard.writeText(message);
        toast.success('Mensagem copiada!');
    };

    const handleRecordContact = async (id: string) => {
        if (confirm('Registrar que o contato foi realizado via WhatsApp?')) {
            try {
                await RecallService.recordContact({
                    recall_id: id,
                    contact_method: 'WHATSAPP',
                    contact_notes: 'Contato registrado via dashboard rápido'
                });
                toast.success('Contato registrado!');
                loadData();
            } catch (error) {
                toast.error('Erro ao registrar contato');
            }
        }
    };

    const filteredOpportunities = opportunities.filter(op => {
        if (activeTab === 'OVERDUE') return op.status === 'OVERDUE' || (op.days_overdue > 0 && op.status === 'PENDING');
        if (activeTab === 'PENDING') return op.status === 'PENDING';
        if (activeTab === 'TODAY') {
            const today = new Date().toISOString().split('T')[0];
            return op.due_date === today;
        }
        return true;
    });

    if (loading && !stats) {
        return (
            // Centralizar Spinner
            <div className="flex justify-center items-center h-full min-h-[400px]">
                <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">📅 Central de Recalls</h1>
                    <p className="text-gray-500">Gerencie retornos e aumente a retenção de pacientes</p>
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
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
                        <div>
                            <div className="text-sm font-medium text-gray-500">Recalls Pendentes</div>
                            <div className="text-2xl font-bold text-gray-900 mt-1">{stats.pending_recalls}</div>
                        </div>
                        <div className="mt-4 flex items-center text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded w-fit">
                            <Clock className="w-3 h-3 mr-1" /> Ação Necessária
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
                        <div>
                            <div className="text-sm font-medium text-gray-500">Atrasados (Overdue)</div>
                            <div className="text-2xl font-bold text-red-600 mt-1">{stats.overdue_recalls}</div>
                        </div>
                        <div className="mt-4 flex items-center text-xs text-red-600 bg-red-50 px-2 py-1 rounded w-fit">
                            <AlertTriangle className="w-3 h-3 mr-1" /> Prioridade Alta
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
                        <div>
                            <div className="text-sm font-medium text-gray-500">Taxa de Sucesso</div>
                            <div className="text-2xl font-bold text-green-600 mt-1">
                                {stats.contact_success_rate.toFixed(1)}%
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded w-fit">
                            <CheckCircle className="w-3 h-3 mr-1" /> Conversão
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
                        <div>
                            <div className="text-sm font-medium text-gray-500">Potencial Financeiro</div>
                            <div className="text-2xl font-bold text-blue-600 mt-1">
                                R$ {stats.total_potential_revenue.toLocaleString('pt-BR')}
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded w-fit">
                            💰 Receita Estimada
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Tabs */}
                <div className="border-b border-gray-200">
                    <nav className="flex -mb-px">
                        <button
                            onClick={() => setActiveTab('ALL')}
                            className={`py-4 px-6 text-sm font-medium border-b-2 ${activeTab === 'ALL'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            Todos
                        </button>
                        <button
                            onClick={() => setActiveTab('PENDING')}
                            className={`py-4 px-6 text-sm font-medium border-b-2 ${activeTab === 'PENDING'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            Pendentes
                        </button>
                        <button
                            onClick={() => setActiveTab('TODAY')}
                            className={`py-4 px-6 text-sm font-medium border-b-2 ${activeTab === 'TODAY'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            Para Hoje
                        </button>
                        <button
                            onClick={() => setActiveTab('OVERDUE')}
                            className={`py-4 px-6 text-sm font-medium border-b-2 ${activeTab === 'OVERDUE'
                                ? 'border-red-500 text-red-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            Atrasados
                        </button>
                    </nav>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paciente</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo de Recall</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vencimento</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prioridade</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredOpportunities.length > 0 ? (
                                filteredOpportunities.map((op) => (
                                    <tr key={op.recall_id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{op.patient_name}</div>
                                                    <div className="text-xs text-gray-500 flex items-center">
                                                        <Phone className="w-3 h-3 mr-1" /> {op.patient_phone}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 font-medium">{op.recall_type.replace('_', ' ')}</div>
                                            <div className="text-xs text-gray-500">{op.category}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className={`text-sm ${op.days_overdue > 0 ? 'text-red-600 font-bold' : 'text-gray-900'}`}>
                                                {new Date(op.due_date).toLocaleDateString('pt-BR')}
                                            </div>
                                            {op.days_overdue > 0 && (
                                                <div className="text-xs text-red-500">
                                                    {op.days_overdue} dias atrasado
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <RecallStatusBadge status={op.status} />
                                            {op.contact_attempts > 0 && (
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {op.contact_attempts} tentativas
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className={`h-2.5 w-2.5 rounded-full mr-2 ${op.priority > 70 ? 'bg-red-500' : op.priority > 40 ? 'bg-yellow-500' : 'bg-green-500'
                                                    }`}></div>
                                                <span className="text-sm text-gray-500">{op.priority}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleCopyMessage(RECALL_MESSAGES[op.recall_type] || 'Olá, vamos agendar seu retorno?')}
                                                    className="text-blue-600 hover:text-blue-900 p-1"
                                                    title="Copiar Mensagem Sugerida"
                                                >
                                                    <MessageSquare className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleRecordContact(op.recall_id)}
                                                    className="text-green-600 hover:text-green-900 p-1"
                                                    title="Registrar Contato"
                                                >
                                                    <CheckCircle className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                                        <p className="text-lg font-medium">Nenhum recall encontrado</p>
                                        <p className="text-sm">Parabéns! Você está em dia com seus pacientes.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
