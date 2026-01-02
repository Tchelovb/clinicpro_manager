import React, { useState, useEffect } from 'react';
import { User, Tag, CreditCard, AlertTriangle, ShieldCheck, ChevronRight, Lock, UserCheck, ToggleLeft, ToggleRight, X } from 'lucide-react';
import { formatCurrency } from '../../utils/format';

interface Professional {
    id: string;
    name: string;
    photo_url?: string;
}

interface PriceTable {
    id: string;
    name: string;
    global_adjustment_percent: number;
}

interface DealConfigProps {
    totalValue: number;
    professionals: Professional[];
    priceTables: PriceTable[];
    onUpdateDeal: (dealData: any) => void;
    onSaveBudget: () => Promise<void>;
}

export const DealConfigurator: React.FC<DealConfigProps> = ({
    totalValue,
    professionals,
    priceTables,
    onUpdateDeal,
    onSaveBudget
}) => {
    // --- STATE: O Coração da Negociação ---
    const [selectedProf, setSelectedProf] = useState<string>(professionals[0]?.id || '');
    const [selectedTable, setSelectedTable] = useState<string>(priceTables[0]?.id || '');

    const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
    const [discountValue, setDiscountValue] = useState<number>(0);

    const [downPayment, setDownPayment] = useState<number>(0);
    const [installments, setInstallments] = useState<number>(1);
    const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'CASH' | 'BOLETO'>('PIX');

    // --- CÁLCULOS (Simulação em tempo real) ---
    const [calculatedState, setCalculatedState] = useState({
        finalTotal: 0,
        amountToFinance: 0,
        monthlyValue: 0,
        marginHealth: 'healthy' as 'healthy' | 'warning' | 'critical'
    });

    // Ref to track last emitted value to prevent infinite loops
    const lastEmittedValueRef = React.useRef<string>('');

    // Auto-apply PIX discount
    useEffect(() => {
        if (paymentMethod === 'PIX') {
            setDiscountType('PERCENTAGE');
            setDiscountValue(5);
            setInstallments(1);
        } else if (paymentMethod === 'CASH') {
            setInstallments(1);
        } else if (paymentMethod === 'DEBIT_CARD') {
            setInstallments(1);
        }
        // Cap installments at 18x (card machine limit)
        if (installments > 18) {
            setInstallments(18);
        }
    }, [paymentMethod, installments]);

    useEffect(() => {
        // 1. Aplica Desconto
        let discountAmount = 0;
        if (discountType === 'PERCENTAGE') {
            discountAmount = totalValue * (discountValue / 100);
        } else {
            discountAmount = discountValue;
        }
        const totalAfterDiscount = Math.max(0, totalValue - discountAmount);

        // 2. Subtrai Entrada
        const toFinance = Math.max(0, totalAfterDiscount - downPayment);

        // 3. Calcula Parcela
        const monthly = installments > 0 ? toFinance / installments : 0;

        // 4. Checagem de Margem
        let health: 'healthy' | 'warning' | 'critical' = 'healthy';
        const discountPercent = (discountAmount / totalValue) * 100;
        if (discountPercent > 15) health = 'critical';
        else if (discountPercent > 5) health = 'warning';

        // Only update local state if numbers changed (prevent render loop)
        setCalculatedState(prev => {
            if (
                prev.finalTotal === totalAfterDiscount &&
                prev.amountToFinance === toFinance &&
                prev.monthlyValue === monthly &&
                prev.marginHealth === health
            ) {
                return prev;
            }
            return {
                finalTotal: totalAfterDiscount,
                amountToFinance: toFinance,
                monthlyValue: monthly,
                marginHealth: health
            };
        });

        // Prepare payload
        const payload = {
            sales_rep_id: selectedProf || null,
            price_table_id: selectedTable || null,
            discount_type: discountType,
            discount_value: discountValue,
            down_payment_value: downPayment,
            installments_count: installments,
            final_value: totalAfterDiscount,
            payment_method_preference: paymentMethod,
            suggested_installments: installments,
            suggested_discount_percent: paymentMethod === 'PIX' ? 5 : discountValue
        };

        // LOOP PROTECTION: Only emit if payload actually changed
        const payloadString = JSON.stringify(payload);
        if (lastEmittedValueRef.current !== payloadString) {
            lastEmittedValueRef.current = payloadString;
            onUpdateDeal(payload);
        }

    }, [totalValue, discountValue, discountType, downPayment, installments, selectedProf, selectedTable, onUpdateDeal]);

    // Save Budget Handler
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSaveBudget();
        } catch (err) {
            console.error('Save error:', err);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full relative">

            {/* 1. CABEÇALHO DE CONTEXTO */}
            <div className="bg-slate-50 p-4 border-b border-slate-200">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Configuração do Negócio</h3>

                <div className="grid grid-cols-2 gap-3">
                    {/* Seletor de Profissional */}
                    <div className="relative">
                        <label className="text-[10px] text-slate-500 font-semibold ml-1">Orçamentista</label>
                        <div className="flex items-center bg-white border border-slate-200 rounded-lg p-2 mt-1 hover:border-blue-400 transition-colors cursor-pointer group">
                            <User size={16} className="text-slate-400 group-hover:text-blue-500 mr-2" />
                            <select
                                className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none appearance-none"
                                value={selectedProf}
                                onChange={(e) => setSelectedProf(e.target.value)}
                            >
                                {professionals.map(p => (
                                    <option key={p.id} value={p.id || ''}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Seletor de Tabela */}
                    <div className="relative">
                        <label className="text-[10px] text-slate-500 font-semibold ml-1">Tabela de Preço</label>
                        <div className="flex items-center bg-white border border-slate-200 rounded-lg p-2 mt-1 hover:border-blue-400 transition-colors cursor-pointer group">
                            <Tag size={16} className="text-slate-400 group-hover:text-blue-500 mr-2" />
                            <select
                                className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none appearance-none"
                                value={selectedTable || ''}
                                onChange={(e) => setSelectedTable(e.target.value)}
                            >
                                {priceTables.map(t => (
                                    <option key={t.id || 'null'} value={t.id || ''}>{t.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. MOTOR DE NEGOCIAÇÃO */}
            <div className="p-5 flex-1 space-y-6 overflow-y-auto">

                {/* Forma de Pagamento (Sugestão) */}
                <div>
                    <label className="text-sm font-medium text-slate-600 mb-3 block">
                        Sugestão de Pagamento
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {/* PIX */}
                        <button
                            type="button"
                            onClick={() => setPaymentMethod('PIX')}
                            className={`p-3 rounded-lg border-2 transition-all text-left ${paymentMethod === 'PIX'
                                ? 'border-green-500 bg-green-50'
                                : 'border-slate-200 hover:border-green-300 bg-white'
                                }`}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className={`text-sm font-bold ${paymentMethod === 'PIX' ? 'text-green-700' : 'text-slate-700'}`}>
                                    PIX
                                </span>
                                {paymentMethod === 'PIX' && (
                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                )}
                            </div>
                            <span className="block text-[10px] text-green-600 font-semibold">
                                -5% automático
                            </span>
                        </button>

                        {/* Cartão de Crédito */}
                        <button
                            type="button"
                            onClick={() => setPaymentMethod('CREDIT_CARD')}
                            className={`p-3 rounded-lg border-2 transition-all text-left ${paymentMethod === 'CREDIT_CARD'
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-slate-200 hover:border-blue-300 bg-white'
                                }`}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className={`text-sm font-bold ${paymentMethod === 'CREDIT_CARD' ? 'text-blue-700' : 'text-slate-700'}`}>
                                    Cartão
                                </span>
                                {paymentMethod === 'CREDIT_CARD' && (
                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                )}
                            </div>
                            <span className="block text-[10px] text-slate-500">
                                Até 18x
                            </span>
                        </button>

                        {/* Dinheiro */}
                        <button
                            type="button"
                            onClick={() => setPaymentMethod('CASH')}
                            className={`p-3 rounded-lg border-2 transition-all text-left ${paymentMethod === 'CASH'
                                ? 'border-emerald-500 bg-emerald-50'
                                : 'border-slate-200 hover:border-emerald-300 bg-white'
                                }`}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className={`text-sm font-bold ${paymentMethod === 'CASH' ? 'text-emerald-700' : 'text-slate-700'}`}>
                                    Dinheiro
                                </span>
                                {paymentMethod === 'CASH' && (
                                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                )}
                            </div>
                            <span className="block text-[10px] text-slate-500">
                                À vista
                            </span>
                        </button>

                        {/* Boleto */}
                        <button
                            type="button"
                            onClick={() => setPaymentMethod('BOLETO')}
                            className={`p-3 rounded-lg border-2 transition-all text-left ${paymentMethod === 'BOLETO'
                                ? 'border-orange-500 bg-orange-50'
                                : 'border-slate-200 hover:border-orange-300 bg-white'
                                }`}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className={`text-sm font-bold ${paymentMethod === 'BOLETO' ? 'text-orange-700' : 'text-slate-700'}`}>
                                    Boleto
                                </span>
                                {paymentMethod === 'BOLETO' && (
                                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                                )}
                            </div>
                            <span className="block text-[10px] text-slate-500">
                                Até 12x
                            </span>
                        </button>
                    </div>
                </div>

                {/* Descontos */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium text-slate-600">Desconto Comercial</label>
                        <div className="flex bg-slate-100 rounded-md p-0.5">
                            <button
                                onClick={() => setDiscountType('PERCENTAGE')}
                                className={`px-2 py-0.5 text-xs rounded ${discountType === 'PERCENTAGE' ? 'bg-white shadow text-blue-600 font-bold' : 'text-slate-500'}`}>%</button>
                            <button
                                onClick={() => setDiscountType('FIXED')}
                                className={`px-2 py-0.5 text-xs rounded ${discountType === 'FIXED' ? 'bg-white shadow text-blue-600 font-bold' : 'text-slate-500'}`}>R$</button>
                        </div>
                    </div>
                    <div className="relative group">
                        <input
                            type="number"
                            className={`w-full p-3 rounded-xl border-2 text-right font-bold text-slate-700 outline-none transition-all
                ${calculatedState.marginHealth === 'critical' ? 'border-red-300 bg-red-50 focus:border-red-500' : 'border-slate-100 bg-slate-50 focus:border-blue-500 focus:bg-white'}
              `}
                            value={discountValue}
                            onChange={(e) => setDiscountValue(Number(e.target.value))}
                        />
                        {calculatedState.marginHealth === 'critical' && (
                            <div className="absolute right-0 -bottom-5 flex items-center text-xs text-red-600 font-bold animate-pulse">
                                <Lock size={10} className="mr-1" /> Margem Crítica
                            </div>
                        )}
                    </div>
                </div>

                {/* Entrada */}
                <div>
                    <label className="text-sm font-medium text-slate-600 mb-2 block">Entrada / Sinal</label>
                    <div className="relative">
                        <span className="absolute left-3 top-3 text-slate-400 text-sm">R$</span>
                        <input
                            type="number"
                            className="w-full pl-8 p-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold focus:ring-2 focus:ring-blue-100 outline-none"
                            value={downPayment}
                            onChange={(e) => setDownPayment(Number(e.target.value))}
                        />
                        <div className="absolute right-3 top-3.5 text-xs text-green-600 font-semibold bg-green-50 px-2 rounded-full">
                            {totalValue > 0 ? Math.round((downPayment / calculatedState.finalTotal) * 100) : 0}%
                        </div>
                    </div>
                </div>

                {/* Parcelamento */}
                <div>
                    <div className="flex justify-between items-end mb-2">
                        <label className="text-sm font-medium text-slate-600">Parcelamento</label>
                        <span className="text-2xl font-bold text-blue-600">{installments}x</span>
                    </div>
                    <input
                        type="range"
                        min="1"
                        max="18"
                        step="1"
                        value={installments}
                        onChange={(e) => setInstallments(Number(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 hover:accent-blue-500"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1 px-1">
                        <span>À vista</span>
                        <span>6x</span>
                        <span>12x</span>
                        <span>18x</span>
                    </div>
                </div>

            </div>

            {/* 3. RODAPÉ DE RESULTADO */}
            <div className="bg-slate-900 p-5 text-white">
                <div className="flex justify-between items-center mb-1 opacity-70">
                    <span className="text-xs">Valor Total do Tratamento</span>
                    <span className="text-sm line-through decoration-red-400">{formatCurrency(totalValue)}</span>
                </div>

                <div className="flex justify-between items-end mb-4 border-b border-slate-700 pb-4">
                    <div>
                        <span className="block text-xs text-slate-400 mb-1">A pagar hoje (Entrada)</span>
                        <span className="text-lg font-bold text-green-400">{formatCurrency(downPayment)}</span>
                    </div>
                    <div className="text-right">
                        <span className="block text-xs text-slate-400 mb-1">Saldo em {installments}x de</span>
                        <span className="text-3xl font-bold tracking-tight text-white">{formatCurrency(calculatedState.monthlyValue)}</span>
                    </div>
                </div>

                {/* Botão Único: Salvar Orçamento */}
                <div className="space-y-3">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center transition-all shadow-lg shadow-blue-900/50 group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                Salvando...
                            </>
                        ) : (
                            <>
                                <ShieldCheck className="mr-2 group-hover:scale-110 transition-transform" size={18} />
                                Salvar Orçamento
                                <ChevronRight className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" size={18} />
                            </>
                        )}
                    </button>
                </div>

                {/* LEI DO FECHAMENTO: Botão de Saída Discreto */}
                <button
                    onClick={() => window.history.back()}
                    className="w-full mt-3 text-slate-400 hover:text-slate-600 font-medium text-sm flex items-center justify-center px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors"
                >
                    <X size={16} className="mr-2" />
                    Cancelar e Sair
                </button>

                {/* Indicador de Margem */}
                <div className="mt-3 flex justify-center items-center gap-2">
                    {calculatedState.marginHealth === 'healthy' ? (
                        <span className="flex items-center text-[10px] text-green-400/80"><ShieldCheck size={10} className="mr-1" /> Margem Segura</span>
                    ) : (
                        <span className="flex items-center text-[10px] text-red-400/80"><AlertTriangle size={10} className="mr-1" /> Margem de Risco</span>
                    )}
                </div>

            </div >
        </div >
    );
};
