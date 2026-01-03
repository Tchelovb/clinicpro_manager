
import React, { useState } from 'react';
import { AnamnesisTemplate, AnamnesisQuestion } from '../../src/services/anamnesis/AnamnesisRepository';
import { Check, ChevronRight, AlertTriangle, Heart, Music, Smile } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../src/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
    template: AnamnesisTemplate;
    onComplete: (responses: Record<string, any>) => void;
    onCancel: () => void;
}

export const AnamnesisForm: React.FC<Props> = ({ template, onComplete, onCancel }) => {
    const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
    const [responses, setResponses] = useState<Record<string, any>>({});

    // Flatten all questions for progress bar? Or keep sectional navigation?
    // Sectional navigation is more "Apple-like"
    const sections = template.questions.secoes;
    const currentSection = sections[currentSectionIndex];

    const isLastSection = currentSectionIndex === sections.length - 1;

    const handleAnswer = (questionId: string, value: any) => {
        setResponses(prev => ({ ...prev, [questionId]: value }));
    };

    const handleNext = () => {
        if (isLastSection) {
            onComplete(responses);
        } else {
            setCurrentSectionIndex(prev => prev + 1);
        }
    };

    const progress = ((currentSectionIndex + 1) / sections.length) * 100;

    return (
        <div className="flex flex-col h-full bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-100 max-w-3xl mx-auto my-4 tablet:h-[800px]">
            {/* Header Clean */}
            <div className="bg-slate-50/80 p-6 border-b border-slate-100 flex justify-between items-center backdrop-blur-sm">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">{template.title}</h2>
                    <p className="text-sm text-slate-500 font-medium">Dr. Marcelo • ClinicPro Elite</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{currentSectionIndex + 1} de {sections.length}</span>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="h-1 w-full bg-slate-100">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-indigo-600"
                />
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-8 animate-in slide-in-from-right-10 duration-500">

                <div className="mb-8">
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">{currentSection.titulo}</h3>
                    <div className="w-12 h-1 bg-indigo-500 rounded-full"></div>
                </div>

                <div className="space-y-8">
                    {currentSection.perguntas.map((q) => (
                        <div key={q.id} className="space-y-3">
                            <label className="text-lg font-medium text-slate-700 block">
                                {q.pergunta}
                            </label>

                            {/* Renderizador de Tipos de Pergunta */}
                            {q.tipo === 'texto' && (
                                <input
                                    type="text"
                                    className="w-full p-4 text-lg border-b-2 border-slate-200 bg-transparent focus:border-indigo-600 focus:outline-none transition-colors placeholder:text-slate-300"
                                    placeholder="Digite sua resposta..."
                                    value={responses[q.id] || ''}
                                    onChange={e => handleAnswer(q.id, e.target.value)}
                                />
                            )}

                            {q.tipo === 'booleano' && (
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => handleAnswer(q.id, true)}
                                        className={cn(
                                            "flex-1 py-4 px-6 rounded-xl border-2 font-bold transition-all flex items-center justify-center gap-2",
                                            responses[q.id] === true
                                                ? "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm"
                                                : "border-slate-200 text-slate-400 hover:border-slate-300"
                                        )}
                                    >
                                        Sim
                                    </button>
                                    <button
                                        onClick={() => handleAnswer(q.id, false)}
                                        className={cn(
                                            "flex-1 py-4 px-6 rounded-xl border-2 font-bold transition-all flex items-center justify-center gap-2",
                                            responses[q.id] === false
                                                ? "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm"
                                                : "border-slate-200 text-slate-400 hover:border-slate-300"
                                        )}
                                    >
                                        Não
                                    </button>
                                </div>
                            )}

                            {(q.tipo === 'selecao_unica' || q.tipo === 'selecao_multipla') && (
                                <div className="flex flex-wrap gap-3">
                                    {q.opcoes?.map(opt => (
                                        <button
                                            key={opt}
                                            onClick={() => handleAnswer(q.id, opt)}
                                            className={cn(
                                                "py-3 px-6 rounded-full border font-medium transition-all",
                                                responses[q.id] === opt
                                                    ? "bg-slate-900 text-white border-slate-900 shadow-md"
                                                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                            )}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {q.tipo === 'escala' && (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs text-slate-400 px-2">
                                        <span>Insatisfatório</span>
                                        <span>Perfeito</span>
                                    </div>
                                    <input
                                        type="range"
                                        min={q.min || 0}
                                        max={q.max || 10}
                                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                        value={responses[q.id] || 5}
                                        onChange={e => handleAnswer(q.id, Number(e.target.value))}
                                    />
                                    <div className="text-center font-bold text-2xl text-indigo-600">
                                        {responses[q.id] || 5}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
                <Button
                    size="lg"
                    onClick={handleNext}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 px-8 rounded-full shadow-lg hover:shadow-indigo-500/30 transition-shadow"
                >
                    {isLastSection ? 'Finalizar e Assinar' : 'Próximo'}
                    <ChevronRight className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
};
