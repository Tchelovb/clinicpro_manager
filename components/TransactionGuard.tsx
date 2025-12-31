import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, Lock, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency } from '../utils/format';

interface TransactionGuardProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (pin: string) => Promise<void>;
    summary: {
        patientName: string;
        totalValue: number;
        installments: number;
        downPayment: number;
    };
}

export const TransactionGuard: React.FC<TransactionGuardProps> = ({
    isOpen,
    onClose,
    onConfirm,
    summary
}) => {
    const [pin, setPin] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    if (!isOpen) return null;

    const handleConfirm = async () => {
        if (pin.length < 4) {
            toast.error("Digite seu PIN de 4 dígitos.");
            return;
        }

        setIsProcessing(true);
        try {
            await onConfirm(pin);
            setPin(''); // Limpa o PIN após sucesso
        } catch (error) {
            // Erro já tratado no componente pai
        } finally {
            setIsProcessing(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && pin.length >= 4) {
            handleConfirm();
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden scale-100 animate-in zoom-in-95 duration-200">

                {/* Cabeçalho de Alerta */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 border-b border-blue-100 text-center relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-1 hover:bg-white/50 rounded-lg transition-colors"
                    >
                        <X size={20} className="text-slate-400" />
                    </button>

                    <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <ShieldCheck size={32} className="text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800">Autorizar Transação</h2>
                    <p className="text-sm text-slate-500 mt-1">Este processo é irreversível e auditável.</p>
                </div>

                {/* Corpo: O Efeito Dominó */}
                <div className="p-6 space-y-4">

                    {/* Resumo da Operação */}
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Resumo da Operação</p>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-600">Paciente:</span>
                                <span className="font-bold text-slate-800">{summary.patientName}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-600">Valor Total:</span>
                                <span className="font-bold text-green-600 text-lg">
                                    {formatCurrency(summary.totalValue)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-600">Entrada:</span>
                                <span className="font-semibold text-slate-700">{formatCurrency(summary.downPayment)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-600">Parcelamento:</span>
                                <span className="font-semibold text-slate-700">{summary.installments}x</span>
                            </div>
                        </div>
                    </div>

                    {/* Impacto no Sistema */}
                    <div className="space-y-2">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Impacto no Sistema:</p>
                        <ul className="text-sm text-slate-600 space-y-2">
                            <li className="flex items-start">
                                <AlertTriangle size={16} className="text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
                                <span>Gerar lançamento financeiro e fiscal</span>
                            </li>
                            <li className="flex items-start">
                                <AlertTriangle size={16} className="text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
                                <span>Disparar contrato para assinatura digital</span>
                            </li>
                            <li className="flex items-start">
                                <AlertTriangle size={16} className="text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
                                <span>Liberar procedimentos clínicos no prontuário</span>
                            </li>
                            <li className="flex items-start">
                                <AlertTriangle size={16} className="text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
                                <span>Calcular comissões da equipe</span>
                            </li>
                        </ul>
                    </div>

                    {/* Input de PIN */}
                    <form onSubmit={(e) => { e.preventDefault(); handleConfirm(); }} className="mt-6">
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            Digite seu PIN de Segurança
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="password"
                                inputMode="numeric"
                                maxLength={4}
                                value={pin}
                                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                                onKeyPress={handleKeyPress}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-300 rounded-xl text-center text-2xl font-bold tracking-[0.5em] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                placeholder="••••"
                                autoFocus
                                autoComplete="one-time-code"
                                disabled={isProcessing}
                            />
                        </div>
                        <p className="text-xs text-slate-400 mt-2 text-center">
                            {pin.length}/4 dígitos
                        </p>
                    </form>

                </div>

                {/* Rodapé de Ação */}
                <div className="p-6 bg-slate-50 border-t border-slate-200 flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={isProcessing}
                        className="flex-1 py-3 px-4 bg-white border-2 border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isProcessing || pin.length < 4}
                        className="flex-1 py-3 px-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isProcessing ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Verificando...
                            </>
                        ) : (
                            'CONFIRMAR VENDA'
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
};
