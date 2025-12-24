import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Plus, Edit2, Trash2, CreditCard, Loader2, CheckCircle, Percent } from 'lucide-react';
import toast from 'react-hot-toast';

interface PaymentMethodFee {
    id: string;
    payment_method_name: string;
    payment_type: string;
    fee_type: string;
    fee_percent: number;
    fee_fixed_amount: number;
    installments_allowed: boolean;
    max_installments: number;
    min_installment_value: number;
    active: boolean;
    created_at: string;
}

const PaymentMethodsManager: React.FC = () => {
    const { profile } = useAuth();
    const [methods, setMethods] = useState<PaymentMethodFee[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingMethod, setEditingMethod] = useState<PaymentMethodFee | null>(null);
    const [formData, setFormData] = useState({
        payment_method_name: '',
        payment_type: 'CREDIT',
        fee_type: 'PERCENTAGE',
        fee_percent: 0,
        fee_fixed_amount: 0,
        installments_allowed: false,
        max_installments: 1,
        min_installment_value: 0,
        active: true
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (profile?.clinic_id) {
            loadMethods();
        }
    }, [profile?.clinic_id]);

    const loadMethods = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('payment_method_fees')
                .select('*')
                .eq('clinic_id', profile?.clinic_id)
                .order('payment_method_name');

            if (error) throw error;
            setMethods(data || []);
        } catch (error) {
            console.error('Erro ao carregar formas de pagamento:', error);
            toast.error('Erro ao carregar formas de pagamento');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (method?: PaymentMethodFee) => {
        if (method) {
            setEditingMethod(method);
            setFormData({
                payment_method_name: method.payment_method_name,
                payment_type: method.payment_type,
                fee_type: method.fee_type,
                fee_percent: method.fee_percent,
                fee_fixed_amount: method.fee_fixed_amount,
                installments_allowed: method.installments_allowed,
                max_installments: method.max_installments,
                min_installment_value: method.min_installment_value,
                active: method.active
            });
        } else {
            setEditingMethod(null);
            setFormData({
                payment_method_name: '',
                payment_type: 'CREDIT',
                fee_type: 'PERCENTAGE',
                fee_percent: 0,
                fee_fixed_amount: 0,
                installments_allowed: false,
                max_installments: 1,
                min_installment_value: 0,
                active: true
            });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingMethod(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.payment_method_name.trim()) {
            toast.error('Nome da forma de pagamento é obrigatório');
            return;
        }

        setSaving(true);

        try {
            const dataToSave = {
                clinic_id: profile?.clinic_id,
                ...formData,
                payment_method_name: formData.payment_method_name.trim()
            };

            if (editingMethod) {
                const { error } = await supabase
                    .from('payment_method_fees')
                    .update(dataToSave)
                    .eq('id', editingMethod.id);

                if (error) throw error;
                toast.success('Forma de pagamento atualizada!');
            } else {
                const { error } = await supabase
                    .from('payment_method_fees')
                    .insert(dataToSave);

                if (error) throw error;
                toast.success('Forma de pagamento criada!');
            }

            handleCloseModal();
            loadMethods();
        } catch (error: any) {
            console.error('Erro ao salvar:', error);
            toast.error(error.message || 'Erro ao salvar');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (method: PaymentMethodFee) => {
        if (!confirm(`Tem certeza que deseja excluir "${method.payment_method_name}"?`)) {
            return;
        }

        try {
            const { error } = await supabase
                .from('payment_method_fees')
                .delete()
                .eq('id', method.id);

            if (error) throw error;
            toast.success('Forma de pagamento excluída!');
            loadMethods();
        } catch (error: any) {
            console.error('Erro ao excluir:', error);
            toast.error(error.message || 'Erro ao excluir');
        }
    };

    const toggleActive = async (method: PaymentMethodFee) => {
        try {
            const { error } = await supabase
                .from('payment_method_fees')
                .update({ active: !method.active })
                .eq('id', method.id);

            if (error) throw error;
            toast.success(method.active ? 'Desativado' : 'Ativado');
            loadMethods();
        } catch (error: any) {
            console.error('Erro ao alterar status:', error);
            toast.error(error.message || 'Erro ao alterar status');
        }
    };

    const getPaymentTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            'CREDIT': 'Crédito',
            'DEBIT': 'Débito',
            'PIX': 'PIX',
            'BOLETO': 'Boleto',
            'CASH': 'Dinheiro',
            'OTHER': 'Outro'
        };
        return labels[type] || type;
    };

    const getPaymentTypeColor = (type: string) => {
        const colors: Record<string, string> = {
            'CREDIT': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            'DEBIT': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
            'PIX': 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
            'BOLETO': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
            'CASH': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
            'OTHER': 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
        };
        return colors[type] || colors['OTHER'];
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                        Formas de Pagamento
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Configure taxas e parcelamento para cada forma de pagamento
                    </p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors font-medium text-sm shadow-sm"
                >
                    <Plus size={16} />
                    Nova Forma
                </button>
            </div>

            {/* Methods List */}
            {methods.length === 0 ? (
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 p-12 text-center">
                    <CreditCard size={48} className="mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                    <h4 className="text-lg font-bold text-slate-600 dark:text-slate-300 mb-2">
                        Nenhuma forma de pagamento cadastrada
                    </h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                        Configure as formas de pagamento aceitas pela clínica
                    </p>
                    <button
                        onClick={() => handleOpenModal()}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors font-medium shadow-sm"
                    >
                        <Plus size={18} />
                        Cadastrar Primeira Forma
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {methods.map((method) => (
                        <div
                            key={method.id}
                            className={`bg-white dark:bg-slate-800 rounded-xl border-2 p-5 transition-all ${method.active
                                    ? 'border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-700'
                                    : 'border-slate-100 dark:border-slate-800 opacity-60'
                                }`}
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                    <h4 className="font-bold text-slate-800 dark:text-white mb-2">
                                        {method.payment_method_name}
                                    </h4>
                                    <span className={`text-xs font-medium px-2 py-1 rounded ${getPaymentTypeColor(method.payment_type)}`}>
                                        {getPaymentTypeLabel(method.payment_type)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => handleOpenModal(method)}
                                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                        title="Editar"
                                    >
                                        <Edit2 size={14} className="text-slate-400" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(method)}
                                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        title="Excluir"
                                    >
                                        <Trash2 size={14} className="text-red-400" />
                                    </button>
                                </div>
                            </div>

                            {/* Fees */}
                            <div className="space-y-2 mb-3">
                                {method.fee_type === 'PERCENTAGE' && method.fee_percent > 0 && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500 dark:text-slate-400">Taxa:</span>
                                        <span className="font-bold text-orange-600 dark:text-orange-400">
                                            {method.fee_percent}%
                                        </span>
                                    </div>
                                )}
                                {method.fee_type === 'FIXED' && method.fee_fixed_amount > 0 && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500 dark:text-slate-400">Taxa Fixa:</span>
                                        <span className="font-bold text-orange-600 dark:text-orange-400">
                                            R$ {method.fee_fixed_amount.toFixed(2)}
                                        </span>
                                    </div>
                                )}
                                {method.installments_allowed && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500 dark:text-slate-400">Parcelas:</span>
                                        <span className="font-medium text-slate-700 dark:text-slate-300">
                                            Até {method.max_installments}x
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-end pt-3 border-t border-slate-100 dark:border-slate-700">
                                <button
                                    onClick={() => toggleActive(method)}
                                    className={`text-xs font-medium px-3 py-1 rounded-full transition-colors ${method.active
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                                            : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                                        }`}
                                >
                                    {method.active ? 'Ativo' : 'Inativo'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200 overflow-y-auto">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl my-8 animate-in zoom-in-95 duration-300">
                        <div className="border-b border-slate-200 dark:border-slate-700 p-6">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                                {editingMethod ? 'Editar Forma de Pagamento' : 'Nova Forma de Pagamento'}
                            </h3>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                        Nome *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.payment_method_name}
                                        onChange={(e) => setFormData({ ...formData, payment_method_name: e.target.value })}
                                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                        placeholder="Ex: Cartão de Crédito Visa"
                                        required
                                        autoFocus
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                        Tipo
                                    </label>
                                    <select
                                        value={formData.payment_type}
                                        onChange={(e) => setFormData({ ...formData, payment_type: e.target.value })}
                                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                    >
                                        <option value="CREDIT">Crédito</option>
                                        <option value="DEBIT">Débito</option>
                                        <option value="PIX">PIX</option>
                                        <option value="BOLETO">Boleto</option>
                                        <option value="CASH">Dinheiro</option>
                                        <option value="OTHER">Outro</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                        Tipo de Taxa
                                    </label>
                                    <select
                                        value={formData.fee_type}
                                        onChange={(e) => setFormData({ ...formData, fee_type: e.target.value })}
                                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                    >
                                        <option value="PERCENTAGE">Percentual</option>
                                        <option value="FIXED">Valor Fixo</option>
                                    </select>
                                </div>

                                {formData.fee_type === 'PERCENTAGE' ? (
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                            Taxa Percentual (%)
                                        </label>
                                        <div className="relative">
                                            <Percent className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={formData.fee_percent}
                                                onChange={(e) => setFormData({ ...formData, fee_percent: parseFloat(e.target.value) || 0 })}
                                                className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                            Taxa Fixa (R$)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.fee_fixed_amount}
                                            onChange={(e) => setFormData({ ...formData, fee_fixed_amount: parseFloat(e.target.value) || 0 })}
                                            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                            placeholder="0.00"
                                        />
                                    </div>
                                )}

                                <div className="md:col-span-2 flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                    <input
                                        type="checkbox"
                                        id="installments"
                                        checked={formData.installments_allowed}
                                        onChange={(e) => setFormData({ ...formData, installments_allowed: e.target.checked })}
                                        className="w-5 h-5 text-violet-600 rounded focus:ring-2 focus:ring-violet-500"
                                    />
                                    <label htmlFor="installments" className="flex-1 cursor-pointer">
                                        <p className="text-sm font-medium text-slate-800 dark:text-white">
                                            Permite Parcelamento
                                        </p>
                                    </label>
                                </div>

                                {formData.installments_allowed && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                                Máximo de Parcelas
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={formData.max_installments}
                                                onChange={(e) => setFormData({ ...formData, max_installments: parseInt(e.target.value) || 1 })}
                                                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                                Valor Mínimo da Parcela
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={formData.min_installment_value}
                                                onChange={(e) => setFormData({ ...formData, min_installment_value: parseFloat(e.target.value) || 0 })}
                                                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </>
                                )}

                                <div className="md:col-span-2 flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                    <input
                                        type="checkbox"
                                        id="active"
                                        checked={formData.active}
                                        onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                                        className="w-5 h-5 text-violet-600 rounded focus:ring-2 focus:ring-violet-500"
                                    />
                                    <label htmlFor="active" className="flex-1 cursor-pointer">
                                        <p className="text-sm font-medium text-slate-800 dark:text-white">
                                            Forma de Pagamento Ativa
                                        </p>
                                    </label>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    disabled={saving}
                                    className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium disabled:opacity-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 px-4 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors font-medium shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="animate-spin" size={18} />
                                            Salvando...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle size={18} />
                                            {editingMethod ? 'Atualizar' : 'Criar'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentMethodsManager;
