import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { professionalPaymentService, PendingProductionItem } from '../../services/professionalPaymentService';
import { supabase } from '../../lib/supabase';
import {
    Calendar,
    User,
    DollarSign,
    FileText,
    CheckCircle2,
    Filter,
    Download,
    ChevronRight,
    AlertCircle,
    Loader2
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Professional {
    id: string;
    name: string;
}

const ProfessionalPaymentPanel: React.FC = () => {
    const { profile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [professionals, setProfessionals] = useState<Professional[]>([]);
    const [selectedProfessional, setSelectedProfessional] = useState<string>('');

    // Date Filter (Default to current month)
    const [startDate, setStartDate] = useState(() => {
        const date = new Date();
        date.setDate(1); // First day
        return date.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => {
        const date = new Date(); // Today
        return date.toISOString().split('T')[0];
    });

    const [items, setItems] = useState<PendingProductionItem[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');

    useEffect(() => {
        if (profile?.clinic_id) {
            loadProfessionals();
            loadData();
        }
    }, [profile?.clinic_id, selectedProfessional, startDate, endDate, activeTab]);

    const loadProfessionals = async () => {
        const { data } = await supabase
            .from('professionals')
            .select('id, name')
            .eq('clinic_id', profile?.clinic_id)
            .eq('is_active', true)
            .order('name');

        if (data) setProfessionals(data);
    };

    const loadData = async () => {
        if (!profile?.clinic_id) return;
        setLoading(true);
        try {
            if (activeTab === 'pending') {
                const data = await professionalPaymentService.getPendingProduction(
                    profile.clinic_id,
                    selectedProfessional || null,
                    startDate,
                    endDate
                );
                setItems(data);
            } else {
                const data = await professionalPaymentService.getPaymentHistory(
                    profile.clinic_id,
                    selectedProfessional || undefined
                );
                setHistory(data || []);
            }
        } catch (error) {
            console.error(error);
            toast.error("Erro ao carregar dados");
        } finally {
            setLoading(false);
        }
    };

    const handleGeneratePayment = async () => {
        if (!selectedProfessional) {
            toast.error("Selecione um profissional para gerar o repasse");
            return;
        }
        if (items.length === 0) {
            toast.error("Não há itens pendentes para este período");
            return;
        }

        const confirm = window.confirm(`Confirmar geração de repasse para ${items.length} itens? \nValor Total: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalCommission)}`);

        if (!confirm) return;

        try {
            setLoading(true);
            const itemIds = items.map(i => i.item_id);
            await professionalPaymentService.generatePaymentOrder(
                profile!.clinic_id,
                selectedProfessional,
                startDate,
                endDate,
                itemIds,
                totalCommission,
                `Repasse Ref: ${startDate} a ${endDate}`
            );
            toast.success("Ordem de pagamento gerada com sucesso!");
            loadData(); // Reload to refresh list
        } catch (error) {
            console.error(error);
            toast.error("Erro ao gerar repasse");
        } finally {
            setLoading(false);
        }
    };

    // Calculations
    const totalProduction = items.reduce((acc, item) => acc + (item.total_charged || 0), 0);
    const totalCommission = items.reduce((acc, item) => acc + (item.total_commission_value || 0), 0);

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <DollarSign className="text-emerald-600" />
                        Repasse de Honorários
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Gerencie o pagamento de comissões por produção clínica
                    </p>
                </div>

                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'pending'
                                ? 'bg-white dark:bg-gray-700 text-emerald-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                            }`}
                    >
                        Pendente
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'history'
                                ? 'bg-white dark:bg-gray-700 text-emerald-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                            }`}
                    >
                        Histórico
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Profissional</label>
                    <div className="relative">
                        <User className="absolute left-3 top-2.5 text-gray-400 h-4 w-4" />
                        <select
                            value={selectedProfessional}
                            onChange={(e) => setSelectedProfessional(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                        >
                            <option value="">Todos os Profissionais</option>
                            {professionals.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="w-full md:w-auto">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Período</label>
                    <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-1">
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-transparent border-none text-sm focus:ring-0 p-1"
                        />
                        <span className="text-gray-400">-</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="bg-transparent border-none text-sm focus:ring-0 p-1"
                        />
                    </div>
                </div>

                <button
                    onClick={loadData}
                    className="p-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg text-gray-600 transition-colors"
                    title="Atualizar"
                >
                    <Filter size={18} />
                </button>
            </div>

            {activeTab === 'pending' && (
                <>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <DollarSign size={48} />
                            </div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Produzido (Cobrado)</p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalProduction)}
                            </h3>
                            <div className="mt-2 text-xs text-emerald-600 font-medium bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full inline-block">
                                {items.length} procedimentos
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-xl shadow-lg relative overflow-hidden text-white">
                            <div className="absolute top-0 right-0 p-4 opacity-20">
                                <CheckCircle2 size={48} />
                            </div>
                            <p className="text-sm font-medium text-emerald-100">Total a Repassar</p>
                            <h3 className="text-3xl font-bold mt-1">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalCommission)}
                            </h3>
                            <p className="mt-2 text-xs text-emerald-100 opacity-90">
                                Comissão média: {totalProduction > 0 ? ((totalCommission / totalProduction) * 100).toFixed(1) : 0}%
                            </p>
                        </div>

                        <div className="flex flex-col justify-center">
                            <button
                                onClick={handleGeneratePayment}
                                disabled={selectedProfessional === '' || items.length === 0 || loading}
                                className="w-full h-full min-h-[120px] bg-white dark:bg-gray-800 border-2 border-dashed border-emerald-500/30 hover:border-emerald-500 rounded-xl flex flex-col items-center justify-center gap-3 group transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-50 dark:hover:bg-emerald-900/10"
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin text-emerald-600" size={32} />
                                ) : (
                                    <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full group-hover:scale-110 transition-transform">
                                        <FileText size={24} />
                                    </div>
                                )}
                                <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                                    {selectedProfessional ? 'Gerar Ordem de Pagamento' : 'Selecione um Profissional'}
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-900/50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Paciente</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Procedimento</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Profissional</th>
                                        <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Valor Cobrado</th>
                                        <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Comissão</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {items.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                                <div className="flex flex-col items-center gap-2">
                                                    <AlertCircle className="text-gray-300" size={32} />
                                                    <p>Nenhum item pendente encontrado para o período.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        items.map((item) => (
                                            <tr key={item.item_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                    {new Date(item.production_date).toLocaleDateString('pt-BR')}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                                    {item.patient_name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                                                    {item.procedure_name}
                                                    {item.quantity > 1 && <span className="ml-2 text-xs bg-gray-100 px-2 py-0.5 rounded-full">x{item.quantity}</span>}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                    {item.professional_name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.total_charged)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-emerald-600 text-right">
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.total_commission_value)}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {activeTab === 'history' && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-900/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Data Geração</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Profissional</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Período</th>
                                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase">Itens</th>
                                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase">Valor Total</th>
                                <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {history.map((pay) => (
                                <tr key={pay.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {new Date(pay.created_at).toLocaleDateString('pt-BR')}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                        {pay.professional?.name}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {new Date(pay.period_start).toLocaleDateString('pt-BR')} até {new Date(pay.period_end).toLocaleDateString('pt-BR')}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 text-right">
                                        {pay.procedures_count}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-bold text-emerald-600 text-right">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pay.commission_value)}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${pay.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                            }`}>
                                            {pay.status === 'PAID' ? 'Pago' : 'Pendente'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {history.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        Nenhum histórico encontrado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ProfessionalPaymentPanel;
