import React from 'react';
import { MobileDrawer } from '../ui/MobileDrawer';
import { Check, UserCircle } from 'lucide-react';
import { cn } from '../../src/lib/utils';

interface Professional {
    id: string;
    name: string;
    specialty?: string;
    agenda_color?: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    professionals: Professional[];
    selectedId: string;
    onSelect: (id: string) => void;
}

export function ProfessionalsDrawer({ isOpen, onClose, professionals, selectedId, onSelect }: Props) {
    return (
        <MobileDrawer isOpen={isOpen} onClose={onClose} title="Selecionar Profissional">
            <div className="space-y-2">
                {/* Opção "Todos os Profissionais" */}
                <button
                    onClick={() => {
                        onSelect('ALL');
                        onClose();
                    }}
                    className={cn(
                        "w-full flex items-center justify-between p-6 rounded-3xl transition-all duration-300",
                        selectedId === 'ALL'
                            ? "bg-blue-500/10 border-2 border-blue-500/20"
                            : "bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10"
                    )}
                >
                    <div className="flex items-center gap-5">
                        <div className="h-14 w-14 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xl font-light shadow-sm">
                            <UserCircle className="h-8 w-8" />
                        </div>
                        <div className="text-left">
                            <p className="text-xl font-medium text-slate-900 dark:text-white tracking-tight">
                                Todos os Profissionais
                            </p>
                            <p className="text-sm text-slate-400 uppercase tracking-widest font-bold">
                                Visão Geral
                            </p>
                        </div>
                    </div>

                    {selectedId === 'ALL' && (
                        <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center animate-in zoom-in">
                            <Check className="h-5 w-5 text-white" />
                        </div>
                    )}
                </button>

                {/* Lista de Profissionais */}
                {professionals.map((pro) => (
                    <button
                        key={pro.id}
                        onClick={() => {
                            onSelect(pro.id);
                            onClose();
                        }}
                        className={cn(
                            "w-full flex items-center justify-between p-6 rounded-3xl transition-all duration-300",
                            selectedId === pro.id
                                ? "bg-blue-500/10 border-2 border-blue-500/20"
                                : "bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10"
                        )}
                    >
                        <div className="flex items-center gap-5">
                            <div
                                className="h-14 w-14 rounded-full flex items-center justify-center text-white text-xl font-light shadow-sm"
                                style={{ backgroundColor: pro.agenda_color || '#3B82F6' }}
                            >
                                {pro.name.charAt(0)}
                            </div>
                            <div className="text-left">
                                <p className="text-xl font-medium text-slate-900 dark:text-white tracking-tight">
                                    {pro.name}
                                </p>
                                <p className="text-sm text-slate-400 uppercase tracking-widest font-bold">
                                    {pro.specialty || 'Especialista'}
                                </p>
                            </div>
                        </div>

                        {selectedId === pro.id && (
                            <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center animate-in zoom-in">
                                <Check className="h-5 w-5 text-white" />
                            </div>
                        )}
                    </button>
                ))}
            </div>
        </MobileDrawer>
    );
}
