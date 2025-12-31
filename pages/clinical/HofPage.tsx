import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
    Sparkles, Camera, HISTORY, Clock, Calendar,
    ArrowLeft, AlertCircle, Syringe
} from 'lucide-react';
import { cn } from '../../lib/utils'; // Assuming utils exists
import toast from 'react-hot-toast';

import { BeforeAfterCarousel } from '../../components/clinical/hof/BeforeAfterCarousel';

const BotoxReturnControl = () => (
    <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Syringe size={120} />
        </div>
        <h3 className="text-sm font-bold uppercase tracking-wider mb-1 opacity-90">Controle de Toxina</h3>
        <div className="text-3xl font-black mb-1">Dia 15</div>
        <p className="text-sm opacity-90 mb-6">Pós-Aplicação</p>

        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-xs mb-4">
            <div className="flex justify-between mb-1">
                <span>Retorno Ideal</span>
                <span className="font-bold">Em 5 dias</span>
            </div>
            <div className="w-full bg-white/30 h-1.5 rounded-full overflow-hidden">
                <div className="bg-white w-[75%] h-full"></div>
            </div>
        </div>

        <button className="w-full bg-white text-purple-600 font-bold py-2.5 rounded-xl shadow-lg hover:bg-purple-50 transition-colors text-sm">
            Agendar Retorno
        </button>
    </div>
);

export const HofPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
            {/* Header */}
            <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(`/patients/${id}`)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500">
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="font-bold text-pink-600 dark:text-pink-400 text-lg leading-tight flex items-center gap-2">
                                <Sparkles size={20} /> HOF & Estética <span className="text-slate-300">|</span> <span className="text-slate-600 dark:text-slate-300 font-normal">Face Map</span>
                            </h1>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Visual Bio - Face Map Placeholder */}
                <section className="md:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 min-h-[500px] flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1596541223130-5d31a73fb6c6?q=80&w=2671&auto=format&fit=crop')] bg-cover bg-center opacity-10 grayscale"></div>
                        <div className="relative z-10 text-center space-y-4">
                            <div className="w-24 h-24 bg-pink-50 dark:bg-pink-900/20 rounded-full flex items-center justify-center mx-auto text-pink-500 mb-4 animate-pulse">
                                <Sparkles size={40} />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Mapa Facial Interativo</h2>
                            <p className="text-slate-500 max-w-md mx-auto">
                                Clique nas regiões da face para adicionar procedimentos de toxina botulínica, preenchedores ou fios.
                            </p>
                            <button className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-full font-bold shadow-lg shadow-pink-200 dark:shadow-none transition-all hover:scale-105">
                                Iniciar Mapeamento
                            </button>
                        </div>
                    </div>

                    <BeforeAfterCarousel />
                </section>

                {/* Sidebar - Controls */}
                <aside className="space-y-6">
                    <BotoxReturnControl />

                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h3 className="font-bold text-slate-700 dark:text-white mb-4 flex items-center gap-2">
                            <Calendar size={16} className="text-pink-500" /> Histórico Estético
                        </h3>
                        <div className="space-y-4">
                            {/* Mock History */}
                            <div className="flex gap-4 items-start">
                                <div className="w-2 h-2 rounded-full bg-pink-500 mt-2 shrink-0" />
                                <div>
                                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">Botox Testa e Glabela</h4>
                                    <p className="text-xs text-slate-500">14/10/2024 - Dr. Marcelo</p>
                                </div>
                            </div>
                            <div className="flex gap-4 items-start">
                                <div className="w-2 h-2 rounded-full bg-slate-300 mt-2 shrink-0" />
                                <div>
                                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">Preenchimento Labial (1ml)</h4>
                                    <p className="text-xs text-slate-500">10/06/2024 - Dr. Marcelo</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>
            </main>
        </div>
    );
};
