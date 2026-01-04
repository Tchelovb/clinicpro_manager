import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
    id: string;
    type: ToastType;
    message: string;
    duration?: number;
}

interface NotificationCenterProps {
    toasts: Toast[];
    onRemove: (id: string) => void;
    position?: 'top' | 'bottom';
}

/**
 * NotificationCenter - Sistema de Toasts App-Ready
 * 
 * Sistema de notificações rápidas (toasts) com:
 * - 4 tipos: success, error, info, warning
 * - Animações suaves de entrada/saída
 * - Auto-dismiss configurável
 * - Posição top ou bottom
 * - Safe area automática
 * - Touch-friendly dismiss
 * 
 * @example
 * // Uso com hook personalizado
 * const { toasts, addToast, removeToast } = useToast();
 * 
 * addToast({
 *   type: 'success',
 *   message: 'Paciente salvo com sucesso!',
 *   duration: 3000
 * });
 * 
 * <NotificationCenter 
 *   toasts={toasts}
 *   onRemove={removeToast}
 *   position="top"
 * />
 */
export const NotificationCenter: React.FC<NotificationCenterProps> = ({
    toasts,
    onRemove,
    position = 'top',
}) => {
    return (
        <div
            className={`
                fixed left-0 right-0 z-[100]
                flex flex-col items-center gap-2
                px-4
                pointer-events-none
                ${position === 'top' ? 'top-4 pt-[env(safe-area-inset-top)]' : 'bottom-4 pb-[env(safe-area-inset-bottom)]'}
            `}
        >
            {toasts.map((toast) => (
                <ToastItem
                    key={toast.id}
                    toast={toast}
                    onRemove={onRemove}
                    position={position}
                />
            ))}
        </div>
    );
};

const ToastItem: React.FC<{
    toast: Toast;
    onRemove: (id: string) => void;
    position: 'top' | 'bottom';
}> = ({ toast, onRemove, position }) => {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        if (toast.duration) {
            const timer = setTimeout(() => {
                handleDismiss();
            }, toast.duration);
            return () => clearTimeout(timer);
        }
    }, [toast.duration]);

    const handleDismiss = () => {
        setIsExiting(true);
        setTimeout(() => {
            onRemove(toast.id);
        }, 300);
    };

    const config = {
        success: {
            icon: CheckCircle,
            bg: 'bg-green-50 dark:bg-green-900/20',
            border: 'border-green-200 dark:border-green-800',
            text: 'text-green-800 dark:text-green-200',
            iconColor: 'text-green-600 dark:text-green-400',
        },
        error: {
            icon: AlertCircle,
            bg: 'bg-red-50 dark:bg-red-900/20',
            border: 'border-red-200 dark:border-red-800',
            text: 'text-red-800 dark:text-red-200',
            iconColor: 'text-red-600 dark:text-red-400',
        },
        warning: {
            icon: AlertTriangle,
            bg: 'bg-amber-50 dark:bg-amber-900/20',
            border: 'border-amber-200 dark:border-amber-800',
            text: 'text-amber-800 dark:text-amber-200',
            iconColor: 'text-amber-600 dark:text-amber-400',
        },
        info: {
            icon: Info,
            bg: 'bg-blue-50 dark:bg-blue-900/20',
            border: 'border-blue-200 dark:border-blue-800',
            text: 'text-blue-800 dark:text-blue-200',
            iconColor: 'text-blue-600 dark:text-blue-400',
        },
    };

    const { icon: Icon, bg, border, text, iconColor } = config[toast.type];

    return (
        <div
            className={`
                ${bg} ${border} ${text}
                backdrop-blur-xl
                border-2 rounded-2xl
                shadow-lg
                p-4 pr-12
                min-w-[280px] max-w-md
                pointer-events-auto
                transition-all duration-300 ease-out
                ${isExiting
                    ? position === 'top'
                        ? '-translate-y-full opacity-0'
                        : 'translate-y-full opacity-0'
                    : 'translate-y-0 opacity-100'
                }
            `}
            role="alert"
            aria-live="polite"
        >
            <div className="flex items-start gap-3">
                <Icon size={20} className={`${iconColor} flex-shrink-0 mt-0.5`} />
                <p className="text-sm font-medium flex-1">{toast.message}</p>
                <button
                    onClick={handleDismiss}
                    className="
                        absolute top-2 right-2
                        p-1 rounded-lg
                        hover:bg-black/5 dark:hover:bg-white/5
                        transition-colors
                        min-w-[32px] min-h-[32px]
                        flex items-center justify-center
                    "
                    aria-label="Fechar notificação"
                >
                    <X size={16} className="opacity-50" />
                </button>
            </div>
        </div>
    );
};

/**
 * Hook useToast - Gerenciador de Toasts
 * 
 * @example
 * const { toasts, addToast, removeToast } = useToast();
 * 
 * addToast({
 *   type: 'success',
 *   message: 'Operação concluída!',
 *   duration: 3000
 * });
 */
export const useToast = () => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = (toast: Omit<Toast, 'id'>) => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts((prev) => [...prev, { ...toast, id, duration: toast.duration || 3000 }]);
    };

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return { toasts, addToast, removeToast };
};
