// =====================================================
// COMPONENTE: RecallStatusBadge
// =====================================================

import React from 'react';
import { RecallStatus } from '../../types/recalls';

interface Props {
    status: RecallStatus;
}

export const RecallStatusBadge: React.FC<Props> = ({ status }) => {
    const getStyle = (status: RecallStatus) => {
        switch (status) {
            case 'PENDING':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'CONTACTED':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'SCHEDULED':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'COMPLETED':
                return 'bg-green-200 text-green-900 border-green-300';
            case 'OVERDUE':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'LOST':
                return 'bg-gray-100 text-gray-800 border-gray-200';
            default:
                return 'bg-gray-50 text-gray-500 border-gray-200';
        }
    };

    const getLabel = (status: RecallStatus) => {
        switch (status) {
            case 'PENDING':
                return 'Pendente';
            case 'CONTACTED':
                return 'Contatado';
            case 'SCHEDULED':
                return 'Agendado';
            case 'COMPLETED':
                return 'Concluído';
            case 'OVERDUE':
                return 'Atrasado';
            case 'LOST':
                return 'Perdido';
            default:
                return status;
        }
    };

    return (
        <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStyle(
                status
            )}`}
        >
            {getLabel(status)}
        </span>
    );
};
