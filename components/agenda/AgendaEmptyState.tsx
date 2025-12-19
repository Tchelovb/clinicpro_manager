import React from 'react';
import { Calendar, Plus } from 'lucide-react';

interface EmptyStateProps {
    view: 'day' | 'week' | 'month';
    onNewAppointment: () => void;
}

const AgendaEmptyState: React.FC<EmptyStateProps> = ({ view, onNewAppointment }) => {
    const messages = {
        day: {
            title: 'Nenhum agendamento para hoje',
            subtitle: 'Aproveite para revisar a lista de espera ou planejar o dia',
        },
        week: {
            title: 'Semana livre',
            subtitle: 'Que tal começar a agendar os primeiros pacientes?',
        },
        month: {
            title: 'Mês sem agendamentos',
            subtitle: 'Configure sua agenda e comece a receber pacientes',
        },
    };

    const message = messages[view];

    return (
        <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
            <div className="text-center p-8 max-w-md">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-6">
                    <Calendar className="text-blue-600 dark:text-blue-400" size={40} />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                    {message.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {message.subtitle}
                </p>
                <button
                    onClick={onNewAppointment}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all"
                >
                    <Plus size={20} />
                    Agendar Primeiro Paciente
                </button>
            </div>
        </div>
    );
};

export default AgendaEmptyState;
