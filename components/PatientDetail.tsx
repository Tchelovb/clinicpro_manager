import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useData } from "../contexts/DataContext";
import { supabase } from "../lib/supabase";
import { formatPhoneNumber } from "../utils/utils";
import PatientTreatments from "./PatientTreatments";
import PatientFinancial from "./PatientFinancial";
import {
  User,
  Calendar,
  Phone,
  MapPin,
  FileText,
  DollarSign,
  Activity,
  ArrowLeft,
  Plus,
  Edit2,
  Shield,
  Save,
  MoreVertical,
  File,
  AlertCircle,
  Trash2,
  Edit,
} from "lucide-react";

const PatientDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { patients, updatePatient, approveBudget, deleteBudget, documents } =
    useData();

  const patient = patients.find((p) => p.id === id);
  const patientDocuments = documents.filter((d) => d.patientId === id);

  const [activeTab, setActiveTab] = useState<
    | "cadastro"
    | "prontuario"
    | "orcamentos"
    | "tratamentos"
    | "financeiro"
    | "documentos"
  >("cadastro");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [openMenuBudgetId, setOpenMenuBudgetId] = useState<string | null>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuBudgetId(null);
    if (openMenuBudgetId) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [openMenuBudgetId]);

  if (!patient)
    return <div className="p-8 dark:text-white">Paciente não encontrado.</div>;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);

    // Construir endereço composto
    const compositeAddress = [
      formData.get("street"),
      formData.get("number"),
      formData.get("neighborhood"),
      formData.get("city"),
      formData.get("state"),
    ]
      .filter(Boolean)
      .join(", ");

    updatePatient(patient.id, {
      name: formData.get("name") as string,
      phone: formData.get("phone") as string,
      email: formData.get("email") as string,
      cpf: formData.get("cpf") as string,
      rg: formData.get("rg") as string,
      birth_date: formData.get("birth_date") as string,
      gender: formData.get("gender") as string,
      civilStatus: formData.get("civilStatus") as string,
      profession: formData.get("profession") as string,
      contactPreference: formData.get("contactPreference") as string,
      zipCode: formData.get("zipCode") as string,
      street: formData.get("street") as string,
      number: formData.get("number") as string,
      complement: formData.get("complement") as string,
      neighborhood: formData.get("neighborhood") as string,
      city: formData.get("city") as string,
      state: formData.get("state") as string,
      address: compositeAddress || patient.address,
      insurance: formData.get("insurance") as string,
      insuranceCardNumber: formData.get("insuranceCardNumber") as string,
      initialClinicalNotes: formData.get("initialClinicalNotes") as string,
      generalNotes: formData.get("generalNotes") as string,
    });
    setIsEditingProfile(false);
  };

  const handleDeletePatient = async () => {
    try {
      // 1. Excluir payment_history relacionados aos financial_installments do paciente
      const { data: installments } = await supabase
        .from("financial_installments")
        .select("id")
        .eq("patient_id", patient.id);

      if (installments && installments.length > 0) {
        const installmentIds = installments.map((inst) => inst.id);
        await supabase
          .from("payment_history")
          .delete()
          .in("installment_id", installmentIds);
      }

      // 2. Excluir treatment_items relacionados
      await supabase
        .from("treatment_items")
        .delete()
        .eq("patient_id", patient.id);

      // 3. Excluir budget_items e budgets relacionados
      const { data: budgets } = await supabase
        .from("budgets")
        .select("id")
        .eq("patient_id", patient.id);

      if (budgets && budgets.length > 0) {
        const budgetIds = budgets.map((b) => b.id);
        await supabase.from("budget_items").delete().in("budget_id", budgetIds);

        await supabase.from("budgets").delete().eq("patient_id", patient.id);
      }

      // 4. Excluir clinical_notes
      await supabase
        .from("clinical_notes")
        .delete()
        .eq("patient_id", patient.id);

      // 5. Excluir patient_documents
      await supabase
        .from("patient_documents")
        .delete()
        .eq("patient_id", patient.id);

      // 6. Excluir financial_installments
      await supabase
        .from("financial_installments")
        .delete()
        .eq("patient_id", patient.id);

      // 7. Excluir appointments
      await supabase.from("appointments").delete().eq("patient_id", patient.id);

      // 8. Excluir leads relacionados
      await supabase.from("leads").delete().eq("patient_id", patient.id);

      // 9. Por fim, excluir o paciente
      const { error } = await supabase
        .from("patients")
        .delete()
        .eq("id", patient.id);

      if (error) {
        console.error("Erro ao excluir paciente:", error);
        alert("Erro ao excluir paciente. Tente novamente.");
        return;
      }

      // Fechar modal e navegar para a lista
      setShowDeleteModal(false);
      navigate("/patients");
    } catch (error) {
      console.error("Erro inesperado ao excluir paciente:", error);
      alert("Erro inesperado. Tente novamente.");
    }
  };

  const tabs = [
    { id: "cadastro", label: "Cadastro", icon: User },
    { id: "orcamentos", label: "Orçamentos", icon: FileText },
    { id: "tratamentos", label: "Tratamentos", icon: Shield },
    { id: "financeiro", label: "Financeiro", icon: DollarSign },
    { id: "documentos", label: "Docs", icon: File },
    { id: "prontuario", label: "Evolução", icon: Activity },
  ];

  const StatusBadge = ({ status }: { status: string }) => {
    const colors: any = {
      "Em Tratamento":
        "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
      "Em Orçamento":
        "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
      Finalizado:
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
      Manutenção:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
      Arquivo: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
    };
    return (
      <span
        className={`px-3 py-1 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wide ${
          colors[status] || "bg-gray-100 dark:bg-gray-700"
        }`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="flex flex-col min-h-full relative">
      {/* --- RESPONSIVE HEADER (Sticky) ---
          Updated z-index to 30 to ensure it stays above all content content
      */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm z-30 sticky top-0 -mt-4 -mx-4 px-4 pt-4 md:-mt-8 md:-mx-8 md:px-8 md:pt-8 pb-0 transition-colors">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <button
              onClick={() => navigate("/patients")}
              className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-3 md:gap-5 flex-1">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 text-xl md:text-2xl font-bold border-2 border-white dark:border-gray-700 shadow-sm shrink-0">
                {patient.name?.charAt(0) || "?"}
              </div>
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
                  <h1 className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                    {patient.name}
                  </h1>
                  <StatusBadge status={patient.status} />
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">
                  <span className="flex items-center gap-1">
                    <Phone size={12} /> {patient.phone}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />{" "}
                    {patient.created_at
                      ? new Date(patient.created_at).toLocaleDateString("pt-BR")
                      : "N/A"}
                  </span>
                </div>
              </div>
            </div>
            <button className="md:hidden text-gray-400 dark:text-gray-500">
              <MoreVertical size={20} />
            </button>
          </div>

          <div className="hidden md:flex gap-4">
            <div className="text-right px-4 border-r border-gray-100 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">
                Aprovado
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                R$ {(patient.total_approved || 0).toLocaleString("pt-BR")}
              </p>
            </div>
            <div className="text-right px-4 border-r border-gray-100 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">
                Pago
              </p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                R$ {(patient.total_paid || 0).toLocaleString("pt-BR")}
              </p>
            </div>
            <div className="text-right px-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">
                Saldo Devedor
              </p>
              <p className="text-lg font-bold text-red-500 dark:text-red-400">
                R$ {(patient.balance_due || 0).toLocaleString("pt-BR")}
              </p>
            </div>
          </div>
        </div>

        {/* SCROLLABLE TABS */}
        <div className="flex gap-1 overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 md:px-6 py-3 border-b-2 font-medium text-xs md:text-sm transition-colors whitespace-nowrap
                ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20 rounded-t-lg"
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-t-lg"
                }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* --- CONTENT AREA ---
          Increased top padding (pt-8) to ensure content doesn't slip under the sticky header visually.
      */}
      <div className="flex-1 bg-gray-50 dark:bg-gray-900 pt-8 pb-20 md:pb-0 transition-colors">
        {/* TAB: CADASTRO */}
        {activeTab === "cadastro" && (
          <div className="max-w-6xl mx-auto animate-in fade-in">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                  Dados Cadastrais
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Informações completas do paciente
                </p>
              </div>
              <div className="flex gap-2">
                {!isEditingProfile ? (
                  <>
                    <button
                      onClick={() => setIsEditingProfile(true)}
                      className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline px-3 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    >
                      <Edit2 size={16} />{" "}
                      <span className="hidden md:inline">Editar</span>
                    </button>
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm font-medium hover:underline px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <AlertCircle size={16} /> Excluir
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditingProfile(false)}
                    className="text-gray-500 dark:text-gray-400 text-sm hover:underline px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </div>

            {isEditingProfile ? (
              // MODO EDIÇÃO - Mesmo formulário da criação
              <form onSubmit={handleSaveProfile} className="space-y-6">
                {/* 1. DADOS OBRIGATÓRIOS */}
                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border-l-4 border-primary-500 ring-1 ring-gray-100 dark:ring-slate-700">
                  <h3 className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <User size={16} /> Identificação Principal
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                        Nome Completo <span className="text-red-500">*</span>
                      </label>
                      <input
                        name="name"
                        defaultValue={patient.name}
                        className="w-full bg-white text-gray-900 border border-gray-200 rounded-lg p-3 md:p-2 text-base md:text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none placeholder-gray-400 transition-all shadow-sm h-12 md:h-10"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                        Telefone / WhatsApp{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        name="phone"
                        type="tel"
                        defaultValue={patient.phone}
                        className="w-full bg-white text-gray-900 border border-gray-200 rounded-lg p-3 md:p-2 text-base md:text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none placeholder-gray-400 transition-all shadow-sm h-12 md:h-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* 2. PESSOAL */}
                  <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <FileText size={16} /> Pessoal
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-3">
                      <div className="col-span-1 md:col-span-6">
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                          CPF
                        </label>
                        <input
                          name="cpf"
                          defaultValue={patient.cpf}
                          className="w-full bg-white text-gray-900 border border-gray-200 rounded-lg p-3 md:p-2 text-base md:text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none placeholder-gray-400 transition-all shadow-sm h-12 md:h-10"
                        />
                      </div>
                      <div className="col-span-1 md:col-span-6">
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                          RG
                        </label>
                        <input
                          name="rg"
                          defaultValue={patient.rg}
                          className="w-full bg-white text-gray-900 border border-gray-200 rounded-lg p-3 md:p-2 text-base md:text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none placeholder-gray-400 transition-all shadow-sm h-12 md:h-10"
                        />
                      </div>
                      <div className="col-span-1 md:col-span-7">
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                          Data de Nascimento
                        </label>
                        <input
                          name="birth_date"
                          type="date"
                          defaultValue={patient.birth_date}
                          className="w-full bg-white text-gray-900 border border-gray-200 rounded-lg p-3 md:p-2 text-base md:text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none placeholder-gray-400 transition-all shadow-sm h-12 md:h-10"
                        />
                      </div>
                      <div className="col-span-1 md:col-span-5">
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                          Gênero
                        </label>
                        <select
                          name="gender"
                          defaultValue={patient.gender || "Não Informado"}
                          className="w-full bg-white text-gray-900 border border-gray-200 rounded-lg p-3 md:p-2 text-base md:text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none placeholder-gray-400 transition-all shadow-sm h-12 md:h-10"
                        >
                          <option>Masculino</option>
                          <option>Feminino</option>
                          <option>Outro</option>
                          <option>Não Informado</option>
                        </select>
                      </div>
                      <div className="col-span-1 md:col-span-5">
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                          Estado Civil
                        </label>
                        <select
                          name="civilStatus"
                          defaultValue={patient.civilStatus || "Solteiro(a)"}
                          className="w-full bg-white text-gray-900 border border-gray-200 rounded-lg p-3 md:p-2 text-base md:text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none placeholder-gray-400 transition-all shadow-sm h-12 md:h-10"
                        >
                          <option>Solteiro(a)</option>
                          <option>Casado(a)</option>
                          <option>Divorciado(a)</option>
                          <option>Viúvo(a)</option>
                        </select>
                      </div>
                      <div className="col-span-1 md:col-span-7">
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                          Profissão
                        </label>
                        <input
                          name="profession"
                          defaultValue={patient.profession}
                          className="w-full bg-white text-gray-900 border border-gray-200 rounded-lg p-3 md:p-2 text-base md:text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none placeholder-gray-400 transition-all shadow-sm h-12 md:h-10"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 3. ENDEREÇO */}
                  <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <MapPin size={16} /> Endereço & Contato
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-3">
                      <div className="col-span-1 md:col-span-8">
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                          Email
                        </label>
                        <input
                          name="email"
                          type="email"
                          defaultValue={patient.email}
                          className="w-full bg-white text-gray-900 border border-gray-200 rounded-lg p-3 md:p-2 text-base md:text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none placeholder-gray-400 transition-all shadow-sm h-12 md:h-10"
                        />
                      </div>
                      <div className="col-span-1 md:col-span-4">
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                          Pref. Contato
                        </label>
                        <select
                          name="contactPreference"
                          defaultValue={patient.contactPreference || "WhatsApp"}
                          className="w-full bg-white text-gray-900 border border-gray-200 rounded-lg p-3 md:p-2 text-base md:text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none placeholder-gray-400 transition-all shadow-sm h-12 md:h-10"
                        >
                          <option>WhatsApp</option>
                          <option>Ligação</option>
                          <option>Email</option>
                        </select>
                      </div>
                      <div className="col-span-1 md:col-span-4">
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                          CEP
                        </label>
                        <input
                          name="zipCode"
                          type="tel"
                          defaultValue={patient.zipCode}
                          className="w-full bg-white text-gray-900 border border-gray-200 rounded-lg p-3 md:p-2 text-base md:text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none placeholder-gray-400 transition-all shadow-sm h-12 md:h-10"
                        />
                      </div>
                      <div className="col-span-1 md:col-span-8">
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                          Logradouro
                        </label>
                        <input
                          name="street"
                          defaultValue={patient.street}
                          className="w-full bg-white text-gray-900 border border-gray-200 rounded-lg p-3 md:p-2 text-base md:text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none placeholder-gray-400 transition-all shadow-sm h-12 md:h-10"
                        />
                      </div>
                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                          Número
                        </label>
                        <input
                          name="number"
                          defaultValue={patient.number}
                          className="w-full bg-white text-gray-900 border border-gray-200 rounded-lg p-3 md:p-2 text-base md:text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none placeholder-gray-400 transition-all shadow-sm h-12 md:h-10"
                        />
                      </div>
                      <div className="col-span-1 md:col-span-4">
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                          Complemento
                        </label>
                        <input
                          name="complement"
                          defaultValue={patient.complement}
                          className="w-full bg-white text-gray-900 border border-gray-200 rounded-lg p-3 md:p-2 text-base md:text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none placeholder-gray-400 transition-all shadow-sm h-12 md:h-10"
                        />
                      </div>
                      <div className="col-span-1 md:col-span-6">
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                          Bairro
                        </label>
                        <input
                          name="neighborhood"
                          defaultValue={patient.neighborhood}
                          className="w-full bg-white text-gray-900 border border-gray-200 rounded-lg p-3 md:p-2 text-base md:text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none placeholder-gray-400 transition-all shadow-sm h-12 md:h-10"
                        />
                      </div>
                      <div className="col-span-1 md:col-span-9">
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                          Cidade
                        </label>
                        <input
                          name="city"
                          defaultValue={patient.city}
                          className="w-full bg-white text-gray-900 border border-gray-200 rounded-lg p-3 md:p-2 text-base md:text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none placeholder-gray-400 transition-all shadow-sm h-12 md:h-10"
                        />
                      </div>
                      <div className="col-span-1 md:col-span-3">
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                          UF
                        </label>
                        <input
                          name="state"
                          maxLength={2}
                          defaultValue={patient.state}
                          className="w-full bg-white text-gray-900 border border-gray-200 rounded-lg p-3 md:p-2 text-base md:text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none placeholder-gray-400 transition-all shadow-sm h-12 md:h-10"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 4. CONVÊNIO */}
                  <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Shield size={16} /> Convênio & Clínico
                    </h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                            Convênio
                          </label>
                          <select
                            name="insurance"
                            defaultValue={patient.insurance || "Particular"}
                            className="w-full bg-white text-gray-900 border border-gray-200 rounded-lg p-3 md:p-2 text-base md:text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none placeholder-gray-400 transition-all shadow-sm h-12 md:h-10"
                          >
                            <option>Particular</option>
                            <option>Unimed</option>
                            <option>Amil</option>
                            <option>Bradesco Saúde</option>
                            <option>SulAmérica</option>
                            <option>Outro</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                            Nº Carteirinha
                          </label>
                          <input
                            name="insuranceCardNumber"
                            defaultValue={patient.insuranceCardNumber}
                            className="w-full bg-white text-gray-900 border border-gray-200 rounded-lg p-3 md:p-2 text-base md:text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none placeholder-gray-400 transition-all shadow-sm h-12 md:h-10"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                          Anamnese Inicial
                        </label>
                        <textarea
                          name="initialClinicalNotes"
                          defaultValue={patient.initialClinicalNotes}
                          className="w-full bg-white text-gray-900 border border-gray-200 rounded-lg p-3 md:p-2 text-base md:text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none placeholder-gray-400 transition-all shadow-sm resize-none h-24"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 5. OBSERVAÇÕES */}
                  <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <File size={16} /> Observações Gerais
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                          Observações de Perfil
                        </label>
                        <textarea
                          name="generalNotes"
                          defaultValue={patient.generalNotes}
                          className="w-full bg-white text-gray-900 border border-gray-200 rounded-lg p-3 md:p-2 text-base md:text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none placeholder-gray-400 transition-all shadow-sm resize-none h-24"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Save size={18} /> Salvar Alterações
                  </button>
                </div>
              </form>
            ) : (
              // MODO VISUALIZAÇÃO - Mostrar todos os campos organizados
              <div className="space-y-6">
                {/* 1. IDENTIFICAÇÃO PRINCIPAL */}
                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border-l-4 border-primary-500 ring-1 ring-gray-100 dark:ring-slate-700">
                  <h3 className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <User size={16} /> Identificação Principal
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-x-12 md:gap-y-6 text-sm md:text-base">
                    <div className="flex justify-between md:block border-b md:border-0 border-gray-50 dark:border-gray-700 pb-2 md:pb-0">
                      <label className="text-xs text-gray-500 dark:text-gray-400 block">
                        Nome Completo
                      </label>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {patient.name}
                      </p>
                    </div>
                    <div className="flex justify-between md:block border-b md:border-0 border-gray-50 dark:border-gray-700 pb-2 md:pb-0">
                      <label className="text-xs text-gray-500 dark:text-gray-400 block">
                        Telefone / WhatsApp
                      </label>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {patient.phone}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* 2. PESSOAL */}
                  <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <FileText size={16} /> Pessoal
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-x-12 md:gap-y-6 text-sm md:text-base">
                      <div className="flex justify-between md:block border-b md:border-0 border-gray-50 dark:border-gray-700 pb-2 md:pb-0">
                        <label className="text-xs text-gray-500 dark:text-gray-400 block">
                          CPF
                        </label>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {patient.cpf || "-"}
                        </p>
                      </div>
                      <div className="flex justify-between md:block border-b md:border-0 border-gray-50 dark:border-gray-700 pb-2 md:pb-0">
                        <label className="text-xs text-gray-500 dark:text-gray-400 block">
                          RG
                        </label>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {patient.rg || "-"}
                        </p>
                      </div>
                      <div className="flex justify-between md:block border-b md:border-0 border-gray-50 dark:border-gray-700 pb-2 md:pb-0">
                        <label className="text-xs text-gray-500 dark:text-gray-400 block">
                          Data de Nascimento
                        </label>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {patient.birth_date || "-"}
                        </p>
                      </div>
                      <div className="flex justify-between md:block border-b md:border-0 border-gray-50 dark:border-gray-700 pb-2 md:pb-0">
                        <label className="text-xs text-gray-500 dark:text-gray-400 block">
                          Gênero
                        </label>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {patient.gender || "-"}
                        </p>
                      </div>
                      <div className="flex justify-between md:block border-b md:border-0 border-gray-50 dark:border-gray-700 pb-2 md:pb-0">
                        <label className="text-xs text-gray-500 dark:text-gray-400 block">
                          Estado Civil
                        </label>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {patient.civilStatus || "-"}
                        </p>
                      </div>
                      <div className="flex justify-between md:block border-b md:border-0 border-gray-50 dark:border-gray-700 pb-2 md:pb-0">
                        <label className="text-xs text-gray-500 dark:text-gray-400 block">
                          Profissão
                        </label>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {patient.profession || "-"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 3. ENDEREÇO */}
                  <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <MapPin size={16} /> Endereço & Contato
                    </h3>
                    <div className="space-y-4 text-sm md:text-base">
                      <div className="flex justify-between md:block border-b md:border-0 border-gray-50 dark:border-gray-700 pb-2 md:pb-0">
                        <label className="text-xs text-gray-500 dark:text-gray-400 block">
                          Email
                        </label>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {patient.email || "-"}
                        </p>
                      </div>
                      <div className="flex justify-between md:block border-b md:border-0 border-gray-50 dark:border-gray-700 pb-2 md:pb-0">
                        <label className="text-xs text-gray-500 dark:text-gray-400 block">
                          Pref. Contato
                        </label>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {patient.contactPreference || "-"}
                        </p>
                      </div>
                      {patient.address && (
                        <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                          <h4 className="text-sm font-bold text-gray-800 dark:text-white mb-2">
                            Endereço Completo
                          </h4>
                          <p className="font-medium text-gray-900 dark:text-white flex items-start gap-2">
                            <MapPin
                              size={16}
                              className="text-gray-400 mt-0.5 flex-shrink-0"
                            />
                            {patient.address}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 4. CONVÊNIO */}
                  <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Shield size={16} /> Convênio & Clínico
                    </h3>
                    <div className="space-y-4 text-sm md:text-base">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex justify-between md:block border-b md:border-0 border-gray-50 dark:border-gray-700 pb-2 md:pb-0">
                          <label className="text-xs text-gray-500 dark:text-gray-400 block">
                            Convênio
                          </label>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {patient.insurance || "Particular"}
                          </p>
                        </div>
                        <div className="flex justify-between md:block border-b md:border-0 border-gray-50 dark:border-gray-700 pb-2 md:pb-0">
                          <label className="text-xs text-gray-500 dark:text-gray-400 block">
                            Nº Carteirinha
                          </label>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {patient.insuranceCardNumber || "-"}
                          </p>
                        </div>
                      </div>
                      {patient.initialClinicalNotes && (
                        <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                          <label className="text-xs text-gray-500 dark:text-gray-400 block mb-2">
                            Anamnese Inicial
                          </label>
                          <p className="font-medium text-gray-900 dark:text-white whitespace-pre-wrap">
                            {patient.initialClinicalNotes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 5. OBSERVAÇÕES */}
                  <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <File size={16} /> Observações Gerais
                    </h3>
                    <div className="space-y-4 text-sm md:text-base">
                      {patient.generalNotes ? (
                        <div>
                          <label className="text-xs text-gray-500 dark:text-gray-400 block mb-2">
                            Observações de Perfil
                          </label>
                          <p className="font-medium text-gray-900 dark:text-white whitespace-pre-wrap">
                            {patient.generalNotes}
                          </p>
                        </div>
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400 italic">
                          Nenhuma observação registrada
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MODAL DE EXCLUSÃO */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <AlertCircle
                    size={24}
                    className="text-red-600 dark:text-red-400"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Excluir Paciente
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Esta ação não pode ser desfeita
                  </p>
                </div>
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                Tem certeza que deseja excluir o paciente{" "}
                <strong>{patient.name}</strong>? Todos os dados, orçamentos,
                tratamentos e histórico serão perdidos permanentemente.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeletePatient}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <Trash2 size={16} />
                  Excluir
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Restante das abas permanece igual */}
        {/* TAB: EVOLUÇÃO */}
        {activeTab === "prontuario" && (
          <div className="max-w-4xl mx-auto animate-in fade-in">
            {/* Added relative z-10 to ensure button stays clickable and visible above timeline */}
            <div className="flex justify-between items-center mb-6 relative z-10">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                Linha do Tempo
              </h2>
              <button
                onClick={() => navigate(`/patients/${patient.id}/notes/new`)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2 shadow-sm transition-transform active:scale-95"
              >
                <Plus size={16} />{" "}
                <span className="hidden md:inline">Nova Evolução</span>
                <span className="md:hidden">Evoluir</span>
              </button>
            </div>
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-300 dark:before:via-gray-600 before:to-transparent">
              {patient.notes?.map((note) => (
                <div
                  key={note.id}
                  className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active animate-in slide-in-from-bottom-2 duration-300"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white dark:border-gray-800 bg-gray-200 dark:bg-gray-700 group-[.is-active]:bg-blue-600 dark:group-[.is-active]:bg-blue-600 text-gray-500 dark:text-gray-400 group-[.is-active]:text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                    <FileText size={18} />
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-gray-800 dark:text-white text-sm">
                        {note.type}
                      </span>
                      <time className="font-mono text-xs text-gray-400">
                        {note.date}
                      </time>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                      {note.content}
                    </p>
                    <div className="mt-2 pt-2 border-t border-gray-50 dark:border-gray-700 text-xs text-gray-400 flex items-center gap-1">
                      <User size={12} /> {note.doctorName}
                    </div>
                  </div>
                </div>
              ))}
              {(!patient.notes || patient.notes.length === 0) && (
                <p className="text-center text-gray-500 dark:text-gray-400 py-10">
                  Nenhuma anotação clínica.
                </p>
              )}
            </div>
          </div>
        )}

        {/* TAB: ORÇAMENTOS */}
        {activeTab === "orcamentos" && (
          <div className="max-w-5xl mx-auto space-y-4 md:space-y-6 animate-in fade-in">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                Orçamentos
              </h2>
              <button
                onClick={() => navigate(`/patients/${patient.id}/new-budget`)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2 shadow-sm"
              >
                <Plus size={16} /> Novo
              </button>
            </div>
            {patient.budgets?.map((budget) => (
              <div
                key={budget.id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-1 duration-300"
              >
                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <div className="flex items-center gap-2 md:gap-4">
                    <span className="font-mono text-sm font-bold text-gray-600 dark:text-gray-400">
                      #{budget.id.toUpperCase()}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] md:text-xs font-bold uppercase ${
                        budget.status === "Aprovado"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                          : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                      }`}
                    >
                      {budget.status}
                    </span>
                    <span className="hidden md:inline text-sm text-gray-500 dark:text-gray-400">
                      {budget.createdAt} • {budget.doctorName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="font-bold text-gray-900 dark:text-white text-sm md:text-base">
                      R$ {budget.totalValue.toLocaleString("pt-BR")}
                    </div>
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuBudgetId(
                            openMenuBudgetId === budget.id ? null : budget.id
                          );
                        }}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                      >
                        <MoreVertical size={16} />
                      </button>
                      {openMenuBudgetId === budget.id && (
                        <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-lg z-10 w-32">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(
                                `/patients/${patient.id}/budgets/${budget.id}`
                              );
                              setOpenMenuBudgetId(null);
                            }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                          >
                            <Edit size={14} /> Editar
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (
                                confirm(
                                  "Tem certeza que deseja excluir este orçamento? Isso também excluirá os tratamentos e parcelas relacionadas."
                                )
                              ) {
                                deleteBudget(patient.id, budget.id);
                              }
                              setOpenMenuBudgetId(null);
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                          >
                            <Trash2 size={14} /> Excluir
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {/* Desktop Table / Mobile List */}
                <div className="p-0">
                  <div className="hidden md:block">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50/50 dark:bg-gray-700/30 text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                        <tr>
                          <th className="px-6 py-2 font-medium">
                            Procedimento
                          </th>
                          <th className="px-6 py-2 font-medium">Região</th>
                          <th className="px-6 py-2 font-medium text-right">
                            Valor
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                        {budget.items.map((item) => (
                          <tr key={item.id}>
                            <td className="px-6 py-3 text-gray-900 dark:text-white">
                              {item.procedure}
                            </td>
                            <td className="px-6 py-3 text-gray-500 dark:text-gray-400">
                              {item.region}
                            </td>
                            <td className="px-6 py-3 text-right text-gray-900 dark:text-white font-medium">
                              R$ {item.total.toLocaleString("pt-BR")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Mobile List View for Budget Items */}
                  <div className="md:hidden divide-y divide-gray-50 dark:divide-gray-700">
                    {budget.items.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 flex justify-between items-center"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {item.procedure}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {item.region}
                          </p>
                        </div>
                        <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                          R$ {item.total.toLocaleString("pt-BR")}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
                {budget.status === "Em Análise" && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
                    <button
                      onClick={() =>
                        navigate(`/patients/${patient.id}/budgets/${budget.id}`)
                      }
                      className="text-sm px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-white"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => approveBudget(patient.id, budget.id)}
                      className="text-sm px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium shadow-sm active:scale-95"
                    >
                      Aprovar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* TAB: TRATAMENTOS (NEW COMPONENT) */}
        {activeTab === "tratamentos" && (
          <div className="max-w-5xl mx-auto animate-in fade-in">
            <PatientTreatments patient={patient} />
          </div>
        )}

        {/* TAB: FINANCEIRO (NEW COMPONENT) */}
        {activeTab === "financeiro" && (
          <div className="max-w-4xl mx-auto animate-in fade-in">
            <PatientFinancial patient={patient} />
          </div>
        )}

        {/* TAB: DOCUMENTOS (NEW) */}
        {activeTab === "documentos" && (
          <div className="max-w-4xl mx-auto space-y-4 animate-in fade-in">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                Documentos do Paciente
              </h2>
              <button
                onClick={() =>
                  navigate(`/patients/${patient.id}/documents/new`)
                }
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2 shadow-sm"
              >
                <Plus size={16} /> Novo Documento
              </button>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400">
                  <tr>
                    <th className="px-6 py-3 font-medium">Nome do Documento</th>
                    <th className="px-6 py-3 font-medium">Tipo</th>
                    <th className="px-6 py-3 font-medium">Data</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                  {patientDocuments.map((doc) => (
                    <tr
                      key={doc.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/documents/${doc.id}`)}
                    >
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                        {doc.title}
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs text-gray-600 dark:text-gray-300">
                          {doc.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${
                            doc.status === "Assinado"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                              : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                          }`}
                        >
                          {doc.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-blue-600 dark:text-blue-400 hover:underline">
                          Visualizar
                        </button>
                      </td>
                    </tr>
                  ))}
                  {patientDocuments.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="text-center py-8 text-gray-400"
                      >
                        Nenhum documento gerado para este paciente.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientDetail;
