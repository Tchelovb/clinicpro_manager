import React from 'react';
import { Activity } from 'lucide-react';
import { ClinicHealth10x50 } from './dashboard/ClinicHealth10x50';

export const ClinicHealthCenter: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 md:pb-0">
            {/* Header */}
            <div className="bg-slate-900 text-white p-6 shadow-lg border-b border-slate-800">
                <div className="flex justify-between items-center max-w-7xl mx-auto">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                            <Activity size={32} className="text-blue-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-2 text-white">
                                ClinicHealth Intelligence Center
                            </h1>
                            <p className="text-sm text-slate-400">
                                Visão Omnipotente - Radar de Gestão 10x50
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-6 max-w-7xl mx-auto">
                <ClinicHealth10x50 />
            </div>
        </div>
    );
};

export default ClinicHealthCenter;
