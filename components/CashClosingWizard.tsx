import React, { useState } from 'react';
import { useFinancial } from '../contexts/FinancialContext';
import { X, Check, AlertTriangle, CreditCard, DollarSign, FileText, ChevronRight, ChevronLeft } from 'lucide-react';

interface CashClosingWizardProps {
    onClose: () => void;
    registerId: string;
}

type Step = 'CARDS' | 'CASH' | 'REPORT';

const CashClosingWizard: React.FC<CashClosingWizardProps> = ({ onClose, registerId }) => {
    const { closeSession, activeSession, financialSettings } = useFinancial();
    const [step, setStep] = useState<Step>('CARDS');

    // State for Cards Conference
    const [cardTotal, setCardTotal] = useState<string>('');

    // State for Cash Count (could be detailed by bills, simplistic for now)
    const [cashTotal, setCashTotal] = useState<string>('');
    const [observations, setObservations] = useState('');

    // Calculations
    const systemCash = activeSession?.transactions
        .filter(t => t.paymentMethod === 'Dinheiro' || t.paymentMethod === 'Espécie')
        .reduce((acc, t) => acc + (t.type === 'income' ? t.amount : -t.amount), activeSession.openingBalance) || 0;

    const systemCards = activeSession?.transactions
        .filter(t => ['Cartão de Crédito', 'Cartão de Débito', 'Pix'].includes(t.paymentMethod))
        .reduce((acc, t) => acc + (t.type === 'income' ? t.amount : -t.amount), 0) || 0;

    const handleNext = () => {
        if (step === 'CARDS') setStep('CASH');
        else if (step === 'CASH') setStep('REPORT');
    };

    const handleBack = () => {
        if (step === 'CASH') setStep('CARDS');
        else if (step === 'REPORT') setStep('CASH');
    };

    const handleFinish = async () => {
        // Total declared is sum of verified cash + verified cards
        // NOTE: Usually closing balance refers to CASH in drawer, but some clinics count everything.
        // Standard practice: Close Register Balance = Cash in Drawer. 
        // Card slips are audited but don't stay in "drawer" balance for next day.
        // However, for "declared_balance", Supabase logic expects the total closing value.

        // Let's assume declared_balance = Cash Amount.
        const declaredCash = parseFloat(cashTotal) || 0;

        await closeSession(registerId, declaredCash, observations);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">

                {/* Header */}
                <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6 flex justify-between items-center text-white">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Check className="text-green-400" /> Fechamento de Caixa
                        </h2>
                        <p className="text-gray-400 text-sm mt-1">Siga as etapas para auditoria e fechamento</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                {/* Steps Indicator */}
                <div className="flex border-b border-gray-100">
                    <div className={`flex-1 p-4 text-center text-sm font-medium ${step === 'CARDS' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}`}>
                        1. Conferência Cartões/Pix
                    </div>
                    <div className={`flex-1 p-4 text-center text-sm font-medium ${step === 'CASH' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}`}>
                        2. Contagem Espécie
                    </div>
                    <div className={`flex-1 p-4 text-center text-sm font-medium ${step === 'REPORT' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}`}>
                        3. Resumo Final
                    </div>
                </div>

                {/* Content */}
                <div className="p-8 min-h-[300px]">

                    {step === 'CARDS' && (
                        <div className="space-y-6">
                            <div className="bg-blue-50 p-4 rounded-lg flex items-start gap-3">
                                <CreditCard className="text-blue-600 mt-1" />
                                <div>
                                    <h3 className="font-semibold text-blue-900">Conferência de Relatórios</h3>
                                    <p className="text-sm text-blue-700 mt-1">
                                        Some os comprovantes das maquininhas e Pix. O sistema espera:
                                        <span className="font-bold ml-1">
                                            {financialSettings?.blind_closing ? 'Oculto' : `R$ ${systemCards.toFixed(2)}`}
                                        </span>
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Total em Comprovantes (Cartão + Pix)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-3 text-gray-400">R$</span>
                                    <input
                                        type="number"
                                        value={cardTotal}
                                        onChange={e => setCardTotal(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-lg font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="0.00"
                                        autoFocus
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 'CASH' && (
                        <div className="space-y-6">
                            <div className="bg-green-50 p-4 rounded-lg flex items-start gap-3">
                                <DollarSign className="text-green-600 mt-1" />
                                <div>
                                    <h3 className="font-semibold text-green-900">Contagem de Gaveta</h3>
                                    <p className="text-sm text-green-700 mt-1">
                                        Conte o dinheiro físico em caixa. O sistema espera:
                                        <span className="font-bold ml-1">
                                            {financialSettings?.blind_closing ? 'Oculto' : `R$ ${systemCash.toFixed(2)}`}
                                        </span>
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Valor Total em Dinheiro</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-3 text-gray-400">R$</span>
                                    <input
                                        type="number"
                                        value={cashTotal}
                                        onChange={e => setCashTotal(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-lg font-bold focus:ring-2 focus:ring-green-500 outline-none"
                                        placeholder="0.00"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Observações / Justificativa</label>
                                <textarea
                                    value={observations}
                                    onChange={e => setObservations(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none h-24 resize-none"
                                    placeholder="Se houver diferença, explique aqui..."
                                />
                            </div>
                        </div>
                    )}

                    {step === 'REPORT' && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-gray-800 text-center">Resumo do Fechamento</h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <p className="text-xs uppercase text-gray-500 font-bold mb-1">Total Declarado (Dinheiro)</p>
                                    <p className="text-2xl font-bold text-gray-900">R$ {parseFloat(cashTotal || '0').toFixed(2)}</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <p className="text-xs uppercase text-gray-500 font-bold mb-1">Total Sistema (Dinheiro)</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {financialSettings?.blind_closing ? '---' : `R$ ${systemCash.toFixed(2)}`}
                                    </p>
                                </div>
                            </div>

                            {!financialSettings?.blind_closing && (
                                Math.abs((parseFloat(cashTotal) || 0) - systemCash) > 0.01 ? (
                                    <div className="bg-red-50 border border-red-200 p-4 rounded-lg flex items-center gap-3">
                                        <AlertTriangle className="text-red-500" />
                                        <div>
                                            <p className="text-red-800 font-bold">Diferença de Caixa: R$ {((parseFloat(cashTotal) || 0) - systemCash).toFixed(2)}</p>
                                            <p className="text-red-600 text-xs">Verifique se esqueceu de lançar alguma sangria ou recebimento.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-green-50 border border-green-200 p-4 rounded-lg flex items-center gap-3">
                                        <Check className="text-green-500" />
                                        <p className="text-green-800 font-bold">Caixa Batendo! Parabéns.</p>
                                    </div>
                                )
                            )}

                            {financialSettings?.blind_closing && (
                                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-sm text-blue-800">
                                    Modo "Fechamento Cego" ativo. A conferência será feita pelo gestor.
                                </div>
                            )}

                        </div>
                    )}

                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-8 py-5 flex justify-between items-center border-t border-gray-200">
                    {step !== 'CARDS' ? (
                        <button onClick={handleBack} className="text-gray-600 hover:text-gray-900 font-medium flex items-center gap-1">
                            <ChevronLeft size={18} /> Voltar
                        </button>
                    ) : (
                        <div></div>
                    )}

                    {step !== 'REPORT' ? (
                        <button
                            onClick={handleNext}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium shadow-md transition-colors flex items-center gap-2"
                        >
                            Próximo <ChevronRight size={18} />
                        </button>
                    ) : (
                        <button
                            onClick={handleFinish}
                            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-bold shadow-lg transition-transform transform hover:scale-105 flex items-center gap-2"
                        >
                            <Check size={18} /> Confirmar Fechamento
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
};

export default CashClosingWizard;
