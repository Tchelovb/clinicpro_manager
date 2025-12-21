// =====================================================
// PÁGINA: ConfirmationDashboard
// =====================================================

import React, { useEffect, useState } from 'react';
import { ConfirmationService } from '@/services/confirmationService';
import { PendingConfirmation } from '@/types/confirmations';
import { ConfirmationStatusBadge } from './ConfirmationStatusBadge';
import { ConfirmationActions } from './ConfirmationActions';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, RefreshCw, Calendar, Clock, AlertCircle, Phone } from 'lucide-react';

export const ConfirmationDashboard: React.FC = () => {
    const { user } = useAuth();
    const [confirmations, setConfirmations] = useState<PendingConfirmation[]>([]);
    const [loading, setLoading] = useState(true);

    // Stats (calculados no front por enquanto)
    const stats = {
        total: confirmations.length,
        pending: confirmations.filter(c => c.confirmation_status === 'PENDING').length,
        confirmed: confirmations.filter(c => c.confirmation_status === 'CONFIRMED').length,
        critical: confirmations.filter(c => c.hours_until_appointment < 24 && c.confirmation_status === 'PENDING').length
    };

    const loadData = async () => {
        if (!user?.clinic_id) return;

        setLoading(true);
        try {
            const data = await ConfirmationService.getPendingConfirmations(user.clinic_id);
            setConfirmations(data);
        } catch (error) {
            console.error('Error loading confirmations:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [user?.clinic_id]);

    if (loading && confirmations.length === 0) {
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
                    <h1 className="text-2xl font-bold text-gray-900">Confirmação de Consultas</h1>
                    <p className="text-gray-500">Gerencie as confirmações e reduza o No-Show</p>
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="text-sm font-medium text-gray-500">Total Hoje/Amanhã</div>
                    <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-orange-100 bg-orange-50">
                    <div className="text-sm font-medium text-orange-600">Pendentes</div>
                    <div className="text-2xl font-bold text-orange-900">{stats.pending}</div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-green-100 bg-green-50">
                    <div className="text-sm font-medium text-green-600">Confirmados</div>
                    <div className="text-2xl font-bold text-green-900">{stats.confirmed}</div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-red-100 bg-red-50">
                    <div className="text-sm font-medium text-red-600">Críticos (&lt;24h)</div>
                    <div className="text-2xl font-bold text-red-900 flex items-center">
                        {stats.critical}
                        {stats.critical > 0 && <AlertCircle className="w-5 h-5 ml-2" />}
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paciente</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Consulta</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tempo Restante</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {confirmations.map((conf) => (
                                <tr key={conf.confirmation_id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <ConfirmationStatusBadge status={conf.confirmation_status} />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{conf.patient_name}</div>
                                        <div className="text-xs text-gray-500 flex items-center mt-1">
                                            <Phone className="w-3 h-3 mr-1" />
                                            {conf.patient_phone}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900 flex items-center">
                                            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                                            {new Date(conf.appointment_date).toLocaleDateString()}
                                        </div>
                                        <div className="text-sm text-gray-500 flex items-center mt-1">
                                            <Clock className="w-4 h-4 mr-2 text-gray-400" />
                                            {new Date(conf.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            <span className="mx-2">•</span>
                                            {conf.professional_name.split(' ')[0]}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className={`text-sm font-medium ${conf.hours_until_appointment < 24 ? 'text-red-600' : 'text-gray-900'
                                            }`}>
                                            {conf.hours_until_appointment}h
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <ConfirmationActions
                                            confirmationId={conf.confirmation_id}
                                            appointmentId={conf.appointment_id}
                                            patientPhone={conf.patient_phone}
                                            patientName={conf.patient_name}
                                            onUpdate={loadData}
                                        />
                                    </td>
                                </tr>
                            ))}

                            {confirmations.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        Nenhuma consulta pendente de confirmação encontrada.
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
