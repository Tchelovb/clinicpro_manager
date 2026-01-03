import React, { useState, useEffect } from 'react';
import {
    AlertTriangle, CheckCircle, Clock, Calendar,
    TrendingDown, DollarSign
} from 'lucide-react';
import { InstallmentsTable } from './InstallmentsTable';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { useHaptic } from '../../utils/haptics';
import toast from 'react-hot-toast';
import { useInstallments, Installment } from '../../hooks/useFinancial';



/**
 * ReceivablesView
 * 
 * View de Contas a Receber
 * - Resumo de parcelas (pendentes, vencidas, pagas)
 * - Tabela de parcelas (ZERO inline editing)
 * - Filtros por status/período
 * - Régua de cobrança
 */


export const ReceivablesView: React.FC = () => {
    const haptic = useHaptic();

    // Dados reativos com cálculo automático
    const { installments, isLoading: loading, summary, receivePayment } = useInstallments();

    const handleReceivePayment = (installment: Installment) => {
        haptic.medium();
        if (confirm(`Confirmar recebimento de R$ ${installment.amount}?`)) {
            receivePayment({
                id: installment.id,
                paidDate: new Date().toISOString()
            });
            toast.success('Pagamento recebido!');
        }
    };

    const handleViewDetails = (installment: Installment) => {
        haptic.light();
        toast('Detalhes em breve');
    };

    if (loading) {
        return (
            <div className="p-6 space-y-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        ))}
                    </div>
                    <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Contas a Receber
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Parcelas e inadimplência
                    </p>
                </div>

                {/* Filtros (Placeholder) */}
                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <Calendar size={18} />
                        <span className="text-sm">Filtrar período</span>
                    </button>
                </div>
            </div>

            {/* Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Pendentes */}
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-amber-900 dark:text-amber-100">
                            Pendentes
                        </span>
                        <Clock className="text-amber-600 dark:text-amber-400" size={20} />
                    </div>
                    <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 mb-1">
                        R$ {summary.totalPending.toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })}
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                        {summary.countPending} parcela(s)
                    </p>
                </div>

                {/* Vencidas (Inadimplência) */}
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-red-900 dark:text-red-100">
                            Vencidas (Inadimplência)
                        </span>
                        <AlertTriangle className="text-red-600 dark:text-red-400" size={20} />
                    </div>
                    <p className="text-3xl font-bold text-red-600 dark:text-red-400 mb-1">
                        R$ {summary.totalOverdue.toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })}
                    </p>
                    <p className="text-xs text-red-700 dark:text-red-300">
                        {summary.countOverdue} parcela(s) atrasada(s)
                    </p>
                </div>

                {/* Pagas */}
                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                            Pagas
                        </span>
                        <CheckCircle className="text-emerald-600 dark:text-emerald-400" size={20} />
                    </div>
                    <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                        R$ {summary.totalPaid.toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })}
                    </p>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300">
                        {summary.countPaid} parcela(s)
                    </p>
                </div>
            </div>

            {/* Alerta de Inadimplência */}
            {summary.countOverdue > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" size={20} />
                        <div>
                            <p className="text-sm font-medium text-red-900 dark:text-red-100">
                                ⚠️ Atenção: {summary.countOverdue} parcela(s) vencida(s)
                            </p>
                            <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                                Total em atraso: R$ {summary.totalOverdue.toLocaleString('pt-BR', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}. Acione a régua de cobrança.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Régua de Cobrança (Placeholder) */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <TrendingDown className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" size={20} />
                    <div>
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                            📊 Régua de Cobrança Automática
                        </p>
                        <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                            Em desenvolvimento: Disparo automático de lembretes via WhatsApp para parcelas próximas do vencimento.
                        </p>
                    </div>
                </div>
            </div>

            {/* Tabela de Parcelas */}
            <InstallmentsTable
                installments={installments}
                onReceivePayment={handleReceivePayment}
                onViewDetails={handleViewDetails}
            />
        </div>
    );
};

export default ReceivablesView;
