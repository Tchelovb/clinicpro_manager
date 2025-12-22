import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { usePatients } from "../hooks/usePatients";
import { Patient } from "../types";
import { supabase } from "../lib/supabase";
import {
  ArrowLeft,
  Save,
  User,
  MapPin,
  Phone,
  Mail,
  FileText,
  Upload,
  Shield,
  File,
  AlertCircle,
} from "lucide-react";

const PatientForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { createPatient, updatePatient } = usePatients();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const isEditMode = !!id;

  const [formData, setFormData] = useState<Partial<Patient>>({
    status: "Em Orçamento",
    gender: "Não Informado",
    marital_status: "SINGLE",
    contact_preference: "WHATSAPP",
    insurance: "Particular",
    patient_score: "STANDARD",
    sentiment_status: "NEUTRAL",
    is_active: true,
    bad_debtor: false,
  });

  // Load patient data if in edit mode
  useEffect(() => {
    const isValidId = id && id !== ":id" && /^[0-9a-fA-F-]{36}$/.test(id);

    if (isEditMode && isValidId) {
      setLoading(true);
      supabase
        .from("patients")
        .select("*")
        .eq("id", id)
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error("Error loading patient:", error);
            setError("Erro ao carregar dados do paciente");
          } else if (data) {
            setFormData(data);
          }
          setLoading(false);
        });
    }
  }, [id, isEditMode]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error && (e.target.name === "name" || e.target.name === "phone")) {
      setError("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.phone) {
      setError(
        "Nome completo e Telefone são obrigatórios para iniciar o cadastro."
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const compositeAddress = [
      formData.street,
      formData.number,
      formData.neighborhood,
      formData.city,
      formData.state,
    ]
      .filter(Boolean)
      .join(", ");

    const newPatient = {
      name: formData.name,
      phone: formData.phone,
      email: formData.email || null,
      cpf: formData.cpf || null,
      birth_date: formData.birth_date || null,
      gender: formData.gender || null,
      address: compositeAddress || null,
      clinical_status: "Em Tratamento",
      total_approved: 0,
      total_paid: 0,
      balance_due: 0,

      // Classificação e Status
      patient_score: formData.patient_score || "STANDARD",
      sentiment_status: formData.sentiment_status || "NEUTRAL",
      is_active: formData.is_active !== undefined ? formData.is_active : true,
      bad_debtor: formData.bad_debtor || false,

      // Novos campos persistidos
      contact_preference: formData.contact_preference || formData.contactPreference || "WHATSAPP",
      origin: formData.origin || "Instagram",
      zip_code: formData.zip_code || formData.zipCode || null,
      street: formData.street || null,
      number: formData.number || null,
      complement: formData.complement || null,
      neighborhood: formData.neighborhood || null,
      city: formData.city || null,
      state: formData.state || null,


      // Dossiê High-Ticket
      nickname: formData.nickname || null,
      occupation: formData.occupation || null,
      instagram_handle: formData.instagram_handle || null,
      marital_status: formData.marital_status || null,
      wedding_anniversary: formData.wedding_anniversary || null,
      vip_notes: formData.vip_notes || null,
    };


    setError("");

    if (isEditMode && id) {
      // Update existing patient
      updatePatient({ id, data: newPatient });
      setTimeout(() => {
        navigate(`/patients/${id}`);
      }, 500);
    } else {
      // Create new patient
      createPatient(newPatient);
      setTimeout(() => {
        navigate("/patients");
      }, 500);
    }
  };

  // Dense Input Styles - Updated for Mobile Touch Target
  const inputClass =
    "w-full bg-white text-gray-900 border border-gray-200 rounded-lg p-3 md:p-2 text-base md:text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none placeholder-gray-400 transition-all shadow-sm h-12 md:h-10";
  const textareaClass =
    "w-full bg-white text-gray-900 border border-gray-200 rounded-lg p-3 md:p-2 text-base md:text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none placeholder-gray-400 transition-all shadow-sm resize-none";
  const labelClass =
    "block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide";

  return (
    <div className="max-w-6xl mx-auto pb-24 md:pb-20 animate-in fade-in">
      {/* Header */}
      <div className="mb-6 flex flex-row justify-between items-center gap-4 sticky top-0 z-20 bg-gray-50/95 dark:bg-gray-900/95 backdrop-blur py-4 border-b border-gray-200/50 dark:border-gray-800/50 -mx-4 px-4 md:-mx-8 md:px-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded-full text-gray-500 dark:text-gray-400 transition-colors shadow-sm border border-transparent hover:border-gray-200"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">
              {isEditMode ? "Editar Paciente" : "Novo Paciente"}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {isEditMode ? "Atualize os dados do paciente." : "Preencha os dados obrigatórios (*)."}
            </p>
          </div>
        </div>

        {/* Desktop Save Button */}
        <button
          onClick={handleSubmit}
          className="hidden md:flex bg-primary-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-primary-700 shadow-md items-center gap-2 transition-transform active:scale-95 text-sm"
        >
          <Save size={18} /> Salvar Ficha
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-3 rounded-lg mb-6 flex items-center gap-3 text-sm font-medium">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400">Carregando dados do paciente...</p>
          </div>
        </div>
      ) : (
        <>
          <form className="space-y-6">
            {/* 1. DADOS OBRIGATÓRIOS (Highlight) */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border-l-4 border-primary-500 ring-1 ring-gray-100 dark:ring-slate-700">
              <h3 className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <User size={16} /> Identificação Principal
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>
                    Nome Completo <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="name"
                    value={formData.name || ""}
                    className={inputClass}
                    placeholder="Ex: João da Silva"
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    Telefone / WhatsApp <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="phone"
                    value={formData.phone || ""}
                    type="tel"
                    className={inputClass}
                    placeholder="(00) 90000-0000"
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* 1.5. DOSSIÊ HIGH-TICKET (CRM de Luxo) */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-5 rounded-xl shadow-sm border-l-4 border-purple-500 ring-1 ring-purple-100 dark:ring-purple-800">
              <h3 className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <User size={16} /> 💎 Dossiê High-Ticket (CRM de Luxo)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-3">
                {/* Apelido (4) / Instagram (4) / Profissão (4) */}
                <div className="col-span-1 md:col-span-4">
                  <label className={labelClass}>
                    Apelido / Como Chamar
                  </label>
                  <input
                    name="nickname"
                    value={formData.nickname || ""}
                    className={inputClass}
                    placeholder="Ex: Janjão"
                    onChange={handleChange}
                  />
                  <p className="text-xs text-gray-500 mt-1">Para criar rapport</p>
                </div>
                <div className="col-span-1 md:col-span-4">
                  <label className={labelClass}>
                    Instagram
                  </label>
                  <input
                    name="instagram_handle"
                    value={formData.instagram_handle || ""}
                    className={inputClass}
                    placeholder="@usuario"
                    onChange={handleChange}
                  />
                  <p className="text-xs text-gray-500 mt-1">Análise de lifestyle</p>
                </div>
                <div className="col-span-1 md:col-span-4">
                  <label className={labelClass}>
                    Profissão
                  </label>
                  <input
                    name="occupation"
                    value={formData.occupation || ""}
                    className={inputClass}
                    placeholder="Ex: Empresário"
                    onChange={handleChange}
                  />
                  <p className="text-xs text-gray-500 mt-1">Indica poder aquisitivo</p>
                </div>

                {/* Estado Civil (4) / Aniversário de Casamento (4) */}
                <div className="col-span-1 md:col-span-4">
                  <label className={labelClass}>
                    Estado Civil
                  </label>
                  <select
                    name="marital_status"
                    value={formData.marital_status || ""}
                    className={inputClass}
                    onChange={handleChange}
                  >
                    <option value="">Selecione...</option>
                    <option value="SINGLE">Solteiro(a)</option>
                    <option value="MARRIED">Casado(a)</option>
                    <option value="DIVORCED">Divorciado(a)</option>
                    <option value="WIDOWED">Viúvo(a)</option>
                    <option value="OTHER">Outro</option>
                  </select>
                </div>
                <div className="col-span-1 md:col-span-4">
                  <label className={labelClass}>
                    Aniversário de Casamento
                  </label>
                  <input
                    name="wedding_anniversary"
                    value={formData.wedding_anniversary || ""}
                    type="date"
                    className={inputClass}
                    onChange={handleChange}
                  />
                  <p className="text-xs text-gray-500 mt-1">Para enviar presentes</p>
                </div>

                {/* Notas VIP (12) */}
                <div className="col-span-1 md:col-span-12">
                  <label className={labelClass}>
                    🌟 Notas VIP (Preferências Pessoais)
                  </label>
                  <textarea
                    name="vip_notes"
                    value={formData.vip_notes || ""}
                    className={`${textareaClass} h-20`}
                    placeholder="Ex: Gosta de café sem açúcar, prefere ar condicionado fraco, sempre chega 10min adiantado..."
                    onChange={handleChange}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Detalhes para atendimento personalizado e experiência VIP
                  </p>
                </div>
              </div>
            </div>

            {/* 1.6. CLASSIFICAÇÃO E STATUS */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-5 rounded-xl shadow-sm border-l-4 border-blue-500 ring-1 ring-blue-100 dark:ring-blue-800">
              <h3 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Shield size={16} /> 📊 Classificação e Status
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-3">
                {/* Classificação (4) / Status de Sentimento (4) / Ativo (2) / Devedor (2) */}
                <div className="col-span-1 md:col-span-4">
                  <label className={labelClass}>
                    Classificação (Score)
                  </label>
                  <select
                    name="patient_score"
                    value={formData.patient_score || "STANDARD"}
                    className={inputClass}
                    onChange={handleChange}
                  >
                    <option value="DIAMOND">💎 DIAMOND (High-Ticket)</option>
                    <option value="GOLD">🥇 GOLD (Bom Pagador)</option>
                    <option value="STANDARD">⭐ STANDARD (Normal)</option>
                    <option value="RISK">⚠️ RISK (Inadimplente)</option>
                    <option value="BLACKLIST">🚫 BLACKLIST (Bloqueado)</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Classificação ABC do paciente</p>
                </div>

                <div className="col-span-1 md:col-span-4">
                  <label className={labelClass}>
                    Status de Sentimento
                  </label>
                  <select
                    name="sentiment_status"
                    value={formData.sentiment_status || "NEUTRAL"}
                    className={inputClass}
                    onChange={handleChange}
                  >
                    <option value="VERY_HAPPY">😄 Muito Satisfeito</option>
                    <option value="HAPPY">😊 Satisfeito</option>
                    <option value="NEUTRAL">😐 Neutro</option>
                    <option value="UNHAPPY">😟 Insatisfeito</option>
                    <option value="COMPLAINING">😡 Reclamando</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Nível de satisfação</p>
                </div>

                <div className="col-span-1 md:col-span-2">
                  <label className={labelClass}>
                    Status
                  </label>
                  <select
                    name="is_active"
                    value={String(formData.is_active !== undefined ? formData.is_active : true)}
                    className={inputClass}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}
                  >
                    <option value="true">✅ Ativo</option>
                    <option value="false">❌ Inativo</option>
                  </select>
                </div>

                <div className="col-span-1 md:col-span-2">
                  <label className={labelClass}>
                    Devedor
                  </label>
                  <select
                    name="bad_debtor"
                    value={String(formData.bad_debtor || false)}
                    className={inputClass}
                    onChange={(e) => setFormData({ ...formData, bad_debtor: e.target.value === 'true' })}
                  >
                    <option value="false">Não</option>
                    <option value="true">Sim</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 2. DOCUMENTOS & PESSOAL */}
              <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <FileText size={16} /> Pessoal
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-3">
                  {/* CPF (6) / RG (6) */}
                  <div className="col-span-1 md:col-span-6">
                    <label className={labelClass}>CPF</label>
                    <input
                      name="cpf"
                      type="tel"
                      className={inputClass}
                      placeholder="000.000.000-00"
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-span-1 md:col-span-6">
                    <label className={labelClass}>CPF</label>
                    <input
                      name="cpf"
                      value={formData.cpf || ""}
                      type="tel"
                      className={inputClass}
                      placeholder="000.000.000-00"
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-span-1 md:col-span-6">
                    <label className={labelClass}>RG</label>
                    <input
                      name="rg"
                      value={formData.rg || ""}
                      className={inputClass}
                      placeholder="00.000.000-0"
                      onChange={handleChange}
                    />
                  </div>

                  {/* Nascimento (7) / Gênero (5) */}
                  <div className="col-span-1 md:col-span-7">
                    <label className={labelClass}>Data de Nascimento</label>
                    <input
                      name="birth_date"
                      type="date"
                      className={inputClass}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-span-1 md:col-span-7">
                    <label className={labelClass}>Data de Nascimento</label>
                    <input
                      name="birth_date"
                      value={formData.birth_date || ""}
                      type="date"
                      className={inputClass}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-span-1 md:col-span-5">
                    <label className={labelClass}>Gênero</label>
                    <select
                      name="gender"
                      value={formData.gender || "Não Informado"}
                      className={inputClass}
                      onChange={handleChange}
                    >
                      <option>Masculino</option>
                      <option>Feminino</option>
                      <option>Outro</option>
                      <option>Não Informado</option>
                    </select>
                  </div>

                  {/* Estado Civil (5) / Profissão (7) */}
                  <div className="col-span-1 md:col-span-5">
                    <label className={labelClass}>Estado Civil</label>
                    <select
                      name="marital_status"
                      value={formData.marital_status || "SINGLE"}
                      className={inputClass}
                      onChange={handleChange}
                    >
                      <option value="SINGLE">Solteiro(a)</option>
                      <option value="MARRIED">Casado(a)</option>
                      <option value="DIVORCED">Divorciado(a)</option>
                      <option value="WIDOWED">Viúvo(a)</option>
                      <option value="OTHER">Outro</option>
                    </select>
                  </div>
                  <div className="col-span-1 md:col-span-7">
                    <label className={labelClass}>Profissão</label>
                    <input
                      name="occupation"
                      value={formData.occupation || ""}
                      className={inputClass}
                      placeholder="Ex: Advogado"
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              {/* 3. ENDEREÇO & CONTATO */}
              <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <MapPin size={16} /> Endereço
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-3">
                  {/* Email (8) / Pref (4) */}
                  <div className="col-span-1 md:col-span-8">
                    <label className={labelClass}>Email</label>
                    <input
                      name="email"
                      value={formData.email || ""}
                      type="email"
                      className={inputClass}
                      placeholder="cliente@email.com"
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-span-1 md:col-span-4">
                    <label className={labelClass}>Origem (Marketing)</label>
                    <select
                      name="origin"
                      value={formData.origin || "Instagram"}
                      className={inputClass}
                      onChange={handleChange}
                    >
                      <option>Instagram</option>
                      <option>Google Ads</option>
                      <option>Indicação</option>
                      <option>Facebook</option>
                      <option>Orgânico</option>
                      <option>WhatsApp</option>
                    </select>
                  </div>
                  <div className="col-span-1 md:col-span-4">
                    <label className={labelClass}>Pref. Contato</label>
                    <select
                      name="contact_preference"
                      value={formData.contact_preference || "WhatsApp"}
                      className={inputClass}
                      onChange={handleChange}
                    >
                      <option value="WHATSAPP">WhatsApp</option>
                      <option value="PHONE">Ligação</option>
                      <option value="EMAIL">Email</option>
                    </select>
                  </div>

                  {/* CEP (4) / Rua (8) */}
                  <div className="col-span-1 md:col-span-4">
                    <label className={labelClass}>CEP</label>
                    <input
                      name="zip_code"
                      value={formData.zip_code || ""}
                      type="tel"
                      className={inputClass}
                      placeholder="00000-000"
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-span-1 md:col-span-8">
                    <label className={labelClass}>Logradouro</label>
                    <input
                      name="street"
                      value={formData.street || ""}
                      className={inputClass}
                      placeholder="Rua / Av."
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-span-1 md:col-span-2">
                    <label className={labelClass}>Número</label>
                    <input
                      name="number"
                      value={formData.number || ""}
                      className={inputClass}
                      placeholder="123"
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-span-1 md:col-span-4">
                    <label className={labelClass}>Complemento</label>
                    <input
                      name="complement"
                      value={formData.complement || ""}
                      className={inputClass}
                      placeholder="Apto 101"
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-span-1 md:col-span-6">
                    <label className={labelClass}>Bairro</label>
                    <input
                      name="neighborhood"
                      value={formData.neighborhood || ""}
                      className={inputClass}
                      placeholder="Bairro"
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-span-1 md:col-span-9">
                    <label className={labelClass}>Cidade</label>
                    <input
                      name="city"
                      value={formData.city || ""}
                      className={inputClass}
                      placeholder="Cidade"
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-span-1 md:col-span-3">
                    <label className={labelClass}>UF</label>
                    <input
                      name="state"
                      value={formData.state || ""}
                      className={inputClass}
                      maxLength={2}
                      placeholder="UF"
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              {/* 4. CLÍNICO & CONVÊNIO */}
              <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Shield size={16} /> Convênio & Clínico
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Convênio</label>
                      <select
                        name="insurance"
                        className={inputClass}
                        onChange={handleChange}
                        defaultValue="Particular"
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
                      <label className={labelClass}>Nº Carteirinha</label>
                      <input
                        name="insuranceCardNumber"
                        className={inputClass}
                        placeholder="Opcional"
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Anamnese Inicial (Resumo)</label>
                    <textarea
                      name="initialClinicalNotes"
                      className={`${textareaClass} h-24`}
                      placeholder="Alergias, queixas principais, histórico..."
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              {/* 5. GERAL */}
              <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <File size={16} /> Observações Gerais
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className={labelClass}>Observações de Perfil</label>
                    <textarea
                      name="generalNotes"
                      className={`${textareaClass} h-24`}
                      placeholder="Perfil comportamental, indicações, restrições de horário..."
                      onChange={handleChange}
                    />
                  </div>

                  <div className="flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-gray-50 dark:bg-slate-900/30">
                    <div className="text-center">
                      <Upload size={20} className="mx-auto text-gray-400 mb-2" />
                      <p className="text-xs font-medium text-gray-500">
                        Upload de Foto (Opcional)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>

          {/* MOBILE FIXED BOTTOM ACTION BAR */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50 md:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] safe-bottom">
            <button
              onClick={handleSubmit}
              className="w-full bg-primary-600 text-white py-3 rounded-xl font-bold shadow-md flex justify-center items-center gap-2 active:scale-95 transition-transform text-base"
            >
              <Save size={20} /> Salvar Ficha
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default PatientForm;
