import React, { useState, useEffect } from 'react';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { X, Printer, FileText, Download, Wand2, Loader } from 'lucide-react';
import { generateDocumentContent } from '../../utils/documentEngine';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    budget: any;
    patient: any;
    items: any[];
    professional: any;
}

export const DocumentGeneratorModal: React.FC<Props> = ({ isOpen, onClose, budget, patient, items, professional }) => {
    const { profile } = useAuth();
    const [templates, setTemplates] = useState<any[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [installing, setInstalling] = useState(false);

    useEffect(() => {
        if (isOpen && profile?.clinic_id) {
            fetchTemplates();
        }
    }, [isOpen, profile]);

    const fetchTemplates = async () => {
        setLoading(true);
        const { data } = await supabase.from('document_templates').select('*').eq('clinic_id', profile!.clinic_id);
        setTemplates(data || []);
        setLoading(false);
    };

    const installDefaults = async () => {
        setInstalling(true);
        const defaults = [
            {
                clinic_id: profile!.clinic_id,
                name: 'TCLE - Cirurgia Facial (High Ticket)',
                type: 'CONSENT',
                content: `<h2 style="text-align: center; font-family: sans-serif;">TERMO DE CONSENTIMENTO LIVRE E ESCLARECIDO</h2><h3 style="text-align: center; font-family: sans-serif;">CIRURGIA FACIAL</h3><p><br></p><p>Eu, <strong>{{paciente_nome}}</strong>, CPF nº {{paciente_cpf}}, autorizo o Dr(a). <strong>{{profissional_nome}}</strong> a realizar a cirurgia de <strong>{{procedimento_nome}}</strong>.</p><p>Declaro estar ciente de que a cirurgia é uma obrigação de meio, não de fim, e que intercorrências biológicas inerentes à resposta do meu organismo podem ocorrer, tais como edema, hematomas e assimetrias transitórias.</p><p>Comprometo-me a seguir rigorosamente o repouso indicado e o protocolo pós-operatório prescrito.</p><p>Local e Data: {{cidade_clinica}}, {{data_atual}}</p><p><br><br><br>__________________________________________<br>Assinatura do Paciente</p>`
            },
            {
                clinic_id: profile!.clinic_id,
                name: 'Contrato de Prestação de Serviços',
                type: 'CONTRACT',
                content: `<h2 style="text-align: center; font-family: sans-serif;">CONTRATO DE PRESTAÇÃO DE SERVIÇOS ODONTOLÓGICOS</h2><p><br></p><p><strong>CONTRATANTE:</strong> {{paciente_nome}}, CPF {{paciente_cpf}}.</p><p><strong>CONTRATADA:</strong> {{clinica_nome}}, {{cidade_clinica}}.</p><p><strong>OBJETO:</strong> O presente contrato tem por objeto a prestação dos serviços odontológicos descritos abaixo:</p><ul>{{procedimentos_lista_li}}</ul><p><strong>VALOR E PAGAMENTO:</strong> Pelo serviços, o contratante pagará o valor total de <strong>{{valor_total}}</strong>, na forma de {{forma_pagamento}}.</p><p>Local e Data: {{cidade_clinica}}, {{data_atual}}</p><div style="display: flex; justify-content: space-between; margin-top: 80px; font-family: sans-serif;"><div style="text-align: center;">____________________________<br>CONTRATANTE</div><div style="text-align: center;">____________________________<br>{{profissional_nome}}<br>CONTRATADA</div></div>`
            }
        ];
        await supabase.from('document_templates').insert(defaults);
        await fetchTemplates();
        setInstalling(false);
    };

    useEffect(() => {
        if (selectedTemplateId && templates.length > 0) {
            const tmpl = templates.find(t => t.id === selectedTemplateId);
            if (tmpl) {
                const generated = generateDocumentContent(tmpl.content, {
                    patientName: patient?.name,
                    patientCpf: patient?.cpf,
                    professionalName: professional?.name,
                    clinicName: 'Clinic Pro', // TODO: Fetch from clinic settings
                    clinicCnpj: '',
                    clinicCity: patient?.address ? patient.address.split(',')[0] : 'Cidade',
                    totalValue: budget?.final_value?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                    paymentMethod: budget?.payment_config?.method,
                    items: items.map(i => ({ name: i.procedure_name || i.procedure, quantity: i.quantity })),
                    procedureName: items.length > 0 ? (items[0].procedure_name || items[0].procedure) : 'Procedimento'
                });
                setContent(generated);
            }
        } else {
            setContent('');
        }
    }, [selectedTemplateId, templates, budget, patient, items, professional]);

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
            <html>
              <head>
                <title>Imprimir Documento</title>
                <style>
                  body { font-family: 'Times New Roman', serif; padding: 40px; line-height: 1.6; }
                  h2, h3 { font-family: Arial, sans-serif; }
                </style>
              </head>
              <body>
                ${content}
                <script>
                  window.onload = function() { window.print(); }
                </script>
              </body>
            </html>
          `);
            printWindow.document.close();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white dark:bg-slate-800 w-full max-w-5xl h-[85vh] rounded-xl shadow-2xl flex flex-col md:flex-row overflow-hidden border border-gray-200 dark:border-slate-700">

                {/* Sidebar Config */}
                <div className="w-full md:w-80 bg-gray-50 dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700 p-6 flex flex-col gap-6">
                    <div className="flex justify-between items-center">
                        <h2 className="font-bold text-lg text-gray-800 dark:text-white flex items-center gap-2">
                            <FileText className="text-blue-600" /> Documentos
                        </h2>
                        <button onClick={onClose} className="md:hidden"><X size={24} /></button>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Modelo</label>
                        <select
                            className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
                            value={selectedTemplateId}
                            onChange={e => setSelectedTemplateId(e.target.value)}
                        >
                            <option value="">Selecione um modelo...</option>
                            {templates.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </div>

                    {templates.length === 0 && !loading && (
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-700 dark:text-blue-300">
                            <p className="mb-3">Nenhum modelo encontrado.</p>
                            <button
                                onClick={installDefaults}
                                disabled={installing}
                                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-colors text-xs"
                            >
                                {installing ? <Loader className="animate-spin" size={14} /> : <Wand2 size={14} />}
                                Instalar Padrões (BOS)
                            </button>
                        </div>
                    )}

                    <div className="mt-auto space-y-3">
                        <button
                            onClick={handlePrint}
                            disabled={!content}
                            className="w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                            <Printer size={18} /> Imprimir / PDF
                        </button>
                    </div>
                </div>

                {/* Preview Area */}
                <div className="flex-1 bg-gray-100 dark:bg-slate-950 p-8 overflow-y-auto relative">
                    <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm hover:bg-gray-100 hidden md:block">
                        <X size={20} className="text-gray-500" />
                    </button>

                    <div className="max-w-3xl mx-auto bg-white min-h-[800px] shadow-sm p-12 text-gray-800 page-paper">
                        {content ? (
                            <div dangerouslySetInnerHTML={{ __html: content }} className="prose max-w-none" />
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
                                <FileText size={48} className="mb-4" />
                                <p>Selecione um modelo para visualizar</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
