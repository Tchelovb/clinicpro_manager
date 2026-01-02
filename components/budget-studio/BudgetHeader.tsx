import React from 'react';
import { User, Calendar, FileText, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BudgetHeaderProps {
    patientName: string;
    patientPhoto?: string;
    doctorName?: string;
    priceTableName?: string;
    createdAt?: string;
    status?: string;
}

export const BudgetHeader: React.FC<BudgetHeaderProps> = ({
    patientName,
    patientPhoto,
    doctorName,
    priceTableName,
    createdAt,
    status = 'Rascunho'
}) => {
    const getStatusColor = (s: string) => {
        switch (s?.toUpperCase()) {
            case 'APPROVED': return 'bg-green-100 text-green-700 border-green-200';
            case 'PENDING': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'DRAFT': return 'bg-slate-100 text-slate-700 border-slate-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const formattedDate = createdAt
        ? format(new Date(createdAt), "dd 'de' MMMM, yyyy", { locale: ptBR })
        : format(new Date(), "dd 'de' MMMM, yyyy", { locale: ptBR });

    return (
        <div className="bg-white border-b border-slate-200 px-6 py-4 mb-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

                {/* Lado Esquerdo: Paciente e Contexto */}
                <div className="flex items-center gap-4">
                    <div className="relative">
                        {patientPhoto ? (
                            <img
                                src={patientPhoto}
                                alt={patientName}
                                className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                            />
                        ) : (
                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg border-2 border-white shadow-sm">
                                {patientName?.charAt(0) || '?'}
                            </div>
                        )}
                        <div className={`absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${getStatusColor(status)}`}>
                            {status === 'DRAFT' ? 'Rascunho' : status}
                        </div>
                    </div>

                    <div>
                        <h1 className="text-xl font-bold text-slate-800 leading-tight">
                            {patientName || 'Novo Paciente'}
                        </h1>
                        <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                            <span className="flex items-center gap-1">
                                <User size={14} />
                                Dr. {doctorName || 'Não atribuído'}
                            </span>
                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                            <span className="flex items-center gap-1">
                                <Calendar size={14} />
                                {formattedDate}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Lado Direito: Metadata */}
                <div className="flex items-center gap-3">
                    <div className="hidden md:flex flex-col items-end mr-4">
                        <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Tabela de Preço</span>
                        <div className="flex items-center gap-1 text-slate-700 font-medium">
                            <FileText size={14} className="text-blue-500" />
                            {priceTableName || 'Particular'}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
