import React from 'react';
import { useGlobalSheets } from '../../stores/useGlobalSheets';
import { TasksDrawer } from './index'; // From Vault
import { ProfessionalsDrawer } from './index'; // From Vault
// Import AppointmentSheet from original location (not in vault yet)
import { AppointmentSheet } from '../agenda/AppointmentSheet';
// Import Search (using existing MobileDrawer pattern or Dialog)
import { MobileDrawer } from './index';
import SearchContent from '../ui/SearchContent'; // Assuming default export

// ✅ INTEGRATION VAULT
import { useProfessionals } from '../../hooks/useProfessionals';

export const SheetProvider = () => {
    const { activeSheet, closeSheet, sheetProps } = useGlobalSheets();
    const { professionals } = useProfessionals(); // Fetch global

    // Handlers
    const handleClose = () => closeSheet();

    return (
        <>
            {/* 1. Tasks Drawer */}
            <TasksDrawer
                isOpen={activeSheet === 'tasks'}
                onClose={handleClose}
            />

            {/* 2. Professionals Selection */}
            {activeSheet === 'professionals' && (
                <ProfessionalsDrawer
                    isOpen={true} // Controlled by parent condition
                    onClose={handleClose}
                    professionals={professionals || []}
                    onSelect={(prop) => {
                        // Se houver callback nos props, chama
                        if (sheetProps.onSelect) sheetProps.onSelect(prop);
                        // Se não, talvez atualizar contexto global (mas ProfessionalsDrawer é selection)
                        handleClose();
                    }}
                    selectedId={sheetProps.selectedId || 'ALL'}
                />
            )}

            {/* 3. New Appointment Flow */}
            {activeSheet === 'new-appointment' && (
                <AppointmentSheet
                    isOpen={true}
                    onClose={handleClose}
                    selectedSlot={sheetProps.selectedSlot || { date: new Date(), time: '09:00' }}
                    appointmentId={sheetProps.appointmentId} // Para edição
                    onSuccess={() => {
                        handleClose();
                        // Invalidate queries already handled by AppointmentSheet internal logic
                    }}
                />
            )}

            {/* 4. Global Search (Mobile Wrapper) */}
            <MobileDrawer
                isOpen={activeSheet === 'search'}
                onClose={handleClose}
                title="Busca Global"
                className="h-[85vh]" // Mais alto para busca
            >
                <div className="pt-2">
                    <SearchContent />
                </div>
            </MobileDrawer>
        </>
    );
};
