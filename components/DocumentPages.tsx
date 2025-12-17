
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { DocumentTemplate } from '../types';
import { ArrowLeft, Save, Printer, Download, X, CheckCircle, User, PenTool } from 'lucide-react';

const inputClass = "w-full bg-white text-gray-900 border border-gray-200 rounded-lg p-3 md:p-2.5 text-base md:text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all shadow-input";
const labelClass = "block text-xs font-bold text-gray-500 mb-1.5 uppercase";

export const DocumentTemplateForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addTemplate, updateTemplate, templates } = useData();
  const existingTemplate = id ? templates.find(t => t.id === id) : null;
  const [formData, setFormData] = useState<Partial<DocumentTemplate>>(existingTemplate || { type: 'Outro' });

  const handleSave = () => {
      if (formData.name && formData.content) {
          if (existingTemplate && id) {
              updateTemplate(id, formData);
          } else {
              addTemplate({
                  id: Math.random().toString(36).substr(2, 5),
                  name: formData.name,
                  type: formData.type || 'Outro',
                  content: formData.content,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
              });
          }
          navigate('/documents');
      }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-6rem)] flex flex-col animate-in fade-in pb-20 md:pb-0">
        <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/documents')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-500 dark:text-gray-400 transition-colors"><ArrowLeft size={20} /></button>
                <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white line-clamp-1">{existingTemplate ? 'Editar Modelo' : 'Novo Modelo'}</h1>
            </div>
            <button onClick={handleSave} className="px-4 md:px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2 font-bold shadow-sm transition-colors text-sm md:text-base">
                <Save size={18}/> <span className="hidden md:inline">Salvar</span>
            </button>
        </div>
        <div className="bg-white rounded-xl shadow-card border border-gray-200 flex flex-col flex-1 overflow-hidden">
            <div className="p-4 md:p-6 border-b border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 bg-gray-50">
                <div>
                    <label className={labelClass}>Nome do Modelo</label>
                    <input className={inputClass} value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: Atestado Padrão" />
                </div>
                <div>
                    <label className={labelClass}>Tipo</label>
                    <select className={inputClass} value={formData.type || 'Outro'} onChange={e => setFormData({...formData, type: e.target.value as any})}>
                        <option value="Contrato">Contrato</option>
                        <option value="Atestado">Atestado</option>
                        <option value="TCLE">TCLE</option>
                        <option value="Receita">Receita</option>
                        <option value="Anamnese">Anamnese</option>
                        <option value="Outro">Outro</option>
                    </select>
                </div>
            </div>
            <div className="flex-1 flex flex-col relative">
                <div className="bg-blue-50 px-4 py-2 text-xs text-blue-700 border-b border-blue-100 flex gap-2 overflow-x-auto whitespace-nowrap">
                    <strong>Variáveis:</strong> {'{{paciente}} {{cpf}} {{nascimento}} {{endereco}} {{telefone}} {{doutor}} {{clinica}} {{cnpj}} {{data}}'}
                </div>
                <textarea 
                    className="flex-1 w-full p-6 font-mono text-sm leading-relaxed resize-none focus:outline-none bg-white text-gray-900"
                    value={formData.content || ''}
                    onChange={e => setFormData({...formData, content: e.target.value})}
                    placeholder="Digite o texto do documento aqui..."
                />
            </div>
        </div>
    </div>
  );
};

export const DocumentViewer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { documents, signDocument, clinicConfig } = useData();
  const doc = documents.find(d => d.id === id);

  if (!doc) return <div className="p-8 text-center text-gray-500">Documento não encontrado.</div>;

  const handlePrint = () => window.print();

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-6rem)] flex flex-col animate-in fade-in pb-20 md:pb-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm shrink-0">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500 dark:text-gray-400"><ArrowLeft size={20}/></button>
                <div>
                    <h1 className="text-lg md:text-xl font-bold text-gray-800 dark:text-white line-clamp-1">{doc.title}</h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex flex-wrap items-center gap-2">
                        <User size={12}/> {doc.patientName} • {new Date(doc.createdAt).toLocaleDateString()}
                        {doc.status === 'Assinado' && <span className="text-green-600 font-bold flex items-center gap-1 ml-2 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-full"><CheckCircle size={10}/> Assinado</span>}
                    </p>
                </div>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
                {doc.status !== 'Assinado' && (
                    <button onClick={() => signDocument(doc.id)} className="flex-1 md:flex-none px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold text-sm flex items-center justify-center gap-2"><PenTool size={16}/> Assinar</button>
                )}
                <button onClick={handlePrint} className="flex-1 md:flex-none p-2.5 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300 flex justify-center items-center"><Printer size={20}/></button>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-gray-100 dark:bg-slate-900/50 p-0 md:p-8 rounded-xl border border-gray-200 dark:border-slate-800 shadow-inner">
            <div className="max-w-3xl mx-auto bg-white shadow-lg p-6 md:p-12 min-h-[calc(100%-2rem)] md:min-h-[29.7cm] text-gray-800 leading-7 font-serif relative text-sm md:text-base">
                <div className="flex items-center gap-4 border-b-2 border-blue-900 pb-6 mb-8">
                    <div className="w-12 h-12 bg-blue-900 text-white flex items-center justify-center font-bold text-xl rounded">CP</div>
                    <div>
                        <h1 className="text-lg md:text-xl font-bold text-blue-900 uppercase tracking-wide">{clinicConfig.name}</h1>
                        <p className="text-xs text-gray-500">{clinicConfig.address} • {clinicConfig.phone}</p>
                    </div>
                </div>
                <div className="whitespace-pre-wrap">{doc.content}</div>
                {doc.status === 'Assinado' && (
                    <div className="mt-20 pt-8 border-t border-gray-300 text-center w-full md:w-64 mx-auto">
                        <div className="font-script text-2xl text-blue-800 mb-2 font-cursive">Assinado Digitalmente</div>
                        <p className="font-bold text-gray-800 text-sm">{doc.patientName}</p>
                        <p className="text-xs text-gray-400">Em {doc.signedAt && new Date(doc.signedAt).toLocaleString()}</p>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};
