import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Mic, MicOff, Sparkles, Trash2, Volume2, VolumeX } from 'lucide-react';
import { useBOSChat } from '../hooks/useBOSChat';
import { useBOSVoice } from '../hooks/useBOSVoice';
import { useAuth } from '../contexts/AuthContext';

interface BOSChatProps {
    isOpen?: boolean;
    onClose?: () => void;
    mode?: 'modal' | 'embedded';
    initialContext?: { type: 'alert' | 'insight', priority: string, items: any[] };
}

export const BOSChat: React.FC<BOSChatProps> = ({ isOpen = true, onClose, mode = 'modal', initialContext }) => {
    const [inputMessage, setInputMessage] = useState('');
    const [isSpeaking, setIsSpeaking] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const { messages, isProcessing, sendMessage, clearChat, initializeWithBriefing } = useBOSChat();
    const { isListening, transcript, isSupported, startListening, stopListening, speak, stopSpeaking } = useBOSVoice();
    const { profile, updateProfileSettings } = useAuth();

    // Initialize with briefing when opening from BOS Intelligence
    useEffect(() => {
        if (isOpen && mode === 'embedded' && messages.length === 0 && initializeWithBriefing) {
            initializeWithBriefing(initialContext);
        }
    }, [isOpen, mode, initialContext]);

    const handleClose = () => {
        if (onClose) onClose();
        // If it's the floating chat closing itself, we disable the FAB (Master Switch)
        // Only if mode is modal (floating)
        if (mode === 'modal') {
            updateProfileSettings({ is_bos_fab_enabled: false });
        }
    };

    // Auto-scroll para última mensagem
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Atualizar input com transcrição de voz
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

        // Se houver resposta e voz estiver ativa, falar
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
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };

    const toggleVoiceOutput = () => {
        if (isSpeaking) {
            stopSpeaking();
        }
        setIsSpeaking(!isSpeaking);
    };

    if (!isOpen && mode === 'modal') return null;

    if (mode === 'embedded') {
        return (
            <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
                {/* Embedded Header (Optional/Simplified) */}
                <div className="p-4 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                            <Sparkles size={16} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800 dark:text-white text-sm">BOS Assistant</h3>
                            <p className="text-xs text-gray-500">Inteligência Ativa</p>
                        </div>
                    </div>
                    {isSupported && (
                        <button
                            onClick={toggleVoiceOutput}
                            className={`p-2 rounded-lg transition-colors ${isSpeaking
                                ? 'bg-purple-100 text-purple-600'
                                : 'text-gray-400 hover:bg-gray-100'
                                }`}
                            title={isSpeaking ? 'Desativar voz' : 'Ativar voz'}
                        >
                            {isSpeaking ? <Volume2 size={16} /> : <VolumeX size={16} />}
                        </button>
                    )}
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white dark:bg-slate-950">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-center p-6 opacity-50">
                            <Sparkles size={48} className="text-purple-300 mb-4" />
                            <p className="text-sm text-gray-500">Como posso ajudar sua clínica hoje?</p>
                        </div>
                    )}
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === 'user'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-white'
                                    }`}
                            >
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                            </div>
                        </div>
                    ))}
                    {isProcessing && (
                        <div className="flex justify-start">
                            <div className="bg-gray-100 dark:bg-slate-800 rounded-2xl px-4 py-3">
                                <span className="text-xs text-gray-500 animate-pulse">BOS digitando...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900">
                    <div className="flex items-center gap-2">
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Digite sua mensagem..."
                            className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                        <button
                            onClick={handleSend}
                            disabled={!inputMessage.trim() || isProcessing}
                            className="p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-4 md:p-6 pointer-events-none">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md h-[600px] flex flex-col pointer-events-auto border border-gray-200 dark:border-slate-700 animate-in slide-in-from-bottom duration-300">

                {/* Header */}
                <div className="p-4 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-purple-600 to-blue-600 rounded-t-2xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                <Sparkles size={20} className="text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white">BOS Assistant</h3>
                                <p className="text-xs text-white/80">Arquiteto de Crescimento</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {isSupported && (
                                <button
                                    onClick={toggleVoiceOutput}
                                    className={`p-2 rounded-lg transition-colors ${isSpeaking
                                        ? 'bg-white/20 text-white'
                                        : 'bg-white/10 text-white/60 hover:bg-white/20'
                                        }`}
                                    title={isSpeaking ? 'Desativar voz' : 'Ativar voz'}
                                >
                                    {isSpeaking ? <Volume2 size={18} /> : <VolumeX size={18} />}
                                </button>
                            )}
                            <button
                                onClick={handleClose}
                                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-slate-950">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-center p-6">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center mb-4">
                                <Sparkles size={32} className="text-white" />
                            </div>
                            <h4 className="font-bold text-gray-800 dark:text-white mb-2">
                                Olá, Dr. {profile?.full_name?.split(' ')[0] || 'Doutor'}!
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xs">
                                Sou o BOS. Estou aqui para ajudar você a identificar oportunidades e tomar decisões estratégicas baseadas nos dados da sua clínica.
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-4">
                                Pergunte sobre vendas, leads, orçamentos ou peça insights!
                            </p>
                        </div>
                    )}

                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === 'user'
                                    ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white'
                                    : 'bg-white dark:bg-slate-800 text-gray-800 dark:text-white border border-gray-200 dark:border-slate-700'
                                    }`}
                            >
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                <p className={`text-xs mt-2 ${msg.role === 'user' ? 'text-white/60' : 'text-gray-400'
                                    }`}>
                                    {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    ))}

                    {isProcessing && (
                        <div className="flex justify-start">
                            <div className="bg-white dark:bg-slate-800 rounded-2xl px-4 py-3 border border-gray-200 dark:border-slate-700">
                                <div className="flex items-center gap-2">
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                        <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                        <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                    </div>
                                    <span className="text-xs text-gray-500">BOS pensando...</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                    {messages.length > 0 && (
                        <button
                            onClick={clearChat}
                            className="text-xs text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 mb-2 flex items-center gap-1 transition-colors"
                        >
                            <Trash2 size={12} />
                            Limpar conversa
                        </button>
                    )}

                    <div className="flex items-center gap-2">
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder={isListening ? 'Ouvindo...' : 'Digite sua pergunta...'}
                            disabled={isProcessing || isListening}
                            className="flex-1 px-4 py-3 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm disabled:opacity-50"
                        />

                        {isSupported && (
                            <button
                                onClick={toggleVoiceInput}
                                disabled={isProcessing}
                                className={`p-3 rounded-xl transition-all disabled:opacity-50 ${isListening
                                    ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                                    : 'bg-gray-200 dark:bg-slate-800 hover:bg-gray-300 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300'
                                    }`}
                                title={isListening ? 'Parar gravação' : 'Iniciar gravação'}
                            >
                                {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                            </button>
                        )}

                        <button
                            onClick={handleSend}
                            disabled={!inputMessage.trim() || isProcessing}
                            className="p-3 bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
