import React from 'react';
import { BOSChat } from '../components/BOSChat';
import { Brain, Sparkles } from 'lucide-react';

const ChatBOSPage: React.FC = () => {
    return (
        <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 shadow-lg">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                        <Brain size={32} className="animate-pulse" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            ChatBOS
                            <Sparkles size={20} className="text-yellow-300" />
                        </h1>
                        <p className="text-sm text-purple-100">
                            Assistente de Inteligência Artificial para Gestão de Clínicas
                        </p>
                    </div>
                </div>
            </div>

            {/* Chat Embedded */}
            <div className="flex-1 overflow-hidden">
                <BOSChat mode="embedded" />
            </div>
        </div>
    );
};

export default ChatBOSPage;
