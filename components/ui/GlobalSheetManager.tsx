import React from 'react';
import { useGlobalSheets } from '../../stores/useGlobalSheets';
import { GlobalSearch } from './GlobalSearch';
import { AppointmentSheet } from '../agenda/AppointmentSheet';
import { TasksSheet } from '../tasks/TasksSheet';
import { BottomSheet } from './BottomSheet';

/**
 * GlobalSheetManager - Gerenciador Central de Modais/Sheets
 * 
 * Este componente observa o estado global (useGlobalSheets) e
 * renderiza o Sheet apropriado quando solicitado.
 * Deve ser colocado no topo da árvore de componentes (AppLayout).
 */
export const GlobalSheetManager: React.FC = () => {
    const { activeSheet, closeSheet, sheetProps } = useGlobalSheets();

    if (!activeSheet) return null;

    // Renderiza o componente baseado no tipo ativo
    const renderContent = () => {
        switch (activeSheet) {
            case 'search':
                return <GlobalSearch isOpen={true} onClose={closeSheet} />;

            case 'new-appointment':
                return (
                    <AppointmentSheet
                        isOpen={true}
                        onClose={closeSheet}
                        selectedDate={sheetProps?.date}
                        selectedTime={sheetProps?.time}
                        selectedProfessional={sheetProps?.professionalId}
                    />
                );

            case 'tasks':
                // Se TasksSheet esperar props diferentes, ajustar aqui
                return <TasksSheet isOpen={true} onClose={closeSheet} />;

            case 'professionals':
                // Placeholder para seleção de profissionais
                return (
                    <BottomSheet
                        isOpen={true}
                        onClose={closeSheet}
                        title="Selecionar Profissional"
                    >
                        <div className="p-4 text-center text-slate-500">
                            Seletor de Profissionais em construção
                        </div>
                    </BottomSheet>
                );

            default:
                return null;
        }
    };

    return (
        <>
            {renderContent()}
        </>
    );
};
