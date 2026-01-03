import { create } from 'zustand';

export type SheetType =
    | 'new-appointment'   // Agenda Flow
    | 'tasks'             // Tasks Drawer
    | 'professionals'     // Professionals Selection
    | 'search'            // Global Search
    | 'patient-details'   // (Legacy compatibility)
    | null;

interface GlobalSheetState {
    activeSheet: SheetType;
    sheetProps: any;

    // Actions
    openSheet: (type: SheetType, props?: any) => void;
    closeSheet: () => void;
    toggleSheet: (type: SheetType) => void;
}

export const useGlobalSheets = create<GlobalSheetState>((set, get) => ({
    activeSheet: null,
    sheetProps: {},

    openSheet: (type, props = {}) => set({ activeSheet: type, sheetProps: props }),

    closeSheet: () => set({ activeSheet: null, sheetProps: {} }),

    toggleSheet: (type) => {
        const current = get().activeSheet;
        if (current === type) {
            set({ activeSheet: null });
        } else {
            set({ activeSheet: type });
        }
    }
}));
