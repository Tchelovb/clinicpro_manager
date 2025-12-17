import React, { useState } from "react";
import {
  Calculator,
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import {
  useOpenCashRegisters,
  useCashRegisterActions,
} from "../hooks/useCashRegister";

export const CashRegisterList: React.FC = () => {
  const { registers, loading, error, refetch } = useOpenCashRegisters();
  const { closeRegister } = useCashRegisterActions();
  const [closingRegister, setClosingRegister] = useState<string | null>(null);
  const [closingBalance, setClosingBalance] = useState("");
  const [observations, setObservations] = useState("");

  const handleCloseRegister = async (registerId: string) => {
    const balance = parseFloat(closingBalance);
    if (isNaN(balance) || balance < 0) {
      alert("Valor inválido para o saldo final");
      return;
    }

    try {
      await closeRegister(registerId, balance, observations);
      setClosingRegister(null);
      setClosingBalance("");
      setObservations("");
      refetch();
    } catch (error: any) {
      alert("Erro ao fechar caixa: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <span className="text-red-800 dark:text-red-200">
            Erro ao carregar caixas: {error}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
          Caixas Abertos
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {registers.length} caixa{registers.length !== 1 ? "s" : ""} aberto
          {registers.length !== 1 ? "s" : ""}
        </span>
      </div>

      {registers.length === 0 ? (
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
          <Calculator className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Nenhum caixa aberto
          </h4>
          <p className="text-gray-500 dark:text-gray-400">
            Abra um caixa para começar a registrar recebimentos.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {registers.map((register) => (
            <div
              key={register.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Calculator className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 dark:text-white">
                      Caixa #{register.id.slice(-8)}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Aberto em{" "}
                      {new Date(register.opened_at).toLocaleString("pt-BR")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-full text-xs">
                    <CheckCircle className="w-3 h-3" />
                    Aberto
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                    Responsável
                  </p>
                  <p className="font-medium text-gray-800 dark:text-white">
                    {register.responsible_name}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                    Saldo Inicial
                  </p>
                  <p className="font-medium text-gray-800 dark:text-white">
                    R${" "}
                    {register.opening_balance.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                    Saldo Calculado
                  </p>
                  <p className="font-medium text-gray-800 dark:text-white">
                    R${" "}
                    {register.calculated_balance.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                    Transações
                  </p>
                  <p className="font-medium text-gray-800 dark:text-white">
                    {register.transactions.length}
                  </p>
                </div>
              </div>

              {closingRegister === register.id ? (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-4">
                  <h5 className="font-medium text-gray-800 dark:text-white">
                    Fechar Caixa
                  </h5>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Saldo Final (R$)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={closingBalance}
                        onChange={(e) => setClosingBalance(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        placeholder="0,00"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Observações
                      </label>
                      <input
                        type="text"
                        value={observations}
                        onChange={(e) => setObservations(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        placeholder="Diferenças encontradas..."
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setClosingRegister(null)}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => handleCloseRegister(register.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Confirmar Fechamento
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-end">
                  <button
                    onClick={() => setClosingRegister(register.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    Fechar Caixa
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
