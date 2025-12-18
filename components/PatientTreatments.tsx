import React from "react";
import { useNavigate } from "react-router-dom";
import { useData } from "../contexts/DataContext";
import { Patient } from "../types";
import {
  Play,
  CheckCircle,
  Clock,
  FileText,
  Activity,
  AlertCircle,
} from "lucide-react";

interface PatientTreatmentsProps {
  patient: Patient;
}

const PatientTreatments: React.FC<PatientTreatmentsProps> = ({ patient }) => {
  const { startTreatment, concludeTreatment, refreshPatientData } = useData();
  const navigate = useNavigate();
  const [loadingTreatment, setLoadingTreatment] = React.useState<string | null>(
    null
  );
  const [feedback, setFeedback] = React.useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const treatments = patient.treatments || [];
  const notStartedTreatments = treatments.filter(
    (t) => t.status === "Não Iniciado"
  ).length;
  const inProgressTreatments = treatments.filter(
    (t) => t.status === "Em Andamento"
  ).length;
  const completedTreatments = treatments.filter(
    (t) => t.status === "Concluído"
  ).length;

  // Helper function to show feedback
  const showFeedback = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3000); // Clear after 3 seconds
  };

  // Enhanced start treatment with feedback
  const handleStartTreatment = async (treatmentId: string) => {
    setLoadingTreatment(treatmentId);
    try {
      await startTreatment(patient.id, treatmentId);
      await refreshPatientData(patient.id); // Ensure data consistency
      showFeedback(
        "success",
        `Tratamento "${treatments.find((t) => t.id === treatmentId)?.procedure
        }" iniciado com sucesso!`
      );
    } catch (error: any) {
      showFeedback("error", `Erro ao iniciar tratamento: ${error.message}`);
    } finally {
      setLoadingTreatment(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* FEEDBACK ALERT */}
      {feedback && (
        <div
          className={`p-4 rounded-lg border ${feedback.type === "success"
            ? "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300"
            : "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300"
            }`}
        >
          <div className="flex items-center gap-2">
            <div
              className={`p-1 rounded-full ${feedback.type === "success"
                ? "bg-green-100 dark:bg-green-900/30"
                : "bg-red-100 dark:bg-red-900/30"
                }`}
            >
              {feedback.type === "success" ? (
                <CheckCircle
                  size={16}
                  className={
                    feedback.type === "success"
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }
                />
              ) : (
                <AlertCircle
                  size={16}
                  className={
                    feedback.type === "success"
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }
                />
              )}
            </div>
            <span className="font-medium">{feedback.message}</span>
          </div>
        </div>
      )}

      {/* TREATMENT HEADER */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-gray-50 dark:bg-gray-900/30 rounded-lg text-gray-600 dark:text-gray-400">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">
              Não Iniciado
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {notStartedTreatments}
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">
              Em Andamento
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {inProgressTreatments}
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">
              Concluídos
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {completedTreatments}
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
            <FileText size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">
              Total Geral
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {treatments.length}
            </p>
          </div>
        </div>
      </div>

      {/* TREATMENT LIST (CORE) */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
          <h3 className="font-bold text-gray-800 dark:text-white">
            Plano de Tratamento
          </h3>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Procedimento</th>
                <th className="px-6 py-3 font-medium">Região</th>
                <th className="px-6 py-3 font-medium">Origem</th>
                <th className="px-6 py-3 font-medium text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {treatments.map((treatment) => (
                <tr
                  key={treatment.id}
                  className="group hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <span
                      className={`flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-bold w-fit border
                                    ${treatment.status === "Concluído"
                          ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800"
                          : treatment.status === "Em Andamento"
                            ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800"
                            : "bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
                        }`}
                    >
                      {treatment.status === "Concluído" ? (
                        <CheckCircle size={12} />
                      ) : treatment.status === "Em Andamento" ? (
                        <Activity size={12} />
                      ) : (
                        <Clock size={12} />
                      )}
                      {treatment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-gray-900 dark:text-white block">
                      {treatment.procedure}
                    </span>
                    <span className="text-xs text-gray-400">
                      {treatment.doctorName || "Profissional não informado"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400 font-mono text-xs">
                    {treatment.region}
                  </td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-xs">
                    Orc #{treatment.budgetId.toUpperCase()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {treatment.status === "Não Iniciado" && (
                      <button
                        onClick={async () => {
                          setLoadingTreatment(treatment.id);
                          try {
                            await startTreatment(patient.id, treatment.id);
                          } finally {
                            setLoadingTreatment(null);
                          }
                        }}
                        disabled={loadingTreatment === treatment.id}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 font-medium text-xs border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors flex items-center gap-1 ml-auto disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loadingTreatment === treatment.id ? (
                          <div className="animate-spin rounded-full h-3 w-3 border border-blue-600 border-t-transparent" />
                        ) : (
                          <Play size={12} fill="currentColor" />
                        )}
                        {loadingTreatment === treatment.id
                          ? "Iniciando..."
                          : "Iniciar"}
                      </button>
                    )}
                    {treatment.status === "Em Andamento" && (
                      <button
                        onClick={() =>
                          navigate(
                            `/patients/${patient.id}/treatments/${treatment.id}/conclude`
                          )
                        }
                        className="text-green-600 dark:text-green-400 hover:text-green-700 font-medium text-xs border border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/30 px-3 py-1.5 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors flex items-center gap-1 ml-auto"
                      >
                        <CheckCircle size={12} /> Concluir
                      </button>
                    )}
                    {treatment.status === "Concluído" && (
                      <span className="text-xs text-gray-400 italic">
                        Realizado em {treatment.executionDate}
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
          {treatments.map((treatment) => (
            <div
              key={treatment.id}
              className="p-4 flex flex-col gap-3 relative"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white text-sm leading-tight pr-4">
                    {treatment.procedure}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
                    <span className="bg-gray-100 dark:bg-gray-700 px-1.5 rounded">
                      {treatment.region}
                    </span>
                    <span>• Orc #{treatment.budgetId}</span>
                  </p>
                </div>
                <div
                  className={`p-1.5 rounded-full 
                             ${treatment.status === "Concluído"
                      ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                      : treatment.status === "Em Andamento"
                        ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                        : "bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-300"
                    }`}
                >
                  {treatment.status === "Concluído" ? (
                    <CheckCircle size={16} />
                  ) : treatment.status === "Em Andamento" ? (
                    <Activity size={16} />
                  ) : (
                    <Clock size={16} />
                  )}
                </div>
              </div>

              {treatment.status === "Não Iniciado" && (
                <button
                  onClick={async () => {
                    setLoadingTreatment(treatment.id);
                    try {
                      await startTreatment(patient.id, treatment.id);
                    } finally {
                      setLoadingTreatment(null);
                    }
                  }}
                  disabled={loadingTreatment === treatment.id}
                  className="w-full py-2.5 bg-blue-600 text-white font-medium text-sm rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingTreatment === treatment.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border border-white border-t-transparent" />
                  ) : (
                    <Play size={16} fill="currentColor" />
                  )}
                  {loadingTreatment === treatment.id
                    ? "Iniciando..."
                    : "Iniciar Tratamento"}
                </button>
              )}
              {treatment.status === "Em Andamento" && (
                <button
                  onClick={() =>
                    navigate(
                      `/patients/${patient.id}/treatments/${treatment.id}/conclude`
                    )
                  }
                  className="w-full py-2.5 bg-green-600 text-white font-medium text-sm rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 shadow-sm"
                >
                  <CheckCircle size={16} /> Concluir e Evoluir
                </button>
              )}
              {treatment.status === "Concluído" && (
                <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded text-xs text-gray-500 dark:text-gray-300 flex items-center justify-center gap-2">
                  <CheckCircle size={12} /> Concluído em{" "}
                  {treatment.executionDate}
                </div>
              )}
            </div>
          ))}
        </div>

        {treatments.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle
              className="text-gray-300 dark:text-gray-600 mb-2"
              size={32}
            />
            <p className="text-gray-500 dark:text-gray-400">
              Nenhum tratamento ativo.
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Aprove um orçamento para gerar o plano de tratamento.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientTreatments;
