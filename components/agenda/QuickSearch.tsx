import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { Appointment } from '../../types';
import { useNavigate } from 'react-router-dom';

interface QuickSearchProps {
    appointments: Appointment[];
}

const QuickSearch: React.FC<QuickSearchProps> = ({ appointments }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Appointment[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (query.trim().length > 0) {
            const filtered = appointments.filter(apt =>
                apt.patientName.toLowerCase().includes(query.toLowerCase()) ||
                apt.doctorName.toLowerCase().includes(query.toLowerCase())
            ).slice(0, 5); // Limitar a 5 resultados
            setResults(filtered);
            setIsOpen(true);
        } else {
            setResults([]);
            setIsOpen(false);
        }
    }, [query, appointments]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelectAppointment = (aptId: string) => {
        navigate(`/agenda/${aptId}`);
        setQuery('');
        setIsOpen(false);
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    };

    return (
        <div className="relative w-64" ref={searchRef}>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar paciente..."
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                {query && (
                    <button
                        onClick={() => setQuery('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <X size={18} />
                    </button>
                )}
            </div>

            {isOpen && results.length > 0 && (
                <div className="absolute top-full mt-2 w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-80 overflow-y-auto">
                    {results.map((apt) => (
                        <div
                            key={apt.id}
                            onClick={() => handleSelectAppointment(apt.id)}
                            className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-0 transition-colors"
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <p className="font-semibold text-gray-900 dark:text-white">
                                        {apt.patientName}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        {apt.doctorName} • {apt.type}
                                    </p>
                                </div>
                                <div className="text-right ml-4">
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {formatDate(apt.date)}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {apt.time}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-2">
                                <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${apt.status === 'Confirmado' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                        apt.status === 'Pendente' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                            apt.status === 'Concluído' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                                                apt.status === 'Cancelado' ? 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' :
                                                    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                    }`}>
                                    {apt.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isOpen && results.length === 0 && query.trim().length > 0 && (
                <div className="absolute top-full mt-2 w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 px-4 py-6 text-center">
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                        Nenhum agendamento encontrado para "{query}"
                    </p>
                </div>
            )}
        </div>
    );
};

export default QuickSearch;
