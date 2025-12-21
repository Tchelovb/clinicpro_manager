import React, { useState, useRef, useEffect } from 'react';
import {
    Send, Mic, MicOff, Sparkles, Trash2, Volume2, VolumeX,
    Bot, User, MoreHorizontal, Copy, RefreshCw
} from 'lucide-react';
import { useBOSChat } from '../hooks/useBOSChat';
import { useBOSVoice } from '../hooks/useBOSVoice';
import { useAuth } from '../contexts/AuthContext';

export const ChatBOS: React.FC = () => {
    const [inputMessage, setInputMessage] = useState('');
    const [isSpeaking, setIsSpeaking] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const { messages, isProcessing, sendMessage, clearChat } = useBOSChat();
    const { isListening, transcript, isSupported, startListening, stopListening, speak, stopSpeaking } = useBOSVoice();
    const { profile } = useAuth();

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

    const handleSend = async () => {
        const message = inputMessage.trim();
        if (!message || isProcessing) return;

        setInputMessage('');
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
        <div className="flex flex-col h-[calc(100vh-6rem)] bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-lg">
                        <Sparkles size={20} />
                    </div>
                    <div>
                        <h1 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                            BOS Intelligence
                            <span className="px-2 py-0.5 bg-violet-100 text-violet-700 text-[10px] rounded-full uppercase tracking-wider font-bold">Beta</span>
                        </h1>
                        <p className="text-xs text-slate-500">
                            Assistente Estratégico da Clínica
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {isSupported && (
                        <button
                            onClick={toggleVoiceOutput}
                            className={`p-2 rounded-lg transition-colors ${isSpeaking
                                ? 'bg-violet-100 text-violet-700'
                                : 'text-slate-400 hover:bg-slate-100'
                                }`}
                            title={isSpeaking ? 'Silenciar' : 'Ativar voz'}
                        >
                            {isSpeaking ? <Volume2 size={20} /> : <VolumeX size={20} />}
                        </button>
                    )}
                    <button
                        onClick={clearChat}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Limpar histórico"
                    >
                        <Trash2 size={20} />
                    </button>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50 scroll-smooth">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full opacity-60">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                            <Bot size={40} className="text-violet-500" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-700 mb-2">Como posso ajudar hoje?</h2>
                        <div className="grid grid-cols-2 gap-2 max-w-md w-full px-4">
                            <button onClick={() => setInputMessage('Qual o faturamento deste mês?')} className="p-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 hover:border-violet-300 hover:text-violet-700 transition-colors text-left">
                                💰 Qual o faturamento deste mês?
                            </button>
                            <button onClick={() => setInputMessage('Liste os pacientes em atraso')} className="p-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 hover:border-violet-300 hover:text-violet-700 transition-colors text-left">
                                ⚠️ Liste pacientes inadimplentes
                            </button>
                            <button onClick={() => setInputMessage('Sugira uma campanha de marketing')} className="p-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 hover:border-violet-300 hover:text-violet-700 transition-colors text-left">
                                📢 Ideias de marketing
                            </button>
                            <button onClick={() => setInputMessage('Resumo da agenda de hoje')} className="p-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 hover:border-violet-300 hover:text-violet-700 transition-colors text-left">
                                📅 Resumo da agenda
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
                                    ? 'bg-slate-200 text-slate-600'
                                    : 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-md'
                                }`}>
                                {msg.role === 'user' ? <User size={16} /> : <Sparkles size={16} />}
                            </div>

                            {/* Bubble */}
                            <div className={`
                                flex flex-col p-4 rounded-2xl shadow-sm text-sm leading-relaxed whitespace-pre-wrap
                                ${msg.role === 'user'
                                    ? 'bg-white text-slate-800 rounded-tr-none border border-slate-100'
                                    : 'bg-white text-slate-800 rounded-tl-none border border-violet-100 ring-1 ring-violet-50'
                                }
                            `}>
                                {msg.content}
                                <div className={`text-[10px] mt-2 opacity-50 flex items-center justify-end gap-1 ${msg.role === 'user' ? '' : 'text-violet-600'
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
                            <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-violet-100 shadow-sm flex items-center gap-2">
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
            <div className="p-4 bg-white border-t border-slate-200">
                <div className="max-w-4xl mx-auto flex gap-2 items-end">
                    <div className="flex-1 bg-slate-100 rounded-2xl border border-transparent focus-within:border-violet-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-violet-50 transition-all flex items-center gap-2 p-2 relative">
                        <textarea
                            ref={inputRef as any}
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder={isListening ? 'Ouvindo...' : 'Digite sua mensagem para o BOS...'}
                            disabled={isProcessing || isListening}
                            rows={1}
                            className="flex-1 bg-transparent border-none focus:ring-0 text-slate-800 placeholder:text-slate-400 resize-none max-h-32 py-2 px-2 text-sm"
                            style={{ minHeight: '44px' }}
                        />
                        {isSupported && (
                            <button
                                onClick={toggleVoiceInput}
                                disabled={isProcessing}
                                className={`p-2 rounded-xl transition-all ${isListening
                                    ? 'bg-rose-500 text-white animate-pulse shadow-md'
                                    : 'text-slate-400 hover:bg-slate-200 hover:text-slate-600'
                                    }`}
                            >
                                {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                            </button>
                        )}
                    </div>

                    <button
                        onClick={handleSend}
                        disabled={(!inputMessage.trim() && !isListening) || isProcessing}
                        className={`
                            p-3 rounded-xl flex items-center justify-center shadow-lg transition-all
                            ${!inputMessage.trim() && !isListening
                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                : 'bg-violet-600 text-white hover:bg-violet-700 hover:scale-105 active:scale-95'
                            }
                        `}
                    >
                        <Send size={24} />
                    </button>
                </div>
                <div className="text-center mt-2">
                    <p className="text-[10px] text-slate-400">
                        O BOS utiliza inteligência artificial e pode cometer erros. Verifique informações críticas.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ChatBOS;
