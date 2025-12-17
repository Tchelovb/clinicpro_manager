import React, { useState } from "react";
import { Calculator, AlertCircle, DollarSign } from "lucide-react";
import {
  useOpenCashRegisters,
  useCashRegisterActions,
} from "../hooks/useCashRegister";

interface QuickCashOpenerProps {
  onCashOpened: () => void;
  triggerText?: string;
  className?: string;
}

export const QuickCashOpener: React.FC<QuickCashOpenerProps> = ({
  onCashOpened,
  triggerText = "Abrir Caixa Rápido",
  className = "",
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openingBalance, setOpeningBalance] = useState("0");
  const { registers } = useOpenCashRegisters();
  const { openRegister, loading } = useCashRegisterActions();

  // Se já existe caixa aberto, não mostra o componente
  if (registers.length > 0) {
    return null;
  }

  const handleOpenCash = async () => {
    const balance = parseFloat(openingBalance) || 0;

    try {
      await openRegister(balance);
      setIsModalOpen(false);
      setOpeningBalance("0");
      onCashOpened();
    } catch (error: any) {
      alert("Erro ao abrir caixa: " + error.message);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition-colors ${className}`}
      >
        <Calculator className="w-4 h-4" />
        {triggerText}
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                    Abrir Caixa
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Necessário para registrar recebimentos
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Saldo Inicial (R$)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="number"
                      step="0.01"
                      value={openingBalance}
                      onChange={(e) => setOpeningBalance(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="0,00"
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Deixe 0,00 se não há dinheiro inicial
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleOpenCash}
                    disabled={loading}
                    className="flex-1 py-3 px-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border border-white border-t-transparent" />
                    ) : (
                      <Calculator className="w-4 h-4" />
                    )}
                    {loading ? "Abrindo..." : "Abrir Caixa"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
