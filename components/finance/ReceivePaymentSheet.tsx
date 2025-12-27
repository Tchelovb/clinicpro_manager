import React, { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, CreditCard, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface ReceivePaymentSheetProps {
    isOpen: boolean;
    onClose: () => void;
    installment: {
        id: string;
        amount: number;
        amount_paid: number;
        due_date: string;
        status: string;
        patient_id: string;
        clinic_id: string;
        description: string;
    };
    onSuccess: () => void;
}

export const ReceivePaymentSheet: React.FC<ReceivePaymentSheetProps> = ({
    isOpen,
    onClose,
    installment,
    onSuccess
}) => {
    const [loading, setLoading] = useState(false);

    // Cálculos
    const valorRestante = installment.amount - (installment.amount_paid || 0);

    // Form state
    const [valorRecebido, setValorRecebido] = useState(valorRestante);
    const [dataRecebimento, setDataRecebimento] = useState(new Date().toISOString().split('T')[0]);
    const [metodoPagamento, setMetodoPagamento] = useState<string>('PIX');
    const [juros, setJuros] = useState(0);
    const [desconto, setDesconto] = useState(0);
    const [observacoes, setObservacoes] = useState('');

    // Atualizar valor recebido quando installment mudar
    useEffect(() => {
        if (installment) {
            const restante = installment.amount - (installment.amount_paid || 0);
            setValorRecebido(restante);
        }
    }, [installment]);

    // Cálculos dinâmicos
    const valorTotal = valorRecebido + juros - desconto;
    const novoSaldo = valorRestante - valorRecebido;
    const isQuitacaoTotal = valorRecebido >= valorRestante;
    const isPagamentoParcial = valorRecebido > 0 && valorRecebido < valorRestante;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validações
        if (valorRecebido <= 0) {
            toast.error('O valor recebido deve ser maior que zero');
            return;
        }

        if (valorRecebido > valorRestante) {
            toast.error('O valor recebido não pode ser maior que o saldo devedor');
            return;
        }

        if (!metodoPagamento) {
            toast.error('Selecione o método de pagamento');
            return;
        }

        setLoading(true);

        try {
            // 1. Atualizar parcela
            const novoAmountPaid = (installment.amount_paid || 0) + valorRecebido;
            const novoStatus = novoAmountPaid >= installment.amount ? 'PAID' : 'PARTIAL';

            const { error: installmentError } = await supabase
                .from('financial_installments')
                .update({
                    amount_paid: novoAmountPaid,
                    status: novoStatus,
                    updated_at: new Date().toISOString()
                })
                .eq('id', installment.id);

            if (installmentError) throw installmentError;

            // 2. Registrar transação no caixa
            const { error: transactionError } = await supabase
                .from('transactions')
                .insert({
                    clinic_id: installment.clinic_id,
                    type: 'INCOME',
                    amount: valorTotal,
                    payment_method: metodoPagamento,
                    date: dataRecebimento,
                    description: `Recebimento de parcela - ${installment.description}`,
                    category: 'RECEITA_PACIENTE'
                });

            if (transactionError) throw transactionError;

            // 3. Atualizar totais do paciente
            // Primeiro, buscar valores atuais
            const { data: patientData, error: fetchError } = await supabase
                .from('patients')
                .select('total_paid, balance_due')
                .eq('id', installment.patient_id)
                .single();

            if (fetchError) throw fetchError;

            // Calcular novos valores
            const newTotalPaid = (patientData.total_paid || 0) + valorRecebido;
            const newBalanceDue = (patientData.balance_due || 0) - valorRecebido;

            // Atualizar
            const { error: patientError } = await supabase
                .from('patients')
                .update({
                    total_paid: newTotalPaid,
                    balance_due: newBalanceDue
                })
                .eq('id', installment.patient_id);

            if (patientError) throw patientError;

            // 4. Registrar no histórico de pagamentos
            const { error: historyError } = await supabase
                .from('payment_history')
                .insert({
                    installment_id: installment.id,
                    amount: valorRecebido,
                    date: dataRecebimento,
                    method: metodoPagamento,
                    notes: observacoes || null
                });

            if (historyError) throw historyError;

            toast.success(
                isQuitacaoTotal
                    ? '✅ Parcela quitada com sucesso!'
                    : `✅ Pagamento parcial registrado! Saldo: R$ ${novoSaldo.toFixed(2)}`
            );

            onSuccess();
            onClose();

        } catch (error: any) {
            console.error('Erro ao processar recebimento:', error);
            toast.error('Erro ao processar recebimento: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-end">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Sheet */}
            <div className="relative w-full max-w-2xl h-full bg-white dark:bg-slate-900 shadow-2xl overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 z-10 bg-gradient-to-r from-emerald-600 to-emerald-700 dark:from-emerald-700 dark:to-emerald-800 text-white p-6 shadow-lg">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                                <DollarSign size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">Receber Pagamento</h2>
                                <p className="text-emerald-100 text-sm">Registro profissional de recebimento</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Resumo da Parcela */}
                    <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-5">
                        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide mb-4">
                            Resumo da Parcela
                        </h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Valor Original</p>
                                <p className="text-lg font-bold text-slate-900 dark:text-white">
                                    R$ {installment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Já Pago</p>
                                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                    R$ {(installment.amount_paid || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Saldo Devedor</p>
                                <p className="text-lg font-bold text-rose-600 dark:text-rose-400">
                                    R$ {valorRestante.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Valor a Receber */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">
                            Valor Recebido <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold">R$</span>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                max={valorRestante}
                                value={valorRecebido}
                                onChange={(e) => setValorRecebido(parseFloat(e.target.value) || 0)}
                                className="w-full pl-12 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-slate-800 dark:text-white text-lg font-bold"
                                required
                            />
                        </div>
                    </div>

                    {/* Data do Recebimento */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">
                            Data do Recebimento <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <Calendar size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="date"
                                value={dataRecebimento}
                                onChange={(e) => setDataRecebimento(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-slate-800 dark:text-white"
                                required
                            />
                        </div>
                    </div>

                    {/* Método de Pagamento */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">
                            Forma de Pagamento <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <CreditCard size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <select
                                value={metodoPagamento}
                                onChange={(e) => setMetodoPagamento(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-slate-800 dark:text-white appearance-none"
                                required
                            >
                                <option value="PIX">💳 Pix</option>
                                <option value="DINHEIRO">💵 Dinheiro</option>
                                <option value="CARTAO_CREDITO">💳 Cartão de Crédito</option>
                                <option value="CARTAO_DEBITO">💳 Cartão de Débito</option>
                                <option value="BOLETO">📄 Boleto</option>
                                <option value="TRANSFERENCIA">🏦 Transferência Bancária</option>
                            </select>
                        </div>
                    </div>

                    {/* Acréscimos e Descontos */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">
                                Juros/Multa (Opcional)
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">R$</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={juros}
                                    onChange={(e) => setJuros(parseFloat(e.target.value) || 0)}
                                    className="w-full pl-12 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-slate-800 dark:text-white"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">
                                Desconto (Opcional)
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">R$</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={desconto}
                                    onChange={(e) => setDesconto(parseFloat(e.target.value) || 0)}
                                    className="w-full pl-12 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-slate-800 dark:text-white"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Observações */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">
                            Observações (Opcional)
                        </label>
                        <textarea
                            value={observacoes}
                            onChange={(e) => setObservacoes(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-slate-800 dark:text-white resize-none"
                            placeholder="Adicione observações sobre este recebimento..."
                        />
                    </div>

                    {/* Alerta de Tipo de Pagamento */}
                    {isPagamentoParcial && (
                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4 flex items-start gap-3">
                            <AlertCircle size={20} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-bold text-amber-800 dark:text-amber-200 mb-1">
                                    ⚠️ Pagamento Parcial
                                </p>
                                <p className="text-sm text-amber-700 dark:text-amber-300">
                                    Esta parcela continuará aberta com saldo de <strong>R$ {novoSaldo.toFixed(2)}</strong>
                                </p>
                            </div>
                        </div>
                    )}

                    {isQuitacaoTotal && (
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-lg p-4 flex items-start gap-3">
                            <CheckCircle size={20} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-bold text-emerald-800 dark:text-emerald-200 mb-1">
                                    ✅ Quitação Total
                                </p>
                                <p className="text-sm text-emerald-700 dark:text-emerald-300">
                                    Esta parcela será marcada como <strong>PAGA</strong>
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Resumo Final */}
                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border border-emerald-200 dark:border-emerald-700 rounded-lg p-5">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300 uppercase">
                                Valor Total a Registrar
                            </span>
                            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                                R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                        <div className="text-xs text-emerald-600 dark:text-emerald-400 space-y-1">
                            <p>• Valor Recebido: R$ {valorRecebido.toFixed(2)}</p>
                            {juros > 0 && <p>• Juros/Multa: + R$ {juros.toFixed(2)}</p>}
                            {desconto > 0 && <p>• Desconto: - R$ {desconto.toFixed(2)}</p>}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="sticky bottom-0 -mx-6 -mb-6 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 p-6 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 font-medium transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading || valorRecebido <= 0}
                            className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg font-bold transition-colors shadow-lg shadow-emerald-600/30"
                        >
                            {loading ? 'Processando...' : '💾 Confirmar Recebimento'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
