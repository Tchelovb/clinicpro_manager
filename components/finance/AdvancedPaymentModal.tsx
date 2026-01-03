import React, { useState, useEffect } from 'react';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
    DollarSign, CreditCard, AlertTriangle, Lock,
    CheckCircle, Calculator, FileText, Shield
} from 'lucide-react';
import toast from 'react-hot-toast';
import { BaseSheet } from '../shared/BaseSheet';

interface AdvancedPaymentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    installment: {
        id: string;
        patient_id: string;
        patient_name?: string;
        amount: number;
        amount_paid?: number;
        due_date: string;
        installment_number: number;
        total_installments: number;
        description?: string;
    };
    onSuccess: () => void;
}

interface PaymentMethod {
    id: string;
    name: string;
    active: boolean;
}

interface CashRegister {
    id: string;
    status: string;
    user_id: string;
}

export const AdvancedPaymentModal: React.FC<AdvancedPaymentModalProps> = ({
    open,
    onOpenChange,
    installment,
    onSuccess
}) => {
    const { profile } = useAuth();

    // Estados do formulário
    const [grossAmount, setGrossAmount] = useState(0);
    const [discount, setDiscount] = useState(0);
    const [interest, setInterest] = useState(0);
    const [paymentMethodId, setPaymentMethodId] = useState('');
    const [authCode, setAuthCode] = useState('');
    const [justification, setJustification] = useState('');

    // Estados de controle
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [activeCashRegister, setActiveCashRegister] = useState<CashRegister | null>(null);
    const [loading, setLoading] = useState(false);
    const [requiresAuthCode, setRequiresAuthCode] = useState(false);
    const [loadingData, setLoadingData] = useState(true);

    // Cálculos
    const remainingBalance = installment.amount - (installment.amount_paid || 0);
    const netAmount = grossAmount - discount + interest;
    const isPartialPayment = netAmount > 0 && netAmount < remainingBalance;
    const newBalance = remainingBalance - netAmount;

    useEffect(() => {
        if (open) {
            setGrossAmount(remainingBalance);
            loadInitialData();
        }
    }, [open, installment]);

    const loadInitialData = async () => {
        setLoadingData(true);
        try {
            await Promise.all([
                loadPaymentMethods(),
                checkActiveCashRegister()
            ]);
        } finally {
            setLoadingData(false);
        }
    };

    const loadPaymentMethods = async () => {
        const { data } = await supabase
            .from('payment_method')
            .select('*')
            .eq('clinic_id', profile?.clinic_id)
            .eq('active', true)
            .order('name');

        setPaymentMethods(data || []);
    };

    const checkActiveCashRegister = async () => {
        const { data } = await supabase
            .from('cash_registers')
            .select('*')
            .eq('clinic_id', profile?.clinic_id)
            .eq('status', 'OPEN')
            .eq('user_id', profile?.id)
            .maybeSingle();

        setActiveCashRegister(data);
    };

    const handlePaymentMethodChange = (methodId: string) => {
        setPaymentMethodId(methodId);
        const method = paymentMethods.find(m => m.id === methodId);

        // Exigir auth_code para métodos eletrônicos
        const methodName = method?.name?.toLowerCase() || '';
        const requiresAuth =
            methodName.includes('cartão') ||
            methodName.includes('cartao') ||
            methodName.includes('pix') ||
            methodName.includes('débito') ||
            methodName.includes('debito') ||
            methodName.includes('crédito') ||
            methodName.includes('credito');

        setRequiresAuthCode(requiresAuth);

        // Limpar auth_code se não for necessário
        if (!requiresAuth) {
            setAuthCode('');
        }
    };

    const validateForm = (): boolean => {
        if (!activeCashRegister) {
            toast.error('❌ Nenhum caixa aberto! Abra um caixa antes de receber.');
            return false;
        }

        if (!paymentMethodId) {
            toast.error('Selecione o método de pagamento');
            return false;
        }

        if (requiresAuthCode && !authCode.trim()) {
            toast.error('🔒 Código de autorização (NSU/Comprovante) é obrigatório para este método');
            return false;
        }

        if (discount > 0 && !justification.trim()) {
            toast.error('📝 Justifique o desconto aplicado');
            return false;
        }

        if (interest > 0 && !justification.trim()) {
            toast.error('📝 Justifique o acréscimo/juros aplicado');
            return false;
        }

        if (netAmount <= 0) {
            toast.error('Valor líquido deve ser maior que zero');
            return false;
        }

        if (netAmount > remainingBalance) {
            toast.error('Valor não pode ser maior que o saldo devedor');
            return false;
        }

        return true;
    };

    const handleConfirm = async () => {
        if (!validateForm()) return;

        setLoading(true);
        try {
            // 1. Criar evento financeiro (IMUTÁVEL)
            const { data: financialEvent, error: eventError } = await supabase
                .from('financial_events')
                .insert({
                    cash_register_id: activeCashRegister!.id,
                    operator_id: profile?.id,
                    event_type: 'RECEIPT',
                    original_amount: installment.amount,
                    discount_applied: discount,
                    interest_applied: interest,
                    net_received: netAmount,
                    payment_method_id: paymentMethodId,
                    auth_code: authCode.trim() || null,
                    partial_payment: isPartialPayment,
                    justification: justification.trim() || null,
                    occurred_at: new Date().toISOString()
                })
                .select()
                .single();

            if (eventError) throw eventError;

            // 2. Criar transação
            const selectedMethod = paymentMethods.find(m => m.id === paymentMethodId);
            const { data: transaction, error: txError } = await supabase
                .from('transactions')
                .insert({
                    clinic_id: profile?.clinic_id,
                    cash_register_id: activeCashRegister!.id,
                    description: `Parcela ${installment.installment_number}/${installment.total_installments} - ${installment.patient_name || installment.description || 'Paciente'}`,
                    amount: netAmount,
                    type: 'INCOME',
                    category: 'RECEBIMENTO_PARCELA',
                    date: new Date().toISOString().split('T')[0],
                    payment_method: selectedMethod?.name || 'Não especificado',
                    payment_status: 'Settled',
                    net_amount: netAmount,
                    fee_amount: 0
                })
                .select()
                .single();

            if (txError) throw txError;

            // 3. Vincular evento à transação
            await supabase
                .from('financial_events')
                .update({ transaction_id: transaction.id })
                .eq('id', financialEvent.id);

            // 4. Atualizar parcela
            const newAmountPaid = (installment.amount_paid || 0) + netAmount;
            const newStatus = newAmountPaid >= installment.amount ? 'PAID' : 'PARTIAL';

            await supabase
                .from('installments')
                .update({
                    status: newStatus,
                    paid_date: newStatus === 'PAID' ? new Date().toISOString().split('T')[0] : null,
                    payment_method: selectedMethod?.name,
                    updated_at: new Date().toISOString()
                })
                .eq('id', installment.id);

            // 5. Se pagamento parcial, criar nova parcela com saldo
            if (isPartialPayment && newBalance > 0) {
                await supabase
                    .from('installments')
                    .insert({
                        patient_id: installment.patient_id,
                        clinic_id: profile?.clinic_id,
                        installment_number: installment.installment_number,
                        total_installments: installment.total_installments,
                        amount: newBalance,
                        due_date: new Date(new Date().setDate(new Date().getDate() + 7))
                            .toISOString().split('T')[0],
                        status: 'PENDING',
                        notes: `Saldo remanescente de pagamento parcial`
                    });
            }

            // 6. Registrar auditoria
            await supabase
                .from('financial_audit_trail')
                .insert({
                    table_name: 'installments',
                    record_id: installment.id,
                    action_type: 'UPDATE',
                    old_data: {
                        status: 'PENDING',
                        amount_paid: installment.amount_paid || 0
                    },
                    new_data: {
                        status: newStatus,
                        amount_paid: newAmountPaid,
                        discount,
                        interest,
                        auth_code: authCode.trim() || null,
                        justification: justification.trim() || null
                    },
                    notes: `Recebimento via ${selectedMethod?.name} - Operador: ${profile?.name}`,
                    user_id: profile?.id
                });

            toast.success(
                isPartialPayment
                    ? `✅ Pagamento parcial registrado! Saldo: R$ ${newBalance.toFixed(2)}`
                    : '✅ Parcela quitada com sucesso!'
            );

            onSuccess();
            onOpenChange(false);

        } catch (error: any) {
            console.error('Erro ao processar recebimento:', error);
            toast.error(`Erro: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <BaseSheet
            open={open}
            onOpenChange={onOpenChange}
            title="💰 Recebimento Blindado"
            description="Sistema de recebimento com segurança SAP/Bancária"
            size="2xl"
            showDefaultFooter={false}
        >
            <div className="space-y-6">
                {/* Alerta de Caixa Fechado */}
                {!loadingData && !activeCashRegister && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 flex items-start gap-3">
                        <AlertTriangle className="text-red-600 dark:text-red-400 mt-0.5 shrink-0" size={20} />
                        <div>
                            <p className="font-bold text-red-900 dark:text-red-100">🔒 Caixa Fechado</p>
                            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                                Abra um caixa antes de realizar recebimentos. Esta é uma medida de segurança obrigatória.
                            </p>
                        </div>
                    </div>
                )}

                {/* Informações da Parcela */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <FileText className="text-blue-600 dark:text-blue-400" size={20} />
                        <h3 className="font-bold text-blue-900 dark:text-blue-100">
                            Parcela {installment.installment_number}/{installment.total_installments}
                        </h3>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                            <p className="text-blue-600 dark:text-blue-400 mb-1">Valor Original</p>
                            <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                                R$ {installment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                        <div>
                            <p className="text-blue-600 dark:text-blue-400 mb-1">Já Pago</p>
                            <p className="text-lg font-bold text-green-600 dark:text-green-400">
                                R$ {(installment.amount_paid || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                        <div>
                            <p className="text-blue-600 dark:text-blue-400 mb-1">Saldo Devedor</p>
                            <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
                                R$ {remainingBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Valores */}
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Valor Bruto *
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                            <input
                                type="number"
                                value={grossAmount}
                                onChange={(e) => setGrossAmount(parseFloat(e.target.value) || 0)}
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-800 dark:text-white"
                                step="0.01"
                                max={remainingBalance}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Desconto
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                            <input
                                type="number"
                                value={discount}
                                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-800 dark:text-white"
                                step="0.01"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Acréscimo/Juros
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                            <input
                                type="number"
                                value={interest}
                                onChange={(e) => setInterest(parseFloat(e.target.value) || 0)}
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-800 dark:text-white"
                                step="0.01"
                            />
                        </div>
                    </div>
                </div>

                {/* Valor Líquido */}
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Calculator className="text-green-600 dark:text-green-400" size={20} />
                            <span className="font-bold text-green-900 dark:text-green-100">Valor Líquido a Receber:</span>
                        </div>
                        <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                            R$ {netAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                    {isPartialPayment && newBalance > 0 && (
                        <p className="text-sm text-orange-600 dark:text-orange-400 mt-2 flex items-center gap-1">
                            <AlertTriangle size={14} />
                            Saldo remanescente: R$ {newBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                    )}
                </div>

                {/* Método de Pagamento */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Método de Pagamento *
                    </label>
                    <div className="relative">
                        <CreditCard size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <select
                            value={paymentMethodId}
                            onChange={(e) => handlePaymentMethodChange(e.target.value)}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-800 dark:text-white appearance-none"
                        >
                            <option value="">Selecione...</option>
                            {paymentMethods.map(method => (
                                <option key={method.id} value={method.id}>{method.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Código de Autorização (NSU) */}
                {requiresAuthCode && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                            <Lock size={16} className="text-red-600" />
                            Código de Autorização (NSU/Comprovante) *
                        </label>
                        <input
                            type="text"
                            value={authCode}
                            onChange={(e) => setAuthCode(e.target.value)}
                            placeholder="Ex: 123456789"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-800 dark:text-white"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            🔒 Obrigatório para rastreamento de transações eletrônicas
                        </p>
                    </div>
                )}

                {/* Justificativa */}
                {(discount > 0 || interest > 0) && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Justificativa *
                        </label>
                        <textarea
                            value={justification}
                            onChange={(e) => setJustification(e.target.value)}
                            placeholder="Explique o motivo do desconto ou acréscimo..."
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-800 dark:text-white h-20 resize-none"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            📝 Será registrado na auditoria financeira
                        </p>
                    </div>
                )}

                {/* Informações do Operador */}
                <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2 mb-2">
                        <Shield size={16} className="text-blue-600" />
                        <span className="font-bold text-gray-900 dark:text-gray-100">Informações de Segurança</span>
                    </div>
                    <p><strong>Operador:</strong> {profile?.name}</p>
                    <p><strong>Caixa:</strong> {activeCashRegister?.id?.slice(0, 8) || 'N/A'}</p>
                    <p><strong>Data/Hora:</strong> {new Date().toLocaleString('pt-BR')}</p>
                </div>

                {/* Botões */}
                <div className="flex gap-3 pt-4 border-t">
                    <button
                        onClick={() => onOpenChange(false)}
                        className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={loading || !activeCashRegister || loadingData}
                        className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                    >
                        {loading ? (
                            <>Processando...</>
                        ) : (
                            <>
                                <CheckCircle size={20} />
                                Confirmar Recebimento
                            </>
                        )}
                    </button>
                </div>
            </div>
        </BaseSheet>
    );
};

export default AdvancedPaymentModal;
