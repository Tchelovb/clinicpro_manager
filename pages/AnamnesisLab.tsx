
import React, { useState, useEffect } from 'react';
import { AnamnesisRepository, AnamnesisTemplate } from '../src/services/anamnesis/AnamnesisRepository';
import { AnamnesisForm } from '../components/anamnesis/AnamnesisForm';
import { PatientAnamnesisSummary } from '../components/anamnesis/PatientAnamnesisSummary';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Sparkles, ClipboardList, Printer } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function AnamnesisLab() {
    const { profile } = useAuth();
    const [templates, setTemplates] = useState<AnamnesisTemplate[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<AnamnesisTemplate | null>(null);
    const [activeResponses, setActiveResponses] = useState<Record<string, any>>({});
    const [viewMode, setViewMode] = useState<'LIST' | 'FORM' | 'SUMMARY'>('LIST');

    useEffect(() => {
        // Carrega templates reais
        const load = async () => {
            if (profile?.clinic_id) {
                const data = await AnamnesisRepository.getTemplates(profile.clinic_id);
                setTemplates(data);

                // MOCK SE BANCO ESTIVER VAZIO (Para garantir o teste do usuário agora)
                if (data.length === 0) {
                    setTemplates([
                        {
                            id: 'mock-1',
                            title: 'Anamnese de Estética Facial (Simulação)',
                            type: 'ESTETICA_FACIAL',
                            questions: {
                                secoes: [
                                    {
                                        titulo: 'Estética',
                                        perguntas: [
                                            { id: 'h_1', pergunta: 'Possui alergia?', tipo: 'texto' },
                                            { id: 'h_2', pergunta: 'Tem comorbidades?', tipo: 'selecao_multipla', opcoes: ['Hipertensão', 'Diabetes', 'Cardiopatia', 'Nenhum'] },
                                            { id: 'e_3', pergunta: 'Nota pescoço (1-10)?', tipo: 'escala', min: 1, max: 10 }
                                        ]
                                    }
                                ]
                            }
                        }
                    ]);
                }
            }
        };
        load();
    }, [profile]);

    const handleStart = (template: AnamnesisTemplate) => {
        setSelectedTemplate(template);
        setViewMode('FORM');
    };

    const handleComplete = (responses: Record<string, any>) => {
        setActiveResponses(responses);
        setViewMode('SUMMARY');
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-5xl mx-auto space-y-8">

                <header>
                    <h1 className="text-3xl font-bold text-slate-800 mb-2">Laboratório de Anamnese Elite</h1>
                    <p className="text-slate-500">Teste a coleta de dados, análise de riscos e detecção de oportunidades.</p>
                </header>

                {viewMode === 'LIST' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {templates.map(t => (
                            <Card key={t.id} className="hover:shadow-lg transition-shadow cursor-pointer border-slate-200" onClick={() => handleStart(t)}>
                                <div className="p-6 space-y-4">
                                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                                        <ClipboardList className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-900">{t.title}</h3>
                                        <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">{t.type}</p>
                                    </div>
                                    <Button className="w-full bg-slate-900 text-white hover:bg-slate-800">
                                        Simular Preenchimento
                                    </Button>
                                </div>
                            </Card>
                        ))}
                        {templates.length === 0 && <p>Carregando templates do banco...</p>}
                    </div>
                )}

                {viewMode === 'FORM' && selectedTemplate && (
                    <div className="animate-in zoom-in-95 duration-300">
                        <AnamnesisForm
                            template={selectedTemplate}
                            onComplete={handleComplete}
                            onCancel={() => setViewMode('LIST')}
                        />
                    </div>
                )}

                {viewMode === 'SUMMARY' && (
                    <div className="space-y-6">
                        {/* Estilos de Impressão */}
                        <style>{`
                            @media print {
                                body * { visibility: hidden; }
                                #printable-area, #printable-area * { visibility: visible; }
                                #printable-area { position: absolute; left: 0; top: 0; width: 100%; }
                                .no-print { display: none !important; }
                            }
                         `}</style>

                        <div className="flex justify-between items-center no-print">
                            <h2 className="text-xl font-bold">Resultado da Análise</h2>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={handlePrint} className="gap-2">
                                    <Printer className="w-4 h-4" /> Imprimir Resumo
                                </Button>
                                <Button variant="ghost" onClick={() => setViewMode('LIST')}>Nova Simulação</Button>
                            </div>
                        </div>

                        <div id="printable-area" className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                            <div className="mb-6 border-b border-slate-100 pb-4">
                                <h1 className="text-2xl font-bold text-slate-900">Relatório de Anamnese Elite</h1>
                                <p className="text-sm text-slate-500">Paciente: Paciente Teste • Data: {new Date().toLocaleDateString()}</p>
                            </div>

                            <PatientAnamnesisSummary
                                responses={activeResponses}
                                patientName="Paciente Teste"
                            />

                            <div className="mt-8 pt-8 border-t border-slate-100">
                                <h3 className="text-sm font-bold text-slate-400 mb-4 uppercase">Detalhamento das Respostas</h3>
                                <div className="space-y-4">
                                    {Object.entries(activeResponses).map(([key, value]) => (
                                        <div key={key} className="flex justify-between border-b border-slate-50 pb-2">
                                            <span className="text-sm font-medium text-slate-600">{key}</span>
                                            <span className="text-sm font-bold text-slate-800">{String(value)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-12 text-center text-xs text-slate-300 font-mono">
                                Documento gerado eletronicamente via ClinicPro Elite
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
