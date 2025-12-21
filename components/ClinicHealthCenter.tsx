import React from 'react';
import { Activity, TrendingUp, Users, DollarSign, Calendar, Target } from 'lucide-react';

export const ClinicHealthCenter: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 md:pb-0">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-900 to-cyan-900 text-white p-6 shadow-lg">
                <div className="flex justify-between items-center max-w-7xl mx-auto">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                            <Activity size={32} className="animate-pulse" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                ClinicHealth Intelligence Center
                            </h1>
                            <p className="text-sm text-blue-100">
                                Visão Macro - Saúde do Negócio em Tempo Real
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-6 max-w-7xl mx-auto">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4 rounded-lg mb-6">
                    <div className="flex items-center gap-2">
                        <Target size={20} className="text-yellow-600 dark:text-yellow-400" />
                        <p className="text-yellow-800 dark:text-yellow-200 font-semibold">
                            🚧 Em Desenvolvimento: War Room & Monitoramento dos 5 Pilares
                        </p>
                    </div>
                    <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-2">
                        Esta seção integrará a <strong>War Room</strong> (Gestão de Metas e Simulação)
                        e o monitoramento contínuo dos <strong>5 Pilares</strong>: Marketing, Vendas, Clínico, Operacional e Financeiro.
                    </p>
                </div>

                {/* Placeholder Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border-l-4 border-blue-500">
                        <div className="flex items-center gap-3 mb-4">
                            <Users size={24} className="text-blue-500" />
                            <h3 className="font-bold text-gray-800 dark:text-white">Marketing</h3>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                            Leads, Canais, ROI e Performance de Campanhas
                        </p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border-l-4 border-green-500">
                        <div className="flex items-center gap-3 mb-4">
                            <TrendingUp size={24} className="text-green-500" />
                            <h3 className="font-bold text-gray-800 dark:text-white">Vendas</h3>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                            Pipeline, Conversão e Upsell de Vendas
                        </p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border-l-4 border-purple-500">
                        <div className="flex items-center gap-3 mb-4">
                            <Activity size={24} className="text-purple-500" />
                            <h3 className="font-bold text-gray-800 dark:text-white">Clínico</h3>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                            Produção, Qualidade e Satisfação do Paciente
                        </p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border-l-4 border-orange-500">
                        <div className="flex items-center gap-3 mb-4">
                            <Calendar size={24} className="text-orange-500" />
                            <h3 className="font-bold text-gray-800 dark:text-white">Operacional</h3>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                            Agenda, Recursos e Eficiência Operacional
                        </p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border-l-4 border-red-500">
                        <div className="flex items-center gap-3 mb-4">
                            <DollarSign size={24} className="text-red-500" />
                            <h3 className="font-bold text-gray-800 dark:text-white">Financeiro</h3>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                            Receita, Despesas, Margem e Fluxo de Caixa
                        </p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border-l-4 border-yellow-500">
                        <div className="flex items-center gap-3 mb-4">
                            <Target size={24} className="text-yellow-500" />
                            <h3 className="font-bold text-gray-800 dark:text-white">War Room</h3>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                            Gestão de Metas e Simulação Estratégica
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClinicHealthCenter;
