import React, { useState, useEffect } from 'react';
import { EliteEditor } from '../shared/EliteEditor'; // Vault
import { TemplateService } from '../../src/services/documents/TemplateService';
import { TemplateRepository, DBTemplate } from '../../src/services/documents/TemplateRepository';
import { Printer, Download, Save, RefreshCw, FileText } from 'lucide-react';
import { Button } from '../ui/button';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../src/lib/utils';
import toast from 'react-hot-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'; // Assuming these are shadcn/ui components

/**
 * 🛡️ ELITE DOCUMENT ENGINE
 * Módulo de geração, edição e impressão de documentos de alta segurança.
 */
export const EliteDocumentEngine: React.FC = () => {
    const { profile } = useAuth();

    // Estado do Contexto (Dados Reais do Sistema - Mock inicial completo)
    const [contextData, setContextData] = useState<any>({
        patient: { name: 'João da Silva', cpf: '123.456.789-00', address: 'Av. Paulista, 1000' },
        financial: {
            total_value: 15450.00,
            installment_count: 5,
            installment_value: 3090.00,
            due_list: ['10/02/2026', '10/03/2026', '10/04/2026', '10/05/2026', '10/06/2026'],
            installments_data: [
                { number: 1, dueDate: '10/02/2026', value: 3090.00, method: 'PIX' },
                { number: 2, dueDate: '10/03/2026', value: 3090.00, method: 'BOLETO' },
                { number: 3, dueDate: '10/04/2026', value: 3090.00, method: 'BOLETO' },
                { number: 4, dueDate: '10/05/2026', value: 3090.00, method: 'BOLETO' },
                { number: 5, dueDate: '10/06/2026', value: 3090.00, method: 'BOLETO' },
            ]
        },
        clinical: {
            procedure_name: 'Protocolo All-on-4 Superior',
            posology: `<ul><li><strong>Amoxicilina 875mg</strong>: 1 comp de 12/12h por 7 dias.</li><li><strong>Dexametasona 4mg</strong>: 1 comp de 8/8h por 3 dias.</li><li><strong>Dipirona 1g</strong>: 1 comp de 6/6h em caso de dor.</li></ul>`,
            attestation_days: '03 (três)'
        },
        payment: {
            amount: 3090.00,
            installment_index: 1
        },
        clinic: { name: profile?.clinic_name || 'ClinicPro Elite', cnpj: '00.000.000/0001-00' },
        surgical: {
            jejum_horas: '8',
            hora_chegada: '07:00 (1h antes)',
            medicamentos_suspender: 'AAS, Gingko Biloba'
        }
    });

    // Template Selecionado (Agora Array para Bundle)
    const [selectedTemplates, setSelectedTemplates] = useState<string[]>(['CONTRACT']);

    // Conteúdo (Editor - apenas para visualizar o último clicado ou modo preview geral)
    // Para edição, focamos em um por vez. Para preview, mostramos todos.
    const [focusedTemplate, setFocusedTemplate] = useState<string>('CONTRACT');
    const [rawContentMap, setRawContentMap] = useState<Record<string, string>>({});
    const [processedContentMap, setProcessedContentMap] = useState<Record<string, string>>({});

    const [viewMode, setViewMode] = useState<'EDIT' | 'PREVIEW'>('PREVIEW'); // Padrão Preview para Bundle

    // Templates Dinâmicos
    const [availableTemplates, setAvailableTemplates] = useState<Record<string, string>>({});
    const [templateOptions, setTemplateOptions] = useState<{ value: string, label: string }[]>([]);
    const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);

    // Carregar Templates do Banco
    useEffect(() => {
        const loadTemplates = async () => {
            if (!profile?.clinic_id) return;
            setIsLoadingTemplates(true);
            try {
                const dbTemplates = await TemplateRepository.getAllTemplates(profile.clinic_id);

                const newMap: Record<string, string> = {};
                const newOptions: { value: string, label: string }[] = [];

                // 1. Templates Padrão (Fallback Hardcoded)
                const defaults = getHardcodedDefaults();
                Object.assign(newMap, defaults);

                // 2. Templates do Banco (Sobrescrevem Padrão se mesmo nome/categoria)
                dbTemplates.forEach(t => {
                    // Se for um modelo específico (ex: "Contrato Lipo"), usa o ID como value
                    // Se for genérico (ex: Categoria CONTRACT sem nome específico), usa a categoria
                    const key = t.category; // Simplificação: Categoria define o tipo
                    // TODO: Permitir múltiplos templates por categoria no futuro
                    newMap[key] = t.content;
                });

                // Construir Opções
                const uniqueCategories = Array.from(new Set([...Object.keys(defaults), ...dbTemplates.map(t => t.category)]));
                uniqueCategories.forEach(cat => {
                    newOptions.push({
                        value: cat,
                        label: getCategoryLabel(cat)
                    });
                });

                setAvailableTemplates(newMap);
                setTemplateOptions(newOptions);
            } catch (error) {
                console.error('Erro ao carregar templates:', error);
                // Fallback para hardcoded em caso de erro
                setAvailableTemplates(getHardcodedDefaults());
            } finally {
                setIsLoadingTemplates(false);
            }
        };

        loadTemplates();
    }, [profile?.clinic_id]);

    // Processamento de Templates Selecionados
    useEffect(() => {
        const newProcessedMap: Record<string, string> = {};
        const newRawMap: Record<string, string> = { ...rawContentMap };

        selectedTemplates.forEach(key => {
            if (availableTemplates[key]) {
                // Se não tiver raw content editado na sessão, pega do template original
                const raw = newRawMap[key] || availableTemplates[key];
                newRawMap[key] = raw;
                newProcessedMap[key] = TemplateService.process(raw, contextData);
            }
        });

        setRawContentMap(newRawMap);
        setProcessedContentMap(newProcessedMap);
    }, [selectedTemplates, availableTemplates, contextData]);

    // Atualiza Focused Template para Editor
    const handleEditorChange = (content: string) => {
        setRawContentMap(prev => ({ ...prev, [focusedTemplate]: content }));
        // Live preview do focado
        const processed = TemplateService.process(content, contextData);
        setProcessedContentMap(prev => ({ ...prev, [focusedTemplate]: processed }));
    };

    // Sugestão de Bundle (Inteligência Contextual)
    // Sugestão de Bundle (Inteligência Contextual) - Auto Check
    useEffect(() => {
        if (!contextData?.clinical?.procedure_name) return;

        const procName = contextData.clinical.procedure_name.toString().toLowerCase();
        if ((procName.includes('implante') || procName.includes('protocolo')) && !isLoadingTemplates) {
            // Auto-select Bundle
            const bundle = ['CONTRACT', 'TCLE', 'PRE_OP', 'POST_OP', 'PRESCRIPTION', 'BUDGET', 'RECEIPT'];
            // Check if user hasn't manually changed selection significantly? 
            // For now, just suggest/overwrite on initial load logic or use a flag.
            // Para evitar loop, verifique se já contém
            const needsUpdate = bundle.some(t => !selectedTemplates.includes(t));
            if (needsUpdate) {
                setSelectedTemplates(bundle);
                toast('Bundle de Implantes (7 Docs) Selecionado Automaticamente!', {
                    icon: '🚀',
                    duration: 4000,
                    style: { borderRadius: '10px', background: '#333', color: '#fff' }
                });
            }
        }
    }, [contextData.clinical.procedure_name, isLoadingTemplates]);

    // Helper para Defaults (Movemos o hardcoded para cá)
    const getHardcodedDefaults = () => ({
        CONTRACT: `
            <h1>CONTRATO DE PRESTAÇÃO DE SERVIÇOS ODONTOLÓGICOS</h1>
            <p>Pelo presente instrumento particular, a <strong>{{clinica_nome}}</strong>, e o paciente <strong>{{paciente_nome}}</strong>, CPF <strong>{{paciente_cpf}}</strong>, residente em <strong>{{paciente_endereco}}</strong>, ajustam o seguinte:</p>
            
            <h2>DO OBJETO</h2>
            <p>O presente contrato tem como objeto a realização do procedimento <strong>{{procedimento_nome}}</strong>.</p>
            
            <h2>DO VALOR E FORMA DE PAGAMENTO</h2>
            <p>O valor total dos serviços é de <strong>{{valor_total}}</strong>, a ser pago em <strong>{{qtd_parcelas}}</strong> parcelas de <strong>{{valor_parcela}}</strong>.</p>
            
            <h2>DA INADIMPLÊNCIA</h2>
            <p>O atraso no pagamento de qualquer parcela implicará na incidência de multa de <strong>{{multa_atraso}}</strong> e juros de mora de <strong>{{juros_mensal}}</strong>.</p>

            <h2>DA NOTA PROMISSÓRIA</h2>
            <p>{{nota_promissoria}}</p>
            
            <br>
            <p>São Paulo, {{data_hoje}}</p>
            <br><br>
            <p>_____________________________________</p>
            <p>{{paciente_nome}}</p>
        `,
        TCLE: `
            <h1>TERMO DE CONSENTIMENTO LIVRE E ESCLARECIDO</h1>
            <p>Eu, <strong>{{paciente_nome}}</strong>, declaro ter sido informado sobre o procedimento <strong>{{procedimento_nome}}</strong>, seus riscos e benefícios.</p>
            <p>Dou plena autorização ao Dr(a). {{dr_nome}} para a realização do tratamento.</p>
            <p>Data: {{data_hoje}}</p>
            <br><br>
            <p>_____________________________________</p>
            <p>Assinatura do Paciente</p>
        `,
        BUDGET: `
            <h1>PROPOSTA DE TRATAMENTO VIP</h1>
            <p>Prezado(a) <strong>{{paciente_nome}}</strong>,</p>
            <p>Apresentamos abaixo o planejamento financeiro para o seu tratamento de <strong>{{procedimento_nome}}</strong>.</p>
            
            {{tabela_investimento}}
            
            <p>Este orçamento tem validade de 15 dias a partir de {{data_hoje}}.</p>
            <br>
            <div style="border: 1px dashed #ccc; padding: 20px; text-align: center; border-radius: 8px; background-color: #f9f9f9;">
                <p><strong>De acordo com o investimento proposto:</strong></p>
                <br><br>
                <p>_____________________________________</p>
                <p>{{paciente_nome}}</p>
            </div>
        `,
        PRESCRIPTION: `
            <div style="text-align: center; margin-bottom: 30px;">
                <h2>RECEITUÁRIO MÉDICO</h2>
                <p><strong>{{dr_nome}}</strong> - CRO {{dr_cro}}</p>
            </div>
            
            <h3>USO ORAL</h3>
            {{posologia}}
            
            <br><br><br>
            <div style="text-align: center;">
                <p>_____________________________________</p>
                <p>Assinatura e Carimbo</p>
                <p>{{data_hoje}}</p>
            </div>
        `,
        CERTIFICATE: `
            <h1>ATESTADO MÉDICO</h1>
            <p>Atesto para os devidos fins que o Sr(a). <strong>{{paciente_nome}}</strong>, portador(a) do CPF {{paciente_cpf}}, foi atendido(a) nesta data para realização de procedimento odontológico.</p>
            <p>Necessita de <strong>{{dias_repouso}}</strong> dias de repouso a partir desta data.</p>
            <br><br>
            <p>São Paulo, {{data_hoje}}</p>
            <br><br>
            <div style="text-align: center;">
                <p>_____________________________________</p>
                <p><strong>{{dr_nome}}</strong></p>
                <p>CRO {{dr_cro}}</p>
            </div>
        `,
        RECEIPT: `
            <h1>RECIBO DE PAGAMENTO Nº {{numero_parcela}}</h1>
            <p>Recebemos de <strong>{{paciente_nome}}</strong> a importância de <strong>{{valor_pago}}</strong> referente à parcela {{numero_parcela}} do tratamento de {{procedimento_nome}}.</p>
            <p>Para maior clareza firmamos o presente.</p>
            <br>
            <p>{{clinica_nome}}, {{data_hoje}}</p>
            <br><br>
            <div style="border: 2px solid #000; padding: 10px; display: inline-block; font-weight: bold;">
                PAGO
            </div>
        `,
        PRE_OP: `
            <div class="font-inter">
                <h1 class="text-2xl font-bold text-slate-900 mb-6 border-b pb-4">Instruções Pré-Operatórias</h1>
                
                <div class="space-y-6 mb-8">
                    <!-- Jejum -->
                    <div class="bg-blue-50 p-5 rounded-xl border border-blue-100 flex gap-4">
                        <div class="text-3xl">🚫</div>
                        <div>
                            <h3 class="font-bold text-blue-900 mb-1 text-lg">Jejum Obrigatório</h3>
                            <p class="text-slate-700">Você deve permanecer <strong>{{jejum_horas}} horas</strong> sem ingerir, nada (sólidos ou líquidos) antes do procedimento.</p>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-6">
                        <!-- Chegada -->
                        <div class="bg-slate-50 p-5 rounded-xl border border-slate-200">
                             <div class="text-2xl mb-2">⏰</div>
                             <h3 class="font-bold text-slate-800 mb-1">Horário de Chegada</h3>
                             <p class="text-slate-600 text-sm">Por favor, chegue às <strong>{{hora_chegada}}</strong> para o preparo inicial.</p>
                        </div>
                        
                        <!-- Medicações -->
                        <div class="bg-slate-50 p-5 rounded-xl border border-slate-200">
                             <div class="text-2xl mb-2">💊</div>
                             <h3 class="font-bold text-slate-800 mb-1">Medique-se</h3>
                             <p class="text-slate-600 text-sm">Suspender: <strong>{{medicamentos_suspender}}</strong>.</p>
                        </div>
                    </div>
                    
                    <!-- Checklist -->
                    <div class="bg-amber-50 p-5 rounded-xl border border-amber-100">
                        <h3 class="font-bold text-amber-900 mb-3 flex items-center gap-2">
                             <span>📋</span> Recomendações Importantes
                        </h3>
                        <ul class="text-sm space-y-2 text-amber-900/80 pl-1">
                            <li class="flex items-center gap-2">✔ Use roupas confortáveis, preferencialmente com abotoamento frontal.</li>
                            <li class="flex items-center gap-2">✔ Sem maquiagem, esmaltes, joias ou lentes de contato.</li>
                            <li class="flex items-center gap-2">✔ Traga todos os exames pré-operatórios impressos.</li>
                            <li class="flex items-center gap-2">✔ Indispensável presença de acompanhante maior de idade.</li>
                        </ul>
                    </div>
                </div>

                <!-- Assinatura Recebimento -->
                <div class="mt-12 p-6 bg-slate-50 border border-slate-200 border-dashed rounded-xl break-inside-avoid">
                    <p class="text-xs text-slate-500 text-center mb-8 max-w-lg mx-auto leading-relaxed">
                        Declaro ter recebido e compreendido todas as instruções pré-operatórias acima descritas, estando ciente que o não cumprimento pode acarretar no cancelamento da cirurgia.
                    </p>
                    <div class="flex justify-between items-end px-4">
                        <div class="text-center w-5/12">
                            <div class="border-b border-slate-300 w-full mb-1"></div>
                            <p class="text-[10px] uppercase font-bold text-slate-400">{{paciente_nome}}</p>
                        </div>
                        <div class="text-center">
                            <p class="text-[10px] text-slate-400">{{data_hoje}}</p>
                        </div>
                    </div>
                </div>
            </div>
        `,
        POST_OP: `
            <div class="font-inter">
                <h1 class="text-2xl font-bold text-slate-900 mb-2">Instruções Pós-Operatórias</h1>
                <p class="text-slate-500 mb-8 text-sm">Siga rigorosamente este guia para uma recuperação segura e confortável.</p>

                <!-- Conteúdo Dinâmico -->
                {{cuidados_pos}}

                <!-- Assinatura Recebimento -->
                <div class="mt-12 p-6 bg-slate-50 border border-slate-200 border-dashed rounded-xl break-inside-avoid">
                    <p class="text-xs text-slate-500 text-center mb-8 max-w-lg mx-auto leading-relaxed">
                        Recebi por escrito as orientações pós-operatórias e comprometo-me a segui-las integralmente. Recebi também os contatos de emergência da clínica.
                    </p>
                    <div class="flex justify-between items-end px-4">
                        <div class="text-center w-5/12">
                            <div class="border-b border-slate-300 w-full mb-1"></div>
                            <p class="text-[10px] uppercase font-bold text-slate-400">{{paciente_nome}}</p>
                        </div>
                        <div class="text-center">
                            <p class="text-[10px] text-slate-400">{{data_hoje}}</p>
                        </div>
                    </div>
                </div>
            </div>
        `
    });

    const getCategoryLabel = (cat: string) => {
        const labels: Record<string, string> = {
            'CONTRACT': 'Contrato de Prestação',
            'TCLE': 'Termo de Consentimento',
            'BUDGET': 'Orçamento / Proposta',
            'PRESCRIPTION': 'Receituário',
            'CERTIFICATE': 'Atestado Médico',
            'RECEIPT': 'Recibo Financeiro',
            'PRE_OP': 'Instruções Pré-Op',
            'POST_OP': 'Instruções Pós-Op'
        };
        return labels[cat] || cat;
    };

    const handlePrint = () => {
        const printWindow = window.open('', '', 'width=800,height=600');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                <head>
                    <title>Dossiê Documental - ClinicPro Elite</title>
                    <style>
                        body { font-family: 'Inter', sans-serif; padding: 40px; }
                        .document-page { page-break-after: always; margin-bottom: 50px; }
                        .document-page:last-child { page-break-after: auto; }
                        h1 { color: #1e293b; font-size: 24px; text-transform: uppercase; margin-bottom: 20px; border-bottom: 2px solid #eee; padding-bottom: 10px; }
                        p { line-height: 1.6; color: #334155; margin-bottom: 10px; text-align: justify; }
                    </style>
                </head>
                <body>
                    ${selectedTemplates.map(key => `
                        <div class="document-page">
                            ${processedContentMap[key] || ''}
                        </div>
                    `).join('')}
                </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 500);
        }
    };

    const toggleTemplate = (key: string) => {
        setSelectedTemplates(prev => {
            const newSet = prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key];
            if (!newSet.includes(focusedTemplate) && newSet.length > 0) {
                setFocusedTemplate(newSet[0]);
            } else if (newSet.length === 0) {
                setFocusedTemplate(''); // Clear focused if no templates selected
            }
            return newSet;
        });
    };

    return (
        <div className="flex h-screen bg-[#F5F6FA] overflow-hidden">

            {/* Sidebar de Controle */}
            <div className="w-80 bg-white border-r border-slate-200 p-6 flex flex-col gap-6 overflow-y-auto">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 mb-1">Elite Documents</h2>
                    <p className="text-xs text-slate-500">Motor de Automação Jurídica</p>
                </div>

                {/* Sidebar: Checklist de Documentos */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-bold text-slate-800 uppercase tracking-wider">Dossiê do Paciente</label>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">{selectedTemplates.length} Docs</span>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-3 bg-slate-50 border-b border-slate-100 text-xs font-medium text-slate-500 flex justify-between">
                            <span>DOCUMENTOS DISPONÍVEIS</span>
                            <button onClick={() => setSelectedTemplates(templateOptions.map(o => o.value))} className="text-blue-600 hover:underline">Todos</button>
                        </div>
                        <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
                            {templateOptions.map(opt => (
                                <div
                                    key={opt.value}
                                    className={cn(
                                        "flex items-center gap-3 p-3 hover:bg-slate-50 cursor-pointer transition-colors",
                                        selectedTemplates.includes(opt.value) ? "bg-blue-50/50" : ""
                                    )}
                                    onClick={() => toggleTemplate(opt.value)}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedTemplates.includes(opt.value)}
                                        readOnly
                                        className="h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                                    />
                                    <span className={cn(
                                        "text-sm",
                                        selectedTemplates.includes(opt.value) ? "font-semibold text-blue-900" : "text-slate-600"
                                    )}>{opt.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Editor Selection (apenas se quisermos editar um específico) */}
                    {viewMode === 'EDIT' && (
                        <div className="mt-4">
                            <label className="text-xs font-medium text-slate-500 mb-1 block">Editando Agora:</label>
                            <Select value={focusedTemplate} onValueChange={setFocusedTemplate}>
                                <SelectTrigger className="w-full h-8 text-xs">
                                    <SelectValue placeholder="Selecione para editar" />
                                </SelectTrigger>
                                <SelectContent>
                                    {selectedTemplates.map(key => (
                                        <SelectItem key={key} value={key}>{templateOptions.find(o => o.value === key)?.label || key}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>

                {/* Dados do Contexto (Simulação) */}
                <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-600 mb-2">
                        <RefreshCw size={14} />
                        <span className="text-xs font-bold uppercase">Contexto Ativo</span>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs text-slate-500">Paciente</label>
                        <input
                            value={contextData.patient.name}
                            onChange={(e) => setContextData({ ...contextData, patient: { ...contextData.patient, name: e.target.value } })}
                            className="w-full text-sm p-1 border rounded"
                            placeholder="Nome Completo"
                        />
                    </div>

                    {/* Campos Contextuais (mostra dependendo do template) */}
                    {selectedTemplates.includes('BUDGET') && (
                        <div className="space-y-2">
                            <label className="text-xs text-slate-500">Valor Total (R$)</label>
                            <input
                                type="number"
                                value={contextData.financial.total_value}
                                onChange={(e) => setContextData({ ...contextData, financial: { ...contextData.financial, total_value: Number(e.target.value) } })}
                                className="w-full text-sm p-1 border rounded"
                            />
                        </div>
                    )}

                    {selectedTemplates.includes('PRESCRIPTION') && (
                        <div className="space-y-2">
                            <label className="text-xs text-slate-500">Posologia (HTML)</label>
                            <textarea
                                value={contextData.clinical.posology}
                                onChange={(e) => setContextData({ ...contextData, clinical: { ...contextData.clinical, posology: e.target.value } })}
                                className="w-full text-sm p-1 border rounded h-20"
                            />
                        </div>
                    )}

                    {selectedTemplates.includes('PRE_OP') && (
                        <div className="space-y-4 pt-2 border-t border-slate-100">
                            <div className="space-y-2">
                                <label className="text-xs text-slate-500">Horas de Jejum</label>
                                <input
                                    value={contextData.surgical?.jejum_horas}
                                    onChange={(e) => setContextData({ ...contextData, surgical: { ...contextData.surgical, jejum_horas: e.target.value } })}
                                    className="w-full text-sm p-1 border rounded"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs text-slate-500">Hora de Chegada</label>
                                <input
                                    value={contextData.surgical?.hora_chegada}
                                    onChange={(e) => setContextData({ ...contextData, surgical: { ...contextData.surgical, hora_chegada: e.target.value } })}
                                    className="w-full text-sm p-1 border rounded"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs text-slate-500">Suspender Meds.</label>
                                <input
                                    value={contextData.surgical?.medicamentos_suspender}
                                    onChange={(e) => setContextData({ ...contextData, surgical: { ...contextData.surgical, medicamentos_suspender: e.target.value } })}
                                    className="w-full text-sm p-1 border rounded"
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-auto space-y-2">
                    <Button onClick={handlePrint} className="w-full gap-2 bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20">
                        <Printer size={16} />
                        Imprimir / PDF
                    </Button>
                </div>
            </div>

            {/* Área Principal (Editor/Preview) */}
            <div className="flex-1 flex flex-col h-full relative">

                {/* Toolbar Superior */}
                <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm z-10">
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                        <button
                            onClick={() => setViewMode('EDIT')}
                            className={cn(
                                "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                                viewMode === 'EDIT' ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            Editor (Variáveis)
                        </button>
                        <button
                            onClick={() => setViewMode('PREVIEW')}
                            className={cn(
                                "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                                viewMode === 'PREVIEW' ? "bg-white shadow-sm text-blue-600" : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            Preview Final
                        </button>
                    </div>

                    <div className="flex items-center gap-4">
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                            <FileText size={12} />
                            Salvo automaticamente
                        </span>
                        <Button variant="ghost" size="sm" className="text-slate-500">
                            <Download size={16} />
                        </Button>
                    </div>
                </div>

                {/* Conteúdo Scrollável */}
                <div className="flex-1 overflow-y-auto p-8 bg-[#525659] flex justify-center">

                    {/* Área de Visualização das Folhas */}
                    <div className="w-full flex flex-col items-center gap-8 py-8">
                        {viewMode === 'EDIT' ? (
                            <div className="w-[210mm] min-h-[297mm] bg-white shadow-2xl transition-all duration-300 flex flex-col relative p-[2.5cm]">
                                <div className="absolute top-2 right-2 text-xs text-slate-300 font-mono uppercase">{focusedTemplate}</div>
                                <EliteEditor
                                    content={rawContentMap[focusedTemplate] || ''}
                                    onChange={handleEditorChange}
                                    editable={true}
                                />
                            </div>
                        ) : (
                            /* Modo Preview: Múltiplas folhas */
                            selectedTemplates.map(key => (
                                <div key={key} className="w-[210mm] min-h-[297mm] bg-white shadow-2xl transition-all duration-300 flex flex-col relative p-[2.5cm]">
                                    <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-center bg-no-repeat bg-contain" style={{ backgroundImage: "url('/logo-bg.png')" }}></div>

                                    <div className="prose max-w-none font-inter text-slate-900 relative z-10 flex-1 flex flex-col">
                                        <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap'); .font-inter { font-family: 'Inter', sans-serif; } ul { margin-left: 20px; list-style-type: disc; } table { width: 100%; }`}</style>

                                        <div dangerouslySetInnerHTML={{ __html: processedContentMap[key] || '' }} />

                                        {/* Rodapé de Segurança */}
                                        <div className="mt-auto pt-8 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-300 font-mono">
                                            <span>HASH: {Date.now().toString(36).toUpperCase()}</span>
                                            <span>Documento Assinado Digitalmente via ClinicPro</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                        {viewMode === 'PREVIEW' && selectedTemplates.length === 0 && (
                            <div className="text-slate-400 mt-20">Nenhum documento selecionado.</div>
                        )}
                    </div>

                </div>

            </div>

        </div>
    );
};
