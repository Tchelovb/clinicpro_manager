import React, { useEffect, useState } from 'react';
import { X, MessageCircle, Copy, Sparkles, RefreshCw, Wand2 } from 'lucide-react';
import { OpportunityItem } from '../hooks/useOpportunityHub';
import { useCommercial } from '../hooks/useCommercial';
import { GoogleGenerativeAI } from "@google/generative-ai";

interface ScriptModalProps {
    isOpen: boolean;
    onClose: () => void;
    opportunity: OpportunityItem | null;
}

const DEFAULT_TEMPLATES: Record<string, string> = {
    'ABANDONED_BUDGET': "Olá *{{name}}*, tudo bem? \n\nO Dr. Marcelo estava revisando os planejamentos cirúrgicos da semana e me pediu para entrar em contato sobre seu orçamento de *{{procedure}}*. \n\nEle notou que ainda não finalizamos sua aprovação e gostaria de saber se ficou alguma dúvida técnica ou se podemos ajudar com alguma condição de pagamento específica.\n\nAguardo seu retorno!",
    'NEW_LEAD': "Olá *{{name}}*, vi que você demonstrou interesse em *{{procedure}}* através do nosso {{source}}. \n\nSou da equipe do Dr. Marcelo e gostaria de entender melhor o que você busca para te direcionar para a melhor avaliação.\n\nVocê teria 5 minutinhos para uma conversa rápida?",
    'AGENDA_CONFIRMATION': "Olá *{{name}}*, tudo bem? \n\nPassando para confirmar sua consulta de *{{procedure}}* com o Dr. Marcelo amanhã às {{time}}. \n\nPodemos confirmar sua presença? É muito importante para nossa organização.\n\nObrigado!",
    'LTV_RECALL': "Olá *{{name}}*, espero que esteja bem! \n\nNossos registros indicam que já faz um tempo desde seu último procedimento de *{{procedure}}*. \n\nO Dr. Marcelo recomenda uma reavaliação para manutenção dos resultados. Gostaria de agendar um retorno para esta semana?"
};

