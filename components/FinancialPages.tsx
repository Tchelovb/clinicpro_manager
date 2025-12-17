import React, { useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useData } from "../contexts/DataContext";
import { Expense } from "../types";
import {
  ArrowLeft,
  Save,
  DollarSign,
  CreditCard,
  Banknote,
  Calendar,
  FileText,
  CheckCircle,
  Printer,
  Share2,
  Download,
  AlertCircle,
} from "lucide-react";
import { jsPDF } from "jspdf";

const inputClass =
  "w-full bg-white text-gray-900 border border-gray-200 rounded-lg p-3 md:p-2.5 text-base md:text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all shadow-input h-12 md:h-10";
const labelClass =
  "block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide";

export const FinancialExpenseForm: React.FC = () => {
  const navigate = useNavigate();
  const { addExpense } = useData();
  const [formData, setFormData] = useState<Partial<Expense>>({
    category: "Fixa",
    status: "Pendente",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.description && formData.amount) {
      addExpense({
        description: formData.description,
        amount: Number(formData.amount),
        provider: formData.provider || "",
        dueDate: formData.dueDate || new Date().toISOString().split("T")[0],
        category: formData.category as any,
        status: "Pendente",
      });
      navigate("/financial");
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in pb-24 md:pb-0">
      <div className="flex items-center gap-4 mb-6 pt-4 px-4 md:px-0">
        <button
          onClick={() => navigate("/financial")}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-500 dark:text-gray-400 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          Nova Despesa
        </h1>
      </div>
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-xl shadow-card border border-gray-200 dark:border-slate-700 space-y-6 mx-4 md:mx-0"
      >
        <div>
          <label className={labelClass}>Descrição</label>
          <input
            className={inputClass}
            required
            value={formData.description || ""}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Ex: Conta de Luz"
          />
        </div>
        <div>
          <label className={labelClass}>Fornecedor</label>
          <input
            className={inputClass}
            value={formData.provider || ""}
            onChange={(e) =>
              setFormData({ ...formData, provider: e.target.value })
            }
            placeholder="Ex: Enel"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Valor (R$)</label>
            <input
              type="number"
              step="0.01"
              className={inputClass}
              required
              value={formData.amount || ""}
              onChange={(e) =>
                setFormData({ ...formData, amount: Number(e.target.value) })
              }
            />
          </div>
          <div>
            <label className={labelClass}>Vencimento</label>
            <input
              type="date"
              className={inputClass}
              required
              value={formData.dueDate || ""}
              onChange={(e) =>
                setFormData({ ...formData, dueDate: e.target.value })
              }
            />
          </div>
        </div>
        <div>
          <label className={labelClass}>Categoria</label>
          <select
            className={inputClass}
            value={formData.category}
            onChange={(e) =>
              setFormData({ ...formData, category: e.target.value as any })
            }
          >
            <option value="Fixa">Despesa Fixa</option>
            <option value="Variável">Despesa Variável</option>
            <option value="Laboratório">Laboratório</option>
            <option value="Pessoal">Pessoal / Pró-labore</option>
            <option value="Impostos">Impostos</option>
          </select>
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex pt-6 justify-end gap-3 border-t border-gray-100 dark:border-slate-700">
          <button
            type="button"
            onClick={() => navigate("/financial")}
            className="px-6 py-2.5 border border-gray-300 bg-white rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 font-medium shadow-sm transition-colors"
          >
            <DollarSign size={18} /> Lançar Despesa
          </button>
        </div>
      </form>

      {/* Mobile Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50 md:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] safe-bottom">
        <button
          onClick={handleSubmit}
          className="w-full bg-red-600 text-white py-3 rounded-xl font-bold shadow-md flex justify-center items-center gap-2 active:scale-95 transition-transform text-base"
        >
          <DollarSign size={20} /> Lançar Despesa
        </button>
      </div>
    </div>
  );
};

export const PaymentReceivePage: React.FC = () => {
  // ... (Receipt Logic remains same)
  const { installmentId } = useParams<{ installmentId: string }>();
  const navigate = useNavigate();
  const { patients, receivePayment, clinicConfig } = useData();
  const [step, setStep] = useState<"form" | "receipt">("form");
  const patient = patients.find((p) =>
    p.financials?.some((f) => f.id === installmentId)
  );
  const installment = patient?.financials?.find((f) => f.id === installmentId);
  const [amount, setAmount] = useState<string>(
    installment
      ? (installment.amount - (installment.amountPaid || 0)).toString()
      : ""
  );
  const [method, setMethod] = useState(installment?.paymentMethod || "Pix");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");

  if (!patient || !installment)
    return <div className="p-8">Parcela não encontrada.</div>;
  const remaining = installment.amount - (installment.amountPaid || 0);
  const amountNum = parseFloat(amount);
  const isValid = amountNum > 0 && amountNum <= remaining;

  const handleConfirm = async () => {
    if (!isValid) return;
    await receivePayment(
      patient.id,
      installment.id,
      amountNum,
      method,
      date,
      notes
    );
    setStep("receipt");
  };

  if (step === "receipt") {
    return (
      <div className="max-w-lg mx-auto py-8 animate-in zoom-in-95 duration-300 px-4">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden text-center">
          <div className="bg-green-500 p-6 flex flex-col items-center justify-center text-white">
            <div className="bg-white/20 p-4 rounded-full mb-3">
              <CheckCircle size={48} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold">Pagamento Confirmado!</h2>
          </div>
          <div className="p-8">
            <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100">
              <p className="text-sm text-gray-500 uppercase font-bold mb-1">
                Valor Recebido
              </p>
              <p className="text-3xl font-bold text-gray-800">
                R${" "}
                {amountNum.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
            <button
              onClick={() => navigate(`/patients/${patient.id}`)}
              className="w-full py-3 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-colors"
            >
              Voltar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-6 animate-in fade-in pb-24 md:pb-0">
      <div className="flex items-center gap-4 mb-6 px-4 md:px-0">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-500 dark:text-gray-400 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          Recebimento
        </h1>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-xl border border-gray-200 dark:border-slate-700 shadow-card mx-4 md:mx-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleConfirm();
          }}
          className="space-y-6"
        >
          <div>
            <label className={labelClass}>Valor a Receber (R$)</label>
            <input
              type="number"
              step="0.01"
              autoFocus
              className={`${inputClass} text-xl font-bold py-3`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Forma</label>
              <select
                className={inputClass}
                value={method}
                onChange={(e) => setMethod(e.target.value)}
              >
                <option value="Pix">Pix</option>
                <option value="Dinheiro">Dinheiro</option>
                <option value="Cartão">Cartão</option>
                <option value="Boleto">Boleto</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Data</label>
              <input
                type="date"
                className={inputClass}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Observações</label>
            <textarea
              className={`${inputClass} h-24 resize-none`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Desktop Button */}
          <button
            type="submit"
            disabled={!isValid}
            className="hidden md:flex w-full py-3 bg-green-600 text-white rounded-xl font-bold shadow-lg shadow-green-200 hover:bg-green-700 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95 items-center justify-center gap-2"
          >
            <CheckCircle size={20} /> Confirmar
          </button>
        </form>
      </div>

      {/* Mobile Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50 md:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] safe-bottom">
        <button
          onClick={handleConfirm}
          disabled={!isValid}
          className="w-full bg-green-600 text-white py-3 rounded-xl font-bold shadow-md flex justify-center items-center gap-2 active:scale-95 transition-transform text-base disabled:opacity-50"
        >
          <CheckCircle size={20} /> Confirmar
        </button>
      </div>
    </div>
  );
};

export const ExpensePayPage: React.FC = () => {
  // ... same structure for Pay Page ...
  const { expenseId } = useParams<{ expenseId: string }>();
  const navigate = useNavigate();
  const { expenses, payExpense, clinicConfig } = useData();
  const expense = expenses.find((e) => e.id === expenseId);
  const [amount, setAmount] = useState<string>(
    expense ? (expense.amount - (expense.amountPaid || 0)).toString() : ""
  );
  const [method, setMethod] = useState(expense?.paymentMethod || "Pix");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");

  if (!expense) return <div>Erro</div>;
  const remaining = expense.amount - (expense.amountPaid || 0);
  const amountNum = parseFloat(amount);

  const handlePay = () => {
    payExpense(expense.id, amountNum, method, date, notes);
    navigate("/financial");
  };

  return (
    <div className="max-w-2xl mx-auto py-6 animate-in fade-in pb-24 md:pb-0">
      <div className="flex items-center gap-4 mb-6 px-4 md:px-0">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-500 dark:text-gray-400 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          Pagar Despesa
        </h1>
      </div>
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700 shadow-card mx-4 md:mx-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handlePay();
          }}
          className="space-y-6"
        >
          <div>
            <label className={labelClass}>Valor</label>
            <input
              type="number"
              className={inputClass}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Método</label>
            <select
              className={inputClass}
              value={method}
              onChange={(e) => setMethod(e.target.value)}
            >
              <option>Pix</option>
              <option>Boleto</option>
            </select>
          </div>
          <button
            type="submit"
            className="hidden md:block w-full py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700"
          >
            Confirmar Pagamento
          </button>
        </form>
      </div>

      {/* Mobile Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50 md:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] safe-bottom">
        <button
          onClick={handlePay}
          className="w-full bg-red-600 text-white py-3 rounded-xl font-bold shadow-md flex justify-center items-center gap-2 active:scale-95 transition-transform text-base"
        >
          Confirmar Pagamento
        </button>
      </div>
    </div>
  );
};
