import React from 'react';
import { CheckCircle2, Loader2, FileText, DollarSign, Users, PartyPopper } from 'lucide-react';
import { formatCurrency } from '../utils/format';

interface SaleProgressModalProps {
    isOpen: boolean;
    steps: {
        label: string;
        status: 'pending' | 'processing' | 'completed' | 'error';
        icon?: React.ReactNode;
    }[];
    patientName: string;
    totalValue: number;
    onClose: () => void;
}

export const SaleProgressModal: React.FC<SaleProgressModalProps> = ({
    isOpen,
    steps,
    patientName,
    totalValue,
    onClose
}) => {
    if (!isOpen) return null;

    const allCompleted = steps.every(s => s.status === 'completed');
    const hasError = steps.some(s => s.status === 'error');

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden scale-100 animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className={`p-6 text-center ${allCompleted ? 'bg-gradient-to-br from-green-50 to-emerald-50' : 'bg-gradient-to-br from-blue-50 to-indigo-50'}`}>
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${allCompleted ? 'bg-green-600' : 'bg-blue-600'}`}>
                        {allCompleted ? (
                            <PartyPopper size={32} className="text-white" />
                        ) : (
                            <Loader2 size={32} className="text-white animate-spin" />
                        )}
                    </div>
                    <h2 className="text-xl font-bold text-slate-800">
                        {allCompleted ? 'Venda Concluída!' : hasError ? 'Erro no Processo' : 'Processando Venda...'}
                    </h2>
                    <p className="text-sm text-slate-600 mt-1">
                        {allCompleted ? `${patientName} - ${formatCurrency(totalValue)}` : 'Aguarde enquanto finalizamos...'}
                    </p>
                </div>

                {/* Progress Steps */}
                <div className="p-6 space-y-3">
                    {steps.map((step, index) => (
                        <div
                            key={index}
                            className={`flex items-center gap-3 p-3 rounded-lg transition-all ${step.status === 'completed' ? 'bg-green-50 border border-green-200' :
                                    step.status === 'processing' ? 'bg-blue-50 border border-blue-200 animate-pulse' :
                                        step.status === 'error' ? 'bg-red-50 border border-red-200' :
                                            'bg-slate-50 border border-slate-200'
                                }`}
                        >
                            {/* Icon */}
                            <div className={`flex-shrink-0 ${step.status === 'completed' ? 'text-green-600' :
                                    step.status === 'processing' ? 'text-blue-600' :
                                        step.status === 'error' ? 'text-red-600' :
                                            'text-slate-400'
                                }`}>
                                {step.status === 'completed' ? (
                                    <CheckCircle2 size={24} />
                                ) : step.status === 'processing' ? (
                                    <Loader2 size={24} className="animate-spin" />
                                ) : (
                                    step.icon || <div className="w-6 h-6 rounded-full border-2 border-current" />
                                )}
                            </div>

                            {/* Label */}
                            <span className={`flex-1 text-sm font-medium ${step.status === 'completed' ? 'text-green-800' :
                                    step.status === 'processing' ? 'text-blue-800' :
                                        step.status === 'error' ? 'text-red-800' :
                                            'text-slate-600'
                                }`}>
                                {step.label}
                            </span>

                            {/* Status Badge */}
                            {step.status === 'processing' && (
                                <span className="text-xs text-blue-600 font-semibold">Processando...</span>
                            )}
                            {step.status === 'completed' && (
                                <span className="text-xs text-green-600 font-semibold">✓ Concluído</span>
                            )}
                        </div>
                    ))}
                </div>

                {/* Success Message */}
                {allCompleted && (
                    <div className="px-6 pb-6">
                        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4 rounded-xl text-center">
                            <p className="font-bold text-lg mb-1">🎉 Paciente em Tratamento!</p>
                            <p className="text-sm opacity-90">Financeiro criado • Contrato gerado • Equipe notificada</p>
                        </div>
                    </div>
                )}

                {/* Footer Button */}
                {allCompleted && (
                    <div className="p-6 bg-slate-50 border-t border-slate-200">
                        <button
                            onClick={onClose}
                            className="w-full py-3 px-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 transition-colors shadow-lg"
                        >
                            Voltar ao Terminal
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
