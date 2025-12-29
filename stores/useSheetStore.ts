import { create } from 'zustand';

type TabType = 'overview' | 'registration' | 'budgets' | 'clinical' | 'ortho' | 'hof' | 'financial' | 'gallery';

interface PatientSheetState {
    isOpen: boolean;
    patientId: string | null;
    initialTab: TabType;
    openSheet: (id: string, tab?: TabType) => void;
    closeSheet: () => void;
}

export const useSheetStore = create<PatientSheetState>((set) => ({
    isOpen: false,
    patientId: null,
    initialTab: 'overview',

    openSheet: (id: string, tab: TabType = 'overview') =>
        set({ isOpen: true, patientId: id, initialTab: tab }),

    closeSheet: () =>
        set({ isOpen: false, patientId: null, initialTab: 'overview' }),
}));
