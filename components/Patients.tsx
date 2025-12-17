import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useData } from "../contexts/DataContext";
import {
  Search,
  Filter,
  MoreVertical,
  FileText,
  User,
  XCircle,
  Phone,
  Calendar,
} from "lucide-react";

const Patients: React.FC = () => {
  const navigate = useNavigate();
  const { patients } = useData();
  const [searchTerm, setSearchTerm] = useState("");

  const normalizeText = (text: string | undefined) => {
    return (text || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  };

  const filteredPatients = (patients || []).filter((patient) => {
    if (!patient || !searchTerm) return !searchTerm;

    const searchLower = normalizeText(searchTerm);
    const searchDigits = searchTerm.replace(/\D/g, "");

    const matchText =
      normalizeText(patient.name).includes(searchLower) ||
      normalizeText(patient.email).includes(searchLower) ||
      normalizeText(patient.address).includes(searchLower);

    const patientPhone = patient.phone || "";
    const patientCpf = patient.cpf || "";
    const patientPhoneDigits = patientPhone.replace(/\D/g, "");
    const patientCpfDigits = patientCpf.replace(/\D/g, "");

    const matchNumeric =
      searchDigits.length > 0 &&
      (patientPhoneDigits.includes(searchDigits) ||
        patientCpfDigits.includes(searchDigits) ||
        patientPhone.includes(searchTerm) ||
        patientCpf.includes(searchTerm));

    return matchText || matchNumeric;
  });

  return (
    <div className="space-y-6">
      {/* STICKY HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sticky top-0 z-10 bg-gray-50/95 dark:bg-slate-900/95 backdrop-blur-sm py-4 -mx-4 px-4 md:-mt-8 md:-mx-8 md:px-8 md:pt-8 border-b border-gray-200/50 dark:border-slate-800/50 transition-colors">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Pacientes
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {filteredPatients.length} pacientes encontrados
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nome, CPF ou Telefone..."
              className="w-full pl-10 pr-10 py-2 bg-white text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm shadow-input"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <XCircle
                  size={16}
                  fill="currentColor"
                  className="text-gray-300"
                />
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button className="flex-1 sm:flex-none justify-center p-2 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-300 bg-white dark:bg-slate-800 shadow-sm flex items-center transition-colors">
              <Filter size={18} />
            </button>
            <button
              onClick={() => navigate("/patients/new")}
              className="flex-1 sm:flex-none justify-center bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap shadow-sm transition-colors"
            >
              + Novo
            </button>
          </div>
        </div>
      </div>

      {/* --- DESKTOP TABLE VIEW --- */}
      <div className="hidden md:block bg-white dark:bg-slate-800 rounded-xl shadow-card border border-gray-100 dark:border-slate-700 overflow-hidden transition-colors">
        {filteredPatients.length > 0 ? (
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 dark:bg-slate-900 border-b border-gray-100 dark:border-slate-700">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[40%]">
                  Paciente
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[25%]">
                  Contato
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Última Visita
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
              {filteredPatients.map((patient) => (
                <tr
                  key={patient.id}
                  className="hover:bg-primary-50/50 dark:hover:bg-slate-700/50 transition-colors group cursor-pointer"
                  onClick={() => navigate(`/patients/${patient.id}`)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold border-2 border-white dark:border-slate-700 shadow-sm shrink-0">
                        {patient.name?.charAt(0) || "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {patient.name || "Nome não informado"}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                          {patient.cpf || ""}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {patient.phone || ""}
                    </p>
                    <p className="text-xs text-gray-400 truncate max-w-[200px]">
                      {patient.email || ""}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium border whitespace-nowrap
                                    ${
                                      patient.status === "Finalizado"
                                        ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-100 dark:border-green-800"
                                        : patient.status === "Em Tratamento"
                                        ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-800"
                                        : patient.status === "Manutenção"
                                        ? "bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-100 dark:border-yellow-800"
                                        : patient.status === "Em Orçamento"
                                        ? "bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-100 dark:border-purple-800"
                                        : "bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-600"
                                    }`}
                    >
                      {patient.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                    {patient.lastVisit || ""}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        className="p-1.5 hover:bg-gray-200 dark:hover:bg-slate-700 rounded text-gray-500 dark:text-gray-400"
                        title="Prontuário"
                      >
                        <FileText size={16} />
                      </button>
                      <button
                        className="p-1.5 hover:bg-gray-200 dark:hover:bg-slate-700 rounded text-gray-500 dark:text-gray-400"
                        title="Detalhes"
                      >
                        <User size={16} />
                      </button>
                      <button className="p-1.5 hover:bg-gray-200 dark:hover:bg-slate-700 rounded text-gray-500 dark:text-gray-400">
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Search
              size={32}
              className="text-gray-300 dark:text-gray-600 mb-3"
            />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Nenhum paciente encontrado
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Tente buscar por nome, CPF ou telefone.
            </p>
          </div>
        )}
      </div>

      {/* --- MOBILE CARD VIEW --- */}
      <div className="md:hidden space-y-3 pb-4">
        {filteredPatients.length > 0 ? (
          filteredPatients.map((patient) => (
            <div
              key={patient.id}
              className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm active:scale-[0.99] transition-all"
              onClick={() => navigate(`/patients/${patient.id}`)}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-lg border border-primary-200 dark:border-primary-800">
                    {patient.name?.charAt(0) || "?"}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">
                      {patient.name || "Nome não informado"}
                    </h3>
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase mt-1
                                      ${
                                        patient.status === "Em Tratamento"
                                          ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                                          : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300"
                                      }`}
                    >
                      {patient.status}
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <Phone
                    size={14}
                    className="text-gray-400 dark:text-gray-500"
                  />
                  <span className="truncate">{patient.phone || ""}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar
                    size={14}
                    className="text-gray-400 dark:text-gray-500"
                  />
                  <span>{patient.lastVisit || ""}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-10">
            <p className="text-gray-500 dark:text-gray-400">
              Nenhum paciente encontrado.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Patients;
