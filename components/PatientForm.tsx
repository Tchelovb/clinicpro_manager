import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePatients } from "../hooks/usePatients";
import { Patient } from "../types";
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
  const { createPatient } = usePatients();
  const [error, setError] = useState("");

  const [formData, setFormData] = useState<Partial<Patient>>({
    status: "Em Orçamento",
    gender: "Não Informado",
    civilStatus: "Solteiro(a)",
    contactPreference: "WhatsApp",
    insurance: "Particular",
  });

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
      birth_date: formData.birthDate || null,
      gender: formData.gender || null,
      address: compositeAddress || null,
      status: "Em Tratamento",
      total_approved: 0,
      total_paid: 0,
      balance_due: 0,
    };

    createPatient(newPatient);
    navigate("/patients");
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
              Novo Paciente
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Preencha os dados obrigatórios (*).
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
                type="tel"
                className={inputClass}
                placeholder="(00) 90000-0000"
                onChange={handleChange}
              />
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
                <label className={labelClass}>RG</label>
                <input
                  name="rg"
                  className={inputClass}
                  placeholder="00.000.000-0"
                  onChange={handleChange}
                />
              </div>

              {/* Nascimento (7) / Gênero (5) */}
              <div className="col-span-1 md:col-span-7">
                <label className={labelClass}>Data de Nascimento</label>
                <input
                  name="birthDate"
                  type="date"
                  className={inputClass}
                  onChange={handleChange}
                />
              </div>
              <div className="col-span-1 md:col-span-5">
                <label className={labelClass}>Gênero</label>
                <select
                  name="gender"
                  className={inputClass}
                  onChange={handleChange}
                  defaultValue="Não Informado"
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
                  name="civilStatus"
                  className={inputClass}
                  onChange={handleChange}
                  defaultValue="Solteiro(a)"
                >
                  <option>Solteiro(a)</option>
                  <option>Casado(a)</option>
                  <option>Divorciado(a)</option>
                  <option>Viúvo(a)</option>
                </select>
              </div>
              <div className="col-span-1 md:col-span-7">
                <label className={labelClass}>Profissão</label>
                <input
                  name="profession"
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
                  type="email"
                  className={inputClass}
                  placeholder="cliente@email.com"
                  onChange={handleChange}
                />
              </div>
              <div className="col-span-1 md:col-span-4">
                <label className={labelClass}>Pref. Contato</label>
                <select
                  name="contactPreference"
                  className={inputClass}
                  onChange={handleChange}
                  defaultValue="WhatsApp"
                >
                  <option>WhatsApp</option>
                  <option>Ligação</option>
                  <option>Email</option>
                </select>
              </div>

              {/* CEP (4) / Rua (8) */}
              <div className="col-span-1 md:col-span-4">
                <label className={labelClass}>CEP</label>
                <input
                  name="zipCode"
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
                  className={inputClass}
                  placeholder="Rua / Av."
                  onChange={handleChange}
                />
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className={labelClass}>Número</label>
                <input
                  name="number"
                  className={inputClass}
                  placeholder="123"
                  onChange={handleChange}
                />
              </div>
              <div className="col-span-1 md:col-span-4">
                <label className={labelClass}>Complemento</label>
                <input
                  name="complement"
                  className={inputClass}
                  placeholder="Apto 101"
                  onChange={handleChange}
                />
              </div>
              <div className="col-span-1 md:col-span-6">
                <label className={labelClass}>Bairro</label>
                <input
                  name="neighborhood"
                  className={inputClass}
                  placeholder="Bairro"
                  onChange={handleChange}
                />
              </div>

              <div className="col-span-1 md:col-span-9">
                <label className={labelClass}>Cidade</label>
                <input
                  name="city"
                  className={inputClass}
                  placeholder="Cidade"
                  onChange={handleChange}
                />
              </div>
              <div className="col-span-1 md:col-span-3">
                <label className={labelClass}>UF</label>
                <input
                  name="state"
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
    </div>
  );
};

export default PatientForm;
