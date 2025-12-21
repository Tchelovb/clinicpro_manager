// =====================================================
// PÁGINA: LabOrderList (Dashboard Laboratorial)
// =====================================================

import React, { useEffect, useState } from 'react';
import { LabOrderService } from '@/services/labOrderService';
import { LabOrder, OverdueLabOrder, LabSupplierPerformance } from '@/types/labOrders';
import { LabOrderStatusBadge } from './LabOrderStatusBadge';
import { LabOrderForm } from './LabOrderForm';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, RefreshCw, Plus, AlertTriangle, TrendingUp, Package } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const LabOrderList: React.FC = () => {
    const { profile } = useAuth();
    const [orders, setOrders] = useState<LabOrder[]>([]);
    const [overdueOrders, setOverdueOrders] = useState<OverdueLabOrder[]>([]);
    const [suppliers, setSuppliers] = useState<LabSupplierPerformance[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [activeTab, setActiveTab] = useState<'all' | 'overdue' | 'suppliers'>('all');

    const loadData = async () => {
        if (!profile?.clinic_id) return;

        setLoading(true);
        try {
            const [allOrders, overdue, supplierPerf] = await Promise.all([
                LabOrderService.getOrders(user.clinic_id),
                LabOrderService.getOverdueOrders(user.clinic_id),
                LabOrderService.getSupplierPerformance(user.clinic_id)
            ]);

            setOrders(allOrders);
            setOverdueOrders(overdue);
            setSuppliers(supplierPerf);
        } catch (error) {
            console.error('Error loading lab orders:', error);
            toast.error('Erro ao carregar pedidos');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [profile?.clinic_id]);

    const handleStatusUpdate = async (orderId: string, newStatus: string) => {
        try {
            await LabOrderService.updateOrder(orderId, { status: newStatus as any });
            toast.success('Status atualizado!');
            loadData();
        } catch (error) {
            toast.error('Erro ao atualizar status');
        }
    };

    if (loading && orders.length === 0) {
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
                    <h1 className="text-2xl font-bold text-gray-900">Gestão Laboratorial</h1>
                    <p className="text-gray-500">Rastreie pedidos e monitore prazos</p>
                </div>
                <div className="flex space-x-3">
                    <button
                        onClick={loadData}
                        className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Atualizar
                    </button>
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Novo Pedido
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="text-sm font-medium text-gray-500">Total de Pedidos</div>
                    <div className="text-2xl font-bold text-gray-900">{orders.length}</div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-yellow-100 bg-yellow-50">
                    <div className="text-sm font-medium text-yellow-600">Em Produção</div>
                    <div className="text-2xl font-bold text-yellow-900">
                        {orders.filter(o => ['SENT', 'IN_PROGRESS'].includes(o.status)).length}
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-red-100 bg-red-50">
                    <div className="text-sm font-medium text-red-600 flex items-center">
                        <AlertTriangle className="w-4 h-4 mr-1" />
                        Atrasados
                    </div>
                    <div className="text-2xl font-bold text-red-900">{overdueOrders.length}</div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-green-100 bg-green-50">
                    <div className="text-sm font-medium text-green-600">Concluídos</div>
                    <div className="text-2xl font-bold text-green-900">
                        {orders.filter(o => ['RECEIVED', 'DELIVERED_TO_PATIENT'].includes(o.status)).length}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="border-b border-gray-200">
                    <nav className="flex space-x-8 px-6" aria-label="Tabs">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'all'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <Package className="w-4 h-4 inline mr-2" />
                            Todos os Pedidos ({orders.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('overdue')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'overdue'
                                ? 'border-red-500 text-red-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <AlertTriangle className="w-4 h-4 inline mr-2" />
                            Atrasados ({overdueOrders.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('suppliers')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'suppliers'
                                ? 'border-purple-500 text-purple-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <TrendingUp className="w-4 h-4 inline mr-2" />
                            Laboratórios ({suppliers.length})
                        </button>
                    </nav>
                </div>

                {/* Content */}
                <div className="p-6">
                    {activeTab === 'all' && (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paciente</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trabalho</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Laboratório</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Previsão</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Custo</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {orders.map((order) => (
                                        <tr key={order.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <LabOrderStatusBadge status={order.status} />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {/* Aqui precisaríamos do nome do paciente via join ou cache */}
                                                Paciente #{order.patient_id.slice(0, 8)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900">{order.work_description}</div>
                                                <div className="text-xs text-gray-500">{order.work_type}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {order.supplier_name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {new Date(order.expected_return_date).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                R$ {order.cost.toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                    {orders.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                                Nenhum pedido encontrado. Crie o primeiro!
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'overdue' && (
                        <div className="space-y-4">
                            {overdueOrders.map((order) => (
                                <div key={order.id} className="border border-red-200 bg-red-50 rounded-lg p-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-medium text-gray-900">{order.work_description}</h3>
                                            <p className="text-sm text-gray-600 mt-1">
                                                Paciente: {order.patient_name} • Lab: {order.supplier_name}
                                            </p>
                                            <p className="text-sm text-red-600 font-medium mt-2">
                                                Atrasado há {order.days_overdue} dias
                                            </p>
                                        </div>
                                        <LabOrderStatusBadge status={order.status} />
                                    </div>
                                </div>
                            ))}
                            {overdueOrders.length === 0 && (
                                <p className="text-center text-gray-500 py-8">Nenhum pedido atrasado! 🎉</p>
                            )}
                        </div>
                    )}

                    {activeTab === 'suppliers' && (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Laboratório</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Pedidos</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Atrasos</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Correções</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prazo Médio</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Custo Médio</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {suppliers.map((supplier) => (
                                        <tr key={supplier.supplier_name} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                                                {supplier.supplier_name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {supplier.total_orders}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={supplier.late_deliveries > 0 ? 'text-red-600 font-medium' : 'text-gray-900'}>
                                                    {supplier.late_deliveries}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {supplier.orders_with_corrections}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {supplier.average_turnaround_days.toFixed(1)} dias
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                R$ {supplier.average_cost.toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                    {suppliers.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                                Nenhum laboratório cadastrado ainda.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Form Modal */}
            {showForm && (
                <LabOrderForm
                    onClose={() => setShowForm(false)}
                    onSuccess={loadData}
                />
            )}
        </div>
    );
};
