// =====================================================
// COMPONENTE: LabOrderStatusBadge
// =====================================================

import React from 'react';
import { LabOrderStatus } from '@/types/labOrders';

interface Props {
    status: LabOrderStatus;
}

const STATUS_CONFIG: Record<LabOrderStatus, { label: string; color: string; bg: string }> = {
    PREPARING: {
        label: 'Preparando',
        color: 'text-blue-700',
        bg: 'bg-blue-100'
    },
    SENT: {
        label: 'Enviado',
        color: 'text-purple-700',
        bg: 'bg-purple-100'
    },
    IN_PROGRESS: {
        label: 'Em Produção',
        color: 'text-yellow-700',
        bg: 'bg-yellow-100'
    },
    READY: {
        label: 'Pronto',
        color: 'text-green-700',
        bg: 'bg-green-100'
    },
    RECEIVED: {
        label: 'Recebido',
        color: 'text-teal-700',
        bg: 'bg-teal-100'
    },
    DELIVERED_TO_PATIENT: {
        label: 'Entregue',
        color: 'text-emerald-700',
        bg: 'bg-emerald-100'
    },
    RETURNED_FOR_CORRECTION: {
        label: 'Em Correção',
        color: 'text-orange-700',
        bg: 'bg-orange-100'
    },
    CANCELLED: {
        label: 'Cancelado',
        color: 'text-red-700',
        bg: 'bg-red-100'
    }
};

export const LabOrderStatusBadge: React.FC<Props> = ({ status }) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.PREPARING;

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
            {config.label}
        </span>
    );
};
