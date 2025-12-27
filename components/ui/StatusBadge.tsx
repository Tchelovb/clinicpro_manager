import React from 'react';

type StatusType = 'PAID' | 'PENDING' | 'OVERDUE' | 'PARTIAL' | 'CANCELLED' | 'APPROVED' | 'REJECTED' | 'DRAFT';

interface StatusBadgeProps {
    status: StatusType | string;
    size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
    const configs: Record<string, { label: string; color: string }> = {
        PAID: { label: '✓ Pago', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
        PENDING: { label: '⏳ Pendente', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
        OVERDUE: { label: '⚠️ Atrasado', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300' },
        PARTIAL: { label: '💳 Parcial', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
        CANCELLED: { label: '✗ Cancelado', color: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400' },
        APPROVED: { label: '✓ Aprovado', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
        REJECTED: { label: '✗ Rejeitado', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300' },
        DRAFT: { label: '📝 Rascunho', color: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400' }
    };

    const { label, color } = configs[status.toUpperCase()] || configs.PENDING;

    const sizeClasses = {
        sm: 'px-2 py-0.5 text-[10px]',
        md: 'px-3 py-1 text-xs',
        lg: 'px-4 py-1.5 text-sm'
    };

    return (
        <span className={`inline-flex items-center justify-center rounded-full font-bold ${color} ${sizeClasses[size]}`}>
            {label}
        </span>
    );
};

export default StatusBadge;