const ScriptModal: React.FC<ScriptModalProps> = ({ isOpen, onClose, opportunity }) => {
    const { scripts } = useCommercial(); // Scripts from DB (sales_scripts table)
    const [generatedText, setGeneratedText] = useState('');
    const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>('');
    const [isCopied, setIsCopied] = useState(false);
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);

    // Initial Loading
    useEffect(() => {
        if (!opportunity || !isOpen) return;

        let key = 'NEW_LEAD';
        if (opportunity.type === 'BUDGET') key = 'ABANDONED_BUDGET';
        if (opportunity.type === 'APPOINTMENT') key = 'AGENDA_CONFIRMATION';
        if (opportunity.type === 'PATIENT') key = 'LTV_RECALL';

        setSelectedTemplateKey(key);
        generateScript(key);
    }, [opportunity, isOpen]);

    const generateScript = (templateKey: string) => {
        if (!opportunity) return;

        // 1. Try to find a custom script in DB with matching title or stage
        const dbScript = scripts.find(s => s.title === templateKey || s.stage === templateKey);

        let template = dbScript ? dbScript.content : DEFAULT_TEMPLATES[templateKey];

        if (!template) template = DEFAULT_TEMPLATES['NEW_LEAD']; // Fallback safety

        // Replace placeholders
        let text = template
            .replace(/{{name}}/g, opportunity.title)
            .replace(/{{procedure}}/g, opportunity.subtitle || 'Procedimento')
            .replace(/{{source}}/g, opportunity.tags[0] || 'site')
            .replace(/{{value}}/g, (opportunity.value || 0).toLocaleString('pt-BR'))
            .replace(/{{time}}/g, (opportunity.date || '').split(' ')[1] || 'horário agendado');

        setGeneratedText(text);
        setIsCopied(false);
    };

    const handleGenerateWithAI = async () => {
        if (!opportunity) return;
        setIsGeneratingAI(true);
        try {
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

            if (!apiKey) {
                // Se não tiver chave, simula um delay e usa um template melhorado (Mock Inteligente)
                await new Promise(r => setTimeout(r, 1500));
                let enhancedText = generatedText + "\n\n(Obs: Configure a VITE_GEMINI_API_KEY para gerar textos reais com IA)";
                setGeneratedText(enhancedText);
                return;
            }

            // Define Prompt
            const prompt = `
                Você é uma assistente experiente de uma clínica de alto padrão.
                Escreva uma mensagem curta, empática e persuasiva para WhatsApp.
                
                Contexto:
                - Paciente: ${opportunity.title}
                - Procedimento: ${opportunity.subtitle}
                - Situação: ${selectedTemplateKey} (Ex: Orçamento abandonado, Lead Novo)
            // Solução Definitiva: v1 Estável + Contexto de Autoridade
            const model = "gemini-1.5-flash";
            const version = "v1"; // Estável
            
            // Contexto Enriquecido (High Ticket)
            const richPrompt = `
                Você é o assistente virtual Sênior da ClinicPro.
                O Dr.Marcelo é especialista em HOF e Cirurgias Estéticas da Face(560h Pós - Graduação).
                
                Gere uma mensagem de WhatsApp curta, elegante e persuasiva para o paciente.
                
                DADOS DO PACIENTE:
            - Nome: ${ opportunity.title }
            - Procedimento de Interesse: ${ opportunity.subtitle }
            - Valor do Orçamento: R$ ${ opportunity.value }
            - Situação Atual: ${ selectedTemplateKey.replace('_', ' ') }

            DIRETRIZES:
            1. Use gatilhos de autoridade(mencione a expertise do Dr.Marcelo se for procedimento cirúrgico).
                2. Para valores acima de R$ 5.000, foque em EXCLUSIVIDADE e SEGURANÇA.
                3. Para agendamentos, foque em ESCASSEZ de horários.
                4. Termine com uma pergunta aberta(CTA) para incentivar resposta.
                5. Use 1 ou 2 emojis no máximo.Tom profissional mas acolhedor.
            `;

            const response = await fetch(
                `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${apiKey}`,
            {
                method: "POST",
                    headers: {
                    "Content-Type": "application/json",
                    },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: richPrompt }] }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 500,
                    }
                }),
                }
            );

if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || response.statusText);
}

const data = await response.json();
const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

if (text) {
    setGeneratedText(text);
} else {
    throw new Error("Resposta da IA vazia.");
}

        } catch (error) {
    console.error("Erro na IA:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    setGeneratedText(`⚠️ Erro Técnico: ${errorMessage}\n\n---\n\n` + generatedText);
} finally {
    setIsGeneratingAI(false);
}
    };

const handleCopy = () => {
    navigator.clipboard.writeText(generatedText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
};

const handleWhatsApp = () => {
    if (!opportunity) return;
    const encodedText = encodeURIComponent(generatedText);
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
};

if (!isOpen || !opportunity) return null;

return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg mx-4 flex flex-col max-h-[90vh]">

            {/* Header */}
            <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-900 rounded-t-xl">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg text-white">
                        <Sparkles size={18} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 dark:text-white">Closer AI</h3>
                        <p className="text-xs text-gray-500">Assistente de Scripts Inteligentes</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-1.5 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
                    <X size={20} className="text-gray-500" />
                </button>
            </div>

            {/* Body */}
            <div className="p-6 flex-1 overflow-y-auto">

                {/* Context Info */}
                <div className="flex items-center gap-3 mb-4 p-3 bg-blue-50 dark:bg-slate-700/50 border border-blue-100 dark:border-slate-600 rounded-lg">
                    <div className="text-sm">
                        <span className="block font-bold text-gray-700 dark:text-gray-200">{opportunity.title}</span>
                        <span className="text-xs text-gray-500">{opportunity.subtitle} • {opportunity.status}</span>
                    </div>
                    {(opportunity.value || 0) > 0 && (
                        <div className="ml-auto font-bold text-green-600 bg-white dark:bg-slate-800 px-2 py-1 rounded border border-green-100 text-xs">
                            R$ {(opportunity.value || 0).toLocaleString('pt-BR')}
                        </div>
                    )}
                </div>

                {/* Template Selector */}
                <div className="mb-2 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {Object.keys(DEFAULT_TEMPLATES).map(key => (
                        <button
                            key={key}
                            onClick={() => { setSelectedTemplateKey(key); generateScript(key); }}
                            className={`px-3 py-1 text-xs rounded-full border whitespace-nowrap transition-colors ${selectedTemplateKey === key ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                        >
                            {key.replace('_', ' ')}
                        </button>
                    ))}
                </div>

                {/* Text Area with Loading Overlay */}
                <div className="relative">
                    {isGeneratingAI && (
                        <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 z-10 flex flex-col items-center justify-center backdrop-blur-sm rounded-xl border border-purple-100 dark:border-purple-900/30">
                            <Sparkles className="text-purple-600 animate-bounce mb-3" size={24} />
                            <p className="text-sm font-semibold text-purple-700 dark:text-purple-400 animate-pulse">
                                A IA está analisando o perfil...
                            </p>
                            <p className="text-xs text-purple-500/70 mt-1">Carregando estratégia de persuasão</p>
                        </div>
                    )}
                    <textarea
                        value={generatedText}
                        onChange={(e) => setGeneratedText(e.target.value)}
                        disabled={isGeneratingAI}
                        className="w-full h-48 p-4 text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none font-sans leading-relaxed disabled:opacity-50 transition-all"
                    />
                    <button
                        onClick={handleCopy}
                        className="absolute top-2 right-2 p-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded hover:bg-gray-50 transition-colors shadow-sm z-20"
                        title="Copiar Texto"
                    >
                        {isCopied ? <span className="text-green-500 font-bold text-xs">Copiado!</span> : <Copy size={14} className="text-gray-500" />}
                    </button>
                </div>

                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                    <Sparkles size={10} className={isGeneratingAI ? "text-purple-500 animate-spin" : ""} />
                    {isGeneratingAI ? "Conectando ao Cérebro Digital..." : "Script gerado com base no perfil High Ticket."}
                </p>
                <div className="mt-3 flex justify-end">
                    <button
                        onClick={handleGenerateWithAI}
                        disabled={isGeneratingAI}
                        className="text-xs flex items-center gap-1 text-purple-600 hover:text-purple-700 font-semibold disabled:opacity-50"
                    >
                        {isGeneratingAI ? <RefreshCw className="animate-spin" size={12} /> : <Wand2 size={12} />}
                        {isGeneratingAI ? 'Criando mágica...' : 'Melhorar com IA Real'}
                    </button>
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 dark:border-slate-700 flex gap-3">
                <button
                    onClick={() => generateScript(selectedTemplateKey)} // Reset to template
                    className="px-4 py-2 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-600 dark:text-gray-300 font-medium text-sm hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2"
                >
                    <RefreshCw size={16} /> Resetar
                </button>
                <button
                    onClick={handleWhatsApp}
                    className="flex-1 bg-[#25D366] hover:bg-[#20bd5a] text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-lg shadow-green-500/20"
                >
                    <MessageCircle size={18} /> Enviar no WhatsApp
                </button>
            </div>
        </div>
    </div>
);
};

export default ScriptModal;
