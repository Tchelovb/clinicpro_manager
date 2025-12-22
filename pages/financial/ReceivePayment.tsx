import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, DollarSign, Calendar, CreditCard, FileText, CheckCircle, User, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface BudgetItem {
    id: string;
    budget_id: string;
    patient_id: string;
    patient_name: string;
    description: string;
    amount: number;
    status: string;
    due_date: string;
}

const ReceivePayment: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { profile } = useAuth();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [item, setItem] = useState<BudgetItem | null>(null);

    const [formData, setFormData] = useState({
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'PIX' as 'PIX' | 'DINHEIRO' | 'CARTAO_CREDITO' | 'CARTAO_DEBITO' | 'TRANSFERENCIA',
        amount_received: '',
        notes: ''
    });

    useEffect(() => {
        if (id) {
            loadReceivable();
        }
    }, [id]);

    const loadReceivable = async () => {
        try {
            setLoading(true);

            // Buscar item de orçamento (parcela a receber)
            const { data: budgetItemData, error: itemError } = await supabase
                .from('budget_items')
                .select(`
                    *,
                    budgets!inner(patient_id, clinic_id),
                    patients!inner(name)
                `)
                .eq('id', id)
                .eq('budgets.clinic_id', profile?.clinic_id)
                .single();

            if (itemError) throw itemError;

            if (budgetItemData.status === 'PAID') {
                toast.error('Este pagamento já foi recebido!');
                navigate('/financial');
                return;
            }

            setItem({
                id: budgetItemData.id,
                budget_id: budgetItemData.budget_id,
                patient_id: budgetItemData.budgets.patient_id,
                patient_name: budgetItemData.patients.name,
                description: budgetItemData.description || 'Parcela de orçamento',
                amount: budgetItemData.value,
                status: budgetItemData.status,
                due_date: budgetItemData.due_date
            });

            setFormData(prev => ({
                ...prev,
                amount_received: budgetItemData.value.toString()
            }));
        } catch (error) {
            console.error('Erro ao carregar recebível:', error);
            toast.error('Erro ao carregar informações');
            navigate('/financial');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const amountReceived = parseFloat(formData.amount_received);

            if (isNaN(amountReceived) || amountReceived <= 0) {
                toast.error('Valor inválido');
                return;
            }

            // Atualizar status do item
            const { error: updateError } = await supabase
                .from('budget_items')
                .update({
                    status: 'PAID',
                    payment_date: formData.payment_date,
                    payment_method: formData.payment_method,
                    amount_paid: amountReceived,
                    payment_notes: formData.notes || null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);

            if (updateError) throw updateError;

            // Registrar transação no caixa (se houver caixa aberto)
            const { data: openCash } = await supabase
                .from('cash_registers')
                .select('id')
                .eq('clinic_id', profile?.clinic_id)
                .eq('status', 'OPEN')
                .order('opened_at', { ascending: false })
                .limit(1)
                .single();

            if (openCash) {
                await supabase.from('cash_transactions').insert({
                    cash_register_id: openCash.id,
                    type: 'INCOME',
                    category: 'TREATMENT_PAYMENT',
                    amount: amountReceived,
                    payment_method: formData.payment_method,
                    description: `Recebimento: ${item?.patient_name} - ${item?.description}`,
                    reference_id: id,
                    reference_type: 'budget_item',
                    created_at: new Date().toISOString()
                });
            }

            toast.success('Pagamento recebido com sucesso!');
            navigate('/financial');
        } catch (error: any) {
            console.error('Erro ao registrar recebimento:', error);
            toast.error(error.message || 'Erro ao registrar recebimento');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
                <Loader2 className="w-12 h-12 text-violet-600 animate-spin mb-4" />
                <p className="text-slate-500 font-medium">Carregando informações...</p>
            </div>
        );
    }

    if (!item) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
                <p className="text-slate-500">Recebível não encontrado</p>
                <button
                    onClick={() => navigate('/financial')}
                    className="mt-4 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
                >
                    Voltar para Financeiro
                </button>
            </div>
        );
    }

    const paymentMethods = [
        { value: 'PIX', label: '💳 PIX' },
        { value: 'DINHEIRO', label: '💵 Dinheiro' },
        { value: 'CARTAO_CREDITO', label: '💳 Cartão de Crédito' },
        { value: 'CARTAO_DEBITO', label: '💳 Cartão de Débito' },
        { value: 'TRANSFERENCIA', label: '🏦 Transferência Bancária' }
    ];

    return (
        <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/financial')}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                    <ChevronLeft size={24} className="text-slate-400" />
                </button>
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
                        <DollarSign className="text-green-600" size={32} />
                        Registrar Recebimento
                    </h1>
                    <p className="text-slate-500 mt-2">Confirme o recebimento do pagamento</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Payment Details */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sticky top-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Detalhes do Recebível</h3>

                        <div className="space-y-4">
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Paciente</p>
                                <div className="flex items-center gap-2">
                                    <User size={16} className="text-slate-400" />
                                    <p className="text-sm font-bold text-slate-800">{item.patient_name}</p>
                                </div>
                            </div>

                            <div>
                                <p className="text-xs text-slate-500 mb-1">Descrição</p>
                                <p className="text-sm text-slate-700">{item.description}</p>
                            </div>

                            <div className="pt-4 border-t border-slate-100">
                                <p className="text-xs text-slate-500 mb-1">Valor a Receber</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {new Intl.NumberFormat('pt-BR', {
                                        style: 'currency',
                                        currency: 'BRL'
                                    }).format(item.amount)}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs text-slate-500 mb-1">Vencimento</p>
                                <p className="text-sm text-slate-700">
                                    {new Date(item.due_date).toLocaleDateString('pt-BR')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Payment Form */}
                <div className="lg:col-span-2">
                    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
                        <h3 className="text-lg font-bold text-slate-800">Informações do Recebimento</h3>

                        {/* Payment Date */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                <Calendar size={16} className="inline mr-2" />
                                Data do Recebimento *
                            </label>
                            <input
                                type="date"
                                required
                                value={formData.payment_date}
                                onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                            />
                        </div>

                        {/* Amount Received */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                <DollarSign size={16} className="inline mr-2" />
                                Valor Recebido *
                            </label>
                            <input
                                type="number"
                                required
                                step="0.01"
                                min="0"
                                value={formData.amount_received}
                                onChange={(e) => setFormData({ ...formData, amount_received: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                                placeholder="0,00"
                            />
                        </div>

                        {/* Payment Method */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                <CreditCard size={16} className="inline mr-2" />
                                Forma de Pagamento *
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {paymentMethods.map(method => (
                                    <button
                                        key={method.value}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, payment_method: method.value as any })}
                                        className={`px-4 py-3 rounded-lg border-2 transition-all text-sm font-medium ${formData.payment_method === method.value
                                            ? 'border-violet-500 bg-violet-50 text-violet-700'
                                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                                            }`}
                                    >
                                        {method.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                <FileText size={16} className="inline mr-2" />
                                Observações
                            </label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 min-h-[100px]"
                                placeholder="Informações adicionais sobre o recebimento (opcional)"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-4 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => navigate('/financial')}
                                disabled={saving}
                                className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors font-medium disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Processando...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle size={18} />
                                        Confirmar Recebimento
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ReceivePayment;
