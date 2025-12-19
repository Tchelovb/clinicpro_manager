import React, { useState } from 'react';
import { useFinancial } from '../contexts/FinancialContext';
import { X, ArrowUpCircle, ArrowDownCircle, DollarSign, AlertCircle } from 'lucide-react';

interface SangriaSuprimentoModalProps {
    onClose: () => void;
    type?: 'sangria' | 'suprimento'; // if pre-selected
}

const SangriaSuprimentoModal: React.FC<SangriaSuprimentoModalProps> = ({ onClose, type: initialType = 'suprimento' }) => {
    const { addCashMovement, activeSession } = useFinancial();
    const [type, setType] = useState<'sangria' | 'suprimento'>(initialType);
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || parseFloat(amount) <= 0) {
            alert("Informe um valor válido.");
            return;
        }
        if (!description.trim()) {
            alert("Informe uma descrição.");
            return;
        }

        setIsSubmitting(true);
        try {
            await addCashMovement(type, parseFloat(amount), description);
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!activeSession) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">

                <div className="bg-gray-50 border-b border-gray-100 p-4 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <DollarSign className="text-blue-600" size={20} />
                        Movimentação de Caixa
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">

                    {/* Type Selector */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <button
                            type="button"
                            onClick={() => setType('suprimento')}
                            className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-2 transition-all
                ${type === 'suprimento'
                                    ? 'bg-green-50 border-green-500 text-green-700 ring-1 ring-green-500'
                                    : 'bg-white border-gray-200 text-gray-400 hover:border-green-200 hover:text-green-600'}`}
                        >
                            <ArrowUpCircle size={24} />
                            <span className="font-bold text-sm">Suprimento</span>
                            <span className="text-[10px] opacity-75">Entrada de Dinheiro</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setType('sangria')}
                            className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-2 transition-all
                ${type === 'sangria'
                                    ? 'bg-red-50 border-red-500 text-red-700 ring-1 ring-red-500'
                                    : 'bg-white border-gray-200 text-gray-400 hover:border-red-200 hover:text-red-600'}`}
                        >
                            <ArrowDownCircle size={24} />
                            <span className="font-bold text-sm">Sangria</span>
                            <span className="text-[10px] opacity-75">Retirada de Dinheiro</span>
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-3 text-gray-400">R$</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-lg font-bold text-gray-800"
                                    placeholder="0.00"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição / Motivo</label>
                            <input
                                type="text"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                placeholder={type === 'sangria' ? "Ex: Pagamento fornecedor, Retirada p/ depósito..." : "Ex: Troco inicial, Aporte de capital..."}
                            />
                        </div>
                    </div>

                    {type === 'sangria' && (
                        <div className="bg-yellow-50 border border-yellow-100 p-3 rounded-lg flex items-start gap-2 text-xs text-yellow-800 mt-2">
                            <AlertCircle size={14} className="shrink-0 mt-0.5" />
                            <p>A sangria retirará dinheiro do saldo calculado do seu caixa. Certifique-se de ter o comprovante físico.</p>
                        </div>
                    )}

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`px-6 py-2 text-white rounded-lg font-bold shadow-sm transition-all flex items-center gap-2
                ${type === 'suprimento'
                                    ? 'bg-green-600 hover:bg-green-700 active:scale-95'
                                    : 'bg-red-600 hover:bg-red-700 active:scale-95'}
                ${isSubmitting ? 'opacity-70 cursor-wait' : ''}
              `}
                        >
                            {isSubmitting ? 'Salvando...' : `Confirmar ${type === 'sangria' ? 'Sangria' : 'Suprimento'}`}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default SangriaSuprimentoModal;
