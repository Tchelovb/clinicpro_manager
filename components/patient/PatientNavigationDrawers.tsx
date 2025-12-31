import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '../ui/drawer';
import PatientForm from '../PatientForm';
import BudgetForm from '../BudgetForm';
import { PatientInstallments } from '../PatientInstallments';

interface NavigationLevel {
    type: 'menu' | 'section' | 'detail';
    sectionId?: string;
    itemId?: string;
    title: string;
}

interface PatientNavigationDrawersProps {
    navigationStack: NavigationLevel[];
    budgets: any[];
    clinicalTreatments: any[];
    orthoTreatments: any[];
    hofTreatments: any[];
    clinicalImages: any[];
    patient: any;
    onGoBack: () => void;
    onOpenDetail: (itemId: string, title: string) => void;
}

export const PatientNavigationDrawers: React.FC<PatientNavigationDrawersProps> = ({
    navigationStack,
    budgets,
    clinicalTreatments,
    orthoTreatments,
    hofTreatments,
    clinicalImages,
    patient,
    onGoBack,
    onOpenDetail
}) => {
    if (navigationStack.length === 0) return null;

    const currentLevel = navigationStack[navigationStack.length - 1];

    // Render section content based on sectionId
    const renderSectionContent = (sectionId: string) => {
        switch (sectionId) {
            case 'budgets':
                return (
                    <div className="space-y-3 pb-20">
                        {budgets.length === 0 ? (
                            <p className="text-center text-slate-500 py-8">Nenhuma proposta cadastrada</p>
                        ) : (
                            budgets.map(budget => (
                                <button
                                    key={budget.id}
                                    onClick={() => onOpenDetail(budget.id, `Orçamento #${budget.id.slice(0, 8)}`)}
                                    className="w-full p-4 bg-card rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 transition-all active:scale-[0.98] text-left"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-bold text-slate-900 dark:text-white">
                                            Proposta #{budget.id.slice(0, 8)}
                                        </span>
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${budget.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                                            budget.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                                                'bg-slate-100 text-slate-700'
                                            }`}>
                                            {budget.status === 'APPROVED' ? 'Aprovado' :
                                                budget.status === 'PENDING' ? 'Pendente' : 'Rejeitado'}
                                        </span>
                                    </div>
                                    <p className="text-xl font-black text-blue-600 dark:text-blue-400 mb-1">
                                        R$ {(budget.final_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {new Date(budget.created_at).toLocaleDateString('pt-BR')}
                                    </p>
                                </button>
                            ))
                        )}
                    </div>
                );

            case 'clinical':
            case 'ortho':
            case 'hof':
                const treatments = sectionId === 'clinical' ? clinicalTreatments :
                    sectionId === 'ortho' ? orthoTreatments : hofTreatments;
                return (
                    <div className="space-y-3 pb-20">
                        {treatments.length === 0 ? (
                            <p className="text-center text-slate-500 py-8">Nenhum tratamento cadastrado</p>
                        ) : (
                            treatments.map(treatment => (
                                <div
                                    key={treatment.id}
                                    className="p-4 bg-card rounded-xl border border-slate-200 dark:border-slate-800"
                                >
                                    <p className="font-bold text-slate-900 dark:text-white mb-1">{treatment.procedure_name}</p>
                                    <div className="flex justify-between items-center mt-2">
                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                            Status: <span className="font-medium">{treatment.status}</span>
                                        </p>
                                        <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                                            R$ {treatment.price?.toLocaleString('pt-BR')}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                );

            case 'gallery':
                return (
                    <div className="grid grid-cols-2 gap-3 pb-20">
                        {clinicalImages.length === 0 ? (
                            <p className="col-span-2 text-center text-slate-500 py-8">Nenhuma imagem cadastrada</p>
                        ) : (
                            clinicalImages.map(image => (
                                <div key={image.id} className="aspect-square bg-slate-200 dark:bg-slate-700 rounded-xl overflow-hidden">
                                    <img src={image.image_url} alt={image.image_type} className="w-full h-full object-cover" />
                                </div>
                            ))
                        )}
                    </div>
                );

            case 'registration':
                return (
                    <div className="pb-20">
                        <PatientForm
                            initialData={patient}
                            patientId={patient?.id}
                            readonly={true}
                        />
                    </div>
                );

            case 'financial':
                return (
                    <div className="space-y-4 pb-20">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl col-span-2">
                                <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">Total Aprovado</p>
                                <p className="text-2xl font-black text-blue-600 dark:text-blue-400">
                                    R$ {(patient?.total_approved || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl">
                                <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">Total Pago</p>
                                <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                                    R$ {(patient?.total_paid || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                            <div className="bg-rose-50 dark:bg-rose-900/20 p-4 rounded-xl">
                                <p className="text-xs text-rose-600 dark:text-rose-400 mb-1">Saldo Devedor</p>
                                <p className="text-xl font-black text-rose-600 dark:text-rose-400">
                                    R$ {(patient?.balance_due || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
                            <h3 className="font-bold mb-4 text-slate-900 dark:text-white px-1">Histórico Financeiro</h3>
                            <PatientInstallments patientId={patient?.id} />
                        </div>
                    </div>
                );

            default:
                return <p className="text-center text-slate-500 py-8">Conteúdo não disponível</p>;
        }
    };

    // Renderiza o CONTEÚDO DETALHADO (Nível 2)
    const renderDetailContent = () => {
        const itemId = currentLevel.itemId;
        if (!itemId) return <p>Item não identificado</p>;

        // 1. Tentar achar em Orçamentos
        const budget = budgets.find(b => b.id === itemId);
        if (budget) {
            return (
                <div className="pb-20">
                    <BudgetForm
                        isInline
                        patientId={patient?.id}
                        initialBudget={budget}
                        onCancel={onGoBack}
                        onSaveSuccess={() => {
                            onGoBack();
                        }}
                    />
                </div>
            );
        }

        // 2. Tentar achar em Tratamentos Clínicos
        const clinical = clinicalTreatments.find(t => t.id === itemId);
        if (clinical) return renderTreatmentDetail(clinical);

        // 3. Tentar achar em Ortho
        const ortho = orthoTreatments.find(t => t.id === itemId);
        if (ortho) return renderTreatmentDetail(ortho);

        return <p className="text-center text-slate-500 mt-10">Item não encontrado nos registros do paciente.</p>;
    };

    const renderTreatmentDetail = (treatment: any) => (
        <div className="p-4 space-y-4">
            <div className="bg-card p-6 rounded-xl border border-slate-200 dark:border-slate-800">
                <h3 className="text-xl font-bold mb-2">{treatment.procedure_name}</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs text-slate-500">Status</p>
                        <p className="font-semibold">{treatment.status}</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500">Valor</p>
                        <p className="font-semibold">R$ {treatment.price?.toLocaleString('pt-BR')}</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500">Dente/Região</p>
                        <p className="font-semibold">{treatment.tooth_region || '-'}</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500">Data</p>
                        <p className="font-semibold">{new Date(treatment.created_at).toLocaleDateString()}</p>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <Drawer open={navigationStack.length > 0} onOpenChange={() => onGoBack()}>
            <DrawerContent className="h-[95vh] rounded-t-[10px] flex flex-col bg-background outline-none">
                <DrawerHeader className="sr-only">
                    <DrawerTitle>{currentLevel.title}</DrawerTitle>
                    <DrawerDescription>Detalhes da seção {currentLevel.sectionId || currentLevel.type}</DrawerDescription>
                </DrawerHeader>
                {/* Header Actions */}
                <div className="flex items-center gap-3 p-4 border-b border-slate-200 dark:border-slate-800 shrink-0 bg-background z-10">
                    <button
                        onClick={onGoBack}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <ArrowLeft size={20} className="text-slate-600 dark:text-slate-400" />
                    </button>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white truncate pr-4">
                        {currentLevel.title}
                    </h2>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto bg-background">
                    {currentLevel.type === 'section' && currentLevel.sectionId && (
                        <div className="p-4">
                            {renderSectionContent(currentLevel.sectionId)}
                        </div>
                    )}
                    {currentLevel.type === 'detail' && (
                        renderDetailContent()
                    )}
                </div>
            </DrawerContent>
        </Drawer>
    );
};
