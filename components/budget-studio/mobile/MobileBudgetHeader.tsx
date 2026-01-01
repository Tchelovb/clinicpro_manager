import React from 'react';
import { ChevronLeft, MoreVertical } from 'lucide-react';

interface MobileBudgetHeaderProps {
    patient: any;
    onBack: () => void;
}

export const MobileBudgetHeader: React.FC<MobileBudgetHeaderProps> = ({ patient, onBack }) => (
    <header className="flex items-center justify-between p-4 bg-white border-b border-slate-100 sticky top-0 z-50 shadow-sm">
        <button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:text-slate-600 transition-colors">
            <ChevronLeft size={24} />
        </button>

        <div className="flex flex-col items-center">
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Orçamento para</p>
            <div className="flex items-center gap-2 mt-0.5">
                <span className="font-bold text-slate-800 text-sm">{patient?.name || 'Paciente'}</span>
                {patient?.photo_url && (
                    <img src={patient.photo_url} alt={patient.name} className="w-6 h-6 rounded-full object-cover" />
                )}
            </div>
        </div>

        <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
            <MoreVertical size={20} />
        </button>
    </header>
);
