import React, { useState, useEffect } from "react";
import {
  X,
  DollarSign,
  CreditCard,
  Calendar,
  FileText,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import {
  useOpenCashRegisters,
  useRegisterPayment,
} from "../hooks/useCashRegister";
import { CashRegisterModal } from "./CashRegisterModal";

interface PaymentReceiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  installment: {
    id: string;
    description: string;
    amount: number;
    amountPaid: number;
    dueDate: string;
    paymentMethod: string;
  } | null;
  onSuccess: () => void;
}

export const PaymentReceiveModal: React.FC<PaymentReceiveModalProps> = ({
  isOpen,
  onClose,
  installment,
  onSuccess,
}) => {
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Pix");
  const [notes, setNotes] = useState("");
  const [showCashModal, setShowCashModal] = useState(false);

  const {
    registers,
    loading: loadingRegisters,
    refetch: refetchRegisters,
  } = useOpenCashRegisters();
  const { registerPayment, loading: loadingPayment } = useRegisterPayment();

  const selectedCashRegister = registers.length > 0 ? registers[0] : null;
  const remainingAmount = installment
    ? installment.amount - installment.amountPaid
    : 0;

  useEffect(() => {
    if (installment) {
      setAmount(remainingAmount.toString());
    }
  }, [installment, remainingAmount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!installment) return;

    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      alert("Valor inválido");
      return;
    }

    if (!selectedCashRegister) {
      alert("Nenhum caixa aberto encontrado. Abra um caixa primeiro.");
      return;
    }

    try {
      await registerPayment({
        installmentId: installment.id,
        amount: paymentAmount,
        paymentMethod,
        cashRegisterId: selectedCashRegister.id,
        notes,
      });

      onSuccess();
      onClose();
      setNotes("");
    } catch (error: any) {
      alert("Erro ao registrar pagamento: " + error.message);
    }
  };

  const handleOpenCash = () => {
    setShowCashModal(true);
  };

  const handleCashOpened = () => {
    setShowCashModal(false);
    refetchRegisters();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                Receber Pagamento
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {installment && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  {installment.description}
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700 dark:text-blue-300">
                      Valor Total:
                    </span>
                    <span className="font-semibold ml-2">
                      R${" "}
                      {installment.amount.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-700 dark:text-blue-300">
                      Já Pago:
                    </span>
                    <span className="font-semibold ml-2">
                      R${" "}
                      {installment.amountPaid.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-700 dark:text-blue-300">
                      Vencimento:
                    </span>
                    <span className="font-semibold ml-2">
                      {installment.dueDate}
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-700 dark:text-blue-300">
                      Restante:
                    </span>
                    <span className="font-semibold ml-2 text-red-600">
                      R${" "}
                      {remainingAmount.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Status do Caixa */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-800 dark:text-white">
                  Caixa
                </h4>
                {loadingRegisters ? (
                  <div className="animate-spin rounded-full h-4 w-4 border border-gray-600 border-t-transparent" />
                ) : selectedCashRegister ? (
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm">Aberto</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">Fechado</span>
                  </div>
                )}
              </div>

              {selectedCashRegister ? (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded p-3">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    Responsável: {selectedCashRegister.responsible_name}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    Saldo atual: R${" "}
                    {selectedCashRegister.calculated_balance.toLocaleString(
                      "pt-BR",
                      { minimumFractionDigits: 2 }
                    )}
                  </p>
                </div>
              ) : (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3">
                  <p className="text-sm text-red-800 dark:text-red-200 mb-3">
                    Nenhum caixa aberto na clínica.
                  </p>
                  <button
                    type="button"
                    onClick={handleOpenCash}
                    className="w-full py-2 px-4 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Abrir Caixa Agora
                  </button>
                </div>
              )}
            </div>

            {/* Formulário */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Valor a Receber (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="0,00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Forma de Pagamento
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="Pix">Pix</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Cartão">Cartão de Crédito/Débito</option>
                  <option value="Boleto">Boleto</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Observações
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                  rows={3}
                  placeholder="Observações sobre o pagamento..."
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loadingPayment || !selectedCashRegister}
                className="flex-1 py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {loadingPayment ? (
                  <div className="animate-spin rounded-full h-4 w-4 border border-white border-t-transparent" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                {loadingPayment ? "Registrando..." : "Confirmar Recebimento"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal para abrir caixa */}
      <CashRegisterModal
        isOpen={showCashModal}
        onClose={() => setShowCashModal(false)}
        onSuccess={handleCashOpened}
      />
    </>
  );
};
