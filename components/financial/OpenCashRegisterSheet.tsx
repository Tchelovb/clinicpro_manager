import React, { useState } from 'react';
import { FinancialActionHandler } from './FinancialActionHandler';
import { useCashRegisterActions } from '../../hooks/useCashRegister';
import { DollarSign, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import { useHaptic } from '../../utils/haptics';

interface OpenCashRegisterSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

/**
 * OpenCashRegisterSheet
 * 
 * Modal/Drawer para abertura de caixa
 * Exige apenas o valor do fundo de reserva
 * 
 * Desktop: Dialog centralizado
 * Mobile: Drawer de baixo (90vh)
 */
export const OpenCashRegisterSheet: React.FC<OpenCashRegisterSheetProps> = ({
    open,
    onOpenChange,
    onSuccess
}) => {
    const { openRegister, loading } = useCashRegisterActions();
    const haptic = useHaptic();

    const [openingBalance, setOpeningBalance] = useState<string>('100.00');

    const handleConfirm = async () => {
        const balance = parseFloat(openingBalance);

        // Validações
        if (isNaN(balance) || balance < 0) {
            toast.error('Valor inválido');
            haptic.error();
            return;
        }

        try {
            await openRegister(balance);

            haptic.success(); // Tock de confirmação
            toast.success(`✅ Caixa aberto com R$ ${balance.toFixed(2)}`);

            onSuccess();
            onOpenChange(false);

            // Limpar campo
            setOpeningBalance('100.00');
        } catch (error: any) {
            haptic.error();
            toast.error(`Erro: ${error.message}`);
        }
    };

    return (
        <FinancialActionHandler
            open={open}
            onOpenChange={onOpenChange}
            title="🟢 Abrir Caixa"
            description="Informe o valor do fundo de reserva para iniciar o expediente"
            maxWidth="md"
        >
            <div className="space-y-6">
                {/* Ícone de Destaque */}
                <div className="flex justify-center">
                    <div className="p-6 bg-emerald-100 dark:bg-emerald-900/20 rounded-full">
                        <Wallet className="text-emerald-600 dark:text-emerald-400" size={48} />
                    </div>
                </div>

                {/* Campo de Valor */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Fundo de Reserva (Troco) *
                    </label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">
                            R$
                        </span>
                        <input
                            type="number"
                            value={openingBalance}
                            onChange={(e) => setOpeningBalance(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-800 dark:text-white text-2xl font-bold text-center"
                            step="0.01"
                            placeholder="0,00"
                            autoFocus
                        />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        💵 Valor recomendado: R$ 100,00 a R$ 200,00
                    </p>
                </div>

                {/* Informações */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                        <strong>ℹ️ Importante:</strong> Este valor será usado como saldo inicial do caixa.
                        Certifique-se de que corresponde ao dinheiro físico disponível para troco.
                    </p>
                </div>

                {/* Botões */}
                <div className="flex gap-3 pt-4 border-t">
                    <button
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                        className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={loading}
                        className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                    >
                        {loading ? (
                            <>Abrindo...</>
                        ) : (
                            <>
                                <DollarSign size={20} />
                                Abrir Caixa
                            </>
                        )}
                    </button>
                </div>
            </div>
        </FinancialActionHandler>
    );
};

export default OpenCashRegisterSheet;
