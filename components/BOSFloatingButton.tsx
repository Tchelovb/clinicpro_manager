import React, { useState, useEffect } from 'react';
import { MessageCircle, Sparkles, AlertCircle } from 'lucide-react';
import { BOSChat } from './BOSChat';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'react-router-dom';

export const BOSFloatingButton: React.FC = () => {
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [alertCount, setAlertCount] = useState(0);
    const { profile } = useAuth();
    const location = useLocation();

    // BOS Brain Feed
    useEffect(() => {
        // Se for MASTER, não busca insights locais
        if (profile?.role === 'MASTER') {
            setAlertCount(0);
            return;
        }

        const fetchAlerts = async () => {
            const { count } = await supabase
                .from('ai_insights')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'open')
                .in('priority', ['high', 'critico']);

            if (count) setAlertCount(count);
        };
        fetchAlerts();

        // 🚨 TEMPORARIAMENTE DESABILITADO - CAUSAVA PERDA DE FOCO NOS INPUTS
        // const interval = setInterval(fetchAlerts, 60000);
        // return () => clearInterval(interval);
    }, [profile]);

    // Listen for sidebar ChatBOS button click
    useEffect(() => {
        const handleOpenChatBOS = () => {
            setIsChatOpen(true);
        };

        window.addEventListener('openChatBOS', handleOpenChatBOS);
        return () => window.removeEventListener('openChatBOS', handleOpenChatBOS);
    }, []);

    // Hide if disabled or in Intelligence page
    // Default is TRUE (enabled) if not explicitly set to false
    if (profile?.is_bos_fab_enabled === false || location.pathname.includes('/dashboard/relatorios')) {
        return null;
    }

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={() => setIsChatOpen(true)}
                className={`fixed bottom-6 right-6 z-40 w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 group ${alertCount > 0 ? 'bg-red-600 hover:bg-red-700 animate-pulse' : 'bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'
                    }`}
                aria-label="Abrir BOS Assistant"
            >
                {/* Alert Badge */}
                {alertCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-white text-red-600 text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-red-600 z-50">
                        {alertCount}
                    </span>
                )}

                {/* Pulse Animation (Default) */}
                {alertCount === 0 && <span className="absolute inset-0 rounded-full bg-purple-400 opacity-75 animate-ping"></span>}

                {/* Icon Container */}
                <div className="relative flex items-center justify-center text-white">
                    {alertCount > 0 ? (
                        <AlertCircle size={28} className="animate-bounce" />
                    ) : (
                        <>
                            <MessageCircle size={28} className="group-hover:hidden" />
                            <Sparkles size={28} className="hidden group-hover:block animate-pulse" />
                        </>
                    )}
                </div>

                {/* Tooltip */}
                <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    {alertCount > 0 ? `${alertCount} Alertas Críticos (BOS)` : 'Falar com o BOS'}
                    <div className="absolute top-full right-4 w-2 h-2 bg-gray-900 transform rotate-45 -mt-1"></div>
                </div>
            </button>

            {/* Chat Modal */}
            <BOSChat
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
            />
        </>
    );
};
