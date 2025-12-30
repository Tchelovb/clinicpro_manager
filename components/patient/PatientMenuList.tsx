import React from 'react';
import {
    User, FileText, Stethoscope, Smile, Sparkles,
    Image as ImageIcon, CreditCard, ArrowLeft
} from 'lucide-react';

interface MenuListProps {
    budgetsCount: number;
    clinicalCount: number;
    orthoCount: number;
    hofCount: number;
    imagesCount: number;
    onSelectSection: (sectionId: string) => void;
}

export const PatientMenuList: React.FC<MenuListProps> = ({
    budgetsCount,
    clinicalCount,
    orthoCount,
    hofCount,
    imagesCount,
    onSelectSection
}) => {
    const menuItems = [
        { id: 'registration', label: 'Dados Cadastrais', icon: User, count: 0 },
        { id: 'budgets', label: 'Propostas', icon: FileText, count: budgetsCount },
        { id: 'clinical', label: 'Histórico Clínico', icon: Stethoscope, count: clinicalCount },
        { id: 'ortho', label: 'Ortodontia', icon: Smile, count: orthoCount },
        { id: 'hof', label: 'HOF', icon: Sparkles, count: hofCount },
        { id: 'gallery', label: 'Arquivos', icon: ImageIcon, count: imagesCount },
        { id: 'financial', label: 'Financeiro', icon: CreditCard, count: 0 },
    ];

    return (
        <div className="p-4 space-y-2">
            {menuItems.map(item => {
                const Icon = item.icon;
                return (
                    <button
                        key={item.id}
                        onClick={() => onSelectSection(item.id)}
                        className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all active:scale-[0.98] shadow-sm"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center shrink-0">
                                <Icon className="text-blue-600 dark:text-blue-400" size={20} />
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-slate-900 dark:text-white">{item.label}</p>
                                {item.count > 0 && (
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {item.count} {item.count === 1 ? 'item' : 'itens'}
                                    </p>
                                )}
                            </div>
                        </div>
                        <ArrowLeft className="text-slate-400 rotate-180" size={20} />
                    </button>
                );
            })}
        </div>
    );
};
