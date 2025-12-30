import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { usePatients } from "../hooks/usePatients";
import { useAuth } from "../contexts/AuthContext";
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
  Shield,
  AlertCircle,
  AlertTriangle,
  Loader2,
  Edit2,
  X,
} from "lucide-react";
import SecurityPinModal from "./SecurityPinModal";
import toast from "react-hot-toast";

interface PatientFormProps {
  onSuccess?: (newId: string) => void;
  onCancel?: () => void;
  initialData?: any;
  patientId?: string;
  readonly?: boolean; // Nova prop para modo visualização
}

const PatientForm: React.FC<PatientFormProps> = ({
  onSuccess,
  onCancel,
  initialData,
  patientId,
  readonly: initialReadonly = false
}) => {
  const navigate = useNavigate();
  const { id: paramId } = useParams<{ id: string }>();
  const { createPatientAsync, updatePatientAsync } = usePatients();
  const { clinicId } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(!initialReadonly);

  // A prop tem prioridade sobre a URL
  const activeId = patientId || paramId;
  const isEditMode = !!activeId && activeId !== 'new';

  const [formData, setFormData] = useState<Partial<Patient>>({
    clinical_status: "Em Tratamento",
    gender: "Não Informado",
    marital_status: "SINGLE",
    contact_preference: "WHATSAPP",
    patient_score: "STANDARD",
    sentiment_status: "NEUTRAL",
    is_active: true,
    bad_debtor: false,
    ...initialData
  });

  // Duplicity Radar State
  const [possibleDuplicates, setPossibleDuplicates] = useState<Partial<Patient>[]>([]);
  const [showPinModal, setShowPinModal] = useState(false);
  const [isOverrideAuthorized, setIsOverrideAuthorized] = useState(false);

  // Load patient data if in edit mode
  useEffect(() => {
    const isValidId = activeId && activeId !== ":id" && /^[0-9a-fA-F-]{36}$/.test(activeId);

    if (isEditMode && isValidId && !initialData) {
      setLoading(true);
      supabase
        .from("patients")
        .select("*")
        .eq("id", activeId)
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
  }, [activeId, isEditMode, initialData]);

  // Radar de Duplicidade: Monitoramento em Tempo Real
  useEffect(() => {
    if (!formData.name || formData.name.length < 3 || isOverrideAuthorized || isEditMode || !isEditing) {
      setPossibleDuplicates([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("id, name, cpf, phone")
        .ilike("name", `%${formData.name}%`)
        .limit(5);

      if (data && data.length > 0) {
        setPossibleDuplicates(data);
      } else {
        setPossibleDuplicates([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [formData.name, isOverrideAuthorized, isEditMode, isEditing]);

  const handleSelectDuplicate = (patient: Partial<Patient>) => {
    if (confirm(`Deseja carregar os dados de ${patient.name}?`)) {
      setFormData(prev => ({
        ...prev,
        ...patient,
      }));
      setPossibleDuplicates([]);
      toast.success('Dados carregados!');
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (error && (name === "name" || name === "phone")) {
      setError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 🛡️ SESSÃO BLINDADA: Validação Crítica de Segurança
    if (!clinicId) {
      toast.error("Erro Crítico de Segurança: Identificação da clínica não encontrada. Por favor, faça login novamente.");
      setError("Erro de Sessão: clinic_id ausente. Recarregue a página.");
      return;
    }

    if (!formData.name || !formData.phone) {
      setError("Nome completo e Telefone são obrigatórios.");
      document.getElementById('main-content')?.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // TRAVA DE SEGURANÇA: Bloqueio de Duplicidade
    if (possibleDuplicates.length > 0 && !isOverrideAuthorized && !isEditMode) {
      setShowPinModal(true);
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
      rg: formData.rg || null,
      birth_date: formData.birth_date || null,
      gender: formData.gender || null,
      address: compositeAddress || null,
      clinical_status: formData.clinical_status || "Em Tratamento",

      // Endereço Detalhado
      zip_code: formData.zip_code || null,
      street: formData.street || null,
      number: formData.number || null,
      complement: formData.complement || null,
      neighborhood: formData.neighborhood || null,
      city: formData.city || null,
      state: formData.state || null,

      // Contato
      contact_preference: formData.contact_preference || "WHATSAPP",
      origin: formData.origin || "Instagram",

      // Perfil Social & Profissional
      nickname: formData.nickname || null,
      occupation: formData.occupation || null,
      instagram_handle: formData.instagram_handle || null,
      marital_status: formData.marital_status || null,
      wedding_anniversary: formData.wedding_anniversary || null,
      indication_patient_id: formData.indication_patient_id || null,

      // Classificação (apenas em edição)
      patient_score: formData.patient_score || "STANDARD",
      sentiment_status: formData.sentiment_status || "NEUTRAL",
      is_active: formData.is_active !== undefined ? formData.is_active : true,
      bad_debtor: formData.bad_debtor || false,

      // Notas
      vip_notes: formData.vip_notes || null,
    };

    setError("");

    try {
      let resultId = activeId;

      if (isEditMode && activeId) {
        await updatePatientAsync({ id: activeId, data: newPatient });
        resultId = activeId;
        toast.success("Dados atualizados com sucesso!");
        setIsEditing(false); // Volta para modo visualização
      } else {
        const createdPatient = await createPatientAsync(newPatient);
        resultId = createdPatient?.id;
        toast.success("Paciente cadastrado com sucesso!");
      }

      // Handle Success / Navigation
      if (onSuccess) {
        onSuccess(resultId || 'new-id');
      } else {
        if (isEditMode && activeId) {
          setTimeout(() => navigate(`/patients/${activeId}`), 500);
        } else {
          setTimeout(() => navigate("/patients"), 500);
        }
      }
    } catch (e) {
      console.error(e);
      setError("Erro ao salvar paciente.");
      toast.error("Erro ao salvar paciente.");
    }
  };

  // Estilos profissionais
  const inputClass = "w-full bg-white dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-300 dark:border-slate-600 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all";
  const labelClass = "block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide";
  const valueClass = "text-sm font-medium text-gray-900 dark:text-white";
  const sectionClass = "bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6 shadow-sm";
  const sectionTitleClass = "text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-gray-200 dark:border-slate-700 pb-2";

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto pb-24 animate-in fade-in duration-500">
        {/* Skeleton Header */}
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 py-4 border-b border-gray-200 dark:border-slate-800 sticky top-0 bg-gray-50 dark:bg-slate-900 z-20">
          <div className="flex items-center gap-4 w-full">
            <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-slate-800 animate-pulse shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-8 w-48 bg-gray-200 dark:bg-slate-800 rounded animate-pulse" />
              <div className="h-4 w-64 bg-gray-200 dark:bg-slate-800 rounded animate-pulse" />
            </div>
          </div>
        </div>

        {/* Skeleton Form Sections */}
        <div className="space-y-6">
          {[1, 2, 3].map((section) => (
            <div key={section} className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6 border-b border-gray-200 dark:border-slate-700 pb-2">
                <div className="w-5 h-5 rounded bg-gray-200 dark:bg-slate-800 animate-pulse" />
                <div className="h-5 w-40 bg-gray-200 dark:bg-slate-800 rounded animate-pulse" />
              </div>
              <div className="grid grid-cols-12 gap-4">
                {/* Mimic inputs grid */}
                <div className="col-span-12 h-11 bg-gray-100 dark:bg-slate-700/50 rounded animate-pulse" />
                <div className="col-span-12 md:col-span-6 h-11 bg-gray-100 dark:bg-slate-700/50 rounded animate-pulse" />
                <div className="col-span-12 md:col-span-6 h-11 bg-gray-100 dark:bg-slate-700/50 rounded animate-pulse" />
                <div className="col-span-12 md:col-span-4 h-11 bg-gray-100 dark:bg-slate-700/50 rounded animate-pulse" />
                <div className="col-span-12 md:col-span-8 h-11 bg-gray-100 dark:bg-slate-700/50 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>

        {/* Loading Text Hint - Optional but elegant */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/80 dark:bg-slate-800/80 backdrop-blur px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 shadow-lg flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" />
          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Carregando prontuário...</span>
        </div>
      </div>
    );
  }

  // Componente auxiliar para renderizar campo
  const Field = ({ label, value, name, type = "text", options, required = false }: any) => (
    <div>
      <label className={labelClass}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {isEditing ? (
        options ? (
          <select
            name={name}
            value={value || ""}
            className={inputClass}
            onChange={handleChange}
          >
            {options.map((opt: any) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        ) : type === "textarea" ? (
          <textarea
            name={name}
            value={value || ""}
            className={`${inputClass} resize-none`}
            rows={3}
            onChange={handleChange}
          />
        ) : (
          <input
            name={name}
            value={value || ""}
            type={type}
            className={inputClass}
            onChange={handleChange}
            required={required}
          />
        )
      ) : (
        <p className={valueClass}>{value || 'Não informado'}</p>
      )}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto pb-24">
      {/* Security Pin Modal */}
      <SecurityPinModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSuccess={() => {
          setIsOverrideAuthorized(true);
          setShowPinModal(false);
          handleSubmit(new Event('submit') as any);
        }}
        title="Autorização Necessária"
        message="Possíveis duplicidades detectadas. Digite o PIN de segurança para prosseguir."
      />

      {/* Header - Apenas se não estiver em modo readonly inicial */}
      {!initialReadonly && (
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sticky top-0 z-20 bg-gray-50 dark:bg-slate-900 py-4 border-b border-gray-200 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onCancel ? onCancel() : navigate(-1)}
              className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg text-gray-600 dark:text-gray-400 transition-colors border border-gray-200 dark:border-slate-700"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {isEditMode ? "Editar Paciente" : "Novo Paciente"}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isEditMode ? "Atualize os dados cadastrais" : "Preencha os campos obrigatórios (*)"}
              </p>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-semibold shadow-md transition-all active:scale-95"
          >
            <Save size={18} />
            Salvar Cadastro
          </button>
        </div>
      )}

      {/* Botão de Editar/Cancelar quando em modo readonly */}
      {initialReadonly && (
        <div className="mb-6 flex justify-end">
          {isEditing ? (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setIsEditing(false);
                  if (initialData) setFormData(initialData);
                }}
                className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-all"
              >
                <X size={16} />
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold shadow-md transition-all"
              >
                <Save size={18} />
                Salvar Alterações
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold shadow-md transition-all"
            >
              <Edit2 size={16} />
              Editar Ficha
            </button>
          )}
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-4 rounded-lg mb-6 flex items-center gap-3">
          <AlertCircle size={20} />
          <span className="font-medium">{error}</span>
        </div>
      )}

      <form className="space-y-6" onSubmit={handleSubmit}>
        {/* 1. IDENTIFICAÇÃO CIVIL */}
        <div className={sectionClass}>
          <h3 className={sectionTitleClass}>
            <User size={16} className="text-blue-600" />
            Identificação Civil
          </h3>
          <div className="grid grid-cols-12 gap-4">
            {/* Nome Completo - 12 cols */}
            <div className="col-span-12">
              <label className={labelClass}>
                Nome Completo <span className="text-red-500">*</span>
              </label>
              {isEditing ? (
                <>
                  <input
                    name="name"
                    value={formData.name || ""}
                    className={inputClass}
                    placeholder="Nome completo do paciente"
                    onChange={handleChange}
                    required
                  />
                  {/* RADAR DE DUPLICIDADE */}
                  {possibleDuplicates.length > 0 && !isOverrideAuthorized && (
                    <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
                      <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 font-bold text-xs uppercase mb-2">
                        <AlertTriangle size={14} />
                        Possíveis Duplicidades ({possibleDuplicates.length})
                      </div>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {possibleDuplicates.map(dup => (
                          <div
                            key={dup.id}
                            onClick={() => handleSelectDuplicate(dup)}
                            className="text-xs text-amber-900 dark:text-amber-100 bg-amber-100/50 dark:bg-amber-800/30 p-2 rounded flex justify-between items-center cursor-pointer hover:bg-amber-200 dark:hover:bg-amber-700/50 transition-colors"
                          >
                            <span className="font-medium">{dup.name}</span>
                            <span className="opacity-75">{dup.phone || dup.cpf || 'Sem contato'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className={valueClass}>{formData.name || 'Não informado'}</p>
              )}
            </div>

            {/* CPF - 3 cols */}
            <div className="col-span-12 md:col-span-3">
              <Field label="CPF" value={formData.cpf} name="cpf" />
            </div>

            {/* RG - 3 cols */}
            <div className="col-span-12 md:col-span-3">
              <Field label="RG / Identidade" value={formData.rg} name="rg" />
            </div>

            {/* Data de Nascimento - 3 cols */}
            <div className="col-span-12 md:col-span-3">
              <Field label="Data de Nascimento" value={formData.birth_date} name="birth_date" type="date" />
            </div>

            {/* Gênero - 3 cols */}
            <div className="col-span-12 md:col-span-3">
              <Field
                label="Gênero"
                value={formData.gender}
                name="gender"
                options={[
                  { value: "Masculino", label: "Masculino" },
                  { value: "Feminino", label: "Feminino" },
                  { value: "Outro", label: "Outro" },
                  { value: "Não Informado", label: "Não Informado" }
                ]}
              />
            </div>

            {/* Estado Civil - 6 cols */}
            <div className="col-span-12 md:col-span-6">
              <Field
                label="Estado Civil"
                value={formData.marital_status}
                name="marital_status"
                options={[
                  { value: "SINGLE", label: "Solteiro(a)" },
                  { value: "MARRIED", label: "Casado(a)" },
                  { value: "DIVORCED", label: "Divorciado(a)" },
                  { value: "WIDOWED", label: "Viúvo(a)" },
                  { value: "OTHER", label: "Outro" }
                ]}
              />
            </div>

            {/* Profissão - 6 cols */}
            <div className="col-span-12 md:col-span-6">
              <Field label="Profissão" value={formData.occupation} name="occupation" />
            </div>
          </div>
        </div>

        {/* 2. CONTATO */}
        <div className={sectionClass}>
          <h3 className={sectionTitleClass}>
            <Phone size={16} className="text-green-600" />
            Informações de Contato
          </h3>
          <div className="grid grid-cols-12 gap-4">
            {/* Telefone/WhatsApp - 6 cols */}
            <div className="col-span-12 md:col-span-6">
              <Field
                label="Celular / WhatsApp"
                value={formData.phone}
                name="phone"
                type="tel"
                required
              />
            </div>

            {/* Email - 6 cols */}
            <div className="col-span-12 md:col-span-6">
              <Field label="Email" value={formData.email} name="email" type="email" />
            </div>

            {/* Preferência de Contato - 6 cols */}
            <div className="col-span-12 md:col-span-6">
              <Field
                label="Preferência de Contato"
                value={formData.contact_preference}
                name="contact_preference"
                options={[
                  { value: "WHATSAPP", label: "WhatsApp" },
                  { value: "PHONE", label: "Ligação" },
                  { value: "EMAIL", label: "Email" },
                  { value: "SMS", label: "SMS" }
                ]}
              />
            </div>

            {/* Origem/Marketing - 6 cols */}
            <div className="col-span-12 md:col-span-6">
              <Field
                label="Como Conheceu a Clínica"
                value={formData.origin}
                name="origin"
                options={[
                  { value: "Instagram", label: "Instagram" },
                  { value: "Google Ads", label: "Google Ads" },
                  { value: "Indicação", label: "Indicação" },
                  { value: "Facebook", label: "Facebook" },
                  { value: "Orgânico", label: "Orgânico" },
                  { value: "WhatsApp", label: "WhatsApp" },
                  { value: "Outro", label: "Outro" }
                ]}
              />
            </div>
          </div>
        </div>

        {/* 3. LOGRADOURO (ENDEREÇO) */}
        <div className={sectionClass}>
          <h3 className={sectionTitleClass}>
            <MapPin size={16} className="text-purple-600" />
            Logradouro
          </h3>
          <div className="grid grid-cols-12 gap-4">
            {/* CEP - 3 cols */}
            <div className="col-span-12 md:col-span-3">
              <Field label="CEP" value={formData.zip_code} name="zip_code" />
            </div>

            {/* Logradouro - 7 cols */}
            <div className="col-span-12 md:col-span-7">
              <Field label="Rua / Avenida" value={formData.street} name="street" />
            </div>

            {/* Número - 2 cols */}
            <div className="col-span-12 md:col-span-2">
              <Field label="Número" value={formData.number} name="number" />
            </div>

            {/* Complemento - 4 cols */}
            <div className="col-span-12 md:col-span-4">
              <Field label="Complemento" value={formData.complement} name="complement" />
            </div>

            {/* Bairro - 4 cols */}
            <div className="col-span-12 md:col-span-4">
              <Field label="Bairro" value={formData.neighborhood} name="neighborhood" />
            </div>

            {/* Cidade - 3 cols */}
            <div className="col-span-12 md:col-span-3">
              <Field label="Cidade" value={formData.city} name="city" />
            </div>

            {/* UF - 1 col */}
            <div className="col-span-12 md:col-span-1">
              <Field label="UF" value={formData.state} name="state" />
            </div>
          </div>
        </div>

        {/* 4. PERFIL PROFISSIONAL E SOCIAL */}
        <div className={sectionClass}>
          <h3 className={sectionTitleClass}>
            <FileText size={16} className="text-indigo-600" />
            Perfil Profissional e Social
          </h3>
          <div className="grid grid-cols-12 gap-4">
            {/* Apelido - 6 cols */}
            <div className="col-span-12 md:col-span-6">
              <Field label="Apelido / Como Chamar" value={formData.nickname} name="nickname" />
            </div>

            {/* Instagram - 6 cols */}
            <div className="col-span-12 md:col-span-6">
              <Field label="Instagram" value={formData.instagram_handle} name="instagram_handle" />
            </div>

            {/* Observações Gerais - 12 cols */}
            <div className="col-span-12">
              <Field
                label="Observações Gerais"
                value={formData.vip_notes}
                name="vip_notes"
                type="textarea"
              />
            </div>
          </div>
        </div>

        {/* 5. CLASSIFICAÇÃO (Apenas em Edição) */}
        {isEditMode && (
          <div className={sectionClass}>
            <h3 className={sectionTitleClass}>
              <Shield size={16} className="text-orange-600" />
              Classificação e Status
            </h3>
            <div className="grid grid-cols-12 gap-4">
              {/* Score - 3 cols */}
              <div className="col-span-12 md:col-span-3">
                <Field
                  label="Classificação"
                  value={formData.patient_score}
                  name="patient_score"
                  options={[
                    { value: "DIAMOND", label: "💎 DIAMOND" },
                    { value: "GOLD", label: "🥇 GOLD" },
                    { value: "STANDARD", label: "⭐ STANDARD" },
                    { value: "RISK", label: "⚠️ RISK" },
                    { value: "BLACKLIST", label: "🚫 BLACKLIST" }
                  ]}
                />
              </div>

              {/* Sentimento - 3 cols */}
              <div className="col-span-12 md:col-span-3">
                <Field
                  label="Status de Sentimento"
                  value={formData.sentiment_status}
                  name="sentiment_status"
                  options={[
                    { value: "VERY_HAPPY", label: "😄 Muito Satisfeito" },
                    { value: "HAPPY", label: "😊 Satisfeito" },
                    { value: "NEUTRAL", label: "😐 Neutro" },
                    { value: "UNHAPPY", label: "😟 Insatisfeito" },
                    { value: "COMPLAINING", label: "😡 Reclamando" }
                  ]}
                />
              </div>

              {/* Ativo - 3 cols */}
              <div className="col-span-12 md:col-span-3">
                <Field
                  label="Status"
                  value={String(formData.is_active !== undefined ? formData.is_active : true)}
                  name="is_active"
                  options={[
                    { value: "true", label: "✅ Ativo" },
                    { value: "false", label: "❌ Inativo" }
                  ]}
                />
              </div>

              {/* Inadimplente - 3 cols */}
              <div className="col-span-12 md:col-span-3">
                <Field
                  label="Inadimplente"
                  value={String(formData.bad_debtor || false)}
                  name="bad_debtor"
                  options={[
                    { value: "false", label: "Não" },
                    { value: "true", label: "Sim" }
                  ]}
                />
              </div>
            </div>
          </div>
        )}
      </form>

      {/* Sticky Footer com Botão de Salvar (apenas mobile e se não for readonly) */}
      {!initialReadonly && (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 p-4 pb-[max(16px,env(safe-area-inset-bottom))] shadow-lg z-30 md:hidden">
          <button
            onClick={handleSubmit}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold shadow-md transition-all active:scale-95"
          >
            <Save size={20} />
            Salvar Cadastro
          </button>
        </div>
      )}
    </div>
  );
};

export default PatientForm;
