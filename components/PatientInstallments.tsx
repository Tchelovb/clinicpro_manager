import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Check, X, Calendar, DollarSign, CreditCard } from 'lucide-react';

interface Installment {
    id: string;
    installment_number: number;
    total_installments: number;
    amount: number;
    due_date: string;
    paid_date?: string;
    status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
    payment_method?: string;
    source?: 'NEW' | 'OLD';
}

interface PatientInstallmentsProps {
    patientId: string;
}

export const PatientInstallments: React.FC<PatientInstallmentsProps> = ({ patientId }) => {
    const [installments, setInstallments] = useState<Installment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadInstallments();
    }, [patientId]);

    const loadInstallments = async () => {
        setLoading(true);
        try {
            // Buscar parcelas NOVAS (tabela installments)
            const { data: newInstallments, error: error1 } = await supabase
                .from('installments')
                .select('*')
                .eq('patient_id', patientId)
                .order('due_date', { ascending: true });

            // Buscar parcelas ANTIGAS (tabela financial_installments)
            const { data: oldInstallments, error: error2 } = await supabase
                .from('financial_installments')
                .select('*')
                .eq('patient_id', patientId)
                .order('due_date', { ascending: true });

            if (error1) console.error('Error loading new installments:', error1);
            if (error2) console.error('Error loading old installments:', error2);

            // Unificar as duas listas
            const allInstallments = [
                ...(newInstallments || []).map(i => ({
                    id: i.id,
                    installment_number: i.installment_number,
                    total_installments: i.total_installments,
                    amount: i.amount,
                    due_date: i.due_date,
                    paid_date: i.paid_date,
                    status: i.status,
                    payment_method: i.payment_method,
                    source: 'NEW' // Marcador
                })),
                ...(oldInstallments || []).map(i => ({
                    id: i.id,
                    installment_number: 1, // Parcelas antigas não têm número
                    total_installments: 1,
                    amount: i.amount,
                    due_date: i.due_date,
                    paid_date: null,
                    status: i.status,
                    payment_method: i.payment_method,
                    source: 'OLD' // Marcador
                }))
            ];

            // Ordenar por data de vencimento
            allInstallments.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());

            setInstallments(allInstallments as Installment[]);
        } catch (error) {
            console.error('Error loading installments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePayInstallment = async (installmentId: string, source: string) => {
        try {
            const tableName = source === 'NEW' ? 'installments' : 'financial_installments';

            const { error } = await supabase
                .from(tableName)
                .update({
                    status: 'PAID',
                    ...(source === 'NEW' ? { paid_date: new Date().toISOString() } : {}),
                    updated_at: new Date().toISOString()
                })
                .eq('id', installmentId);

            if (error) throw error;

            // Reload installments
            await loadInstallments();

            // Trigger page reload to update patient balance
            window.location.reload();
        } catch (error) {
            console.error('Error paying installment:', error);
            alert('Erro ao registrar pagamento');
        }
    };

    const getStatusBadge = (status: string, dueDate: string) => {
        const isOverdue = new Date(dueDate) < new Date() && status === 'PENDING';

        if (status === 'PAID') {
            return <span className="px-3 py-1 bg-emerald-900/30 text-emerald-300 rounded-full text-xs font-bold">✓ PAGO</span>;
        }
        if (isOverdue) {
            return <span className="px-3 py-1 bg-rose-900/30 text-rose-300 rounded-full text-xs font-bold">⚠️ VENCIDO</span>;
        }
        return <span className="px-3 py-1 bg-amber-900/30 text-amber-300 rounded-full text-xs font-bold">⏳ PENDENTE</span>;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (installments.length === 0) {
        return (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
                <DollarSign size={48} className="text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">Nenhuma parcela cadastrada</p>
                <p className="text-xs text-slate-500 mt-2">As parcelas são geradas automaticamente quando um orçamento é aprovado</p>
            </div>
        );
    }

    const pendingInstallments = installments.filter(i => i.status === 'PENDING');
    const paidInstallments = installments.filter(i => i.status === 'PAID');
    const totalPending = pendingInstallments.reduce((sum, i) => sum + i.amount, 0);
    const totalPaid = paidInstallments.reduce((sum, i) => sum + i.amount, 0);

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-amber-900/20 border border-amber-700/50 rounded-xl p-4">
                    <p className="text-xs text-amber-400 uppercase font-bold mb-1">Pendente</p>
                    <p className="text-2xl font-black text-amber-300">R$ {totalPending.toLocaleString('pt-BR')}</p>
                    <p className="text-xs text-amber-400/60 mt-1">{pendingInstallments.length} parcelas</p>
                </div>
                <div className="bg-emerald-900/20 border border-emerald-700/50 rounded-xl p-4">
                    <p className="text-xs text-emerald-400 uppercase font-bold mb-1">Pago</p>
                    <p className="text-2xl font-black text-emerald-300">R$ {totalPaid.toLocaleString('pt-BR')}</p>
                    <p className="text-xs text-emerald-400/60 mt-1">{paidInstallments.length} parcelas</p>
                </div>
            </div>

            {/* Installments List */}
            <div className="space-y-3">
                <h3 className="text-lg font-bold text-white mb-4">Parcelas</h3>
                {installments.map((installment) => {
                    const isOverdue = new Date(installment.due_date) < new Date() && installment.status === 'PENDING';

                    return (
                        <div
                            key={installment.id}
                            className={`bg-slate-900 border rounded-xl p-4 transition-all ${isOverdue ? 'border-rose-700/50' : 'border-slate-800'
                                }`}
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${installment.status === 'PAID' ? 'bg-emerald-900/30 text-emerald-300' :
                                        isOverdue ? 'bg-rose-900/30 text-rose-300' :
                                            'bg-amber-900/30 text-amber-300'
                                        }`}>
                                        {installment.installment_number}/{installment.total_installments}
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold text-white">
                                            R$ {installment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </p>
                                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                                            <span className="flex items-center gap-1">
                                                <Calendar size={12} />
                                                Venc: {new Date(installment.due_date).toLocaleDateString('pt-BR')}
                                            </span>
                                            {installment.paid_date && (
                                                <span className="flex items-center gap-1 text-emerald-400">
                                                    <Check size={12} />
                                                    Pago: {new Date(installment.paid_date).toLocaleDateString('pt-BR')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                                    {getStatusBadge(installment.status, installment.due_date)}

                                    {installment.status === 'PENDING' && (
                                        <button
                                            onClick={() => {
                                                if (confirm(`Confirmar pagamento de R$ ${installment.amount.toLocaleString('pt-BR')}?`)) {
                                                    handlePayInstallment(installment.id, installment.source || 'NEW');
                                                }
                                            }}
                                            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 sm:py-2 rounded-lg transition-colors font-medium text-sm flex-1 sm:flex-none justify-center"
                                        >
                                            <Check size={16} />
                                            Baixar
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default PatientInstallments;
