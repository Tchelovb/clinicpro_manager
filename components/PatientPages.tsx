import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useData } from "../contexts/DataContext";
import { ClinicalDocument, ClinicalNote } from "../types";
import { ArrowLeft, Save, FileText, CheckCircle } from "lucide-react";

export const PatientNoteForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addClinicalNote, patients } = useData();
  const patient = patients.find((p) => p.id === id);
  const [content, setContent] = useState("");

  if (!patient) return <div>Paciente não encontrado</div>;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    addClinicalNote(patient.id, {
      id: Math.random().toString(36).substr(2, 5),
      date: new Date().toLocaleDateString("pt-BR"),
      doctorName: "Dr. Logado",
      type: "Evolução",
      content: content,
    });
    navigate(`/patients/${patient.id}`);
  };

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(`/patients/${patient.id}`)}
          className="p-2 hover:bg-gray-100 rounded-full text-gray-500"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">
          Nova Evolução Clínica
        </h1>
      </div>
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-xl shadow-sm border border-gray-200"
      >
        <div className="mb-4">
          <p className="font-bold text-gray-700">{patient.name}</p>
          <p className="text-sm text-gray-500">
            Data: {new Date().toLocaleDateString()}
          </p>
        </div>
        <textarea
          className="w-full h-64 border border-gray-300 rounded-lg p-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
          placeholder="Descreva o procedimento realizado, queixas ou observações..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          autoFocus
        />
        <div className="flex justify-end mt-6">
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700"
          >
            <Save size={18} /> Salvar Evolução
          </button>
        </div>
      </form>
    </div>
  );
};

export const PatientDocumentForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { createDocument, templates, patients, clinicConfig } = useData();
  const patient = patients.find((p) => p.id === id);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");

  if (!patient) return <div>Paciente não encontrado</div>;

  const handleGenerate = () => {
    const template = templates.find((t) => t.id === selectedTemplateId);
    if (template) {
      let content = template.content
        .replace(/{{paciente}}/g, patient.name)
        .replace(/{{cpf}}/g, patient.cpf)
        .replace(/{{doutor}}/g, patient.responsibleDoctor || "Dr. Logado")
        .replace(/{{clinica}}/g, clinicConfig.name)
        .replace(/{{cnpj}}/g, clinicConfig.cnpj)
        .replace(/{{data}}/g, new Date().toLocaleDateString("pt-BR"));

      const newDoc: ClinicalDocument = {
        id: Math.random().toString(36).substr(2, 5),
        patientId: patient.id,
        patientName: patient.name,
        type: template.type,
        title: `${template.name}`,
        content: content,
        status: "Rascunho",
        createdAt: new Date().toISOString(),
        templateId: template.id,
      };
      createDocument(newDoc);
      navigate(`/documents/${newDoc.id}`); // Go to viewer immediately
    }
  };

  return (
    <div className="max-w-xl mx-auto animate-in fade-in">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(`/patients/${patient.id}`)}
          className="p-2 hover:bg-gray-100 rounded-full text-gray-500"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Gerar Documento</h1>
      </div>
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        <label className="block text-sm font-bold text-gray-700 mb-2">
          Selecione o Modelo
        </label>
        <select
          className="w-full border border-gray-300 rounded-lg p-3 text-sm mb-6"
          value={selectedTemplateId}
          onChange={(e) => setSelectedTemplateId(e.target.value)}
        >
          <option value="">Selecione...</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <button
          onClick={handleGenerate}
          disabled={!selectedTemplateId}
          className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50"
        >
          Gerar e Visualizar
        </button>
      </div>
    </div>
  );
};

export const TreatmentConclusionForm: React.FC = () => {
  const { id, treatmentId } = useParams<{ id: string; treatmentId: string }>();
  const navigate = useNavigate();
  const { concludeTreatment, patients } = useData();
  const patient = patients.find((p) => p.id === id);
  const treatment = patient?.treatments?.find((t) => t.id === treatmentId);
  const [note, setNote] = useState("");

  if (!patient || !treatment) return <div>Tratamento não encontrado</div>;

  const handleConfirm = async () => {
    await concludeTreatment(patient.id, treatment.id, note);
    navigate(`/patients/${patient.id}`);
  };

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(`/patients/${patient.id}`)}
          className="p-2 hover:bg-gray-100 rounded-full text-gray-500"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">
          Concluir Procedimento
        </h1>
      </div>
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        <div className="bg-green-50 border border-green-100 p-4 rounded-lg mb-6">
          <p className="font-bold text-green-800">{treatment.procedure}</p>
          <p className="text-sm text-green-700">Região: {treatment.region}</p>
        </div>
        <label className="block text-sm font-bold text-gray-700 mb-2">
          Anotação Clínica (Evolução)
        </label>
        <textarea
          className="w-full h-40 border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-green-500 outline-none resize-none"
          placeholder="Descreva observações sobre o procedimento realizado..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
          <FileText size={12} /> Esta anotação será salva no prontuário.
        </p>
        <div className="flex justify-end mt-6">
          <button
            onClick={handleConfirm}
            className="px-6 py-2 bg-green-600 text-white rounded-lg font-bold flex items-center gap-2 hover:bg-green-700"
          >
            <CheckCircle size={18} /> Confirmar Conclusão
          </button>
        </div>
      </div>
    </div>
  );
};
