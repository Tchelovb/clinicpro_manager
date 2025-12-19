import { useState, useCallback } from 'react';
import { Appointment } from '../../types';

interface DragState {
    isDragging: boolean;
    draggedAppointment: Appointment | null;
    dragOverSlot: { date: string; time: string; professional: string } | null;
}

export const useDragAndDrop = (
    onReschedule: (aptId: string, newDate: string, newTime: string, newProfessional: string) => void
) => {
    const [dragState, setDragState] = useState<DragState>({
        isDragging: false,
        draggedAppointment: null,
        dragOverSlot: null,
    });

    const handleDragStart = useCallback((apt: Appointment) => {
        setDragState({
            isDragging: true,
            draggedAppointment: apt,
            dragOverSlot: null,
        });
    }, []);

    const handleDragOver = useCallback((date: string, time: string, professional: string) => {
        setDragState(prev => ({
            ...prev,
            dragOverSlot: { date, time, professional },
        }));
    }, []);

    const handleDragEnd = useCallback(() => {
        if (dragState.draggedAppointment && dragState.dragOverSlot) {
            const { date, time, professional } = dragState.dragOverSlot;

            // Verificar se houve mudança
            const hasChanged =
                dragState.draggedAppointment.date !== date ||
                dragState.draggedAppointment.time !== time ||
                dragState.draggedAppointment.doctorName !== professional;

            if (hasChanged) {
                onReschedule(dragState.draggedAppointment.id, date, time, professional);
            }
        }

        setDragState({
            isDragging: false,
            draggedAppointment: null,
            dragOverSlot: null,
        });
    }, [dragState, onReschedule]);

    const handleDragLeave = useCallback(() => {
        setDragState(prev => ({
            ...prev,
            dragOverSlot: null,
        }));
    }, []);

    const isDragOverSlot = useCallback((date: string, time: string, professional: string) => {
        return dragState.dragOverSlot?.date === date &&
            dragState.dragOverSlot?.time === time &&
            dragState.dragOverSlot?.professional === professional;
    }, [dragState.dragOverSlot]);

    return {
        isDragging: dragState.isDragging,
        draggedAppointment: dragState.draggedAppointment,
        handleDragStart,
        handleDragOver,
        handleDragEnd,
        handleDragLeave,
        isDragOverSlot,
    };
};
