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
        loadOrders();
    }, []);

    const loadOrders = async () => {
        try {
            setLoading(true);
            const { data: ordersData, error } = await supabase
                .from('lab_orders')
                .select(`
                    *,
                    patients!inner(name)
                `)
                .eq('clinic_id', profile?.clinic_id)
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
        <div className="p-6 space-y-6 max-w-[1600px] mx-auto bg-slate-50 min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
                        <Microscope className="text-teal-600" size={32} />
                        Laboratório
                    </h1>
                    <p className="text-slate-500 mt-2">Rastreamento de próteses e trabalhos laboratoriais</p>
                </div>
                <button
                    onClick={() => navigate('/lab/new')}
                    className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium shadow-sm"
                >
                    <Plus size={18} />
                    Nova Ordem
                </button>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Total</p>
                    <p className="text-2xl font-bold text-slate-800">{kpis.total}</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Enviados</p>
                    <p className="text-2xl font-bold text-blue-600">{kpis.sent}</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Em Prova</p>
                    <p className="text-2xl font-bold text-amber-600">{kpis.testing}</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Prontos</p>
                    <p className="text-2xl font-bold text-green-600">{kpis.ready}</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Atrasados</p>
                    <p className="text-2xl font-bold text-rose-600">{kpis.overdue}</p>
                </div>
            </div>

            {/* Filters & View Toggle */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                    <button
                        onClick={() => setFilterStatus('ALL')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filterStatus === 'ALL' ? 'bg-violet-50 text-violet-700' : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Todos
                    </button>
                    <button
                        onClick={() => setFilterStatus('SENT')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filterStatus === 'SENT' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:text-blue-600'
                            }`}
                    >
                        Enviados
                    </button>
                    <button
                        onClick={() => setFilterStatus('TESTING')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filterStatus === 'TESTING' ? 'bg-amber-50 text-amber-700' : 'text-slate-500 hover:text-amber-600'
                            }`}
                    >
                        Em Prova
                    </button>
                    <button
                        onClick={() => setFilterStatus('READY')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filterStatus === 'READY' ? 'bg-green-50 text-green-700' : 'text-slate-500 hover:text-green-600'
                            }`}
                    >
                        Prontos
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-violet-50 text-violet-700' : 'text-slate-400 hover:bg-slate-100'
                            }`}
                    >
                        <List size={20} />
                    </button>
                    <button
                        onClick={() => setViewMode('kanban')}
                        className={`p-2 rounded-lg transition-colors ${viewMode === 'kanban' ? 'bg-violet-50 text-violet-700' : 'text-slate-400 hover:bg-slate-100'
                            }`}
                    >
                        <LayoutGrid size={20} />
                    </button>
                </div>
            </div>

            {/* Content */}
            {filteredOrders.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
                    <Microscope size={48} className="mx-auto mb-4 text-slate-300" />
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Nenhuma ordem laboratorial</h3>
                    <p className="text-slate-500 mb-6">Crie uma nova ordem para rastrear próteses e trabalhos laboratoriais</p>
                    <button
                        onClick={() => navigate('/lab/new')}
                        className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
                    >
                        Criar Primeira Ordem
                    </button>
                </div>
            ) : viewMode === 'list' ? (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase">Paciente</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase">Tipo</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase">Laboratório</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase">Enviado</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase">Previsão</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredOrders.map(order => {
                                const statusConfig = getStatusConfig(order.status);
                                const isOverdue = new Date(order.expected_date) < new Date() && order.status !== 'DELIVERED';

                                return (
                                    <tr key={order.id} className="hover:bg-slate-50 transition-colors cursor-pointer">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <User size={16} className="text-slate-400" />
                                                <span className="font-medium text-slate-800">{order.patient_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{order.prosthesis_type}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{order.lab_partner}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {new Date(order.sent_date).toLocaleDateString('pt-BR')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-sm ${isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600'}`}>
                                                {new Date(order.expected_date).toLocaleDateString('pt-BR')}
                                                {isOverdue && ' ⚠️'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                                                {React.createElement(statusConfig.icon, { size: 12 })}
                                                {statusConfig.label}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="flex gap-4 overflow-x-auto pb-4">
                    {kanbanColumns.map(col => {
                        const columnOrders = filteredOrders.filter(o => o.status === col.id);

                        return (
                            <div key={col.id} className={`flex flex-col min-w-[300px] bg-white rounded-xl border-t-4 ${col.color} shadow-sm`}>
                                <div className="p-4 border-b border-slate-100">
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-slate-700">{col.label}</span>
                                        <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                                            {columnOrders.length}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-3 space-y-3 flex-1 bg-slate-50/50">
                                    {columnOrders.map(order => {
                                        const isOverdue = new Date(order.expected_date) < new Date() && order.status !== 'DELIVERED';

                                        return (
                                            <div key={order.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <User size={14} className="text-slate-400" />
                                                    <span className="font-bold text-slate-800 text-sm">{order.patient_name}</span>
                                                </div>
                                                <p className="text-xs text-slate-600 mb-2">{order.prosthesis_type}</p>
                                                <p className="text-xs text-slate-500 mb-3">{order.lab_partner}</p>
                                                <div className="pt-2 border-t border-slate-100 text-xs text-slate-500">
                                                    <p>Previsão: <span className={isOverdue ? 'text-rose-600 font-bold' : ''}>
                                                        {new Date(order.expected_date).toLocaleDateString('pt-BR')}
                                                        {isOverdue && ' ⚠️'}
                                                    </span></p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Lab;
