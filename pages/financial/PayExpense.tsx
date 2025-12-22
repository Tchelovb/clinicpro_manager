import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, DollarSign, Calendar, CreditCard, FileText, CheckCircle, Upload, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface Expense {
    id: string;
    description: string;
    category: string;
    provider: string;
    amount: number;
    due_date: string;
    status: string;
}

const PayExpense: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { profile } = useAuth();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [expense, setExpense] = useState<Expense | null>(null);

    const [formData, setFormData] = useState({
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'PIX' as 'PIX' | 'DINHEIRO' | 'CARTAO_CREDITO' | 'CARTAO_DEBITO' | 'TRANSFERENCIA',
        notes: ''
    });

    useEffect(() => {
        if (id) {
            loadExpense();
        }
    }, [id]);

    const loadExpense = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('expenses')
                .select('*')
                .eq('id', id)
                .eq('clinic_id', profile?.clinic_id)
                .single();

            if (error) throw error;

            if (data.status === 'PAID') {
                toast.error('Esta despesa já foi paga!');
                navigate('/financial');
                return;
            }

            setExpense(data);
        } catch (error) {
            console.error('Erro ao carregar despesa:', error);
            toast.error('Erro ao carregar despesa');
            navigate('/financial');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const { error } = await supabase
                .from('expenses')
                .update({
                    status: 'PAID',
                    payment_date: formData.payment_date,
                    payment_method: formData.payment_method,
                    payment_notes: formData.notes || null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);

            if (error) throw error;

            toast.success('Despesa paga com sucesso!');
            navigate('/financial');
        } catch (error: any) {
            console.error('Erro ao registrar pagamento:', error);
            toast.error(error.message || 'Erro ao registrar pagamento');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
                <Loader2 className="w-12 h-12 text-violet-600 animate-spin mb-4" />
                <p className="text-slate-500 font-medium">Carregando despesa...</p>
            </div>
        );
    }

    if (!expense) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
                <p className="text-slate-500">Despesa não encontrada</p>
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
                        Registrar Pagamento
                    </h1>
                    <p className="text-slate-500 mt-2">Confirme o pagamento da despesa</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Expense Details */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sticky top-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Detalhes da Despesa</h3>

                        <div className="space-y-4">
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Descrição</p>
                                <p className="text-sm font-bold text-slate-800">{expense.description}</p>
                            </div>

                            <div>
                                <p className="text-xs text-slate-500 mb-1">Categoria</p>
                                <p className="text-sm text-slate-700">{expense.category}</p>
                            </div>

                            {expense.provider && (
                                <div>
                                    <p className="text-xs text-slate-500 mb-1">Fornecedor</p>
                                    <p className="text-sm text-slate-700">{expense.provider}</p>
                                </div>
                            )}

                            <div className="pt-4 border-t border-slate-100">
                                <p className="text-xs text-slate-500 mb-1">Valor</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {new Intl.NumberFormat('pt-BR', {
                                        style: 'currency',
                                        currency: 'BRL'
                                    }).format(expense.amount)}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs text-slate-500 mb-1">Vencimento</p>
                                <p className="text-sm text-slate-700">
                                    {new Date(expense.due_date).toLocaleDateString('pt-BR')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Payment Form */}
                <div className="lg:col-span-2">
                    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
                        <h3 className="text-lg font-bold text-slate-800">Informações do Pagamento</h3>

                        {/* Payment Date */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                <Calendar size={16} className="inline mr-2" />
                                Data do Pagamento *
                            </label>
                            <input
                                type="date"
                                required
                                value={formData.payment_date}
                                onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
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
                                placeholder="Informações adicionais sobre o pagamento (opcional)"
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
                                        Confirmar Pagamento
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

export default PayExpense;
