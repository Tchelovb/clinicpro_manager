import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { ClinicHealth10x50 } from '../../components/dashboard/ClinicHealth10x50';

const ClinicHealth: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            {/* Simple Header */}
            <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
                <div className="max-w-[1600px] mx-auto flex items-center gap-4">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        title="Voltar para Dashboard"
                    >
                        <ChevronLeft size={24} className="text-slate-600 dark:text-slate-400" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                            ClinicHealth - Gestão Estratégica
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Painel de Controle Estratégico
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content - Just the 10x50 Component */}
            <div className="max-w-[1600px] mx-auto p-6">
                <ClinicHealth10x50 />
            </div>
        </div>
    );
};

export default ClinicHealth;
