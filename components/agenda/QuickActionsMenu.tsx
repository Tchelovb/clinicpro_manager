import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, CheckCircle, MessageCircle, Edit2, X, Clock } from 'lucide-react';
import { Appointment } from '../../types';

interface QuickActionsMenuProps {
    appointment: Appointment;
    onConfirm: (id: string) => void;
    onSendReminder: (id: string) => void;
    onEdit: (id: string) => void;
    onCancel: (id: string) => void;
    onComplete: (id: string) => void;
}

const QuickActionsMenu: React.FC<QuickActionsMenuProps> = ({
    appointment,
    onConfirm,
    onSendReminder,
    onEdit,
    onCancel,
    onComplete,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleAction = (action: () => void) => {
        action();
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors opacity-0 group-hover:opacity-100"
                title="Ações rápidas"
            >
                <MoreVertical size={14} />
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 py-1">
                    {appointment.status !== 'Confirmado' && appointment.status !== 'Concluído' && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleAction(() => onConfirm(appointment.id));
                            }}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-300"
                        >
                            <CheckCircle size={16} className="text-green-600" />
                            Confirmar
                        </button>
                    )}

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleAction(() => onSendReminder(appointment.id));
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-300"
                    >
                        <MessageCircle size={16} className="text-blue-600" />
                        Enviar Lembrete
                    </button>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleAction(() => onEdit(appointment.id));
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-300"
                    >
                        <Edit2 size={16} className="text-gray-600" />
                        Editar
                    </button>

                    {appointment.status !== 'Concluído' && appointment.status !== 'Cancelado' && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleAction(() => onComplete(appointment.id));
                            }}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-300"
                        >
                            <Clock size={16} className="text-green-600" />
                            Marcar como Concluído
                        </button>
                    )}

                    {appointment.status !== 'Cancelado' && (
                        <>
                            <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleAction(() => onCancel(appointment.id));
                                }}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 text-red-600 dark:text-red-400"
                            >
                                <X size={16} />
                                Cancelar Agendamento
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default QuickActionsMenu;
