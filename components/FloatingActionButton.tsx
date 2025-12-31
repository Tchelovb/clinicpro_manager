import React from 'react';
import { Plus, FileText, Image, Activity } from 'lucide-react';

interface FloatingActionButtonProps {
    mode: 'list' | 'detail';
    onClick: () => void;
    onMenuAction?: (action: 'budget' | 'photo' | 'evolution') => void;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ mode, onClick, onMenuAction }) => {
    const [showMenu, setShowMenu] = React.useState(false);

    if (mode === 'list') {
        return (
            <button
                onClick={onClick}
                className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl z-50 flex items-center justify-center transition-all active:scale-95"
                aria-label="Novo Paciente"
            >
                <Plus size={24} />
            </button>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {showMenu && (
                <div className="absolute bottom-16 right-0 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-2 min-w-[200px]">
                    <button
                        onClick={() => {
                            onMenuAction?.('budget');
                            setShowMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors text-left"
                    >
                        <FileText size={20} className="text-blue-600" />
                        <span className="font-semibold text-slate-900 dark:text-white">Novo Orçamento</span>
                    </button>
                    <button
                        onClick={() => {
                            onMenuAction?.('photo');
                            setShowMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors text-left"
                    >
                        <Image size={20} className="text-purple-600" />
                        <span className="font-semibold text-slate-900 dark:text-white">Nova Foto</span>
                    </button>
                    <button
                        onClick={() => {
                            onMenuAction?.('evolution');
                            setShowMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors text-left"
                    >
                        <Activity size={20} className="text-green-600" />
                        <span className="font-semibold text-slate-900 dark:text-white">Nova Evolução</span>
                    </button>
                </div>
            )}
            <button
                onClick={() => setShowMenu(!showMenu)}
                className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all active:scale-95"
                aria-label="Ações Rápidas"
            >
                <Plus size={24} className={`transition-transform ${showMenu ? 'rotate-45' : ''}`} />
            </button>
        </div>
    );
};
