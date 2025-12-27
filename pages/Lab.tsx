import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Microscope, Plus, Calendar, User, Package, Clock, CheckCircle, AlertCircle, List, LayoutGrid, Filter, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface LabOrder {
    id: string;
    patient_id: string;
    patient_name: string;
    prosthesis_type: string;
    lab_partner: string;
    sent_date: string;
    expected_date: string;
    status: 'SENT' | 'TESTING' | 'READY' | 'DELIVERED';
    notes: string;
}

const Lab: React.FC = () => {
    const navigate = useNavigate();
    const { profile } = useAuth();

    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState<LabOrder[]>([]);
    const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'SENT' | 'TESTING' | 'READY' | 'DELIVERED'>('ALL');

    useEffect(() => {
        if (profile?.clinic_id) {
            loadOrders();
        }
    }, [profile?.clinic_id]);

    const loadOrders = async () => {
        if (!profile?.clinic_id) return;

        try {
            setLoading(true);
            const { data: ordersData, error } = await supabase
                .from('lab_orders')
                .select(`
                    *,
                    patients!inner(name)
                `)
                .eq('clinic_id', profile.clinic_id)
                .order('sent_date', { ascending: false });

            if (error) throw error;

            setOrders(ordersData.map((order: any) => ({
                id: order.id,
                patient_id: order.patient_id,
                patient_name: order.patients.name,
                prosthesis_type: order.prosthesis_type,
                lab_partner: order.lab_partner,
                sent_date: order.sent_date,
                expected_date: order.expected_date,
                status: order.status,
                notes: order.notes
            })));
        } catch (error) {
            console.error('Erro ao carregar ordens:', error);
            toast.error('Erro ao carregar ordens laboratoriais');
        } finally {
            setLoading(false);
        }
    };

    const getStatusConfig = (status: string) => {
        const configs: Record<string, any> = {
            SENT: { label: 'Enviado', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: Package },
            TESTING: { label: 'Em Prova', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: Clock },
            READY: { label: 'Pronto', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: CheckCircle },
            DELIVERED: { label: 'Entregue', bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', icon: CheckCircle }
        };
        return configs[status] || configs.SENT;
    };

    const filteredOrders = filterStatus === 'ALL'
        ? orders
        : orders.filter(o => o.status === filterStatus);

    const kanbanColumns = [
        { id: 'SENT', label: 'Enviado', color: 'border-blue-500' },
        { id: 'TESTING', label: 'Em Prova', color: 'border-amber-500' },
        { id: 'READY', label: 'Pronto', color: 'border-green-500' },
        { id: 'DELIVERED', label: 'Entregue', color: 'border-slate-400' }
    ];

    const kpis = {
        total: orders.length,
        sent: orders.filter(o => o.status === 'SENT').length,
        testing: orders.filter(o => o.status === 'TESTING').length,
        ready: orders.filter(o => o.status === 'READY').length,
        overdue: orders.filter(o => new Date(o.expected_date) < new Date() && o.status !== 'DELIVERED').length
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
                <Loader2 className="w-12 h-12 text-violet-600 animate-spin mb-4" />
                <p className="text-slate-500 font-medium">Carregando ordens laboratoriais...</p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden">
            {/* HEADER FIXO */}
            <div className="flex-none bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-3 md:p-4">
                {/* Header Top */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
                            <Microscope className="text-teal-600 dark:text-teal-400" size={24} />
                            Laboratório
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Gestão de próteses e trabalhos externos</p>
                    </div>
                    <button
                        onClick={() => navigate('/lab/new')}
                        className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium shadow-sm active:scale-[0.98]"
                    >
                        <Plus size={18} />
                        Nova Ordem
                    </button>
                </div>

                {/* Filters & KPIs */}
                <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
                    {/* Filter Tabs */}
                    <div className="w-full md:w-auto flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg overflow-x-auto pb-2 md:pb-1">
                        <button
                            onClick={() => setFilterStatus('ALL')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${filterStatus === 'ALL' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                        >
                            Todos
                        </button>
                        <button
                            onClick={() => setFilterStatus('SENT')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${filterStatus === 'SENT' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                        >
                            Enviados ({kpis.sent})
                        </button>
                        <button
                            onClick={() => setFilterStatus('TESTING')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${filterStatus === 'TESTING' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                        >
                            Em Prova ({kpis.testing})
                        </button>
                        <button
                            onClick={() => setFilterStatus('READY')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${filterStatus === 'READY' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                        >
                            Prontos ({kpis.ready})
                        </button>
                    </div>

                    {/* View Toggle */}
                    <div className="hidden md:flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                        >
                            <List size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('kanban')}
                            className={`p-1.5 rounded-md transition-colors ${viewMode === 'kanban' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                        >
                            <LayoutGrid size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* CONTENT AREA */}
            <div className={`flex-1 overflow-hidden ${viewMode === 'kanban' ? 'overflow-x-auto' : 'overflow-y-auto scroll-smooth'} bg-slate-50 dark:bg-slate-950 p-3 md:p-4`}>

                {filteredOrders.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                            <Microscope size={32} className="text-slate-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Nenhuma ordem encontrada</h3>
                        <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-sm">
                            Não existem ordens com o filtro selecionado ou nenhuma ordem foi criada ainda.
                        </p>
                        {filterStatus === 'ALL' && (
                            <button
                                onClick={() => navigate('/lab/new')}
                                className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
                            >
                                Criar Primeira Ordem
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {/* LIST VIEW (Mobile Default) */}
                        <div className={`${viewMode === 'kanban' ? 'hidden' : 'block'}`}>
                            {/* Mobile Cards */}
                            <div className="md:hidden space-y-3">
                                {filteredOrders.map(order => {
                                    const statusConfig = getStatusConfig(order.status);
                                    const isOverdue = new Date(order.expected_date) < new Date() && order.status !== 'DELIVERED';

                                    return (
                                        <div key={order.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-slate-800 dark:text-white">{order.patient_name}</span>
                                                </div>
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                                                    {statusConfig.label}
                                                </span>
                                            </div>

                                            <h4 className="font-medium text-slate-700 dark:text-slate-300 text-sm mb-1">{order.prosthesis_type}</h4>
                                            <p className="text-xs text-slate-500 dark:text-slate-500 mb-3">{order.lab_partner}</p>

                                            <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center text-xs">
                                                <div>
                                                    <p className="text-slate-400">Enviado</p>
                                                    <p className="font-medium text-slate-600 dark:text-slate-300">{new Date(order.sent_date).toLocaleDateString('pt-BR')}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-slate-400">Previsão</p>
                                                    <p className={`font-bold ${isOverdue ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-300'}`}>
                                                        {new Date(order.expected_date).toLocaleDateString('pt-BR')}
                                                        {isOverdue && ' ⚠️'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Desktop Table */}
                            <div className="hidden md:block bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden transition-colors">
                                <table className="w-full">
                                    <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Paciente</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Tipo</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Laboratório</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Enviado</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Previsão</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                        {filteredOrders.map(order => {
                                            const statusConfig = getStatusConfig(order.status);
                                            const isOverdue = new Date(order.expected_date) < new Date() && order.status !== 'DELIVERED';

                                            return (
                                                <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="p-1.5 bg-slate-100 dark:bg-slate-700 rounded-full">
                                                                <User size={14} className="text-slate-500 dark:text-slate-400" />
                                                            </div>
                                                            <span className="font-medium text-slate-800 dark:text-white">{order.patient_name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{order.prosthesis_type}</td>
                                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{order.lab_partner}</td>
                                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                                                        {new Date(order.sent_date).toLocaleDateString('pt-BR')}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`text-sm ${isOverdue ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-600 dark:text-slate-400'}`}>
                                                            {new Date(order.expected_date).toLocaleDateString('pt-BR')}
                                                            {isOverdue && ' ⚠️'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                                                            {statusConfig.label}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* KANBAN VIEW (Desktop Only) */}
                        <div className={`hidden ${viewMode === 'kanban' ? 'md:flex' : ''} h-full gap-4 min-w-max pb-4`}>
                            {kanbanColumns.map(col => {
                                const columnOrders = filteredOrders.filter(o => o.status === col.id);

                                return (
                                    <div key={col.id} className={`flex flex-col w-[300px] bg-slate-100 dark:bg-slate-900 rounded-xl border-t-4 ${col.color} shadow-sm overflow-hidden`}>
                                        <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800">
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-slate-700 dark:text-slate-300">{col.label}</span>
                                                <span className="text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full">
                                                    {columnOrders.length}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="p-3 space-y-3 flex-1 overflow-y-auto bg-slate-100/50 dark:bg-black/20">
                                            {columnOrders.map(order => {
                                                const isOverdue = new Date(order.expected_date) < new Date() && order.status !== 'DELIVERED';

                                                return (
                                                    <div key={order.id} className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all cursor-pointer group">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className="font-bold text-slate-800 dark:text-white text-sm line-clamp-1">{order.patient_name}</span>
                                                        </div>
                                                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-1 font-medium">{order.prosthesis_type}</p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-500 mb-3">{order.lab_partner}</p>
                                                        <div className="pt-2 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-500 flex justify-between">
                                                            <span>Prev:</span>
                                                            <span className={isOverdue ? 'text-rose-600 dark:text-rose-400 font-bold' : ''}>
                                                                {new Date(order.expected_date).toLocaleDateString('pt-BR')}
                                                                {isOverdue && '!'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Lab;
