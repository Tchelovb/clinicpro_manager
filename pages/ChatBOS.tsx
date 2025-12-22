import React, { useState, useRef, useEffect } from 'react';
import {
    Send, Mic, MicOff, Sparkles, Trash2, Volume2, VolumeX,
    Bot, User, AlertCircle, Activity
} from 'lucide-react';
import { useBOSChat } from '../hooks/useBOSChat';
import { useBOSVoice } from '../hooks/useBOSVoice';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export const ChatBOS: React.FC = () => {
    const [inputMessage, setInputMessage] = useState('');
    const [isSpeaking, setIsSpeaking] = useState(false);

    // Sentinel Data State
    const [sentinelData, setSentinelData] = useState({ alerts: 0, insights: 0 });

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const { messages, isProcessing, sendMessage, clearChat } = useBOSChat();
    const { isListening, transcript, isSupported, startListening, stopListening, speak, stopSpeaking } = useBOSVoice();
    const { profile } = useAuth();

    // Fetch Sentinel Data
    useEffect(() => {
        if (!profile?.clinic_id) return;

        const fetchSentinels = async () => {
            try {
                const { data, error } = await supabase
                    .from('ai_insights')
                    .select('priority, status, category')
                    .eq('clinic_id', profile.clinic_id)
                    .or('status.eq.OPEN,status.eq.open,status.eq.ACTIVE,status.eq.active');

                if (error) {
                    console.error('Error fetching sentinels:', error);
                    return;
                }

                if (data) {
                    // Count Alerts (High/Critical) and Insights (Opportunities)
                    const alerts = data.filter(i =>
                        ['HIGH', 'CRITICAL', 'high', 'critical'].includes(i.priority)
                    ).length;
                    const insights = data.length - alerts;
                    setSentinelData({ alerts, insights: Math.max(0, insights) });
                }
            } catch (err) {
                console.error('Exception fetching sentinels:', err);
            }
        };

        fetchSentinels();
    }, [profile?.clinic_id]);


    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isProcessing]);

    // Voice transcript update
    useEffect(() => {
        if (transcript && !isListening) {
            setInputMessage(transcript);
            inputRef.current?.focus();
        }
    }, [transcript, isListening]);

    const handleSend = async (messageOverride?: string) => {
        const message = messageOverride || inputMessage.trim();
        if (!message || isProcessing) return;

        if (!messageOverride) setInputMessage('');

        const response = await sendMessage(message);

        if (response && isSpeaking) {
            speak(response);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const toggleVoiceInput = () => {
        if (isListening) stopListening();
        else startListening();
    };

    const toggleVoiceOutput = () => {
        if (isSpeaking) stopSpeaking();
        setIsSpeaking(!isSpeaking);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between z-10 transition-colors">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-lg">
                        <Sparkles size={20} />
                    </div>
                    <div>
                        <h1 className="font-bold text-slate-800 dark:text-white text-lg flex items-center gap-2">
                            BOS Intelligence
                            <span className="px-2 py-0.5 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-[10px] rounded-full uppercase tracking-wider font-bold">Beta</span>
                        </h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Assistente Estratégico da Clínica
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {isSupported && (
                        <button
                            onClick={toggleVoiceOutput}
                            className={`p-2 rounded-lg transition-colors ${isSpeaking
                                ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300'
                                : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                            title={isSpeaking ? 'Silenciar' : 'Ativar voz'}
                        >
                            {isSpeaking ? <Volume2 size={20} /> : <VolumeX size={20} />}
                        </button>
                    )}
                    <button
                        onClick={clearChat}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/10 rounded-lg transition-colors"
                        title="Limpar histórico"
                    >
                        <Trash2 size={20} />
                    </button>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50 dark:bg-slate-950 scroll-smooth transition-colors">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full opacity-100">
                        <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-sm mb-4 transition-colors">
                            <Bot size={40} className="text-violet-500" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-6">Como posso ajudar hoje?</h2>

                        {/* SENTINEL CARDS (PROACTIVE INTELLIGENCE) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl w-full px-4 mb-6">

                            {/* CEO SUMMARY CARD (NEW) */}
                            <button
                                onClick={() => handleSend("BOS, gere o Resumo de CEO (360º) cruzando os 5 pilares do IVC com as metas atuais. Fale sobre a saúde geral, gap de metas, performance High-Ticket e alertas críticos.")}
                                className="col-span-1 md:col-span-2 group relative bg-gradient-to-br from-emerald-900/80 to-teal-900/80 border border-emerald-500/30 p-5 rounded-2xl hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-900/20 transition-all text-left overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Activity size={80} className="text-white" />
                                </div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="p-1.5 bg-emerald-400/20 rounded-lg">
                                            <Activity size={18} className="text-emerald-300" />
                                        </div>
                                        <p className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Resumo de CEO (360º)</p>
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-1">Briefing Executivo Diário</h3>
                                    <p className="text-xs text-emerald-100/70 max-w-[80%]">
                                        Análise cruzada de faturamento, metas, high-ticket e alertas em 30 segundos.
                                    </p>
                                </div>
                            </button>

                            {/* Critical Alerts Card */}
                            <button
                                onClick={() => handleSend("BOS, quais são os alertas críticos encontrados pelas sentinelas hoje?")}
                                className="group relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl hover:border-rose-300 dark:hover:border-rose-500 hover:shadow-md transition-all text-left"
                            >
                                <div className="absolute top-3 right-3 opacity-20 group-hover:opacity-100 transition-opacity">
                                    <AlertCircle className="text-rose-500" size={20} />
                                </div>
                                <p className="text-xs font-bold text-rose-500 uppercase tracking-wider mb-1">Alertas Críticos</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-black text-rose-600 dark:text-rose-400">{sentinelData.alerts}</span>
                                    <span className="text-xs text-slate-400 font-medium">identificados</span>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-2 group-hover:text-rose-600 dark:group-hover:text-rose-300 transition-colors">
                                    Ver e corrigir agora
                                </p>
                            </button>

                            {/* Active Insights Card */}
                            <button
                                onClick={() => handleSend("BOS, mostre os insights de crescimento e oportunidades que você identificou.")}
                                className="group relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl hover:border-amber-300 dark:hover:border-amber-500 hover:shadow-md transition-all text-left"
                            >
                                <div className="absolute top-3 right-3 opacity-20 group-hover:opacity-100 transition-opacity">
                                    <Sparkles className="text-amber-500" size={20} />
                                </div>
                                <p className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-1">Oportunidades</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-black text-amber-600 dark:text-amber-400">{sentinelData.insights}</span>
                                    <span className="text-xs text-slate-400 font-medium">ativas</span>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-2 group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors">
                                    Explorar estratégias
                                </p>
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2 max-w-md w-full px-4">
                            <button onClick={() => setInputMessage('Qual o faturamento deste mês?')} className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-600 dark:text-slate-300 hover:border-violet-300 dark:hover:border-violet-500 hover:text-violet-700 dark:hover:text-violet-400 transition-colors text-left">
                                💰 Qual o faturamento deste mês?
                            </button>
                            <button onClick={() => setInputMessage('Sugira uma campanha de marketing')} className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-600 dark:text-slate-300 hover:border-violet-300 dark:hover:border-violet-500 hover:text-violet-700 dark:hover:text-violet-400 transition-colors text-left">
                                📢 Ideias de marketing
                            </button>
                        </div>
                    </div>
                )}

                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`flex max-w-[85%] md:max-w-[70%] gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            {/* Avatar */}
                            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${msg.role === 'user'
                                ? 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                : 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-md'
                                }`}>
                                {msg.role === 'user' ? <User size={16} /> : <Sparkles size={16} />}
                            </div>

                            {/* Bubble */}
                            <div className={`
                                flex flex-col p-4 rounded-2xl shadow-sm text-sm leading-relaxed whitespace-pre-wrap transition-colors
                                ${msg.role === 'user'
                                    ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tr-none border border-slate-100 dark:border-slate-700'
                                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-violet-100 dark:border-violet-900/30 ring-1 ring-violet-50 dark:ring-violet-900/20'
                                }
                            `}>
                                {msg.content}
                                <div className={`text-[10px] mt-2 opacity-50 flex items-center justify-end gap-1 ${msg.role === 'user' ? '' : 'text-violet-600 dark:text-violet-400'
                                    }`}>
                                    {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {isProcessing && (
                    <div className="flex justify-start w-full">
                        <div className="flex gap-3 max-w-[70%]">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-md flex-shrink-0">
                                <Sparkles size={16} />
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl rounded-tl-none border border-violet-100 dark:border-violet-900/30 shadow-sm flex items-center gap-2 transition-colors">
                                <span className="flex gap-1">
                                    <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                    <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                    <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce"></span>
                                </span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 transition-colors">
                <div className="max-w-4xl mx-auto flex gap-2 items-end">
                    <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-transparent focus-within:border-violet-300 dark:focus-within:border-violet-500 focus-within:bg-white dark:focus-within:bg-slate-800 focus-within:ring-4 focus-within:ring-violet-50 dark:focus-within:ring-violet-900/20 transition-all flex items-center gap-2 p-2 relative">
                        <textarea
                            ref={inputRef as any}
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder={isListening ? 'Ouvindo...' : 'Digite sua mensagem para o BOS...'}
                            disabled={isProcessing || isListening}
                            rows={1}
                            className="flex-1 bg-transparent border-none focus:ring-0 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none max-h-32 py-2 px-2 text-sm"
                            style={{ minHeight: '44px' }}
                        />
                        {isSupported && (
                            <button
                                onClick={toggleVoiceInput}
                                disabled={isProcessing}
                                className={`p-2 rounded-xl transition-all ${isListening
                                    ? 'bg-rose-500 text-white animate-pulse shadow-md'
                                    : 'text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-300'
                                    }`}
                            >
                                {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                            </button>
                        )}
                    </div>

                    <button
                        onClick={() => handleSend()}
                        disabled={(!inputMessage.trim() && !isListening) || isProcessing}
                        className={`
                            p-3 rounded-xl flex items-center justify-center shadow-lg transition-all
                            ${!inputMessage.trim() && !isListening
                                ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                                : 'bg-violet-600 text-white hover:bg-violet-700 hover:scale-105 active:scale-95'
                            }
                        `}
                    >
                        <Send size={24} />
                    </button>
                </div>
                <div className="text-center mt-2">
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">
                        O BOS utiliza inteligência artificial e pode cometer erros. Verifique informações críticas.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ChatBOS;
