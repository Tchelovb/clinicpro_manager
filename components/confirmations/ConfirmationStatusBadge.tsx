// =====================================================
// COMPONENTE: ConfirmationStatusBadge
// =====================================================

import React from 'react';
import { ConfirmationStatus } from '@/types/confirmations';

interface Props {
    status: ConfirmationStatus;
}

const STATUS_CONFIG: Record<ConfirmationStatus, { label: string; color: string; bg: string }> = {
    PENDING: {
        label: 'Pendente',
        color: 'text-yellow-700',
        bg: 'bg-yellow-100'
    },
    CONFIRMED: {
        label: 'Confirmado',
        color: 'text-green-700',
        bg: 'bg-green-100'
    },
    CANCELLED: {
        label: 'Cancelado',
        color: 'text-red-700',
        bg: 'bg-red-100'
    },
    RESCHEDULED: {
        label: 'Reagendado',
        color: 'text-blue-700',
        bg: 'bg-blue-100'
    },
    NO_RESPONSE: {
        label: 'Sem Resposta',
        color: 'text-gray-700',
        bg: 'bg-gray-100'
    }
};

export const ConfirmationStatusBadge: React.FC<Props> = ({ status }) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
            {config.label}
        </span>
    );
};
