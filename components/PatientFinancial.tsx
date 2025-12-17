import React from "react";
import { useNavigate } from "react-router-dom";
import { useData } from "../contexts/DataContext";
import { Patient } from "../types";
import {
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock,
  Calendar,
  CreditCard,
  Tag,
} from "lucide-react";

interface PatientFinancialProps {
  patient: Patient;
}

const PatientFinancial: React.FC<PatientFinancialProps> = ({ patient }) => {
  const navigate = useNavigate();
  const financials = patient.financials || [];

  // Summary Calculations
  const totalContracted = patient.total_approved || 0;
  const totalPaid = patient.total_paid || 0;
  const balanceDue = patient.balance_due || 0;

  // Progress bar calculation
  const progressPercent =
    totalContracted > 0
      ? Math.min(100, (totalPaid / totalContracted) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* FINANCIAL HEADER */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden transition-colors">
        <div className="absolute top-0 left-0 w-1 h-full bg-blue-600"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold mb-1">
              Total Contratado
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              R$ {totalContracted.toLocaleString("pt-BR")}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold mb-1">
              Total Pago
            </p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              R$ {totalPaid.toLocaleString("pt-BR")}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold mb-1">
              Saldo Devedor
            </p>
            <p className="text-2xl font-bold text-red-500 dark:text-red-400">
              R$ {balanceDue.toLocaleString("pt-BR")}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
            <span>Progresso do Pagamento</span>
            <span>{progressPercent.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* INSTALLMENTS LIST */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden transition-colors">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 flex justify-between items-center">
          <h3 className="font-bold text-gray-800 dark:text-white">
            Parcelas e Recebimentos
          </h3>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 font-medium">Vencimento</th>
                <th className="px-6 py-3 font-medium">Descrição</th>
                <th className="px-6 py-3 font-medium">Forma</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-right">Valor</th>
                <th className="px-6 py-3 font-medium text-right">Pago</th>
                <th className="px-6 py-3 font-medium text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {financials.map((item) => (
                <tr
                  key={item.id}
                  className="group hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <td className="px-6 py-4 font-mono text-gray-600 dark:text-gray-400">
                    {item.dueDate}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-gray-900 dark:text-white block">
                      {item.description}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                    {item.paymentMethod}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase border
                                      ${
                                        item.status === "Pago"
                                          ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800"
                                          : item.status === "Pago Parcial"
                                          ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800"
                                          : "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800"
                                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-gray-900 dark:text-white">
                    R$ {item.amount.toLocaleString("pt-BR")}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-500 dark:text-gray-400">
                    R$ {(item.amountPaid || 0).toLocaleString("pt-BR")}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {item.status !== "Pago" && (
                      <button
                        onClick={() =>
                          navigate(`/financial/receive/${item.id}`)
                        }
                        className="text-green-600 dark:text-green-400 hover:text-green-700 font-medium text-xs border border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/30 px-3 py-1.5 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors"
                      >
                        Receber
                      </button>
                    )}
                    {item.status === "Pago" && (
                      <span className="text-gray-400 dark:text-gray-500 text-xs flex items-center justify-end gap-1">
                        <CheckCircle size={12} /> Pago
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-700">
          {financials.map((item) => (
            <div
              key={item.id}
              className="p-4 flex flex-col gap-3 relative border-l-4 border-transparent hover:border-l-blue-500 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-gray-900 dark:text-white text-sm">
                    {item.description}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} /> {item.dueDate}
                    </span>
                    <span className="flex items-center gap-1">
                      <CreditCard size={12} /> {item.paymentMethod}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900 dark:text-white">
                    R$ {item.amount.toLocaleString("pt-BR")}
                  </p>
                  {(item.amountPaid || 0) > 0 && (
                    <p className="text-xs text-green-600 dark:text-green-400">
                      Pago: R$ {(item.amountPaid || 0).toLocaleString("pt-BR")}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center pt-1">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border
                              ${
                                item.status === "Pago"
                                  ? "bg-green-50 text-green-700 border-green-100 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800"
                                  : item.status === "Pago Parcial"
                                  ? "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800"
                                  : "bg-red-50 text-red-700 border-red-100 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800"
                              }`}
                >
                  {item.status}
                </span>

                {item.status !== "Pago" && (
                  <button
                    onClick={() => navigate(`/financial/receive/${item.id}`)}
                    className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-sm hover:bg-green-700 active:scale-95 transition-transform flex items-center gap-1"
                  >
                    <DollarSign size={12} /> Receber
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {financials.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Tag className="text-gray-300 dark:text-gray-600 mb-2" size={32} />
            <p className="text-gray-500 dark:text-gray-400">
              Nenhum registro financeiro.
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Aprove um orçamento para gerar o financeiro.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientFinancial;
